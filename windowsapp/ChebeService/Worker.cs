using System.Text.Json;
using ChebeService.Enforcement;
using ChebeService.Ipc;

namespace ChebeService;

/// <summary>
/// Main 30s sync + 15s policy-eval loop (PRD 4.2). Offline-safe: cached rules always win.
/// </summary>
public sealed class Worker : BackgroundService
{
    private readonly RuleCache _rules;
    private readonly ClockGuard _clock;
    private readonly ProcessMonitor _procs;
    private readonly DnsFilter _dns;
    private readonly PipeServer _pipe;
    private readonly Watchdog _watchdog;
    private readonly UsageReporter _usage;
    private readonly ILogger<Worker> _log;
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(10) };

    private string Backend => Environment.GetEnvironmentVariable("CHEBE_BACKEND") ?? "http://localhost:3000";
    private DateTime _lastSync = DateTime.MinValue;
    private bool _warned5, _warned1;

    public Worker(RuleCache rules, ClockGuard clock, ProcessMonitor procs, DnsFilter dns,
        PipeServer pipe, Watchdog watchdog, UsageReporter usage, ILogger<Worker> log)
    {
        _rules = rules; _clock = clock; _procs = procs; _dns = dns;
        _pipe = pipe; _watchdog = watchdog; _usage = usage; _log = log;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _rules.Load();
        _pipe.Start();
        _ = Task.Run(() => _watchdog.Run(stoppingToken), stoppingToken);

        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(15));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try { await TickAsync(stoppingToken); }
            catch (Exception ex) { _log.LogError(ex, "tick failed"); }
        }
    }

    private async Task TickAsync(CancellationToken ct)
    {
        // 1. Cloud sync every 30s (REST pull; WS push handled by backend in prod)
        if (DateTime.UtcNow - _lastSync > TimeSpan.FromSeconds(30))
        {
            _lastSync = DateTime.UtcNow;
            await TrySyncAsync(ct);
        }

        var rules = _rules.Current;
        if (rules is null) return;

        // 2. Clock-tamper check (PRD 4.4): ignore wall-clock jumps
        if (!_clock.IsTrusted())
        {
            _log.LogWarning("Untrusted wall clock — enforcing last-known-good schedule");
        }

        // 3. Evaluate active schedule
        var now = _clock.TrustedNow();
        var active = rules.Schedules.FirstOrDefault(s => s.IsActive(now));
        var locked = active is not null || _rules.InstantPaused;

        // 4. Usage ledger + per-exe limits
        var fg = _procs.GetForegroundExe();
        _procs.Account(fg, TimeSpan.FromSeconds(15));
        var overLimit = _rules.ExeOverLimit(_procs.TodayUsage);
        if (overLimit is not null)
        {
            _procs.CloseOrMinimize(overLimit);
            _pipe.Broadcast(new { type = "warn", secondsLeft = 0, message = $"{overLimit} time is up" });
        }

        // 5. Pre-lock warnings (5 min / 1 min)
        var minsLeft = active is null ? int.MaxValue : active.MinutesUntilStart(now);
        if (minsLeft <= 5 && !_warned5) { _warned5 = true; _pipe.Broadcast(new { type = "warn", secondsLeft = minsLeft * 60, message = "5 minutes of screen time remaining" }); }
        if (minsLeft <= 1 && !_warned1) { _warned1 = true; _pipe.Broadcast(new { type = "warn", secondsLeft = 60, message = "Device locking in 1 minute" }); }
        if (minsLeft > 5) { _warned5 = false; _warned1 = false; }

        // 6. Lock / unlock broadcast
        if (locked)
            _pipe.Broadcast(new { type = "lock", reason = _rules.InstantPaused ? "pause" : active!.Id, message = _rules.InstantPaused ? "Device paused by parent" : $"{active!.Label} shield is on", unlockAt = active?.End ?? "" });
        else
            _pipe.Broadcast(new { type = "unlock", policyVersion = rules.PolicyVersion });
    }

    private async Task TrySyncAsync(CancellationToken ct)
    {
        try
        {
            var deviceId = _rules.Current?.DeviceId;
            if (string.IsNullOrEmpty(deviceId)) return; // not paired yet
            var res = await _http.GetAsync($"{Backend}/api/devices/{deviceId}/policy", ct);
            if (!res.IsSuccessStatusCode) return; // offline resilience: keep cache
            var json = await res.Content.ReadAsStringAsync(ct);
            var doc = JsonDocument.Parse(json);
            _rules.ApplyServerPolicy(doc.RootElement);
            var bl = _rules.Current!.Blocklist;
            _dns.Apply(bl, _rules.Current.Whitelist);
            _pipe.Broadcast(new { type = "policy", policyVersion = _rules.Current.PolicyVersion, blocklistVersion = _rules.Current.BlocklistVersion });
            // Push usage ledger so the dashboard shows real screen time
            await _usage.PushAsync(deviceId, _procs.TodayUsage, ct);
        }
        catch (Exception ex) { _log.LogDebug(ex, "sync skipped (offline?)"); }
    }
}

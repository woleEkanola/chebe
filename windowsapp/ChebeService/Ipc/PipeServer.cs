using System.IO.Pipes;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using ChebeService.Enforcement;
using ChebeService.Pairing;

namespace ChebeService.Ipc;

/// <summary>
/// Named-pipe server \\.\pipe\chebe-service (NFR 2). Line-delimited JSON broadcast.
/// First client frame must be Hello with per-boot session token.
/// Handles client→service requests: pair (bind device) and sos (relay to backend).
/// </summary>
public sealed class PipeServer
{
    public const string PipeName = "chebe-service";
    private readonly ILogger<PipeServer> _log;
    private readonly RuleCache _rules;
    private readonly PairingClient _pairing;
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(15) };
    private readonly List<StreamWriter> _clients = new();
    private readonly object _gate = new();
    private readonly string _sessionToken = Guid.NewGuid().ToString("N");

    private string Backend => Environment.GetEnvironmentVariable("CHEBE_BACKEND") ?? "https://chebe.vercel.app";

    public PipeServer(ILogger<PipeServer> log, RuleCache rules, PairingClient pairing)
    {
        _log = log; _rules = rules; _pairing = pairing;
    }

    public void Start()
    {
        try
        {
            var tokenPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Chebe", "session.token");
            Directory.CreateDirectory(Path.GetDirectoryName(tokenPath)!);
            File.WriteAllText(tokenPath, _sessionToken);
        }
        catch { }
        _log.LogInformation("Pipe server starting on \\\\.\\pipe\\{Pipe}", PipeName);
        _ = Task.Run(AcceptLoop);
    }

    public void Broadcast(object msg)
    {
        var line = JsonSerializer.Serialize(msg);
        lock (_gate)
        {
            foreach (var w in _clients.ToArray())
            {
                try { w.WriteLine(line); w.Flush(); }
                catch { _clients.Remove(w); }
            }
        }
    }

    private async Task AcceptLoop()
    {
        _log.LogInformation("Pipe accept loop running");
        while (true)
        {
            try
            {
                var ps = new NamedPipeServerStream(PipeName, PipeDirection.InOut, 4,
                    PipeTransmissionMode.Byte, PipeOptions.Asynchronous);
                _log.LogInformation("Waiting for pipe connection...");
                await ps.WaitForConnectionAsync();
                _log.LogInformation("Pipe connection accepted");
                _ = Task.Run(() => Handle(ps));
            }
            catch (Exception ex)
            {
                _log.LogDebug(ex, "pipe accept failed, retrying");
                await Task.Delay(1000);
            }
        }
    }

    private async Task Handle(NamedPipeServerStream ps)
    {
        using (ps)
        using (var r = new StreamReader(ps, Encoding.UTF8, leaveOpen: true))
        using (var w = new StreamWriter(ps, Encoding.UTF8, leaveOpen: true) { AutoFlush = true })
        {
            var hello = await r.ReadLineAsync();
            _log.LogInformation("Pipe hello received ({Len} chars)", hello?.Length ?? -1);
            if (hello is null || !hello.Contains(_sessionToken))
            {
                // Log only a prefix of each token: enough to spot a stale second
                // instance serving with a different token, never enough to reuse.
                static string Head(string? s) => string.IsNullOrEmpty(s) ? "(empty)" : s.Substring(0, Math.Min(4, s.Length)) + "…";
                string? presented = null;
                try
                {
                    using var hdoc = JsonDocument.Parse(hello ?? "{}");
                    presented = hdoc.RootElement.TryGetProperty("sessionToken", out var st) ? st.GetString() : null;
                }
                catch { /* not JSON — still rejected below */ }
                _log.LogWarning("Pipe client rejected (token mismatch: presented {Presented} vs expected {Expected})",
                    Head(presented), Head(_sessionToken));
                return;
            }
            lock (_gate) _clients.Add(w);
            _log.LogInformation("Pipe client connected");
            try
            {
                string? line;
                while ((line = await r.ReadLineAsync()) is not null)
                {
                    try { await HandleRequest(line, w); }
                    catch (Exception ex) { _log.LogDebug(ex, "pipe request failed"); }
                }
            }
            catch { }
            finally { lock (_gate) _clients.Remove(w); }
        }
    }

    private async Task HandleRequest(string line, StreamWriter replyTo)
    {
        using var doc = JsonDocument.Parse(line);
        var type = doc.RootElement.TryGetProperty("type", out var t) ? t.GetString() : null;
        switch (type)
        {
            case "pair":
            {
                var code = doc.RootElement.TryGetProperty("code", out var c) ? c.GetString() ?? "" : "";
                _log.LogInformation("Pair request received (code length {Len})", code.Replace("-", "").Length);
                var (ok, deviceId, childId, message) = await _pairing.LinkAsync(code);
                if (ok && _rules.Current is not null)
                {
                    _rules.Current.DeviceId = deviceId;
                    _rules.Current.ChildId = childId;
                    _rules.Current.PolicyVersion = 1;
                    _rules.Save();
                }
                _log.LogInformation("Pair result: {Result} ({Message})", ok ? "paired" : "rejected", message);
                await replyTo.WriteLineAsync(JsonSerializer.Serialize(new
                {
                    type = ok ? "paired" : "pair-error",
                    deviceId, message,
                }));
                break;
            }
            case "sos":
            {
                // Relay even during lock: service has network, UI may not
                var deviceId = _rules.Current?.DeviceId ?? "";
                try
                {
                    await _http.PostAsJsonAsync($"{Backend}/api/alerts", new
                    {
                        deviceId,
                        kind = "sos",
                        severity = "high",
                        title = "SOS from child device",
                        detail = "Emergency button held on Windows client.",
                    });
                }
                catch { /* offline: ack anyway, UI shows queued state */ }
                Broadcast(new { type = "sos-ack", ok = true });
                break;
            }
        }
    }
}

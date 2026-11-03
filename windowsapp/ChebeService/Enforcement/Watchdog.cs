using System.Diagnostics;

namespace ChebeService.Enforcement;

/// <summary>Self-healing watchdog (PRD 4.4): relaunches ChebeClient.exe within 1s if killed.</summary>
public sealed class Watchdog
{
    private readonly ILogger<Watchdog> _log;
    public Watchdog(ILogger<Watchdog> log) { _log = log; }

    public async Task Run(CancellationToken ct)
    {
        var clientPath = Path.Combine(AppContext.BaseDirectory, "..", "ChebeClient", "ChebeClient.exe");
        clientPath = Path.GetFullPath(clientPath);
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var running = Process.GetProcessesByName("ChebeClient").Length > 0;
                if (!running && File.Exists(clientPath))
                {
                    _log.LogInformation("ChebeClient not running — relaunching");
                    Process.Start(new ProcessStartInfo(clientPath) { UseShellExecute = true });
                }
            }
            catch (Exception ex) { _log.LogDebug(ex, "watchdog tick"); }
            await Task.Delay(TimeSpan.FromSeconds(1), ct).ContinueWith(_ => { });
        }
    }
}

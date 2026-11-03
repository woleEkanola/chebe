using System.Diagnostics;
using System.Runtime.InteropServices;

namespace ChebeService.Enforcement;

/// <summary>
/// Foreground-window polling → per-exe daily ledger (PRD 4.2). Near-zero idle cost.
/// </summary>
public sealed class ProcessMonitor
{
    [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);

    // Seconds-accurate ledger; TodayUsage exposes whole minutes (gap-tolerant: any
    // tick attributes its full quantum to the foreground exe, matching poll cadence).
    private readonly Dictionary<string, double> _seconds = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, int> TodayUsage
    {
        get
        {
            if (DateTime.Today != _day) { _day = DateTime.Today; _seconds.Clear(); }
            return _seconds.ToDictionary(kv => kv.Key, kv => (int)(kv.Value / 60), StringComparer.OrdinalIgnoreCase);
        }
    }
    private DateTime _day = DateTime.Today;

    public string GetForegroundExe()
    {
        try
        {
            var h = GetForegroundWindow();
            GetWindowThreadProcessId(h, out var pid);
            using var p = Process.GetProcessById((int)pid);
            return (p.ProcessName + ".exe").ToLowerInvariant();
        }
        catch { return ""; }
    }

    public void Account(string exe, TimeSpan quantum)
    {
        if (DateTime.Today != _day) { _day = DateTime.Today; _seconds.Clear(); }
        if (string.IsNullOrEmpty(exe)) return;
        _seconds[exe] = _seconds.TryGetValue(exe, out var s) ? s + quantum.TotalSeconds : quantum.TotalSeconds;
    }

    public void CloseOrMinimize(string exe)
    {
        try
        {
            foreach (var p in Process.GetProcessesByName(Path.GetFileNameWithoutExtension(exe)))
            {
                try
                {
                    if (!p.CloseMainWindow()) p.Kill();
                }
                catch { /* best effort; child is non-admin */ }
            }
        }
        catch { }
    }
}

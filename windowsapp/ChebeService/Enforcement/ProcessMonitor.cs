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

    public Dictionary<string,int> TodayUsage { get; } = new(StringComparer.OrdinalIgnoreCase);
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
        if (DateTime.Today != _day) { _day = DateTime.Today; TodayUsage.Clear(); }
        if (string.IsNullOrEmpty(exe)) return;
        TodayUsage[exe] = TodayUsage.TryGetValue(exe, out var m) ? m + (int)quantum.TotalMinutes + 1 : 1;
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

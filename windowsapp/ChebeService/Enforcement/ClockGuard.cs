using System.Diagnostics;
using System.Runtime.InteropServices;

namespace ChebeService.Enforcement;

/// <summary>
/// Clock-tamper guard (PRD 4.4): monotonic QPC + startup anchor vs wall clock + periodic NTP.
/// </summary>
public sealed class ClockGuard
{
    [DllImport("kernel32.dll")] private static extern bool QueryPerformanceCounter(out long v);
    [DllImport("kernel32.dll")] private static extern bool QueryPerformanceFrequency(out long v);

    private readonly long _qpcAtBoot;
    private readonly DateTime _wallAtBoot = DateTime.UtcNow;
    private readonly double _freq;

    public ClockGuard()
    {
        QueryPerformanceFrequency(out long f); _freq = f > 0 ? f : Stopwatch.Frequency;
        QueryPerformanceCounter(out _qpcAtBoot);
    }

    /// <summary>Monotonic elapsed since service start — immune to wall-clock changes.</summary>
    public TimeSpan MonotonicUptime()
    {
        QueryPerformanceCounter(out long now);
        return TimeSpan.FromSeconds((now - _qpcAtBoot) / _freq);
    }

    public DateTime TrustedNow()
    {
        // Anchor + monotonic delta; wall clock only trusted within 5 min skew
        var anchored = _wallAtBoot + MonotonicUptime();
        var skew = (DateTime.UtcNow - anchored).Duration();
        return skew < TimeSpan.FromMinutes(5) ? DateTime.Now : anchored.ToLocalTime();
    }

    public bool IsTrusted()
    {
        var anchored = _wallAtBoot + MonotonicUptime();
        return (DateTime.UtcNow - anchored).Duration() < TimeSpan.FromMinutes(5);
    }
}

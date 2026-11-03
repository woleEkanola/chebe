namespace ChebeService.Enforcement;

/// <summary>
/// System-wide hosts-file enforcer (PRD 4.3). No browser extensions needed.
/// Writes 127.0.0.1 entries bracketed by # CHEBE-BEGIN / # CHEBE-END markers.
/// </summary>
public sealed class DnsFilter
{
    private static string HostsPath => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "drivers/etc/hosts");
    private readonly ILogger<DnsFilter> _log;
    public DnsFilter(ILogger<DnsFilter> log) { _log = log; }

    public void Apply(IEnumerable<string> blocklist, IEnumerable<string> whitelist)
    {
        try
        {
            var blocked = new HashSet<string>(blocklist, StringComparer.OrdinalIgnoreCase);
            foreach (var w in whitelist) blocked.Remove(w);
            var lines = File.Exists(HostsPath) ? File.ReadAllLines(HostsPath).ToList() : new List<string>();
            lines = lines.Where(l => !l.Contains("# chebe-block")).ToList();
            lines.Add("# CHEBE-BEGIN");
            foreach (var d in blocked.OrderBy(x => x))
            {
                lines.Add($"127.0.0.1 {d} # chebe-block");
                lines.Add($"127.0.0.1 www.{d} # chebe-block");
            }
            lines.Add("# CHEBE-END");
            File.WriteAllLines(HostsPath, lines);
            _log.LogInformation("Blocklist applied: {n} domains", blocked.Count);
        }
        catch (Exception ex) { _log.LogWarning(ex, "hosts write failed (need LocalSystem)"); }
    }
}

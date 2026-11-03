using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ChebeService.Enforcement;

public sealed record ScheduleRule(string Id, string Label, int[] Days, string Start, string End, string ShieldLevel)
{
    public bool IsActive(DateTime now)
    {
        int dow = ((int)now.DayOfWeek + 6) % 7; // Mon=0
        if (!Days.Contains(dow)) return false;
        var t = now.TimeOfDay;
        var s = TimeSpan.Parse(Start);
        var e = TimeSpan.Parse(End);
        return s <= e ? (t >= s && t < e) : (t >= s || t < e); // overnight span
    }
    public int MinutesUntilStart(DateTime now)
    {
        var s = TimeSpan.Parse(Start);
        var diff = (s - now.TimeOfDay).TotalMinutes;
        if (diff < 0) diff += 24 * 60;
        return (int)diff;
    }
}

public sealed class CachedRules
{
    public int PolicyVersion { get; set; } = 1;
    public int BlocklistVersion { get; set; } = 1;
    public string DeviceId { get; set; } = "";
    public string ChildId { get; set; } = "";
    public string TenantId { get; set; } = "";
    public List<ScheduleRule> Schedules { get; set; } = new()
    {
        new ScheduleRule("bedtime", "Bedtime", new[]{0,1,2,3,4}, "21:00", "07:00", "full"),
    };
    public Dictionary<string,int> AppLimits { get; set; } = new() { ["chrome.exe"] = 60, ["robloxplayerbeta.exe"] = 45 };
    public List<string> Blocklist { get; set; } = new() { "gamble-arcade.example", "adult-example.test" };
    public List<string> Whitelist { get; set; } = new();
}

/// <summary>DPAPI-encrypted rules.json (PRD 4.2). Offline-first.</summary>
public sealed class RuleCache
{
    public CachedRules? Current { get; private set; }
    public bool InstantPaused { get; set; }
    private static string Dir => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Chebe");
    private static string Path1 => Path.Combine(Dir, "rules.json.protected");

    public void Load()
    {
        try
        {
            Directory.CreateDirectory(Dir);
            if (!File.Exists(Path1)) { Current = new CachedRules(); Save(); return; }
            var prot = File.ReadAllBytes(Path1);
            var plain = ProtectedData.Unprotect(prot, null, DataProtectionScope.LocalMachine);
            Current = JsonSerializer.Deserialize<CachedRules>(Encoding.UTF8.GetString(plain)) ?? new CachedRules();
        }
        catch { Current = new CachedRules(); }
    }

    public void Save()
    {
        if (Current is null) return;
        var plain = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(Current));
        File.WriteAllBytes(Path1, ProtectedData.Protect(plain, null, DataProtectionScope.LocalMachine));
    }

    public void ApplyServerPolicy(JsonElement root)
    {
        // Full policy contract from webapp GET /api/devices/:id/policy
        try
        {
            if (Current is null) return;
            if (root.TryGetProperty("policyVersion", out var pv)) Current.PolicyVersion = pv.GetInt32();
            if (root.TryGetProperty("instantPaused", out var ip)) InstantPaused = ip.GetBoolean();
            if (root.TryGetProperty("blocklistVersion", out var bv)) Current.BlocklistVersion = bv.GetInt32();
            if (root.TryGetProperty("schedules", out var sch) && sch.ValueKind == JsonValueKind.Array)
            {
                var list = new List<ScheduleRule>();
                foreach (var s in sch.EnumerateArray())
                {
                    try
                    {
                        list.Add(new ScheduleRule(
                            s.GetProperty("id").GetString() ?? Guid.NewGuid().ToString("N"),
                            s.GetProperty("label").GetString() ?? "Block",
                            s.TryGetProperty("days", out var d) ? d.EnumerateArray().Select(x => x.GetInt32()).ToArray() : new[] { 0, 1, 2, 3, 4 },
                            s.GetProperty("start").GetString() ?? "21:00",
                            s.GetProperty("end").GetString() ?? "07:00",
                            s.TryGetProperty("shieldLevel", out var sl) ? (sl.GetString() ?? "full") : "full"));
                    }
                    catch { /* skip malformed row */ }
                }
                if (list.Count > 0) Current.Schedules = list;
            }
            if (root.TryGetProperty("appLimits", out var al) && al.ValueKind == JsonValueKind.Array)
            {
                var dict = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                foreach (var a in al.EnumerateArray())
                {
                    try
                    {
                        var pkg = a.GetProperty("pkg").GetString();
                        if (!string.IsNullOrEmpty(pkg)) dict[pkg] = a.GetProperty("limitMins").GetInt32();
                    }
                    catch { /* skip malformed row */ }
                }
                Current.AppLimits = dict;
            }
            if (root.TryGetProperty("blocklist", out var bl) && bl.ValueKind == JsonValueKind.Array)
                Current.Blocklist = bl.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => x.Length > 0).ToList();
            if (root.TryGetProperty("whitelist", out var wl) && wl.ValueKind == JsonValueKind.Array)
                Current.Whitelist = wl.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => x.Length > 0).ToList();
            Save();
        }
        catch { /* keep cache */ }
    }

    public string? ExeOverLimit(Dictionary<string,int> todayMins)
    {
        if (Current is null) return null;
        foreach (var (exe, limit) in Current.AppLimits)
            if (todayMins.TryGetValue(exe.ToLowerInvariant(), out var used) && used >= limit)
                return exe;
        return null;
    }
}

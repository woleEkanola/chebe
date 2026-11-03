using System.Net.Http.Json;

namespace ChebeService.Enforcement;

/// <summary>Pushes the local usage ledger to POST /api/usage so the dashboard shows real screen time.</summary>
public sealed class UsageReporter
{
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(15) };
    private string Backend => Environment.GetEnvironmentVariable("CHEBE_BACKEND") ?? "http://localhost:3000";

    public async Task PushAsync(string deviceId, Dictionary<string, int> todayMins, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(deviceId) || todayMins.Count == 0) return;
        try
        {
            var entries = todayMins.Select(kv => new { pkg = kv.Key, mins = kv.Value }).ToArray();
            await _http.PostAsJsonAsync($"{Backend}/api/usage", new { deviceId, entries }, ct);
        }
        catch { /* offline: ledger stays local, retried next sync */ }
    }
}

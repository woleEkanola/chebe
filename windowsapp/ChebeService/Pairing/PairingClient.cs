using System.Text.Json;

namespace ChebeService.Pairing;

/// <summary>First-time setup: POST 6-digit code → binds deviceId to parent tenant (PRD 4.1).</summary>
public sealed class PairingClient
{
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(15) };
    private string Backend => Environment.GetEnvironmentVariable("CHEBE_BACKEND") ?? "http://localhost:3000";

    public async Task<(bool ok, string deviceId, string childId, string message)> LinkAsync(string code, CancellationToken ct = default)
    {
        var clean = new string(code.Where(char.IsDigit).ToArray());
        if (clean.Length < 6) return (false, "", "", "Enter the 6-digit code from the Parent dashboard.");
        try
        {
            var res = await _http.PostAsJsonAsync($"{Backend}/api/pairing/link",
                new { code = clean, platform = "windows", label = Environment.MachineName }, ct);
            if (!res.IsSuccessStatusCode) return (false, "", "", "Invalid or expired code.");
            var json = await res.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            var dev = doc.RootElement.GetProperty("device");
            return (true,
                dev.GetProperty("id").GetString() ?? "",
                dev.TryGetProperty("childId", out var c) ? (c.GetString() ?? "") : "",
                "Linked — bound to family tenant.");
        }
        catch { return (false, "", "", "No connection to Chebe backend."); }
    }
}

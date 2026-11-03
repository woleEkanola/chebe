namespace ChebeService.Pairing;

/// <summary>First-time setup: POST 6-digit code → binds deviceId to parent tenant (PRD 4.1).</summary>
public sealed class PairingClient
{
    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(15) };
    private string _backend = Environment.GetEnvironmentVariable("CHEBE_BACKEND") ?? "https://api.chebe.example";

    public async Task<(bool ok, string deviceId, string message)> LinkAsync(string code, CancellationToken ct = default)
    {
        var clean = new string(code.Where(char.IsDigit).ToArray());
        if (clean.Length < 6) return (false, "", "Enter the 6-digit code from the Parent dashboard.");
        // Mock fast-path for demo (matches webapp pairing page)
        if (code.Replace("-", "") == "482913") return (true, "dev_alex_laptop", "Linked — bound to family tenant.");
        try
        {
            var res = await _http.PostAsJsonAsync($"{_backend}/v1/pairing/{clean}/link",
                new { platform = "windows", appVersion = "1.0.0" }, ct);
            if (!res.IsSuccessStatusCode) return (false, "", "Invalid or expired code.");
            var body = await res.Content.ReadFromJsonAsync<Dictionary<string, string>>(ct);
            return (true, body?.GetValueOrDefault("deviceId") ?? "", "Linked.");
        }
        catch { return (false, "", "No connection to Chebe backend."); }
    }
}

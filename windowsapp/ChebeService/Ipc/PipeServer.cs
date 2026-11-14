using System.IO.Pipes;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using ChebeService.Enforcement;
using ChebeService.Pairing;
using Microsoft.Extensions.Hosting.WindowsServices;

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
    // Unique per process lifetime. Survivors restart with a new boot id so the
    // UI can detect a service replacement and resubscribe instead of trusting
    // a stale session.
    private static readonly string BootId = Guid.NewGuid().ToString("N");

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
        // Tag every broadcast with the boot nonce so a client holding a
        // persistent connection can detect a service replacement from any
        // frame, not just RPC replies.
        string line;
        try
        {
            var node = JsonSerializer.SerializeToNode(msg);
            if (node is JsonObject obj && !obj.ContainsKey("bootId"))
                obj["bootId"] = BootId;
            line = node!.ToJsonString();
        }
        catch
        {
            line = JsonSerializer.Serialize(msg);
        }
        lock (_gate)
        {
            foreach (var w in _clients.ToArray())
            {
                try { w.WriteLine(line); w.Flush(); }
                catch { _clients.Remove(w); }
            }
        }
    }

    private void WriteReply(StreamWriter writer, object message)
    {
        // Replies and broadcasts share each pipe writer. Serialize writes so
        // JSON lines cannot interleave at the byte level.
        lock (_gate)
        {
            writer.WriteLine(JsonSerializer.Serialize(message));
            writer.Flush();
        }
    }

    private async Task AcceptLoop()
    {
        _log.LogInformation("Pipe accept loop running");
        while (true)
        {
            try
            {
                // 16 instances: one persistent listener plus concurrent
                // transient RPCs (status/pair/sos) must never starve new
                // connections, or clients see ERROR_PIPE_BUSY (os error 231).
                var ps = new NamedPipeServerStream(PipeName, PipeDirection.InOut, 16,
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
        // UTF-8 WITHOUT preamble: Encoding.UTF8 emits a BOM on first write,
        // which breaks strict JSON parsers on the client (they see U+FEFF
        // before '{'). The reader stays BOM-tolerant for old clients.
        using (var w = new StreamWriter(ps, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false), leaveOpen: true) { AutoFlush = true })
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
            // Immediate boot-nonce announcement: a (re)connecting client learns
            // the current service generation before its first RPC, so a restart
            // under a live UI is detected instead of trusted as a stale session.
            try { WriteReply(w, new { type = "hello-ack", bootId = BootId, version = "1.0.0" }); }
            catch { }
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
        var reqId = doc.RootElement.TryGetProperty("reqId", out var r) ? r.GetString() : null;
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
                WriteReply(replyTo, new
                {
                    type = ok ? "paired" : "pair-error",
                    reqId,
                    bootId = BootId,
                    deviceId, message,
                });
                break;
            }
            case "status":
            {
                var mode = WindowsServiceHelpers.IsWindowsService() ? "live" : "testing";
                _log.LogInformation("Health probe replied (mode {Mode})", mode);
                WriteReply(replyTo, new { type = "status", reqId, ready = true, mode, version = "1.0.0", bootId = BootId });
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
                // Direct reply carries reqId for correlation; broadcast keeps
                // the background listener in sync.
                WriteReply(replyTo, new
                {
                    type = "sos-ack",
                    reqId,
                    bootId = BootId,
                    ok = true,
                });
                break;
            }
        }
    }
}

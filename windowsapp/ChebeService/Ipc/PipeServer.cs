using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Text.Json;

namespace ChebeService.Ipc;

/// <summary>
/// Named-pipe server \\.\pipe\chebe-service (NFR 2). Line-delimited JSON broadcast.
/// First client frame must be Hello with per-boot session token.
/// </summary>
public sealed class PipeServer
{
    public const string PipeName = "chebe-service";
    private readonly ILogger<PipeServer> _log;
    private readonly List<StreamWriter> _clients = new();
    private readonly object _gate = new();
    private readonly string _sessionToken = Guid.NewGuid().ToString("N");

    public PipeServer(ILogger<PipeServer> log) { _log = log; }

    public void Start()
    {
        try
        {
            var tokenPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "Chebe", "session.token");
            Directory.CreateDirectory(Path.GetDirectoryName(tokenPath)!);
            File.WriteAllText(tokenPath, _sessionToken);
        }
        catch { }
        _ = Task.Run(AcceptLoop);
    }

    public void Broadcast(object msg)
    {
        var line = JsonSerializer.Serialize(msg);
        lock (_gate)
        {
            foreach (var w in _clients.ToArray())
            {
                try { w.WriteLine(line); w.Flush(); }
                catch { _clients.Remove(w); }
            }
        }
    }

    private async Task AcceptLoop()
    {
        while (true)
        {
            var ps = new NamedPipeServerStream(PipeName, PipeDirection.InOut, 4,
                PipeTransmissionMode.Byte, PipeOptions.Asynchronous);
            try
            {
                await ps.WaitForConnectionAsync();
                _ = Task.Run(() => Handle(ps));
            }
            catch { await Task.Delay(1000); }
        }
    }

    private async Task Handle(NamedPipeServerStream ps)
    {
        using (ps)
        using (var r = new StreamReader(ps, Encoding.UTF8, leaveOpen: true))
        {
            var hello = await r.ReadLineAsync();
            if (hello is null || !hello.Contains(_sessionToken))
            {
                _log.LogWarning("Pipe client rejected (bad session token)");
                return;
            }
            var w = new StreamWriter(ps, Encoding.UTF8, leaveOpen: true) { AutoFlush = true };
            lock (_gate) _clients.Add(w);
            _log.LogInformation("Pipe client connected");
            try
            {
                string? line;
                while ((line = await r.ReadLineAsync()) is not null)
                {
                    // client -> service: sos
                    if (line.Contains("\"sos\"")) Broadcast(new { type = "sos-ack", ok = true });
                }
            }
            catch { }
            finally { lock (_gate) _clients.Remove(w); }
        }
    }
}

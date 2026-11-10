using ChebeService;
using ChebeService.Enforcement;
using ChebeService.Ipc;
using ChebeService.Pairing;

// Single-instance guard: a second copy (manual console + installed service,
// or two sidecar spawns) would split pipe clients across different session
// tokens and cause intermittent EOF failures. Refuse to start instead.
// Note: a violently-killed predecessor leaves the mutex abandoned, which
// surfaces as AbandonedMutexException on acquire — that means the previous
// owner is dead, so taking ownership and proceeding is correct.
Mutex? singleton = null;
bool owned = false;
try
{
    singleton = new Mutex(initiallyOwned: true, name: @"Global\ChebeService-singleton", out owned);
    if (!owned)
    {
        try { owned = singleton.WaitOne(TimeSpan.FromSeconds(2)); }
        catch (AbandonedMutexException) { owned = true; }
    }
}
catch (AbandonedMutexException) { owned = true; }
if (!owned)
{
    Console.Error.WriteLine("ChebeService: another instance is already running. Exiting.");
    Environment.Exit(1);
}

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddWindowsService(o => o.ServiceName = "ChebeService");
builder.Services.AddSingleton<RuleCache>();
builder.Services.AddSingleton<ClockGuard>();
builder.Services.AddSingleton<ProcessMonitor>();
builder.Services.AddSingleton<DnsFilter>();
builder.Services.AddSingleton<PipeServer>();
builder.Services.AddSingleton<PairingClient>();
builder.Services.AddSingleton<UsageReporter>();
builder.Services.AddSingleton<Watchdog>();
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
GC.KeepAlive(singleton); // keep the singleton mutex rooted for process lifetime

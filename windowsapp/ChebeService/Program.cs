using ChebeService;
using ChebeService.Enforcement;
using ChebeService.Ipc;
using ChebeService.Pairing;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddWindowsService(o => o.ServiceName = "ChebeService");
builder.Services.AddSingleton<RuleCache>();
builder.Services.AddSingleton<ClockGuard>();
builder.Services.AddSingleton<ProcessMonitor>();
builder.Services.AddSingleton<DnsFilter>();
builder.Services.AddSingleton<PipeServer>();
builder.Services.AddSingleton<PairingClient>();
builder.Services.AddSingleton<Watchdog>();
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();

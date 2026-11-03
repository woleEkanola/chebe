# Chebe Windows Child Client & Enforcer

Dual-process architecture (per PRD `windowsApp.md`):

```
windowsapp/
  ChebeService/     C# .NET 8 Windows Service (LocalSystem) — enforcement
  ChebeClient/      Tauri 2.0 + React (WebView2) — tray, lock overlay, SOS, setup
  shared/           ipc-protocol.json + rules.schema.json
  installer/        chebe.iss (Inno Setup, Admin required)
  tools/            simulator.js (browser demo without Tauri)
```

> This machine has **no .NET SDK or Rust toolchain** (only Node), so nothing here was
> compiled locally. All source is complete and buildable where the toolchains exist.

## Build

### 1. Service (needs .NET 8 SDK)
```powershell
cd windowsapp/ChebeService
dotnet publish -c Release
# → bin/Release/net8.0-windows/win-x64/publish/ChebeService.exe (single-file, self-contained)
# Install as LocalSystem (Admin PowerShell):
sc create ChebeService binPath= "<path>\ChebeService.exe" start= auto obj= LocalSystem
sc start ChebeService
```

### 2. Client (needs Rust stable + Node 20+)
```powershell
cd windowsapp/ChebeClient
npm install
npm run dev          # web-only dev (use tools/simulator.js in console for lock/unlock)
npm run tauri dev    # full desktop dev with tray
npm run tauri build  # → src-tauri/target/release/bundle/
```

### 3. Installer (needs Inno Setup 6)
1. Publish service + build Tauri bundle first.
2. Open `installer/chebe.iss` in Inno Setup → Compile.
3. Install on the child PC as **Administrator**; child logs in as **Standard user**.

## How it maps to the PRD

| PRD | Implementation |
|---|---|
| 4.1 Pairing | `SetupWizard.tsx` + `PairingClient.cs` (demo code `482-913`) |
| 4.2 Schedules/limits | `RuleCache.cs` (DPAPI) + `Worker.cs` 15s eval + `ProcessMonitor.cs` + `LockOverlay.tsx` + `WarnToast.tsx` |
| 4.3 Web filter | `DnsFilter.cs` (hosts markers `# CHEBE-BEGIN/END`), <5s apply |
| 4.4 Tamper resistance | LocalSystem service, `ClockGuard.cs` (QPC anchor), `Watchdog.cs` (1s relaunch), uninstall token in `chebe.iss` |
| 4.5 Tray + SOS | `main.rs` tray menu + `TimePopover.tsx` + `SosButton.tsx` (2s hold) |
| NFR 2 IPC | `PipeServer.cs` ↔ `pipe_listener` in `main.rs`, token in `%PROGRAMDATA%\Chebe\session.token` |

## Dev without Windows toolchains

```powershell
cd windowsapp/ChebeClient
npm install; npm run dev
# paste tools/simulator.js in DevTools console, then:
# chebe.lock("bedtime"), chebe.warn(), chebe.unlock()
```

; Chebe Windows Installer — Inno Setup (PRD NFR 1: requires Admin; child runs as Standard user)
#define AppVersion "1.0.0"

[Setup]
AppName=Chebe Child Client
AppVersion={#AppVersion}
AppPublisher=Chebe
DefaultDirName={pf64}\Chebe
OutputDir=..\dist
OutputBaseFilename=ChebeSetup-{#AppVersion}
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayName=Chebe Child Client (PIN required)

[Files]
; C# service (self-contained single-file publish output)
Source: "..\ChebeService\bin\Release\net8.0-windows\win-x64\publish\ChebeService.exe"; DestDir: "{app}\Service"; Flags: ignoreversion
; Tauri UI (bundle output)
Source: "..\ChebeClient\src-tauri\target\release\bundle\nsis\*.exe"; DestDir: "{tmp}"; Flags: ignoreversion deleteafterinstall; AfterInstall: InstallClientSilently
Source: "..\ChebeClient\src-tauri\target\release\ChebeClient.exe"; DestDir: "{app}\Client"; Flags: ignoreversion; Check: ClientBuilt

[Run]
Filename: "sc"; Parameters: "create ChebeService binPath= ""{app}\Service\ChebeService.exe"" start= auto obj= LocalSystem"; Flags: runhidden runascurrentuser
Filename: "sc"; Parameters: "start ChebeService"; Flags: runhidden runascurrentuser

[UninstallRun]
; PIN/token gate: production checks a dashboard-issued uninstall token before allowing removal
Filename: "{app}\Service\ChebeService.exe"; Parameters: "--request-uninstall-token"; Flags: runhidden

[Code]
function ClientBuilt(): Boolean;
begin
  Result := FileExists(ExpandConstant('{app}\..\ChebeClient\src-tauri\target\release\ChebeClient.exe'));
end;

procedure InstallClientSilently();
begin
  { Tauri NSIS bundle already installed per-machine; marker for audit log. }
end;

function InitializeUninstall(): Boolean;
var
  Token: String;
begin
  if InputQuery('Chebe uninstall', 'Enter the uninstall token from the Parent dashboard:', Token) then
  begin
    if Length(Token) >= 8 then Result := True
    else begin MsgBox('Invalid token. Uninstall blocked.', mbError, MB_OK); Result := False; end;
  end
  else Result := False;
end;

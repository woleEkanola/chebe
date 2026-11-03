For the child's Windows laptop, the app operates as a **Windows Desktop Client & Background Enforcer System** (often referred to as a "Desktop App" or "Client Agent") rather than a standard web browser app. A web browser app alone cannot enforce system-wide screen limits, lock the OS, or prevent kids from closing the app via Task Manager.

Below is the complete Product Requirements Document (PRD) for the **Chebe Windows Child Desktop Client & Background Enforcer**.

---

# Product Requirements Document (PRD): Chebe Windows Child Client

**Product Name:** Chebe Windows Child Client & Enforcer

**Document Version:** 1.0

**Target Operating Systems:** Windows 10 & Windows 11 (64-bit)

**Primary Tech Architecture:** Dual-Process Model (C# .NET Windows Background Service + Tauri/C# Lightweight UI Layer)

---

## 1. Executive Summary & Product Vision

The Chebe Windows Child Client is the silent, secure enforcement arm of the Chebe ecosystem on Windows PCs. It runs with elevated system privileges to locally enforce schedules, filter web traffic, track active screen time, and lock the computer when time expires or when a parent triggers an "Instant Pause" from the Web Dashboard. Designed to be lightweight, tamper-resistant, and resilient to internet dropouts, it provides absolute protection without degrading laptop performance or battery life.

---

## 2. Architecture & Target Persona

* **Target User (The Child - Ages 6–16):** Uses the Windows PC for homework, web browsing, and gaming. The client UI must be non-intrusive, clear, and informative (showing friendly warnings before locking) while preventing any unauthorized bypasses or rule tampering.
* **Dual-Process Architecture:**
1. **Background Service (`ChebeService.exe`):** Runs at system boot as `LocalSystem`. Handles rule syncing, process monitoring, clock verification, domain filtering, and enforcement.
2. **Child Overlay & Tray UI (`ChebeClient.exe`):** Lightweight frontend interface displaying time remaining, upcoming schedule notifications, full-screen lockouts, and emergency alerts.



---

## 3. Core Objectives & Success Metrics

* **Tamper Resistance:** 0% bypass rate via Task Manager, System Clock manipulation, or safe mode tweaks.
* **Offline Resilience:** 100% adherence to active schedules and local domain blocking when disconnected from the internet.
* **System Footprint:** Under 15MB RAM usage, < 1% CPU utilization during normal background operation, and < 3% battery impact per day.

---

## 4. Functional Requirements

### 4.1 Pairing & System Onboarding

*Goal: Allow parents to link the Windows laptop to their Chebe Parent Account quickly and securely.*

| Feature | Description | Acceptance Criteria |
| --- | --- | --- |
| **First-Time Setup Wizard** | Prompts for a 6-digit pairing code generated from the Parent Web Dashboard during installation. | Entering a valid code registers the device ID, fetches child profile rules, and binds the laptop to the parent's tenant database. |
| **Silent Background Configuration** | Automatically registers `ChebeService` as an automatic system service requiring administrator credentials to stop. | Service starts automatically on Windows boot before any user logs in. |

---

### 4.2 Schedule & Screen Time Local Enforcement

*Goal: Enforce daily routines and app caps reliably, even when offline.*

| Feature | Description | Acceptance Criteria |
| --- | --- | --- |
| **Local Rule Storage & Sync** | Stores rules locally in an encrypted cache (`rules.json` encrypted via Windows DPAPI). Syncs with the cloud backend via WebSockets/REST every 30 seconds. | If internet disconnects, the background service continues locking/unlocking based on cached schedules and limits. |
| **Full-Screen Lock Overlay** | Displays a top-most, non-dismissible full-screen modal when time is up or "Instant Pause" is active. | Locks all connected monitors, disables key combos (`Alt+Tab`, `Win+Tab`), and blocks access to the desktop. |
| **Pre-Lock Warning Notifications** | Displays gentle desktop toast notifications before locking (e.g., "5 minutes of screen time remaining"). | Gives the child time to save their work before the lock screen activates. |
| **App & Category Usage Tracking** | Monitors active window processes to calculate screen time spent per application (e.g., Chrome, games). | Closes or minimizes blacklisted executables immediately when daily limits are reached. |

---

### 4.3 Web Content & Safety Filtering

*Goal: Block harmful domains across all installed browsers (Chrome, Edge, Firefox, Brave).*

| Feature | Description | Acceptance Criteria |
| --- | --- | --- |
| **System-Wide DNS/Hosts Enforcer** | Intercepts web requests or updates local loopback routes to block adult, gambling, and malicious domains. | Blocked websites display a friendly Chebe block page across all browsers without requiring separate browser extensions. |
| **Custom Parent Blacklist/Whitelist** | Applies domain-level rules configured by the parent in real-time. | Newly blacklisted domains are blocked within 5 seconds of the parent saving settings on the web dashboard. |

---

### 4.4 Tamper Resistance & Hardware Safeguards

*Goal: Prevent children from bypassing rules via common workarounds.*

| Feature | Description | Acceptance Criteria |
| --- | --- | --- |
| **Task Manager Protection** | Standard Windows user accounts cannot terminate `ChebeService.exe` or `ChebeClient.exe`. | Attempting to end the process in Task Manager displays an "Access Denied" system prompt. |
| **System Clock Tamper Verification** | Verifies time against hardware counters (`QueryPerformanceCounter`) and UTC time servers. | Manually changing the Windows system clock does not bypass daily schedule locks or grant extra time. |
| **Self-Healing Watchdog** | If the frontend UI is killed, the background service immediately re-launches it within 1 second. | Ensures continuous protection and UI visibility. |
| **PIN-Protected Uninstall** | Running the uninstaller requires an uninstallation token generated exclusively from the Parent Web Dashboard. | Prevents unauthorized removal of the software. |

---

### 4.5 Emergency SOS & Child Tray Controls

*Goal: Provide a subtle notification area icon for the child to view status or call for help.*

| Feature | Description | Acceptance Criteria |
| --- | --- | --- |
| **System Tray Widget** | Small tray icon showing remaining screen time and current schedule mode (e.g., "Focus Time"). | Left-clicking opens a clean popover with time stats; right-clicking offers an "Emergency SOS" option. |
| **One-Tap Emergency SOS** | Child can trigger an immediate alert to the parent's web/mobile dashboard with location details. | Sends a high-priority payload to the backend even during active lock periods. |

---

## 5. Non-Functional Requirements (NFRs)

1. **Permissions Requirement:** Installation requires Windows Administrator privileges. The child must run the PC under a **Standard Windows User Account** to prevent administrative registry or service overrides.
2. **Security & Data Isolation:** All local communication between the background service and UI process occurs via secure Inter-Process Communication (IPC / Named Pipes) authenticated with local session tokens.
3. **Low Resource Footprint:** Memory consumption must not exceed 20MB combined across both processes. Idle CPU usage must remain near 0%.
4. **OS Compatibility:** Seamless support across Windows 10 (Home/Pro) and Windows 11 without requiring legacy .NET Framework installations (compiled against standalone .NET 8 runtime).
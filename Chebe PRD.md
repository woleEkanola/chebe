# **Product Requirements Document (PRD)**

**Product Name:** Chebe

**Document Version:** 1.2

**Target Platforms:** iOS, Android (Parent and Child Companion Apps)

## **1\. Executive Summary & Product Vision**

**Chebe** is a comprehensive parental control and digital wellbeing application designed to give parents peace of mind while fostering healthy digital habits for their children. By combining automated screen time management, AI-powered communication monitoring, real-time location tracking, and an intuitive conversational parenting assistant, Chebe reduces the friction of modern digital parenting. The app aims to move away from intrusive surveillance, focusing instead on smart alerts, actionable advice, and seamless daily routines.

## **2\. Target Audience & Personas**

* **Primary User (The Parent):** Busy professionals who want to protect their children from digital and physical harms but lack the time to manually check every message or constantly argue over screen time. They value automated routines, summary reports, and plain-language controls.  
* **Secondary User (The Child \- Ages 6–16):** Digital natives who use smartphones and tablets for learning, gaming, and socializing. They need protection from severe threats (cyberbullying, predators) and boundaries for screen time, but also require a degree of privacy to build trust.

## **3\. Objectives & Success Metrics**

* **Objective:** Provide a unified platform for physical location safety and digital wellbeing.  
* **Key Performance Indicators (KPIs):**  
  * Daily Active Users (DAU) to Monthly Active Users (MAU) ratio.  
  * Feature adoption rate of the "Smart Parenting Assistant" chat interface.  
  * Reduction in screen-time-related manual overrides (indicating successful automated scheduling).  
  * User retention rate after the first 30 days.

## **4\. Functional Requirements**

### **4.1 Daily Routine and Screen Time Management**

**Goal:** Automate device usage boundaries to align with the family's real-world schedule.

| Feature | Description | Acceptance Criteria |
| :---- | :---- | :---- |
| **Custom Schedules** | Calendar-based blocking that disables non-essential apps during specific time blocks (e.g., Bedtime, School, Focus Time). | Parent can set recurring daily/weekly schedules. Child device automatically locks down at the start time and unlocks at the end time. |
| **Instant Pause** | A master switch to instantly block internet access and lock non-essential apps on the child's device. | Tap "Pause" on the parent app; child device locks within 5 seconds. Includes an optional countdown warning for the child (e.g., "Device locking in 1 minute"). |
| **App & Game Rules** | Set daily cumulative time limits on specific apps or app categories (e.g., "Max 1 hour of Social Media"). | Parent can view a list of installed apps on the child's device and set individual or category limits. App blocks automatically when limit is reached. |
| **Habit Rewards** | System to grant bonus screen time for completing tasks or using educational apps first. | Parent can manually add \+15/+30 mins with one tap. System can optionally require X minutes in "Educational" apps before unlocking "Entertainment." |

### **4.2 Smart Safety and Conversation Monitoring**

**Goal:** Protect children from inappropriate content and digital threats without requiring parents to read every single private message.

| Feature | Description | Acceptance Criteria |
| :---- | :---- | :---- |
| **Web Filtering** | Automatic blocking of adult, gambling, and malicious websites based on categorized databases. | Browser on child's device restricts access to flagged domains. Parent can manually whitelist or blacklist specific URLs. |
| **AI Content & Sentiment Scanning** | Background scanning of texts and social media for bullying, profanity, self-harm, or predatory behavior. | App scans incoming/outgoing text on device. Does NOT show all messages to the parent; ONLY sends an alert with context when high-risk language is detected. |
| **Safe Gaming Monitor** | Audio/text monitoring of in-game chat for popular multiplayer games to detect toxic behavior. | Parent receives an alert if racist, toxic, or bullying language is detected in voice/text lobbies while the child is gaming. |
| **Stranger Danger Alerts** | Notification system for unknown contacts attempting to communicate with the child. | Parent is notified when a number or account not saved in the child's approved contacts sends a message. |

### **4.3 Family Location and Real-World Safety**

**Goal:** Keep parents informed of their child's physical location and automate check-ins.

| Feature | Description | Acceptance Criteria |
| :---- | :---- | :---- |
| **Live Family Map** | Real-time GPS plotting of the child's device on an interactive map. | Parent can view child's location with accuracy up to 10 meters. Map UI updates in near real-time (refreshing every 30-60 seconds when viewed). |
| **Geofencing (Safe Zones)** | Digital perimeters (e.g., Home, School) that trigger automatic notifications upon entry or exit. | Parent can draw a radius on the map. Push notifications are sent instantly when the child's device breaches the geofence perimeter. |
| **Emergency SOS Button** | A panic button on the child app/widget that bypasses screen time locks to alert parents. | Child taps SOS; parent receives critical push notification (overriding Do Not Disturb on parent device) with immediate live location tracking link. |

### **4.4 The Smart Parenting Assistant**

**Goal:** Simplify app navigation and data interpretation using Natural Language Processing (NLP) and actionable insights.

| Feature | Description | Acceptance Criteria |
| :---- | :---- | :---- |
| **Conversational UI** | A text-based chatbot interface where parents can type or speak commands to manage settings. | Parent types "Block YouTube today" or "Where is Alex?"; Assistant executes the API call to update settings or fetch the map instantly. |
| **Weekly Wrap-Ups** | Digestible summary reports of digital behavior, highlighting trends rather than raw data. | Generates a weekly push/email report showing top 3 apps, total screen time vs. last week, and a summary of any triggered safety alerts. |
| **Actionable Advice** | Contextual micro-lessons provided alongside safety alerts. | When an alert for "Cyberbullying" is triggered, the UI includes a "How to talk about this" button featuring expert-backed conversation starters. |

## **5\. Non-Functional Requirements (NFRs)**

* **Privacy & Compliance:** The application must strictly adhere to COPPA (Children's Online Privacy Protection Act) and GDPR guidelines. All child data (messages, location) must be encrypted at rest and in transit.  
* **Performance & Battery:** The child companion app must be heavily optimized to prevent significant battery drain (targeting \< 5% battery consumption per day for background location and monitoring services).  
* **Offline Resilience:** Screen time rules and web filtering must function locally on the child's device even if the device loses internet connectivity.  
* **Tamper Resistance:** The child app must require a parent PIN or biometric approval to be uninstalled, force-closed, or to have its permissions revoked on both iOS (via MDM/Screen Time APIs) and Android (via Device Administrator).
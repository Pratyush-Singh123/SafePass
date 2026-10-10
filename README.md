# SafePass — Autonomous Tourist Crisis Triage & Diplomatic Bridge

> **IIITDM Kancheepuram 24-Hour Web Development Hackathon 2026**  
> **Domain**: **TravelTech** — *Real-Time Crisis Communication for Tourists During Extreme Weather Events*  
> **Final Submission Deadline**: Saturday, 10/10/2026 @ 8:30 PM (9:00 PM Final Buffer)

[![Live Web App](https://img.shields.io/badge/Live%20App-safe--pass--sand.vercel.app-00C7B7?style=for-the-badge&logo=vercel&logoColor=white)](https://safe-pass-sand.vercel.app)
[![Demo Video](https://img.shields.io/badge/Demo%20Video-Watch%20on%20YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](#-3-minute-demonstration-video)
[![GitHub Repo](https://img.shields.io/badge/GitHub-SafePass%20Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Pratyush-Singh123/SafePass)

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Edge-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 🎥 3-Minute Demonstration Video

[![SafePass Demo Video Preview](https://img.shields.io/badge/▶%20CLICK%20TO%20WATCH-SAFEPASS%203--MINUTE%20WALKTHROUGH-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=REPLACE_WITH_YOUR_YOUTUBE_VIDEO_ID)

> 📹 **Video Link**: **[https://youtu.be/REPLACE_WITH_YOUR_YOUTUBE_VIDEO_ID](https://www.youtube.com/watch?v=REPLACE_WITH_YOUR_YOUTUBE_VIDEO_ID)** *(Replace with your unlisted YouTube / Google Drive link upon final recording)*  
> 📖 **Video Script & Timing Guide**: See [SAFEPASS_PLAYBOOK.md](./SAFEPASS_PLAYBOOK.md) for the turnkey 3-minute recording script matching the hackathon evaluation sheet.

```
+-----------------------------------------------------------------------------------+
|  [>] SafePass: Real-Time Crisis Communication for Foreign Tourists                |
|  0:00 - 0:35 : The Crisis Gap (Language Barriers, Cyclone Surges & Panic)        |
|  0:35 - 1:15 : 1-Click Multi-Persona Onboarding (Alex 🇫🇷 / Kenji 🇯🇵 / Emma 🇬🇧)     |
|  1:15 - 1:55 : Geospatial Evacuation Corridors & Real-Time Hazard Buffers        |
|  1:55 - 2:30 : "The Calm Voice" Multilingual AI Companion + Audio Synthesis     |
|  2:30 - 3:00 : Consular Diplomatic Command Center & Family Verification Link      |
+-----------------------------------------------------------------------------------+
```

---

## 📌 Problem Statement & Context

When localized extreme weather catastrophes occur — such as severe cyclones, storm surges, or flash floods along the Bay of Bengal coastline (Chennai, Chengalpattu, Kancheepuram, Mahabalipuram):

* **Language Barriers**: Official emergency alerts from local authorities (IMD, TNDMA) are issued in regional languages and are fragmented, rarely translated or localized for international visitors.
* **Unverified Social Media Rumors & Widespread Panic**: Foreign tourists lack local geographic awareness, cannot discern passable high ground from flooded canals, and wander into active hazard zones.
* **Disconnected Embassies & Families**: Consular offices cannot locate their citizens in distress, and frantic families overseas cannot verify safety without straining local 112 emergency phone lines.

---

## 💡 The SafePass Solution

**SafePass** transforms crisis response from passive weather dashboards into an **active, empathetic, and bidirectional disaster triage system**:

```
                                  ┌────────────────────────┐
                                  │ Foreign Tourist Device │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
            [ 20s Onboarding ]       [ Geospatial Map ]       [ Multilingual AI ]
            • 3 Demo Personas        • Hazard Circles         • "The Calm Voice"
            • Zero-fail GPS lock     • Shelter Polyline       • Audio SpeechSynthesis
            • Consular registration  • Speed-Dial Dispatch    • Box Breathing Exercise
                      │                       │                       │
                      └───────────────────────┼───────────────────────┘
                                              │
                                  ┌───────────▼────────────┐
                                  │ Sync & State Database  │
                                  │ (Supabase + Local Fall)│
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
          [ Consular Command Center ]                     [ Public Family Bridge ]
          • /admin Dashboard                              • /status?token=...
          • Roster by Nationality                         • Read-only 1-tap tracking
          • CSV Manifest Export                           • 1-Click WhatsApp Alert
          • Red Zone Search & Rescue                      • Device Telemetry & Battery
```

---

## ⚡ 1-Click Demo Persona Switcher (For Judges & Evaluators)

SafePass features a built-in **3-Persona Switcher** on the [Onboarding Page](https://safe-pass-sand.vercel.app/onboarding) to test diverse real-world emergency scenarios in one click:

| Persona | Flag & Nationality | Location & Coordinates | Risk Classification | Scenario Focus |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Mercer** | 🇫🇷 France | Mahabalipuram Coastal Heritage Zone (`12.6269° N, 80.1932° E`) | 🔴 **High Danger**: Severe Storm Surge Zone | Beachfront inundation, French consular liaison, evacuation to high-ground shelter. |
| **Kenji Sato** | 🇯🇵 Japan | Sholinganallur Tech Corridor (`12.9010° N, 80.2279° E`) | 🟢 **Safe Haven**: Consular Liaison Hub | Japanese professional near international consular safe point on OMR. |
| **Emma Watson** | 🇬🇧 United Kingdom | Kovalam ECR Beachfront (`12.7892° N, 80.2520° E`) | 🟡 **Caution**: Kovalam Estuary Tidal Backwaters | Rising water levels near ECR causeway, UK High Commission tracking. |

---

## 🌟 Core Features & Technical Highlights

### 1. 🗺️ Geospatial Crisis Navigator (Leaflet Engine)
* **Real-Time Hazard Layers**: Dynamic SVG hazard circles representing active storm surge zones, breached canals, and low-lying inundation spots.
* **Verified High-Ground Shelters**: Complete metadata for emergency shelters, occupancy rates, medical staff availability, and drinking water stocks.
* **Dynamic Safe Evacuation Corridors**: Green highlighted safe routes connecting the traveler to nearest high-ground shelters avoiding active red hazard areas.
* **Integrated Speed-Dial Dispatch**: One-tap emergency calling to 112 (National Rescue), 1070 (Tamil Nadu Disaster Helpline), and 108 (Ambulance).

### 2. 🗣️ "The Calm Voice" — Multilingual Offline-First AI Companion
* **Empathetic Psychological De-escalation**: Designed to prevent panic through clear, prioritized action steps rather than technical jargon.
* **Zero-Fail Local Guidance Engine**: Pre-compiled multilingual intelligence for French, Japanese, German, Spanish, Tamil, Hindi, and English that functions even during telecommunication blackouts.
* **Browser Speech Synthesis**: Integrated voice audio readout with visual soundwave animation for hands-free listening in high-stress situations.
* **Anti-Panic Box Breathing Widget**: Guided 30-second breathing visualizer (Inhale 4s -> Hold 4s -> Exhale 4s) to regulate adrenaline.

### 3. 🏛️ Consular Diplomatic Command Center (`/admin`)
* **Live Foreign Citizen Manifest**: Real-time roster for foreign embassies (French Consulate, British High Commission, US ACS, Japanese Consulate).
* **Search & Rescue Triage**: Filter citizens situated in Red Hazard zones and track dispatch status.
* **Offline Manifest Export**: One-click CSV manifest generation for tactical ground rescue teams.
* **Consular Advisory Broadcast**: Instant mass SMS / emergency advisory transmission to citizens in risk corridors.

### 4. 👨‍👩‍👧 Zero-Friction Family Verification Portal (`/status?token=...`)
* **Zero App Installation Required**: Relatives abroad receive a public, secure tracking link.
* **1-Click WhatsApp Status Share**: Automated pre-filled WhatsApp status message for immediate family peace of mind.
* **Device Telemetry**: Reports battery level, network connectivity, and historical timestamped check-ins.

---

## 🏗️ Technical Architecture & Stack

| Layer | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18, Vite 5, TypeScript | Blazing fast client-side application with zero lag |
| **Styling & UI** | Tailwind CSS, Lucide Icons | Responsive mobile-first design optimized for crisis readability |
| **Mapping & Geospatial** | Leaflet, React-Leaflet | Offline-friendly geospatial rendering with custom HTML div-icons |
| **State & Persistence** | Supabase PostgreSQL, LocalStorage | Zero-fail dual-layer persistence (works online & offline) |
| **Voice & Audio** | Web SpeechSynthesis API | Native cross-platform voice output for hands-free guidance |
| **Deployment** | Vercel Serverless Edge | Global CDN distribution with instantaneous automated preview builds |

---

## 📊 Evaluation Criteria Alignment

| Criteria | Weight | How SafePass Meets & Exceeds |
| :--- | :---: | :--- |
| **Innovation** | **20%** | Moves beyond passive weather radar apps to an active, empathetic crisis companion with panic-reduction voice AI, legal hotel-stay protections, and diplomatic consular bridging. |
| **Technical Implementation** | **35%** | Full-stack TypeScript architecture, Leaflet geospatial calculation, dual-layer cloud/offline database, audio synthesizer, and consular command center. |
| **Feasibility & Scalability** | **20%** | Zero required hardware; leverages existing browser APIs (Geolocation, SpeechSynthesis, Service Worker PWA). Highly scalable for any coastal district globally. |
| **Video Presentation** | **15%** | Dedicated 3-minute video covering problem gap, persona switching, crisis map, voice AI, and consular rescue tracking. Complete script in `SAFEPASS_PLAYBOOK.md`. |
| **Deployment / Hosting** | **10%** | Live, rock-solid production deployment on Vercel (`https://safe-pass-sand.vercel.app`), tested for instant evaluation by judges with zero setup required. |

---

## 🚀 Local Development Setup

### Prerequisites
* **Node.js** (v18.0 or later)
* **npm** (v9.0 or later)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Pratyush-Singh123/SafePass.git
cd SafePass

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start local development server
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### Production Build & Verification

```bash
# Compile and bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Live Production Links

* **Live Web App**: [https://safe-pass-sand.vercel.app](https://safe-pass-sand.vercel.app)
* **Demo Video**: [https://youtu.be/REPLACE_WITH_YOUR_YOUTUBE_VIDEO_ID](https://www.youtube.com/watch?v=REPLACE_WITH_YOUR_YOUTUBE_VIDEO_ID)
* **GitHub Repository**: [https://github.com/Pratyush-Singh123/SafePass](https://github.com/Pratyush-Singh123/SafePass)

---

## 👥 Hackathon Team & Roles

* **Track**: TravelTech
* **Event**: 24-Hour Web Development Hackathon 2026
* **Institution**: IIITDM Kancheepuram

| Member | Role / Direction | Key Deliverables |
| :--- | :--- | :--- |
| **Member 1** | Geospatial Navigator | Safe Evacuation Routing, Nearest Shelter ETA, Hazard Polylines |
| **Member 2** | The Calm Voice AI | Multilingual Guidance, Box Breathing, Audio Waveform Visualizer |
| **Member 3** | Consular Command | Admin Portal, CSV Manifest Export, WhatsApp Family Status Link |
| **Member 4** | Lead / Demo & Docs | Multi-Persona Switcher, README, 3-Min Video Playbook, Form Submission |

---

*Built with ❤️ for traveler safety during extreme weather events.*

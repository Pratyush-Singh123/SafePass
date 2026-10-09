# SafePass — Autonomous Tourist Crisis Triage & Diplomatic Bridge

> **IIITDM Kancheepuram 24-Hour Web Development Hackathon 2026**  
> **Track: TravelTech** — *Real-Time Crisis Communication for Tourists During Extreme Weather Events*

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Edge-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 📌 Problem Statement & Context

When localized extreme weather catastrophes occur — such as severe cyclones, storm surges, or flash floods along coastal regions (e.g., Chennai, Kancheepuram, Mahabalipuram) — international tourists are acutely vulnerable:
- **Language Barriers**: Official alerts and emergency broadcasts are issued in regional languages and rarely localized.
- **Unverified Rumors & Panic**: Travelers rely on chaotic social media speculation, wander into active inundation zones, or become stranded.
- **Disconnected Families & Embassies**: Foreign consulates have no real-time way to account for their citizens, and families back home panic without verified information.

---

## 💡 The Solution: SafePass

**SafePass** transforms crisis response from passive weather dashboards into an **active, empathetic, and bidirectional crisis triage platform**:

### Key Innovations:
1. **"The Calm Voice" (Multilingual Crisis AI Companion)**
   - Prioritizes psychological panic reduction over raw metric overload.
   - Provides clear, localized, step-by-step guidance in English, French, Spanish, German, Japanese, and Tamil.
   - Built-in **Voice Audio Readout** (`SpeechSynthesis`) so stressed tourists can listen calmly instead of squinting at text.
   - Context-aware intelligence: recognizes road cutoff reports (e.g. East Coast Road / Buckingham Canal inundation) and directs travelers to high ground.

2. **Geospatial Crisis Navigator (Leaflet Engine)**
   - Live GPS tracking against real-time hazard layers (Red: Coastal Surge / Breach; Amber: Caution / Waterlogging).
   - Verified high-ground emergency shelters with occupancy meters, supply status (water, rations, first aid), and direct click-to-call.

3. **Consular Diplomatic Command Center (`/admin`)**
   - Real-time roster for foreign embassies and State Disaster Management Authorities (TNDMA).
   - Instant filtering by nationality (e.g. French citizens in Mahabalipuram).
   - One-click **Consular Advisory Broadcast** to transmit emergency SMS alerts to citizens in red zones.

4. **Zero-Friction Family Verification Bridge (`/status?token=...`)**
   - Generates a lightweight, public, read-only URL requiring zero app installations or account sign-ins for worried family members overseas.

5. **Zero-Fail Resilient Architecture**
   - Operates gracefully even with intermittent connectivity or unconfigured external APIs using intelligent client-side fallbacks.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User["Tourist (Mobile / PWA)"] --> Onboarding["1. 20s Onboarding (GPS Detect)"]
    Onboarding --> Dashboard["2. Crisis Geospatial Dashboard"]
    Dashboard --> AI["3. 'The Calm Voice' Multilingual AI"]
    Dashboard --> Map["Interactive Leaflet Map (Shelters & Hazards)"]
    Dashboard --> SOS["One-Tap Emergency SOS Dispatch"]

    Dashboard --> Sync["Sync Layer (Supabase PostgreSQL + Local Storage)"]
    Sync --> Admin["4. Consular Command Center (/admin)"]
    Sync --> Family["5. Public Family Status Link (/status?token=...)"]
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18 or later)
- npm or yarn

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/Pratyush-Singh123/SafePass.git
cd SafePass

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🌐 Live Public Deployment

- **Live Production URL**: [https://safe-pass-sand.vercel.app](https://safe-pass-sand.vercel.app)
- **GitHub Repository**: [https://github.com/Pratyush-Singh123/SafePass](https://github.com/Pratyush-Singh123/SafePass)
- **Demo Video (2–5 min)**: `[Link to YouTube / Google Drive Demo]`

---

## 👥 Hackathon Team

- **Track**: TravelTech
- **Institution**: IIITDM Kancheepuram
- **Event**: 24-Hour Web Development Hackathon 2026

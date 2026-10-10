# SafePass — 4-Member Hackathon Work Directions
**IIITDM Kancheepuram 24-Hour Web Development Hackathon**  
**Final Submission Deadline: Saturday, 10/10/2026 @ 8:30 PM (9:00 PM Buffer)**

---

## 🧭 Overview & Golden Rule for 0 Conflicts

To move at 4x speed without merge conflicts or code overwrites:
1. **Each person owns a separate branch and separate files**.
2. **Never edit files assigned to other team members**.
3. When ready, push your branch and merge via Pull Request on GitHub. Vercel automatically deploys each merge!

```
[Member 1] -> branch: feature-map        -> Owns: src/pages/Dashboard.tsx
[Member 2] -> branch: feature-chat       -> Owns: src/pages/Chat.tsx
[Member 3] -> branch: feature-consular   -> Owns: src/pages/Admin.tsx & StatusPage.tsx
[Member 4] -> branch: feature-demo-docs  -> Owns: src/pages/Onboarding.tsx, README.md & Video
```

---

## 🗺️ Direction 1: The Geonavigator (Map & Safe Route Evacuation)
- **Assignee**: Team Member 1
- **Branch**: `feature-map`
- **Files Owned**: `src/pages/Dashboard.tsx` (and any new helper components like `src/components/RouteModal.tsx`)
- **Scoring Target**: **Technical Implementation (35%)** & **Real-World Applicability (Bonus Credit)**

### What to Build:
1. **Interactive Safe Evacuation Corridor (Polyline)**:
   - When the user clicks on any shelter pin, draw a **green highlighted safe route** from the user's coordinates to the shelter, intentionally routing around red surge circles.
2. **Nearest Shelter Distance & ETA Calculator**:
   - Calculate distance in km from user GPS to each shelter.
   - Display a "Nearest Verified Shelter" card on top with walk/transit ETA: e.g. *"Mahabalipuram High-Ground Shelter — 1.8 km (~22 min walk on elevated ridge)"*.
3. **Emergency Services Floating Speed-Dial**:
   - A floating quick-dial pill at the bottom-right of the map for instant calling: `Dial 112 (Police)` | `Dial 1070 (State Disaster)` | `Dial 108 (Ambulance)`.
4. **Offline Map Cached Banner**:
   - A subtle green badge: *"✓ Offline Maps Pre-cached: Coastal Tamil Nadu Sector 4"*.

### Ready-to-Use Antigravity Prompt for Member 1:
```text
I am working on Direction 1 (Map & Safe Evacuation) for our hackathon project SafePass. 
Please edit `src/pages/Dashboard.tsx` to:
1. When any shelter pin is clicked, draw a green Leaflet Polyline representing a safe evacuation corridor from the user's location to that shelter, avoiding active red hazard zones.
2. Calculate and display the distance in km and estimated walking time to the nearest high-ground shelter directly on a highlighted shelter card.
3. Add a floating speed-dial button at the bottom of the map with one-tap telephone links to 112 (National Rescue), 1070 (Tamil Nadu Disaster Helpline), and 108 (Medical).
4. Add an "Offline Geospatial Cache Active" status badge.
Keep all existing weather fallbacks, SOS modals, and status toggle buttons intact and verify with npm run build.
```

---

## 🗣️ Direction 2: "The Calm Voice" & Multilingual AI Companion
- **Assignee**: Team Member 2
- **Branch**: `feature-chat`
- **Files Owned**: `src/pages/Chat.tsx`
- **Scoring Target**: **Innovation (20%)** & **Technical Implementation (35%)**

### What to Build:
1. **Anti-Panic Breathing Exercise (Directly targets "widespread panic")**:
   - A 1-tap button *"Start 30-Second Box Breathing"* that opens a calm, visual expanding/contracting breathing circle to help panicking foreign tourists regulate adrenaline.
2. **Structured Visual Action Cards**:
   - Instead of plain paragraphs, render structured action badge cards in the AI response:
     - 🛑 **What to Avoid**: Don't cross flooded causeways or touch electric poles.
     - 📍 **Immediate Move**: Stay on 2nd floor or higher.
     - 💧 **Rations**: Drink only bottled/boiled water.
3. **Audio Waveform Animation**:
   - When the *"Listen to Calm Voice"* text-to-speech is playing, display a pulsing soundwave visualizer to show audio guidance in action.
4. **Expanded Language Phrases**:
   - Expand quick inquiries and greetings in German, Japanese, Spanish, French, Tamil, and Hindi.

### Ready-to-Use Antigravity Prompt for Member 2:
```text
I am working on Direction 2 (The Calm Voice AI) for SafePass. 
Please enhance `src/pages/Chat.tsx` to:
1. Add an interactive "Panic Reduction / 30s Calm Breathing" button in the header that opens an animated breathing circle widget (Inhale 4s -> Hold 4s -> Exhale 4s) to directly address tourist crisis panic.
2. Format AI responses with structured visual priority cards (Immediate Action, What to Avoid, Emergency Contact).
3. When the SpeechSynthesis audio readout is playing ("Listen to Calm Voice"), display a smooth pulsing soundwave animation.
4. Add localized emergency greeting chips for German, Japanese, Spanish, French, and Tamil.
Ensure the local zero-fail crisis guidance engine and text-to-speech functionality remain rock-solid. Verify with npm run build.
```

---

## 🏛️ Direction 3: Consular Command Center & Family Tracking Link
- **Assignee**: Team Member 3
- **Branch**: `feature-consular`
- **Files Owned**: `src/pages/Admin.tsx` and `src/pages/StatusPage.tsx`
- **Scoring Target**: **Feasibility & Real-World Scalability (20%)** & **Technical Depth (35%)**

### What to Build:
1. **Consular Command Center Enhancements (`Admin.tsx`)**:
   - **Export Consular Roster as CSV / Printable PDF**: For embassy search-and-rescue teams that need offline paper rosters.
   - **"Mark as Dispatched / Rescued"**: An interactive toggle button on each citizen row to update their operational rescue status.
   - **Emergency Filter by High Danger**: Filter citizens currently located in Red Hazard zones.
2. **Family Verification Portal Enhancements (`StatusPage.tsx`)**:
   - **1-Click WhatsApp Family Alert**: A button: *"Share Status via WhatsApp"* that opens `https://wa.me/?text=...` with pre-filled status and tracking link.
   - **Timeline of Safety Check-ins**: Visual vertical timeline showing recent status updates (*"10:15 AM: Marked Safe"*, *"11:30 AM: Location confirmed near Kovalam"*).
   - **Phone Diagnostics Indicator**: Simulated device stats (*"Phone Battery: 74% | Cellular Signal: Active"*).

### Ready-to-Use Antigravity Prompt for Member 3:
```text
I am working on Direction 3 (Consular Command & Family Portal) for SafePass.
Please enhance `src/pages/Admin.tsx` and `src/pages/StatusPage.tsx`:
1. In `Admin.tsx`:
   - Add an "Export Consular Manifest (CSV)" download button for embassy field rescue teams.
   - Add a "Mark Rescue Dispatched" toggle button for each citizen on the roster.
   - Add quick-filter chips for High-Risk Red Zone citizens.
2. In `StatusPage.tsx`:
   - Add a "Share via WhatsApp" button with a pre-filled status text and live URL link.
   - Add a historical check-in timeline showing time-stamped safety check-ins.
   - Add a subtle device telemetry card (Battery: 78%, Cellular Connectivity: Moderate).
Ensure everything compiles cleanly with npm run build.
```

---

## 🎬 Direction 4: Demo Persona, Documentation & Video Production
- **Assignee**: Team Member 4 (Team Lead / DevOps)
- **Branch**: `feature-demo-docs`
- **Files Owned**: `src/pages/Onboarding.tsx`, `README.md`, Video Recording & Final Form Submission
- **Scoring Target**: **Video Presentation (15%)**, **Deployment (10%)** & **Overall Cohesion**

### What to Build & Execute:
1. **Onboarding Multi-Persona Switcher (`Onboarding.tsx`)**:
   - Add quick buttons to load 3 different demo personas:
     - 🇫🇷 **Alex Mercer (France - Mahabalipuram Coastal Zone)**
     - 🇯🇵 **Kenji Sato (Japan - Sholinganallur Tech Corridor)**
     - 🇬🇧 **Emma Watson (UK - Kovalam ECR Beachfront)**
2. **Record 3-Minute Screen Recording Video (Mandatory 15%)**:
   - Use Loom, OBS, or Zoom to record the live app on `https://safe-pass-sand.vercel.app`.
   - Follow the 3-minute script in `SAFEPASS_PLAYBOOK.md`.
   - Upload as **Unlisted on YouTube** or **Public Google Drive**.
3. **Update README.md**:
   - Paste the video link into `README.md` and verify all repo links.
4. **Submission Management**:
   - Fill and submit the official Google Form before 8:30 PM / 9:00 PM.

### Ready-to-Use Antigravity Prompt for Member 4:
```text
I am working on Direction 4 (Demo Personas & Documentation) for SafePass.
Please update `src/pages/Onboarding.tsx`:
1. Add a 3-button Demo Persona Switcher:
   - Alex Mercer (France - Mahabalipuram Coastal Zone)
   - Emma Watson (UK - Kovalam ECR Beachfront)
   - Kenji Sato (Japan - Sholinganallur)
2. Ensure clicking any persona immediately populates coordinates, name, emergency contact, and nationality.
3. Update `README.md` with demo screenshots and an embedded placeholder for our YouTube demo video.
Verify everything compiles with npm run build.
```

---

## ⚡ Git Command Sheet for Every Teammate

```bash
# 1. Clone the repo
git clone https://github.com/Pratyush-Singh123/SafePass.git
cd SafePass
npm install --legacy-peer-deps

# 2. Create your own branch
git checkout -b <your-branch-name>

# 3. Work on your files with Antigravity, then commit and push:
git add .
git commit -m "feat: complete direction improvements"
git push -u origin <your-branch-name>

# 4. Open GitHub -> Click "Compare & Pull Request" -> Merge into main!
```

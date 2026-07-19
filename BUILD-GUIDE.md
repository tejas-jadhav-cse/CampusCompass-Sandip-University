# DHRUV — Vibe-Coder Build Guide
### Complete phased document to build the mobile web app with Claude Opus (base) + Antigravity (iteration)
**Design language: "District by Zomato" — dark, electric, ticket-card energy**

---

## 0. HOW TO USE THIS DOCUMENT

1. **Phase 0–1 with Claude Opus:** paste the "🤖 PROMPT" block of each phase + the LOCKED RULES + DESIGN SYSTEM sections. Opus scaffolds the base.
2. **Phase 2+ with Antigravity:** open the repo, feed it one phase at a time. Never say "improve the app" — always paste the exact phase spec.
3. **One phase = one working, deployable app.** Never start a phase before the previous one runs on your phone.
4. After every phase: `npm run build` → deploy → test on a real Android phone → commit.

---

## 1. LOCKED RULES (paste into EVERY AI session)

```
RULES — never violate:
- Mobile/tablet web app only. Desktop shows a centered 420px phone frame with a QR code.
- ZERO paid services. No API keys except keyless free APIs (Open-Meteo). No backend, no database, no auth, no login.
- NO in-app maps. Never embed Google Maps/Leaflet/Mapbox. Outside-campus navigation = external Google Maps deep link buttons only:
  https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=driving
- All campus data lives in local JSON files bundled with the app. All user state in localStorage.
- Must work fully offline after first load (PWA, service worker).
- Languages: English, Hindi, Marathi via a simple JSON i18n dictionary.
- 3 personas chosen at first launch: New Student / Parent / Visitor (+ Current Student). Persona shapes the home screen.
- Do NOT build ERP features (attendance, fees, results, timetable of lectures, leave). This app = physical campus companion for parents & new admissions.
- Brand: DHRUV ⭐ "Always know your way." Modes: Day Zero (admission journey), Prangan (visitor tour).
- Respect prefers-reduced-motion. Semantic HTML, tap targets ≥ 44px.
```

---

## 2. TECH STACK (locked — optimized for AI-assisted speed)

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite + React 18 + TypeScript** | The stack AI tools write best; fastest vibe-coding loop |
| Styling | **Tailwind CSS** | AI-native styling; tokens configured once in `tailwind.config` |
| Animation | **Framer Motion** | District-level springs, shared-layout transitions, drag gestures — free |
| Routing | **React Router v6** (hash router) | Hash routing = works on any static host + QR anchor URLs (`#/at/library`) |
| PWA | **vite-plugin-pwa** | Manifest + service worker, offline precache, zero config pain |
| Icons | **lucide-react** | Free, consistent, tree-shaken |
| State | React Context + localStorage helpers | No Redux — too much ceremony for solo dev |
| Data | Static JSON in `/src/data/` | Edit data = edit a file, redeploy |
| i18n | Plain JSON dictionaries + tiny `t()` hook | No library needed |
| Confetti | `canvas-confetti` | Day Zero completion moment |
| QR render | `qrcode.react` | Poster kit + desktop frame QR |
| Fonts | Google Fonts: **Anton or Bebas Neue** (display) + **Inter** (body) + **Anek Devanagari** (HI/MR) | District's condensed-loud + clean-body pairing, free |
| Weather | Open-Meteo (keyless) | Free forever |
| Voice | Web Speech API | Built into Chrome/Android |
| Hosting | **Cloudflare Pages** (or GitHub Pages) | Free, fast in India, free analytics |

> **Note on the old codebase:** the existing vanilla-JS CampusCompass app becomes the **data source** (copy its locations JSON + translations) — not the codebase. Rebuilding in React+Tailwind+Framer is faster for this design bar than retrofitting 7,000 lines of vanilla JS.

---

## 3. PROJECT STRUCTURE

```
dhruv/
├── public/            # icons, og image, printable posters
├── src/
│   ├── data/
│   │   ├── locations.json      # buildings, rooms, gates, parking (migrated from CampusCompass)
│   │   ├── people.json         # faculty: building/floor/cabin/sitting-hours
│   │   ├── routes.json         # route_steps[] photo-guidance chains
│   │   ├── floors.json         # SVG floor plan metadata + room coords
│   │   ├── dayzero.json        # journey stops, docs checklist, MCQs
│   │   ├── contacts.json       # wardens, drivers, helplines (tap-to-call)
│   │   ├── transport.json      # campus bus + City Link timetables
│   │   ├── events.json
│   │   ├── faq.json            # persona-grouped Q&A
│   │   └── i18n/{en,hi,mr}.json
│   ├── components/    # ui primitives (see §6)
│   ├── screens/       # one folder per screen
│   ├── hooks/         # useLocalStorage, usePersona, useWeather, useVoiceSearch, useAlerts
│   ├── lib/           # gmaps.ts (deep links), time.ts (open-now), ics.ts, share.ts
│   └── theme/         # motion presets, tokens
└── BUILD-GUIDE.md     # this file
```

---

## 4. DESIGN SYSTEM — "DISTRICT BY ZOMATO" LANGUAGE

District's DNA: **near-black canvas, one loud electric accent, huge condensed uppercase display type, ticket-shaped cards, image-led tiles with gradient scrims, horizontal shelves, glass chips, sticky bottom CTAs, springy motion everywhere.** Recreate it exactly:

### 4.1 Color tokens (`tailwind.config`)
```js
colors: {
  ink:      '#0B0B0F',   // app background (near-black)
  panel:    '#15151C',   // cards
  panel2:   '#1E1E28',   // elevated cards
  line:     'rgba(255,255,255,0.08)',
  text:     '#F4F4F6',
  dim:      '#9C9CA8',
  star:     '#F5B942',   // DHRUV gold — primary accent (CTAs, active states)
  violet:   '#7C5CFF',   // electric secondary (District-style vibrancy)
  coral:    '#FF5A5F',   // emergency / alerts only
  teal:     '#2DD4BF',   // parent-mode accent
  success:  '#4ADE80',
}
```
- Gradients (District signature): hero scrims `from-black/80 via-black/20 to-transparent`; feature tiles get duotone gradients (`violet→star`, `teal→violet`) at 20% over photos.
- **Persona tinting:** student = star, parent = teal, visitor = slate. Only the accent changes; canvas stays ink.

### 4.2 Typography
```
Display:  Anton (or Bebas Neue), UPPERCASE, tracking-tight
          — screen titles, section headers, big numbers ("GATE 1", "12 MIN")
Body:     Inter 400/500/600
Devanagari: Anek Devanagari (swaps in for hi/mr automatically)
Scale:    display-xl 40/44 · display 28/32 · title 20 · body 15 · caption 12.5
```
District look = **oversized uppercase display headers** ("WHERE TO?", "DAY ZERO", "REACH CAMPUS") with tiny dim eyebrows above them.

### 4.3 Shape & surface
- Radius: cards `rounded-2xl` (20px), sheets `rounded-t-3xl` (28px), chips `rounded-full`.
- **Ticket cards** (Day Zero stops, event cards): notched edges — two circular cutouts mid-edge (CSS mask), dashed divider between "stub" and body. This is the signature District element; build it once as `<TicketCard>`.
- Glass chips: `bg-white/8 backdrop-blur-md border border-white/10`.
- Elevation via subtle borders + soft glow on accent elements (`shadow-[0_0_24px_-8px]` in accent), not drop shadows.

### 4.4 Motion presets (`theme/motion.ts`)
```ts
export const spring = { type: 'spring', stiffness: 380, damping: 30 };   // default
export const springSoft = { type: 'spring', stiffness: 220, damping: 26 }; // sheets
export const stagger = { staggerChildren: 0.05, delayChildren: 0.05 };
```
- **Screen transitions:** shared-layout (`layoutId`) card→detail morphs; otherwise slide-up + fade (District's push feel).
- **Lists:** staggered rise-in (y:16→0, opacity).
- **Shelves:** horizontal scroll-snap (`snap-x snap-mandatory`), peek of next card (85% width cards).
- **Bottom sheets:** Framer `drag="y"` dismiss, springSoft.
- **Sticky CTA bar:** slides up after 300ms on detail screens (District's "Book now" bar) — here it's "Navigate →" / "Call".
- **Press feedback:** `whileTap={{ scale: 0.97 }}` on every card; `navigator.vibrate(10)` on primary actions.
- **Route progress line:** SVG `stroke-dashoffset` draw-on as steps complete; DHRUV star travels along it.
- **Skeletons:** shimmer sweep on panel color.
- **Confetti:** Day Zero completion only — keep it rare, keep it special.

### 4.5 Layout skeleton
```
┌─────────────────────────────┐
│ ⭐ DHRUV      [persona] 🚨  │ ← slim top bar, emergency always visible (coral dot-pulse)
│                             │
│ EYEBROW                     │
│ BIG DISPLAY TITLE           │
│ [🔍 Search + 🎙 voice]      │ ← glass field
│ ‹ horizontal shelf ›        │ ← image tiles w/ gradient scrims
│ [ticket card]               │
│ [list rows]                 │
└─────────────────────────────┘
│ Home · Explore · ⭐ · Go · More │ ← glass bottom tab bar, center star elevated
```
Desktop (>820px): ink page, centered 420px phone frame, "Best on your phone" + live QR.

---

## 5. DATA MODELS (define in Phase 1, fill over time)

```jsonc
// locations.json (extend existing CampusCompass shape)
{ "id":"admission-cell", "name":{"en":"Admission Cell","hi":"…","mr":"…"},
  "category":"admission_cell", "photo":"/img/admission.webp",
  "gmaps":{"lat":19.96,"lng":73.71}, "timings":[{"days":"Mon-Sat","open":"09:00","close":"17:00"}],
  "route_id":"gate1-to-admission", "floor_id":"admin-g", "tags":["fees","documents"] }

// routes.json — photo walking guidance (no maps!)
{ "id":"gate1-to-admission", "from":"gate-1", "to":"admission-cell", "total_m":350, "mins":5,
  "steps":[{ "photo":"/img/steps/g1-01.webp", "text":{"en":"Walk straight past the fountain"}, "m":150 }] }

// dayzero.json — the flagship
{ "journeys":[{ "id":"admission-day", "name":"DAY ZERO",
  "stops":[{ "order":1, "location_id":"admission-cell", "title":{"en":"Admission Office"},
    "what_happens":{"en":"…"}, "docs_needed":["10th marksheet","2 photos"], "est_mins":30,
    "quiz":[{ "q":{"en":"How many photocopies for fee counter?"}, "options":["1","2","3"], "answer":1 }] }] }] }

// people.json
{ "id":"prof-sharma", "name":"Prof. Sharma", "dept":"CSE", "building_id":"b-block",
  "floor":2, "cabin":"C-214", "sitting_hours":"Mon–Fri 10–1, 3–5", "phone":null }

// contacts.json → groups: hostel_wardens | bus_drivers | helplines | medical | security
// alerts.json (hosted at site root, polled): { "active": true, "type":"weather", "title":{}, "body":{}, "issued_at":"" }
```

---

## 6. COMPONENT LIBRARY (build once in Phase 1, reuse everywhere)

`<Screen>` (title + eyebrow + transition wrapper) · `<TicketCard>` · `<Tile>` (image + scrim + label) · `<Shelf>` (snap scroll) · `<GlassChip>` · `<SearchBar>` (with mic) · `<BottomSheet>` · `<StickyCTA>` · `<TabBar>` · `<EmergencyButton>` · `<RouteStepper>` (photo steps + progress line) · `<ContactRow>` (call/WhatsApp) · `<SectionHeader>` · `<Skeleton>` · `<LangSwitch>` · `<PersonaChip>`

---

## 7. BUILD PHASES

### ⚡ PHASE 0 — Scaffold & Design Shell (Claude Opus, 1 session)
**Deliver:** running app with theme, tab bar, desktop phone-frame, PWA installable, deployed.

> **🤖 PROMPT:** "Create a Vite + React + TypeScript + Tailwind + Framer Motion PWA called DHRUV. [paste LOCKED RULES + §4 DESIGN SYSTEM]. Build: tailwind config with the exact tokens, Google Fonts loading (Anton, Inter, Anek Devanagari), HashRouter with routes /home /explore /go /more, glass bottom TabBar with elevated center star button, slim top bar with DHRUV wordmark + emergency button placeholder, desktop >820px phone-frame wrapper with QR placeholder, vite-plugin-pwa with dark theme manifest, and the motion presets file. Every screen is a placeholder using <Screen> with staggered entrance. No maps, no backend."

**✅ Test:** installs as PWA on Android, tabs animate, desktop shows frame.

---

### ⚡ PHASE 1 — Onboarding, Personas & Home (Claude Opus)
**Deliver:** first-launch question flow + persona-shaped home screens.

- Full-screen animated onboarding: Who are you? → What brings you today? → Language. Big tappable cards, spring transitions, answers → localStorage (`usePersona`).
- Home per persona (District-style: display header + shelf of image tiles + ticket card):
  - **New Student:** "DAY ZERO" hero ticket + Reach Campus + Explore shelf
  - **Parent (teal tint):** 4 big cards only — Reach Campus · Important Contacts · Hostel Info · Emergency
  - **Visitor:** Prangan tour + directory + Reach Campus
  - **Current Student:** buses, weather, directory, classroom finder
- Persona switcher chip in top bar. i18n hook `t()` wired with en/hi/mr dictionaries.
- Weather pill in header via Open-Meteo (cache last response for offline).

**✅ Test:** clear site data → onboarding runs once; each persona sees a different home; language switches everything.

---

### ⚡ PHASE 2 — Directory, Search & Reach Campus (Antigravity)
**Deliver:** the useful core.

- Migrate CampusCompass `locations.json`. Explore screen: search + category chips (glass), results as image rows, detail as shared-layout morph → photo header + gradient scrim, timings with client-computed "Open now / Opens 9 AM", sticky CTA "Navigate on Google Maps ↗" (deep link).
- **Voice search:** mic in SearchBar, Web Speech API, `lang` follows app language, graceful hide if unsupported.
- **Reach Campus screen:** driving/transit deep-link chips, Nashik CBS fare guide card, "show driver" card (Marathi address, tap → fullscreen big text), City Link timetable (from transport.json, "next bus" computed client-side).
- **Contacts hub:** grouped ContactRows, tap-to-call `tel:` + WhatsApp `wa.me` buttons.
- **Emergency:** button live — coral bottom sheet: call security/ambulance/anti-ragging + "Share my location on WhatsApp" (Geolocation → `https://maps.google.com/?q=lat,lng` prefilled in wa.me).

**✅ Test on phone:** calls launch, deep links open Google Maps app, voice search works in Hindi.

---

### ⚡ PHASE 3 — Route Cards: In-Campus Walking Guidance (Antigravity)
**Deliver:** the no-map navigation engine.

- `<RouteStepper>`: photo step cards, swipe/next through steps, SVG progress line draws on, star travels, `vibrate(10)` per step, "≈350m · 5 min" header.
- Wire routes.json to location detail ("Walking route from Gate 1 →").
- **Share route as image:** canvas-render steps into one tall image → Web Share API → WhatsApp.
- **Parking:** lot directory + "Remember where I parked" (save lot + photo + note to localStorage; retrieve with route back).
- Shoot & compress (WebP via squoosh) real photos for top 5 routes: Gate→Admission, Gate→Fee counter, Gate→Hostels, Gate→Main academic block, parking↔gates.

**✅ Test:** a friend who's never visited follows Gate 1→Admission using only the phone.

---

### ⚡ PHASE 4 — DAY ZERO: The Flagship (Antigravity, biggest phase)
**Deliver:** the animated, tracked admission-day journey.

- Journey overview: vertical ticket-chain of stops connected by a progress path; DHRUV star animates between them.
- Each stop = `<TicketCard>`: what happens here · docs needed at THIS counter · est. time · route button (opens Phase-3 stepper) · "Done ✓" (springy check, progress saved to localStorage, timestamps recorded).
- **Between stops:** MCQ quiz cards from dayzero.json (District-style bold option chips, correct = green flip).
- **Document Checklist screen:** per-program checklist done at home; "2 photocopies" warnings; shareable to WhatsApp as text.
- **Completion:** canvas-confetti + Day Zero badge + share card image ("Completed admission in 2h 10m ⭐").
- **Plan-My-Visit (parents):** pick arrival time → client-generated itinerary with route links.
- Counter busy-hours static bars on relevant stops.

**✅ Test:** full dry-run walkthrough on campus, airplane mode ON (must work offline).

---

### ⚡ PHASE 5 — Indoor Navigation + One-QR (Antigravity)
**Deliver:** floors, rooms, people, QR anchors.

- Trace Admission block + 2 more buildings as SVG floor plans (Figma → export). Pan/zoom via Framer drag; tap room → highlight pulse + step directions sheet ("Take stairs to 2nd floor, Room 304 is third on the right").
- **Classroom search:** "304" → building/floor/steps. **Navigate-to-person:** people.json → cabin route + sitting-hours chip ("Usually available Mon–Fri 10–1").
- **QR anchors:** routes like `#/at/library-entrance` set current position and open directions from there. **Poster Kit screen** (`/posters`): renders print-ready A5 posters (QR + building name + "Scan for directions") for every anchor — print, laminate, stick.
- **Alerts:** poll `/alerts.json` on launch/focus; active alert → full-screen coral takeover with "I've seen this ✓" (ack in localStorage).
- **Kiosk mode:** `?kiosk=1` → resets to onboarding after 60s idle.

**✅ Test:** print one QR, stick at library door, scan with a fresh phone → directions start from there.

---

### ⚡ PHASE 6 — Polish, Content & Launch (Antigravity)
- Events (venue route + client-side .ics "Add to calendar"), FAQ (persona-grouped, voice-searchable), Nearby Essentials for parents (ATMs/lodges/medical — gmaps link buttons), Hostel Move-In Pack checklist, "I've Reached Safely" WhatsApp button, Campus Photo Spots, printable one-page PDF guide (jsPDF).
- Perf pass: lazy-load screens, `loading="lazy"` images, Lighthouse PWA ≥ 90, bundle < 300KB gz (fonts subset).
- A11y pass: reduced-motion variants, focus rings, contrast check on dim text.
- Content fill: all HI/MR translations, all photos, real contact numbers (verified!).
- Deploy to Cloudflare Pages + custom domain if desired; generate the **gate billboard QR** → this is the Chairman's "One QR."

**🚀 Launch:** admission season. Posters at gate + admission cell + hostels.

---

## 8. VIBE-CODING TIPS FOR THIS PROJECT

- **Always paste §1 + §4 with every prompt.** Design drift is the #1 failure mode; the tokens are your contract.
- Ask Antigravity for **one component or one screen per request**, referencing components from §6 by name.
- When output looks "Bootstrap-y," reply: *"Restyle to the District spec: ink background, Anton uppercase display, ticket cards with notches, glass chips, spring motion — see design system."*
- Keep all copy in i18n JSONs from day one — retrofitting translations is misery.
- Commit after every working phase; tag `phase-1`, `phase-2`… so Antigravity experiments can't destroy a milestone.
- Real-phone test > browser devtools. Cheap Android, campus 4G — that's your user.

**Build order truth:** Phases 0–2 make it *useful*. Phase 3 makes it *unique*. Phase 4 makes it *famous*. Phases 5–6 make it *the Chairman's One-QR story*.

⭐ *DHRUV — Always know your way.*

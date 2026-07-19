# DHRUV — Product Description & Implementation Plan (v2, Solo-Founder Edition)

**Brand:** DHRUV (ध्रुव — the Pole Star) · Tagline: *"Always know your way."*
**Naming architecture (using your shortlist):**
- **DHRUV** = the app/brand (the star that guides)
- **Day Zero** = the guided new-admission journey mode (your killer feature)
- **Prangan** (प्रांगण — courtyard/campus) = the visitor/tour mode
- **Tejas** = reserved for the voice assistant if/when you add one

**Built by:** One person (founder = designer = developer). **Budget:** ₹0. **Stack:** Static PWA, no backend, no paid APIs.
**Primary users:** Parents and new-admission students. Secondary: visitors.
**Explicitly NOT building:** anything the ERP already does (attendance, fees, results, LMS, timetables of lectures, leave). DHRUV is the *physical campus companion*, not an ERP.

---

## 1. Product Description (revised)

DHRUV is a mobile/tablet web app (PWA) that answers one question perfectly:

> **"I've never been here before. Where do I go, and what do I do next?"**

It is not a map app. It shows **no maps**. Instead it gives:
- **One-tap Google Maps deep links** for anything outside walking distance (city → gate)
- **Photo-and-text walking guidance** inside campus ("From Gate 1, walk straight 200m, the red building on your left is Admission Cell")
- **Floor-by-floor indoor directions** as interactive floor plans + step cards
- **Day Zero** — an animated, tracked, step-by-step admission-day journey

Everything works offline, loads in under 2 seconds on a cheap Android phone, and speaks English, Hindi, and Marathi.

### Why this wins
Every competitor (and every ERP) serves *existing* students. Nobody serves the two most anxious people on campus: **the 17-year-old on admission day and the parent standing next to them.** DHRUV owns that moment. If you win Day Zero, you win four years of trust.

---

## 2. First-Launch Experience — "Who are you?"

Before anything else, the app asks 2–3 quick questions (full-screen, animated cards, one tap each):

```
Screen 1:  Who are you?
           🎓 New Student   👨‍👩‍👧 Parent   🚶 Visitor   📚 Current Student

Screen 2 (if New Student/Parent):  What brings you today?
           📝 Admission   🏠 Hostel move-in   🎪 Event   👀 Just exploring

Screen 3:  Language?  English · हिंदी · मराठी
```

Answers are stored in localStorage and shape the entire app:

| Persona | Home screen becomes |
|---|---|
| **New Student (Admission)** | Day Zero journey card front and center |
| **Parent** | Parent Mode: big text, contacts, "reach campus" button, hostel info |
| **Visitor** | Prangan mode: directory + tour + reach-campus only |
| **Current Student** | Bus timetable, weather, directory, classroom finder |

A persona switcher lives in the header (small avatar chip) — no lock-in, no login, ever.

---

## 3. Feature Specification (final scope)

### 3.1 Navigation

**N1. Reach Campus (city → gate)**
- Big card: "Navigate to Campus Gate" → opens Google Maps directions with **current location as origin** and campus gate pinned as destination.
- Zero-cost method: a plain URL, no API key needed:
  `https://www.google.com/maps/dir/?api=1&destination=19.9xxx,73.7xxx&travelmode=driving`
  (Google auto-uses the user's current location as origin. Add a second chip for `travelmode=transit`.)
- Also show static helper card: "Coming from Nashik CBS? ~14 km, ~40 min by auto (~₹250–300) or City Link bus route below."

**N2. In-campus walking guidance (no map)**
- Every building/venue page has a **Route Card**: ordered steps, each with a photo + one instruction line + distance.
  Example: `Gate 1 → [photo] Walk straight past the fountain (150m) → [photo] Turn left at Library → [photo] Admission Cell, ground floor.`
- Data model: add `route_steps[]` to each location in your existing JSON dataset. Photos you shoot yourself on one weekend walk.

**N3. Indoor navigation (floor-by-floor)**
- Digitize floor plans as **SVG floor maps** (trace them yourself in Figma/Inkscape — free). Tap a room → it highlights + step directions appear ("Take stairs to 2nd floor, Room 304 is third on the right").
- **QR anchors:** print static QR codes at entrances/stairwells (generate free with any QR lib). Each QR encodes a URL like `dhruv.app/#/at/library-entrance` → app instantly knows where the user is and starts directions from that point. Works day one, costs only paper.

**N4. Navigate to a Person**
- Directory entries for faculty include: building, floor, cabin number → tap = indoor route to the cabin.
- **Free "availability" without a backend:** show the person's *published sitting hours* ("Usually in cabin: Mon–Fri 10–1, 3–5") from the dataset. Label it "timings" not "live" — honest and still unprecedented. (True live status needs a server; park it.)

**N5. Day Zero — the guided admission journey (flagship)**
- New student picks "Admission" → gets an **animated multi-stop journey**:
  `① Admission Office → ② Document Verification → ③ Fee Counter → ④ Department → ⑤ Hostel Desk`
- Each stop = a card with: route (photos), what happens here, **documents needed at this counter**, expected time, and a "Done ✓" button.
- A progress bar/stepper animates as they advance. Between stops, show **pre-trained Q&A and MCQs**: "Which documents does the fee counter need? (tap to reveal)" — turns dead walking time into orientation.
- **Tracking (free):** all progress in localStorage; a shareable summary card at the end ("Completed admission in 2h 10m ✓"). No server tracking — that's honest *and* private, a feature for parents.
- Finish = confetti + **Day Zero Badge** + "Show this screen at the hostel desk."

**N6. Parking — spot finder + remember**
- Static parking directory: which gate → which lot, for cars/bikes/visitors.
- **"Remember where I parked":** one tap saves lot + optional photo + note to localStorage; retrieve later with the route card back to that lot. Zero backend.

**N7. City Link timetable**
- Static, hand-entered timetable of Nashik City Link routes serving the campus (route no., stops, first/last bus, frequency). Searchable, offline. Update it like the rest of the dataset.

**N8. Classroom navigation**
- Search "Room 304" → building + floor + SVG highlight + steps. Same engine as N3; classrooms are just rooms in the dataset.

### 3.2 Student Life
- **S1. Campus bus timetable** — static dataset, filter by route/stop, "next departure" computed client-side from device clock.
- **S2. Campus weather** — free, keyless API: **Open-Meteo** (`api.open-meteo.com`) with campus lat/lon. Cache last response for offline. Show on home header: "28° ☀️ — good day to walk."
- **S3. Emergency notify** — see 3.6.

### 3.3 Parents (Parent Mode)
- **P1.** Simplified interface chosen at first launch: larger type, fewer cards, Marathi/Hindi prioritized.
- **P2. Contacts hub:** Hostel wardens, bus drivers, admission helpline, security, medical — every entry has **tap-to-call** and **tap-to-WhatsApp** buttons. This one screen is the parent killer feature.
- Parent home = 4 cards max: *Reach Campus · Important Contacts · Hostel Info · Emergency.*

### 3.4 Visitors (Prangan mode)
- Directory + walking tour + reach-campus. No persona data stored beyond the mode choice. Self-guided **photo tour**: 8–10 landmark cards in a swipeable story format.

### 3.5 Events
- Each event card shows **venue with route card** ("Seminar Hall B — 5 min from Gate 2") + Add-to-calendar (.ics file generated client-side, free).

### 3.6 Emergency & Alerts
- **E1. Emergency button pinned at top of every screen** (red, always visible). Opens: tap-to-call Security / Ambulance / Anti-ragging helpline + "share my location" (opens WhatsApp with a Google Maps link of current coordinates — `https://maps.google.com/?q=lat,lng` from the free browser Geolocation API).
- **E2. Mass alert broadcast (zero-cost design):** host an `alerts.json` file on your free static host (GitHub Pages/Cloudflare Pages). App polls it on every launch/focus. If an active alert exists → full-screen takeover banner (weather/incident/lockdown) with an "I've seen this ✓" acknowledgement (stored locally). You update alerts by editing one JSON file from your phone via GitHub.
  *Note: true push notifications while the app is closed require a push server. Later, this can be done free with Cloudflare Workers (free tier) + Web Push VAPID — flagged as Phase 4, not MVP.*

### 3.7 Directory & Departments (polish existing)
- Timings on every entry, "Open now / Closed — opens 9 AM" computed client-side, categories you already have, plus tap-to-call everywhere.

### 3.8 Voice search
- **Web Speech API** — built into Chrome/Android for free. Mic icon inside the search field; speaks EN/HI/MR (`lang` set per app language). Falls back silently to typing where unsupported (iOS partial). Zero cost, feels magical.

---

## 4. NEW Feature Suggestions (in-scope, free, parent/admission-first — not in ERP)

1. **Admission Document Checklist** — interactive checklist (10th marksheet, TC, photos, caste cert...) per program; check items off at home *before* leaving; warns "carry 2 photocopies." Lives inside Day Zero. *Prevents the #1 admission-day disaster.*
2. **Plan-My-Visit** — parent picks arrival time → app generates a suggested itinerary ("9:00 reach gate · 9:10 admission cell · 11:00 hostel tour · 12:30 canteen lunch") with route cards, all client-side.
3. **Counter Busy-Hours Bars** — Google-style "usually busy at 11 AM" static bars per counter, from asking staff once. Steers families to quiet hours; costs nothing.
4. **Getting-Here Fare Guide** — static card: auto/taxi fare ranges from CBS, railway station, airport; City Link route numbers; "say 'Sandip University, Mahiravani' to the driver" in Marathi script to show the auto driver.
5. **Nearby Essentials for Parents** — curated static list: ATMs, medical stores, hotels/lodges near campus for overnight-staying parents, with Google Maps link buttons.
6. **Hostel Move-In Pack** — "What to bring" packing checklist (bucket, lock, bedsheet...), what's provided vs. not, move-in day route card, warden contact. Shareable to WhatsApp as text.
7. **"I've Reached Safely" button** — one tap opens WhatsApp pre-filled: "Reached campus safely 📍[map link]" to a saved family number. Peace of mind with zero infrastructure.
8. **Offline Route Cards / Share as Image** — any route card exports as a single image (canvas-rendered, free) to WhatsApp — parents forward it to the uncle who's driving.
9. **Printable One-Page Campus Guide (PDF)** — client-side generated PDF with gate map sketch, key contacts, and QR to the app. Admission office can print stacks of them; every sheet advertises DHRUV.
10. **Department Meet Pages** — photo of HOD + labs + "what this department is known for" — the page families open while waiting at counters. Doubles as marketing for admissions.
11. **FAQ trained from real questions** — "Is hostel food veg? Can parents stay overnight? Where do girls' hostel visitors wait?" — grouped by persona, searchable, voice-searchable. You collect questions during one admission season and it becomes a moat.
12. **Campus Photo Spots** — 5 best photo locations for the proud-parent photo. Pure delight, costs one evening of photography.
13. **QR Poster Kit** — an in-app admin page that generates printable "Scan for directions" QR posters for every building (QR + building name, print-ready). This is how the One-QR vision physically spreads across 250 acres for the cost of paper.
14. **Kiosk Mode** — a `?kiosk=1` URL that auto-resets to the persona question after 60s idle — run the same app on a cheap tablet at the gate/admission cell.

---

## 5. UI/UX — Distinct, Animated, Mobile/Tab-Only

**Design stance:** *"Calm star-lit guide"* — dark-first UI (indigo-night background, one warm star-gold accent `#F5B942`), DHRUV star as the north-anchor motif. Distinctly not-Material, not-Bootstrap.

- **Mobile/tablet only by design:** max-width container (~820px); on desktop show a centered phone-frame with a "best on mobile + QR to open on phone" panel. That's a statement, not a limitation.
- **Motion system (all free, browser-native):**
  - **View Transitions API** for page-to-page morphs (card grows into detail page) — Chrome/Android support is exactly your audience; graceful fallback elsewhere.
  - CSS spring-like easings (`cubic-bezier(0.34, 1.56, 0.64, 1)`) for card entrances; staggered list reveals via `animation-delay`.
  - **Route cards animate like a journey:** progress line draws itself (SVG `stroke-dashoffset`), each step card slides in as you tap "next."
  - Day Zero stepper: star travels along the progress path between stops.
  - Micro-haptics via `navigator.vibrate()` on step-complete (Android).
  - Bottom sheets (drag-to-dismiss) for details — you already have swipe gestures; keep them.
  - Respect `prefers-reduced-motion` throughout.
- **Persona-tinted themes:** subtle accent shift — student = star-gold, parent = calm teal, visitor = neutral slate. Instant "this app knows me."
- **Typography:** one variable font (e.g., free *Anek Devanagari* + *Inter* pairing — covers EN/HI/MR beautifully). Big confident numerals for timings.

---

## 6. Zero-Cost Tech Stack (locked)

| Need | Free solution |
|---|---|
| Hosting | GitHub Pages or Cloudflare Pages (free, custom domain optional) |
| App | Your existing static PWA (HTML/CSS/JS, service worker) — evolve, don't rewrite |
| Maps | None in-app. Google Maps **deep links** only (no API key) |
| Weather | Open-Meteo API (keyless, free) |
| Voice | Web Speech API (built into browser) |
| Storage | localStorage (persona, progress, parking, checklists) |
| Alerts | `alerts.json` polled from static host |
| QR generation | `qrcode` JS lib (MIT) or any free generator, done at build time |
| PDF/image export | Client-side canvas / `jsPDF` (MIT) |
| Floor plans | Self-traced SVGs (Figma/Inkscape free) |
| Photos | Your phone camera + free `squoosh.app` compression to WebP |
| Analytics | Keep local-only (as you already do) — a privacy feature |

**Hard rule:** no feature enters the roadmap if it needs a server you'd have to pay for or maintain.

---

## 7. Implementation Roadmap (one person, evenings/weekends)

**Phase 1 — Reframe (Weeks 1–2)**
Persona onboarding flow · Parent Mode home · Emergency button + contacts hub · Reach-Campus deep links + fare guide · rebrand shell to DHRUV (name, star logo, dark theme).

**Phase 2 — Guidance Engine (Weeks 3–6)**
`route_steps[]` data model · photo walk of campus (2 weekends of shooting) · Route Cards UI with animations · directory timings polish · voice search · weather.

**Phase 3 — Day Zero (Weeks 7–10)** ← the flagship
Admission journey stepper · document checklist · MCQ/Q&A content (write with admission-office help) · badge + share card · Plan-My-Visit · busy-hours bars. **Ship before next admission season — this is the deadline that matters.**

**Phase 4 — Indoor + One-QR (Weeks 11–16)**
SVG floor plans for top 3 buildings (Admission block first!) · QR anchor system + poster kit · classroom & person navigation · parking remember · City Link + campus bus timetables · alerts.json system · kiosk mode.

**Later (only if adopted):** Web Push via Cloudflare Workers free tier · more buildings' floor plans · Tejas voice assistant · Prangan story-tour v2.

**Sequencing logic:** every phase ships something a parent or fresher feels *that week*. Day Zero lands before admission season. Indoor nav starts with the one building every new family enters: the Admission block.

---

## 8. Success Metrics (measurable without a backend)
- QR poster scans (each QR has `#/at/...` — count via localStorage-consenting local stats or simply Cloudflare Pages' free aggregate analytics)
- Day Zero completions and average journey time
- Admission office anecdote metric: "families stopped asking where the fee counter is"
- App installs (PWA install events, logged locally)

---

*DHRUV — Always know your way.* ⭐

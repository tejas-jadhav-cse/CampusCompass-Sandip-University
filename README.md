# CampusCompass — Sandip University

A single-file, offline-first campus navigation web app for Sandip University.

## What this project contains

- `index.html` — The full single-file app (HTML, CSS, JS) containing the embedded dataset.
- `manifest.json` — Web App Manifest for PWA install.
- `sw.js` — Service worker that caches the app shell for offline use.
- `robots.txt` — Basic robots rules.
- `icon-192.png`, `icon-512.png` — App icons (used by manifest and PWA).
- `sandip_university_campus.json` (optional) — External dataset (app prefers this if present).

## Features (by stage)

- Stage 1: Mobile-first UI, offline fallback using embedded JSON, simple search and filters.
- Stage 2: PWA features: `manifest.json`, `sw.js`, install banners and iOS tip.
- Stage 3: Multi-language support (English, Hindi, Marathi), theme toggle (dark/light).
- Stage 4: Performance and architecture: virtualized list, debounced search, scoped icon hydration.
- Stage 5: Final features: favorites, recent searches, Near Me sort (Haversine), share fallback, gestures (swipe-to-reveal, modal swipe-down), SEO meta tags.
- Stage 6: Polishing and hardening: robust data handling, preferences migration, reset app data, privacy note, accessibility improvements, security hardening (noopener), SW cache bump.

## Setup / Run

This is a static app. To run locally, serve the folder over HTTP (recommended) or open `index.html` in a browser (embedded dataset will still work).

Quick static server using Python:

```bash
# Python 3
python -m http.server 8000
# then visit http://localhost:8000
```

## How to update the dataset

1. Edit the JSON object inside the `<script id="campusDataEmbedded">` block in `index.html`. Keep the shape:

```json
{
	"institution": "...",
	"dataset": "...",
	"version": "1.1",
	"total_locations": 123,
	"locations": [ /* array of location objects */ ]
}
```

2. Optionally provide a file `sandip_university_campus.json` alongside the hosted files — the app will prefer the external file if present but falls back to the embedded copy.

## Adding a language

- Add a top-level language object to the `TRANSLATIONS` map in `index.html` and include the language code in `SUPPORTED_LANGS`.
- Provide translations for all UI keys used.

## Deploying

- Host as static files on any static hosting provider (GitHub Pages, Netlify, Vercel, S3 + CloudFront).
- Ensure `sw.js` is served from the root so the service worker scope covers the app.
- When making non-trivial UI or shell updates, bump `CACHE_VERSION` in `sw.js` to force clients to refresh their caches.

## Privacy & Security

- All analytics (search counts, view counts) are stored locally in `localStorage` and never transmitted.
- Geolocation is only used locally (for sorting) and never sent anywhere.
- External navigation uses `rel="noopener noreferrer"` to avoid exposing window.opener.

## Known limitations

- The app uses CDN-hosted Tailwind and Lucide icons for convenience; for production building consider bundling or self-hosting to avoid CDN runtime warnings.
- Some gesture behaviors should be manually tested on physical devices (iOS Safari, Android Chrome) to validate touch sensitivity and install flows.

## Quick checklist before shipping

- Test on physical iOS and Android devices for gestures and install flows.
- Replace placeholder OG image with an actual campus photo and update canonical URL.
- Optionally build and self-host CSS/assets for production performance.

---

If you want, I can (a) create a small release bundle, (b) run more automated tests, or (c) prepare a concise release note for campus admins. Which would you prefer?
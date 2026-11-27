# Technology Literacy Curriculum (TLC)

## Module 9: Progressive Web Apps — Turning a Website Into an App

**Status:** Draft v1 — built from live hands-on sessions, 2025-2026
**Track:** 3 — Modern Web App Features
**Format:** Guided lab using a real deployed site (retire-time.com)
**Prerequisite:** Module 4 (Frontend Fundamentals), Module 3 (Git & GitHub)
**Leads into:** Module 10 — Web Push Notifications

**Sequencing note:** PWAs are taught here, after authentication and databases, because the most useful PWA features (installable icon, push notifications) only make sense when there's actual per-user state to protect and surface. A PWA built on top of a static page is a curiosity; one built on top of a real app is a product.

## Why This Module Exists

"Add to Home Screen" sounds simple. It isn't. The gap between a website that *can* be added to the home screen and one that *actually works* as an app — with the right icon, the right name, the right offline behavior — involves a surprising number of platform-specific requirements that are poorly documented and inconsistently implemented between iOS and Android.

This module is built directly from the experience of getting retire-time.com's icon to appear correctly on an iPhone home screen. That process went through four distinct iterations before it worked:

1. **Placeholder "R" letter** — the browser's auto-generated fallback when no icon is specified at all
2. **SVG-rendered hills icon, transparent background** — icon generated correctly but transparent PNG shows as white on iOS home screen
3. **Added `apple-touch-icon` link tag** — correct tag, but pointing at the wrong file, so still showing "R"
4. **Solid-background PNG, no internal rounded corners** — finally correct

The lesson in that progression is the actual curriculum: iOS and Android have *different, incompatible* icon systems, and understanding why is more useful than memorizing the fix.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain what a Progressive Web App is and what it adds over a regular website (installability, offline capability, app-like UX)
2. Explain what a **Web App Manifest** is, what fields it requires, and what each field controls
3. Explain what a **Service Worker** is and why it runs independently of the page (the page may be closed)
4. Explain the critical **iOS vs. Android difference**: iOS Safari ignores Web App Manifest icons entirely and only reads `apple-touch-icon`
5. Explain why **transparent PNG backgrounds** render as white on iOS and why solid backgrounds are required
6. Explain why internal rounded corners (`rx` on an SVG `rect`) cause double-rounding on iOS and should be removed
7. Explain why **relative paths** in `start_url` and `scope` are safer than absolute paths for multi-domain deployments
8. Explain how to serve **multiple distinct PWAs** from the same domain (main app vs. admin app)
9. Use Playwright/Chromium to generate PWA icons server-side from an SVG

## Core Concepts

### What a PWA Adds

A Progressive Web App is a website that declares, via a few standard files, that it wants to be treated more like a native app. What this actually enables:

- **Installability**: the browser offers an "Add to Home Screen" prompt; on desktop, Chrome shows an install button in the address bar
- **Standalone display mode**: when launched from the home screen, the app opens without browser chrome (no address bar, no tabs) — it looks like a native app
- **Offline capability**: a service worker can cache assets and serve them without a network connection
- **Push notifications**: a service worker can receive and display notifications even when the page is closed (covered in Module 10)

None of this requires any special server infrastructure. It's declared in two files: a manifest and a service worker.

### The Web App Manifest

The manifest is a JSON file (typically `manifest.json`) that tells the browser and OS what this app is called, what it looks like, and how to open it.

```json
{
  "name": "Retire Time",
  "short_name": "RetireTime",
  "description": "Personal financial planning and portfolio tracker",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#0f1117",
  "theme_color": "#10b981",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

Key fields:
- `start_url` and `scope` use relative paths (`./`) so the app works identically on `username.github.io/repo` and `retire-time.com`
- `display: "standalone"` removes browser chrome when launched from home screen
- `background_color` fills the splash screen before the app loads
- `theme_color` colors the status bar on Android

The manifest is linked in each HTML page's `<head>`:
```html
<link rel="manifest" href="manifest.json">
```

### The iOS Exception — Why `apple-touch-icon` Is Not Optional

iOS Safari has never adopted the Web App Manifest standard for icons. When someone adds a site to their iOS home screen, Safari reads *only* the `apple-touch-icon` link tag — the manifest `icons` array is completely ignored.

This means two separate declarations are required:

```html
<!-- Android, Chrome, Edge: reads manifest.json icons -->
<link rel="manifest" href="manifest.json">

<!-- iOS Safari: ignores the manifest, reads only this -->
<link rel="apple-touch-icon" href="icons/icon-192.png">
```

If only the manifest is present, iOS shows whatever fallback it generates — typically the first letter of the domain in a plain color, or a screenshot thumbnail of the page.

### The Transparent PNG Problem

When generating icons programmatically, a transparent background seems like the right choice — "let the OS decide the background color." On Android, this works (the OS applies its own shape mask and background). On iOS, transparent areas in an `apple-touch-icon` are rendered as **white**, not as whatever the system background color is.

The fix is a solid background color in the icon itself. For retire-time's main icon (a green hills landscape), the background color is `#eef4fb` — a light blue-grey that matches the design. For the admin icon, it's the app's dark background `#0f1117`.

### The Double-Rounding Problem

iOS applies its own rounded corners (the iOS "squircle" shape) to all home screen icons. If the icon SVG also has rounded corners (`rx="18"` on the background `rect`), the result is double-rounding — squared-off rounded corners inside the iOS rounded corners.

The fix: remove all internal `rx` values from the icon SVG. Let iOS apply its own rounding exclusively.

### Multiple PWAs from One Domain

Each HTML page can point at a different manifest, enabling multiple distinct installable apps from the same domain. Retire-time ships two:

- `manifest.json` → main RetireTime app (green hills icon, light background)
- `admin-manifest.json` → admin console app (dark background, green "A" icon)

Each has its own `apple-touch-icon` link on its respective HTML page. iOS and Android treat them as separate installable apps.

### Generating Icons with Playwright

Generating icons as PNGs from SVG source requires a headless browser (native SVG-to-PNG conversion tools often miss fonts or render subtly wrong). Playwright with Chromium can render an SVG template to a PNG at any size server-side:

```javascript
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 192, height: 192 });
await page.setContent(`<html><body style="margin:0;background:#eef4fb">
  <svg ...>...</svg>
</body></html>`);
await page.screenshot({ path: 'icon-192.png', clip: { x:0, y:0, width:192, height:192 } });
```

The key: set `background` on the `body` to the solid icon background color, not `transparent`. What Playwright screenshots is what iOS will display.

## Lab 1: Add a Manifest and Register a Service Worker

**Goal:** Make a web page installable on Android/Chrome.

**Steps:**

1. Create `manifest.json` at the root of your site with `name`, `short_name`, `start_url: "./"`, `scope: "./"`, `display: "standalone"`, `theme_color`, `background_color`, and two icon entries (192px and 512px).
2. Create placeholder icon files at the paths referenced in the manifest (even a solid-color PNG works for now).
3. Add `<link rel="manifest" href="manifest.json">` to your HTML page's `<head>`.
4. Create a minimal `sw.js`:
   ```javascript
   self.addEventListener('install', () => self.skipWaiting());
   self.addEventListener('activate', () => {});
   ```
5. Register the service worker in your page's JavaScript:
   ```javascript
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/sw.js');
   }
   ```
6. Open Chrome DevTools → **Application** tab → **Manifest** — verify all fields appear correctly.
7. On an Android device or Chrome desktop, look for the install prompt in the address bar.

**Discussion prompts:**
- Why does `start_url: "./"` work better than `start_url: "/myapp/"` when the site is later moved to a custom domain?
- What would happen if the service worker file path was wrong?

## Lab 2: Fix the iOS Icon

**Goal:** Make the correct icon appear when adding to an iPhone home screen.

**Steps:**

1. Add `<link rel="apple-touch-icon" href="icons/icon-192.png">` to your HTML `<head>` (in addition to the manifest link, not instead of it).
2. Open the page on an iPhone in Safari → Share → Add to Home Screen. Note which icon appears.
3. If the icon shows a white square or the wrong image, inspect: (a) is the path in `href` correct? (b) does the PNG have a transparent background?
4. If the PNG has a transparent background, regenerate it with a solid background color matching your design.
5. Remove any `rx` rounded corner attribute from the SVG before rasterizing.
6. Add to Home Screen again (you may need to delete and re-add). Confirm the correct icon appears.

**Discussion prompts:**
- Why does Apple maintain a separate system instead of reading the Web App Manifest?
- What is the practical cost of maintaining two separate icon declarations vs. a single standard?
- Why does the double-rounding problem only manifest on iOS and not on Android?

## Lab 3: Deploy Two Distinct PWAs from One Domain

**Goal:** Install both the main app and an admin app from the same site, with distinct icons.

**Steps:**

1. Create `admin-manifest.json` with a different `name`, `short_name`, and `icons` array pointing at different icon files (e.g., `icons/admin-icon-192.png`).
2. Set `start_url: "admin.html"` in `admin-manifest.json`.
3. Add `<link rel="manifest" href="admin-manifest.json">` and a separate `<link rel="apple-touch-icon" href="icons/admin-icon-192.png">` to `admin.html`.
4. Add both apps to your home screen. Confirm they appear as separate entries with distinct icons and names.

## Assessment / Checklist (Learner Self-Check)

- I can explain the difference between what a manifest does and what a service worker does
- I can explain why `apple-touch-icon` is required separately on iOS and cannot be replaced by the manifest
- I can explain why transparent PNG backgrounds are problematic for iOS icons and what the fix is
- I can explain why relative paths in `start_url` and `scope` are more portable than absolute paths
- I can explain how to serve two distinct PWAs from the same domain
- I can describe the double-rounding problem and how to avoid it in icon SVG source

## Notes for Curriculum Build-Out (Next Steps)

- Consider adding a lab on offline caching (the service worker's `fetch` event intercepting network requests) — this module focused on installability; offline is the other major PWA pillar
- Consider pairing with a Lighthouse audit lab — Chrome's Lighthouse tool scores PWA compliance and surfaces missing requirements automatically
- The Playwright icon generation approach is worth expanding into a standalone script template learners can adapt for their own projects
- Source sessions: retire-time.com icon iterations (PRs #81–#84), `manifest.json` relative path fix (PR #82), admin PWA (`admin-manifest.json`, PR #85)

# Technology Literacy Curriculum (TLC)

## Module 9: Progressive Web Apps & Caching — Installable Web Apps, and Why You Kept Seeing the Old Version

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** C — Web & Cloud Application Architecture
**Format:** Guided reading + hands-on install/cache labs
**Prerequisite:** Module 3 (Hosting & Git/PR), Module 4 (Serverless Backends)
**Leads into:** Module 12 (Email & Notifications)

**Sequencing note:** Module 3 ended with "a push to `main` deploys in a minute." This module
explains the maddening sequel every builder hits: *you deployed, but your phone still shows the
old version.* That's caching and the **service worker** — the same technology that makes a web
app installable and able to show notifications.

## Why This Module Exists

A **Progressive Web App (PWA)** is an ordinary website that can be **installed** to a home screen,
launch full-screen like a native app, work partly offline, and (on supported devices) show
**push notifications** — no app store required. `windsor-swan` is a PWA.

But the feature that powers all that — a **service worker** caching files on the device — is also
the source of one of the most common and confusing experiences in web development, which recurred
throughout this project: a change ships, the live website updates, yet the **installed app keeps
showing the old content** until it's fully closed and reopened. Repeatedly, the answer to "why
isn't my fix showing?" was "you're looking at a cached copy — fully quit and reopen." Sometimes
feedback was even filed about things that were *already fixed*, because it was written against a
stale cache. Understanding caching turns that from baffling to predictable.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain what a **PWA** is and what a **web app manifest** provides (install, icon, full-screen)
2. Explain what a **service worker** is — a script that sits between the app and the network
3. Distinguish common caching strategies: **network-first**, **cache-first**, and "don't intercept"
4. Explain why an **installed** PWA can show stale content, and why **fully quitting** (not just backgrounding) forces an update
5. Explain **cache versioning** and why reusing a filename for new content requires a version bump
6. Diagnose "my change isn't showing" by distinguishing a **stale cache** from an actual failed deploy
7. Explain, at a high level, how **web push** works and why on iPhone it requires the **installed** app
8. Recognize the danger of a service worker that caches the wrong things (serving stale app code), and the safety choices that avoid it

## Core Concepts

### PWA and the manifest

A small **web app manifest** file tells the device "this site can be an app": its name, icon, and
that it should launch full-screen. Add a service worker, and the browser offers **"Add to Home
Screen."** The result looks and launches like a native app but is just your website.

### The service worker: a programmable layer between app and network

A **service worker** is a background script the browser runs for your site. Once installed, it
can **intercept the app's network requests** and decide how to answer each — from the network,
from a local **cache**, or a mix. That power is what enables offline support and notifications,
and it's also exactly why a service worker can accidentally keep serving yesterday's files.

### Caching strategies (the knob that matters)

For each kind of request, the worker picks a policy:

- **Network-first:** try the network; fall back to cache if offline. Good for **pages and code**
  you want *fresh* whenever online. `windsor-swan` uses this for its pages/scripts, so an online
  visitor shouldn't get stale HTML.
- **Cache-first:** serve the saved copy immediately, skip the network. Great for **images/fonts**
  that rarely change — fast, but **a new image under the same filename won't appear** until the
  cache is invalidated.
- **Don't intercept:** leave some requests alone entirely. `windsor-swan` deliberately never
  intercepts calls to Firebase, map tiles, etc. — so live/private data is never cached on the
  device.

### Why the installed app shows old content — and the fix

Even with network-first pages, an **installed PWA** keeps a running service worker and a cached
**app shell**. A new worker usually installs in the background but only **takes over once every
tab/window of the app is closed** — and "swipe to background" on a phone **doesn't** close it. So
the recurring real fix was literal and correct: **fully quit the app (swipe it away) and reopen**,
which lets the new version activate. Backgrounding isn't quitting.

**Key insight for learners:** "I deployed" and "this device is showing the deploy" are different
claims — a device with a service worker has its *own* copy that updates on its *own* schedule.

### Cache versioning

Because cache-first content is pinned by filename, the worker uses a **cache version** string.
Bumping it (or using a new filename) tells the worker "the old cache is stale, fetch fresh." The
project's own rule: **when replacing an image under the same filename, bump the cache version** —
otherwise devices keep the old image forever.

### Stale cache vs. failed deploy — the diagnosis

"My change isn't showing" has two very different causes, and conflating them wastes hours:

- **Failed/incomplete deploy:** the change never reached the live site. Check in a *fresh*
  context — a private/incognito window or a different device with no installed app — and the old
  content is there too.
- **Stale cache:** the live site (checked fresh) is correct, but *this* installed app/device
  still shows old content. Fully quit and reopen; it updates.

Several times on this project, reports of "it's broken / missing" were actually **stale cache** —
the fix had already shipped. Checking a fresh context *first* is the habit that settles it.

### Web push, briefly

Push notifications ride on the same service worker: a message arrives, the worker shows a
notification, and a tap opens the app. On iPhone this works **only inside the installed
home-screen app**, which is why "install it first" is a prerequisite, not a nicety. (The
credential side — the public/private VAPID key pair — is Module 7.)

## Lab 1: Install a PWA and inspect its service worker

**Goal:** See the app layer with your own eyes.

**Steps:**

1. Open a PWA in Chrome (`windsor-swan`, or any installable site). Use **"Install"** / "Add to Home Screen."
2. Open DevTools → **Application** tab → **Service Workers**. Note it's "activated and running."
3. In **Application → Cache Storage**, open the caches and see which files are stored on-device.
4. Note the **"Update on reload"** and **"Unregister"** controls — these are the developer's
   manual overrides for the exact staleness problem this module is about.

**Discussion prompts:**

- Which files would you expect to be cached **cache-first** vs. fetched **network-first**, and why?
- Why might caching *app code* too aggressively be dangerous, compared with caching a logo?

## Lab 2: Reproduce the stale-cache experience

**Goal:** Feel the "I deployed but don't see it" problem on purpose, then fix it.

**Steps:**

1. With a PWA installed, note some current content. In a **normal browser tab** (not the app),
   confirm what the live site currently shows.
2. Imagine/observe a content change (or use a site you can edit, per Module 3). Reload the live
   site in the browser tab — fresh content appears.
3. Open the **installed app** without fully quitting it first (just reopen from background).
   Observe whether it matches the fresh site.
4. Now **fully quit** the app (swipe it away / close every window) and reopen. Observe it update.

**Discussion prompts:**

- At which step did the installed app finally match the live site, and what event triggered the update?
- How would you tell a *user* to get the latest version, in one sentence a non-technical neighbor would follow?

## Lab 3: Diagnose "my change isn't showing"

**Goal:** Apply the stale-cache vs. failed-deploy decision.

**Steps:** For each situation, state whether it's **stale cache** or **failed deploy**, and the next action:

1. Incognito window and a never-installed phone both show the **old** content.
2. Incognito shows the **new** content; your installed app shows the **old** content.
3. The new content appears everywhere except one laptop you use daily.
4. You "fixed" something and filed it as still-broken, but a teammate on a fresh device sees it working.

**Discussion prompts:**

- Why is checking a **fresh context first** the single most time-saving habit here?
- How does this connect to Module 2's "verify against ground truth rather than a single observation"?

## Assessment / Checklist (Learner Self-Check)

- I can explain what a PWA and a web app manifest are
- I can explain what a service worker does
- I can distinguish network-first, cache-first, and don't-intercept strategies
- I can explain why an installed PWA shows stale content and why fully quitting fixes it
- I can explain cache versioning and when a filename reuse needs a version bump
- I can tell a stale cache apart from a failed deploy and know the next step for each
- I can explain why iPhone web push needs the installed app

## Notes for Curriculum Build-Out (Next Steps)

- Consider a short hands-on writing a minimal service worker (cache one file) for learners who want to go deeper.
- Consider a companion on **HTTP caching headers** (`Cache-Control`, `ETag`, the 304 from Module 2) — the *other* caching layer, distinct from the service worker.
- Consider a "kill switch" discussion: how a site can force every device to drop a bad service worker.
- Source session used for this draft: windsor-swan's PWA (`sw.js` / `pwa.js` / manifest), its network-first-pages / cache-first-images / never-intercept-Firebase strategy and `CACHE_VERSION` rule, web push on iPhone requiring the installed app, and the recurring real "fully quit and reopen the app" fix — including feedback filed against already-fixed, stale-cached content.

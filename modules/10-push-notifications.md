# Technology Literacy Curriculum (TLC)

## Module 10: Web Push Notifications — Reaching Users Off-Site

**Status:** Draft v1 — built from live hands-on sessions, 2025-2026
**Track:** 3 — Modern Web App Features
**Format:** Guided lab using retire-time.com's price alert system
**Prerequisite:** Module 9 (Progressive Web Apps), Module 8 (Serverless Functions), Module 6 (Supabase Deep Dive)
**Leads into:** Module 11 — Scheduled Jobs

**Sequencing note:** Push notifications require a service worker (covered in Module 9), a server-side function to send the push (Module 8), and a database table to store subscriptions (Module 6). This module is where those pieces come together into a feature with real user value.

## Why This Module Exists

Push notifications are one of the features that make a web app feel genuinely app-like. But the Web Push API is significantly more complex than it appears — it involves cryptographic keys, encrypted payloads, a background process that runs when the page is closed, a database table with a specific lifecycle, and coordination between the browser, the OS notification system, and your server.

This module is built from retire-time's price alert system: users set a price threshold for a stock, and they receive a push notification when that price is crossed — even if the browser tab is closed. Building this feature required understanding every layer of the stack simultaneously, which makes it an ideal vehicle for teaching how they interconnect.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain why push notifications require a **service worker** (the page may be closed when the notification arrives)
2. Explain what **VAPID keys** are, what public vs. private means in this context, and why they exist
3. Describe what a **push subscription object** contains and why it's stored in the database
4. Trace the complete **push notification flow** from user opt-in through server send to notification display
5. Explain what a **410 Gone** response means in the push context and how to handle it automatically
6. Describe what fields go into a **notification payload** and what each controls
7. Explain the security model: why the VAPID private key must stay server-side
8. Set up a `push_subscriptions` table with **Row Level Security** so users can only manage their own subscriptions

## Core Concepts

### Why Push Requires a Service Worker

A regular web page only runs JavaScript while the page is open. If the user closes the tab, all the page's JavaScript stops. Push notifications need to arrive and display even when the page is closed — which means something other than the page itself must be listening.

That something is the **service worker**: a JavaScript file that the browser registers separately from the page, running in a background thread that the browser keeps alive (or can restart) independently. The service worker listens for push events from the browser's push infrastructure and displays notifications using the Notifications API.

The service worker for retire-time's push system:

```javascript
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const { title = 'Retire Time Alert', body = '', ticker = '', url = '/portfolio-tracker.html' } = data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `price-alert-${ticker}`,
      renotify: true,
      data: { url }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('portfolio-tracker') && 'focus' in client) return client.focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});
```

`event.waitUntil()` is critical: it tells the browser not to terminate the service worker until the notification has been displayed.

### VAPID Keys — Proving the Push Came from You

Without authentication, any server could send a push notification to any user's subscription endpoint. VAPID (Voluntary Application Server Identification) is the authentication mechanism that prevents this.

VAPID generates a **public/private key pair**:

- The **public key** is shared openly — it goes into the JavaScript on the page, into the manifest, into the subscription request
- The **private key** stays on the server and is never exposed to the browser

When your server sends a push, it signs the request with the private key. The browser's push service (operated by Google, Apple, Mozilla, etc.) verifies the signature against the public key it received during subscription. If they don't match, the push is rejected.

In retire-time, the VAPID public key is a constant in the frontend JavaScript:
```javascript
const VAPID_PUBLIC_KEY = 'BFFJvrmV8jbojaBaoGgbIWWGMomvFGXgX-OU9rKdW9HZFerQAeRMt-4aWxwabkmq7ExiGKi_w_bZ6mXx21ou-Zk';
```

The private key is stored as a Supabase Edge Function secret — it never appears in any file committed to the repository.

### The Subscription Object

When a user grants notification permission and calls `PushManager.subscribe()`, the browser contacts the push service and returns a **subscription object**. This object is what gets stored in the database:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNcRdreALR...",
    "auth": "tBHItJI5..."
  }
}
```

- `endpoint`: the URL your server POSTs to in order to send a push to this specific device/browser
- `keys.p256dh` and `keys.auth`: encryption keys used to encrypt the push payload so only this browser can read it

The retire-time `push_subscriptions` table stores one row per user per device:

```sql
CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
```

RLS ensures users can only read and delete their own subscriptions.

### The Complete Push Flow

The full sequence from user opt-in to received notification:

1. **User clicks "Enable Notifications"** in the app
2. **Browser asks for permission** — user accepts
3. **Frontend calls `PushManager.subscribe()`** with the VAPID public key
4. **Browser returns a subscription object** (endpoint + encryption keys)
5. **Frontend POSTs the subscription** to the price-alerts Edge Function (`action: "subscribe"`)
6. **Edge Function stores the subscription** in `push_subscriptions` table, associated with the user's ID
7. **pg_cron runs every 15 minutes** (Mon–Fri, 9am–4pm ET) and calls the Edge Function with `action: "check_prices"`
8. **Edge Function fetches current prices** from Yahoo Finance for all users with active price alerts
9. **Edge Function compares prices to thresholds** — for each triggered alert, finds all subscriptions for that user
10. **Edge Function calls `webpush.sendNotification()`** with the subscription object, VAPID keys, and a JSON payload
11. **Browser's push service delivers the message** to the device (this works even if the browser is closed)
12. **Service worker receives the `push` event** and calls `showNotification()`
13. **User sees the notification** on their device

### 410 Gone — Subscription Lifecycle

Push subscriptions expire. A user may revoke notification permission, uninstall the browser, switch devices, or the push service may rotate the endpoint. When this happens, the endpoint returns `410 Gone` when your server tries to push to it.

The correct response to 410 is to delete that subscription from the database — it's permanently invalid. The price-alerts Edge Function does this automatically:

```typescript
if (result.statusCode === 410) {
  await supabase.from('push_subscriptions').delete().eq('subscription->>endpoint', sub.endpoint);
}
```

Without this cleanup, the database accumulates dead subscriptions and every push attempt wastes time hitting expired endpoints.

### Notification Payload Fields

The JSON object your server sends as the push payload:

| Field | Purpose |
|---|---|
| `title` | Bold header line in the notification |
| `body` | Secondary text below the title |
| `icon` | Image shown in the notification (URL path) |
| `badge` | Small monochrome icon shown in the status bar (Android) |
| `tag` | Identifier — a new notification with the same tag replaces the old one instead of stacking |
| `renotify` | `true` means re-alert (sound/vibration) even if replacing a same-tag notification |
| `data` | Arbitrary object — used to pass the URL to open when the notification is clicked |

## Lab 1: Enable Push and Receive a Test Notification

**Goal:** Walk through the full opt-in flow and confirm a notification arrives.

**Steps:**

1. Add a "Enable Notifications" button to your page.
2. On click, request permission: `const permission = await Notification.requestPermission();`
3. If granted, subscribe: `const sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY });`
4. POST the subscription JSON to your backend: `await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify(sub) });`
5. Store it in the database (Edge Function or server route).
6. From the server, send a test push using `web-push`: `webpush.sendNotification(subscription, JSON.stringify({ title: 'Test', body: 'It works!' }));`
7. Confirm the notification appears even when the browser tab is in the background.

**Discussion prompts:**
- Why does `userVisibleOnly: true` exist as a required field? What would "not visible only" push even mean?
- What would happen if you stored the VAPID private key in the frontend JavaScript file?

## Lab 2: Trigger a Server-Side Push from an Edge Function

**Goal:** Send a real push from a Supabase Edge Function in response to a data condition.

**Steps:**

1. Import `web-push` in the Edge Function: `import webpush from 'npm:web-push@3.6.7';`
2. Set VAPID details: `webpush.setVapidDetails('mailto:you@example.com', PUBLIC_KEY, PRIVATE_KEY);`
3. Query the database for subscriptions belonging to the target user.
4. For each subscription: `const result = await webpush.sendNotification(sub.subscription, JSON.stringify({ title, body, ticker }));`
5. Handle 410: if `result.statusCode === 410`, delete that subscription row.
6. Test by calling the Edge Function directly (via curl or the Supabase dashboard).

## Lab 3: Store and Clean Up Subscriptions

**Goal:** Build the subscription table lifecycle — store on subscribe, clean up on 410.

**Steps:**

1. Create the `push_subscriptions` table with `user_id`, `subscription` (jsonb), `created_at`.
2. Enable RLS; add a policy allowing users to SELECT and DELETE their own rows.
3. Write an Edge Function action `subscribe` that upserts the subscription (use the endpoint as a unique key so re-subscribing doesn't create duplicates).
4. Write an Edge Function action `unsubscribe` that deletes by endpoint.
5. After deliberately revoking browser notification permission and re-subscribing, verify the old row is replaced, not duplicated.

## Assessment / Checklist (Learner Self-Check)

- I can explain why a service worker is required for push notifications even when the page is open
- I can explain what VAPID keys are and which one (public/private) goes in the browser vs. the server
- I can describe what a push subscription object contains and why both `endpoint` and `keys` are needed
- I can trace the full push flow from user opt-in through notification display
- I can explain what a 410 Gone response means and what the correct server-side response is
- I can explain what `tag` and `renotify` control in a notification payload

## Notes for Curriculum Build-Out (Next Steps)

- Consider adding a lab on notification click handling — routing the user to the specific stock that triggered the alert, not just the portfolio page
- Consider covering Safari push notifications separately — Safari on macOS and iOS 16.4+ added Web Push support, but with some differences in permission flow
- The `userVisibleOnly: true` requirement (all pushes must show a notification — no "silent" background data pushes in the browser) is a significant design constraint worth a dedicated discussion prompt
- Source sessions: price-alerts Edge Function (web-push@3.6.7, VAPID keys stored as Supabase secrets), `sw.js`, `push_subscriptions` table, bell button in portfolio-tracker.html

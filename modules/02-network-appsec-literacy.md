# Technology Literacy Curriculum (TLC)

## Module: Network & Application Security Literacy — Reading Chrome DevTools Like a Practitioner

**Status:** Draft v1 — built from a live hands-on session, July 2026
**Domain:** Networking & Systems Fundamentals + Cybersecurity & Application Security (crosses both TLC domains)
**Format:** Self-paced lab with real-world artifacts (student's own deployed project)

## Why This Module Exists

Most intro-to-tech content treats "networking" and "security" as separate, abstract subjects taught through diagrams and vocabulary lists. This module instead teaches both through a single continuous skill: reading what a browser is actually doing, using tools every browser ships with for free (Chrome DevTools).

The arc is intentionally practitioner-shaped: start with a static site to learn the vocabulary, then move immediately to auditing a real, personally-built application for a real security property (API key exposure). This mirrors how junior security analysts and web developers actually work day to day — inspect traffic, verify headers, confirm secrets aren't leaking client-side.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Open Chrome DevTools and navigate the Network, Security, and Application tabs
2. Read a request waterfall and explain what's happening at each stage (DNS, connection, TLS, TTFB, download)
3. Interpret common HTTP status codes (200, 304, 404, 401/403, 429, 500) in context
4. Distinguish request headers from response headers and explain the purpose of key ones (Cache-Control, Set-Cookie, Content-Security-Policy, Strict-Transport-Security, Authorization)
5. Inspect a TLS certificate and explain the chain of trust (root CA → intermediate → leaf)
6. Filter network traffic to isolate API calls (Fetch/XHR) from static asset loads
7. Identify an API request's payload and response, and reason about what data is being transmitted
8. Evaluate whether a web application is following the secure pattern of keeping API keys server-side, by inspecting outbound browser requests for exposed credentials
9. Verify a "silent success" from a live third-party data feed (e.g., a function that returns "no problem found") against an independent ground-truth source, rather than assuming a quiet result is a correct one
10. Reason about live data as time-varying — recognize that a state observed during debugging (e.g., an active outage) may no longer hold by the time a fix ships, and that this must be accounted for rather than treated as a static test fixture
11. Apply this workflow to a real, self-built project rather than a hypothetical example

## Lab 1: Reading the Waterfall (Static Site Warm-Up)

**Goal:** Build baseline fluency with the Network tab before introducing API/security complexity.

**Steps:**

1. Open any public website. Open DevTools (F12 / Cmd+Opt+I) → **Network** tab.
2. Reload the page and observe the waterfall.
3. Identify:
   - The initial document request (Type: document)
   - Any stylesheet/font requests
   - Image requests, and their status codes
4. Find at least one cached response (memory cache or disk cache) and one live network response. Compare their Time column.
5. If any request returns a non-200 status, click into it and determine why (304 = not modified, using cache; 404 = broken reference).

**Discussion prompts:**

- Why do cached requests take ~0–15ms while live requests take hundreds of ms or more?
- What does a 404 on an image tell you about the site's maintenance?
- What's the practical cost (in time) of a single round-trip to a server, even for a "no" answer like 304 or 404?

## Lab 2: TLS and the Chain of Trust

**Goal:** Understand what "https" is actually verifying, not just that the padlock is present.

**Steps:**

1. On the same site, click the padlock icon (or **Security** tab) → view certificate.
2. Open Details view. Identify the Certificate Hierarchy (root → intermediate → leaf).
3. Click through to the Issuer field and identify the Certificate Authority (CA).
4. Note the Validity dates (Not Before / Not After).

**Discussion prompts:**

- Why do browsers trust a small set of root CAs instead of every website's own claim of identity?
- What would you expect to see (or see missing) on a site with a self-signed or expired certificate?
- How does this connect to the Strict-Transport-Security header in the Network tab?

## Lab 3: From Static Assets to API Traffic

**Goal:** Recognize that an "API call" is just another row in the same waterfall — a labeled subset of HTTP traffic — and learn to isolate it.

**Steps:**

1. Navigate to a site/app with dynamic functionality (a login, a search, a form submission, a dashboard).
2. In the Network tab, click the **Fetch/XHR** filter to remove image/CSS/font noise.
3. Trigger the dynamic action and observe the new request(s) that appear.
4. Click into the request and review:
   - Method (GET/POST/PUT/DELETE)
   - Payload/Request body (what's being sent)
   - Response (what's coming back, usually JSON)
   - Status code

**Discussion prompts:**

- How is this fundamentally the same mechanism as loading an image, just carrying structured data instead?
- What does the Method tell you about the intent of the request (reading vs. writing data)?

## Lab 4: Verifying a Live Data Feed — When "No Problem Found" Might Mean "Broken"

**Goal:** Learn to distinguish a correct negative result from a silently broken one, using a real feature that consumes a live third-party data feed.

Many features are built to detect a *bad* condition and stay quiet otherwise: a fraud check that finds nothing suspicious, a monitoring script that reports all-clear, a status banner that only appears during an outage. These are the hardest bugs to catch, because "nothing happened" looks identical whether the code is working or silently failing. This lab uses a real example: a neighborhood outage-status banner that calls a utility company's public outage map (a tile-based API, e.g. KUBRA — the vendor many US utilities use to power their outage maps) and shows a banner only when the learner's neighborhood falls inside an active outage polygon.

**Steps:**

1. Open DevTools → **Network** tab → filter to **Fetch/XHR** (or **Img**, since map tiles are often requested as image-like assets even though they encode structured/vector data).
2. Trigger the feature (e.g., load the page with the status banner). Identify the outbound request(s) to the third-party map/tile service.
3. Inspect the request URL. Tile-based map APIs typically encode a coordinate system in the URL or query params (e.g., x/y/z tile indices, or a bounding box) — identify what geographic area a given request is actually asking about.
4. Confirm the response comes back 200 and contains data (even if that data is "no active outage here"). A 200 with an *empty* result is a completely different situation from a request that errors, times out, or never fires at all — but all three can produce the same "no banner shown" outcome in the UI. Learn to tell them apart in the Network tab before trusting the UI.
5. **Cross-verify against ground truth.** Independently open the utility's own public-facing outage map (not through your app) and visually confirm whether your target area currently shows an outage. Only if this matches your app's result can you call the function "correct" — a quiet UI is not, by itself, evidence of anything.
6. **Account for time.** If your target area *did* show an outage earlier (e.g., during initial testing or in an old screenshot) but shows clear now, don't assume something broke — the underlying condition may have simply resolved. Re-run your ground-truth check at the current moment rather than trusting a stale observation.

**Discussion prompts:**

- Why is a feature that reports "everything is fine" fundamentally harder to test than one that reports an error?
- What are three different failure modes that could all produce the same "no banner" UI result, and how would the Network tab distinguish between them?
- This app depends on a live external system it doesn't control. What does that imply about how much you can trust a single observation, versus needing to check again later?
- How is a tile-based geospatial API (coordinates encoded in the URL, area-based results) similar to and different from the JSON request/response pattern from Lab 3?

## Lab 5 (Capstone): Audit Your Own Project for Exposed Secrets

**Goal:** Apply everything above to answer a real security question about a real, self-built application: *is my API key exposed to the browser?*

This lab is most effective when run against a project the learner actually built and deployed (e.g., a personal dashboard, a small full-stack app with a serverless backend). Context: this version of the lab was developed live against a Strava-connected training dashboard with an AI-powered plan generator (frontend on GitHub Pages, backend on Cloudflare Workers, calling the Claude API).

**Steps:**

1. Open DevTools → **Network** tab → check **Preserve Log** → filter to **Fetch/XHR**.
2. Clear the log, then trigger the feature that calls an AI/LLM or other third-party API (e.g., "generate my plan").
3. Identify the relevant request. Tells to look for:
   - Method: POST
   - Unusually long Time value relative to other requests (LLM calls are often multi-second, unlike typical data fetches)
   - A request URL pointing to your own backend/domain, not directly to the third-party provider (e.g., your own serverless function domain, not api.anthropic.com or similar, called from the browser)
4. Click into the request → **Headers** tab → **Request Headers**.
5. Scan the full list of request headers (they're typically alphabetical) for:
   - Authorization
   - x-api-key
   - Any other custom header that looks like it could carry a secret/token
6. **If neither is present:** this is the correct, secure pattern. It means the secret key lives inside the backend (e.g., a Cloudflare Worker, Vercel serverless function, etc.) and is never sent to or exposed in the browser.
7. **If either IS present:** this is a real finding. It means the API key is reachable by anyone who opens DevTools on the deployed site — a genuine vulnerability, not a style issue. The fix is to move the call server-side.
8. **Bonus check:** click **Payload** and review exactly what data is being sent to generate the AI response (e.g., workout/training stats) — confirm no unrelated sensitive data (like a raw OAuth token) is being forwarded along with it.
9. **Bonus check:** review Origin, Referer, and Sec-Fetch-Site headers to understand the cross-origin relationship between your frontend and backend domains, and confirm it matches your intended architecture.

**Discussion prompts:**

- Why does it matter that the secret lives in the Worker/serverless function rather than in the frontend JavaScript, even though both are "your code"?
- What's the difference between data that's fine to expose in a request (training stats) versus data that should never appear in a browser-visible request (API keys, OAuth tokens)?
- How would an attacker exploit an exposed API key if they found one this way?

## Assessment / Checklist (Learner Self-Check)

- I can explain the difference between a 200, 304, and 404 status code
- I can locate and read both request and response headers for any network request
- I can explain what a TLS certificate chain verifies and identify a CA in a real cert
- I can isolate API/XHR traffic from static asset traffic using DevTools filters
- I can identify a request's payload and response body
- I can distinguish an empty-but-successful response from a failed, timed-out, or never-fired request, even when the visible UI result looks the same
- I can independently verify a "no problem found" result against an external ground-truth source rather than trusting the UI alone
- I can determine, for a real deployed app, whether an API key or auth token is exposed client-side
- I can explain the fix (move the call server-side) if a secret is found exposed

## Notes for Curriculum Build-Out (Next Steps)

- Consider adding a deliberately vulnerable "broken" sample app (key exposed client-side) as a contrast lab, so learners see both the secure and insecure pattern side by side
- Consider pairing this module with a short primer on CORS, since Sec-Fetch-Site/cross-site headers came up naturally in the live session and are a common point of confusion
- Consider a follow-on module on the **Application** tab (localStorage/sessionStorage/cookies) — flagged as a natural next step but not yet built out
- Consider tying this into the policy framework deliverable: "why should organizations onboarding transitioning veterans into tech roles care about this kind of literacy" as a bridge between the curriculum and capstone policy argument
- Consider a follow-on module/lab on polling and refresh intervals (how often a live feed like an outage map actually updates, and what that implies for how "fresh" a quiet result really is) — flagged by Lab 4's live-data timing discussion but not yet built out
- Source session used for this draft: navy2010.com (static site warm-up) + sleddawg-fitness (capstone API/secrets audit) + windsor-swan (Lab 4, live outage-feed verification, July 2026)

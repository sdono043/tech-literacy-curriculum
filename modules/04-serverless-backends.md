# Technology Literacy Curriculum (TLC)

## Module 4: Serverless Backends — What Runs "In the Cloud," and the Bug That Explains How

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** C — Web & Cloud Application Architecture
**Format:** Guided reading + diagnostic lab against real function logs
**Prerequisite:** Module 2 (Network & AppSec Literacy), Module 3 (Hosting & Git/PR)
**Leads into:** Module 5 (Databases), Module 7 (Secrets), Module 12 (Email & Notifications)

**Sequencing note:** Module 3 ended on a cliffhanger: a static site can't do anything dynamic —
no accounts, no database writes, no sending email. That work has to happen on a server. This
module introduces the modern form of "a server" — a **serverless function** — and uses a real
bug to make its single most surprising property concrete.

## Why This Module Exists

"The backend" and "the cloud" are the vaguest terms in software for a newcomer. This module
makes them specific by looking at exactly one real backend: the **Firebase Cloud Functions**
behind `windsor-swan`. A static site handles display; every action that needs trust or
persistence — creating an account, posting a listing, sending an email — calls a small function
that runs on Google's servers, does the work, and returns an answer.

The module is anchored on a genuine, subtle bug. Residents stopped getting email alerts when a
neighbor posted to the Lost & Found board. The function *looked* correct: it saved the post,
then sent the emails, then returned success. But the emails were sent **after** the function
told the browser "done" — and a serverless function is **frozen the instant it responds**, so
that after-the-response work often never ran. The fix was one word: `await` the email step
*before* responding. That one bug teaches more about how serverless actually works than any
diagram.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain what a **backend** is and why some actions can't be trusted to the browser
2. Explain what a **serverless function** is and how it differs from an always-on server
3. Describe the **request → run → respond → freeze** lifecycle of a function invocation
4. Explain why **work started but not awaited before the response** may silently never run ("fire-and-forget" on serverless)
5. Explain **cold starts** and why the first call after idle is slower
6. Read **function logs** to tell the difference between "ran and failed" and "never ran"
7. Explain why a backend function re-checks the caller's identity even if the website's UI already did ("never trust the client")
8. Name the trade-offs of serverless (scales to zero, pay-per-use, statelessness) versus a traditional server

## Core Concepts

### Why a backend exists at all

Anything the browser does, a user can see and change — so anything that must be *trusted* can't
live only in the browser. "Only approved residents may post," "charge this card," "email every
subscriber" — these must run somewhere the user can't tamper with. That somewhere is the
**backend**. On `windsor-swan`, the backend is a set of **Cloud Functions**: each is a small,
named program (`createLostFound`, `submitApplication`, `placeBid`) that the browser calls over
the network, exactly like the API requests you inspected in Module 2.

### Serverless: a function, not a machine you babysit

Traditionally "a server" is a computer you rent, keep running 24/7, patch, and pay for even when
idle. **Serverless** flips that: you upload just the *function*, and the provider runs a copy
**on demand**, only when a request arrives, and charges only for that run. When no one's
calling, nothing runs and nothing costs. This is ideal for a neighborhood site with bursty,
unpredictable traffic.

### The lifecycle — and the freeze (the whole module in one idea)

A serverless invocation goes: **a request arrives → the provider spins up (or reuses) an
instance → your code runs → your code sends a response → the instance is frozen/reclaimed.**

That last step is the trap. Consider the Lost & Found bug in plain sequence:

1. Browser calls `createLostFound`.
2. Function saves the post to the database. ✅
3. Function sends the response `{ ok: true }` to the browser. ✅ (the post appears — looks fine!)
4. Function *then* starts emailing subscribers… but step 3 already ended the request, so the
   platform **freezes the instance**. The email work is abandoned mid-flight. ❌

The post succeeded, so nothing looked broken — but the alerts silently never sent. The fix:
**do the email work and `await` it *before* sending the response.** "Fire-and-forget" (kick off
work and immediately respond) is a reasonable instinct, but on serverless it means "forget."

**Key insight for learners:** on serverless, *after you respond, assume nothing else runs.* If
it matters, finish it before you answer.

### Cold starts

If no instance is warm, the provider must create one before your code runs — a **cold start** —
so the first call after a quiet period is noticeably slower, then subsequent calls are fast
(the instance is reused briefly). This is why a feature can feel "slow the first time, instant
after." It's not a bug; it's the cost of scaling to zero.

### Never trust the client

The `windsor-swan` functions re-verify the caller on every write — `createListing` checks the
user's real sign-in token server-side even though the web page already hid the button from
signed-out visitors. The UI check is for *convenience*; the function check is for *security*.
This is the backend counterpart to Module 2's "keep secrets server-side," and it sets up
Modules 6 (auth) and 8 (vulnerabilities).

## Lab 1: Trace a function call in the browser

**Goal:** Connect "a backend" to something you can see.

**Prerequisites:** A browser with DevTools (Module 2). Any site that does a dynamic action.

**Steps:**

1. Open a site with a form or action (a sign-in, a search). Open DevTools → **Network** → filter **Fetch/XHR** (Module 2 skill).
2. Trigger the action. Find the outbound request. Note its URL points at a **backend endpoint** (often a `cloudfunctions.net`, `/api/…`, or a functions domain), not just a static file.
3. Inspect **Method**, **Payload** (what you sent), **Response** (what came back), and the **Time**. A backend call is usually slower than a static asset — you're waiting on code to run elsewhere.

**Discussion prompts:**

- Why is this request fundamentally different from loading an image, even though both are HTTP?
- The response came back in, say, 300 ms. What are three things that happened on the server in that window?

## Lab 2: The freeze, made concrete (reasoning lab)

**Goal:** Internalize the fire-and-forget bug without needing to deploy code.

**Steps:**

1. Read this pseudo-code of the *buggy* version, and predict the outcome:

   ```
   function createLostFound(request, response):
       savePostToDatabase(request)          # finishes
       response.send({ ok: true })          # browser hears "done"
       sendEmailsToSubscribers(request)     # started here...
   ```

2. Now read the *fixed* version:

   ```
   function createLostFound(request, response):
       savePostToDatabase(request)          # finishes
       await sendEmailsToSubscribers(request)   # finish BEFORE responding
       response.send({ ok: true })
   ```

3. In your own words, write down: in the buggy version, what does the *user* see, and what does
   the *subscriber* experience? Why do those two differ?

**Discussion prompts:**

- The post appeared correctly every time, so the bug "didn't look like a bug." What category of bug is "it worked, but a side effect silently didn't happen," and why are these the hardest to catch? (Tie back to Module 2, Lab 4 — the silent-success outage feed.)
- The fixed version is *slower* to respond (it waits for email). Is that an acceptable trade? When might it not be, and what's the alternative (a queue/background job)?

## Lab 3: Read logs to tell "failed" from "never ran"

**Goal:** Use logs the way the bug was actually diagnosed.

**Prerequisites:** Any serverless platform's log viewer. If you have a Firebase project, use
`firebase functions:log`; otherwise read the annotated sample below.

**Steps:**

1. Understand the three outcomes a function invocation can have, and how each looks in logs:
   - **Ran and succeeded** — you see the function's own "done" log line (e.g., `lost&found alert summary: sent=4`).
   - **Ran and failed** — you see an error/stack trace from inside the function.
   - **Never got there** — you see *neither*. The absence of the expected log line is the clue.
2. In the real bug, the telltale sign was an **absent** "alert summary" line: the email code
   never executed, so it logged nothing — consistent with the freeze, not with an email error.
3. Practice the reasoning: given "post saved, no alert, and no error anywhere," is the email
   step **failing** or **not running**? What does each imply about the fix?

**Discussion prompts:**

- Why is "no log at all" more informative here than an error would be?
- If the email step had instead thrown an error *before* the response, where would you expect to see it, and how would the fix differ?

## Assessment / Checklist (Learner Self-Check)

- I can explain why trusted actions can't live in the browser
- I can explain what a serverless function is and how it differs from an always-on server
- I can describe the request → run → respond → freeze lifecycle
- I can explain why un-awaited work after the response may never run
- I can explain what a cold start is and why it happens
- I can read logs to distinguish "ran and failed" from "never ran"
- I can explain why a backend re-verifies the caller even when the UI already did

## Notes for Curriculum Build-Out (Next Steps)

- Consider a short follow-on on **queues / background jobs** as the correct home for slow after-the-fact work (so you don't make users wait on email), flagged by Lab 2.
- Consider a hands-on "deploy your first function" track for learners with a Firebase/Cloudflare account, kept optional so the reasoning labs work for everyone.
- Consider tying the "never trust the client" thread forward explicitly into Module 6 (auth) and Module 8 (XSS).
- Source session used for this draft: the windsor-swan Lost & Found email-alert bug — "I don't seem to be getting email alerts for new lost and found postings — can you check the logs" — diagnosed as fire-and-forget work lost to the serverless freeze and fixed by awaiting the fan-out before responding; confirmed by the absent "alert summary" log line.

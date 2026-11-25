# Technology Literacy Curriculum (TLC)

## Module 6: Authentication vs. Authorization — Who You Are vs. What You're Allowed to Do

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** B — Cybersecurity & Application Security
**Format:** Guided reading + reasoning labs against a real app's two auth systems
**Prerequisite:** Module 4 (Serverless Backends), Module 5 (Databases)
**Leads into:** Module 7 (Secrets), Module 8 (Web Vulnerabilities)

**Sequencing note:** Module 4 said "never trust the client" and Module 5 said "deny by default."
Both are really about one question — *who is allowed to do this?* This module gives that question
its two precise halves (authentication and authorization) and shows, in a real app, a
deliberately imperfect gate and why its owner chose it anyway.

## Why This Module Exists

"Login" feels like one idea, but it's two, and conflating them causes real security mistakes.
**Authentication** answers *who are you?* **Authorization** answers *what are you allowed to do?*
A system can know exactly who you are and still correctly refuse you. A system can also *look*
locked while being trivial to bypass.

This module uses `windsor-swan`, which runs **two completely separate auth systems on purpose**,
and which documents an honest, deliberate compromise: the resident "gate" on the public pages is
a **deterrent, not real access control**, because the site is static files anyone can fetch. The
owner understood that and chose it anyway, for good reasons. Learning to tell "real enforcement"
from "a helpful speed bump" — and to choose between them knowingly — is the skill here.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Define **authentication** and **authorization** and give an everyday example of each
2. Explain **identity** vs. **permission** (claims/roles) and how a system stores "this user is an approved resident / an admin"
3. Explain what a **session token** is and roughly how "stay signed in" works without re-entering a password
4. Distinguish **client-side** checks (UI convenience) from **server-side** checks (real enforcement) and explain why only the latter is security
5. Explain why a **static-site "gate" can only ever be a deterrent**, and what *real* enforcement would require instead
6. Evaluate a stated **security trade-off** (e.g., email-only sign-in) as a deliberate decision with named costs, not an oversight
7. Explain why two different trust systems (real user accounts vs. a shared admin password) might coexist in one app, and why not to conflate them

## Core Concepts

### The two questions

- **Authentication (authN):** proving *who you are.* Showing ID at a door.
- **Authorization (authZ):** deciding *what you may do* once known. Your ID is valid, but this
  badge doesn't open the server room.

A correct system does both, in order: authenticate, then authorize each action. Many breaches
come from doing the first and assuming the second ("logged-in users can do anything").

### Identity and permission on `windsor-swan`

Residents have **real accounts** (Firebase Authentication). When one is approved, the system
attaches a **claim** to their identity — effectively a stamped attribute, `resident: true` — that
travels with their sign-in token. A Cloud Function reading that token can ask "is this a verified
resident?" and authorize writes accordingly. Identity (the account) and permission (the claim)
are separate things stored together.

### Sessions: staying signed in

After you authenticate, the server issues a **token** — a time-limited proof of "this person
already signed in." The browser stores it and sends it on later requests, so you aren't asked for
a password every click. Tokens **expire** (the resident token refreshes roughly hourly; the admin
token on `windsor-swan` lasts ~8 hours), which is why access can linger briefly after someone's
status changes — a known, accepted trade-off, because *every write is re-checked server-side*
regardless of a still-valid token.

### Client-side vs. server-side checks (the heart of it)

The public pages hide content until a sign-in check passes **in the browser**. That's pleasant,
but it is **not** security: the pages are static files, and anyone can fetch the raw HTML
directly (`curl`, "view source") no matter what the JavaScript decides. So the gate is an honest
**deterrent** — it keeps casual visitors out of the UI, nothing more.

Where it counts — every *write* — the check happens again **on the server**, inside a Cloud
Function that re-verifies the real token. That's the real boundary. `windsor-swan`'s own notes
say this plainly and warn against "fixing" the client gate into something that only *pretends* to
be stronger. **Real** page-level enforcement would mean not shipping the content as static files
at all — serving it from the database only *after* a server verifies the request — a much larger
redesign that was deliberately deferred.

**Key insight for learners:** a check the user's device performs is a check the user can remove.
Only a check performed by a server the user doesn't control is enforcement.

### A deliberate trade-off: email-only sign-in

Resident sign-in asks only for an email that matches an approved record — **no password, no
proof you own the inbox**. That means anyone who knows a neighbor's email could sign in as them.
This is written down as an **explicit, discussed choice** (simplicity for a low-stakes community
site), not a mistake — and the natural upgrade (a one-time email link) is named for later.
Reading this as a *decision with known costs* — rather than "they forgot security" — is a core
literacy: real engineering is full of defensible trade-offs.

### Two systems, don't conflate them

`windsor-swan` has **two** unrelated auth schemes: residents use real accounts; the **admin**
dashboards use a single **shared password** that mints a separate admin token. They protect
different things, use different mechanisms, and must not be mixed up (an admin is not "a resident
with extra powers" here — it's a different door entirely). Recognizing that one app can have
several trust boundaries is part of reading real systems.

## Lab 1: Sort the checks (authN vs authZ)

**Goal:** Build the reflex of splitting "login" into its two questions.

**Steps:** For each scenario, label it **authentication**, **authorization**, or **both**, and say what a correct system should do:

1. A signed-in resident clicks "Remove listing" on *someone else's* listing.
2. A signed-out visitor opens the Marketplace page.
3. A removed resident's browser still loads a gated page 20 minutes after removal.
4. Someone types a neighbor's email into the email-only sign-in.
5. The admin password is entered correctly.

**Discussion prompts:**

- Which of the above are stopped by *identity*, and which only by *permission*?
- For #3, why is it acceptable here, and what makes it safe despite looking wrong?

## Lab 2: Deterrent or enforcement? (your own judgment)

**Goal:** Learn to tell a speed bump from a wall.

**Steps:**

1. Open any static site that hides content behind a browser-side check (or `windsor-swan`'s
   public pages). With DevTools (Module 2), open **view-source** or the Network tab and confirm
   whether the "hidden" HTML is actually present in the downloaded file.
2. Write one sentence each: what the gate *does* stop, and what it *doesn't*.
3. Describe what it would take to make it real enforcement (hint: the content can't be a static
   file the server hands to everyone).

**Discussion prompts:**

- Is a deterrent gate worthless? When is "keep honest people out of the UI" a perfectly good goal?
- What's the risk of making a gate *look* stronger than it is, for the owner and for users?

## Lab 3: Critique a trade-off like an engineer

**Goal:** Practice evaluating a security decision instead of just flagging it.

**Steps:**

1. Take the email-only sign-in. Write down: the **benefit** (why someone would choose it), the
   **cost** (what it exposes), and the **upgrade path** (what you'd do if the stakes rose).
2. Now do the same for the **~8-hour admin token** and the **~1-hour resident token lingering**.
3. Decide, for a *neighborhood* site vs. a *banking* site, whether each trade-off is acceptable,
   and say why the context changes the answer.

**Discussion prompts:**

- What makes a trade-off "deliberate and documented" rather than "a vulnerability"? Does writing it down change the risk, or only the accountability?
- How does the right answer depend on *what's being protected*?

## Assessment / Checklist (Learner Self-Check)

- I can define authentication and authorization and give an example of each
- I can explain how an app stores "this user is an approved resident / an admin" (claims/roles)
- I can explain what a session token is and why you stay signed in
- I can explain why a client-side check is not security and a server-side check is
- I can explain why a static-site gate is only a deterrent and what real enforcement would require
- I can evaluate a stated security trade-off by naming its benefit, cost, and upgrade path
- I can explain why one app might run two separate auth systems

## Notes for Curriculum Build-Out (Next Steps)

- Consider a short add-on on **passwordless / email-link sign-in** (the named upgrade) as a concrete "how you'd tighten it" exercise.
- Consider a diagram contrasting the two windsor-swan auth systems side by side.
- Consider connecting forward to Module 8: an unescaped field on an admin page could *steal the admin token* — authZ and injection are linked.
- Source session used for this draft: windsor-swan's dual auth systems (Firebase Auth + `resident` claim vs. the admin HMAC shared-password scheme), the documented "deterrent gate, not real access control" decision, the email-only sign-in trade-off, and "Can I log in as admin-residents on the app?"

# Technology Literacy Curriculum (TLC)

## Module 16: Backend Architecture & the Deploy Model — How the Pieces Fit, and What "Deploy" Actually Touches

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** Backend & Databases
**Format:** Guided reading + hands-on "map your own app" labs
**Prerequisite:** Module 5 — Databases & SQL Fundamentals; Module 7 — Authentication; Module 8 — Serverless Edge Functions (this module zooms out from the individual pieces to the whole system)
**Leads into:** Module 9 — Progressive Web Apps & Caching (the frontend/caching layer that sits on top of this backend)

**Sequencing note:** Modules 5–8 teach the backend one piece at a time — the database, auth, and the serverless function. This module comes right after, because once you've met the pieces individually the useful next skill is *drawing the whole system*: which piece holds what, which piece guards what, and — the question that causes the most real-world confusion — **which command actually ships a change to each piece.** Module 8 answered "what is a function and why does it exist"; this module answers "how do all the pieces fit together, and what does *deploy* actually touch."

## Why This Module Exists

Most people who ship a real app end up with a working system they can't *draw*. They know it works, but they can't say which part enforces security, which part holds the data, which part runs their code, or — the question that bites hardest — **which command actually makes a given change go live.** That last gap is where real incidents come from: a fix gets merged, the live site doesn't change, and nobody can explain why.

This module fixes that by naming the pieces of a serverless / Backend-as-a-Service (BaaS) app and drawing the lines between them. It uses a second real system as its worked example — a neighborhood website with a static frontend on GitHub Pages and a **Firebase** backend (Cloud Functions, Firestore, Storage, Auth) — deliberately a *different* stack from the Supabase example used in Modules 5–8. Seeing the same roles on two different vendors (Firebase here, Supabase there; see also the Firestore-vs-Supabase comparison note) is the point: **the product names change; the shape does not.**

The single most important idea: **"the backend" is not one thing.** It's at least four different *kinds* of thing — code, data, policy, and identity — and each one is created, changed, secured, and **deployed** differently. Confusing them is the root cause of most "but I already fixed it" confusion.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Name the pieces of a serverless/BaaS app and state, in one sentence each, what that piece is *for*
2. Classify any given file or resource as **frontend code**, **backend code**, **data**, **policy/config**, or **identity**
3. Explain the difference between a database and a file/blob store, and why a photo goes in one while its path goes in the other
4. Explain what security **rules** protect, and the one case where they do **not** apply (trusted server-side code using an admin/service credential)
5. Describe the **two paths** a browser can take to reach data — direct (governed by rules) vs. through a function (governed by your code) — and identify which path a real feature uses
6. Produce the **deploy matrix** for a real app: for a change to each layer, state the exact command/action that ships it (and why merging a pull request is *not* always one of them)
7. Diagnose a "I changed it but the live site didn't change" situation by reasoning about which layer changed and whether it was actually deployed

> **Relationship to Module 8.** Module 8 established *why* trusted code and secrets must live in a serverless function rather than the browser. This module takes that as given and zooms out: the function is one of several pieces, and the new skills here are (a) seeing how all the pieces relate and (b) the deploy model. If "the browser is a public environment" isn't yet second nature, revisit Module 8 first.

## Part 1: The Pieces (A Reference You Can Draw)

Think of a serverless app as five kinds of thing. The product names change per vendor; the roles don't.

| Piece | Role (one sentence) | Firebase example (this module) | Supabase equivalent (Modules 5–8) |
|---|---|---|---|
| **Frontend host** | Serves the static files a browser downloads; runs no trusted logic | GitHub Pages (`*.html`, `*.js`, CSS) | Static host / CDN |
| **Backend function** | Your trusted server code; runs on demand, holds secrets, can do anything | Cloud Functions (`functions/index.js`) | Supabase Edge Function (Module 8) |
| **Database** | Structured records, queried and updated at runtime | Firestore | Postgres via Supabase (Module 5–6) |
| **File store** | Large binary blobs (images, PDFs) that don't belong in a database | Firebase Storage | Supabase Storage |
| **Access policy** | Declarative rules deciding what a *browser* may read/write **directly** | `firestore.rules`, `storage.rules` | Row-Level Security (RLS) policies |
| **Identity** | Who the caller is, proven by a token the other pieces can check | Firebase Auth (+ custom claims) | Supabase Auth (JWT) |

Four of these deserve a sentence more, because the distinctions are exactly what people blur.

**Frontend host.** It serves files, byte-for-byte, to anyone, and runs *none* of your code on the server — all your JavaScript runs in the *visitor's* browser. Consequence (the Module 8 point, restated at system scale): **nothing secret and nothing trusted can live here.** A client-side "gate" can hide content from a casual visit but can't stop a determined `curl`; it's a deterrent, not a lock.

**Database vs. file store.** Two different warehouses. The database holds **records** — a post's title, author, timestamp. The file store holds **files** — the actual photo bytes. You never put a 3 MB image in a database field; you upload the file to the store and keep its *path* as a string in the database record. The record points at the file. (This is why deleting a post deletes *two* things: the record and the file it referenced.)

**Access policy (rules / RLS).** A small declarative layer that answers one question: *"This browser, carrying this identity token, is trying to read/write this exact path/row — allowed or not?"* It is the real security boundary **for direct browser access**. And here is the rule about rules you must never forget:

> **Security rules do not apply to trusted server-side code.** A function using an admin/service credential (Firebase Admin SDK; Supabase service-role key) reads and writes whatever it wants, rules or no rules. Rules govern the *direct* path from the browser; functions are governed by their own code.

**Identity.** Issues a signed token proving who the caller is, optionally carrying **claims** (e.g. `resident: true`). Two different consumers check it: a function verifies it server-side before trusting a write; a rule reads it to allow a direct read.

## Part 2: The Two Paths to Your Data (The Core Mental Model)

Everything above collapses into one picture. A browser can reach your data **two ways**, each with a *different* guard:

```
   Path A (direct)      ┌──────────────────────────────┐
   browser ───────────► │ reads governed by RULES / RLS │
                        │ database / file store          │
                        └──────────────────────────────┘

   Path B (mediated)    ┌───────────────┐  admin cred   ┌──────────────┐
   browser ───────────► │   function    │ ────────────► │ database /   │
                 token  │  (your code)  │  (bypasses     │ file store   │
                        └───────────────┘   rules)       └──────────────┘
                         guarded by YOUR code
```

- **Path A — direct.** The browser talks straight to the database/store. The *only* guard is the **rules/RLS**. If the policy allows it, it happens.
- **Path B — mediated.** The browser calls a function, which does the work with an admin credential. Rules are irrelevant here; **your function code is the guard.**

The Firebase example uses a deliberate **hybrid**: **reads go direct (Path A), writes go through functions (Path B).** Reads of a public feed carry no invariant to protect, so letting residents read directly means the UI live-updates cheaply with no server round-trip. But every *write* must enforce something (you are a resident; you are the author; you're under the rate limit; the photo you referenced is really an image under 5 MB), so writes are funneled through functions where that logic can't be bypassed — and the write rules stay fully locked, because nothing legitimate writes directly.

The payoff question a learner should be able to answer: *"If writes go through a function that checks everything, why do the rules on that table/collection matter at all?"* (Answer: they're what stops the **direct** path. Without a locked write policy, a user could skip your function entirely and write from the browser console.)

## Part 3: What "Deploy" Actually Touches (The Matrix)

Here is the part that prevents real incidents. Each layer ships a **different way**. "I merged the pull request" is *not* a universal deploy — it only ships the layer your static host serves.

| You changed… | Example | How it goes live | Merging a PR enough? |
|---|---|---|---|
| **Frontend** (HTML/CSS/JS) | A button label; a client-side page list | `git push` → **static host** (e.g. GitHub Pages) auto-deploys | ✅ Yes |
| **Backend code** | A new/edited function | A backend deploy command (e.g. `firebase deploy --only functions`), run from your machine/CI | ❌ **No** |
| **Database rules / RLS** | Open a table to authenticated reads | A rules deploy (e.g. `firebase deploy --only firestore:rules`; or a migration) | ❌ No |
| **File-store rules** | Change the upload size cap | A storage-rules deploy (e.g. `firebase deploy --only storage`) | ❌ No |
| **Data** | A post; an uploaded photo | Not deployed — created/changed **at runtime** by code, users, or the console | — (n/a) |

Read that table twice. The reason a change can "not take" is almost always here: a change to **backend code or rules** was merged to the main branch (which updates the *frontend* via the static host) but the **backend deploy was never run**, so the live functions/rules are still the old version. Frontend and backend can live in the *same Git repo* and still ship through **two independent pipelines**.

A real worked example from the Firebase project:

> **The stale-function trap.** Adding one page to the site's analytics touched three files: the frontend list (a client `.js` file), a server-side allow-list *inside a Cloud Function*, and an admin label. Merging the PR shipped the frontend instantly — but the server still rejected the new page until `firebase deploy --only functions` ran. Until then, the feature was "merged" and still not working. Two files in the *same commit* went live at *different times*, through different pipelines.

## Lab 1: Map Your Own App

**Goal:** Turn the reference table into a drawing of *your* system.

**Steps:**

1. List the top-level files/folders of your project. Label each: **frontend code**, **backend code**, **data**, **policy/config**, **identity**. (Data usually has *no* file — it lives in the cloud, not the repo.)
2. Draw the boxes (host, function, database, file store, rules) and an arrow from your frontend to each backend piece it talks to.
3. For one feature end to end (e.g. "post with a photo"), trace the path: which file renders the form, where the photo is uploaded, which function is called, what it writes, and where.

**Discussion prompts:**

- Which of your files could a stranger read in full by viewing source? Does any contain something that shouldn't be public?
- Where does your data actually live, given it's not in your Git repo?

## Lab 2: Watch the Two Paths in the Network Tab

**Goal:** See Path A vs. Path B with your own eyes (builds on Module 2's DevTools skills).

**Steps:**

1. Open your app, sign in, open DevTools → **Network** → filter **Fetch/XHR**.
2. Do something that **reads** data. Look at the request host — a direct read talks to a database host (e.g. `firestore.googleapis.com`, or your Supabase project URL). **That's Path A.**
3. Do something that **writes** data. A mediated write talks to *your function* (e.g. `…cloudfunctions.net/createPost`, or `…/functions/v1/…`). **That's Path B.**

**Discussion prompts:**

- For the write, what is the guard — a rules file or your function code? For the read, which one?
- If you deleted the rules/RLS entirely, which of these two operations would become a security hole, and which would be unaffected?

## Lab 3: Build Your Deploy Matrix (and Predict Before You Ship)

**Goal:** Never again be surprised that a merge didn't change the live site.

**Steps:**

1. Fill in the Part 3 matrix with *your* actual commands.
2. Pick three real one-line changes — one frontend, one function, one rule/RLS — and **before** making them, write down exactly what ships each.
3. Make one of each, ship it the way you predicted, and confirm the live behavior changed only after the right command ran.

**Discussion prompts:**

- Which of your recent changes needed a backend deploy, and which were live on merge alone? Could you tell *before* shipping?
- If you batch several merged-but-undeployed backend changes, does one backend deploy ship them all at once? Why? (Hint: most deploy commands ship the whole current backend from your main branch, not a diff.)

## Lab 4: Find Your Trust Boundary in the Rules/RLS

**Goal:** Read a real policy and locate exactly where "direct access" is allowed vs. denied.

**Steps:**

1. Open your `firestore.rules` (or your RLS policies). Find a table/collection with read allowed but write **not** allowed for ordinary users.
2. Explain out loud: who can read it directly, who cannot, and *why writes are still safe* even though the browser can't write directly.
3. Find the matching write path — the function that *does* write it — and list the checks it performs first.

**Discussion prompts:**

- Why is "readable directly, writable only via a function" a sensible default for a social feed?
- What would break (security-wise) if you added "allow write if signed in" to that table "to make writes simpler"?

## Lab 5 (Capstone): The "I Changed It But Nothing Happened" Post-Mortem

**Goal:** Diagnose a stale-deploy incident from first principles.

**Scenario (real):** A feature was added by editing three files — a frontend list, a server-side allow-list *inside a function*, and an admin label. The PR was merged. The frontend change was live within a minute. But the feature still didn't work. Minutes later it suddenly started working, with no further code change.

**Steps / reasoning:**

1. Using the deploy matrix, classify each of the three edited files by pipeline.
2. Explain why the frontend half worked immediately and the function half did not.
3. Identify the single action that "fixed" it minutes later (no code changed).
4. Write the one-sentence rule that would have predicted this before merging.

**Discussion prompts:**

- Why can two files in the *same commit* go live at *different times*?
- What lightweight habit (a checklist line, a PR note) makes "does this need a backend deploy?" impossible to forget?

## Assessment / Checklist (Learner Self-Check)

- I can name the kinds of piece in a serverless app and say what each is for
- I can classify any file in my project as frontend code, backend code, data, policy, or identity
- I can explain why a photo goes in the file store and its path goes in the database
- I can state the one case where rules/RLS do **not** apply (trusted server-side code), and why that matters
- I can describe the two paths to data (direct vs. via a function) and name the guard on each
- I can produce the deploy matrix for my app and predict what ships a given change
- I can diagnose a "merged but not live" bug by reasoning about layers and pipelines

## Notes for Curriculum Build-Out (Next Steps)

- This module is intentionally the architecture/deploy counterpart to Module 8 (one piece, deep) and Module 2 (reading the wire). A learner who has done Modules 2, 5–8 and this one can draw the whole system and reason about where any behavior is decided and how it ships.
- Consider a short companion on **CI/CD**: what it takes to make the backend deploy happen automatically on merge, and the trade-offs — this is exactly the manual step that caused the stale-function incident.
- Consider folding the deploy matrix into a one-page printable "pre-merge checklist" artifact learners keep next to their editor.
- Source session used for this draft: windsor-swan (neighborhood site — GitHub Pages frontend + Firebase Cloud Functions / Firestore / Storage / Auth backend), November 2026, including the real site-analytics stale-function deploy incident used in Lab 5. Chosen deliberately as a Firebase counterpoint to the Supabase worked example in Modules 5–8.

# Technology Literacy Curriculum (TLC)

## Module 10: Privacy by Design — Protecting Real People's Data in a Real App

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** D — Data, Privacy & Product Thinking
**Format:** Guided reading + privacy-analysis labs
**Prerequisite:** Module 5 (Databases), Module 6 (Auth)
**Leads into:** Module 11 (Data Pipelines), Module 13 (Capstone)

**Sequencing note:** Once you can store data (M5) and know who's asking (M6), the next question
isn't "what can we collect?" but "what *shouldn't* we, and how do we share aggregates without
exposing individuals?" This module is the ethics-and-engineering of real users' data, taught
through features that were deliberately designed to reveal less.

## Why This Module Exists

A neighborhood app holds sensitive things: home addresses, who's away, utility usage, who bought
what. The easy path is to collect everything and show it freely. `windsor-swan` repeatedly took
the harder, better path — and those decisions are a compact, real curriculum in **privacy by
design**: build privacy into the system's shape, rather than bolting on a policy afterward.

Two features anchor the module. A **neighborhood water-usage trends** card shows residents typical
usage — but is engineered so it can **never reveal an individual household**, using a technique
called **k-anonymity**. And the site's **analytics** counts page views while storing **no IP
address, no identity, nothing** that could track a person. Seeing *how* those were built teaches
privacy as engineering, not slogans.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Define **PII** (personally identifiable information) and give examples relevant to a community app
2. Explain **data minimization** — collecting and storing the least data that makes a feature work
3. Explain **aggregation** and why an average can be safe where raw rows are not
4. Explain **k-anonymity** and how a minimum-group-size threshold (suppress below *k*) prevents re-identification
5. Explain **re-identification risk** — how "anonymous" aggregates can still expose an individual when groups are tiny
6. Explain the difference between an **aggregate-only server path** and exposing the underlying rows
7. Reason about a **public artifact** (a file anyone can read) and what may and may not go in it
8. Apply a "**privacy floor**" mindset: design so the system *cannot* leak, not merely *promises* not to

## Core Concepts

### PII and data minimization

**PII** is anything that identifies a person: name, address, email, phone, account number, and
combinations that pin someone down. The first principle of privacy engineering is **data
minimization**: don't collect what you don't need, don't store what you don't have to, and don't
keep it longer than necessary. The water-bill feature embodies this — it extracts the few numbers
it needs and **never stores the raw bill**.

### Aggregation: averages are safer than rows

A single household's water usage is sensitive (it can hint whether a home is vacant). But the
**neighborhood average** reveals nothing about any one home — *as long as it's computed over
enough homes*. So the trends feature returns **aggregates only** (typical monthly usage, a
household count, a simple trend), computed **on the server**, and the raw per-household rows
**never leave the server**. The browser gets the summary, not the data behind it.

### k-anonymity and the privacy floor (the key technique)

Aggregation alone isn't enough: an "average" over **one** household *is* that household. So the
feature enforces **k-anonymity** — a result is only shown if it's drawn from at least *k* distinct
people. `windsor-swan`'s thresholds: the whole response is **suppressed below 8 households**, and
any single **month** is suppressed below **5**. Below the floor, the UI says "not enough data
yet" rather than risk exposing a small group. This is a **privacy floor**: the system is built so
it *cannot* show a too-small group, regardless of who asks.

**Key insight for learners:** anonymity isn't a promise you make; it's a property you **enforce**.
"We won't show individuals" is a policy; "the code refuses to return a group smaller than 8" is a
guarantee.

### Re-identification: why tiny groups leak

If a "neighborhood average" were computed from 2 homes and you know one of them, you can derive
the other. Small cells leak. The same logic is why census and health data are released only in
large buckets. The 8-household / 5-per-month floors exist precisely to block this "average of a
tiny group" re-identification — and the notes say if those floors are ever lowered, that risk must
be re-checked.

### Analytics that store no identity

The site counts page views to learn what's popular — but **stores no IP, no visitor ID, no
location, nothing personal**. A day's record is just counts. The IP is used **only** momentarily
for a rate-limit check and never written down. Because no identity is stored, there's literally
**nothing to leak and no one to track** — the most private analytics is the kind that can't
profile anyone even if its database were stolen. (A neat consequence: there's no "opt out of
tracking by account," because there's no account-level tracking to opt out of — the opt-out is
simply per-device.)

### Public artifacts: assume the whole world reads it

Some data is intentionally public — `windsor-swan` has a public ticket-buyer file for a community
event. The rule written around it is strict and instructive: **names, addresses, and counts only
— never emails, phones, or payment details.** When a file is public, "who can see this?" is
"everyone, forever," so the only safe contents are what you'd be comfortable publishing on a
bulletin board.

## Lab 1: Classify and minimize

**Goal:** Build the data-minimization reflex.

**Steps:**

1. For a feature idea — say, a neighborhood **carpool board** — list every field you *could*
   collect. Then cross out everything not strictly required for the feature to work.
2. For each survivor, note: does it need to be *stored*, or only *used in the moment* (like the
   IP in the analytics rate-limit)? Where it's only momentary, don't persist it.
3. Identify which remaining fields are **PII**, and which would be safe in a **public** version of
   the board.

**Discussion prompts:**

- Which fields did you keep "just in case," and what's the cost of keeping them?
- How does *not storing* something beat *securing* it?

## Lab 2: Set a privacy floor (k-anonymity on paper)

**Goal:** Reason about re-identification and choose a threshold.

**Steps:**

1. Imagine a "trends" feature for a **street** with only 6 homes. Explain how a "street average"
   could expose an individual, and whether a per-street view should exist at all.
2. Pick a minimum group size *k* for a neighborhood-wide version and justify it. Then decide what
   the UI shows when a slice falls below *k*.
3. Stress-test it: name a way someone might *still* narrow a group below *k* (e.g., filtering by
   month + street), and how you'd prevent it (suppress the smaller of the two cells).

**Discussion prompts:**

- Why does windsor-swan suppress an individual **month** at a *lower* floor (5) than the whole response (8)? What attack does the per-month floor specifically block?
- Who is harmed if the floor is set too *low*? Who is inconvenienced if it's too *high*? How do you weigh those?

## Lab 3: Audit what leaves the server

**Goal:** Distinguish an aggregate-only path from a raw-data leak.

**Steps:**

1. Using Module 2's DevTools skill, trigger a "stats/trends" feature on any app and inspect the
   **response**. Is it **summary numbers**, or does it contain **per-record rows** (names,
   addresses, IDs)?
2. If rows are present, note what an attacker gains that a summary wouldn't give them.
3. Describe where the computation *should* happen (server) and what the browser *should* receive
   (only the aggregate), mirroring the windsor-swan `getWaterTrends` design.

**Discussion prompts:**

- Why is "compute the average in the browser from raw rows" a privacy failure even if the UI only *shows* the average?
- How does this reuse the Module 4/6 principle that the server is the only trustworthy boundary?

## Assessment / Checklist (Learner Self-Check)

- I can define PII and give community-app examples
- I can explain data minimization and "don't store what you only need momentarily"
- I can explain why an aggregate can be safe where raw rows are not
- I can explain k-anonymity and how a suppress-below-*k* floor prevents re-identification
- I can explain re-identification risk from tiny groups
- I can distinguish an aggregate-only server path from a raw-data leak
- I can state what may and may not go in a public artifact
- I can articulate the "enforce it, don't just promise it" privacy-floor mindset

## Notes for Curriculum Build-Out (Next Steps)

- Consider a light touch on **differential privacy** as the "next level up" from k-anonymity, flagged but not required.
- Consider a short companion on **consent and transparency** (telling users what you collect) to pair the technical floor with the human one.
- Consider connecting to regulation (GDPR/CCPA data-minimization principles) for learners heading toward roles where it's required.
- Source session used for this draft: windsor-swan's `getWaterTrends` k-anonymity design (suppress below 8 households / 5 per month, aggregate-only, raw docs never leave the server), the analytics path that stores no IP/identity, and the public ticket-file rule ("name, address and ticket count only: never emails, phones or payment details").

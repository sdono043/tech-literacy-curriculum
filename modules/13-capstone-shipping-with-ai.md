# Technology Literacy Curriculum (TLC)

## Module 13 (Capstone): Shipping Real Software with an AI Agent — As a Non-Engineer

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** D — Data, Privacy & Product Thinking (capstone — integrates all prior domains)
**Format:** Reflective reading + a real, shippable capstone project
**Prerequisite:** Modules 1–12 (this module assumes their vocabulary)
**Leads into:** The learner's own continued building

**Sequencing note:** This is the finale. Modules 1–12 taught the *parts* of a modern app. This
one teaches the **workflow** that lets someone with no engineering background actually build and
ship one — by directing an AI coding agent, reviewing its work, and shipping through pull
requests. It's the module that turns the curriculum from "understanding tech" into "producing
it."

## Why This Module Exists

The entire `windsor-swan` project — a real neighborhood platform with accounts, a database,
payments-adjacent data, email, push notifications, a marketplace, privacy-engineered analytics,
and a data migration — was **built and shipped by someone with no prior software-development
background**, working through an AI coding agent, one pull request at a time. That is the proof
of concept this whole curriculum is built around, and this module names the skills that made it
possible.

Those skills are *not* "learn to code." They're the skills of a good **director and reviewer**:
describing what you want precisely, reading a change well enough to approve it, verifying claims
instead of trusting them, noticing the recurring traps (merge order, stale cache, trade-offs),
and capturing decisions so they stick. For a capable adult entering tech — a transitioning
veteran, a career-changer — these are more immediately employable than syntax, and they're what
the prior twelve modules quietly trained.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Describe the **direct → review → ship** loop of building software with an AI agent
2. Write a **clear, testable requirement** ("done looks like…") instead of a vague wish
3. **Review a change** (a PR / diff) well enough to accept or push back, even without writing the code
4. **Verify claims** independently rather than trusting "it's fixed" (tie to Modules 2, 4, 9)
5. Run a durable **feedback loop** — collect, triage, act, and **mark done** so nothing is lost or redone
6. Capture decisions and conventions so they **persist** across sessions (project docs / a `CLAUDE.md`-style memory)
7. Recognize the **recurring judgment traps** from this curriculum and apply the right habit to each
8. Scope and ship a **real, small project** end to end

## Core Concepts

### The loop: direct → review → ship

Building this way is a repeating cycle:

1. **Direct** — state the goal and constraints clearly.
2. The agent proposes a change as a **pull request** (Module 3).
3. **Review** — read the PR's description and diff; ask questions; request changes.
4. **Ship** — merge; the site deploys (Module 3); **verify** it actually works (below).
5. Repeat.

Your leverage is almost entirely at steps 1, 3, and 4 — *directing, reviewing, verifying*. You
don't have to write the code to own the outcome.

### Good requirements: "done looks like…"

The quality of what you get is bounded by the clarity of what you ask. Vague: "make the services
section nicer." Clear: "group services by category, each category **collapsed** by default with a
count like *Carpentry (3)*, click to expand." The second is **testable** — you can look and say
yes/no. A good requirement names the behavior, the edge cases, and what "done" looks like. Much of
this project's back-and-forth was exactly this: turning a wish into a checkable spec.

### Reviewing without coding

You can meaningfully review a change you couldn't have written:

- Read the **PR description**: does it claim to do what you asked, and only that?
- Skim **"Files changed"**: are the touched files the ones you'd expect? A privacy change touching
  the payments file is a flag.
- Ask the **"what if"** questions this curriculum trained: *Is the secret still server-side (M7)?
  Does this still escape user input (M8)? Does it store less, not more (M10)?*
- Push back in plain language. "Won't this send the email after the response?" is a review comment
  that caught a real class of bug (M4).

### Verify, don't trust (the habit that recurs most)

"It's fixed" is a hypothesis, not a fact. This curriculum hammered verification because the
project did:

- A function returned success but the email never sent — **verified** by the absent log line (M4).
- A fix was "shipped" but you saw the old version — it was a **stale cache**, confirmed by
  checking a fresh context (M9); another time a fix truly **hadn't** reached `main` due to merge
  order (M3). *Same symptom, opposite causes — only verification tells them apart.*
- An "outage: all clear" banner was **cross-checked** against the utility's own map (M2).

The reviewer's job is to verify the claim against **ground truth**, every time.

### A durable feedback loop (collect → triage → act → mark done)

Real products run on feedback. `windsor-swan` had a feedback widget, and "process feedback" became
a repeatable routine: read each item, **ignore noise/tests**, check whether it's *already fixed*
(often it was — stale cache, M9), fix what's real through a PR, and then **mark the item done** so
the next cycle skips it. The marking matters: without a durable "done" signal, you either lose
track or redo work. (Here, handled items were labeled `feedback-processed` so later cycles skipped
them.) A loop without a memory isn't a loop — it's a treadmill.

### Make decisions stick (project memory)

A recurring question on this project was, in effect, *"how will you remember this next time?"* The
answer isn't the agent's memory — it's **writing the decision into the project**. Conventions,
trade-offs, and "why we did it this way" belong in a durable project document (this project used a
`CLAUDE.md` the agent reads at the start of every session). Capturing *why* — "the gate is a
deterrent *by choice*," "sign-in is email-only *as a trade-off*" — is what keeps a project
coherent across time and across people. **Decisions that live only in one conversation are
decisions you'll relitigate.**

### The recurring judgment traps (your field guide)

This curriculum is, underneath, a set of reusable instincts. The capstone is where you carry them:

| Trap | The habit that defeats it | Module |
|---|---|---|
| "I pushed it" ≠ "it's live" | Check it's merged to `main` and deployed | 3 |
| Work after the response is lost | Finish the important work *before* responding | 4 |
| "Saved" ≠ "readable" | Verify the data's **shape**, read it back | 5 |
| A client-side check isn't security | Enforce on the server | 6 |
| Not all "keys" are secret | Public vs. private; secrets stay server-side | 7 |
| Input can become code | Escape output, constrain input | 8 |
| "It's not showing" | Fresh context first: stale cache vs. failed deploy | 9 |
| Collecting everything | Minimize; enforce a privacy floor | 10 |
| Re-running an import duplicates | Make it idempotent; verify counts | 11 |
| "Just send the email" | Transactional vs. opt-in; easy unsubscribe | 12 |
| "It's fixed" | Verify against ground truth | all |

## Capstone Project: Build and Ship Something Real

**Goal:** Direct an AI coding agent to build a small but *complete* app, shipped publicly, applying
the whole curriculum.

**Suggested scope (pick one, keep it small):** a neighborhood tool-lending board; a club events
page with RSVPs; a personal "links" dashboard; a simple sign-up sheet with admin review.

**Requirements (hit each, however small):**

1. **Ship it** on a real host via the branch → PR → merge → deploy loop (M3), ideally on your own
   domain (M1).
2. Include at least one **backend action** (a form that writes data), done server-side (M4) to a
   **database** you modeled (M5).
3. Have **two kinds of user** (e.g., visitor vs. admin) with the authN/authZ line drawn correctly,
   and be honest about any **deterrent-only** gate (M6).
4. Keep every **secret server-side** and verify from the browser that none leaks (M2, M7).
5. **Escape and validate** every user-supplied field; test one benign XSS probe against your own
   app (M8).
6. Make it an installable **PWA** if it fits, and write one sentence telling users how to get the
   latest version (M9).
7. **Minimize data**; if you show any aggregate, protect small groups (M10).
8. If you import any existing data, make the import **idempotent** and verify it (M11).
9. If it notifies anyone, get the **transactional/opt-in** line right with an unsubscribe where
   needed (M12).
10. Keep a **project doc** capturing your key decisions and *why* (the M13 memory habit), and run
    one **feedback cycle** (collect → act → mark done).

**Deliverables:** the live URL, the repository with its PR history, and a one-page write-up:
what you built, three decisions you made and why, one bug you caught by **verifying**, and one
thing you'd do next.

**Discussion prompts:**

- Where did you add the most value — directing, reviewing, or verifying? What does that tell you about the role you could do professionally?
- Which judgment trap from the table almost got you, and which habit saved you?
- What did you write into your project doc that future-you will be glad is there?

## Assessment / Checklist (Learner Self-Check)

- I can describe the direct → review → ship loop and where my leverage is
- I can turn a vague wish into a clear, testable requirement
- I can review a PR/diff well enough to accept or push back without writing the code
- I can verify a claim against ground truth instead of trusting "it's fixed"
- I can run a feedback loop that collects, acts, and durably marks items done
- I can capture decisions so they persist across sessions
- I can name the recurring judgment traps and the habit that defeats each
- I shipped a real, small project end to end

## Notes for Curriculum Build-Out (Next Steps)

- This is the natural home for the project's **veteran-transition / workforce** framing: the skills here (clear direction, review, verification, documentation, judgment) are immediately employable and transfer across tools and roles.
- Consider a rubric for grading capstone projects against the 10 requirements, for cohort/classroom use.
- Consider a short "working with an agent" etiquette section: giving context, correcting course, and knowing when to ask for a plan vs. an action.
- Consider a reflective companion: "what the agent is good at vs. where human judgment is irreplaceable," so learners build calibrated trust rather than over- or under-reliance.
- Source session used for this draft: the entire windsor-swan build — shipped by a non-engineer through PRs — including the "process feedback" routine with the `feedback-processed` labeling workflow, the "how will you remember this next time?" question that led to writing conventions into `CLAUDE.md`, and the recurring verify-don't-trust moments (merge order, stale cache, the fire-and-forget bug) catalogued across Modules 1–12.

# Technology Literacy Curriculum (TLC)

## Module 18: Data Pipelines & Migration — Moving Real Data, and Why Matching Names Is Hard

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Track:** 5 — Architecture, Security & Shipping
**Format:** Guided reading + data-wrangling labs
**Prerequisite:** Module 5 (Databases)
**Leads into:** Module 20 (Capstone)

**Sequencing note:** Module 5 built a database from scratch. Real projects rarely start empty —
they inherit data from somewhere older (a mailing list, a spreadsheet, another system). This
module is about **getting existing data in cleanly**, and about the deceptively hard problem of
deciding when two records describe the **same person**.

## Why This Module Exists

The glamorous part of software is new features; the unglamorous, constant part is **data
migration** — taking data that lives in one shape and moving it into another, without
duplicating, losing, or corrupting it. `windsor-swan` did this for real: a neighborhood's
**service recommendations and kids' businesses lived in a mailing list**, and they were
**migrated into the database** so residents could keep growing them after the mailing list went
away.

Two real moments make the lessons concrete. An import reported **"Imported 95, skipped 2"** — and
understanding *why* 2 were skipped (they were duplicates by name, already present) is the whole
lesson in **idempotency**. And on the neighbor map, the system had to decide that a sign-up named
**"Jay"** and a public record named **"James Amato"** were the **same household** — a fuzzy
**name-matching** problem with real traps (nicknames, spouses, middle names).

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain what a **data migration / pipeline** is and the stages **extract → transform → load (ETL)**
2. Explain **idempotency** — why an import must be safe to run more than once without duplicating
3. Interpret an import summary ("imported *N*, skipped *M*") and explain what "skipped" protects against
4. Explain **deduplication** and the idea of a **match key** (what makes two records "the same")
5. Describe why **name matching** is hard: nicknames, prefixes, middle/maiden names, multi-person entries, ordering
6. Reason about **false merges vs. false splits** and which is worse in a given context
7. Explain why migrations should **preserve provenance** (where each record came from) and be **verified** after loading
8. Handle **messy, real** source data defensively (encoding, duplicates, partial records)

## Core Concepts

### Migration and the ETL shape

Moving data almost always follows **ETL**:

- **Extract** — read it out of the old source (parse the mailing-list text, read a spreadsheet).
- **Transform** — clean and reshape it into the new model (Module 5): split names, normalize
  categories, drop junk, decide field names.
- **Load** — write it into the new database.

On `windsor-swan`, the mailing-list entries were parsed into a structured file and then imported
into the `serviceSubmissions` / `kidBusinesses` collections as pre-approved records that remember
`source: "migrated"` — provenance baked in.

### Idempotency: safe to run twice (the "skipped 2" lesson)

A good importer is **idempotent**: running it again doesn't create duplicates. `windsor-swan`'s
importer checks each incoming vendor against what's already there **by name**, and **skips**
anything already present. That's why the run said **"Imported 95, skipped 2"** — those 2 weren't
errors; they were entries whose names already existed (one vendor had been listed under two
categories, so the second occurrence was a duplicate by name and correctly skipped). The kids'
import showed the same thing: *"Imported 7, skipped 2"* — two kids listed under two categories
each.

**Key insight for learners:** "skipped" is a feature, not a failure. An importer you can safely
re-run (because it won't double-load) is one you can trust; a non-idempotent importer makes every
re-run a landmine.

### Deduplication and the match key

To skip duplicates you need a **match key** — the field(s) that decide "same record." Name was the
key here, which is simple but imperfect (two different vendors could share a name; the same vendor
could be spelled two ways). Choosing a match key is a judgment call: too loose merges distinct
records (**false merge**); too strict keeps duplicates (**false split**).

### Why name matching is genuinely hard (the Jay/James case)

The neighbor map needed to show one household per home, merging a **sign-up name** with a **public
ownership record** and ticket-buyer names — without listing the same person twice. That requires
deciding when two names are the **same person**, and names resist it:

- **Nicknames that aren't prefixes:** "Jay" is a nickname for "James," but "Jay" is *not* the
  start of "James," so a naive "is one a prefix of the other?" check fails. The real system needed
  a small **nickname table** (Jay→James, Bob→Robert, …) on top of prefix matching.
- **Prefix nicknames:** "Sam"/"Samuel" *do* share a prefix, so those match differently than Jay/James.
- **Multi-person entries:** a ticket record "Rachel & James Amato" is **two** people in one
  string; it must be split before matching, or "Jay" (James) never lines up with the "James"
  buried inside it.
- **Whose name wins:** the resident typed "Jay" the way they want to be shown, so the sign-up name
  should **win the display** over the record's "James."
- **Last-name safety:** a shared first-name nickname must still require the **same last name**, or
  you'd merge two unrelated families.

The correct result — showing **"Jay & Rachel Amato"** for that home — required *all* of those
rules together. Get one wrong and you either duplicate a person or merge two who aren't the same.

### False merge vs. false split — and which is worse

- A **false merge** (two different people shown as one) can **hide** or **expose** the wrong
  person — often the more harmful error.
- A **false split** (one person shown twice) is **visible and annoying** but usually safer.

Which you tune toward depends on context. On a neighbor map, a duplicate name is a cosmetic
nuisance; merging two different neighbors could misattribute a home — so the rules lean
conservative (require matching last name; don't merge on a shared nickname alone).

### Provenance and verification

Every migrated record kept a `source` marker, so later you can tell migrated data from
resident-entered data — essential for trust and for undoing a bad import. And every migration
ends with **verification**: after loading, confirm the counts and spot-check records (the
"Imported 95, skipped 2" summary *is* that verification surface). A migration you didn't verify is
a migration you don't actually trust.

## Lab 1: Plan an ETL migration

**Goal:** Turn a messy source into a clean target plan.

**Steps:**

1. Take a messy source: a plain-text list of neighborhood vendors (name, category, a phone,
   free-text recommendation), with some vendors listed twice under different categories.
2. Write the **Extract** step (how you'd read it), the **Transform** step (fields you'd produce:
   `name`, `category`, `contact`, `recommendation`, `source`), and the **Load** target (a
   collection shape from Module 5).
3. Decide your **match key** for deduplication and predict how many of the duplicates it will skip.

**Discussion prompts:**

- A vendor appears under "Carpentry" and "Fencing." With a name-based match key, what happens on import, and is that the behavior you want?
- Where would you record provenance, and what future problem does it solve?

## Lab 2: Design a name-matcher (the hard part)

**Goal:** Experience why "same person?" resists simple rules.

**Steps:** For each pair, decide **same person** or **not**, and state the rule that decides it:

1. "Sam" (sign-up) vs. "Samuel Reyes" (record), same address.
2. "Jay" (sign-up) vs. "James Amato" (record), same address.
3. "Jay Smith" vs. "Jay Jones", same address.
4. "Rachel & James Amato" (ticket) vs. "Jay Amato" (sign-up), same address.
5. "Ann Merideth" vs. "Ann Merideth Donovan", same address.

Then write the **minimal set of rules** that gets all five right (hint: it needs *prefix match*,
*a nickname table*, *split multi-person strings*, and *require same last name*).

**Discussion prompts:**

- Which single rule, if removed, breaks the Jay/James case? Which breaks the "Rachel & James" case?
- For #3, why is "same first name, same address" **not** enough to merge?

## Lab 3: Idempotency and verification

**Goal:** Internalize "safe to re-run" and "always verify."

**Steps:**

1. Describe what a **non-idempotent** importer would do if run twice on the same source, and the
   mess it creates.
2. Design the check that makes it idempotent (the match-key skip), and write the summary line
   you'd want it to print.
3. Write the **verification** you'd do after the first run: what counts you'd confirm and which
   records you'd spot-check.

**Discussion prompts:**

- Someone clicks "Import" twice by accident. With your design, what happens, and how does the summary reassure you?
- Why is "Imported 95, skipped 2" more trustworthy output than "Done"?

## Assessment / Checklist (Learner Self-Check)

- I can explain data migration and the extract → transform → load stages
- I can explain idempotency and why an importer must be safe to re-run
- I can interpret an "imported N, skipped M" summary and say what "skipped" protects
- I can explain deduplication and choosing a match key
- I can explain why name matching is hard (nicknames, prefixes, multi-person strings, ordering)
- I can reason about false merges vs. false splits and which is worse in context
- I can explain why migrations preserve provenance and must be verified

## Notes for Curriculum Build-Out (Next Steps)

- Consider a hands-on with a real messy CSV (encoding issues, duplicate rows) and a small script to clean it, for learners heading toward data roles.
- Consider a short companion on **entity resolution** as the formal name for the Lab 2 problem, with a note on how larger systems use it.
- Consider connecting provenance to the privacy module (knowing a record's origin is also a privacy and consent concern).
- Source session used for this draft: windsor-swan's mailing-list → Firestore migration (`adminImportServices` / `adminImportKidBusinesses`, idempotent, `source:"migrated"`), the real "Imported 95, skipped 2" / "Imported 7, skipped 2" runs, and the `mergeHouseholdNames` name-matching work that resolved sign-up "Jay" + record "James Amato" + ticket "Rachel & James Amato" into "Jay & Rachel Amato."

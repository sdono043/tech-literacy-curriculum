# Technology Literacy Curriculum (TLC)

## Module 5: NoSQL Databases & Data Modeling — Where the Data Lives, via a Real Silent Bug

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** C — Web & Cloud Application Architecture
**Format:** Guided reading + modeling exercise, anchored on a real data bug
**Prerequisite:** Module 4 (Serverless Backends)
**Leads into:** Module 6 (Auth), Module 10 (Privacy by Design), Module 11 (Data Pipelines)

**Sequencing note:** Module 4 showed functions doing trusted work; most of that work is reading
and writing data. This module introduces the database those functions talk to — a **document
database (Firestore)** — and uses a real "the data is there but the screen says empty" bug to
teach how its data is actually shaped.

## Why This Module Exists

"The database" is where a beginner assumes their app's memory lives, but *how* that memory is
organized determines what the app can and can't do cheaply. `windsor-swan` uses **Firestore**, a
**NoSQL document database**: instead of rigid tables with fixed columns, data is stored as
flexible **documents** (like little JSON objects) grouped into **collections**. That flexibility
is powerful and also the source of a whole class of quiet bugs.

This module is anchored on one such bug. The admin analytics page kept saying **"no page data
yet"** even though visits were happening. The cause was a single mis-shaped write: the code
*intended* to record a count under `pages → home`, but a small syntax choice wrote a field
literally *named* `"pages.home"` instead of a nested `pages` object containing `home`. The data
was being saved — just in a shape nothing read back. Learning to see data *as shapes* is the
skill this module builds.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain the difference between a **relational (SQL) table** and a **NoSQL document**
2. Define **collection**, **document**, **field**, and **subcollection**, and read a document as a JSON-like object
3. Model a simple real feature as collections/documents and justify the shape
4. Explain when to use a **subcollection** instead of an **array inside a document**, and why (contention / growth)
5. Explain the difference between **merge/update** and **overwrite**, and how a **dotted key** (`"a.b"`) is treated as a *path* by one and a *literal name* by the other
6. Explain what **security rules** are and why "the database is locked by default, opened deliberately"
7. Distinguish a **direct client read** from a **server-only (Cloud Function) read**, and when each is appropriate
8. Diagnose a "data saved but nothing shows" bug as a **shape mismatch** between how data was written and how it's read

## Core Concepts

### Tables vs. documents

A **relational** database stores rows in tables with a fixed set of columns — every row of
`users` has the same columns. A **document** database stores **documents**: flexible objects
with whatever fields each needs, grouped into **collections**. A `marketplaceListings`
collection holds one document per listing; each document has fields like `title`, `price`,
`status`. There's no enforced column list, which is flexible — and means *nothing stops you from
writing the wrong shape*, which is exactly how the analytics bug happened.

### The building blocks

- **Collection** — a named bucket of documents (`residentApplications`, `kidBusinesses`).
- **Document** — one record, identified by an ID, holding **fields** (`{ status: "pending", createdAt: … }`).
- **Subcollection** — a collection *nested under a document*. On `windsor-swan`, each marketplace
  listing document has a `bids` **subcollection** — one document per bid — rather than a `bids`
  array field.

### Subcollection vs. array: a real modeling decision

Why are bids a subcollection and not just an array on the listing? Because several neighbors
might bid at nearly the same moment. If bids were an array *inside* the listing document, each
new bid would have to **read the whole document, add to the array, and write it back** — and two
people doing that at once can clobber each other (a "read-modify-write" race). A **subcollection**
lets each bid be its own independent document that's simply *added* — no rewriting a shared
object, no contention. **Lesson:** how you shape data is a decision about what happens under
concurrency, not just aesthetics.

### Merge vs. overwrite — and the dotted-key trap (the bug)

Writing a document has two modes:

- **Overwrite** — replace the whole document with what you provide.
- **Merge/update** — change only the fields you name, leaving the rest.

Here's the subtlety that caused "no page data yet." In Firestore, an **update** treats a key
with dots, like `"pages.home"`, as a **path** — "inside the `pages` object, the `home` field."
But a **merge-set** with that same string key treats it as a **literal field name** — it creates
a field whose name is the seven characters `pages.home`, *not* a nested structure. The analytics
writer used the merge form with a dotted key, so every visit dutifully created/updated a
literally-named `"pages.home"` field. The reader looked for a real nested `pages` object, found
nothing there, and reported empty. The data existed; its **shape** was wrong.

**Key insight for learners:** "the value saved" and "the value is readable" are different
claims. A silent data bug is almost always a **shape mismatch** between the write and the read.

### Security rules: locked by default, opened on purpose

A database reachable from the internet needs rules about who can read and write what.
`windsor-swan`'s **security rules** lock most collections completely — *no* direct client access
— so all reads and writes go through Cloud Functions (Module 4) that enforce the real checks.
A few collections are opened narrowly: signed-in residents can **read** marketplace listings
directly (so the page can show live updates), but **writes** still go only through functions.
The governing idea: **deny everything by default, then open the smallest necessary door.**

## Lab 1: Read a database as shapes

**Goal:** Stop seeing "the database" as a black box and start seeing documents.

**Steps:**

1. Write out, by hand, what a single `marketplaceListings` document might look like as a
   JSON-like object: an ID, plus fields `title`, `description`, `price`, `status`, `sellerUid`.
2. Now draw its `bids` **subcollection**: two or three bid documents, each with `amount`,
   `bidderUid`, `createdAt`.
3. Contrast: rewrite the same listing with bids as an **array field** instead. Note how "add a
   bid" differs between the two shapes (append a document vs. rewrite the whole listing).

**Discussion prompts:**

- Two neighbors bid within the same second. Walk through what happens in the array version vs. the subcollection version.
- Which shape makes "show me the 3 most recent bids" easier, and why?

## Lab 2: Model a new feature

**Goal:** Practice turning a feature description into collections and documents.

**Steps:**

1. Pick a simple feature: a neighborhood **tool-lending library**. Residents list a tool;
   others request to borrow it; the owner marks it returned.
2. Design the collections/documents. Decide: is a "borrow request" a field on the tool, or its
   own document in a subcollection? Justify using the contention reasoning from Lab 1.
3. List which fields must be set by a trusted **function** (e.g., `ownerUid`, `status`) versus
   supplied by the user (`toolName`, `description`), and why.

**Discussion prompts:**

- What goes wrong if you let the browser set `ownerUid` directly? (Tie to Module 4's "never trust the client.")
- Where would you store the *history* of who borrowed a tool, and how does that resemble the bids subcollection?

## Lab 3: Diagnose the silent shape bug

**Goal:** Recognize a write/read shape mismatch — the analytics bug — on sight.

**Steps:**

1. Study the two shapes the analytics writer could produce for a single day's document:

   ```
   WRONG (dotted key written as a literal field name):
   { "date": "2026-11-24", "views": 12, "pages.home": 9 }

   RIGHT (nested object the reader expects):
   { "date": "2026-11-24", "views": 12, "pages": { "home": 9 } }
   ```

2. The reader does the equivalent of "look inside `pages` for `home`." Explain why it returns
   nothing against the WRONG shape even though a `9` is clearly stored.
3. State the fix in one sentence (write a nested `pages` object / use the update-path form), and
   describe how you'd *verify* it: re-record a view and read the day's document to confirm the
   nested shape.

**Discussion prompts:**

- The count was never lost — it was saved every time. Why is "data present but unreadable" more insidious than "data missing"?
- How would writing a tiny read-back check right after a write have caught this immediately?

## Assessment / Checklist (Learner Self-Check)

- I can explain the difference between a relational table and a NoSQL document
- I can define collection, document, field, and subcollection and read a document as JSON
- I can model a simple feature and justify its shape
- I can explain when to use a subcollection instead of an array, in terms of contention
- I can explain how merge vs. overwrite differ and how a dotted key is treated by each
- I can explain what security rules are and the "deny by default, open narrowly" principle
- I can diagnose a "saved but nothing shows" bug as a shape mismatch

## Notes for Curriculum Build-Out (Next Steps)

- Consider a parallel mini-module contrasting this with a **relational/SQL** model of the same feature, so learners see both paradigms.
- Consider a hands-on Firestore-console exercise (create a collection, add a document, write a rule) for learners with a Firebase project.
- Consider expanding the security-rules thread into its own short module before Module 6, if testing shows learners need it.
- Source session used for this draft: the windsor-swan admin analytics "no page data yet" bug — a dotted-key `set({merge:true})` that wrote a literal `"pages.home"` field instead of a nested map — plus the marketplace bids-as-subcollection design decision and the locked-by-default `firestore.rules`.

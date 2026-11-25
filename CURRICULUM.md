# Technology Literacy Curriculum (TLC) — Master Syllabus

**Audience:** Capable adults with little or no software background — including transitioning
veterans moving toward technology roles — who learn best by doing real work on real systems.

**Method:** Every module is sourced from a *live hands-on session* on a *real, deployed
project*, not a toy example. A learner reads what a system actually did, audits a real app,
breaks and fixes a real thing, and ships a real change. The lessons that stick are the ones
that came from a genuine "wait, why didn't that just work?" moment — so those moments are the
curriculum.

**Format:** Self-paced Markdown modules. No special tooling required — a browser, a free
GitHub account, and (for later modules) a free Firebase project are enough. Each module is
self-contained but sequenced; later modules assume the vocabulary of earlier ones.

---

## How the curriculum is organized

The modules are grouped into four **domains** (thematic tracks) but are meant to be taken in
**numeric order** the first time through — the sequence is deliberately cross-domain, because
that's how real understanding builds (you need a little networking *and* a little Git before
serverless makes sense).

| Domain | What it builds |
|---|---|
| **A — Networking & Systems Fundamentals** | How a request finds a server, how a domain resolves, how mail is delivered |
| **B — Cybersecurity & Application Security** | Reading traffic, verifying secrets stay server-side, identity, and real vulnerabilities |
| **C — Web & Cloud Application Architecture** | How a modern app is actually assembled: hosting, version control, serverless, databases, offline |
| **D — Data, Privacy & Product Thinking** | Handling real people's data responsibly, migrating data, and shipping software as a non-engineer |

---

## The modules

Status key: ✅ published · ✍️ drafted · 🔜 planned

| # | Module | Domain | Status | Sourced from |
|---|---|---|---|---|
| 01 | [DNS & Domain Configuration](modules/01-dns-domain-configuration.md) | A | ✅ | Buying `vet-tech.org`, pointing it at GitHub Pages; the custom-domain work on `windsor-swan` |
| 02 | [Network & Application Security Literacy](modules/02-network-appsec-literacy.md) | A+B | ✅ | Chrome DevTools against `navy2010.com`, `sleddawg-fitness`, `windsor-swan` |
| 03 | [Static Hosting & the Git/GitHub/PR Workflow](modules/03-hosting-git-pr-workflow.md) | C | ✍️ | The whole `windsor-swan` shipping rhythm — branches, PRs, "~1-min deploy," and a real merge-order mix-up |
| 04 | [Serverless Backends (Cloud Functions)](modules/04-serverless-backends.md) | C | ✍️ | The Lost & Found email-alert bug: a function that froze before its background work ran |
| 05 | [NoSQL Databases & Data Modeling](modules/05-nosql-data-modeling.md) | C | ✍️ | "Why is there no page data yet?" — a silent analytics bug; Firestore collections, subcollections, and rules |
| 06 | [Authentication vs. Authorization](modules/06-authentication-authorization.md) | B | ✍️ | Two auth systems in one app; the "deterrent gate"; "can I log in as admin on the app?" |
| 07 | [Secrets & Credential Management](modules/07-secrets-credentials.md) | B | ✍️ | "Can I paste a key pair in this chat — is that secure?"; public vs private keys; passwords, passkeys & Keychain |
| 08 | [Web Application Vulnerabilities: XSS & Input Validation](modules/08-web-vulnerabilities-xss.md) | B | ✍️ | A real stored cross-site-scripting bug: "how would I exploit that — can I test it on my own accounts?" |
| 09 | [Progressive Web Apps & Caching](modules/09-pwa-and-caching.md) | C | ✍️ | The recurring "I don't see the change — quit and reopen the app" confusion; service workers & cache strategy |
| 10 | [Privacy by Design](modules/10-privacy-by-design.md) | D | ✍️ | Anonymized neighborhood water-usage trends (k-anonymity); analytics that store no identity |
| 11 | [Data Pipelines & Migration](modules/11-data-pipelines-migration.md) | D | ✍️ | Migrating a mailing list into a database; "it said 2 skipped"; matching "Jay" to "James" |
| 12 | [Email & Notification Deliverability](modules/12-email-notification-deliverability.md) | A+D | ✍️ | Transactional vs. opt-in email, unsubscribe headers, app passwords, and why carrier text gateways died |
| 13 | [Capstone — Shipping Software with an AI Agent](modules/13-capstone-shipping-with-ai.md) | D | ✍️ | The meta-skill: how a non-engineer built & shipped a full neighborhood platform through review and PRs |

---

## How to use a module

1. Read **Why This Module Exists** and the **Learning Objectives** first — know what you're aiming at.
2. Work the **Core Concepts**, then *do the Labs*. The labs are the point; reading alone won't transfer the skill.
3. Use the **Discussion Prompts** to check understanding — out loud, with a study partner, or in writing.
4. Finish with the **Self-Check** — if you can't honestly tick a box, go back to that concept.

Most modules can be done against **your own project**. If you don't have one, `windsor-swan`
(a real, public neighborhood site) is the reference app many labs are written against.

---

## For curriculum builders

- The module blueprint every file follows is in **[TEMPLATE.md](TEMPLATE.md)** — copy it to start a new module so the format stays consistent.
- The mapping from each module to the exact real-world artifact and the learner question that
  anchors it is in **[sources/windsor-swan.md](sources/windsor-swan.md)**. Keeping that map current is
  what makes the curriculum honest: every lesson should trace back to a real moment.
- Modules are numbered for learning sequence, not authoring order. When inserting a module,
  update this table and the source map together.

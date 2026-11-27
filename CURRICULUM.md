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
| 03 | [Git & GitHub — Version Control](modules/03-git-github-version-control.md) | C | ✍️ | `retire-time` — branches, commits, pull requests, and GitHub Pages auto-deploy |
| 04 | [Frontend Fundamentals — HTML, CSS & JavaScript](modules/04-frontend-fundamentals.md) | C | ✍️ | `retire-time` — how browsers render; HTML structure, CSS tokens & dark mode, responsive layout |
| 05 | [Databases 101 — From Spreadsheets to SQL](modules/05-databases-sql-fundamentals.md) | C | ✍️ | `retire-time` — why databases exist, relational tables, and what SQL does |
| 06 | [Supabase Deep Dive](modules/06-supabase-deep-dive.md) | C | ✍️ | `retire-time` — Postgres + Auth + Edge Functions + pg_cron; tables, Row Level Security, migrations |
| 07 | [Authentication — How Sign-In Actually Works](modules/07-authentication-how-signin-works.md) | B | ✍️ | `retire-time` — OAuth 2.0, JWTs, sessions, and the client/server security boundary |
| 08 | [Serverless Edge Functions — Code Without Servers](modules/08-serverless-edge-functions.md) | C | ✍️ | `retire-time` — when you need backend logic, environment variables, and CORS |
| 09 | [Progressive Web Apps — Websites as Apps](modules/09-progressive-web-apps.md) | C | ✍️ | `retire-time` — manifests, service workers, Add to Home Screen, iOS vs. Android |
| 10 | [Push Notifications — Reaching Users Off-Site](modules/10-push-notifications.md) | C | ✍️ | `retire-time` — VAPID keys, PushManager, and server-side web-push (the price-alert system) |
| 11 | [Scheduled Jobs — Automation Inside the Database](modules/11-scheduled-jobs-automation.md) | C | ✍️ | `retire-time` — pg_cron, pg_net, and market-hours logic without an external server |
| 12 | [Data Privacy — What Never Leaves the Server](modules/12-data-privacy-sensitive-data.md) | D | ✍️ | `retire-time` — SSN/sensitive data, data minimization, parsing a W2 without storing it |
| 13 | [Role-Based Access Control — Admin vs. User](modules/13-role-based-access-control.md) | B | ✍️ | `retire-time` — RBAC, SECURITY DEFINER functions, why client-side checks are UX not security |
| 14 | [Analytics & Dashboards — Understanding Your Users](modules/14-analytics-understanding-your-users.md) | D | ✍️ | `retire-time` — activation, retention, feature adoption; SQL that answers product questions |
| 15 | [Financial App Domain Concepts](modules/15-financial-app-domain-concepts.md) | D | ✍️ | `retire-time` — capital gains, wash-sale rule, ETF substitutes, disclaimers |
| 16 | [Backend Architecture & the Deploy Model](modules/16-backend-architecture-and-deploy-model.md) | C | ✍️ | `windsor-swan` (Firebase) — the five pieces, the two paths to data, and the deploy matrix |
| 17 | [Web Application Vulnerabilities: XSS & Input Validation](modules/17-web-vulnerabilities-xss.md) | B | ✍️ | `windsor-swan` — a real stored XSS bug: "how would I exploit that — can I test it on my own accounts?" |
| 18 | [Data Pipelines & Migration](modules/18-data-pipelines-migration.md) | D | ✍️ | `windsor-swan` — migrating a mailing list into a database; "it said 2 skipped"; matching "Jay" to "James" |
| 19 | [Email & Notification Deliverability](modules/19-email-notification-deliverability.md) | A+D | ✍️ | `windsor-swan` — transactional vs. opt-in email, unsubscribe headers, app passwords, carrier gateways |
| 20 | [Capstone — Shipping Software with an AI Agent](modules/20-capstone-shipping-with-ai.md) | D | ✍️ | `windsor-swan` — building & shipping a full neighborhood platform through review and PRs |

> The thematic **domains (A–D)** above are a *topic* lens. The project [README](README.md) groups the same modules into five sequential **learning tracks** (Domain 1 — Foundations … Domain 5 — Architecture, Security & Shipping); both describe the identical 01–20 sequence. A standalone [Firestore vs. Supabase comparison](modules/firestore-vs-supabase-comparison.md) accompanies Domain 2.

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

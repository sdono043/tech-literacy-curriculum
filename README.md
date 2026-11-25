# Technology Literacy Curriculum (TLC)

A hands-on technology-literacy curriculum for capable adults with little or no software
background — including transitioning veterans moving toward technology roles. Every module is
built from a **real, live session on a real, deployed project**, so learners build genuine
practitioner skills instead of memorizing vocabulary.

**Start here: [CURRICULUM.md](CURRICULUM.md)** — the master syllabus (domains, sequence, how to use a module).

## Modules

Status key: ✅ published · ✍️ drafted · 🔜 planned

**A — Networking & Systems Fundamentals**
1. ✅ [DNS & Domain Configuration](modules/01-dns-domain-configuration.md) — registrars, DNS records, and pointing a real domain at a real site.

**A + B — Networking / Application Security**
2. ✅ [Network & Application Security Literacy](modules/02-network-appsec-literacy.md) — reading Chrome DevTools, TLS certificates, and auditing a real app for exposed secrets.

**C — Web & Cloud Application Architecture**
3. ✍️ [Static Hosting & the Git/GitHub/PR Workflow](modules/03-hosting-git-pr-workflow.md) — how a site exists and ships: hosting, branches, pull requests, and merge order.
4. ✍️ [Serverless Backends (Cloud Functions)](modules/04-serverless-backends.md) — what runs "in the cloud," and the fire-and-forget bug that teaches how it really works.
5. ✍️ [NoSQL Databases & Data Modeling](modules/05-nosql-data-modeling.md) — collections, documents, subcollections, and security rules — via a real silent data bug.

**B — Cybersecurity & Application Security**
6. ✍️ [Authentication vs. Authorization](modules/06-authentication-authorization.md) — who you are vs. what you're allowed to do; real vs. "deterrent" access control.
7. ✍️ [Secrets & Credential Management](modules/07-secrets-credentials.md) — public vs. private keys, where secrets live, passwords vs. passkeys.
8. ✍️ [Web Application Vulnerabilities: XSS & Input Validation](modules/08-web-vulnerabilities-xss.md) — a real stored XSS bug, how it's exploited, and how it's fixed.

**C / D — Delivery, Data & Privacy**
9. ✍️ [Progressive Web Apps & Caching](modules/09-pwa-and-caching.md) — installable web apps, service workers, and why you kept seeing the old version.
10. ✍️ [Privacy by Design](modules/10-privacy-by-design.md) — k-anonymity, storing no identity, and protecting real people's data.
11. ✍️ [Data Pipelines & Migration](modules/11-data-pipelines-migration.md) — moving a mailing list into a database, idempotent imports, and fuzzy name matching.
12. ✍️ [Email & Notification Deliverability](modules/12-email-notification-deliverability.md) — transactional vs. opt-in, unsubscribe headers, and app passwords.

**D — Capstone**
13. ✍️ [Shipping Software with an AI Agent](modules/13-capstone-shipping-with-ai.md) — the meta-skill: building and shipping a real platform as a non-engineer.

## How it's built

- Module blueprint: **[TEMPLATE.md](TEMPLATE.md)**
- Real-world source map: **[sources/windsor-swan.md](sources/windsor-swan.md)** — each module traces to a real artifact and a real learner question.

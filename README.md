# Tech Literacy Curriculum (TLC)
Technology Literacy Curriculum — built from real hands-on sessions, not hypotheticals.

Every concept here was learned by actually building something: a retirement planning app, a custom domain, a push notification system, an admin analytics dashboard. No diagrams without deployments.

## How to Use This Curriculum

Modules are sequenced but not strictly linear — each has explicit prerequisites listed in its header. The four domains below group modules by theme; you can enter at any domain once prerequisites are met.

**Format:** Each module follows the same structure — *Why This Module Exists* (the real motivation), *Learning Objectives* (specific and testable), *Core Concepts* (explanation-first, then mechanics), *Labs* (hands-on steps against real or realistic systems), *Assessment Checklist* (self-verify before moving on), and *Notes for Build-Out* (what comes next and what's not yet written).

---

## Domain 1 — Foundations: How the Web Works

No prerequisites. Start here.

1. [DNS & Domain Configuration](modules/01-dns-domain-configuration.md) — Registrars, DNS records, A/CNAME/ALIAS/CAA, wildcards, propagation. Built from purchasing vet-tech.org and pointing it at GitHub Pages.
2. [Network & Application Security Literacy](modules/02-network-appsec-literacy.md) — Chrome DevTools Network tab, TLS certificate chains, API traffic isolation, and auditing your own app for exposed secrets.
3. [Git & GitHub — Version Control](modules/03-git-github-version-control.md) — How code gets tracked, shared, and reviewed. Branches, commits, pull requests, and GitHub Pages auto-deploy.
4. [Frontend Fundamentals — HTML, CSS, JavaScript](modules/04-frontend-fundamentals.md) — How browsers render pages. HTML structure, CSS tokens and dark mode, JavaScript interactivity, responsive layout.

---

## Domain 2 — Backend & Databases

Prerequisite: Domain 1 (or equivalent comfort with how the web works).

5. [Databases 101 — From Spreadsheets to SQL](modules/05-databases-101.md) — Why databases exist, how relational tables work, what SQL does. No prior database knowledge assumed.
6. [Supabase Deep Dive](modules/06-supabase-deep-dive.md) — Postgres + API layer + Auth + Edge Functions + pg_cron. Tables, Row Level Security, migrations, and scheduled jobs — with real retire-time examples.
7. [Authentication — How Sign-In Actually Works](modules/07-authentication.md) — OAuth 2.0, JWT tokens, session management, and the security boundary between client and server.
8. [Serverless Functions — Code Without Servers](modules/08-serverless-functions.md) — When you need backend logic, how Edge Functions work, environment variables, and CORS.

**Standalone deep dive:** [Firestore vs. Supabase — When to Use Which](modules/firestore-vs-supabase.md) — Side-by-side comparison of Firebase/Firestore and Supabase/Postgres: data model, query power, security rules, real-time, vendor lock-in, and when each wins.

---

## Domain 3 — Modern Web App Features

Prerequisite: Domain 2 (especially Module 6, Supabase).

9. [Progressive Web Apps — Websites as Apps](modules/09-progressive-web-apps.md) — Web app manifests, service workers, Add to Home Screen. iOS vs Android differences, icon requirements, and four iterations of a real PWA icon.
10. [Push Notifications — Reaching Users Off-Site](modules/10-push-notifications.md) — VAPID keys, PushManager, service workers, server-side push with web-push. Built from retire-time's price alert notification system.
11. [Scheduled Jobs — Automation Inside the Database](modules/11-scheduled-jobs.md) — pg_cron, pg_net, market hours logic. How to run code on a schedule without an external server.
12. [Data Privacy — What Never Leaves the Server](modules/12-data-privacy.md) — SSN and sensitive data, data minimization, client-side-only processing, W2 parsing without storing the W2.

---

## Domain 4 — Building Real Products

Prerequisite: Domains 1–3 (or equivalent).

13. [Role-Based Access Control — Admin vs. User](modules/13-role-based-access-control.md) — RBAC, why client-side checks are UX not security, SECURITY DEFINER functions, CHECK constraints, admin console design.
14. [Analytics & Dashboards — Understanding Your Users](modules/14-analytics-understanding-your-users.md) — Activation, retention, feature adoption, ghost users, dormancy, top tickers. Writing SQL that answers real product questions.
15. [Financial App Domain Concepts](modules/15-financial-app-domain-concepts.md) — Short vs. long-term capital gains, tax-loss harvesting, wash-sale rule, ETF substitutes, price alert logic, compound growth projections, disclaimer design.

---

## Status

| Module | Status |
|--------|--------|
| M01 DNS & Domain Configuration | ✅ Published |
| M02 Network & App Security | ✅ Published |
| M03 Git & GitHub | 🔄 Draft |
| M04 Frontend Fundamentals | 🔄 Draft |
| M05 Databases 101 | 🔄 Draft |
| M06 Supabase Deep Dive | 🔄 Draft |
| M07 Authentication | 🔄 Draft |
| M08 Serverless Functions | 🔄 Draft |
| Firestore vs. Supabase (deep dive) | 🔄 Draft |
| M09 Progressive Web Apps | 🔄 Draft |
| M10 Push Notifications | 🔄 Draft |
| M11 Scheduled Jobs | 🔄 Draft |
| M12 Data Privacy | 🔄 Draft |
| M13 Role-Based Access Control | 🔄 Draft |
| M14 Analytics & Dashboards | 🔄 Draft |
| M15 Financial App Concepts | 🔄 Draft |

---

## Source Projects

This curriculum is built from real sessions on real projects:

- **retire-time** (`sdono043/cyber-stock-monitor`) — Retirement planning and portfolio tracking PWA. Source for Domains 2–4.
- **vet-tech.org** — Domain purchase and DNS configuration. Source for Module 1.
- **sleddawg-fitness** — Strava-connected training dashboard with AI plan generation. Source for Module 2 DevTools audit lab.
- **windsor-swan** — Utility outage monitoring feature. Source for Module 2 live-data verification lab.

---

*Built with [Claude Code](https://claude.com/claude-code) — sessions on record in source project READMEs.*

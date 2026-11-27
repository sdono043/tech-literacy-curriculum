# Source Map — `windsor-swan`

Most of this curriculum is drawn from a single real project: **Windsor Swan / "Swan's Nest"**
(`github.com/sdono043/windsor-swan`), a working neighborhood website for Windsor Farms,
Richmond VA — built and shipped over several weeks by someone with no prior development
background, working through an AI coding agent via pull requests.

What makes it good source material: it is a *complete, real* system — custom domain, static
site, serverless backend, a database, authentication, payments-adjacent ticket data, email and
push notifications, a marketplace, a privacy-sensitive analytics feature, and a data migration
— and the person building it asked, out loud, the exact questions a newcomer asks. Those
questions are the anchors below. Each lesson traces back to a real artifact and a real moment,
which is the whole point of the TLC method.

> This file is the honest ledger behind the curriculum. When a module is written or revised,
> update its row here so every lesson keeps a traceable real-world origin.

| # | Module | windsor-swan artifact | The anchoring question / moment |
|---|---|---|---|
| 01 | DNS & Domains | GitHub Pages custom-domain setup; the `CNAME` file | "is there a cost to pursue [a custom domain]?"; the `github.io` → GitHub-password autofill confusion that motivated moving off a shared domain |
| 02 | Network & AppSec Literacy | `getOutages` (Dominion/KUBRA outage feed) consumed client-side | Verifying a "no outage" banner against the utility's own map — a silent-success feed |
| 16 | Backend Architecture & Deploy Model | The branch → PR → ~1-min Pages deploy loop; `functions/index.js`, Firestore, Storage, `firestore.rules`; `createLostFound` fire-and-forget freeze; `recordView`/`siteAnalytics`; the site-analytics **stale-function deploy** incident | "PR 160 was already merged…" (merge order); "why is there no page data yet?"; "I changed it but the live site didn't change" (which command actually deploys?) |
| 17 | Web Vulnerabilities: XSS | The fixed attribute-injection stored XSS (`escapeHtml` hardening + strict `photo.<ext>` filename); `isSafeText`, rate limits, honeypot | "How would I exploit that critical vuln? Could I test that on myself since I have three accounts?" |
| 18 | Data Pipelines & Migration | `adminImportServices` / `adminImportKidBusinesses` (idempotent JSON import); the `mergeHouseholdNames` nickname dedup | "✓ Imported 95, skipped 2" and "it said 2 services skipped"; matching sign-up "Jay" to record "James Amato" |
| 19 | Email & Notification Deliverability | `sendApprovalEmail` (transactional) vs. `sendMarketplaceAlert` (opt-in); `List-Unsubscribe`; the removed AT&T carrier-SMS gateway | Transactional-vs-marketing email ethics; why `txt.att.net` hard-bounces now |
| 20 | Capstone — Shipping with an AI agent | The entire arc: feature PRs, "process feedback," the `feedback-processed` Gmail-label workflow, documenting conventions into `CLAUDE.md` | "How do you remember that labeling structure in future cycles?" — building a durable, repeatable workflow as a non-engineer |

**Further `windsor-swan` illustrations** — strong secondary examples that appear *inside* the modules above (and in Modules 2 and 12), even though the canonical, primary version of each topic is now taught on `retire-time`: the two-auth-system **"deterrent gate"** (authorization); the FCM **VAPID** public/private key split (secrets); `sw.js` network-first pages / cache-first images with `CACHE_VERSION` (PWA caching, the "quit and reopen to see the change" confusion); and `getWaterTrends` **k-anonymity** floors (privacy by design). These were the anchors for the earlier draft's windsor-swan modules; nothing here is lost — they now serve as the Firebase counterpoint within the canonical modules.

## A note on honesty and privacy

- Labs that touch `windsor-swan` use only what is **public** about it (the site, the repo's
  structure, the kinds of features). No resident data, email addresses, phone numbers, admin
  passwords, or secret keys appear in this curriculum, and none should ever be added.
- Where a module teaches a vulnerability (Module 17), it teaches it on the learner's **own**
  accounts/app, in the spirit the original question was asked — authorized testing against
  something you own — never against other people's data.

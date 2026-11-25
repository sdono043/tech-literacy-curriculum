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
| 03 | Hosting & Git/PR workflow | The whole repo's branch → PR → merge → ~1-min Pages deploy loop | "PR 160 was already merged, you haven't fixed the hanging numbers!" — a real merge-order/stacked-PR lesson |
| 04 | Serverless Backends | `createLostFound` / `notifyLostFoundSubscribers` in `functions/index.js` | "I don't seem to be getting email alerts for new lost and found postings — can you check the logs" → the fire-and-forget function-freeze bug (work after `res.json()` never ran) |
| 05 | NoSQL Data Modeling | `recordView` / `siteAnalytics`; marketplace bids as a subcollection; `firestore.rules` | "why is there no page data yet?" → a dotted-key `set({merge:true})` that wrote a literal field name instead of a nested map |
| 06 | Authentication vs Authorization | Firebase Auth + `resident` custom claim vs. the admin HMAC token scheme; the client-side "deterrent gate" | "Can I log in as admin-residents on the app?"; the documented choice that the gate is a deterrent, not real access control |
| 07 | Secrets & Credentials | The FCM **VAPID** key (public half shipped, private half in Firebase); API keys kept server-side; `functions:config` | "Here is the key pair. BGFd…" + "I can paste a key pair in this chat? Is that secure?" — public vs. private key material |
| 08 | Web Vulnerabilities: XSS | The fixed attribute-injection stored XSS (`escapeHtml` hardening + strict `photo.<ext>` filename); `isSafeText`, rate limits, honeypot | "How would I exploit that critical vuln? Could I test that on myself since I have three accounts?" |
| 09 | PWAs & Caching | `sw.js` / `pwa.js`; network-first pages, cache-first images, `CACHE_VERSION` | The recurring "I don't see it — fully quit and reopen the app" — feedback submitted against a stale cached version |
| 10 | Privacy by Design | `getWaterTrends` (k-anonymity: suppress < 8 households, < 5/month); `recordView` storing no IP/identity; public-file PII rule | The deliberate privacy floors, and "name, address and ticket count only: never emails, phones or payment details" |
| 11 | Data Pipelines & Migration | `adminImportServices` / `adminImportKidBusinesses` (idempotent JSON import); the `mergeHouseholdNames` nickname dedup | "✓ Imported 95, skipped 2" and "it said 2 services skipped"; matching sign-up "Jay" to record "James Amato" |
| 12 | Email & Notification Deliverability | `sendApprovalEmail` (transactional) vs. `sendMarketplaceAlert` (opt-in); `List-Unsubscribe`; the removed AT&T carrier-SMS gateway | Transactional-vs-marketing email ethics; why `txt.att.net` hard-bounces now |
| 13 | Capstone — Shipping with an AI agent | The entire arc: feature PRs, "process feedback," the `feedback-processed` Gmail-label workflow, documenting conventions into `CLAUDE.md` | "How do you remember that labeling structure in future cycles?" — building a durable, repeatable workflow as a non-engineer |

## A note on honesty and privacy

- Labs that touch `windsor-swan` use only what is **public** about it (the site, the repo's
  structure, the kinds of features). No resident data, email addresses, phone numbers, admin
  passwords, or secret keys appear in this curriculum, and none should ever be added.
- Where a module teaches a vulnerability (Module 08), it teaches it on the learner's **own**
  accounts/app, in the spirit the original question was asked — authorized testing against
  something you own — never against other people's data.

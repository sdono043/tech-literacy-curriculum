# Technology Literacy Curriculum (TLC)

## Module 19: Email & Notification Deliverability — Getting a Message to a Person (and the Right to Send It)

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** A + D — Networking / Data & Product
**Format:** Guided reading + deliverability and ethics labs
**Prerequisite:** Module 8 (Serverless Edge Functions, incl. secrets)
**Leads into:** Module 20 (Capstone)

**Sequencing note:** Module 8 built backends that *do* things; a huge share of what they do is
**notify people** — by email and push. This module covers how a message actually reaches someone,
the **permission** to send it, and the plumbing (app passwords, unsubscribe headers) that
separates "delivered" from "spam-foldered or bounced."

## Why This Module Exists

Sending email feels trivial ("just send it") and is quietly one of the hardest things to do
*well*. There's a technical problem — will it arrive, or bounce, or land in spam? — and an
**ethical/legal** one — are you *allowed* to send this, and can the recipient make it stop?
`windsor-swan` had to solve both, and the choices it made are a clean, real lesson.

The app sends several kinds of message, and treats them **differently on purpose**: a one-time
**approval email** when someone's sign-up is accepted (sent *because they asked to join*), versus
**opt-in alert emails** when a neighbor posts to the marketplace (sent *only to people who
subscribed*). It also hit a real deliverability wall — a **text-message-by-email gateway that had
been shut down** and now hard-bounces — which teaches why you don't rely on fragile delivery
paths.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Distinguish **transactional** from **marketing/bulk** messages, and why the permission bar differs
2. Explain **opt-in** (and why a list should start empty and never be seeded from a roster)
3. Explain the purpose of an **unsubscribe** mechanism and the **`List-Unsubscribe`** header, and why one-click opt-out matters
4. Explain, at a high level, **deliverability** — why a technically-sent email may still not arrive (spam filters, sender reputation, bounces)
5. Explain what an **app password** is and why a service sends mail through a dedicated account, not a personal one
6. Explain **hard vs. soft bounces** and why sending to dead addresses hurts you
7. Recognize **fragile delivery paths** (e.g., carrier email-to-SMS gateways) and prefer robust ones
8. Reason about the ethics of an unsolicited message: when it's acceptable (a direct response to the person's own action) and when it isn't

## Core Concepts

### Transactional vs. marketing — the permission line

- **Transactional:** a direct, expected response to something the person just did. The sign-up
  **approval email** ("your access is approved, here's the sign-in link") is transactional — it's
  fine to send *unsolicited* because it answers *their* request. It isn't marketing.
- **Marketing / bulk / alerts:** messages the person didn't individually trigger — "a neighbor
  posted a new listing." These require **prior permission** (opt-in).

Conflating the two is both a deliverability problem (bulk mail to people who didn't ask gets
marked spam) and an ethics/legal one (anti-spam laws like CAN-SPAM/CASL govern it).

### Opt-in done right

`windsor-swan`'s marketplace and Lost & Found alerts are **strictly opt-in**: the subscriber list
**starts empty** and is **never seeded from the resident roster**. You get these emails only if
you explicitly asked for them. That's the honest version of "notifications" — the opposite of
auto-subscribing everyone and making them leave.

### Unsubscribe and `List-Unsubscribe`

Every alert email carries a **one-click unsubscribe link** *and* a **`List-Unsubscribe`** header —
a standard header that lets the mail client itself show an "Unsubscribe" button at the top. Easy
opt-out isn't just courtesy: mail providers **reward** senders who make unsubscribing easy (it
beats people hitting "spam," which wrecks your reputation). Frictionless exit is good ethics *and*
good deliverability.

### Deliverability: sent ≠ arrived

An email your code "sent successfully" can still fail to reach the inbox. Spam filters weigh
**sender reputation**, authentication, content, and recipient behavior. Sending wanted mail to
engaged recipients from a consistent, authenticated sender builds reputation; blasting unwanted
mail, or sending to dead addresses, destroys it. (DNS-level sender authentication — SPF/DKIM/DMARC
— is the deep end here; see the build-out notes and Module 1.)

### App passwords and a dedicated sender

The functions send mail through Gmail using an **app password** — a special, revocable credential
scoped to one app, created after enabling 2-step verification — **not** the account's real
password. And the project deliberately sends from a **neighborhood address** (a shared community
account), not someone's personal inbox, so recipients see a sender that represents the community.
The app password is a **secret** handled per Module 8 (server-side config, never shipped). The
sender address and that password must belong to the **same** account, or authentication fails.

### Bounces, and fragile paths (the dead SMS gateway)

- A **hard bounce** is permanent (the address doesn't exist); a **soft bounce** is temporary (full
  mailbox). Repeated hard bounces signal to providers that you're not maintaining your list — bad
  for reputation — so dead addresses should be pruned.
- `windsor-swan` had briefly used **carrier email-to-SMS gateways** (sending a text by emailing an
  address like `number@txt.att.net`). Those were **discontinued** — the carrier shut them down, so
  the addresses now **hard-bounce** (there's no mail server behind them anymore). The lesson:
  don't build on a free, unofficial, undocumented delivery path; when a real text is needed, use a
  proper SMS API (e.g., Twilio). The robust alternative chosen here was simply **push
  notifications** (Module 10) and the email inbox.

### Push vs. email

Push notifications (Module 10) and email are complementary. Push is immediate and lock-screen
visible but device- and opt-in-specific; email is universal and durable but slower and filter-prone.
A good system picks per message: `windsor-swan` uses push for instant admin/L&F alerts and email
for durable, forwardable notices — and keeps lock-screen push bodies **generic** so private
content isn't shown on a locked phone (a privacy choice, echoing Module 12).

## Lab 1: Classify the message, choose the rule

**Goal:** Build the transactional-vs-marketing reflex.

**Steps:** For each, label **transactional** or **marketing/opt-in**, say whether prior consent is required, and whether it needs an unsubscribe:

1. "Your neighborhood account was approved — here's your sign-in link."
2. "A neighbor just listed a bike in the marketplace."
3. "Reminder: the centennial party is Saturday" sent to everyone in the directory.
4. "You replied to a Lost & Found post; here's the thread."
5. A monthly "what's new in the neighborhood" roundup.

**Discussion prompts:**

- Which of these may be sent to someone who never opted in, and why is that defensible?
- For the ones needing opt-in, why must the list start empty rather than "everyone, with a way to leave"?

## Lab 2: Inspect real email plumbing

**Goal:** See deliverability features in actual messages.

**Steps:**

1. In your own inbox, find a legitimate bulk/newsletter email. View its **headers** (most clients
   have "show original/headers").
2. Find the **`List-Unsubscribe`** header and any authentication results (SPF/DKIM/DMARC `pass`).
3. Find a message your mail client put an **"Unsubscribe"** button on at the top — that button is
   driven by the header you just found.
4. Contrast with a spam message (carefully, don't click links): note missing/inconsistent sender
   authentication or no real unsubscribe.

**Discussion prompts:**

- How does an easy unsubscribe *protect* a sender's deliverability, counterintuitively?
- Why does a mail provider care whether the sending domain is authenticated?

## Lab 3: Design a notification policy

**Goal:** Put it together for a feature you'd ship.

**Steps:**

1. For a new "neighborhood events" feature, decide which notifications are **transactional** vs.
   **opt-in**, and which go by **push** vs. **email**.
2. Specify: where the sender credential lives (Module 8), what the unsubscribe path is, and what
   the push body says on a **locked** screen (Module 12).
3. Name one **fragile delivery path** you'll avoid and the robust alternative.

**Discussion prompts:**

- How did Modules 7 (secrets), 9 (push), and 10 (privacy) all show up in your policy?
- What's your plan when an address hard-bounces repeatedly?

## Assessment / Checklist (Learner Self-Check)

- I can distinguish transactional from marketing messages and their permission bars
- I can explain opt-in and why a list starts empty
- I can explain the unsubscribe mechanism and the `List-Unsubscribe` header
- I can explain why a "sent" email might not arrive (deliverability, reputation)
- I can explain what an app password is and why a dedicated sender account is used
- I can explain hard vs. soft bounces and why dead addresses hurt
- I can recognize a fragile delivery path and name a robust alternative
- I can reason about when an unsolicited message is acceptable

## Notes for Curriculum Build-Out (Next Steps)

- Consider a follow-on DNS lab on **SPF/DKIM/DMARC** (sender authentication), the natural bridge back to Module 1 and the deep half of deliverability.
- Consider a hands-on sending one transactional email through a real provider (with an app password) for learners with a project.
- Consider a short note on anti-spam **law** (CAN-SPAM, CASL, GDPR consent) for learners heading toward roles that require compliance.
- Source session used for this draft: windsor-swan's `sendApprovalEmail` (transactional) vs. `sendMarketplaceAlert` / Lost & Found alerts (strictly opt-in, list starts empty), the `List-Unsubscribe` + one-click unsubscribe, Gmail **app passwords** with a neighborhood sender account, generic lock-screen push bodies, and the removed AT&T carrier email-to-SMS gateway that now hard-bounces.

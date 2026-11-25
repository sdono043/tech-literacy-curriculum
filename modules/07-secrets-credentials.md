# Technology Literacy Curriculum (TLC)

## Module 7: Secrets & Credential Management — Public vs. Private, and Where Secrets Live

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** B — Cybersecurity & Application Security
**Format:** Guided reading + hands-on key-handling labs
**Prerequisite:** Module 2 (Network & AppSec), Module 4 (Serverless Backends), Module 6 (Auth)
**Leads into:** Module 8 (Web Vulnerabilities), Module 12 (Email & Notifications)

**Sequencing note:** Module 2 taught *checking* that a secret isn't exposed in browser traffic.
This module teaches the underlying ideas that make that check meaningful: what a secret actually
is, which key material is *safe to publish* and which is not, and where secrets are supposed to
live. It builds directly on the serverless backend (the place secrets belong).

## Why This Module Exists

Beginners handle credentials with either too much fear or too little — refusing to share a value
that's designed to be public, or pasting a genuinely sensitive one into a chat window. Both come
from the same gap: not knowing *which* secrets are secret.

This module is anchored on two real moments from `windsor-swan`. First, setting up push
notifications required a **VAPID key pair**, and the question came up: *"I can paste a key pair in
this chat? Is that secure?"* — exactly the right instinct, and the answer turns on the
public/private distinction. Second, the app's whole design keeps API keys **server-side**, which
is the pattern Module 2 taught you to verify. Getting crisp about public vs. private key
material, and about *where* secrets belong, is a skill that prevents the most common real-world
leaks.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Define a **secret/credential** and give examples (API keys, passwords, private keys, tokens)
2. Explain **public-key (asymmetric) pairs**: why one half is meant to be published and the other must never be
3. Decide whether a given value is safe to share, using the VAPID-key case as the worked example
4. Explain **where** secrets should live (server-side config / secret managers) and where they must never appear (front-end code, repos, chat, URLs, logs)
5. Explain why pasting a secret somewhere "temporary" is still a disclosure (caching, history, indexing)
6. Explain the difference between a **password** and a **passkey**, and how a password **manager**/Keychain autofill differs from both
7. Describe safe **rotation** — what to do after a secret may have leaked
8. Recognize an **environment variable / config** as the normal home for a server-side secret

## Core Concepts

### What counts as a secret

A **secret** is any value that grants access or authority if someone else holds it: an **API
key** (acts as your identity to a paid service), a **password**, a **private key**, an **auth
token**. The test isn't "does it look random" — it's "if a stranger had this, could they act as
me or spend my money?"

### Public vs. private key material (the VAPID moment)

Some systems use a **key pair**: a **public** key and a **private** key, mathematically linked.
The public key is *designed to be handed out*; the private key must *never* leave your control.
Push notifications work this way. On `windsor-swan`, the **public VAPID key is hardcoded right in
the web page** — correctly, because it's public by design — while its **private half stays inside
Firebase**, never shipped to browsers.

So "I can paste a key pair in this chat?" has a precise answer: the **public** half, yes — it's
already public the moment the site ships. The **private** half, never. The reason the specific
value in that session was fine to handle openly is that it was the *public* VAPID key. **Key
insight for learners:** "key pair" doesn't mean "all secret" — the entire point of asymmetric
keys is that one half is publishable.

### Where secrets live — and where they must not

The rule from Module 2, stated positively: **secrets live on the server.** On `windsor-swan`,
the Claude API key, the Gmail app password, and the admin secret are set as **server-side
configuration** on the Cloud Functions — present when the function runs, never sent to the
browser. Secrets must **never** appear in:

- front-end JavaScript or HTML (anyone can read it — Module 2),
- a public repository (Git keeps it in history *forever*, even after you delete it),
- a URL or query string (logged by servers, proxies, and browser history),
- chat messages, screenshots, or support tickets,
- application logs.

### "Temporary" disclosure is still disclosure

Pasting a real secret "just to test" treats exposure as reversible. It isn't: chat and ticket
systems retain history, pages get cached and indexed, screenshots get backed up. Once a *private*
credential touches any of these, assume it's compromised and **rotate** it (below). This is why
the right move, when a tool needs a real key, is a proper secret input — not the chat box.

### Passwords vs. passkeys vs. autofill (the admin-login thread)

Three related but distinct things came up setting up the admin login:

- A **password** is a shared secret you type. Reusable, phishable, only as safe as where it's stored.
- A **passkey** (WebAuthn) replaces the password with a device-held **private key**; the site
  only ever sees a signature, never a secret to steal. Stronger, but needs real support built in.
- A **password manager / Keychain** still stores a *password*, but fills it for you behind your
  device biometrics — the convenience of autofill without passkey's cryptography.

A real wrinkle from the session: because the site was hosted under `*.github.io`, the browser's
autofill kept *suggesting the user's GitHub password* for the admin page — a reminder that
credential tools key off the **domain**, which is one more reason a project outgrows a shared
host and wants its own domain (Module 1).

### Rotation: assume the worst, cheaply

If a private credential *might* have leaked, the fix is **rotation**: generate a new one, update
it in the server config, and invalidate the old one — so the possibly-exposed value is worthless.
Rotation being routine and painless is itself a security property; design so you can swap a key
in minutes.

## Lab 1: Classify the secret

**Goal:** Build the "is this safe to share?" reflex.

**Steps:** For each value, decide **safe to publish** or **must stay private**, and say why:

1. A **public** VAPID key hardcoded in a web page.
2. A **private** VAPID key.
3. An LLM/API key used by a backend function.
4. A site's public URL.
5. A Gmail **app password** used to send notification email.
6. A user's signed-in **session token**.

**Discussion prompts:**

- What single question separates every "publish" from every "private" above?
- Two of these are halves of the *same* concept (a key pair). Which, and why is only one shareable?

## Lab 2: Find where a real app keeps its secrets

**Goal:** Confirm the "secrets on the server" pattern from the outside.

**Steps:**

1. Pick a site that calls a paid API (an AI feature, a maps feature). Using Module 2's method,
   open DevTools → Network → trigger it → inspect the **request headers** of the call.
2. Confirm the request goes to the site's **own backend**, not directly to the third-party
   provider, and that **no `Authorization` / `x-api-key`** secret is visible in the browser.
3. Now reason about where the key *must* be instead (server config), and why that's the only
   place it can be both usable and unexposed.

**Discussion prompts:**

- If you *did* see an API key in the browser request, what exactly could an attacker do, and what's the one-line fix?
- Why can't you "hide" a front-end key by obfuscating the JavaScript?

## Lab 3: Handle a key safely (hands-on, your own key)

**Goal:** Practice safe handling and rotation on a throwaway credential.

**Steps:**

1. On any free service you use, generate a **test API key** you don't mind deleting.
2. Store it the *right* way for a server: as an **environment variable / config value**, not in
   code. (If you have no project, write down where it *would* go and why.)
3. Deliberately imagine it leaked (you pasted it in a chat). Perform **rotation**: revoke it in
   the provider's dashboard and generate a new one. Confirm the old one no longer works.
4. Reflect: how long did rotation take? If it were painful, what would you change in advance?

**Discussion prompts:**

- Why is "delete it from the file and commit" *not* enough if the key was ever pushed to a public repo?
- When a tool needs a real key, why is a dedicated secret input safer than the chat window — what does each retain?

## Assessment / Checklist (Learner Self-Check)

- I can define a secret and give several examples
- I can explain a public/private key pair and why only one half is shareable
- I can decide whether a given value (like a VAPID key) is safe to publish
- I can state where secrets should live and the places they must never appear
- I can explain why a "temporary" paste of a private secret is a real disclosure
- I can explain the difference between a password, a passkey, and autofill
- I can perform and reason about key rotation after a possible leak

## Notes for Curriculum Build-Out (Next Steps)

- Consider a short hands-on with a real **secret manager** (Firebase config, Vercel/Cloudflare env vars) for learners with a project.
- Consider a "scan a repo's history for leaked secrets" exercise (e.g., `gitleaks`) as a bridge to Module 8.
- Consider expanding the passkey thread into a standalone module if learner interest is high.
- Source session used for this draft: windsor-swan push-notification setup and the VAPID public/private key pair ("I can paste a key pair in this chat? Is that secure?"); server-side API-key handling verified in Module 2; and the admin-login autofill thread (passwords vs. passkeys/Keychain, and the `github.io`-domain autofill confusion).

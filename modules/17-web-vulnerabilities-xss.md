# Technology Literacy Curriculum (TLC)

## Module 17: Web Application Vulnerabilities — Cross-Site Scripting (XSS) & Input Validation

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** B — Cybersecurity & Application Security
**Format:** Guided reading + **authorized** hands-on testing against your own app
**Prerequisite:** Module 2 (DevTools), Module 5 (Databases), Module 7 (Authentication)
**Leads into:** Module 12 (Data Privacy & Sensitive Data)

**Sequencing note:** You've learned to read traffic (M2), store data (M5), and tell identity from
permission (M6). This module shows how those combine into the web's most common serious bug — one
user's input running as code in another user's browser — using a **real, already-fixed**
vulnerability from `windsor-swan` so nothing here is hypothetical.

> **Ethics and scope — read first.** Everything in this module is for testing systems **you own
> or are explicitly authorized to test**. The original session this is built from did exactly
> that: the owner asked, *"How would I exploit that vulnerability? Could I test it on myself,
> since I have three accounts?"* — authorized testing against your own app, to confirm a fix.
> Never run these techniques against anyone else's site, data, or accounts. Doing so is a crime
> in most jurisdictions, regardless of intent.

## Why This Module Exists

Most security advice tells beginners to "sanitize inputs" without ever showing what goes wrong if
you don't. This module shows it concretely, with a real bug that was found and fixed on
`windsor-swan`: a user-supplied value was placed into a page's HTML **without escaping**, so a
carefully crafted value could *stop being data and start being code*. Because an admin viewing
that value could have their **admin session stolen**, this was a genuine, high-severity finding —
not a style nit.

Seeing one real **stored cross-site-scripting (XSS)** bug end to end — how it arises, how you'd
confirm it on your own app, and the two-part fix that closed it — gives you a lens you'll reuse
on every form field you ever build.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain the core idea of **injection**: untrusted input crossing from *data* into *code/markup*
2. Define **XSS** and distinguish **stored** from **reflected** XSS
3. Explain **output escaping** and why the same value is safe in one place and dangerous in another (text vs. **HTML attribute** context)
4. Explain why escaping must include **quotes (`"` and `'`)**, using the real "attribute-injection" bug as the example
5. Explain **defense in depth**: output escaping *and* input validation *and* constraining what values are even accepted
6. Safely reproduce a **benign** XSS test (an `alert`, never anything harmful) against **your own** app, and read the result
7. Explain supporting defenses seen in the real app: server-side **input validation**, **rate limiting**, and a **honeypot**
8. Describe why an XSS bug on an **admin page** is especially dangerous (session/token theft)

## Core Concepts

### Injection, in one sentence

Almost every serious web vulnerability is a variant of one mistake: **untrusted input is treated
as trusted code.** SQL injection, command injection, and XSS are the same error in different
languages. XSS is the browser flavor: user input ends up **executing as JavaScript** in someone
else's page.

### Stored vs. reflected XSS

- **Reflected:** the malicious input bounces straight back in a response (e.g., in a search
  results page that echoes your query) and runs for whoever clicked the crafted link.
- **Stored:** the malicious input is **saved** (a listing title, a profile name, an uploaded
  file's name) and later runs for *everyone who views it*. Stored XSS is worse — it needs no
  trick link and can hit an admin. The `windsor-swan` bug was **stored**.

### Output context: the same value, safe or deadly

Whether a value is dangerous depends on **where it's placed**. Consider a value placed into a
page. In plain text, `<` is just a character. But if the code builds markup like:

```
<div data-photo="THE_VALUE">
```

…then a `VALUE` containing a double-quote can **close the attribute early** and add new markup —
including an element with an event handler that runs script. This is **attribute-injection XSS**,
and it's exactly what happened: a field was escaped for the "text between tags" case but **not
for the "inside an attribute" case**, so quotes slipped through.

### Escape quotes, not just angle brackets (the real fix, part 1)

An escaping helper that only replaces `<`, `>`, and `&` *looks* right and is a classic trap,
because interpolating into an attribute needs `"` and `'` escaped too. The old code on
`windsor-swan` used a `textContent → innerHTML` trick that left quotes unescaped. The fix
**hardened the escape function to also encode both quote characters**, so a value can never break
out of an attribute. Rule: **the escaper must cover every character that has meaning in the place
the value lands** — and attributes mean quotes.

### Constrain the input, too (the real fix, part 2 — defense in depth)

The crafted value in the real finding rode in as an **uploaded photo's filename** (something like
a name containing `">` and an `<img onerror=…>`). So the second half of the fix wasn't about
escaping at all: the server now **restricts the stored filename to exactly `photo.<extension>`**,
so an attacker can't supply a quote-bearing name in the first place. Two independent layers —
escape on output **and** constrain on input — is **defense in depth**: either alone would have
stopped it; both together is robust.

### The supporting cast: validation, rate limits, honeypots

The same codebase shows the everyday hygiene that shrinks the attack surface:

- **Server-side input validation** — names/addresses/emails are length-capped and reject
  `<`, `>`, `"`, backticks, and control characters *on the server* (not just in the browser,
  which an attacker skips). Note it still allows apostrophes, because real names have them
  (O'Brien) — validation must not break legitimate data.
- **Rate limiting** — each action has a per-hour cap (sign-ups 5/hour, listings 5/hour, etc.) so
  one actor can't flood or brute-force.
- **Honeypot** — a hidden form field real users never fill; a bot that fills it is silently
  dropped. Cheap, invisible to humans, effective against dumb automation.

### Why admin pages raise the stakes

If stored XSS runs on a page an **admin** views, the attacker's script runs *with the admin's
access* — it can read the admin's **session token** and hand control to the attacker. That's why
the finding was high-severity: a hostile applicant could, in principle, craft a value that steals
the admin session when the admin opens the review page. Injection + privileged viewer = account
takeover. (This is the concrete link back to Module 7.)

## Lab 1: Make injection tangible (no app needed)

**Goal:** Feel the "data becomes markup" boundary in a safe sandbox.

**Steps:**

1. In a scratch HTML file on your own machine, write a tiny page that puts a variable into an
   attribute, e.g. `<div data-x="VALUE">hello</div>`, where `VALUE` is text you control.
2. First set `VALUE` to a normal string; view source and confirm it's inert.
3. Now set `VALUE` to a string containing a double-quote followed by extra markup. Observe how
   the attribute closes early and your extra markup escapes into the page. (Keep any script
   benign — a comment or a visible element, not anything harmful.)
4. Fix it: replace each `"` in `VALUE` with `&quot;` before inserting, and confirm the markup is
   neutralized.

**Discussion prompts:**

- Why was the *same* string harmless as visible text but dangerous inside the attribute?
- Which exact characters had to be escaped to make the attribute context safe?

## Lab 2: Confirm a fix on **your own** app (authorized testing)

**Goal:** Reproduce the real diagnostic — safely, on something you own.

**Prerequisites:** An app *you own* that stores and re-displays user input (a name, a title, a
comment). If you don't have one, do this against a deliberately-vulnerable practice app such as
**OWASP Juice Shop** (built for this) — never a site you don't control.

**Steps:**

1. Choose a stored field you control. Enter a **benign** probe as the value — the classic is a
   harmless `alert`, e.g. a value that, if the app were vulnerable, would pop a dialog. The goal
   is a *visible, harmless* signal, never anything destructive.
2. View the field where it's displayed back (and, if applicable, where an admin would review it).
3. Interpret the result:
   - **Dialog pops / your markup renders** → the field is injectable: a real finding. The fix is
     to escape on output (including quotes) and/or constrain the input.
   - **Your probe shows as literal text** → it's being escaped correctly. That's the pass.
4. Repeat the probe in an **attribute** context if the app uses your value in one (the subtle case
     the real bug lived in), not only as visible text.

**Discussion prompts:**

- Why is an `alert` the standard *proof-of-concept* — what does it demonstrate without causing harm?
- You tested the visible-text spot and it was safe. Why must you *also* test the attribute spot before declaring the field clean?

## Lab 3: Design the two-layer fix

**Goal:** Practice defense in depth on paper.

**Steps:**

1. Take a feature that accepts an uploaded file and shows its name. Write the **output** fix:
   exactly which characters your escaper must encode for (a) text context and (b) attribute
   context.
2. Write the **input** fix: a server-side rule that constrains what the stored name may even be
   (mirror the real app's "exactly `photo.<ext>`").
3. Explain why you want **both**, not just one — and give a scenario each layer alone would miss.

**Discussion prompts:**

- Validation here rejects `<`, `>`, `"`, backticks — but *allows* apostrophes. Why is that correct, and what breaks if you over-restrict?
- How do rate limiting and the honeypot reduce risk *without* being about XSS specifically?

## Assessment / Checklist (Learner Self-Check)

- I can explain injection as "untrusted input crossing from data into code"
- I can distinguish stored from reflected XSS
- I can explain why the same value is safe as text but dangerous in an HTML attribute
- I can explain why escaping must include both quote characters
- I can explain defense in depth with the real two-part fix (escape output + constrain input)
- I can safely run a benign XSS proof-of-concept against an app I own and read the result
- I can explain server-side validation, rate limiting, and honeypots
- I can explain why stored XSS on an admin page can lead to account takeover

## Notes for Curriculum Build-Out (Next Steps)

- Consider a guided run through **OWASP Juice Shop** as the universal "app you're allowed to break" so every learner can do Lab 2 regardless of whether they have their own project.
- Consider a short companion on **Content-Security-Policy (CSP)** as an additional output-side defense, tying back to the headers seen in Module 2.
- Consider briefly placing XSS within the **OWASP Top 10** so learners have the industry map.
- Source session used for this draft: the windsor-swan stored attribute-injection XSS (an uploaded photo named to break out of a `data-photo="…"` attribute), its two-part fix (hardened quote-escaping + server-side restriction of the filename to `photo.<ext>`), the surrounding `isSafeText` validation / rate limits / honeypot, and the owner's authorized-testing question: "How would I exploit that critical vuln? Could I test that on myself since I have three accounts?"

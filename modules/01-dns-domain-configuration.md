# Technology Literacy Curriculum (TLC)

## Module 1: DNS & Domain Configuration — Pointing a Real Domain at a Real Site

**Status:** Draft v1 — built from a live hands-on session, July 2026
**Domain:** Networking & Systems Fundamentals
**Format:** Guided lab using a real, purchased domain and a real deployed site
**Prerequisite:** None — this is the foundational module in the sequence
**Leads into:** Module 2 — Network & Application Security Literacy (Chrome DevTools)

**Sequencing note:** This module comes first by design. DNS resolution is the first thing that happens in any web request — before a TCP connection, before TLS, before any HTTP traffic exists to inspect. Learners who understand how a domain resolves to a server *before* they open the Network tab will immediately understand what the "DNS Lookup" phase of a waterfall chart represents, rather than encountering it as an unexplained colored bar.

## Why This Module Exists

DNS is usually taught as an abstract diagram: "the domain name system translates human-readable names into IP addresses." That's true, but it doesn't prepare anyone for the actual experience of buying a domain and discovering that the site doesn't just work — there's a DNS error, a wildcard record silently routing traffic somewhere unexpected, and a wait for propagation that feels like nothing is happening.

This module is built directly from that real experience: purchasing vet-tech.org through one provider (Vercel) and pointing it at a site hosted somewhere else entirely (GitHub Pages). That split — registrar in one place, DNS records in another, hosting in a third — is extremely common in the real world, and understanding *why* it requires explicit configuration (rather than "just working") is the actual lesson.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain the difference between a domain **registrar** and a **DNS host**, and recognize that they're often, but not always, the same company
2. Explain what an **A record** is and why an apex/root domain needs one (or several) pointing to specific IP addresses
3. Explain what a **CNAME record** is, when it's used instead of an A record, and why DNS rules forbid CNAME at the root/apex domain
4. Explain what an **ALIAS/ANAME record** is and why it exists as a workaround for the CNAME-at-apex restriction
5. Explain DNS **wildcard records** (*) and the precedence rule that an exact match always wins over a wildcard match
6. Explain why a **CAA record** exists and how it relates to the TLS certificate/chain-of-trust concepts from the previous module
7. Explain **DNS propagation** — why changes aren't instant, and what's actually happening while you wait
8. Diagnose a "DNS check unsuccessful" error on a hosting platform and identify the likely cause
9. Recognize when a default/auto-generated DNS record from a registrar could silently conflict with an intended configuration, and know how the exact-match-overrides-default behavior resolves it — even when the platform won't let you delete the default outright

## Core Concepts

### Registrar vs. DNS Host vs. Web Host — three different jobs

These are frequently the same company, which is exactly why it's confusing when they're not:

- **Registrar**: the company you paid to reserve the domain name itself (e.g., Vercel, GoDaddy, Namecheap). This is about *ownership*, not routing.
- **DNS host**: the company whose nameservers actually answer "where does this domain point?" This is where DNS records (A, CNAME, ALIAS, CAA, etc.) live.
- **Web host**: the company actually serving the website's files when someone visits (e.g., GitHub Pages, Vercel, Cloudflare Pages).

In this lab's real scenario: **Vercel** is the registrar *and* the DNS host, but **GitHub Pages** is the web host. That's why buying the domain didn't make the site "just work" — the DNS records had to be manually pointed at GitHub's infrastructure.

### A Records — pointing the root domain at an IP

An A record maps a domain name to an IPv4 address. GitHub Pages publishes four official, stable IP addresses for exactly this purpose:

185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153

A root/apex domain (vet-tech.org, no subdomain) needs **A records**, not a CNAME — DNS rules (RFC standards) don't allow a CNAME at the root of a domain, because the root also has to carry other required record types (like the domain's own NS and SOA records), and CNAME requires the name to point *exclusively* elsewhere.

**Key insight for learners:** these four IPs are shared by an enormous number of unrelated GitHub Pages sites. That's not a conflict — one IP address can serve millions of different sites simultaneously. Disambiguation happens at the *hostname* level (via the HTTP Host header / TLS SNI), not the IP level. This connects directly back to the Network tab / headers module.

### CNAME Records — pointing a subdomain at another hostname

A CNAME record says "this name is really just an alias for that other name." Subdomains like www.vet-tech.org use a CNAME instead of an A record:

Name: www
Type: CNAME
Value: `<github-username>.github.io`

### ALIAS/ANAME Records — CNAME behavior at the root, where CNAME isn't allowed

Some DNS providers offer an ALIAS (sometimes called ANAME) record type specifically to give CNAME-like behavior at the apex domain, where a true CNAME is disallowed. Registrars sometimes auto-create one of these by default when a domain is purchased, pointing it at *their own* infrastructure — which is exactly what happened in this lab's real scenario, and is the root of the conflict described below.

### Wildcard Records and Precedence — the subtle trap

A wildcard record (*) matches *any* subdomain that doesn't have its own explicit record. The critical rule: **an exact match always wins over a wildcard match.**

In this lab's real scenario, the registrar had auto-created a wildcard ALIAS record (* → the registrar's own hosting) *before* any manual records were added. The practical effect:

- Before adding an explicit www CNAME: a request for www.vet-tech.org had no exact match, so it fell through to the wildcard — silently serving the registrar's placeholder page instead of the intended site. Not a broken error, just quietly wrong.
- After adding the explicit www CNAME: the exact match takes precedence, and traffic correctly routes to the intended host.

GitHub's own documentation actively warns against relying on wildcard DNS records for custom domains, partly due to *domain takeover risk* — an unclaimed subdomain covered only by a wildcard can potentially be hijacked by someone else.

**Learner takeaway:** always check for pre-existing default/wildcard records after buying a domain, before assuming your own records are the only thing in play. Note also that many registrars (Vercel included) won't let you *delete* their auto-generated default records at all — the platform enforces precedence at the UI level instead, by guaranteeing that any explicit record you add will override the default for that specific name. The defaults stay visible in the dashboard, permanently inert, once a matching explicit record exists.

### CAA Records — connecting back to TLS

CAA (Certification Authority Authorization) records restrict *which* certificate authorities are allowed to issue TLS certificates for a domain. Seeing an entry like `0 issue "letsencrypt.org"` is the DNS-level counterpart to the certificate chain-of-trust work from the previous module — it's the domain owner pre-authorizing a specific CA (in this case, the same Let's Encrypt CA GitHub Pages uses to auto-provision HTTPS).

### DNS Propagation — why nothing happens right away

DNS records are cached ("TTL," or time-to-live) by resolvers all over the internet. When a record changes, it doesn't update everywhere instantly — different resolvers refresh at different times, based on the TTL value set on the record (in this lab, TTL was set to 60 seconds, which is short/aggressive; some providers default much higher). This is why a hosting platform's "DNS check" can fail immediately after a change and then succeed minutes later without you doing anything else.

## Lab: Point a Real Domain at a Real Site

**Goal:** Take a purchased domain and correctly configure it to serve an existing site (in this case, a GitHub Pages site), while identifying and resolving a default-record conflict along the way.

**Prerequisites:** A registered domain, and a site already deployed somewhere that supports custom domains (GitHub Pages used here; the same core concepts apply to Netlify, Vercel, Cloudflare Pages, etc.)

### Steps

1. **Identify your three roles.** Confirm which company is your registrar, which is your DNS host (often the same), and which is your web host. Write all three down before touching anything — confusion here is the #1 source of DNS troubleshooting mistakes.
2. **Enter the custom domain on the web host side first.** On GitHub Pages: Settings → Pages → Custom domain → enter the apex domain (e.g., vet-tech.org, not www.vet-tech.org) → Save. Expect a "DNS check unsuccessful" error at this point — that's expected, not a mistake.
3. **Audit existing DNS records before adding anything.** Go to your DNS host's dashboard and look at what's already there. Specifically look for any pre-existing wildcard (*) or root-level ALIAS/ANAME records the registrar may have auto-created. Note them — don't delete yet.
4. **Add four A records for the apex domain**, one at a time, each with a blank/@ Name field, Type A, pointing to each of GitHub's four published IPs (185.199.108.153, .109.153, .110.153, .111.153).
5. **Add one CNAME record for www**: Name www, Type CNAME, Value `<your-github-username>.github.io`.
6. **Confirm precedence over any conflicting default records** — don't expect to delete them. If a wildcard (*) or root-level ALIAS record already exists from the registrar's default setup, most registrars (including Vercel) will refuse to let you delete it outright, showing a message to the effect of "Default DNS Records cannot be deleted. However, adding additional DNS Records will override the values of them." That's expected, not an error — your explicit A/CNAME records for those exact names will take precedence automatically. Verify this by visiting the live site directly rather than assuming the dashboard needs to look "clean."
7. **Wait for propagation**, then return to the web host and re-run the DNS check (e.g., GitHub Pages' "Check again" button). This can take minutes to hours depending on TTL and resolver caching.
8. **Enable HTTPS enforcement** once the DNS check passes (e.g., GitHub Pages' "Enforce HTTPS" checkbox). This connects back to the TLS/certificate module — the platform is now able to auto-provision a certificate because domain ownership has been verified via DNS.
9. **Verify both the apex and www versions load correctly** (https://yourdomain.org and https://www.yourdomain.org), confirming both the A records and the CNAME are working as intended.

### Discussion Prompts

- Why does a root/apex domain need multiple A records instead of just one?
- What real-world problem would you have run into if you'd never checked for pre-existing wildcard records?
- How does the "exact match beats wildcard" precedence rule relate to specificity rules you might already know from other systems (e.g., CSS specificity, firewall rule ordering)?
- Why might a registrar auto-create a default wildcard record when you buy a domain, and who does that default benefit?

## Assessment / Checklist (Learner Self-Check)

- I can explain the difference between a registrar, a DNS host, and a web host
- I can explain why a root/apex domain uses A records instead of a CNAME
- I can explain what a CNAME record does and correctly configure one for a subdomain
- I can explain what a wildcard DNS record is and state the exact-match-wins precedence rule
- I can explain what a CAA record restricts
- I can explain why DNS changes take time to propagate rather than applying instantly
- I can audit an existing DNS configuration for conflicting default records and know that overriding (not deleting) is often how the platform expects this to be resolved

## Notes for Curriculum Build-Out (Next Steps)

- Consider pairing this module with a dig/nslookup command-line exercise, so learners can verify DNS propagation themselves rather than relying only on the hosting platform's built-in checker
- Consider a short callout on domain-takeover risk from unclaimed wildcard-covered subdomains, referencing GitHub's own documentation on the topic, as a bridge into broader security-literacy framing
- Consider extending this module later with an email-DNS lab (MX/SPF/DKIM records) as a natural follow-on, since those introduce the Priority field this lab intentionally left blank
- This module now precedes Module 2 (Network & Application Security Literacy) in the sequence — update any repo README index to reflect Module 1 (DNS) → Module 2 (Network/AppSec) ordering
- Source session used for this draft: purchase and configuration of vet-tech.org (Vercel registrar/DNS) pointed at a GitHub Pages site (sdono043.github.io), including discovery and resolution of a default wildcard ALIAS record conflict

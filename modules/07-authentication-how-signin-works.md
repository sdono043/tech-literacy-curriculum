# Technology Literacy Curriculum (TLC)

## Module 7: Authentication — How Sign-In Actually Works

**Status:** Draft v1 — built from live hands-on sessions, 2025–2026
**Track:** 2 — Backend & Databases
**Format:** Conceptual walkthrough with labs using Supabase Auth and browser DevTools
**Prerequisite:** Module 6 — Supabase Deep Dive (understanding RLS and the database layer)
**Leads into:** Module 13 — Role-Based Access Control (admin vs. user, server-side enforcement)

**Sequencing note:** Authentication is introduced after databases deliberately. Most beginner tutorials introduce auth first (it's the first feature a web app needs), which means learners treat it as a magic box. This module reverses that: by the time learners arrive here, they already understand what a `profiles` table is, why `auth.uid()` appears in RLS policies, and what a JWT might contain. Authentication then makes sense as "the thing that produces the identity the database policies check."

## Why This Module Exists

"Sign in with Google" is one of the most familiar experiences on the web. But almost no one who uses it every day can explain what it actually does — or, more importantly, what it *doesn't* do. It doesn't send your Google password to the website. It doesn't let the website access your Google account. It produces a token — a digitally signed credential — that proves you are who you say you are, and the website accepts that proof without ever seeing your password.

This module explains how that works, why it's designed that way, and what it means for application security. The retire-time app uses Google OAuth via Supabase Auth on every page (portfolio-tracker.html, planning.html, projections.html, admin.html), and the admin page adds a second check on top of authentication: role verification. Both are covered here.

The module also documents a real bug encountered during development: the admin console displayed a blank page because auth-related CSS was missing, causing the sign-in screen to remain hidden even when no user was signed in. Understanding what went wrong requires understanding exactly how the auth flow works.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain what **OAuth 2.0** is and what happens step by step when you click "Sign in with Google"
2. Explain what a **JWT (JSON Web Token)** is, what it contains, and why it's not a secret in the same sense a password is
3. Distinguish between **authentication** (proving who you are) and **authorization** (proving what you're allowed to do)
4. Explain the **security boundary** between browser-visible code and server-side code, and why role checks must happen on the server
5. Explain why `style.display = ''` and `style.display = 'flex'` behave differently when a CSS rule defines the element's display
6. Trace the auth flow in a Supabase application from sign-in to session to RLS policy enforcement
7. Identify what a JWT contains by decoding one in the browser DevTools

## Core Concepts

### OAuth 2.0 — What "Sign in with Google" Actually Does

When you click "Sign in with Google" on retire-time, here is exactly what happens:

1. **Your browser is redirected** to Google's OAuth server (`accounts.google.com`), carrying a request that says: "The retire-time app wants to verify your identity."
2. **You authenticate with Google** (enter your password, approve the app). This happens on Google's servers — retire-time's servers are not involved and never see your Google password.
3. **Google issues a code** and redirects your browser back to the retire-time app with that code in the URL.
4. **Supabase exchanges the code** for an access token and an ID token from Google. The ID token contains claims about you: your email address, your name, your Google user ID.
5. **Supabase creates or looks up your user record**, and issues its own JWT — a Supabase session token that the app will use going forward. This is the token stored in the browser and sent with every API request.

**The key insight:** retire-time never receives your Google password. It receives a signed certificate from Google that says "this person authenticated successfully, here is their email." This design is why OAuth exists — the app gets proof of identity without ever handling the credential that proves it.

### JWTs — What They Are and What They Contain

A JWT (JSON Web Token) is a base64-encoded string with three parts: a header, a payload, and a signature.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9    ← header (algorithm, type)
.eyJzdWIiOiJhNGI4YzJkMS0uLi4iLCJlbWFpbCI6InlvdUBleGFtcGxlLmNvbSIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzAwMDAwMDAwfQ==    ← payload
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c    ← signature
```

The payload (the middle part) is base64-encoded JSON. Paste any JWT into jwt.io and you'll see something like:

```json
{
  "sub": "a4b8c2d1-...",        ← the user's UUID (what auth.uid() returns)
  "email": "you@example.com",
  "role": "authenticated",
  "exp": 1700000000             ← expiration timestamp
}
```

**What the JWT is not:** it is not a password. It is not secret in the same sense — it's meant to be sent with every API request and can be read by anyone who intercepts it. What makes it secure is the *signature*: it was created by Supabase using a secret key only Supabase holds, so it cannot be forged or modified. If someone tampers with the payload (changes "role" to "admin"), the signature becomes invalid and Supabase rejects it.

**What this means in practice:** the browser can read the JWT and display the user's email (retire-time does this in the header). But it cannot modify the JWT to claim a different identity. The signature guarantees integrity.

### Authentication vs. Authorization

These two terms are often confused:

- **Authentication:** proving who you are. "I am user a4b8c2d1." (Established by signing in with Google.)
- **Authorization:** proving what you're allowed to do. "User a4b8c2d1 is allowed to see admin data." (Established by checking the `profiles.role` column.)

In retire-time, authentication is handled by Supabase Auth (the Google OAuth flow). Authorization for admin pages is handled by an additional database query that checks whether the authenticated user's profile has `role = 'admin'`.

Both checks happen in the admin page's `initAuth()` function:

```javascript
async function initAuth() {
  // Step 1: Authentication — does a session exist?
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    document.getElementById('auth-screen').style.display = 'flex';
    return;  // Not authenticated — show sign-in screen
  }

  // Step 2: Authorization — is this user an admin?
  const { data: profile } = await sb.from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    document.getElementById('access-denied').style.display = '';
    return;  // Authenticated but not authorized
  }

  // Both checks passed — show the dashboard
  document.getElementById('app-main').style.display = '';
  loadDashboard();
}
```

### The Security Boundary — Why Client-Side Role Checks Are Not Enough

Here is the security trap that catches many beginners: if you check the user's role in JavaScript and only show the admin UI when the role is "admin," a technically sophisticated user can open DevTools, modify the JavaScript, and bypass that check.

This is not theoretical. Any JavaScript code that runs in the browser can be modified by the person running that browser. The browser is not a trusted environment.

**The correct architecture has two layers:**

1. **UI gating (client-side):** hide the admin navigation from non-admin users. This is a UX concern — it prevents ordinary users from accidentally navigating to a page they can't use. It is not a security measure.

2. **Server-side enforcement:** the `admin_get_users()` and `admin_get_analytics()` database functions check `auth.uid()` against `profiles.role` *inside PostgreSQL*. Even if someone bypasses the client-side check and directly calls the API, the database function will reject them.

The practical test: in the Supabase SQL editor, try calling `SELECT * FROM admin_get_users()` while authenticated as a non-admin user. The function raises an exception: "Access denied: admin only." The check is enforced at the database level, not the UI level.

### A Real Bug: Why the Auth Screen Was Blank

During development, adding auth-related CSS as a stylesheet rule (rather than relying solely on inline styles) caused the admin page to display a blank screen for signed-out users.

**Root cause:** The original HTML had `<div id="auth-screen" style="display:none">`. The JavaScript showed it with `style.display = ''` — clearing the inline style. When only the inline style defined `display:none`, clearing it made the element use its browser default (`block`), which was fine.

After adding `#auth-screen { display: none }` to the stylesheet, clearing the inline style no longer made it visible — the CSS rule took over and kept it hidden. The fix was `style.display = 'flex'` (explicit) instead of `''` (implicit).

**The lesson:** when both a stylesheet rule and inline styles control the same property, understand which one wins and when. Explicit beats implicit. If you want an element to be visible in a specific display mode (flex, block, grid), state that explicitly rather than relying on clearing a rule.

## Lab 1: Trace the OAuth Flow in DevTools

**Goal:** Watch the OAuth redirect and token exchange happen in real time.

**Steps:**

1. Open Chrome DevTools → Network tab → check "Preserve log."
2. On a Supabase-authenticated site, click "Sign in with Google."
3. Watch the redirect chain in the Network tab: your domain → Google → back to your domain with a `code` parameter.
4. Identify the POST request where Supabase exchanges the code for tokens.
5. After sign-in completes, open Application → Local Storage → your domain. Find the Supabase session key and expand it. Identify the `access_token` field.
6. Copy the `access_token` value and decode it at jwt.io. Identify the `sub` (user UUID), `email`, and `exp` fields.

**Discussion Prompts:**
- The JWT payload is not encrypted — anyone who intercepts the token can read the email address. Why is this acceptable?
- What does `exp` (expiration) mean, and what happens when you present an expired token to Supabase?
- Why does Google issue a short-lived `code` (single-use, expires quickly) rather than a long-lived token directly?

## Lab 2: Observe the Authorization Check Fail Correctly

**Goal:** Confirm that server-side role enforcement works even when the client-side check is bypassed.

**Steps:**

1. Sign in to the retire-time admin page as a non-admin user (any regular account).
2. Confirm you see the "Access Denied" screen — that's the client-side check working.
3. Open DevTools → Console. Run: `window.sb.rpc('admin_get_users')` and observe the error.
4. Run: `window.sb.rpc('admin_get_analytics')` and observe the same error.
5. Confirm: the error comes from the database function itself, not from JavaScript code you could bypass.
6. Now sign in as an admin account. Run the same commands — confirm they return data.

**Discussion Prompts:**
- If the authorization check only existed in JavaScript (not in the database function), how would a non-admin user access admin data?
- Why does the SECURITY DEFINER function need to check `auth.uid()` explicitly rather than relying on RLS?

## Assessment / Checklist (Learner Self-Check)

- I can describe the OAuth 2.0 flow step by step, including what Google provides and what it doesn't
- I can decode a JWT and identify the sub, email, and exp fields
- I can explain the difference between authentication (who you are) and authorization (what you can do)
- I can explain why client-side role checks are not a security measure
- I can trace the initAuth() flow and identify where authentication ends and authorization begins
- I can explain why `style.display = ''` behaves differently from `style.display = 'flex'` when a CSS rule is involved
- I can call a Supabase RPC function from DevTools and interpret the error when authorization fails

## Notes for Curriculum Build-Out (Next Steps)

- Consider adding a visual diagram of the OAuth redirect chain — the URL changes are hard to follow without a picture
- The JWT signature section is intentionally high-level; a deeper dive into HMAC and RSA signing could be a companion reading for learners who want it
- The blank-auth-screen bug is an excellent debugging case study: the fix was one character (`''` → `'flex'`) but the root cause requires understanding CSS cascade, inline styles, and the difference between implicit and explicit values — worth expanding into a debugging exercise
- Consider pairing this module with Module 13 (Role-Based Access) where the same SECURITY DEFINER pattern is examined in more depth from an architecture perspective
- Source sessions: retire-time Google OAuth implementation, admin.html auth flow with role check, two-bug chain (missing auth CSS → blank screen, `display:''` → still hidden)

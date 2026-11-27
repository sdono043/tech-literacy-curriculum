# Technology Literacy Curriculum (TLC)

## Module 8: Serverless Edge Functions — Code Without Servers

**Status:** Draft v1 — built from live hands-on sessions, 2025–2026
**Domain:** Backend & Databases
**Format:** Conceptual walkthrough with hands-on lab deploying a real Supabase Edge Function
**Prerequisite:** Module 6 — Supabase Deep Dive (database layer, secrets management); Module 7 — Authentication (JWT handling)
**Leads into:** Module 10 — Push Notifications (the price-alerts Edge Function is the full worked example for push)

**Sequencing note:** This module comes after authentication because the most important job of an Edge Function — keeping secrets out of the browser — only makes sense once learners understand why the browser is not a trusted environment. The price-alerts Edge Function is the production example throughout: a real function that handles six different actions, authenticates two different callers (users via JWT, scheduler via secret), calls an external API, and sends push notifications.

## Why This Module Exists

"Serverless" is one of the most misused words in cloud computing. Introductory explanations often say something like "it's magic — you just write a function and it runs in the cloud." That framing obscures what's actually happening and leaves learners unable to reason about when to use it, what it costs, or why it fails.

This module starts from the actual problem: the browser is a public environment. Any code that runs in the browser is visible to any user of the site. This is fine for display logic. It is fatal for secrets (API keys, database credentials, cryptographic keys). An Edge Function is simply code that runs *outside* the browser — on servers controlled by a platform — where secrets can live safely.

The retire-time price-alerts system is built on a single Edge Function that embodies this design. It holds four secrets that never appear in the browser: VAPID private key (for Web Push), CRON_SECRET (for authenticating the scheduled caller), and SUPABASE_SERVICE_ROLE_KEY (for database access that bypasses RLS). Every concept in this module is illustrated by that real function.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain what "serverless" means in practice and what's actually happening behind the abstraction
2. Identify the three situations where you need a backend function rather than browser-side code
3. Explain the **Deno runtime** and how it differs from Node.js for someone who knows neither
4. Read and explain the structure of a Supabase Edge Function (imports, serve handler, request/response cycle)
5. Store a secret in Supabase Secrets and read it inside a function using `Deno.env.get()`
6. Explain how the price-alerts function authenticates two different types of callers differently
7. Explain what CORS is and why a function needs to handle preflight OPTIONS requests
8. Deploy an Edge Function and invoke it from the browser and from curl

## Core Concepts

### "Serverless" — What It Actually Means

There are still servers. "Serverless" means *you* don't manage them: no installing an operating system, no configuring a web server, no paying for idle capacity. You write a function, deploy it, and the platform handles everything else. When a request comes in, the platform starts a temporary instance of your function, runs it, and returns the response. If no requests come for an hour, nothing runs and nothing costs money.

**What this enables:** functions that exist only to handle occasional requests (a price check every 15 minutes, a push notification triggered by a database row) without paying for a full server running 24/7.

**What the trade-off is:** cold starts (the first request after a period of inactivity may be slow while the platform provisions an instance), no persistent in-memory state between requests (each invocation starts fresh), and execution time limits (Supabase Edge Functions time out after 150 seconds).

### When You Need a Backend Function

Three situations require code that runs outside the browser:

**1. Secrets.** API keys, database service-role credentials, private cryptographic keys. The price-alerts function holds the VAPID private key — if this were in the browser's JavaScript, any user could extract it and send unauthorized push notifications to your subscribers.

**2. Elevated database access.** The price-alerts function uses `SUPABASE_SERVICE_ROLE_KEY` to write back to the database (updating triggered alerts, deleting expired push subscriptions) using the service role, which bypasses RLS. That key cannot be in the browser.

**3. External API calls that require secrets.** Fetching from Yahoo Finance and sending Web Push notifications both require credentials. The function holds them; the browser does not.

A common mistake: putting a service-role key in the browser "just for testing" and forgetting to remove it. Anyone who visits your site and opens DevTools can copy that key and use it to read or modify any data in your database, bypassing all RLS policies.

### The Deno Runtime

Supabase Edge Functions run on [Deno](https://deno.land/) — a TypeScript/JavaScript runtime (like Node.js, but different in a few ways that matter here):

- **TypeScript natively.** No build step needed; Deno runs `.ts` files directly.
- **Standard library via URL imports.** Dependencies are imported from URLs rather than installed via npm (though npm packages can be used with the `npm:` prefix).
- **`Deno.env.get()`** reads environment variables — this is how secrets are accessed.

```typescript
// Supabase Edge Function structure
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

serve(async (req: Request): Promise<Response> => {
  // Every request goes through this handler
  const body = await req.json();
  const action = body.action;

  // ... handle the action ...

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

The `serve()` function is the entry point. It receives every HTTP request as a `Request` object and must return a `Response`. That's the entire contract.

### Authenticating Two Types of Callers

The price-alerts function handles six actions: `subscribe`, `unsubscribe`, `get_alerts`, `set_alert`, `delete_alert`, and `check_prices`. The first five are called by users from the browser. The last one is called by the pg_cron job on a schedule.

These two callers authenticate differently:

**Users:** authenticated via a Supabase JWT in the Authorization header.
```typescript
const authHeader = req.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');
const { data: { user } } = await supabase.auth.getUser(token);
if (!user) return new Response('Unauthorized', { status: 401 });
```

**The scheduler:** authenticated via a custom secret header.
```typescript
if (action === 'check_prices') {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }
  // ... check prices ...
}
```

The scheduler doesn't have a user JWT — it's a pg_cron job, not a person. So it authenticates with a pre-shared secret that only the function (via Supabase Secrets) and the cron schedule know.

**Why not use `verify_jwt: false` and handle auth entirely manually?** Because the function needs to serve both a machine caller (the cron job, which has no JWT) and human callers (users, who have JWTs). Setting `verify_jwt: false` in the function's config disables Supabase's automatic JWT verification, letting the function decide how to authenticate each request type.

### Environment Variables and Secrets

Secrets are environment variables that are injected into the function at runtime. They are set in the Supabase dashboard (Edge Functions → Manage Secrets) and are never stored in code or committed to a repository.

```typescript
// Reading secrets inside a function
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
const cronSecret = Deno.env.get('CRON_SECRET');
const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
```

In the retire-time build, the user added these four secrets manually in the Supabase dashboard. The MCP tool (`create_edge_function_secret`) can also add them programmatically, but timed out during the actual session — the dashboard approach is the reliable fallback.

**The mental model:** think of Supabase Secrets as the function's private keychain. The code states what keys it needs; the platform provides the values at runtime.

### CORS — Why Functions Need to Handle OPTIONS Requests

When a browser sends a fetch request to a different domain (cross-origin), it first sends a preflight OPTIONS request to ask: "is this domain allowed to call you?" The function must respond correctly to this preflight, or the browser will block the actual request with a CORS error.

```typescript
// Handle CORS preflight
if (req.method === 'OPTIONS') {
  return new Response('ok', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}
```

This is boilerplate that belongs at the top of every Edge Function that accepts requests from the browser. Without it, the function works fine when called from curl (which doesn't send preflight) but fails silently in the browser.

## Lab 1: Deploy Your First Edge Function

**Goal:** Write, deploy, and invoke a minimal Edge Function.

**Steps:**

1. Create the directory: `supabase/functions/hello/index.ts`
2. Write the function:
   ```typescript
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
   serve(async (req) => {
     if (req.method === 'OPTIONS') {
       return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
     }
     return new Response(JSON.stringify({ message: 'Hello from Edge Functions!', time: new Date().toISOString() }), {
       headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
     });
   });
   ```
3. Deploy via the Supabase MCP tool or CLI: `supabase functions deploy hello`
4. Invoke from curl: `curl https://<project-ref>.supabase.co/functions/v1/hello`
5. Invoke from the browser: open DevTools console and run `fetch('https://<project-ref>.supabase.co/functions/v1/hello').then(r => r.json()).then(console.log)`
6. Observe that the browser request includes a preflight OPTIONS that the curl call does not.

**Discussion Prompts:**
- Why does the same function work from curl but fail in the browser without the CORS headers?
- The function returns the current time. What does this tell you about whether Edge Functions have persistent state between requests?

## Lab 2: Store and Use a Secret

**Goal:** Keep a value out of source code by using Supabase Secrets.

**Steps:**

1. In the Supabase dashboard: Edge Functions → Manage Secrets → add a secret named `MY_SECRET` with value `hello-world`.
2. Update the hello function to read and return the secret:
   ```typescript
   const secret = Deno.env.get('MY_SECRET') ?? 'not set';
   return new Response(JSON.stringify({ secret_length: secret.length, starts_with: secret[0] }), ...);
   ```
   Note: return the *length* and first character, not the value itself — this proves the secret was read without exposing it.
3. Redeploy and invoke. Confirm the response shows `secret_length: 11`.
4. Try running `console.log(Deno.env.get('MY_SECRET'))` in the browser DevTools. Confirm it returns `undefined` — the browser has no access to the secret.

**Discussion Prompts:**
- If the secret value were hardcoded in the function source code and that code were committed to a public GitHub repo, what would happen?
- What's the difference between how a secret is stored (encrypted, platform-managed) vs. how it's accessed (plain string via `Deno.env.get()`) — and why does that distinction matter?

## Lab 3: Authenticate Callers Differently

**Goal:** Write a function that serves two types of callers with different authentication mechanisms.

**Steps:**

1. Add a second secret: `ADMIN_SECRET` = some random string.
2. Update the hello function to check for a custom header:
   ```typescript
   const adminHeader = req.headers.get('x-admin-secret');
   const isAdmin = adminHeader === Deno.env.get('ADMIN_SECRET');
   const authHeader = req.headers.get('authorization');
   const isUser = !!authHeader; // simplified — in production, verify the JWT

   const response = isAdmin
     ? { role: 'admin', data: 'sensitive admin data' }
     : isUser
     ? { role: 'user', data: 'regular user data' }
     : { role: 'anonymous', data: null };
   ```
3. Test all three paths:
   - No headers → anonymous
   - Authorization: Bearer fake-jwt → user (simplified check)
   - x-admin-secret: your-secret → admin

**Discussion Prompts:**
- In the price-alerts function, why does the cron job use a custom header secret rather than a JWT?
- What would happen if the ADMIN_SECRET were leaked? How is this different from a JWT being leaked?

## Assessment / Checklist (Learner Self-Check)

- I can explain what "serverless" means and what trade-offs it involves
- I can name three situations where browser code is insufficient and a backend function is needed
- I can read a Supabase Edge Function and explain what `serve()` does and what a handler receives and returns
- I can store a secret in Supabase Secrets and read it inside a function without putting it in source code
- I can explain why `verify_jwt: false` is used in a function that serves both user and machine callers
- I can add CORS preflight handling and explain why it's needed for browser-originated requests
- I can deploy an Edge Function and invoke it via both curl and the browser

## Notes for Curriculum Build-Out (Next Steps)

- The price-alerts Edge Function (the full production version from retire-time) would make an excellent extended reading — it shows all the patterns from this module applied together: secrets, dual authentication, external API calls, database writes, cleanup of expired subscriptions
- Consider adding a section on function logs: Supabase's `query_logs` tool is how you debug a function that's deployed but not behaving correctly — the logs are essential for diagnosing silent failures (a function that returns 200 but doesn't do what it should)
- The cold start trade-off deserves more depth in a follow-on session: Edge Functions on Supabase run globally ("at the edge"), which reduces cold start latency compared to regional serverless, but the first invocation after dormancy is still noticeably slower
- Consider pairing this module with Module 10 (Push Notifications) in a single extended session, since the push notification send is the most interesting part of what the price-alerts function actually does
- Source sessions: retire-time price-alerts/index.ts (Deno, verify_jwt:false, Yahoo Finance API, web-push@3.6.7, check_prices via pg_cron + pg_net), Supabase Secrets setup (four secrets added manually in dashboard after MCP tool timed out)

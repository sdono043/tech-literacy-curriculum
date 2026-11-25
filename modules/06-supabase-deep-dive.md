# Technology Literacy Curriculum (TLC)

## Module 6: Supabase Deep Dive — Your First Cloud Database

**Status:** Draft v1 — built from live hands-on sessions, 2025–2026
**Domain:** Backend & Databases
**Format:** Hands-on lab using the retire-time Supabase project as the working example
**Prerequisite:** Module 5 — Databases 101 (SQL fundamentals, tables, foreign keys)
**Leads into:** Module 7 — Authentication (Supabase Auth is part of the same platform); Module 8 — Serverless Edge Functions

**Sequencing note:** Supabase is introduced here rather than earlier because learners who don't understand what a relational database is will treat Supabase as a black box and miss the reason it's powerful. This module treats Supabase as "PostgreSQL plus a production-grade API layer" — not as a beginner-friendly abstraction that hides the database.

## Why This Module Exists

The standard introduction to Supabase says: "open source Firebase alternative." That framing is backwards for learning purposes — it defines Supabase by what it's *not* rather than what it is. This module takes a different approach: Supabase is a PostgreSQL database with four things built on top of it (a REST/GraphQL API, authentication, file storage, and serverless Edge Functions) — and you can use each layer independently or together.

This module is built from the retire-time project (project ID: vsnmevfikdxszojxybtk), which uses all four layers: the database for user data, auth for Google sign-in, storage for future file uploads, and Edge Functions for the price-alert system. Every concept here is connected to code that actually ran in production.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Describe what Supabase provides and which layer handles which concern (database, auth, storage, functions)
2. Explain what **Row Level Security (RLS)** is, why it exists, and write a simple RLS policy
3. Explain what a **SECURITY DEFINER function** does and why it's needed for admin-level operations
4. Explain what a **migration** is in the context of a database and why you use them instead of editing the schema directly
5. Explain what **pg_cron** is and when it's appropriate to use database-level scheduling
6. Deploy a simple Edge Function to Supabase and invoke it
7. Manage secrets (API keys, tokens) in Supabase without putting them in code

## Core Concepts

### What Supabase Provides — Four Layers

**1. PostgreSQL Database.** The core. Full SQL support, real relationships, indexes, transactions. Every table, query, and stored procedure from Module 5 runs here exactly the same way. The retire-time database has five main tables: `profiles`, `positions`, `retirement_plans`, `price_alerts`, `push_subscriptions`.

**2. Auto-generated REST API.** For every table in your database, Supabase automatically generates a REST API that the frontend can call directly. The JavaScript client (`@supabase/supabase-js`) uses this API: `sb.from('positions').select('*')` translates into an authenticated HTTP request to the database.

**3. Authentication.** Built-in auth that supports email/password, magic links, and OAuth providers (Google, GitHub, etc.). Supabase Auth integrates with RLS: when a user signs in, their identity (`auth.uid()`) is available inside every SQL policy.

**4. Edge Functions.** Deno-based serverless functions that run at the network edge. Used in retire-time for the price-alerts system — the function fetches stock prices, evaluates alert thresholds, and sends Web Push notifications.

### Row Level Security — Security Inside the Database

Row Level Security is the most important Supabase concept for anyone building a multi-user application. Without it, any authenticated user could read any other user's data — the database would return everything and you'd have to filter in your application code. With RLS, the filtering happens *inside the database* and cannot be bypassed.

```sql
-- Enable RLS on the positions table
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own positions
CREATE POLICY "Users can view own positions"
  ON positions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can only insert their own positions
CREATE POLICY "Users can insert own positions"
  ON positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

`auth.uid()` is a Supabase function that returns the UUID of the currently authenticated user. The `USING` clause filters which rows a SELECT can return. The `WITH CHECK` clause validates whether an INSERT or UPDATE is allowed.

**The key insight:** these policies run *inside PostgreSQL*, as part of every query. It doesn't matter whether the request comes from the app, the Supabase dashboard, or a direct API call — RLS applies. This is fundamentally different from filtering in application code, where a bug (or a deliberate bypass) could expose data it shouldn't.

### SECURITY DEFINER Functions — Controlled Privilege Escalation

RLS protects individual users' rows. But admin operations — like counting all users, finding dormant accounts, calculating aggregate analytics — need to read across all rows, bypassing RLS.

The solution: a function that runs with the privileges of its *owner* (not the caller), but validates the caller's identity before returning anything. This is `SECURITY DEFINER`.

```sql
-- From retire-time's admin_get_users() function
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE(...)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check that the caller is an admin FIRST
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: admin only';
  END IF;

  -- Now return data across all users
  RETURN QUERY SELECT ...;
END;
$$;
```

The function bypasses RLS (by running as the owner), but it performs its own authorization check at the top. If the caller isn't an admin, it raises an exception and returns nothing.

**Why this matters for security:** a user could modify the JavaScript in the browser and try to call admin functions directly. The SECURITY DEFINER function stops them at the database level — not in app code that can be edited, but in SQL that the user has no access to change.

### Migrations — Tracking Schema Changes Over Time

When you change a database schema (add a column, create a table, modify a constraint), that change needs to happen consistently across every environment: local development, staging, and production. A migration is a SQL file that records exactly what changed and in what order.

In retire-time, migrations were applied using the Supabase MCP tool. Each migration is a numbered SQL file:

```sql
-- Migration: allow 'admin' role in profiles
-- Background: the original constraint only allowed 'advisor' and 'client'
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('advisor', 'client', 'admin'));
```

This migration was necessary because the original `profiles_role_check` constraint didn't include `'admin'` — inserting an admin user failed with a constraint violation until this migration ran.

**The rule:** never edit the database schema directly in production. Write a migration, test it, then apply it. That way you can reproduce the schema from scratch and understand exactly what changed and when.

### pg_cron — Scheduled Jobs Inside the Database

`pg_cron` is a PostgreSQL extension that runs SQL jobs on a schedule, the same way cron jobs run shell scripts on a server. In retire-time, it's used to check stock prices every 15 minutes during US market hours:

```sql
SELECT cron.schedule(
  'check-price-alerts',
  '*/15 9-16 * * 1-5',  -- every 15 min, 9am-4pm, Mon-Fri
  $$
  SELECT net.http_post(
    url := 'https://vsnmevfikdxszojxybtk.supabase.co/functions/v1/price-alerts',
    headers := '{"Content-Type":"application/json","x-cron-secret":"..."}',
    body := '{"action":"check_prices"}'
  );
  $$
);
```

This uses `pg_net` (another extension) to make an outbound HTTP call from inside PostgreSQL, calling the price-alerts Edge Function with a secret header to authenticate the scheduled request.

**When to use pg_cron vs. external schedulers:** pg_cron is ideal when the job is tightly coupled to the database (querying data, triggering functions). An external scheduler (like a GitHub Action or a cloud cron service) is better when the job needs to interact with many external systems or when you want the scheduling logic separate from the database.

### Supabase Secrets — Keeping Credentials Out of Code

Edge Functions need API keys (VAPID keys for Web Push, the Supabase service role key, the cron secret for authenticating scheduled calls). These must never appear in code that gets committed to a repository.

Supabase Secrets are environment variables that are injected into Edge Functions at runtime:

```typescript
// Inside an Edge Function — the secret is never in source code
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
const cronSecret = Deno.env.get('CRON_SECRET');
```

The values are set in the Supabase dashboard (Edge Functions → Manage Secrets) and are stored encrypted. In the retire-time build, four secrets were added manually: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY`.

**The mental model:** think of Supabase Secrets the same way you think of environment variables on your laptop. The code reads the name; the actual value lives outside the code.

## Lab 1: Write an RLS Policy for User-Scoped Data

**Goal:** Add RLS to a table so that users can only read and write their own rows.

**Steps:**

1. In the Supabase dashboard, open the SQL Editor for your project.
2. Create a simple test table with a `user_id` column.
3. Enable RLS: `ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;`
4. Write a SELECT policy using `auth.uid() = user_id`.
5. Write an INSERT policy using `WITH CHECK (auth.uid() = user_id)`.
6. Test from the frontend: sign in as User A, insert a row, sign out, sign in as User B — confirm User B cannot see User A's row.
7. Try bypassing it: in the Supabase dashboard (authenticated as the service role, which bypasses RLS), confirm all rows are visible — this is how the admin functions work.

**Discussion Prompts:**
- Why is filtering in application code insufficient? Give a concrete example of how a bug could expose another user's data.
- What happens if you enable RLS on a table but write no policies? (Answer: all access is denied by default.)
- When would you intentionally write an RLS policy that lets all authenticated users read a row? (Example: a public leaderboard.)

## Lab 2: Deploy a Supabase Edge Function

**Goal:** Write, deploy, and invoke a simple Edge Function.

**Steps:**

1. Create a new directory: `supabase/functions/hello-world/index.ts`
2. Write a minimal Deno function:
   ```typescript
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
   serve(async (req) => {
     return new Response(JSON.stringify({ message: 'Hello from Edge Functions!' }), {
       headers: { 'Content-Type': 'application/json' },
     });
   });
   ```
3. Deploy it via the Supabase MCP tool or `supabase functions deploy hello-world`.
4. Invoke it: `curl https://<project-ref>.supabase.co/functions/v1/hello-world`
5. Add authentication: check for a valid JWT using `supabase.auth.getUser(token)` before returning data.
6. Add a secret: store a value in Supabase Secrets, read it with `Deno.env.get('MY_SECRET')`, and return it (masked) in the response.

**Discussion Prompts:**
- Why use `verify_jwt: false` in the function's config and handle auth manually? (Answer: some callers — like the cron job — use a custom secret, not a JWT.)
- What's the difference between the `anon` key and the `service_role` key? Which one should the frontend use?

## Lab 3: Schedule a pg_cron Job

**Goal:** Schedule a recurring database job and verify it runs.

**Prerequisites:** pg_cron extension enabled in Supabase (Extensions tab in the dashboard).

**Steps:**

1. In the SQL editor, schedule a simple job: `SELECT cron.schedule('test-job', '* * * * *', 'SELECT now();')`
2. Verify it appears: `SELECT * FROM cron.job;`
3. Wait one minute, then check the run log: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;`
4. Update it to run every 15 minutes: `SELECT cron.unschedule('test-job'); SELECT cron.schedule('test-job', '*/15 * * * *', 'SELECT now();');`
5. Add market-hours logic: modify the schedule to `'*/15 9-16 * * 1-5'` (Mon-Fri, 9am-4pm server time — note: Supabase uses UTC, so adjust for your timezone).
6. Unschedule it when done: `SELECT cron.unschedule('test-job');`

**Discussion Prompts:**
- What's the difference between `cron.schedule()` running SQL directly vs. using `pg_net` to make an HTTP call?
- What happens if the cron job runs but the target Edge Function is down? How would you know?

## Assessment / Checklist (Learner Self-Check)

- I can describe the four layers of Supabase and what each one provides
- I can enable RLS on a table and write both SELECT and INSERT policies using `auth.uid()`
- I can explain why RLS in the database is more reliable than filtering in application code
- I can explain what SECURITY DEFINER does and why it's used for admin functions
- I can explain what a migration is and why you use migrations rather than editing the database directly
- I can deploy a basic Edge Function and invoke it via curl
- I can store a secret in Supabase Secrets and read it inside an Edge Function
- I can schedule a pg_cron job and verify it ran in the job_run_details log

## Notes for Curriculum Build-Out (Next Steps)

- The profiles_role_check constraint issue is worth its own callout box: "What happens when a constraint is too restrictive" — it's a common real-world database migration scenario (a constraint was written for the initial use case and later needed to change)
- Consider adding a section on the Supabase service role key vs. the anon key — this distinction is frequently confused and has real security implications (the service role key bypasses RLS entirely)
- The Edge Function deploy tooling changed during the retire-time build — worth noting that the Supabase MCP tool (`deploy_edge_function`) is the preferred approach in an AI-assisted development workflow, while the CLI is preferred for local development
- Consider pairing this module with Module 7 (Authentication) in a single lab session, since auth and RLS are tightly coupled — you need a signed-in user to test `auth.uid()` policies meaningfully
- Source sessions: retire-time Supabase project (vsnmevfikdxszojxybtk), price-alerts Edge Function deployment, pg_cron setup for market-hours price checking, admin_get_users() and admin_get_analytics() SECURITY DEFINER functions, profiles_role_check constraint migration

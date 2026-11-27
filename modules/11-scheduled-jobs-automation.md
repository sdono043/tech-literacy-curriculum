# Technology Literacy Curriculum (TLC)

## Module 11: Scheduled Jobs — Automation Inside the Database

**Status:** Draft v1 — built from live hands-on sessions, 2025-2026
**Track:** 3 — Modern Web App Features
**Format:** Guided lab using retire-time.com's price alert scheduler
**Prerequisite:** Module 6 (Supabase Deep Dive), Module 8 (Serverless Functions)
**Leads into:** Module 12 — Data Privacy & Sensitive Data

**Sequencing note:** Scheduled jobs are taught after serverless functions because a cron job's job is to call a function — you need to understand the function before you understand the schedule. The retire-time price alert system is a natural complete example: an Edge Function does the work (Module 8/10), and pg_cron is what runs it automatically.

## Why This Module Exists

Most real applications need code that runs on a schedule: check prices every 15 minutes, send a weekly summary email, expire old sessions daily, clean up orphaned records. In traditional web development, this means setting up a separate server or service just to run scheduled tasks. With a modern backend like Supabase, the database itself can be the scheduler — and that simplification has real architectural benefits.

This module is built from retire-time's price alert feature: a pg_cron job that fires every 15 minutes during US market hours (Monday through Friday, 9am–4pm Eastern) and calls the price-alerts Edge Function to check whether any user's stock price thresholds have been crossed. Building this involved two non-obvious discoveries: that some database parameters can't be set via migration scripts, and that the scheduling extension needed to be manually enabled before the cron job could be created.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain what a **cron job** is and why scheduled automation is a fundamental requirement of real applications
2. Read and write a **cron expression** (the five-field schedule syntax) including ranges, steps, and day-of-week values
3. Explain what **pg_cron** is and why database-level scheduling has advantages over external schedulers
4. Explain what **pg_net** is and how the database makes outbound HTTP calls
5. Explain the **market hours constraint** and how it's encoded in a cron expression
6. Explain how to **authenticate cron-to-function calls** using a shared secret header
7. Describe the difference between a cron job **running** and a cron job **succeeding** — and how to verify the latter
8. Identify the class of database configuration changes that cannot be made via migration scripts

## Core Concepts

### What a Cron Job Is

The name "cron" comes from the Greek word for time (Chronos) and refers to a Unix utility dating to 1975. A cron job is simply: a command that the system runs automatically at specified intervals, without any human triggering it.

The familiar example: an alarm clock. You configure it once (set the time, set the days), and it fires on its own. A cron job is the same idea applied to code — configure the schedule once, and the system calls your code at that interval indefinitely.

What makes cron jobs essential for real applications: users expect things to happen without them doing anything. Price alerts need to fire at the moment a threshold is crossed, not the next time the user opens the app. Weekly email digests need to send on Tuesday at 9am, not "whenever someone logs in and triggers it." Expired authentication sessions need to be cleaned up nightly, not "whenever someone happens to log in and the cleanup code runs."

### Cron Expression Syntax

A cron expression is five fields separated by spaces:

```
┌──────── minute (0-59)
│ ┌────── hour (0-23, in UTC unless specified)
│ │ ┌──── day of month (1-31)
│ │ │ ┌── month (1-12)
│ │ │ │ ┌ day of week (0-7, where both 0 and 7 = Sunday)
│ │ │ │ │
* * * * *
```

Special syntax:
- `*` — every value ("every minute", "every hour")
- `*/15` — every 15th value ("every 15 minutes")
- `9-16` — a range ("hours 9 through 16")
- `1-5` — Monday through Friday

Retire-time's price alert schedule:
```
*/15 14-21 * * 1-5
```

This runs every 15 minutes, during hours 14–21 UTC, Monday through Friday. 14:00–21:00 UTC corresponds to 9am–4pm Eastern time (adjusting for UTC offset), covering standard US market hours.

**Why UTC?** pg_cron uses UTC internally. If you write `9-16` thinking in Eastern time but pg_cron interprets it as UTC, the job runs at the wrong hours. Always convert your local schedule to UTC before writing the expression.

### pg_cron — Scheduling Inside Postgres

pg_cron is a Postgres extension that runs cron jobs as database jobs. Instead of needing a separate server or service to run scheduled tasks, the database itself handles the scheduling.

Enabling it in Supabase:
1. Database → Extensions → search "pg_cron" → enable it
2. After enabling, the `cron` schema becomes available
3. Jobs are created with `cron.schedule()` and listed in `cron.job`

```sql
SELECT cron.schedule(
  'check-price-alerts',              -- job name
  '*/15 14-21 * * 1-5',             -- cron expression (UTC)
  $$
    SELECT net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/price-alerts',
      headers := '{"Content-Type": "application/json", "x-cron-secret": "your-secret"}'::jsonb,
      body := '{"action": "check_prices"}'::jsonb
    );
  $$
);
```

**A critical migration lesson**: an earlier attempt to use a database migration to set a configuration parameter — `ALTER DATABASE postgres SET app.cron_secret = 'value'` — failed with `permission denied to set parameter`. Some database-level configuration can only be set by a superuser or through the platform's own UI, not through a migration script. The workaround: store the secret in Edge Function secrets (via the Supabase dashboard), not in a database parameter, and reference it in the function code rather than in the SQL.

### pg_net — HTTP from Inside the Database

pg_net is a Postgres extension that enables outbound HTTP requests from SQL queries. This is what makes the cron job able to call an Edge Function.

```sql
SELECT net.http_post(
  url := 'https://your-project.supabase.co/functions/v1/price-alerts',
  headers := '{"Content-Type": "application/json", "x-cron-secret": "abc123"}'::jsonb,
  body := '{"action": "check_prices"}'::jsonb
);
```

pg_net requests are **asynchronous** — the SQL statement returns immediately and the HTTP call happens in the background. To see the result of a pg_net call, query `net._http_response`.

### Authenticating Cron-to-Function Calls

The price-alerts Edge Function needs to know that a request with `action: "check_prices"` is coming from the legitimate scheduled job, not from someone who discovered the endpoint. The mechanism: a shared secret.

In the Edge Function:
```typescript
if (action === 'check_prices') {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }
  // proceed with price checking
}
```

The `CRON_SECRET` value is stored as an Edge Function secret in Supabase's dashboard (not in code, not in a migration file) and also embedded in the cron job's SQL. Anyone who can call the function endpoint but doesn't know the secret gets a 401.

### Running vs. Succeeding — The Monitoring Gap

A cron job "ran" means pg_cron executed the SQL statement. A cron job "succeeded" means the HTTP call it made actually returned a 200 from the Edge Function and the Edge Function did useful work.

These are not the same. A job can run successfully (pg_cron executed the SQL) while the actual work fails silently (the Edge Function returned an error that nobody saw). Common failure modes:
- The Edge Function URL changed
- The CRON_SECRET was rotated but the cron job wasn't updated
- The Edge Function crashed internally (returned 500)
- pg_net made the HTTP call but the response was never checked

To monitor: query `cron.job_run_details` to see recent run history, and add logging inside the Edge Function that records each check to a database table (a `price_check_log` with timestamp, prices_checked count, alerts_triggered count, errors).

## Lab 1: Set Up pg_cron in Supabase

**Goal:** Enable the pg_cron extension and create a simple test job.

**Steps:**

1. In the Supabase dashboard, go to **Database → Extensions** and enable `pg_cron`.
2. Go to **SQL Editor** and run:
   ```sql
   SELECT cron.schedule('test-job', '* * * * *', 'SELECT 1;');
   ```
3. Wait one minute, then run:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
   ```
4. Confirm the job ran. Then remove the test job:
   ```sql
   SELECT cron.unschedule('test-job');
   ```

**Discussion prompts:**
- Why is the SQL editor in the Supabase dashboard (not a migration file) the right place to run `cron.schedule()`?
- What would happen if you ran `cron.schedule()` twice with the same job name?

## Lab 2: Schedule a Price Check During Market Hours

**Goal:** Create a job that runs every 15 minutes on weekdays during US market hours.

**Steps:**

1. Enable `pg_net` extension (Database → Extensions → pg_net).
2. Store your cron secret in Supabase Edge Function secrets (Dashboard → Edge Functions → Manage Secrets).
3. In the SQL editor, create the cron job pointing at your Edge Function URL with the secret header.
4. Verify by querying `cron.job` to confirm the job exists and its schedule matches what you intended.
5. Wait for the next scheduled fire time and check `cron.job_run_details` to confirm it ran.
6. Check `net._http_response` to verify the HTTP call returned 200.

**Discussion prompts:**
- If you wrote `9-16` in the cron expression intending Eastern time, what hours UTC would it actually run?
- What's the difference between disabling a cron job and unscheduling it?

## Lab 3: Authenticate the Cron Call and Verify End-to-End

**Goal:** Confirm that the cron job's secret header is working and that the Edge Function rejects unauthenticated requests.

**Steps:**

1. Try calling the `check_prices` action on your Edge Function directly (via curl) *without* the secret header. Confirm you get 401.
2. Try with an incorrect secret. Confirm 401.
3. Try with the correct secret. Confirm you get 200 and prices are checked.
4. Check the cron job run details to confirm the scheduled call also got 200.

## Assessment / Checklist (Learner Self-Check)

- I can read a cron expression and state in plain English when it will fire
- I can write a cron expression for "every 15 minutes, Monday through Friday, 9am–4pm UTC"
- I can explain what pg_cron is and how it differs from an external cron service
- I can explain what pg_net does and why the HTTP call it makes is asynchronous
- I can explain the shared-secret pattern for authenticating cron-to-function calls
- I can explain the difference between a cron job "running" and a cron job "succeeding" and how to verify the latter
- I can describe one class of database configuration change that cannot be done via a migration script

## Notes for Curriculum Build-Out (Next Steps)

- Consider a lab on `cron.job_run_details` monitoring — building a simple admin view that shows the last 24 hours of cron activity and highlights failures
- The UTC conversion requirement is a frequent source of bugs and deserves a time zone conversion exercise
- Consider covering the pg_cron `cron.unschedule()` / `cron.alter_job()` lifecycle — job management is as important as job creation
- The asymmetry between what can be done in a migration vs. what requires the platform UI (enabling extensions, calling `cron.schedule()`, setting certain parameters) is a recurring theme worth calling out as a broader principle: not all database changes are equivalent
- Source sessions: retire-time pg_cron setup, failed `ALTER DATABASE` migration, manual SQL editor approach, `price-alerts` Edge Function `check_prices` action

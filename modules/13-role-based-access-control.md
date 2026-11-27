# Technology Literacy Curriculum (TLC)

## Module 13: Role-Based Access Control — Admin vs. User

**Status:** Draft v1 — built from live hands-on sessions, 2025–2026
**Track:** 4 — Building Real Products
**Format:** Guided lab using a real deployed admin console
**Prerequisite:** Module 6 (Supabase Deep Dive), Module 7 (Authentication)
**Leads into:** Module 14 — Analytics & Dashboards

**Sequencing note:** This module comes after authentication because RBAC is authentication's natural extension: once you know *who* someone is, the next question is *what are they allowed to do*. The retire-time admin console is the live example — a real page that required solving exactly the security problems this module teaches.

## Why This Module Exists

Most beginner tutorials teach access control as a frontend concern: "if the user is an admin, show this button; if not, hide it." That approach is not security — it's UX. Anyone who opens the browser's DevTools can modify JavaScript, intercept responses, or call your API directly. If the only thing standing between a regular user and admin data is a client-side `if (role === 'admin')` check, your admin data is not protected.

This module is built directly from the retire-time admin console: a real private portal at `/admin.html` where admin access is enforced at the Postgres database level, not the JavaScript level. The client-side check exists only as a user-experience layer — to avoid making non-admins wait for a network round-trip before showing them an error. The *real* gate is a SQL function that refuses to return any data unless the authenticated caller has `role = 'admin'` in the profiles table.

The lesson: **the database must be the authority on who is authorized, because it is the only layer an attacker cannot modify from outside.**

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain what **role-based access control (RBAC)** is and why it matters as a product grows beyond a single user
2. Explain why client-side role checks are **UX, not security**, and describe the attack that bypasses them
3. Describe how a `role` column in a `profiles` table enables server-side access control in Supabase
4. Explain what a **CHECK constraint** is and why it's the right place to enforce valid role values
5. Explain what a **SECURITY DEFINER** function is and why it allows a function to access data the calling user normally cannot
6. Describe the pattern of checking `auth.uid()` *inside* a SECURITY DEFINER function before returning any privileged data
7. Explain what an admin console should and should not expose — aggregate analytics vs. raw PII for other users
8. Write a database migration that adds a new role value to an existing CHECK constraint without breaking existing data

## Core Concepts

### Why Client-Side Checks Are Not Security

When a web page loads, everything it contains — HTML, CSS, and JavaScript — is downloaded to the user's computer. The user can:

- Open DevTools → Sources and read all JavaScript
- Use the Console to call any function defined on the page
- Use the Network tab to see every API call the page makes, then replay those calls with modified parameters using curl or Postman
- Install a browser extension that modifies JavaScript before it runs

A check like `if (user.role !== 'admin') { return; }` in page JavaScript is simply a suggestion that the browser is free to ignore. Any moderately technical person — and many automated scanners — can bypass it in under a minute.

The correct mental model: **treat every API call as potentially coming from an attacker who has removed all client-side checks**. Your server (or database function) must enforce access regardless of what the client claims.

### The Role Column Pattern

The simplest server-side RBAC starts with a single column in a user profiles table:

```sql
ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'advisor', 'client', 'admin'));
```

The CHECK constraint is a database-level rule — it cannot be bypassed by any amount of client-side modification. If code attempts to `UPDATE profiles SET role = 'superadmin'`, the database rejects it with a constraint violation error, regardless of who sent the request.

**Migration caution:** In retire-time, the original CHECK constraint only allowed `'advisor'` and `'client'`. When the admin role was added, a migration had to drop the old constraint and recreate it with `'admin'` included. This is a common real-world pattern: constraints are added early for data integrity, then carefully extended as the product evolves.

### SECURITY DEFINER Functions

Postgres functions run with one of two permission modes:

- **SECURITY INVOKER** (default): The function runs with the permissions of the *caller*. If the caller can't read a table, the function can't either.
- **SECURITY DEFINER**: The function runs with the permissions of the *owner* (typically a superuser or service role). This allows the function to access tables the caller normally cannot.

SECURITY DEFINER sounds dangerous — and it is, if misused. The critical rule: **always check the caller's identity and role at the very top of a SECURITY DEFINER function, before doing anything else.**

```sql
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- THIS CHECK IS THE ENTIRE SECURITY MODEL
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Only reaches here if caller is admin
  RETURN (SELECT json_agg(row_to_json(u)) FROM profiles u);
END;
$$;
```

If the check is omitted — or placed *after* any data access — the function becomes a privilege escalation vulnerability.

### What an Admin Console Shows vs. Hides

An admin console for a financial app walks a careful line. The retire-time admin dashboard shows:

**Shown (aggregate, non-identifying):**
- Total user counts, signup trends, monthly active users
- Feature adoption rates (what % of users have positions, plans, alerts)
- Most-held tickers across all users (ranked, anonymized)
- Flagged conditions: dormant users, users with no data, triggered alerts

**Shown (per-user, necessary for support):**
- Email address, join date, last active date
- Count of positions and plans (not the positions themselves)
- Whether push is enabled, number of active alerts

**Never shown:**
- Another user's actual portfolio holdings or dollar values
- Another user's retirement plan details
- Authentication tokens or credentials

The principle: aggregate data about behavior is legitimate admin visibility. Reading one user's private financial details requires explicit justification and should be treated as a privileged action distinct from routine dashboard access.

### Migrations for Existing Constraints

When a product's roles evolve, existing CHECK constraints need updating. The pattern:

```sql
-- Drop the old constraint by name
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;

-- Recreate with the expanded set of valid values
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'advisor', 'client', 'admin'));
```

This is a non-destructive change — existing rows with valid old values (`'advisor'`, `'client'`) still pass the new constraint. The key is knowing the constraint's name before you try to drop it; `\d profiles` in psql or the Supabase Table Editor shows existing constraints.

## Lab 1: Add an Admin Role to a Profiles Table

**Goal:** Add a `role` column to an existing `profiles` table with a CHECK constraint, then promote a user to admin.

**Steps:**

1. In the Supabase SQL Editor, inspect your existing `profiles` table structure. Note any existing constraints.
2. Add a `role` column with a CHECK constraint allowing a small set of valid values including `'admin'`:
   ```sql
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
     CHECK (role IN ('user', 'admin'));
   ```
3. Promote one user (yourself) to admin by email:
   ```sql
   UPDATE profiles SET role = 'admin'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
   ```
4. Try to set an invalid role and observe the constraint violation:
   ```sql
   UPDATE profiles SET role = 'superuser' WHERE id = '...'; -- Should fail
   ```

**Discussion prompts:**
- Why is the DEFAULT `'user'` important? What happens to new signups without it?
- What would happen if the CHECK constraint allowed any string value?

## Lab 2: Write a SECURITY DEFINER Function That Checks for Admin

**Goal:** Create a function that only returns user data when called by an admin.

**Steps:**

1. Write the function with the admin check at the top:
   ```sql
   CREATE OR REPLACE FUNCTION admin_get_user_count()
   RETURNS INTEGER
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     IF (SELECT role FROM profiles WHERE id = auth.uid()) IS DISTINCT FROM 'admin' THEN
       RAISE EXCEPTION 'Access denied: admin role required';
     END IF;
     RETURN (SELECT COUNT(*) FROM profiles);
   END;
   $$;
   ```
2. Call it as a non-admin user (or while signed out) and confirm it raises an exception.
3. Call it as an admin user and confirm it returns the count.
4. Remove the admin check from the function. Call it as a non-admin. Observe what happens. Restore the check.

**Discussion prompts:**
- Why does removing the check change the security of the entire system, not just this one function?
- If a junior developer adds a new data-fetching function and forgets the admin check, what's the blast radius?

## Lab 3: Build an Admin-Only Page That Fails Gracefully

**Goal:** Build a page that attempts to call an admin function and handles both the success and failure case.

**Steps:**

1. Build a minimal HTML page that calls your `admin_get_user_count()` function via the Supabase JS client.
2. If the call succeeds, show the count.
3. If the call throws an exception (non-admin or signed out), show a clear "Access denied" message — not a raw error or a blank screen.
4. Test by visiting the page while signed out, while signed in as a non-admin, and while signed in as an admin.

**Discussion prompts:**
- Why should the error message say "Access denied" rather than the raw Postgres exception message?
- What information does the raw exception message leak that an attacker might find useful?

## Assessment / Checklist (Learner Self-Check)

- I can explain why hiding a button in JavaScript is not an access control mechanism
- I can describe the attack that bypasses a client-side admin check
- I can explain what a CHECK constraint enforces and why the database is the right place for it
- I can explain what SECURITY DEFINER does and state the rule about where the authorization check must appear
- I can write a SECURITY DEFINER function that refuses non-admin callers before accessing any data
- I can explain the difference between aggregate admin analytics and per-user PII access
- I can write a migration that adds a new value to an existing CHECK constraint without breaking existing data

## Notes for Curriculum Build-Out (Next Steps)

- Consider a "break and fix" lab that ships the SECURITY DEFINER function *without* the admin check, demonstrates the exploit, then adds the check back — the contrast makes the lesson memorable
- Consider pairing this module with a Row Level Security refresher (Module 6), since SECURITY DEFINER and RLS are complementary patterns that often appear together
- Consider extending into audit logging: recording *which admin* accessed *which data* at *what time* as a separate concern from authorization itself
- Consider a brief section on Supabase's service role key vs. anon key — the service role key bypasses RLS entirely and must never appear in client-side code, which is the same principle as SECURITY DEFINER but at the API layer
- Source session: retire-time admin console build — profiles table role column, profiles_role_check constraint migration, admin_get_users() and admin_get_analytics() SECURITY DEFINER functions, admin.html with server-side enforcement

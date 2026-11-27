# Technology Literacy Curriculum (TLC)

## Module 14: Analytics & Dashboards — Understanding Your Users

**Status:** Draft v1 — built from live hands-on sessions, 2025–2026
**Domain:** Building Real Products
**Format:** Guided lab using a real admin analytics dashboard
**Prerequisite:** Module 5 (Databases 101), Module 13 (Role-Based Access Control)
**Leads into:** Module 15 — Financial App Domain Concepts

**Sequencing note:** This module comes after RBAC because analytics data is privileged — it describes the behavior of real users who didn't consent to being individually observed. Understanding *why* analytics must be admin-only before learning *how* to build it shapes better instincts about what data to collect, how to aggregate it, and what to never expose.

## Why This Module Exists

Most products fail not because they were built wrong, but because the team stopped paying attention after launch. Users signed up and then disappeared. Features were built that nobody used. Problems went undetected because no one was looking.

Analytics is the discipline of looking. But "analytics" in most beginner resources means "add Google Analytics" and move on. That approach answers traffic questions but not product questions: *Are people actually using the feature I shipped last week? Are users who signed up six months ago still active? What tickers do my users actually care about?*

This module teaches analytics as a SQL skill: writing queries against your own data to answer real questions about real user behavior. The source is retire-time's admin dashboard — a real production analytics system built entirely in Postgres with no third-party analytics tool. It surfaces everything from signup trends to feature adoption to individual users who signed up but never got value.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain the difference between **activation**, **retention**, and **engagement** as product metrics
2. Define **feature adoption rate** and explain why it is the most direct measure of whether a feature matters
3. Explain what a **dormant user** is, why dormancy is a leading indicator of churn, and how to query for it
4. Define **ghost users** (activated but never got value) and explain why they are the most actionable early-product metric
5. Write a SQL query using `COUNT`, `FILTER`, and date arithmetic to measure signups over a time window
6. Write a SQL query that returns JSONB with nested aggregates for a dashboard API endpoint
7. Explain the tradeoff between building your own analytics vs. using a third-party tool (Mixpanel, Amplitude, PostHog)
8. Describe what an analytics function should return vs. what it should never expose

## Core Concepts

### The Metrics Funnel: Acquisition → Activation → Retention → Engagement

These four words describe the lifecycle of a user, in order:

- **Acquisition**: The user signed up. They exist in your database. This is the easiest metric to measure and the least meaningful on its own.
- **Activation**: The user did the thing that makes the product valuable for the first time — added their first position, created their first retirement plan. Users who never activate are ghost users (see below).
- **Retention**: The user came back. They're still signing in weeks or months after their first visit. Dormant users are users who were retained but stopped coming back.
- **Engagement**: The user is actively using features. Feature adoption rate measures this at the feature level.

A product that optimizes only for acquisition (signups) while ignoring activation and retention is filling a leaky bucket. The retire-time admin dashboard surfaces all four layers: total signups (acquisition), ghost users (failed activation), active 7d (engagement), and dormant users (failed retention).

### Feature Adoption: Did Anyone Actually Use This?

Feature adoption rate is the percentage of your users who have used a specific feature at least once. In retire-time:

```sql
SELECT
  COUNT(*) FILTER (WHERE open_positions > 0)   AS has_positions,
  COUNT(*) FILTER (WHERE plans_count > 0)       AS has_plans,
  COUNT(*) FILTER (WHERE active_alerts > 0)     AS has_alerts,
  COUNT(*) FILTER (WHERE push_enabled = true)   AS has_push,
  COUNT(*)                                       AS total_users
FROM admin_user_summary;
```

This query answers: out of all users, what fraction has ever added a stock position? Created a retirement plan? Enabled push notifications? A feature with 5% adoption after three months is a signal — either the feature is hard to discover, the value proposition is unclear, or users don't need it. A feature at 80% adoption is a core feature.

**Key insight**: adoption rate is more informative than raw usage count. 50 users using a feature is different information when total users is 60 vs. when total users is 5,000.

### Dormant Users: When Quiet Is Bad

A dormant user is someone who signed up and was active at some point, but hasn't been seen in a defined window — 90 days is a common threshold. Dormancy is a *leading indicator* of churn: a dormant user who doesn't re-engage in the next 30 days is very likely to never come back.

```sql
SELECT COUNT(*) AS dormant
FROM profiles
WHERE last_sign_in < NOW() - INTERVAL '90 days'
  AND last_sign_in IS NOT NULL;
```

The `last_sign_in IS NOT NULL` clause excludes users who have never signed in at all (ghost users, covered below). Dormant users are distinct from ghosts: they found value at some point and then stopped.

The admin dashboard surfaces dormant users as an actionable alert — not just a number, but a prompt: *consider a re-engagement email*. The metric is only useful if it drives a response.

### Ghost Users: Activated but Never Got Value

A ghost user signed up but has zero positions and zero retirement plans. They completed the registration flow, confirmed their email, and then did nothing that made the product useful to them.

```sql
SELECT COUNT(*) AS ghost_users
FROM profiles
WHERE open_positions = 0 AND plans_count = 0;
```

Ghost users are the most actionable early-product metric because they represent a specific, recoverable failure: the activation step. Unlike dormant users (who found value and lost it), ghosts never found value at all. The fix is usually a better onboarding flow, a better first-run experience, or clearer communication of what the product does.

In retire-time, ghost users are surfaced in the admin dashboard's alerts banner with a 👻 emoji and a count — immediately visible without having to query for them manually.

### Top Content: What Do Your Users Actually Care About?

Usage data reveals user intent better than any survey. In retire-time, the top tickers query shows which stocks appear most frequently across all user portfolios:

```sql
SELECT
  ticker,
  COUNT(DISTINCT user_id) AS holders,
  SUM(value_usd) AS total_value
FROM positions
GROUP BY ticker
ORDER BY holders DESC
LIMIT 20;
```

This surfaces not just what stocks are held, but how widely — a ticker held by 15 users is different from one held by 2 users with large positions. The admin dashboard renders these as chips (compact visual elements) sorted by holder count. This kind of data drives product decisions: if 80% of your users hold Apple stock, Apple-specific features (earnings alerts, options data) have a large potential audience.

### Returning JSONB for a Dashboard API

When a dashboard needs several aggregates at once, it's more efficient to fetch them in a single database call than to make separate queries. Postgres's JSONB capabilities allow a single function to return a structured object with multiple nested arrays:

```sql
CREATE OR REPLACE FUNCTION admin_get_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Admin check first (see Module 13)
  IF (SELECT role FROM profiles WHERE id = auth.uid()) IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN jsonb_build_object(
    'signups_7d',  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days'),
    'active_7d',   (SELECT COUNT(*) FROM profiles WHERE last_sign_in > NOW() - INTERVAL '7 days'),
    'dormant',     (SELECT COUNT(*) FROM profiles WHERE last_sign_in < NOW() - INTERVAL '90 days'),
    'top_tickers', (
      SELECT jsonb_agg(jsonb_build_object('ticker', ticker, 'holders', holders))
      FROM (SELECT ticker, COUNT(DISTINCT user_id) AS holders FROM positions GROUP BY ticker ORDER BY holders DESC LIMIT 10) t
    )
  );
END;
$$;
```

The calling JavaScript receives one object with everything it needs to render the entire dashboard. This pattern — a single RPC call returning structured JSONB — reduces network round-trips and keeps the admin page fast even as data grows.

### Build vs. Buy Analytics

Third-party analytics tools (Mixpanel, Amplitude, PostHog, Google Analytics) are powerful for tracking user behavior at scale, with pre-built funnels, cohort analysis, and A/B testing. They're worth using when:

- You need event-level tracking (every button click, every page view)
- You need funnel visualization across many steps
- You have enough users that manual SQL queries become impractical
- You can afford the cost (Mixpanel/Amplitude are expensive at scale)

Building your own analytics in SQL is appropriate when:

- Your data is already in a relational database you control
- Your questions are product-level (adoption, retention) not event-level
- You want full control over what data leaves your infrastructure
- You're early enough that custom queries run fast

Retire-time's admin analytics are entirely in SQL because the data is already in Postgres, the questions are product-level, and there are no privacy concerns about data leaving the platform. The tradeoff: no pre-built funnels, no retention cohort charts, manual query writing for new questions.

## Lab 1: Write SQL to Find Dormant Users

**Goal:** Query a profiles table to identify users who haven't been active in 90 days.

**Steps:**

1. In the Supabase SQL Editor, run a query to count users by last sign-in date bucket:
   ```sql
   SELECT
     CASE
       WHEN last_sign_in > NOW() - INTERVAL '7 days'  THEN 'active_7d'
       WHEN last_sign_in > NOW() - INTERVAL '30 days' THEN 'active_30d'
       WHEN last_sign_in > NOW() - INTERVAL '90 days' THEN 'active_90d'
       WHEN last_sign_in IS NOT NULL                  THEN 'dormant'
       ELSE 'never_signed_in'
     END AS bucket,
     COUNT(*) AS users
   FROM profiles
   GROUP BY bucket;
   ```
2. Identify what percentage of your user base falls in each bucket.
3. Write a separate query that returns the email and join date for dormant users specifically (sorted by most recently active first — the ones most likely to re-engage).

**Discussion prompts:**
- If 40% of your users are dormant, what are three hypotheses for why? How would you test each?
- Why sort dormant users by most recently active first rather than most dormant?
- What action would you take differently for a user dormant 95 days vs. dormant 2 years?

## Lab 2: Calculate Feature Adoption Rate

**Goal:** Measure what percentage of users has used each feature at least once.

**Steps:**

1. Run the adoption query against your data:
   ```sql
   SELECT
     ROUND(100.0 * COUNT(*) FILTER (WHERE open_positions > 0) / NULLIF(COUNT(*), 0), 1) AS pct_with_positions,
     ROUND(100.0 * COUNT(*) FILTER (WHERE plans_count > 0) / NULLIF(COUNT(*), 0), 1)    AS pct_with_plans,
     COUNT(*) AS total_users
   FROM profiles;
   ```
2. For any feature below 20% adoption, write a hypothesis for why. Is it discovery? Value clarity? Friction in the flow?
3. Write a query that shows adoption broken out by signup cohort (users who joined in the last 30 days vs. older users). Does adoption differ by cohort?

**Discussion prompts:**
- A feature has 8% adoption 6 months after launch. What does that tell you? What doesn't it tell you?
- Why use `NULLIF(COUNT(*), 0)` in the denominator instead of just `COUNT(*)`?
- Is 100% adoption always a good sign? When might it indicate a problem?

## Lab 3: Build a Single Analytics Function That Returns JSONB

**Goal:** Write a SECURITY DEFINER function that returns all dashboard metrics in one call.

**Steps:**

1. Write a function that returns a JSONB object with at minimum: `total_users`, `signups_7d`, `dormant`, and `feature_adoption` (itself a JSONB object with per-feature counts).
2. Call it from JavaScript using `sb.rpc('admin_get_analytics')` and log the result.
3. Render the `feature_adoption` data as a simple list of `feature: N users (X%)` lines.
4. Add a `top_tickers` key that returns the top 5 tickers by holder count.

**Discussion prompts:**
- Why is one `sb.rpc()` call better than four separate `sb.from()` queries for a dashboard?
- What happens to the dashboard if you forget the admin check in this function?
- How would you add a new metric to the dashboard without breaking existing dashboard code?

## Assessment / Checklist (Learner Self-Check)

- I can explain the difference between acquisition, activation, retention, and engagement
- I can define feature adoption rate and interpret what a low rate means
- I can explain what a dormant user is and distinguish dormancy from ghost-user status
- I can write a SQL query using COUNT FILTER and date arithmetic to measure activity over a time window
- I can write a Postgres function that returns JSONB with nested aggregates
- I can explain the tradeoff between building analytics in SQL vs. using a third-party tool
- I can describe what an admin analytics function should return and what it should never expose

## Notes for Curriculum Build-Out (Next Steps)

- Consider adding a cohort retention module that extends this into week-over-week retention curves — the natural follow-on once learners understand the basic dormancy query
- Consider a lab that visualizes signup trends as a bar chart using the browser's native SVG support or a lightweight charting library — connecting the SQL output to a visual representation closes the loop
- Consider pairing with Module 13 to reinforce why all analytics queries must run behind SECURITY DEFINER with admin checks
- Consider a brief section on the ethics of user analytics: what constitutes legitimate business intelligence vs. surveillance, and how data minimization applies to analytics data itself
- Source session: retire-time admin_get_analytics() SQL function, admin.html dashboard (alerts banner, stat strip, feature adoption grid, top tickers chips, signup trend bars), live session building ghost-user detection and dormancy alerting

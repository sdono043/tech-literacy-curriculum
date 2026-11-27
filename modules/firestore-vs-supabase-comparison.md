# Technology Literacy Curriculum (TLC)

## Deep Dive: Firestore vs. Supabase — When to Use Which

**Status:** Draft v1 — built from live hands-on sessions, 2025–2026
**Track:** 2 — Backend & Databases (deep dive, companion to Modules 5–8)
**Format:** Technical comparison with side-by-side code examples and decision framework
**Prerequisite:** Module 5 (SQL fundamentals), Module 6 (Supabase), or equivalent Firestore experience
**Position in curriculum:** This deep dive sits between Track 2 and Track 3, after learners have worked with Supabase hands-on and are asking the right question: "when would I use the other thing?"

**A note on framing:** Supabase's own marketing calls it "an open source Firebase alternative." This framing is backwards for learning — it defines Supabase by what it's not. This module instead defines both platforms by what they *are* and treats the comparison as a decision-making exercise, not a verdict.

## Why This Deep Dive Exists

Most "Firestore vs. Supabase" comparisons on the internet read like marketing. They list feature checkboxes, declare a winner, and move on. That's not useful for someone who needs to actually make the choice.

This deep dive is built from a real use case: retire-time, a personal finance app with user accounts, stock portfolios, retirement plans, price alerts, push notifications, and an admin analytics dashboard. That feature set exposed exactly where each platform's strengths and limits appear in practice — and the SQL that powers the admin analytics (`admin_get_analytics()`: GROUP BY, SUM, COUNT, JOIN across four tables) is a concrete example of something Firestore cannot do at all.

## The Fundamental Difference

Firestore is a document database. Data lives in **collections** of **documents** (JSON objects). There's no schema: a document in the `positions` collection can have any fields you want, and different documents in the same collection can have completely different fields.

Supabase is PostgreSQL with an API layer. Data lives in **tables** with **columns** that have declared types. Every row in `positions` must have exactly the declared columns, in the declared types.

This difference is not just cosmetic. It shapes how you model data, what questions you can ask of it, how you secure it, and what happens as your application grows.

## Side-by-Side: The Same Tasks in Both

### 1. Create a User Record on Sign-In

**Firestore:**
```javascript
// After Google sign-in, create or update a user document
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

await setDoc(doc(db, 'users', user.uid), {
  email: user.email,
  created_at: serverTimestamp(),
  role: 'user',  // any string — no constraint enforced
}, { merge: true });
```

**Supabase (via database trigger):**
```sql
-- A trigger runs automatically after a new auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'client')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Key difference:** In Firestore, the client creates the document. In Supabase, a server-side trigger creates the profile automatically — the client never touches the profiles table directly, and the CHECK constraint `profiles_role_check` guarantees `role` is always one of the allowed values.

### 2. Write a Security Rule / RLS Policy

**Firestore Security Rules:**
```javascript
// Firestore uses a custom rule language (not SQL)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /positions/{positionId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.user_id;
    }
  }
}
```

**Supabase Row Level Security:**
```sql
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own positions"
  ON positions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions"
  ON positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Key difference:** Firestore rules are a custom DSL that you learn separately. Supabase RLS is SQL — the same language you're already using for queries and schema. For a team already fluent in SQL, Supabase RLS has zero additional syntax to learn.

### 3. Query Filtered Data

**Firestore:**
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';

// Get positions where shares > 0
const q = query(
  collection(db, 'positions'),
  where('user_id', '==', auth.currentUser.uid),
  where('shares', '>', 0)
);
const snapshot = await getDocs(q);
```

**Supabase:**
```javascript
const { data } = await supabase
  .from('positions')
  .select('*')
  .eq('user_id', supabase.auth.user().id)
  .gt('shares', 0);
```

Both look similar at this level. The divergence appears when the query gets more complex.

**Firestore limitation — no compound queries across collections:**
```javascript
// THIS IS NOT POSSIBLE IN FIRESTORE:
// Get each user's total portfolio value across all users
// You cannot JOIN, GROUP BY, or aggregate across documents
```

**Supabase SQL — the same query:**
```sql
SELECT
  profiles.email,
  COUNT(positions.id) AS position_count,
  SUM(positions.shares * positions.avg_cost) AS total_invested
FROM profiles
LEFT JOIN positions ON profiles.id = positions.user_id
GROUP BY profiles.id, profiles.email
ORDER BY total_invested DESC;
```

This is a real query from retire-time's `admin_get_analytics()` function. It would require multiple Firestore requests, client-side aggregation, and significant application logic to replicate — and would not scale.

### 4. Authenticate a User

**Firestore (Firebase Auth):**
```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
const provider = new GoogleAuthProvider();
const result = await signInWithPopup(auth, provider);
const user = result.user;  // { uid, email, displayName, ... }
```

**Supabase Auth:**
```javascript
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.href }
});
// After redirect, session is available via:
const { data: { session } } = await supabase.auth.getSession();
```

Both are similar in developer experience. Firebase Auth has had longer to mature and has broader provider support. Supabase Auth is tightly integrated with RLS: `auth.uid()` is available in every SQL policy the moment a user signs in.

## Comparison Table

| Dimension | Firestore | Supabase |
|---|---|---|
| **Data model** | Documents in collections (JSON, no schema) | Tables with typed columns (SQL) |
| **Querying** | Limited: simple filters, one collection at a time | Full SQL: JOINs, GROUP BY, aggregates, CTEs |
| **Schema enforcement** | None — any fields, any types | Strict — declared columns, type checking |
| **Real-time updates** | First-class: `onSnapshot()` for live listeners | Available: Supabase Realtime channels |
| **Security model** | Firestore Security Rules (custom DSL) | Row Level Security (SQL policies) |
| **Backend functions** | Cloud Functions (Node.js, cold starts) | Edge Functions (Deno/TypeScript, global) |
| **Vendor** | Google (fully proprietary) | Open source (self-hostable) |
| **Pricing** | Per read/write operation | Per GB storage + compute hours |
| **Self-hosting** | Not possible | Possible (Docker Compose) |
| **Learning curve** | Lower initial, higher complexity ceiling | Higher initial, consistent ceiling |

## Where Firestore Wins

**Real-time first applications.** Firestore's `onSnapshot()` is elegant and battle-tested. A chat app, a collaborative document, or a live game leaderboard where every client needs instant updates is Firestore's natural habitat. Supabase Realtime exists but is newer and less mature.

**Hierarchical data with no need to query across it.** If a user's data is entirely self-contained (a document with nested sub-documents) and you never need to aggregate or join across users, Firestore's document model is a natural fit. Modeling a user's daily journal entries, for example.

**Prototyping speed.** No schema to design. No migrations to write. Add a field to one document and it just works. For getting something working quickly when the data model is uncertain, Firestore has less friction.

**Global scale writes.** Firestore is a globally distributed, eventually consistent database optimized for massive write throughput. If you're building a system that will process millions of writes per second from users worldwide with no coordination, Firestore is designed for that. PostgreSQL (Supabase) is not.

## Where Supabase Wins

**Complex queries.** This is the clearest win and it's decisive for financial applications. Firestore cannot do the aggregation queries in `admin_get_analytics()`: GROUP BY, SUM, JOIN, COUNT — all of these require multiple trips to Firestore and client-side logic. In Supabase, it's one SQL query.

**Relational data.** When a position belongs to a user, a user has retirement plans, and plans reference goals — that's a relational data model. Firestore technically supports sub-collections and document references, but querying across them requires multiple round trips and cannot be done in a single consistent transaction. PostgreSQL handles this natively.

**Admin analytics.** The retire-time admin dashboard (`admin_get_analytics()`) returns: `signups_7d`, `signups_30d`, `active_7d`, `dormant`, `alerts_triggered_7d`, `top_tickers` (ranked by holder count), and `feature_adoption` (% of users with positions, plans, alerts, push). All of this is one Postgres function. The equivalent in Firestore would require reading every user document, every position document, every alert document — and assembling the aggregates in application code.

**Data integrity.** The `profiles_role_check` constraint enforces that `role` is always one of `'advisor'`, `'client'`, or `'admin'`. The `positions` foreign key to `profiles` ensures every position has a valid user. These guarantees don't exist in Firestore: a bug in application code can write any value to any field, and there's no database-level protection.

**Open source / avoiding vendor lock-in.** Supabase is open source and self-hostable. If you need to migrate off Supabase's hosted service, you're migrating a PostgreSQL database — the most standard database format in the world. Firestore is Google-proprietary: there's no "export and run on your own server."

## The Verdict for Financial Applications

For retire-time specifically — and for financial applications generally — Supabase/PostgreSQL is the right choice. The reasons:

1. **Aggregate queries are non-negotiable.** A portfolio total requires `SUM`. A tax-loss harvesting analysis requires querying positions by user, ordered by gain/loss, with join to cost basis. An admin dashboard requires aggregation across all users. These are SQL operations.

2. **Data integrity matters.** A user's share count should not accidentally become a string. An admin's role should not be an arbitrary value. Constraints and types enforce this at the database level.

3. **The schema is known.** Financial data has a well-understood structure. The flexibility of Firestore's schemaless model offers no benefit here and introduces risk.

4. **Future queries are unknown.** You know the shape of financial data but not every question you'll eventually ask of it. SQL lets you ask questions you didn't anticipate. Firestore's query limitations will become blockers.

## Migration Path: Firestore → Supabase

If you have a Firestore application and want to move to Supabase:

1. **Export Firestore data** to JSON using the Firebase CLI: `firebase firestore:export gs://your-bucket`.
2. **Design the relational schema.** Map Firestore collections to tables. Map document fields to columns. Add primary keys and foreign keys where document references exist. Assign proper types.
3. **Write a migration script** that reads the exported JSON and inserts rows into Supabase tables. Python with the `supabase-py` client works well for this.
4. **Port security rules to RLS policies.** Firestore rules have a different structure than RLS but the same intent — translate rule by rule.
5. **Update the client code.** Swap `firebase/firestore` imports for `@supabase/supabase-js`. The query API is similar at the surface; complex queries become simpler (or possible for the first time).
6. **Port Cloud Functions to Edge Functions.** The runtime changes (Node.js → Deno/TypeScript) but the structure is similar.

## Labs: The Same Task in Both Platforms

**Goal:** Do each of the following four tasks in both Firestore and Supabase, back to back, and compare the experience.

1. **Create a user record** after sign-in. Note: Firestore requires a client-side write; Supabase triggers a server-side insert automatically.
2. **Write a security rule** that lets users read only their own rows. Note: compare the Firestore DSL syntax vs. Supabase SQL syntax.
3. **Query positions where shares > 0, sorted by value descending.** Note: at this level the APIs look similar.
4. **Count total positions across all users.** Note: Firestore cannot do this in one query; Supabase can.

**Discussion Prompts:**
- After doing task 4, which result do you trust more — the one that happened in one database query, or the one assembled from multiple client-side reads? Why?
- If you were building a chat application where users need live updates when new messages arrive, which platform would you choose and why?
- Firestore's pricing is per read/write operation. Supabase's pricing is per storage and compute. How does this difference affect the cost of an admin analytics dashboard that runs complex queries?

## Assessment / Checklist (Learner Self-Check)

- I can explain the fundamental difference between a document database and a relational database
- I can explain why Firestore cannot perform GROUP BY or JOIN across collections
- I can write both a Firestore security rule and a Supabase RLS policy for the same access pattern
- I can explain three situations where Firestore is the better choice
- I can explain three situations where Supabase/PostgreSQL is the better choice
- I can describe the migration path from Firestore to Supabase at a high level
- I can explain why the retire-time admin analytics required PostgreSQL specifically

## Notes for Curriculum Build-Out (Next Steps)

- Consider adding a third platform to the comparison: PlanetScale (MySQL-compatible, serverless), Neon (serverless Postgres), or MongoDB Atlas (document, with limited SQL). The pattern of "which platform for which use case" is a transferable skill
- The migration path section is high-level by necessity — a detailed migration exercise (exporting real Firestore data and importing to Supabase) would be a strong capstone lab for learners who are actively making the platform choice
- Consider a companion section on pricing with realistic numbers: a small Firestore app with 10K daily active users doing 10 reads per session = 100K reads/day × $0.06/100K = cheap; a heavy analytical dashboard doing 1M reads/query × daily runs = expensive. The same analytics dashboard on Supabase: one query, no per-read cost
- Source sessions: retire-time admin_get_analytics() (the query that requires SQL), retire-time Supabase schema design sessions, comparison informed by real Firestore migration projects from other contexts

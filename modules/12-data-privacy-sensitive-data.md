# Technology Literacy Curriculum (TLC)

## Module 12: Data Privacy — What Never Leaves the Server

**Status:** Draft v1 — built from live hands-on sessions, 2025-2026
**Domain:** Modern Web App Features
**Format:** Guided lab + architectural decision workshop
**Prerequisite:** Module 6 (Supabase Deep Dive), Module 8 (Serverless Functions)
**Leads into:** Module 13 — Role-Based Access Control

**Sequencing note:** This module is placed after databases and serverless functions because data privacy decisions are architectural — they determine where data flows, where it's processed, and where it stops. Those decisions require understanding both the database layer (what gets stored) and the function layer (what gets processed without being stored). Teaching privacy concepts before the learner understands the stack would be abstract; at this point in the curriculum, it's immediately actionable.

## Why This Module Exists

The most important data privacy decision is not which encryption algorithm to use — it's whether to store data at all.

Retire-time handles W2 forms, financial projections, and retirement plans. Early in the project, this constraint was stated explicitly: *"I want to make sure there isn't sensitive data that is stored anywhere since those forms can have SSN and things like that."* That single sentence shaped every architectural decision that followed: how W2 uploads work, what gets written to the database, what gets discarded immediately.

This module teaches data privacy not as a compliance checklist but as a design practice — a set of questions that architects and developers should be asking at the beginning of every feature, not retrofitting after the fact.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain the principle of **data minimization** and state why it is the most effective privacy control
2. Explain the difference between **processing** sensitive data and **storing** it, and why that distinction is architecturally significant
3. Identify which categories of data (SSN, DOB, banking data, health records) trigger additional legal and architectural obligations
4. Describe the retire-time W2 parsing design: extract only the needed fields, return structured data, never write the raw document to the database
5. Explain in plain language what **HIPAA**, **CCPA**, and **PCI-DSS** require for someone building a consumer fintech application
6. Explain what an **audit log** records and why it records *that something happened* rather than *what it was*
7. Identify design patterns that allow useful application features to be built without storing sensitive raw data
8. Audit an existing application's database schema for fields that represent over-collection

## Core Concepts

### Data Minimization — The Safest Data Is Data You Never Collected

Every piece of sensitive data your application stores creates ongoing obligations: it must be secured, encrypted at rest, encrypted in transit, access-logged, potentially disclosed in a breach, and defensible in court. The simplest way to avoid those obligations is not to collect the data in the first place.

Data minimization is the principle that you should collect only the data your feature actually needs to function — and no more. It sounds obvious. In practice, it's resisted because "maybe we'll need it later" feels free. It isn't. Storage is cheap; liability is not.

Applied to retire-time: when a user uploads their W2, the application needs to know their total income and federal withholding to populate retirement projections. It does *not* need their employer's EIN, their SSN, their precise address, or any of the other fields on the W2 form. The correct design: use the Claude API to extract only the needed fields, return only those fields to the client, and never write the raw W2 document or its remaining fields to any database.

### Processing vs. Storing — The Critical Architectural Distinction

A piece of sensitive data can be:

- **Never seen by your system** (the user enters it only in a third-party form your app never touches)
- **Processed but not stored** (your server receives it, extracts what it needs, and discards the rest in memory)
- **Stored temporarily** (written to a database, deleted after a time limit)
- **Stored permanently** (written to a database with no deletion policy)

Each level carries different risk and different regulatory treatment. The retire-time W2 flow is intentionally designed to stay at "processed but not stored":

```
User selects W2 PDF
  → Frontend sends to Edge Function (HTTPS, ephemeral)
  → Edge Function sends to Claude API for extraction
  → Claude API returns structured JSON: { income, withholding, employer_name }
  → Edge Function returns structured JSON to frontend
  → Frontend uses data to populate form fields
  → RAW DOCUMENT IS NEVER WRITTEN TO ANY DATABASE
```

The SSN never enters retire-time's database. It passes through Claude's API (with their data handling policies applying), but it is never at rest in a system the developer controls and must secure.

### Sensitive Data Categories and Their Obligations

Different data categories carry different legal weight. For a consumer fintech app:

**Personally Identifiable Information (PII):** Name, email, address. Present in almost every application. Subject to CCPA (California), GDPR (EU), and similar state/national laws. Requires breach notification, deletion-on-request ("right to be forgotten"), and data inventory documentation.

**Social Security Numbers:** Regulated at the federal level (GLBA for financial data, state SSN protection laws). Must be encrypted at rest if stored. Most consumer fintech applications have no business storing SSNs — the tax filing, the credit check, the identity verification all happen with a third-party service that takes responsibility for SSN handling.

**Financial Account Data:** Routing numbers, account numbers, card numbers. PCI-DSS (Payment Card Industry Data Security Standard) applies to card data. GLBA applies to bank account data. For most applications: use a third-party (Plaid for bank linking, Stripe for payments) that takes on PCI/GLBA compliance — storing raw account numbers yourself is almost never appropriate.

**Health and Medical Data:** HIPAA. The US health data privacy regulation. Very strict, requires Business Associate Agreements with any vendor who touches the data, significant penalties for breach. Unless your application is explicitly a healthcare application, avoid collecting health data.

**Retirement-specific data:** Covered under ERISA (the federal retirement plan law). Retire-time's data — portfolio positions, retirement projections — is financial planning data, not covered under HIPAA, but subject to general financial privacy regulations.

### The W2 Upload Design — A Worked Example

The W2 upload feature illustrates the design pattern:

**What the application needs:** income amount, federal withholding amount, and optionally the employer name (for display only).

**What a W2 contains:** name, address, SSN, employer EIN, employer address, wages, federal withholding, state withholding, Social Security wages, Medicare wages, and a dozen more fields.

**The extraction prompt sent to the Claude API:**
```
Extract from this W2 document ONLY: total wages (box 1), federal income tax withheld (box 2), 
and employer name. Return JSON: { wages: number, federal_withheld: number, employer: string }. 
Do not include SSN, EIN, addresses, or any other fields.
```

**What is stored in the Supabase database:**
```json
{ "wages": 95000, "federal_withheld": 14200, "employer": "ACME Corp" }
```

**What is never stored:** The W2 PDF. The SSN. The EIN. Everything else on the form.

This design required intentional restraint: it would be technically easy to store the full extracted JSON or the raw document. The constraint — "SSN and things like that" — required explicitly designing for *not* storing those fields.

### Audit Logs — Recording That Something Happened

Audit logs are records of *actions* rather than *data*. When a user's financial projection is viewed, an audit log records:

- Timestamp
- Which user viewed it
- Which projection was viewed (by ID)
- IP address (optionally)

It does *not* record the contents of the projection. This matters because audit logs are often retained longer than the data they describe — they may be reviewed in a legal proceeding, a regulatory audit, or an incident investigation. Recording that an admin viewed a user's projection is the accountability record. Recording the projection's contents in the audit log would create a second copy of sensitive data with its own security obligations.

### A Practical Question Checklist

Before storing any new field in the database, ask:

1. **Does the feature actually need this stored, or just processed?** (Can we extract and discard?)
2. **What is the minimum information the feature requires?** (Can we store an aggregate instead of the raw value?)
3. **Who will have access to this field?** (Does RLS restrict it? Can an admin query it? What about a future engineer?)
4. **What is the deletion policy?** (When a user deletes their account, does this field get deleted too?)
5. **What happens if this field is in a data breach?** (Is it embarrassing? Is it regulated? Could it enable identity theft?)

## Lab 1: Audit an Existing Schema for Over-Collection

**Goal:** Review a database schema and identify fields that may represent unnecessary data collection.

**Steps:**

1. List all tables and columns in your Supabase schema (Database → Table Editor, or query `information_schema.columns`).
2. For each column, classify it: (a) essential to a current feature, (b) might be useful someday, (c) collected but never used, (d) sensitive (PII, financial, health).
3. For every column in categories (b), (c), or (d): apply the five-question checklist above.
4. Document which fields you would remove or restrict if starting the schema over today.

**Discussion prompts:**
- What is the difference between "we store this because a feature uses it" and "we store this because it was easy to include in the INSERT"?
- What obligation does storing an email address create that storing a username does not?

## Lab 2: Design a Form That Never Persists Raw Sensitive Input

**Goal:** Build a document upload flow that extracts needed fields and discards the rest.

**Steps:**

1. Create an Edge Function that receives a file upload.
2. Send the file to an extraction API (Claude, or simulate with a manual extraction function).
3. Return *only* the needed structured fields to the frontend.
4. Write *only* the structured fields to the database.
5. Verify: query the database directly and confirm the raw document is not present anywhere.

**Discussion prompts:**
- If a user contacts support claiming the extracted data was wrong, how do you handle it without having the original document?
- What would change about this design if the application needed to verify the original document for compliance purposes?

## Lab 3: Write an Audit Log That Records Actions Without Duplicating Data

**Goal:** Add audit logging to an admin action without storing the sensitive data the action accessed.

**Steps:**

1. Create an `audit_log` table with columns: `id`, `actor_id` (who did it), `action` (what happened), `target_id` (which record), `timestamp`.
2. After an admin views a user's data, insert a row: `{ actor_id: adminId, action: 'viewed_user_profile', target_id: userId }`.
3. Query the audit log to reconstruct "what did admin X access last week?" — confirm you can answer the accountability question without exposing the user's data.

## Assessment / Checklist (Learner Self-Check)

- I can explain data minimization in one sentence and give an example from retire-time
- I can explain the difference between processing sensitive data and storing it, and why the distinction matters
- I can name three categories of data that carry specific legal obligations for a fintech app
- I can describe the W2 parsing design — what gets extracted, what gets stored, what gets discarded
- I can explain what an audit log records and why it deliberately omits the data it's auditing
- I can apply the five-question checklist to any new database field before it's added

## Notes for Curriculum Build-Out (Next Steps)

- Consider adding a module on encryption-at-rest and encryption-in-transit — this module focused on "don't store it"; the companion to that is "if you must store it, encrypt it correctly"
- The expiring API key incident (user got an error uploading a W2 because the Anthropic API key stored in Supabase secrets had expired) is a useful example of secret rotation practices — worth a sidebar on API key lifecycle management
- Consider covering the CCPA "right to be forgotten" requirement specifically — what does it mean technically to delete a user's data when their account references records across multiple tables?
- Regulatory framing (HIPAA/CCPA/PCI-DSS) in this module is intentionally high-level; a deeper compliance module would be appropriate for learners pursuing fintech or healthcare product roles
- Source: retire-time privacy constraint ("SSN and things like that"), W2 upload feature design, Anthropic API key expiration incident

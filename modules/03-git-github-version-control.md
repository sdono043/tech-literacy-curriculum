# Technology Literacy Curriculum (TLC)

## Module 3: Git & GitHub — Version Control for Non-Developers

**Status:** Draft v1 — built from live hands-on sessions, 2025–2026
**Domain:** Foundations — How the Web Works
**Format:** Guided lab using a real project repository with a full commit history
**Prerequisite:** None required, though Module 4 (Frontend Fundamentals) is a natural companion
**Leads into:** Module 5 — Databases 101 (all subsequent modules assume basic git/GitHub fluency)

**Sequencing note:** Every other module in this curriculum involves pushing code to a repository. Git fluency isn't a detour — it's the foundation. A learner who understands branching before writing their first line of code will have a dramatically easier time with every collaborative or iterative project that follows.

## Why This Module Exists

Most introductions to git start with commands: `git init`, `git add`, `git commit`. That approach produces people who can copy-paste commands without understanding what they're doing or why. When something goes wrong — a merge conflict, a detached HEAD, a pushed commit that breaks the site — they have no mental model to reason from.

This module starts from the problem git is solving, not from the commands. The retire-time project — a real financial planning app built over dozens of sessions — generated 85+ merged pull requests across branches, with a full commit history showing every change made, by whom, and why. That history is the lab. Reading it, navigating it, and contributing to it teaches git as a practitioner uses it, not as a manual describes it.

The core insight this module delivers: **git is not about commands. It's about answering "which version is current?" for a file that dozens of people might be editing simultaneously, across time.** Every git concept follows from that single problem.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain what problem git solves, and why emailing files or saving "v2_final_FINAL.docx" versions is the alternative it replaced
2. Explain the difference between a **repository**, a **commit**, and a **branch** as concepts — before touching any commands
3. Describe the standard GitHub workflow: branch → edit → commit → pull request → review → merge
4. Explain what "merging" means physically — how two diverged histories get combined, and what a merge conflict is
5. Explain what a **pull request** is and why it exists as a human review step, not just a technical one
6. Explain how GitHub Pages auto-deploys a live website when a commit is pushed to the `main` branch
7. Read a commit history to understand what changed, when, and why — using real project history as the source
8. Recognize common branch naming conventions and explain what they communicate
9. Explain why teams work on branches instead of directly on `main`, and what goes wrong when they don't

## Core Concepts

### The Problem Git Solves — Before Any Commands

Imagine three people editing the same document simultaneously in a world without Google Docs. Person A saves their version. Person B saves their version. Person C saves theirs. Now: which version is "current"? Whose changes survive? What happens to the work the others did?

Git solves this by tracking every change to every file as a permanent, addressable record — a **commit**. A commit is a snapshot of what every file looked like at a specific moment, plus a message explaining why the change was made and who made it. The entire history of a project is a chain of these snapshots, and that chain can never be rewritten without evidence of the rewrite.

**Learner takeaway:** "Save" on your laptop replaces the previous version. A git commit *adds* to a permanent record without replacing anything. This distinction is the root of everything else in this module.

### Repository, Commit, Branch — The Three Mental Models

A **repository** (or "repo") is the project's container: all files, all history, all branches, everything. The retire-time project lives at `github.com/sdono043/cyber-stock-monitor` — that URL is the repository. When you work on it locally, you have a copy ("clone") of that container on your machine that stays in sync with the remote.

A **commit** is a labeled snapshot. Every commit has a unique ID (a 40-character hash like `b5d8e5a...`), a human-readable message, an author, a timestamp, and a pointer to its parent commit. The commit message is not a formality — it's the documentation that future readers (including yourself in six months) use to understand *why* a change was made, not just what changed.

A **branch** is a named pointer to a commit, plus the ability to make new commits without affecting other branches. The default branch is usually called `main`. When you create a new branch, you're saying: "I want to work on something without touching what's currently live." The branch name in the retire-time project — `claude/investing-projection-page-t2dri3` — encodes the tool that created it (`claude`), the feature being built (`investing-projection-page`), and a task ID (`t2dri3`). That naming convention communicates context without anyone having to ask.

### The GitHub Workflow — Branch → Commit → PR → Merge

Every feature or fix in a real project follows the same cycle:

1. **Create a branch** from the current `main` — this is your isolated workspace
2. **Make changes and commit** them to that branch with descriptive messages
3. **Open a Pull Request (PR)** on GitHub — this is a formal proposal to merge your branch into `main`
4. **Review** — a human (or automated check) looks at exactly what changed and approves or requests changes
5. **Merge** — the branch's commits are incorporated into `main`, and the branch is usually deleted

The retire-time project ran this cycle 85+ times. Each PR was a discrete unit of work: adding a feature, fixing a bug, updating a configuration. The PR history is a complete, searchable record of every decision made on the project — with the reasoning in each PR description and commit message.

**Why this matters for non-developers:** A PR is not just a technical operation. It's a communication artifact. The PR description answers "what does this change do and why?" for anyone who needs to understand it later — including auditors, new team members, or yourself coming back after six months away.

### Merging — What Actually Happens

When you merge a branch into `main`, git does something specific: it finds the most recent commit that both branches share (the "merge base"), then combines the changes made on each branch since that point.

If the two branches changed *different* files, or *different parts* of the same file, the merge succeeds automatically. If they both changed the *same lines* of the same file, git can't decide which version to keep — that's a **merge conflict**, and it requires a human to resolve by editing the file to include the right content.

A conflict is not an error or a failure. It's git accurately reporting that it found two incompatible decisions and needs a human judgment call. The resolution is: open the conflicted file, find the `<<<<<<< HEAD` / `=======` / `>>>>>>> branch-name` markers, decide what the file should contain, remove the markers, and commit. The retire-time project resolved several of these across its history, most commonly when a hotfix to `main` overlapped with an in-progress feature branch.

### GitHub Pages — Commits That Ship to Production

GitHub Pages is a feature that serves a repository's files as a live website. When configured to deploy from the `main` branch, every commit merged into `main` automatically triggers a new deployment — the live site at `retire-time.com` or `sdono043.github.io/cyber-stock-monitor` updates within about 60 seconds of a merge, with no manual deployment step.

This is a significant concept for new developers: **pushing code to a branch on GitHub can immediately affect a live site real people are using.** This is why teams don't work directly on `main` — a half-finished feature or a debugging statement accidentally committed to `main` ships to production. Working on a branch means the live site is unaffected until a deliberate, reviewed merge happens.

### Reading Commit History — The Archaeology of a Project

Every decision in a codebase left a trace. The `git log` command (or GitHub's "Commits" view) shows the full history — who changed what, when, and why. For the retire-time project, this history shows the progression from a static prototype to a full app with authentication, push notifications, a tax-loss harvesting analyzer, an admin console, and Progressive Web App support.

Reading commit history is a core skill: understanding why a piece of code exists often requires knowing what it replaced. The commit message "fix: auth screen invisible after CSS rule addition" tells a future reader exactly what broke and why the fix was needed — without them having to read the diff and figure it out from scratch.

## Lab 1: Contribute to a Real Repository

**Goal:** Complete the full branch → commit → PR → merge cycle on a real project.

**Prerequisites:** A GitHub account and a repository you have write access to (or a fork of one you don't).

### Steps

1. **Read the commit history first.** On GitHub, navigate to the repository → click "Commits" (above the file list). Read the last 10 commit messages. For each one, ask: does this message tell you *why* the change was made, or only *what* changed? Note the difference.
2. **Create a branch.** On GitHub: click the branch dropdown (usually shows "main") → type a new branch name → click "Create branch." Name it descriptively: `fix/broken-link` or `feat/add-contact-page`, not `mybranch` or `test`.
3. **Make a change.** Edit a file on your branch (GitHub lets you edit directly in the browser). Make a small but real change — fix a typo, update a date, improve a label.
4. **Commit with a message.** When GitHub asks for a commit message, write one that answers "why" not just "what." "Fix typo in hero headline" is fine. "Update file" is not.
5. **Open a Pull Request.** GitHub will prompt you after the commit. Write a PR description: what did you change and why? Who should review it?
6. **Merge.** Merge the PR (or have someone else review and merge it, if the repo has that requirement). Watch the branch disappear and the commit appear in `main`'s history.
7. **If the repo uses GitHub Pages:** wait 60 seconds and visit the live site. Confirm your change is live.

### Discussion Prompts

- What would have gone wrong if you had edited `main` directly instead of creating a branch?
- What information does a good commit message contain that the diff itself doesn't?
- If two people both opened a branch from the same `main` commit and both edited the same file, what happens when the second one tries to merge?
- Why might a team require a PR review before merging, even if they trust each other?

## Lab 2: Read History Like a Practitioner

**Goal:** Use commit history and PR descriptions to reconstruct the story of a feature — without reading the code itself.

### Steps

1. Open the retire-time repository (`github.com/sdono043/cyber-stock-monitor`) or any repository with a rich history.
2. Navigate to **Pull requests → Closed**. Find a PR that added a significant feature (look for titles starting with `feat:`).
3. Read the PR title and description. Answer: what problem was this solving? What was the state before this change?
4. Click into the PR's **Commits** tab. Read each commit message in order. Do they tell a coherent story of how the work progressed?
5. Click the **Files changed** tab. Without reading the code in detail, identify: how many files changed? Were there only additions, or also deletions?
6. Find the merge commit in `main`'s history. Confirm it shows up there.

### Discussion Prompts

- If the PR description was empty and the commit messages said "update" and "fix stuff," could you reconstruct what the feature does? What's the cost of poor documentation at this level?
- How is a PR's "Files changed" view similar to a document's "Track Changes" view in Word — and how is it different?

## Assessment / Checklist (Learner Self-Check)

- I can explain what problem git solves without using the word "version control"
- I can explain the difference between a repository, a commit, and a branch
- I can describe the branch → commit → PR → merge workflow from memory
- I can explain what a merge conflict is and how it gets resolved
- I can explain why teams work on branches rather than directly on `main`
- I can explain how GitHub Pages auto-deploys from commits to `main`
- I can read a commit history and assess whether its messages are useful documentation

## Notes for Curriculum Build-Out (Next Steps)

- Consider adding a command-line lab variant (using `git` in a terminal) for learners who want the full CLI experience — this module deliberately avoids commands to build the mental model first
- Consider adding a module on git rebase vs. merge — the distinction matters in teams with strict history requirements, but it's premature for first-time learners
- The retire-time branch naming convention (`tool/feature-name-taskid`) is worth a short callout box comparing common conventions (feature/, fix/, hotfix/, release/)
- Source sessions: 85+ PRs on sdono043/cyber-stock-monitor, merge conflict resolution sessions, GitHub Pages auto-deploy behavior observed across multiple feature deployments

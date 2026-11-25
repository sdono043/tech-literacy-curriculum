# Technology Literacy Curriculum (TLC)

## Module 3: Static Hosting & the Git/GitHub/PR Workflow — How a Site Exists and How Changes Ship

**Status:** Draft v1 — built from a live hands-on session, November 2026
**Domain:** C — Web & Cloud Application Architecture
**Format:** Guided lab against a real repository and a real deployed site
**Prerequisite:** Module 1 (DNS & Domains)
**Leads into:** Module 4 (Serverless Backends), Module 9 (PWAs & Caching)

**Sequencing note:** Module 1 pointed a domain at "a site." This module explains what that site
*is* — files in a version-controlled repository, published by a host — and how a change to it
travels from an edit to the live internet. Every later module ships its changes through the
workflow taught here, so it comes before any backend or data work.

## Why This Module Exists

A beginner's mental model of a website is often "a thing on a computer somewhere that I edit
directly." That model breaks the first time two changes collide, or a change goes live that
shouldn't have, or you need to undo something from last week. The professional model is
different and, once seen, obvious: the website is a **repository** of files whose entire history
is tracked, changes are proposed in **branches**, reviewed as **pull requests**, and only
**merged** copies get **published** by a host.

This module is built from the real rhythm of the `windsor-swan` project, which is a **static
site on GitHub Pages**: every change was made on a branch, opened as a pull request, and merged
to the `main` branch — at which point GitHub Pages redeployed the live site in about a minute.
It also teaches a real mistake from that project: a fix was pushed to a branch *after* its pull
request had already been merged, so the fix silently never reached the live site. Understanding
*why* that happened is the real lesson — it's the single most common confusion for people new
to version control.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain what a **Git repository** is and what it means that it tracks full history
2. Distinguish a **commit**, a **branch**, and the **`main`** (default) branch
3. Explain the difference between **local** (your machine), **remote** (GitHub), and **published** (the live host) copies of a project
4. Explain what a **pull request (PR)** is and why teams change `main` through PRs instead of editing it directly
5. Describe what **"merge"** does and why **merge order** matters — including why a commit pushed to an already-merged branch doesn't reach production
6. Explain what a **static site host** (e.g., GitHub Pages) does, and how a push to `main` triggers a deploy
7. Read a repository's commit history and a PR's "Files changed" to understand what a change actually did
8. Recognize a **merge conflict** and explain, in plain terms, what causes one

## Core Concepts

### A repository is the project plus its entire history

A Git **repository** ("repo") is a folder whose every saved change is recorded forever. Each
save is a **commit** — a snapshot with a message ("Add leaf-collection page"), an author, and a
timestamp. Because every state is kept, you can see exactly what changed, when, and by whom, and
you can return to any past state. This is why "I edited the file directly on the server" is a
fragile way to run a real site: there's no history, no review, and no undo.

### Branch, `main`, and the three copies

- A **branch** is an independent line of work. You make your changes on a branch so the live
  project is undisturbed while you experiment.
- **`main`** is the default branch — the "official" version. For `windsor-swan`, *whatever is on
  `main` is what the public sees*, because the host publishes `main`.
- Three copies of the project exist at once, and confusing them is the root of most beginner
  trouble:
  - **Local** — the copy on your computer (or in this project's case, the agent's workspace).
  - **Remote** — the copy on GitHub (`origin`). You `push` local commits here.
  - **Published** — the copy the host actually serves to visitors.

**Key insight for learners:** a change isn't "live" when you *save* it, or even when you *push*
it to a branch on GitHub. It's live only when it reaches the branch the host publishes (`main`)
and the host redeploys. Three gates, not one.

### Pull requests: proposing a change to `main`

Rather than editing `main` directly, you open a **pull request**: "here are the commits on my
branch; please review and merge them into `main`." A PR shows a title, a description, and a
**"Files changed"** diff (green additions, red deletions). It's where review, discussion, and
automated checks happen. On `windsor-swan` the rule was explicit and typical of real teams:
**never push directly to `main`; work on a branch and merge via PR.** The payoff is that `main`
stays deployable and every change to the live site has a reviewable record.

### Merge, and why order matters (the real bug)

**Merging** a PR copies its branch's commits onto `main`. Here's the trap that actually
happened on `windsor-swan`:

1. A PR (call it #159) was opened from a branch to fix a display issue.
2. It was **merged** — its commits were now on `main`, and the site deployed.
3. *Afterward*, a follow-up fix was committed and pushed **to that same branch**.
4. But the PR was already merged and closed. New commits on a merged branch **do not
   retroactively go to `main`** — they just sit on a branch nobody is merging. The live site
   never got the follow-up fix.

The resolution was to put the follow-up commit on a **new branch** and open a **new PR** (#160)
to `main`. **Lesson:** a branch and its PR are a one-time delivery. Once merged, that delivery
is done; more work means a new branch and a new PR. "I pushed it" is not the same as "it's on
`main`."

### Static hosting and the one-minute deploy

A **static site** is plain files (HTML, CSS, JavaScript, images) served as-is — no server-side
code generating pages per request. **GitHub Pages** publishes such a site straight from a
branch: on `windsor-swan`, every push to `main` redeployed the public site at
`sdono043.github.io/windsor-swan/` in roughly a minute. This is cheap, fast, and simple — and
it's exactly why the gate in a later module is only a "deterrent" (static files can't make
server-side access decisions). Dynamic behavior (databases, auth, email) therefore lives
elsewhere — which is Module 4.

## Lab 1: Read a real project's history

**Goal:** See a repo, its branches, its commits, and a merged PR — without writing any code.

**Prerequisites:** A web browser and any public GitHub repository (use `github.com/sdono043/windsor-swan`).

**Steps:**

1. Open the repository on GitHub. Note the **file list** and the **green "… commits"** counter — click it to see the history. Read a few commit messages; notice each has an author and time.
2. Open the **branch dropdown** (says `main`). See how many branches exist. `main` is the published one.
3. Open the **Pull requests** tab → **Closed**. Open a merged PR. Read its description, then click **"Files changed"** and read the diff — green is added, red is removed.
4. On a merged PR, find the **"merged … into main"** event in its timeline. That event is the moment the change became eligible to go live.

**Discussion prompts:**

- Where does the "history" of a directly-edited server file live? What do you lose without it?
- A PR has 3 commits. How many "snapshots" of the project does that represent, and why might an author use several small commits instead of one big one?

## Lab 2: Make a change the professional way (your own repo)

**Goal:** Experience the branch → commit → PR → merge → deploy loop end to end.

**Prerequisites:** A free GitHub account. (No local tools needed — do it all in the browser.)

**Steps:**

1. Create a new repository with a `README.md`. In **Settings → Pages**, enable GitHub Pages from the `main` branch. Note the published URL.
2. Add a tiny `index.html` (a heading and a paragraph) **on a new branch** — GitHub's web editor offers "Create a new branch for this commit and start a pull request." Use it.
3. Open the **pull request**. Read your own diff. Merge it.
4. Watch the **Pages deploy** (Actions tab, or just reload the published URL after ~1 minute). Confirm your change is live.
5. **Reproduce the merge-order lesson on purpose:** after merging, edit `index.html` again *on the same (now-merged) branch* and commit. Reload the live site. Observe that **nothing changes**. Then open a *new* branch + PR with that edit, merge it, and watch it finally go live.

**Discussion prompts:**

- At which exact step did your change become visible to the public — the commit, the push, or the merge+deploy?
- In step 5, where did your "lost" commit actually go, and how would you recover it?

## Lab 3: Cause and read a merge conflict (concept lab)

**Goal:** Understand what a conflict is without fear of it.

**Steps:**

1. On your repo, create **branch A** and change the first line of `README.md` to "Hello from A". Open a PR but **don't merge yet**.
2. Create **branch B** from `main` and change that *same first line* to "Hello from B". Open a PR.
3. Merge A. Then try to merge B — GitHub will report a **conflict** on that line.
4. Read the conflict markers GitHub shows (`<<<<<<<`, `=======`, `>>>>>>>`). Resolve by choosing the final text, and complete the merge.

**Discussion prompts:**

- Why can Git merge two changes to *different* lines automatically, but not two changes to the *same* line?
- How does working on small, short-lived branches reduce how often conflicts happen?

## Assessment / Checklist (Learner Self-Check)

- I can explain what a Git repository tracks and why history matters
- I can distinguish a commit, a branch, and the `main` branch
- I can explain the difference between my local copy, the GitHub remote, and the published site
- I can explain what a pull request is and why teams don't edit `main` directly
- I can explain why a commit pushed to an already-merged branch never reaches production, and what to do instead
- I can explain how a push to `main` makes a static site redeploy
- I can read a commit history and a PR's "Files changed"
- I can explain, in plain terms, what causes a merge conflict

## Notes for Curriculum Build-Out (Next Steps)

- Consider an optional command-line track (clone/branch/commit/push/PR via `git` and `gh`) for learners heading toward developer roles, kept separate so the browser-only path stays beginner-friendly.
- Consider a short section on **CI checks** (the green/red checkmarks on a PR) as a bridge to automated testing, flagged but not built out.
- Consider pairing with a "reading a real diff" exercise using one of windsor-swan's actual PRs once the repo is public-stable.
- Source session used for this draft: the windsor-swan branch/PR/merge workflow throughout, and specifically the PR #159 → #160 merge-order mistake ("PR 160 was already merged, you haven't fixed the hanging numbers!") that this module's central lesson is built from.

# Technology Literacy Curriculum (TLC)

## Module 0 (Start Here): Before You Start — Set Up GitHub and Ship Your First Change

**Status:** Draft v1 — built from the real workflow used to build this site, November 2026
**Track:** Before You Start — Set up your tools
**Format:** Step-by-step guided lab, entirely in your web browser
**Prerequisite:** None. You need a computer with a modern web browser, an email address, and a phone for sign-in codes. Everything is free. Plan on about 90 minutes.
**Leads into:** Module 1 — DNS & Domain Configuration (you'll use the website you publish here), and Module 3 — Git & GitHub (which explains the *why* behind everything you do here)

**Sequencing note:** Almost every lab in this curriculum happens on GitHub, and Module 1 needs a live website to point a domain at. This module gets you both — a working GitHub account and a real published site — before any theory. Module 3 then explains in depth what you did here and why it works.

## Why This Module Exists

The website you're reading was built and changed the same way you'll learn here: someone proposed a change, it showed up as a **pull request**, a person read it and clicked **Merge**, and about a minute later the live site updated. No servers were touched. No special software was installed. It all happened in a web browser.

That loop — *propose, review, merge, see it live* — is how nearly every software team in the world works, and it's the single most useful habit in this curriculum. People often skip it because "setting up GitHub" sounds technical. It isn't. If you can fill out a web form and follow a checklist, you can do everything in this module.

By the end, you'll have:

- A GitHub account, secured properly
- Your own practice project (a **repository**)
- A real website on the internet that you published
- At least three changes you proposed, reviewed, and merged yourself — including one where two changes collided and you fixed it

## Learning Objectives

By the end of this module, you should be able to:

1. Create a GitHub account with a professional username and turn on two-factor authentication
2. Create a repository and explain what it holds
3. Make a **commit** in the browser and write a commit message that says *why*, not just *what*
4. Publish a website from a repository using **GitHub Pages**
5. Make a change on a **branch**, open a **pull request**, review the changes, and **merge** it
6. Create a **merge conflict** on purpose and resolve it in the browser
7. Explain why changes go through a pull request instead of straight onto the live site

## Core Concepts

You only need six words to get started. Module 3 goes much deeper on each.

| Word | Plain-English meaning |
|---|---|
| **Repository** ("repo") | A project folder that remembers every change ever made to it. |
| **Commit** | Saving a change — with a short note explaining why. Commits are never overwritten; they stack up into a history. |
| **`main`** | The official version of the project. On a website, `main` is what the public sees. |
| **Branch** | A safe copy of `main` where you can make changes without affecting the live version. |
| **Pull request** ("PR") | A request to bring a branch's changes into `main`. It shows exactly what changed so someone can review it first. |
| **Merge** | Accepting a pull request. The changes become part of `main`. |

**The one rule to remember:** don't change `main` directly. Make a branch, open a pull request, review it, then merge. It feels like extra steps until the first time it saves you from publishing a mistake.

### A word on safety

Practice repositories in this module are **public** — anyone on the internet can see them. That's normal and fine for practice, but never put passwords, account numbers, your home address, your Social Security number, or anything else private in a repository. Module 12 (Data Privacy) explains why this matters even more once you're building real apps.

## Lab 1: Create and Secure Your GitHub Account

**Goal:** A GitHub account you'll be glad to have on a résumé.

1. Go to **github.com** and click **Sign up**.
2. **Use a personal email address you'll keep long-term** — not a work, school, or military (`.mil`) address. If you lose access to that inbox later, you can lose access to your account.
3. **Choose your username carefully.** It appears in all your project addresses (for example `github.com/yourname` and `yourname.github.io`), and employers may see it. A version of your real name (`jsmith-dev`, `janesmith`) ages far better than a joke handle.
4. Finish the sign-up steps and verify your email.
5. **Turn on two-factor authentication (2FA).** GitHub will prompt you to do this; if it doesn't, go to your profile picture (top right) → **Settings** → **Password and authentication**. Use an authenticator app on your phone if you can.
6. **Save your recovery codes** somewhere safe and offline (printed, or in a password manager). They're the only way back in if you lose your phone.
7. Optional but worth it: add a profile photo and a one-line bio ("Transitioning to tech — learning web fundamentals").

**Check:** You can sign out, sign back in, and get asked for a code from your phone.

## Lab 2: Create Your First Repository

**Goal:** A practice project you own.

1. Click the **+** button in the top-right corner → **New repository**.
2. **Repository name:** `my-first-site`
3. **Description:** "Practice site for the vet-tech curriculum"
4. Choose **Public**.
5. Tick **Add a README file**. (A README is the front page of a repository — a short note about what the project is.)
6. Click **Create repository**.

Take a short tour of what you see:

- **Code** tab — the files in the project. Right now, just `README.md`.
- The **"1 Commit"** link near the top right of the file list — the project's history. Click it. Your first commit ("Initial commit") is already there; GitHub made it for you when it created the README.
- The **branch** dropdown that says `main` — that's the official version.

**Check:** You can explain in one sentence what's in your repository and how many commits it has.

## Lab 3: Make Your First Commit — Create a Web Page

**Goal:** Add a real web page to your project.

This one time, you'll commit straight to `main`, because there's nothing live yet to protect. After this lab, every change goes through a branch.

1. On the **Code** tab, click **Add file** → **Create new file**.
2. Name the file exactly `index.html` (all lowercase). Web servers look for this name as a site's home page.
3. Paste this into the editor, and replace the parts in brackets:

   ```html
   <!doctype html>
   <html lang="en">
   <head>
     <meta charset="utf-8">
     <meta name="viewport" content="width=device-width, initial-scale=1">
     <title>My First Site</title>
   </head>
   <body style="font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px;">
     <h1>Hello — I'm [your first name]</h1>
     <p>I'm learning how the web works, one real project at a time.</p>
   </body>
   </html>
   ```

4. Click **Commit changes…**.
5. In the **Commit message** box, write something that explains the change, like `Add a home page for my practice site`. (Not "update" or "stuff" — future you will want to know what this was.)
6. Leave **Commit directly to the main branch** selected, then click **Commit changes**.

**Check:** Click the commit history link again. You now have two commits, each with a message that tells the story.

## Lab 4: Publish It — Turn On GitHub Pages

**Goal:** Your page, live on the internet.

1. In your repository, click the **Settings** tab (top of the page, far right).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **`main`** and **`/ (root)`**, then click **Save**.
5. Wait one to two minutes, then refresh the Pages settings screen. You'll see **"Your site is live at…"** with an address like `https://yourname.github.io/my-first-site/`.
6. Open that address. That's your page — on the real internet, viewable from any phone or computer in the world.

**Check:** Send the link to your own phone and open it there.

> **Not working yet?** A 404 page usually means "wait a bit longer" — the first publish can take a few minutes. Also check that the file is named exactly `index.html` and sits at the top level of the repository, not inside a folder.

You'll come back to this site in Module 1, when you point a real domain name at it.

## Lab 5: The Real Workflow — Branch, Pull Request, Merge

**Goal:** Change the live site the way professional teams do.

**Make the change on a branch**

1. On the **Code** tab, click `index.html`, then click the **pencil icon** (Edit this file).
2. Change the paragraph to say something new — for example, what kind of role you're working toward.
3. Click **Commit changes…**.
4. Write a commit message: `Say what role I'm working toward on my home page`.
5. This time, choose **Create a new branch for this commit and start a pull request**. Name the branch `update-intro`. (Good branch names say what the work is; `test` and `mybranch` don't.)
6. Click **Propose changes**.

**Open the pull request**

7. GitHub shows an **Open a pull request** page. The title is filled in from your commit message.
8. In the description, write two or three sentences: *what* you changed and *why*. Pretend a teammate who wasn't there is going to read it.
9. Click **Create pull request**.

**Review it, then merge**

10. Click the **Files changed** tab. Red lines were removed; green lines were added. This is the review step: read it exactly as a reviewer would. Is it what you meant? Any typos?
11. Notice your live site hasn't changed yet. Open it and check — the old text is still there. That's the whole point of a branch.
12. Go back to the **Conversation** tab and click **Merge pull request** → **Confirm merge**.
13. Click **Delete branch**. The work is in `main` now, so the branch has done its job.
14. Wait about a minute, then refresh your live site. Your change is published.

**Check:** On the **Pull requests** tab → **Closed**, you can see your merged PR with its description — a permanent record of what changed and why.

## Lab 6: Cause and Fix a Merge Conflict — On Purpose

**Goal:** See the most feared thing in Git and discover it's a normal, five-minute fix.

A **merge conflict** happens when two branches change the *same line* in different ways. Git can't guess which version you want, so it asks you. It's not an error — it's Git refusing to throw away anyone's work without asking.

**Set it up**

1. Edit `index.html` and change the headline (the `<h1>` line) to `Hello — I'm [name], future network engineer`. Commit to a **new branch** named `headline-a` and click **Propose changes**, then **Create pull request**. **Don't merge yet.**
2. Go back to the **Code** tab (make sure the branch dropdown says `main`). Edit `index.html` again and change the *same* headline to `Hello — I'm [name], future security analyst`. Commit to a new branch named `headline-b`, propose the changes, and create a second pull request.
3. Open the `headline-a` pull request and **merge** it.

**See the conflict**

4. Open the `headline-b` pull request. GitHub now says **"This branch has conflicts that must be resolved."** Both pull requests changed the same line, and `main` already has one of them.

**Resolve it**

5. Click **Resolve conflicts**. You'll see something like:

   ```
   <<<<<<< headline-b
     <h1>Hello — I'm Jane, future security analyst</h1>
   =======
     <h1>Hello — I'm Jane, future network engineer</h1>
   >>>>>>> main
   ```

   The top part is this branch's version; the bottom part is what's in `main` now.
6. Edit it so only the line you want remains — or combine them, like `future network or security engineer`. **Delete all three marker lines** (`<<<<<<<`, `=======`, `>>>>>>>`).
7. Click **Mark as resolved**, then **Commit merge**.
8. Back on the pull request, click **Merge pull request** → **Confirm merge**, then **Delete branch**.
9. Refresh your live site after a minute.

**Check:** You can explain in your own words why the conflict happened, and why Git asked you instead of choosing on its own.

## Lab 7 (Optional): Practice Reviewing

**Goal:** Build the habit that matters most once you work with a team — or with an AI coding assistant.

1. Open a new pull request that changes something small, but put a deliberate mistake in it (a misspelled word, or a broken closing tag like `</p` without the `>`).
2. Wait an hour, then review it on the **Files changed** tab as if someone else wrote it. Did you catch it?
3. Instead of merging, click the **+** next to the line with the mistake and leave a review comment describing the fix. Then fix it by editing the file on the same branch — the pull request updates automatically.
4. Merge once it's right.

Module 20 (the capstone) is about shipping real software with an AI agent. The skill that makes that work is exactly this one: reading a proposed change carefully before you accept it.

## Assessment / Checklist (Learner Self-Check)

- I have a GitHub account with two-factor authentication on, and my recovery codes are saved somewhere safe
- I can create a repository and explain what a README is
- I can make a commit and write a message that explains why the change was made
- I have a live website published with GitHub Pages, and I know its address
- I can make a change on a branch, open a pull request, review the files changed, and merge it
- I can explain why my live site didn't change until I merged
- I have created and resolved a merge conflict, and I can explain what the conflict markers mean
- I know not to put private information in a public repository

## Notes for Curriculum Build-Out (Next Steps)

- Consider a short screen recording or annotated screenshots for Labs 4–6; GitHub's buttons move occasionally, and a picture removes guesswork for first-time users
- Consider a "GitHub Desktop" variant for learners who'd rather work with files on their own computer than in the browser
- Consider a companion page on writing a profile README (`github.com/yourname`) as a lightweight portfolio, connecting to career-transition material
- Revisit the button names in this module whenever GitHub's interface changes — they're the most likely thing to go stale
- Source: the branch → pull request → merge → GitHub Pages loop used to redesign this very site (vet-tech.org, pull requests #11–#13 on `sdono043/tech-literacy-curriculum`), where each merge went live about a minute later

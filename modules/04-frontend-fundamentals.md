# Technology Literacy Curriculum (TLC)

## Module 4: Frontend Fundamentals — HTML, CSS, and JavaScript

**Status:** Draft v1 — built from live hands-on sessions, 2025–2026
**Domain:** Foundations — How the Web Works
**Format:** Guided lab using a real production codebase (retire-time.com)
**Prerequisite:** Module 3 (Git & GitHub) recommended — labs involve pushing changes to a repository
**Leads into:** Module 5 — Databases 101 (backend); Module 8 — Serverless Functions

**Sequencing note:** This module is about how browsers turn files into visible, interactive pages. It deliberately uses a real production app — retire-time.com — as its teaching artifact, which means every concept is grounded in code that is actually running and visible to real users. The specificity is intentional.

## Why This Module Exists

Frontend development is often taught through isolated toy examples: "here is a red box, make it blue with CSS." That approach produces people who can apply techniques they've seen before but can't diagnose problems they haven't. The real skill isn't syntax — it's understanding the system: how the browser processes files, why the order of operations matters, and how to reason about what's happening when the page doesn't look like you expected.

This module uses a real incident as its capstone teaching moment: the retire-time admin page went completely blank after a bug fix. The page loaded. The header rendered. But the sign-in form was invisible. The root cause was a collision between a CSS stylesheet rule and a JavaScript statement — two correct-looking pieces of code that produced an unexpected result when combined. Understanding why that happened requires understanding how the browser's CSS cascade works. After this module, it's not a mystery.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Describe the browser's rendering pipeline: HTML is parsed into a DOM, CSS is applied to it, JavaScript can modify both
2. Explain what HTML is responsible for (structure), CSS (appearance), and JavaScript (behavior) — and why that separation matters
3. Explain CSS **custom properties** (also called CSS variables or tokens) and why a design system defines colors once and uses them everywhere
4. Explain how `prefers-color-scheme` and `data-theme` enable dark mode — and how the cascade determines which rule wins
5. Explain **CSS specificity** and the cascade — why a stylesheet rule can override an inline style in one context but not another, and vice versa
6. Explain **responsive layout** using flexbox and CSS grid — how a layout can reflow for different screen widths without JavaScript
7. Read a CSS file structured around custom properties and explain what a change to one token affects across the whole page
8. Identify, in a real example, why setting `element.style.display = ''` does *not* always show the element

## Core Concepts

### How the Browser Turns Files Into a Page

When you navigate to a URL, the browser does several things in a fixed order:

1. **Fetches the HTML file.** This is a text document full of tags like `<div>`, `<p>`, `<button>`.
2. **Parses HTML into the DOM.** The browser builds an internal tree structure (the Document Object Model) representing every element and its nesting.
3. **Fetches and applies CSS.** Stylesheets (from `<link>` tags or `<style>` blocks) are parsed and their rules applied to DOM elements. The result is each element knowing its color, size, position, and visibility.
4. **Runs JavaScript.** `<script>` tags execute code that can read and modify the DOM and CSS in real time — adding elements, changing styles, responding to clicks.

This order matters. JavaScript that runs before an element exists in the DOM will fail to find it. CSS that is defined after an inline style in a stylesheet may or may not override it, depending on specificity. The page you see is the result of all three layers interacting, not just one.

### HTML as Structure, CSS as Appearance, JavaScript as Behavior

This separation is called "separation of concerns," and while real code blurs these lines, the mental model is useful:

- **HTML** says what things *are*: "this is a heading," "this is a button," "this is a list of items." It carries meaning and hierarchy. `<h1>` is a top-level heading. `<button>` is interactive. `<nav>` is navigation. These aren't just stylistic labels — screen readers and search engines use them too.
- **CSS** says how things *look*: color, size, font, spacing, layout, visibility. The same HTML can look completely different with different CSS — this is the basis of CSS themes.
- **JavaScript** says what things *do*: respond to a click, fetch data, show or hide an element, validate a form input. It runs after the page loads and can change both HTML structure and CSS styles at any point.

In the retire-time project, `shared.css` defines the visual language — colors, fonts, spacing — that all pages use. `portfolio-tracker.html`, `planning.html`, `admin.html` each import that shared stylesheet rather than re-defining colors themselves. When a color needs to change site-wide, it changes in one place.

### CSS Custom Properties — One Source of Truth for Colors

A **CSS custom property** (also called a CSS variable) is a named value defined once and used everywhere:

```css
:root {
  --green: #10b981;
  --bg: #0f1117;
  --text1: #f1f5f9;
}
```

Every element on the page can then use `color: var(--green)` instead of `color: #10b981`. This matters for three reasons:

1. **Consistency.** If 40 elements use `var(--green)`, changing the green value in one place updates all 40.
2. **Theming.** Dark mode is implemented by redefining the same variable names with different values when the user's OS is in dark mode — the components themselves don't change.
3. **Readability.** `var(--text3)` communicates intent (a tertiary text color) in a way that `#8a8582` does not.

The retire-time `shared.css` defines a full token system: colors for text at three levels of emphasis (`--text1`, `--text2`, `--text3`), background layers (`--bg`, `--bg2`, `--bg3`), semantic colors (`--green`, `--red`, `--amber`, `--blue`), and border colors. Every visual element is built from these tokens, not from raw hex values.

### Dark Mode — The Cascade in Practice

Dark mode works by overriding CSS custom property values based on the user's system preference:

```css
:root { --bg: #f7f6f3; --text1: #1a1816; }  /* light values */

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f1117; --text1: #f1f5f9;
  }
}

:root[data-theme="dark"] {
  --bg: #0f1117; --text1: #f1f5f9;
}
```

Three things are defined: the default (light) values, an override when the OS reports dark preference, and an override when a `data-theme="dark"` attribute is explicitly set on the page (allowing a manual toggle to override the system preference). The page's components see only `var(--bg)` — they're unaware of the theme; the cascade handles it.

This is a powerful pattern: the visual logic is centralized, and adding a new component doesn't require thinking about dark mode at all. If it uses the tokens, dark mode works automatically.

### CSS Specificity and the Cascade — Why Rules Override Each Other

The CSS cascade is the browser's algorithm for deciding which rule wins when multiple rules apply to the same element. The core principle is **specificity**: a more-specific selector beats a less-specific one, regardless of order. When specificity is equal, the rule that appears last in the stylesheet wins.

Specificity is calculated roughly as:
- Inline styles (via `style=""` attribute): highest specificity
- ID selectors (`#auth-screen`): very high
- Class selectors (`.auth-card`), attribute selectors, pseudo-classes: medium
- Element selectors (`div`, `p`): lowest

**The admin page incident** illustrates this precisely. The sign-in form used `#auth-screen` with `display: none` as the initial hidden state. When the page found no active session, JavaScript was supposed to show it:

```javascript
document.getElementById('auth-screen').style.display = '';
```

Setting `style.display = ''` *removes* the inline style value, reverting the element to whatever its stylesheet rule says. Before the fix, that stylesheet rule was nothing — so clearing the inline style fell back to the browser's default (`display: block` for a `div`), and the element appeared.

After the auth-screen CSS was added to fix a different bug, the stylesheet now contained:
```css
#auth-screen { display: none; ... }
```

Now clearing the inline style falls back to the *stylesheet rule* — which also says `display: none`. The element stays hidden. The fix was to set `style.display = 'flex'` explicitly instead of clearing it.

**Learner takeaway:** "clear the inline style" and "show the element" are not the same thing. What the element shows after clearing depends on what the stylesheet says. This is a category of bug that only makes sense once you understand the cascade.

### Responsive Layout — Flexbox, Grid, and Media Queries

A responsive layout adapts to different screen widths without JavaScript. The two main CSS layout tools are:

**Flexbox** arranges items in a row or column, distributing space among them. It's ideal for navigation bars, button groups, and any layout where items flow in one direction.

**CSS Grid** arranges items in rows *and* columns simultaneously. It's ideal for card grids, dashboard layouts, and two-dimensional arrangements. The retire-time admin page uses:

```css
.admin-stats { grid-template-columns: repeat(2, 1fr); }
@media (min-width: 800px) { .admin-stats { grid-template-columns: repeat(6, 1fr); } }
```

On a phone, stats show as 2 columns. On a wide screen, all 6 appear in a row. The same HTML, different layout, controlled entirely by CSS.

**Media queries** apply CSS rules only when a condition is met — typically a screen width threshold. `@media (min-width: 800px)` means "these rules apply only on screens at least 800px wide." Mobile-first design writes the base rules for small screens and adds media queries to enhance for larger ones.

## Lab 1: Read a Real Dark-Mode Design System

**Goal:** Understand how the retire-time design token system works before writing any code.

### Steps

1. Open `shared.css` in the retire-time repository (github.com/sdono043/cyber-stock-monitor).
2. Find the `:root { }` block at the top. List every custom property (they all start with `--`). Group them by type: colors, fonts, borders.
3. Find the `@media (prefers-color-scheme: dark)` block. For each token redefined there, compare the light and dark values. What pattern do you see?
4. Pick any CSS class in the file (e.g., `.admin-stat`). Identify every custom property it uses. Trace each one back to its definition in `:root`.
5. Answer: if you changed `--green` from `#10b981` to `#ff0000`, how many visible things on the site would turn red? Could you predict this by counting uses of `var(--green)` in the file?

### Discussion Prompts

- Why is `var(--green)` more maintainable than writing `#10b981` directly in every rule that needs green?
- What would break if a component used a literal color (`color: #0f1117`) instead of `var(--text1)` in dark mode?
- How does the `:root:not([data-theme="light"])` guard on the dark-mode media query allow a manual toggle to override the OS setting?

## Lab 2: Build a Responsive Card Grid

**Goal:** Build a card layout that shows 1 column on mobile and 3 columns on desktop, using the retire-time token system.

### Steps

1. Create a new HTML file. Link to `shared.css` (or copy its `:root` token block into a `<style>` tag at the top).
2. Write three card elements in a container div. Give each card a title, a number, and a label — like a stat tile.
3. Style the container as a CSS grid: 1 column by default, 3 columns above 600px screen width.
4. Use only custom properties for colors — no raw hex values. Use `var(--bg2)` for the card background, `var(--text1)` for the title, `var(--text3)` for the label.
5. Resize your browser window. Confirm the layout reflows at the breakpoint.
6. Switch your OS to dark mode. Without changing any CSS, confirm the colors update.

### Discussion Prompts

- What would you have to do to support dark mode if you had used raw hex values everywhere?
- What's the difference between `grid-template-columns: repeat(3, 1fr)` and `grid-template-columns: 33% 33% 33%`?

## Lab 3: Reproduce the Auth Screen Bug — and Fix It

**Goal:** Demonstrate the CSS specificity/cascade issue that caused the admin page to go blank, then apply the correct fix.

### Steps

1. Create an HTML file with a `<div id="demo-screen">` that contains the text "Sign In." Give it `style="display:none"` as an inline attribute.
2. Add a `<button onclick="show()">Show Screen</button>`.
3. In a `<script>` tag, write `function show() { document.getElementById('demo-screen').style.display = ''; }`.
4. Load the page. Click the button. The div appears — `style.display = ''` removes the inline style and the element shows (browser default for `div` is `display: block`).
5. Now add a `<style>` block to your HTML: `#demo-screen { display: none; }`.
6. Reload the page. Click the button. The div does NOT appear — clearing the inline style now falls back to the stylesheet rule, which is also `none`.
7. Fix it: change `style.display = ''` to `style.display = 'block'`. Reload and confirm it works.
8. Explain in one sentence why the fix works.

### Discussion Prompts

- What is the cascade checking when both a stylesheet rule and a potential inline style conflict?
- If you wanted the original behavior (clear the inline style and let the browser decide), when would that actually be correct behavior — and when is it dangerous?

## Assessment / Checklist (Learner Self-Check)

- I can describe the browser's HTML → DOM → CSS → JS rendering pipeline in order
- I can explain what HTML, CSS, and JavaScript each contribute to a finished page
- I can explain what a CSS custom property is and why a codebase defines colors as tokens
- I can explain how dark mode is implemented using `prefers-color-scheme` and CSS token overrides
- I can explain CSS specificity — which selector types win and in what order
- I can explain why `element.style.display = ''` does not always show an element
- I can build a responsive grid layout that reflows at a breakpoint using CSS grid and a media query

## Notes for Curriculum Build-Out (Next Steps)

- Consider a lab variant using browser DevTools to live-edit CSS — opening computed styles and disabling individual rules is a powerful debugging technique that connects this module to Module 2 (Network & App Security Literacy)
- The admin page auth bug is a perfect "what went wrong" case study — consider turning it into a full debugging walkthrough where learners reproduce the exact sequence of changes that caused it
- JavaScript interactivity (event listeners, DOM manipulation, fetch) deserves its own module or lab — this module covers JS as a concept and touches the cascade interaction, but a dedicated JS fundamentals module would go deeper
- Source: retire-time shared.css (full token system), portfolio-tracker.html, admin.html, planning.html, projections.html — all deployed to retire-time.com; auth screen bug introduced and fixed across PRs #86 and #87

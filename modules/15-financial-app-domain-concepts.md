# Technology Literacy Curriculum (TLC)

## Module 15: Financial App Domain Concepts — Domain Logic in Code

**Status:** Draft v1 — built from live hands-on sessions, 2025–2026
**Domain:** Building Real Products
**Format:** Guided lab using a real retirement and portfolio tracking app
**Prerequisite:** Module 4 (Frontend Fundamentals), Module 5 (Databases 101)
**Leads into:** No required successor — this is a domain-specific capstone

**Sequencing note:** This module assumes learners can read JavaScript and SQL from earlier modules. The goal is not to become a financial advisor or tax professional — it's to understand how financial rules translate into code, and what the gap between "correct math" and "correct financial advice" means for how you build and disclaim your software.

## Why This Module Exists

Financial apps are uniquely challenging because domain errors have real consequences. A bug in a game means a player gets the wrong score. A bug in a tax-loss harvesting calculator could lead a user to realize a loss that the IRS then disallows — costing them money on their tax return. A retirement projection that uses the wrong formula compounds quietly over decades.

This module is built from retire-time's actual financial features: a tax-loss harvesting analyzer, a price alert system, and a retirement projection calculator. Each one required translating a specific financial rule — the wash-sale rule, the capital gains holding period, compound growth — into code that works correctly and disclaims what it cannot know.

The skill here is not finance. It's learning how to research a domain rule, model it accurately in code, and design the user interface so it's useful without overreaching.

## Learning Objectives

By the end of this module, a learner should be able to:

1. Explain the difference between **short-term and long-term capital gains** and the 1-year holding period rule
2. Define **tax-loss harvesting** and explain the basic mechanism by which it reduces taxable income
3. Explain the **wash-sale rule** — what the IRS disallows, what the 30-day window means, and how the rule applies to "substantially identical" securities
4. Explain why **ETF substitutes** exist in tax-loss harvesting and give an example of a valid SPY substitute
5. Explain how **price alerts** work end to end: threshold set by user → price checked on schedule → notification delivered
6. Explain **compound growth** as used in retirement projections and identify the variables in the formula
7. Design a UI disclaimer that makes an estimate's limitations clear without making the feature useless
8. Explain why domain logic belongs in well-tested, explicitly commented code rather than treated as "just business rules"

## Core Concepts

### Short-Term vs. Long-Term Capital Gains

When you sell an investment for more than you paid for it, the profit is a **capital gain**. The IRS taxes it at different rates depending on how long you held the investment:

- **Short-term**: Held for 1 year or less. Taxed as ordinary income — the same rate as your salary, which can be as high as 37%.
- **Long-term**: Held for more than 1 year. Taxed at preferential rates: 0%, 15%, or 20% depending on income.

This distinction is binary and date-based. A stock purchased on January 1 and sold on December 31 of the same year is short-term. The same stock sold on January 2 of the following year is long-term. The difference in tax treatment can be significant.

In retire-time code, this check is:
```javascript
const holdingDays = (Date.now() - new Date(position.purchase_date)) / 86400000;
const isLongTerm = holdingDays > 365;
const taxRate = isLongTerm ? settings.ltcg_rate : settings.stcg_rate;
```

The rates are user-configurable because they vary by income. The app cannot know the user's marginal tax rate — that's one of the limits it disclaims.

### Tax-Loss Harvesting: The Basic Mechanism

**Tax-loss harvesting** (TLH) is the practice of selling an investment that has declined below your purchase price — intentionally realizing a loss — specifically to use that loss to offset capital gains elsewhere in your portfolio.

Example:
- You have $5,000 in realized gains from selling Stock A.
- You hold Stock B, which you bought for $10,000 and is now worth $7,000 (a $3,000 unrealized loss).
- By selling Stock B, you realize the $3,000 loss.
- Your net taxable gain is now $5,000 − $3,000 = $2,000.
- At a 20% long-term rate, you save $600 in taxes.

The loss isn't "free money" — you no longer hold Stock B, so you lose any future recovery. The strategy makes sense when you believe the tax savings outweigh the cost of exiting the position, and when you can maintain similar market exposure through a substitute.

In retire-time, the TLH analyzer scans all open positions, identifies those with unrealized losses, estimates the tax savings using the user's configured rates, and surfaces them with a recommendation.

### The Wash-Sale Rule: What Breaks TLH

The IRS wash-sale rule (IRC Section 1091) disallows a loss deduction if, within **30 days before or after** the sale, you buy a "substantially identical" security. The rule exists to prevent investors from claiming losses while maintaining the same economic position.

The 30-day window is strict and bidirectional:
- Sell Stock B at a loss on November 1
- If you buy Stock B again on October 25 (6 days before) OR November 15 (14 days after) → wash sale, loss disallowed
- The disallowed loss is added to the cost basis of the repurchased shares, deferring it rather than eliminating it

**What counts as "substantially identical"?** The IRS has not provided an exhaustive definition. Individual shares of the same company are definitively substantially identical. Options on the same stock, shares of the same mutual fund — also clearly substantially identical. Two different S&P 500 ETFs (like SPY and IVV) are considered *not* substantially identical, even though they track the same index, because they are shares of different legal entities with different expense ratios and legal structures.

In retire-time, the wash-sale check is:
```javascript
const recentPurchases = positions.filter(p =>
  p.ticker === sold.ticker &&
  Math.abs(new Date(p.purchase_date) - saleDate) <= 30 * 86400000
);
if (recentPurchases.length > 0) {
  // Flag as wash-sale risk
}
```

This is a heuristic, not a guarantee — the app doesn't have access to other brokerage accounts where the user might have bought the same stock.

### ETF Substitutes: Maintaining Exposure Without Triggering Wash-Sale

The standard TLH solution is to sell the declining security and immediately buy a similar-but-not-identical one — maintaining market exposure while satisfying the wash-sale rule's requirement that you not repurchase the same security.

The retire-time `TLH_SWAP_MAP` pairs each supported ticker with its wash-sale-safe substitute:

```javascript
const TLH_SWAP_MAP = {
  'SPY':  'IVV',   // Both S&P 500 ETFs, different issuers (State Street → BlackRock)
  'QQQ':  'QQQM',  // Both Nasdaq-100 ETFs, different share classes
  'VTI':  'ITOT',  // Both total US market ETFs
  'VXUS': 'IXUS',  // Both international ETFs
  'BND':  'AGG',   // Both total bond market ETFs
  'GLD':  'IAU',   // Both gold ETFs
};
```

The swap doesn't eliminate market risk — if the S&P 500 continues falling, IVV falls along with SPY. It preserves exposure while making the IRS deadline work in the investor's favor. After 31 days, the investor can swap back to their original fund if they prefer.

### Price Alerts: From Threshold to Notification

The price alert system in retire-time spans three layers:

1. **User layer**: The user sets a threshold (e.g., "alert me when AAPL goes above $200") through the alerts modal in the portfolio UI. The threshold and subscription metadata are stored in the `price_alerts` table.

2. **Scheduler layer**: A pg_cron job runs every 15 minutes during US market hours (Monday–Friday, 9:30 AM–4:00 PM ET). It calls the `price-alerts` Supabase Edge Function with a `x-cron-secret` header to authenticate the call.

3. **Delivery layer**: The Edge Function fetches current prices from Yahoo Finance's chart API, compares each price to the stored thresholds, and sends a Web Push notification for any threshold crossed. Expired subscriptions (HTTP 410 responses from the push service) are cleaned up automatically.

The market hours constraint matters: price data outside trading hours is stale (the market is closed), and push notifications at 3 AM for a price that hasn't changed are noise. The cron expression `0,15,30,45 9-15 * * 1-5` runs only during the relevant window, with an edge case handled for the 4:00 PM close.

### Compound Growth: Retirement Projections

Retirement projections are built on the compound growth formula:

**Future Value = P × (1 + r)^n + PMT × ((1 + r)^n − 1) / r**

Where:
- **P** = current portfolio value (present value)
- **r** = monthly return rate (annual rate ÷ 12)
- **n** = number of months until retirement
- **PMT** = monthly contribution

This formula assumes:
- Returns are consistent every month (they aren't — markets are volatile)
- The contribution amount is constant (it may change)
- The rate of return is correct (it's an assumption, typically 6–7% real return)

Retire-time asks the user for their assumed annual return rate and calculates month-by-month projections. The result is displayed as a projection curve — not a prediction. This distinction matters legally and ethically.

### Disclaimer Design: Useful Without Overreaching

Every financial estimate in retire-time carries a disclaimer. The design challenge is making the disclaimer informative without making the feature feel useless.

Good disclaimer design for a TLH estimate:
- States what the estimate assumes (user-provided tax rates, single account only, no professional verification)
- States what it cannot know (other brokerage accounts, state taxes, Alternative Minimum Tax, wash-sale from spouse's account)
- Does not say "consult a tax professional" in a way that implies the feature is unreliable — it is reliable for what it claims to do
- Uses specific language: "estimated tax savings" not "tax savings"; "based on the rates you entered" not "based on your actual tax rate"

The disclaimer is part of the feature design, not an afterthought bolted on by a lawyer. It shapes what data the user understands they need to provide and what output they should verify before acting.

## Lab 1: Calculate Unrealized Gains and Losses on a Portfolio

**Goal:** Given a portfolio of positions with purchase prices and current prices, compute gain/loss in dollars and percentage, and classify as short-term or long-term.

**Steps:**

1. Create a sample positions array with ticker, quantity, purchase_price, purchase_date, and current_price.
2. For each position, calculate:
   - Unrealized gain/loss in dollars: `(current_price - purchase_price) * quantity`
   - Gain/loss as percentage: `((current_price - purchase_price) / purchase_price) * 100`
   - Holding period in days: `(Date.now() - new Date(purchase_date)) / 86400000`
   - Classification: short-term (≤365 days) or long-term (>365 days)
3. Sort positions by unrealized loss (most negative first) — these are TLH candidates.
4. Display the results in a table with color coding: green for gains, red for losses.

**Discussion prompts:**
- Why does the tax classification depend on holding period rather than the size of the gain or loss?
- If a position shows a 5% loss but was purchased yesterday, should it be a TLH candidate? Why or why not?

## Lab 2: Identify TLH Candidates and Flag Wash-Sale Risk

**Goal:** From a portfolio, identify positions eligible for tax-loss harvesting and check for wash-sale risk from recent purchases.

**Steps:**

1. Filter the positions from Lab 1 to only those with an unrealized loss.
2. For each loss position, check the `TLH_SWAP_MAP` for a valid substitute ticker.
3. Estimate the tax savings at a configured short-term rate (e.g., 32%) and long-term rate (e.g., 15%):
   ```javascript
   const taxSavings = Math.abs(unrealizedLoss) * taxRate;
   ```
4. Check whether any other position in the portfolio was purchased within 30 days of today in the same ticker — flag as wash-sale risk if so.
5. For each eligible candidate, display: position, loss amount, estimated tax savings, suggested swap, and any wash-sale warning.

**Discussion prompts:**
- Why can't the app guarantee wash-sale safety even if no matching position appears in this portfolio?
- If the tax savings estimate is $47, does that mean the user will definitely save $47? What would change that number?

## Lab 3: Build a Retirement Projection Calculator

**Goal:** Implement the compound growth formula and render a projection curve.

**Steps:**

1. Collect three inputs from the user: current portfolio value, monthly contribution, assumed annual return rate, and years until retirement.
2. Convert annual rate to monthly: `r = annualRate / 12 / 100`
3. Calculate the future value month by month, accumulating into an array of `{month, value}` data points.
4. Render the projection as a simple SVG line chart or a table of key milestones (1 year, 5 years, 10 years, retirement).
5. Add a disclaimer explaining that the projection assumes constant contributions and returns, and that actual results will differ.

**Discussion prompts:**
- What happens to the projection if you change the assumed return rate from 7% to 5%? What does this tell you about the importance of the assumption?
- How would you design the disclaimer so a user understands the projection is an estimate without making them distrust it entirely?
- What financial data should this calculator never store server-side? (Think: does it need to be in a database, or can it live in the browser?)

## Assessment / Checklist (Learner Self-Check)

- I can explain the 1-year holding period rule and its effect on capital gains tax rates
- I can explain what tax-loss harvesting does and why it doesn't eliminate market risk
- I can explain the IRS wash-sale rule, its 30-day window, and what "substantially identical" means in practice
- I can explain why SPY and IVV are valid TLH swap pairs while SPY and SPY are not
- I can trace a price alert from user threshold through pg_cron scheduling to Web Push delivery
- I can implement the compound growth formula for a retirement projection
- I can design a disclaimer that accurately scopes an estimate's limitations without undermining its usefulness
- I can identify which financial data should never be stored server-side

## Notes for Curriculum Build-Out (Next Steps)

- Consider a "deliberate error" exercise: implement the TLH calculation with a common mistake (e.g., using the wrong tax rate for the holding period) and have learners find and fix the bug — financial domain errors are subtle and this trains careful reading of business logic
- Consider a module on API-sourced financial data: how Yahoo Finance's public endpoints work, what rate limits apply, what data they provide and what they don't (historical prices, real-time quotes, fundamentals) — the retire-time price-alerts Edge Function uses this directly
- Consider extending the retirement projection to include inflation adjustment and Social Security estimates — the formula changes, and modeling real purchasing power vs. nominal dollars is a meaningful domain lesson
- Consider a brief section on regulatory disclaimers for fintech products: what a registered investment advisor (RIA) is, why apps need "not financial advice" language, and how that shapes UI copy decisions
- Source sessions: retire-time TLH_SWAP_MAP and renderTlhSection() implementation; price-alerts Edge Function (pg_cron + Yahoo Finance + Web Push); projections.html compound growth calculator; real session constraint "I want to make sure there isn't sensitive data stored anywhere since those forms can have SSN and things like that"

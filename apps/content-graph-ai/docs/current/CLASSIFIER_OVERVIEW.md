# AI Taxonomy Classifier — Plain Language Overview

> Last updated: 2026-03-23
> Canonical runtime specs live in `docs/current/CLASSIFIER_LOGIC.md` and `docs/current/HOW_THE_APP_WORKS.md`.

---

## What is this tool?

It's an AI tool that reads Contentful pages and automatically fills in taxonomy fields like topic, audience, funnel stage, industry, and schema type. It can return results in the sidebar/API, write approved values back to Contentful, and batch scripts can still export CSVs for offline review.

---

## How does it work?

Think of it as a smart reader that goes through five steps before it decides how to tag a page.

---

### Step 1 — Read the page

The tool connects to Contentful and pulls the full content of the page — the title, body text, SEO description, headings, and any linked content blocks. It's smart about what it reads:

- **It reads the important parts first** — the SEO description and page title carry more weight than body paragraphs
- **It ignores the noise** — navigation menus, footers, cookie banners, and related article links are all stripped out so they don't confuse the analysis
- **It reads the Contentful tags** — if a page is already tagged with something like `productPillars`, the tool sees that as a strong hint
- **It reads the full deep-crawled page** — then compresses that into smaller, signal-dense prompt inputs so latency stays bounded without switching to a fake fast path

---

### Step 2 — Look for obvious signals

Before asking AI anything, the tool looks for facts it can determine with certainty — no guessing needed.

| What it checks | What it determines |
|---------------|-------------------|
| The URL structure | Is this a product page? A blog post? A docs page? |
| The page's Contentful content type | Is this a long-form SEO article? A case study? An event page? |
| Calls-to-action in the body | Does the page ask people to buy/demo? Or is it just educational? |
| Language patterns | Is this page written in French or German? |
| Brand logos mentioned | Which well-known companies appear on the page? |

**Example:** A page at `/products/platform` — the tool immediately knows it's a product page, sets the schema type to `SoftwareApplication`, and marks it as bottom-of-funnel (BOFU). No AI needed for those fields.

**Example:** A page with "Request a Demo" in the navigation — the tool knows this appears on *every* Contentful page in the nav, so it doesn't count it as a sign of purchase intent. Only CTAs in the main body of the page count.

---

### Step 3 — Look up the companies mentioned

If the page mentions well-known brands (like Nike, Shopify, or Salesforce), the tool looks them up to understand what kind of companies use Contentful. This helps determine the **Industry** and **Company Size** fields.

- Common brands are looked up instantly from a built-in seed list
- Unknown brands can be looked up via a Gemini-backed search path
- Results are cached for 30 days so the same lookup doesn't happen twice

**Important caveat:** For educational/guide pages (like "What is personalization?"), this company lookup is turned off. A guide that mentions Nike as an example doesn't mean the page is targeting the retail industry — it's just an example.

---

### Step 4 — Ask the AI

Now the AI (Google Gemini) gets everything that's been gathered and classifies the remaining fields. It receives:

1. **All the signals from Step 2** — what the URL says, what CTAs were found, what was already determined
2. **The company enrichment from Step 3** — what industries the mentioned brands belong to
3. **The actual page content** — title, SEO description, headings, and body text
4. **The allowed values** — the exact list of options from the Bynder taxonomy workbook, so it can only pick valid values
5. **A decision guide** — clear rules like "if this is a long-form SEO page about APIs or Next.js, use TechArticle schema; if it's about marketing strategy, use Article schema"
6. **Human-corrected examples** — semantically similar reviewed examples can be injected dynamically so the AI learns from past mistakes

The AI fills in fields like: Topic, Use Cases, Job Function, Job Level, Audience, Industry, and Company Size.

---

### Step 5 — Apply the rules

After the AI responds, a final set of rules is applied to catch any mistakes before the result is saved.

**Rule layer 1 — Content type rules (highest priority, always wins)**

Every Contentful content type has a profile that defines what certain fields *must* be, regardless of what the AI said:

| Content Type | Sub-Type | Schema | Funnel |
|-------------|----------|--------|--------|
| Long-form SEO page | Article | TechArticle or Article | TOFU by default |
| Blog post | Blog | BlogPosting | TOFU by default |
| Case study | Case Study | Article | MOFU by policy |
| Resource / ebook | Ebook or Report | DigitalDocument | MOFU or BOFU |
| Event / webinar | Event | Event | MOFU by default |
| Pricing page | Webpage | SoftwareApplication | BOFU always |
| Product page | Product | SoftwareApplication | BOFU always |

For example: if the AI somehow classifies an SEO guide as bottom-of-funnel (BOFU), this layer automatically resets it to TOFU. If the AI picks "HowTo" schema for a long-form SEO article, that's blocked — `HowTo` is on the forbidden list for that content type.

**Rule layer 2 — URL and signal rules**

Things the URL makes obvious override the AI — a `/blog/` URL always gets `BlogPosting` schema, `/docs/` always gets `TechArticle`, etc.

**Rule layer 3 — Human corrections (always wins)**

Any field that a human has previously corrected for a given entry can be applied back during post-processing. Corrections are stored in committed seed data plus an optional local runtime overlay.

---

## What gets output?

Depending on the path, the system can return JSON to the sidebar/API, write approved values back to Contentful, persist run traces, and batch scripts can still export CSV rows.

Outputs can include:

- All 16 taxonomy fields with their values
- A confidence percentage for each field
- An overall confidence score for the whole page
- A "Needs Review" flag for any page the tool isn't confident about
- The AI's reasoning in plain English
- Any recommended actions (e.g. "verify this field — the signal was ambiguous")

---

## How does it get smarter over time?

The tool has a learning loop built in:

1. **Every run is recorded** — the tool compares new results to the previous run and flags any fields that changed (called "drift")
2. **Humans can correct mistakes** — by editing a corrections file, any field can be overridden permanently
3. **Corrections teach the AI** — reviewed examples are retrieved dynamically from the correction store, not just by recency
4. **Corrections are committed to the codebase** — so new environments can inherit verified baselines immediately

---

## What does the tool know about content types?

It has built-in knowledge of 20 Contentful content types. Here's a plain-language summary of the most important ones:

| If the page is... | The tool knows... |
|-------------------|------------------|
| A long-form SEO guide | It's educational (TOFU), tagged as Article, never a product page |
| A blog post | It's editorial (TOFU), never bottom-of-funnel |
| A case study | It's proof content, policy-routed as MOFU, and tagged as Case Study |
| A downloadable resource | It's a lead-gen asset (MOFU/BOFU), tagged as Ebook or Report |
| A product page | It's conversion content (BOFU), always SoftwareApplication schema |
| A pricing page | It's decision-stage content (BOFU), always locked |
| A glossary entry | It's educational (TOFU), no product tagging |
| An event or webinar | It's awareness/consideration (MOFU), tagged as Event |

---

## Common questions

**Why does the same page sometimes get a slightly different result on different runs?**
The AI component (Gemini) is not 100% deterministic — it can vary slightly between calls. The signal rules and correction overrides are deterministic and always produce the same result. Fields with high confidence (99%) are locked and will never vary.

**What does "Needs Review" mean?**
It means the output crossed review thresholds or policy escalations. In the current runtime that is driven by overall confidence, weakest semantic confidence, and explicit review-routing logic rather than a single rough percentage.

**Can I correct a wrong result?**
Yes. Corrections can be submitted through the review/correction flow or added to the correction store files used by the runtime.

**How long does it take?**
The current live interactive path is roughly 30–40 seconds for a real deep-crawled entry in the verified setup, but that still varies with vendor latency and page complexity.

**What AI model does it use?**
A two-stage Gemini stack by default: `gemini-3.1-pro-preview` for the fact stage and `gemini-2.5-flash-lite` for the subjective stage. Company lookup uses a separate Gemini search model.

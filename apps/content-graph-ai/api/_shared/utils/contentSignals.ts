/**
 * contentSignals.ts
 *
 * Layer 1: Deterministic pre-AI signal extraction.
 * Derives ground-truth facts from URL, title, and text BEFORE calling any AI.
 * These signals are injected into the classification prompt and used for
 * post-processing overrides — fields the AI should never have to guess.
 */

// ---------------------------------------------------------------------------
// URL pattern sets
// ---------------------------------------------------------------------------
const URL_PATTERNS = {
  product: [
    "/products/",
    "/platform",
    "/studio",
    "/ai-actions",
    "/ecosystem",
    "/analytics",
    "/hosting",
    "/features/",
  ],
  blog: ["/blog/", "/articles/", "/posts/"],
  resource: ["/resources/", "/ebooks/", "/whitepapers/", "/reports/"],
  event: ["/events/", "/webinars/", "/conferences/"],
  solution: ["/solutions/"],
  caseStudy: [
    "/customers/",
    "/case-studies/",
    "/success-stories/",
    "/case-study/",
  ],
  partner: ["/partners/", "/integrations/", "/marketplace/"],
  docs: ["/docs/", "/documentation/", "/help/", "/developers/", "/api/"],
  pricing: ["/pricing/"],
  podcast: ["/podcast/"],
  glossary: ["/glossary/"],
  about: [
    "/about/",
    "/company/",
    "/team/",
    "/leadership/",
    "/press/",
    "/newsroom/",
  ],
  careers: ["/careers/", "/jobs/", "/open-roles/"],
  legal: ["/legal/", "/privacy/", "/terms/", "/security/", "/trust/"],
} as const;

type UrlPattern = keyof typeof URL_PATTERNS | "unknown";

// ---------------------------------------------------------------------------
// CTA / intent signals
// ---------------------------------------------------------------------------
const DEMO_PHRASES = [
  "request a demo",
  "request demo",
  "book a demo",
  "schedule a demo",
  "get a demo",
  "see it in action",
  "watch a demo",
  "talk to sales",
  "contact sales",
];
const PRICING_PHRASES = [
  "see pricing",
  "view pricing",
  "pricing plans",
  "per month",
  "per user",
  "enterprise plan",
  "free trial",
  "start for free",
  "try for free",
];
const FAQ_PATTERNS = [
  /frequently asked/i,
  /\bfaq\b/i,
  /\?\s*\n.{0,200}\?\s*\n/s,
];

// ---------------------------------------------------------------------------
// Known Contentful product name → taxonomy label
// ---------------------------------------------------------------------------
const CONTENTFUL_PRODUCTS: [RegExp, string][] = [
  // Studio is deprecated as a product tag — map to Platform
  [/\bcontentful\s+studio\b/i, "Platform"],
  [/\bstudio\s+(?:editor|sidebar|app|experience|component)\b/i, "Platform"],
  [/\bcontentful\s+platform\b/i, "Platform"],
  [/\bcomposable\s+content\s+platform\b/i, "Platform"],
  [/\bcontentful\s+analytics\b/i, "Analytics"],
  [/\bcontentful\s+ecosystem\b/i, "Ecosystem"],
  [/\bcontentful\s+marketplace\b/i, "Marketplace"],
  [/\bcontentful\s+ai\b|\bai\s+actions\b/i, "AI"],
  // Ninetailed brand renamed to Personalization
  [/\bninetailed\b/i, "Personalization"],
  [/\bcontentful\s+personalization\b/i, "Personalization"],
];

// ---------------------------------------------------------------------------
// Known company names (customer proof points in Contentful pages)
// Expanded 2026-03-05: covers 175+ enterprise brands across all key verticals.
// Used for: company enrichment (industry/size inference) and graph edges.
// Built as an array then compiled to RegExp to stay maintainable.
// ---------------------------------------------------------------------------
const KNOWN_COMPANIES = [
  // Original set
  "Kraft Heinz",
  "Mailchimp",
  "DocuSign",
  "Shopify",
  "Nike",
  "Spotify",
  "Atlassian",
  "HubSpot",
  "Salesforce",
  "Slack",
  "Airbnb",
  "Dropbox",
  "LinkedIn",
  "Meta",
  "Google",
  "Microsoft",
  "Amazon",
  "Apple",
  "Netflix",
  "Adobe",
  "Figma",
  "Notion",
  "Vercel",
  "Netlify",
  "Cloudflare",
  "BMW",
  "Mercedes",
  "Toyota",
  "Volkswagen",
  "HSBC",
  "JPMorgan",
  "Goldman Sachs",
  "Unilever",
  "SAP",
  "Oracle",
  "Workday",
  "ServiceNow",
  "Cisco",
  "Dell",
  "HP",
  "IBM",
  "Intel",
  "NVIDIA",
  "Qualcomm",
  "Siemens",
  "Philips",
  "Bosch",
  "KPMG",
  "Deloitte",
  "PwC",
  "Accenture",
  "McKinsey",
  "BCG",
  "Walmart",
  "Target",
  "IKEA",
  "Zara",
  "Sephora",
  "Puma",
  "Adidas",
  "Peloton",
  "Twitch",
  "Discord",
  "Stripe",
  "Square",
  "PayPal",
  "Intuit",
  "Zendesk",
  "Intercom",
  "Asana",
  "Airtable",
  "Twilio",
  "Segment",
  "Braze",
  "Mixpanel",
  "Amplitude",
  "Contentstack",
  "Sanity",
  "Storyblok",
  "Prismic",
  "Strapi",
  "WordPress",
  "Sitecore",
  "Drupal",
  // Financial services
  "American Express",
  "Barclays",
  "ING",
  "Allianz",
  "Deutsche Bank",
  "BNP Paribas",
  "Santander",
  "UBS",
  "Morgan Stanley",
  "Visa",
  "Mastercard",
  "Fidelity",
  "BlackRock",
  "Vanguard",
  "Klarna",
  "Adyen",
  "Worldpay",
  "FIS",
  "Fiserv",
  "Temenos",
  // Retail & ecommerce
  "Carrefour",
  "Zalando",
  "Tesco",
  "Nordstrom",
  "Ralph Lauren",
  "Burberry",
  "LVMH",
  "Gucci",
  "H&M",
  "Levi Strauss",
  // Media & publishing
  "BBC",
  "Sky",
  "Financial Times",
  "The Guardian",
  "Hearst",
  "Reuters",
  "Bloomberg",
  "Bertelsmann",
  "News Corp",
  "Warner Bros",
  "NBCUniversal",
  // Software & cloud
  "PagerDuty",
  "Datadog",
  "Snowflake",
  "Databricks",
  "HashiCorp",
  "GitHub",
  "GitLab",
  "Okta",
  "CrowdStrike",
  "Palo Alto Networks",
  "Splunk",
  "Elastic",
  "Zurich",
  // Healthcare & life sciences
  "Roche",
  "Pfizer",
  "AstraZeneca",
  "Novartis",
  "Bayer",
  "Merck",
  "Medtronic",
  "Abbott",
  "GE Healthcare",
  // Automotive
  "Ford",
  "Stellantis",
  "Hyundai",
  "Kia",
  "Porsche",
  "Audi",
  "Renault",
  "Volvo",
  "Daimler",
  // Travel & hospitality
  "Marriott",
  "Hilton",
  "Expedia",
  "Delta",
  "Lufthansa",
  "British Airways",
  "Emirates",
  "Airbus",
  "Accor",
  "Hyatt",
  // CPG & QSR
  "Starbucks",
  "Coca-Cola",
  "PepsiCo",
  "Heineken",
  "Diageo",
  "Unilever",
  "Colgate",
  // Education
  "Coursera",
  "Udemy",
  "Pearson",
  "Duolingo",
  // Other
  "Contentful",
  "Ninetailed",
];

// Escape special regex chars in each name, then join as alternation
const _companyPattern = KNOWN_COMPANIES.map((n) =>
  n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
).join("|");
const KNOWN_COMPANY_REGEX = new RegExp(`\\b(${_companyPattern})\\b`, "gi");
const COMPANY_NAME_BY_NORMALIZED = new Map(
  KNOWN_COMPANIES.map((name) => [name.toLowerCase(), name] as const),
);
const SELF_COMPANY_NAMES = new Set(["contentful", "ninetailed"]);
const LOWERCASE_AMBIGUOUS_COMPANIES = new Set([
  "target",
  "segment",
  "square",
  "meta",
  "apple",
  "notion",
]);

// ---------------------------------------------------------------------------
// Language detection (simple frequency of function words)
// ---------------------------------------------------------------------------
const FR_WORDS =
  /\b(le|la|les|de|du|des|un|une|et|est|dans|pour|sur|avec|par|aussi|mais|comme|cette|votre|notre|vous|nous)\b/gi;
const DE_WORDS =
  /\b(der|die|das|ein|eine|und|ist|mit|f[uü]r|auf|bei|von|sie|ich|wir|auch|nicht|als|oder|aber|durch|werden|haben)\b/gi;
const EN_WORDS =
  /\b(the|and|for|with|from|that|this|your|our|you|we|is|are|to|of|in|on|by|build|content|platform)\b/gi;
const SIGNAL_TEXT_CHAR_LIMIT = 25_000;

// ---------------------------------------------------------------------------
// URL normalization — strip locale prefixes before pattern matching
// ---------------------------------------------------------------------------
const LOCALE_PREFIXES =
  /^\/(de|fr|en-gb|en-us|es|it|nl|pl|se|ja|ko|zh|au|sg|br|mx|latam|es-latam)\//i;

function normalizeSlug(rawUrl: string): string {
  return rawUrl
    .replace(LOCALE_PREFIXES, "/")
    .split("?")[0]
    .replace(/\/$/, "")
    .toLowerCase();
}

function detectLocaleLanguage(rawUrl: string): "EN" | "FR" | "DE" | null {
  const localeMatch = rawUrl
    .toLowerCase()
    .match(
      /^\/(de|fr|en-gb|en-us|es|it|nl|pl|se|ja|ko|zh|au|sg|br|mx|latam|es-latam)\//,
    );
  if (!localeMatch) return null;
  if (localeMatch[1] === "fr") return "FR";
  if (localeMatch[1] === "de") return "DE";
  return "EN";
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectPrimaryLanguage(
  rawUrl: string,
  title: string,
  signalText: string,
): "EN" | "FR" | "DE" {
  const localeLanguage = detectLocaleLanguage(rawUrl);
  if (localeLanguage) return localeLanguage;

  const sample = `${title}\n${signalText.slice(0, SIGNAL_TEXT_CHAR_LIMIT)}`;
  const tokenCount = (sample.match(/\b[\p{L}]+\b/gu) || []).length;
  const frCount = (sample.match(FR_WORDS) || []).length;
  const deCount = (sample.match(DE_WORDS) || []).length;
  const enCount = (sample.match(EN_WORDS) || []).length;
  const frRatio = frCount / Math.max(1, tokenCount);
  const deRatio = deCount / Math.max(1, tokenCount);

  if (
    frCount >= 20 &&
    frRatio >= 0.012 &&
    frCount > deCount * 1.5 &&
    frCount > enCount * 0.9
  ) {
    return "FR";
  }
  if (
    deCount >= 20 &&
    deRatio >= 0.012 &&
    deCount > frCount * 1.5 &&
    deCount > enCount * 0.9
  ) {
    return "DE";
  }

  return "EN";
}

export function canonicalizeCompanyMentions(matches: string[]): string[] {
  const seen = new Set<string>();
  const canonical: string[] = [];

  for (const match of matches) {
    const normalized = normalizeCompanyName(match);
    if (
      !normalized ||
      SELF_COMPANY_NAMES.has(normalized) ||
      seen.has(normalized)
    )
      continue;

    const canonicalName = COMPANY_NAME_BY_NORMALIZED.get(normalized);
    if (!canonicalName) continue;

    if (
      LOWERCASE_AMBIGUOUS_COMPANIES.has(normalized) &&
      match !== canonicalName &&
      match !== canonicalName.toUpperCase()
    ) {
      continue;
    }

    seen.add(normalized);
    canonical.push(canonicalName);
  }

  return canonical.slice(0, 12);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ContentSignals {
  // URL-derived
  urlPattern: UrlPattern;
  isProductPage: boolean;

  // Content intent
  hasDemo: boolean;
  hasPricing: boolean;
  hasFAQ: boolean;
  hasVideo: boolean;
  hasDownload: boolean;
  hasStepByStep: boolean;

  // Entities
  detectedLanguage: "EN" | "FR" | "DE";
  mentionedCompanies: string[];
  mentionedProducts: string[];
  detectedSeasons: string[]; // all seasons found in title (empty if none)
  audienceHints: string[]; // URL-pattern-derived explicit audience hints (e.g. docs/customers/partners/internal)
  topicHints: string[]; // product-derived topic hints (e.g. ['Artificial intelligence (AI)'])
  industryHints: string[]; // URL-derived industry hints for solution/vertical pages

  // Pre-structured content block (what gets sent to AI)
  structuredContent: {
    title: string;
    primaryCTAs: string[];
    mentionedBrands: string[];
    featureHeadings: string[];
    bodySummary: string; // up to 4000 chars of signal-dense body (flat, backward-compat)
  };

  /**
   * Zone-aware content sections from the Contentful component tree.
   * Present when the crawler ran with zone extraction (CDA path).
   * Used by the classifier to route evidence to the right fields.
   */
  contentZones?: import("./recursiveCrawler.js").ContentZone[];

  // Hard-inferred taxonomy values (used in post-processing overrides)
  override: {
    schemaType: string | null; // null = let AI decide
    assetType: string | null;
    assetSubType: string | null;
    funnelStage: string | null; // only set when CTA signals are unambiguous
    season: string | null; // only set when unambiguous (single season keyword in title)
    language: string; // always set
    usageRights: string; // always External unless flagged internal
    yearPublished: string | null; // year extracted from title (e.g. "2025")
    region: string | null; // null = Global (default); set only for locale-prefixed URLs
  };

  nlp?: {
    provider: string;
    source: "external" | "heuristic";
    entities: Array<{
      type: string;
      value: string;
      confidence?: number;
    }>;
    intents: Array<{
      label: string;
      confidence?: number;
    }>;
    raw?: unknown;
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function extractContentSignals(
  slug: string,
  title: string,
  textContent: string,
  contentZones?: import("./recursiveCrawler.js").ContentZone[],
): ContentSignals {
  const rawUrl = slug || "";
  const rawUrlLower = rawUrl.toLowerCase();
  const url = normalizeSlug(rawUrl);
  const signalText = `${title}\n${textContent.slice(0, SIGNAL_TEXT_CHAR_LIMIT)}`;
  const isGuideLikePath = /(^|\/)(guides?|glossary)(\/|$)/i.test(url);

  // --- 1. URL pattern ---
  // Match URL patterns. Patterns ending in '/' use prefix/substring matching.
  // Bare-word patterns (e.g. '/platform') require an exact path segment match
  // to prevent false positives (e.g. 'guides/personalization' matching '/personalization').
  function matchesUrlPattern(url: string, pattern: string): boolean {
    if (pattern.endsWith("/")) {
      // Substring match for path-prefix patterns like '/blog/'
      // Also match when URL ends exactly at the pattern boundary (no trailing slash in slug)
      return url.includes(pattern) || url.endsWith(pattern.slice(0, -1));
    }
    // Exact segment match: split on '/', check if any segment equals the pattern without slashes
    const seg = pattern.replace(/^\//, "").replace(/\/$/, "");
    return url.split("/").some((p) => p === seg);
  }

  let urlPattern: UrlPattern = "unknown";
  for (const [pattern, keys] of Object.entries(URL_PATTERNS)) {
    if ((keys as readonly string[]).some((p) => matchesUrlPattern(url, p))) {
      urlPattern = pattern as UrlPattern;
      break;
    }
  }
  if (urlPattern === "docs" && isGuideLikePath && /(^|\/)api\/?$/i.test(url)) {
    urlPattern = "unknown";
  }
  const isProductPage = urlPattern === "product";

  // --- 2. Content signals ---
  // CTA detection: only count as primary intent if CTA appears in the middle 70% of content
  // (excludes nav at top ~15% and footer at bottom ~15%) AND appears <= 2 times total
  // (nav/footer repetition typically produces 3+ occurrences of the same phrase).
  function hasPrimaryCTA(text: string, phrases: string[]): boolean {
    const textLower = text.toLowerCase();
    const bodyStart = Math.floor(text.length * 0.15);
    const bodyEnd = Math.floor(text.length * 0.85);
    const bodyWindow = textLower.slice(bodyStart, bodyEnd);
    for (const phrase of phrases) {
      const allOccurrences = (
        textLower.match(
          new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        ) || []
      ).length;
      if (allOccurrences > 2) continue; // nav/footer repetition — skip
      if (bodyWindow.includes(phrase)) return true;
    }
    return false;
  }

  const hasDemo = hasPrimaryCTA(signalText, DEMO_PHRASES);
  const hasPricing = hasPrimaryCTA(signalText, PRICING_PHRASES);
  const hasFAQ = FAQ_PATTERNS.some((r) => r.test(signalText));
  // Video: requires embed/player signals or explicit video CTA — not just the word "video"
  const VIDEO_EMBED_PATTERNS = [
    /\bwatch\s+(?:the\s+)?(?:demo|video|recording|webinar)\b/i,
    /\bplay\s+(?:the\s+)?video\b/i,
    /vimeo\.com|youtube\.com|wistia\.com|loom\.com/i,
    /\bvideo\s+(?:embed|player|thumbnail)\b/i,
  ];
  const hasVideo =
    urlPattern === "event" ||
    /\b(webinar|recording)\b/i.test(title) ||
    VIDEO_EMBED_PATTERNS.some((r) => r.test(signalText));

  // Download: requires explicit download CTA, not just the word "guide" or "report"
  const DOWNLOAD_CTA_PATTERNS = [
    /\bdownload\s+(?:the\s+)?(?:ebook|report|whitepaper|guide|pdf|template)\b/i,
    /\bget\s+(?:the\s+)?(?:free\s+)?(?:ebook|report|whitepaper|guide)\b/i,
    /\.pdf\b/i,
  ];
  const hasDownload = DOWNLOAD_CTA_PATTERNS.some((r) => r.test(signalText));
  // HowTo requires explicit instructional phrasing — not just numbered lists.
  // A step-by-step guide uses action verbs after step numbers.
  const hasStepByStep =
    /(?:step\s+\d+[\s:.]+(?:install|configure|set\s+up|create|add|enable|connect|deploy|build|run|open|click|go\s+to|navigate|enter|select|choose|copy|paste|save|download|upload|log\s+in|sign\s+in)|how\s+to\s+\w+\s+(?:your|a|an|the)\s+\w+)/i.test(
      signalText,
    );

  // --- 3. Language detection ---
  const detectedLanguage = detectPrimaryLanguage(
    rawUrlLower,
    title,
    signalText,
  );

  // --- 4. Company extraction ---
  const mentionedCompanies = canonicalizeCompanyMentions(
    signalText.match(KNOWN_COMPANY_REGEX) || [],
  );

  // --- 5. Product mentions ---
  const mentionedProducts = Array.from(
    new Set(
      CONTENTFUL_PRODUCTS.filter(([re]) => re.test(signalText)).map(
        ([, label]) => label,
      ),
    ),
  );

  // --- 6. CTA extraction ---
  const ctaRegexes = [
    /request\s+(?:a\s+)?demo/gi,
    /start\s+(?:for\s+)?free/gi,
    /get\s+started(?:\s+free)?/gi,
    /sign\s+up(?:\s+free)?/gi,
    /book\s+a\s+demo/gi,
    /contact\s+sales/gi,
    /try\s+(?:it\s+)?(?:for\s+)?free/gi,
    /start\s+(?:your\s+)?(?:free\s+)?trial/gi,
    /schedule\s+(?:a\s+)?demo/gi,
    /talk\s+to\s+(?:an?\s+)?(?:expert|sales|us)/gi,
  ];
  const primaryCTAs = ctaRegexes
    .flatMap((r) => signalText.match(r) || [])
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter(
      (v, i, a) =>
        a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i,
    )
    .slice(0, 6);

  // --- 7. Feature headings (Title-Case phrases 2–8 words, standalone lines) ---
  const featureHeadings = (
    signalText.match(/^[A-Z][a-zA-Z0-9 &/:'-]{8,60}$/gm) || []
  )
    .map((s) => s.trim())
    .filter((s) => {
      const words = s.split(" ");
      return words.length >= 2 && words.length <= 8;
    })
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 8);

  // --- 8. Body summary — prefer meaningful lines, skip short/URL lines ---
  // Keep this compact. Oversized summaries materially increase classifier latency
  // and often add duplicate noise rather than better evidence.
  const bodyLines = signalText
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) => l.length > 15 && !/^https?:\/\//.test(l) && !/^\s*[|#*-]/.test(l),
    );
  const bodySummary = bodyLines.join(" ").slice(0, 4000);

  // --- 9. Hard overrides ---
  // Schema Type override — URL is ground truth
  let schemaType: string | null = null;
  if (isProductPage) schemaType = "SoftwareApplication";
  else if (urlPattern === "blog") schemaType = "BlogPosting";
  else if (urlPattern === "event") schemaType = "Event";
  else if (urlPattern === "podcast") schemaType = "PodcastEpisode";
  else if (urlPattern === "docs") schemaType = "TechArticle";
  else if (urlPattern === "caseStudy") schemaType = "Article";
  else if (hasFAQ) schemaType = "FAQPage";
  else if (hasStepByStep && !isProductPage) schemaType = "HowTo";
  else if (urlPattern === "resource" && hasDownload)
    schemaType = "DigitalDocument";

  // Asset Type override — only for cases where the URL/title makes the format unambiguous.
  // DO NOT force Document here — let the AI decide for ambiguous pages.
  // "watch a demo" on a product page does NOT mean the asset type is Video.
  const isVideoPrimary =
    urlPattern === "event" || /\b(webinar|recording)\b/i.test(title);
  let assetType: string | null = null;
  if (isVideoPrimary) assetType = "Video";
  else if (urlPattern === "podcast") assetType = "Audio";
  // else null — AI decides based on content semantics

  // Asset Sub-Type override — only where the URL is a definitive signal.
  // Product/solution pages: null — let AI pick between Product, Webpage, One pager, etc.
  // based on semantic content rather than URL alone.
  let assetSubType: string | null = null;
  if (urlPattern === "blog") assetSubType = "Blog";
  else if (urlPattern === "caseStudy") assetSubType = "Case Study";
  else if (urlPattern === "event") assetSubType = "Event";
  else if (urlPattern === "podcast") assetSubType = "Podcast";
  else if (urlPattern === "docs") assetSubType = "Documentation";
  else if (urlPattern === "resource" && hasDownload) assetSubType = "Ebook";
  else if (urlPattern === "product") assetSubType = "Product";
  // solution pages describe use-cases, not products — let AI decide Webpage vs One pager
  // pricing/partner/unknown → null, AI reasons from content

  // Funnel stage override — only when CTA signals are unambiguous
  let funnelStage: string | null = null;
  if (hasDemo || hasPricing) funnelStage = "Evaluation/Engagement (BOFU)";
  else if (urlPattern === "docs") funnelStage = "Retention";

  // Usage rights — only flag internal if content is explicitly marked for internal audiences.
  // 'restricted' alone is too broad (API docs use "restricted access", "rate restricted", etc.)
  // Require full phrases that unambiguously indicate internal-only distribution.
  // "for internal use" (without "only") is too broad — API/technical pages often explain
  // "internal vs external APIs" or "for internal use cases", which are not rights restrictions.
  const usageRights =
    /\b(internal only|internal use only|for internal use only|confidential|do not share|not for distribution|employees only)\b/i.test(
      signalText,
    )
      ? "Internal"
      : "External";

  // --- Season detection — title is the ground truth for launch season ---
  // Map month names to seasons (Northern Hemisphere / marketing convention).
  // Only hard-override when exactly one unique season is detected in the title.
  // If the title contains multiple seasons (e.g. "June & Fall"), pass as hints
  // so the AI can reason from content which is primary.
  const MONTH_TO_SEASON: Record<string, string> = {
    january: "Winter",
    february: "Winter",
    march: "Spring",
    april: "Spring",
    may: "Spring",
    june: "Summer",
    july: "Summer",
    august: "Summer",
    september: "Fall",
    october: "Fall",
    november: "Fall",
    december: "Winter",
  };
  const SEASON_WORDS = /\b(spring|summer|fall|autumn|winter)\b/gi;
  const MONTH_WORDS =
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi;

  const titleLower = title.toLowerCase();

  // Explicit season words (Fall, Spring, Summer, Winter) take priority over
  // month-derived seasons. "June & Fall Launch" → Fall wins (not Summer from June).
  const explicitSeasons = new Set<string>();
  for (const m of titleLower.matchAll(SEASON_WORDS)) {
    const s =
      m[1].toLowerCase() === "autumn"
        ? "Fall"
        : m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    explicitSeasons.add(s);
  }
  const derivedSeasons = new Set<string>();
  for (const m of titleLower.matchAll(MONTH_WORDS)) {
    const s = MONTH_TO_SEASON[m[1].toLowerCase()];
    if (s) derivedSeasons.add(s);
  }

  // Use explicit seasons if any found; fall back to month-derived only if none
  const detectedSeasons =
    explicitSeasons.size > 0 ? explicitSeasons : derivedSeasons;

  // Hard override only when unambiguous (one unique season in the winning set)
  const season: string | null =
    detectedSeasons.size === 1 ? [...detectedSeasons][0] : null; // multiple or none → AI reasons from content

  // --- Year Published — extract from title ---
  const yearMatch = title.match(/\b(20\d{2})\b/);
  const yearPublished: string | null = yearMatch ? yearMatch[1] : null;

  // --- Region from URL locale prefix ---
  // Only override from 'Global' when URL structure explicitly signals a non-global locale.
  const LOCALE_REGION_MAP: Array<[string, string]> = [
    ["/de/", "EMEA"],
    ["/fr/", "EMEA"],
    ["/es/", "EMEA"],
    ["/it/", "EMEA"],
    ["/nl/", "EMEA"],
    ["/pl/", "EMEA"],
    ["/se/", "EMEA"],
    ["/en-gb/", "UKI"],
    ["/uk/", "UKI"],
    ["/ja/", "APAC"],
    ["/ko/", "APAC"],
    ["/zh/", "APAC"],
    ["/au/", "APAC"],
    ["/sg/", "APAC"],
    ["/br/", "LATAM"],
    ["/mx/", "LATAM"],
    ["/latam/", "LATAM"],
    ["/es-latam/", "LATAM"],
  ];
  let region: string | null = null;
  for (const [prefix, r] of LOCALE_REGION_MAP) {
    if (rawUrlLower.startsWith(prefix) || rawUrlLower.includes(prefix)) {
      region = r;
      break;
    }
  }

  // --- Audience hints from URL pattern ---
  const audienceHints: string[] = [];
  if (urlPattern === "docs") audienceHints.push("Direct Customer");
  // Partner: check content to distinguish agency/SI vs tech/ISV — both patterns hint the same base
  if (urlPattern === "partner") {
    const isAgencySI =
      /\b(agency|implementat|consulting|services partner|si partner|system integrat)\b/i.test(
        signalText,
      );
    const isTechISV =
      /\b(integration|connector|api|sdk|build on|technical partner|isv|marketplace)\b/i.test(
        signalText,
      );
    if (isAgencySI && !isTechISV)
      audienceHints.push("Solution / Agency Partner");
    else if (isTechISV && !isAgencySI)
      audienceHints.push("Tech / Platform / ISV Partner");
    else {
      audienceHints.push("Tech / Platform / ISV Partner");
      audienceHints.push("Solution / Agency Partner");
    }
  }
  if (urlPattern === "careers") audienceHints.push("Internal");

  // --- Industry hints from solution page URL segments ---
  // Solution pages explicitly target a vertical — use slug to seed the industry field.
  const SOLUTION_INDUSTRY_MAP: [RegExp, string][] = [
    [/\/solutions\/retail/i, "Retail & ecommerce"],
    [
      /\/solutions\/(?:financial|fintech|banking|finance)/i,
      "Financial Services",
    ],
    [
      /\/solutions\/(?:media|publishing|news|entertainment)/i,
      "Media & Publishing",
    ],
    [/\/solutions\/(?:automotive|auto)/i, "Automotive"],
    [/\/solutions\/(?:travel|hospitality)/i, "Travel & Hospitality"],
    [
      /\/solutions\/(?:healthcare|health|pharma|life-sci)/i,
      "Health & Wellness",
    ],
    [/\/solutions\/(?:manufacturing|industrial)/i, "Manufacturing & Utilities"],
    [/\/solutions\/(?:saas|software|tech)/i, "Software, IT & Technology"],
    [/\/solutions\/(?:ecommerce|commerce)/i, "Retail & ecommerce"],
  ];
  const industryHints = SOLUTION_INDUSTRY_MAP.filter(([re]) => re.test(slug))
    .map(([, industry]) => industry)
    .filter((v, i, a) => a.indexOf(v) === i);

  // --- Topic hints from slug keywords ---
  // Slug is a strong signal for primary topic — editors name pages after their core subject.
  const URL_SLUG_TOPIC_MAP: [RegExp, string][] = [
    [/\bseo\b|\bseo-guide\b/i, "SEO"],
    [
      /(^|\/)api(\/|$)|\bapi[-_](guide|explained|overview)\b/i,
      "Web Development",
    ],
    [/\bheadless[-_]?cms\b/i, "Headless CMS"],
    [/\bomnichannel\b/i, "Digital experiences"],
    [/\bpersonali[sz]ation\b/i, "Personalization"],
    [/\bcomposable\b/i, "Composability"],
    [/\banalytics\b/i, "Analytics"],
    [/\bintegration|ecosystem\b/i, "Integrations"],
    [/\blocali[sz]ation\b/i, "Localization"],
    [/\bai[-_]actions\b|\bai\b/i, "Artificial intelligence (AI)"],
    [/\bhosting|deployment\b/i, "Deployment"],
    [/\bsegmentation\b/i, "Personalization"],
  ];
  const slugTopicHints = URL_SLUG_TOPIC_MAP.filter(([re]) =>
    re.test(slug || ""),
  )
    .map(([, topic]) => topic)
    .filter((v, i, a) => a.indexOf(v) === i);

  // --- Topic hints from mentioned products ---
  // These are hints (not hard overrides) — content may contradict them.
  const PRODUCT_TOPIC_MAP: Record<string, string> = {
    AI: "Artificial intelligence (AI)",
    Personalization: "Personalization",
    Ecosystem: "Integrations",
    Marketplace: "Integrations",
  };
  const topicHints = [
    ...slugTopicHints,
    ...mentionedProducts.map((p) => PRODUCT_TOPIC_MAP[p]).filter(Boolean),
  ].filter((v, i, a) => a.indexOf(v) === i);

  return {
    urlPattern,
    isProductPage,
    hasDemo,
    hasPricing,
    hasFAQ,
    hasVideo,
    hasDownload,
    hasStepByStep,
    detectedLanguage,
    mentionedCompanies,
    mentionedProducts,
    detectedSeasons: [...detectedSeasons], // all seasons found (for AI hint when ambiguous)
    audienceHints,
    topicHints,
    industryHints,
    structuredContent: {
      title,
      primaryCTAs,
      mentionedBrands: mentionedCompanies,
      featureHeadings,
      bodySummary,
    },
    contentZones:
      contentZones && contentZones.length > 0 ? contentZones : undefined,
    override: {
      schemaType,
      assetType,
      assetSubType,
      funnelStage,
      season,
      language: detectedLanguage,
      usageRights,
      yearPublished,
      region,
    },
    nlp: {
      provider: "heuristic",
      source: "heuristic",
      entities: [],
      intents: [],
    },
  };
}

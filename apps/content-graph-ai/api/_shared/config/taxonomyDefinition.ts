function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function conceptsFor(schemeId: string, labels: string[]) {
  return labels.map((label) => ({
    id: `${schemeId}-${slugify(label)}`,
    label,
  }));
}

export const COMPETITIVE_NAMED_COMPETITOR_LABELS = [
  "AB Tasty",
  "Adobe Experience Manager",
  "Adobe Target",
  "Agility CMS",
  "Bloomreach",
  "Contentstack",
  "Dynamic Yield",
  "Hygraph",
  "Insider",
  "Kameleoon",
  "Kontent.ai",
  "Monetate",
  "Optimizely",
  "Sanity",
  "Sitecore",
  "Storyblok",
  "Umbraco",
  "VWO",
  "Webflow",
] as const;

export const COMPETITIVE_CATEGORY_ALTERNATIVE_LABELS = [
  "Legacy CMS",
  "Monolithic CMS",
  "Monolithic Ecommerce Platform",
] as const;

export const COMPETITIVE_POSITIONING_TYPE_LABELS = [
  "none",
  "named-competitor",
  "category-alternative",
  "mixed",
] as const;

export const FULL_TAXONOMY_DEFINITION: Array<{
  schemeId: string;
  schemeLabel: string;
  concepts: Array<{ id: string; label: string }>;
}> = [
  {
    schemeId: "6iTmYSodF3GoSjR8RsizS0",
    schemeLabel: "Media type",
    concepts: conceptsFor("mediaType", [
      "Ads (organic and paid)",
      "B-Roll",
      "Blog",
      "Brand Guidelines",
      "Case Study",
      "Color",
      "Demo",
      "Documentation",
      "Ebook",
      "Email",
      "Event",
      "External Facing Presentation",
      "Font",
      "Headshot",
      "How To",
      "Icon",
      "Internal Only Presentation",
      "Interview Recording",
      "Logo",
      "Motion Graphic",
      "Music Track",
      "News",
      "One pager",
      "Pattern",
      "Podcast",
      "Product",
      "Rendering",
      "Report",
      "Still shots",
      "Stock",
      "Template",
      "Webinar",
      "Webpage",
      "Captions/SRT",
      "Thumbnail",
      "Background",
    ]),
  },
  {
    schemeId: "productName",
    schemeLabel: "Product",
    concepts: conceptsFor("product", [
      "Platform",
      "Studio",
      "Ecosystem",
      "Marketplace",
      "AI",
      "Ninetailed (Personalization)",
      "Analytics",
    ]),
  },
  {
    schemeId: "jobLevel",
    schemeLabel: "Job level",
    concepts: conceptsFor("jobLevel", [
      "C-Level",
      "VP",
      "Director",
      "Manager",
      "Individual Contributor",
      "Consultant",
    ]),
  },
  {
    schemeId: "jobFunction",
    schemeLabel: "Job function",
    concepts: conceptsFor("jobFunction", [
      "Digital strategists",
      "Content",
      "User Experience",
      "Designers",
      "Developers",
      "Digital",
      "Engineering",
      "IT/Engineering",
      "Marketing",
      "Procurement",
      "Product",
      "Retail / ecommerce",
      "Sales",
      "Web Development",
    ]),
  },
  {
    schemeId: "persona",
    schemeLabel: "Audience",
    concepts: conceptsFor("audience", [
      "Prospect",
      "Direct Customer",
      "Solution / Agency Partner",
      "Tech / Platform / ISV Partner",
      "Contentful community",
      "Internal",
    ]),
  },
  {
    schemeId: "topic",
    schemeLabel: "Topic",
    concepts: conceptsFor("topic", [
      "Analytics",
      "Artificial intelligence (AI)",
      "Community",
      "Composability",
      "Composable commerce",
      "Content governance",
      "Content modeling",
      "Content operations",
      "Deployment",
      "Design",
      "Design systems",
      "Digital experiences",
      "Experimentation",
      "Getting Started with Contentful",
      "GraphQL",
      "Headless CMS",
      "Infrastructure",
      "Integrations",
      "Migration",
      "Personalization",
      "Productivity",
      "Replatforming",
      "Scalability",
      "Security",
      "SEO",
      "Web Development",
      "Commerce",
      "Marketplace",
    ]),
  },
  {
    schemeId: "useCase",
    schemeLabel: "Use case",
    concepts: conceptsFor("useCase", [
      "Multi-brand experiences",
      "Personalization",
      "Composable commerce",
      "Websites",
      "Knowledge base",
      "Localization",
      "SEO / GEO",
      "Omnichannel",
      "Digital experiences",
      "Experimentation",
    ]),
  },
  {
    schemeId: "funnelStage",
    schemeLabel: "Funnel stage",
    concepts: conceptsFor("funnelStage", [
      "Awareness (TOFU)",
      "Consideration (MOFU)",
      "Evaluation/Engagement (BOFU)",
      "Retention",
      "Sign-up",
    ]),
  },
  {
    schemeId: "industry",
    schemeLabel: "Industry",
    concepts: conceptsFor("industry", [
      "Automotive",
      "Business services",
      "Consumer Packaged Goods (CPG)",
      "Education",
      "Entertainment",
      "Environment and Energy",
      "Financial Services",
      "Government & Public Services",
      "Health & Wellness",
      "Manufacturing & Utilities",
      "Media & Telecommunications",
      "Non-profit",
      "Quick Service Restaurants (QSR)",
      "Retail & ecommerce",
      "General business",
      "Software, IT & Technology",
      "Transportation & Logistics",
      "Travel & Hospitality",
    ]),
  },
  {
    schemeId: "companySize",
    schemeLabel: "Company size",
    concepts: conceptsFor("companySize", [
      "Small business (<$10M revenue)",
      "Commercial ($10M - $500M revenue)",
      "Enterprise (>$500M revenue)",
    ]),
  },
  {
    schemeId: "region",
    schemeLabel: "Region",
    concepts: conceptsFor("region", [
      "APAC",
      "EMEA",
      "LATAM",
      "NA",
      "UKI",
      "Global",
    ]),
  },
  {
    schemeId: "language",
    schemeLabel: "Language",
    concepts: conceptsFor("language", ["EN", "FR", "DE"]),
  },
];

export function normalizeTaxonomyLabel(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

// Derived label arrays for closed-set taxonomy fields — used by Zod z.enum()
// in the classifier prompt schemas to constrain AI structured output.

export const FUNNEL_STAGE_LABELS = [
  "Awareness (TOFU)",
  "Consideration (MOFU)",
  "Evaluation/Engagement (BOFU)",
  "Retention",
  "Sign-up",
] as const;

export const LANGUAGE_LABELS = ["EN", "FR", "DE"] as const;

export const REGION_LABELS = [
  "APAC",
  "EMEA",
  "LATAM",
  "NA",
  "UKI",
  "Global",
] as const;

export const JOB_LEVEL_LABELS = [
  "C-Level",
  "VP",
  "Director",
  "Manager",
  "Individual Contributor",
  "Consultant",
] as const;

export const AUDIENCE_LABELS = [
  "Prospect",
  "Direct Customer",
  "Solution / Agency Partner",
  "Tech / Platform / ISV Partner",
  "Contentful community",
  "Internal",
] as const;

export const COMPANY_SIZE_LABELS = [
  "Small business (<$10M revenue)",
  "Commercial ($10M - $500M revenue)",
  "Enterprise (>$500M revenue)",
] as const;

// Season values are defined by the signal extraction layer, not a CMS taxonomy scheme.
// Spring/Summer/Fall/Winter are the only canonical values.
export const SEASON_LABELS = ["Spring", "Summer", "Fall", "Winter"] as const;

// Canonical assetType labels — drawn from the "Media type" taxonomy scheme.
// The AI may only emit values from this list; anything else is a hallucination.
export const ASSET_TYPE_LABELS = [
  "Ads (organic and paid)",
  "B-Roll",
  "Blog",
  "Brand Guidelines",
  "Case Study",
  "Color",
  "Demo",
  "Documentation",
  "Ebook",
  "Email",
  "Event",
  "External Facing Presentation",
  "Font",
  "Headshot",
  "How To",
  "Icon",
  "Internal Only Presentation",
  "Interview Recording",
  "Logo",
  "Motion Graphic",
  "Music Track",
  "News",
  "One pager",
  "Pattern",
  "Podcast",
  "Product",
  "Rendering",
  "Report",
  "Still shots",
  "Stock",
  "Template",
  "Webinar",
  "Webpage",
  "Captions/SRT",
  "Thumbnail",
  "Background",
] as const;

// Canonical schemaType labels — the full set of SEO schema.org types the
// classifier is allowed to emit. Any other value is a hallucination.
export const SCHEMA_TYPE_LABELS = [
  "Article",
  "BlogPosting",
  "DigitalDocument",
  "Event",
  "FAQPage",
  "HowTo",
  "PodcastEpisode",
  "SoftwareApplication",
  "TechArticle",
  "VideoObject",
] as const;

export function getStaticAllowedTaxonomyLabels() {
  const labelsFor = (schemeId: string) =>
    (
      FULL_TAXONOMY_DEFINITION.find((scheme) => scheme.schemeId === schemeId)
        ?.concepts || []
    )
      .map((concept) => concept.label)
      .sort();

  return {
    assetType: [...ASSET_TYPE_LABELS].sort(),
    assetSubType: labelsFor("6iTmYSodF3GoSjR8RsizS0"),
    schemaType: [...SCHEMA_TYPE_LABELS].sort(),
    topic: labelsFor("topic"),
    product: labelsFor("productName"),
    jobLevel: labelsFor("jobLevel"),
    jobFunction: labelsFor("jobFunction"),
    useCases: labelsFor("useCase"),
    funnelStage: labelsFor("funnelStage"),
    industry: labelsFor("industry"),
    companySize: labelsFor("companySize"),
    region: labelsFor("region"),
    language: labelsFor("language"),
    audience: labelsFor("persona"),
  };
}

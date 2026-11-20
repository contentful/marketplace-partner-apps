export interface ContentTypeProfile {
  assetType: string | null;
  assetSubType: string | null;
  schemaType: { default: string; aiDecides: boolean; never?: string[] };
  funnelStage: { default: string; allowed: string[]; never: string[] };
  audienceHints: string[];
  companyEnrichmentApplies: boolean;
}

// Each profile is defined once; page/child aliases share the same object reference.

const longFormSeoProfile: ContentTypeProfile = {
  assetType: "Webpage",
  assetSubType: "Article",
  schemaType: {
    default: "Article",
    aiDecides: true,
    never: [
      "HowTo",
      "SoftwareApplication",
      "DigitalDocument",
      "VideoObject",
      "PodcastEpisode",
      "Event",
    ],
  },
  funnelStage: {
    default: "Awareness (TOFU)",
    allowed: [
      "Awareness (TOFU)",
      "Consideration (MOFU)",
      "Evaluation/Engagement (BOFU)",
    ],
    never: ["Retention", "Sign-up"],
  },
  audienceHints: [],
  companyEnrichmentApplies: false,
};

const blogPostProfile: ContentTypeProfile = {
  assetType: "Blog",
  assetSubType: "Blog",
  schemaType: { default: "BlogPosting", aiDecides: false },
  funnelStage: {
    default: "Awareness (TOFU)",
    allowed: [
      "Awareness (TOFU)",
      "Consideration (MOFU)",
      "Evaluation/Engagement (BOFU)",
    ],
    never: ["Retention", "Sign-up"],
  },
  audienceHints: [],
  companyEnrichmentApplies: false,
};

const caseStudyProfile: ContentTypeProfile = {
  assetType: "Case Study",
  assetSubType: "Case Study",
  schemaType: { default: "Article", aiDecides: false },
  funnelStage: {
    default: "Consideration (MOFU)",
    allowed: ["Consideration (MOFU)"],
    never: ["Awareness (TOFU)", "Retention", "Sign-up"],
  },
  audienceHints: [],
  companyEnrichmentApplies: true,
};

const resourceProfile: ContentTypeProfile = {
  assetType: null,
  assetSubType: null,
  schemaType: { default: "DigitalDocument", aiDecides: true },
  funnelStage: {
    default: "Consideration (MOFU)",
    allowed: [
      "Awareness (TOFU)",
      "Consideration (MOFU)",
      "Evaluation/Engagement (BOFU)",
    ],
    never: ["Retention", "Sign-up"],
  },
  audienceHints: [],
  companyEnrichmentApplies: false,
};

const eventProfile: ContentTypeProfile = {
  assetType: "Event",
  assetSubType: "Event",
  schemaType: { default: "Event", aiDecides: false },
  funnelStage: {
    default: "Consideration (MOFU)",
    allowed: [
      "Awareness (TOFU)",
      "Consideration (MOFU)",
      "Evaluation/Engagement (BOFU)",
    ],
    never: ["Retention", "Sign-up"],
  },
  audienceHints: [],
  companyEnrichmentApplies: false,
};

const pricingProfile: ContentTypeProfile = {
  assetType: "Webpage",
  assetSubType: "Webpage",
  schemaType: { default: "SoftwareApplication", aiDecides: false },
  funnelStage: {
    default: "Evaluation/Engagement (BOFU)",
    allowed: ["Evaluation/Engagement (BOFU)"],
    never: [
      "Awareness (TOFU)",
      "Consideration (MOFU)",
      "Retention",
      "Sign-up",
    ],
  },
  audienceHints: [],
  companyEnrichmentApplies: false,
};

const solutionProfile: ContentTypeProfile = {
  assetType: "Webpage",
  assetSubType: "Webpage",
  schemaType: { default: "SoftwareApplication", aiDecides: true },
  funnelStage: {
    default: "Consideration (MOFU)",
    allowed: ["Consideration (MOFU)", "Evaluation/Engagement (BOFU)"],
    never: ["Awareness (TOFU)", "Retention", "Sign-up"],
  },
  audienceHints: [],
  companyEnrichmentApplies: false,
};

const pageProfile: ContentTypeProfile = {
  assetType: null,
  assetSubType: null,
  schemaType: { default: "Article", aiDecides: true },
  funnelStage: {
    default: "Awareness (TOFU)",
    allowed: [
      "Awareness (TOFU)",
      "Consideration (MOFU)",
      "Evaluation/Engagement (BOFU)",
      "Retention",
      "Sign-up",
    ],
    never: [],
  },
  audienceHints: [],
  companyEnrichmentApplies: false,
};

const glossaryProfile: ContentTypeProfile = {
  assetType: "Webpage",
  assetSubType: "Article",
  schemaType: { default: "Article", aiDecides: false },
  funnelStage: {
    default: "Awareness (TOFU)",
    allowed: ["Awareness (TOFU)"],
    never: [
      "Consideration (MOFU)",
      "Evaluation/Engagement (BOFU)",
      "Retention",
      "Sign-up",
    ],
  },
  audienceHints: [],
  companyEnrichmentApplies: false,
};

const partnerProfile: ContentTypeProfile = {
  assetType: "Webpage",
  assetSubType: "Webpage",
  schemaType: { default: "SoftwareApplication", aiDecides: true },
  funnelStage: {
    default: "Consideration (MOFU)",
    allowed: [
      "Awareness (TOFU)",
      "Consideration (MOFU)",
      "Evaluation/Engagement (BOFU)",
    ],
    never: ["Retention", "Sign-up"],
  },
  audienceHints: [],
  companyEnrichmentApplies: false,
};

const CONTENT_TYPE_PROFILES: Record<string, ContentTypeProfile> = {
  pageLongFormSeo: longFormSeoProfile,
  longFormSeo: longFormSeoProfile,
  pageBlogPost: blogPostProfile,
  blogPost: blogPostProfile,
  pageCaseStudy: caseStudyProfile,
  caseStudy: caseStudyProfile,
  pageResource: resourceProfile,
  resource: resourceProfile,
  pageEvent: eventProfile,
  event: eventProfile,
  pagePricing: pricingProfile,
  pricing: pricingProfile,
  pageSolution: solutionProfile,
  solution: solutionProfile,
  page: pageProfile,
  pageGlossary: glossaryProfile,
  glossary: glossaryProfile,
  pagePartner: partnerProfile,
  partner: partnerProfile,
};

export function loadContentTypeProfile(
  contentType: string,
): ContentTypeProfile | null {
  return CONTENT_TYPE_PROFILES[contentType] ?? null;
}

/**
 * Maps child content types (e.g. `caseStudy`) to their parent page content
 * type (e.g. `pageCaseStudy`). Used when classifying a child entry to crawl
 * the parent page which holds all the body components.
 */
export const CHILD_TO_PAGE_MAP: Record<string, string> = {
  caseStudy: "pageCaseStudy",
  blogPost: "pageBlogPost",
  longFormSeo: "pageLongFormSeo",
  resource: "pageResource",
  event: "pageEvent",
  glossary: "pageGlossary",
};

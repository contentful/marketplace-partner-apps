export type JobFunctionRule = {
  id: string;
  taxonomyLabel:
    | "Content"
    | "Digital"
    | "Engineering"
    | "IT/Engineering"
    | "Marketing"
    | "Product"
    | "Retail / ecommerce"
    | "Sales"
    | "Procurement"
    | "Web Development";
  exactTitles?: string[];
  contains?: string[];
  excludes?: string[];
};

export type JobLevelRule = {
  id: string;
  taxonomyLabel:
    | "C-Level"
    | "VP"
    | "Director"
    | "Manager"
    | "Individual Contributor"
    | "Consultant";
  exactTitles?: string[];
  contains?: string[];
  excludes?: string[];
};

export const JOB_FUNCTION_RULES: JobFunctionRule[] = [
  {
    id: "content",
    taxonomyLabel: "Content",
    exactTitles: [
      "content creator",
      "content manager",
      "content editor",
      "content strategist",
    ],
    contains: [
      "content creator",
      "content manager",
      "content editor",
      "content strategist",
      "copywriter",
      "writer",
      "editor",
      "tech writing",
      "technical writer",
    ],
    excludes: [
      "chief technology officer",
      "engineering",
      "engineer",
      "product manager",
      "software developer",
    ],
  },
  {
    id: "digital",
    taxonomyLabel: "Digital",
    exactTitles: [
      "chief digital officer",
      "head of seo",
      "director of seo",
      "seo manager",
      "seo lead",
      "director seo strategy",
    ],
    contains: [
      "digital",
      "digital media",
      "seo manager",
      "seo lead",
      "seo strategy",
      "cms specialist",
      "web coordinator",
      "web specialist",
      "digital experiences",
    ],
    excludes: [
      "web developer",
      "frontend",
      "software developer",
      "engineering",
      "product manager",
      "sales",
      "chief executive officer",
    ],
  },
  {
    id: "engineering",
    taxonomyLabel: "Engineering",
    exactTitles: [
      "chief technology officer",
      "chief technical officer",
      "director of engineering",
      "solution architect",
      "software engineer",
      "devops",
    ],
    contains: [
      "engineer",
      "engineering",
      "enterprise architect",
      "technical architect",
      "software developer",
      "software architect",
      "backend developer",
      "devops",
      "ios developer",
    ],
    excludes: [
      "sales engineer",
      "sales engineering",
      "web developer",
      "web development",
      "product manager",
      "business development",
    ],
  },
  {
    id: "it-engineering",
    taxonomyLabel: "IT/Engineering",
    exactTitles: [
      "cio",
      "ciso",
      "director of it",
      "head of it",
      "it manager",
      "it administrator",
      "it security manager",
    ],
    contains: [
      "chief information",
      "chief security",
      "information technology",
      "it operations",
      "it infrastructure",
      "it architect",
      "it director",
      "security manager",
      "cloud",
      "cyber",
      "infrastructure",
    ],
    excludes: ["marketing", "content manager", "sales manager"],
  },
  {
    id: "marketing",
    taxonomyLabel: "Marketing",
    exactTitles: [
      "chief marketing officer",
      "cmo",
      "crm manager",
      "global crm lead",
      "head crm",
    ],
    contains: [
      "marketing",
      "marketer",
      "communications",
      "public relation",
      "martech",
      "marops",
      "demand generation",
      "paid media",
      "paid search",
      "paid social",
      "social media manager",
      "email operations",
    ],
    excludes: ["engineer", "engineering", "it director", "software developer"],
  },
  {
    id: "product",
    taxonomyLabel: "Product",
    exactTitles: [
      "chief product officer",
      "cpo",
      "product manager",
      "product owner",
      "product lead",
    ],
    contains: [
      "product manager",
      "product owner",
      "product leadership",
      "product strategy",
      "product management",
      "chief product officer",
    ],
    excludes: [
      "content product",
      "technical product writer",
      "product marketing",
      "product page",
    ],
  },
  {
    id: "retail-ecommerce",
    taxonomyLabel: "Retail / ecommerce",
    exactTitles: ["ecommerce manager", "retail director", "merchandising lead"],
    contains: [
      "retail",
      "ecommerce",
      "e-commerce",
      "merchandising",
      "omnichannel",
      "commerce",
    ],
    excludes: ["commerce platform", "headless commerce platform"],
  },
  {
    id: "sales",
    taxonomyLabel: "Sales",
    exactTitles: [
      "account executive",
      "sales director",
      "sales manager",
      "business development representative",
      "sdr",
      "bdr",
    ],
    contains: [
      "account executive",
      "business development",
      "sales director",
      "sales manager",
      "sales",
      "bdr",
      "sdr",
    ],
    excludes: ["sales engineer", "sales engineering", "sales operations"],
  },
  {
    id: "procurement",
    taxonomyLabel: "Procurement",
    exactTitles: ["procurement manager", "vendor management lead"],
    contains: [
      "procurement",
      "vendor management",
      "sourcing",
      "general counsel",
      "corporate counsel",
      "in house counsel",
    ],
  },
  {
    id: "web-development",
    taxonomyLabel: "Web Development",
    exactTitles: [
      "web developer",
      "frontend developer",
      "front-end developer",
      "web designer",
      "wordpress developer",
      "php developer",
    ],
    contains: [
      "web development",
      "web dev",
      "frontend",
      "front-end",
      "web application developer",
      "web engineering",
      "wordpress",
      "php developer",
      "web designer",
      "ux designer",
    ],
    excludes: [
      "content developer",
      "it developer",
      "software engineer",
      "technical writer",
    ],
  },
];

export const JOB_LEVEL_RULES: JobLevelRule[] = [
  {
    id: "c-level",
    taxonomyLabel: "C-Level",
    exactTitles: [
      "chief executive officer",
      "chief technology officer",
      "chief technical officer",
      "chief information officer",
      "chief security officer",
      "chief marketing officer",
      "chief product officer",
      "chief financial officer",
      "chief operating officer",
      "chief revenue officer",
      "ceo",
      "cto",
      "cio",
      "ciso",
      "cmo",
      "cpo",
      "cfo",
      "coo",
      "cro",
      "founder",
      "co-founder",
      "president",
      "managing director",
    ],
    contains: [
      "chief executive officer",
      "chief technology officer",
      "chief information officer",
      "chief marketing officer",
      "chief product officer",
      "chief financial officer",
      "chief operating officer",
      "chief revenue officer",
      "founder",
      "co-founder",
      "president and ceo",
      "managing director",
    ],
  },
  {
    id: "vp",
    taxonomyLabel: "VP",
    exactTitles: ["vp", "vice president", "svp", "evp"],
    contains: ["vice president", " vp ", "svp", "evp"],
  },
  {
    id: "director",
    taxonomyLabel: "Director",
    exactTitles: ["director", "director of engineering", "director of seo"],
    contains: ["director", "head of"],
  },
  {
    id: "manager",
    taxonomyLabel: "Manager",
    exactTitles: ["manager", "seo manager", "sales manager", "it manager"],
    contains: ["manager", "lead", "leadership"],
    excludes: ["vice president", "director", "chief", "head of"],
  },
  {
    id: "individual-contributor",
    taxonomyLabel: "Individual Contributor",
    exactTitles: [
      "engineer",
      "developer",
      "content creator",
      "content editor",
      "analyst",
      "designer",
      "writer",
    ],
    contains: [
      "engineer",
      "developer",
      "analyst",
      "designer",
      "writer",
      "specialist",
      "architect",
      "editor",
    ],
    excludes: ["director", "vice president", "chief", "head of", "manager"],
  },
  {
    id: "consultant",
    taxonomyLabel: "Consultant",
    exactTitles: ["consultant", "it consultant"],
    contains: ["consultant", "advisor"],
  },
];

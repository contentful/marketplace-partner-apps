/**
 * Pure functions which build the usage report the app sends to Mediaflow when a file is used in, or removed from, an entry.
 */

const UNTITLED_ENTRY = "Untitled entry";
const DEFAULT_ENVIRONMENT = "master";

/**
 * What the app knows about where a file is used
 */
export interface UsageContext {
  userName: string;
  spaceId: string;
  spaceName: string;
  environmentId: string;
  contentTypeName: string;
  entryId: string;
  entryTitle: string | null;
  fieldName: string;
  fieldLocale: string | null;
  webappHost: string;
}

/**
 * The body of POST /file/{id}/usage in the Mediaflow API
 */
export interface UsageReport {
  contact: string;
  project: string;
  date: string;
  amount: string;
  description: string;
  types: string[];
  web: {
    page: string;
    pageName: string;
  };
}

/**
 * @param value - The value of the content type's title field (displayField)
 * @returns The trimmed title, or null if the entry has none yet
 */
export function toEntryTitle(value: unknown): string | null {
  if(typeof value !== "string") {
    return null;
  }
  const title = value.trim();
  return title === "" ? null : title;
}

/**
 * @param context - Where the file is used
 * @returns The link that opens the entry in the Contentful web app, in the right environment and region
 */
export function getEntryUrl(context: Pick<UsageContext, "webappHost" | "spaceId" | "environmentId" | "entryId">): string {
  return "https://" + context.webappHost
    + "/spaces/" + encodeURIComponent(context.spaceId)
    + "/environments/" + encodeURIComponent(context.environmentId)
    + "/entries/" + encodeURIComponent(context.entryId);
}

/**
 * The environment is only named when it is not the default one, where nearly all published content lives
 *
 * @param context - Where the file is used
 * @returns e.g. "Contentful: Website › Blog post › Summer campaign" or "Contentful: Website (staging) › Blog post › Summer campaign"
 */
export function formatUsageProject(context: Pick<UsageContext, "spaceName" | "environmentId" | "contentTypeName" | "entryTitle">): string {
  const environment = context.environmentId === DEFAULT_ENVIRONMENT ? "" : " (" + context.environmentId + ")";
  return "Contentful: " + context.spaceName + environment + " › " + context.contentTypeName + " › " + (context.entryTitle ?? UNTITLED_ENTRY);
}

/**
 * @param date - When the file was used
 * @returns The local date and time as "YYYY-MM-DD HH:mm:ss"
 */
export function formatUsageDate(date: Date): string {
  return Intl.DateTimeFormat("sv-SE", { // sv-SE formats in "YYYY-MM-DD HH:mm:ss"
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Builds a usage report that reads well in Mediaflow's usage history
 *
 * @param context - Where the file is used
 * @param isRemoval - true when the file was removed from the field
 * @param date - When it happened
 * @returns The report to send to Mediaflow
 */
export function buildUsageReport(context: UsageContext, isRemoval: boolean, date: Date): UsageReport {
  const field = "the field \"" + context.fieldName + "\"" + (context.fieldLocale ? " (" + context.fieldLocale + ")" : "");
  return {
    contact: context.userName,
    project: formatUsageProject(context),
    date: formatUsageDate(date),
    amount: "1", // This is called "Edition" in Mediaflow
    description: (isRemoval ? "Removed from " : "Used in ") + field + " in Contentful",
    types: ["web"],
    web: {
      page: getEntryUrl(context),
      pageName: context.entryTitle ?? UNTITLED_ENTRY,
    },
  };
}

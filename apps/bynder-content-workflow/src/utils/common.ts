import { GCTemplate } from "@/type/types";
import showdown from "showdown";

showdown.setFlavor("github");
showdown.setOption("simpleLineBreaks", true);
showdown.setOption("strikethrough", true);

export const converter = new showdown.Converter();
export const US_LOCALE = "en-US";

export function getErrorMsg(error: any) {
  if ("error" in error) {
    return error.error;
  } else if ("message" in error) {
    try {
      const { message, details } = JSON.parse(error.message);
      const errorDetails =
        details.errors?.map((e: any) => e.details).join(", ") || "";
      return `${error?.code || ""}: ${message}: ${errorDetails}`;
    } catch (e) {
      return error.message;
    }
  }
  return error.toString();
}

export function getGCItemLink(id: string, accountId: string) {
  return `https://${accountId}.gathercontent.com/item/${id}`;
}

export function getCFItemLink(
  id: string,
  spaceId: string,
  environmentId: string
) {
  return `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${id}`;
}

export function formatDate(date: string | number) {
  return new Date(date).toLocaleDateString(US_LOCALE, {
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
  });
}

export function filterTemplatesById(templates: GCTemplate[]): GCTemplate[] {
  const uniqueTemplates: GCTemplate[] = [];
  const ids: Set<string> = new Set();

  for (const template of templates) {
    if (!ids.has(template.id)) {
      uniqueTemplates.push(template);
      ids.add(template.id);
    }
  }

  return uniqueTemplates;
}
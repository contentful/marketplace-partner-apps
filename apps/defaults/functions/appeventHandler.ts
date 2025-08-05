import {
  FunctionEventHandler,
  FunctionTypeEnum,
  FunctionEventContext,
  AppEventRequest,
} from "@contentful/node-apps-toolkit";

import { createClient, PlainClientAPI } from "contentful-management";
import { normalizeIds } from "../src/utils";

interface EntryEvent {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: string;
      };
    };
    space: {
      sys: {
        id: string;
      };
    };
  };
}

export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppEventHandler
> = async (event: AppEventRequest, context: FunctionEventContext) => {
  console.log(event);
  if (event.headers["X-Contentful-Topic"].includes("Entry")) {
    const entryEvent = event.body as EntryEvent;

    const entryId = entryEvent.sys.id;
    const contentTypeId = entryEvent.sys.contentType.sys.id;
    console.log("entryId", entryId);
    console.log("contentTypeId", contentTypeId);

    try {
      if (!context.cmaClientOptions) {
        console.error("CMA client options not available");
        return;
      }

      console.log(
        "cmaClientOptions:",
        JSON.stringify(context.cmaClientOptions, null, 2)
      );
      const client: PlainClientAPI = createClient(context.cmaClientOptions, {
        type: "plain",
        defaults: {
          spaceId: context.spaceId,
          environmentId: context.environmentId,
        },
      });

      console.log("got client", client);
      const spaceId = context.spaceId;
      const environmentId = context.environmentId;
      console.log("spaceId", spaceId);
      console.log("environmentId", environmentId);

      const entry = await client.entry.get({
        spaceId,
        environmentId,
        entryId,
      });
      console.log("entry", entry);

      let hasUpdates = false;
      const wasPublished = entry.sys.publishedVersion !== undefined;

      const installationParams: any = context.appInstallationParameters ?? {};

      const contentTypeConfig =
        installationParams.contentTypes?.[contentTypeId];

      if (!contentTypeConfig || !Array.isArray(contentTypeConfig.fields)) {
        console.log(
          `No configuration found for content type ${contentTypeId}, skipping.`
        );
        return;
      }

      for (const fieldConfig of contentTypeConfig.fields) {
        const { fieldId, fieldType, linkType, defaultValue } = fieldConfig;

        if (entry.fields[fieldId]) {
          console.log(`Field ${fieldId} already has a value, skipping`);
          continue;
        }

        const isArrayField =
          fieldType === "AssetArray" || fieldType === "EntryArray";

        console.log(`Setting default value for field: ${fieldId}`);

        try {
          if (fieldType === "Date") {
            let dateValue: string;

            if (defaultValue.type === "current-date") {
              dateValue = new Date().toISOString();
            } else if (
              defaultValue.type === "offset-date" &&
              typeof defaultValue.value === "number"
            ) {
              const now = new Date();
              now.setDate(now.getDate() + defaultValue.value);
              dateValue = now.toISOString();
            } else if (defaultValue.type === "start-of-month") {
              const now = new Date();
              const start = new Date(now.getFullYear(), now.getMonth(), 1);
              dateValue = start.toISOString();
            } else if (
              defaultValue.type === "predefined-date" &&
              defaultValue.value
            ) {
              dateValue = defaultValue.value;
            } else {
              console.log(`Invalid date configuration for field ${fieldId}`);
              continue;
            }

            entry.fields[fieldId] = { "en-US": dateValue };
            hasUpdates = true;
          } else if (
            (linkType === "Asset" || linkType === "Entry") &&
            (defaultValue.type === "asset" || defaultValue.type === "entry") &&
            defaultValue.value
          ) {
            console.log(
              `Raw default value for field ${fieldId}:`,
              defaultValue.value
            );
            const ids: string[] = normalizeIds(defaultValue.value);
            console.log(`Normalized IDs for field ${fieldId}:`, ids);

            if (ids.length === 0) {
              console.warn(
                `No valid IDs provided for field ${fieldId}, skipping default.`
              );
              continue;
            }

            if (isArrayField) {
              entry.fields[fieldId] = {
                "en-US": ids.map((id: string) => ({
                  sys: {
                    type: "Link",
                    linkType,
                    id,
                  },
                })),
              };
            } else {
              entry.fields[fieldId] = {
                "en-US": {
                  sys: {
                    type: "Link",
                    linkType,
                    id: ids[0],
                  },
                },
              };
            }

            hasUpdates = true;
          }
        } catch (fieldError) {
          console.error(`Error setting field ${fieldId}:`, fieldError);
        }
      }

      if (hasUpdates) {
        const updatedEntry = await client.entry.update(
          { spaceId, environmentId, entryId },
          entry
        );

        if (wasPublished) {
          await client.entry.publish(
            { spaceId, environmentId, entryId },
            updatedEntry
          );
          console.log(`Entry ${entryId} updated and republished`);
        } else {
          console.log(`Entry ${entryId} updated`);
        }
      } else {
        console.log(`No updates needed for entry ${entryId}`);
      }

      console.log(
        `Entry processed successfully: ${entryId}, hasUpdates: ${hasUpdates}`
      );
    } catch (error) {
      console.error("Error processing entry:", error);
    }
  }

  return;
};

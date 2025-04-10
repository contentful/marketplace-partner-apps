import React, { useCallback, useEffect, useState } from "react";
import { Paragraph, TextLink, Skeleton } from "@contentful/f36-components";
import { SidebarAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { ContentfulClientApi, createClient, Entry } from "contentful";
import { config } from "../config";

// Define an interface for entry data
interface EntryData {
  id: string;
  title?: string;
  slug?: string;
}

interface AppInstallationParameters {
  previewApiKey: string;
}

const Sidebar = () => {
  // Get the SDK instance
  const sdk = useSDK<SidebarAppSDK<AppInstallationParameters>>();

  // Construct the app URL using space and environment IDs from the SDK
  const appUrl = `https://app.contentful.com/spaces/${
    sdk.ids.space
  }/environments/${sdk.ids.environmentAlias ?? sdk.ids.environment}`;

  // State to hold the Contentful client for preview API
  const [previewClient, setPreviewClient] =
    useState<ContentfulClientApi<undefined> | null>(null);

  // State to determine if the current entry is a root entry
  const [isRoot, setIsRoot] = useState<boolean>(false);

  // State to hold the root entries
  const [rootEntries, setRootEntries] = useState<EntryData[]>([]);

  // State to track loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to get related entries using the preview client
  const getRelatedEntries = useCallback(
    async (id: string): Promise<EntryData[]> => {
      if (!previewClient) {
        console.error("Preview client not available");
        return [];
      }

      try {
        // Fetch entries linked to the given entry ID
        const response = await previewClient.getEntries({
          links_to_entry: id,
          include: 0,
        });

        // Map the response items to EntryData format
        return response.items.map((entry: Entry) => {
          const title =
            entry.fields.title ||
            entry.fields.name ||
            entry.fields.internalName ||
            "Untitled";
          return {
            id: entry.sys.id,
            title: `${title}`,
            slug: entry.fields.slug ? `${entry.fields.slug}` : undefined,
          };
        });
      } catch (error) {
        console.error(error);
        return [];
      }
    },
    [previewClient]
  );

  // Function to get upstream entries recursively with a depth guard and logging
  const getUpstreamEntries = useCallback(
    async (id: string): Promise<EntryData[]> => {
      const rootEntryData: EntryData[] = [];
      let childEntries: EntryData[] = [
        { id, title: undefined, slug: undefined },
      ];
      const checkedEntries: Set<string> = new Set([id]);
      let depth = 0;
      const maxDepth = config.maxDepth;

      // Loop to fetch related entries until no more child entries are found or maxDepth is reached
      while (childEntries.length > 0 && depth < maxDepth) {
        const responses = await Promise.all(
          childEntries.map((entry) => getRelatedEntries(entry.id))
        );

        // Filter and flatten the responses to get new child entries
        childEntries = responses.flatMap((response) =>
          response.filter((item) => {
            if (item && item.id && !checkedEntries.has(item.id)) {
              checkedEntries.add(item.id);
              if (item.slug) {
                if (rootEntryData.length < config.maxEntries) {
                  rootEntryData.push(item);
                }
                return false;
              }
              return true;
            }
            return false;
          })
        );

        // Increment the depth for the next level of recursion
        depth++;

        // Stop processing if we already have the maximum number of entries
        if (rootEntryData.length >= config.maxEntries) {
          break;
        }
      }

      // Log to the console if the maximum depth is reached
      if (depth >= maxDepth && rootEntryData.length === 0) {
        console.log(`Max depth of ${maxDepth} reached for entry ID: ${id}`);
      }

      return rootEntryData;
    },
    [getRelatedEntries]
  );

  // Effect to start the auto-resizer for the SDK window
  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  // Effect to create and set the preview client
  useEffect(() => {
    // Check if the access token is available
    if (!sdk.parameters.installation.previewApiKey) {
      console.error("Preview token not available");
      return;
    }

    // Create the Contentful client using the preview API
    // and set it to the state
    const client = createClient({
      space: sdk.ids.space,
      accessToken: sdk.parameters.installation.previewApiKey,
      host: "preview.contentful.com",
      environment: sdk.ids.environmentAlias ?? sdk.ids.environment,
    });
    setPreviewClient(client);
  }, [
    sdk.ids.space,
    sdk.parameters.installation.previewApiKey,
    sdk.ids.environment,
    sdk.ids.environmentAlias,
  ]);

  // Effect to fetch upstream entries if the current entry is not a root entry
  useEffect(() => {
    const entryId = sdk.ids.entry;
    if (sdk.entry.fields.slug) {
      setIsRoot(true);
    }
    if (previewClient) {
      const fetchData = async () => {
        setIsLoading(true); // Set loading state to true
        const data = await getUpstreamEntries(entryId);
        setRootEntries(data);
        setIsLoading(false); // Set loading state to false
      };
      fetchData().catch((error) => {
        console.error(error);
        setIsLoading(false); // Ensure loading state is reset on error
      });
    }
  }, [previewClient, sdk.ids.entry, sdk.entry.fields.slug, getUpstreamEntries]);

  // Render the component based on whether the current entry is a root entry
  if (isLoading) {
    return (
      <Skeleton.Container>
        <Skeleton.BodyText numberOfLines={3} />
      </Skeleton.Container>
    );
  }

  if (isRoot) {
    return <Paragraph>This item is a Page level entry.</Paragraph>;
  } else {
    return (
      <>
        {rootEntries.length === 0 && (
          <Paragraph>This item has no Page level entries.</Paragraph>
        )}
        <ul>
          {rootEntries.map((item) => (
            <li key={item.id}>
              <TextLink href={`${appUrl}/entries/${item.id}`} target="_blank">
                {item.title}
              </TextLink>
            </li>
          ))}
        </ul>
      </>
    );
  }
};

export default Sidebar;

import { EntryCard } from "@contentful/f36-components";
import { useEffect, useState } from "react";
import { getEntryTitle, getEntryDescription } from "../utils/entryHelpers";
import { useSDK } from "@contentful/react-apps-toolkit";

interface Props {
  id: string;
  fetchEntry: (id: string) => Promise<any>;
  contentTypes: any[];
}

const AsyncEntryPreview = ({ id, fetchEntry, contentTypes }: Props) => {
  const [entry, setEntry] = useState<any | null>(null);
  const sdk = useSDK();

  useEffect(() => {
    let mounted = true;
    fetchEntry(id).then((e) => mounted && setEntry(e ?? null));
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!entry) return <EntryCard size="small" isLoading title={id} />;

  const title = getEntryTitle(entry, contentTypes) ?? id;
  const description = getEntryDescription(entry, [
    "internalName",
    "internal_name",
    "internal name",
    "title",
    "name",
    "headline",
    "nameInternal",
    "name_internal",
  ]);

  return (
    <EntryCard
      size="small"
      title={title}
      description={description}
      contentType={entry.sys?.contentType?.sys?.id || "Entry"}
      status={entry.sys?.publishedVersion ? "published" : "draft"}
      onClick={() => {
        (sdk as any).navigator?.openEntry?.(id, {
          slideIn: { waitForClose: true },
        });
      }}
    />
  );
};

export default AsyncEntryPreview;

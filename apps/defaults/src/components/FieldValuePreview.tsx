import {
  Paragraph,
  Flex,
  Spinner,
  IconButton,
  EntityStatusBadge,
} from "@contentful/f36-components";
import { ExternalLinkIcon } from "@contentful/f36-icons";
import { useEffect, useState } from "react";
import { getEntryTitle } from "../utils/entryHelpers";
import { css } from "emotion";
import { FieldDefaultConfig } from "../types/config";
import { useSDK } from "@contentful/react-apps-toolkit";
import { useAppStore } from "../store/useAppStore";

interface Props {
  fieldType: FieldDefaultConfig["fieldType"];
  fieldConfig: any | undefined;
  variant?: "full" | "label" | "preview" | "status";
}

const FieldValuePreview = ({
  fieldType,
  fieldConfig,
  variant = "full",
}: Props) => {
  const sdk = useSDK();

  const getAssetPreview = useAppStore((s: any) => s.getAssetPreview);
  const getEntryPreview = useAppStore((s: any) => s.getEntryPreview);
  const contentTypes = useAppStore((s: any) => s.contentTypes);

  const [asset, setAsset] = useState<any | null>(null);
  const [entry, setEntry] = useState<any | null>(null);

  const assetVal =
    fieldType === "Asset" ? fieldConfig?.defaultValue?.value : undefined;
  const entryVal =
    fieldType === "Entry" ? fieldConfig?.defaultValue?.value : undefined;

  const assetId = Array.isArray(assetVal) ? undefined : assetVal;
  const assetIds = Array.isArray(assetVal) ? assetVal : undefined;

  const entryId = Array.isArray(entryVal) ? undefined : entryVal;
  const entryIds = Array.isArray(entryVal) ? entryVal : undefined;

  const effectiveAssetId =
    assetId ?? (assetIds?.length === 1 ? assetIds[0] : undefined);
  const effectiveEntryId =
    entryId ?? (entryIds?.length === 1 ? entryIds[0] : undefined);

  useEffect(() => {
    let mounted = true;

    if (fieldType === "Asset" && effectiveAssetId) {
      getAssetPreview(effectiveAssetId).then(
        (a: any) => mounted && setAsset(a ?? null)
      );
    } else {
      setAsset(null);
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldType, effectiveAssetId]);

  useEffect(() => {
    let mounted = true;

    if (fieldType === "Entry" && effectiveEntryId) {
      getEntryPreview(effectiveEntryId).then(
        (e: any) => mounted && setEntry(e ?? null)
      );
    } else {
      setEntry(null);
    }

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldType, effectiveEntryId]);

  if (!fieldConfig) {
    return <Paragraph marginBottom="none">—</Paragraph>;
  }

  if (fieldType === "Asset") {
    if (assetIds && assetIds.length > 1) {
      return (
        <Paragraph marginBottom="none">
          {assetIds.length} assets selected
        </Paragraph>
      );
    }

    if (!effectiveAssetId) return <Paragraph marginBottom="none">—</Paragraph>;

    if (!asset)
      return (
        <Flex alignItems="center" gap="spacingXs">
          <Spinner size="small" /> Loading…
        </Flex>
      );

    const fileField: any = asset.fields?.file;
    const firstLocale =
      fileField && typeof fileField === "object"
        ? Object.keys(fileField)[0]
        : undefined;
    const fileForLocale = firstLocale ? fileField[firstLocale] : undefined;
    const isImage = fileForLocale?.contentType?.startsWith("image/");
    const rawUrl: string | undefined = fileForLocale?.url;
    const resolvedUrl =
      rawUrl && rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl;
    const thumbUrl =
      isImage && resolvedUrl ? `${resolvedUrl}?w=40&h=40&fit=thumb` : undefined;

    const title =
      asset.fields?.title?.["en-US"] || asset.fields?.title || effectiveAssetId;

    const entityStatus = (() => {
      const sys = asset.sys ?? {};
      if (sys.deletedAt || sys.deletedVersion) return "deleted";
      if (sys.archivedVersion) return "archived";
      if (sys.publishedVersion) {
        if (sys.version && sys.version > sys.publishedVersion + 1)
          return "changed";
        return "published";
      }
      return "draft";
    })();

    switch (variant) {
      case "label": {
        return (
          <span
            className={css({
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            })}
          >
            {title}
          </span>
        );
      }
      case "preview": {
        return thumbUrl ? (
          <img
            src={thumbUrl}
            alt={title}
            className={css({
              width: 24,
              height: 24,
              objectFit: "cover",
              borderRadius: 3,
              margin: "0 auto",
            })}
          />
        ) : (
          <Paragraph marginBottom="none">—</Paragraph>
        );
      }
      case "status": {
        return <EntityStatusBadge entityStatus={entityStatus as any} />;
      }
      case "full":
      default: {
        return (
          <Flex
            alignItems="center"
            gap="spacingXs"
            className={css({ maxWidth: 500, overflow: "hidden" })}
          >
            {thumbUrl && (
              <img
                src={thumbUrl}
                alt={title}
                className={css({
                  width: 24,
                  height: 24,
                  objectFit: "cover",
                  borderRadius: 3,
                  margin: "0 auto",
                })}
              />
            )}
            <EntityStatusBadge entityStatus={entityStatus as any} />
            <span
              className={css({
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              })}
            >
              {title}
            </span>
            <IconButton
              variant="transparent"
              size="small"
              icon={<ExternalLinkIcon />}
              aria-label="Open asset"
              withTooltip
              tooltipProps={{ content: "Open asset" }}
              onClick={(e) => {
                e.stopPropagation();
                (sdk as any).navigator?.openAsset?.(effectiveAssetId, {
                  slideIn: { waitForClose: true },
                });
              }}
              style={{ flexShrink: 0 }}
            />
          </Flex>
        );
      }
    }
  }

  if (fieldType === "Entry") {
    if (entryIds && entryIds.length > 1) {
      return (
        <Paragraph marginBottom="none">
          {entryIds.length} entries selected
        </Paragraph>
      );
    }

    if (!effectiveEntryId) return <Paragraph marginBottom="none">—</Paragraph>;

    if (!entry)
      return (
        <Flex alignItems="center" gap="spacingXs">
          <Spinner size="small" /> Loading…
        </Flex>
      );

    const title = getEntryTitle(entry, contentTypes) ?? effectiveEntryId;

    const entityStatus = (() => {
      const sys = entry.sys ?? {};
      if (sys.deletedAt || sys.deletedVersion) return "deleted";
      if (sys.archivedVersion) return "archived";
      if (sys.publishedVersion) {
        if (sys.version && sys.version > sys.publishedVersion + 1)
          return "changed";
        return "published";
      }
      return "draft";
    })();

    const ctIdOfEntry = entry?.sys?.contentType?.sys?.id;
    const ctDefOfEntry = contentTypes.find(
      (c: any) => c.sys.id === ctIdOfEntry
    );
    const ctName = ctDefOfEntry?.name ?? ctIdOfEntry ?? "—";

    switch (variant) {
      case "label":
        return (
          <span
            className={css({
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            })}
          >
            {title}
          </span>
        );
      case "preview":
        return (
          <span
            className={css({
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            })}
          >
            {ctName}
          </span>
        );
      case "status":
        return <EntityStatusBadge entityStatus={entityStatus as any} />;
      case "full":
      default:
        return (
          <Flex
            alignItems="center"
            gap="spacingXs"
            className={css({ maxWidth: 500, overflow: "hidden" })}
          >
            <EntityStatusBadge entityStatus={entityStatus as any} />
            <span
              className={css({
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
              })}
            >
              {title}
            </span>
            <IconButton
              variant="transparent"
              size="small"
              icon={<ExternalLinkIcon />}
              aria-label="Open entry"
              withTooltip
              tooltipProps={{ content: "Open entry" }}
              onClick={(e) => {
                e.stopPropagation();
                (sdk as any).navigator?.openEntry?.(effectiveEntryId, {
                  slideIn: { waitForClose: true },
                });
              }}
              style={{ flexShrink: 0 }}
            />
          </Flex>
        );
    }
  }

  if (fieldType === "Date") {
    const dv = fieldConfig.defaultValue;
    if (!dv) return <Paragraph marginBottom="none">—</Paragraph>;

    const { label, resolved } = (() => {
      const now = new Date();
      switch (dv.type) {
        case "current-date": {
          const label = "Current date";
          return { label, resolved: now.toISOString().split("T")[0] };
        }
        case "offset-date": {
          const offsetNum = Number(dv.value ?? 0);
          const unit = "days";
          const label =
            offsetNum === 0
              ? "Current date"
              : `Current date ${offsetNum > 0 ? "+" : "-"}${Math.abs(
                  offsetNum
                )} ${unit}`;
          const date = new Date(now);
          date.setDate(now.getDate() + offsetNum);
          return { label, resolved: date.toISOString().split("T")[0] };
        }
        case "start-of-month": {
          const date = new Date(now.getFullYear(), now.getMonth(), 1);
          return {
            label: "Start of month",
            resolved: date.toISOString().split("T")[0],
          };
        }
        default: {
          if (typeof dv.value === "string")
            return { label: dv.value, resolved: dv.value };
          return { label: "Date", resolved: "" };
        }
      }
    })();

    switch (variant) {
      case "label":
        return <span>{label}</span>;
      case "preview":
        return resolved ? (
          <span>{resolved}</span>
        ) : (
          <Paragraph marginBottom="none">—</Paragraph>
        );
      case "status":
        return <Paragraph marginBottom="none">—</Paragraph>;
      case "full":
      default:
        return (
          <Flex
            alignItems="center"
            gap="spacingXs"
            className={css({ maxWidth: 500, overflow: "hidden" })}
          >
            <span>{label}</span>
            {resolved && (
              <span className={css({ whiteSpace: "nowrap", fontSize: "12px" })}>
                (resolves to {resolved})
              </span>
            )}
          </Flex>
        );
    }
  }

  if (fieldType === "JSON") {
    const val = fieldConfig.defaultValue?.value;
    const str =
      val === undefined
        ? "—"
        : typeof val === "string"
        ? val
        : JSON.stringify(val);

    switch (variant) {
      case "label":
      case "full": {
        const display = str.length > 70 ? str.slice(0, 67) + "…" : str;
        return <Paragraph marginBottom="none">{display}</Paragraph>;
      }
      case "preview":
      case "status":
        return <Paragraph marginBottom="none">—</Paragraph>;
    }
  }

  return <Paragraph marginBottom="none">—</Paragraph>;
};

export default FieldValuePreview;

import {
  Card,
  Flex,
  Heading,
  Badge,
  IconButton,
  Paragraph,
  Tooltip,
} from "@contentful/f36-components";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
} from "@contentful/f36-icons";
import { type MouseEvent } from "react";
import { css } from "emotion";
import tokens from "@contentful/f36-tokens";
import FieldTable from "./FieldTable";
import { useAppStore } from "../store/useAppStore";
import { useSDK } from "@contentful/react-apps-toolkit";
import { getContentTypeUrl } from "../utils";

interface Props {
  ct: any;
}

const ContentTypeCard = ({ ct }: Props) => {
  const sdk = useSDK();
  const ctId = ct.sys.id;

  const parameters = useAppStore((s: any) => s.parameters);
  const expandedState = useAppStore((s: any) => s.expanded[ctId]);
  const toggleExpand = useAppStore((s: any) => s.toggleExpand);

  const ctConfig = parameters.contentTypes?.[ctId] ?? {
    enabled: false,
    fields: {},
  };

  const configuredCount = Object.values(ctConfig.fields).filter(
    (fieldCfg: any) => {
      if (!fieldCfg) return false;
      if (fieldCfg.fieldType === "Date") return true;
      return (
        fieldCfg.defaultValue?.value !== undefined &&
        fieldCfg.defaultValue?.value !== ""
      );
    }
  ).length;

  const expandedValue =
    expandedState !== undefined ? expandedState : ctConfig.enabled;

  const handleHeaderClick = (e: MouseEvent) => {
    e.stopPropagation();
    toggleExpand(ctId);
  };

  const cardClass = css({
    transition:
      "box-shadow 0.2s ease, border 0.2s ease, background 0.2s ease, transform 0.2s ease",
    background: tokens.gray100,
    border: `1px solid ${ctConfig.enabled ? tokens.gray400 : tokens.gray200}`,
    boxShadow: ctConfig.enabled ? `0 0 0 1px ${tokens.gray400}` : "none",
    width: "100%",
    minWidth: 0,
    overflowX: "auto",
    "&:hover": {
      background: tokens.gray200,
      border: `1px solid ${ctConfig.enabled ? tokens.gray400 : tokens.gray300}`,
      boxShadow: ctConfig.enabled
        ? `0 0 0 1px ${tokens.gray700}`
        : `0 1px 3px 0 ${tokens.gray300}`,
    },
  });

  return (
    <Card padding="default" className={cardClass}>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        marginBottom={expandedValue ? "spacingM" : "none"}
        style={{ cursor: "pointer", userSelect: "none" }}
        role="button"
        aria-expanded={expandedValue}
        tabIndex={0}
        onClick={handleHeaderClick}
      >
        <Flex
          alignItems="center"
          gap="spacingS"
          onClick={handleHeaderClick}
          style={{ flex: 1 }}
        >
          <Heading
            as="h5"
            marginBottom="none"
            style={{ marginTop: 0, marginBottom: 0, pointerEvents: "none" }}
          >
            {ct.name}
          </Heading>
          {ct.description && (
            <Paragraph
              marginBottom="none"
              fontColor="gray500"
              style={{
                maxWidth: 550,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {ct.description}
            </Paragraph>
          )}
        </Flex>

        <Flex alignItems="center" gap="spacingM">
          {configuredCount > 0 && (
            <Badge variant="positive" size="small">
              {configuredCount} values
            </Badge>
          )}

          <Badge variant="secondary" size="small">
            {ct.fields.length} fields
          </Badge>

          {sdk && (
            <Tooltip content="Open content type">
              <IconButton
                as="a"
                href={getContentTypeUrl(sdk, ctId)}
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkIcon />}
                variant="transparent"
                aria-label="Open content type"
                onClick={(e: MouseEvent) => e.stopPropagation()}
              />
            </Tooltip>
          )}
          <IconButton
            variant="transparent"
            icon={expandedValue ? <ChevronDownIcon /> : <ChevronRightIcon />}
            aria-label="Toggle fields visibility"
            onClick={(e: MouseEvent) => {
              e.stopPropagation();
              handleHeaderClick(e);
            }}
          />
        </Flex>
      </Flex>

      {expandedValue && <FieldTable ctId={ctId} fields={ct.fields} />}
    </Card>
  );
};

export default ContentTypeCard;

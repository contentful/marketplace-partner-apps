/**
 * About view — reachable from the user-profile dropdown.
 *
 * Renders in two layouts depending on the host:
 * - `variant="panel"` (default): narrow vertical card layout for the
 *   field-check dialog sidepanel (380px column). Uses the shared
 *   `SidebarPanelShell` chrome.
 * - `variant="page"`: wide page layout for the app config screen — back
 *   link, hero strip, two-column metadata grid, full-width links bar.
 *
 * Both layouts share the same data: app name + version, integration
 * metadata, browser user-agent, and a row of useful external links.
 */

import React from "react";
import {
  Badge,
  Button,
  Card,
  Flex,
  Heading,
  Paragraph,
  Stack,
  Subheading,
  TextLink,
} from "@contentful/f36-components";
import { ArrowSquareOutIcon, CaretLeftIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { SidebarPanelShell } from "../SidebarPanelShell/SidebarPanelShell";
import { APP_DISPLAY_NAME, APP_VERSION } from "../../utils/appMeta";
import {
  MARKUP_DEVELOPER_PORTAL_URL,
  MARKUP_STATUS_URL,
  MARKUP_SUPPORT_URL,
  MARKUP_TERMS_URL,
} from "../../utils/markupUrls";

export type AboutViewVariant = "panel" | "page";

export interface AboutViewProps {
  onBack: () => void;
  /** "panel" for the dialog sidebar (default). "page" for the config screen. */
  variant?: AboutViewVariant;
}

interface UsefulLink {
  href: string;
  label: string;
}

const USEFUL_LINKS: UsefulLink[] = [
  { href: MARKUP_DEVELOPER_PORTAL_URL, label: "Docs" },
  { href: MARKUP_SUPPORT_URL, label: "Support" },
  { href: MARKUP_STATUS_URL, label: "Status" },
  { href: MARKUP_TERMS_URL, label: "Terms" },
];

// ─── shared styles ─────────────────────────────────────────────────────────
const SectionLabel = styled.div`
  font-size: ${tokens.fontSizeS};
  font-weight: ${tokens.fontWeightDemiBold};
  color: ${tokens.gray600};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${tokens.spacing2Xs};
`;

const MetaRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${tokens.spacingS};
  padding: ${tokens.spacing2Xs} 0;
  font-size: ${tokens.fontSizeM};
  color: ${tokens.gray800};

  & + & {
    border-top: 1px dashed ${tokens.gray200};
  }
`;

const MetaKey = styled.span`
  color: ${tokens.gray600};
`;

const MetaValue = styled.span`
  font-weight: ${tokens.fontWeightMedium};
  color: ${tokens.gray800};
  word-break: break-word;
  text-align: right;
`;

const UserAgentBlock = styled.div`
  margin-top: ${tokens.spacing2Xs};
  padding: ${tokens.spacingXs} ${tokens.spacingS};
  background: ${tokens.gray100};
  border-radius: ${tokens.borderRadiusSmall};
  font-size: ${tokens.fontSizeS};
  font-family: ${tokens.fontStackMonospace};
  color: ${tokens.gray700};
  word-break: break-word;
  white-space: normal;
`;

// ─── panel-only links row ─────────────────────────────────────────────────
const PanelLinksRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacingM};
  align-items: center;
`;

// ─── page variant ──────────────────────────────────────────────────────────
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingM};
  width: 100%;
`;

const BackBar = styled.div`
  display: flex;
  align-items: center;
`;

const Hero = styled.section`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingL};
  padding: ${tokens.spacingL} ${tokens.spacingXl};
  background: linear-gradient(135deg, ${tokens.colorWhite} 0%, ${tokens.gray100} 100%);
  border: 1px solid ${tokens.gray200};
  border-radius: ${tokens.borderRadiusMedium};

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
    padding: ${tokens.spacingL};
  }
`;

const HeroLogo = styled.img`
  height: 64px;
  width: auto;
  flex-shrink: 0;
`;

const HeroBody = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing2Xs};
`;

const HeroBadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacingXs};
  margin-top: ${tokens.spacing2Xs};
`;

const MetadataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${tokens.spacingM};

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const PageLinksRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacingL};
  align-items: center;
  padding: ${tokens.spacingS} 0;
`;

// ─── shared content blocks ────────────────────────────────────────────────
function IntegrationCard() {
  return (
    <Card padding="default">
      <SectionLabel>Integration</SectionLabel>
      <MetaRow>
        <MetaKey>App</MetaKey>
        <MetaValue>{APP_DISPLAY_NAME}</MetaValue>
      </MetaRow>
      <MetaRow>
        <MetaKey>Version</MetaKey>
        <MetaValue>{APP_VERSION}</MetaValue>
      </MetaRow>
      <MetaRow>
        <MetaKey>Host</MetaKey>
        <MetaValue>Contentful</MetaValue>
      </MetaRow>
    </Card>
  );
}

function BrowserCard() {
  const userAgent = navigator.userAgent;
  return (
    <Card padding="default">
      <SectionLabel>Browser</SectionLabel>
      <UserAgentBlock title={userAgent}>{userAgent}</UserAgentBlock>
    </Card>
  );
}

function UsefulLinkList() {
  return (
    <>
      {USEFUL_LINKS.map((link) => (
        <TextLink
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          icon={<ArrowSquareOutIcon />}
          alignIcon="end"
        >
          {link.label}
        </TextLink>
      ))}
    </>
  );
}

// ─── public component ─────────────────────────────────────────────────────
export const AboutView: React.FC<AboutViewProps> = ({ onBack, variant = "panel" }) => {
  if (variant === "page") {
    return (
      <PageContainer>
        <BackBar>
          <Button variant="transparent" size="small" startIcon={<CaretLeftIcon />} onClick={onBack}>
            Back to configuration
          </Button>
        </BackBar>

        <Hero>
          <HeroLogo src="logos/markup_Logo_Mark_Coral.svg" alt="Markup AI" />
          <HeroBody>
            <Heading as="h2" marginBottom="none">
              {APP_DISPLAY_NAME}
            </Heading>
            <Paragraph marginBottom="none" style={{ color: tokens.gray700 }}>
              Scan, score, and rewrite content at scale — directly inside Contentful.
            </Paragraph>
            <HeroBadgeRow>
              <Badge variant="primary">v{APP_VERSION}</Badge>
              <Badge variant="secondary">Contentful integration</Badge>
            </HeroBadgeRow>
          </HeroBody>
        </Hero>

        <MetadataGrid>
          <IntegrationCard />
          <BrowserCard />
        </MetadataGrid>

        <Card padding="default">
          <Subheading marginBottom="spacingXs">Useful links</Subheading>
          <PageLinksRow>
            <UsefulLinkList />
          </PageLinksRow>
        </Card>
      </PageContainer>
    );
  }

  // panel variant (default — used by the field-check dialog sidebar)
  return (
    <SidebarPanelShell title="About" onBack={onBack}>
      <Stack flexDirection="column" spacing="spacingM" alignItems="stretch">
        <Flex alignItems="center" gap="spacingS">
          <img
            src="logos/markup_Logo_Mark_Coral.svg"
            alt="Markup AI"
            style={{ height: 32, width: "auto" }}
          />
          <Stack flexDirection="column" spacing="none" alignItems="flex-start">
            <Heading as="h2" marginBottom="none">
              {APP_DISPLAY_NAME}
            </Heading>
            <Paragraph marginBottom="none" style={{ color: tokens.gray600 }}>
              Version {APP_VERSION}
            </Paragraph>
          </Stack>
        </Flex>

        <IntegrationCard />
        <BrowserCard />

        <Card padding="default">
          <Subheading marginBottom="spacingXs">Useful links</Subheading>
          <PanelLinksRow>
            <UsefulLinkList />
          </PanelLinksRow>
        </Card>
      </Stack>
    </SidebarPanelShell>
  );
};

export default AboutView;

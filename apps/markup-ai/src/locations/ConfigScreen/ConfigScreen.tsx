import React, { useState, useEffect, useCallback } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Box, Checkbox, Heading, Paragraph, Spinner, Subheading } from "@contentful/f36-components";
import { createClient } from "contentful-management";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import {
  ConfigScreenWrapper,
  ContentArea,
  TopCover,
  FooterLogo,
  FooterLogoImage,
} from "./ConfigScreen.styles";
import { ContentTypeStyleGuideSelect, UserProfileButton } from "./components";
import {
  buildActiveFieldsMap,
  collectTextFieldsForContentType,
  type FieldInfo,
} from "./ConfigScreen.utils";
import { AboutView } from "../../components/About/AboutView";
import { useAuth } from "../../contexts/AuthContext";
import { useStyleGuides } from "../../hooks/useStyleGuides";
import type {
  AppInstallationParameters,
  ContentTypeSettings,
  ContentTypeSettingsMap,
} from "../../types/appConfig";
export type { AppInstallationParameters } from "../../types/appConfig";

const IntroSection = styled.div`
  margin-bottom: ${tokens.spacingL};
`;

const IntroHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${tokens.spacingM};
  margin-bottom: ${tokens.spacingS};
`;

const SectionHeader = styled.div`
  margin-bottom: ${tokens.spacingM};
  padding-top: ${tokens.spacingM};
  border-top: 1px solid ${tokens.gray200};
`;

const ContentTypeBlock = styled.div`
  border: 1px solid ${tokens.gray200};
  border-radius: ${tokens.borderRadiusMedium};
  padding: ${tokens.spacingM};
  margin-bottom: ${tokens.spacingM};
  background: ${tokens.colorWhite};
`;

const ContentTypeHeader = styled.div`
  margin-bottom: ${tokens.spacingS};
`;

const FieldList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacing2Xs};
`;

type TextFieldsState = Record<string, FieldInfo[]>;

export const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const { isAuthenticated, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [textFields, setTextFields] = useState<TextFieldsState>({});
  const [contentTypeSettings, setContentTypeSettings] = useState<ContentTypeSettingsMap>({});
  const [activeView, setActiveView] = useState<"config" | "about">("config");

  // Fetch style guide options ONCE for the whole screen so we never make
  // multiple `/style-agent/style-guides` calls when there are many content types.
  const {
    styleGuides,
    isLoading: styleGuidesLoading,
    isError: styleGuidesError,
  } = useStyleGuides(token);

  const onConfigure = useCallback(() => {
    const newConfig: {
      parameters: AppInstallationParameters;
      targetState: {
        EditorInterface: Record<string, { controls: { fieldId: string }[] }>;
      };
    } = {
      parameters: { contentTypeSettings },
      targetState: {
        EditorInterface: {},
      },
    };

    Object.entries(textFields).forEach(([contentTypeId, fields]) => {
      const checkedFields = fields.filter((field) => field.isChecked);
      if (checkedFields.length > 0) {
        newConfig.targetState.EditorInterface[contentTypeId] = {
          controls: checkedFields.map((field) => ({ fieldId: field.id })),
        };
      }
    });

    return newConfig;
  }, [textFields, contentTypeSettings]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    void (async () => {
      const { app, cmaAdapter, ids } = sdk;

      const richTextFields: TextFieldsState = {};
      const activeFields: Record<string, boolean> = {};

      const cma = createClient(
        { apiAdapter: cmaAdapter },
        {
          type: "plain",
          defaults: {
            environmentId: ids.environmentAlias ?? ids.environment,
            spaceId: ids.space,
          },
        },
      );

      const content = await cma.contentType.getMany({ query: { limit: 1000 } });
      const currentState = await app.getCurrentState();

      Object.assign(activeFields, buildActiveFieldsMap(currentState?.EditorInterface));

      // Hydrate any persisted per-content-type defaults from app params.
      const currentParams: AppInstallationParameters | null = await app.getParameters();
      if (currentParams?.contentTypeSettings) {
        setContentTypeSettings(currentParams.contentTypeSettings);
      }

      content.items.forEach((item) => {
        const fieldsForContentType = collectTextFieldsForContentType(item, activeFields);
        if (fieldsForContentType.length > 0) {
          richTextFields[item.sys.id] = fieldsForContentType;
        }
      });

      setTextFields(richTextFields);
      setLoading(false);
      await app.setReady();
    })();
  }, [sdk]);

  const handleCheckboxChange = useCallback((fieldId: string, contentTypeId: string) => {
    setTextFields((prev) => {
      const next = { ...prev };
      next[contentTypeId] = next[contentTypeId].map((field) =>
        field.id === fieldId ? { ...field, isChecked: !field.isChecked } : field,
      );
      return next;
    });
  }, []);

  const handleStyleGuideChange = useCallback(
    (contentTypeId: string, styleGuideId: string | null) => {
      setContentTypeSettings((prev) => {
        if (styleGuideId) {
          const existing: ContentTypeSettings = prev[contentTypeId] ?? { styleGuide: null };
          return { ...prev, [contentTypeId]: { ...existing, styleGuide: styleGuideId } };
        }
        if (!prev[contentTypeId]) return prev;
        // Rebuild without the entry so the params stay tidy when cleared.
        return Object.fromEntries(
          Object.entries(prev).filter(([key]) => key !== contentTypeId),
        ) as ContentTypeSettingsMap;
      });
    },
    [],
  );

  if (loading) {
    return (
      <Box marginTop="spacingXl" style={{ display: "flex", justifyContent: "center" }}>
        <Spinner size="large" />
      </Box>
    );
  }

  if (activeView === "about") {
    return (
      <ConfigScreenWrapper>
        <TopCover />
        <ContentArea>
          <AboutView
            variant="page"
            onBack={() => {
              setActiveView("config");
            }}
          />
        </ContentArea>
      </ConfigScreenWrapper>
    );
  }

  return (
    <ConfigScreenWrapper>
      <TopCover />
      <ContentArea>
        <IntroSection>
          <IntroHeader>
            <Heading>Markup AI App</Heading>
            <UserProfileButton
              onOpenAbout={() => {
                setActiveView("about");
              }}
            />
          </IntroHeader>
          <Paragraph>
            Scan, score, and rewrite content at scale instantly. With our Content Guardian Agents℠
            and APIs, you can ensure every word meets your brand and compliance standards across
            your organization.
          </Paragraph>
        </IntroSection>

        <SectionHeader>
          <Subheading>Assign to Content Types</Subheading>
          <Paragraph>
            Choose which content types and fields to use with Markup AI. Authors will see a Check
            button on the selected fields. Optionally set a default style guide that applies to
            every field of a content type — authors can override it per field.
          </Paragraph>
        </SectionHeader>

        {Object.entries(textFields).map(([contentTypeId, fields]) => {
          const contentTypeName = fields[0]?.modelName || contentTypeId;
          return (
            <ContentTypeBlock key={contentTypeId}>
              <ContentTypeHeader>
                <Subheading>{contentTypeName}</Subheading>
              </ContentTypeHeader>
              <FieldList>
                {fields.map((field) => (
                  <Checkbox
                    key={field.id}
                    isChecked={field.isChecked}
                    onChange={() => {
                      handleCheckboxChange(field.id, contentTypeId);
                    }}
                  >
                    {field.name} <span style={{ color: tokens.gray500 }}>({field.type})</span>
                  </Checkbox>
                ))}
              </FieldList>
              <ContentTypeStyleGuideSelect
                contentTypeId={contentTypeId}
                value={contentTypeSettings[contentTypeId]?.styleGuide ?? null}
                styleGuides={styleGuides}
                isLoading={styleGuidesLoading}
                isError={styleGuidesError}
                isAuthenticated={isAuthenticated}
                onChange={handleStyleGuideChange}
              />
            </ContentTypeBlock>
          );
        })}

        <FooterLogo href="https://markup.ai" target="_blank" rel="noopener noreferrer">
          <FooterLogoImage
            src="logos/markupai-logo-tagline-SM_horz-stacked-color.svg"
            alt="Markup AI"
          />
        </FooterLogo>
      </ContentArea>
    </ConfigScreenWrapper>
  );
};

export default ConfigScreen;

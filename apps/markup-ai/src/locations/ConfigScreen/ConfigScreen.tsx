import React, { useState, useEffect, useCallback } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Box, Spinner } from "@contentful/f36-components";
import { createClient } from "contentful-management";
import {
  ConfigScreenWrapper,
  ContentArea,
  TopCover,
  FooterLogo,
  FooterLogoImage,
} from "./ConfigScreen.styles";
import { UserProfileButton, ContentTypeAccordion } from "./components";
import { useAuth } from "../../contexts/AuthContext";
import { useConfigData } from "../../contexts/ConfigDataContext";
import type {
  AppInstallationParameters,
  ContentTypeSettings,
  ContentTypeSettingsMap,
} from "../../types/appConfig";
import { DEFAULT_CONTENT_TYPE_SETTINGS } from "../../types/appConfig";
export type { AppInstallationParameters } from "../../types/appConfig";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";

// App intro section
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

const AppTitle = styled.h1`
  font-family: ${tokens.fontStackPrimary};
  font-weight: ${tokens.fontWeightDemiBold};
  font-size: ${tokens.fontSizeL};
  line-height: ${tokens.lineHeightL};
  color: ${tokens.gray900};
  margin: 0;
`;

const IntroDescription = styled.p`
  font-family: ${tokens.fontStackPrimary};
  font-size: ${tokens.fontSizeS};
  line-height: ${tokens.lineHeightS};
  color: ${tokens.gray700};
  margin: 0;
`;

// Section header for content types
const SectionHeader = styled.div`
  margin-bottom: ${tokens.spacingM};
  padding-top: ${tokens.spacingM};
  border-top: 1px solid ${tokens.gray200};
`;

const SectionTitle = styled.h2`
  font-family: ${tokens.fontStackPrimary};
  font-weight: ${tokens.fontWeightDemiBold};
  font-size: ${tokens.fontSizeM};
  line-height: ${tokens.lineHeightM};
  color: ${tokens.gray900};
  margin: 0 0 ${tokens.spacingXs} 0;
`;

const SectionDescription = styled.p`
  font-family: ${tokens.fontStackPrimary};
  font-size: ${tokens.fontSizeS};
  line-height: ${tokens.lineHeightS};
  color: ${tokens.gray600};
  margin: 0;
`;

const ContentTypesContainer = styled.div`
  margin-bottom: ${tokens.spacingM};
`;

interface FieldInfo {
  id: string;
  name: string;
  type: string;
  modelName: string;
  isChecked: boolean;
}

interface TextFieldsState {
  [contentTypeId: string]: FieldInfo[];
}

export const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [loading, setLoading] = useState(true);
  const [textFields, setTextFields] = useState<TextFieldsState>({});
  const [contentTypeSettings, setContentTypeSettings] = useState<ContentTypeSettingsMap>({});
  const [expandedContentType, setExpandedContentType] = useState<string | null>(null);

  // Auth and config data for showing settings when signed in
  const { isAuthenticated, loginWithPopup } = useAuth();
  const { constants, styleGuides, isLoading: configDataLoading } = useConfigData();

  const handleSignIn = useCallback(async () => {
    try {
      await loginWithPopup();
    } catch (err) {
      console.error("[ConfigScreen] Sign in failed:", err);
    }
  }, [loginWithPopup]);

  const onConfigure = useCallback(() => {
    const newConfig: {
      parameters: AppInstallationParameters;
      targetState: {
        EditorInterface: {
          [contentTypeId: string]: {
            controls: { fieldId: string }[];
          };
        };
      };
    } = {
      parameters: {
        contentTypeSettings: contentTypeSettings,
      },
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

      // Fetch all content types
      const content = await cma.contentType.getMany({ query: { limit: 1000 } });

      // Get current app state to determine which fields are already enabled
      const currentState = await app.getCurrentState();

      if (currentState?.EditorInterface) {
        Object.entries(currentState.EditorInterface).forEach(([contentTypeId, value]) => {
          const editorInterface = value as { controls?: { fieldId: string }[] };
          if (editorInterface.controls) {
            editorInterface.controls.forEach((control) => {
              activeFields[`${contentTypeId}${control.fieldId}`] = true;
            });
          }
        });
      }

      // Load existing content type settings from app parameters
      const currentParams = await app.getParameters();
      if (currentParams?.contentTypeSettings) {
        setContentTypeSettings(currentParams.contentTypeSettings as ContentTypeSettingsMap);
      }

      // Filter content types and their text fields
      content.items.forEach((item) => {
        const textFieldsForContentType: FieldInfo[] = [];

        item.fields.forEach((field) => {
          // Include Text, Symbol, and RichText fields
          if (field.type === "Text" || field.type === "Symbol" || field.type === "RichText") {
            textFieldsForContentType.push({
              id: field.id,
              name: field.name,
              type: field.type,
              modelName: item.name,
              isChecked: `${item.sys.id}${field.id}` in activeFields,
            });
          }
        });

        // Only add content types that have text fields
        if (textFieldsForContentType.length > 0) {
          richTextFields[item.sys.id] = textFieldsForContentType;
        }
      });

      setTextFields(richTextFields);

      // Expand the first content type by default for better UX
      const contentTypeIds = Object.keys(richTextFields);
      if (contentTypeIds.length > 0) {
        setExpandedContentType(contentTypeIds[0]);
      }

      setLoading(false);
      await app.setReady();
    })();
  }, [sdk]);

  const handleCheckboxChange = useCallback((fieldId: string, contentTypeId: string) => {
    setTextFields((prevFields) => {
      const newFields = { ...prevFields };
      newFields[contentTypeId] = newFields[contentTypeId].map((field) =>
        field.id === fieldId ? { ...field, isChecked: !field.isChecked } : field,
      );
      return newFields;
    });
  }, []);

  const handleCheckAllChange = useCallback((contentTypeId: string, checked: boolean) => {
    setTextFields((prevFields) => {
      const newFields = { ...prevFields };
      newFields[contentTypeId] = newFields[contentTypeId].map((field) => ({
        ...field,
        isChecked: checked,
      }));
      return newFields;
    });
  }, []);

  const handleToggleExpand = useCallback((contentTypeId: string) => {
    setExpandedContentType((prev) => (prev === contentTypeId ? null : contentTypeId));
  }, []);

  const handleContentTypeSettingsChange = useCallback(
    (contentTypeId: string, settings: ContentTypeSettings) => {
      setContentTypeSettings((prev) => ({
        ...prev,
        [contentTypeId]: settings,
      }));
    },
    [],
  );

  const getContentTypeSettings = useCallback(
    (contentTypeId: string): ContentTypeSettings => {
      return contentTypeSettings[contentTypeId] ?? DEFAULT_CONTENT_TYPE_SETTINGS;
    },
    [contentTypeSettings],
  );

  if (loading) {
    return (
      <Box marginTop="spacingXl" style={{ display: "flex", justifyContent: "center" }}>
        <Spinner size="large" />
      </Box>
    );
  }

  return (
    <ConfigScreenWrapper>
      <TopCover />
      <ContentArea>
        <IntroSection>
          <IntroHeader>
            <AppTitle>Markup AI App</AppTitle>
            <UserProfileButton />
          </IntroHeader>
          <IntroDescription>
            Scan, score, and rewrite content at scale instantly. With our Content Guardian Agents℠
            and APIs, you can ensure every word meets your brand and compliance standards across
            your organization.
          </IntroDescription>
        </IntroSection>

        <SectionHeader>
          <SectionTitle>Assign to Content Types</SectionTitle>
          <SectionDescription>
            Choose which content types and fields to use with Markup AI, and set the default check
            settings that will prefill new entries — authors can still update them in the editor.
          </SectionDescription>
        </SectionHeader>

        <ContentTypesContainer>
          {Object.entries(textFields).map(([contentTypeId, fields]) => {
            if (fields.length === 0) return null;
            const contentTypeName = fields[0]?.modelName || contentTypeId;

            return (
              <ContentTypeAccordion
                key={contentTypeId}
                contentTypeId={contentTypeId}
                contentTypeName={contentTypeName}
                fields={fields}
                isExpanded={expandedContentType === contentTypeId}
                isAuthenticated={isAuthenticated}
                settings={getContentTypeSettings(contentTypeId)}
                constants={constants}
                styleGuides={styleGuides}
                isLoading={configDataLoading}
                onToggleExpand={handleToggleExpand}
                onFieldChange={handleCheckboxChange}
                onCheckAll={handleCheckAllChange}
                onSettingsChange={handleContentTypeSettingsChange}
                onSignIn={handleSignIn}
              />
            );
          })}
        </ContentTypesContainer>

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

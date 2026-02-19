import React, { useState, useEffect } from "react";
import { useAutoResizer, useSDK } from "@contentful/react-apps-toolkit";
import { SidebarAppSDK } from "@contentful/app-sdk";
import { useRewriter } from "../../hooks/useRewriter";
import { FieldCheckCard } from "../../components/FieldCheckCard/FieldCheckCard";
import { ErrorCard } from "../../components/Error/ErrorCard";
import { SidebarContainer, TopBar } from "./Sidebar.styles";
import StartBlockWaiting from "../../components/StartBlockWaiting/StartBlockWaiting";
import { useUserSettings } from "../../hooks/useUserSettings";
import SettingsButton from "../../components/UserSettings/SettingsButton";
import UserSettingsPanel from "../../components/UserSettings/UserSettingsPanel";
import SignInCard from "../../components/UserSettings/SignInCard";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar: React.FC = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  const { fieldChecks, handleAcceptSuggestion, clearError, setOnFieldChange, updateCheck } =
    useRewriter(sdk);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const { effectiveSettings, fieldSettings, updateDialect, updateTone, updateStyleGuide } =
    useUserSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Force re-render when auth state changes
  const [renderKey, setRenderKey] = useState(0);
  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [isAuthenticated]);

  // Close settings panel when user logs out
  useEffect(() => {
    if (!isAuthenticated && isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  }, [isAuthenticated, isSettingsOpen]);

  useEffect(() => {
    setOnFieldChange((fieldId) => {
      // Reset expanded state only if the changed field is the one that's expanded
      if (expandedFieldId === fieldId) {
        setExpandedFieldId(null);
      }
    });
  }, [setOnFieldChange, expandedFieldId]);

  const handleRewriteWithDialog = async (fieldId: string) => {
    const fieldCheck = fieldChecks[fieldId];
    if (!(fieldId in fieldChecks)) return;
    const originalAnalysisResult = fieldCheck.checkResponse;
    const originalScore = originalAnalysisResult?.original?.scores?.quality?.score ?? null;
    const field = sdk.entry.fields[fieldId];
    const previewFormat = field.type === "RichText" ? "html" : "markdown";
    const result = (await sdk.dialogs.openCurrent({
      width: 1200,
      title: "Rewrite Preview",
      parameters: {
        fieldId,
        original: fieldCheck.originalValue,
        startRewrite: true,
        originalScore,
        previewFormat,
      },
    })) as
      | {
          accepted?: boolean;
          fieldId?: string;
          rewriteResponse?: import("../../api-client/types.gen").RewriteResponse;
        }
      | null
      | undefined;

    // If the dialog was closed with acceptance, trigger the accept suggestion
    if (result?.accepted && result.fieldId) {
      if (result.rewriteResponse) {
        console.log("Dialog close with acceptance", result.rewriteResponse);
        updateCheck(result.fieldId, {
          checkResponse: result.rewriteResponse,
          hasRewriteResult: true,
        });
        await handleAcceptSuggestion(result.fieldId, result.rewriteResponse);
      } else {
        await handleAcceptSuggestion(result.fieldId);
      }
    }
  };

  const handleToggleExpand = (fieldId: string) => {
    setExpandedFieldId((prevId) => (prevId === fieldId ? null : fieldId));
  };

  // Get the first error from any field check
  const error = Object.values(fieldChecks).find((check) => check.error)?.error;

  // Filter out field checks for fields that no longer exist
  const validFieldChecks = Object.values(fieldChecks).filter(
    (fieldCheck) => fieldCheck.fieldId in sdk.entry.fields && !fieldCheck.error,
  );

  // Show sign-in card when not authenticated
  if (!isAuthenticated) {
    return (
      <SidebarContainer key={`signin-${String(renderKey)}`}>
        <SignInCard />
      </SidebarContainer>
    );
  }

  // Show settings only when explicitly opened
  if (isSettingsOpen) {
    return (
      <SidebarContainer key={`settings-${String(renderKey)}`}>
        <UserSettingsPanel
          isOpen
          onClose={() => {
            setIsSettingsOpen(false);
          }}
          dialect={effectiveSettings.dialect}
          tone={fieldSettings.tone}
          styleGuide={effectiveSettings.styleGuide}
          onDialectChange={updateDialect}
          onToneChange={updateTone}
          onStyleGuideChange={updateStyleGuide}
        />
      </SidebarContainer>
    );
  }

  // Normal sidebar workflow when logged in and settings panel is closed
  return (
    <SidebarContainer key={`main-${String(renderKey)}`}>
      <TopBar>
        <SettingsButton
          onClick={() => {
            setIsSettingsOpen(true);
          }}
        />
      </TopBar>
      {error && (
        <ErrorCard
          message={error}
          onClose={() => {
            clearError(Object.keys(fieldChecks).find((id) => fieldChecks[id].error) || "");
          }}
        />
      )}
      {validFieldChecks.length > 0 ? (
        validFieldChecks.map((fieldCheck) => {
          if (!(fieldCheck.fieldId in sdk.entry.fields)) return null;
          const field = sdk.entry.fields[fieldCheck.fieldId];

          return (
            <FieldCheckCard
              key={fieldCheck.fieldId}
              fieldCheck={fieldCheck}
              fieldName={field.name}
              onRewriteWithDialog={(fieldId) => {
                void handleRewriteWithDialog(fieldId);
              }}
              isExpanded={expandedFieldId === fieldCheck.fieldId}
              onToggleExpand={handleToggleExpand}
            />
          );
        })
      ) : (
        <StartBlockWaiting />
      )}
    </SidebarContainer>
  );
};

export default Sidebar;

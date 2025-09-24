import React, { useState, useEffect } from 'react';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useRewriter } from '../../hooks/useRewriter';
import { FieldCheckCard } from '../../components/FieldCheckCard/FieldCheckCard';
import { ErrorCard } from '../../components/Error/ErrorCard';
import { SidebarContainer, TopBar } from './Sidebar.styles';
import StartBlockWaiting from '../../components/StartBlockWaiting/StartBlockWaiting';
import { useUserSettings } from '../../hooks/useUserSettings';
import SettingsButton from '../../components/UserSettings/SettingsButton';
import UserSettingsPanel from '../../components/UserSettings/UserSettingsPanel';

const Sidebar: React.FC = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  const { fieldChecks, handleAcceptSuggestion, clearError, setOnFieldChange, updateCheck } = useRewriter(sdk);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const { settings, updateDialect, updateTone, updateStyleGuide } = useUserSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // API key now comes from installation; only per-user preferences are local
  const isConfigComplete = !!(settings.dialect && settings.styleGuide);
  const [forcePanel, setForcePanel] = useState<boolean>(() => !isConfigComplete);

  useEffect(() => {
    // If configuration becomes incomplete at any time, force the panel open until explicitly closed
    if (!isConfigComplete) {
      setForcePanel(true);
    }
  }, [isConfigComplete]);

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
    if (!fieldCheck) return;
    const originalAnalysisResult = fieldCheck.checkResponse;
    const originalScore = originalAnalysisResult?.original.scores?.quality.score ?? null;
    const field = sdk.entry.fields[fieldId];
    const previewFormat = field?.type === 'RichText' ? 'html' : 'markdown';
    const result = await sdk.dialogs.openCurrent({
      width: 1200,
      title: 'Rewrite Preview',
      parameters: {
        fieldId,
        original: fieldCheck.originalValue,
        startRewrite: true,
        originalScore,
        previewFormat,
      },
    });

    // If the dialog was closed with acceptance, trigger the accept suggestion
    if (result?.accepted && result.fieldId) {
      if (result.rewriteResponse) {
        console.log('Dialog close with acceptance', result.rewriteResponse);
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
  const validFieldChecks = Object.values(fieldChecks).filter((fieldCheck) => sdk.entry.fields[fieldCheck.fieldId]);

  // When settings panel is explicitly open or forced (e.g., first-time setup), cover entire sidebar
  if (isSettingsOpen || forcePanel) {
    return (
      <SidebarContainer>
        {/* No top bar when settings are open/incomplete to align panel to top */}
        <UserSettingsPanel
          isOpen
          forceOpen={forcePanel}
          onClose={() => {
            setIsSettingsOpen(false);
            setForcePanel(false);
          }}
          apiKey={sdk.parameters.installation.apiKey}
          dialect={settings.dialect}
          tone={settings.tone}
          styleGuide={settings.styleGuide}
          // API key is managed in app config; disable changes here
          onApiKeyChange={() => {
            /* apiKey managed in app config */
          }}
          onApiKeyClear={() => {
            /* apiKey managed in app config */
          }}
          onDialectChange={updateDialect}
          onToneChange={updateTone}
          onStyleGuideChange={updateStyleGuide}
        />
      </SidebarContainer>
    );
  }

  // Normal sidebar workflow when logged in and settings panel is closed
  return (
    <SidebarContainer>
      <TopBar>
        <SettingsButton onClick={() => setIsSettingsOpen(true)} />
      </TopBar>
      {error && (
        <ErrorCard
          message={error}
          onClose={() => clearError(Object.keys(fieldChecks).find((id) => fieldChecks[id].error) || '')}
        />
      )}
      {validFieldChecks.length > 0 ? (
        validFieldChecks.map((fieldCheck) => {
          const field = sdk.entry.fields[fieldCheck.fieldId];
          if (!field) return null;

          return (
            <FieldCheckCard
              key={fieldCheck.fieldId}
              fieldCheck={fieldCheck}
              fieldName={field.name}
              onRewriteWithDialog={handleRewriteWithDialog}
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

import React, { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { FieldAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import getField from "./utils";
import { FieldContainer, ControlBar } from "./Field.styles";
import { FieldHeader } from "./components";
import { useAuth } from "../../contexts/AuthContext";
import { useAgentAvailability } from "../../hooks/useAgentAvailability";
import { useAgentSelection } from "../../hooks/useAgentSelection";
import { filterRunnableAgentIds, unavailabilityReasonsFor } from "../../agents/agentAvailability";

import "codemirror/lib/codemirror.css";

interface SignInDialogResult {
  signedIn: boolean;
}

const Field: React.FC = () => {
  const sdk = useSDK<FieldAppSDK>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const contentTypeId = sdk.entry.getSys().contentType.sys.id;
  const fieldId = sdk.field.id;

  // Org-level capability gates which catalog agents the user is *allowed*
  // to run. When the runnable subset of the user's selection is empty, we
  // disable Check entirely and surface the reason in a tooltip — the same
  // copy is rendered inside the dialog's Agent settings panel.
  const { unavailable: unavailableAgents } = useAgentAvailability();
  const { selectedAgentIds } = useAgentSelection();
  const runnableAgentIds = useMemo(
    () => filterRunnableAgentIds(selectedAgentIds, unavailableAgents),
    [selectedAgentIds, unavailableAgents],
  );
  const hasNoRunnableAgent = selectedAgentIds.length > 0 && runnableAgentIds.length === 0;
  const checkBlockedReason = useMemo(
    () =>
      hasNoRunnableAgent ? unavailabilityReasonsFor(selectedAgentIds, unavailableAgents) : null,
    [hasNoRunnableAgent, selectedAgentIds, unavailableAgents],
  );

  // Key to force re-render of field editor after external value updates (needed for RichText)
  const [externalValueUpdateKey, setExternalValueUpdateKey] = useState("default");

  // Use a ref to always get the current auth state in callbacks
  // This prevents stale closures from causing the sign-in dialog to open
  // when the user is already authenticated
  const isAuthenticatedRef = useRef(isAuthenticated);
  // Update ref synchronously when isAuthenticated changes
  // Using both assignment and useEffect ensures the ref is always current
  isAuthenticatedRef.current = isAuthenticated;
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    sdk.window.startAutoResizer();
    return () => {
      sdk.window.stopAutoResizer();
    };
  }, [sdk.window]);

  // Open the compact sign-in dialog
  const openSignInDialog = useCallback(async (): Promise<boolean> => {
    const result: unknown = await sdk.dialogs.openCurrentApp({
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      minHeight: 380,
      width: 420,
      parameters: {
        signIn: true,
      },
    });

    // Check if user signed in successfully
    const dialogResult = result as SignInDialogResult | undefined;
    return dialogResult?.signedIn === true;
  }, [sdk.dialogs]);

  // Open the full editor dialog
  const openEditorDialog = useCallback(async () => {
    const fieldFormat = sdk.field.type;

    // Get field value - for RichText this is a Document object, for Text/Symbol it's a string
    const fieldValue: unknown = sdk.field.getValue();
    // For RichText, pass the Document as-is; for text fields, fallback to empty string
    const fieldContent = fieldFormat === "RichText" ? fieldValue : fieldValue || "";

    // Resolve the entry title (value of the content type's displayField) so
    // the dialog can build the `document_name` / `document_ref` pair Cortex
    // uses to track scans. Falls through silently when the entry has no
    // displayField configured or the title is empty.
    const displayFieldId: string | undefined = sdk.contentType.displayField;
    let entryTitle: string | undefined;
    if (displayFieldId) {
      // `fields` is typed as an index signature, but at runtime entries
      // without the displayField are absent — guard before .getValue() so
      // we never throw on a misconfigured content type.
      const displayField = Object.hasOwn(sdk.entry.fields, displayFieldId)
        ? sdk.entry.fields[displayFieldId]
        : undefined;
      const titleValue: unknown = displayField?.getValue();
      if (typeof titleValue === "string" && titleValue.trim().length > 0) {
        entryTitle = titleValue;
      }
    }

    // Per-content-type style guide defaults are read by the dialog directly
    // from `sdk.parameters.installation`, so we don't need to pipe them
    // through invocation params here.
    const answer: unknown = await sdk.dialogs.openCurrentApp({
      shouldCloseOnOverlayClick: false,
      shouldCloseOnEscapePress: true,
      minHeight: "85vh",
      width: 1200,
      parameters: {
        fieldCheck: true,
        fieldContent,
        fieldFormat,
        fieldId,
        contentTypeId,
        ...(entryTitle ? { entryTitle } : {}),
      } as unknown as Record<string, string>,
    });

    if (answer) {
      void sdk.field.setValue(answer);

      // RichText fields need a re-render after saving to show updated content
      const isRichText = fieldFormat === "RichText";
      if (isRichText) {
        const newKey = Date.now().toString();
        setExternalValueUpdateKey(newKey);
      }
    }
  }, [sdk.dialogs, sdk.field, contentTypeId, fieldId]);

  // Main handler: check auth and open appropriate dialog
  const handleCheckClick = useCallback(async () => {
    // Check both the ref and the current prop value to ensure we have the latest state
    // The ref is updated synchronously on render, but we also check isAuthenticated
    // in case the component hasn't re-rendered yet after a sign out
    const currentlyAuthenticated = isAuthenticatedRef.current && isAuthenticated;

    if (currentlyAuthenticated) {
      // User is already signed in - go directly to editor
      await openEditorDialog();
    } else {
      // User needs to sign in first
      const signedIn = await openSignInDialog();
      if (signedIn) {
        // User signed in successfully - now open the editor dialog
        await openEditorDialog();
      }
      // If user closed without signing in, do nothing
    }
  }, [openSignInDialog, openEditorDialog, isAuthenticated]);

  return (
    <FieldContainer>
      <ControlBar>
        <FieldHeader
          onCheckClick={() => {
            void handleCheckClick();
          }}
          isDisabled={isAuthLoading || hasNoRunnableAgent}
          checkDisabledReason={checkBlockedReason}
        />
      </ControlBar>
      <div key={externalValueUpdateKey}>{getField(sdk)}</div>
    </FieldContainer>
  );
};

export default Field;

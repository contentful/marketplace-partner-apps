import React, { useEffect, useCallback, useRef, useState } from "react";
import { FieldAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import getField from "./utils";
import { FieldContainer, ControlBar } from "./Field.styles";
import { FieldHeader } from "./components";
import { useAuth } from "../../contexts/AuthContext";
import { useContentTypeDefaults } from "../../hooks/useContentTypeDefaults";

import "codemirror/lib/codemirror.css";

interface SignInDialogResult {
  signedIn: boolean;
}

const Field: React.FC = () => {
  const sdk = useSDK<FieldAppSDK>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { defaults: contentTypeDefaults } = useContentTypeDefaults();

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
    const contentTypeId = sdk.entry.getSys().contentType.sys.id;

    // Get field value - for RichText this is a Document object, for Text/Symbol it's a string
    const fieldValue: unknown = sdk.field.getValue();
    // For RichText, pass the Document as-is; for text fields, fallback to empty string
    const fieldContent = fieldFormat === "RichText" ? fieldValue : fieldValue || "";

    const answer: unknown = await sdk.dialogs.openCurrentApp({
      shouldCloseOnOverlayClick: false,
      shouldCloseOnEscapePress: true,
      minHeight: "85vh",
      width: 1200,
      parameters: {
        fieldCheck: true,
        fieldContent,
        fieldFormat,
        fieldId: sdk.field.id,
        contentTypeId,
        // Pass content type defaults so the dialog can use them as fallback
        contentTypeDefaults: {
          styleGuide: contentTypeDefaults.styleGuide ?? null,
          dialect: contentTypeDefaults.dialect ?? null,
          tone: contentTypeDefaults.tone ?? null,
        },
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
  }, [sdk.dialogs, sdk.field, sdk.entry, contentTypeDefaults]);

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
          isDisabled={isAuthLoading}
        />
      </ControlBar>
      <div key={externalValueUpdateKey}>{getField(sdk)}</div>
    </FieldContainer>
  );
};

export default Field;

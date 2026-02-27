import React, { useCallback, useEffect, useRef, useState } from "react";
import { EditorAppSDK, EditorLocaleSettings } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { getDefaultWidgetId } from "@contentful/default-field-editors";
import { Stack, Form, Heading, Text } from "@contentful/f36-components";
import { calculateEditorFields, getFieldAppSdk, getLocaleName } from "../utils";
import { type Rule } from "../types/Rule";
import { css } from "@emotion/css";
// Import for markdown editor
import "codemirror/lib/codemirror.css";
import DefaultField, { DefaultFieldProps } from "../components/DefaultField";
import type { ContentFields, KeyValueMap } from "contentful-management/types";

const NoLocalizedFields = (props: { localeName: string }) => (
  <Stack flexDirection="column" alignItems="center" alignContent="center">
    <Heading>There are no fields to translate</Heading>
    <Text style={{ textAlign: "center" }}>
      There are no localized fields to translate for {props.localeName}. You can
      switch to a different locale using "Translation" in your sidebar.
    </Text>
  </Stack>
);

// CSS styles for full-width editor layout
const FORM_STYLE = css({
  maxWidth: "100%",
  padding: "0",
  margin: "70px 0 0 0",
  paddingBottom: "100px",

  "& > *": {
    marginLeft: "0 !important",
  }
});

const EntryEditor = () => {
  const sdk = useSDK<EditorAppSDK>();
  const entryId = sdk.entry.getSys().id;
  const isFirstLoad = useRef(true);
  const [editorFields, setEditorFields] = useState<
    ContentFields<KeyValueMap>[]
  >([]);
  const [localeSetings, setLocaleSetings] = useState<EditorLocaleSettings>(
    sdk.editor.getLocaleSettings()
  );

  const handlePageHide = useCallback(() => {
    const savedRules = JSON.parse(
      sessionStorage.getItem("filteredRules") || "[]"
    );
    sessionStorage.setItem(
      "filteredRules",
      JSON.stringify(
        savedRules.filter((rule: Rule) => rule.entryId !== entryId)
      )
    );
    window.removeEventListener("pagehide", handlePageHide);
  }, [entryId]);

  useEffect(() => {
    isFirstLoad.current = false;
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [handlePageHide]);

  useEffect(() => {
    sdk.editor.onLocaleSettingsChanged((localeSetings) =>
      setLocaleSetings(localeSetings)
    );
    sdk.editor.onShowHiddenFieldsChanged(() =>
      setEditorFields(
        calculateEditorFields(
          entryId,
          sdk.entry.fields,
          sdk,
          isFirstLoad.current
        )
      )
    );
    setEditorFields(
      calculateEditorFields(entryId, sdk.entry.fields, sdk, isFirstLoad.current)
    );
  }, [entryId, sdk, sdk.editor]);

  // Listen to reference field changes for realtime conditional field updates
  useEffect(() => {
    // Safety check: ensure fields exist before attaching listeners
    if (!sdk.entry.fields) {
      return;
    }

    const fieldChangeListeners: Function[] = [];
    const contentType = sdk.contentType;

    // Only attach listeners to reference fields (Link or Array of Links)
    Object.keys(sdk.entry.fields).forEach((fieldId) => {
      const field = contentType.fields.find((f: any) => f.id === fieldId);

      // Check if field is a reference field (Link or Array of Links)
      const isReferenceField =
        field?.type === 'Link' ||
        (field?.type === 'Array' && field?.items?.type === 'Link');

      if (isReferenceField) {
        const removeListener = sdk.entry.fields[fieldId].onValueChanged(() => {
          // Recalculate which fields should be visible
          setEditorFields(
            calculateEditorFields(entryId, sdk.entry.fields, sdk, false)
          );
        });
        fieldChangeListeners.push(removeListener);
      }
    });

    // Cleanup listeners on unmount
    return () => {
      fieldChangeListeners.forEach((removeListener) => removeListener());
    };
  }, [entryId, sdk]);

  let hasLocailizedFields = false;
  return (

    <Form
      className={FORM_STYLE}
      onChange={(ev: any) => {
        const { id, value } = ev.target;
        // ev.target.id looks like fieldId-locale-contentTypeId
        const fieldId = id.split("-")[0];
        const entryFieldsCopy: any = { ...sdk.entry.fields };
        entryFieldsCopy[fieldId] = { ...entryFieldsCopy[fieldId], value };

        setEditorFields(
          calculateEditorFields(
            entryId,
            entryFieldsCopy,
            sdk,
            isFirstLoad.current
          )
        );
      }}
    >
      {editorFields.map((field) => {
        const control = sdk.editor.editorInterface.controls!.find(
          (control) => control.fieldId === field.id
        ) as DefaultFieldProps["control"];
        let widgetId = control?.widgetId || null;

        // App frameworks does not have the ability to reference/pull in other apps
        // Using default widget if field is configured to use custom app
        if (control?.widgetNamespace !== "builtin") {
          widgetId = getDefaultWidgetId(
            getFieldAppSdk(field.id, sdk, sdk.locales.default)
          );
        }

        // mode = 'single':
        //    use `focused`
        //    no default locale
        // mode = 'multi':
        //    use `active`
        //    need default locale
        if (localeSetings.mode === "multi") {
          return (
            <>
              <DefaultField
                key={`${field.id}-${sdk.locales.default}`}
                name={field.name}
                sdk={getFieldAppSdk(field.id, sdk, sdk.locales.default)}
                widgetId={widgetId}
                control={control}
                locale={
                  field.localized &&
                    localeSetings.active?.length &&
                    localeSetings.active?.length > 1
                    ? sdk.locales.default
                    : undefined
                }
              />
              {field.localized &&
                localeSetings.active
                  ?.filter((locale) => locale !== sdk.locales.default)
                  .map((locale) => (
                    <DefaultField
                      key={`${field.id}-${locale}`}
                      name={field.name}
                      sdk={getFieldAppSdk(field.id, sdk, locale)}
                      widgetId={widgetId}
                      control={control}
                      locale={locale}
                    />
                  ))}
            </>
          );
        } else if (
          field.localized ||
          localeSetings.focused === sdk.locales.default
        ) {
          hasLocailizedFields = true;
          return (
            <DefaultField
              key={`${field.id}-${localeSetings.focused}`}
              name={field.name}
              sdk={getFieldAppSdk(field.id, sdk, localeSetings.focused)}
              widgetId={widgetId}
              control={control}
              locale={field.localized ? localeSetings.focused : undefined}
            />
          );
        }
        return null;
      })}
      {!hasLocailizedFields && localeSetings.focused && (
        <NoLocalizedFields
          localeName={getLocaleName(sdk, localeSetings.focused)}
        />
      )}
    </Form>

  );
};

export default EntryEditor;

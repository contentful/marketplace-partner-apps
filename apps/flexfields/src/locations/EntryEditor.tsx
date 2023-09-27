import React, { useCallback, useEffect, useRef, useState } from "react";
import { EditorExtensionSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Field, FieldWrapper } from "@contentful/default-field-editors";
import { Workbench } from "@contentful/f36-workbench";
import { Form } from "@contentful/f36-components";
import { calculateEditorFields, getFieldExtensionSdk } from "../utils";
import { type Rule } from "../types/Rule";

// Prop types for DefaultField component
interface DefaultFieldProps {
  name: string;
  sdk: any;
  widgetId: string | null;
}

// Render default contentful fields using Forma 36 Component
const DefaultField = (props: DefaultFieldProps) => {
  const { name, sdk, widgetId } = props;
  return (
    <FieldWrapper sdk={sdk} name={name} showFocusBar={true}>
      <Field sdk={sdk} widgetId={widgetId!} />
    </FieldWrapper>
  );
};

const EntryEditor = () => {
  const sdk = useSDK<EditorExtensionSDK>();
  const entryId = sdk.entry.getSys().id;
  const isFirstLoad = useRef(true);
  const [editorFields, setEditorFields] = useState(
    calculateEditorFields(entryId, sdk.entry.fields, sdk, isFirstLoad.current)
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

  return (
    <Workbench>
      <Workbench.Content type="text">
        <Form
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
            );
            const widgetId = control?.widgetId || null;

            return (
              <DefaultField
                key={field.id}
                name={field.name}
                sdk={getFieldExtensionSdk(field.id, sdk)}
                widgetId={widgetId}
              />
            );
          })}
        </Form>
      </Workbench.Content>
    </Workbench>
  );
};

export default EntryEditor;

import { FieldAppSDK, FieldAPI } from "@contentful/app-sdk";
import { FieldWrapper, Field } from "@contentful/default-field-editors";
import {
  HelpText,
  FormLabel,
  Box,
  Note,
  Text,
} from "@contentful/f36-components";
import { CombinedLinkActions } from "@contentful/field-editor-reference";
import { type CustomActionProps } from "@contentful/field-editor-reference";
import { Control } from "contentful-management";
import { css } from "@emotion/css";
import React from "react";
import { getLocaleName } from "../utils";
import { openMarkdownDialog } from "@contentful/field-editor-markdown";
import { JsonEditor } from "@contentful/field-editor-json";

// Prop types for DefaultField component
export interface DefaultFieldProps {
  name: string;
  sdk: FieldAppSDK;
  widgetId: string | null;
  locale?: string;
  control?: Control & { field: FieldAPI };
}

// Render default contentful fields using Forma 36 Component
const DefaultField = (props: DefaultFieldProps) => {
  const { control, name, sdk, locale, widgetId } = props;
  // This is required to show the dialogs related to markdown (expanded mode and cheatsheet)
  // ref: https://github.com/contentful/field-editors/blob/master/packages/markdown/stories/MarkdownEditor.stories.tsx#L93
  if (control?.widgetId === "markdown") {
    // @ts-expect-error
    sdk.dialogs.openCurrent = openMarkdownDialog(sdk);
  }
  return (
    <FieldWrapper
      name={name}
      renderHelpText={() => (
        <>
          {control?.settings?.helpText && (
            <HelpText className={css({ fontStyle: "italic" })}>
              {control?.settings?.helpText}
            </HelpText>
          )}
        </>
      )}
      renderHeading={(name: string) => {
        return (
          <FormLabel style={{ fontWeight: "normal" }}>
            {name}
            {locale && (
              <Text fontColor="gray500"> | {getLocaleName(sdk, locale)}</Text>
            )}
          </FormLabel>
        );
      }}
      sdk={sdk}
      showFocusBar={true}
    >
      {control?.widgetId !== "objectEditor" && (
        <Field
          sdk={sdk}
          widgetId={widgetId!}
          getOptions={(widgetId, _sdk) => ({
            [widgetId]: {
              parameters: {
                instance: control?.settings,
              },
              ...(control?.field.type === "Array" ||
              control?.field.type === "Link"
                ? {
                    renderCustomActions: (props: CustomActionProps) => (
                      <CombinedLinkActions {...props} />
                    ),
                  }
                : {}),
            },
          })}
        />
      )}
      {control?.widgetId === "objectEditor" && (
        <JsonEditor field={sdk.field} isInitiallyDisabled={false} />
      )}
      {control?.widgetNamespace !== "builtin" && (
        <Box marginTop="spacingXs">
          <Note>
            This field was configured to use custon field widget. Please use the
            default Entry Editor to access the custom field widget.
          </Note>
        </Box>
      )}
    </FieldWrapper>
  );
};

export default DefaultField;

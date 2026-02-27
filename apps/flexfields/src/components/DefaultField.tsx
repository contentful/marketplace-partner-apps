import { FieldAppSDK, FieldAPI } from "@contentful/app-sdk";
import { FieldWrapper, Field } from "@contentful/default-field-editors";
import {
  HelpText,
  FormLabel,
  Box,
  Note,
  Text,
  Stack,
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

// Reusable component for external reference note
const ExternalReferenceNote = () => (
  <Box marginTop="spacingXs">
    <Note>
      This field was configured to use external references. Please use the
      default Entry Editor to access the external references.
    </Note>
  </Box>
);

// Reusable component for custom widget note
const CustomWidgetNote = () => (
  <Box marginTop="spacingXs">
    <Note>
    This field was configured to use custom field widget. Please use the
    default Entry Editor to access the custom field widget.
    </Note>
  </Box>
);

// Reusable component for displaying a single ResourceLink
const ResourceLinkBox = ({ urnInfo }: { urnInfo: { spaceId: string; environmentId: string; entityType: string; entityId: string } }) => {
  const handleClick = () => {
    const entityPath = urnInfo.entityType === 'entries' ? 'entries' : 'assets';
    const url = `https://app.contentful.com/spaces/${urnInfo.spaceId}/environments/${urnInfo.environmentId}/${entityPath}/${urnInfo.entityId}`;
    window.open(url, '_blank');
  };

  return (
    <Box
      padding="spacingS"
      style={{
        backgroundColor: "#f7f9fa",
        borderRadius: "6px",
        border: "1px solid #e5ebed",
        cursor: "pointer",
      }}
      onClick={handleClick}
    >
      <Text fontSize="fontSizeS">
        {urnInfo.entityType === 'entries' ? 'Entry' : 'Asset'}: {urnInfo.entityId?.substring(0, 8)}... | 
        Space: {urnInfo.spaceId?.substring(0, 8)}... | 
        Env: {urnInfo.environmentId || 'N/A'}
      </Text>
    </Box>
  );
};

// Helper component to display ResourceLink field values
const ResourceLinkDisplay = ({ sdk }: { sdk: FieldAppSDK }) => {
  const [value, setValue] = React.useState<any>(sdk.field.getValue());

  React.useEffect(() => {
    const detach = sdk.field.onValueChanged((newValue: any) => {
      setValue(newValue);
    });
    return () => detach();
  }, [sdk.field]);

  // Parse URN to extract information
  const parseUrn = (urn: string) => {
    const match = urn.match(
      /crn:contentful:::content:spaces\/([^/]+)\/environments\/([^/]+)\/(entries|assets)\/([^/]+)/
    );
    if (!match) return null;
    return {
      spaceId: match[1],
      environmentId: match[2],
      entityType: match[3],
      entityId: match[4],
    };
  };

  if (!value) {
    return null;
  }

  // Handle array of resources (multiple)
  if (Array.isArray(value)) {
    return (
      <Stack flexDirection="column" spacing="spacingS">
        {value.map((item: any, index: number) => {
          const urnInfo = item?.sys?.urn ? parseUrn(item.sys.urn) : null;
          
          if (!urnInfo) return null;
          
          return <ResourceLinkBox key={index} urnInfo={urnInfo} />;
        })}
      </Stack>
    );
  }

  // Handle single resource
  const urnInfo = value?.sys?.urn ? parseUrn(value.sys.urn) : null;
  
  if (!urnInfo) {
    return null;
  }

  return <ResourceLinkBox urnInfo={urnInfo} />;
};

// Render default contentful fields using Forma 36 Component
const DefaultField = (props: DefaultFieldProps) => {
  const { control, name, sdk, locale, widgetId } = props;
  
  // This is required to show the dialogs related to markdown (expanded mode and cheatsheet)
  // ref: https://github.com/contentful/field-editors/blob/master/packages/markdown/stories/MarkdownEditor.stories.tsx#L93
  if (control?.widgetId === "markdown") {
    // @ts-ignore - openCurrent is not in the SDK type definitions but is required for markdown dialogs
    sdk.dialogs.openCurrent = openMarkdownDialog(sdk);
  }

  // Check if this is a ResourceLink field
  const isResourceLinkEditor = 
    control?.widgetId === "resourceLinkEditor" ||
    control?.widgetId === "entryResourceLinkEditor" ||
    control?.widgetId === "assetResourceLinkEditor";

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
          <FormLabel style={{ fontWeight: "normal", display: "block", marginBottom: "8px" }}>
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
      {/* Handle ResourceLink fields - display only */}
      {isResourceLinkEditor && (
        <>
          <ResourceLinkDisplay sdk={sdk} />
          <ExternalReferenceNote />
        </>
      )}

      {/* Handle standard fields (not ResourceLink, not objectEditor, builtin) */}
      {!isResourceLinkEditor && 
       control?.widgetId !== "objectEditor" && 
       control?.widgetNamespace === "builtin" && (
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

      {/* Handle JSON Object Editor */}
      {control?.widgetId === "objectEditor" && (
        <JsonEditor field={sdk.field} isInitiallyDisabled={false} />
      )}

      {/* Show note for custom field widgets ONLY (not ResourceLink, not objectEditor, not builtin) */}
      {!isResourceLinkEditor && 
       control?.widgetId !== "objectEditor" &&
       control?.widgetNamespace !== "builtin" && (
        <CustomWidgetNote />
      )}
    </FieldWrapper>
  );
};

export default DefaultField;
import { Box, Flex, Switch, Tooltip } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ContentTypeProps } from 'contentful-management';
import { ContentFieldId, ContentFieldsMap, ContentTypeId } from '../types';
import { SurferCompatibility } from '../hooks/useSurferCompatibility';

export interface FieldSelectionProps {
  contentTypes: ContentTypeProps[];
  selectedContentTypes: ContentTypeId[];
  selectedContentFields: ContentFieldsMap;
  compatibility: SurferCompatibility | undefined;
  handleContentTypeSelection: (id: ContentTypeId) => void;
  handleFieldSelection: (id: ContentTypeId, fieldId: ContentFieldId) => void;
}

export const FieldSelection = ({
  contentTypes,
  selectedContentFields,
  selectedContentTypes,
  compatibility,
  handleContentTypeSelection,
  handleFieldSelection,
}: FieldSelectionProps) => {
  return (
    <Box marginTop="spacingM">
      {contentTypes.map((contentType) => {
        const contentTypeId = contentType.sys.id;
        const isCompatible = compatibility?.compatibleContentTypes.includes(contentTypeId);

        const toggle = (
          <Flex flexDirection="column" gap={tokens.spacingS} marginBottom="spacingS">
            <Switch
              id={contentTypeId}
              isChecked={selectedContentTypes.includes(contentTypeId)}
              isDisabled={!isCompatible}
              onChange={() => handleContentTypeSelection(contentTypeId)}>
              {contentType.name}
            </Switch>
            <Flex flexDirection="column" gap={tokens.spacingS} paddingLeft="spacing2Xl">
              {contentType.fields.map(
                (field) =>
                  compatibility?.compatibleFields[contentTypeId]?.includes(field.id) && (
                    <Switch
                      key={`${contentTypeId}_${field.id}`}
                      id={field.id}
                      isChecked={selectedContentFields[contentTypeId]?.includes(field.id) ?? false}
                      onChange={() => handleFieldSelection(contentTypeId, field.id)}>
                      {field.name}
                    </Switch>
                  )
              )}
            </Flex>
          </Flex>
        );

        return (
          <div key={contentTypeId}>
            {isCompatible ? (
              toggle
            ) : (
              <Tooltip placement="left-start" content="This content type doesn't contain any RichText fields">
                {toggle}
              </Tooltip>
            )}
          </div>
        );
      })}
    </Box>
  );
};

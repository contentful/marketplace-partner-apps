import {
  Flex,
  Box,
  FormControl,
  TextInput,
  Textarea,
  Select
} from "@contentful/f36-components";
import { ContentTypeProps } from "contentful-management";
import { ExtendedGCTemplate, MappingData } from "@/type/types";

interface MappingMainSettingsProps {
  template: ExtendedGCTemplate;
  mappingData: MappingData;
  availableModels: ContentTypeProps[];
  disableTextInput: boolean;
  modelName?: string;
  onSelectCFModel: (modelId: string) => void;
  onChangeMappingData: (key: keyof MappingData, value: string) => void;
}

export function MappingMainSettings({
  template,
  mappingData,
  availableModels,
  onSelectCFModel,
  disableTextInput,
  modelName,
  onChangeMappingData,
}: MappingMainSettingsProps) {
  function handleFieldChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
    fieldName: keyof MappingData
  ) {
    const value = event.target.value;
    onChangeMappingData(fieldName, value);
  }

  return (
    <Flex justifyContent="space-between" gap="spacingXl">
      <Box>
        <FormControl>
          <FormControl.Label>Create new Content Type:</FormControl.Label>
          <TextInput
            type="text"
            name="name"
            onChange={(e) => handleFieldChange(e, "name")}
            value={mappingData.name}
            isDisabled={disableTextInput}
          />
          {mappingData.name === "" && (
            <FormControl.ValidationMessage>
              The Content Type should have a name
            </FormControl.ValidationMessage>
          )}
        </FormControl>
        <FormControl>
          <Textarea
              value={mappingData.description}
              name="description"
              onChange={(e) => handleFieldChange(e, "description")}
              isDisabled={disableTextInput}
              defaultValue="Description for new Content Type"
          />

        </FormControl>
        <FormControl>
          <FormControl.Label>
            Or map to existing Content Type:
          </FormControl.Label>
          <Select
            id="content-typed-select"
            defaultValue=""
            isDisabled={!!template.mappedCFModel}
            onChange={(e) => onSelectCFModel(e.target.value)}
          >
            <Select.Option value="">Not selected...</Select.Option>
            {availableModels.map((model) => (
              <Select.Option key={model.sys.id} value={model.sys.id}>
                {model.name}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Flex>
  );
}

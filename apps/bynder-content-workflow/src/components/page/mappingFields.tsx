import {
  Flex,
  Grid,
  Box,
  Paragraph,
  FormControl,
  Select,
  Tabs,
  Checkbox,
} from "@contentful/f36-components";
import { GCFieldLabelMap, IGNORE, contentfulTypeLabelMap } from "@/consts/fieldMap";
import { ContentTypeProps } from "contentful-management";
import { ChangeEvent, useEffect, useState } from "react";
import {
  CFFieldType,
  Field,
  GCFieldType,
  Group,
  MappingData,
} from "@/type/types";
import {
  getContentfulFieldType,
  getFieldCfId,
  getFieldType,
  getMappedCfField,
} from "@/utils/fieldMapping";
import { CFTypeFieldOptions, FieldOption, EntryTitleCheckbox } from "./options";
import { DisplayField } from "@/consts/displayFields";

interface MappingFieldsProps {
  selectedCFModel: ContentTypeProps | null;
  groups: Group[];
  mappingData: MappingData;
  displayField: DisplayField;
  onChangeCheckbox: (uuid: string) => void;
  onUseGCEntryTitle: (checked: boolean) => void;
  onSelectCFType: (
    evt: ChangeEvent<HTMLSelectElement>,
    fieldId: string
  ) => void;
  onSelectCFField: (
    evt: ChangeEvent<HTMLSelectElement>,
    fieldId: string,
    gcField: Field
  ) => void;
}

export function MappingFields({
  selectedCFModel,
  groups,
  mappingData,
  displayField,
  onChangeCheckbox,
  onUseGCEntryTitle,
  onSelectCFType,
  onSelectCFField,
}: MappingFieldsProps) {
  const [usedFields, setUsedFields] = useState<string[]>([]);

  function handleFieldSelect(
    evt: ChangeEvent<HTMLSelectElement>,
    fieldId: string,
    gcField: Field
  ) {
    onSelectCFField(evt, fieldId, gcField);
  }

  function onChangeGCTitleCheckbox(evt: ChangeEvent<HTMLInputElement>) {
    onUseGCEntryTitle(evt.target.checked);
  }

  useEffect(() => {
    if (!selectedCFModel) return;
    setUsedFields([]);
  }, [selectedCFModel]);

  useEffect(() => {
    if (!mappingData || !selectedCFModel) return;
    const usedFields = mappingData.fields.map((field) => field.cfId);
    setUsedFields(usedFields);
  }, [mappingData]);

  return (
    <>
      <Checkbox
        style={{ marginLeft: "0" }}
        isChecked={mappingData.useGCEntryTitle}
        onChange={onChangeGCTitleCheckbox}
      >
        Use Content Workflow item name as Entry Title
      </Checkbox>
      <Tabs defaultTab={groups[0].uuid}>
        <Tabs.List variant={"horizontal-divider"} style={{
          borderBottom: "1px"
        }}>
          {groups.map((group) => (
            <Tabs.Tab key={`${group.uuid}-tab`} panelId={group.uuid}>
              {group.name}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {groups.map((group) => {
          return (
            <Tabs.Panel id={group.uuid} key={group.uuid}>
              <Flex marginTop="spacingL" flexDirection="column" gap="spacingL">
                {group.fields.map((field) => {
                  const fieldType: GCFieldType = field.field_type;
                  if (fieldType === GCFieldType.Guidelines) return null;

                  const fieldId = field.uuid;
                  const cfFieldId = getFieldCfId(mappingData.fields, fieldId);
                  const value = getFieldType(mappingData.fields, fieldId);
                  let mappedCfFieldType = null;
                  if (selectedCFModel) {
                    const mappedCfField = getMappedCfField(
                      selectedCFModel.fields,
                      cfFieldId
                    );
                    if (mappedCfField)
                      mappedCfFieldType = getContentfulFieldType(
                        mappedCfField,
                        field
                      );
                  }

                  return (
                    <Grid
                      key={fieldId}
                      columns="1fr 1fr 1fr"
                      columnGap="spacingL"
                    >
                      <Box>
                        <Paragraph>
                          <span style={{ fontWeight: "bold" }}>
                            Label:
                          </span>{" "}
                          {field.label}
                        </Paragraph>
                        <Paragraph>
                          <span style={{ fontWeight: "bold" }}>
                            Type:
                          </span>{" "}
                          {GCFieldLabelMap[fieldType]}
                        </Paragraph>
                        <Paragraph>
                          <span style={{ fontWeight: "bold" }}>
                            Instructions:
                          </span>{" "}
                          {field.instructions}
                        </Paragraph>
                      </Box>

                      <Box>
                        <FormControl>
                          <FormControl.Label>
                            Contentful Model Field
                          </FormControl.Label>
                          <Select
                            isDisabled={!selectedCFModel}
                            id={`select-cf-field-${fieldId}`}
                            value={cfFieldId}
                            onChange={(evt) =>
                              handleFieldSelect(evt, fieldId, field)
                            }
                          >
                            {selectedCFModel ? (
                              <CFTypeFieldOptions
                                usedFields={usedFields}
                                fields={selectedCFModel.fields}
                                gcField={field}
                              />
                            ) : (
                              <Select.Option value={field.label}>
                                {cfFieldId}
                              </Select.Option>
                            )}
                          </Select>
                        </FormControl>
                      </Box>

                      <Box>
                        <FormControl>
                          <FormControl.Label>Field Type</FormControl.Label>

                          <Select
                            id={`select-type-${fieldId}`}
                            name={fieldId}
                            defaultValue={value}
                            onChange={(evt) => onSelectCFType(evt, fieldId)}
                            isDisabled={!!selectedCFModel}
                          >
                            {selectedCFModel ? (
                              <Select.Option
                                value={mappedCfFieldType || IGNORE}
                              >
                                {
                                  contentfulTypeLabelMap[
                                    (mappedCfFieldType as CFFieldType) ||
                                      CFFieldType.Ignore
                                  ]
                                }
                              </Select.Option>
                            ) : (
                              <>
                                <FieldOption field={field} />
                                <Select.Option value={IGNORE}>
                                  Ignore
                                </Select.Option>
                              </>
                            )}
                          </Select>

                          {!mappingData.useGCEntryTitle && (
                            <EntryTitleCheckbox
                              gcFieldId={fieldId}
                              cfFieldId={cfFieldId}
                              onChange={onChangeCheckbox}
                              displayField={displayField}
                            />
                          )}
                        </FormControl>
                      </Box>
                    </Grid>
                  );
                })}
              </Flex>
            </Tabs.Panel>
          );
        })}
      </Tabs>
    </>
  );
}

import React, { useEffect, useRef, useState } from "react";
import {
  Stack,
  TextInput,
  Text,
  Textarea,
  Button,
  Flex,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import {
  CF_GC_ENTRY_NAME_FIELD,
  CF_HIDDEN_FIELD,
  repeatableTextOptions,
} from "@/consts/fieldMap";
import {
  CFFieldType,
  JSONFieldValue,
  MappingConfig,
  RepeatableTextData,
} from "@/type/types";
import { FieldAppSDK } from "@contentful/app-sdk";
import { PlusCircleIcon } from "@contentful/f36-icons";
import { ConnectedRichTextEditor } from "@contentful/field-editor-rich-text";
import { v4 as uuid } from "uuid";
import { htmlStringToDocumentOptions } from "@/utils/parser";
import { htmlStringToDocument } from "contentful-rich-text-html-parser";
import { Document, BLOCKS } from "@contentful/rich-text-types";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { getConfigFromContentType, parseMapping } from "@/utils/parseMapping";
import {
  APICredentials,
  getSingleTemplate,
  parseCredentials,
} from "@/services/api";
import { getFieldsFromStructure } from "@/utils/entriesExport";
import { Field as GCField } from "@/type/types";
import { formatDate } from "@/utils/common";

const emptyDoc: Document = {
  nodeType: BLOCKS.DOCUMENT,
  data: {},
  content: [
    {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: [
        {
          nodeType: "text",
          value: "",
          marks: [],
          data: {},
        },
      ],
    },
  ],
};

function isJSONFieldValue(value: any): value is JSONFieldValue {
  return (
    value &&
    typeof value === "object" &&
    typeof value.isPlain !== "undefined" &&
    Array.isArray(value.data)
  );
}

function isLastElementEmpty(value: JSONFieldValue) {
  const lastItem = value.data[value.data.length - 1];
  if (!lastItem) return false;
  if (value.isPlain) return !lastItem.content;
  const htmlString = documentToHtmlString(lastItem.content as Document);
  return htmlString === "<p></p>";
}

function createNewJSONFieldValue(isPlain: boolean) {
  return {
    uuid: uuid(),
    content: isPlain ? "" : emptyDoc,
  };
}

function checkCanAddNew(value: JSONFieldValue) {
  if (!value) return false;
  return value.limit
    ? value.data.length < value.limit && !isLastElementEmpty(value)
    : !isLastElementEmpty(value);
}

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const credentials = useRef<APICredentials>(
    parseCredentials(sdk.parameters.installation)
  );
  const fieldValue = sdk.field.getValue();
  const [value, setValue] = useState<JSONFieldValue>(fieldValue);
  const fieldType = sdk.field.type;
  const isTextField = fieldType === CFFieldType.Text || fieldType === CFFieldType.Symbol;
  const [isValueSupported, setIsValueSupported] = useState(
    isTextField ? false : isJSONFieldValue(value)
  );
  const canAddNew = isTextField ? false : checkCanAddNew(value);

  function onRichFieldContentChange(content: Document, uuid: string) {
    const newValue = {
      ...value,
      data: value.data.map((item) =>
        item.uuid === uuid ? { ...item, content } : item
      ),
    };
    setValue(newValue);
    sdk.field.setValue(newValue);
  }

  const renderRichTextField = (item: RepeatableTextData) => {
    const itemValue =
      typeof item.content === "string"
        ? htmlStringToDocument(item.content, htmlStringToDocumentOptions)
        : item.content;
    return (
      <ConnectedRichTextEditor
        onChange={(doc) => onRichFieldContentChange(doc, item.uuid)}
        actionsDisabled={true}
        value={itemValue}
        sdk={sdk}
      ></ConnectedRichTextEditor>
    );
  };

  function onAddNewItem() {
    const newValue = {
      ...value,
      data: [...value.data, createNewJSONFieldValue(value.isPlain)],
    };
    setValue(newValue);
    sdk.field.setValue(newValue);
  }

  function onDeleteItem(uuid: string) {
    const newValue = {
      ...value,
      data: value.data.filter((item) => item.uuid !== uuid),
    };
    setValue(newValue);
    sdk.field.setValue(newValue);
  }

  function onPlainFieldContentChange(newContent: string, uuid: string) {
    const newValue = {
      ...value,
      data: value.data.map((item) =>
        item.uuid === uuid ? { ...item, content: newContent } : item
      ),
    };
    setValue(newValue);
    sdk.field.setValue(newValue);
  }

  async function getFieldSettingsFromGC(config: MappingConfig) {
    const fieldMapping = config.fields.find(
      (field) => field.cfId === sdk.field.id
    );
    if (!fieldMapping || !repeatableTextOptions.includes(fieldMapping.type)) {
      return;
    }
    if (!credentials.current) {
      sdk.notifier.error("Missing credentials");
      return;
    }
    const mappedGCField = fieldMapping.gcId;
    const { templateId } = config;
    const template = await getSingleTemplate(credentials.current, templateId);
    if (!template?.related) {
      sdk.notifier.error("Mapped template not found");
      return;
    }
    const templateFields = getFieldsFromStructure(template.related.structure);
    const gcFieldData: GCField = templateFields[mappedGCField];
    if (!gcFieldData) {
      sdk.notifier.error("Mapped field data not found");
      return;
    }
    const isPlain = gcFieldData.metadata.is_plain || false;
    const limitEnabled = gcFieldData.metadata.repeatable?.limitEnabled || false;
    const limit = limitEnabled
      ? gcFieldData.metadata.repeatable?.limit || 2
      : undefined;
    const newValue = {
      isPlain,
      limit,
      data: [],
    };
    setValue(newValue);
    setIsValueSupported(true);
  }

  useEffect(() => {
    sdk.window.startAutoResizer();
    sdk.field.onValueChanged((newValue) => {
      setValue(newValue);
      setIsValueSupported(isJSONFieldValue(newValue));
    });
    if (sdk.field.type !== CFFieldType.Object) return;
    const value = sdk.field.getValue();
    if (value) return;
    const config = getConfigFromContentType(sdk.contentType);
    if (!config) return;
    getFieldSettingsFromGC(config);
  }, []);

  if (sdk.field.id === CF_GC_ENTRY_NAME_FIELD) {
    return <TextInput value={fieldValue} isDisabled />;
  }

  if (sdk.field.id !== CF_HIDDEN_FIELD && fieldType !== CFFieldType.Object) {
    return <Textarea value={fieldValue} onChange={sdk.field.setValue} />;
  }

  if (sdk.field.id === CF_HIDDEN_FIELD) {
    const config = parseMapping(sdk.field.getValue());
    if (!config) {
      return null;
    }
    if (!config.lastImportedAt) {
      return (
        <TextInput
          style={{ display: "none" }}
          isDisabled
          value=""
          onChange={() => {
            /* */
          }}
        />
      );
    } else {
      return (
        <Text
          marginTop="spacingS"
          marginBottom="spacingS"
          fontWeight="fontWeightMedium"
        >
          Item last imported at {formatDate(config.lastImportedAt)}
        </Text>
      );
    }
  }

  return isValueSupported ? (
    <Stack flexDirection="column">
      {(value.data || []).map((item) => {
        return (
          <Flex
            alignItems="center"
            gap="spacingXs"
            key={item.uuid}
            style={{ width: "100%" }}
          >
            {value.isPlain ? (
              <Textarea
                value={item.content as string}
                onChange={(e) =>
                  onPlainFieldContentChange(e.target.value, item.uuid)
                }
              ></Textarea>
            ) : (
              renderRichTextField(item)
            )}
            <Button onClick={() => onDeleteItem(item.uuid)} variant="negative">
              Delete
            </Button>
          </Flex>
        );
      })}
      <Button
        variant="secondary"
        isDisabled={!canAddNew}
        onClick={onAddNewItem}
        startIcon={<PlusCircleIcon />}
      >
        Add Item
      </Button>
    </Stack>
  ) : (
    <Text>
      Current field value is not supported by the Content Workflow integration
      app, should have at least isPlain and data properties.
    </Text>
  );
};

export default Field;

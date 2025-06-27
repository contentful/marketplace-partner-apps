import { Table, Flex, IconButton, Menu } from "@contentful/f36-components";
import {
  CalendarIcon,
  AssetIcon,
  EntryIcon,
  CodeIcon,
  TextIcon,
  LooksOneIcon,
  TriangleOutlineIcon,
  ToggleIcon,
  RichtextIcon,
  MoreHorizontalIcon,
  CheckCircleIcon,
} from "@contentful/f36-icons";
import { css } from "emotion";
import { useState } from "react";
import FieldValuePreview from "./FieldValuePreview";
import FieldJsonEditor from "./FieldJsonEditor";
import FieldDateConfigurator from "./FieldDateConfigurator";
import { ModalConfirm } from "@contentful/f36-modal";

import { useAppStore } from "../store/useAppStore";
import { mapFieldType, isSupportedFieldType } from "../utils";
import { getContentTypeUrl } from "../utils/links";

interface Props {
  ctId: string;
  field: any;
}

const rowAlignClass = css({
  "& td, & th": {
    verticalAlign: "middle",
  },
});

const FieldTableRow = ({ ctId, field }: Props) => {
  const ctConfigFromStore = useAppStore(
    (s: any) => s.parameters.contentTypes?.[ctId]
  );

  const ctConfig = ctConfigFromStore ?? { enabled: false, fields: {} };
  const toggleFieldSelection = useAppStore((s: any) => s.toggleFieldSelection);
  const setJsonValue = useAppStore((s: any) => s.setJsonValue);
  const setDateConfig = useAppStore((s: any) => s.setDateConfig);
  const sdk = useAppStore((s: any) => s.sdk);

  const [jsonModal, setJsonModal] = useState<{
    fieldId: string;
    current: any;
  } | null>(null);
  const [dateModal, setDateModal] = useState<{
    fieldId: string;
    current: any;
  } | null>(null);

  const { uiType, display } = mapFieldType(field);
  const isSupported = isSupportedFieldType(field);
  const fieldConfig = ctConfig.fields[field.id];
  const isSelected = !!fieldConfig;
  const isConfigured =
    isSelected &&
    (uiType === "Date" ||
      (fieldConfig?.defaultValue.value !== undefined &&
        fieldConfig?.defaultValue.value !== ""));
  const isMultiReferenceField =
    field.type === "Array" && (uiType === "Asset" || uiType === "Entry");

  const linkValue = fieldConfig?.defaultValue?.value;
  const singleSelectedInMulti =
    isMultiReferenceField && Array.isArray(linkValue) && linkValue.length === 1;

  const shouldShowDetails = !isMultiReferenceField || singleSelectedInMulti;

  const selectAsset = useAppStore((s: any) => s.selectAsset);
  const selectEntry = useAppStore((s: any) => s.selectEntry);

  const handleRowClick = () => {
    if (!isSupported) return;

    if (uiType === "Asset") selectAsset(ctId, field.id, field.type === "Array");
    else if (uiType === "Entry")
      selectEntry(ctId, field.id, field.type === "Array");
    else if (uiType === "JSON")
      setJsonModal({
        fieldId: field.id,
        current: fieldConfig?.defaultValue?.value ?? {},
      });
    else if (uiType === "Date")
      setDateModal({
        fieldId: field.id,
        current: fieldConfig?.defaultValue ?? { type: "current-date" },
      });
  };

  const icon =
    uiType === "Date" ? (
      <CalendarIcon size="tiny" style={{ fill: "#000" }} />
    ) : uiType === "Asset" ? (
      <AssetIcon size="tiny" style={{ fill: "#000" }} />
    ) : uiType === "Entry" ? (
      <EntryIcon size="tiny" style={{ fill: "#000" }} />
    ) : uiType === "JSON" ? (
      <CodeIcon size="tiny" style={{ fill: "#000" }} />
    ) : field.type === "Symbol" || field.type === "Text" ? (
      <TextIcon size="tiny" style={{ fill: "#000" }} />
    ) : field.type === "RichText" ? (
      <RichtextIcon size="tiny" style={{ fill: "#000" }} />
    ) : field.type === "Number" ? (
      <LooksOneIcon size="tiny" style={{ fill: "#000" }} />
    ) : field.type === "Location" ? (
      <TriangleOutlineIcon size="tiny" style={{ fill: "#000" }} />
    ) : field.type === "Boolean" ? (
      <ToggleIcon size="tiny" style={{ fill: "#000" }} />
    ) : null;

  const openDefaultValue = () => {
    if (!sdk) return;
    const val: any = fieldConfig?.defaultValue?.value;
    if (!val) return;

    const firstVal = Array.isArray(val) ? val[0] : val;
    if (!firstVal) return;

    if (uiType === "Asset") {
      (sdk as any).navigator?.openAsset?.(firstVal, {
        slideIn: { waitForClose: true },
      });
    } else if (uiType === "Entry") {
      (sdk as any).navigator?.openEntry?.(firstVal, {
        slideIn: { waitForClose: true },
      });
    }
  };

  const openContentType = () => {
    if (!sdk) return;
    const url = getContentTypeUrl(sdk, ctId);
    window.open(url, "_blank");
  };

  return (
    <>
      <Table.Row
        key={`${ctId}-${field.id}`}
        className={rowAlignClass}
        style={{
          opacity: isSupported ? 1 : 0.55,
          cursor: isSupported ? "pointer" : "not-allowed",
        }}
        onClick={handleRowClick}
      >
        <Table.Cell
          style={{
            maxWidth: 180,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontWeight: "bold",
            color: isSupported ? undefined : "#999999",
            paddingLeft: "20px",
          }}
        >
          {field.name}
        </Table.Cell>
        <Table.Cell>
          <Flex alignItems="center" gap="spacingXs">
            {icon}
            <span style={{ textTransform: "capitalize" }}>{display}</span>
          </Flex>
        </Table.Cell>
        <Table.Cell>
          <FieldValuePreview
            fieldType={uiType as any}
            fieldConfig={fieldConfig}
            variant="label"
          />
        </Table.Cell>
        <Table.Cell style={{ minWidth: 100, textAlign: "center" }}>
          {!shouldShowDetails ? (
            <span>—</span>
          ) : (
            <FieldValuePreview
              fieldType={uiType as any}
              fieldConfig={fieldConfig}
              variant="preview"
            />
          )}
        </Table.Cell>
        <Table.Cell style={{ textAlign: "center" }}>
          {!shouldShowDetails ? (
            "—"
          ) : (
            <FieldValuePreview
              fieldType={uiType as any}
              fieldConfig={fieldConfig}
              variant="status"
            />
          )}
        </Table.Cell>

        <Table.Cell style={{ textAlign: "center" }}>
          {isConfigured && <CheckCircleIcon variant="positive" />}
        </Table.Cell>

        <Table.Cell
          style={{
            paddingRight: "20px",
          }}
        >
          <Menu>
            <Menu.Trigger>
              <IconButton
                variant="transparent"
                size="small"
                icon={<MoreHorizontalIcon />}
                aria-label="Row actions"
                isDisabled={!isSupported}
                onClick={(e: any) => e.stopPropagation()}
              />
            </Menu.Trigger>
            <Menu.List onClick={(e: any) => e.stopPropagation()}>
              <Menu.Item
                onClick={(e: any) => {
                  e.stopPropagation();
                  handleRowClick();
                }}
                isDisabled={!isSupported}
              >
                Edit field
              </Menu.Item>

              <Menu.Item
                onClick={(e: any) => {
                  e.stopPropagation();
                  openDefaultValue();
                }}
                isDisabled={
                  !(
                    (uiType === "Asset" ||
                      uiType === "Entry" ||
                      isMultiReferenceField) &&
                    (Array.isArray(linkValue)
                      ? linkValue.length > 0
                      : linkValue && linkValue !== "")
                  )
                }
              >
                View value
              </Menu.Item>

              <Menu.Item
                onClick={() => {
                  if (!uiType) return;
                  let storeFieldType: any = uiType;
                  if (field.type === "Array" && uiType === "Asset")
                    storeFieldType = "AssetArray";
                  if (field.type === "Array" && uiType === "Entry")
                    storeFieldType = "EntryArray";
                  toggleFieldSelection(ctId, field.id, storeFieldType);
                }}
                isDisabled={!isSelected}
              >
                Clear value
              </Menu.Item>

              <Menu.Item
                onClick={(e: any) => {
                  e.stopPropagation();
                  openContentType();
                }}
                isDisabled={!sdk}
              >
                View c.type
              </Menu.Item>
            </Menu.List>
          </Menu>
        </Table.Cell>
      </Table.Row>

      {jsonModal && (
        <ModalConfirm
          isShown
          onCancel={() => setJsonModal(null)}
          onConfirm={() => {
            if (!isSelected)
              toggleFieldSelection(ctId, jsonModal.fieldId, "JSON");

            setJsonValue(ctId, jsonModal.fieldId, jsonModal.current);
            setJsonModal(null);
          }}
          title="Edit JSON default value"
          size="large"
        >
          <FieldJsonEditor
            initial={jsonModal.current}
            onValidJson={(val) =>
              setJsonModal((prev) => (prev ? { ...prev, current: val } : prev))
            }
          />
        </ModalConfirm>
      )}

      {dateModal && (
        <ModalConfirm
          isShown
          onCancel={() => setDateModal(null)}
          onConfirm={() => {
            if (!isSelected)
              toggleFieldSelection(ctId, dateModal.fieldId, "Date");

            setDateConfig(ctId, dateModal.fieldId, dateModal.current);
            setDateModal(null);
          }}
          title="Edit date default value"
          size="small"
        >
          <FieldDateConfigurator
            initial={dateModal.current}
            onChange={(val) =>
              setDateModal((prev) => (prev ? { ...prev, current: val } : prev))
            }
          />
        </ModalConfirm>
      )}
    </>
  );
};

export default FieldTableRow;

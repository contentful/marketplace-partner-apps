import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  Paragraph,
  Text,
  Select,
} from "@contentful/f36-components";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  TextIcon,
  ArchiveIcon,
  LinkIcon,
  PreviewOffIcon,
  ListBulletedIcon,
  SpreadsheetIcon,
  CheckCircleIcon,
  LooksOneIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@contentful/f36-icons";
import { FieldAppSDK } from "@contentful/app-sdk";
import { useSDK, useAutoResizer } from "@contentful/react-apps-toolkit";

import { SalesforceLogo } from "../components/Logo";
import {
  DEFAULT_SELECTED_FIELDS,
  SALESFORCE_FIELDS,
  CAMPAIGN_OPTIONS,
} from "../config";

export interface SalesforceField {
  id: string;
  label: string;
  type:
    | "text"
    | "email"
    | "url"
    | "tel"
    | "select"
    | "textarea"
    | "number"
    | "hidden"
    | "checkbox";
  required?: boolean;
  options?: string[];
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case "email":
      return (
        <ArchiveIcon className="mr-2" variant="muted" key={`icon-${type}`} />
      );
    case "url":
      return <LinkIcon className="mr-2" variant="muted" key={`icon-${type}`} />;
    case "tel":
      return (
        <LooksOneIcon className="mr-2" variant="muted" key={`icon-${type}`} />
      );
    case "select":
      return (
        <ListBulletedIcon
          className="mr-2"
          variant="muted"
          key={`icon-${type}`}
        />
      );
    case "textarea":
      return <TextIcon className="mr-2" variant="muted" key={`icon-${type}`} />;
    case "number":
      return (
        <SpreadsheetIcon
          className="mr-2"
          variant="muted"
          key={`icon-${type}`}
        />
      );
    case "checkbox":
      return (
        <CheckCircleIcon
          className="mr-2"
          variant="muted"
          key={`icon-${type}`}
        />
      );
    case "hidden":
      return (
        <PreviewOffIcon className="mr-2" variant="muted" key={`icon-${type}`} />
      );
    case "text":
    default:
      return <TextIcon className="mr-2" variant="muted" key={`icon-${type}`} />;
  }
};

const moveUp = (
  selectedSelectedItems: string[],
  selectedFields: any[],
  setSelectedFields: Function,
  sdk: FieldAppSDK,
  selectedCampaign: string,
  organizationId: string
) => {
  if (selectedSelectedItems.length !== 1) return;

  const itemId = selectedSelectedItems[0];
  const itemIndex = selectedFields.findIndex((field) => field.id === itemId);

  if (itemIndex <= 0) return;

  const newFields = [...selectedFields];
  const temp = newFields[itemIndex];
  newFields[itemIndex] = newFields[itemIndex - 1];
  newFields[itemIndex - 1] = temp;

  setSelectedFields(newFields);

  sdk.field.setValue({
    fields: newFields,
    campaignId: selectedCampaign,
    organizationId: organizationId,
  });
};

const moveDown = (
  selectedSelectedItems: string[],
  selectedFields: any[],
  setSelectedFields: Function,
  sdk: FieldAppSDK,
  selectedCampaign: string,
  organizationId: string
) => {
  if (selectedSelectedItems.length !== 1) return;

  const itemId = selectedSelectedItems[0];
  const itemIndex = selectedFields.findIndex((field) => field.id === itemId);

  if (itemIndex === -1 || itemIndex >= selectedFields.length - 1) return;

  const newFields = [...selectedFields];
  const temp = newFields[itemIndex];
  newFields[itemIndex] = newFields[itemIndex + 1];
  newFields[itemIndex + 1] = temp;

  setSelectedFields(newFields);

  sdk.field.setValue({
    fields: newFields,
    campaignId: selectedCampaign,
    organizationId: organizationId,
  });
};

const hasRequiredFields = (selectedItems: string[], fields: any[]) => {
  return selectedItems.some((itemId) => {
    const field = fields.find((f) => f.id === itemId);
    return field && field.required === true;
  });
};

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();

  useAutoResizer();

  const [selectedFields, setSelectedFields] = useState<Array<any>>([]);
  const [availableFields, setAvailableFields] = useState<Array<any>>([]);

  const [selectedAvailableItems, setSelectedAvailableItems] = useState<
    string[]
  >([]);
  const [selectedSelectedItems, setSelectedSelectedItems] = useState<string[]>(
    []
  );

  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [organizationId, setOrganizationId] = useState<string>("");

  useEffect(() => {
    const installationParams = sdk.parameters.installation || {};
    const orgId = installationParams.organizationId || "";
    setOrganizationId(orgId);

    const currentValue = sdk.field.getValue();

    if (!currentValue) {
      setSelectedFields(DEFAULT_SELECTED_FIELDS);

      setAvailableFields(
        SALESFORCE_FIELDS.filter(
          (field) =>
            !DEFAULT_SELECTED_FIELDS.some(
              (selectedField) => selectedField.id === field.id
            )
        )
      );

      sdk.field.setValue({
        fields: DEFAULT_SELECTED_FIELDS,
        campaignId: "",
        organizationId: orgId,
      });
    } else {
      if (Array.isArray(currentValue)) {
        setSelectedFields(currentValue);
        setAvailableFields(
          SALESFORCE_FIELDS.filter(
            (field) =>
              !currentValue.some(
                (selectedField: any) => selectedField.id === field.id
              )
          )
        );

        sdk.field.setValue({
          fields: currentValue,
          campaignId: "",
          organizationId: orgId,
        });
      } else {
        const fields = currentValue.fields || [];
        const campaignId = currentValue.campaignId || "";
        const savedOrgId = currentValue.organizationId || orgId;

        setSelectedFields(fields);
        setSelectedCampaign(campaignId);
        setOrganizationId(savedOrgId);

        setAvailableFields(
          SALESFORCE_FIELDS.filter(
            (field) =>
              !fields.some(
                (selectedField: any) => selectedField.id === field.id
              )
          )
        );
      }
    }

    sdk.window.startAutoResizer();

    return () => {
      sdk.window.stopAutoResizer();
    };
  }, [sdk.field, sdk.window, sdk.parameters.installation]);

  const toggleAvailableSelection = (fieldId: string) => {
    setSelectedAvailableItems((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const toggleSelectedSelection = (fieldId: string) => {
    setSelectedSelectedItems((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const moveToSelected = () => {
    if (selectedAvailableItems.length === 0) return;

    const fieldsToMove = availableFields.filter((field) =>
      selectedAvailableItems.includes(field.id)
    );
    const updatedSelected = [...selectedFields, ...fieldsToMove].map(
      (field) => ({
        ...field,
        _key: `selected-${field.id}-${Date.now()}`,
      })
    );
    const updatedAvailable = availableFields.filter(
      (field) => !selectedAvailableItems.includes(field.id)
    );

    setSelectedFields(updatedSelected);
    setAvailableFields(updatedAvailable);
    setSelectedAvailableItems([]);

    sdk.field.setValue({
      fields: updatedSelected,
      campaignId: selectedCampaign,
      organizationId: organizationId,
    });
  };

  const moveToAvailable = () => {
    if (selectedSelectedItems.length === 0) return;

    if (hasRequiredFields(selectedSelectedItems, selectedFields)) {
      setSelectedSelectedItems([]);
      return;
    }

    const fieldsToMove = selectedFields.filter((field) =>
      selectedSelectedItems.includes(field.id)
    );
    const updatedSelected = selectedFields.filter(
      (field) => !selectedSelectedItems.includes(field.id)
    );
    const updatedAvailable = [...availableFields, ...fieldsToMove].map(
      (field) => ({
        ...field,
        _key: `available-${field.id}-${Date.now()}`,
      })
    );

    setSelectedFields(updatedSelected);
    setAvailableFields(updatedAvailable);
    setSelectedSelectedItems([]);

    sdk.field.setValue({
      fields: updatedSelected,
      campaignId: selectedCampaign,
      organizationId: organizationId,
    });
  };

  const isCampaignSelected = selectedFields.some(
    (field) => field.id === "Campaign_ID"
  );

  const handleCampaignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const campaignId = e.target.value;
    setSelectedCampaign(campaignId);

    sdk.field.setValue({
      fields: selectedFields,
      campaignId: campaignId,
      organizationId: organizationId,
    });
  };

  return (
    <Box className="min-h-[400px]">
      <Heading marginBottom="spacingM" className="flex items-center gap-2">
        <SalesforceLogo className="max-w-[60px] mr-1 my-2 mb-1" />
        Salesforce Form Fields
      </Heading>
      <Paragraph marginBottom="spacingL">
        Select which Salesforce fields to include in your form by moving them
        between the Available and Selected columns.
      </Paragraph>

      <Flex
        justifyContent="space-between"
        alignItems="stretch"
        className="max-w-full pr-1"
      >
        <Box className="w-[46%] flex flex-col">
          <Heading as="h3" marginBottom="spacing2Xs">
            Available Fields
          </Heading>
          <Box className="h-[30px] flex items-center" marginBottom="spacing2Xs">
            <Text fontColor="gray500" fontSize="fontSizeS">
              Select fields to add to your form
            </Text>
          </Box>
          <Box className="h-[270px] overflow-y-auto">
            {availableFields.map((field) => (
              <Box
                key={field._key || `available-${field.id}`}
                className={`p-2 mb-1 rounded border border-solid ${
                  selectedAvailableItems.includes(field.id)
                    ? "bg-[rgb(232,245,255)] border-[rgb(64,160,255)]"
                    : "border-[#e5e9eb] bg-white hover:bg-[#f5f7f9] hover:border-[#c3cfd5]"
                } cursor-pointer w-full block transition-colors duration-150`}
                onClick={() => toggleAvailableSelection(field.id)}
              >
                <Text
                  style={{
                    color: selectedAvailableItems.includes(field.id)
                      ? "rgb(0, 89, 200)"
                      : "inherit",
                  }}
                  className="flex items-center overflow-hidden whitespace-nowrap"
                >
                  {getFieldIcon(field.type)}
                  <span className="truncate">{field.label}</span>
                  {field.required && (
                    <span className="text-red-500 ml-1 flex-shrink-0">*</span>
                  )}
                </Text>
              </Box>
            ))}
            {availableFields.length === 0 && (
              <Paragraph fontColor="gray500">No available fields</Paragraph>
            )}
          </Box>
        </Box>

        <Box className="flex flex-col justify-center items-center w-[8%] gap-2 mx-2">
          <Button
            variant="secondary"
            className="w-8 h-8 p-0 min-w-0 flex items-center justify-center mx-auto"
            startIcon={<ChevronRightIcon />}
            isDisabled={selectedAvailableItems.length === 0}
            onClick={moveToSelected}
            size="small"
            aria-label="Move to selected"
          />
          <Button
            variant="secondary"
            className="w-8 h-8 p-0 min-w-0 flex items-center justify-center mx-auto"
            startIcon={<ChevronLeftIcon />}
            isDisabled={
              selectedSelectedItems.length === 0 ||
              hasRequiredFields(selectedSelectedItems, selectedFields)
            }
            onClick={moveToAvailable}
            size="small"
            aria-label={
              hasRequiredFields(selectedSelectedItems, selectedFields)
                ? "Cannot remove required fields"
                : "Move to available"
            }
          />
        </Box>

        <Box className="w-[46%] flex flex-col">
          <Heading as="h3" marginBottom="spacing2Xs">
            Selected Fields
          </Heading>
          <Box
            className="h-[30px] flex items-center justify-between"
            marginBottom="spacing2Xs"
          >
            <Text fontColor="gray500" fontSize="fontSizeS">
              {selectedSelectedItems.length === 0 ? (
                <span>Select a field to reorder</span>
              ) : selectedSelectedItems.length === 1 ? (
                <span>Now use arrows to reorder</span>
              ) : (
                <span className="text-orange-500">
                  Select only one field to reorder
                </span>
              )}
            </Text>
            <div className="flex space-x-1">
              <Button
                variant="transparent"
                className="w-6 h-4 p-0 min-w-0 flex items-center justify-center"
                startIcon={<ChevronUpIcon size="tiny" />}
                isDisabled={
                  selectedSelectedItems.length !== 1 ||
                  selectedFields.length <= 1 ||
                  (selectedSelectedItems.length === 1 &&
                    selectedFields.findIndex(
                      (field) => field.id === selectedSelectedItems[0]
                    ) === 0)
                }
                onClick={() =>
                  moveUp(
                    selectedSelectedItems,
                    selectedFields,
                    setSelectedFields,
                    sdk,
                    selectedCampaign,
                    organizationId
                  )
                }
                size="small"
                aria-label="Move field up"
              />
              <Button
                variant="transparent"
                className="w-6 h-4 p-0 min-w-0 flex items-center justify-center"
                startIcon={<ChevronDownIcon size="tiny" />}
                isDisabled={
                  selectedSelectedItems.length !== 1 ||
                  selectedFields.length <= 1 ||
                  (selectedSelectedItems.length === 1 &&
                    selectedFields.findIndex(
                      (field) => field.id === selectedSelectedItems[0]
                    ) ===
                      selectedFields.length - 1)
                }
                onClick={() =>
                  moveDown(
                    selectedSelectedItems,
                    selectedFields,
                    setSelectedFields,
                    sdk,
                    selectedCampaign,
                    organizationId
                  )
                }
                size="small"
                aria-label="Move field down"
              />
            </div>
          </Box>
          <Box className="h-[270px] overflow-y-auto">
            {selectedFields.map((field) => (
              <Flex
                key={field._key || `selected-${field.id}`}
                justifyContent="space-between"
                alignItems="center"
                className="mb-1"
              >
                <Box
                  className={`p-2 rounded border border-solid ${
                    selectedSelectedItems.includes(field.id)
                      ? "bg-[rgb(232,245,255)] border-[rgb(64,160,255)]"
                      : field.required
                      ? "border-[#e5e9eb] bg-white hover:bg-[#f5f7f9] hover:border-[#c3cfd5]"
                      : "border-[#e5e9eb] bg-white hover:bg-[#f5f7f9] hover:border-[#c3cfd5]"
                  } cursor-pointer w-full block transition-colors duration-150`}
                  onClick={() => toggleSelectedSelection(field.id)}
                  title={
                    field.required
                      ? "Required field - cannot be removed"
                      : "Click to select"
                  }
                >
                  <Text
                    style={{
                      color: selectedSelectedItems.includes(field.id)
                        ? "rgb(0, 89, 200)"
                        : "inherit",
                    }}
                    className="flex items-center overflow-hidden whitespace-nowrap"
                  >
                    {getFieldIcon(field.type)}
                    <span className="truncate">{field.label}</span>
                    {field.required && (
                      <span className="text-red-500 ml-1 flex-shrink-0 font-bold">
                        *
                      </span>
                    )}
                  </Text>
                </Box>
              </Flex>
            ))}
            {selectedFields.length === 0 && (
              <Paragraph fontColor="gray500">No fields selected</Paragraph>
            )}
          </Box>
        </Box>
      </Flex>

      {isCampaignSelected && (
        <Box
          marginTop="spacingL"
          className="p-1 border border-solid border-[#e5e9eb] rounded"
        >
          <Heading as="h3" marginBottom="spacingS">
            Campaign Selection
          </Heading>
          <Paragraph marginBottom="spacingM">
            Select a default campaign for the form
          </Paragraph>
          <Select
            id="campaign-selector"
            name="Campaign_ID"
            value={selectedCampaign}
            onChange={handleCampaignChange}
          >
            {CAMPAIGN_OPTIONS.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </Box>
      )}
    </Box>
  );
};

export default Field;

import React, { useCallback, useState, useEffect } from "react";
import type { AppExtensionSDK } from "@contentful/app-sdk";
import {
  Heading,
  Form,
  Flex,
  TextInput,
  Text,
  SectionHeading,
} from "@contentful/f36-components";
import { Entry } from "contentful-management";
import { css } from "emotion";
import { useCMA, useSDK } from "@contentful/react-apps-toolkit";
import { FormControl, Select } from "@contentful/f36-components";
import { Multiselect } from "@contentful/f36-multiselect";
import { PlusIcon, WarningIcon } from "@contentful/f36-icons";
import RulesList from "../components/RulesList";
import { type Rule } from "../types/Rule";
import { getFieldName } from "../utils";
import packageData from "../../package.json";

const version = packageData.version;
export interface AppInstallationParameters {
  rules: Rule[];
}

// A field whose value will be managed in this app's state
type ManagedFieldValue = string;

interface CustomSelectOptions {
  id: string;
  name: string;
}
interface CustomSelectProps {
  className?: any;
  isDisabled?: boolean;
  value?: ManagedFieldValue;
  fieldId: string;
  options: CustomSelectOptions[];
  handleChange: (fieldId: string, value: string) => void;
  sdk?: any;
}

const COMPARISON_CONDITIONS = [
  "contains",
  "is equal",
  "is not equal",
  "is empty",
  "is not empty",
];

const COMPARISON_CONDITIONS_NON_TEXT_FIELD = ["is empty", "is not empty"];

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    rules: [],
  });
  const [isRuleDeleted, setIsRuleDeleted] = useState(false);
  const [ruleToEditIndex, setRuleToEditIndex] = useState<number>();
  const sdk = useSDK<AppExtensionSDK>();

  const [contentTypes, setContentTypes] = useState<any>([]);
  const [contentType, setContentType] = useState<string>("");
  const [contentTypeField, setContentTypeField] = useState<string>("");
  const [condition, setCondition] = useState<string>("");
  const [conditionOptions, setConditionOptions] = useState<string[]>(
    COMPARISON_CONDITIONS
  );
  const [conditionValue, setConditionValue] = useState<string>("");
  const [conditionValueOptions, setConditionValueOptions] = useState<string[]>(
    []
  );
  const [childEntities, setChildEntities] = useState<any>([]);
  const [targetEntities, setTargetEntities] = useState<any>([]);
  const [targetEntity, setTargetEntity] = useState<string>("");
  const [targetEntityFields, setTargetEntityFields] = useState<any>([]);
  const [targetEntityField, setTargetEntityField] = useState<string[]>([]);

  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  const cma = useCMA();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    if (isRuleDeleted) {
      setIsRuleDeleted(false);
      return {
        // Parameters to be persisted as the app configuration.
        parameters,
        // In case you don't want to submit any update to app
        // locations, you can just pass the currentState as is
        targetState: currentState,
      };
    }

    // Validate and save rule fields
    if (
      !contentType ||
      !contentTypeField ||
      !condition ||
      !targetEntity ||
      !targetEntityField.length
    ) {
      sdk.notifier.error("Please fill out all fields");
      throw new Error("Please fill out all fields");
    }

    if (
      conditionValue === "" &&
      condition !== "is empty" &&
      condition !== "is not empty"
    ) {
      sdk.notifier.error("Please enter a condition value");
      throw new Error("Please enter a condition value");
    }

    const suffixIndex = targetEntity.indexOf("-sameEntity");
    const isForSameEntity = suffixIndex !== -1;

    const newRule: Rule = {
      contentType,
      contentTypeField,
      condition,
      conditionValue,
      isForSameEntity,
      targetEntity: isForSameEntity
        ? targetEntity.substring(0, suffixIndex)
        : targetEntity,
      targetEntityField,
    };

    let newRules = [];
    if (!parameters.rules) {
      newRules.push(newRule);
    } else if (ruleToEditIndex !== undefined) {
      const rulesCopy = [...parameters.rules];
      rulesCopy.splice(ruleToEditIndex, 1, newRule);

      newRules = rulesCopy;
    } else {
      newRules = [...parameters.rules, newRule];
    }

    // update default entry editor
    if (currentState && !currentState.EditorInterface[targetEntity]) {
      currentState.EditorInterface[targetEntity] = {
        editors: {
          position: 0,
          settings: {},
        },
      };
    }

    if (currentState && !currentState.EditorInterface[contentType]) {
      currentState.EditorInterface[contentType] = {
        editors: {
          position: 0,
          settings: {},
        },
      };
    }

    setParameters({
      ...parameters,
      rules: newRules,
    });
    setContentType("");
    setContentTypeField("");
    setCondition("");
    setConditionValue("");
    setTargetEntity("");
    setTargetEntityField([]);
    setRuleToEditIndex(undefined);

    //uncomments and save config screent to reset rules
    //return {};

    return {
      // Parameters to be persisted as the app configuration.
      parameters: {
        ...parameters,
        rules: newRules,
      },
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [
    sdk.app,
    sdk.notifier,
    isRuleDeleted,
    contentType,
    contentTypeField,
    condition,
    targetEntity,
    targetEntityField,
    conditionValue,
    parameters,
    ruleToEditIndex,
  ]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    if (ruleToEditIndex !== undefined) {
      const ruleToEdit = parameters.rules[ruleToEditIndex];

      setContentType(ruleToEdit.contentType);
      // The fields are fetched dynamically based on content type
      setTimeout(() => {
        setContentTypeField(ruleToEdit.contentTypeField);
        setCondition(ruleToEdit.condition);
        setConditionValue(ruleToEdit.conditionValue);
        // If the rule is set for same entity, add `-sameEntity` to targetEntity
        setTargetEntity(`${ruleToEdit.isForSameEntity ? `${ruleToEdit.targetEntity}-sameEntity`: ruleToEdit.targetEntity}`);
        setTargetEntityField(ruleToEdit.targetEntityField);
      }, 100);
    }
  }, [ruleToEditIndex, parameters.rules]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  useEffect(() => {
    cma.contentType
      .getMany({
        query: {
          skip: 0,
          limit: 100,
        },
      })
      .then((data) => {
        setContentTypes(data.items);
      });
  }, [cma.contentType]);

  useEffect(() => {
    setContentTypeField("");
    setConditionValue("");
    setTargetEntity("");
  }, [contentType]);

  useEffect(() => {
    setCondition("");
    setConditionValueOptions([]);

    if (contentType && contentTypeField) {
      const contentTypeObj = contentTypes.find(
        (c: any) => c.sys.id === contentType
      );
      const contentTypeFieldObj = contentTypeObj?.fields.find(
        (f: any) => f.id === contentTypeField
      );
      const validation = contentTypeFieldObj?.validations?.find(
        (v: any) => v.in
      );

      if (validation) {
        setConditionValueOptions(validation.in);
      }
      const conditionOptions =
        contentTypes
          .find((c: any) => c.sys.id === contentType)
          .fields.find((f: any) => f.id === contentTypeField)?.type === "Symbol"
          ? COMPARISON_CONDITIONS
          : COMPARISON_CONDITIONS_NON_TEXT_FIELD;

      setConditionOptions(conditionOptions);
    }
  }, [contentTypeField, contentType, contentTypes]);

  // get child entities of main content type
  useEffect(() => {
    cma.contentType.get({ contentTypeId: contentType }).then((data) => {
      const children = data?.fields;
      let childrenEntities: any[] = [];

      children?.forEach((obj) => {
        const linkedContentTypes =
          obj.validations?.[0]?.linkContentType ||
          obj.items?.validations?.[0]?.linkContentType;
        if (linkedContentTypes?.length) {
          childrenEntities = [...childrenEntities, ...linkedContentTypes];
        }
      });

      if (children) {
        // filter fields with type reference
        setChildEntities(
          children?.filter((obj: any) => !obj.hasOwnProperty("items"))
        );

        const targetEntities = [
          {
            id: `${contentType}-sameEntity`,
            name: `${
              contentTypes.find((c: Entry) => c.sys.id === contentType)?.name
            } (Same Entry)`,
          },
          ...childrenEntities.map((contentType) => ({
            id: contentType,
            name: contentTypes.find((c: Entry) => c.sys.id === contentType)
              ?.name,
          })),
        ];

        setTargetEntities(targetEntities);
      }
    });
  }, [contentType, cma.contentType, contentTypes]);

  useEffect(() => {
    setTargetEntityField([]);

    if (!targetEntity) return;

    const suffixIndex = targetEntity.indexOf("-sameEntity");
    const isForSameEntity = suffixIndex !== -1;

    cma.contentType
      .get({
        contentTypeId: isForSameEntity
          ? targetEntity.substring(0, suffixIndex)
          : targetEntity,
      })
      .then((data) => {
        // only show fields that are not required
        let fields = data?.fields.filter((field) => !field.required);

        if (fields) {
          // filter contentTypeField from fields
          if (isForSameEntity && targetEntity.substring(0, suffixIndex) === contentType) {
            fields = fields.filter((field) => field.id !== contentTypeField);
          }

          setTargetEntityFields(fields);
        }
      });
  }, [contentTypeField, targetEntity, cma.contentType, contentType]);

  const updateInput = (fieldId: string, value: string) => {
    //do update
    if (fieldId === "contentType") {
      setContentType(value as string);
    }
    if (fieldId === "contentTypeField") {
      setContentTypeField(value as string);
    }
    if (fieldId === "condition") {
      setCondition(value as string);
    }
    if (fieldId === "conditionValue") {
      setConditionValue(value as string);
    }
    if (fieldId === "targetEntity") {
      setTargetEntity(value as string);
    }
  };

  // A stateful Select component that mimics Contentful's default
  const CustomSelect = (props: CustomSelectProps) => {
    const {
      isDisabled = false,
      fieldId,
      handleChange,
      value,
      options,
      className,
    } = props;

    return (
      <FormControl
        isRequired
        className={className ? className : css({ margin: 0 })}
      >
        <Select
          isDisabled={isDisabled}
          id={`optionSelect-controlled-${fieldId}`}
          name={`optionSelect-controlled-${fieldId}`}
          onChange={(e) => handleChange(fieldId, e.target.value)}
          value={value}
        >
          <Select.Option value="" isDisabled>
            Please select an option...
          </Select.Option>
          {options?.map((option) => (
            <Select.Option
              key={`custom-select-option-${option.id}`}
              value={option.id}
            >
              {option.name}
            </Select.Option>
          ))}
        </Select>
      </FormControl>
    );
  };

  const deleteRule = (rule: Rule) => {
    const rulesCopy = [...parameters.rules];
    const i = rulesCopy.findIndex((r) => r === rule);

    rulesCopy.splice(i, 1);

    setParameters({
      ...parameters,
      rules: rulesCopy,
    });
    setIsRuleDeleted(true);
  };

  return (
    <Flex
      flexDirection="column"
      className={css({ margin: 45, maxWidth: "100vw" })}
    >
      <Form>
        <Heading className={css({ marginBottom: 35 })}>
          <svg
            id="FINAL"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 125.63 127.95"
            width="36px"
            style={{
              marginRight: "0.5rem",
            }}
          >
            <defs>
              <style>
                {
                  "\n      .cls-1 {\n        fill: none;\n      }\n\n      .cls-2 {\n        clip-path: url(#clippath);\n      }\n\n      .cls-3 {\n        fill: #c3baf2;\n      }\n\n      .cls-4 {\n        fill: #0d2830;\n      }\n    "
                }
              </style>
              <clipPath id="clippath">
                <path
                  className="cls-1"
                  d="m114.49,48.2H47.75c-4.82,0-8.73,3.76-8.73,8.4v14.03c0,4.64,3.91,8.4,8.73,8.4h66.75c4.82,0,8.73-3.76,8.73-8.4v-14.04c0-4.64-3.91-8.4-8.73-8.4Zm-64.53,8.92c-.28.06-.54.16-.77.31.23-.15.49-.26.77-.31Zm-.77,12.68c.23.15.49.26.77.31-.28-.06-.54-.16-.77-.31Z"
                />
              </clipPath>
            </defs>
            <path
              className="cls-4"
              d="m59.86,124.75l59.92.35c1.75.01,3.16-1.38,3.18-3.14l.14-23.63c.01-1.75-1.38-3.16-3.14-3.18l-59.92-.35c-1.75-.01-3.16,1.38-3.18,3.14l-.14,23.63c-.01,1.75,1.38,3.16,3.14,3.18Z"
            />
            <g>
              <path
                className="cls-4"
                d="m38.52,104.22s-2.69,10.08-3.05,12.22c-.27-1.72-3.26-12.26-3.26-12.26l-5.26-.03-3.27,12.22-3.08-12.26-7.82-.05.05-7.93-6.1-.04-.05,7.93-3.33-.02-1.61,5.53,4.87.03-.09,15.29,6.1.04.09-15.29,3.23.02,4.47,15.32,5.79.04,3.3-12.96,3.43,13,5.86.04,6.02-20.79-6.28-.04Z"
              />
              <path
                className="cls-4"
                d="m42.78,119.53l-1.61,5.53,5.68.03,1.61-5.53-5.68-.03Z"
              />
            </g>
            <g>
              <circle className="cls-4" cx={108.23} cy={17.83} r={14.97} />
              <path
                className="cls-4"
                d="m82.08,32.85l-76.87-.47c-1.75-.01-3.15-1.42-3.14-3.18l.14-23.63c.01-1.75,1.42-2.66,3.18-2.65h76.87c1.75.01,3.15,1.4,3.14,3.16l-.14,23.63c-.01,1.75-1.46,3.15-3.18,3.14Z"
              />
            </g>
            <path
              className="cls-3"
              d="m17.08,48.2c-8.53-.05-15.48,6.81-15.53,15.31-.05,8.49,6.81,15.48,15.34,15.53,8.53.05,15.48-6.81,15.53-15.34.05-8.53-6.81-15.44-15.34-15.49Zm4.04,19.58c-2.29,2.26-6.01,2.24-8.28-.05s-2.24-6.01.05-8.28c2.29-2.26,6.01-2.24,8.28.05,2.26,2.29,2.24,6.01-.05,8.28Z"
            />
            <g>
              <path
                className="cls-4"
                d="m45.89,102.87h-.44v-1.59h-.6v-.38h1.63v.38h-.6v1.59Z"
              />
              <path
                className="cls-4"
                d="m47.47,102.87l-.27-1.05c-.02-.09-.04-.15-.05-.19-.01-.06-.02-.07-.04-.13,0,.07,0,.12,0,.15v.19s0,1.03,0,1.03h-.4v-1.97h.62l.25,1.03c.04.15.07.32.09.44,0-.04.01-.06.01-.06l.03-.13s.02-.08.03-.13c.01-.06.03-.12.03-.13l.26-1.02h.62v1.97h-.4v-1.21s0-.08,0-.15c-.03.12-.05.2-.06.22-.02.05-.03.09-.03.09l-.27,1.05h-.44Z"
              />
            </g>
            <g className="cls-2">
              <image
                width={352}
                height={129}
                transform="translate(38.85 48.13) scale(.24)"
                xlinkHref="data:image/png;base64,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"
              />
            </g>
          </svg>
          FlexFields App Config
        </Heading>
        {isRuleDeleted ? (
          <Flex
            alignItems="center"
            gap="8px"
            className={css({
              border: "1px solid #aaa",
              borderRadius: 10,
              padding: 15,
              marginBottom: 24,
            })}
          >
            <WarningIcon
              className={css({
                fill: "#EED202",
              })}
            />
            <SectionHeading
              className={css({
                margin: 0,
              })}
            >
              Please click Save to update the app configuration
            </SectionHeading>
          </Flex>
        ) : (
          <>
            <Flex
              alignItems="center"
              gap="8px"
              className={css({ margin: "1.5rem 0" })}
            >
              <PlusIcon />
              <SectionHeading
                className={css({
                  fontSize: 14,
                  margin: 0,
                })}
              >
                Add new rule(s) below
              </SectionHeading>
            </Flex>
            <Flex
              alignItems="center"
              className={css({ width: "100%", marginBottom: 20 })}
              flexDirection="row"
            >
              <Text className={css({ minWidth: 150 })}>For content type</Text>
              <CustomSelect
                value={contentType}
                fieldId="contentType"
                options={
                  contentTypes.map((c: any) => ({
                    id: c.sys.id,
                    name: c.name,
                  })) as CustomSelectOptions[]
                }
                handleChange={updateInput}
              />
            </Flex>
            {contentType && (
              <>
                <Flex
                  alignItems="center"
                  className={css({ width: "100%" })}
                  flexDirection="row"
                >
                  <Text className={css({ minWidth: 150 })}>With field</Text>
                  <CustomSelect
                    value={contentTypeField}
                    fieldId="contentTypeField"
                    options={
                      childEntities.map((child: any) => ({
                        id: child.id,
                        name: child.name,
                      })) as CustomSelectOptions[]
                    }
                    handleChange={updateInput}
                  />
                  <Text className={css({ minWidth: 100, marginLeft: 40 })}>
                    Condition
                  </Text>
                  <CustomSelect
                    value={condition}
                    fieldId="condition"
                    options={conditionOptions.map((condition) => ({
                      id: condition,
                      name: condition,
                    }))}
                    handleChange={updateInput}
                  />
                  {/* only show if condition is contains, is equal or is not equal */}
                  {(condition === "contains" ||
                    condition === "is equal" ||
                    condition === "is not equal") &&
                    (conditionValueOptions.length &&
                    condition !== "contains" ? (
                      <CustomSelect
                        className={css({ width: "200px", margin: "0 1rem" })}
                        value={conditionValue}
                        fieldId="conditionValue"
                        options={
                          conditionValueOptions?.map((option: string) => ({
                            id: option,
                            name: option,
                          })) as CustomSelectOptions[]
                        }
                        handleChange={updateInput}
                      />
                    ) : (
                      <TextInput
                        value={conditionValue}
                        type="text"
                        onChange={(e) => {
                          updateInput("conditionValue", e.target.value);
                        }}
                        placeholder="Condition value"
                        className={css({ width: "200px", margin: "0 1rem" })}
                      />
                    ))}
                </Flex>
                <SectionHeading className={css({ margin: "20px 10px 0 0" })}>
                  Hide field:
                </SectionHeading>
                <Flex
                  alignItems="center"
                  className={css({ marginBottom: 20, width: "100%" })}
                  flexDirection="row"
                >
                  <Text className={css({ minWidth: 150 })}>
                    Within content type
                  </Text>
                  <CustomSelect
                    value={targetEntity}
                    fieldId="targetEntity"
                    options={
                      targetEntities?.map((target: any) => ({
                        id: target.id,
                        name: target.name,
                      })) as CustomSelectOptions[]
                    }
                    handleChange={updateInput}
                  />
                  <Text className={css({ marginLeft: 40, minWidth: 100 })}>
                    Hide field
                  </Text>
                  <Multiselect
                    currentSelection={getFieldName(
                      targetEntityField,
                      targetEntity,
                      contentTypes
                    )}
                    className={css({ width: 300 })}
                  >
                    {targetEntityFields.map((tef: any) => {
                      return (
                        <Multiselect.Option
                          key={`key-${tef.id}}`}
                          itemId={`space-${tef.id}}`}
                          value={tef.id}
                          label={`${tef.name} ${tef.disabled ? '(Hidden when editing)' : ''}`}
                          onSelectItem={(ev) => {
                            setTargetEntityField((targetEntityField) => {
                              if (targetEntityField?.includes(tef.id)) {
                                const targetEntityFieldCopy = [
                                  ...targetEntityField,
                                ];
                                targetEntityFieldCopy.splice(
                                  targetEntityField.findIndex(
                                    (val) => val === ev.target.value
                                  ),
                                  1
                                );
                                return targetEntityFieldCopy;
                              }
                              return [...targetEntityField, ev.target.value];
                            });
                          }}
                          isChecked={targetEntityField.includes(tef.id)}
                        />
                      );
                    })}
                  </Multiselect>
                </Flex>
              </>
            )}
          </>
        )}
      </Form>

      {!!parameters.rules && (
        <RulesList
          deleteRule={deleteRule}
          rules={parameters.rules}
          setRuleToEditIndex={setRuleToEditIndex}
          ruleToEditIndex={ruleToEditIndex}
        />
      )}

      <Text
        className={css({
          marginTop: "1rem",
        })}
      >
        Built by{" "}
        <a
          href="https://thrillworks.com?ref=flexfields"
          className={css({
            fontWeight: "bold",
            color: "rgb(1, 71, 81)",
            transition: "all 0.2s ease-in-out",
            ":hover": {
              color: "rgb(239, 150, 89)",
            },
          })}
        >
          Thrillworks
        </a>
        .
      </Text>
      {version && <Text className="build-version">{`Version ${version}`}</Text>}
    </Flex>
  );
};

export default ConfigScreen;

import { EditorAppSDK } from "@contentful/app-sdk";

import {
  Autocomplete,
  Badge,
  Box,
  Button,
  Card,
  EntityStatus,
  EntryCard,
  Flex,
  Form,
  FormControl,
  Heading,
  MenuItem,
  Note, Popover,
  SectionHeading,
  Stack
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import {
  ContentTypeProps,
  EntryProps,
  KeyValueMap,
  MetaSysProps,
} from "contentful-management";
import { cloneDeep } from "lodash";
import get from "lodash/get";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ContentTypesContext } from "../contexts/ContentTypesContext";
import {
  Experiment,
  ExperimentContext
} from "../contexts/ExperimentContext";
import useInterval from "@use-it/interval";

const PopoverWrapper = ({
  children,
  buttonText,
  buttonProps,
}: {
  children: JSX.Element;
  buttonText: string;
  buttonProps?: { [key: string]: string };
}) => {
  const [modalShown, setModalShown] = useState(false);

  return (
    <Popover onClose={() => setModalShown(false)} isOpen={modalShown}>
      <Popover.Trigger>
        <Button {...buttonProps} onClick={() => setModalShown(true)}>
          {buttonText}
        </Button>
      </Popover.Trigger>
      <Popover.Content>
        <Box padding="spacingM">{children}</Box>
      </Popover.Content>
    </Popover>
  );
};

const ContentTypeField = ({
  variantName,
  setVariants,
}: {
  variantName: string;
  setVariants: (variants: EntryProps[] | undefined) => void;
}) => {
  const sdk = useSDK<EditorAppSDK>();
  const { contentTypes } = useContext(ContentTypesContext);
  const [filteredItems, setFilteredItems] = React.useState(contentTypes);

  const handleInputValueChange = (value: string) => {
    const newFilteredItems = contentTypes.filter((item) =>
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredItems(newFilteredItems);
  };

  const handleChangeVariant = (
    variantName: string,
    metaSysPropsId?: string
  ) => {
    if (!metaSysPropsId) {
      throw new Error("Missing prop id");
    }
    const values = sdk.entry.fields.variants.getValue() ?? [];
    const meta = sdk.entry.fields.meta.getValue() ?? {};

    sdk.entry.fields.meta.setValue({
      ...meta,
      [variantName]: metaSysPropsId,
    });

    const newVariants = [
      ...values,
      {
        sys: {
          type: "Link",
          id: metaSysPropsId,
          linkType: "Entry",
        },
      },
    ];

    setVariants(newVariants);
    sdk.entry.fields.variants.setValue(newVariants);
  };

  const handleSelectItem = async (
    item: ContentTypeProps,
    variantName: string
  ) => {
    const data = await sdk.navigator.openNewEntry(item.sys.id, {
      slideIn: true,
    });

    if (!data) {
      return;
    }

    handleChangeVariant(variantName, data.entity?.sys.id);
  };

  const handleLinkExistingClick = async (newVariantName: string) => {
    const data = (await sdk.dialogs.selectSingleEntry({
      locale: sdk.locales.default,
      contentTypes: contentTypes.map((contentType) => contentType.sys.id),
    })) as EntryProps | undefined;

    if (!data) {
      return;
    }

    handleChangeVariant(newVariantName, data.sys.id);
  };

  return (
    <Stack>
      <PopoverWrapper buttonText="Create new content type">
        <>
          <FormControl.Label isRequired>
            Contently Content Type
          </FormControl.Label>
          <Autocomplete
            items={filteredItems}
            onInputValueChange={handleInputValueChange}
            onSelectItem={(item: ContentTypeProps) =>
              handleSelectItem(item, variantName)
            }
            itemToString={(item) => item.name}
            renderItem={(item) => `${item.name} (${item.sys.id})`}
          />
        </>
      </PopoverWrapper>
      <Button
        variant="positive"
        onClick={() => handleLinkExistingClick(variantName)}
      >
        Link an existing entry
      </Button>
    </Stack>
  );
};

const VariantPlaceholder = ({
  variantName,
  setVariants,
}: {
  variantName: string;
  setVariants: (variants: EntryProps[] | undefined) => void;
}) => {
  return (
    <Card>
      <Stack flexDirection="column" fullWidth alignItems="flex-start">
        <SectionHeading>{variantName}</SectionHeading>
        <ContentTypeField variantName={variantName} setVariants={setVariants} />
      </Stack>
    </Card>
  );
};

const VariantsField = ({
  variantNames,
  variantEntries,
  setVariantEntries,
  flagKey,
}: {
  variantNames?: Array<string>;
  variantEntries: EntryProps[] | undefined;
  setVariantEntries: (variants: EntryProps[] | undefined) => void;
  flagKey?: string;
}) => {
  const sdk = useSDK<EditorAppSDK>();
  const meta = sdk.entry.fields.meta.getValue();

  return (
    <>
      <Heading>Variants</Heading>
      {flagKey && (
        <Stack
          spacing="spacingS"
          flexDirection="column"
          alignItems="flex-start"
        >
          {variantNames?.map((variantName) => {
            const variant = variantEntries?.find((entry) => {
              const entryId = meta[variantName];
              return entry.sys.id === entryId;
            });
            if (variant) {
              return (
                <EntryCardWrapper
                  variant={variant}
                  setVariants={setVariantEntries}
                  meta={meta}
                />
              );
            }
            return (
              <VariantPlaceholder
                variantName={variantName}
                setVariants={setVariantEntries}
              />
            );
          })}
        </Stack>
      )}
      {!flagKey && (
        <FormControl.HelpText>
          Select a flag key to add variants
        </FormControl.HelpText>
      )}
    </>
  );
};

interface VariantEntity {
  title: string;
  description: string;
  status: EntityStatus;
  contentType: string;
  variantName?: string;
}

const EntryCardWrapper = ({
  variant,
  setVariants,
  meta,
}: {
  variant: EntryProps;
  setVariants: (variants: EntryProps[] | undefined) => void;
  meta: KeyValueMap;
}): JSX.Element => {
  const sdk = useSDK<EditorAppSDK>();
  const { contentTypes } = useContext(ContentTypesContext);
  const [entryData, setEntryData] = useState<
    EntryProps<VariantEntity> | undefined
  >(undefined);

  const fetchEntry = useCallback(
    async (id: string, contentTypes: ContentTypeProps[]) => {
      if (!contentTypes) {
        return undefined;
      }
      const entry = await sdk.cma.entry.get({ entryId: id });
      const contentTypeId = get(entry, ["sys", "contentType", "sys", "id"]);
      const contentType = contentTypes.find(
        (contentType) => contentType.sys.id === contentTypeId
      );
      if (!contentType) {
        // things are still loading
        return undefined;
      }

      const displayField = contentType.displayField;
      const descriptionFieldType = contentType.fields
        .filter((field) => field.id !== displayField)
        .find((field) => field.type === "Text");

      const description = descriptionFieldType
        ? get(
            entry,
            ["fields", descriptionFieldType.id, sdk.locales.default],
            ""
          )
        : "";
      const title = get(
        entry,
        ["fields", displayField, sdk.locales.default],
        "Untitled"
      );
      const status = getEntryStatus(entry.sys);
      const variantEntry = Object.entries(meta ?? {}).find(([_, value]) => {
        return value === variant.sys.id;
      });
      return {
        ...entry,
        fields: {
          title,
          description,
          status: status as EntityStatus,
          contentType: contentType.name,
          variantName: variantEntry?.[0], // TODO: Ensure this always works
        },
      };
    },
    [sdk.cma.entry, sdk.locales.default, meta, variant.sys.id]
  );

  const fetchData = useCallback(async () => {
    const entry = await fetchEntry(variant.sys.id, contentTypes);
    return entry;
  }, [contentTypes, fetchEntry, variant.sys.id]);

  useEffect(() => {
    fetchData().then((data) => setEntryData(data));
  }, [variant, fetchEntry, contentTypes, fetchData]);

  const handleRemoveVariant = (variant: EntryProps) => {
    const values = sdk.entry.fields.variants.getValue() ?? [];
    const meta = sdk.entry.fields.meta.getValue() ?? {};
    const newMeta = cloneDeep(meta);
    if (entryData?.fields?.variantName) {
      delete newMeta[entryData?.fields?.variantName];
    }
    sdk.entry.fields.meta.setValue(newMeta);

    const filteredVariants = values.filter(
      (v: EntryProps) => v.sys.id !== variant.sys.id
    );
    setVariants(filteredVariants);
    sdk.entry.fields.variants.setValue(filteredVariants);
  };

  const onOpenEntry = (entryId: string) => {
    sdk.navigator.openEntry(entryId, { slideIn: true });
  };

  const getEntryStatus = (sys: MetaSysProps) => {
    if (sys.archivedVersion) {
      return "archived";
    } else if (sys.publishedVersion) {
      if (sys.version > sys.publishedVersion + 1) {
        return "changed";
      } else {
        return "published";
      }
    } else {
      return "draft";
    }
  };

  return (
    <Card>
      <SectionHeading>{entryData?.fields?.variantName}</SectionHeading>
      <Stack
        spacing="spacingM"
        flexDirection="column"
        fullWidth
        alignItems="flex-start"
      >
        <EntryCard
          contentType={entryData?.fields?.contentType}
          actions={[
            <MenuItem key="edit" onClick={() => onOpenEntry(variant.sys.id)}>
              Edit
            </MenuItem>,
            <MenuItem key="delete" onClick={() => handleRemoveVariant(variant)}>
              Delete
            </MenuItem>,
          ]}
          title={entryData?.fields?.title}
          description={entryData?.fields?.description}
          status={entryData?.fields?.status}
        />
      </Stack>
    </Card>
  );
};

const FlagKeyField = ({
  setVariants,
  setExperiment,
  experiment,
  experiments,
}: {
  setVariants: (variants: EntryProps[] | undefined) => void;
  setExperiment: (experiment?: Experiment) => void;
  experiment?: Experiment;
  experiments: Experiment[];
}) => {
  const sdk = useSDK<EditorAppSDK>();
  const { loading } = useContext(ExperimentContext);
  const [filteredItems, setFilteredItems] = useState<Experiment[]>(experiments);

  const handleSelectItem = (experiment: Experiment) => {
    resetFields();
    const { key } = experiment;
    sdk.entry.fields.experimentId.setValue(key);
    sdk.entry.fields.experiment.setValue(experiment);
    setExperiment(experiment);
    sdk.entry.save();
  };

  const resetFields = () => {
    setExperiment(undefined);
    setVariants([]);
    sdk.entry.fields.experimentId.setValue(undefined);
    sdk.entry.fields.experiment.setValue(undefined);
    sdk.entry.fields.variants.setValue(undefined);
    sdk.entry.fields.meta.setValue({});
    sdk.entry.save();
  };

  const handleInputValueChange = (value: string) => {
    // This time, we tell the component to compare the property "name" to the inputValue
    const newFilteredItems = experiments.filter((item) =>
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredItems(newFilteredItems);
    if (value === "") {
      resetFields();
    }
  };

  console.log("experiment", experiment);

  return (
    <Box style={{ paddingBottom: "20px" }}>
      <FormControl isRequired>
        <FormControl.Label>Flag Key</FormControl.Label>
        <Autocomplete
          items={filteredItems}
          onInputValueChange={handleInputValueChange}
          onSelectItem={handleSelectItem}
          itemToString={(item) => item.name}
          renderItem={(item) => `${item.name} (${item.id})`}
          isLoading={loading}
        />
        <FormControl.HelpText>
          This is in the overview card or defined at the top of the
          experiment/flag.
        </FormControl.HelpText>
      </FormControl>
      {experiment && (
        <Note
          variant="neutral"
          title={
            <Flex flexDirection="row" alignContent="center">
              {experiment.name}
              <Badge
                variant={experiment.enabled ? "primary" : "warning"}
                style={{ marginTop: 5, marginLeft: 10 }}
              >
                {experiment.enabled ? "Active" : "Inactive"}
              </Badge>
            </Flex>
          }
        >
          Flag key: <code>{experiment.key}</code>
          {experiment.description && (
            <Box>Description: {experiment.description}</Box>
          )}
          <Box>Variants: {experiment.variants.map((v) => v.key).join(", ")}</Box>
          <Box>Evaluation mode: {experiment.evaluationMode}</Box>
        </Note>
      )}
    </Box>
  );
};

const Entry = () => {
  const sdk = useSDK<EditorAppSDK>();
  const [experiment, setExperiment] = useState<Experiment | undefined>(
    sdk.entry.fields.experiment.getValue()
  );
  const { amplitudeExperimentApi } = useContext(ExperimentContext);

  const variantNames = useMemo(
    () => experiment?.variants.map((variant) => variant.key),
    [experiment]
  );

  // Update experiment if there is an experiment update on Amplitude side
  useInterval(() => {
    if (experiment && amplitudeExperimentApi) {
      amplitudeExperimentApi
        .getExperimentDetails(experiment.id)
        .then((experiment) => {
          setExperiment(experiment);
          sdk.entry.fields.experimentId.setValue(experiment.key);
          sdk.entry.fields.experiment.setValue(experiment);
        })
        .catch(() => {});
    }
  }, 5000);

  const [variants, setVariants] = React.useState<EntryProps[] | undefined>(
    sdk.entry.fields.variants.getValue()
  );

  const { experiments } = useContext(ExperimentContext);

  useEffect(() => {
    const valueChangeHandler = (experiment?: Experiment) => {
      setExperiment(experiment);
    };
    const detachValueChangeHandler =
      sdk.entry.fields.experiment.onValueChanged(valueChangeHandler);

    return detachValueChangeHandler;
  }, [sdk.entry.fields.experiment]);

  return (
    <Box
      style={{
        margin: "50px",
      }}
    >
      <Form>
        <FlagKeyField
          experiment={experiment}
          setExperiment={setExperiment}
          setVariants={setVariants}
          experiments={experiments}
        />
        <VariantsField
          variantNames={variantNames}
          variantEntries={variants}
          setVariantEntries={setVariants}
          flagKey={experiment?.key}
        />
      </Form>
    </Box>
  );
};

export default Entry;

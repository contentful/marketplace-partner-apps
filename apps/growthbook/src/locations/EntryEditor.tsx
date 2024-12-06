import { EditorAppSDK, Link } from '@contentful/app-sdk';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  EntityStatus,
  EntryCard,
  Form,
  FormControl,
  Heading,
  MenuItem,
  Popover,
  SectionHeading,
  Stack,
  TextInput,
} from '@contentful/f36-components';
import { useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps, EntryProps, MetaSysProps } from 'contentful-management';
import { cloneDeep, set } from 'lodash';
import get from 'lodash/get';
import React, { CSSProperties, useCallback, useContext, useEffect, useState } from 'react';
import { ContentTypesContext } from '../contexts/ContentTypesContext';
import { ExperimentAPIResponse } from '../../types/experiment';

const PopoverWrapper = ({ children, buttonText, buttonProps }: { children: JSX.Element; buttonText: string; buttonProps?: { [key: string]: string } }) => {
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
  variationName,
  variationNames,
  variations,
  setVariations,
  fetchTrigger,
  setFetchTrigger,
}: {
  variationName: string;
  variationNames: string[];
  variations: Link[] | undefined;
  setVariations: (variations: Link[] | undefined) => void;
  fetchTrigger: number;
  setFetchTrigger: (trigger: number) => void;
}) => {
  const sdk = useSDK<EditorAppSDK>();
  const { contentTypes } = useContext(ContentTypesContext);
  const [filteredItems, setFilteredItems] = useState(contentTypes);

  const handleInputValueChange = (value: string) => {
    const newFilteredItems = contentTypes.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()));
    setFilteredItems(newFilteredItems);
  };

  const handleChangeVariations = (metaSysPropsId?: string) => {
    const index = variationNames.indexOf(variationName);

    if (!metaSysPropsId) {
      throw new Error('Missing prop id');
    }

    const newVariations = variations ? [...variations] : [];
    newVariations[index] = {
      sys: {
        type: 'Link',
        id: metaSysPropsId,
        linkType: 'Entry',
      },
    };
    setVariations(newVariations);
  };

  const handleSelectItem = async (item: ContentTypeProps) => {
    try {
      const data = await sdk.navigator.openNewEntry(item.sys.id, {
        slideIn: { waitForClose: true },
      });
      handleChangeVariations(data.entity?.sys.id);
      // Needs a timeout to wait for any new title update to be saved
      setTimeout(() => {
        setFetchTrigger(fetchTrigger + 1);
      }, 500);
    } catch (error) {
      sdk.notifier.error('Failed to create new entry');
    }
  };

  const handleLinkExistingClick = async () => {
    try {
      const data = (await sdk.dialogs.selectSingleEntry({
        locale: sdk.locales.default,
        contentTypes: contentTypes.map((contentType) => contentType.sys.id),
      })) as EntryProps | undefined;

      if (!data) {
        return;
      }

      handleChangeVariations(data.sys.id);
    } catch (error) {
      sdk.notifier.error('Failed to link existing entry');
    }
  };

  return (
    <Stack>
      <PopoverWrapper buttonText="Create new entry">
        <>
          <FormControl.Label isRequired htmlFor="content-type">
            Contently Content Type
          </FormControl.Label>
          <Autocomplete
            id="content-type"
            items={filteredItems}
            onInputValueChange={handleInputValueChange}
            onSelectItem={(item: ContentTypeProps) => handleSelectItem(item)}
            itemToString={(item) => item.name}
            renderItem={(item) => `${item.name} (${item.sys.id})`}
          />
        </>
      </PopoverWrapper>
      <Button variant="positive" onClick={() => handleLinkExistingClick()}>
        Link an existing entry
      </Button>
    </Stack>
  );
};

const removeButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  padding: '0',
  width: '25px',
  height: '25px',
  lineHeight: '30px',
  textAlign: 'center',
  color: 'gray',
  minHeight: '25px',
};

const VariationPlaceholder = ({
  variationName,
  variations,
  setVariations,
  variationNames,
  setVariationNames,
  fetchTrigger,
  setFetchTrigger,
}: {
  variationName: string;
  variations: Link[] | undefined;
  setVariations: (variations: Link[] | undefined) => void;
  variationNames: string[];
  setVariationNames: (names: string[]) => void;
  fetchTrigger: number;
  setFetchTrigger: (trigger: number) => void;
}) => {
  const handleRemoveVariation = () => {
    const updatedVariationNames = variationNames.filter((name) => name !== variationName);
    setVariationNames(updatedVariationNames);
  };

  return (
    <Card style={{ position: 'relative' }}>
      <Button onClick={handleRemoveVariation} variant="negative" style={removeButtonStyle}>
        X
      </Button>
      <Stack flexDirection="column" fullWidth alignItems="flex-start">
        <SectionHeading className="no-text-transform">{variationName}</SectionHeading>
        <ContentTypeField
          variationName={variationName}
          variationNames={variationNames}
          variations={variations}
          setVariations={setVariations}
          fetchTrigger={fetchTrigger}
          setFetchTrigger={setFetchTrigger}
        />
      </Stack>
    </Card>
  );
};

interface VariationEntity {
  title: string;
  description: string;
  status: EntityStatus;
  contentType: string;
  variationName?: string;
}

const EntryCardWrapper = ({
  variationName,
  variationNames,
  setVariationNames,
  variation,
  variations,
  setVariations,
  seenWarning,
  setSeenWarning,
  experiment,
  fetchTrigger,
  setFetchTrigger,
}: {
  variationName: string;
  variationNames: string[];
  setVariationNames: (names: string[]) => void;
  variation: Link;
  variations: Link[] | undefined;
  setVariations: (variations: Link[] | undefined) => void;
  seenWarning: boolean;
  setSeenWarning: (seenWarning: boolean) => void;
  experiment?: ExperimentAPIResponse;
  fetchTrigger: number;
  setFetchTrigger: (trigger: number) => void;
}): JSX.Element => {
  const sdk = useSDK<EditorAppSDK>();
  const { contentTypes } = useContext(ContentTypesContext);
  const [entryData, setEntryData] = useState<EntryProps<VariationEntity> | undefined>(undefined);

  const fetchEntry = useCallback(
    async (id: string, contentTypes: ContentTypeProps[]) => {
      if (!contentTypes) {
        return undefined;
      }
      try {
        const entry = await sdk.cma.entry.get({ entryId: id });
        const contentTypeId = get(entry, ['sys', 'contentType', 'sys', 'id']);
        const contentType = contentTypes.find((contentType) => contentType.sys.id === contentTypeId);
        if (!contentType) {
          return undefined;
        }

        const displayField = contentType.displayField;
        const descriptionFieldType = contentType.fields.filter((field) => field.id !== displayField).find((field) => field.type === 'Text');

        const description = descriptionFieldType ? get(entry, ['fields', descriptionFieldType.id, sdk.locales.default], '') : '';
        const title = get(entry, ['fields', displayField, sdk.locales.default], 'Untitled');

        const status = getEntryStatus(entry.sys);
        return {
          ...entry,
          fields: {
            title,
            description,
            status: status as EntityStatus,
            contentType: contentType.name,
            variationName: variationName,
          },
        };
      } catch (error) {
        sdk.notifier.error('Failed to fetch entry');
        return undefined;
      }
    },
    [sdk.cma.entry, sdk.locales.default, sdk.notifier, variationName]
  );

  const fetchData = useCallback(async () => {
    const entry = await fetchEntry(variation.sys.id, contentTypes);
    return entry;
  }, [contentTypes, fetchEntry, variation.sys.id]);

  useEffect(() => {
    fetchData().then((data) => setEntryData(data));
  }, [variation, fetchEntry, contentTypes, fetchData, fetchTrigger]);

  const maybeShowWarning = () => {
    if (!seenWarning && experiment?.status === 'running') {
      sdk.notifier.warning(
        'The experiment has already started. Updating the content may invalidate the experiment results.  If you would like to continue, view the Experiment on Growthbook and start a new phase.'
      );
      setSeenWarning(true);
    }
  };

  const handleRemoveVariation = () => {
    maybeShowWarning();
    const newVariations = cloneDeep(variations);
    const index = variationNames?.findIndex((v) => v === variationName);
    if (newVariations && index !== -1) {
      newVariations.splice(index, 1);
    }
    setVariations(newVariations);

    const newVariationNames = variationNames.filter((name) => name !== variationName);
    setVariationNames(newVariationNames);
  };

  const onOpenEntry = async (entryId: string) => {
    try {
      await sdk.navigator.openEntry(entryId, {
        slideIn: { waitForClose: true },
      });

      // Needs a timeout to wait for any new title update to be saved
      setTimeout(() => {
        setFetchTrigger(fetchTrigger + 1);
      }, 500);
    } catch (error) {
      sdk.notifier.error('Failed to open entry');
    }
  };

  const getEntryStatus = (sys: MetaSysProps) => {
    if (sys.archivedVersion) {
      return 'archived';
    } else if (sys.publishedVersion) {
      if (sys.version > sys.publishedVersion + 1) {
        return 'changed';
      } else {
        return 'published';
      }
    } else {
      return 'draft';
    }
  };

  return (
    <Card>
      <Button onClick={handleRemoveVariation} variant="negative" style={removeButtonStyle}>
        X
      </Button>
      <SectionHeading className="no-text-transform">{entryData?.fields?.variationName}</SectionHeading>
      <Stack spacing="spacingM" flexDirection="column" fullWidth alignItems="flex-start">
        <EntryCard
          contentType={entryData?.fields?.contentType}
          actions={[
            <MenuItem key="edit" onClick={() => onOpenEntry(variation.sys.id)}>
              Edit
            </MenuItem>,
            <MenuItem key="delete" onClick={handleRemoveVariation}>
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

const VariationsField = ({
  variationNames,
  setVariationNames,
  variationEntries,
  setVariationEntries,
  seenWarning,
  setSeenWarning,
  experiment,
}: {
  variationNames?: Array<string>;
  setVariationNames: (variations: Array<string>) => void;
  variationEntries: Link[] | undefined;
  setVariationEntries: (variations: Link[] | undefined) => void;
  seenWarning: boolean;
  setSeenWarning: (seenWarning: boolean) => void;
  experiment?: ExperimentAPIResponse;
}) => {
  const sdk = useSDK<EditorAppSDK>();

  const maybeShowWarning = () => {
    if (!seenWarning && experiment?.status === 'running') {
      sdk.notifier.warning(
        'The experiment has already started. Updating the content may invalidate the experiment results.  If you would like to continue, view the Experiment on Growthbook and start a new phase.'
      );
      setSeenWarning(true);
    }
  };

  const addVariation = () => {
    maybeShowWarning();
    const newVariationNames = [...(variationNames || [])];

    if (!newVariationNames.includes('Control')) {
      newVariationNames.push('Control');
    } else {
      let i = 0;
      while (true) {
        const variationName = 'Variation ' + String.fromCharCode(65 + i); // 65 is the ASCII code for 'A'
        if (!newVariationNames.includes(variationName)) {
          newVariationNames.push(variationName);
          break;
        }
        i++;
      }
    }
    setVariationNames(newVariationNames);
  };

  const [fetchTrigger, setFetchTrigger] = useState(0);

  return (
    <>
      <Heading style={{ marginTop: '20px' }}>Variations</Heading>

      <Stack spacing="spacingS" flexDirection="column" alignItems="flex-start">
        {variationNames?.map((variationName, index) => {
          const variation = variationEntries ? variationEntries[index] : undefined;
          if (variation) {
            return (
              <EntryCardWrapper
                key={variationName}
                variationName={variationName}
                variationNames={variationNames}
                setVariationNames={setVariationNames}
                variation={variation}
                variations={variationEntries}
                setVariations={setVariationEntries}
                seenWarning={seenWarning}
                setSeenWarning={setSeenWarning}
                experiment={experiment}
                fetchTrigger={fetchTrigger}
                setFetchTrigger={setFetchTrigger}
              />
            );
          }
          return (
            <VariationPlaceholder
              key={variationName}
              variationName={variationName}
              variations={variationEntries}
              setVariations={setVariationEntries}
              variationNames={variationNames}
              setVariationNames={setVariationNames}
              fetchTrigger={fetchTrigger}
              setFetchTrigger={setFetchTrigger}
            />
          );
        })}
        <Button onClick={addVariation} isDisabled={variationEntries?.length !== variationNames?.length}>
          Add Variation
        </Button>
      </Stack>
    </>
  );
};

const Entry = () => {
  const sdk = useSDK<EditorAppSDK>();
  const [seenWarning, setSeenWarning] = useState(false);

  const [formExperiment] = useFieldValue<ExperimentAPIResponse>(sdk.entry.fields.experiment.id);

  const [formExperimentName, setFormExperimentName] = useFieldValue<string>(sdk.entry.fields.experimentName.id);

  const [variationNames, setVariationNames] = useFieldValue<Array<string>>(sdk.entry.fields.variationNames.id);

  const [variations, setVariations] = useFieldValue<Link[]>(sdk.entry.fields.variations.id);

  if (formExperimentName === undefined) {
    setFormExperimentName('');
  }

  return (
    <Box style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Box
        style={{
          margin: '50px',
          width: '768px',
        }}>
        <Form>
          <FormControl>
            <FormControl.Label htmlFor="experiment-name">Experiment Name (required):</FormControl.Label>
            <TextInput
              id="experiment-name"
              value={formExperimentName}
              onChange={(e) => {
                setFormExperimentName(e.target.value);
              }}
            />
          </FormControl>

          <VariationsField
            variationNames={variationNames}
            setVariationNames={setVariationNames}
            variationEntries={variations}
            setVariationEntries={setVariations}
            seenWarning={seenWarning}
            setSeenWarning={setSeenWarning}
            experiment={formExperiment}
          />
        </Form>
      </Box>
    </Box>
  );
};

export default Entry;

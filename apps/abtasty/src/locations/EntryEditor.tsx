import { useState } from 'react';
import { Stack } from '@mui/material';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import { EditorAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useQuery } from '@tanstack/react-query';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { EditorConfigForm } from '@/components/EntryEditor/EditorConfigForm';
import { Campaign, Project } from '@/types';
import { getVariationsOptions } from '@/queries/getVariationsOptions';
import { getMeQueryOptions } from '@/queries/getMeQueryOptions';
import { getToken } from '@/utils/getToken';
import { VariationsList } from '@/components/EntryEditor/VariationsList';
import { useContentTypeEntries } from '@/hook/useContentTypeEntries';
import { useEntrySummaries } from '@/hook/useEntrySummaries';
import { IncompleteConfigView, LoadingSessionView, NotSignedInView } from '@/components/Common/EmptyStates';

import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';

const steps = ['Select experiment', 'Add content', 'Publish experimentation', 'Start experimentation' ]

const Entry = () => {
  const sdk = useSDK<EditorAppSDK>();
  const { flagship_account: account, flagship_env: env, content_type: contentTypeAllowed } = sdk.parameters.installation;

  const token = getToken() || '';

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const variationGroupId = selectedCampaign?.variation_id || '';
  const accountId = account?.account_id ?? '';
  const { data: variations, isLoading: loadingVariations } = useQuery(
    getVariationsOptions({
      token,
      accountId,
      campaignId: selectedCampaign?.id ?? '',
      variationGroupId,
    })
  );

  const { data: user, isLoading: loadingUser } = useQuery(
    getMeQueryOptions(
      token,
    )
  )

  const entries = useContentTypeEntries(sdk, contentTypeAllowed?.id);

  const handleReturnToAppConfigPage = () => {
    sdk.navigator.openAppConfig()
  }

  const {
    metaMap,
    entrySummaries,
    handleOpenLinkedEntry,
    handleUnlinkEntryForVariation,
    setExperimentContext,
    pushLinkToVariations,
    cleanVariationsField,
  } = useEntrySummaries({
    sdk,
    entries,
    env,
    selectedCampaign,
    selectedProject,
    variations,
  });

  if (loadingUser) {
    return <LoadingSessionView />
  }

  if (!user) {
    return <NotSignedInView onOpenConfig={handleReturnToAppConfigPage} />
  }

  const isConfigIncomplete = !(account?.account_id && env?.id && contentTypeAllowed?.id);
  if (isConfigIncomplete) {
    return <IncompleteConfigView onOpenConfig={handleReturnToAppConfigPage} />
  }

  const handleCreateAndLinkEntry = async (contentTypeId: string, variationKey: string) => {
    const createdEntry = await sdk.navigator.openNewEntry(contentTypeId, { slideIn: true });
    const entryId = createdEntry?.entity?.sys?.id;
    if (!entryId) return;

    const existingMeta = (sdk.entry.fields['meta']?.getValue() as Record<string, string>) || {};
    const updatedMeta = { ...existingMeta, [variationKey]: entryId };
    sdk.entry.fields['meta']?.setValue(updatedMeta);

    pushLinkToVariations(entryId);
    cleanVariationsField(updatedMeta);
    setExperimentContext();

    sdk.notifier.success('Entry created and linked to variation');
  };

  const handleLinkExistingEntry = async (variationKey: string) => {
    const selectedEntry: any = await sdk.dialogs.selectSingleEntry({
      locale: sdk.locales.default,
      contentTypes: contentTypeAllowed?.id ? [contentTypeAllowed.id] : undefined,
    });
    if (!selectedEntry) return;

    const entryId = selectedEntry.sys.id;
    const meta = (sdk.entry.fields['meta']?.getValue() as Record<string, string>) || {};
    const updatedMeta = { ...meta, [variationKey]: entryId };
    sdk.entry.fields['meta']?.setValue(updatedMeta);

    pushLinkToVariations(entryId);
    cleanVariationsField(updatedMeta);
    setExperimentContext();

    sdk.notifier.success('Entry linked to variation');
  };

  const handleStepper = (() => {
    if (!selectedCampaign) return 1;
    const hasAnyLinkedEntry = Object.keys(metaMap).length > 0;
    if (!hasAnyLinkedEntry) return 2;
    const isExperimentRunning = selectedCampaign?.status === 'play';
    if (!isExperimentRunning) return 3;
    return 4
  })()

  return (
    <Stack sx={{ width: '100%', paddingY: '20px' }} flexDirection="column" spacing={3}>
      <Stepper activeStep={handleStepper} sx={{
        paddingY: '20px',
      }} >
        {steps.map((label) => (
          <Step key={label} active={false}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Accordion
        defaultExpanded
        variant="outlined"
        >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
          <Typography component="span" fontWeight="bold"> <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {<SettingsOutlinedIcon fontSize="large" style={{
              color: '#3100BF'
            }} />} AB Tasty Campaign Selection</span>
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <EditorConfigForm
            sdk={sdk}
            onProjectSelect={setSelectedProject}
            onCampaignSelect={setSelectedCampaign}
          />
        </AccordionDetails>
      </Accordion>

      <Typography component="h3" variant="h5" fontWeight="bold">Experiments</Typography>

      {!selectedCampaign && (
        <Typography variant="body1">First select a project, then a campaign to see the variations.</Typography>
      )}

      {selectedCampaign && (
        <VariationsList
          loadingVariations={loadingVariations}
          variations={variations || []}
          entries={entries}
          metaMap={metaMap}
          entrySummaries={entrySummaries}
          onCreateAndLink={handleCreateAndLinkEntry}
          onLinkExisting={handleLinkExistingEntry}
          onViewLinked={handleOpenLinkedEntry}
          onRemoveLink={handleUnlinkEntryForVariation}
        />
      )}
    </Stack>
  );
};

export default Entry;

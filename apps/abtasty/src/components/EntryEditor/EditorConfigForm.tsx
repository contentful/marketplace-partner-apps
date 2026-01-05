import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Grid, TextField } from '@mui/material';
import { Paragraph } from '@contentful/f36-components';
import { EditorAppSDK } from '@contentful/app-sdk';
import { useQuery } from '@tanstack/react-query';
import Autocomplete from '@mui/material/Autocomplete';

import { Campaign, Project } from '@/types';
import { getProjectOptions } from '@/queries/getProjectsOptions';
import { getCampaignsOptions } from '@/queries/getCampaignsOptions';
import Typography from '@mui/material/Typography';
import { getToken } from '@/utils/getToken';

type Props = {
  sdk: EditorAppSDK;
  onProjectSelect: (project: Project | null) => void;
  onCampaignSelect: (campaign: Campaign | null) => void;
};

export const EditorConfigForm = ({ sdk, onCampaignSelect , onProjectSelect}: Props) => {
  const { flagship_account: account, flagship_env: env } =
    sdk.parameters.installation;
  const token = getToken() || '';

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const {
    data: projects,
    isLoading: loadingProjects,
    isError: errorProjects,
  } = useQuery<Project[]>(
    getProjectOptions({ token, accountId: account.account_id, environmentId: env.id })
  );

  const {
    data: campaigns,
    isLoading: loadingCampaigns,
    isError: errorCampaigns,
  } = useQuery<Campaign[]>(
    getCampaignsOptions({
      token,
      accountId: account.account_id,
      projectId: selectedProject?.id ?? '',
    })
  );

  const didInitProject = useRef(false);
  const didInitCampaign = useRef(false);

  useEffect(() => {
    if (didInitProject.current) return;
    if (!projects || loadingProjects || errorProjects) return;

    const defaultProjectId = sdk.entry.fields['projectId']?.getValue?.();
    if (defaultProjectId) {
      const maybeProject = projects.find((p) => p.id === defaultProjectId) || null;
      setSelectedProject(maybeProject);
      onProjectSelect(maybeProject);
    }

    didInitProject.current = true;
  }, [projects, loadingProjects, errorProjects, sdk, onProjectSelect]);

  useEffect(() => {
    if (didInitCampaign.current) return;
    if (!campaigns || loadingCampaigns || errorCampaigns) return;

    const defaultCampaignId = sdk.entry.fields['experimentID']?.getValue?.();
    if (defaultCampaignId) {
      const maybeCampaign = campaigns.find((c) => c.id === defaultCampaignId) || null;
      setSelectedCampaign(maybeCampaign);
      onCampaignSelect(maybeCampaign);
    }

    didInitCampaign.current = true;
  }, [campaigns, loadingCampaigns, errorCampaigns, sdk, onCampaignSelect]);

  // Enregistre/écrase le projectId dans le localStorage à chaque changement
  useEffect(() => {
    const key = 'projectId';
    if (selectedProject?.id) {
      localStorage.setItem(key, selectedProject.id);
    } else {
      localStorage.removeItem(key);
    }
  }, [selectedProject]);

  // Enregistre/écrase le campaignId dans le localStorage à chaque changement
  useEffect(() => {
    const key = 'campaignId';
    if (selectedCampaign?.id) {
      localStorage.setItem(key, selectedCampaign.id);
    } else {
      localStorage.removeItem(key);
    }
  }, [selectedCampaign]);

  const handleProjectChange = (_event: React.SyntheticEvent, value: Project | null) => {
    setSelectedProject(value);
    onProjectSelect(value);
    setSelectedCampaign(null);
    onCampaignSelect(null);
  };

  const handleCampaignChange = (_event: React.SyntheticEvent, value: Campaign | null) => {
    setSelectedCampaign(value);
    onCampaignSelect(value);
  };

  if (errorProjects || errorCampaigns) {
    sdk.notifier.error('Error loading projects or campaigns');
  }

  return (
    <Grid container spacing={3}>
      <Grid size={4}>
        <Box
          sx={{ p: 2, bgcolor: '#EEEBFA', color: '#3100BF', borderRadius: 4, height: '100%' }}
          display="flex"
          alignItems="start"
          justifyContent="center"
          flexDirection="column"
          gap={3}
        >
          <Paragraph
            style={{ paddingTop: '10px', color: '#3100BF' }}
            fontSize="fontSizeL"
            fontWeight="fontWeightDemiBold"
          >
            AB Tasty Integration
          </Paragraph>
          <div>
            <Paragraph
              style={{color: '#3100BF' }}
            >
              <strong>Account:</strong> {account.account_name}
            </Paragraph>
            <Paragraph
              style={{color: '#3100BF' }}
            >
              <strong>Environment:</strong> {env.name}
            </Paragraph>
          </div>
        </Box>
      </Grid>
      <Grid size={8} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <>
          <Typography fontWeight="bold">Select a project</Typography>
          <Autocomplete<Project>
            fullWidth
            size="small"
            loading={loadingProjects}
            disablePortal
            loadingText={loadingProjects ? 'Loading projects...' : ''}
            options={projects ?? []}
            value={selectedProject}
            onChange={handleProjectChange}
            getOptionLabel={(o) => o?.name ?? ''}
            isOptionEqualToValue={(o, v) => o.id === v?.id}
            renderInput={(params) => <TextField
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <div>
                      {loadingProjects ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </div>
                  ),
                },
              }}
              {...params}
              label="Select a project"
            />
            }
          />
        </>

        <>
          <Typography fontWeight="bold">Select a campaign</Typography>
          <Autocomplete<Campaign>
            fullWidth
            size="small"
            disablePortal
            options={campaigns ?? []}
            loading={loadingCampaigns}
            loadingText={loadingCampaigns ? 'Loading campaigns...' : ''}
            value={selectedCampaign}
            onChange={handleCampaignChange}
            getOptionLabel={(o) => o?.name ?? ''}
            isOptionEqualToValue={(o, v) => o.id === v?.id}
            disabled={!selectedProject || errorCampaigns || loadingCampaigns}
            renderInput={(params) =>
              <TextField
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <div>
                        {loadingCampaigns ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </div>
                    ),
                  },
                }}
              {...params}
                label="Select a campaign"
              />
            }
          />
        </>
      </Grid>
    </Grid>
  );
};

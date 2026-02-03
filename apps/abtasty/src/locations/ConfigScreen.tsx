import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useQuery } from '@tanstack/react-query';
import { getMeQueryOptions } from '@/queries/getMeQueryOptions';
import { createAbTastyContainerContentType } from '@/services/createContentType';
import { AccountEnvironment, FlagshipAccount } from '@/types';
import { getAccountByUserOptions } from '@/queries/getAccountByUserOptions';
import {
  Card,
  CardContent,
  Stack,
  Divider,
} from '@mui/material';
import Typography from '@mui/material/Typography';
import { ConfigCardLayout } from '@/components/ConfigScreen/ConfigCardLayout';
import { CONTENT_TYPE_ID } from '@/constants';
import { LoadingCard } from '@/components/ConfigScreen/LoadingCard';
import { LoginCard } from '@/components/ConfigScreen/LoginCard';
import { AccountSelector } from '@/components/ConfigScreen/AccountSelector';
import { EnvironmentSelector } from '@/components/ConfigScreen/EnvironmentSelector';
import { ContentTypeModal } from '@/components/ConfigScreen/ContentTypeModal';
import { useAbTastyOAuth } from '@/hooks/useAbTastyOAuth';
import { getToken, updateToken } from '@/utils/getToken';
import { CustomButton, CustomButtonDanger } from '@/components/ui/CustomButton';
import { ensureAppInSidebarAndEditor } from '@/services/ensureAppInSidebarAndEditor';

export interface AppInstallationParameters {
  user_id?: string;
  flagship_account?: {
    account_id: string;
    account_name: string;
  };
  flagship_env?: {
    id?: string;
    name?: string;
  };
  content_types?: {
    id: string;
    referenceField: string[];
  }[];
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();


  const [token, setToken] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<FlagshipAccount | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<AccountEnvironment | undefined>(undefined);
  const [open, setOpen] = useState<boolean>(false);

  const [contentTypesNames, setContentTypesNames] = useState<Record<string, string>>({});

  const { openOAuthPopup } = useAbTastyOAuth(setToken);

  const { data: user, isLoading: isUserLoading } = useQuery(getMeQueryOptions(token));
  const { data: accounts, isLoading: isAccountsLoading } = useQuery(
    getAccountByUserOptions(user?.id || '', token)
  );

  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    if(!user) {
      sdk.notifier.error('You must be connected to your AB Tasty account to use this application.');
      return false;
    }

    if (!selectedAccount || !selectedEnvironment) {
      sdk.notifier.error('You must configure your application with an account and an environment before you can use it.');
      return false;
    }

    const cleanParameters: AppInstallationParameters = {
      content_types: parameters.content_types,
      user_id: user?.id,
      flagship_account: selectedAccount
        ? {
            account_id: selectedAccount.account_id,
            account_name: selectedAccount.account_name,
          }
        : undefined,
      flagship_env: selectedEnvironment
        ? {
            id: selectedEnvironment.id,
            name: selectedEnvironment.environment,
          }
        : undefined,
    };

    return {
      parameters: cleanParameters,
      targetState: currentState,
    };
  }, [sdk, user, selectedAccount, selectedEnvironment, parameters]);

  useEffect(() => {
    sdk.app.onConfigurationCompleted(async () => {
      try {
        await sdk.cma.contentType.get({
          contentTypeId: CONTENT_TYPE_ID,
        });
      } catch (err: any) {
        console.log("Error while checking content type: ", err);

        const message = String(err?.message || '').toLowerCase();
        const isNotFound =
          err?.status === 404 ||
          err?.response?.status === 404 ||
          err?.name === 'NotFound' ||
          err?.sys?.id === 'NotFound' ||
          message.includes('not found') ||
          message.includes('could not be found');

        if (isNotFound) {
          await createAbTastyContainerContentType({ sdk });
        } else {
          console.error('[onConfigure] Unexpected error while checking content type', err);
          throw err;
        }
      }

      const cts = parameters?.content_types || [];
      for (const ct of cts) {
        try {
          await ensureAppInSidebarAndEditor(sdk, ct.id);
        } catch (err) {
          console.error(`Error while ensuring app in sidebar/editor for ${ct.id}: `, err);
        }
      }
    });
  }, [sdk, parameters?.content_types]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    const init = async () => {
      const currentParameters = await sdk.app.getParameters();

      if (!currentParameters) {
        const lsToken = getToken();
        if (lsToken && !token) {
          setToken(lsToken);
        }
        sdk.app.setReady();
        return;
      }

      setParameters(currentParameters);

      const lsToken = getToken();
      if (lsToken && !token) {
        setToken(lsToken);
      }

      const savedCtId = currentParameters?.content_types?.[0]?.id;
      if (savedCtId) {
        setSelectedContentType(savedCtId);
      }

      sdk.app.setReady();
    };

    init();
  }, [sdk, token]);

  useEffect(() => {
    if (!parameters.flagship_account?.account_id || !accounts) return;

    const selectedAccountId = parameters.flagship_account.account_id;
    const selectedEnvId = parameters.flagship_env?.id;

    const maybeAccount = accounts.find((acc) => acc.account_id === selectedAccountId) ?? null;
    setSelectedAccount(maybeAccount || null);

    if (maybeAccount && selectedEnvId) {
      const maybeEnv = maybeAccount.account_environments.find((env) => env.id === selectedEnvId);
      setSelectedEnvironment(maybeEnv);
    }
  }, [accounts, parameters]);
  useEffect(() => {
    if (token) {
      updateToken(token);
    }
  }, [token]);

  useEffect(() => {
    const loadCtNames = async () => {
      const cts = parameters?.content_types || [];
      if (cts.length === 0) {
        setContentTypesNames({});
        return;
      }
      try {
        const names: Record<string, string> = {};
        await Promise.all(
          cts.map(async (ctRef) => {
            try {
              const ct = await sdk.cma.contentType.get({ contentTypeId: ctRef.id });
              names[ctRef.id] = ct?.name ?? 'Unknown';
            } catch {
              names[ctRef.id] = 'Unknown';
            }
          })
        );
        setContentTypesNames(names);
      } catch {
        // Fallback or error handling
      }
    };
    void loadCtNames();
  }, [sdk, parameters?.content_types]);


  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSaveContentType = (contentTypeRef: { id: string; referenceField: string[] }) => {
    setParameters((prev) => {
      const existingCts = prev.content_types || [];
      const index = existingCts.findIndex(ct => ct.id === contentTypeRef.id);
      let newCts;
      if (index > -1) {
        newCts = [...existingCts];
        newCts[index] = contentTypeRef;
      } else {
        newCts = [...existingCts, contentTypeRef];
      }
      return {
        ...prev,
        content_types: newCts,
      };
    });
    setOpen(false);
  };

  const handleRemoveContentType = (id: string) => {
    setParameters((prev) => ({
      ...prev,
      content_types: (prev.content_types || []).filter(ct => ct.id !== id),
    }));
  };

  if (isUserLoading || isAccountsLoading) {
    return (
      <ConfigCardLayout>
        <LoadingCard />
      </ConfigCardLayout>
    );
  }

  return (
    <ConfigCardLayout>
      {user ? (
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Stack direction="column" spacing={3}>
              <div>
                <Typography fontWeight="bold" variant="h5">
                  Welcome, {user.first_name} {user.last_name}
                </Typography>
                <Typography sx={{ mt: 2 }} color="text.secondary">
                  You are logged into your AB Tasty account. You can now use the application with your custom settings.
                </Typography>
              </div>

              <Divider variant="middle" />

              <Typography fontWeight="bold">Configure your AbTasty account</Typography>

              <AccountSelector
                accounts={accounts}
                selectedAccount={selectedAccount}
                onChange={(next) => {
                  setSelectedAccount(next);
                  setSelectedEnvironment(undefined);
                }}
              />

              {!!selectedAccount && (
                <EnvironmentSelector
                  account={selectedAccount}
                  selectedEnvironment={selectedEnvironment}
                  onChange={(next) => setSelectedEnvironment(next)}
                />
              )}

              <Divider variant="middle" />

              <Typography fontWeight="bold">Content types</Typography>
              <Typography color="text.secondary">
                Select the content types for which you want to enable A/B testing
              </Typography>

              <Stack spacing={2}>
                {(parameters?.content_types || []).map((ct) => (
                  <div key={ct.id} style={{ position: 'relative', padding: '16px' }}>
                    <CustomButtonDanger
                      size="small"
                      variant="contained"
                      color="error"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                      onClick={() => handleRemoveContentType(ct.id)}
                    >
                      Remove
                    </CustomButtonDanger>
                    <Typography fontWeight="bold">
                      {contentTypesNames[ct.id] ?? 'Unknown name'} ({ct.id})
                    </Typography>
                    <Typography color="text.secondary" fontSize="small">
                      Reference fields: {ct.referenceField?.length ? ct.referenceField.join(', ') : 'None'}
                    </Typography>
                  </div>
                ))}
              </Stack>

              <div>
                <CustomButton onClick={handleOpen} variant="contained" size="small">
                  Add Content Type
                </CustomButton>
              </div>

              <ContentTypeModal
                open={open}
                onClose={handleClose}
                sdk={sdk}
                value={selectedContentType}
                onChange={setSelectedContentType}
                onSave={handleSaveContentType}
              />
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <LoginCard onLogin={openOAuthPopup} />
      )}
    </ConfigCardLayout>
  );
};


export default ConfigScreen;

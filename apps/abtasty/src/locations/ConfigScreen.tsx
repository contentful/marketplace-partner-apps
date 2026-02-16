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
import { useAbTastyOAuth } from '@/hooks/useAbTastyOAuth';
import { getToken, updateToken } from '@/utils/getToken';
import { TableContentType } from '@/components/ConfigScreen/TableContentType';

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

  const { openOAuthPopup } = useAbTastyOAuth(setToken);

  const { data: user, isLoading: isUserLoading } = useQuery(getMeQueryOptions(token));
  const { data: accounts, isLoading: isAccountsLoading } = useQuery(
    getAccountByUserOptions(user?.id || '', token)
  );


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

    if (!parameters.content_types || parameters.content_types.length === 0) {
      sdk.notifier.error('You must select at least one content type before you can save.');
      return false;
    }

    // Check that each selected content type has at least one reference field
    const contentTypesWithoutFields = parameters.content_types.filter(
      ct => !ct.referenceField || ct.referenceField.length === 0
    );

    if (contentTypesWithoutFields.length > 0) {
      sdk.notifier.error('Each selected content type must have at least one reference field selected.');
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



  const handleUpdateContentTypes = (updater: (prev: { id: string; referenceField: string[] }[]) => { id: string; referenceField: string[] }[]) => {
    setParameters((prev) => ({
      ...prev,
      content_types: updater(prev.content_types || []),
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
            <Stack direction="column" spacing={2}>
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

              <TableContentType
                sdk={sdk}
                selectedContentTypes={parameters?.content_types || []}
                onUpdateContentTypes={handleUpdateContentTypes}
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

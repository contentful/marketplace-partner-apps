/* global ManagementClient */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAsync } from 'react-use';
import { Stack, IconButton, Heading } from '@contentful/f36-components';
import { CloseTrimmedIcon } from '@contentful/f36-icons';
import CMClient from './contentful-management-client';

const BASE_URL = process.env.CONNECTORS_BASE_URL;
const BASE_EMC_URL = `${BASE_URL}/embed/management-client.js`;
const PLUGIN_API_BASE_URL = `${BASE_URL}/api/v1.0`;
const CREDITS_BASED_ENABLED = false;
const CLIENT_ID = process.env.HYDRA_CLIENT_ID;
const CLIENT_STATE = process.env.HYDRA_CLIENT_STATE;

const isEmcScriptLoaded = () =>
  new Promise(resolve => {
    const emcScript = document.createElement('script');
    // add random version to force bypassing cache
    const EMC_URL = `${BASE_EMC_URL}?v=${Date.now()}`;
    emcScript.src = EMC_URL;
    emcScript.type = 'module';
    emcScript.addEventListener('load', () => {
      console.log('emc script loaded');
      resolve(true);
    });
    const head = document.querySelectorAll('head')[0];
    head.appendChild(emcScript);
  });

EMCDialog.propTypes = {
  sdk: PropTypes.object.isRequired,
  activeComponent: PropTypes.string.isRequired,
  handleToken: PropTypes.func,
  entryId: PropTypes.string
};

export default function EMCDialog({ sdk, entryId, activeComponent, handleToken }) {
  const { value: isEmcLoaded } = useAsync(isEmcScriptLoaded);
  const [initDriver, setInitDriver] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const header = 'LILT';
  const [fieldsId, setFieldsId] = useState(undefined);
  const [generatedContentId, setGeneratedContentId] = useState(undefined);

  const handleClose = useCallback(() => {
    sdk.close();
  }, [sdk]);

  const onApplyContent = useCallback(
    async (content, applyToSelected, langCode) => {
      if (!applyToSelected) {
        await sdk.dialogs.openAlert({
          title: 'No field has been selected',
          message: 'You need to select a field to apply the content to.'
        });
        return;
      }
      const cmClient = new CMClient(sdk);
      const [entry] = await cmClient.getEntriesByIDs([entryId]);

      let contentToApply = content.content;
      const [responseOneContentType] = await cmClient.getContentTypesByIDs([
        entry.sys.contentType.sys.id
      ]);

      const contentTypeAttrs = responseOneContentType.fields
        .filter(field => field.type === 'Text' || field.type === 'RichText')
        .reduce((acc, field) => {
          acc[field.id] = field;
          return acc;
        }, {});

      const type = contentTypeAttrs[applyToSelected]?.type;
      if (!type) {
        console.log('Error: Type is undefined');
        await sdk.dialogs.openAlert({
          title: 'Something went wrong',
          message: 'Field type is invalid'
        });
        return;
      }

      if (type === 'RichText') {
        const { richTextFromMarkdown } = require('@contentful/rich-text-from-markdown');
        const formatedContentToApply = await richTextFromMarkdown(contentToApply);
        contentToApply = formatedContentToApply;
        console.log('Content to apply', formatedContentToApply);
      }

      const space = await cmClient.getLocales();
      const default_locale = space.items
        .filter(item => item.default === true)
        .map(item => item.code)[0];
      const lang = langCode ?? default_locale;
      const selectedField = entry.fields[applyToSelected] ?? {};
      entry.fields[applyToSelected] = { ...selectedField, [lang]: contentToApply };
      entry.fields['lilt_metadata'][default_locale] = {
        ...entry.fields['lilt_metadata'][default_locale],
        createContentId: content.id
      };

      try {
        await cmClient.updateEntry(entry);
        handleClose();
      } catch (e) {
        await sdk.dialogs.openAlert({
          title: 'Something went wrong',
          message: e
        });
        return handleClose();
      }
    },
    [entryId, handleClose, sdk]
  );

  useEffect(() => {
    /**
     * Asynchronous function to get content types and field IDs and set them in state.
     *
     * @async
     * @function
     */
    async function getContentTypes() {
      const cmClient = new CMClient(sdk);
      const [entry] = await cmClient.getEntriesByIDs([entryId]);
      const [responseOneContentType] = await cmClient.getContentTypesByIDs([
        entry.sys.contentType.sys.id
      ]);

      const mappedFields = responseOneContentType.fields
        .filter(field => field.type === 'Text' || field.type === 'RichText')
        .map(field => ({
          value: field.id,
          label: field.name,
          validations: {
            // eslint-disable-next-line no-prototype-builtins
            charLimit: field.validations.find(validations => validations.hasOwnProperty('size'))
              ?.size
          }
        }));

      setFieldsId(mappedFields);
    }

    // eslint-disable-next-line no-extra-boolean-cast
    if (!!entryId) {
      getContentTypes();
    }
  }, [entryId, sdk]);

  useEffect(() => {
    async function getGeneratedId() {
      const cmClient = new CMClient(sdk);
      const [entry] = await cmClient.getEntriesByIDs([entryId]);
      const space = await cmClient.getLocales();
      const default_locale = space.items
        .filter(item => item.default === true)
        .map(item => item.code)[0];

      const contentId = entry.fields['lilt_metadata']?.[default_locale]?.['createContentId'];
      setGeneratedContentId(contentId ? contentId.toString() : '');
      if (!contentId) {
        console.log('generatedContentId is undefined');
      }
    }

    // eslint-disable-next-line no-extra-boolean-cast
    if (!!entryId && generatedContentId === undefined) {
      getGeneratedId();
    }
  }, [entryId, generatedContentId, sdk]);

  useEffect(() => {
    const cmClient = new CMClient(sdk);
    const getAuthToken = async () => {
      return sdk.parameters.installation.liltConnectorToken;
    };

    const makeSignUpRequest = () => {
      const url = `${BASE_URL}/login/free-trial/contentful`;
      return {
        url,
        method: 'POST',
        headers: {
          'X-Contentful-User-Email': sdk.user.email
        }
      };
    };

    const signRequest = async req => {
      // Get and apply the signed headers
      const { additionalHeaders } = await cmClient.client.appSignedRequest.create(
        {
          appDefinitionId: sdk.ids.app
        },
        {
          method: req.method,
          headers: req.headers,
          body: req.body,
          path: new URL(req.url).pathname
        }
      );
      Object.assign(req.headers, additionalHeaders);
    };

    if (!initDriver) return;
    const init = async () => {
      // get the token from contentful
      const token = await getAuthToken();

      const { driver } = ManagementClient.defaults;
      if (PLUGIN_API_BASE_URL) {
        driver.baseUrl = PLUGIN_API_BASE_URL;
      }
      driver.showAuthScreen = false;
      driver.showConfigSaveButton = false;
      driver.showOrderPreviewButton = false;
      driver.handleCredits = CREDITS_BASED_ENABLED;
      driver.activeComponent = activeComponent;
      driver.availableComponents = [];
      driver.showNavigation = false;
      driver.getAuthToken = getAuthToken;
      driver.authToken = token;
      driver.getSignInProvider = () => {
        return {
          name: 'Lilt',
          buttonText: 'Log in with your Lilt account',
          onButtonClick: async () => {
            const clientId = `client_id=${CLIENT_ID}`;
            const responseType = `response_type=code`;
            const scope = `scope=offline`;
            // the state value is used for random entropy
            const state = `state=${CLIENT_STATE}`;
            const redirectUri = `redirect_uri=${BASE_URL}/login/oauth2/callback`;
            const kind = `kind=contentful`;
            const spaceId = `spaceId=${sdk.ids.space}`;
            const envId = `environmentId=${sdk.ids.environment}`;
            const oauthQuery = `${clientId}&${responseType}&${scope}&${state}&${redirectUri}`;
            const query = `${oauthQuery}&${kind}&${spaceId}&${envId}`;
            const url = `${BASE_URL}/login/oauth2/auth?${query}`;
            const popup = window.open(url, 'mywindow', 'width=845,height=710');
            await new Promise((resolve, reject) => {  // eslint-disable-line
              window.addEventListener('message', e => {
                if (e.origin !== BASE_URL) {
                  return;
                }
                handleToken(e.data.token, true);
                popup.close();
                resolve();
              });
            });
          }
        };
      };
      driver.getSignUpProviders = () => {
        return [
          {
            name: 'Contentful',
            buttonText: 'Sign in with Contentful',
            onButtonClick: async () => {
              const req = makeSignUpRequest();
              await signRequest(req);
              const response = await fetch(req.url, req);
              const res = await response.json();
              if (res.error) {
                throw new Error(res.message);
              }
              handleToken(res.token);
            }
          }
        ];
      };
      driver.onApplyContent = onApplyContent;
      driver.applyToOptions = fieldsId;
      driver.createContentId = generatedContentId;
      driver.isLiltUser = sdk.parameters.installation.isLiltUser;

      const spaceLocales = await cmClient.getLocales();
      const supportedLanguages = spaceLocales.items.map(item => item.code);
      driver.createSupportedLanguages = supportedLanguages;

      const rootEl = document.getElementById('emc-root');
      if (isReady) {
        const emc = new ManagementClient({ rootEl });
        console.log('Lilt EMC initialized', emc);
      }
    };
    init();
  }, [
    activeComponent,
    fieldsId,
    generatedContentId,
    handleToken,
    initDriver,
    onApplyContent,
    sdk,
    isReady
  ]);

  useEffect(() => {
    if (!entryId || (fieldsId && generatedContentId !== undefined)) {
      setIsReady(true);
    }
  }, [entryId, fieldsId, generatedContentId]);

  useEffect(() => {
    if (isEmcLoaded) {
      setInitDriver(true);
    }
  }, [isEmcLoaded]);

  return (
    <Stack flexDirection="column" alignItems="flex-start" padding="none" spacing="none">
      {activeComponent === 'liltCreate' && (
        <Stack
          padding="spacingM"
          justifyContent="space-between"
          style={{ border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
          fullWidth>
          <Heading margin="none" marginBottom="none">
            {header}
          </Heading>
          <IconButton
            onClick={handleClose}
            variant="transparent"
            label="Close"
            icon={<CloseTrimmedIcon />}
          />
        </Stack>
      )}
      <Stack fullWidth>
        <div id="emc-root" />
      </Stack>
    </Stack>
  );
}

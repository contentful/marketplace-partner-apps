import { AppState, ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Box, Paragraph, List, Note, TextLink } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import { FieldSelection } from '../components/FieldSelection';
import { useSurferCompatibility } from '../hooks/useSurferCompatibility';
import { useFieldSelection } from '../hooks/useFieldSelection';
import { SurferLogotype } from '../components/SurferLogotype';

const styles = {
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '2px',
    backgroundColor: tokens.gray300,
  }),
  body: css({
    height: 'auto',
    minHeight: '65vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: '900px',
    backgroundColor: tokens.colorWhite,
    zIndex: 2,
    boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '2px',
  }),
  background: css({
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    top: 0,
    width: '100%',
    height: '300px',
    backgroundColor: '#250956',
  }),
};

const Splitter = () => {
  return <hr className={styles.splitter} />;
};

const embedInSidebar = (selectedContentTypes: string[]) => {
  return {
    EditorInterface: selectedContentTypes.reduce((acc: AppState['EditorInterface'], id) => {
      acc[id] = { sidebar: { position: 1 } };

      return acc;
    }, {}),
  };
};

export const ConfigScreen = () => {
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>();

  const compatibility = useSurferCompatibility(contentTypes);
  const { selectMany, selectAllCompatible, selectedContentTypes, toggleContentType, toggleField, selectedContentFields } = useFieldSelection(compatibility);
  const sdk = useSDK<ConfigAppSDK>();

  useEffect(() => {
    sdk.cma.contentType.getMany({ spaceId: sdk.ids.space }).then((contentTypes) => {
      setContentTypes(contentTypes.items);
    });
  }, [sdk.app, sdk.cma.contentType, sdk.ids.space]);

  useEffect(() => {
    if (contentTypes && compatibility) {
      sdk.app.getCurrentState().then((appState) => {
        if (appState?.EditorInterface) {
          selectMany(Object.keys(appState.EditorInterface), sdk.parameters.installation.selectedContentFields ?? compatibility.compatibleFields);
        } else {
          selectAllCompatible();
        }

        sdk.app.setReady();
      });
    }
  }, [contentTypes, compatibility, sdk.app, selectMany, selectAllCompatible, sdk.parameters.installation.selectedContentFields]);

  useEffect(() => {
    sdk.app.onConfigure(() => {
      return {
        targetState: embedInSidebar(selectedContentTypes),
        parameters: {
          selectedContentFields,
        },
      };
    });
  }, [sdk.app, selectedContentFields, selectedContentTypes]);

  return (
    <>
      <Box className={styles.background} />
      <Box className={styles.body}>
        <>
          <Heading as="h2"> About Surfer</Heading>

          <Paragraph>
            Elevate your content SEO with Surfer without leaving Contentful! Generate a list of relevant keywords, create an outline and write amazingly
            optimized content while getting real-time feedback from our Content Editor.
          </Paragraph>
          <Note variant="neutral">
            You need a Surfer account with an active subscription to use this app. Sign up{' '}
            <TextLink href="https://app.surferseo.com/register" target="_blank">
              here
            </TextLink>
            .
          </Note>
          <Splitter />
        </>
        <>
          <Heading as="h2">Setup</Heading>
          <List as="ol">
            <List.Item>Log into your Surfer account.</List.Item>
            <List.Item>Select content types you want Surfer App to work with</List.Item>
            <List.Item>Finish configuration by clicking the "Save" button</List.Item>
            <List.Item>You now can start editing your content in Contentful with best-in-class SEO suggestions from Surfer!</List.Item>
          </List>
          <Splitter />
        </>
        <Heading>Select content types and fields</Heading>

        <Note variant="neutral">
          Each content type you'll select must contain at least one <code>RichText</code> field.
        </Note>

        <FieldSelection
          contentTypes={contentTypes ?? []}
          selectedContentFields={selectedContentFields}
          selectedContentTypes={selectedContentTypes}
          compatibility={compatibility}
          handleContentTypeSelection={toggleContentType}
          handleFieldSelection={toggleField}
        />
      </Box>

      <SurferLogotype />
    </>
  );
};

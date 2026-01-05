import React from 'react';
import { Heading, FormControl, Paragraph, Flex, TextInput, TextLink, Note, Text, Button } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { validateCredentials } from '../utils';
import Stepper from '../components/Stepper';
const VARIATION_CONTAINER_ID = 'variationFmeContainer';

const styles = {
  body: css({
    margin: "0 auto",
    width: '800px',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacingXl}`,
    maxWidth: tokens.contentWidthText,
    backgroundColor: tokens.colorWhite,
    zIndex: "2",
    boxShadow: "1px 1px 20px rgba(0, 0, 0, 0.2)",
    borderRadius: "2px",
  }),
  background: css({
    display: "block",
    position: "absolute",
    zIndex: "-1",
    top: "0",
    width: "100%",
    height: "300px",
    backgroundColor: "#26134D",
  }),
  formItem: css({
    marginTop: tokens.spacingS,
    marginBottom: '0px'
  }),
  doneIcon: css({
    backgroundColor: '#47B178',
    padding: '0px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacingM
  })
};

export default class ConfigScreen extends React.Component {
  constructor(props){
    super(props);
    this.appInstalled = false;
    this.state = {
      config: {
        accountId: props.accountId || '',
        accessToken: props.accessToken || '',
        contentTypes: {},
      },
      allContentTypes: [],
      loading: false,
      isInstalled: false
    }
  }

  createVariationContainerContentType = async () => {
    const variationContainer = await this.props.sdk.space.createContentType({
      sys: {
        id: VARIATION_CONTAINER_ID,
      },
      name: "VWO FME Wrapper",
      displayField: "title",
      fields: [
        {
          "id": "title",
          "name": "Feature Flag title",
          "type": "Symbol",
          "localized": false,
          "required": false,
          "validations": [],
          "defaultValue": {
            [this.props.sdk.locales.default]: '[VWO] FME Entry',
          },
          "disabled": false,
          "omitted": false
        },
        {
          "id": "meta",
          "name": "Meta",
          "type": "Object",
          "localized": false,
          "required": false,
          "validations": [],
          "disabled": false,
          "omitted": false
        },
        {
          "id": "featureFlag",
          "name": "Feature flag",
          "type": "Object",
          "localized": false,
          "required": false,
          "validations": [],
          "disabled": false,
          "omitted": false
        }
      ],
    });

    await this.props.sdk.space.updateContentType(variationContainer);
  };

  saveEnabledContentTypes = async (contentTypes, allContentTypes) => {
    const copyAllCts = JSON.parse(JSON.stringify(allContentTypes));
    const output = [];

    for (const ct of copyAllCts) {
      let hasChanges = false;

      for (const contentField of ct.fields) {
        const validations =
          contentField.type === "Array"
            ? contentField.items.validations
            : contentField.validations;
        const index = (validations || []).findIndex((v) => v.linkContentType);

        if (index > -1) {
          const linkValidations = validations[index];
          const includesVariationContainer = linkValidations.linkContentType.includes(
            VARIATION_CONTAINER_ID
          );

          const fieldsToEnable = contentTypes[ct.sys.id] || {};

          if (!includesVariationContainer && fieldsToEnable[contentField.id]) {
            linkValidations.linkContentType.push(VARIATION_CONTAINER_ID);
            hasChanges = true;
          }

          if (
            includesVariationContainer &&
            (!Object.keys(contentTypes).includes(ct.sys.id) ||
              !fieldsToEnable[contentField.id])
          ) {
            linkValidations.linkContentType = linkValidations.linkContentType.filter(
              (lct) => lct !== VARIATION_CONTAINER_ID
            );
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        output.push(ct);
      }
    }

    if (!output.length) {
      return true;
    }

    const updates = output.map((ct) => {
      return this.props.sdk.space.updateContentType(ct);
    });

    try {
      await Promise.all(updates);
      return true;
    } catch (e) {
      return false;
    }
  };

  findEnabledContentTypes = (allContentTypes = []) => {
    return allContentTypes.reduce((acc, ct) => {
      const output = {};

      for (const field of ct.fields) {
        if (field.type === "Array" && field.items.linkType === "Entry") {
          output[field.id] = field.items.validations.some((val) =>
            val.linkContentType.includes(VARIATION_CONTAINER_ID)
          );
          continue;
        }

        if (field.type === "Link" && field.linkType === "Entry") {
          output[field.id] =
            field.validations.length === 0 ||
            field.validations.some((val) =>
              val.linkContentType.includes(VARIATION_CONTAINER_ID)
            );
        }
      }

      const keys = Object.keys(output);

      if (keys.some((key) => output[key])) {
        return { ...acc, [ct.sys.id]: output };
      }

      return acc;
    }, {});
  };

  areAllInputsProvided = () => {
    if (!this.state.config.accountId) {
      this.props.sdk.notifier.error(
        "You must provide a VWO access token to connect to the VWO app!"
      );
      return false;
    }

    if (!this.state.config.accessToken) {
      this.props.sdk.notifier.error(
        "You must provide an api key to connect to the VWO app!"
      );
      return false;
    }

    return true;
  }
  
  onConfigure = async () => {
    if (!this.props.accessToken) {
      this.props.sdk.notifier.error(
        "You must be connect to the VWO in order to configure/install the app!"
      );
      return false;
    }

    const { config } = this.state;

    const needsVariationContainerInSpace = !this.state.allContentTypes.find(
      (ct) => ct.sys.id === VARIATION_CONTAINER_ID
    );

    if (needsVariationContainerInSpace) {
      await this.createVariationContainerContentType();
    }

    const res = await this.saveEnabledContentTypes(
      this.state.config.contentTypes,
      this.state.allContentTypes
    );

    this.props.sdk.space
      .getContentTypes()
      .then((data) => this.setState({ config, allContentTypes: data.items, loading: false }));
    
    if (!res) {
      this.props.sdk.notifier.error("Something went wrong, please try again.");
      return false;
    }

    // Get current state of EditorInterface to avoid version mismatch errors
    const currentState = await this.props.sdk.app.getCurrentState();

    return {
      parameters: {
        accessToken: config.accessToken,
        accountId: config.accountId
      },
      targetState: {
        EditorInterface: {
          ...currentState?.EditorInterface,
          [VARIATION_CONTAINER_ID]: { editor: true, sidebar: { position: 0 } }
        }
      },
    };
  };

  async componentDidMount() {
    const { space, app } = this.props.sdk;
    const [
      currentParameters,
      { items: allContentTypes = [] },
    ] = await Promise.all([
      app.getParameters(),
      space.getContentTypes({ order: "name", limit: 1000 }),
    ]);

    const isAppInstalled = await this.props.sdk.app.isInstalled();
    this.setState({ isInstalled: isAppInstalled });

    const enabledContentTypes = this.findEnabledContentTypes(allContentTypes);
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState(
      (prevState) => {
        return {
        allContentTypes,
        config: {
          contentTypes: enabledContentTypes,
          accessToken: currentParameters
            ? currentParameters.accessToken
            : prevState.config.accessToken,
          accountId: currentParameters
          ? currentParameters.accountId
          : prevState.config.accountId,
        },
        loading: false
      }},
      () => app.setReady()
    );

    app.onConfigure(this.onConfigure);
    app.onConfigurationCompleted(async () => {
      const isInstalled = await app.isInstalled();
      this.setState({ isInstalled: isInstalled});
    });
  }

  onApiKeyChange = (value) => {
    let values = this.state;
    values.config.accessToken = value;
    this.setState(values);
  }

  onAccountIdChange = (value) => {
    let values = this.state;
    values.config.accountId = value;
    this.setState(values);
  }

  onAddContentType = contentTypeConfig => {
    const { contentTypes } = this.state.config;

    this.props.updateConfig({
      contentTypes: {
        ...contentTypes,
        ...contentTypeConfig
      }
    });
  };

  connectToVwo = async () => {
    if(!this.areAllInputsProvided()){
      return;
    }
    let values = this.state;
    values.loading = true;
    this.setState(values);

    const accountId = this.state.config.accountId;
    const apiToken = this.state.config.accessToken;

    const validateData = await validateCredentials(accountId,apiToken);
    if(validateData.code === 200){
      this.props.updateCredentials({
        accountId: this.state.config.accountId,
        token: this.state.config.accessToken
      });
    }
    else{
      this.props.sdk.notifier.error(validateData.message);
    }

    values.loading = false;
    this.setState(values);
  }

  
  render(){
    const { isInstalled } = this.state;
    const tokenLength = this.state.config.accessToken?.length;
    const accessToken = tokenLength > 4? '*'.repeat(tokenLength-4)+this.state.config.accessToken?.slice(tokenLength-4): '';
    return (
      <React.Fragment>
        <Flex className={styles.background}>
            {/* Before connecting to VWO */}
            {!this.props.accessToken && <Flex flexDirection='column' className={styles.body}>
              <Stepper currentStep={1}/>
              <Flex alignItems='center' justifyContent='space-between' marginBottom='spacingL'>
                <Heading marginBottom='none'>Configuration</Heading>
                <TextLink
                  href='https://app.vwo.com/'
                  target='_blank'
                  icon={<ExternalLinkIcon />}
                  alignIcon='start'
                  rel="noopener noreferrer">Open VWO</TextLink>
              </Flex>
              <FormControl className={styles.formItem}>
                  <FormControl.Label isRequired>Account ID</FormControl.Label>
                  <TextInput
                    value={this.state.config.accountId}
                    onChange={(e) => this.onAccountIdChange(e.target.value)}/>
                  <Paragraph marginTop='spacingS'>Locate account ID in settings page. See <TextLink href='https://help.vwo.com/hc/en-us/articles/40825355345177-Integrating-VWO-Feature-Flags-with-Contentful-CMS' target='_blank' rel="noopener noreferrer">knowledge base</TextLink> for more details.</Paragraph>
              </FormControl>
              <FormControl className={styles.formItem}>
                  <FormControl.Label isRequired>API Key</FormControl.Label>
                  <TextInput
                    type='password'
                    value={this.state.config.accessToken}
                    onChange={(e) => this.onApiKeyChange(e.target.value)}/>
                  <Paragraph marginTop='spacingS'>View the auth token in Integrations &gt; Contentful &gt; Config section. See <TextLink href='https://help.vwo.com/hc/en-us/articles/40825355345177-Integrating-VWO-Feature-Flags-with-Contentful-CMS' target='_blank' rel="noopener noreferrer">knowledge base</TextLink> for more details.</Paragraph>
              </FormControl>
              <Note marginBottom='spacingXl'>This token grants read-only access to organization-level information stored in VWO. It is accessible via API by any users within the current Contentful space.</Note>
              <Button variant='primary' onClick={this.connectToVwo} isLoading={this.state.loading}>Connect with VWO</Button>
            </Flex>}
            {/* After connecting to VWO */}
            {!!this.props.accessToken && !isInstalled
              && <Flex flexDirection='column' alignItems='start' className={styles.body}>
              <Stepper currentStep={2}/>
              <Heading marginBottom='spacingXl'>Just one more step!</Heading>
              <Note variant='warning' marginBottom='spacingL'>To complete setup, click 'Install' in the top-right corner and start using the VWO FME app.</Note>
            </Flex>}

            {/* After installing the VWO */}
            {isInstalled && this.props.accessToken && <Flex flexDirection='column' className={styles.body}>
              <Stepper currentStep={3}/>
              <Heading marginBottom='spacingL'>Configuration</Heading>
              <Flex flexDirection='column' marginBottom='spacingXl'>
                  <FormControl.Label>Account ID</FormControl.Label>
                  <Text>{this.state.config.accountId}</Text>
              </Flex>
              <Flex flexDirection='column' marginBottom='spacingXl'>
                  <FormControl.Label>API Key</FormControl.Label>
                  <Text>{accessToken}</Text>
              </Flex>
            </Flex>
            }
        </Flex>
      </React.Fragment>
    );
  }
};

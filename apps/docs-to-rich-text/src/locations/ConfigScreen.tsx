import { useCallback, useState, useEffect, useMemo } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Heading,
  Form,
  Flex,
  FormControl,
  Checkbox,
  Select,
  Card,
  Badge,
  Button,
  Paragraph,
  Table,
  Tooltip,
  List,
  Image,
  Text,
  TextLink,
  Accordion,
  Switch,
  Spinner,
  Notification,
} from '@contentful/f36-components';
import { HelpCircleIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { IsSpaceLicensed } from '../api/licensing';
import importCopyPaste from '../assets/img/import_copypaste.png';
import importGoogle from '../assets/img/import_googledrive.png';
import { RtfField } from '../types';
import { getRichTextFields, setAppRichTextEditor, setDefaultRichTextEditor } from '../utils/editorInterfaceUtil';
import { css } from '@emotion/css';

const styles = {
  importOption: css({
    paddingTop: '35px',
    display: 'flex',
  }),
};

export interface AppInstallationParameters {
  useImageWrapper?: boolean;
  imageWrapperTypeId?: string;
}

async function getContentModels(sdk: ConfigAppSDK) {
  const types = await sdk.cma.contentType.getMany({});
  return types.items.map((x) => {
    return { label: x.name, value: x.sys.id };
  });
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    useImageWrapper: false,
    imageWrapperTypeId: '',
  });
  const [selectedWrapperModelId, setSelectedWrapperModelId] = useState(parameters.imageWrapperTypeId);
  const [contentModels, setContentModels] = useState<{ label: string; value: string }[]>([]);
  const [richTextFields, setRichTextFields] = useState<RtfField[]>([]);
  const [richTextFieldsLoaded, setRichTextFieldsLoaded] = useState<boolean>(false);
  const [isLicensed, setIsLicensed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    if (parameters.imageWrapperTypeId && parameters.imageWrapperTypeId !== '') {
      setSelectedWrapperModelId(parameters.imageWrapperTypeId);
    }
  }, [parameters]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();

      const models = await getContentModels(sdk);
      setContentModels(models);
      const licensed = await IsSpaceLicensed(sdk.ids.space);
      setIsLicensed(licensed);

      const fields = await getRichTextFields(sdk.cma, sdk.ids.app);
      setRichTextFields(fields);
      setRichTextFieldsLoaded(true);
    })();
  }, [sdk]);

  useEffect(() => {
    let intervalId: any;

    (async () => {
      // Initial check
      const installed = await checkInstallationStatus();
      if (installed) {
        return;
      }

      // Polling
      intervalId = setInterval(async () => {
        if (await checkInstallationStatus()) {
          clearInterval(intervalId);
        }
      }, 2000);
    })();

    return () => {
      clearInterval(intervalId);
    };
  }, [sdk.app]);

  async function checkInstallationStatus(): Promise<boolean> {
    const installed = await sdk.app.isInstalled();
    setIsInstalled(installed);
    return installed;
  }

  async function enableEditorForAllRichTextFields() {
    if (!isLicensed && richTextFields.length > 5) {
      Notification.warning('The free plan is limited to 5 fields. Upgrade to remove limits');
    }

    let remainingLimit = 0;
    // if license limit, calc how many are left and only enable that many
    if (!isLicensed) {
      remainingLimit = 5 - richTextFields.filter((f) => f.isEnabled).length;
    }

    for (const field of richTextFields.filter((f) => !f.isEnabled)) {
      if (remainingLimit <= 0 && !isLicensed) {
        return;
      }
      updateRichTextField(field.contentTypeId, field.fieldId, { isEnabled: true });
      await setAppRichTextEditor(sdk, field.contentTypeId, field.fieldId);
      remainingLimit--;
    }
  }

  async function toggleRichTextFieldEditor(field: RtfField) {
    const isEnabled = !field.isEnabled;
    updateRichTextField(field.contentTypeId, field.fieldId, { isEnabled });

    if (isEnabled) {
      await setAppRichTextEditor(sdk, field.contentTypeId, field.fieldId);
    } else {
      await setDefaultRichTextEditor(sdk, field.contentTypeId, field.fieldId);
    }
  }

  function updateRichTextField(targetContentTypeId: string, targetFieldId: string, updatedProperties: Partial<RtfField>) {
    setRichTextFields((prevFields) =>
      prevFields.map((field) => (field.contentTypeId === targetContentTypeId && field.fieldId === targetFieldId ? { ...field, ...updatedProperties } : field)),
    );
  }

  const isLicenseLimitReached = useMemo(() => {
    return !isLicensed && richTextFields.filter((f) => f.isEnabled).length >= 5;
  }, [richTextFields, isLicensed]);

  const wrapperSelect = (
    <FormControl style={{ maxWidth: '350px' }}>
      <FormControl.Label>Image Wrapper Content Model:</FormControl.Label>
      <Select
        id="optionSelect-controlled"
        name="optionSelect-controlled"
        value={selectedWrapperModelId}
        onChange={(event) => {
          setSelectedWrapperModelId(event.target.value);
          setParameters({
            ...parameters,
            imageWrapperTypeId: event.target.value,
          });
        }}>
        {contentModels.map((val) => (
          <option key={val.value} value={val.value}>
            {val.label}
          </option>
        ))}
      </Select>
    </FormControl>
  );

  const planType = isLicensed ? <Badge variant="positive">Premium Plan</Badge> : <Badge variant="warning">Free Plan</Badge>;

  const upgrade = (
    <Button as="a" href="https://ellavationlabs.com/docs-to-rich-text/#pricing" target="_blank" variant="primary">
      Upgrade Plan
    </Button>
  );

  const fieldsTable = (
    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
      <Table>
        <Table.Head
          style={{
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 1,
          }}>
          <Table.Row>
            <Table.Cell>Content Model</Table.Cell>
            <Table.Cell>Field</Table.Cell>
            <Table.Cell>Enabled</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {richTextFields.map((field) => {
            return (
              <Table.Row key={`${field.contentTypeId}${field.fieldId}`}>
                <Table.Cell>{field.contentTypeName}</Table.Cell>
                <Table.Cell>{field.fieldName}</Table.Cell>
                <Table.Cell>
                  {!field.isEnabled && isLicenseLimitReached ? (
                    <Tooltip content="Free plan limit reached. Disable another field or upgrade to remove limits" placement="top">
                      <Switch
                        name="toggle-rte"
                        id="toggle-rte"
                        isChecked={field.isEnabled}
                        onChange={async () => await toggleRichTextFieldEditor(field)}
                        isDisabled={true}></Switch>
                    </Tooltip>
                  ) : (
                    <Switch
                      name="toggle-rte"
                      id="toggle-rte"
                      isChecked={field.isEnabled}
                      onChange={async () => await toggleRichTextFieldEditor(field)}
                      isDisabled={false}></Switch>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );

  const planDetails = (
    <div>
      {isLicensed && (
        <div>
          <p>Plan Type: {planType}</p>
          <p>Plan Limits: None</p>
        </div>
      )}
      {!isLicensed && (
        <div>
          <p>Plan Type: {planType}</p>
          <p>Plan Limits: 5 field editors</p>
          <Paragraph marginTop="spacingM">
            <TextLink href="https://ellavationlabs.com/docs-to-rich-text/#pricing" target="_blank" variant="premium">
              Upgrade now
            </TextLink>{' '}
            to remove limits
          </Paragraph>
        </div>
      )}
    </div>
  );

  const fieldsCard = (
    <Card>
      <Heading>Configure Rich Text Fields</Heading>

      {!isInstalled ? (
        <p>Install to begin</p>
      ) : (
        <>
          <p>Select which rich text fields should have Docs to Rich Text enabled</p>
          <br />

          {!richTextFieldsLoaded && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Spinner variant="default" />
            </div>
          )}
          {richTextFieldsLoaded && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '20px',
                }}>
                {isLicenseLimitReached ? (
                  <Tooltip content="Free plan limit reached. Disable another field or upgrade to remove limits" placement="top">
                    <Button variant="primary" size="small" style={{ marginRight: '20px' }} isDisabled={true}>
                      Enable All
                    </Button>
                  </Tooltip>
                ) : (
                  <Button
                    variant="primary"
                    size="small"
                    style={{ marginRight: '20px' }}
                    onClick={async () => {
                      await enableEditorForAllRichTextFields();
                    }}
                    isDisabled={false}>
                    Enable All
                  </Button>
                )}
              </div>
              {fieldsTable}
            </div>
          )}
        </>
      )}
    </Card>
  );

  const imageWrapperTooltip = (
    <Tooltip
      placement="right"
      id="tooltip-1"
      content="Imported images will be wrapped in a content entry, which will then be embedded into the rich text field">
      <HelpCircleIcon size="tiny"></HelpCircleIcon>
    </Tooltip>
  );

  const howTo = (
    <Card>
      <Heading>Getting Started</Heading>
      <Accordion>
        <Accordion.Item title="Configuration">Enable Docs to Rich Text in the "Configure Rich Text Fields" section above</Accordion.Item>
        <Accordion.Item title="Import Google Documents">
          <Text>
            <b>Using the File Picker</b>
          </Text>
          <List as="ol">
            <List.Item>Navigate to the desired content entry and field</List.Item>
            <List.Item>
              Press "Import" then press "Choose from Google Drive"
              <Image alt="Import content from Google Docs or HTML" height="250px" width="auto" src={importGoogle} />
            </List.Item>
            <List.Item>Select a document</List.Item>
            <List.Item>Review imported content</List.Item>
          </List>

          <Text className={styles.importOption}>
            <b>Using Copy/Paste</b>
          </Text>
          <List as="ol">
            <List.Item>Copy the document content to your clipboard (Ctrl+C / ⌘C or right click & copy)</List.Item>
            <List.Item>Navigate to the desired content entry and field</List.Item>
            <List.Item>Press the "Import" button</List.Item>
            <List.Item>
              Paste into the text box
              <Image alt="Copy Paste Import" height="250px" width="auto" src={importCopyPaste} />
            </List.Item>
            <List.Item>Review imported content</List.Item>
          </List>
        </Accordion.Item>

        <Accordion.Item title="Import Office 365 / OneDrive Word Documents">
          <List as="ol">
            <List.Item>Copy the document content to your clipboard (Ctrl+C / ⌘C or right click & copy)</List.Item>
            <List.Item>Navigate to the desired content entry and field</List.Item>
            <List.Item>Press the "Import" button</List.Item>
            <List.Item>
              Paste into the text box
              <Image alt="Copy Paste Import" height="250px" width="auto" src={importCopyPaste} />
            </List.Item>
            <List.Item>Review imported content</List.Item>
          </List>
        </Accordion.Item>

        <Accordion.Item title="Import HTML">
          <List as="ol">
            <List.Item>Copy the HTML to your clipboard (Ctrl+C / ⌘C or right click & copy)</List.Item>
            <List.Item>Navigate to the desired content entry and field</List.Item>
            <List.Item>Press the "Import" button</List.Item>
            <List.Item>
              Paste into the text box
              <Image alt="Copy Paste Import" height="250px" width="auto" src={importCopyPaste} />
            </List.Item>
            <List.Item>Review imported content</List.Item>
          </List>
        </Accordion.Item>
      </Accordion>
    </Card>
  );

  const support = (
    <Card>
      <Heading>Resources</Heading>
      <TextLink href="https://ellavationlabs.com/docs-to-rich-text/docs" target="_blank">
        Browse our documentation
      </TextLink>
      <Paragraph marginTop="spacingS">
        Contact us at <TextLink href="mailto:support@ellavationlabs.com">support@ellavationlabs.com</TextLink>
      </Paragraph>
      <TextLink href="https://ellavationlabs.com" target="_blank">
        See our other work
      </TextLink>
      <Paragraph marginTop="spacingS">
        <TextLink href="https://ellavationlabs.com/solutions" target="_blank">
          Custom Solutions
        </TextLink>
      </Paragraph>
    </Card>
  );

  const configurationCard = (
    <Card>
      <Heading>Settings</Heading>
      {planDetails}
      <br></br>
      <Checkbox
        name="use-image-wrapper"
        id="use-image-wrapper"
        isChecked={parameters.useImageWrapper ?? false}
        onChange={(e) =>
          setParameters({
            ...parameters,
            useImageWrapper: e.target.checked,
          })
        }>
        Use Image Wrapper {imageWrapperTooltip}
      </Checkbox>
      <br />
      {parameters.useImageWrapper && wrapperSelect}
    </Card>
  );

  const settingsForm = (
    <Form>
      <Flex flexDirection="row" gap="spacingS">
        {fieldsCard}
        {configurationCard}
      </Flex>
    </Form>
  );

  const header = (
    <Flex flexDirection="column" marginBottom="spacingM">
      <Flex alignItems="center" justifyContent="space-between">
        <Heading marginBottom="none">Docs to Rich Text {planType}</Heading>
        {!isLicensed && upgrade}
      </Flex>
      <Text marginTop="none">
        By{' '}
        <TextLink href="https://ellavationlabs.com" target="_blank" variant="secondary">
          Ellavation Labs
        </TextLink>
      </Text>
    </Flex>
  );

  return (
    <Flex flexDirection="column" margin="spacingL" gap="spacingS">
      {header}
      {settingsForm}
      {howTo}
      {support}
    </Flex>
  );
};

export default ConfigScreen;

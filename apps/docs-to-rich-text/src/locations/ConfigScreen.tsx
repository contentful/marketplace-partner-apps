import { useCallback, useState, useEffect } from 'react';
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
  SectionHeading,
  TextLink,
  Accordion,
} from '@contentful/f36-components';
import { HelpCircleIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { getEditorUsages, IsSpaceLicensed } from '../api/licensing';
import appearanceImage from '../assets/img/appearance.png';
import importImage from '../assets/img/import.png';

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
  const [usages, setUsages] = useState<{ contentModel: string; field: string }[]>([]);
  const [isLicensed, setIsLicensed] = useState(false);
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
      const usages = await getEditorUsages(sdk.cma, sdk.ids.app).then();
      setUsages(usages);
      const licensed = await IsSpaceLicensed(sdk.ids.space);
      setIsLicensed(licensed);
    })();
  }, [sdk]);

  const wrapperSelect = (
    <FormControl>
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
    <Button as="a" href="https://ellavationlabs.com/docs-to-rich-text" target="_blank" variant="primary">
      Upgrade Plan
    </Button>
  );

  const usagesTable = (
    <Table>
      <Table.Head>
        <Table.Row>
          <Table.Cell>Content Model</Table.Cell>
          <Table.Cell>Field</Table.Cell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {usages.map((item) => {
          return (
            <Table.Row key={`${item.contentModel}${item.field}`}>
              <Table.Cell>{item.contentModel}</Table.Cell>
              <Table.Cell>{item.field}</Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table>
  );

  const freePlanDetails = (
    <Card>
      <Heading>Plan Details</Heading>
      <Text>Plan Type: Free</Text>
      <br></br>
      <Text>Plan Limits: 5 fields</Text>

      <Paragraph marginTop="spacingM">
        <TextLink href="https://ellavationlabs.com/docs-to-rich-text" target="_blank" variant="premium">
          Upgrade now
        </TextLink>{' '}
        to remove limits
      </Paragraph>

      <SectionHeading marginTop="spacingL">Usage</SectionHeading>
      {usagesTable}
    </Card>
  );
  const paidPlanDetails = (
    <Card>
      <Heading>Plan Details</Heading>
      <Text>Plan Type: Premium</Text>
      <SectionHeading marginTop="spacingL">Usage</SectionHeading>
      {usagesTable}
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
        <Accordion.Item title="Configuration">
          Set Docs to Rich Text as the appearance editor for the desired rich text field in its content model
          <Image alt="Screenshot of configuring the Docs to Rich Text appearance editor" height="250px" width="auto" src={appearanceImage} />
        </Accordion.Item>
        <Accordion.Item title="Import">
          <List as="ol">
            <List.Item>Copy the contents of any Google Document or any HTML to your clipboard (Ctrl+C / ⌘C or right click & copy)</List.Item>
            <List.Item>Navigate to the desired content entry and field</List.Item>
            <List.Item>
              Paste into the Import field
              <Image alt="Import content from Google Docs or HTML" height="250px" width="auto" src={importImage} />
            </List.Item>
            <List.Item>Review your imported content</List.Item>
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
    </Card>
  );

  const settingsForm = (
    <Form>
      <Flex flexDirection="row" gap="spacingS">
        <Card>
          <Heading>Image Upload Settings</Heading>
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

        {isLicensed ? paidPlanDetails : freePlanDetails}
      </Flex>
    </Form>
  );

  const header = (
    <Flex flexDirection="column" marginBottom="spacingL">
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
    <Flex flexDirection="column" margin="spacingL">
      {header}
      {settingsForm}
      <br />
      {howTo}
      <br />
      {support}
    </Flex>
  );
};

export default ConfigScreen;

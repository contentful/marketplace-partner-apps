import { FieldAppSDK } from '@contentful/app-sdk';
import { Button, ButtonGroup, IconButton, Menu } from '@contentful/f36-components';
import { ArrowDownIcon, AssetIcon, VideoIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/react';
import { useCallback } from 'react';
import logo from '../../assets/logo.svg';
import { AppInstallationParameters, CloudinaryAsset, MediaLibraryResult, ResourceTypeFilter } from '../../types';
import { extractAsset } from '../../utils';
const styles = {
  logo: css({
    display: 'block',
    width: '16px',
    height: '16px',
  }),
};

interface Props {
  onNewAssetsAdded: (assets: CloudinaryAsset[]) => void;
  isDisabled: boolean;
}

export function AssetPickerButton({ onNewAssetsAdded, isDisabled }: Props) {
  const sdk = useSDK<FieldAppSDK<AppInstallationParameters>>();
  const resourceType = sdk.parameters.instance.resourceType as ResourceTypeFilter;
  const searchFilterTemplate = (sdk.parameters.instance.searchFilter || '') as string;

  const binding = {
    entry: sdk.entry,
  };
  function evaluator(template: string, context: Record<string, unknown>) {
    try {
      return new Function(...Object.keys(context), 'return `' + template + '`;')(...Object.values(context));
    } catch (error) {
      // show error notification to the user
      sdk.notifier.error(`Invalid field configuration ${template}\n${error}`);
      console.error(error);
      return template;
    }
  }

  const action = sdk.parameters.installation.showUploadButton === 'true' ? `Select or upload an Asset` : `Select an Asset`;
  const handleDialogOpenClick = useCallback(
    async (type?: string) => {
      let expression = type ? `resource_type:${type}` : ``;
      const hasBooleanOperator = searchFilterTemplate.match(/^\s*(AND|OR).*$/);
      const defaultBooleanOperator = hasBooleanOperator ? '' : 'AND';
      const searchFilter = evaluator(searchFilterTemplate, binding);
      expression = `${expression} ${defaultBooleanOperator} ${searchFilter}`;

      const result: MediaLibraryResult | undefined = await sdk.dialogs.openCurrentApp({
        position: 'center',
        title: `${action} on Cloudinary`,
        shouldCloseOnOverlayClick: true,
        shouldCloseOnEscapePress: true,
        width: 1400,
        parameters: {
          expression,
        },
      });

      if (!result) {
        return;
      }

      const assetsToPersist = result.assets.map(extractAsset);
      onNewAssetsAdded(assetsToPersist);
    },
    [onNewAssetsAdded, sdk.dialogs],
  );
  if (resourceType === 'image') {
    return (
      <>
        <Button
          startIcon={<img src={logo} alt="Logo" css={styles.logo} />}
          variant="secondary"
          size="small"
          onClick={() => handleDialogOpenClick('image')}
          isDisabled={isDisabled}>
          Select an Image
        </Button>
      </>
    );
  } else if (resourceType === 'video') {
    return (
      <Button
        startIcon={<img src={logo} alt="Logo" css={styles.logo} />}
        variant="secondary"
        size="small"
        onClick={() => handleDialogOpenClick('video')}
        isDisabled={isDisabled}>
        Select an Video
      </Button>
    );
  } else if (resourceType === 'all') {
    return (
      <>
        <ButtonGroup withDivider>
          <Button
            startIcon={<img src={logo} alt="Logo" css={styles.logo} />}
            variant="secondary"
            size="small"
            onClick={() => handleDialogOpenClick()}
            isDisabled={isDisabled}
            style={{ border: '1px solid rgb(207, 217, 224)' }}>
            Select an Asset
          </Button>
          <Menu placement="bottom-end">
            <Menu.Trigger>
              <IconButton
                variant="secondary"
                icon={<ArrowDownIcon />}
                aria-label="toggle menu"
                size="small"
                style={{ borderTopLeftRadius: '0px', borderBottomLeftRadius: 0 }}
              />
            </Menu.Trigger>
            <Menu.List>
              <Menu.Item icon={<AssetIcon />} onClick={() => handleDialogOpenClick('image')}>
                Select an Image
              </Menu.Item>
              <Menu.Item icon={<VideoIcon />} onClick={() => handleDialogOpenClick('video')}>
                Select a Video
              </Menu.Item>
            </Menu.List>
          </Menu>
        </ButtonGroup>
      </>
    );
  }
}

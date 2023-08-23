import { EntrySys, SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useRef } from 'react';
import { SurferContainer } from '../components/SurferContainer';
import { useFieldSelection } from '../hooks/useFieldSelection';
import { useSurfer } from '../hooks/useSurfer';
import { SurferContext, SurferRpcCommands, SurferRpcMessage } from '../types';
import { useContentHtml } from '../hooks/useContentHtml';
import { useConfigurationDialog } from '../hooks/useConfigurationDialog';
import { Flex, Note } from '@contentful/f36-components';

const buildShareToken = ({ id, space }: EntrySys) => `${space.sys.id}_${id}`;

const Sidebar = () => {
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const { entry, window } = useSDK<SidebarAppSDK>();
  const [selectedFields, FieldSelection, richTextFields] = useFieldSelection(Object.values(entry.fields));
  const contentHtml = useContentHtml(richTextFields, selectedFields);
  const shareToken = buildShareToken(entry.getSys());
  const { openConfigurationDialog, isConfigurationOpen } = useConfigurationDialog(shareToken);

  const onReady = ({ setHtml, configureView }: SurferContext) => {
    setHtml(contentHtml);
    configureView({
      configurationToggleOverride: true,
    });
  };

  const onRpcMessage = (message: SurferRpcMessage, context: SurferContext) => {
    if (message.command.message === SurferRpcCommands.CONFIGURATION_TOGGLED) {
      openConfigurationDialog(context);
    }
  };

  const { isLoading, setHtml } = useSurfer(iframeContainerRef, 'guidelines', {
    shareToken,
    onReady,
    onRpcMessage,
  })

  useEffect(() => {
    window.updateHeight(richTextFields.length ? 700 : 70);
  }, [window, richTextFields]);

  useEffect(() => {
    setHtml?.(contentHtml);
  }, [contentHtml, setHtml]);

  return richTextFields.length ? (
    <Flex flexDirection="column" justifyContent="space-between" fullHeight>
      <FieldSelection />
      <SurferContainer ref={iframeContainerRef} isLoading={isLoading || isConfigurationOpen} flex="2 0" />
    </Flex>
  ) : (
    <Note variant="warning">Add a RichText field to enable Surfer!</Note>
  );
};

export default Sidebar;

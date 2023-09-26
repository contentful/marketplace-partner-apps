import { EntrySys, SidebarAppSDK } from '@contentful/app-sdk';
import { Note } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useRef, useState } from 'react';
import { SurferContainer } from '../components/SurferContainer';
import { useConfigurationDialog } from '../hooks/useConfigurationDialog';
import { useContentHtml } from '../hooks/useContentHtml';
import { useSurfer } from '../hooks/useSurfer';
import { isRichText } from '../hooks/useSurferCompatibility';
import { SurferContext, SurferRpcCommands, SurferRpcMessage } from '../types';

const FULL_SIZE_PX = 550;
const WARNING_SIZE_PX = 70;
const EXPAND_BUTTON_SIZE_PX = 40;

const buildShareToken = ({ id, space }: EntrySys) => `${space.sys.id}_${id}`;

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const iframeContainerRef = useRef<HTMLDivElement>(null);
  const { entry, window, parameters } = useSDK<SidebarAppSDK>();

  const richTextFields = Object.values(entry.fields).filter(isRichText);
  const selectedFields = parameters?.installation?.selectedContentFields?.[entry.getSys().contentType.sys.id] || [];
  const widgetSizePx = richTextFields.length ? FULL_SIZE_PX : WARNING_SIZE_PX;
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
  });

  useEffect(() => {
    window.updateHeight(widgetSizePx);
  }, [window, widgetSizePx]);

  useEffect(() => {
    setHtml?.(contentHtml);
  }, [contentHtml, setHtml]);

  useEffect(() => {
    window.updateHeight(isExpanded ? widgetSizePx : EXPAND_BUTTON_SIZE_PX);
  }, [isExpanded, widgetSizePx, window]);

  return richTextFields.length ? (
    <SurferContainer ref={iframeContainerRef} isLoading={isLoading || isConfigurationOpen} flex="2 0" isExpanded={isExpanded} toggleExpanded={setIsExpanded} />
  ) : (
    <Note variant="warning">Add a RichText field to enable Surfer!</Note>
  );
};

export default Sidebar;

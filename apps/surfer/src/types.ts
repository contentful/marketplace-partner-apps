import { ContentTypeProps, ContentFields } from 'contentful-management';

export type SurferView = 'guidelines' | 'draft_configuration' | 'draft_creation' | 'draft_not_found';

export interface SurferContext {
  setHtml: (html: string | null) => void;
  requestView: (requestedView: SurferView) => void;
  refreshDraft: () => void;
  configureView: (config: {
    disableDraftConfiguration?: boolean;
    configurationOnCancelOverride?: boolean;
    configurationToggleOverride?: boolean;
    disableBatchContentEditorCreation?: boolean;
  }) => void;
}

export enum SurferRpcCommands {
  DRAFT_LOADED = 'draft-loaded',
  DRAFT_LOADING = 'draft_loading',
  VIEW_RENDERED = 'view-rendered',
  CONFIGURATION_CANCELLED = 'configuration-cancelled',
  CONFIGURATION_TOGGLED = 'configuration-toggled',
}

export interface SurferRpcMessage {
  command: {
    message: SurferRpcCommands;
    params: {
      [key: string]: any;
    };
  };
}

export interface SurferOptions {
  shareToken: string;
  onReady?: (context: SurferContext) => void;
  onRpcMessage?: (message: SurferRpcMessage, context: SurferContext) => void;
}

export type ContentTypeId = ContentTypeProps['sys']['id'];
export type ContentFieldId = ContentFields['id'];

export interface ContentFieldsMap {
  [id: ContentTypeId]: ContentFieldId[];
}

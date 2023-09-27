import { SurferContext, SurferRpcMessage } from './types';

export interface SurferGuidelines {
  initWithOptions: (...args: any[]) => SurferContext & {
    $iframe: HTMLIFrameElement;
    setPermalink: (permalink: string | null) => void;
  };
  setHtml: (html: string | null) => void;
}

declare global {
  interface Window {
    surferGuidelines: SurferGuidelines;
  }
}

export class Surfer {
  private iframe: HTMLIFrameElement | null = null;
  private surferContext: SurferContext | null = null;
  private rpcListener: ((message: MessageEvent) => void) | null = null;

  constructor(private readonly surferGuidelines: SurferGuidelines, private readonly eventEmitter = window) {
    if (!this.surferGuidelines) {
      throw new Error('Surfer is not available');
    }
  }

  initialize(shareToken: string, container: HTMLDivElement) {
    const { $iframe, setPermalink, ...surferContext } = this.surferGuidelines.initWithOptions({ partner: 'contentful' });

    this.iframe = $iframe;
    this.surferContext = surferContext;
    setPermalink(this.buildPermalink(shareToken));

    this.mount(container);

    return this.surferContext;
  }

  subscribeToMessages(onRpcMessage: (message: SurferRpcMessage, context: SurferContext) => void) {
    this.ensureInitialized();

    if (this.rpcListener) {
      this.eventEmitter.removeEventListener('message', this.rpcListener);
    }

    this.rpcListener = (event: MessageEvent) => {
      if (event.data?.command && event.data?.version?.startsWith('surfer-extension:1.')) {
        onRpcMessage(event.data, this.surferContext!);
      }
    };

    this.eventEmitter.addEventListener('message', this.rpcListener);
  }

  private mount(container: HTMLDivElement) {
    if (container.hasChildNodes()) {
      return;
    }

    container.appendChild(this.iframe!);
  }

  private ensureInitialized() {
    if (!this.iframe || !this.surferContext) {
      throw new Error('Surfer is not initialized');
    }
  }

  private buildPermalink(shareToken: string) {
    const url = new URL(window.location.href);
    url.hash = '';
    url.search = '';

    return encodeURIComponent(shareToken + url.toString());
  }
}

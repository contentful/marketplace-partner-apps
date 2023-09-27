import { EventEmitter } from 'stream';
import { randomUUID } from 'crypto';
import { SurferGuidelines, Surfer } from './Surfer';
import { SurferContext } from './types';

const mockSurferContext: SurferContext = {
  requestView: jest.fn(),
  setHtml: jest.fn(),
  refreshDraft: jest.fn(),
  configureView: jest.fn(),
};

const setPermalink = jest.fn();

describe('Surfer', () => {
  let mockWindow: Partial<typeof window>;
  let mockSurferGuidelines: SurferGuidelines;
  let surfer: Surfer;
  let container: HTMLDivElement;
  let iframe: HTMLIFrameElement;

  beforeEach(() => {
    jest.clearAllMocks();
    iframe = document.createElement('iframe');
    mockWindow = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    mockSurferGuidelines = {
      initWithOptions: jest.fn().mockReturnValue({
        ...mockSurferContext,
        $iframe: iframe,
        setPermalink,
      }),
      setHtml: jest.fn(),
    };

    surfer = new Surfer(mockSurferGuidelines, mockWindow as any);
    container = document.createElement('div');
  });

  it('should throw an error if Surfer is not available', () => {
    expect(() => new Surfer(null as any)).toThrowError('Surfer is not available');
  });

  describe('initialize', () => {
    const randomizeLocationQueryAndHash = () => {
      const location = Object.create(window.location, {
        href: {
          value: `https://contentful.com?foo=${randomUUID()}&bar=${randomUUID()}#${randomUUID()}`,
        },
      });

      delete (window as any).location;
      window.location = location;
    };

    it('initializes Surfer', () => {
      surfer.initialize('shareToken', container);

      expect(mockSurferGuidelines.initWithOptions).toHaveBeenCalledWith({ partner: 'contentful' });
    });

    it('ensures the permalink hash is repeatable', () => {
      randomizeLocationQueryAndHash();
      surfer.initialize('shareToken', container);

      randomizeLocationQueryAndHash();
      surfer.initialize('shareToken', container);

      const mockCalls = setPermalink.mock.calls;

      expect(mockCalls[0][0]).toEqual(mockCalls[1][0]);
    });

    it('returns the Surfer context', () => {
      expect(surfer.initialize('shareToken', container)).toEqual(mockSurferContext);
    });

    it('mounts the iframe', () => {
      surfer.initialize('shareToken', container);

      expect(container).toContainElement(iframe);
    });
  });

  describe('subscribeToMessages', () => {
    beforeEach(() => {});

    it('throws an error if Surfer is not initialized', () => {
      expect(() => surfer.subscribeToMessages(jest.fn())).toThrowError('Surfer is not initialized');
    });

    it('subscribes to messages', () => {
      surfer.initialize('shareToken', container);
      surfer.subscribeToMessages(jest.fn());

      expect(mockWindow.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('keeps only one listener', () => {
      surfer.initialize('shareToken', container);
      surfer.subscribeToMessages(jest.fn());
      surfer.subscribeToMessages(jest.fn());
      surfer.subscribeToMessages(jest.fn());

      expect(mockWindow.addEventListener).toHaveBeenCalledTimes(3);
      expect(mockWindow.removeEventListener).toHaveBeenCalledTimes(2);
    });

    describe('handling messages', () => {
      let eventEmitter: EventEmitter;

      beforeEach(() => {
        eventEmitter = new EventEmitter();

        mockWindow = {
          addEventListener: eventEmitter.addListener.bind(eventEmitter) as any,
          removeEventListener: eventEmitter.removeListener.bind(eventEmitter) as any,
        };

        surfer = new Surfer(mockSurferGuidelines, mockWindow as any);
      });

      it('calls the callback when a SurferRPC message is received', () => {
        const onRpcMessage = jest.fn();
        const message = { command: 'foo', version: 'surfer-extension:1.2' };

        surfer.initialize('shareToken', container);
        surfer.subscribeToMessages(onRpcMessage);

        expect(onRpcMessage).not.toHaveBeenCalled();

        eventEmitter.emit('message', { data: message });

        expect(onRpcMessage).toHaveBeenCalledWith(message, mockSurferContext);
      });

      it("doesn't call the callback if other message is received", () => {
        const onRpcMessage = jest.fn();
        const message = 'whatever';

        surfer.initialize('shareToken', container);
        surfer.subscribeToMessages(onRpcMessage);

        eventEmitter.emit('message', { data: message });

        expect(onRpcMessage).not.toHaveBeenCalled();
      });
    });
  });
});

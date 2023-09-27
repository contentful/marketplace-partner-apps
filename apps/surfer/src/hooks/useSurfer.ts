import { RefObject, useEffect, useRef, useState } from 'react';
import { SurferContext, SurferOptions, SurferRpcCommands, SurferView } from '../types';
import { Surfer } from '../Surfer';

export const useSurfer = (containerRef: RefObject<HTMLDivElement>, defaultView: SurferView, opts: SurferOptions) => {
  const { shareToken, onReady, onRpcMessage } = opts;

  const [surferContext, setSurferContext] = useState<SurferContext>();
  const [isLoading, setIsLoading] = useState(true);
  const { current: surfer } = useRef<Surfer>(new Surfer(window.surferGuidelines));

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }
    const context = surfer.initialize(shareToken, containerRef.current!);

    setSurferContext(context);
    onReady?.(context);
    context.requestView(defaultView);
    setIsLoading(true);

    surfer.subscribeToMessages((message, context) => {
      switch (message.command.message) {
        case SurferRpcCommands.DRAFT_LOADING:
          setIsLoading(true);
          break;

        case SurferRpcCommands.VIEW_RENDERED:
          const surferLoadedViews: SurferView[] = [defaultView, 'draft_creation', 'draft_not_found'];

          if (surferLoadedViews.includes(message.command.params.view)) {
            setIsLoading(false);
          }
          break;
      }

      onRpcMessage?.(message, context);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultView, shareToken]);

  return { ...surferContext, isLoading };
};

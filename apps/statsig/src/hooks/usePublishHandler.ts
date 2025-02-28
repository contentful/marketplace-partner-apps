import { useCallback, useEffect, useState } from 'react';

import { EditorAppSDK, EntrySys } from '@contentful/app-sdk';

type Callback = (publishCount: number) => void;

export const usePublishHandler = (sdk: EditorAppSDK, cb: Callback) => {
  const [publishedCounter, setPublishedCounter] = useState(
    sdk.entry.getSys().publishedCounter ?? 0,
  );

  const maybeHandlePublish = useCallback(
    (sys: EntrySys) => {
      if (sys.publishedCounter && publishedCounter < sys.publishedCounter) {
        cb(sys.publishedCounter);
        setPublishedCounter(sys.publishedCounter);
      }
    },
    [cb, publishedCounter],
  );

  useEffect(() => {
    const unbind = sdk.entry.onSysChanged(maybeHandlePublish);
    return unbind;
  }, [maybeHandlePublish, sdk.entry]);
};

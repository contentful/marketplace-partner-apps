/**
 * Title: @use-it/interval#useInterval
 * Author: Donavon West (https://github.com/donavon)
 * Date: Nov 21, 2020
 * Code version: 59d07e435f20e2116b489bb7dc211eff332f327e
 * Availability: https://github.com/donavon/use-interval/blob/59d07e435f20e2116b489bb7dc211eff332f327e/src/index.tsx
 * License: MIT (https://github.com/donavon/use-interval/blob/59d07e435f20e2116b489bb7dc211eff332f327e/LICENSE)
 */

import { useEffect, useRef } from 'react';

type Delay = number | null;
type TimerHandler = (...args: any[]) => void;

/**
 * Provides a declarative useInterval
 *
 * @param callback - Function that will be called every `delay` ms.
 * @param delay - Number representing the delay in ms. Set to `null` to "pause" the interval.
 */

const useInterval = (callback: TimerHandler, delay: Delay) => {
  const savedCallbackRef = useRef<TimerHandler>();

  useEffect(() => {
    savedCallbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (...args: any[]) => savedCallbackRef.current!(...args);

    if (delay !== null) {
      const intervalId = setInterval(handler, delay);
      return () => clearInterval(intervalId);
    }
  }, [delay]);
};

export default useInterval;

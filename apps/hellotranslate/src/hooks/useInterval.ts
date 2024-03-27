import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * Custom hook for creating an interval that invokes a callback function at a specified delay.
 * @param {() => void} callback - The function to be invoked at each interval.
 * @param {number | null} delay - The time, in milliseconds, between each invocation of the callback. Use `null` to clear the interval.
 * @see {@link https://usehooks-ts.com/react-hook/use-interval} - Documentation
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval} - MDN `setInterval`
 * @example
 * const handleInterval = () => {
 *   // Code to be executed at each interval
 * };
 * useInterval(handleInterval, 1000);
 */
export function useInterval(callback: () => void, delay: number | null) {
    const savedCallback = useRef(callback);

    // Remember the latest callback if it changes.
    useLayoutEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        // Don't schedule if no delay is specified.
        // Note: 0 is a valid value for delay.
        if (delay === null) {
            return;
        }

        const intervalId = setInterval(() => {
            savedCallback.current();
        }, delay);

        return () => {
            clearInterval(intervalId);
        };
    }, [delay]);
}

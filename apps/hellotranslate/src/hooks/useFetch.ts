import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { useToggle } from "./useToggle";

export const useFetch = <T>(
    fetch: () => Promise<T>,
): [T | undefined, () => void, Dispatch<SetStateAction<T | undefined>>] => {
    const [data, setData] = useState<T>();
    const [refresh, toggleRefresh] = useToggle();

    useEffect(() => {
        fetch()
            .then(setData)
            .catch((error) => {
                console.error(error);
                // TODO: show error message?
            });
    }, [fetch, refresh]);

    return [data, toggleRefresh, setData];
};

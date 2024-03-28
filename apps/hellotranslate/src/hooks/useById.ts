import { useMemo } from "react";

export const useById = <T>(array: T[] | undefined, toId: (item: T) => string) =>
    useMemo(
        () => array?.reduce((acc: Record<string, T>, item) => ({ ...acc, [toId(item)]: item }), {}),
        [array],
    );

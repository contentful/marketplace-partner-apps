import { CollectionProp } from "contentful-management";
import { useFetch } from "./useFetch";

export const useCollection = <T>(
    fetch: () => Promise<CollectionProp<T>>,
): Partial<CollectionProp<T>> & { refresh: () => void } => {
    const [collection, refresh] = useFetch(fetch);

    if (!collection) return { refresh };

    return { ...collection, refresh };
};

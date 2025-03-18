import { ContentType } from "@contentful/app-sdk";

export interface IConvoxContentTypesProps {
    contentTypes: ContentType[];
    isAuthenticated: boolean;
    selectedContentTypes: string[];
    onContentTypesChange: (ids: string[]) => void;
}

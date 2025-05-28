import { AppState } from "@contentful/app-sdk";
import { ContentTypeProps } from "contentful-management";

function targetStateToSelectedContentTypes(targetState: AppState) {
    return Object.entries(targetState?.EditorInterface || {})
        .filter(([, config]) => config.sidebar?.position != null)
        .map(([contentTypeId]) => contentTypeId);
}

function selectedContentTypesToTargetState(contentTypes: ContentTypeProps[], selectedContentTypes: string[]){
    return contentTypes.reduce((acc, contentType) => {
        const ctId = contentType.sys.id;
        return {
          ...acc,
          [ctId]: selectedContentTypes.includes(ctId)
            ? { sidebar: { position: 2 } }
            : {},
        };
      }, {})
}

export {selectedContentTypesToTargetState, targetStateToSelectedContentTypes};

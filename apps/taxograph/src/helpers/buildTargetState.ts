import { config } from "../config";

export function buildTargetState(selectedContentTypes: any[]) {
  return {
    ...selectedContentTypes.reduce((acc: any, item: any) => {
      return {
        ...acc,
        [item]: {
          controls: [{ fieldId: config.editorField.id }],
        },
      };
    }, {})
  }
}
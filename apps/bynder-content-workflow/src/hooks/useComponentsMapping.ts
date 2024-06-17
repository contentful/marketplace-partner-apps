import { getComponent, APICredentials, parseCredentials } from "@/services/api";
import { ComponentData, Field } from "@/type/types";
import {
  getCFComponentUUID,
  composeComponentModel,
  createEntryRefFieldType,
  setCFFieldValidation,
} from "@/utils/fieldMapping";
import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { ContentFields } from "contentful-management";
import { useRef } from "react";

export default function useComponentsMapping() {
  const sdk = useSDK<PageAppSDK>();
  const credentials = useRef(parseCredentials(sdk.parameters.installation));

  async function getComponentReferenceData(component: ComponentData) {
    const spaceId = sdk.ids.space;
    const environmentId = sdk.ids.environment;
    try {
      const existing = await sdk.cma.contentType.get({
        spaceId,
        environmentId,
        contentTypeId: getCFComponentUUID(component.uuid),
      });
      return existing.sys.id;
    } catch (error: any) {
      if (error?.code === "NotFound") {
        if (!credentials.current) {
            throw new Error("App cofinguration is missing");
        }
        const componentInGC = (
          await getComponent(
            credentials.current as APICredentials,
            component.uuid
          )
        ).data;
        if (!componentInGC) {
          throw new Error(
            `Component (id: ${component.uuid}) not found in Content Workflow`
          );
        }
        const modelToCreate = composeComponentModel(
          component,
          componentInGC.name as string
        );
        const created = await sdk.cma.contentType.createWithId(
          {
            spaceId,
            environmentId,
            contentTypeId: getCFComponentUUID(component.uuid),
          },
          modelToCreate
        );
        await sdk.cma.contentType.publish(
          { contentTypeId: created.sys.id },
          created
        );
        return created.sys.id;
      } else {
        throw error;
      }
    }
  }

  async function createNewComponentFields(components: ComponentData[]) {
    const contentFields: ContentFields[] = [];
    for (const component of components) {
      const componentRefId = await getComponentReferenceData(component);
      contentFields.push({
        id: component.cfFieldId,
        name: component.cfFieldName,
        required: false,
        localized: false,
        ...createEntryRefFieldType([componentRefId], component.isRepeatable),
      });
    }
    return contentFields;
  }

  async function updateComponentFields(
    fields: { gcField: Field; cfField: ContentFields }[]
  ) {
    const contentFields: ContentFields[] = [];
    for (const field of fields) {
      if (!field.gcField.component) continue;
      const cfField = field.cfField;
      const componentData: ComponentData = {
        uuid: field.gcField.component.uuid,
        fields: field.gcField.component.fields,
        cfFieldId: cfField.id,
        cfFieldName: cfField.name,
        isRepeatable: field.gcField.metadata.repeatable?.isRepeatable || false,
      };
      const componentRefId = await getComponentReferenceData(componentData);
      const updatedField = setCFFieldValidation(cfField, componentRefId);
      contentFields.push(updatedField);
    }
    return contentFields;
  }

  return {
    createNewComponentFields,
    updateComponentFields,
  }
}

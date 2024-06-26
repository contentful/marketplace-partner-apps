import { processAppUninstallationWebhook } from "@/controllers/app-config/app-config";
import { eContentfulWebhooks } from "@/lib/Constants";

export const handleContentfulWebhook = async (reqBody:any) => {

    const {
    sys: {
      appDefinition: {
        sys: { id: appDefinitionId },
      },
      environment: {
        sys: { id: environmentId },
      },
      space: {
        sys: { id: spaceId },
      },
      type
    },
    parameters,
  } = reqBody;
  
  console.log(`${type} Webhook Received at route`)
  if(type === eContentfulWebhooks.APP_UNINSTALLATION){
    processAppUninstallationWebhook(spaceId)
  }

}

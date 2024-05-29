import { SidebarAppSDK } from "@contentful/app-sdk";
import { Button, Paragraph, Stack } from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Experiment } from "../contexts/ExperimentContext";
import { useEffect, useState } from "react";
import { Datacenter } from "../utils/amplitude";

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const [experiment, setExperiment] = useState<Experiment | undefined>(
    undefined
  );

  useEffect(() => {
    const valueChangeHandler = (experiment?: Experiment) => {
      setExperiment(experiment);
    };
    const detachValueChangeHandler =
      sdk.entry.fields.experiment.onValueChanged(valueChangeHandler);

    return detachValueChangeHandler;
  }, [sdk.entry.fields.experiment]);

  const { orgId, datacenter } = sdk.parameters.installation;

  const getExperimentDetailsUrl =
    (orgId: string, datacenter: Datacenter) => (projectId: string, flagId: string) => {
      const baseUrl = datacenter === "US" ?
          'https://app.amplitude.com' :
          'https://app.eu.amplitude.com';
        return `${baseUrl}/experiment/${orgId}/${projectId}/config/${flagId}`;
    }


  if (!experiment) {
    return <Paragraph>No experiment configured yet.</Paragraph>;
  }

  return (
    <Stack spacing="spacingS" flexDirection="column">
      <Button
        variant="primary"
        as="a"
        isFullWidth
        isDisabled={!orgId}
        href={getExperimentDetailsUrl(orgId, datacenter)(
          experiment.projectId,
          experiment.id
        )}
        onClick={() => {}}
        target="_blank"
      >
        View/Edit in Amplitude
      </Button>
      <Button
        variant="primary"
        as="a"
        isFullWidth
        isDisabled={!orgId}
        href={`https://app.amplitude.com/experiment/${orgId}/experiments`}
        onClick={() => {}}
        target="_blank"
      >
        View all experiments
      </Button>
    </Stack>
  );
};

export default Sidebar;

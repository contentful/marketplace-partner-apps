import { createContext, useEffect, useMemo, useState } from "react";
import { AmplitudeExperimentApi } from "../utils/amplitude";
import { useSDK } from "@contentful/react-apps-toolkit";

export interface Variant {
  [key: string]: string;
}

export type RolloutWeights = Record<string, RolloutWeight>;
export type RolloutWeight = number;

export interface TargetSegmentCondition {
  prop: string;
  op: string;
  type: string;
  values: Array<string>;
}
export interface TargetSegment {
  bucketingKey: string;
  conditions: Array<TargetSegmentCondition>;
  name: string;
  percentage: number;
  rolloutWeights: { [key: string]: number };
}

export declare enum ExperimentDecision {
  ROLLOUT = "rollout",
  ROLLBACK = "rollback",
  CONTINUE_RUNNING = "continue-running",
}

export interface Experiment {
  bucketingKey: string;
  bucketingSalt: string;
  bucketingUnit: string;
  decision: ExperimentDecision | null;
  deleted: boolean;
  description: string;
  evaluationMode: string;
  enabled: boolean;
  experimentType: string;
  id: string;
  projectId: string;
  deployments: Array<string>;
  key: string;
  name: string;
  variants: Array<Variant>;
  targetSegments: Array<TargetSegment>;
  rolloutPercentage: number;
  stickyBucketing: boolean;
  tags: Array<string>;
  rolledOutVariant: string | null; // variant key
  rolloutWeights: RolloutWeights;
}

interface ExperimentContextProps {
  experiments: Array<Experiment>;
  loading: boolean;
  amplitudeExperimentApi: AmplitudeExperimentApi | null;
}

export const ExperimentContext = createContext<ExperimentContextProps>({
  experiments: [],
  loading: false,
  amplitudeExperimentApi: null,
});

export const ExperimentProvider = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const sdk = useSDK();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const amplitudeExperimentApi = useMemo(
    () =>
      new AmplitudeExperimentApi(
        sdk.parameters.installation.managementApiKey,
        sdk.parameters.installation.datacenter
      ),
    [
      sdk.parameters.installation.managementApiKey,
      sdk.parameters.installation.datacenter,
    ]
  );

  useEffect(() => {
    const fetchExperiments = async () => {
      setLoading(true);
      const experiments = await amplitudeExperimentApi.listAllExperiments();
      return experiments;
    };
    fetchExperiments().then((experiments) => {
      setExperiments(experiments);
      setLoading(false);
    });
  }, [amplitudeExperimentApi]);
  return (
    <ExperimentContext.Provider value={{ experiments, loading, amplitudeExperimentApi }}>
      {children}
    </ExperimentContext.Provider>
  );
};

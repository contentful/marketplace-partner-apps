import { TargetSegment } from "../contexts/ExperimentContext";

export const getTotalWeight = (segment: TargetSegment) => {
    const { rolloutWeights } = segment;
    return Object.values(rolloutWeights).reduce(
      (acc, currWeight) => acc + currWeight,
      0
    );
  };

export const toDisplayPercentage = (percentage: number): string => {
  if (percentage % 1 !== 0) {
    return `~${percentage.toFixed(1)}`;
  }

  return `${percentage}`;
};

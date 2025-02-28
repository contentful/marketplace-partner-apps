import * as React from 'react';

import { MissingEntityCard } from '../../components/MissingEntityCard/MissingEntityCard';

type UnsupportedEntityCardProps = {
  isSelected?: boolean;
  onRemove?: () => void;
};

export function UnsupportedEntityCard(props: UnsupportedEntityCardProps) {
  return (
    <MissingEntityCard
      customMessage="Unsupported API information"
      isSelected={props.isSelected}
      onRemove={props.onRemove}
    />
  );
}

import React from 'react';
import {
  FormControl,
  Select,
  Spinner,
  Text,
  Note,
} from '@contentful/f36-components';
import { Environment } from '../types';

interface EnvironmentSelectorProps {
  environmentKey: string;
  environments: Environment[];
  isLoading: boolean;
  onChange: (environmentKey: string) => void;
}

/**
 * Component for selecting a LaunchDarkly environment
 */
const EnvironmentSelector: React.FC<EnvironmentSelectorProps> = ({
  environmentKey,
  environments,
  isLoading,
  onChange,
}) => {
  if (isLoading) {
    return (
      <FormControl>
        <FormControl.Label>Environment</FormControl.Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Spinner size="small" />
          <Text>Loading environments...</Text>
        </div>
        {environmentKey && (
          <Note variant="primary" style={{ marginTop: '8px' }}>
            Current selection: {environmentKey}
          </Note>
        )}
      </FormControl>
    );
  }

  if (!environments || environments.length === 0) {
    return (
      <FormControl>
        <FormControl.Label>Environment</FormControl.Label>
        <Text fontColor="gray600">
          No environments found. Please select a project first.
        </Text>
        {environmentKey && (
          <Note variant="warning" style={{ marginTop: '8px' }}>
            Previously selected environment &quot;{environmentKey}&quot; not found. Please verify your project selection or choose a different environment.
          </Note>
        )}
      </FormControl>
    );
  }

  return (
    <FormControl>
      <FormControl.Label>Environment</FormControl.Label>
      <Select
        id="environment-select"
        name="environment"
        value={environmentKey}
        onChange={(e) => onChange(e.target.value)}
        isDisabled={isLoading}
      >
        <Select.Option value="">Select an environment</Select.Option>
        {environments.map((env) => (
          <Select.Option key={env.key} value={env.key}>
            {env.name} ({env.key})
          </Select.Option>
        ))}
      </Select>
    </FormControl>
  );
};

export default EnvironmentSelector; 
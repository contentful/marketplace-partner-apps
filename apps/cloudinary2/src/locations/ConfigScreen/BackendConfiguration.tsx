import { Form } from '@contentful/f36-components';
import { useCallback } from 'react';
import { TextField } from '../../components/TextField';
import { BackendParameters } from '../../types';

interface Props {
  parameters: BackendParameters;
  onParametersChange: (parameters: BackendParameters) => void;
}

export function BackendConfiguration({ parameters, onParametersChange }: Props) {
  const onParameterChange = useCallback(
    <Key extends keyof BackendParameters>(key: Key, value: BackendParameters[Key]) => {
      const newParameters = {
        ...parameters,
        [key]: value,
      };
      onParametersChange(newParameters);
    },
    [parameters, onParametersChange],
  );

  return (
    <Form>
      <TextField
        testId="config-apiSecret"
        name="API secret (write-only)"
        description=""
        value={parameters.apiSecret}
        onChange={(value) => onParameterChange('apiSecret', value)}
        isRequired
        type="text"
      />
    </Form>
  );
}

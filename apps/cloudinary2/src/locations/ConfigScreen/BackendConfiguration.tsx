import { Form } from '@contentful/f36-components';
import { useCallback } from 'react';
import { TextField } from '../../components/TextField';
import { BackendParameters } from '../../types';

type Props = {
  backendParameters: BackendParameters;
  onBackendParametersChange: (parameters: BackendParameters) => void;
}

export function BackendConfiguration({ backendParameters, onBackendParametersChange }: Props) {
  const onParameterChange = useCallback(
    <Key extends keyof BackendParameters>(key: Key, value: BackendParameters[Key]) => {
      const newParameters = {
        ...backendParameters,
        [key]: value,
      };
      onBackendParametersChange(newParameters);
    },
    [backendParameters, onBackendParametersChange],
  );

  return (
    <Form>
      <TextField
        testId="config-apiSecret"
        name="API secret (write-only)"
        description="The API secret can be found with the above corresponding API Key"
        value={backendParameters.apiSecret}
        onChange={(value) => onParameterChange('apiSecret', value)}
        isRequired
        type="text"
      />
    </Form>
  );
}

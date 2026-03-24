import { useState, useEffect } from 'react';
import { FormControl, TextInput } from '@contentful/f36-components';

interface Props {
  configUuid: string;
  onInput: (data: string) => void;
}

function ConfigInputForm({ onInput, configUuid } : Props) {
  const [value, setValue] = useState<string>(configUuid);
  const updateValue = (v: string) => {
    setValue(v);
  };

  useEffect(() => {
    onInput(value);
  }, [value, onInput]); 
  return (
    <FormControl isRequired isInvalid={!value}>
      <FormControl.Label>Connector Config UUID</FormControl.Label>
      <TextInput
        value={value}
        type="text"
        name="text"
        placeholder="xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx"
        onChange={(e) => updateValue(e.target.value)}
      />
      <FormControl.HelpText>Provide your Connector Config UUID to create your projects on Bureau Works.</FormControl.HelpText>
      {!value && (
        <FormControl.ValidationMessage>
          Please, provide your Connector Config UUID.
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
}

export default ConfigInputForm;
import { useState, useEffect } from 'react';
import { FormControl, TextInput } from '@contentful/f36-components';

interface Props {
  orgUnitUuid: string;
  onInput: (data: string) => void;
}

function OrgUnitInputForm({ onInput, orgUnitUuid } : Props) {
  const [value, setValue] = useState<string>(orgUnitUuid);
  const updateValue = (v: string) => {
    setValue(v);
  };

  useEffect(() => {
    onInput(value);
  }, [value, onInput]); 
  return (
    <FormControl isRequired isInvalid={!value}>
      <FormControl.Label>Organizational Unit UUID</FormControl.Label>
      <TextInput
        value={value}
        type="text"
        name="text"
        placeholder="xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx"
        onChange={(e) => updateValue(e.target.value)}
      />
      <FormControl.HelpText>Provide your Organizational Unit UUID to create your projects on wxrks.</FormControl.HelpText>
      {!value && (
        <FormControl.ValidationMessage>
          Please, provide your Organizational Unit UUID.
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
}

export default OrgUnitInputForm;

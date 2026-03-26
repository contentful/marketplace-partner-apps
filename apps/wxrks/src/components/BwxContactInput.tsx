import { useState, useEffect } from 'react';
import { FormControl, TextInput } from '@contentful/f36-components';

interface Props {
  contactUuid: string;
  onInput: (data: string) => void;
}

function ContactInputForm({ onInput, contactUuid } : Props) {
  const [value, setValue] = useState<string>(contactUuid);
  const updateValue = (v: string) => {
    setValue(v);
  };

  useEffect(() => {
    onInput(value);
  }, [value, onInput]); 
  return (
    <FormControl isRequired isInvalid={!value}>
      <FormControl.Label>Contact UUID</FormControl.Label>
      <TextInput
        value={value}
        type="text"
        name="text"
        placeholder="xxxxxxx-xxxxxxx-xxxxxxx-xxxxxxx"
        onChange={(e) => updateValue(e.target.value)}
      />
      <FormControl.HelpText>Provide your Project Contact UUID.</FormControl.HelpText>
      {!value && (
        <FormControl.ValidationMessage>
          Please, provide your Project UUID.
        </FormControl.ValidationMessage>
      )}
    </FormControl>
  );
}

export default ContactInputForm;
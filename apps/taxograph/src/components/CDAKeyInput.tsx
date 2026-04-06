import { useState } from "react";
import { Form, Button, FormControl, TextInput, Note } from "@contentful/f36-components"
import { createCDAClient } from '../helpers';

interface CDAKeyInputProps {
  setParameters: any
  setShowInputScreen: any
  parameters?: any
  spaceId?: string
  environmentId?: string
}

export function CDAKeyInput({ setParameters, setShowInputScreen, parameters, spaceId, environmentId }: CDAKeyInputProps) {
  const [value, setValue] = useState<string>(parameters?.cda_key || '');
  const [displayValue, setDisplayValue] = useState<string>(parameters?.cda_key ? '•'.repeat(parameters.cda_key.length - 4) + parameters.cda_key.slice(-4) : '');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (newValue.length > 4) {
      setDisplayValue('•'.repeat(newValue.length - 4) + newValue.slice(-4));
    } else {
      setDisplayValue(newValue);
    }

    setError('');
  };

  const submitForm = async () => {
    if (value && value.length > 1) {
      setIsValidating(true);
      setError('');

      try {
        if (spaceId && environmentId) {
          const client = createCDAClient(spaceId, environmentId, value);

          await client.getConceptSchemes();

          setParameters({
            cda_key: value
          });

          setShowInputScreen(false);
        } else {
          throw new Error('Missing space or environment ID');
        }
      } catch (err) {
        setError('Invalid API token. Please check and try again.');
        console.error('CDA validation error:', err);
      } finally {
        setIsValidating(false);
      }
    } else {
      setError('Please enter a valid API token');
    }
  };

  return (
    <Form onSubmit={submitForm}>
      <FormControl className="!mb-4">
        <FormControl.Label isRequired className="!text-xl">Content Delivery API (CDA) token</FormControl.Label>
        <TextInput
          type="text"
          placeholder="e.g. AIzaSyDaGmWKa4JsXZ-HjGw7ISLn_3namBGewQe"
          value={displayValue}
          onChange={handleInputChange}
          isInvalid={!!error}
        />
        {error && <FormControl.ValidationMessage>{error}</FormControl.ValidationMessage>}
        <FormControl.HelpText>
          To access taxonomy schemas in your organization, add your CDA token
        </FormControl.HelpText>
      </FormControl>

      <Note title="TaxoGraph app relies on a Beta features" variant="warning">
        For the app to render taxonomy concepts, your organization needs to be whitelisted to use taxonomy concepts in the CDA. You can request access by posting a message in the <a href="https://contentful.slack.com/archives/C063CMFR65U" target="_blank" className="!text-blue-500 underline">#prd-cp-groot</a> channel.
        To learn how to set up taxonomy schemas in your organization, read the <a href="https://www.contentful.com/help/taxonomy/" target="_blank" className="!text-blue-500 underline">help documentation</a>.
      </Note>

      <Button
        variant="primary"
        type="submit"
        className="!mt-4 !ml-auto !flex"
        isLoading={isValidating}
        isDisabled={isValidating}
      >
        Update
      </Button>
    </Form>
  )
}
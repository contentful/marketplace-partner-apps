import { ConfigAppSDK } from '@contentful/app-sdk';
import { Flex, Form, FormControl, TextInput, Heading, Paragraph, Box, MenuDivider, Select } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import css from '@emotion/css';
import { useCallback, useEffect, useState } from 'react';
import { AppInstallationParameters } from '../utils/types';
import { INFERENCE_PROVIDERS } from '@huggingface/inference';

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    huggingfaceApiKey: '',
    textModelId: 'meta-llama/Llama-3.2-3B-Instruct',
    textModelInferenceProvider: 'hf-inference',
    imageModelId: 'black-forest-labs/FLUX.1-dev',
    imageModelInferenceProvider: 'hf-inference',
  });
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    // Validate the form
    const valid = Boolean(parameters.huggingfaceApiKey && parameters.textModelId && parameters.imageModelId && parameters.textModelInferenceProvider);

    if (!valid) return false;

    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleChange = (key: keyof AppInstallationParameters) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setParameters((prev: AppInstallationParameters) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const handleSelectChange = (key: keyof AppInstallationParameters) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParameters((prev: AppInstallationParameters) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const containerStyles = css({
    minHeight: '100vh',
    padding: '24px',
  });

  const boxStyles = css({
    width: '800px',
    padding: '40px',
    border: '1px solid #DCDCDC',
    borderRadius: '8px',
  });

  return (
    <Flex justifyContent="center" alignItems="center" className={`${containerStyles}`}>
      <Box className={`${boxStyles}`}>
        <Form>
          <Heading>Hugging Face Integration Configuration</Heading>
          <Paragraph>Configure your Hugging Face API settings to enable AI image generation.</Paragraph>

          <MenuDivider />

          <FormControl isRequired marginBottom="spacingM" marginTop="spacingM">
            <FormControl.Label>Hugging Face API Key</FormControl.Label>
            <TextInput
              type="password"
              name="huggingfaceApiKey"
              value={parameters.huggingfaceApiKey || ''}
              onChange={handleChange('huggingfaceApiKey')}
              placeholder="hf_..."
            />
            <FormControl.HelpText>
              You can find this in your Hugging Face account settings. Your API key will be stored securely in Contentful. Never share or expose your API key in
              client-side code.
            </FormControl.HelpText>
          </FormControl>

          <Heading marginBottom="none">Model Requirements</Heading>
          <Paragraph marginBottom="spacingM">The selected models must be available on the Hugging Face Inference API to work with this integration.</Paragraph>

          <FormControl isRequired marginBottom="spacingM">
            <FormControl.Label>Text Model ID</FormControl.Label>
            <TextInput
              name="textModelId"
              value={parameters.textModelId || ''}
              onChange={handleChange('textModelId')}
              placeholder="meta-llama/Llama-3.2-3B-Instruct"
            />
            <FormControl.HelpText>Enter the Hugging Face model ID for text processing. (Must be a Text Generation model)</FormControl.HelpText>
          </FormControl>

          <FormControl isRequired marginBottom="spacingM">
            <FormControl.Label>Text Model Inference Provider</FormControl.Label>
            <Select
              name="textModelInferenceProvider"
              value={parameters.textModelInferenceProvider || ''}
              onChange={handleSelectChange('textModelInferenceProvider')}>
              <Select.Option value="" isDisabled>
                Select an Inference Provider
              </Select.Option>
              {INFERENCE_PROVIDERS.map((provider) => (
                <Select.Option key={provider} value={provider}>
                  {provider}
                </Select.Option>
              ))}
            </Select>
            <FormControl.HelpText>Enter the Inference Provider you wish to use with your text model.</FormControl.HelpText>
          </FormControl>

          <FormControl isRequired marginBottom="spacingM">
            <FormControl.Label>Image Model ID</FormControl.Label>
            <TextInput
              name="imageModelId"
              value={parameters.imageModelId || ''}
              onChange={handleChange('imageModelId')}
              placeholder="black-forest-labs/FLUX.1-dev"
            />
            <FormControl.HelpText>Enter the Hugging Face model ID for image generation. (Must be a Text-to-Image model)</FormControl.HelpText>
          </FormControl>

          <FormControl isRequired marginBottom="spacingM">
            <FormControl.Label>Image Model Inference Provider</FormControl.Label>
            <Select
              name="imageModelInferenceProvider"
              value={parameters.imageModelInferenceProvider || ''}
              onChange={handleSelectChange('imageModelInferenceProvider')}>
              <Select.Option value="" isDisabled>
                Select an Inference Provider
              </Select.Option>
              {INFERENCE_PROVIDERS.map((provider) => (
                <Select.Option key={provider} value={provider}>
                  {provider}
                </Select.Option>
              ))}
            </Select>
            <FormControl.HelpText>Enter the Inference Provider you wish to use with your image model.</FormControl.HelpText>
          </FormControl>

          <MenuDivider />
          <Heading as="h2" marginBottom="spacingS">Image Generation Settings</Heading>

          <FormControl marginBottom="spacingM">
            <FormControl.Label>Image Generation Steps</FormControl.Label>
            <TextInput
              type="number"
              name="imageNumInferenceSteps"
              value={String(parameters.imageNumInferenceSteps ?? 50)}
              onChange={e => setParameters(prev => ({ ...prev, imageNumInferenceSteps: Number(e.target.value) }))}
              placeholder="50"
              min={1}
              max={100}
            />
            <FormControl.HelpText>Number of inference steps for image generation (higher = better quality, slower).</FormControl.HelpText>
          </FormControl>

          <FormControl marginBottom="spacingM">
            <FormControl.Label>Image Height (px)</FormControl.Label>
            <TextInput
              type="number"
              name="imageHeight"
              value={String(parameters.imageHeight ?? 1024)}
              onChange={e => setParameters(prev => ({ ...prev, imageHeight: Number(e.target.value) }))}
              placeholder="1024"
              min={64}
              max={2048}
            />
            <FormControl.HelpText>Height of generated images in pixels.</FormControl.HelpText>
          </FormControl>

          <FormControl marginBottom="spacingM">
            <FormControl.Label>Image Width (px)</FormControl.Label>
            <TextInput
              type="number"
              name="imageWidth"
              value={String(parameters.imageWidth ?? 1024)}
              onChange={e => setParameters(prev => ({ ...prev, imageWidth: Number(e.target.value) }))}
              placeholder="1024"
              min={64}
              max={2048}
            />
            <FormControl.HelpText>Width of generated images in pixels.</FormControl.HelpText>
          </FormControl>

          <FormControl marginBottom="spacingM">
            <FormControl.Label>Guidance Scale</FormControl.Label>
            <TextInput
              type="number"
              name="imageGuidanceScale"
              value={String(parameters.imageGuidanceScale ?? 3.5)}
              onChange={e => setParameters(prev => ({ ...prev, imageGuidanceScale: Number(e.target.value) }))}
              placeholder="3.5"
              min={1}
              max={20}
              step={0.1}
            />
            <FormControl.HelpText>How closely the image should follow the prompt (higher = more literal, but can be less creative).</FormControl.HelpText>
          </FormControl>

          <FormControl marginBottom="spacingM">
            <FormControl.Label>Max Sequence Length</FormControl.Label>
            <TextInput
              type="number"
              name="imageMaxSequenceLength"
              value={String(parameters.imageMaxSequenceLength ?? 512)}
              onChange={e => setParameters(prev => ({ ...prev, imageMaxSequenceLength: Number(e.target.value) }))}
              placeholder="512"
              min={64}
              max={2048}
            />
            <FormControl.HelpText>Maximum sequence length for the prompt (advanced, usually leave as default).</FormControl.HelpText>
          </FormControl>
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;

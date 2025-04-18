import { PageAppSDK } from '@contentful/app-sdk';
import { 
  Grid,
  Form,
  FormControl,
  Textarea,
  Button,
  Flex,
  Heading,
  Paragraph,
  Stack,
  Note
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useState, useEffect } from 'react';
import { css } from 'emotion';
import { generateImage } from '../services/huggingfaceImage';
import { refinePrompt } from '../services/huggingfaceText';

interface AppInstallationParameters {
  huggingfaceApiKey?: string;
  textModelId?: string;
  imageModelId?: string;
}

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerActive]);

  const handleRefinePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialPrompt.trim()) return;

    setIsRefining(true);
    setError(null);
    try {
      const parameters = sdk.parameters.installation as AppInstallationParameters;
      if (!parameters) {
        throw new Error('App is not properly configured');
      }

      const optimizedPrompt = await refinePrompt(initialPrompt, parameters);
      setRefinedPrompt(optimizedPrompt);
    } catch (error) {
      console.error('Error refining prompt:', error);
      setError(error instanceof Error ? error.message : 'Failed to refine prompt');
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    const promptToUse = refinedPrompt || initialPrompt;
    if (!promptToUse.trim()) return;

    setIsGenerating(true);
    setError(null);
    setTimer(0);
    setIsTimerActive(true);
    try {
      const parameters = sdk.parameters.installation as AppInstallationParameters;
      if (!parameters) {
        throw new Error('App is not properly configured');
      }

      const imageBlob = await generateImage(initialPrompt, parameters, refinedPrompt);
      const imageUrl = URL.createObjectURL(imageBlob);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error('Error generating image:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
      setIsTimerActive(false);
    }
  };

  const handleUploadAsset = async () => {
    if (!generatedImage) return;

    setIsUploading(true);
    setError(null);
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], 'ai-generated-image.png', { type: 'image/png' });
      const buffer = await file.arrayBuffer();
      const upload = await sdk.cma.upload.create({ spaceId: sdk.ids.space }, { file: buffer });

      let asset = await sdk.cma.asset.create(
        { spaceId: sdk.ids.space },
        {
          fields: {
            title: {
              'en-US': 'AI Generated Image'
            },
            description: {
              'en-US': `Generated from prompt: ${initialPrompt}`
            },
            file: {
              'en-US': {
                contentType: 'image/png',
                fileName: 'ai-generated-image.png',
                uploadFrom: {
                  sys: { type: 'Link', linkType: 'Upload', id: upload.sys.id }
                }
              }
            }
          }
        }
      );

      asset = await sdk.cma.asset.processForLocale(
        { spaceId: sdk.ids.space, assetId: asset.sys.id, version: asset.sys.version },
        asset,
        'en-US'
      );
      asset = await sdk.cma.asset.publish(
        { spaceId: sdk.ids.space, assetId: asset.sys.id, version: asset.sys.version },
        asset
      );

      sdk.notifier.success('Asset successfully uploaded and published');
      
    } catch (error) {
      console.error('Error uploading asset:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload asset');
      sdk.notifier.error('Failed to upload asset');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Grid
      padding="spacingXl"
      columns="1fr"
      rowGap="spacingXl"
      style={{ maxWidth: '1200px', margin: '0 auto' }}
    >
      {/* Header Section */}
      <Grid.Item>
        <Stack spacing="spacingM">
          <Heading>AI Image Generation</Heading>
          <Paragraph>Enter your initial image concept, and we'll help optimize it for the best results.</Paragraph>
        </Stack>
      </Grid.Item>

      {/* Form Section */}
      <Grid.Item>
        <Form onSubmit={handleRefinePrompt}>
          <Stack spacing="spacingM">
            <FormControl isRequired>
              <FormControl.Label>Describe your image concept</FormControl.Label>
              <Textarea
                name="initialPrompt"
                value={initialPrompt}
                onChange={(e) => setInitialPrompt(e.target.value)}
                placeholder="e.g., A calm forest with a surreal glow"
                isDisabled={isRefining || isGenerating}
                rows={4}
                resize="vertical"
              />
              <FormControl.HelpText>
                Be descriptive but concise. You can either refine your prompt first or generate an image directly.
              </FormControl.HelpText>
            </FormControl>

            {refinedPrompt && (
              <FormControl>
                <FormControl.Label>Refined Prompt</FormControl.Label>
                <Textarea
                  name="refinedPrompt"
                  value={refinedPrompt}
                  onChange={(e) => setRefinedPrompt(e.target.value)}
                  isDisabled={isGenerating}
                  rows={4}
                  resize="vertical"
                />
                <FormControl.HelpText>
                  This is the AI-optimized version of your prompt. You can edit it further if needed.
                </FormControl.HelpText>
              </FormControl>
            )}

            <Flex flexDirection="column" gap="spacingS">
              <Button
                variant="secondary"
                onClick={handleRefinePrompt}
                isDisabled={!initialPrompt.trim() || isRefining || isGenerating}
                isLoading={isRefining}
              >
                {isRefining ? 'Refining Prompt...' : 'Refine Prompt'}
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateImage}
                isDisabled={!initialPrompt.trim() || isGenerating}
                isLoading={isGenerating}
              >
                {isGenerating ? 'Generating Image...' : 'Generate Image'}
              </Button>
            </Flex>
          </Stack>
        </Form>
      </Grid.Item>

      {/* Results Section */}
      <Grid.Item>
        {isTimerActive && (
          <>
            <Note variant="primary" className={css({ margin: '24px 0' })}>
              Some models take ~60 seconds for image generation.
           </Note>
           <Note variant="premium" className={css({ margin: '24px 0' })}>
             Timer: {timer} seconds
           </Note>
          </>
        )}
        {error && (
          <Note variant="negative">
            {error}
          </Note>
        )}

        {generatedImage && (
          <Grid columns="2fr 1fr" columnGap="spacingM" style={{ width: '100%' }}>
            <Grid.Item>
              <img src={generatedImage} alt="Generated" style={{ maxWidth: '100%', height: 'auto' }} />
            </Grid.Item>
            <Grid.Item>
              <Stack spacing="spacingM">
                <Button
                  variant="secondary"
                  onClick={handleGenerateImage}
                  isDisabled={isGenerating}
                  isLoading={isGenerating}
                >
                  Regenerate Image
                </Button>
                <Button
                  variant="positive"
                  onClick={handleUploadAsset}
                  isDisabled={isUploading}
                  isLoading={isUploading}
                >
                  Upload to Assets
                </Button>
              </Stack>
            </Grid.Item>
          </Grid>
        )}
      </Grid.Item>
    </Grid>
  );
};

export default Page;

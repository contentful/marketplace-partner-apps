import { useState, useEffect, FormEvent } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import {
  Form,
  FormControl,
  Textarea,
  Button,
  Flex,
  Heading,
  Paragraph,
  Modal,
  Spinner,
  Text,
  Skeleton,
  Box,
  Subheading,
  Image,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { generateImage } from '../services/huggingfaceImage';
import { refinePrompt } from '../services/huggingfaceText';
import { AppInstallationParameters } from '../utils/types';
import { ClockIcon } from '@contentful/f36-icons';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  // const [isUploading, setIsUploading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showRefinePromptModal, setShowRefinePromptModal] = useState(false);
  const [showGeneratingImageModal, setShowGeneratingImageModal] = useState(false);

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

  // ADD TIMEOUT FOR REQUESTS

  // const handleUploadAsset = async () => {
  //   if (!generatedImage) return;

  //   setIsUploading(true);
  //   setError(null);

  //   try {
  //     const response = await fetch(generatedImage);
  //     const blob = await response.blob();
  //     const file = new File([blob], 'ai-generated-image.png', { type: 'image/png' });
  //     const buffer = await file.arrayBuffer();
  //     const upload = await sdk.cma.upload.create({ spaceId: sdk.ids.space }, { file: buffer });

  //     let asset = await sdk.cma.asset.create(
  //       { spaceId: sdk.ids.space },
  //       {
  //         fields: {
  //           title: {
  //             'en-US': 'AI Generated Image',
  //           },
  //           description: {
  //             'en-US': `Generated from prompt: ${initialPrompt}`,
  //           },
  //           file: {
  //             'en-US': {
  //               contentType: 'image/png',
  //               fileName: 'ai-generated-image.png',
  //               uploadFrom: {
  //                 sys: { type: 'Link', linkType: 'Upload', id: upload.sys.id },
  //               },
  //             },
  //           },
  //         },
  //       }
  //     );

  //     asset = await sdk.cma.asset.processForLocale({ spaceId: sdk.ids.space, assetId: asset.sys.id, version: asset.sys.version }, asset, 'en-US');
  //     asset = await sdk.cma.asset.publish({ spaceId: sdk.ids.space, assetId: asset.sys.id, version: asset.sys.version }, asset);

  //     sdk.notifier.success('Asset successfully uploaded and published');
  //   } catch (error) {
  //     console.error('Error uploading asset:', error);
  //     setError(error instanceof Error ? error.message : 'Failed to upload asset');
  //     sdk.notifier.error('Failed to upload asset');
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const onClickRefinePrompt = (event: FormEvent) => {
    setShowRefinePromptModal(true);
    handleRefinePrompt(event);
  };

  const onClickGenerateImage = (event: FormEvent) => {
    setShowGeneratingImageModal(true);
    handleGenerateImage(event);
  };

  const onSubmitRefinedPrompt = (event: FormEvent) => {
    setShowRefinePromptModal(false);
    setShowGeneratingImageModal(true);
    handleGenerateImage(event);
  };

  const onClickNextAfterImageGeneration = (event: FormEvent) => {
    setShowGeneratingImageModal(false);
    // handleUploadAsset();
  };

  const closeRefinePromptModal = () => {
    setShowRefinePromptModal(false);
    setRefinedPrompt('');
    setError(null);
  };

  const closeGeneratingImageModal = () => {
    setShowGeneratingImageModal(false);
    setGeneratedImage(null);
    setError(null);
  };

  return (
    <Flex
      flexDirection="column"
      style={{
        backgroundColor: tokens.colorWhite,
        margin: `0 ${tokens.spacingL}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacingXl,
        alignItems: 'center',
        height: '100vh',
      }}>
      <Flex flexDirection="column" style={{ width: '900px', gap: tokens.spacingL }}>
        <Flex flexDirection="column">
          <Heading style={{ marginBottom: tokens.spacing2Xs }}>Hugging Face Image Generator</Heading>
          <Paragraph style={{ marginBottom: 0 }}>Enter your initial image concept, optimize it for the best results and generate an image.</Paragraph>
        </Flex>

        <Form onSubmit={handleRefinePrompt} style={{ border: `1px solid ${tokens.gray300}`, borderRadius: tokens.borderRadiusSmall, padding: tokens.spacingL }}>
          <Flex flexDirection="column">
            <Heading as="h2" style={{ fontSize: tokens.fontSizeL, marginBottom: 0 }}>
              Describe your image
            </Heading>
            <Paragraph>Be descriptive, but concise. You can either refine your prompt first or generate an image directly.</Paragraph>
          </Flex>
          <FormControl isRequired style={{ marginBottom: tokens.spacingS }}>
            <FormControl.Label>Image concept</FormControl.Label>
            <Textarea
              name="initialPrompt"
              value={initialPrompt}
              onChange={(e) => setInitialPrompt(e.target.value)}
              placeholder="A sunrise at a farm"
              isDisabled={isRefining || isGenerating}
              rows={4}
              resize="vertical"
              style={{ height: '64px' }}
            />
          </FormControl>
          <Flex justifyContent="flex-end" gap="spacingM">
            <Button size="small" onClick={onClickRefinePrompt} isDisabled={initialPrompt.length === 0 || isRefining || isGenerating}>
              Refine prompt
            </Button>
            <Button variant="primary" size="small" onClick={onClickGenerateImage} isDisabled={initialPrompt.length === 0 || isRefining || isGenerating}>
              Generate image
            </Button>
          </Flex>
        </Form>
      </Flex>
      <Modal onClose={closeRefinePromptModal} isShown={showRefinePromptModal}>
        {() => (
          <>
            <Modal.Header title="Refine prompt" onClose={closeRefinePromptModal} />
            <Modal.Content style={{ paddingBottom: 0 }}>
              {isRefining && (
                <Flex>
                  <Text marginRight="spacingXs">Generating new prompt</Text>
                  <Spinner />
                </Flex>
              )}
              {!isRefining && error && <Flex style={{ color: tokens.red600 }}>Error: {error}</Flex>}
              {!isRefining && !error && (
                <Form onSubmit={onSubmitRefinedPrompt}>
                  <FormControl style={{ marginBottom: 0 }}>
                    <Textarea
                      value={refinedPrompt}
                      onChange={(e) => {
                        setRefinedPrompt(e.target.value);
                      }}
                      style={{ paddingBottom: 0, height: '140px', maxHeight: '260px', minHeight: '64px' }}
                    />
                    <FormControl.HelpText>This is the AI-optimized version of your prompt. You can edit it further if needed.</FormControl.HelpText>
                  </FormControl>
                </Form>
              )}
            </Modal.Content>
            <Modal.Controls style={{ padding: `${tokens.spacingM} ${tokens.spacingL}` }}>
              <Button size="small" onClick={closeRefinePromptModal}>
                Cancel
              </Button>
              <Button size="small" variant="primary" isDisabled={isRefining || refinedPrompt.trim().length === 0} onClick={onSubmitRefinedPrompt}>
                Generate image
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>

      <Modal onClose={closeGeneratingImageModal} isShown={showGeneratingImageModal} size="fullscreen">
        {() => (
          <>
            <Modal.Header title="Hugging Face image generator" onClose={closeGeneratingImageModal} />
            <Modal.Content style={{ paddingBottom: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Flex style={{ width: '1024px', gap: tokens.spacingL, flexDirection: 'column' }}>
                <Heading style={{ marginBottom: 0 }}>Generating your image</Heading>
                <Flex justifyContent="space-between">
                  <Flex flexDirection="column" style={{ width: '600px' }}>
                    <Subheading as="h2" marginBottom="spacingXs">
                      Prompt
                    </Subheading>
                    <Paragraph style={{ marginBottom: 0 }}>"{refinedPrompt || initialPrompt}"</Paragraph>
                  </Flex>
                  <Flex
                    justifyContent="center"
                    flexDirection="column"
                    style={{
                      border: `1px solid ${tokens.gray300}`,
                      borderRadius: tokens.borderRadiusSmall,
                      padding: tokens.spacingM,
                      height: '112px',
                      gap: tokens.spacingXs,
                    }}>
                    <Flex alignItems="center" gap={tokens.spacing2Xs}>
                      <ClockIcon style={{ fill: tokens.gray900 }} />
                      <Subheading style={{ marginBottom: 0 }}>Timer: {timer} seconds</Subheading>
                    </Flex>
                    <Text fontColor="gray700">Some models take ~60 seconds for image generation.</Text>
                  </Flex>
                </Flex>
                {error && <Flex style={{ color: tokens.red600 }}>Error: {error}</Flex>}
                {!error && !generatedImage && (
                  <Skeleton.Container>
                    <Skeleton.Image height="100%" width="100%" />
                  </Skeleton.Container>
                )}
                {!error && !!generatedImage && <Image height="100%" width="100%" src={generatedImage} alt="Generated image" />}
              </Flex>
            </Modal.Content>
            <Modal.Controls style={{ padding: `${tokens.spacingM} ${tokens.spacingL}` }}>
              <Button size="small" onClick={closeGeneratingImageModal}>
                Cancel
              </Button>
              <Button size="small" variant="primary" isDisabled={isGenerating || !generatedImage} onClick={onClickNextAfterImageGeneration}>
                Next
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>
    </Flex>
  );
};

export default Page;

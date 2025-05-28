import { useState, useEffect } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { generateImage } from '../services/huggingfaceImage';
import { refinePrompt } from '../services/huggingfaceText';
import { uploadAsset } from '../services/uploadAsset';
import { AppInstallationParameters } from '../utils/types';
import { GenerateImageModal } from '../components/GenerateImageModal/GenerateImageModal';
import { RefinePromptModal } from '../components/RefinePromptModal/RefinePromptModal';
import { InitialPrompt } from '../components/InitialPrompt/InitialPrompt';
import SaveAssetModal from '../components/SaveAssetModal/SaveAssetModal';
import { GenerateImageSpecsModal } from '../components/GenerateImageSpecsModal/GenerateImageSpecsModal';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [assetName, setAssetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [imageNumInferenceSteps, setImageNumInferenceSteps] = useState(50);
  const [imageHeight, setImageHeight] = useState(500);
  const [imageWidth, setImageWidth] = useState(500);
  const [imageGuidanceScale, setImageGuidanceScale] = useState(3.5);
  const [imageMaxSequenceLength, setImageMaxSequenceLength] = useState(512);
  const [actualImageWidth, setActualImageWidth] = useState<number | null>(null);
  const [actualImageHeight, setActualImageHeight] = useState<number | null>(null);

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
      setError(error instanceof Error ? error.message : 'Failed to refine prompt');
    } finally {
      setIsRefining(false);
    }
  };

  const handleShowImageSpecsModal = (event: React.FormEvent) => {
    event.preventDefault();
    setShowModal('image-specs');
  };

  const handleImageSpecsChange = (
    fields: Partial<{
      imageNumInferenceSteps: number;
      imageHeight: number;
      imageWidth: number;
      imageGuidanceScale: number;
      imageMaxSequenceLength: number;
    }>
  ) => {
    if (fields.imageNumInferenceSteps !== undefined) setImageNumInferenceSteps(fields.imageNumInferenceSteps);
    if (fields.imageHeight !== undefined) setImageHeight(fields.imageHeight);
    if (fields.imageWidth !== undefined) setImageWidth(fields.imageWidth);
    if (fields.imageGuidanceScale !== undefined) setImageGuidanceScale(fields.imageGuidanceScale);
    if (fields.imageMaxSequenceLength !== undefined) setImageMaxSequenceLength(fields.imageMaxSequenceLength);
  };

  const handleImageSpecsSubmit = () => {
    setShowModal('generate-image');
    handleGenerateImage();
  };

  const handleGenerateImage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      const imageBlob = await generateImage(
        initialPrompt,
        {
          ...parameters,
          imageNumInferenceSteps,
          imageHeight,
          imageWidth,
          imageGuidanceScale,
          imageMaxSequenceLength,
        },
        refinedPrompt
      );
      const imageUrl = URL.createObjectURL(imageBlob);
      setGeneratedImage(imageUrl);

      const img = new window.Image();
      img.onload = function () {
        setActualImageWidth(img.width);
        setActualImageHeight(img.height);
        console.log('Actual image size:', img.width, img.height);
      };
      img.src = imageUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refine prompt');
    } finally {
      setIsGenerating(false);
      setIsTimerActive(false);
    }
  };

  return (
    <>
      <InitialPrompt
        initialPrompt={initialPrompt}
        setInitialPrompt={setInitialPrompt}
        isDisabled={isRefining || isGenerating}
        onClickRefinePrompt={(event) => {
          setShowModal('refine-prompt');
          handleRefinePrompt(event);
        }}
        onClickGenerateImage={handleShowImageSpecsModal}
      />
      <RefinePromptModal
        showRefinePromptModal={showModal === 'refine-prompt'}
        refinedPrompt={refinedPrompt}
        isRefining={isRefining}
        setRefinedPrompt={setRefinedPrompt}
        error={error}
        onSubmitRefinedPrompt={handleShowImageSpecsModal}
        closeRefinePromptModal={() => {
          setShowModal(null);
          setRefinedPrompt('');
          setError(null);
        }}
      />
      <GenerateImageSpecsModal
        isShown={showModal === 'image-specs'}
        imageNumInferenceSteps={imageNumInferenceSteps}
        imageHeight={imageHeight}
        imageWidth={imageWidth}
        imageGuidanceScale={imageGuidanceScale}
        imageMaxSequenceLength={imageMaxSequenceLength}
        onChange={handleImageSpecsChange}
        onCancel={() => setShowModal(null)}
        onSubmit={handleImageSpecsSubmit}
      />
      <GenerateImageModal
        showGeneratingImageModal={showModal === 'generate-image'}
        prompt={initialPrompt}
        setPrompt={refinedPrompt ? setRefinedPrompt : setInitialPrompt}
        generatedImage={generatedImage}
        error={error}
        timer={timer}
        isGenerating={isGenerating}
        onClickNextAfterImageGeneration={() => {
          setShowModal('save-asset');
        }}
        onRetryImageGeneration={(event) => {
          setGeneratedImage(null);
          setError(null);
          handleGenerateImage(event);
        }}
        onRegenerateImage={handleGenerateImage}
        closeGeneratingImageModal={() => {
          setShowModal(null);
          setGeneratedImage(null);
          setRefinedPrompt('');
          setError(null);
          setActualImageWidth(null);
          setActualImageHeight(null);
        }}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        actualImageWidth={actualImageWidth}
        actualImageHeight={actualImageHeight}
        refinedPrompt={refinedPrompt}
      />
      <SaveAssetModal
        isShown={showModal === 'save-asset'}
        assetName={assetName}
        setAssetName={setAssetName}
        isSaving={isSaving}
        onSave={async () => {
          setIsSaving(true);
          await uploadAsset({
            sdk,
            initialPrompt,
            assetName,
            generatedImage,
          });
          setIsSaving(false);
          setShowModal(null);
          setGeneratedImage(null);
          setRefinedPrompt('');
          setInitialPrompt('');
          setError(null);
          setAssetName('');
        }}
        onClose={() => {
          setShowModal(null);
          setGeneratedImage(null);
          setRefinedPrompt('');
          setError(null);
          setAssetName('');
        }}
      />
    </>
  );
};

export default Page;

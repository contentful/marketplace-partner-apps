import { Button, Flex, Heading, IconButton, Modal, Note, Paragraph, Skeleton, Subheading, Text, Textarea } from '@contentful/f36-components';
import { ClockIcon, CloseIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useEffect, useState } from 'react';
import { styles } from './GenerateImageModal.styles';

interface GenerateImageModalProps {
  showGeneratingImageModal: boolean;
  prompt: string;
  setPrompt: (value: string) => void;
  generatedImage: string | null;
  error: string | null;
  timer: number;
  isGenerating: boolean;
  onClickNextAfterImageGeneration: (event: React.FormEvent) => void;
  onRetryImageGeneration: (event: React.FormEvent) => void;
  onRegenerateImage: (event: React.FormEvent) => void;
  closeGeneratingImageModal: () => void;
  imageWidth: number;
  imageHeight: number;
  actualImageWidth?: number | null;
  actualImageHeight?: number | null;
  refinedPrompt?: string;
}

export const GenerateImageModal = ({
  showGeneratingImageModal,
  prompt,
  setPrompt,
  generatedImage,
  error,
  timer,
  isGenerating,
  onClickNextAfterImageGeneration,
  onRetryImageGeneration,
  onRegenerateImage,
  closeGeneratingImageModal,
  imageWidth,
  imageHeight,
  actualImageWidth,
  actualImageHeight,
  refinedPrompt,
}: GenerateImageModalProps) => {
  const [showWarning, setShowWarning] = useState(true);
  const shouldShowWarning =
    showWarning && actualImageWidth != null && actualImageHeight != null && (actualImageWidth !== imageWidth || actualImageHeight !== imageHeight);

  // Reset warning when a new image is generated
  useEffect(() => {
    setShowWarning(true);
  }, [generatedImage]);

  return (
    <Modal onClose={closeGeneratingImageModal} isShown={showGeneratingImageModal} size="fullscreen">
      {() => (
        <>
          <Modal.Header title="Hugging Face image generator" onClose={closeGeneratingImageModal} />
          <Modal.Content className={styles.modalContent}>
            <Flex className={styles.contentWrapper}>
              <Flex justifyContent="space-between" alignItems="flex-start" style={{ width: '100%' }}>
                <Heading className={styles.heading}>Generating your image</Heading>
                <Flex justifyContent="flex-end" flexDirection="column" className={styles.timerSectionCompact}>
                  <Flex alignItems="center" gap={tokens.spacing2Xs}>
                    <ClockIcon className={styles.clockIcon} />
                    <Subheading className={styles.timer}>Timer: {timer} seconds</Subheading>
                  </Flex>
                  <Text fontColor="gray700">Some models take ~60 seconds for image generation.</Text>
                </Flex>
              </Flex>
              <Flex flexDirection="column" className={styles.promptSection}>
                <Subheading as="h2" marginBottom="spacingXs">
                  Prompt
                </Subheading>
                <Textarea
                  value={refinedPrompt || prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  isDisabled={isGenerating}
                  className={styles.textarea}
                  rows={2}
                  aria-label="Prompt"
                />
                {generatedImage && !error && (
                  <Flex justifyContent="flex-end" className={styles.regenerateButtonContainer}>
                    <Button size="small" variant="secondary" isDisabled={isGenerating} onClick={onRegenerateImage}>
                      Regenerate image
                    </Button>
                  </Flex>
                )}
              </Flex>
              {error && (
                <Flex alignItems="center" justifyContent="center" className={styles.error}>
                  <Note variant="negative">{error}</Note>
                </Flex>
              )}
              {!error && !generatedImage && (
                <Skeleton.Container>
                  <Skeleton.Image height="100%" width="100%" />
                </Skeleton.Container>
              )}
              {!error && !!generatedImage && (
                <div className={styles.imageContainer}>
                  {(() => {
                    const displayWidth = Math.min(actualImageWidth ?? imageWidth, window.innerWidth * 0.9);
                    const displayHeight = Math.min(actualImageHeight ?? imageHeight, window.innerHeight * 0.8);
                    return (
                      <>
                        {shouldShowWarning && (
                          <div className={styles.warningContainer}>
                            <Note variant="warning">
                              <span>
                                The generated image size does not match your requested size. This is likely a limitation of the selected model.
                                <br />
                                <Paragraph fontSize="fontSizeS" fontColor="gray700" style={{ margin: 0 }}>
                                  Requested: {imageWidth} x {imageHeight} px
                                  <br />
                                  Actual: {actualImageWidth ?? '?'} x {actualImageHeight ?? '?'} px
                                </Paragraph>
                              </span>
                              <IconButton
                                aria-label="Dismiss warning"
                                variant="transparent"
                                icon={<CloseIcon />}
                                onClick={() => setShowWarning(false)}
                                className={styles.warningCloseButton}
                              />
                            </Note>
                          </div>
                        )}
                        <div
                          className={styles.imageWrapper}
                          style={{
                            width: displayWidth,
                            height: displayHeight,
                          }}>
                          <img
                            src={generatedImage}
                            alt="Generated image"
                            width={actualImageWidth ?? imageWidth}
                            height={actualImageHeight ?? imageHeight}
                            className={styles.generatedImage}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </Flex>
          </Modal.Content>
          <Modal.Controls className={styles.modalControls}>
            <Button size="small" onClick={closeGeneratingImageModal}>
              Cancel
            </Button>
            {error ? (
              <Button size="small" variant="primary" isDisabled={isGenerating} onClick={onRetryImageGeneration}>
                Retry
              </Button>
            ) : (
              <Button size="small" variant="primary" isDisabled={isGenerating || !generatedImage} onClick={onClickNextAfterImageGeneration}>
                Next
              </Button>
            )}
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

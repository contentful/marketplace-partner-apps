import { Button, Flex, Heading, Modal, Note, Paragraph, Skeleton, Subheading, Text } from '@contentful/f36-components';
import { ClockIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { styles } from './GenerateImageModal.styles';

interface GenerateImageModalProps {
  showGeneratingImageModal: boolean;
  prompt: string;
  generatedImage: string | null;
  error: string | null;
  timer: number;
  isGenerating: boolean;
  onClickNextAfterImageGeneration: (event: React.FormEvent) => void;
  onRetryImageGeneration: (event: React.FormEvent) => void;
  closeGeneratingImageModal: () => void;
  imageWidth: number;
  imageHeight: number;
  actualImageWidth?: number | null;
  actualImageHeight?: number | null;
}

export const GenerateImageModal = ({
  showGeneratingImageModal,
  prompt,
  generatedImage,
  error,
  timer,
  isGenerating,
  onClickNextAfterImageGeneration,
  onRetryImageGeneration,
  closeGeneratingImageModal,
  imageWidth,
  imageHeight,
  actualImageWidth,
  actualImageHeight,
}: GenerateImageModalProps) => {
  const showWarning = actualImageWidth != null && actualImageHeight != null && (actualImageWidth !== imageWidth || actualImageHeight !== imageHeight);
  return (
    <Modal onClose={closeGeneratingImageModal} isShown={showGeneratingImageModal} size="fullscreen">
      {() => (
        <>
          <Modal.Header title="Hugging Face image generator" onClose={closeGeneratingImageModal} />
          <Modal.Content className={styles.modalContent}>
            <Flex className={styles.contentWrapper}>
              <Heading className={styles.heading}>Generating your image</Heading>
              <Flex justifyContent="space-between">
                <Flex flexDirection="column" className={styles.promptSection}>
                  <Subheading as="h2" marginBottom="spacingXs">
                    Prompt
                  </Subheading>
                  <Paragraph className={styles.promptText}>"{prompt}"</Paragraph>
                </Flex>
                <Flex justifyContent="center" flexDirection="column" className={styles.timerSection}>
                  <Flex alignItems="center" gap={tokens.spacing2Xs}>
                    <ClockIcon className={styles.clockIcon} />
                    <Subheading className={styles.timer}>Timer: {timer} seconds</Subheading>
                  </Flex>
                  <Text fontColor="gray700">Some models take ~60 seconds for image generation.</Text>
                </Flex>
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  {(() => {
                    const displayWidth = Math.min(actualImageWidth ?? imageWidth, window.innerWidth * 0.9);
                    const displayHeight = Math.min(actualImageHeight ?? imageHeight, window.innerHeight * 0.8);
                    return (
                      <>
                        {showWarning && (
                          <div style={{ marginBottom: 8, width: '1024px' }}>
                            <Note variant="warning">
                              The generated image size does not match your requested size. This is likely a limitation of the selected model.
                              <br />
                              <Paragraph fontSize="fontSizeS" fontColor="gray700" style={{ margin: 0 }}>
                                Requested: {imageWidth} x {imageHeight} px
                                <br />
                                Actual: {actualImageWidth ?? '?'} x {actualImageHeight ?? '?'} px
                              </Paragraph>
                            </Note>
                          </div>
                        )}
                        <div
                          style={{
                            width: displayWidth,
                            height: displayHeight,
                            overflow: 'hidden',
                            background: '#fafafa',
                            border: '1px solid #eee',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-start',
                            margin: '0 auto',
                          }}>
                          <img
                            src={generatedImage}
                            alt="Generated image"
                            width={actualImageWidth ?? imageWidth}
                            height={actualImageHeight ?? imageHeight}
                            style={{ display: 'block' }}
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

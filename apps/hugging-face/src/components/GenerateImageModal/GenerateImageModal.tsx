import { Button, Flex, Heading, Paragraph, Modal, Text, Skeleton, Subheading, Image, Note } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ClockIcon } from '@contentful/f36-icons';
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
}: GenerateImageModalProps) => {
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
                  <Note variant="negative">Error: {error}. Please try again.</Note>
                </Flex>
              )}
              {!error && !generatedImage && (
                <Skeleton.Container>
                  <Skeleton.Image height="100%" width="100%" />
                </Skeleton.Container>
              )}
              {!error && !!generatedImage && <Image height="100%" width="100%" src={generatedImage} alt="Generated image" />}
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

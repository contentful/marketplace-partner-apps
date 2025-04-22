import { Button, Flex, Heading, Paragraph, Modal, Text, Skeleton, Subheading, Image, Note } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ClockIcon } from '@contentful/f36-icons';

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
          <Modal.Content style={{ paddingBottom: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Flex style={{ width: '1024px', height: '100%', gap: tokens.spacingL, flexDirection: 'column' }}>
              <Heading style={{ marginBottom: 0 }}>Generating your image</Heading>
              <Flex justifyContent="space-between">
                <Flex flexDirection="column" style={{ width: '600px' }}>
                  <Subheading as="h2" marginBottom="spacingXs">
                    Prompt
                  </Subheading>
                  <Paragraph style={{ marginBottom: 0 }}>"{prompt}"</Paragraph>
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
              {error && (
                <Flex
                  alignItems="center"
                  justifyContent="center"
                  style={{ height: '100%', width: '100%', border: `1px solid ${tokens.red500}`, borderRadius: tokens.borderRadiusSmall }}>
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
          <Modal.Controls style={{ padding: `${tokens.spacingM} ${tokens.spacingL}` }}>
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

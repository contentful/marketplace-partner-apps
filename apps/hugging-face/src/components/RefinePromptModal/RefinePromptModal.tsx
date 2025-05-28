import { Form, FormControl, Textarea, Button, Flex, Modal, Spinner, Text, Note } from '@contentful/f36-components';
import { styles } from './RefinePromptModal.styles';

interface RefinePromptModalProps {
  showRefinePromptModal: boolean;
  refinedPrompt: string;
  setRefinedPrompt: (prompt: string) => void;
  error: string | null;
  isRefining: boolean;
  onSubmitRefinedPrompt: (event: React.FormEvent) => void;
  closeRefinePromptModal: () => void;
}

export const RefinePromptModal = ({
  showRefinePromptModal,
  refinedPrompt,
  setRefinedPrompt,
  error,
  isRefining,
  onSubmitRefinedPrompt,
  closeRefinePromptModal,
}: RefinePromptModalProps) => (
  <Modal onClose={closeRefinePromptModal} isShown={showRefinePromptModal}>
    {() => (
      <>
        <Modal.Header title="Refine prompt" onClose={closeRefinePromptModal} />
        <Modal.Content className={styles.modalContent}>
          {error && <Note variant="negative">{error}</Note>}
          {isRefining && !error && (
            <Flex>
              <Text marginRight="spacingXs">Generating new prompt</Text>
              <Spinner />
            </Flex>
          )}
          {!isRefining && !error && (
            <Form onSubmit={onSubmitRefinedPrompt}>
              <FormControl className={styles.formControl}>
                <Textarea
                  value={refinedPrompt}
                  onChange={(e) => {
                    setRefinedPrompt(e.target.value);
                  }}
                  className={styles.textArea}
                />
                <FormControl.HelpText>This is the AI-optimized version of your prompt. You can edit it further if needed.</FormControl.HelpText>
              </FormControl>
            </Form>
          )}
        </Modal.Content>
        <Modal.Controls className={styles.modalControls}>
          <Button size="small" onClick={closeRefinePromptModal}>
            Cancel
          </Button>
          <Button size="small" variant="primary" isDisabled={isRefining || refinedPrompt.trim().length === 0 || !!error} onClick={onSubmitRefinedPrompt}>
            Generate image
          </Button>
        </Modal.Controls>
      </>
    )}
  </Modal>
);

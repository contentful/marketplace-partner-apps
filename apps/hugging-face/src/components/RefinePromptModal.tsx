import { Form, FormControl, Textarea, Button, Flex, Modal, Spinner, Text, Note } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

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
        <Modal.Content style={{ paddingBottom: 0 }}>
          {error && <Note variant="negative">Error: {error}. Please try again.</Note>}
          {isRefining && !error && (
            <Flex>
              <Text marginRight="spacingXs">Generating new prompt</Text>
              <Spinner />
            </Flex>
          )}
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
          <Button size="small" variant="primary" isDisabled={isRefining || refinedPrompt.trim().length === 0 || !!error} onClick={onSubmitRefinedPrompt}>
            Generate image
          </Button>
        </Modal.Controls>
      </>
    )}
  </Modal>
);

import { Form, FormControl, Textarea, Button, Flex, Heading, Paragraph } from '@contentful/f36-components';
import { styles } from './InitialPrompt.styles';

interface InitialPromptProps {
  initialPrompt: string;
  setInitialPrompt: (prompt: string) => void;
  isDisabled: boolean;
  onClickRefinePrompt: (e: React.FormEvent) => void;
  onClickGenerateImage: (e: React.FormEvent) => void;
}

export const InitialPrompt = ({ initialPrompt, setInitialPrompt, isDisabled, onClickRefinePrompt, onClickGenerateImage }: InitialPromptProps) => (
  <Flex flexDirection="column" className={styles.page}>
    <Flex flexDirection="column" className={styles.contentWrapper}>
      <Flex flexDirection="column">
        <Heading className={styles.heading}>Hugging Face Image Generator</Heading>
        <Paragraph className={styles.subText}>Enter your initial image concept, optimize it for the best results and generate an image.</Paragraph>
      </Flex>

      <Form onSubmit={onClickRefinePrompt} className={styles.form}>
        <Flex flexDirection="column">
          <Heading as="h2" className={styles.formHeading}>
            Describe your image
          </Heading>
          <Paragraph>
            Be descriptive, but concise. You can either refine your prompt first or generate an image directly. Refining your prompt and generating new images
            use Hugging Face credits. Refer to your Hugging Face dashboard to check your credit usage.
          </Paragraph>
        </Flex>
        <FormControl isRequired className={styles.formControl}>
          <FormControl.Label>Image concept</FormControl.Label>
          <Textarea
            name="initialPrompt"
            value={initialPrompt}
            onChange={(e) => setInitialPrompt(e.target.value)}
            placeholder="A sunrise at a farm"
            isDisabled={isDisabled}
            rows={4}
            resize="vertical"
            className={styles.formTextArea}
          />
        </FormControl>
        <Flex justifyContent="flex-end" gap="spacingM">
          <Button size="small" onClick={onClickRefinePrompt} isDisabled={initialPrompt.length === 0 || isDisabled}>
            Refine prompt
          </Button>
          <Button variant="primary" size="small" onClick={onClickGenerateImage} isDisabled={initialPrompt.length === 0 || isDisabled}>
            Generate image
          </Button>
        </Flex>
      </Form>
    </Flex>
  </Flex>
);

import { Form, FormControl, Textarea, Button, Flex, Heading, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';

interface InitialPromptProps {
  initialPrompt: string;
  setInitialPrompt: (prompt: string) => void;
  isDisabled: boolean;
  onClickRefinePrompt: (e: React.FormEvent) => void;
  onClickGenerateImage: (e: React.FormEvent) => void;
}

export const InitialPrompt = ({ initialPrompt, setInitialPrompt, isDisabled, onClickRefinePrompt, onClickGenerateImage }: InitialPromptProps) => (
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

      <Form onSubmit={onClickRefinePrompt} style={{ border: `1px solid ${tokens.gray300}`, borderRadius: tokens.borderRadiusSmall, padding: tokens.spacingL }}>
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
            isDisabled={isDisabled}
            rows={4}
            resize="vertical"
            style={{ height: '64px' }}
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

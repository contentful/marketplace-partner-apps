import { Button, Form, FormControl, Modal, Paragraph, TextInput } from '@contentful/f36-components';

interface GenerateImageSpecsModalProps {
  isShown: boolean;
  imageNumInferenceSteps: number;
  imageHeight: number;
  imageWidth: number;
  imageGuidanceScale: number;
  imageMaxSequenceLength: number;
  onChange: (
    fields: Partial<{
      imageNumInferenceSteps: number;
      imageHeight: number;
      imageWidth: number;
      imageGuidanceScale: number;
      imageMaxSequenceLength: number;
    }>
  ) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export const GenerateImageSpecsModal = ({
  isShown,
  imageNumInferenceSteps,
  imageHeight,
  imageWidth,
  imageGuidanceScale,
  imageMaxSequenceLength,
  onChange,
  onCancel,
  onSubmit,
}: GenerateImageSpecsModalProps) => {
  return (
    <Modal onClose={onCancel} isShown={isShown} size="medium">
      {() => (
        <>
          <Modal.Header title="Set image specs" onClose={onCancel} />
          <Modal.Content>
            <Paragraph marginBottom="spacingM">Before your image is generated, set the specs of your image.</Paragraph>
            <Form>
              <FormControl isRequired marginBottom="spacingM">
                <FormControl.Label>Image generation steps</FormControl.Label>
                <TextInput
                  type="number"
                  value={String(imageNumInferenceSteps)}
                  onChange={(e) => onChange({ imageNumInferenceSteps: Number(e.target.value) })}
                  min={1}
                  max={100}
                  name="imageNumInferenceSteps"
                />
                <FormControl.HelpText>Number of inference steps for image generation (higher = better quality, slower).</FormControl.HelpText>
              </FormControl>
              <FormControl isRequired marginBottom="spacingM">
                <FormControl.Label>Image height (px)</FormControl.Label>
                <TextInput
                  type="number"
                  value={String(imageHeight)}
                  onChange={(e) => onChange({ imageHeight: Number(e.target.value) })}
                  min={64}
                  max={2048}
                  name="imageHeight"
                />
                <FormControl.HelpText>Height of generated image in pixels.</FormControl.HelpText>
              </FormControl>
              <FormControl isRequired marginBottom="spacingM">
                <FormControl.Label>Image width (px)</FormControl.Label>
                <TextInput
                  type="number"
                  value={String(imageWidth)}
                  onChange={(e) => onChange({ imageWidth: Number(e.target.value) })}
                  min={64}
                  max={2048}
                  name="imageWidth"
                />
                <FormControl.HelpText>Width of generated image in pixels.</FormControl.HelpText>
              </FormControl>
              <FormControl isRequired marginBottom="spacingM">
                <FormControl.Label>Guidance scale</FormControl.Label>
                <TextInput
                  type="number"
                  value={String(imageGuidanceScale)}
                  onChange={(e) => onChange({ imageGuidanceScale: Number(e.target.value) })}
                  min={1}
                  max={20}
                  step={0.1}
                  name="imageGuidanceScale"
                />
                <FormControl.HelpText>How closely the image should follow the prompt (higher = more literal, but can be less creative).</FormControl.HelpText>
              </FormControl>
              <FormControl isRequired marginBottom="spacingM">
                <FormControl.Label>Max sequence length</FormControl.Label>
                <TextInput
                  type="number"
                  value={String(imageMaxSequenceLength)}
                  onChange={(e) => onChange({ imageMaxSequenceLength: Number(e.target.value) })}
                  min={64}
                  max={2048}
                  name="imageMaxSequenceLength"
                />
                <FormControl.HelpText>Maximum sequence length for the prompt (advanced, usually leave as default).</FormControl.HelpText>
              </FormControl>
            </Form>
          </Modal.Content>
          <Modal.Controls>
            <Button size="small" onClick={onCancel} variant="secondary">
              Cancel
            </Button>
            <Button size="small" variant="primary" onClick={onSubmit}>
              Generate image
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

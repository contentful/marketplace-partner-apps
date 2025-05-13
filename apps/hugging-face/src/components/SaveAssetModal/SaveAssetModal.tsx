import React from 'react';
import { Modal, Button, Form, FormControl, TextInput, Heading } from '@contentful/f36-components';
import { styles } from './SaveAssetModal.styles';

interface SaveAssetModalProps {
  isShown: boolean;
  onClose: () => void;
  onSave: () => void;
  assetName: string;
  setAssetName: (name: string) => void;
  isSaving: boolean;
}

export const SaveAssetModal: React.FC<SaveAssetModalProps> = ({ isShown, onClose, onSave, assetName, setAssetName, isSaving }) => {
  return (
    <Modal onClose={onClose} isShown={isShown}>
      {() => (
        <>
          <Modal.Header title="Hugging Face image generator" onClose={onClose} />
          <Modal.Content className={styles.modalContent}>
            <Form onSubmit={onSave}>
              <Heading as="h2" marginBottom="spacingM">
                Give your photo a name
              </Heading>
              <FormControl className={styles.formControl}>
                <FormControl.Label isRequired>Image name</FormControl.Label>
                <TextInput
                  value={assetName}
                  onChange={(e) => {
                    setAssetName(e.target.value);
                  }}
                />
              </FormControl>
            </Form>
          </Modal.Content>
          <Modal.Controls className={styles.modalControls}>
            <Button size="small" onClick={onClose}>
              Cancel
            </Button>
            <Button size="small" variant="primary" onClick={onSave} isLoading={isSaving}>
              Save image to media library
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

export default SaveAssetModal;

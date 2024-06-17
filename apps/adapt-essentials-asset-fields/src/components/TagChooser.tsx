import { Button, Form, FormControl, IconButton, ModalConfirm, ModalLauncher, TextInput } from '@contentful/f36-components';
import { useState } from 'react';
import { ChevronDownIcon } from '@contentful/f36-icons';

export function TagChooser({ onSelect }) {
  const [selectedTags, setSelectedTags] = useState([]);
  const onTagSelect = () => {
    ModalLauncher.open(({ isShown, onClose }) => {
      return (
        <ModalConfirm
          title="Filter by tags"
          isShown={isShown}
          onCancel={() => {
            onClose(false);
          }}
          onConfirm={() => {
            onClose(true);
          }}
          confirmLabel="Apply"
          cancelLabel="Cancel">
          <Form>
            <FormControl>
              <FormControl.Label>Tags</FormControl.Label>
              <TextInput.Group>
                <TextInput autoFocus maxLength={20} placeholder="Search for tags" />
                <IconButton variant="secondary" icon={<ChevronDownIcon />} onClick={() => {}} aria-label="Show tags" />
              </TextInput.Group>
            </FormControl>
          </Form>
        </ModalConfirm>
      );
    }).then((result) => {
      if (result === true) {
        onSelect?.(selectedTags);
      }
    });
  };

  return <Button onClick={onTagSelect}>SelectTag</Button>;
}

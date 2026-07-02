import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, FormControl, TextInput, ModalControls } from '@contentful/f36-components';

function AddWingifyVariationModal(props) {
  const [loading, setLoading] = useState(false);
  const [variationName, setVariationName] = useState(`Variation-${props.wingifyVariationsLength}`);

  const updateWingifyVariationsName = (length) => {
    setVariationName(`Variation-${length}`);
  };

  const addWingifyVariationModal = async (name) => {
    if (name) {
      setLoading(true);
      const isVariationAdded = await props.addNewWingifyVariation(name);
      if (isVariationAdded) {
        setVariationName('');
        props.setNewVariationModal(false);
      }
      setLoading(false);
    } else {
      props.setNewVariationModal(false);
    }
  };

  useEffect(() => {
    updateWingifyVariationsName(props.wingifyVariationsLength);
  }, [props.wingifyVariationsLength]);

  return (
    <React.Fragment>
      <Modal onClose={() => addWingifyVariationModal('')} isShown={props.newVariationModal} size="medium">
        {() => (
          <>
            <Modal.Header title="Create new Wingify Variation" onClose={() => addWingifyVariationModal('')} />
            <Modal.Content>
              <Form onSubmit={() => addWingifyVariationModal(variationName)}>
                <FormControl>
                  <FormControl.Label isRequired>Variation name</FormControl.Label>
                  <TextInput value={variationName} onChange={(e) => setVariationName(e.target.value)} />
                </FormControl>
              </Form>
            </Modal.Content>
            <ModalControls>
              <Button size="small" variant="transparent" onClick={() => addWingifyVariationModal('')}>
                Close
              </Button>
              <Button size="small" variant="positive" isDisabled={!variationName} isLoading={loading} onClick={() => addWingifyVariationModal(variationName)}>
                Add
              </Button>
            </ModalControls>
          </>
        )}
      </Modal>
    </React.Fragment>
  );
}

export default AddWingifyVariationModal;

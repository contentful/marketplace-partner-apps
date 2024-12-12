import React, {useEffect, useState} from 'react';
import { Button, Modal, Form, FormControl, TextInput, ModalControls } from '@contentful/f36-components';

function AddVwoVariationModal(props) {

   const [loading, setLoading] = useState(false);
   const [variationName, setVariationName] = useState(`Variation-${props.vwoVariationsLength}`);

   const updateVwoVariationsName = (length) => {
      setVariationName(`Variation-${length}`)
    }

   const addVwoVariationModal = async (name) => {
      if(name){
        setLoading(true);
        const isVariationAdded = await props.addNewVwoVariation(name);
        if(isVariationAdded){
          setVariationName('');
          props.setNewVariationModal(false);
        }
        setLoading(false);
      }
      else{
        props.setNewVariationModal(false);
      }
    }

    useEffect(() => {
      updateVwoVariationsName(props.vwoVariationsLength);
    },[props.vwoVariationsLength]);

  return (
      <React.Fragment>
         <Modal onClose={() => addVwoVariationModal('')} isShown={props.newVariationModal} size='medium'>
         {() => (
            <>
               <Modal.Header
                  title="Create new VWO Variation"
                  onClose={() => addVwoVariationModal('')}
               />
               <Modal.Content>
                  <Form onSubmit={() => addVwoVariationModal(variationName)}>
                     <FormControl>
                        <FormControl.Label isRequired>Variation name</FormControl.Label>
                        <TextInput
                           value={variationName}
                           onChange={(e) => setVariationName(e.target.value)}/>
                     </FormControl>
                  </Form>
               </Modal.Content>
               <ModalControls>
               <Button
                  size="small"
                  variant="transparent"
                  onClick={() => addVwoVariationModal('')}
               >
                  Close
               </Button>
               <Button
                  size="small"
                  variant="positive"
                  isDisabled={!variationName}
                  isLoading={loading}
                  onClick={() => addVwoVariationModal(variationName)}
               >
                  Add
               </Button>
               </ModalControls>
            </>
            )}
         </Modal>
      </React.Fragment>
  )
}

export default AddVwoVariationModal;
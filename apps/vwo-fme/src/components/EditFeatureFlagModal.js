import React, { useEffect } from 'react';
import { Textarea, Button, Modal, Form, FormControl, Grid, TextInput, ModalControls } from '@contentful/f36-components';
import { css } from 'emotion';
import useMethods from 'use-methods';

const styles = {
   fieldItem: css({
      marginBottom: '20px'
   })
}

const getInitialData = featureFlag => ({
   flagName: featureFlag?.name || '',
   description: featureFlag?.description || ''
 });

 const methods = state => {
   return {
      setFlagName(flagName){
         state.flagName = flagName;
      },
      setDescription(description){
         state.description = description;
      }
   }
 }

function EditFeatureFlagModal(props) {
   const globalState = useMethods(methods, getInitialData(props.featureFlag));
   const [state,actions] = globalState;

   const updateFeatureFlag = (featureFlag) => {
      if(!featureFlag){
         return;
      }
      actions.setFlagName(featureFlag.name);
      actions.setDescription(featureFlag.description);
   }

   const madeChanges = () => {
      if(!state.flagName || !state.description){
         return false;
      }
      return state.flagName !== props.featureFlag.name || state.description !== props.featureFlag.description;
   }
   
   useEffect(() => {
      updateFeatureFlag(props.featureFlag);
   },[props.featureFlag])

  return (
    <React.Fragment>
      <Modal onClose={() => props.onModalClose('')} isShown={props.isShown} size='medium'>
      {() => (
         <>
            <Modal.Header
               title="Edit Feature flag details"
               onClose={() => props.onModalClose('')}
            />
            <Modal.Content>
               <Form onSubmit={() => props.onModalClose(state)}>
               <FormControl className={styles.fieldItem}>
                     <FormControl.Label isRequired>Flag name</FormControl.Label>
                     <TextInput
                        value={state.flagName}
                        maxLength='255'
                        onChange={(e) => actions.setFlagName(e.target.value)}/>
                     <Grid columns="auto 80px">
                        <FormControl.HelpText>
                           Name should be no longer than 255 characters
                        </FormControl.HelpText>
                        <FormControl.Counter />
                     </Grid>
                  </FormControl>
                  <FormControl className={styles.fieldItem}>
                     <FormControl.Label>Description</FormControl.Label>
                     <Textarea
                        value={state.description}
                        maxLength='300'
                        onChange={(e) => actions.setDescription(e.target.value)}/>
                     <Grid columns="auto 80px">
                        <FormControl.HelpText>
                           Description should be no longer than 300 characters
                        </FormControl.HelpText>
                        <FormControl.Counter />
                     </Grid>
                  </FormControl>
               </Form>
            </Modal.Content>
            <ModalControls>
              <Button
                size="small"
                variant="transparent"
                onClick={() => props.onModalClose('')}
              >
               Close
              </Button>
              <Button
                size="small"
                variant="positive"
                isLoading={props.loading}
                isDisabled={!madeChanges()}
                onClick={() => props.onModalClose(state)}
              >
               Save
              </Button>
            </ModalControls>
         </>
         )}
      </Modal>
    </React.Fragment>
  )
}

export default EditFeatureFlagModal;
import React, { useEffect, useReducer } from 'react';
import { Textarea, Button, Modal, Form, FormControl, Grid, TextInput, ModalControls } from '@contentful/f36-components';
import { css } from 'emotion';

const styles = {
  fieldItem: css({
    marginBottom: '20px',
  }),
};

const actionTypes = {
  SET_FLAG_NAME: 'SET_FLAG_NAME',
  SET_DESCRIPTION: 'SET_DESCRIPTION',
  RESET_STATE: 'RESET_STATE',
};

// Initial state function
const getInitialState = (featureFlag) => ({
  flagName: featureFlag?.name || '',
  description: featureFlag?.description || '',
});

const setFlagName = (flagName) => ({ type: actionTypes.SET_FLAG_NAME, payload: flagName });
const setDescription = (description) => ({ type: actionTypes.SET_DESCRIPTION, payload: description });
const resetState = (featureFlag) => ({
  type: actionTypes.RESET_STATE,
  payload: getInitialState(featureFlag),
});

// Reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_FLAG_NAME:
      return { ...state, flagName: action.payload };
    case actionTypes.SET_DESCRIPTION:
      return { ...state, description: action.payload };
    case actionTypes.RESET_STATE:
      return action.payload;
    default:
      return state;
  }
};

function EditFeatureFlagModal(props) {
  const [state, dispatch] = useReducer(reducer, getInitialState(props.featureFlag));
  
  const madeChanges = () => {
    const { flagName, description } = state;
    const { featureFlag } = props;
    if (!flagName || !description) {
      return false;
    }
    return flagName !== featureFlag.name || description !== featureFlag.description;
  };

  useEffect(() => {
    dispatch(resetState(props.featureFlag));
  }, [props.featureFlag]);

  return (
    <React.Fragment>
      <Modal onClose={() => props.onModalClose('')} isShown={props.isShown} size="medium">
        {() => (
          <>
            <Modal.Header title="Edit Feature flag details" onClose={() => props.onModalClose('')} />
            <Modal.Content>
              <Form onSubmit={() => props.onModalClose(state)}>
                <FormControl className={styles.fieldItem}>
                  <FormControl.Label isRequired>Flag name</FormControl.Label>
                  <TextInput
                    value={state.flagName}
                    maxLength="255"
                    onChange={(e) => dispatch(setFlagName(e.target.value))}
                  />
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
                    maxLength="300"
                    onChange={(e) => dispatch(setDescription(e.target.value))}
                  />
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
              <Button size="small" variant="transparent" onClick={() => props.onModalClose('')}>
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
  );
}

export default EditFeatureFlagModal;
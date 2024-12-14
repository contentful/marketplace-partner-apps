import { Heading, Flex, Subheading } from '@contentful/f36-components';
import { Button, Form, FormControl, TextInput, Textarea, Stack, Radio } from '@contentful/f36-components';
import React, { useReducer } from 'react';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import SectionSplitter from './SectionSplitter';
const CONTENTFUL = 'contentful';

const FlagTypes = {
  TEMPORARY: 'TEMPORARY',
  PERMANENT: 'PERMANENT'
};

const styles = {
  container: css({
    width: '800px'
  }),
  fieldItem: css({
    marginBottom: '10px'
  }),
  button: css({
    marginTop: tokens.spacingL
  })
};

const initialState = {
  flagName: '',
  description: '',
  loading: false,
  type: FlagTypes.TEMPORARY
};

const actionTypes = {
  SET_FLAG_NAME: 'SET_FLAG_NAME',
  SET_DESCRIPTION: 'SET_DESCRIPTION',
  SET_TYPE: 'SET_TYPE',
  SET_LOADING: 'SET_LOADING'
};

const setFlagName = (flagName) => ({ type: actionTypes.SET_FLAG_NAME, payload: flagName });
const setDescription = (description) => ({ type: actionTypes.SET_DESCRIPTION, payload: description });
const setType = (type) => ({ type: actionTypes.SET_TYPE, payload: type });
const setLoading = (loading) => ({ type: actionTypes.SET_LOADING, payload: loading });

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_FLAG_NAME:
      return { ...state, flagName: action.payload };
    case actionTypes.SET_DESCRIPTION:
      return { ...state, description: action.payload };
    case actionTypes.SET_TYPE:
      return { ...state, type: action.payload };
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

function FeatureFlag(props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const createFeatureFlag = async () => {
    dispatch(setLoading(true));
    const featureFlagCreated = {
      name: state.flagName,
      featureKey: `${CONTENTFUL}_${props.entryId}`,
      description: state.description,
      featureType: state.type,
      variables: []
    };
    await props.onFeatureFlagCreation(featureFlagCreated);
    dispatch(setLoading(false));
  };

  const isDisabled = !state.flagName.length;

  return (
    <React.Fragment>
      <div className={styles.container}>
        <Flex alignItems='center'>
          <Heading element='h1' marginBottom='0px' marginRight='spacingXs'>Create new feature flag</Heading>
        </Flex>
        <Subheading>Feature flags let you control and test different variations of your content.</Subheading>
        <SectionSplitter />
        <Form onSubmit={createFeatureFlag}>
          <FormControl className={styles.fieldItem}>
            <FormControl.Label isRequired>Flag name</FormControl.Label>
            <TextInput
              value={state.flagName}
              maxLength='255'
              onChange={(e) => dispatch(setFlagName(e.target.value))} />
            <FormControl.Counter />
          </FormControl>
          <FormControl className={styles.fieldItem}>
            <FormControl.Label>Description</FormControl.Label>
            <Textarea
              value={state.description}
              maxLength='300'
              onChange={(e) => dispatch(setDescription(e.target.value))} />
            <FormControl.Counter />
          </FormControl>
          <FormControl className={styles.fieldItem}>
            <FormControl.Label>Feature type</FormControl.Label>
            <Stack flexDirection='row'>
              <Radio
                id='flag-type1'
                name='flag-type'
                value={FlagTypes.TEMPORARY}
                isChecked={state.type === FlagTypes.TEMPORARY}
                onChange={() => dispatch(setType(FlagTypes.TEMPORARY))}>Temporary</Radio>
              <Radio
                id='flag-type2'
                name='flag-type'
                value={FlagTypes.PERMANENT}
                isChecked={state.type === FlagTypes.PERMANENT}
                onChange={() => dispatch(setType(FlagTypes.PERMANENT))}>Permanent</Radio>
            </Stack>
          </FormControl>
          <Button variant='primary' size='small' onClick={createFeatureFlag} isDisabled={isDisabled} isLoading={state.loading} className={styles.button}>Create feature flag</Button>
        </Form>
      </div>
    </React.Fragment>
  );
}

export default FeatureFlag;
import React, {useEffect, useCallback, useReducer} from 'react';
import { Skeleton, Modal, Paragraph, Button, Heading, Flex } from '@contentful/f36-components';
import { css } from 'emotion';
import CreateFeatureFlag from '../components/CreateFeatureFlag';
import tokens from '@contentful/f36-tokens';
import Variations from '../components/Variations';
import { ExternalLinkIcon } from '@contentful/f36-icons';

const styles = {
  editor: css({
    margin: tokens.spacingXl
  }),
  button: css({
    marginTop: '-10px',
    marginBottom: tokens.spacingS,
    width: '600px'
  })
};

// Initial state
const initialState = (sdk) => ({
  loading: true,
  error: "",
  currentStep: 1,
  contentTypes: [],
  meta: sdk.entry.fields.meta?.getValue() || {},
  featureFlag: sdk.entry.fields.featureFlag.getValue() || {},
  entries: {},
});

const actionTypes = {
  SET_INITIAL_DATA: 'SET_INITIAL_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_FEATURE_FLAG: 'SET_FEATURE_FLAG',
  SET_ENTRIES: 'SET_ENTRIES',
  SET_ERROR: 'SET_ERROR',
  SET_META: 'SET_META',
};

// Reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_INITIAL_DATA:
      return {
        ...state,
        featureFlag: action.payload.featureFlag,
        contentTypes: action.payload.contentTypes,
        entries: action.payload.entries,
        error: action.payload.error,
      };
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.SET_FEATURE_FLAG:
      return { ...state, featureFlag: action.payload };
    case actionTypes.SET_ENTRIES:
      return { ...state, entries: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case actionTypes.SET_META:
      return { ...state, meta: action.payload };
    default:
      return state;
  }
};

const fetchInitialData = async (props) => {
  const { space } = props.sdk;
  const [contentTypes, entries] = await Promise.all([
    space.getContentTypes({ order: 'name', limit: 1000}),
    space.getEntries({ skip: 0, limit: 1000})
  ]);
  const featureFlag = props.sdk.entry.fields.featureFlag.getValue();
  let error = '';
  if(featureFlag?.id && props.client){
    try {
      const resp = await props.client.getFeatureFlagById(featureFlag.id);
      if(resp && resp._data?.variations){
        let variations = resp._data?.variations;
        variations.sort((a,b) => b.id-a.id)
        featureFlag.variations = variations;
      } else {
        const message = resp?._errors?.length ? resp._errors[0].message: 'Something went wrong while fetching feature flag details.';
        throw new Error(message);
      }
    } catch (err) {
      error = err.message;
      props.sdk.notifier.error(err);
    }
  }

  return {
    featureFlag: featureFlag,
    contentTypes: contentTypes.items,
    entries: entries.items,
    error: error
  }
}

const getNewVariation = (variationName, vwoVariationsLength) => {
  let newVariation = {
    name: variationName,
    key: (vwoVariationsLength+1).toString(),
    variables: vwoVariationsLength? [{variableId: 1, value: ''}]: []
  };

  return newVariation;
}

const EntryEditor = (props) => {
  const [state, dispatch] = useReducer(reducer, props.sdk, initialState);

  const updateVariationsInVwo = async (vwoVariations) => {
    return new Promise(async (resolve, reject) => {
      try {
        const filteredVwoVariations = vwoVariations.filter(variation => variation.id !== 1);
        const response = await props.client.updateVariations({variations: filteredVwoVariations});
        if(response && response._data){
          resolve(response._data.variations);
        }
        else if(response && response._errors?.length){
          if(response._errors[0].code === 404){
            dispatch({ type: actionTypes.SET_ERROR, payload: response._errors[0].message });
          }
          reject(response._errors[0].message);
        }
        else{
          reject('Something went wrong while updating VWO Variations. Please try again');
        }
      } catch (err) {
        reject(err.message);
      }
    });
  };

  const updateFeatureFlagDetails = useCallback(async (updatedFeatureFlag) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await props.client.updateFeatureFlag(updatedFeatureFlag);
        if(response && response._data){
          props.sdk.entry.fields.featureFlag.setValue(response._data);
          dispatch({ type: actionTypes.SET_FEATURE_FLAG, payload: response._data });
          dispatch({ type: actionTypes.SET_ERROR, payload: '' });
          resolve(response._data);
        }
        else if(response && response._errors?.length){
          if(response._errors[0].code === 404){
            dispatch({ type: actionTypes.SET_ERROR, payload: response._errors[0].message });
          }
          reject(response._errors[0].message);
        }
        else{
          reject('Something went wrong while updating Feature flag details. Please try again');
        }
      } catch (err) {
        reject(err.message)
      }
    });
  }, [props.client, props.sdk.entry.fields.featureFlag]);

  const updateVwoVariationName = async (vwoVariation, variationName) => {
    const updatedVwoVariations = state.featureFlag.variations.map(variation => {
      if(variation.id === vwoVariation.id){
        variation.name = variationName;
      }
      return variation;
    });

    return updateVariationsInVwo(updatedVwoVariations)
    .then(variations => {
      variations.sort((a,b) => b.id-a.id);
      dispatch({ type: actionTypes.SET_ENTRIES, payload: variations });
      props.sdk.notifier.success('VWO Variation name updated successfully');
      return true;
    })
    .catch(err => {
      props.sdk.notifier.error(err);
      return false;
    });
  }

  const addNewVwoVariation = async (variationName) => {
    let newVwoVariation = getNewVariation(variationName, state.featureFlag.variations.length);
    const updatedVwoVariations = [...state.featureFlag.variations,newVwoVariation];

    return updateVariationsInVwo(updatedVwoVariations)
    .then(variations => {
      variations.sort((a,b) => b.id-a.id);
      let featureFlag = state.featureFlag;
      featureFlag.variations = variations;
      dispatch({ type: actionTypes.SET_FEATURE_FLAG, payload: featureFlag });
      props.sdk.entry.fields.featureFlag.setValue(featureFlag);
      props.sdk.notifier.success('VWO Variation added successfully');
      return true;
    })
    .catch(err => {
      props.sdk.notifier.error(err);
      return false;
    });
  }

  const updateContentfulEntries = useCallback(async (updatedEntry) => {
    if(updatedEntry){
      await props.sdk.space.getEntries({ skip: 0, limit: 1000}).then(resp => {
          let entries = resp.items.map(entry => {
            if(updatedEntry.entity.sys.id === entry.sys.id){
              return updatedEntry.entity;
            }
            return entry;
          });
          dispatch({ type: actionTypes.SET_ENTRIES, payload: entries });
      });
    } else {
      props.sdk.space.getEntries({ skip: 0, limit: 1000}).then(resp => dispatch({ type: actionTypes.SET_ENTRIES, payload: resp.items }));
    }
  }, [props.sdk.space]);

  const updateVwoVariationContent = async (variation, contentId, updateEntries) => {
    // Default variation cannot be edited directly. Update variable instead and default variations will be updated
    if(variation.id === 1){
      let featureFlag = state.featureFlag;
      featureFlag.variables = [{
        variableName: featureFlag.variables?.variableName || 'vwoContentful',
        dataType: 'string',
        defaultValue: contentId
      }];
      featureFlag.description = featureFlag.description || '';
      updateFeatureFlagDetails(featureFlag)
      .then(updatedFeatureFlag => {
        updatedFeatureFlag.variations.sort((a,b) => b.id-a.id);
        dispatch({ type: actionTypes.SET_FEATURE_FLAG, payload: updatedFeatureFlag });
        props.sdk.entry.fields.featureFlag.setValue(updatedFeatureFlag);
        if(updateEntries){
          updateContentfulEntries();
        }
        props.sdk.notifier.success('VWO Variations updated successfully');
      })
      .catch(err => {
        props.sdk.notifier.error(err);
      });
    }
    else{
      let updatedVwoVariations = state.featureFlag.variations.map((vwoVariation) => {
        if(vwoVariation.id === variation.id){
          vwoVariation.variables[0].value = contentId;
        }
        return vwoVariation;
      });
  
      updateVariationsInVwo(updatedVwoVariations)
      .then(variations => {
        variations.sort((a,b) => b.id-a.id);
        let featureFlag = state.featureFlag;
        featureFlag.variations = variations;
        dispatch({ type: actionTypes.SET_FEATURE_FLAG, payload: featureFlag });
        props.sdk.entry.fields.featureFlag.setValue(featureFlag);
        if(updateEntries){
          updateContentfulEntries();
        }
      })
      .catch(err => {
        props.sdk.notifier.error(err);
      });
    }
  }

  const createFeatureFlag = async (featureFlag) => {
    if(featureFlag){
      try{
        let resp = await props.client.createFeatureFlag(featureFlag);
        if(resp && resp._data){
          featureFlag.id = resp._data.id;
          featureFlag.variations = [resp._data.variations];
          props.sdk.entry.fields.title.setValue(featureFlag.name);
          props.sdk.entry.fields.featureFlag.setValue(featureFlag);
          dispatch({ type: actionTypes.SET_FEATURE_FLAG, payload: featureFlag });
          dispatch({ type: actionTypes.SET_CURRENT_STEP, payload: 3 });
          dispatch({ type: actionTypes.SET_ERROR, payload: '' });
          props.sdk.notifier.success('Feature flag created successfully');
        }
        else if(resp && resp._errors?.length){
          if(resp._errors[0].code === 404){
            dispatch({ type: actionTypes.SET_ERROR, payload: resp._errors[0].message });
          }
          props.sdk.notifier.error(resp._errors[0].message);
        }
        else{
          props.sdk.notifier.error('Something went wrong. Please try again');
        }
      } catch (err) {
        props.sdk.notifier.error(err.message);
      }
    }
  };

  const linkExistingEntry = async (vwoVariation) => {
    const data = await props.sdk.dialogs.selectSingleEntry({
      locale: props.sdk.locales.default,
      contentTypes: state.contentTypes.map(contentType => contentType.sys.id).filter(contentType => contentType !== props.sdk.contentType.sys.id)
    });
    
    if(!data){
      return;
    }
    
    const meta = props.sdk.entry.fields.meta.getValue() || {};
    props.sdk.entry.fields.meta.setValue({
      ...meta,
      [vwoVariation.id]: data.sys.id
    });

    updateVwoVariationContent(vwoVariation, data.sys.id, false);
  }

  const onCreateVariationEntry = async(vwoVariation, contentType) => {
    const data = await props.sdk.navigator.openNewEntry(contentType.sys.id,{
      slideIn: { waitForClose: true }
    }).then(async (updatedEntry) => {
      return updatedEntry;
   });

   await updateContentfulEntries(data);

    if(!data){
      return;
    }

    const meta = props.sdk.entry.fields.meta.getValue() || {};

    props.sdk.entry.fields.meta.setValue({
      ...meta,
      [vwoVariation.id]: data.entity.sys.id
    });

    updateVwoVariationContent(vwoVariation, data.entity.sys.id, true);
  };

  useEffect( () => {
    fetchInitialData(props)
      .then(data => {
        dispatch({ type: actionTypes.SET_INITIAL_DATA, payload: data });
        return data;
      })
      .catch(() => {
        props.sdk.notifier.error('Unable to load initial data');
      })
      .finally(() => {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      });
  }, [props.client, props]);

  useEffect(() => {
    const unsubscribeMetaChange = props.sdk.entry.fields.meta.onValueChanged(data => {
      dispatch({ type: actionTypes.SET_META, payload: data || {} });
    });

    return () => {
      unsubscribeMetaChange();
    }
  },[
    props.sdk.entry.fields.meta
  ]);

  const isFeatureFlagCreated = state.featureFlag?.id;

  return (
    <React.Fragment>
      <div className={styles.editor}>
        {state.loading && <Skeleton.Container>
          <Skeleton.BodyText numberOfLines={10} />
        </Skeleton.Container>}
        {!state.loading && !isFeatureFlagCreated && !state.error && 
          <CreateFeatureFlag onFeatureFlagCreation={createFeatureFlag} entryId={props.sdk.ids.entry}/>}
        {isFeatureFlagCreated && !state.loading && !state.error && 
          <Variations
            sdk={props.sdk}
            featureFlag={state.featureFlag}
            updateVwoVariationName={updateVwoVariationName}
            addNewVwoVariation={addNewVwoVariation}
            contentTypes={state.contentTypes}
            onCreateVariationEntry={onCreateVariationEntry}
            linkExistingEntry={linkExistingEntry}
            updateContentfulEntries={updateContentfulEntries}
            updateVwoVariationContent={updateVwoVariationContent}
            entries = {state.entries}/>
        }
        <Modal onClose={() => dispatch({ type: actionTypes.SET_ERROR, payload: '' })} isShown={!!state.error && !state.loading}>
          {() => (
            <>
              <Flex alignItems='center' justifyContent='center' flexDirection='column' padding='spacingL'>
                <Heading style={{marginBottom: '30px', textAlign: 'center'}}>
                  Feature flag not found
                </Heading>
                <Paragraph fontSize='fontSizeL' marginBottom='spacingXl'>
                  We couldn't locate the feature flag <strong>{state.featureFlag?.name}</strong>. It may have been removed from the VWO app, or there was an issue retrieving it.
                </Paragraph>
                <Button
                  className={styles.button}
                  endIcon={<ExternalLinkIcon />}
                  variant='negative'
                  size='small'
                  href={`https://app.vwo.com/#/full-stack/feature-flag/${state.featureFlag?.id}/edit/variables/`}
                  as='a'
                  target="_blank">
                  View this feature flag in VWO
                </Button>
              </Flex>
            </>
          )}
        </Modal>
      </div>
    </React.Fragment>
  )
};

export default EntryEditor;

import React, {useEffect, useCallback, useReducer, useMemo} from 'react';
import { Skeleton, Modal, Paragraph, Button, Heading, Flex } from '@contentful/f36-components';
import { css } from 'emotion';
import CreateFeatureFlag from '../components/CreateFeatureFlag';
import tokens from '@contentful/f36-tokens';
import Variations from '../components/Variations';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import WingifyAppActionService from '../services/wingifyAppActionService';

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
});

const actionTypes = {
  SET_INITIAL_DATA: 'SET_INITIAL_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_FEATURE_FLAG: 'SET_FEATURE_FLAG',
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
        error: action.payload.error,
      };
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.SET_FEATURE_FLAG:
      return { ...state, featureFlag: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case actionTypes.SET_META:
      return { ...state, meta: action.payload };
    default:
      return state;
  }
};

const getNewVariation = (variationName, wingifyVariationsLength) => {
  let newVariation = {
    name: variationName,
    key: (wingifyVariationsLength+1).toString(),
    variables: wingifyVariationsLength? [{variableId: 1, value: ''}]: []
  };

  return newVariation;
}

const EntryEditor = (props) => {
  const [state, dispatch] = useReducer(reducer, props.sdk, initialState);
  const wingifyService = useMemo(() => new WingifyAppActionService(props.sdk), [props.sdk]);
  
  const fetchInitialData = useCallback(async () => {
    const contentTypes = await props.sdk.space.getContentTypes({ order: 'name', limit: 1000 });
    const featureFlag = props.sdk.entry.fields.featureFlag.getValue();
    let error = '';
    if(featureFlag?.id){
      try {
        const featureFlagData = await wingifyService.fetchFeatureFlag(featureFlag.id);        
        featureFlag.variations = featureFlagData.variations;
      } catch (err) {
        error = err.message;
        props.sdk.notifier.error(err);
      }
    }
      
    return {
      featureFlag: featureFlag,
      contentTypes: contentTypes.items,
      error: error
    }
  }, [props.sdk.entry.fields.featureFlag, props.sdk.notifier, wingifyService, props.sdk.space]);

  const updateVariationsInWingify = async (wingifyVariations) => {
    return new Promise(async (resolve, reject) => {
      try {
        const variations = await wingifyService.updateVariations(wingifyVariations, state.featureFlag.id);
        resolve(variations);
      } catch (err) {
        reject(err.message);
      }
    });
  };
  
  const updateFeatureFlagDetails = useCallback(async (updatedFeatureFlag) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await wingifyService.updateFeatureFlag(updatedFeatureFlag);
        props.sdk.entry.fields.featureFlag.setValue(response);
        dispatch({ type: actionTypes.SET_FEATURE_FLAG, payload: response });
        dispatch({ type: actionTypes.SET_ERROR, payload: '' });
        resolve(response);
      } catch (err) {
        if (err.message.includes('404')) {
          dispatch({ type: actionTypes.SET_ERROR, payload: err.message });
        }
        reject(err.message);
      }
    });
  }, [props.sdk.entry.fields.featureFlag, wingifyService]);

  const updateWingifyVariationName = async (wingifyVariation, variationName) => {
    const updatedWingifyVariations = state.featureFlag.variations.map(variation => {
      if(variation.id === wingifyVariation.id){
        variation.name = variationName;
      }
      return variation;
    });

    return updateVariationsInWingify(updatedWingifyVariations)
    .then(variations => {
      variations.sort((a,b) => b.id-a.id);
      props.sdk.notifier.success('Wingify Variation name updated successfully');
      return true;
    })
    .catch(err => {
      props.sdk.notifier.error(err);
      return false;
    });
  }

  const addNewWingifyVariation = async (variationName) => {
    let newWingifyVariation = getNewVariation(variationName, state.featureFlag.variations.length);
    const updatedWingifyVariations = [...state.featureFlag.variations,newWingifyVariation];

    return updateVariationsInWingify(updatedWingifyVariations)
    .then(variations => {
      variations.sort((a,b) => b.id-a.id);
      let featureFlag = state.featureFlag;
      featureFlag.variations = variations;
      dispatch({ type: actionTypes.SET_FEATURE_FLAG, payload: featureFlag });
      props.sdk.entry.fields.featureFlag.setValue(featureFlag);
      props.sdk.notifier.success('Wingify Variation added successfully');
      return true;
    })
    .catch(err => {
      props.sdk.notifier.error(err);
      return false;
    });
  }

  const updateWingifyVariationContent = async (variation, contentId) => {
    // Default variation cannot be edited directly. Update variable instead and default variations will be updated
    if(variation.id === 1){
      let featureFlag = state.featureFlag;      
      featureFlag.variables = [{
        variableName: featureFlag.variables?.variableName || 'wingify_content_id',
        dataType: 'string',
        defaultValue: contentId
      }];
      featureFlag.description = featureFlag.description || '';
      updateFeatureFlagDetails(featureFlag)
      .then(updatedFeatureFlag => {
        updatedFeatureFlag.variations.sort((a,b) => b.id-a.id);
        dispatch({ type: actionTypes.SET_FEATURE_FLAG, payload: updatedFeatureFlag });
        props.sdk.entry.fields.featureFlag.setValue(updatedFeatureFlag);
        props.sdk.notifier.success('Wingify Variations updated successfully');
      })
      .catch(err => {
        props.sdk.notifier.error(err);
      });
    }
    else{
      let updatedWingifyVariations = state.featureFlag.variations.map((wingifyVariation) => {
        if(wingifyVariation.id === variation.id){
          wingifyVariation.variables[0].value = contentId;
        }
        return wingifyVariation;
      });
  
      updateVariationsInWingify(updatedWingifyVariations)
      .then(variations => {
        variations.sort((a,b) => b.id-a.id);
        let featureFlag = state.featureFlag;
        featureFlag.variations = variations;
        dispatch({ type: actionTypes.SET_FEATURE_FLAG, payload: featureFlag });
        props.sdk.entry.fields.featureFlag.setValue(featureFlag);
      })
      .catch(err => {
        props.sdk.notifier.error(err);
      });
    }
  }

  const createFeatureFlag = async (featureFlag) => {        
    if(featureFlag){
      try{
        const _data = await wingifyService.createFeatureFlag(featureFlag);        
        featureFlag.id = _data.id;
        featureFlag.variations = Array.isArray(_data.variations) ? _data.variations : [_data.variations];
        props.sdk.entry.fields.title.setValue(_data.name);
        props.sdk.entry.fields.featureFlag.setValue(featureFlag);
        dispatch({ type: actionTypes.SET_FEATURE_FLAG, payload: featureFlag });
        dispatch({ type: actionTypes.SET_CURRENT_STEP, payload: 3 });
        dispatch({ type: actionTypes.SET_ERROR, payload: '' });
        props.sdk.notifier.success('Feature flag created successfully');
      } catch (err) {
        props.sdk.notifier.error(err.message);
      }
    }
  };

  const linkExistingEntry = async (wingifyVariation) => {
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
      [wingifyVariation.id]: data.sys.id
    });

    updateWingifyVariationContent(wingifyVariation, data.sys.id);
  }

  const onCreateVariationEntry = async(wingifyVariation, contentType) => {
    const data = await props.sdk.navigator.openNewEntry(contentType.sys.id,{
      slideIn: { waitForClose: true }
    }).then(async (updatedEntry) => {
      return updatedEntry;
   });

    if(!data){
      return;
    }

    const meta = props.sdk.entry.fields.meta.getValue() || {};

    props.sdk.entry.fields.meta.setValue({
      ...meta,
      [wingifyVariation.id]: data.entity.sys.id
    });

    updateWingifyVariationContent(wingifyVariation, data.entity.sys.id);
  };

  useEffect( () => {
    fetchInitialData()
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
  }, [fetchInitialData, props.sdk.notifier]);

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
            updateWingifyVariationName={updateWingifyVariationName}
            addNewWingifyVariation={addNewWingifyVariation}
            contentTypes={state.contentTypes}
            onCreateVariationEntry={onCreateVariationEntry}
            linkExistingEntry={linkExistingEntry}
            updateWingifyVariationContent={updateWingifyVariationContent}/>
        }
        <Modal onClose={() => dispatch({ type: actionTypes.SET_ERROR, payload: '' })} isShown={!!state.error && !state.loading}>
          {() => (
            <>
              <Flex alignItems='center' justifyContent='center' flexDirection='column' padding='spacingL'>
                <Heading style={{marginBottom: '30px', textAlign: 'center'}}>
                  Feature flag not found
                </Heading>
                <Paragraph fontSize='fontSizeL' marginBottom='spacingXl'>
                  We couldn't locate the feature flag <strong>{state.featureFlag?.name}</strong>. It may have been removed from the Wingify app, or there was an issue retrieving it.
                </Paragraph>
                <Button
                  className={styles.button}
                  endIcon={<ExternalLinkIcon />}
                  variant='negative'
                  size='small'
                  href={`https://app.wingify.com/#/full-stack/feature-flag/${state.featureFlag?.id}/edit/variables/`}
                  as='a'
                  target="_blank">
                  View this feature flag in Wingify
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

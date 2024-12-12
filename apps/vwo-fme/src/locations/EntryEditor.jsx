import React, {useEffect, useCallback} from 'react';
import { Skeleton, Modal, Paragraph, Button, Heading, Flex } from '@contentful/f36-components';
import useMethods from 'use-methods';
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

const methods = state => {
  return {
    setInitialData({featureFlag, contentTypes, entries, error }){
      state.featureFlag = featureFlag;
      state.contentTypes = contentTypes;
      state.entries = entries;
      state.error = error;
    },
    setLoading(loadingState){
      state.loading = loadingState;
    },
    setCurrentStep(step){
      state.currentStep = step;
    },
    setFeatureFlag(featureFlag){
      state.featureFlag = featureFlag;
    },
    setEntries(entries){
      state.entries = entries;
    },
    setError(message){
      state.error = message;
    },
    setMeta(meta) {
      state.meta = meta;
    }
  }
}

const getInitialValues = sdk => ({
  loading: true,
  error: '',
  currentStep: 1,
  contentTypes: [],
  meta: sdk.entry.fields.meta?.getValue() || {},
  featureFlag: sdk.entry.fields.featureFlag.getValue() || {},
  entries: {}
})

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
      error = err;
      props.sdk.notifier.error(err);
    }
  }

  return {
    featureFlag: featureFlag,
    contentTypes: contentTypes.items,
    entries: entries.items,
    error
  }
}

const getNewVariation = (variationName, vwoVariationsLength) => {
  let newVariation = {
    name: variationName,
    key: (vwoVariationsLength+1).toString(),
    jsonContent: vwoVariationsLength? [{variableId: 1, value: ''}]: []
  };

  return newVariation;
}

const EntryEditor = (props) => {
  const globalState = useMethods(methods, getInitialValues(props.sdk));
  const [state, actions] = globalState;

  const updateVariationsInVwo = async (vwoVariations) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await props.client.updateVariations({variations: vwoVariations});
        if(response && response._data){
          resolve(response._data.variations);
        }
        else if(response && response._errors?.length){
          if(response._errors[0].code === 404){
            actions.setError(response._errors[0].message);
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
          actions.setFeatureFlag(response._data);
          actions.setError('');
          resolve(response._data);
        }
        else if(response && response._errors?.length){
          if(response._errors[0].code === 404){
            actions.setError(response._errors[0].message);
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
  }, [props.client, actions, props.sdk.entry.fields.featureFlag]);

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
      actions.setVwoVariations(variations);
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
      actions.setFeatureFlag(featureFlag);
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
          actions.setEntries(entries);
      });
    } else {
      props.sdk.space.getEntries({ skip: 0, limit: 1000}).then(resp => actions.setEntries(resp.items));
    }
  }, [props.sdk.space, actions]);

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
        actions.setFeatureFlag(updatedFeatureFlag);
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
          vwoVariation.jsonContent[0].value = contentId;
        }
        return vwoVariation;
      });
  
      updateVariationsInVwo(updatedVwoVariations)
      .then(variations => {
        variations.sort((a,b) => b.id-a.id);
        let featureFlag = state.featureFlag;
        featureFlag.variations = variations;
        actions.setFeatureFlag(featureFlag);
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
          actions.setFeatureFlag(featureFlag);
          actions.setCurrentStep(3);
          actions.setError('');
          props.sdk.notifier.success('Feature flag created successfully');
        }
        else if(resp && resp._errors?.length){
          if(resp._errors[0].code === 404){
            actions.setError(resp._errors[0].message);
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
        actions.setInitialData(data);
        return data;
      })
      .catch(() => {
        props.sdk.notifier.error('Unable to load initial data');
      })
      .finally(() => {
        actions.setLoading(false);
      });
  }, [props.client, actions, props]);

  useEffect(() => {
    const unsubscribeMetaChange = props.sdk.entry.fields.meta.onValueChanged(data => {
      actions.setMeta(data || {});
    });

    return () => {
      unsubscribeMetaChange();
    }
  },[
    actions,
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
        <Modal onClose={() => actions.setError('')} isShown={!!state.error && !state.loading}>
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

import React, {useState, useEffect, useCallback} from 'react';
import { Button, ButtonGroup, IconButton, Text, Flex, TextLink, TextInput } from '@contentful/f36-components';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';
import { EditIcon, ExternalLinkIcon } from '@contentful/f36-icons';
import VwoAppActionService from '../services/vwoAppActionService';


const styles = {
  button: css({
    marginTop: '-10px',
    marginBottom: tokens.spacingS,
    minWidth: '100%'
  }),
  descriptionStyle: css({
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 1, // Limit to 2 lines
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'normal', // Allows text wrapping within lines
  })
};

const Sidebar = (props) => {
  const [featureFlag, setFeatureFlag] = useState(props.sdk.entry.fields.featureFlag.getValue() || {});
  const [nameEditing, setNameEditing] = useState(false);
  const [descriptionEditing, setDescriptionEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const vwoService = new VwoAppActionService(props.sdk);

  const resetFeatureFlagValue = useCallback(() => {
    const featureFlag = props.sdk.entry.fields.featureFlag.getValue();
    if(featureFlag){
      setFeatureFlag(featureFlag);
      setName(featureFlag.name || '');
      setDescription(featureFlag.description || '');
    }
  }, [props.sdk.entry.fields.featureFlag]);

  const updateFeatureFlagDetails = async (updatedFeatureFlag) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await vwoService.updateFeatureFlag(updatedFeatureFlag);
        props.sdk.entry.fields.featureFlag.setValue(response);
        resolve(response);
      } catch (err) {
        reject(err.message);
      }
    });
  }

  const handleDiscard = () => {
    resetFeatureFlagValue();
    setNameEditing(false);
    setDescriptionEditing(false);
  }

  const handleSaveClick = async () => {
    if(nameEditing && !name){
      props.sdk.notifier.error('Feature flag name is required');
      return;
    }
    let featureFlag = props.sdk.entry.fields.featureFlag.getValue();
    featureFlag.name = name;
    featureFlag.description = description;
    setLoading(true);

    updateFeatureFlagDetails(featureFlag)
    .then((featureFlag) => {
      setFeatureFlag(featureFlag);
      props.sdk.entry.fields.title.setValue(featureFlag.name);
      props.sdk.notifier.success('VWO Feature flag updated successfully');
    })
    .catch((err) => {
      props.sdk.notifier.success(err);
    })
    .finally(() => {
      setLoading(false);
      setNameEditing(false);
      setDescriptionEditing(false);
    });
  };

  useEffect(() => {
    resetFeatureFlagValue();
    const unsubsribeFeatureFlagChange = props.sdk.entry.fields.featureFlag.onValueChanged(featureFlag => {
      setFeatureFlag(featureFlag);
      setName(featureFlag?.name || '');
      setDescription(featureFlag?.description || '');
    });

    return () => {
      unsubsribeFeatureFlagChange();
    }
  },[props.sdk.entry.fields.featureFlag, resetFeatureFlagValue]);

  const isFeatureFlagAdded = !!featureFlag?.id;

  return <React.Fragment>
      {/* Feature flag details */}
      <Button
          className={styles.button}
          isDisabled={!isFeatureFlagAdded}
          endIcon={<ExternalLinkIcon />}
          size='small'
          href={`https://app.vwo.com/#/full-stack/feature-flag/${featureFlag?.id}/edit/variables/`}
          as={isFeatureFlagAdded? 'a': 'button'}
          target="_blank">
          View this feature flag in VWO
        </Button>
      <Flex flexDirection='column' marginBottom='spacingM'>
          <Flex alignItems='center' justifyContent='space-between' marginBottom={nameEditing? 'spacing2Xs': 'none'}>
            <Text>Name:</Text>
            {nameEditing? (
              <ButtonGroup variant='spaced' spacing='spacingM'>
                <TextLink
                  isLoading={loading}
                  as="button"
                  variant="primary"
                  onClick={handleSaveClick}>Save</TextLink>
                <TextLink
                  isLoading={loading}
                  as="button"
                  variant="secondary"
                  onClick={handleDiscard}>Discard</TextLink>
              </ButtonGroup>
            ): (
              <IconButton
                icon={<EditIcon />}
                isDisabled={!isFeatureFlagAdded}
                aria-label="Edit"
                size="tiny"
                variant="secondary"
                onClick={() => setNameEditing(true)}/>
            )}
          </Flex>
          {nameEditing && isFeatureFlagAdded? (<Flex alignItems="center" spacing="spacingXs">
            <TextInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              size='small'
              autoFocus
            />
          </Flex>
        ): (
          <Text fontWeight='fontWeightDemiBold' fontSize="fontSizeM" marginTop='spacing2Xs'>{name || '-'}</Text>
        )}
      </Flex>

      <Flex flexDirection='column' marginBottom='none'>
          <Flex alignItems='center' justifyContent='space-between' marginBottom={descriptionEditing? 'spacing2Xs': 'none'}>
            <Text>Description:</Text>
            {descriptionEditing? (
              <ButtonGroup variant='spaced' spacing='spacingM'>
                <TextLink
                  isLoading={loading}
                  as="button"
                  variant="primary"
                  onClick={handleSaveClick}>Save</TextLink>
                <TextLink
                  isLoading={loading}
                  as="button"
                  variant="secondary"
                  onClick={handleDiscard}>Discard</TextLink>
              </ButtonGroup>
            ): (
              <IconButton
                icon={<EditIcon />}
                aria-label="Edit"
                isDisabled={!isFeatureFlagAdded}
                size="tiny"
                variant="secondary"
                onClick={() => setDescriptionEditing(true)}/>
            )}
          </Flex>
          {descriptionEditing && isFeatureFlagAdded? (<Flex alignItems="center" spacing="spacingXs">
            <TextInput
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              size='small'
              autoFocus
            />
          </Flex>
        ): (
          <Text fontWeight='fontWeightDemiBold' fontSize="fontSizeM" className={styles.descriptionStyle} marginTop='spacing2Xs'>{description || '-'}</Text>
        )}
      </Flex>
  </React.Fragment>;
};

export default Sidebar;

import { Button, Heading, List, Paragraph, Skeleton } from '@contentful/f36-components';
import { css } from 'emotion';
import { mapWingifyVariationsAndContent } from '../utils';
import React, { useCallback, useEffect, useState } from 'react';
import VariationItem from './VariationItem';
import tokens from '@contentful/f36-tokens';
import CreateContent from './CreateContent';
import AddWingifyVariationModal from '../modalComponents/AddWingifyVariationModal';

const styles = {
  DefaultVariationTile: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    border: '1px solid lightgrey',
    borderRadius: '10px',
  }),
  variationsWithoutLength: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    marginBottom: tokens.spacingM,
  }),
  variationsWithLength: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  }),
};

function Variations(props) {
  const [newVariationModal, setNewVariationModal] = useState(false);
  const wingifyVariations = props.featureFlag.variations;
  const [defaultVariation, setDefaultVariation] = useState({});
  const [isDefaultVariationContentAdded, setIsDefaultVariationContentAdded] = useState(false);
  const [mappedVariations, setMappedVariations] = useState([]);
  const [isVariationsLoading, setIsVariationsLoading] = useState(false);

  const fetchMappedVariations = useCallback(async () => {
    try {
      setIsVariationsLoading(true);
      const mappedVariations = await mapWingifyVariationsAndContent(
        wingifyVariations,
        props.contentTypes,
        props.sdk.locales.default,
        props.sdk.space.getEntries
      );
      setMappedVariations(mappedVariations);
      const defaultVariation = mappedVariations.filter((variation) => variation.wingifyVariation.id === 1)[0] || {};
      setDefaultVariation(defaultVariation);
      setIsDefaultVariationContentAdded(defaultVariation?.variationContent);
    } catch (error) {
      console.error(error);
    } finally {
      setIsVariationsLoading(false);
    }
  }, [wingifyVariations, props.contentTypes, props.sdk.locales.default, props.sdk.space.getEntries]);

  useEffect(() => {
    fetchMappedVariations();
  }, [fetchMappedVariations]);

  return (
    <React.Fragment>
      {/* Add Wingify Variation modal */}
      <AddWingifyVariationModal
        addNewWingifyVariation={props.addNewWingifyVariation}
        setNewVariationModal={setNewVariationModal}
        wingifyVariationsLength={wingifyVariations.length}
        newVariationModal={newVariationModal}
      />

      {/* Default variation block */}
      <div className={styles.DefaultVariationTile} style={{ padding: defaultVariation.variationContent ? '20px' : '40px', marginBottom: '40px' }}>
        <Heading style={{ marginBottom: '5px', alignSelf: defaultVariation.variationContent ? 'flex-start' : 'auto' }}>Default (control) variation</Heading>
        <Paragraph style={{ marginBottom: '20px', alignSelf: defaultVariation.variationContent ? 'flex-start' : 'auto' }}>
          Create a new entry or link an existing one to set up the default variation.
        </Paragraph>
        <CreateContent
          sdk={props.sdk}
          variation={defaultVariation}
          contentTypes={props.contentTypes}
          onRefreshVariationEntries={fetchMappedVariations}
          linkExistingEntry={props.linkExistingEntry}
          onCreateVariationEntry={props.onCreateVariationEntry}
          updateWingifyVariationContent={props.updateWingifyVariationContent}
        />
      </div>

      {/* Other variations block */}
      {isDefaultVariationContentAdded && (
        <div className={styles.DefaultVariationTile} style={{ padding: mappedVariations.length > 1 ? '20px' : '40px' }}>
          <div className={mappedVariations.length > 1 ? styles.variationsWithLength : styles.variationsWithoutLength}>
            <div
              style={{
                marginBottom: '5px',
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: mappedVariations.length > 1 ? 'flex-start' : 'center',
              }}>
              <Heading style={{ marginBottom: '5px' }}>Create other variations</Heading>
              <Paragraph style={{ marginBottom: '20px' }}>Manage and view all entries for other variations.</Paragraph>
            </div>
            <Button variant="primary" size="small" onClick={() => setNewVariationModal(true)}>
              Add Variation
            </Button>
          </div>
          {!isVariationsLoading ? (
            <List style={{ width: '100%', listStyle: 'none', padding: '0px' }}>
              {mappedVariations
                .filter((variation) => variation.wingifyVariation.id !== 1)
                .map((variation, index) => {
                  return (
                    <List.Item key={variation.wingifyVariation.id}>
                      <VariationItem
                        index={mappedVariations.length - index - 1}
                        sdk={props.sdk}
                        variation={variation}
                        linkExistingEntry={props.linkExistingEntry}
                        contentTypes={props.contentTypes}
                        onRefreshVariationEntries={fetchMappedVariations}
                        updateWingifyVariationName={props.updateWingifyVariationName}
                        onCreateVariationEntry={props.onCreateVariationEntry}
                        updateWingifyVariationContent={props.updateWingifyVariationContent}
                        key={variation.wingifyVariation.id}
                      />
                    </List.Item>
                  );
                })}
            </List>
          ) : (
            <Skeleton.Container>
              <Skeleton.BodyText numberOfLines={10} />
            </Skeleton.Container>
          )}
        </div>
      )}
    </React.Fragment>
  );
}

export default Variations;

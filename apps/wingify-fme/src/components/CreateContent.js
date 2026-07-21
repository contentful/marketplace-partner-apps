import React, { useEffect, useState, useCallback } from 'react';
import { EntryCard, TextInput, Modal, List, MenuItem, ButtonGroup, Button, Flex } from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';
import { css } from 'emotion';

const styles = {
  menuList: css({
    maxHeight: '200px',
    listStyle: 'none',
    padding: '0px',
  }),
  listItem: css({
    marginBottom: '0px',
    borderBottom: '1px solid lightgrey',
    cursor: 'pointer',
    margin: '5px 0px',
    padding: '6px',
    fontWeight: '600',
  }),
  modal: css({
    minHeight: '340px',
    padding: '0px',
  }),
  emptyResults: css({
    margin: '40px',
    padding: '20px 40px',
    border: '1px solid lightgrey',
    borderRadius: '5px',
  }),
};

function CreateContent(props) {
  const [selectContentType, setSelectContentType] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [processing, setProcessing] = useState(false);

  const contentTypes = props.contentTypes.filter(
    (contentType) => contentType.name.toLowerCase().includes(searchText.toLowerCase()) && contentType.sys.id !== props.sdk.contentType.sys.id
  );

  const editContent = (wingifyVariation) => {
    setSelectContentType(false);
    props.sdk.navigator.openEntry(wingifyVariation.variables[0].value, { slideIn: { waitForClose: true } }).then((updatedEntry) => {
      if (updatedEntry && props.onRefreshVariationEntries) {
        props.onRefreshVariationEntries();
      }
    });
  };

  const onSearchTextChange = useCallback((searchText) => {
    setSearchText(searchText);
  }, []);

  const removeContent = useCallback(
    (wingifyVariation) => {
      if (wingifyVariation.id === 1) {
        props.sdk.notifier.error('Default variation content cannot be removed');
        return;
      }
      const meta = props.sdk.entry.fields.meta.getValue() || {};
      if (wingifyVariation) {
        delete meta[wingifyVariation.id];
        props.sdk.entry.fields.meta.setValue(meta);
        props.updateWingifyVariationContent(wingifyVariation, '');
      }
    },
    [props]
  );

  const onContentTypeClick = useCallback(
    async (contentType) => {
      if (processing) {
        return;
      }
      setProcessing(true);
      await props.onCreateVariationEntry(props.variation.wingifyVariation, contentType);
      setProcessing(false);
      setSelectContentType(false);
    },
    [processing, props]
  );

  const setInitialData = () => {
    setSearchText('');
  };

  useEffect(() => {
    setInitialData();
  }, []);

  const isContentAdded = props.variation.variationContent;

  return (
    <React.Fragment>
      <Modal isShown={selectContentType} onClose={() => setSelectContentType(false)} className={styles.modal}>
        {() => (
          <>
            <Modal.Header title="Select content type" onClose={() => setSelectContentType(false)} />
            <Modal.Content>
              <TextInput icon={<SearchIcon />} value={searchText} placeholder="Search content type" onChange={(e) => onSearchTextChange(e.target.value)} />
              {!contentTypes.length && (
                <Flex className={styles.emptyResults} alignItems="center" justifyContent="center">
                  No results found
                </Flex>
              )}
              <List className={styles.menuList}>
                {contentTypes.map((contentType) => {
                  return (
                    <List.Item className={styles.listItem} key={contentType.sys.id} onClick={() => onContentTypeClick(contentType)}>
                      {contentType.name}
                    </List.Item>
                  );
                })}
              </List>
            </Modal.Content>
          </>
        )}
      </Modal>
      {!isContentAdded && (
        <ButtonGroup variant="spaced">
          <Button variant="secondary" size="small" onClick={() => setSelectContentType(true)}>
            Create entry and link
          </Button>
          <Button variant="secondary" size="small" onClick={() => props.linkExistingEntry(props.variation.wingifyVariation)}>
            Link an existing entry
          </Button>
        </ButtonGroup>
      )}
      {isContentAdded && (
        <EntryCard
          status={props.variation.variationContent.status}
          contentType={props.variation.variationContent.contentType}
          title={props.variation.variationContent.title}
          description={props.variation.variationContent.description}
          onClick={() => editContent(props.variation.wingifyVariation)}
          actions={[
            <MenuItem key="edit" onClick={() => editContent(props.variation.wingifyVariation)}>
              Edit
            </MenuItem>,
            <MenuItem key="remove" onClick={() => removeContent(props.variation.wingifyVariation)} isDisabled={props.variation.wingifyVariation.id === 1}>
              Remove
            </MenuItem>,
          ]}
        />
      )}
    </React.Fragment>
  );
}

export default CreateContent;

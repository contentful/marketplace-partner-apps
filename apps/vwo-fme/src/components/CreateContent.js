import React, { useEffect, useState, useCallback } from 'react';
import { EntryCard, TextInput, Modal, List, MenuItem, ButtonGroup, Button, Flex } from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';
import { css } from 'emotion';

const styles = {
   menuList: css({
      maxHeight: '200px', 
      listStyle: 'none',
      padding: '0px'
   }),
   listItem: css({
      marginBottom: '0px',
      borderBottom: '1px solid lightgrey',
      cursor: 'pointer',
      margin: '5px 0px',
      padding: '6px',
      fontWeight: '600'
   }),
   modal: css({
      minHeight: '340px',
      padding: '0px'
   }),
   emptyResults: css({
      margin: '40px',
      padding: '20px 40px',
      border: '1px solid lightgrey',
      borderRadius: '5px'
   })
 };

function CreateContent(props) {
   const [selectContentType, setSelectContentType] = useState(false);
   const [searchText, setSearchText] = useState('');
   const [processing, setProcessing] = useState(false);

   const contentTypes = props.contentTypes.filter(contentType => contentType.name.toLowerCase().includes(searchText.toLowerCase()) && contentType.sys.id !== props.sdk.contentType.sys.id);

   const editContent = (vwoVariation) => {
      setSelectContentType(false);
      props.sdk.navigator.openEntry(vwoVariation.variables[0].value, { slideIn: { waitForClose: true } })
         .then(updatedEntry => {
            props.updateContentfulEntries(updatedEntry);
         });
   };

   const onSearchTextChange = useCallback((searchText) => {
      setSearchText(searchText);
   }, []);

   const removeContent = useCallback((vwoVariation) => {
      if (vwoVariation.id === 1) {
         props.sdk.notifier.error('Default variation content cannot be removed');
         return;
      }
      const meta = props.sdk.entry.fields.meta.getValue() || {};
      if (vwoVariation) {
         delete meta[vwoVariation.id];
         props.sdk.entry.fields.meta.setValue(meta);
         props.updateVwoVariationContent(vwoVariation, '', false);
      }
   }, [props]);

   const onContentTypeClick = useCallback(async (contentType) => {
      if (processing) {
         return;
      }
      setProcessing(true);
      await props.onCreateVariationEntry(props.variation.vwoVariation, contentType);
      setProcessing(false);
      setSelectContentType(false);
   }, [processing, props]);

   const setInitialData = () => {
      setSearchText('');
   };

   useEffect(() => {
      setInitialData();
   },[]);

   const isContentAdded = props.variation.variationContent;

   return (
      <React.Fragment>
         <Modal isShown={selectContentType} onClose={() => setSelectContentType(false)} className={styles.modal}>
         {() => (
               <>
                  <Modal.Header
                     title="Select content type"
                     onClose={() => setSelectContentType(false)}
                  />
                  <Modal.Content>
                     <TextInput
                        icon={<SearchIcon />}
                        value={searchText}
                        placeholder="Search content type"
                        onChange={(e) => onSearchTextChange(e.target.value)}
                        />
                     {!contentTypes.length && <Flex className={styles.emptyResults} alignItems='center' justifyContent='center'>No results found</Flex>}
                     <List className={styles.menuList}>
                        {contentTypes.map(contentType => {
                           return <List.Item className={styles.listItem} key={contentType.sys.id} onClick={() => onContentTypeClick(contentType)}>{contentType.name}</List.Item>
                        })}
                     </List>
                  </Modal.Content>
               </>
         )}
         </Modal>
         {!isContentAdded && <ButtonGroup variant='spaced'>
            <Button variant="secondary" size="small" onClick={() => setSelectContentType(true)}>
               Create entry and link
            </Button>
            <Button variant="secondary" size="small" onClick={() => props.linkExistingEntry(props.variation.vwoVariation)}>
              Link an existing entry
            </Button>
         </ButtonGroup>}
         {isContentAdded && <EntryCard 
            status={props.variation.variationContent.status}
            contentType={props.variation.variationContent.contentType}
            title={props.variation.variationContent.title}
            description={props.variation.variationContent.description}
            onClick={() => editContent(props.variation.vwoVariation)}
            actions={[
               <MenuItem key='edit' onClick={() => editContent(props.variation.vwoVariation)}>Edit</MenuItem>,
               <MenuItem key='remove' onClick={() => removeContent(props.variation.vwoVariation)} isDisabled={props.variation.vwoVariation.id === 1}>Remove</MenuItem>,
            ]}/>}
      </React.Fragment>
   )
}

export default CreateContent;
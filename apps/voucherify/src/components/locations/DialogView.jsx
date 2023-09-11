import React, { useEffect, useState } from 'react';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { Button, Modal, Flex, Radio, Pagination, Text, TextLink } from '@contentful/f36-components';
import { fetchUnlinkedResources } from '../../api/fetchResources';
import { linkEntryToResource } from '../../api/updateResource';
import SearchForm from '../SearchForm';
import { ITEMS_PER_PAGE } from '../../contentful-constants';
import { ExternalLinkIcon } from '@contentful/f36-icons';

const DialogView = () => {
  const sdk = useSDK();
  const { appId, secretKey, customURL } = sdk.parameters.installation.credentials;
  const [selectedResourceId, setSelectedResourceId] = useState();
  const [currentItems, setCurrentItems] = useState([]);
  const [page, setPage] = useState(0);
  const [totalItems, setTotalItems] = useState();
  const [searchedResourceName, setSearchedResourceName] = useState('');
  const {
    id: entryId,
    contentType: {
      sys: { id: contentType },
    },
  } = sdk.parameters.invocation.entrySys;
  const resourceType = sdk.parameters.invocation.resourceType;
  useAutoResizer();

  useEffect(() => {
    (async () => {
      try {
        const unlinkedResources = await fetchUnlinkedResources({
          entryId,
          page: page + 1,
          appId,
          secretKey,
          customURL,
          searchQuery: searchedResourceName,
          resourceType,
        });
        setCurrentItems(unlinkedResources.data);
        setTotalItems(unlinkedResources.total);
      } catch (error) {
        sdk.notifier.error(error.message);
      }
    })();
  }, [page, searchedResourceName, appId, secretKey, customURL, entryId, resourceType, sdk.notifier]);
  const handleResourceSelect = (resourceId) => {
    setSelectedResourceId(resourceId);
  };
  const linkResource = async () => {
    try {
      const response = await linkEntryToResource({ resourceId: selectedResourceId, entryId, contentType, appId, secretKey, customURL, resourceType });
      sdk.notifier.success(`Successfully linked entry with id: ${entryId} to resource with id: ${selectedResourceId}`);
      sdk.close({ action: 'added', success: response.data.success, resource: currentItems.find((resource) => resource.id === selectedResourceId) });
    } catch (error) {
      sdk.notifier.error(error.message);
    }
  };

  const searchForResourceName = (name) => {
    setSearchedResourceName(name);
    setPage(0);
  };

  return (
    <Flex flexDirection="column">
      <Modal.Header title="Link new resource" onClose={() => sdk.close({ action: 'cancel' })} />

      <Modal.Content style={{ minHeight: '400px', minWidth: '500px' }}>
        {<SearchForm searchForResourceName={searchForResourceName} />}
        {currentItems.length > 0 ? (
          <Radio.Group
            onChange={(e) => {
              handleResourceSelect(e.target.value);
            }}
            value={selectedResourceId}>
            {currentItems.map((resource) => (
              <Radio key={resource.id} value={resource.id} isDisabled={!resource.isEditable}>
                <span>
                  {resource.name ? resource.name : resource.id} {!resource.isEditable && '(Locked)'}
                </span>
                <TextLink
                  style={{ paddingLeft: '5px' }}
                  icon={<ExternalLinkIcon />}
                  alignIcon="start"
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"></TextLink>
              </Radio>
            ))}
          </Radio.Group>
        ) : (
          <Text fontSize="fontSizeL">No resources found</Text>
        )}
      </Modal.Content>
      <Modal.Controls>
        {currentItems.length > 0 && <Pagination activePage={page} totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPage} />}
        <Button size="small" variant="transparent" onClick={() => sdk.close({ action: 'cancel' })}>
          Close
        </Button>
        <Button size="small" variant="positive" isDisabled={!selectedResourceId} onClick={linkResource}>
          Link
        </Button>
      </Modal.Controls>
    </Flex>
  );
};
export default DialogView;

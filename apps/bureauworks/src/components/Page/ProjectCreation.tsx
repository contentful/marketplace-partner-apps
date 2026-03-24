import React, { useEffect, useState } from 'react';

import { ContentType, PageAppSDK } from '@contentful/app-sdk';
import { Heading, Switch, Grid, TextInput, Badge, SectionHeading, Button, Collapse, Paragraph, Pagination, Flex, Box, Notification } from '@contentful/f36-components';
import { PlusIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';
import { Image } from '@contentful/f36-image';

import EntriesList from './EntriesList';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';

import BwxCreateProject from '../BwxCreateProject';
import MultiselectSearchContentType from './MultiselectContentType';
import MultiselectTags from './MultiselectTags';

interface ProjectCreationProps {
  contentTypes: ContentType[];
}

interface CollectionsState {
  total: number | null;
  items: any[] | null;
}

const ENTRIES_LIMIT = 50;

export default function ProjectCreation({ contentTypes }: ProjectCreationProps) {
  const sdk = useSDK<PageAppSDK>();
  const cma = useCMA();
  
  const [data, setData] = useState<CollectionsState>({ total: 0, items: [] });
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [querySearch, setQuerySearch] = useState<string>('');
  const [contentTypeSearch, setContentTypeSearch] = useState<string>('');
  const [tagsSearch, setTagsSearch] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [createdByMe, setCreatedByMe] = useState<boolean>(false);
  const [expandedEntries, setExpandedEntries] = useState<Record<string, any[]>>({});
  const [selectedReferences, setSelectedReferences] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const params: any = { 
        query: { 
          'order': '-sys.updatedAt', 
          'skip': page*itemsPerPage, 
          'limit': itemsPerPage
        }
      }
      
      if (querySearch) {
        params.query['query'] = querySearch
      }
      
      if (contentTypeSearch) {
        params.query['sys.contentType.sys.id[in]'] = contentTypeSearch
      }

      if (tagsSearch) {
        params.query['metadata.tags.sys.id[in]'] = tagsSearch
      }

      if (createdByMe) {
        params.query['sys.createdBy.sys.id'] = sdk.user.sys.id
      }
      
      const resp: any = await cma.entry
        .getMany(params)
        .then((resp) => resp)
        .catch(() => ({ total: 0, items: [] }));
    
      setData({ total: resp.total, items: resp.items });
    }

    const debounce = setTimeout(() => {
      fetchData();
    }, 500);

    return () => clearTimeout(debounce);    
  }, [page, itemsPerPage, createdByMe, querySearch, contentTypeSearch, tagsSearch, cma.entry, sdk.user.sys.id])

  const createdProject = () => {
    Notification.setPlacement('top');
    Notification.success('Project successfully created. Check it out in the "List Projects" tab.', { title: 'Project Created', duration: 20000 });
    setIsExpanded(false);
    setSelectedEntries([]);
    setSelectedReferences([]);
  };

  const handleViewPerPageChange = (i: React.SetStateAction<number>) => {
    setPage(Math.floor((itemsPerPage * page + 1) / Number(i)));
    setItemsPerPage(i);
  };

  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const onSelected = async (entryIds: string[] | string) => {
    const updatedSelectedEntries = Array.isArray(entryIds)
      ? entryIds
      : selectedEntries.includes(entryIds)
      ? selectedEntries.filter((id) => id !== entryIds)
      : [...selectedEntries, entryIds]
  
    if (updatedSelectedEntries.length > ENTRIES_LIMIT) {
      Notification.warning(`The maximum limit of ${ENTRIES_LIMIT} entries per project has been reached.`)
      return
    }
  
    setSelectedEntries(updatedSelectedEntries);
  
    if (!Array.isArray(entryIds)) {
      const references = await fetchReferences(entryIds)
      const referenceIds = references.map((ref) => ref.sys.id)
      setSelectedReferences((prev) => Array.from(new Set([...prev, ...referenceIds])))
    }
  };

  const fetchReferences = async (entryId: string) => {
    try {
      const response = await cma.entry.references({
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        entryId,
        include: 1
      });
  
      const references = response.includes?.Entry?.filter((entry) => entry.fields) || []
      const referenceIds = references.map((ref) => ref.sys.id)
      
      setSelectedReferences((prev) => Array.from(new Set([...prev, ...referenceIds])))
      return references;
    } catch (error) {
      return []
    }
  };

  const onSelectedReferences = (referenceIds: string[] | string) => {
    const updatedSelectedReferences = Array.isArray(referenceIds)
      ? referenceIds
      : selectedReferences.includes(referenceIds)
      ? selectedReferences.filter((id) => id !== referenceIds)
      : [...selectedReferences, referenceIds]
  
      setSelectedReferences(Array.from(new Set(updatedSelectedReferences)))
  };

  const handleToggleExpand = async (entryId: string) => {
    if (expandedEntries[entryId]) {
      setExpandedEntries((prev) => {
        const { [entryId]: _, ...rest } = prev
        return rest
      })
    } else {
      const references = expandedEntries[entryId] || await fetchReferences(entryId)
      setExpandedEntries((prev) => ({ ...prev, [entryId]: references }))
    }
  };  

  const prepareProjectEntries = () => {
    const allEntryIDs = new Set<string>();

    selectedEntries.forEach((entryId) => allEntryIDs.add(entryId))
    selectedReferences.forEach((refId) => allEntryIDs.add(refId))
    return Array.from(allEntryIDs);
  };  

  return (
    <Flex flexDirection="column" marginTop="spacingXl">
      <Image
        alt='Bureau Works Logo"'
        height="100px"
        width="230px"
        src="https://cdn.prod.website-files.com/65a6d693980f7ac91c0d37a3/662bd7d53082cccc4ae5590d_Logo%20Bureau%20Works.svg"
      />

      <Button isDisabled={!selectedEntries.length} variant="primary" onClick={() => setIsExpanded(!isExpanded) } startIcon={<PlusIcon />} endIcon={!isExpanded ? <ChevronDownIcon /> : <ChevronUpIcon />}>Create New Project</Button>
      
      <Collapse style={{ maxWidth: '500px' }} isExpanded={isExpanded}>
        <br />
        {isExpanded && (
          <BwxCreateProject
            onCreate={createdProject}
            withName
            bulk
            entryIds={prepareProjectEntries()}
          />
        )}
      </Collapse>

      <Box marginTop="spacingXl">
        <Heading as="h2">Select the entries you wish to translate with Bureau Works</Heading>
        <Paragraph>Note that the maximum number of entries per project is 50.</Paragraph>
        
        {selectedEntries.length ? (
        <SectionHeading marginBottom="spacingS">
          Total selected: <Badge variant="featured">{selectedEntries.length}</Badge>
        </SectionHeading>) : <></>}

        <Grid columns="2fr 0.5fr 1fr" columnGap="spacingM" rowGap="spacingXs" alignContent="stretch">
          <TextInput
            icon={<SearchIcon />}
            size="medium"
            placeholder="Type to search for entries"
            onChange={(e) => setQuerySearch(e.target.value)}
          />
          
          <MultiselectTags onSelect={setTagsSearch}/>
          
          <MultiselectSearchContentType contentTypes={contentTypes} onSelect={setContentTypeSearch}/>
          
          <Switch
            name="filter-created-by-me"
            id="filter-created-by-me"
            isChecked={createdByMe}
            size="small"
            onChange={() => setCreatedByMe((prevState) => !prevState)}
          >
            Created by me
          </Switch>
        </Grid>

        <EntriesList
          contentTypes={contentTypes}
          entries={data.items || []}
          onClickItem={(entryId) => sdk.navigator.openEntry(entryId, { slideIn: true })}
          selectedItems={selectedEntries}
          onSelected={onSelected}
          expandedItems={expandedEntries}
          onExpand={handleToggleExpand}
          selectedReferences={selectedReferences} 
          onSelectedReferences={onSelectedReferences}
          isCreateProject={true}
        />
        
        <br></br>
        
        <Pagination
          activePage={page}
          onPageChange={setPage}
          totalItems={data.total || 0}
          showViewPerPage
          viewPerPageOptions={[20, 50, 100]}
          itemsPerPage={itemsPerPage}
          onViewPerPageChange={handleViewPerPageChange}
        />
      </Box>
    </Flex>
  );
}
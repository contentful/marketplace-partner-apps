import { useEffect, useRef, useState } from 'react';

import { useSDK } from '@contentful/react-apps-toolkit';
import { Select, Button, Tooltip } from '@contentful/f36-components';
import { EmbeddedEntryInlineIcon, MoreHorizontalIcon } from '@contentful/f36-icons'

import { getContentSchemas } from '../api';

import { ConceptSchema } from '../types/ConceptSchema';

import useStore from '../store/store';
import { linkTaxonomyConceptSchema, linkTaxonomyManager } from '../helpers';

export function Header() {
  const sdk = useSDK();
  const selectRef = useRef<any>();

  const setSelectedSchema = useStore((s) => s.setSelectedSchema);
  const selectedSchema = useStore((s) => s.selectedSchema);
  const client = useStore((s) => s.client);

  const [conceptSchemas, setConceptSchemas] = useState<ConceptSchema[]>([]);

  const handleOnChange = (event: any) => {
    const newSchema = conceptSchemas.find(schema => schema.id === event.target.value);
    if (newSchema)
      setSelectedSchema(newSchema)
  };

  useEffect(() => {
    if (conceptSchemas.length > 0) {
      if (!selectedSchema)
        setSelectedSchema(conceptSchemas[0])
    }
  }, [conceptSchemas])

  useEffect(() => {
    const fetchSchemas = async () => {
      if (!client) return;

      const schemas = await getContentSchemas(client);

      setConceptSchemas(schemas);
    }

    fetchSchemas()
  }, [client]);

  return (
    <div className='flex flew-col w-full bg-white drop-shadow-sm p-6 py-4 mb-0 border-b border-t border-solid border-gray-200 gap-4 items-center'>
      <div className='flex gap-2 items-center w-full'>
        <Select
          id='schemas'
          name='schemas'
          value={selectedSchema?.id}
          onChange={handleOnChange}
          className='min-w-[230px]'
          ref={selectRef}
        >
          {conceptSchemas.map((schema: ConceptSchema) => (
            <Select.Option value={schema.id} key={schema.id}>{schema.label}</Select.Option>
          ))}
        </Select>

        <Tooltip placement="bottom" id="schemaLink" content="Open schema in manager">
          <Button as='a' href={linkTaxonomyConceptSchema(sdk.ids.organization, selectedSchema?.id)} target='_blank'>
            <EmbeddedEntryInlineIcon variant='secondary' />
          </Button>
        </Tooltip>

        <div className='ml-auto'>
          <Tooltip placement="left" id="schemaLink" content="Open Taxonomy manager">
            <Button as='a' href={linkTaxonomyManager(sdk.ids.organization)} target='_blank'>
              <MoreHorizontalIcon variant='secondary' />
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
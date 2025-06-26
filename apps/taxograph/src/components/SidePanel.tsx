import { useEffect, useState } from 'react';

import { Box, Subheading, Menu, MenuItem, TextInput } from '@contentful/f36-components';
import { SearchIcon } from '@contentful/f36-icons';

import { getContentSchemas } from '../api';

import { ConceptSchema } from '../types/ConceptSchema';

import useStore from '../store/store';

export function SidePanel() {
  const setSelectedSchema = useStore((s) => s.setSelectedSchema);
  const selectedSchema = useStore((s) => s.selectedSchema);
  const client = useStore((s) => s.client);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSchemas, setfilteredSchemas] = useState<ConceptSchema[]>([]);
  const [conceptSchemas, setConceptSchemas] = useState<ConceptSchema[]>([]);

  useEffect(() => {
    if (conceptSchemas.length > 0) {
      if (!selectedSchema)
        setSelectedSchema(conceptSchemas[0])
    }
  }, [conceptSchemas])

  useEffect(() => {
    if (conceptSchemas.length > 0) {
      if (searchQuery.trim() === '') {
        setfilteredSchemas(conceptSchemas);
      } else {
        setfilteredSchemas(
          conceptSchemas.filter((schema: ConceptSchema) =>
            schema.label.includes(searchQuery.toLowerCase())
          )
        );
      }
    }
  }, [searchQuery, conceptSchemas]);

  useEffect(() => {
    const fetchSchemas = async () => {
      if (!client) return;

      const schemas = await getContentSchemas(client);

      setConceptSchemas(schemas);
    }

    fetchSchemas()
  }, [client]);

  return (
    <div className='p-4 bg-white w-[300px] border-r border-solid border-gray-200'>

      <div className="row flex w-auto justify-center">
        <button
          className="rounded rounded-r-none py-2 px-4 border-gray-200 border text-center text-xs opacity-50 cursor-not-allowed hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50 font-semibold"
          type="button"
        >
          Content
        </button>
        <button
          className="rounded-none py-2 px-4 text-center text-xs border border-gray-300 text-gray-600 bg-gray-50 font-semibold"
          type="button"
        >
          Taxonomy
        </button>
        <button
          className="rounded rounded-l-none py-2 px-4 border-gray-200 border text-center text-xs opacity-50 cursor-not-allowed hover:border-gray-300 hover:text-gray-600 hover:bg-gray-50 font-semibold"
          type="button"
        >
          Workflows
        </button>
      </div>

      <Box
        as="aside"
      >
        <Box style={{ marginBottom: '16px', padding: '12px' }}>
          <TextInput
            placeholder="Search schemas"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<SearchIcon />}
            style={{
              width: '100%',
              border: '1px solid #d3dce0',
              borderRadius: '4px',
              paddingLeft: '32px'
            }}
          />

          <Subheading
            style={{
              marginTop: '15px',
              marginBottom: '5px',
              marginLeft: '5px',
              fontSize: '11px',
              textTransform: 'uppercase'
            }}
          >
            Schemas
          </Subheading>

          <Menu>
            {
              filteredSchemas.length > 0 ? (
                filteredSchemas.map((schema: ConceptSchema, index: number) => (
                  <MenuItem
                    onClick={() => setSelectedSchema(schema)}
                    isActive={selectedSchema?.id === schema.id}
                    key={index}>{schema.label}</MenuItem>
                ))
              ) : (
                <MenuItem isDisabled>No results found</MenuItem>
              )
            }
          </Menu>
        </Box>
      </Box>
    </div>
  )
}
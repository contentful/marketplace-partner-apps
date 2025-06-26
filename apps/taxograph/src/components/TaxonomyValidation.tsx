import { Multiselect } from '@contentful/f36-multiselect';

import { HelpCircleIcon, WarningIcon } from '@contentful/f36-icons'

import { ConceptSchema } from '../types/ConceptSchema';
import { linkTaxonomyManager } from '../helpers/taxonomyDeepLinks';

interface TaxonomyValidationProps {
  schemas: ConceptSchema[]
  selectedSchemas: string[]
  setSelectedSchemas: any
  orgId: string
}

export function TaxonomyValidation({ schemas, selectedSchemas, setSelectedSchemas, orgId }: TaxonomyValidationProps) {

  const handleSelectItem = (event: any) => {
    const { checked, value } = event.target;

    if (checked) {
      setSelectedSchemas((prevState: any) => [...prevState, value]);
    } else {
      const newSelectedSpaces = selectedSchemas.filter(
        (space) => space !== value,
      );
      setSelectedSchemas(newSelectedSpaces);
    }
  };

  return (
    <>
      <div className='flex items-center text-3xl font-semibold'>
        Taxonomy validations
        <a href='https://www.contentful.com/help/taxonomy/application-of-taxonomy/taxonomy-content-type-validations/?utm_source=webapp&utm_medium=knowledge-base-taxonomyValidations&utm_campaign=in-app-help'
          className='flex items-center ml-2 mt-1.5'
          target='_blank'>
          <HelpCircleIcon variant="secondary" />
        </a>
      </div>
      <div className='text-sm my-4'>By default, concepts cannot be assigned to entries. Instead, one or more hierarchies of concepts (represented by concept schemes, or subconcepts of specific concepts) must first be assigned to the content type. This assignment functionality is called taxonomy validations. Once taxonomy validations are implemented, entries can then be allowed the use of concepts within the hierarchies assigned to their content type.</div>
      <div className="flex items-center text-base gap-2 mt-14">
        Select the schemas you want to assign to your content types:
        <div className='items-center flex gap-2 justify-end min-w-[240px]'>
          <Multiselect
            placeholder='Select one or more schemas'
            currentSelection={selectedSchemas.map(id => schemas.find(schema => schema.id === id)?.label || 'default')}
            popoverProps={{ isFullWidth: true }}
          >
            {schemas.map((schema: ConceptSchema) => {
              return (
                <Multiselect.Option
                  key={schema.id}
                  itemId={schema.id}
                  value={schema.id}
                  label={schema.label}
                  onSelectItem={handleSelectItem}
                  isChecked={selectedSchemas.includes(schema.id)}
                />
              );
            })}
          </Multiselect>
        </div>
        {schemas.length === 0 &&
          <div className='flex gap-1 items-center text-sky-600 ml-2'>
            <WarningIcon variant='secondary' className='!fill-sky-600' />
            <div className='text-sm'>
              Please add your taxonomy schemas in the <a href={linkTaxonomyManager(orgId)} target='_blank' className='underline'>Taxonomy Manager</a>.
            </div>
          </div>
        }
      </div>
    </>
  )
}
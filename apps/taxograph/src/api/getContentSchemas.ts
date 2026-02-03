import { ContentfulClientApi } from 'contentful';
import { ConceptSchema } from '../types/ConceptSchema';

export async function getContentSchemas(client: ContentfulClientApi<any>): Promise<ConceptSchema[]> {
  try {
    const { items } = await client.getConceptSchemes()

    return items.map((item: any) => {
      return {
        label: item.prefLabel['en-US'],
        id: item.sys.id
      }
    });
  } catch (error) {
    console.error('Error fetching content schemas', error)
    return []
  }
}

export async function getContentSchema(client: ContentfulClientApi<any>, id: string): Promise<any | null> {
  try {
    return await client.getConceptScheme(id);
  } catch (error) {
    console.error('Error fetching content schema', error)
    return null
  }
}
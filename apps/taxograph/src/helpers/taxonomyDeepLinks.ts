export function linkTaxonomyManager(orgId: string) {
  return `https://app.contentful.com/account/organizations/${orgId}/taxonomy/concept-schemes`;
}

export function linkTaxonomyConceptSchema(orgId: string, schemaId?: string) {
  return `https://app.contentful.com/account/organizations/${orgId}/taxonomy/concept-schemes/${schemaId}/hierarchy`;
}

export function linkTaxonomyConcept(orgId: string, conceptId?: string) {
  return `https://app.contentful.com/account/organizations/${orgId}/taxonomy/concepts/${conceptId}`;
}

export function linkTaxonomyContent(spaceId: string, envId: string, conceptId?: string) {
  return `https://app.contentful.com/spaces/${spaceId}/environments/${envId}/views/entries?order.direction=descending&order.fieldId=updatedAt&filters.0.key=metadata.concepts.sys.id&filters.0.op=descendants&filters.0.val=${conceptId}`
}
// Generic utility for grouping fields by content type
export function groupFieldsByContentType<T extends { contentTypeId: string }>(fields: T[]): Record<string, T[]> {
  return fields.reduce((acc, field) => {
    if (!acc[field.contentTypeId]) {
      acc[field.contentTypeId] = [];
    }
    acc[field.contentTypeId].push(field);
    return acc;
  }, {} as Record<string, T[]>);
}

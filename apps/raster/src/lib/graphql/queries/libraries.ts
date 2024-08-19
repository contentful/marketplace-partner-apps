export const getLibraryListQuery = /* GraphQL */ `
  query Query($organizationId: String!) {
    libraries(organizationId: $organizationId) {
      id
      name
      photosCount
    }
  }
`;

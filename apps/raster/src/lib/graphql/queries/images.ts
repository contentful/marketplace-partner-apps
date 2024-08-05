export const getImagesFromLibraryQuery = /* GraphQL */ `
  query Query($organizationId: String!, $libraryId: String!) {
    photos(organizationId: $organizationId, libraryId: $libraryId) {
      id
      blurhash
      thumbUrl
      url
      name
      height
      width
      views {
        id
        parentId
        name
        url
        thumbUrl
        height
        width
      }
      description
    }
  }
`;

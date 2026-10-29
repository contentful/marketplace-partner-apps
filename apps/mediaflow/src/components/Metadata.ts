
export const UPDATABLE_FIELDS: string[] = [ // These fields are used to determine whether metadata is outdated and those fields will be refreshed only.
  "name", "description",
  "filename", "filetype", "filesize",
  "altText", "photographer", "instructions", "keywords", "customFields", "additionalInfo",
  "thumbPreview", "smallPreview", "mediumPreview"
];

export const WOBBLE_FIELDS = new Map<string, string>([ // These fields are metadata fields which are not returned (or queryable) as is by the mediaflow api.
  // E.g. GET https://api.mediaflow.com/1/file/<id>?fields=altText won't work, but ?fields=alttext will. The field is stored as altText tho, since the file selector returns this
  ["altText", "alttext"],
  ["filetype", "type.extension"],
]);

export const INTERNAL_FIELDS: string[] = [ // These fields will not be displayed to the user
  "isMediaflowAsset",
  "resourceId", // The resouce id in the Mediaflow CDN, which is used for CDN control
  "isCropped", // applies for basetype === "image" if they are cropped
];

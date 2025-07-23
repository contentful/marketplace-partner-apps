export interface EmbeddedMetadataValues {
  [key: string]:
    | string
    | number
    | boolean
    | Date
    | Array<string | number | boolean | Date>
}

export interface CmFormValues {
  [key: string]:
    | string
    | number
    | boolean
    | Date
    | Array<string | number | boolean>
    | any
} 
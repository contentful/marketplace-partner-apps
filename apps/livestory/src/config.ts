export const DEFAULT_CONTENT_TYPE_NAME = 'Live Story'
export const DEFAULT_CONTENT_TYPE_ID = 'LIVE_STORY_CONTENT_TYPE'

export const DEFAULT_API_URL = 'https://api.livestory.io'

export const DEFAULT_CONTENT_TYPE = {
    name: 'Live Story',
    description: 'Live Story Content Type',
    displayField: "title",
    fields: [
        {
            "id": "title",
            "name": "Title",
            "type": "Symbol",
            "localized": true,
            "required": true,
            "validations": [],
            "disabled": false,
            "omitted": false
        },
        {
            "id": "description",
            "name": "Description",
            "type": "Symbol",
            "localized": true,
            "required": false,
            "validations": [],
            "disabled": false,
            "omitted": false
        },
        {
            "id": "cover_img",
            "name": "Cover Image",
            "type": "Symbol",
            "localized": false,
            "required": false,
            "validations": [],
            "disabled": false,
            "omitted": false
        },
        {
            "id": "id",
            "name": "Live Story Content ID",
            "type": "Symbol",
            "localized": false,
            "required": true,
            "validations": [],
            "disabled": false,
            "omitted": false
        },
        {
            "id": "type",
            "name": "Live Story Content Type",
            "type": "Symbol",
            "localized": false,
            "required": true,
            "validations": [{"in": ["wall", "wallgroup"]}],
            "disabled": false,
            "omitted": false
        },
        {
            "id": "ssc",
            "name": "Server Side Rendering Content",
            "type": "Text",
            "localized": true,
            "required": false,
            "disabled": false,
            "omitted": false
        },
    ]
}

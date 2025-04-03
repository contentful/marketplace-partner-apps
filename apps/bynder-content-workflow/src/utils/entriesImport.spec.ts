import { describe, it, expect } from 'vitest';
import { composeEntryFieldsForCF } from './entriesImport';
import { CFFieldType } from '@/type/types';

describe('Composing CW items into contentful entries', () => {
  it('can compose HTML from CW item to a contentful entry', () => {
    const entries = composeEntryFieldsForCF([
      {
        cfId: '123',
        gcId: 'ABC',
        type: CFFieldType.RichText,
      }
    ], {
      'ABC': '<p><em>Hello</em> <strong>World</strong>!</p>'
    })

    expect(entries).toMatchInlineSnapshot(`
      {
        "assets": [],
        "components": [],
        "fields": {
          "123": {
            "en-US": {
              "content": [
                {
                  "content": [
                    {
                      "data": {},
                      "marks": [
                        {
                          "type": "italic",
                        },
                      ],
                      "nodeType": "text",
                      "value": "Hello",
                    },
                    {
                      "data": {},
                      "marks": [],
                      "nodeType": "text",
                      "value": " ",
                    },
                    {
                      "data": {},
                      "marks": [
                        {
                          "type": "bold",
                        },
                      ],
                      "nodeType": "text",
                      "value": "World",
                    },
                    {
                      "data": {},
                      "marks": [],
                      "nodeType": "text",
                      "value": "!",
                    },
                  ],
                  "data": {},
                  "nodeType": "paragraph",
                },
              ],
              "data": {},
              "nodeType": "document",
            },
          },
        },
      }
    `);
  })
})
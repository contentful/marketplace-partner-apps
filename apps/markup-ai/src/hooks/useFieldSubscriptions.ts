import { useRef, useCallback, useEffect } from 'react';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { isTextField } from '../types/content';
import { Document, Block, Inline, Text, BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';

interface TextNodeWithId {
  node: Text;
  path: number[];
  id: string;
}

const generateNodeId = (path: number[]): string => {
  return `node-${path.join('-')}`;
};

const isValidNode = (node: Block | Inline | Text): boolean => {
  if (!node || typeof node !== 'object') return false;
  if (!('nodeType' in node)) return false;
  return true;
};

const convertToHtml = (doc: Document): { html: string; nodeMap: Map<string, TextNodeWithId> } => {
  const nodeMap = new Map<string, TextNodeWithId>();
  let htmlContent = '';

  const processNode = (node: Block | Inline | Text, path: number[] = []): string => {
    if (!isValidNode(node)) {
      return '';
    }

    if (node.nodeType === 'text') {
      const id = generateNodeId(path);
      nodeMap.set(id, { node, path, id });

      // Apply marks to the text
      let text = node.value;
      if (node.marks && node.marks.length > 0) {
        node.marks.forEach((mark) => {
          switch (mark.type) {
            case MARKS.BOLD:
              text = `<strong>${text}</strong>`;
              break;
            case MARKS.ITALIC:
              text = `<em>${text}</em>`;
              break;
            case MARKS.UNDERLINE:
              text = `<u>${text}</u>`;
              break;
            case MARKS.CODE:
              text = `<code>${text}</code>`;
              break;
            case MARKS.SUPERSCRIPT:
              text = `<sup>${text}</sup>`;
              break;
            case MARKS.SUBSCRIPT:
              text = `<sub>${text}</sub>`;
              break;
            default:
              console.warn('Unknown mark type:', mark.type);
          }
        });
      }

      return `<span id="${id}">${text}</span>`;
    }

    if ('content' in node && Array.isArray(node.content)) {
      const children = node.content.map((child, index) => processNode(child, [...path, index])).join('');

      // Handle data attributes
      const dataAttrs = Object.entries(node.data || {})
        .map(([key, value]) => {
          if (key === 'target' && value?.sys) {
            return `data-${value.sys.linkType.toLowerCase()}-id="${value.sys.id}"`;
          }
          return `data-${key}="${value}"`;
        })
        .join(' ');

      switch (node.nodeType) {
        case BLOCKS.PARAGRAPH:
          return `<p ${dataAttrs}>${children}</p>`;
        case BLOCKS.HEADING_1:
          return `<h1 ${dataAttrs}>${children}</h1>`;
        case BLOCKS.HEADING_2:
          return `<h2 ${dataAttrs}>${children}</h2>`;
        case BLOCKS.HEADING_3:
          return `<h3 ${dataAttrs}>${children}</h3>`;
        case BLOCKS.HEADING_4:
          return `<h4 ${dataAttrs}>${children}</h4>`;
        case BLOCKS.HEADING_5:
          return `<h5 ${dataAttrs}>${children}</h5>`;
        case BLOCKS.HEADING_6:
          return `<h6 ${dataAttrs}>${children}</h6>`;
        case BLOCKS.OL_LIST:
          return `<ol ${dataAttrs}>${children}</ol>`;
        case BLOCKS.UL_LIST:
          return `<ul ${dataAttrs}>${children}</ul>`;
        case BLOCKS.LIST_ITEM:
          return `<li ${dataAttrs}>${children}</li>`;
        case BLOCKS.QUOTE:
          return `<blockquote ${dataAttrs}>${children}</blockquote>`;
        case BLOCKS.HR:
          return `<hr ${dataAttrs}/>`;
        case BLOCKS.TABLE:
          return `<table ${dataAttrs}>${children}</table>`;
        case BLOCKS.TABLE_ROW:
          return `<tr ${dataAttrs}>${children}</tr>`;
        case BLOCKS.TABLE_CELL:
          return `<td ${dataAttrs}>${children}</td>`;
        case BLOCKS.TABLE_HEADER_CELL:
          return `<th ${dataAttrs}>${children}</th>`;
        case BLOCKS.EMBEDDED_ENTRY:
          return `<div ${dataAttrs}>${children}</div>`;
        case BLOCKS.EMBEDDED_ASSET:
          return `<div ${dataAttrs}>${children}</div>`;
        case BLOCKS.EMBEDDED_RESOURCE:
          return `<div ${dataAttrs}>${children}</div>`;
        case INLINES.HYPERLINK:
          return `<a href="${node.data.uri || '#'}" ${dataAttrs}>${children}</a>`;
        case INLINES.ENTRY_HYPERLINK:
          return `<a href="#" ${dataAttrs}>${children}</a>`;
        case INLINES.ASSET_HYPERLINK:
          return `<a href="#" ${dataAttrs}>${children}</a>`;
        case INLINES.EMBEDDED_ENTRY:
          return `<span ${dataAttrs}>${children}</span>`;
        case INLINES.EMBEDDED_RESOURCE:
          return `<span ${dataAttrs}>${children}</span>`;
        default:
          console.warn('Unknown node type:', node.nodeType);
          return children;
      }
    }

    return '';
  };

  htmlContent = doc.content.map((block, index) => processNode(block, [index])).join('\n');
  return { html: htmlContent, nodeMap };
};

const extractTextFromRichText = (value: string | Document | null | undefined): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;

  // Handle rich text document structure
  if (typeof value === 'object' && value !== null && 'nodeType' in value && value.nodeType === BLOCKS.DOCUMENT) {
    const { html } = convertToHtml(value);
    return html;
  }

  // Fallback for any other type
  return String(value);
};

const updateNodeAtPath = (doc: Document, path: number[], newValue: string): Document => {
  const newDoc = JSON.parse(JSON.stringify(doc)) as Document;

  let current: { content: (Block | Inline | Text)[] } = newDoc;
  for (let i = 0; i < path.length - 1; i++) {
    const nextNode = current.content[path[i]];
    if (!nextNode || !('content' in nextNode)) {
      throw new Error(`Invalid path: node at index ${i} does not have content`);
    }
    current = nextNode;
  }

  const lastIndex = path[path.length - 1];
  const targetNode = current.content[lastIndex];
  if (!targetNode) {
    throw new Error(`Invalid path: no node found at index ${lastIndex}`);
  }

  if (targetNode.nodeType === 'text') {
    targetNode.value = newValue;
  } else {
    throw new Error(`Invalid node type at path: expected text node, got ${targetNode.nodeType}`);
  }

  return newDoc;
};

const createRichTextDocument = (text: string, originalDoc?: Document): Document => {
  if (!originalDoc) {
    // Create a new document if no original exists
    return {
      nodeType: BLOCKS.DOCUMENT,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          content: [
            {
              nodeType: 'text',
              value: text,
              marks: [],
              data: {},
            },
          ],
          data: {},
        },
      ],
    };
  }

  // Convert original document to HTML with unique IDs
  const { nodeMap } = convertToHtml(originalDoc);

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;

  // Update the document based on the changes
  let updatedDoc = originalDoc;

  const updatedSpans = tempDiv.querySelectorAll('span[id]');
  updatedSpans.forEach((span) => {
    const id = span.id;
    const node = nodeMap.get(id);
    if (node) {
      try {
        updatedDoc = updateNodeAtPath(updatedDoc, node.path, span.textContent || '');
      } catch (error) {
        console.error(`Error updating node ${id}:`, error);
      }
    }
  });

  return updatedDoc;
};

export const useFieldSubscriptions = (
  sdk: Pick<SidebarAppSDK, 'entry'>,
  onFieldChange: (fieldId: string, value: string) => void,
) => {
  const initialValuesRef = useRef<Set<string>>(new Set());
  const fieldTypesRef = useRef<Record<string, string>>({});
  const originalDocumentsRef = useRef<Record<string, Document>>({});
  const processedFieldsRef = useRef<Set<string>>(new Set());

  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      if (initialValuesRef.current.has(fieldId)) {
        initialValuesRef.current.delete(fieldId);
        return;
      }
      onFieldChange(fieldId, value);
    },
    [onFieldChange],
  );

  useEffect(() => {
    const subscriptions = Object.keys(sdk.entry.fields)
      .filter((fieldId) => isTextField(sdk.entry.fields[fieldId]))
      .map((fieldId) => {
        const field = sdk.entry.fields[fieldId];
        fieldTypesRef.current[fieldId] = field.type;
        initialValuesRef.current.add(fieldId);

        // Store the original document structure for rich text fields
        if (field.type === 'RichText') {
          const value = field.getValue();
          if (value && typeof value === 'object' && 'nodeType' in value && value.nodeType === BLOCKS.DOCUMENT) {
            originalDocumentsRef.current[fieldId] = value as Document;
          }
        }

        return field.onValueChanged((value) => {
          const textContent = extractTextFromRichText(value as string | Document | null | undefined);
          handleFieldChange(fieldId, textContent);
        });
      });

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe());
      initialValuesRef.current.clear();
      fieldTypesRef.current = {};
      originalDocumentsRef.current = {};
      processedFieldsRef.current.clear();
    };
  }, [sdk.entry.fields, handleFieldChange]);

  const setFieldValue = useCallback(
    async (fieldId: string, value: string) => {
      const field = sdk.entry.fields[fieldId];
      if (!field) return;

      // Skip if we've already processed this field
      if (processedFieldsRef.current.has(fieldId)) {
        return;
      }

      const fieldType = fieldTypesRef.current[fieldId];
      if (fieldType === 'RichText') {
        const originalDoc = originalDocumentsRef.current[fieldId];
        const richTextDoc = createRichTextDocument(value, originalDoc);
        await field.setValue(richTextDoc);
        processedFieldsRef.current.add(fieldId);
      } else {
        await field.setValue(value);
        processedFieldsRef.current.add(fieldId);
      }
    },
    [sdk.entry.fields],
  );

  return {
    isInitialValue: (fieldId: string) => initialValuesRef.current.has(fieldId),
    setFieldValue,
  };
};

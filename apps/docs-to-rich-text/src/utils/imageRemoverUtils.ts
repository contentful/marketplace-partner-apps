import { BLOCKS, Document } from '@contentful/rich-text-types';
import { BaseAppSDK } from '@contentful/app-sdk';
import { EmbeddedAsset } from '../types';
import _ from 'lodash';

export function removeImagesFromDocument(sdk: BaseAppSDK, document: Document, images: EmbeddedAsset[]): Document {
  let resultDocument = _.cloneDeep(document);
  for (const image of images) {
    const idToRemove = sdk.parameters.installation.useImageWrapper ? image.contentWrapperId! : image.assetId;
    resultDocument = removeImageFromDocument(resultDocument, idToRemove);
  }
  return resultDocument;
}

function removeImageFromDocument(document: Document, id: string): Document {
  const localDocument = _.cloneDeep(document);

  for (const node of localDocument.content) {
    if (shouldRemoveNode(node, id)) {
      const index = localDocument.content.indexOf(node);
      localDocument.content.splice(index, 1);
      return localDocument;
    }
    removeImageFromChildNodes(node, id);
  }
  return localDocument;
}

function removeImageFromChildNodes(node: any, id: string) {
  if (!Object.hasOwn(node, 'content')) {
    return;
  }
  for (const child of node.content) {
    if (shouldRemoveNode(node, id)) {
      const index = node.content.indexOf(child);
      node.content.splice(index, 1);
    }
    removeImageFromChildNodes(child, id);
  }
  return node;
}

function shouldRemoveNode(node: any, id: string) {
  return (node.nodeType === BLOCKS.EMBEDDED_ASSET || node.nodeType === BLOCKS.EMBEDDED_ENTRY) && node.data.target.sys.id === id;
}

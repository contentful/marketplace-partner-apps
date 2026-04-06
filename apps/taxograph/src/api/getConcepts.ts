import { ContentfulClientApi } from "contentful";

import { getOutgoers } from "@xyflow/react";

import { ConceptSchema } from "../types/ConceptSchema";
import { Concept } from "../types/Concept";
import { FlowData, FlowNode, FlowEdge, EntitreeFlexTreeData } from "../types";

export async function getConcept(
  client: ContentfulClientApi<any>,
  id: string
): Promise<any> {
  return await client.getConcept(id);
}

export async function getConceptsMeta(
  client: any,
  ids: string[]
): Promise<Concept[]> {
  const { items } = await client.getConcepts({
    limit: 1000,
  });

  return items
    .filter((item: any) => ids.includes(item.sys.id))
    .map((item: any) => {
      return {
        label: item.prefLabel["en-US"],
        id: item.sys.id,
        parents: item.broader?.map((parent: any) => parent.sys.id) || [],
        children: [],
      };
    });
}

export async function getConceptNodesForSchema(
  client: ContentfulClientApi<any>,
  schema: ConceptSchema
): Promise<FlowData> {
  const { items } = await client.getConcepts({
    //@ts-ignore
    conceptScheme: schema.id,
  });

  const schemaNode: FlowNode = {
    id: schema.id,
    data: {
      label: schema.label,
      parents: [],
      hasChildren: true,
    },
    type: "treeNode",
    hidden: false,
    draggable: false,
    position: { x: 0, y: 0 },
  };

  const initialNodes: FlowNode[] = [
    schemaNode,
    ...items.map((item: any) => ({
      id: item.sys.id,
      data: {
        label: item.prefLabel["en-US"],
        parents:
          item.broader?.length > 0
            ? item.broader.map((parent: any) => parent.sys.id)
            : [schema.id],
        hasChildren: false,
      },
      type: "treeNode",
      hidden: false,
      position: { x: 0, y: 0 },
    })),
  ];

  const initialEdges: FlowEdge[] = [];

  initialNodes.forEach((node: FlowNode) => {
    node.data.parents?.forEach((parentId) => {
      initialEdges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
        hidden: false,
        animated: false,
        type: "step",
      });
    });
  });

  initialNodes.forEach((node: FlowNode) => {
    node.data.hasChildren =
      getOutgoers(node, initialNodes, initialEdges).length > 0;
  });

  return {
    initialNodes,
    initialEdges,
  };
}

export async function getConceptEntitreeFlexTreeData(
  client: ContentfulClientApi<any>,
  schema: ConceptSchema
): Promise<EntitreeFlexTreeData> {
  const { items } = await client.getConcepts({
    //@ts-ignore
    conceptScheme: schema.id,
  });

  const assignedChildren = new Set<string>();

  const treeData: EntitreeFlexTreeData = {
    [schema.id]: {
      id: schema.id,
      name: schema.label,
      children: [],
      type: "input",
      isSpouse: false,
      isSibling: false,
    },
  };

  items.forEach((item: any) => {
    treeData[item.sys.id] = {
      id: item.sys.id,
      name: item.prefLabel["en-US"],
      children: [],
      isSpouse: false,
      isSibling: false,
    };
  });

  items.forEach((item: any) => {
    const currentNode = treeData[item.sys.id];

    if (!item.broader || item.broader.length === 0) {
      if (!assignedChildren.has(item.sys.id)) {
        treeData[schema.id]?.children?.push(item.sys.id);
        assignedChildren.add(item.sys.id);
      }
      currentNode.parents = [schema.id];
    } else {
      currentNode.parents = [];
      const firstParent = item.broader[0];

      if (!assignedChildren.has(item.sys.id) && treeData[firstParent.sys.id]) {
        treeData[firstParent.sys.id]?.children?.push(item.sys.id);
        assignedChildren.add(item.sys.id);
      }

      const siblings = items.filter(
        (other: any) =>
          other.sys.id !== item.sys.id &&
          other.broader?.[0]?.sys.id === firstParent.sys.id
      );

      siblings.forEach((sibling: any) => {
        if (treeData[sibling.sys.id]) {
          treeData[sibling.sys.id].isSibling = true;
          currentNode.isSibling = true;
        }
      });

      item.broader.forEach((parent: any) => {
        if (treeData[parent.sys.id]) {
          currentNode.parents?.push(parent.sys.id);
        }
      });
    }

    if (item.related?.length > 0) {
      item.related.forEach((related: any) => {
        if (treeData[related.sys.id]) {
          treeData[related.sys.id].isSpouse = true;
          currentNode.isSpouse = true;
        }
      });
    }
  });

  Object.values(treeData).forEach((node) => {
    if (node.children) {
      node.children = Array.from(node.children);
    }
  });

  return treeData;
}

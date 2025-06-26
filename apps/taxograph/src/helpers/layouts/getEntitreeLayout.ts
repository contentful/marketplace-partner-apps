import { Position } from '@xyflow/react';
import { layoutFromMap } from 'entitree-flex';

import { config } from '../../config';

const nodeWidth = config.node.width;
const nodeHeight = config.node.height;

const Orientation = {
  Vertical: 'vertical',
  Horizontal: 'horizontal',
};

const entitreeSettings = {
  clone: true, // returns a copy of the input, if your application does not allow editing the original object
  enableFlex: true, // has slightly better perfomance if turned off (node.width, node.height will not be read)
  firstDegreeSpacing: 50, // spacing in px between nodes belonging to the same source, eg children with same parent
  nextAfterAccessor: 'spouses', // the side node prop used to go sideways, AFTER the current node
  nextAfterSpacing: 50, // the spacing of the "side" nodes AFTER the current node
  nextBeforeAccessor: 'siblings', // the side node prop used to go sideways, BEFORE the current node
  nextBeforeSpacing: 50, // the spacing of the "side" nodes BEFORE the current node
  nodeHeight, // default node height in px
  nodeWidth, // default node width in px
  orientation: Orientation.Vertical, // "vertical" to see parents top and children bottom, "horizontal" to see parents left and
  rootX: 0, // set root position if other than 0
  rootY: 0, // set root position if other than 0
  secondDegreeSpacing: 50, // spacing in px between nodes not belonging to same parent eg "cousin" nodes
  sourcesAccessor: 'parents', // the prop used as the array of ancestors ids
  sourceTargetSpacing: 50, // the "vertical" spacing between nodes in vertical orientation, horizontal otherwise
  targetsAccessor: 'children', // the prop used as the array of children ids
};

const { Top, Bottom, Left, Right } = Position;

export const getEntitreeLayout = (tree: any, direction = 'TB', rootId: string) => {
  const isTreeHorizontal = direction === 'LR';
  const { nodes: entitreeNodes, rels: entitreeEdges } = layoutFromMap(
    rootId,
    tree,
    {
      ...entitreeSettings,
      //@ts-ignore
      orientation: isTreeHorizontal ? Orientation.Horizontal : Orientation.Vertical,
      nodeWidth: isTreeHorizontal ? config.node.lrWidth : config.node.width,
      nodeHeight: isTreeHorizontal ? config.node.lrHeight : config.node.height,
    },
  );

  const nodes: any = [],
    edges: any = [];

  entitreeEdges.forEach((edge: any) => {
    const sourceNode = edge.source.id;
    const targetNode = edge.target.id;
    const sourceData = tree[sourceNode];
    const targetData = tree[targetNode];

    const newEdge: any = {
      id: `${sourceNode}->${targetNode}`,
      source: sourceNode,
      target: targetNode,
      hidden: false,
      animated: false,
      type: 'step'
    };

    edges.push(newEdge);
  });

  entitreeNodes.forEach((node: any) => {
    const newNode: any = {};

    const isSpouse = !!node?.isSpouse;
    const isSibling = !!node?.isSibling;
    const isRoot = node?.id === rootId;

    if (isSpouse) {
      newNode.sourcePosition = isTreeHorizontal ? Bottom : Right;
      newNode.targetPosition = isTreeHorizontal ? Top : Left;
    } else if (isSibling) {
      newNode.sourcePosition = isTreeHorizontal ? Top : Left;
      newNode.targetPosition = isTreeHorizontal ? Bottom : Right;
    } else {
      newNode.sourcePosition = isTreeHorizontal ? Right : Bottom;
      newNode.targetPosition = isTreeHorizontal ? Left : Top;
    }

    newNode.data = { label: node.name, direction, isRoot, ...node };
    newNode.id = node.id;
    newNode.type = 'treeNode';

    /*newNode.width = nodeWidth;
    newNode.height = nodeHeight;*/

    newNode.position = {
      x: node.x,
      y: node.y,
    };

    nodes.push(newNode);
  });

  return { nodes, edges };
};
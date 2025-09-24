import {
  Node,
  Edge,
  Position
} from '@xyflow/react';

import dagre from '@dagrejs/dagre';

import { config } from '../../config';
import { FlowDirection } from '../../types/Flow';

export const getDagreLayout = (nodes: Node[], edges: Edge[], direction: FlowDirection = FlowDirection.TB) => {

  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === FlowDirection.LR;

  const width = direction === FlowDirection.LR ? config.node.lrWidth : config.node.width
  const height = direction === FlowDirection.LR ? config.node.lrHeight : config.node.height

  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: width, height: height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,

      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,

      position: {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y
      }
    };

    newNode.data.direction = direction;

    return newNode;
  });

  return { nodes: newNodes, edges };
};
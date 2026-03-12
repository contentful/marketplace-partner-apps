import { create } from 'zustand';

import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
} from '@xyflow/react';

import { getConceptNodesForSchema, getConceptEntitreeFlexTreeData } from '../api';

import { getDagreLayout, getEntitreeLayout } from '../helpers';

import { AppState, FlowDirection, FlowLayout } from '../types';

const useStore = create<AppState>((set, get) => ({
  client: null,

  nodes: [],
  edges: [],

  layout: FlowLayout.Enti,
  direction: FlowDirection.TB,

  selectedNode: null,
  selectedSchema: null,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  setClient: (client: any) => {
    set({ client });
  },

  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },

  setEdges: (edges: Edge[]) => {
    set({ edges });
  },

  setDirection: (direction) => {
    set({ direction });
  },

  setLayout: (layout) => {
    set({ layout });
  },

  setSelectedSchema(schema) {
    set({ selectedSchema: schema });
  },

  setSelectedNode(nodeId) {
    if (!nodeId) {
      set({ selectedNode: null });
      return;
    }

    const node = get().nodes.find((node) => node.id === nodeId);
    set({ selectedNode: node || null });
  },

  async updateLayout(fitView: any) {
    const client = get().client
    const selectedSchema = get().selectedSchema

    if (!client || !selectedSchema) return;

    switch (get().layout) {
      case FlowLayout.Dagre: {
        const { initialNodes, initialEdges } = await getConceptNodesForSchema(client, selectedSchema);
        const { nodes: layoutedNodes, edges: layoutedEdges } = getDagreLayout(
          initialNodes,
          initialEdges,
          get().direction
        );

        set({
          edges: layoutedEdges,
          nodes: layoutedNodes,
        });

        fitView(layoutedNodes);

        break;
      } case FlowLayout.Enti: {
        const tree = await getConceptEntitreeFlexTreeData(client, selectedSchema);
        const { nodes: layoutedNodes, edges: layoutedEdges } = getEntitreeLayout(tree, get().direction, selectedSchema.id);

        set({
          edges: layoutedEdges,
          nodes: layoutedNodes,
        });

        fitView(layoutedNodes);

        break;
      }
    }
  }
}));

export default useStore;
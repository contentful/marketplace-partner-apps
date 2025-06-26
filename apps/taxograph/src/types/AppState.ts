import { ContentfulClientApi } from 'contentful';

import {
    type Edge,
    type Node,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
} from '@xyflow/react';

import { FlowDirection, FlowLayout, ConceptSchema } from './';

export type AppNode = Node;

export type AppState = {
    client: ContentfulClientApi<any> | null;
    setClient: (client: ContentfulClientApi<any>) => void;

    setNodes: (nodes: AppNode[]) => void;
    nodes: AppNode[];

    setEdges: (edges: Edge[]) => void;
    edges: Edge[];

    setDirection: (direction: FlowDirection) => void;
    direction: FlowDirection;

    setLayout: (layout: FlowLayout) => void;
    layout: FlowLayout;

    setSelectedSchema: (schema: null | ConceptSchema) => void;
    selectedSchema: null | ConceptSchema;

    setSelectedNode: (node: null | string) => void;
    selectedNode: null | Node;

    onNodesChange: OnNodesChange<AppNode>;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;

    updateLayout: (fitView: any) => void;
};
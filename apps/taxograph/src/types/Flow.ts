export enum FlowDirection {
  TB = 'TB',
  LR = 'LR'
}

export enum FlowLayout {
  Enti = 'Enti',
  Dagre = 'Dagre'
}

export interface FlowNode {
  id: string;
  data: {
    label: string;
    parents: string[];
    hasChildren?: boolean;
  };
  type: string;
  hidden: boolean;
  draggable?: boolean;
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated: boolean;
  hidden: boolean;
}

export interface FlowData {
  initialNodes: FlowNode[];
  initialEdges: FlowEdge[];
}
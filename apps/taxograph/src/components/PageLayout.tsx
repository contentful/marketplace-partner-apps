import { useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Node,
  MiniMap,
  ReactFlowInstance,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useShallow } from 'zustand/react/shallow';

import { useSDK } from '@contentful/react-apps-toolkit';

import { createCDAClient } from '../helpers/cdaClient';

import TreeNode from './TreeNode';

import { FlowPanel } from './FlowPanel';
import { SelectedPanel } from './SelectedPanel';
import { Header } from './Header';
import { LayoutPanel } from './LayoutPanel';

import useStore from '../store/store';
import { AppState } from '../types';

import { config } from '../config';

const selector = (state: AppState) => ({
  setClient: state.setClient,
  nodes: state.nodes,
  edges: state.edges,
  layout: state.layout,
  direction: state.direction,
  selectedNode: state.selectedNode,
  selectedSchema: state.selectedSchema,
  setSelectedNode: state.setSelectedNode,
  setEdges: state.setEdges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  updateLayout: state.updateLayout
});

export const PageLayout = () => {
  const { nodes, edges, layout, direction, selectedSchema, selectedNode, setSelectedNode, onNodesChange, onEdgesChange, setClient, updateLayout, setEdges } = useStore(
    useShallow(selector),
  );

  const sdk = useSDK();
  const reactFlowInstance = useRef<ReactFlowInstance>()

  const nodeTypes = {
    treeNode: TreeNode
  };

  const fitView = (nodes: Node[]) => {
    setTimeout(() => {
      reactFlowInstance.current?.fitView({ nodes: nodes, padding: 0.35, duration: 200 })
    }, 40)
  }

  const onInit = (instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  };

  useEffect(() => {
    if (selectedNode) {
      const node = nodes.find((node) => node.id === selectedNode.id);

      if (node)
        reactFlowInstance.current?.fitView({ nodes: [node], padding: 4.3, duration: 200 })

    } else {
      reactFlowInstance.current?.zoomTo(0.9, { duration: 200 })
    }
  }, [selectedNode])

  useEffect(() => {
    setEdges(edges.map((edge: Edge) => {
      if (!selectedNode)
        return { ...edge, style: { ...edge.style, opacity: config.edge.opacity, strokeWidth: 1, stroke: '#000' } };

      const isConnected =
        edge.source === selectedNode.id || edge.target === selectedNode.id;

      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: isConnected ? 1 : 0.1,
          strokeWidth: 2,
          stroke: isConnected ? 'rgb(0, 166, 244)' : '#000',
        },
      };
    }));
  }, [selectedNode, setEdges, nodes]);

  useEffect(() => {
    if (selectedSchema) {
      updateLayout(fitView);
      setSelectedNode(null);
    }
  }, [selectedSchema, layout, direction])

  useEffect(() => {
    setClient(createCDAClient(sdk.ids.space, sdk.ids.environment, sdk.parameters.installation.cda_key))
  }, [])

  return (
    <div className='flex flex-col h-[98.7vh] overflow-hidden'>
      <Header />

      <div className='flex flex-1'>
        <div className='flex flex-1 relative'>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onInit={onInit}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesDraggable={false}
            nodesConnectable={false}
            zoomOnDoubleClick={false}

            //@ts-ignore
            nodeTypes={nodeTypes}

            fitView
          >
            {!selectedNode &&
              <FlowPanel />
            }

            {!selectedNode &&
              <LayoutPanel />
            }

            {!selectedNode &&
              <MiniMap
                position="bottom-right"
                nodeColor={'#eee'}
              />
            }

            <Background />
          </ReactFlow>

          {selectedNode &&
            <SelectedPanel />
          }
        </div>
      </div>
    </div >
  );
};

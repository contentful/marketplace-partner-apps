import { memo } from 'react';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { MoreHorizontalIcon } from '@contentful/f36-icons';

import { Flex } from '@contentful/f36-components';

import { FlowDirection } from '../types/Flow';

import { config } from '../config';

import useStore from '../store/store';

function TreeNode({ id, data, isConnectable }: NodeProps<any>) {
  const setSelectedNode = useStore((s) => s.setSelectedNode);
  const selectedNode = useStore((s) => s.selectedNode);

  const hasChildren = data?.children?.length > 0 || data?.hasChildren;

  return (
    <Flex style={{ width: config.node.width }}
      className={`
        group shadow-md rounded-md border-2 border-solid border-gray-400 min-h-[70px] bg-white 
        ${selectedNode?.id === id ? 'border-sky-600' : ''} 
        ${selectedNode && selectedNode?.id !== id ? 'opacity-40 hover:opacity-80' : ''}`
      }
      onClick={() => setSelectedNode(id)}>
      {data?.parents?.length > 0 &&
        <Handle type="target"
          isConnectable={isConnectable}
          position={(data.direction === FlowDirection.TB) ? Position.Top : Position.Left}
          className={`${(data.direction === FlowDirection.TB) ? 'w-16' : 'h-8'} !bg-sky-600 rounded-md`} />
      }

      <div className='flex px-4 py-2 gap-2 items-center w-full justify-items-stretch'>
        <div className={`font-semibold flex-1 text-center line-clamp-2`}>
          {data.label}
        </div>

        <button className={`flex items-center opacity-0 group-hover:opacity-100 transition-all rounded-bl-md rounded-tr-md absolute top-0 right-0 px-1 ${selectedNode?.id === id ? 'bg-sky-600 opacity-100' : ''}`}>
          <MoreHorizontalIcon variant={selectedNode?.id === id ? 'white' : 'muted'} />
        </button>
      </div>

      {hasChildren &&
        <Handle type="source"
          position={(data.direction === FlowDirection.TB) ? Position.Bottom : Position.Right}
          isConnectable={isConnectable}
          className={`${(data.direction === FlowDirection.TB) ? 'w-16' : 'h-8'} !bg-sky-600 rounded-md`} />
      }
    </Flex >
  );
};

export default memo(TreeNode)
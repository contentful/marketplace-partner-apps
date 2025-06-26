import {
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ReferencesIcon } from '@contentful/f36-icons';
import { Stack, Button, Tooltip } from '@contentful/f36-components';

import { FlowDirection } from '../types';

import useStore from '../store/store';

export function FlowPanel() {
  const direction = useStore((s) => s.direction);
  const setDirection = useStore((s) => s.setDirection);

  return (
    <Panel position="top-right">
      <Stack spacing="spacingXs" style={{ padding: '10px' }}>
        <Tooltip placement="bottom" id="horizontal" content="Horizontal">
          <Button onClick={() => setDirection(FlowDirection.TB)}
            isActive={direction === FlowDirection.TB}
            className={`p-3 px-5 rounded-md border-2 border-solid bg-white gap-2 flex ${direction === FlowDirection.TB ? 'border-gray-600 text-gray-900' : 'opacity-50'}`}>
            <ReferencesIcon className={`rotate-90`} variant={`secondary`} />
          </Button>
        </Tooltip>
        <Tooltip placement="bottom" id="vertical" content="Vertical">
          <Button onClick={() => setDirection(FlowDirection.LR)}
            isActive={direction === FlowDirection.LR}
            className={`p-3 px-5 rounded-md border-2 border-solid bg-white gap-2 flex ${direction === FlowDirection.LR ? 'border-gray-600 text-gray-900' : 'opacity-50'}`}>
            <ReferencesIcon variant={`secondary`} />
          </Button>
        </Tooltip>
      </Stack>
    </Panel>
  )
}
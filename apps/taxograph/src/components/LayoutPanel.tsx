import {
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Stack, Button, Tooltip } from '@contentful/f36-components';

import { FlowLayout } from '../types';

import useStore from '../store/store';

export function LayoutPanel() {
  const layout = useStore((s) => s.layout);
  const setLayout = useStore((s) => s.setLayout);

  return (
    <Panel position="top-right" style={{ right: '120px' }}>
      <Stack spacing="spacingXs" style={{ padding: '10px' }}>
        <Tooltip placement="bottom" id="dagre" content="Dagre layout">
          <Button onClick={() => setLayout(FlowLayout.Dagre)}
            isActive={layout === FlowLayout.Dagre}
            className={`p-3 px-5 rounded-md border-2 border-solid bg-white gap-2 flex ${layout === FlowLayout.Dagre ? 'border-gray-600 text-gray-900' : 'opacity-50'}`}>
            {FlowLayout.Dagre}
          </Button>
        </Tooltip>
        <Tooltip placement="bottom" id="enti" content="Entitree layout">
          <Button onClick={() => setLayout(FlowLayout.Enti)}
            isActive={layout === FlowLayout.Enti}
            className={`p-3 px-5 rounded-md border-2 border-solid bg-white gap-2 flex ${layout === FlowLayout.Enti ? 'border-gray-600 text-gray-900' : 'opacity-50'}`}>
            {FlowLayout.Enti}
          </Button>
        </Tooltip>
      </Stack>
    </Panel>
  )
}
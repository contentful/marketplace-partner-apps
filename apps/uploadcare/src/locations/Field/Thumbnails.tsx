import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import { css } from 'emotion';
import { useCallback, useMemo } from 'react';
import { Asset } from '../../types';
import { Thumbnail } from './Thumbnail';

const styles = {
  grid: css({
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  }),
};

type Props = {
  assets: Asset[];
  isDisabled: boolean;
  onChange: (assets: Asset[]) => void;
};

export function Thumbnails({ assets, isDisabled, onChange }: Props) {
  const assetsUUIDs = useMemo<Asset['uuid'][]>(() => assets.map(a => a.uuid), [assets]);

  const handleDelete = useCallback(
    (uuid: Asset['uuid']) => {
      onChange(assets.filter(a => a.uuid !== uuid));
    },
    [assets, onChange],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const activeIndex = assets.findIndex(a => a.uuid === active.id);
        const overIndex = assets.findIndex(a => a.uuid === over.id);
        onChange(arrayMove(assets, activeIndex, overIndex));
      }
    },
    [assets, onChange],
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={assetsUUIDs}>
        <div className={styles.grid}>
          {/* TODO: handle non image thumbnail? */}
          {assets.map(asset => (
            <Thumbnail
              key={asset.uuid}
              asset={asset}
              isDisabled={isDisabled}
              onDelete={() => handleDelete(asset.uuid)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

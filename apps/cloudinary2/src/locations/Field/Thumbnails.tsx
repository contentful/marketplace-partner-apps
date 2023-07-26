import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { css } from 'emotion';
import { useCallback, useMemo, useRef } from 'react';
import { CloudinaryAsset } from '../../types';
import { Thumbnail } from './Thumbnail';

const styles = {
  container: css({
    maxWidth: '600px',
  }),
  grid: css({
    display: 'grid',
    gap: '20px',
    gridTemplateColumns: 'repeat(3, 1fr)',
  }),
};

interface Props {
  assets: CloudinaryAsset[];
  onChange: (assets: CloudinaryAsset[]) => void;
  isDisabled: boolean;
}

export function Thumbnails({ assets, isDisabled, onChange }: Props) {
  const assetsIdMap = useRef(new WeakMap<CloudinaryAsset, string>());
  // each asset needs an id. We cannot use a property because we might have duplicate assets.
  // `assetsIdsMap` stores an id for each asset object
  const assetsWithIds: (CloudinaryAsset & { id: string })[] = useMemo(() => {
    return assets.map((asset) => {
      if (!assetsIdMap.current.has(asset)) {
        assetsIdMap.current.set(asset, window.crypto.randomUUID());
      }
      return {
        ...asset,
        id: assetsIdMap.current.get(asset)!,
      };
    });
  }, [assets]);

  const handleDelete = useCallback(
    (indexToDelete: number) => {
      onChange(assets.filter((_, assetIndex) => assetIndex !== indexToDelete));
    },
    [assets, onChange]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const activeIndex = assetsWithIds.findIndex((a) => a.id === active.id)!;
        const overIndex = assetsWithIds.findIndex((a) => a.id === over.id)!;
        onChange(arrayMove(assets, activeIndex, overIndex));
      }
    },
    [assets, assetsWithIds, onChange]
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={assetsWithIds}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {assetsWithIds.map((asset, index) => (
              <Thumbnail key={asset.id} asset={asset} isDisabled={isDisabled} onDelete={() => handleDelete(index)} />
            ))}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
}

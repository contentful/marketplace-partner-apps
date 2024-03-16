import { AssetCard, DragHandle, MenuItem } from '@contentful/f36-components';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { css } from 'emotion';
import { useMemo } from 'react';
import { Asset } from '../../types';

const styles = {
  card: css({
    cursor: 'default', // for some reason it's `pointer` by default
  }),
};

type Props = {
  asset: Asset;
  isDisabled: boolean;
  onDelete: () => void;
};

export function Thumbnail({ asset, isDisabled, onDelete }: Props) {
  const { cdnUrl, name, uuid, isImage } = asset;

  const url = useMemo(() => {
    return cdnUrl + '-/resize/x300/';
  }, [asset]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} {...attributes} style={style}>
      <AssetCard
        className={styles.card}
        src={url}
        type={isImage ? 'image' : 'archive'}
        size="small"
        title={name}
        actions={[
          <MenuItem key="delete" onClick={onDelete} isDisabled={isDisabled}>
            Delete
          </MenuItem>,
        ]}
        withDragHandle={!isDisabled}
        isDragging={isDragging}
        dragHandleRender={() => <DragHandle as="button" label="Move entry" {...listeners} />}
      />
    </div>
  );
}

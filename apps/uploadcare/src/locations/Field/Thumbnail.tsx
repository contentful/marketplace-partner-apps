import { Card, IconButton } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { css } from 'emotion';
import { useMemo } from 'react';
import { Asset } from '../../types';

const styles = {
  card: css({
    margin: '10px',
    position: 'relative',
    padding: 0,
  }),
  sortableWrapper: (isDisabled: boolean) =>
    css({
      padding: '1rem',
      cursor: isDisabled ? 'default' : 'move',
    }),
  img: css({
    display: 'block',
    maxWidth: '100px',
    maxHeight: '100px',
    margin: 'auto',
    userSelect: 'none',
  }),
  remove: (isDisabled: boolean) =>
    css({
      position: 'absolute',
      top: '-10px',
      right: '-10px',
      backgroundColor: '#fff',
      padding: 0,
      minHeight: 'initial',
      cursor: isDisabled ? 'not-allowed' : 'cursor',
      zIndex: 1,
    }),
};

type Props = {
  asset: Asset;
  isDisabled: boolean;
  onDelete: () => void;
};

export function Thumbnail({ asset, isDisabled, onDelete }: Props) {
  const { cdnUrl, originalFilename, uuid } = asset;

  const url = useMemo(() => {
    return cdnUrl + '-/scale_crop/100x100/';
  }, [asset]);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: uuid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card className={styles.card} ref={setNodeRef} style={style} {...attributes}>
      <div className={styles.sortableWrapper(isDisabled)} {...listeners}>
        <img className={styles.img} src={url} alt={originalFilename} />
      </div>

      {!isDisabled && (
        <IconButton
          className={styles.remove(isDisabled)}
          variant="transparent"
          icon={<CloseIcon variant="muted" />}
          aria-label="Remove"
          onClick={onDelete}
        />
      )}
    </Card>
  );
}

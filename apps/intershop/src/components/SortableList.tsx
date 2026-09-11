import { DragDropProvider } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { move } from '@dnd-kit/helpers';
import { type ReactNode, type RefCallback } from 'react';

type SortableItemData = { id: string | number };

type SortableItemRenderProps = {
  itemRef: RefCallback<Element>;
  handleRef: RefCallback<Element>;
  isDragging: boolean;
  isDropping: boolean;
};

type SortableItemProps<TItem extends SortableItemData> = {
  item: TItem;
  index: number;
  renderItem: SortableListProps<TItem>['renderItem'];
};

const SortableItem = <TItem extends SortableItemData>({ item, index, renderItem }: SortableItemProps<TItem>): ReactNode => {
  const {
    ref: itemRef,
    handleRef,
    isDragging,
    isDropping,
  } = useSortable({
    id: item.id,
    index,
  });

  return renderItem(item, {
    itemRef,
    handleRef,
    isDragging,
    isDropping,
  });
};

type SortableListProps<TItem extends SortableItemData> = {
  items: TItem[];
  onItemsChange: (items: TItem[]) => void;
  renderItem: (item: TItem, sortableItemRenderProps: SortableItemRenderProps) => ReactNode;
};

const SortableList = <TItem extends SortableItemData>({ items, onItemsChange, renderItem }: SortableListProps<TItem>): ReactNode => (
  <DragDropProvider
    onDragEnd={(event) => {
      onItemsChange(move(items, event));
    }}>
    {items.map((item, index) => (
      <SortableItem key={item.id} item={item} index={index} renderItem={renderItem} />
    ))}
  </DragDropProvider>
);

export type { SortableItemData };
export { SortableList };

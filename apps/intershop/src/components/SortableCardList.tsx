import { Card, DragHandleProps } from '@contentful/f36-components';
import { cloneElement, ComponentProps, ComponentPropsWithRef, ReactElement, RefAttributes } from 'react';
import { SortableList, type SortableItemData } from './SortableList';

type SortableCardProps = Pick<ComponentPropsWithRef<typeof Card>, 'isDragging' | 'dragHandleRender' | 'ref'> & {
  withDragHandle: true;
  padding: 'none';
};

type Props<TItem extends SortableItemData> = Omit<ComponentProps<typeof SortableList<TItem>>, 'renderItem'> & {
  renderCard: (item: TItem, sortableCardProps: SortableCardProps) => ReactElement;
};

const SortableCardList = <TItem extends SortableItemData>({ renderCard, ...props }: Props<TItem>) => (
  <SortableList
    {...props}
    renderItem={(item, { itemRef: ref, handleRef, isDragging }) =>
      renderCard(item, {
        withDragHandle: true,
        isDragging,
        ref,
        padding: 'none',
        dragHandleRender: ({ drag }) => cloneElement(drag as ReactElement<DragHandleProps & RefAttributes<Element>>, { ref: handleRef }),
      })
    }
  />
);

export { SortableCardList };

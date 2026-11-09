import { useState } from 'react';
import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';

import clsx from 'clsx';
import type { Image } from '../lib/types';

import XMark from './icons/XMark';
import RasterImage from './Image';

interface SortableItemProps {
  id: UniqueIdentifier;
  children: React.ReactNode;
  isDragging: boolean;
}

function SortableItem({ id, children, isDragging }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useSortable({
    id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : 'auto',
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="group image relative inline-block">
      {children}
    </div>
  );
}

interface RasterImagesListProps {
  images: Image[];
  onChange: (images: Image[]) => void;
}

/** The selected images, in the order the field will store them. */
export default function RasterImagesList({ images, onChange }: RasterImagesListProps) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag and drop handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex((item) => item.id === active.id);
      const newIndex = images.findIndex((item) => item.id === over?.id);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  };

  const activeImage = images.find((image) => image.id === activeId);

  return (
    <div className="flex flex-col gap-5 pb-3 border-b">
      <h2 className="text-lg font-semibold">Selected images:</h2>

      {images.length ? (
        <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={images} strategy={verticalListSortingStrategy}>
            <div className="flex flex-wrap gap-3 w-full">
              {images.map((image: Image) => (
                <div key={image.id} className="group image relative inline-block opacity-0 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => onChange(images.filter((other) => other.id !== image.id))}
                    aria-label="Remove image"
                    className={clsx('remove', { 'opacity-0': isDragging })}>
                    <XMark />
                  </button>

                  <SortableItem id={image.id} isDragging={isDragging}>
                    <RasterImage image={image} />
                  </SortableItem>
                </div>
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId && activeImage ? (
              <SortableItem id={activeId} isDragging>
                <RasterImage image={activeImage} />
              </SortableItem>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="relative h-36 w-full mb-2 border rounded-md">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-medium">Pick images from Raster below.</span>
        </div>
      )}
    </div>
  );
}

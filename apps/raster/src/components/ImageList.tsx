/* eslint-disable react/no-multi-comp */
import { useEffect, useState } from 'react';
import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';

import clsx from 'clsx';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { DialogAppSDK } from '@contentful/app-sdk';
import type { Image } from '@/lib/types';
import ImageVersions from './locations/ImageVersions';
import XMark from './icons/XMark';
import RasterImage from './Image';
import { useImageStore } from '../lib/store/image-store';

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
  browseVersions: boolean;
  setBrowseVersions: (value: boolean) => void;
}

export default function RasterImagesList({ images, browseVersions, setBrowseVersions }: RasterImagesListProps) {
  const sdk = useSDK<DialogAppSDK>();
  const [imageWithVersions, setImageWithVersions] = useState<Image | undefined | null>(null);

  const [selectedImages, setSelectedImages] = useImageStore((state) => [state.selected, state.setSelected]);

  const [orderedSelectedImages, setOrderedSelectedImages] = useState<Image[]>(selectedImages || []);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const openVersions = (image: Image) => {
    setBrowseVersions(true);
    setImageWithVersions(image);
  };

  const closeVersions = () => {
    setBrowseVersions(false);
    setImageWithVersions(null);
  };

  // Get the selected images
  const selected = orderedSelectedImages.map((img) => img.id);

  // Drag and drop handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsDragging(false);

    if (active.id !== over?.id) {
      setOrderedSelectedImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    setIsDragging(true);
  };

  const handleChooseImage = (image: Image) => {
    setOrderedSelectedImages((prevSelectedImages) => {
      const isSelected = prevSelectedImages.some((selectedImage) => selectedImage.id === image.id);
      if (isSelected) {
        return prevSelectedImages.filter((selectedImage) => selectedImage.id !== image.id);
      }
      return [...prevSelectedImages, image];
    });
  };

  const handleChooseVersion = (versionId: string) => {
    setSelectedVersions((prevSelectedVersions) => {
      const isSelected = prevSelectedVersions.includes(versionId);
      if (isSelected) {
        return prevSelectedVersions.filter((id) => id !== versionId);
      }
      return [...prevSelectedVersions, versionId];
    });
  };

  // Update selected images when the order changes
  useEffect(() => {
    if (orderedSelectedImages.length) {
      setSelectedImages(orderedSelectedImages);
    }
  }, [orderedSelectedImages, setSelectedImages]);

  return browseVersions && imageWithVersions ? (
    <ImageVersions
      imageWithVersions={imageWithVersions}
      closeVersions={closeVersions}
      chooseImage={handleChooseImage}
      selected={selected}
      chooseVersion={handleChooseVersion}
      selectedVersions={selectedVersions}
    />
  ) : (
    <div className="grid gap-4">
      {/* Selected images */}
      <div className="flex flex-col gap-5 pb-3 border-b">
        <h2 className="text-lg font-semibold">Selected images:</h2>

        {orderedSelectedImages.length ? (
          <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={orderedSelectedImages} strategy={verticalListSortingStrategy}>
              <div className="flex flex-wrap gap-3 w-full">
                {orderedSelectedImages.map((image: Image) => (
                  <div key={image.id} className="group image relative inline-block opacity-0 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => handleChooseImage(image)}
                      aria-label="Remove image"
                      className={clsx('remove', { 'opacity-0': isDragging })}>
                      <XMark />
                    </button>

                    <SortableItem id={image.id} isDragging={isDragging}>
                      <RasterImage
                        image={image}
                        displayName={false}
                        chooseImage={handleChooseImage}
                        openVersions={openVersions}
                        thumbnail
                        versionSelected={image.views?.some((version) => selectedVersions.includes(version.id))}
                      />
                    </SortableItem>
                  </div>
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <SortableItem id={activeId} isDragging>
                  <RasterImage
                    image={orderedSelectedImages.find((image) => image.id === activeId)!}
                    displayName={false}
                    chooseImage={handleChooseImage}
                    openVersions={openVersions}
                    thumbnail
                    versionSelected={orderedSelectedImages
                      .find((image) => image.id === activeId)
                      ?.views?.some((version) => selectedVersions.includes(version.id))}
                  />
                </SortableItem>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <div className="relative h-36 w-full mb-2 border rounded-md">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-medium">Please make a selection below.</span>
          </div>
        )}
      </div>

      {/* Photo library */}
      <div className="image-grid">
        {images.map((image: Image) => (
          <div key={image.id} className="image relative inline-block">
            <RasterImage
              image={image}
              displayName={false}
              selected={selected.includes(image.id)}
              chooseImage={handleChooseImage}
              openVersions={openVersions}
              versionSelected={image.views?.some((version) => selectedVersions.includes(version.id))}
            />
          </div>
        ))}
      </div>

      {/* Selected images count, confirm and cancel buttons */}
      <div className={clsx('selected-container', orderedSelectedImages.length ? 'translate-y-0' : 'translate-y-full')}>
        <span className="font-medium py-6 px-7">{orderedSelectedImages.length} selected</span>
        <div className="flex gap-3 px-14 pt-4">
          <button
            className="w-fit h-fit bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded font-medium transition-colors"
            type="button"
            onClick={() => sdk.close()}>
            Cancel
          </button>
          <button
            className="w-fit h-fit bg-green hover:bg-green-dark text-white px-3 py-2 rounded font-medium transition-colors"
            type="button"
            onClick={() => {
              sdk.close(orderedSelectedImages);
            }}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

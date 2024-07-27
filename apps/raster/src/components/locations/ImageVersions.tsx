import { Button } from '@contentful/f36-components';
import clsx from 'clsx';
import type { Image } from '@/lib/types';

import RasterImage from '../Image';

type Props = {
  imageWithVersions: Image;
  closeVersions: () => void;
  chooseImage: (image: Image) => void;
  chooseVersion: (versionId: string) => void;
  selected?: string[];
  selectedVersions: string[];
};

export default function ImageVersions({ imageWithVersions, closeVersions, chooseImage, chooseVersion, selected, selectedVersions }: Props) {
  const handleImageClick = (image: Image) => {
    const updatedImage = { ...image };
    if (imageWithVersions.description) {
      updatedImage.description = imageWithVersions.description;
    }
    chooseImage(updatedImage);
    chooseVersion(image.id);
  };

  return (
    <div>
      <Button onClick={closeVersions}>&larr; Back</Button>
      {/* Title */}
      <div className="flex py-4">
        <h2 className="text-lg font-medium grow">
          {imageWithVersions?.views?.length} version
          {imageWithVersions?.views?.length !== 1 && 's'} of {imageWithVersions?.name}
        </h2>
      </div>

      {/* List of views */}
      <div
        className={clsx('grid grid-cols-4 gap-4', {
          hidden: !imageWithVersions,
        })}>
        {/* Original */}
        <RasterImage
          image={imageWithVersions}
          original
          displayName
          chooseImage={handleImageClick}
          selected={selected?.includes(imageWithVersions.id)}
          version
          versionSelected={selectedVersions.includes(imageWithVersions.id)}
        />
        {/* Versions */}
        {imageWithVersions?.views?.map((image: Image) => (
          <RasterImage
            key={image.id}
            original={false}
            displayName
            image={image}
            chooseImage={handleImageClick}
            selected={selected?.includes(image.id)}
            version
            versionSelected={selectedVersions.includes(image.id)}
          />
        ))}
      </div>
    </div>
  );
}

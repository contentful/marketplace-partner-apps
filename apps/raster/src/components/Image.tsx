import type { Image } from '../lib/types';

type Props = {
  image: Image;
};

/** A selected image's thumbnail, dragged to reorder the selection. */
export default function RasterImage({ image }: Props) {
  return (
    <div className="relative group image-button border-white cursor-move">
      <div className="remove-overlay" />

      <img src={image.thumbUrl ?? undefined} alt={image.name ?? ''} className="rounded select-none pointer-events-none bg-gray-100 object-cover h-36 w-36" />

      {/* Image dimensions */}
      {image.width && image.height ? (
        <span className="absolute bottom-2 left-2 text-xs bg-gray-900/80 px-2.5 py-1 rounded-md font-medium pointer-events-none text-gray-100">
          {image.width}×{image.height}
        </span>
      ) : null}
    </div>
  );
}

import type { Image } from '@lib/types'
import clsx from 'clsx'

import Check from './icons/Check'

type Props = {
  image: Image
  original?: boolean
  selected?: boolean
  displayName: boolean
  chooseImage?: (image: Image) => void
  openVersions?: (image: Image) => void
  thumbnail?: boolean
  version?: boolean
  versionSelected?: boolean
}

export default function RasterImage({
  image,
  original,
  selected,
  displayName,
  chooseImage,
  openVersions,
  thumbnail,
  version,
  versionSelected
}: Props) {
  // Show label if image is original
  const originalLabel = () => {
    if (!original) return null
    return (
      <span className='bg-gray-200 py-0.5 px-1.5 rounded text-gray-500 ml-1'>
        Original
      </span>
    )
  }

  return (
    <div className='relative flex flex-col gap-1.5'>
      {chooseImage && (
        <button
          type='button'
          onClick={() => !thumbnail && chooseImage(image)}
          key={image.id}
          className={clsx(
            'relative group image-button',
            selected ? 'border-primary' : 'border-white',
            thumbnail ? 'cursor-move' : 'overflow-hidden',
            { 'h-full': version }
          )}
        >
          {thumbnail && <div className='remove-overlay' />}

          {/* eslint-disable-next-line */}
          <img
            src={image.thumbUrl}
            className={clsx(
              'rounded transition-transform duration-300 ease-in-out select-none pointer-events-none bg-gray-100 object-cover',
              thumbnail ? 'h-36 w-36' : 'group-hover:scale-[1.02]',
              { 'h-full': version }
            )}
          />

          {/* Show count if image has versions */}
          {!thumbnail &&
            openVersions &&
            image?.views &&
            image?.views?.length > 0 && (
              <button
                type='button'
                className='cursor-pointer'
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openVersions(image)
                }}
              >
                <div
                  className={clsx(
                    'versions',
                    versionSelected ? 'border-2 border-primary' : ''
                  )}
                >
                  +{image.views.length}
                  {versionSelected && (
                    <span className='h-4 w-4 p-0.5 bg-primary rounded-full flex justify-center items-center'>
                      <Check />
                    </span>
                  )}
                </div>
              </button>
            )}

          <span
            className={clsx(
              'checkmark',
              selected && !thumbnail
                ? 'scale-100 opacity-100'
                : 'scale-90 opacity-0'
            )}
          >
            <Check />
          </span>

          {/* Image dimensions */}
          <span className='absolute bottom-2 left-2 text-xs bg-gray-900/80 px-2.5 py-1 rounded-md font-medium pointer-events-none text-gray-100'>
            {image.height}×{image.width}
          </span>
        </button>
      )}

      {/* Image name */}
      {displayName && (
        <div className='image-name'>
          {image.name} {originalLabel()}
        </div>
      )}
    </div>
  )
}

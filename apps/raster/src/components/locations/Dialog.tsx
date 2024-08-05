import React, { useEffect, useState } from 'react';

import type { DialogAppSDK } from '@contentful/app-sdk';
import { Skeleton, Spinner } from '@contentful/f36-components';
import { ErrorCircleIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import clsx from 'clsx';
import useSWR from 'swr';
import type { Image, Library, Settings } from '@/lib/types';
import { getImagesFromLibraryQuery, getLibraryListQuery } from '../../lib/graphql/queries';
import { swrImagesFetcher, swrLibreriesFetcher } from '../../lib/fetcher';

import { useImageStore } from '../../lib/store/image-store';
import RasterImagesList from '../ImageList';

function Dialog() {
  const sdk = useSDK<DialogAppSDK>();
  const { orgId, apiKey } = sdk.parameters.installation as Settings;

  // Invocation parameters are passed to the dialog in `parameters` via sdk.dialogs.openCurrentApp
  const { currentValue } = sdk.parameters.invocation as {
    currentValue: Image[] | undefined;
  };

  const [selectedImages, setSelectedImages] = useImageStore((state) => [state.selected, state.setSelected]);

  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [browseVersions, setBrowseVersions] = useState(false);

  // Get the list of libraries
  const {
    data: libraries,
    error,
    isLoading,
  } = useSWR(
    {
      query: getLibraryListQuery,
      variables: {
        organizationId: orgId,
      },
      settings: { apiKey, orgId },
    },
    swrLibreriesFetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Get the list of images from the selected library
  const {
    data: images,
    error: imageError,
    isLoading: imagesLoading,
  } = useSWR(
    // Conditionally fetch images if a library is selected
    // https://swr.vercel.app/docs/conditional-fetching
    selectedLibrary
      ? {
          query: getImagesFromLibraryQuery,
          variables: {
            organizationId: orgId,
            libraryId: selectedLibrary.id,
          },
          settings: { apiKey, orgId },
        }
      : null,
    swrImagesFetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  // Select library, and get images
  const selectLibrary = async (library: Library) => {
    // Set the selected library (for styling)
    setSelectedLibrary(library);

    // Close the versions dialog if open
    setBrowseVersions(false);
  };

  // Update the selected images store if there are images when the dialog is opened
  useEffect(() => {
    if (!selectedImages?.length && currentValue) {
      setSelectedImages(currentValue);
    }
  }, [currentValue, selectedImages, setSelectedImages]);

  useEffect(() => {
    if (libraries && libraries.length > 0 && !selectedLibrary) {
      setSelectedLibrary(libraries[0]);
    }
  }, [libraries, selectedLibrary]);

  // Show error message if there was an error fetching content.
  if (error || imageError) {
    return (
      <div className="flex mt-10 border w-3/4 m-auto py-4 px-4 rounded space-x-2">
        <ErrorCircleIcon variant="negative" />
        <div>There was an error fetching content from Raster.</div>
      </div>
    );
  }

  return (
    <div className="my-5 mx-10">
      {/* Librarie list */}
      <div className="flex w-full h-full space-x-4">
        <div className="relative">
          <div className="sticky top-5 space-y-2">
            {!isLoading ? (
              libraries.map((library: Library) => (
                <button
                  type="button"
                  className={clsx(
                    'flex p-2 border rounded w-60 cursor-pointer',
                    selectedLibrary?.id === library.id ? 'border-primary' : 'border-gray-200 hover:border-gray-400',
                  )}
                  key={library.id}
                  onClick={() => selectLibrary(library)}>
                  <div className="grow py-2 px-1">{library.name}</div>
                  <div className="text-xs self-center text-gray-500">{library.photosCount} images</div>
                </button>
              ))
            ) : (
              <Skeleton.Container>
                <Skeleton.Image width={240} height={40} />
                <Skeleton.Image width={240} height={40} offsetTop={48} />
                <Skeleton.Image width={240} height={40} offsetTop={96} />
              </Skeleton.Container>
            )}
          </div>
        </div>

        {/* Photos list */}
        <div className="relative border-gray-800 w-full px-4 mb-60">
          {images && !imagesLoading ? (
            <RasterImagesList images={images} browseVersions={browseVersions} setBrowseVersions={setBrowseVersions} />
          ) : (
            /* Loading images */
            <div className="flex h-full justify-center py-12">
              {imagesLoading ? (
                <div className="self-center flex flex-col space-y-2">
                  <div className="self-center">
                    <Spinner variant="default" />
                  </div>
                  <div>Loading images</div>
                </div>
              ) : (
                <div className="self-center">Select a library to view 👀 images</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dialog;

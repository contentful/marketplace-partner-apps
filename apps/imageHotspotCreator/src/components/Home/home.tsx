import React, { useEffect, useState } from 'react'
import SelectImage from '../ImageSelector/selectImage'
import CreateHotspot from '../Creator/createHotspot'
import './home.css'
import { Notification, Spinner, Stack } from '@contentful/f36-components';

/**
 * Main Component of this custom application
 * @param {sdk} sdk of the current entry.
 * @returns {HTMLDivElement} homePage where the selector page and creator page loads.
 */
const IHC = ({ sdk }: any) => {
  const [url, setUrl] = useState({
    url: '',
    contentful: true,
  })

  const [imageUrl, setImageUrl] = useState<string>()
  const [imageStatus, setImageStatus] = useState<boolean>(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [imageName, setImageName] = useState<string>()
  const [imageAssets, setImageAssets] = useState<[]>()
 

  function checkImageURL(url:any, callback:any) {
    var img = new Image();
  
    img.onload = function() {
      callback(true);
    };
  
    img.onerror = function() {
      callback(false);
    };
  
    img.src = url;
  }

  //This UseEffect is used for the first time if there is already values for that entry
  useEffect(() => {
    const url = sdk?.entry?.fields?.imageUrl?.getValue()
    if (url) {
      checkImageURL(url, function(isValid:boolean) {
        if (isValid) {
          setImageUrl(url)
          setImageName(sdk.entry.fields.title.getValue())
          setSelectedImage(sdk.entry.fields.title.getValue())
          setImageStatus(true)
        } else {
          Notification.setPlacement('top');
          Notification.warning(
            'The "Image URL" is invalid. Please re-upload or choose the existing image.',
            { duration: 0 },
          )
          
        }
      });
     
    }
  }, [])

  /**
   * This function is used to get all the assets from the contentful assets
   * @function getAssets
   */
  const getAssets = async () => {
    await sdk.space.getAssets().then((response:any)=>{setImageAssets(response.items)})
      .catch(console.error)
  }

  //This useEffect is used to call getAssets function for the first time after render
  useEffect(() => {
    getAssets()
  }, [])

  return (
    <div className="mainContainer">
      {!imageStatus ? (
        imageAssets ? (
          <SelectImage
            sdk={sdk}
            url={url}
            setUrl={setUrl}
            imageName={imageName}
            setImageUrl={setImageUrl}
            setImageStatus={setImageStatus}
            imageUrl={imageUrl}
            selectedImage={selectedImage}
            setImageName={setImageName}
            setSelectedImage={setSelectedImage}
            imageAssets={imageAssets}
            setImageAssets={setImageAssets}
          />
        ) : (
          <Stack>
            <Spinner customSize={50} />
          </Stack>
        )
      ) : (
        <CreateHotspot
          setImageUrl={setImageUrl}
          setImageStatus={setImageStatus}
          imageUrl={imageUrl}
          sdk={sdk}
          imageName={imageName}
          selectedImage={selectedImage}
        />
      )}
    </div>
  )
}
export default IHC;

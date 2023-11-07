/* eslint-disable jsx-a11y/role-supports-aria-props */
import { useState } from "react";
import MagicDropzone from "react-magic-dropzone";
import "./selectImage.css";
import { Button, Select, TextInput } from "@contentful/f36-components";
import cloneDeep from "clone-deep";
import { Stack } from "@mui/material";
import { Spinner } from "@contentful/forma-36-react-components";
import { createClient } from "contentful-management";
import React from "react";

const SelectImage = ({
  setImageUrl,
  setImageStatus,
  imageName,
  sdk,
  setSelectedImage,
  selectedImage,
  setImageName,
  imageAssets,
  url,
  setUrl,
  setImageAssets,
}: any) => {
  //state Declaratios
  const [imageFile, setImageFile] = useState<any>();
  const [uploadYourImage, setUploadYourImage] = useState(true);
  const [uploadAsLink, setUploadAsLink] = useState("");
  const [uploadExisting, setUploadExisting] = useState("");

  const [imageInExisting, setImageInExisting] = useState(null);

  const [showUrlPreview, setShowUrlPreview] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  /**This function is for getting he url of image
   * @function getImageUrl
   * @param {string} id - unique id of the entry of the asset
   * @param {boolean} status - url is present or not
   */
  const getImageUrl = async (id: string, status: any) => {
    await sdk.space.getAsset(id).then((asset: any) => {
      if (status) {
        setUrl({
          url: "http:" + asset?.fields?.file["en-US"]?.url,
          contentful: true,
        });
      } else {
        setImageUrl("http:" + asset?.fields?.file["en-US"]?.url);
        setImageStatus(true);
      }
      setImageName(asset?.fields?.title["en-US"]);
    });
  };

  /**
   * This function happens while dropping of the image
   * @function onDrop
   * @param {Event} accepted - The Event of the dropped image
   */
  const onDrop = (accepted: any) => {
    setImageFile(accepted[0]);
    setUrl({ url: accepted[0], contentful: false });
  };

  /**
  /**
 * Converting the file to buffer
 * @param {Blob} file - blob file of the image
 * @returns Bufferfile
 */
  const convertBuffer = async (file: any) => {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
    return data;
  };

  /**
   * Navigating to the create page by setting value to a state
   * @function goToCreateUsi
   */
  const goToCreateUsi = async () => {
    const tempUrl = cloneDeep(url);
    if (tempUrl.contentful) {
      sdk.entry.fields.title.setValue(imageName);
      setImageUrl(tempUrl.url);
      setImageStatus(true);
    } else {
      sdk.entry.fields.title.setValue(url?.url?.name);
      const bufferFile = await convertBuffer(tempUrl.url);
      uploadImage(bufferFile, imageFile);
    }
  };

  const goToCreateUsiAsLink = async () => {
    const tempUrl = cloneDeep(url);
    if (!tempUrl.contentful) {
      sdk.entry.fields.title.setValue("Image");
      setImageUrl(tempUrl.url);
      setImageStatus(true);
    }
  };

  /**
   * Uploading a new image to contentful assets
   * @function uploadImage
   * @param {ArrayBuffer} bufferData - the Bufferdata of the Image
   * @param {Blob} file - The blob file of the Image
   */
  const uploadImage = async (bufferData: any, file: any) => {
    const cma = createClient({ apiAdapter: sdk.cmaAdapter });

    const space = await cma.getSpace(sdk.ids.space);

    setImageAssets("");
    await space
      .getEnvironment(sdk.ids.environment)
      .then((environment: any) =>
        environment.createAssetFromFiles({
          fields: {
            title: {
              "en-US": file?.name,
            },
            description: {
              "en-US": file?.type,
            },
            file: {
              "en-US": {
                contentType: file?.type,
                fileName: file?.name,
                file: bufferData,
              },
            },
          },
        })
      )
      .then((asset: any) => asset.processForAllLocales())
      .then((asset: any) => {
        getImageUrl(asset?.sys?.id, false);
        asset.publish();
      })
      .catch(console.error);
  };

  // const handleRadioChange = (e) => {
  //   setSelectedOption(e.target.value);
  // };

  const handleUrlInputChange = (e) => {
    setUrlInput(e.target.value);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleUrlProceed = async () => {
    if (isValidUrl(urlInput)) {
      const tempUrl = { url: urlInput, contentful: false };
      setUrl(tempUrl);
      setShowUrlPreview(true);
      goToCreateUsiAsLink();
    } else {
      console.error("Invalid URL");
    }
  };

  return (
    <div
      className="selectContainer radioSectionContainer"
      style={{ height: !imageAssets ? "100%" : "" }}
    >
      <div>
        <div>
          {uploadYourImage && (
            <div className="uploadSection">
              <MagicDropzone
                className="Dropzone"
                accept="image/jpeg, image/png, .jpg, .jpeg, .png"
                onDrop={(e: any) => onDrop(e)}
              >
                <div className="Dropzone-content">
                  {imageFile ? (
                    <img
                      src={imageFile?.preview}
                      height={"100%"}
                      width={"100%"}
                      alt="Preview_image"
                    />
                  ) : (
                    <p>Upload Image</p>
                  )}
                </div>
              </MagicDropzone>
              <div className="cancelProceedButtons">
              {imageFile ? (
                <div className="buttonContainer">
                  <Button
                    variant="negative"
                    size="small"
                    onClick={() => setImageFile(null)}
                  >
                    clear
                  </Button>
                  <Button
                    variant="primary"
                    testId="ProceedButton"
                    isDisabled={url.url ? false : true}
                    onClick={() => goToCreateUsi()}
                  >
                    Proceed
                  </Button>
                </div>
              ) : (
                " "
              )}
              </div>
            </div>
          )}
          {uploadAsLink && (
            <div className="linkInputSection">
              <div>
                <div>
                  <div className="linkInputContainer">
                    <div className="linkUploadSection">
                      {urlInput ? (
                        <div className="linkUploadImage">
                          <img src={urlInput} alt="Preview_image" />
                        </div>
                      ) : (
                        <div>No Preview Image</div>
                      )}
                    </div>
                    <div>
                      <span style={{fontWeight:"bold",paddingRight:"10px"}}>Image URL  </span>
                      <TextInput
                        type="url"
                        id="homepage"
                        autoComplete="off"
                        name="homepage"
                        placeholder="Enter URL"
                        value={urlInput}
                        onChange={(e) => {
                          setUrlInput(e.target.value);
                          if (isValidUrl(e.target.value)) {
                            const tempUrl = {
                              url: e.target.value,
                              contentful: false,
                            };
                            setUrl(tempUrl);
                            setShowUrlPreview(true);
                          } else {
                            console.error("Invalid URL");
                          }
                        }}
                      />
                    </div>
                    <div className="cancelProceedButtons">
                    {urlInput && <div className="buttonContainer">
                        <Button
                          variant="negative"
                          size="small"
                          onClick={() => {
                            setShowUrlPreview(false);
                            setUrlInput("");
                          }}
                        >
                          Clear
                        </Button>                                         
                        <Button
                          variant="primary"
                          onClick={() => {
                            const tempUrl = cloneDeep(url);
                            if (!tempUrl.contentful) {
                              sdk.entry.fields.title.setValue("Image");
                              setImageUrl(tempUrl.url);
                              setImageStatus(true);
                            }
                          }}
                        >
                          Proceed
                        </Button>
                    </div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {uploadExisting && (
            <div className="selectSection">
              <div className="selectFromExistingContainer">
                <div className="selectParentContainer">
                  <div
                    style={{
                      color: "#5b5a5a",
                      textAlign: "left",
                      marginLeft: "10px",
                    }}
                  >
                    {imageAssets.length > 0
                      ? "Existing Images :"
                      : "No Existing Images"}
                  </div>
                  <div className="existingImageContainer">
                    {(imageAssets || []).map((image, index) => (
                      <div key={index} className="radio-img">
                        <input
                          type="radio"
                          name="layout"
                          value={image?.sys?.id}
                          id={`radio-${index}`}
                          onChange={(e) => {
                            setSelectedImage(e.target.value);
                            getImageUrl(e.target.value, true);
                          }}
                        />
                        <label htmlFor={`radio-${index}`}>
                          <div
                            className="image"
                            style={{
                              backgroundImage: `url(${image?.fields?.file["en-US"]?.url})`,
                            }}
                            onClick={() => {
                              setSelectedImage(image?.sys?.id);
                              getImageUrl(image?.sys?.id, true);
                              setImageInExisting(image);
                            }}
                          ></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div></div>
                <div className="selectImageAndButtonContainer">
                  <div className="linkUploadSection">
                    {selectedImage ? (
                      <div className="linkUploadImage">
                        <img
                          src={imageInExisting?.fields?.file["en-US"]?.url}
                          alt={imageInExisting?.fields?.title["en-US"]}
                        />
                      </div>
                    ) : (
                      <div>No Preview Image</div>
                    )}
                  </div>
                  <div className="cancelProceedButtons">
                  {selectedImage && <div className="buttonContainer">
                      <Button
                        variant="negative"
                        testId="ClearButton"
                        onClick={() => setSelectedImage(null)}
                      >
                        Clear
                      </Button>
                      <Button
                        variant="primary"
                        testId="ProceedButton"
                        onClick={() => {
                          goToCreateUsi();
                        }}
                      >
                        Proceed
                      </Button>
                  </div>}
                  </div>
                </div>
              </div>
            </div>
          )}         
        </div>
      </div>

      <div className="radioButtonsSection">
        <div className="radioButtonsAlignContainer">
          <div>
            <input
              type="radio"
              id="html"
              name="fav_language"
              value={uploadYourImage}
              defaultChecked={uploadYourImage} // Set to true to check it by default
              onChange={(e) => {
                setUploadYourImage(true);
                setUploadAsLink(false);
                setUploadExisting(false);
              }}
            />
            <label htmlFor="html">Upload Image</label>
          </div>
          <div>
            <input
              type="radio"
              id="css"
              name="fav_language"
              value="CSS"
              checked={uploadAsLink}
              onChange={(e) => {
                setUploadAsLink(e.target.value);
                setUploadExisting(false);
                setUploadYourImage(false);
              }}
            />
            <label htmlFor="css">Enter Url</label>
          </div>
          <div>
            <input
              type="radio"
              id="javascript"
              name="fav_language"
              value="JavaScript"
              checked={uploadExisting}
              onChange={(e) => {
                setUploadExisting(e.target.value);
                setUploadAsLink(false);
                setUploadYourImage(false);
              }}
            />
            <label htmlFor="javascript">Select from Existing</label>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SelectImage;

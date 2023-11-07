/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react'
import './createHotspot.css'
import 'react-image-crop/dist/ReactCrop.css'
import CancelIcon from '@mui/icons-material/Cancel'
import CropIcon from '@mui/icons-material/Crop'
import cloneDeep from 'clone-deep'
import { Button, Stack, Menu, Tooltip, Notification } from '@contentful/f36-components'

/**
 * CreateHotspot component.
 * @param {string} imageUrl - The URL of the image.
 * @param {Object} sdk - The sdk object of current entry.
 * @param {string} imageName - The name of the image.
 * @returns {HTMLDivElement}
 */
const CreateHotspot = ({
  imageUrl,
  sdk,
  imageName,
}: any) => {

  interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    borderColor: string;
    hotspotX: number;
    hotspotY: number;
  } 
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef< HTMLDivElement >(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [editing, setEditing] = useState<boolean>(false)
  const [rect, setRect] = useState<Rectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    name: 'Boundingbox',
    borderColor: `#ffffff`,
    hotspotX: 0,
    hotspotY: 0,
  })
  const isDrawing = useRef(false)
  const [rectArray, setRectArray] = useState<Rectangle[]>([])
  const [showDetail, setShowDetail] = useState<boolean>(false)
  const [listArray, setListArray] = useState<any>([])
  const colorPalateList = [
    '#0058a3',
    '#ffdb00',
    '#cc0008',
    '#ffffff',
    '#f5f5f5',
    '#e9e9e9',
    '#cccccc',
    '#929292',
    '#484848',
    '#111111',
    '#004f2f',
    '#003f72',
    '#e00751',
    '#cc063d',
    '#b80029',
    '#333333',
    '#000000',
    '#004e93',
    '#808080',
    '#098a00',
    '#ffa424',
  ]
  const [nextDraw, setNextDraw] = useState<boolean>(true)
  const [canDraw, setCanDraw] = useState<boolean>(false)
  const [showColorPalate, setShowColorPalate] = useState<boolean>(false)
  const [selectedBoundingBoxIndex, setSelectedBoundingBoxIndex] = useState(null)
  const [draftRect, setDraftRect] = useState<Rectangle>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    name: 'Boundingbox',
    borderColor: `#ffffff`,
    hotspotX: 0,
    hotspotY: 0,
  })
  const [canvasInfo, setCanvas] = useState<HTMLCanvasElement|undefined>()

  //Initial use effect for drawing the canvas and image in the image container
  useEffect(() => {
    sdk.entry.fields.imageUrl.setValue(imageUrl)
    const container:HTMLDivElement|any = containerRef.current
    const canvas:HTMLCanvasElement | any = canvasRef.current
    const context = canvas?.getContext('2d')
    const image:HTMLImageElement|any = imageRef.current
    image.onload = () => {
      const containerWidth = container?.offsetWidth
      const containerHeight = container?.offsetHeight

      const imageWidth = image?.width
      const imageHeight = image?.height

      const widthRatio = containerWidth / imageWidth
      const heightRatio = containerHeight / imageHeight

      const scale = Math.min(widthRatio, heightRatio)

      const scaledWidth = imageWidth * scale
      const scaledHeight = imageHeight * scale

      canvas.width = scaledWidth
      canvas.height = scaledHeight
      context.drawImage(image, 0, 0, scaledWidth, scaledHeight)
      setCanvas(canvas)

      if (sdk.entry.fields.hotspots.getValue()?.hotspots) {
        setRectArray(sdk.entry.fields.hotspots.getValue().hotspots)
        setListArray(sdk.entry.fields.hotspots.getValue().hotspots)
      } else {
        sdk.entry.fields.hotspots.setValue({
          hotspots: [],
        })
        setRectArray(sdk.entry.fields.hotspots.getValue().hotspots)
        setListArray(sdk.entry.fields.hotspots.getValue().hotspots)
      }
    }
  }, [])

  /**
   * Handle Mouse Down Function happens when the mouse is down on the image and initiates the creation of hotspots.
   * @function handleMouseDown
   * @param {object} event - mouse event
   */
  const handleMouseDown = (event: any) => {
    if (canDraw) {
      if (!nextDraw) return
      const { offsetX, offsetY } = event.nativeEvent
      setDraftRect({
        x: offsetX,
        y: offsetY,
        width: 0,
        height: 0,
        name: 'Boundingbox',
        borderColor: `#ffffff`,
        hotspotX: 0,
        hotspotY: 0,
      })
      isDrawing.current = true
      setShowDetail(false)
      let tempRectArr = cloneDeep(rectArray)
      tempRectArr.unshift({
        x: offsetX,
        y: offsetY,
        width: 0,
        height: 0,
        name: 'Boundingbox',
        borderColor: `#ffffff`,
      })
      setRectArray(tempRectArr)
    }
  }

  /**
   * This Function happens after the drawing of hotspots initiated and calculates the coordinates while the moving of mouse
   * @function handleMouseMove
   * @param {object} event - Mouse Event 
   */
  const handleMouseMove = (event: any) => {
    if (canDraw) {
      if (!isDrawing.current) return
      const { offsetX, offsetY } = event.nativeEvent
      let temporaryBoundingBox: any = cloneDeep(draftRect)

      const width = offsetX - temporaryBoundingBox.x

      const height = offsetY - temporaryBoundingBox.y

      temporaryBoundingBox.width = width

      temporaryBoundingBox.height = height

      temporaryBoundingBox.hotspotX =
        temporaryBoundingBox.x + temporaryBoundingBox.width / 2

      temporaryBoundingBox.hotspotY =
        temporaryBoundingBox.y + temporaryBoundingBox.height / 2

      temporaryBoundingBox.name = 'Boundingbox'
      temporaryBoundingBox.x = (temporaryBoundingBox.x / canvasInfo.width) * 100
      temporaryBoundingBox.y =
        (temporaryBoundingBox.y / canvasInfo.height) * 100
      temporaryBoundingBox.width =
        (temporaryBoundingBox.width / canvasInfo.width) * 100
      temporaryBoundingBox.height =
        (temporaryBoundingBox.height / canvasInfo.height) * 100
      temporaryBoundingBox.hotspotX =
        (temporaryBoundingBox.hotspotX / canvasInfo.width) * 100
      temporaryBoundingBox.hotspotY =
        (temporaryBoundingBox.hotspotY / canvasInfo.height) * 100

      let tempRectArr = cloneDeep(rectArray)
      if (tempRectArr.length === 0) {
        tempRectArr.push(temporaryBoundingBox)
        setRectArray(tempRectArr)
      } else {
        tempRectArr[0] = temporaryBoundingBox
        setRectArray(tempRectArr)
      }
      setRect(temporaryBoundingBox)
    }
  }

  /**
   * This Function is happens while the drawing is end 
   * @function handleMouseUp
   */
  const handleMouseUp = () => {
    if(rect.width<0){
      rect.width=Math.abs(rect.width)
      rect.x=rect.x-rect.width
    }
    if(rect.height<0){
      rect.height=Math.abs(rect.height)
      rect.y=rect.y-rect.height
    }

    if (!canDraw) return
    let tempRect = cloneDeep(rect)
    if (tempRect.width === 0) {
      let BoundingArray = cloneDeep(rectArray)
      BoundingArray.shift()
      setRectArray(BoundingArray)
    } else {
      setShowDetail(true)

      setNextDraw(false)
    }
    isDrawing.current = false
  }

  /**
   * This Function is used for the updating the existing hotspot and while creating hotspots
   * @function changeRectDetail
   * @param {number } value - value of the co-ordinate
   * @param {string} key - key of the co-ordinate
   */
  const changeRectDetail = (value: any, key:any) => {
    if (key !== 'borderColor' && key !== 'name') {
      value = parseFloat(value)
    }
    let tempRect = JSON.parse(JSON.stringify(rect))
    tempRect[key] = value
    if(["x", "y", "width", "height"].includes(key)) {

      tempRect["hotspotY"] = tempRect.y + (tempRect.height/2)
      tempRect["hotspotX"] =tempRect.x + (tempRect.width/2)
    }

    setRect(tempRect)
  }

  /**
   * Saving the bounding box after clicking the save button
   * @function saveBoundingBox
   */
  const saveBoundingBox = () => {
    setListArray(rectArray)
    setCanDraw(false)
    setShowDetail(false)
    setNextDraw(true)
    setSelectedBoundingBoxIndex(null)
    setRect({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      name: 'Boundingbox',
      borderColor: `#ffffff`,
      hotspotX:0,
      hotspotY:0,
    })
    sdk.entry.fields.imageUrl.setValue(imageUrl)
    sdk.entry.fields.hotspots.setValue({ hotspots: rectArray })
    setEditing(false)
  }

  /**
   * Deleting the bounding box existing
   * @function deleteBoundingBox
   * @param {number} index - index of the bounding box
   * @param {Event} e - clicking event
   */
  const deleteBoundingBox = (index: number, e: any) => {
    e.stopPropagation()
    // if(showDetail){
    //   e.stopPropagation()
    //   Notification.error('You are creating or editing a hotspot', { title: 'Oops!' ,duration:2500})
    // }
    // else{
    //   setRect({
    //     x: 0,
    //     y: 0,
    //     width: 0,
    //     height: 0,
    //     name: 'Boundingbox',
    //     borderColor: `#ffffff`,
    //     hotspotX: 0,
    //     hotspotY: 0,
    //   })
    //   let tempArr = cloneDeep(rectArray)
    //   tempArr.splice(index, 1)
    //   setSelectedBoundingBoxIndex(null)
    //   setShowDetail(false)
    //   setEditing(false)
    //   setRectArray(tempArr)
    //   setListArray(tempArr)
    //   sdk.entry.fields.imageUrl.setValue(imageUrl)
    //   sdk.entry.fields.hotspots.setValue({ hotspots: tempArr })
    // }
    if(index===selectedBoundingBoxIndex){
      e.stopPropagation()
      Notification.error('You are editing this hotspot', { title: 'Oops!' ,duration:2500})
    }
    else{
      if(showDetail && canDraw){
        let tempArr = cloneDeep(rectArray)
        tempArr.splice(index+1, 1)
        let tempList=cloneDeep(listArray)
        tempList.splice(index,1)
        setRectArray(tempArr)
        setListArray(tempList)
        sdk.entry.fields.imageUrl.setValue(imageUrl)
        sdk.entry.fields.hotspots.setValue({ hotspots: tempArr })
      }
      else{
        setRect({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          name: 'Boundingbox',
          borderColor: `#ffffff`,
          hotspotX: 0,
          hotspotY: 0,
        })
        let tempArr = cloneDeep(rectArray)
        tempArr.splice(index, 1)
        setSelectedBoundingBoxIndex(null)
        setShowDetail(false)
        setEditing(false)
        setRectArray(tempArr)
        setListArray(tempArr)
        sdk.entry.fields.imageUrl.setValue(imageUrl)
        sdk.entry.fields.hotspots.setValue({ hotspots: tempArr })
      }
    }

  }

  /**
   * Cancels the editing an old or drawing a new hotspot 
   * @function cancelBoundingBox
   */
  const cancelBoundingBox = () => {

    setRectArray(listArray)
    setRect({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    name: 'Boundingbox',
    borderColor: `#ffffff`,
    hotspotX: 0,
    hotspotY: 0,
  })
    setShowDetail(false)
    setNextDraw(true)
    setCanDraw(false)
    setEditing(false)
    setSelectedBoundingBoxIndex(null)
  }

  /**
   * Validating the all the fields while editing or creating hotspots
   * @function validateField
   * @param {object} data - details of the sected rectangle 
   * @param {string} name - name of the input fields
   * @returns {boolean} return field error is true or false
   */
  const validateField=(data:any,name:string)=>{
    if(name==="name"){
      if(data.name.length===0){
        return true;
      }
      return false;
    }
    if(name==="width"){
      if(data?.width < 0 || data?.width > 100 - data.x)
      {
       return true;
      }
      return false;
    } 
    if(name==="height"){
      if(data?.height < 0 || data?.height > 100 - data.y)
      {
       return true;
      }
      return false;
    }
    if(name==="top"){
      if(data?.y < 0 || data?.y > 100 - data.height)
      {
       return true;
      }
      return false;
    } 
    if(name==="left"){
      if(data?.x < 0 || data?.x > 100 - data.width)
      {
       return true;
      }
      return false;
    } 
    if(name==="hotspotY")
    {
      if(data.hotspotY < data.y || (data.hotspotY > data.y + data.height))
     {
      return true;
     }
     return false;
    }
    if(name==="hotspotX")
    {
      if(data.hotspotX < data.x || (data.hotspotX > data.x + data.width))
     {
      return true;
     }
     return false;
    }
    if(name==="Button"){
     if(data.name.length!==0){
      if((data?.width < 0 || data?.width > 100 - data.x)
      ||(data?.height < 0 || data?.height > 100 - data.y)
      || (data?.y < 0 || data?.y > 100 - data.height) 
      ||(data?.x < 0 || data?.x > 100 - data.width) 
      || (data.hotspotY < data.y || (data.hotspotY > data.y + data.height))
      || (data.hotspotX < data.x || (data.hotspotX > data.x + data.width))){
        console.log("false")
        return false;
      }
      return true;
     }
     else if(data.name.length===0){
      console.log(data.name.length,true)
      return false;
     }
     else{
      return true;
     }
    }
    
  }

  /**
   * This function returns the maximum value of the fields
   * @function returnMax
   * @param {object} data - co-ordinates of rectangle
   * @param {string} name - name of the field
   * @returns {number}  max value for the field
   */
  const returnMax = (data:Rectangle,name:string) =>{
    if(name === "hotspotX"){
      return Math.round(rect?.x + rect?.width-0.5) ;
    }
    if(name === "hotspotY"){
      return Math.round(rect?.y + rect?.height-0.5) ;
    }
  }

  /**
   * This function returns the maximum value of the fields
   * @function returnMin
   * @param {object} data - co-ordinates of rectangle
   * @param {string} name - name of the field
   * @returns {number}  min value for the field
   */
  const returnMin = (data:Rectangle,name:string)=>{
    if(name === "hotspotX"){
      return Math.round(rect?.x + 0.5) ;
    }
    if(name === "hotspotY"){
      return Math.round(rect?.y + 0.5) ;
    }
  }

  //This useEffect is used to redraw the hotspots whenever it was changed
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const context: any = canvas.getContext('2d')
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
      if (rectArray.length > 0) {
        rectArray.forEach((element: any) => {
          context.strokeStyle = element.borderColor
          context.lineWidth = 1.5
          context.strokeRect(
            (element.x * canvasInfo.width) / 100,
            (element.y * canvasInfo.height) / 100,
            (element.width * canvasInfo.width) / 100,
            (element.height * canvasInfo.height) / 100
          )
          if (element.width !== 0 && element.height !== 0) {
            context.beginPath()
            context.arc(
              (element.hotspotX * canvas.width) / 100,
              (element.hotspotY * canvas.height) / 100,
              10,
              0,
              2 * Math.PI
            )
            context.fillStyle = 'white'
            context.fill()

            context.beginPath()
            context.arc(
              (element.hotspotX * canvas.width) / 100,
              (element.hotspotY * canvas.height) / 100,
              8,
              0,
              2 * Math.PI
            )
            context.fillStyle = 'rgb(3,111,227)'
            context.fill()
          }
        })
      }
    }
  }, [rectArray])

  //This useEffect happens for setting the coordinates while the mousemove happens
  useEffect(() => {
    let tempArray: any = cloneDeep(rectArray)
    let index: any = cloneDeep(selectedBoundingBoxIndex)
    if (index !== null && index > -1) {
      tempArray[index] = rect
      setRectArray(tempArray)
    } else {
      if (!rect.width) return
      tempArray[0] = rect
      setRectArray(tempArray)
    }
  }, [rect])

  //This useeffect happens when a existing hotspot is selected and shows the values in right side
  useEffect(() => {
    if (selectedBoundingBoxIndex !== null) {
      let tempArr = cloneDeep(listArray)
      setRectArray(listArray)
      let selectedRect = tempArr[selectedBoundingBoxIndex]
      setRect(selectedRect)
      setShowDetail(true)
    }
  }, [selectedBoundingBoxIndex])

  return (
    <div className="createContainer">
      <div className="hotspotlist_container">
        <div className="hotspotlist_title">Existing Hotspots</div>

        {listArray.length > 0
          ? listArray.map((rect: any, index: any) => {
              return (
                <div className="hotspot_card" key={index}>
                  <div
                    className="hotspot_title_container"
                    onClick={() => {
                      setSelectedBoundingBoxIndex(index)
                      setEditing(true)
                    }}
                    role="none"
                    style={
                      selectedBoundingBoxIndex === index
                        ? {
                            boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
                            border: '1px solid rgb(3,111,227)',
                          }
                        : {}
                    }
                  >
                    <Tooltip
                          placement="top"
                          content={`Colour : ${ rect.borderColor}`}
                        >
                    <div
                      className="hotspot_image_logo"
                      style={{
                        background: rect.borderColor,
                      }}
                    ></div>
                    </Tooltip>
                    
                    <div className="hotpot_title">
                      {rect?.name ? rect?.name : 'bounding box'}
                    </div>
                    <div
                    className="cancel_icon"
                    onClick={(e) => deleteBoundingBox(index, e)}
                    role="none"
                  ><Tooltip content="Remove Hotspot" placement="top">
                    <CancelIcon fontSize="small" />
                    </Tooltip>
                  </div>
                  </div>
                </div>
              )
            })
          : ''}
      </div>
      <div className="image_container">
        <div className="image_title_container">
          <div className="image_title">
            {imageName ? imageName : 'Image Editor'}
          </div>
          <div className="add_hotspot_button">
            {editing || canDraw ? (
              <div
                className="add_icon"
                style={{ opacity: 0.5, cursor: 'auto' }}
                role="none"
              >
                <CropIcon color="primary" />
              </div>
            ) : (
              <div
                className="add_icon"
                style={
                  !canDraw ? { opacity: 1 } : { opacity: 0.5, cursor: 'auto' }
                }
                onClick={() => {
                  setCanDraw(!canDraw)
                }}
                role="none"
              >
                <Tooltip content="Select Area" placement="left">
                  <CropIcon color="primary" />
                </Tooltip>
              </div>
            )}
          </div>
        </div>
        <div
          id="image_container"
          className="editable_image_container"
          ref={containerRef}
        >
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ position: 'absolute' }}
            id="usiCanvas"
          />
          <img
            id="uploaded_image"
            ref={imageRef}
            src={imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', display: 'none' }}
          />
        </div>
      </div>
      <div className="hotspot_details_container">
      {showDetail ? (
          <>
            <div className="boundingBoxDetailContainer">
              <div className="boundingBox">
                <div>Name</div>
                <input
                  type="text"
                  value={rect?.name}
                  style={validateField(rect,"name") ? {border:"1px solid red"}:{border:"none"}}
                  onChange={(e) => changeRectDetail(e.target.value, 'name')}
                />
              </div>
              <div className="boundingBox">
                <div> Y</div>
                <input
                  type="number"
                  min={1}
                  max={100-rect?.height}
                  value={Math.round(rect?.y)}
                  style={validateField(rect,"top") ? {border:"1px solid red"}:{border:"none"}}
                  onChange={(e) => changeRectDetail(e.target.value, 'y')}
                />
              </div>
              <div className="boundingBox">
                <div>X</div>
                <input
                  type="number"
                  min={1}
                  max={100-rect?.width}
                  style={validateField(rect,"left") ? {border:"1px solid red"}:{border:"none"}}
                  value={Math.round(rect?.x)}
                  onChange={(e) => changeRectDetail(e.target.value, 'x')}
                />
              </div>
              <div className="boundingBox">
                <div>Height</div>
                <input
                  type="number"
                  min={1}
                  max={100 - rect?.y}
                  style={validateField(rect,"height") ? {border:"1px solid red"}:{border:"none"}}
                  value={Math.round(rect?.height)}
                  onChange={(e) => changeRectDetail(e.target.value, 'height')}
                />
              </div>
              <div className="boundingBox">
                <div>Width</div>
                <input
                  type="number"
                  min={1}
                  max={100 - rect?.x}
                  style={validateField(rect,"width") ? {border:"1px solid red"}:{border:"none"}}
                  value={Math.round(rect?.width)}
                  onChange={(e) => changeRectDetail(e.target.value, 'width')}
                />
              </div>
              <div className="boundingBox">
                <div>Border Color</div>
                <Menu
                  isOpen={showColorPalate}
                  onClose={() => setShowColorPalate(false)}
                >
                  <Menu.Trigger>
                    <div
                      style={{
                        background: `${rect?.borderColor}`,
                        width: '20px',
                        height: '20px',
                        border: '1px solid gray',
                      }}
                      onClick={() => setShowColorPalate(!showColorPalate)}
                      role="none"
                    ></div>
                  </Menu.Trigger>
                  <Menu.List
                    style={{
                      display: 'flex',
                      width: '190px',
                      flexWrap: 'wrap',
                      height: '150px',
                      gap: '10px',
                      padding: '10px',
                    }}
                  >
                    {colorPalateList.map((element, index) => {
                      return (
                        <div
                          key={index}
                          style={{
                            width: '20px',
                            height: '20px',
                            background: `${element}`,
                          }}
                          onClick={() => {
                            setRect({ ...rect, 'borderColor': element })
                            setShowColorPalate(false)
                          }}
                          role="none"
                        ></div>
                      )
                    })}
                  </Menu.List>
                </Menu>
              </div>
              <div className="boundingBox">
                <div>Hotspot Y</div>
                <input
                  type="number"
                  min={returnMin(rect,"hotspotY")}
                  max={returnMax(rect,"hotspotY")}
                  style={validateField(rect,"hotspotY") ? {border:"1px solid red"}:{border:"none"}}
                  value={Math.round(rect?.hotspotY)}
                  onChange={(e) => changeRectDetail(e.target.value, 'hotspotY')}
                />
              </div>
              <div className="boundingBox">
                <div> Hotspot X</div>
                <input
                  type="number"
                  min={returnMin(rect,"hotspotX")}
                  max={returnMax(rect,"hotspotX")}
                  style={validateField(rect,"hotspotX") ? {border:"1px solid red"}:{border:"none"}}
                  value={Math.round(rect?.hotspotX)}
                  onChange={(e) => changeRectDetail(e.target.value, 'hotspotX')}
                />
              </div>
              <div className="buttonSection">
                <Stack>
                  <Button
                    variant="positive"
                    size="small"
                    isDisabled={validateField(rect,"Button") ? false : true }
                    onClick={() => saveBoundingBox()}
                  >
                    Save
                  </Button>
                  <Button onClick={() => cancelBoundingBox()} size="small">
                    Cancel
                  </Button>
                </Stack>
              </div>
            </div>
          </>
        ) : (
          <div className="userText">
            Click the crop icon and draw a rectangle in image. <br /> or <br />{' '}
            Select an Existing hotspot.
          </div>
        )}
      </div>
    </div>
  )
}
export default CreateHotspot

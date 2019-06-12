import Tiff from "tiff.js";
import { ImageInfo } from "./FabricsML/Types/ImageInfo";
import { MouseUsageMode } from "./FabricsML/Types/MouseUsageMode";
import { SelectionInfoType } from "./FabricsML/Types/SelectionInfoType";
import { SelectionInfoMode } from "./FabricsML/Types/SelectionInfoMode";
import { ImageInfoAreasEditor } from "./FabricsML/Components/ImageInfoAreasEditor";

let gImageInfoList = [];
let gImageInfoAreasEditor = null;

///////////////////////////////////////////////////////////////////////////////
// EVENTS
///////////////////////////////////////////////////////////////////////////////

// buttonLoadImageFileClick
function buttonLoadImageFileClick(event) {
    inputImageFile.accept = ".tif,.tiff";
    inputImageFile.onchange = function (event) {
        for (let i = 0; i < event.currentTarget.files.length; i++) {
            // create image info
            let imageInfo = new ImageInfo(event.currentTarget.files[i]);

            // load from file
            let fileReader = new FileReader();
            fileReader.imageInfo = imageInfo;
            fileReader.onload = (event) => {

                // Tiff tag for smart SEM
                const TIFFTAG_SEM = 34118;
                // Tiff tag for Fibics
                const TIFFTAG_Fibics = 51023;

                // load tiff from file
                let tiff = new Tiff({ buffer: event.currentTarget.result });
                let sam = tiff.getField(TIFFTAG_SEM);
                let fibics = tiff.getField(TIFFTAG_Fibics);
                event.currentTarget.imageInfo.copyFromCanvas(tiff.toCanvas());

                // read SAM info
                if (sam > 0) {
                    let enc = new TextDecoder("utf-8");
                    let fileString = enc.decode(event.currentTarget.result);
                    let fileStrings = fileString.split("\n")
                    let imagePixelSizeIndex = fileStrings.findIndex(val => val.trim().startsWith("Image Pixel Size"));
                    if (imagePixelSizeIndex >= 0) {
                        let imagePixelSizeSubstrs = fileStrings[imagePixelSizeIndex].split("=");
                        let imagePixelSizeValueStr = imagePixelSizeSubstrs[1].trim();
                        let imagePixelSize = parseFloat(imagePixelSizeValueStr);
                        if (imagePixelSizeValueStr.indexOf("nm") >= 0)
                            imagePixelSize *= 1.0e-6;
                        // set image pixel size
                        event.currentTarget.imageInfo.imageResolution = imagePixelSize.toFixed(7);
                    }
                }

                // image mask canvas
                if (!gImageInfoAreasEditor.imageInfo) {
                    gImageInfoAreasEditor.setImageInfo(event.currentTarget.imageInfo);
                    updateResolutionInputs();
                }
            }
            fileReader.readAsArrayBuffer(imageInfo.fileRef);

            // add image info
            gImageInfoList.push(imageInfo);
        }
        // update select images
        selectImagesUpdate();
    }
    inputImageFile.click();
}

// selectImagesUpdate
function selectImagesUpdate() {
    // get selected index
    var selectedIndex = selectImages.selectedIndex;

    // clear childs
    while (selectImages.firstChild) { selectImages.removeChild(selectImages.firstChild); }

    // add items
    for (var i = 0; i < gImageInfoList.length; i++) {
        // create new selector
        var optionImage = document.createElement('option');
        optionImage.value = gImageInfoList[i];
        optionImage.innerHTML = gImageInfoList[i].fileRef.name;
        selectImages.appendChild(optionImage);
    }

    // set selected index
    if ((selectedIndex < 0) && (gImageInfoList.length > 0))
        selectedIndex = 0;
    selectImages.selectedIndex = selectedIndex;
    updateResolutionInputs();
}

// scale down bnt click
function buttonScaleDownClick(event) {
    gImageInfoAreasEditor.setScale(gImageInfoAreasEditor.imageScale / 2);
    scaleFactor.innerText = Math.round(gImageInfoAreasEditor.imageScale * 100) + "%";
}

// scale up bnt click
function buttonScaleUpClick(event) {
    gImageInfoAreasEditor.setScale(gImageInfoAreasEditor.imageScale * 2);
    scaleFactor.innerText = Math.round(gImageInfoAreasEditor.imageScale * 100) + "%";
}

// selectImagesOnChange
function selectImagesOnChange(event) {
    gImageInfoAreasEditor.setImageInfo(gImageInfoList[selectImages.selectedIndex]);
    updateResolutionInputs();
}

// updateResolutionInputs
function updateResolutionInputs() {
    if (gImageInfoAreasEditor.imageInfo) {
        let imageInfo = gImageInfoAreasEditor.imageInfo;
        inputImageDimXpx.value = imageInfo.canvasImage.width;
        inputImageDimYpx.value = imageInfo.canvasImage.height;
        inputImageDimXmm.value = (imageInfo.canvasImage.width * imageInfo.imageResolution).toFixed(5);
        inputImageDimYmm.value = (imageInfo.canvasImage.height * imageInfo.imageResolution).toFixed(5);
        inputImageResmm.value = imageInfo.imageResolution;
    }
}


// window - onload
window.onload = (event) => {
    // create ImageInfoAreasEditor
    gImageInfoAreasEditor = new ImageInfoAreasEditor(image_canvas_panel);
    gImageInfoAreasEditor.setMouseUsageMode(MouseUsageMode.DRAG)
    image_canvas_panel.addEventListener("mousemove", (event) => gImageInfoAreasEditor.onMouseMove(event));
    image_canvas_panel.addEventListener("mousedown", (event) => gImageInfoAreasEditor.onMouseDown(event));
    image_canvas_panel.addEventListener("mouseup", (event) => gImageInfoAreasEditor.onMouseUp(event));
    document.addEventListener("keydown", (event) => gImageInfoAreasEditor.onKeyDown(event));

    // apply events
    buttonLoadImageFile.addEventListener("click", buttonLoadImageFileClick);

    // events
    buttonScaleDown.onclick = buttonScaleDownClick;
    buttonScaleUp.onclick = buttonScaleUpClick;

    // update info
    updateResolutionInputs()
}

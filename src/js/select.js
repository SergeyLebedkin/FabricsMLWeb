import Tiff from "tiff.js";
import { ImageInfo } from "./FabricsML/Types/ImageInfo";
import { MouseUsageMode } from "./FabricsML/Types/MouseUsageMode";
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
        let imageInfo = new ImageInfo(event.currentTarget.files[0]);
        imageInfo.onloadImageFile = (imageInfo) => {
            // image mask canvas
            if (!gImageInfoAreasEditor.imageInfo) {
                gImageInfoAreasEditor.setImageInfo(imageInfo);
                updateResolutionInputs();
            }
        }
        imageInfo.loadImageFile(event.currentTarget.files[0]);

        // add image info
        gImageInfoList.push(imageInfo);
        // update select images
        selectImagesUpdate();
    }
    inputImageFile.click();
}

// buttonLoadImageDataFileClick
function buttonLoadImageDataFileClick(event) {
    // check for current image info
    if (!gImageInfoAreasEditor.imageInfo) return;

    // load image data xml
    inputImageDataFile.accept = ".xml";
    inputImageDataFile.onchange = (event) => {
        gImageInfoAreasEditor.imageInfo.onloadImageDataFile = (imageInfo) => {
            gImageInfoAreasEditor.drawImageInfo();
        }
        gImageInfoAreasEditor.imageInfo.loadImageDataFile(event.currentTarget.files[0]);
    }
    inputImageDataFile.click();
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
    buttonLoadImageDataFile.addEventListener("click", buttonLoadImageDataFileClick);

    // events
    selectImages.onchange = selectImagesOnChange;
    buttonScaleDown.onclick = buttonScaleDownClick;
    buttonScaleUp.onclick = buttonScaleUpClick;

    // update info
    updateResolutionInputs()
}

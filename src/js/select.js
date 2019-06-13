import Tiff from "tiff.js";
import { ImageInfo } from "./FabricsML/Types/ImageInfo";
import { MouseUsageMode } from "./FabricsML/Types/MouseUsageMode";
import { ImageInfoAreasEditor } from "./FabricsML/Components/ImageInfoAreasEditor";

let gImageInfoList = [];
let gImageInfoAreasEditor = null;
let gImageInfoAreasEditorHighRes = null;

///////////////////////////////////////////////////////////////////////////////
// EVENTS
///////////////////////////////////////////////////////////////////////////////

// buttonLoadImageFileClick
function buttonLoadImageFileClick(event) {
    inputImageFile.accept = ".tif,.tiff";
    inputImageFile.onchange = function (event) {
        for (let i = 0; i < event.currentTarget.files.length; i++) {
            let imageInfo = new ImageInfo();
            imageInfo.onloadImageFile = (imageInfo) => {
                // add image info
                gImageInfoList.push(imageInfo);
                // update select images
                selectImagesUpdate();
                // image mask canvas
                if (!gImageInfoAreasEditor.imageInfo) {
                    gImageInfoAreasEditor.setImageInfo(imageInfo);
                    updateResolutionInputs();
                }
            }
            imageInfo.loadImageFile(event.currentTarget.files[i]);
        }
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

// buttonLoadImageFileHRClick
function buttonLoadImageFileHRClick(event) {
    if (!gImageInfoAreasEditor.imageInfo) return;
    inputImageFileHR.accept = ".tif,.tiff";
    inputImageFileHR.onchange = function (event) {
        for (let i = 0; i < event.currentTarget.files.length; i++) {
            let imageInfo = new ImageInfo();
            imageInfo.onloadImageFile = (imageInfo) => {
                // add image info
                gImageInfoAreasEditor.imageInfo.highResolutionImageInfos.push(imageInfo);
                // update select images
                selectImagesHRUpdate();
                // image mask canvas
                if (!gImageInfoAreasEditorHighRes.imageInfo) {
                    gImageInfoAreasEditorHighRes.setImageInfo(imageInfo);
                }
            }
            imageInfo.loadImageFile(event.currentTarget.files[i]);
        }
    }
    inputImageFileHR.click();
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

// selectImagesHRUpdate
function selectImagesHRUpdate() {
    if (!gImageInfoAreasEditor.imageInfo) return;
    // get selected index
    let selectedIndex = selectImagesHR.selectedIndex;

    // clear childs
    while (selectImagesHR.firstChild) { selectImagesHR.removeChild(selectImagesHR.firstChild); }

    // add items
    let imageInfo = gImageInfoAreasEditor.imageInfo;
    for (var i = 0; i < imageInfo.highResolutionImageInfos.length; i++) {
        // create new selector
        var optionImage = document.createElement('option');
        optionImage.value = imageInfo.highResolutionImageInfos[i];
        optionImage.innerHTML = imageInfo.highResolutionImageInfos[i].fileRef.name;
        selectImagesHR.appendChild(optionImage);
    }

    // set selected index
    if ((selectedIndex < 0) && (imageInfo.highResolutionImageInfos.length > 0))
        selectedIndex = 0;
    selectImagesHR.selectedIndex = selectedIndex;
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

// scale down hr bnt click
function buttonScaleDownHRClick(event) {
    gImageInfoAreasEditorHighRes.setScale(gImageInfoAreasEditorHighRes.imageScale / 2);
    scaleFactorHR.innerText = Math.round(gImageInfoAreasEditorHighRes.imageScale * 100) + "%";
}

// scale up hr bnt click
function buttonScaleUpHRClick(event) {
    gImageInfoAreasEditorHighRes.setScale(gImageInfoAreasEditorHighRes.imageScale * 2);
    scaleFactorHR.innerText = Math.round(gImageInfoAreasEditorHighRes.imageScale * 100) + "%";
}

// selectImagesOnChange
function selectImagesOnChange(event) {
    gImageInfoAreasEditor.setImageInfo(gImageInfoList[selectImages.selectedIndex]);
    updateResolutionInputs();
}

// selectImagesOnChangeHR
function selectImagesOnChangeHR(event) {
    gImageInfoAreasEditorHighRes.setImageInfo(gImageInfoList[selectImages.selectedIndex].highResolutionImageInfos[selectImagesHR.selectedIndex]);
    console.log("Hello")
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

    // create ImageInfoAreasEditor for high res images
    gImageInfoAreasEditorHighRes = new ImageInfoAreasEditor(image_canvas_panel_high_res);
    gImageInfoAreasEditorHighRes.setMouseUsageMode(MouseUsageMode.DRAG)
    image_canvas_panel_high_res.addEventListener("mousemove", (event) => gImageInfoAreasEditorHighRes.onMouseMove(event));
    image_canvas_panel_high_res.addEventListener("mousedown", (event) => gImageInfoAreasEditorHighRes.onMouseDown(event));
    image_canvas_panel_high_res.addEventListener("mouseup", (event) => gImageInfoAreasEditorHighRes.onMouseUp(event));
    document.addEventListener("keydown", (event) => gImageInfoAreasEditorHighRes.onKeyDown(event));

    // apply events
    buttonLoadImageFile.addEventListener("click", buttonLoadImageFileClick);
    buttonLoadImageDataFile.addEventListener("click", buttonLoadImageDataFileClick);
    buttonLoadImageFileHR.addEventListener("click", buttonLoadImageFileHRClick);

    // events
    selectImages.onchange = selectImagesOnChange;
    buttonScaleDown.onclick = buttonScaleDownClick;
    buttonScaleUp.onclick = buttonScaleUpClick;
    buttonScaleDownHR.onclick = buttonScaleDownHRClick;
    buttonScaleUpHR.onclick = buttonScaleUpHRClick;
    selectImages.addEventListener("change",  selectImagesOnChange);
    selectImagesHR.addEventListener("change",  selectImagesOnChangeHR);

    // update info
    updateResolutionInputs()
}

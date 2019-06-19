import Tiff from "tiff.js";
import { ImageInfo } from "./FabricsML/Types/ImageInfo";
import { MouseUsageMode } from "./FabricsML/Types/MouseUsageMode";
import { SelectionInfoType } from "./FabricsML/Types/SelectionInfoType";
import { SelectionInfoMode } from "./FabricsML/Types/SelectionInfoMode";
import { ImageInfoAreasEditor } from "./FabricsML/Components/ImageInfoAreasEditor";
import { ImageInfoIntensityHistViewer } from "./FabricsML/Components/ImageInfoIntensityHistViewer";

let gImageInfoList = [];
let gImageInfoAreasEditor = null;
let gImageInfoIntensityHistViewer = null;

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
                if (!gImageInfoIntensityHistViewer.imageInfo) {
                    gImageInfoIntensityHistViewer.setImageInfo(imageInfo);
                    updateIntensityInputs();
                }
            }
            imageInfo.loadImageFile(event.currentTarget.files[i]);
        }
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
    updateIntensityInputs();
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

// rangeIntensityLowOnChange
function rangeIntensityLowOnChange(event) {
    if (gImageInfoIntensityHistViewer.imageInfo) {
        textIntensityLow.value = rangeIntensityLow.value;
        gImageInfoIntensityHistViewer.imageInfo.setIntensityLow(rangeIntensityLow.value);
        gImageInfoIntensityHistViewer.imageInfo.updateHilightCanvasAndIntensity();
        gImageInfoIntensityHistViewer.drawHistogram();
        gImageInfoAreasEditor.drawImageInfo();
    }
}

// rangeIntensityMediumOnChange
function rangeIntensityMediumOnChange(event) {
    if (gImageInfoIntensityHistViewer.imageInfo) {
        textIntensityMedium.value = rangeIntensityMedium.value;
        gImageInfoIntensityHistViewer.imageInfo.setIntensityMedium(rangeIntensityMedium.value);
        gImageInfoIntensityHistViewer.imageInfo.updateHilightCanvasAndIntensity();
        gImageInfoIntensityHistViewer.drawHistogram();
        gImageInfoAreasEditor.drawImageInfo();
    }
}

// rangeIntensityHighOnChange
function rangeIntensityHighOnChange(event) {
    if (gImageInfoIntensityHistViewer.imageInfo) {
        textIntensityHigh.value = rangeIntensityHigh.value;
        gImageInfoIntensityHistViewer.imageInfo.setIntensityHigh(rangeIntensityHigh.value);
        gImageInfoIntensityHistViewer.imageInfo.updateHilightCanvasAndIntensity();
        gImageInfoIntensityHistViewer.drawHistogram();
        gImageInfoAreasEditor.drawImageInfo();
    }
}

// selectImagesOnChange
function selectImagesOnChange(event) {
    gImageInfoAreasEditor.setImageInfo(gImageInfoList[selectImages.selectedIndex]);
    gImageInfoIntensityHistViewer.setImageInfo(gImageInfoList[selectImages.selectedIndex]);
    updateIntensityInputs();
    updateResolutionInputs();
}

// buttonSaveFabricsOnClick
function buttonSaveFabricsOnClick(event) {
    // base check
    if (!gImageInfoAreasEditor.imageInfo) return;

    // get file name
    var filename = gImageInfoAreasEditor.imageInfo.fileRef.name.substr(0, gImageInfoAreasEditor.imageInfo.fileRef.name.lastIndexOf('.'));

    // generate xml string
    var regionsString = '<?xml version="1.0" encoding="utf-8"?>' + "\r\n";
    regionsString += "<FabricsMLData>" + "\r\n";
    regionsString += gImageInfoAreasEditor.imageInfo.toStringXmlNode() + "\r\n";
    regionsString += "<HighResolutionImageData>" + "\r\n";
    regionsString += "</HighResolutionImageData>" + "\r\n";
    regionsString += "</FabricsMLData>" + "\r\n";

    downloadFile(regionsString, filename + ".xml", 'text/plain');
}

// updateIntensityInputs
function updateIntensityInputs() {
    if (gImageInfoIntensityHistViewer.imageInfo) {
        rangeIntensityLow.value = gImageInfoIntensityHistViewer.imageInfo.intensityLow;
        rangeIntensityMedium.value = gImageInfoIntensityHistViewer.imageInfo.intensityMedium;
        rangeIntensityHigh.value = gImageInfoIntensityHistViewer.imageInfo.intensityHigh;
        textIntensityLow.value = rangeIntensityLow.value;
        textIntensityMedium.value = rangeIntensityMedium.value;
        textIntensityHigh.value = rangeIntensityHigh.value;
    }
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
    gImageInfoIntensityHistViewer = new ImageInfoIntensityHistViewer(histogram_canvas_panel);
    gImageInfoIntensityHistViewer.drawHistogram();

    // create ImageInfoAreasEditor
    gImageInfoAreasEditor = new ImageInfoAreasEditor(image_canvas_panel);
    image_canvas_panel.addEventListener("mousemove", (event) => gImageInfoAreasEditor.onMouseMove(event));
    image_canvas_panel.addEventListener("mousedown", (event) => gImageInfoAreasEditor.onMouseDown(event));
    image_canvas_panel.addEventListener("mouseup", (event) => gImageInfoAreasEditor.onMouseUp(event));
    image_canvas_panel.addEventListener("mouseup", (event) => gImageInfoIntensityHistViewer.drawHistogram());
    document.addEventListener("keydown", (event) => gImageInfoAreasEditor.onKeyDown(event));

    // apply events
    buttonLoadImageFile.addEventListener("click", buttonLoadImageFileClick);

    // radios
    radioDraw.addEventListener("click", event => gImageInfoAreasEditor.setMouseUsageMode(MouseUsageMode.DRAW));
    radioDrag.addEventListener("click", event => gImageInfoAreasEditor.setMouseUsageMode(MouseUsageMode.DRAG));
    radioRect.addEventListener("click", event => gImageInfoAreasEditor.setSelectionInfoType(SelectionInfoType.RECT));
    radioArea.addEventListener("click", event => gImageInfoAreasEditor.setSelectionInfoType(SelectionInfoType.AREA));
    radioInclude.addEventListener("click", event => gImageInfoAreasEditor.setSelectionInfoMode(SelectionInfoMode.INCLUDE));
    radioExclude.addEventListener("click", event => gImageInfoAreasEditor.setSelectionInfoMode(SelectionInfoMode.EXCLUDE));

    // checkboxes
    checkboxShowOriginal.addEventListener("click", event => gImageInfoAreasEditor.setShowOriginalImage(checkboxShowOriginal.checked));

    selectImages.onchange = selectImagesOnChange;
    rangeIntensityLow.oninput = rangeIntensityLowOnChange;
    rangeIntensityMedium.oninput = rangeIntensityMediumOnChange;
    rangeIntensityHigh.oninput = rangeIntensityHighOnChange;
    buttonSaveFabrics.onclick = buttonSaveFabricsOnClick;
    buttonScaleDown.onclick = buttonScaleDownClick;
    buttonScaleUp.onclick = buttonScaleUpClick;

    updateIntensityInputs();
    updateResolutionInputs();
}

///////////////////////////////////////////////////////////////////////////////
// utils
///////////////////////////////////////////////////////////////////////////////

// downloadFile
function downloadFile(text, name, type) {
    var a = document.createElement("a");
    var file = new Blob([text], { type: type });
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}

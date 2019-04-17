import Tiff from "tiff.js"
import { ImageInfo } from "./FabricsML/Types/ImageInfo"
import { AreaSelectionMode } from "./FabricsML/Types/AreaSelectionMode"
import { MouseSelectionMode } from "./FabricsML/Types/MouseSelectionMode"
import { ImageInfoAreasEditor } from "./FabricsML/Components/ImageInfoAreasEditor"

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
                // load tiff from file
                let tiff = new Tiff({ buffer: event.currentTarget.result });
                event.currentTarget.imageInfo.copyFromCanvas(tiff.toCanvas());

                // image mask canvas
                if (!gImageInfoAreasEditor.imageInfo)
                    gImageInfoAreasEditor.setImageInfo(event.currentTarget.imageInfo);
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
    gImageInfoAreasEditor.setIntensityLow(rangeIntensityLow.value);
}

// rangeIntensityMediumOnChange
function rangeIntensityMediumOnChange(event) {
    gImageInfoAreasEditor.setIntensityMedium(rangeIntensityMedium.value);
}

// rangeIntensityHighOnChange
function rangeIntensityHighOnChange(event) {
    gImageInfoAreasEditor.setIntensityHigh(rangeIntensityHigh.value);
}

// checkboxShowOriginalOnChange
function checkboxShowOriginalOnChange(event) {
    gImageInfoAreasEditor.setShowOriginalImage(checkboxShowOriginal.checked);
}

// radioIncludeOnClick
function radioIncludeOnClick(event) {
    gImageInfoAreasEditor.selectionAreaMode = AreaSelectionMode.INCLUDE;
}

// radioExcludeOnClick
function radioExcludeOnClick(event) {
    gImageInfoAreasEditor.selectionAreaMode = AreaSelectionMode.EXCLUDE;
}

// radioDrawOnClick
function radioDrawOnClick(event) {
    gImageInfoAreasEditor.setMouseSelectionMode(MouseSelectionMode.DRAW);
}

// radioDragOnClick
function radioDragOnClick(event) {
    gImageInfoAreasEditor.setMouseSelectionMode(MouseSelectionMode.DRAG);
}

// selectImagesOnChange
function selectImagesOnChange(event) {
    gImageInfoAreasEditor.setImageInfo(gImageInfoList[selectImages.selectedIndex]);
}

// buttonSaveFabricsOnClick
function buttonSaveFabricsOnClick(event) {
    // base check
    if (!gImageInfoAreasEditor.imageInfo) return;

    // get file name
    var filename = gImageInfoAreasEditor.imageInfo.fileRef.name.substr(0, gImageInfoAreasEditor.imageInfo.fileRef.name.lastIndexOf('.'));

    // generate xml string
    var regionsString = '<?xml version="1.0" encoding="utf-8"?>' + "\r\n";
    regionsString += '<FabricsMLData>' + "\r\n";
    regionsString += '  <ImageData>' + "\r\n";
    regionsString += '    <ImageName FileName="' + gImageInfoAreasEditor.imageInfo.fileRef.name + '"></ImageName>' + "\r\n";
    regionsString += '    <ImageBasename FileBasename="' + filename + '"></ImageBasename>' + "\r\n";
    regionsString += '  </ImageData>' + "\r\n";
    regionsString += '</FabricsMLData>';
    regionsString += '<HighResolutionImageData>' + "\r\n";
    regionsString += '</HighResolutionImageData>';

    downloadFile(regionsString, filename + ".xml", 'text/plain');
}

// window - onload
window.onload = (event) => {
    // create globals
    gImageInfoAreasEditor = new ImageInfoAreasEditor(image_canvas_panel);

    // upply events
    buttonLoadImageFile.onclick = buttonLoadImageFileClick;
    radioInclude.onclick = radioIncludeOnClick;
    radioExclude.onclick = radioExcludeOnClick;
    radioDraw.onclick = radioDrawOnClick;
    radioDrag.onclick = radioDragOnClick;
    selectImages.onchange = selectImagesOnChange;
    rangeIntensityLow.oninput = rangeIntensityLowOnChange;
    rangeIntensityMedium.oninput = rangeIntensityMediumOnChange;
    rangeIntensityHigh.oninput = rangeIntensityHighOnChange;
    checkboxShowOriginal.onchange = checkboxShowOriginalOnChange;
    buttonSaveFabrics.onclick = buttonSaveFabricsOnClick;
    buttonScaleDown.onclick = buttonScaleDownClick;
    buttonScaleUp.onclick = buttonScaleUpClick;
}

///////////////////////////////////////////////////////////////////////////////
// utils
///////////////////////////////////////////////////////////////////////////////

// get mause position for element
function getMousePosByElement(node, event) {
    var rect = node.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    }
}

// downloadFile
function downloadFile(text, name, type) {
    var a = document.createElement("a");
    var file = new Blob([text], { type: type });
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
}

import Tiff from "tiff.js";
import { ImageInfo } from "./FabricsML/Types/ImageInfo";
import { AreaSelectionMode } from "./FabricsML/Types/AreaSelectionMode";
import { MouseSelectionMode } from "./FabricsML/Types/MouseSelectionMode";
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

                if (!gImageInfoIntensityHistViewer.imageInfo)
                    gImageInfoIntensityHistViewer.setImageInfo(event.currentTarget.imageInfo);
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
    if (gImageInfoIntensityHistViewer.imageInfo) {
        gImageInfoIntensityHistViewer.imageInfo.setIntensityLow(rangeIntensityLow.value);
        gImageInfoIntensityHistViewer.imageInfo.updateHilightCanvasAndIntensity();
        gImageInfoIntensityHistViewer.drawHistogram();
        gImageInfoAreasEditor.drawImageInfo();
    }
}

// rangeIntensityMediumOnChange
function rangeIntensityMediumOnChange(event) {
    if (gImageInfoIntensityHistViewer.imageInfo) {
        gImageInfoIntensityHistViewer.imageInfo.setIntensityMedium(rangeIntensityMedium.value);
        gImageInfoIntensityHistViewer.imageInfo.updateHilightCanvasAndIntensity();
        gImageInfoIntensityHistViewer.drawHistogram();
        gImageInfoAreasEditor.drawImageInfo();
    }
}

// rangeIntensityHighOnChange
function rangeIntensityHighOnChange(event) {
    if (gImageInfoIntensityHistViewer.imageInfo) {
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
    // create ImageInfoAreasEditor
    gImageInfoIntensityHistViewer = new ImageInfoIntensityHistViewer(histogram_canvas_panel);
    gImageInfoIntensityHistViewer.drawHistogram();

    // create ImageInfoAreasEditor
    gImageInfoAreasEditor = new ImageInfoAreasEditor(image_canvas_panel);
    image_canvas_panel.addEventListener("mousemove", (event) => gImageInfoAreasEditor.onMouseMove(event));
    image_canvas_panel.addEventListener("mousedown", (event) => gImageInfoAreasEditor.onMouseDown(event));
    image_canvas_panel.addEventListener("mouseup", (event) => gImageInfoAreasEditor.onMouseUp(event));
    image_canvas_panel.addEventListener("mouseup", (event) => gImageInfoIntensityHistViewer.drawHistogram());

    // apply events
    buttonLoadImageFile.addEventListener("click", buttonLoadImageFileClick);
    radioInclude.addEventListener("click", event => gImageInfoAreasEditor.setAreaSelectionMode(AreaSelectionMode.INCLUDE));
    radioExclude.addEventListener("click", event => gImageInfoAreasEditor.setAreaSelectionMode(AreaSelectionMode.EXCLUDE));
    radioDraw.addEventListener("click", event => gImageInfoAreasEditor.setMouseSelectionMode(MouseSelectionMode.DRAW));
    radioDrag.addEventListener("click", event => gImageInfoAreasEditor.setMouseSelectionMode(MouseSelectionMode.DRAG));
    checkboxShowOriginal.addEventListener("click", event => gImageInfoAreasEditor.setShowOriginalImage(checkboxShowOriginal.checked));

    selectImages.onchange = selectImagesOnChange;
    rangeIntensityLow.oninput = rangeIntensityLowOnChange;
    rangeIntensityMedium.oninput = rangeIntensityMediumOnChange;
    rangeIntensityHigh.oninput = rangeIntensityHighOnChange;
    buttonSaveFabrics.onclick = buttonSaveFabricsOnClick;
    buttonScaleDown.onclick = buttonScaleDownClick;
    buttonScaleUp.onclick = buttonScaleUpClick;
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

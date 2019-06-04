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

// buttonTabPreProcessClick
function buttonTabPreProcessClick(event) {
    panelPreProcess.style.display = "inline-block";
    panelAnalysis.style.display = "none";
}

// buttonTabPreProcessClick
function buttonTabAnalysisClick(event) {
    panelPreProcess.style.display = "none";
    panelAnalysis.style.display = "block";
}

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
                if (!gImageInfoAreasEditor.imageInfo)
                    gImageInfoAreasEditor.setImageInfo(event.currentTarget.imageInfo);

                if (!gImageInfoIntensityHistViewer.imageInfo) {
                    gImageInfoIntensityHistViewer.setImageInfo(event.currentTarget.imageInfo);
                    updateIntensityInputs();
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
    regionsString += "</FabricsMLData>" + "\r\n";
    regionsString += "<HighResolutionImageData>" + "\r\n";
    regionsString += "</HighResolutionImageData>" + "\r\n";

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
    if (gImageInfoIntensityHistViewer.imageInfo) {
        let imageInfo = gImageInfoIntensityHistViewer.imageInfo;
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

    buttonTabPreProcess.addEventListener("click", event => buttonTabPreProcessClick(event));
    buttonTabAnalysis.addEventListener("click", event => buttonTabAnalysisClick(event));

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

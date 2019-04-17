import Tiff from "tiff.js"

// AreaSelectionMode
var AreaSelectionMode = {
    INCLUDE: 1,
    EXCLUDE: 2
}

// SelectionMode
var MouseSelectionMode = {
    DRAW: 1,
    DRAG: 2
}

// AreaSelectionInfo
class AreaSelectionInfo {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.areaSelectionMode = AreaSelectionMode.INCLUDE;
    }

    // normalize region
    normalize() {
        // horizontal normalize
        if (this.width < 0) {
            this.x += this.width;
            this.width = -this.width;
        }

        // vertical normalize
        if (this.height < 0) {
            this.y += this.height;
            this.height = -this.height;
        }
    }

    // scale region parameters
    scale(factor) {
        this.x *= factor;
        this.y *= factor;
        this.width *= factor;
        this.height *= factor;
    }

    // trim (regions MUST be normalized)
    trim(x0, y0, x1, y1) {
        // calc resulting coords
        var result_x0 = Math.max(x0, this.x);
        var result_y0 = Math.max(y0, this.y);
        var result_x1 = Math.min(x1, this.x + this.width - 1);
        var result_y1 = Math.min(y1, this.y + this.height - 1);

        // update fields
        this.x = result_x0;
        this.y = result_y0;
        this.width = result_x1 - result_x0;
        this.height = result_y1 - result_y0;
    }
}

// ImageInfo
class ImageInfo {
    constructor() {
        this.fileRef = null;
        this.image = null;
        this.imageCanvas = document.createElement('canvas');
        this.imageMaskCanvas = document.createElement('canvas');
        this.imageHilightCanvas = document.createElement('canvas');
        this.imageBordersCanvas = document.createElement('canvas');
        this.areaSelectionInfos = [];
    }

    // addSelectionArea
    addSelectionArea(area) {
        // base check
        if (!area) return;

        // update image mask canvas
        var ctx = this.imageMaskCanvas.getContext("2d");
        ctx.fillStyle = "#000000"; // exclude mask
        // include mask
        if (area.areaSelectionMode === AreaSelectionMode.INCLUDE)
            ctx.fillStyle = "#FF0000";

        ctx.fillRect(area.x, area.y, area.width, area.height);
        ctx.stroke();

        // add area
        this.areaSelectionInfos.push(area);
        // update boders
        this.updateImageBordersCanvas();
    }

    // updateImageHilightCanvas
    updateImageHilightCanvas(intensityLow, intensityMedium, intensityHigh) {
        // get image data
        var imageCanvasData = this.imageCanvas.getContext('2d').getImageData(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        var imageMaskCanvasData = this.imageMaskCanvas.getContext('2d').getImageData(0, 0, this.imageMaskCanvas.width, this.imageMaskCanvas.height);
        var imageHilightCanvasData = this.imageHilightCanvas.getContext('2d').getImageData(0, 0, this.imageMaskCanvas.width, this.imageMaskCanvas.height);

        // update hilight image data
        imageHilightCanvasData.data.fill(0);
        for (var i = 0; i < imageCanvasData.data.length; i += 4) {
            if (imageMaskCanvasData.data[i] > 0) {
                if (imageCanvasData.data[i] >= intensityHigh) {
                    imageHilightCanvasData.data[i + 0] = 0;
                    imageHilightCanvasData.data[i + 1] = 255;
                    imageHilightCanvasData.data[i + 2] = 0;
                    imageHilightCanvasData.data[i + 3] = 255;
                }
                if (imageCanvasData.data[i] <= intensityMedium) {
                    imageHilightCanvasData.data[i + 0] = 0;
                    imageHilightCanvasData.data[i + 1] = 0;
                    imageHilightCanvasData.data[i + 2] = 255;
                    imageHilightCanvasData.data[i + 3] = 255;
                }
                if (imageCanvasData.data[i] <= intensityLow) {
                    imageHilightCanvasData.data[i + 0] = 255;
                    imageHilightCanvasData.data[i + 1] = 0;
                    imageHilightCanvasData.data[i + 2] = 0;
                    imageHilightCanvasData.data[i + 3] = 255;
                }
            }
        }
        this.imageHilightCanvas.getContext('2d').putImageData(imageHilightCanvasData, 0, 0);
    }

    // updateImageBordersCanvas
    updateImageBordersCanvas() {
        // copy image
        var imageBordersCanvasCtx = this.imageBordersCanvas.getContext('2d');
        // get image data
        var imageMaskCanvasData = this.imageMaskCanvas.getContext('2d').getImageData(0, 0, this.imageMaskCanvas.width, this.imageMaskCanvas.height);
        var imageBordersCanvasData = this.imageMaskCanvas.getContext('2d').getImageData(0, 0, this.imageMaskCanvas.width, this.imageMaskCanvas.height);

        // update hilight image data
        imageBordersCanvasData.data.fill(0);
        imageBordersCanvasCtx.putImageData(imageBordersCanvasData, 0, 0);
        for (var i = 0; i < imageMaskCanvasData.data.length - 4; i += 4) {
            var x = Math.trunc((i / 4) % this.imageMaskCanvas.width);
            var y = Math.trunc((i / 4) / this.imageMaskCanvas.width);
            if (imageMaskCanvasData.data[i] !== imageMaskCanvasData.data[i + 4]) {
                imageBordersCanvasCtx.fillStyle = "#FF0000";
                imageBordersCanvasCtx.fillRect(x - 2, y - 2, 4, 4);
                imageBordersCanvasCtx.stroke();
            }
            if (imageMaskCanvasData.data[i] !== imageMaskCanvasData.data[i + this.imageMaskCanvas.width * 4]) {
                imageBordersCanvasCtx.fillStyle = "#FF0000";
                imageBordersCanvasCtx.fillRect(x - 2, y - 2, 4, 4);
                imageBordersCanvasCtx.stroke();
            }
        }
    }

    // getIntensity
    getIntensity() {
        var intensity = new Array(256);
        intensity.fill(0);

        // get image data
        var imageCanvasData = this.imageCanvas.getContext('2d').getImageData(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        var imageMaskCanvasData = this.imageMaskCanvas.getContext('2d').getImageData(0, 0, this.imageMaskCanvas.width, this.imageMaskCanvas.height);

        // update image data
        for (var i = 0; i < imageCanvasData.data.length; i += 4) {
            if (imageMaskCanvasData.data[i] > 0)
                intensity[imageCanvasData.data[i]]++;
        }

        return intensity;
    }
}

// ImageInfoRegionsEditor
class ImageInfoRegionsEditor {
    // constructor
    constructor(parent, parentHistogram) {
        // setup parent
        this.parent = parent;
        this.parent.ImageInfoRegionsEditor = this;
        this.parentHistogram = parentHistogram;
        this.parentHistogram.ImageInfoRegionsEditor = this;

        // intensity histogram
        this.intensityHistogramValues = new Array(256);
        this.intensityHistogramValues.fill(0);
        this.intensityLow = 90;
        this.intensityMedium = 150;
        this.intensityHigh = 250;

        // image infos
        this.imageInfo = null; // current raw image info
        this.showOriginalImage = false;

        // original image
        this.imageBuffer = new Image();
        this.imageBuffer.imageInfoRegionsEditor = this;

        // scale
        this.scale = 1.0;

        // MouseSelectionMode
        this.mouseSelectionMode = MouseSelectionMode.DRAW;
        this.mousePrevDragX = 0;
        this.mousePrevDragY = 0;

        // selection area info
        this.selectionStarted = false;
        this.selectionAreaMode = AreaSelectionMode.INCLUDE;
        this.selectionAreaInfo = new AreaSelectionInfo();

        // create historgam canvas
        this.histogramCanvas = document.createElement("canvas");
        this.histogramCanvas.style.border = "1px solid black";
        this.histogramCanvasCtx = this.histogramCanvas.getContext('2d');
        this.parentHistogram.style.textAlign = "center";
        this.parentHistogram.appendChild(this.histogramCanvas);
        this.drawIntensityHistogram();

        // create image canvas
        this.imageCanvas = document.createElement("canvas");
        this.imageCanvas.style.border = "1px solid orange";
        this.imageCanvasCtx = this.imageCanvas.getContext('2d');
        this.parent.appendChild(this.imageCanvas);

        // add event - mousemove
        this.parent.addEventListener("mousemove", function (event) {
            // get base data
            var imageInfoRegionsEditor = event.currentTarget.ImageInfoRegionsEditor;

            // update selection region info
            if (imageInfoRegionsEditor.selectionStarted && imageInfoRegionsEditor.mouseSelectionMode === MouseSelectionMode.DRAW) {
                var mouseCoords = getMousePosByElement(imageInfoRegionsEditor.imageCanvas, event);
                imageInfoRegionsEditor.selectionAreaInfo.width = mouseCoords.x - imageInfoRegionsEditor.selectionAreaInfo.x;
                imageInfoRegionsEditor.selectionAreaInfo.height = mouseCoords.y - imageInfoRegionsEditor.selectionAreaInfo.y;

                // redraw stuff
                imageInfoRegionsEditor.redraw();
                imageInfoRegionsEditor.drawSelectionArea();
            } else
                if (imageInfoRegionsEditor.selectionStarted && imageInfoRegionsEditor.mouseSelectionMode === MouseSelectionMode.DRAG) {
                    var mouseCoords = getMousePosByElement(imageInfoRegionsEditor.imageCanvas, event);
                    var mouseDeltaX = imageInfoRegionsEditor.mousePrevDragX - event.clientX;
                    var mouseDeltaY = imageInfoRegionsEditor.mousePrevDragY - event.clientY;
                    imageInfoRegionsEditor.parent.scrollTop += mouseDeltaY;
                    imageInfoRegionsEditor.parent.scrollLeft += mouseDeltaX;
                    imageInfoRegionsEditor.mousePrevDragX = event.clientX;
                    imageInfoRegionsEditor.mousePrevDragY = event.clientY;
                }
        });
        // add event - mouseup
        this.parent.addEventListener("mouseup", function (event) {
            // get base data
            var imageInfoRegionsEditor = event.currentTarget.ImageInfoRegionsEditor;

            // proceed selection
            if (imageInfoRegionsEditor.selectionStarted && imageInfoRegionsEditor.mouseSelectionMode === MouseSelectionMode.DRAW) {
                var mouseCoords = getMousePosByElement(imageInfoRegionsEditor.imageCanvas, event);

                // celection region normalize and scale
                imageInfoRegionsEditor.selectionAreaInfo.normalize();
                imageInfoRegionsEditor.selectionAreaInfo.scale(1.0 / imageInfoRegionsEditor.scale);

                // add new region info 
                var areaSelectionInfo = new AreaSelectionInfo();
                areaSelectionInfo.x = imageInfoRegionsEditor.selectionAreaInfo.x;
                areaSelectionInfo.y = imageInfoRegionsEditor.selectionAreaInfo.y;
                areaSelectionInfo.width = imageInfoRegionsEditor.selectionAreaInfo.width;
                areaSelectionInfo.height = imageInfoRegionsEditor.selectionAreaInfo.height;
                areaSelectionInfo.areaSelectionMode = imageInfoRegionsEditor.selectionAreaInfo.areaSelectionMode;
                areaSelectionInfo.trim(0, 0, imageInfoRegionsEditor.imageBuffer.width, imageInfoRegionsEditor.imageBuffer.height);
                // add region
                imageInfoRegionsEditor.imageInfo.addSelectionArea(areaSelectionInfo);
                imageInfoRegionsEditor.imageInfo.updateImageHilightCanvas(imageInfoRegionsEditor.intensityLow, imageInfoRegionsEditor.intensityMedium, imageInfoRegionsEditor.intensityHigh);
                imageInfoRegionsEditor.intensityHistogramValues = imageInfoRegionsEditor.imageInfo.getIntensity();
                imageInfoRegionsEditor.drawIntensityHistogram();

                // redraw all stuff
                imageInfoRegionsEditor.redraw();
            }
            imageInfoRegionsEditor.selectionStarted = false;
        });
        // add event - mousedown
        this.parent.addEventListener("mousedown", function (event) {
            // get base data
            var imageInfoRegionsEditor = event.currentTarget.ImageInfoRegionsEditor;

            if (imageInfoRegionsEditor.imageInfo !== null) {
                var mouseCoords = getMousePosByElement(imageInfoRegionsEditor.imageCanvas, event);
                imageInfoRegionsEditor.selectionStarted = true;
                // set base coords
                imageInfoRegionsEditor.selectionAreaInfo.x = mouseCoords.x;
                imageInfoRegionsEditor.selectionAreaInfo.y = mouseCoords.y;
                imageInfoRegionsEditor.selectionAreaInfo.width = 0;
                imageInfoRegionsEditor.selectionAreaInfo.height = 0;
                imageInfoRegionsEditor.selectionAreaInfo.areaSelectionMode = imageInfoRegionsEditor.selectionAreaMode;
                // set mouse base coords
                imageInfoRegionsEditor.mousePrevDragX = event.clientX;
                imageInfoRegionsEditor.mousePrevDragY = event.clientY;
            }
        });
    }

    // setImageInfo
    // NOTE: This is async function
    setImageInfo(imageInfo) {
        // check for null
        if (imageInfo === null) {
            this.imageInfo = null;
            return;
        }

        // check for same image info
        if (this.imageInfo === imageInfo)
            return;

        // setup new image info
        if (this.imageInfo != imageInfo) {
            this.imageInfo = imageInfo;
            this.updateImageBuffer();
            this.updateIntensity();
            this.drawIntensityHistogram();
        }
    }

    // setScale
    setScale(scale) {
        if (this.scale !== scale) {
            this.scale = scale;
            this.updateImageBuffer();
        }
    }

    // setMouseSelectionMode
    setMouseSelectionMode(mode) {
        this.mouseSelectionMode = mode;
    }

    // setIntensityLow
    setIntensityLow(intensity) {
        this.intensityLow = intensity;
        this.updateIntensity();
    }

    // setIntensityLow
    setIntensityMedium(intensity) {
        this.intensityMedium = intensity;
        this.updateIntensity();
    }

    // setIntensityLow
    setIntensityHigh(intensity) {
        this.intensityHigh = intensity;
        this.updateIntensity();
    }

    setShowOriginalImage(showOriginal) {
        // set show original image
        this.showOriginalImage = showOriginal;
        // check for null
        if (!this.imageInfo) return;
        // redraw
        this.redraw();
    }

    // updateIntensity
    updateIntensity() {
        // check for null
        if (!this.imageInfo) return;

        // update image hi-light data
        this.imageInfo.updateImageHilightCanvas(this.intensityLow, this.intensityMedium, this.intensityHigh);

        // redraw
        this.redraw();
        this.updateIntensityHistogram();
        this.drawIntensityHistogram();
    }

    // updateIntensityHistogram
    updateIntensityHistogram() {
        // check for null
        if (this.imageInfo === null) return;

        // intensity histogram values
        this.intensityHistogramValues = this.imageInfo.getIntensity();
    }

    // updateImageBuffer
    // NOTE: This is async function
    updateImageBuffer() {
        // check for null
        if (this.imageInfo === null) return;

        // create canvas
        var canvas = document.createElement('canvas');
        canvas.width = this.imageInfo.image.width;
        canvas.height = this.imageInfo.image.height;

        // get context and draw original image
        var ctx = canvas.getContext('2d');
        ctx.drawImage(this.imageInfo.image, 0, 0);
        //ctx.drawImage(this.imageInfo.imageMaskCanvas, 0, 0);

        // calculate image buffer - JIT
        //if (this.colorMapType == ColorMapTypeEnum.JIT)
        //    convertCanvasToJit(canvas);

        // copy img
        this.imageBuffer.onload = function (event) { event.currentTarget.imageInfoRegionsEditor.redraw(); };
        this.imageBuffer.src = canvas.toDataURL("image/png");
    }

    // drawSelectionArea
    drawSelectionArea() {
        if (this.selectionStarted) {
            // check selection mode and set alpha
            this.imageCanvasCtx.globalAlpha = 0.8;
            this.imageCanvasCtx.fillStyle = "blue";
            this.imageCanvasCtx.fillRect(this.selectionAreaInfo.x, this.selectionAreaInfo.y, this.selectionAreaInfo.width, this.selectionAreaInfo.height);
            this.imageCanvasCtx.globalAlpha = 1.0;
        }
    }


    // drawImageBuffer
    drawImageBuffer() {
        // draw base image
        if (this.imageBuffer !== null) {
            this.imageCanvas.width = this.imageBuffer.width * this.scale;
            this.imageCanvas.height = this.imageBuffer.height * this.scale;
            this.imageCanvasCtx.globalAlpha = 1.0;
            this.imageCanvasCtx.drawImage(this.imageBuffer, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
            //this.imageCanvasCtx.drawImage(this.imageInfo.imageMaskCanvas, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
            if (this.showOriginalImage === false) {
                this.imageCanvasCtx.globalAlpha = 0.9;
                this.imageCanvasCtx.drawImage(this.imageInfo.imageHilightCanvas, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
                this.imageCanvasCtx.globalAlpha = 0.5;
                this.imageCanvasCtx.drawImage(this.imageInfo.imageBordersCanvas, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
                this.imageCanvasCtx.globalAlpha = 1.0;
            }
        }
    }

    // drawSelectionAreas
    drawSelectionAreas() {
        // check for null
        if (this.imageInfo === null) return;
        // draw areas
        for (var i = 0; i < this.imageInfo.areaSelectionInfos.length; i++) {
            var area = this.imageInfo.areaSelectionInfos[i];
            this.imageCanvasCtx.globalAlpha = 0.5;
            this.imageCanvasCtx.fillStyle = "blue";
            this.imageCanvasCtx.fillRect(area.x * this.scale, area.y * this.scale, area.width * this.scale, area.height * this.scale);
            this.imageCanvasCtx.globalAlpha = 1.0;
        }
        //this.imageCanvasCtx.drawImage(this.imageInfo.imageMaskCanvas, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
    }

    // drawIntensityHistogram
    drawIntensityHistogram() {
        // draw base image
        if (this.histogramCanvas !== null) {
            this.histogramCanvas.width = 255;
            this.histogramCanvas.height = 500;
            this.histogramCanvasCtx.fillStyle = "white";
            this.histogramCanvasCtx.fillRect(0, 0, this.histogramCanvas.width, this.histogramCanvas.height);
            // draw histogram
            this.histogramCanvasCtx.strokeStyle = "blue";
            for (var i = 0; i < this.intensityHistogramValues.length; i++) {
                var x = i;
                var y = Math.log10(this.intensityHistogramValues[i]) * 50;
                this.histogramCanvasCtx.beginPath();
                this.histogramCanvasCtx.moveTo(i, this.histogramCanvas.height);
                this.histogramCanvasCtx.lineTo(i, this.histogramCanvas.height - y);
                this.histogramCanvasCtx.stroke();
            }
            // draw lines
            this.histogramCanvasCtx.beginPath();
            this.histogramCanvasCtx.moveTo(this.intensityLow, 0);
            this.histogramCanvasCtx.lineTo(this.intensityLow, this.histogramCanvas.height);
            this.histogramCanvasCtx.strokeStyle = "red";
            this.histogramCanvasCtx.stroke();
            this.histogramCanvasCtx.beginPath();
            this.histogramCanvasCtx.moveTo(this.intensityMedium, 0);
            this.histogramCanvasCtx.lineTo(this.intensityMedium, this.histogramCanvas.height);
            this.histogramCanvasCtx.strokeStyle = "cyan";
            this.histogramCanvasCtx.stroke();
            this.histogramCanvasCtx.beginPath();
            this.histogramCanvasCtx.moveTo(this.intensityHigh, 0);
            this.histogramCanvasCtx.lineTo(this.intensityHigh, this.histogramCanvas.height);
            this.histogramCanvasCtx.strokeStyle = "green";
            this.histogramCanvasCtx.stroke();
        }
    }

    // redraw
    redraw() {
        this.drawImageBuffer();
        //this.drawSelectionAreas();
    }
}

///////////////////////////////////////////////////////////////////////////////
// GLOBALS
///////////////////////////////////////////////////////////////////////////////

var gImageInfoList = [];
var gImageInfoRegionsEditor = new ImageInfoRegionsEditor(image_canvas_panel, histogram_canvas_panel);

///////////////////////////////////////////////////////////////////////////////
// EVENTS
///////////////////////////////////////////////////////////////////////////////

// buttonLoadImageFileClick
function buttonLoadImageFileClick(event) {
    inputImageFile.accept = '.tif;.tiff';
    inputImageFile.onchange = function (event) {
        for (var i = 0; i < event.currentTarget.files.length; i++) {
            // create image info
            var imageInfo = new ImageInfo();
            imageInfo.fileRef = event.currentTarget.files[i];

            // load from file
            var fileReader = new FileReader();
            fileReader.imageInfo = imageInfo;

            fileReader.onload = function (event) {
                event.currentTarget.imageInfo.image = new Image();
                event.currentTarget.imageInfo.image.imageInfo = event.currentTarget.imageInfo;
                event.currentTarget.imageInfo.image.onload = function (event) {
                    // copy image to image canvas
                    event.currentTarget.imageInfo.imageCanvas.width = event.currentTarget.width;
                    event.currentTarget.imageInfo.imageCanvas.height = event.currentTarget.height;
                    var ctx = event.currentTarget.imageInfo.imageCanvas.getContext("2d");
                    ctx.drawImage(event.currentTarget, 0, 0);
                    // create image mask canvas
                    event.currentTarget.imageInfo.imageMaskCanvas.width = event.currentTarget.width;
                    event.currentTarget.imageInfo.imageMaskCanvas.height = event.currentTarget.height;
                    // create image hi-light canvas
                    event.currentTarget.imageInfo.imageHilightCanvas.width = event.currentTarget.width;
                    event.currentTarget.imageInfo.imageHilightCanvas.height = event.currentTarget.height;
                    // create image borders canvas
                    event.currentTarget.imageInfo.imageBordersCanvas.width = event.currentTarget.width;
                    event.currentTarget.imageInfo.imageBordersCanvas.height = event.currentTarget.height;

                    // image mask canvas
                    if (!gImageInfoRegionsEditor.imageInfo)
                        gImageInfoRegionsEditor.setImageInfo(event.currentTarget.imageInfo);
                };
                var tiff = new Tiff({ buffer: event.currentTarget.result });
                event.currentTarget.imageInfo.image.src = tiff.toDataURL("image/png");
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
    gImageInfoRegionsEditor.setScale(gImageInfoRegionsEditor.scale / 2);
    scaleFactor.innerText = Math.round(gImageInfoRegionsEditor.scale * 100) + "%";
}

// scale up bnt click
function buttonScaleUpClick(event) {
    gImageInfoRegionsEditor.setScale(gImageInfoRegionsEditor.scale * 2);
    scaleFactor.innerText = Math.round(gImageInfoRegionsEditor.scale * 100) + "%";
}

// rangeIntensityLowOnChange
function rangeIntensityLowOnChange(event) {
    gImageInfoRegionsEditor.setIntensityLow(rangeIntensityLow.value);
}

// rangeIntensityMediumOnChange
function rangeIntensityMediumOnChange(event) {
    gImageInfoRegionsEditor.setIntensityMedium(rangeIntensityMedium.value);
}

// rangeIntensityHighOnChange
function rangeIntensityHighOnChange(event) {
    gImageInfoRegionsEditor.setIntensityHigh(rangeIntensityHigh.value);
}

// checkboxShowOriginalOnChange
function checkboxShowOriginalOnChange(event) {
    gImageInfoRegionsEditor.setShowOriginalImage(checkboxShowOriginal.checked);
}

// radioIncludeOnClick
function radioIncludeOnClick(event) {
    gImageInfoRegionsEditor.selectionAreaMode = AreaSelectionMode.INCLUDE;
}

// radioExcludeOnClick
function radioExcludeOnClick(event) {
    gImageInfoRegionsEditor.selectionAreaMode = AreaSelectionMode.EXCLUDE;
}

// radioDrawOnClick
function radioDrawOnClick(event) {
    gImageInfoRegionsEditor.setMouseSelectionMode(MouseSelectionMode.DRAW);
}

// radioDragOnClick
function radioDragOnClick(event) {
    gImageInfoRegionsEditor.setMouseSelectionMode(MouseSelectionMode.DRAG);
}

// selectImagesOnChange
function selectImagesOnChange(event) {
    gImageInfoRegionsEditor.setImageInfo(gImageInfoList[selectImages.selectedIndex]);
}

// buttonSaveFabricsOnClick
function buttonSaveFabricsOnClick(event) {
    // base check
    if (!gImageInfoRegionsEditor.imageInfo) return;

    // get file name
    var filename = gImageInfoRegionsEditor.imageInfo.fileRef.name.substr(0, gImageInfoRegionsEditor.imageInfo.fileRef.name.lastIndexOf('.'));

    // generate xml string
    var regionsString = '<?xml version="1.0" encoding="utf-8"?>' + "\r\n";
    regionsString += '<FabricsMLData>' + "\r\n";
    regionsString += '  <ImageData>' + "\r\n";
    regionsString += '    <ImageName FileName="' + gImageInfoRegionsEditor.imageInfo.fileRef.name + '"></ImageName>' + "\r\n";
    regionsString += '    <ImageBasename FileBasename="' + filename + '"></ImageBasename>' + "\r\n";
    regionsString += '  </ImageData>' + "\r\n";
    regionsString += '</FabricsMLData>';
    regionsString += '<HighResolutionImageData>' + "\r\n";
    regionsString += '</HighResolutionImageData>';

    downloadFile(regionsString, filename + ".xml", 'text/plain');
}

// window - onload
window.onload = (event) => {
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

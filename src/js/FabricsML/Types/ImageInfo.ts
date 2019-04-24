import { SelectionInfo } from "./SelectionInfo"
import { SelectionInfoType } from "./SelectionInfoType"
import { SelectionInfoMode } from "./SelectionInfoMode"

// ImageInfo
export class ImageInfo {
    // file reference
    public fileRef: File = null;
    // canvases
    public canvasImage: HTMLCanvasElement = null;
    public canvasMask: HTMLCanvasElement = null;
    public canvasHiLight: HTMLCanvasElement = null;
    public canvasBorders: HTMLCanvasElement = null;
    // area selections
    public selectionInfos: Array<SelectionInfo> = [];
    // intensity
    public intensity: Uint32Array = new Uint32Array(256);
    public intensityLow: number = 90;
    public intensityMedium: number = 150;
    public intensityHigh: number = 250;

    // constructor
    constructor(fileRef: File) {
        // file reference
        this.fileRef = fileRef;
        // canvases
        this.canvasImage = document.createElement("canvas");
        this.canvasMask = document.createElement("canvas");
        this.canvasHiLight = document.createElement("canvas");
        this.canvasBorders = document.createElement("canvas");
        // area selections
        this.selectionInfos = [];
        // intensity
        this.intensity.fill(0);
        this.intensityLow = 90;
        this.intensityMedium = 150;
        this.intensityHigh = 250;
    }

    // copyFromCanvas
    public copyFromCanvas(canvas: HTMLCanvasElement): void {
        // set sizes
        this.canvasImage.width = canvas.width;
        this.canvasImage.height = canvas.height;
        this.canvasMask.width = canvas.width;
        this.canvasMask.height = canvas.height;
        this.canvasHiLight.width = canvas.width;
        this.canvasHiLight.height = canvas.height;
        this.canvasBorders.width = canvas.width;
        this.canvasBorders.height = canvas.height;
        // copy data
        let canvasImageCtx = this.canvasImage.getContext("2d");
        canvasImageCtx.drawImage(canvas, 0, 0);
        // update data
        this.updateHilightCanvas();
        this.updateBordersCanvas();
        this.updateIntensity();
    }

    // addSelectionArea
    public addSelectionArea(selectionInfo: SelectionInfo): void {
        // get context
        let canvasMaskCtx = this.canvasMask.getContext("2d") as CanvasRenderingContext2D;

        // fill mask
        canvasMaskCtx.fillStyle = (selectionInfo.selectionInfoMode === SelectionInfoMode.INCLUDE) ? "#FF0000" : "#000000";
        canvasMaskCtx.fillRect(selectionInfo.x, selectionInfo.y, selectionInfo.width, selectionInfo.height);
        canvasMaskCtx.stroke();

        // add area
        this.selectionInfos.push(selectionInfo);
    }

    // updateHilightCanvas
    public updateHilightCanvas() {
        // get context
        let canvasImageCtx = this.canvasImage.getContext("2d");
        let canvasMaskCtx = this.canvasMask.getContext("2d");
        let canvasHiLightCtx = this.canvasHiLight.getContext("2d");
        // get data arrays
        let canvasImageData = canvasImageCtx.getImageData(0, 0, this.canvasImage.width, this.canvasImage.height);
        let canvasMaskData = canvasMaskCtx.getImageData(0, 0, this.canvasMask.width, this.canvasMask.height);
        let canvasHiLightData = canvasHiLightCtx.getImageData(0, 0, this.canvasHiLight.width, this.canvasHiLight.height);

        // update hi-light image data
        canvasHiLightData.data.fill(0);
        for (let i = 0; i < canvasImageData.data.length; i += 4) {
            if (canvasMaskData.data[i] > 0) {
                if (canvasImageData.data[i] >= this.intensityHigh) {
                    canvasHiLightData.data[i + 0] = 0;
                    canvasHiLightData.data[i + 1] = 255;
                    canvasHiLightData.data[i + 2] = 0;
                    canvasHiLightData.data[i + 3] = 255;
                }
                if (canvasImageData.data[i] <= this.intensityMedium) {
                    canvasHiLightData.data[i + 0] = 0;
                    canvasHiLightData.data[i + 1] = 0;
                    canvasHiLightData.data[i + 2] = 255;
                    canvasHiLightData.data[i + 3] = 255;
                }
                if (canvasImageData.data[i] <= this.intensityLow) {
                    canvasHiLightData.data[i + 0] = 255;
                    canvasHiLightData.data[i + 1] = 0;
                    canvasHiLightData.data[i + 2] = 0;
                    canvasHiLightData.data[i + 3] = 255;
                }
            }
        }

        // store data to canvas
        canvasHiLightCtx.putImageData(canvasHiLightData, 0, 0);
    }

    // updateBordersCanvas
    public updateBordersCanvas() {
        // get context
        let canvasMaskCtx = this.canvasMask.getContext("2d") as CanvasRenderingContext2D;
        let canvasBordersCtx = this.canvasBorders.getContext("2d") as CanvasRenderingContext2D;
        // get data arrays
        let canvasMaskData = canvasMaskCtx.getImageData(0, 0, this.canvasMask.width, this.canvasMask.height);
        let canvasBordersData = canvasBordersCtx.getImageData(0, 0, this.canvasBorders.width, this.canvasBorders.height);

        // update borders data
        canvasBordersData.data.fill(0);
        canvasBordersCtx.putImageData(canvasBordersData, 0, 0);
        for (let i = 0; i < canvasMaskData.data.length - 4; i += 4) {
            let x = Math.trunc((i / 4) % this.canvasMask.width);
            let y = Math.trunc((i / 4) / this.canvasMask.width);
            // horizontal border
            if (canvasMaskData.data[i] !== canvasMaskData.data[i + 4]) {
                canvasBordersCtx.fillStyle = "#FF0000";
                canvasBordersCtx.fillRect(x - 2, y - 2, 4, 4);
                canvasBordersCtx.stroke();
            }
            // vertical border
            if (canvasMaskData.data[i] !== canvasMaskData.data[i + this.canvasMask.width * 4]) {
                canvasBordersCtx.fillStyle = "#FF0000";
                canvasBordersCtx.fillRect(x - 2, y - 2, 4, 4);
                canvasBordersCtx.stroke();
            }
        }
    }

    // updateIntensity
    public updateIntensity() {
        // get context
        let canvasImageCtx = this.canvasImage.getContext("2d");
        let canvasMaskCtx = this.canvasMask.getContext("2d");
        // get data arrays
        let canvasImageData = canvasImageCtx.getImageData(0, 0, this.canvasImage.width, this.canvasImage.height);
        let canvasMaskData = canvasMaskCtx.getImageData(0, 0, this.canvasMask.width, this.canvasMask.height);

        // update image data
        this.intensity.fill(0);
        for (let i = 0; i < canvasImageData.data.length; i += 4) {
            if (canvasMaskData.data[i] > 0) {
                this.intensity[canvasImageData.data[i]]++;
            }
        }
    }

    // updateHilightCanvasAndIntensity
    public updateHilightCanvasAndIntensity() {
        // get context
        let canvasImageCtx = this.canvasImage.getContext("2d");
        let canvasMaskCtx = this.canvasMask.getContext("2d");
        let canvasHiLightCtx = this.canvasHiLight.getContext("2d");
        // get data arrays
        let canvasImageData = canvasImageCtx.getImageData(0, 0, this.canvasImage.width, this.canvasImage.height);
        let canvasMaskData = canvasMaskCtx.getImageData(0, 0, this.canvasMask.width, this.canvasMask.height);
        let canvasHiLightData = canvasHiLightCtx.getImageData(0, 0, this.canvasHiLight.width, this.canvasHiLight.height);

        // update hi-light image data
        this.intensity.fill(0);
        canvasHiLightData.data.fill(0);
        for (let i = 0; i < canvasImageData.data.length; i += 4) {
            if (canvasMaskData.data[i] > 0) {
                // update hi-light
                if (canvasImageData.data[i] >= this.intensityHigh) {
                    canvasHiLightData.data[i + 0] = 0;
                    canvasHiLightData.data[i + 1] = 255;
                    canvasHiLightData.data[i + 2] = 0;
                    canvasHiLightData.data[i + 3] = 255;
                }
                if (canvasImageData.data[i] <= this.intensityMedium) {
                    canvasHiLightData.data[i + 0] = 0;
                    canvasHiLightData.data[i + 1] = 0;
                    canvasHiLightData.data[i + 2] = 255;
                    canvasHiLightData.data[i + 3] = 255;
                }
                if (canvasImageData.data[i] <= this.intensityLow) {
                    canvasHiLightData.data[i + 0] = 255;
                    canvasHiLightData.data[i + 1] = 0;
                    canvasHiLightData.data[i + 2] = 0;
                    canvasHiLightData.data[i + 3] = 255;
                }
                // update intensity
                this.intensity[canvasImageData.data[i]]++;
            }
        }

        // store data to canvas
        canvasHiLightCtx.putImageData(canvasHiLightData, 0, 0);
    }

    // setIntensityLow
    public setIntensityLow(intensityLow: number) {
        this.intensityLow = intensityLow;
    }

    // setIntensityMedium
    public setIntensityMedium(intensityMedium: number) {
        this.intensityMedium = intensityMedium;
    }

    // setIntensityHigh
    public setIntensityHigh(intensityHigh: number) {
        this.intensityHigh = intensityHigh;
    }
}
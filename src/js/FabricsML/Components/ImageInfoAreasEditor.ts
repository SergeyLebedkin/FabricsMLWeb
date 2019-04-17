import { ImageInfo } from "../Types/ImageInfo"
import { AreaSelectionMode } from "../Types/AreaSelectionMode"
import { AreaSelectionInfo } from "../Types/AreaSelectionInfo"
import { MouseSelectionMode } from "../Types/MouseSelectionMode"

// ImageInfoRegionsEditor
export class ImageInfoAreasEditor {
    // parent
    private parent: HTMLDivElement = null;

    // image parameters
    private imageInfo: ImageInfo = null;
    public imageScale: number = 1.0;
    private showOriginalImage: boolean = false;

    // mouse parameters
    private mousePrevDragX: number = 0;
    private mousePrevDragY: number = 0;
    private mouseSelectionMode: MouseSelectionMode = MouseSelectionMode.DRAW;

    // selection parameters
    private areaSelectionStarted: boolean = false;
    private areaSelectionMode: AreaSelectionMode = AreaSelectionMode.INCLUDE;
    private areaSelectionInfo: AreaSelectionInfo = null;

    // main canvas
    private imageCanvas: HTMLCanvasElement = null;
    private imageCanvasCtx: CanvasRenderingContext2D = null;

    // constructor
    constructor(parent: HTMLDivElement) {
        // setup parent
        this.parent = parent;

        // image parameters
        this.imageInfo = null;
        this.imageScale = 1.0;
        this.showOriginalImage = false;

        // selection parameters
        this.mousePrevDragX = 0;
        this.mousePrevDragY = 0;
        this.mouseSelectionMode = MouseSelectionMode.DRAW;

        // selection area info
        this.areaSelectionStarted = false;
        this.areaSelectionMode = AreaSelectionMode.INCLUDE;
        this.areaSelectionInfo = new AreaSelectionInfo(0, 0, 0, 0);

        // create image canvas
        this.imageCanvas = document.createElement("canvas");
        this.imageCanvas.style.border = "1px solid orange";
        this.imageCanvasCtx = this.imageCanvas.getContext('2d');
        this.parent.appendChild(this.imageCanvas);
    }

    // onMouseUp
    public onMouseUp(event: MouseEvent): void {
        console.log("onMouseUp");
        console.log(event);
    }

    // onMouseDown
    public onMouseDown(event: MouseEvent): void {
        console.log("onMouseDown");
        console.log(event);
    }

    // onMouseMove
    public onMouseMove(event: MouseEvent): void {
        console.log("onMouseMove");
        console.log(event);
    }

    // setImageInfo
    public setImageInfo(imageInfo: ImageInfo): void {
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
            this.drawImageInfo();
        }
    }

    // setScale
    public setScale(scale: number): void {
        if (this.imageScale !== scale) {
            this.imageScale = scale;
            this.drawImageInfo();
        }
    }

    // setMouseSelectionMode
    public setMouseSelectionMode(mouseSelectionMode: MouseSelectionMode): void {
        this.mouseSelectionMode = mouseSelectionMode;
    }

    // setShowOriginalImage
    public setShowOriginalImage(showOriginal: boolean): void {
        this.showOriginalImage = showOriginal;
        this.drawImageInfo();
    }

    // drawSelectionArea
    public drawSelectionArea(): void {
        if (this.areaSelectionStarted) {
            // check selection mode and set alpha
            this.imageCanvasCtx.globalAlpha = 0.8;
            this.imageCanvasCtx.fillStyle = "blue";
            this.imageCanvasCtx.fillRect(this.areaSelectionInfo.x, this.areaSelectionInfo.y, this.areaSelectionInfo.width, this.areaSelectionInfo.height);
            this.imageCanvasCtx.globalAlpha = 1.0;
        }
    }

    // drawImageInfo
    public drawImageInfo(): void {
        // draw base image
        if (this.imageInfo !== null) {
            // update image size
            this.imageCanvas.width = this.imageInfo.canvasImage.width * this.imageScale;
            this.imageCanvas.height = this.imageInfo.canvasImage.height * this.imageScale;
            // draw original image
            this.imageCanvasCtx.globalAlpha = 1.0;
            this.imageCanvasCtx.drawImage(this.imageInfo.canvasImage, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
            if (!this.showOriginalImage) {
                // draw hi-lited canvas
                this.imageCanvasCtx.globalAlpha = 0.9;
                this.imageCanvasCtx.drawImage(this.imageInfo.canvasHiLight, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
                // draw borders canvas
                this.imageCanvasCtx.globalAlpha = 0.5;
                this.imageCanvasCtx.drawImage(this.imageInfo.canvasBorders, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
                this.imageCanvasCtx.globalAlpha = 1.0;
            }
        }
    }
}
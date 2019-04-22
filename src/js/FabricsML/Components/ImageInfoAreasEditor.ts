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
        // proceed selection
        if (this.areaSelectionStarted && (this.mouseSelectionMode === MouseSelectionMode.DRAW)) {
            // selection region normalize and scale
            this.areaSelectionInfo.normalize();
            this.areaSelectionInfo.scale(1.0 / this.imageScale);
            // add new area selection info
            let newAreaSelectionInfo = this.areaSelectionInfo.clone();
            newAreaSelectionInfo.trim(0, 0, this.imageInfo.canvasImage.width, this.imageInfo.canvasImage.height);
            this.imageInfo.addSelectionArea(newAreaSelectionInfo);
            // update image info
            this.imageInfo.updateBordersCanvas();
            this.imageInfo.updateHilightCanvas();
            this.imageInfo.updateIntensity();
            // draw image info
            this.drawImageInfo();
        }
        // area selection finished
        this.areaSelectionStarted = false;
    }

    // onMouseDown
    public onMouseDown(event: MouseEvent): void {
        if (this.imageInfo !== null) {
            // get bounding client rect
            let rect = this.imageCanvas.getBoundingClientRect();
            let mousePosX = event.clientX - rect.left;
            let mousePosY = event.clientY - rect.top;
            // set area selection info
            this.areaSelectionInfo.x = mousePosX;
            this.areaSelectionInfo.y = mousePosY;
            this.areaSelectionInfo.width = 0;
            this.areaSelectionInfo.height = 0;
            this.areaSelectionInfo.areaSelectionMode = this.areaSelectionMode;
            // set mouse base coords
            this.mousePrevDragX = event.screenX;
            this.mousePrevDragY = event.screenY;
            // set area selection started
            this.areaSelectionStarted = true;
        }
    }

    // onMouseMove
    public onMouseMove(event: MouseEvent): void {
        // draw mode
        if (this.areaSelectionStarted && (this.mouseSelectionMode === MouseSelectionMode.DRAW)) {
            // get bounding client rect
            let rect = this.imageCanvas.getBoundingClientRect();
            let mousePosX = event.clientX - rect.left;
            let mousePosY = event.clientY - rect.top;
            // update area selection info
            this.areaSelectionInfo.width = mousePosX - this.areaSelectionInfo.x;
            this.areaSelectionInfo.height = mousePosY - this.areaSelectionInfo.y;
            // redraw stuff
            this.drawImageInfo();
            this.drawSelectionArea();
        };
        // drag image
        if (this.areaSelectionStarted && (this.mouseSelectionMode === MouseSelectionMode.DRAG)) {
            // get mouse delta move
            let mouseDeltaX = this.mousePrevDragX - event.screenX;
            let mouseDeltaY = this.mousePrevDragY - event.screenY;
            // scroll parent
            this.parent.scrollLeft += mouseDeltaX;
            this.parent.scrollTop += mouseDeltaY;
            // store new mouse coords
            this.mousePrevDragX = event.screenX;
            this.mousePrevDragY = event.screenY;
        }
    }

    // setImageInfo
    public setImageInfo(imageInfo: ImageInfo): void {
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
        switch (this.mouseSelectionMode) {
            case MouseSelectionMode.DRAW: {
                this.imageCanvas.style.cursor = "default";
                break;
            }
            case MouseSelectionMode.DRAG: {
                this.imageCanvas.style.cursor = "move";
                break;
            }
        }
    }

    // setAreaSelectionMode
    public setAreaSelectionMode(areaSelectionMode: AreaSelectionMode): void {
        this.areaSelectionMode = areaSelectionMode;
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
            //this.imageCanvasCtx.drawImage(this.imageInfo.canvasMask, 0, 0, this.imageCanvas.width, this.imageCanvas.height);
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
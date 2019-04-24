import { ImageInfo } from "../Types/ImageInfo"
import { MouseUsageMode } from "../Types/MouseUsageMode"
import { SelectionInfoMode } from "../Types/SelectionInfoMode"
import { SelectionInfoType } from "../Types/SelectionInfoType"
import { SelectionInfo, SelectionInfoRect, SelectionInfoArea } from "../Types/SelectionInfo";

// ImageInfoRegionsEditor
export class ImageInfoAreasEditor {
    // parent
    private parent: HTMLDivElement = null;

    // image parameters
    private imageInfo: ImageInfo = null;
    public imageScale: number = 1.0;
    private showOriginalImage: boolean = false;

    // mouse parameters
    private draggingStarted: boolean = false;
    private mousePrevDragX: number = 0;
    private mousePrevDragY: number = 0;
    private mouseUsageMode: MouseUsageMode = MouseUsageMode.DRAW;
    // selection parameters
    private selectionStarted: boolean = false;
    private selectionInfoType: SelectionInfoType = SelectionInfoType.RECT;
    private selectionInfoMode: SelectionInfoMode = SelectionInfoMode.INCLUDE;
    private selectionInfoRect: SelectionInfoRect = null;
    private selectionInfoArea: SelectionInfoArea = null;

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
        this.draggingStarted = false;
        this.mousePrevDragX = 0;
        this.mousePrevDragY = 0;
        this.mouseUsageMode = MouseUsageMode.DRAW;
        // selection info
        this.selectionStarted = false;
        this.selectionInfoType = SelectionInfoType.RECT;
        this.selectionInfoMode = SelectionInfoMode.INCLUDE;
        this.selectionInfoRect = new SelectionInfoRect(0, 0, 0, 0);
        this.selectionInfoArea = new SelectionInfoArea();
        // create image canvas
        this.imageCanvas = document.createElement("canvas");
        this.imageCanvas.style.border = "1px solid orange";
        this.imageCanvasCtx = this.imageCanvas.getContext('2d');
        this.parent.appendChild(this.imageCanvas);
    }

    // onMouseUp
    public onMouseUp(event: MouseEvent): void {
        // proceed selection
        if (this.selectionStarted && (this.mouseUsageMode === MouseUsageMode.DRAW) && (this.selectionInfoType === SelectionInfoType.RECT)) {
            // selection region normalize and scale
            this.selectionInfoRect.normalize();
            this.selectionInfoRect.scale(1.0 / this.imageScale);
            // add new selection info
            let newSelectionInfo = this.selectionInfoRect.clone();
            newSelectionInfo.trim(0, 0, this.imageInfo.canvasImage.width, this.imageInfo.canvasImage.height);
            this.imageInfo.addSelectionInfo(newSelectionInfo);
            // update image info
            this.imageInfo.updateBordersCanvas();
            this.imageInfo.updateHilightCanvas();
            this.imageInfo.updateIntensity();
            // draw image info
            this.drawImageInfo();
            // selection finished
            this.selectionStarted = false;
        }
        // dragging end
        this.draggingStarted = false;
    }

    // onMouseDown
    public onMouseDown(event: MouseEvent): void {
        if (this.imageInfo !== null) {
            // get bounding client rect
            let rect = this.imageCanvas.getBoundingClientRect();
            let mousePosX = event.clientX - rect.left;
            let mousePosY = event.clientY - rect.top;
            // draw rect started
            if ((this.mouseUsageMode === MouseUsageMode.DRAW) && (this.selectionInfoType === SelectionInfoType.RECT)) {
                // set selection info
                this.selectionInfoRect.x = mousePosX;
                this.selectionInfoRect.y = mousePosY;
                this.selectionInfoRect.width = 0;
                this.selectionInfoRect.height = 0;
                this.selectionInfoRect.selectionInfoMode = this.selectionInfoMode;
                // set selection started
                this.selectionStarted = true;
            }
            // draw ares
            if ((this.mouseUsageMode === MouseUsageMode.DRAW) && (this.selectionInfoType === SelectionInfoType.AREA)) {
                // set selection info
                this.selectionInfoArea.addPoint(mousePosX, mousePosY);
                this.selectionInfoRect.selectionInfoMode = this.selectionInfoMode;
                // set selection started
                this.selectionStarted = true;
                this.drawImageInfo();
                this.drawSelectionInfoArea();
            }
            // dragging started
            if (this.mouseUsageMode === MouseUsageMode.DRAG)
                this.draggingStarted = true;
            // set mouse base coords
            this.mousePrevDragX = event.screenX;
            this.mousePrevDragY = event.screenY;
        }
    }

    // onMouseMove
    public onMouseMove(event: MouseEvent): void {
        // draw mode
        if (this.selectionStarted && (this.mouseUsageMode === MouseUsageMode.DRAW) && (this.selectionInfoType === SelectionInfoType.RECT)) {
            // get bounding client rect
            let rect = this.imageCanvas.getBoundingClientRect();
            let mousePosX = event.clientX - rect.left;
            let mousePosY = event.clientY - rect.top;
            // update selection info
            this.selectionInfoRect.width = mousePosX - this.selectionInfoRect.x;
            this.selectionInfoRect.height = mousePosY - this.selectionInfoRect.y;
            // redraw stuff
            this.drawImageInfo();
            this.drawSelectionInfoRect();
        };
        // drag image
        if (this.draggingStarted && (this.mouseUsageMode === MouseUsageMode.DRAG)) {
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

    // setMouseUsageMode
    public setMouseUsageMode(mouseUsageMode: MouseUsageMode): void {
        this.mouseUsageMode = mouseUsageMode;
        this.cancelSelecion();
        switch (this.mouseUsageMode) {
            case MouseUsageMode.DRAW: {
                this.imageCanvas.style.cursor = "default";
                break;
            }
            case MouseUsageMode.DRAG: {
                this.imageCanvas.style.cursor = "move";
                break;
            }
        }
    }

    // setSelectionInfoType
    public setSelectionInfoType(selectionInfoType: SelectionInfoType): void {
        this.selectionInfoType = selectionInfoType;
        this.cancelSelecion();
    }

    // setSelectionInfoMode
    public setSelectionInfoMode(selectionInfoMode: SelectionInfoMode): void {
        this.selectionInfoMode = selectionInfoMode;
        this.cancelSelecion();
    }

    // setShowOriginalImage
    public setShowOriginalImage(showOriginal: boolean): void {
        this.showOriginalImage = showOriginal;
        this.drawImageInfo();
    }

    // cancelSelecion
    public cancelSelecion() {
        this.selectionStarted = false;
        this.selectionInfoArea.points = [];
        this.drawImageInfo();
    }

    // drawSelectionInfoRect
    public drawSelectionInfoRect(): void {
        if (this.selectionStarted) {
            // check selection mode and set alpha
            this.imageCanvasCtx.globalAlpha = 0.8;
            this.imageCanvasCtx.fillStyle = "blue";
            this.imageCanvasCtx.fillRect(this.selectionInfoRect.x, this.selectionInfoRect.y, this.selectionInfoRect.width, this.selectionInfoRect.height);
            this.imageCanvasCtx.globalAlpha = 1.0;
        }
    }

    // drawSelectionInfoArea
    public drawSelectionInfoArea(): void {
        if (this.selectionStarted) {
            // to draw area, there should be a 3 points at least

            this.imageCanvasCtx.globalAlpha = 0.8;
            this.imageCanvasCtx.fillStyle = "blue";
            // simply draw points
            for (let i = 0; i < this.selectionInfoArea.points.length; i++)
                this.imageCanvasCtx.fillRect(
                    this.selectionInfoArea.points[i].x - 6,
                    this.selectionInfoArea.points[i].y - 6,
                    11, 11);
            // draw area
            if (this.selectionInfoArea.points.length > 2) {
                this.imageCanvasCtx.beginPath();
                this.imageCanvasCtx.moveTo(this.selectionInfoArea.points[0].x, this.selectionInfoArea.points[0].y);
                for (let i = 1; i < this.selectionInfoArea.points.length; i++)
                    this.imageCanvasCtx.lineTo(this.selectionInfoArea.points[i].x, this.selectionInfoArea.points[i].y);
                this.imageCanvasCtx.closePath();
                this.imageCanvasCtx.fill();
            }
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
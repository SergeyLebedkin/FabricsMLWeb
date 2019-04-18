import { ImageInfo } from "../Types/ImageInfo"

// ImageInfoIntensityHistViewer
export class ImageInfoIntensityHistViewer {
    // parent
    private parent: HTMLDivElement = null;
    // image parameters
    private imageInfo: ImageInfo = null;
    // main canvas
    private canvasHist: HTMLCanvasElement = null;
    private canvasHistCtx: CanvasRenderingContext2D = null;

    // constructor
    constructor(parent: HTMLDivElement) {
        // setup parent
        this.parent = parent;
        // image parameters
        this.imageInfo = null;
        // create image canvas
        this.canvasHist = document.createElement("canvas");
        this.canvasHist.style.border = "1px solid green";
        this.canvasHist.width = 255;
        this.canvasHist.height = 500;
        this.canvasHistCtx = this.canvasHist.getContext('2d');
        this.parent.appendChild(this.canvasHist);
    }

    // setImageInfo
    public setImageInfo(imageInfo: ImageInfo): void {
        // setup new image info
        if (this.imageInfo != imageInfo) {
            this.imageInfo = imageInfo;
            this.drawHistogram();
        }
    }

    // drawHistogram
    public drawHistogram(): void {
        // draw base image
        if (this.imageInfo !== null) {
            this.canvasHist.width = 255;
            this.canvasHist.height = 500;
            this.canvasHistCtx.fillStyle = "white";
            this.canvasHistCtx.fillRect(0, 0, this.canvasHist.width, this.canvasHist.height);
            // draw histogram
            this.canvasHistCtx.strokeStyle = "blue";
            for (var i = 0; i < this.imageInfo.intensity.length; i++) {
                var x = i;
                var y = Math.log10(this.imageInfo.intensity[i]) * 50;
                this.canvasHistCtx.beginPath();
                this.canvasHistCtx.moveTo(x, this.canvasHist.height);
                this.canvasHistCtx.lineTo(x, this.canvasHist.height - y);
                this.canvasHistCtx.stroke();
            }
            // draw lines
            this.canvasHistCtx.beginPath();
            this.canvasHistCtx.moveTo(this.imageInfo.intensityLow, 0);
            this.canvasHistCtx.lineTo(this.imageInfo.intensityLow, this.canvasHist.height);
            this.canvasHistCtx.strokeStyle = "red";
            this.canvasHistCtx.stroke();
            this.canvasHistCtx.beginPath();
            this.canvasHistCtx.moveTo(this.imageInfo.intensityMedium, 0);
            this.canvasHistCtx.lineTo(this.imageInfo.intensityMedium, this.canvasHist.height);
            this.canvasHistCtx.strokeStyle = "cyan";
            this.canvasHistCtx.stroke();
            this.canvasHistCtx.beginPath();
            this.canvasHistCtx.moveTo(this.imageInfo.intensityHigh, 0);
            this.canvasHistCtx.lineTo(this.imageInfo.intensityHigh, this.canvasHist.height);
            this.canvasHistCtx.strokeStyle = "green";
            this.canvasHistCtx.stroke();
        }
    }
}
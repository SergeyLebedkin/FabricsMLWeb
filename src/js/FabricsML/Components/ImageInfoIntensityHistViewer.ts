import { ImageInfo } from "../Types/ImageInfo"
import * as Plotly from "plotly.js"

// ImageInfoIntensityHistViewer
export class ImageInfoIntensityHistViewer {
    // parent
    private parent: HTMLDivElement = null;
    // image parameters
    private imageInfo: ImageInfo = null;

    // constructor
    constructor(parent: HTMLDivElement) {
        // setup parent
        this.parent = parent;
        // image parameters
        this.imageInfo = null;
        this.drawHistogram();
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
        const y = this.imageInfo ? this.imageInfo.intensity : new Uint32Array(256);
        
        const mode: Partial<Plotly.Config> = { displayModeBar: false };
        const data: Partial<Plotly.PlotData>[] = [{ y: y, type: 'bar' }];
        const layout: Partial<Plotly.Layout> = {
            shapes: !this.imageInfo ? [] : [{
                // intensity low line
                line: { color: 'rgb(255, 0, 0)',  width: 1 },
                type: 'line', yref: 'paper', y0: 0, y1: 1,
                x0: this.imageInfo.intensityLow,
                x1: this.imageInfo.intensityLow
            }, {
                // intensity medium line
                line: { color: 'rgb(0, 255, 0)',  width: 1 },
                type: 'line', yref: 'paper', y0: 0, y1: 1,
                x0: this.imageInfo.intensityMedium,
                x1: this.imageInfo.intensityMedium
            }, {
                // intensity high line
                line: { color: 'rgb(0, 0, 255)',  width: 1 },
                type: 'line', yref: 'paper', y0: 0, y1: 1,
                x0: this.imageInfo.intensityHigh,
                x1: this.imageInfo.intensityHigh
            }],
            xaxis: { range: [0, 255] },
            yaxis: { type: 'log', autorange: true },
            margin: { l: 30, r: 30, b: 20, t: 15 },
            showlegend: false
        };
        Plotly.newPlot(this.parent, data, layout, mode);
    }
}

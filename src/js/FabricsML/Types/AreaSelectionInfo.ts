import { AreaSelectionMode } from "./AreaSelectionMode"

// AreaSelectionInfo
export class AreaSelectionInfo {
    // rectangle
    public x: number = 0.0;
    public y: number = 0.0;
    public width: number = 0.0;
    public height: number = 0.0;
    // AreaSelectionMode
    public areaSelectionMode: AreaSelectionMode = AreaSelectionMode.INCLUDE;

    // constructor
    constructor(x: number, y: number, width: number, height: number) {
        // rectangle
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        // AreaSelectionMode
        this.areaSelectionMode = AreaSelectionMode.INCLUDE
    }

    // normalize region
    public normalize(): void {
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
    public scale(factor: number): void {
        this.x *= factor;
        this.y *= factor;
        this.width *= factor;
        this.height *= factor;
    }

    // trim (regions MUST be normalized)
    public trim(x0: number, y0: number, x1: number, y1: number): void {
        // calc resulting coords
        let result_x0 = Math.max(x0, this.x);
        let result_y0 = Math.max(y0, this.y);
        let result_x1 = Math.min(x1, this.x + this.width - 1);
        let result_y1 = Math.min(y1, this.y + this.height - 1);

        // update fields
        this.x = result_x0;
        this.y = result_y0;
        this.width = result_x1 - result_x0;
        this.height = result_y1 - result_y0;
    }
}
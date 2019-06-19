
// PixelLocationOnOverview
export class PixelLocationOnOverview {
    public x: number = 0.0;
    public y: number = 0.0;
    public inBlackList: boolean = false;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.inBlackList = false;
    }
}

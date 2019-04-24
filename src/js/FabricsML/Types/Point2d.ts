// Point2d
export class Point2d {
    // parameters
    public x: number = 0;
    public y: number = 0;

    // constructor
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // clone
    public clone(): Point2d {
        return new Point2d(this.x, this.y);
    }
}
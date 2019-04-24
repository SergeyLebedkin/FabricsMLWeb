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

    // distanceTo
    public distanceToPoint(p: Point2d): number {
        return Math.sqrt(
            Math.pow(this.x - p.x, 2) +
            Math.pow(this.y - p.y, 2));
    }

    // distanceTo
    public distanceToCoord(x: number, y: number): number {
        return Math.sqrt(
            Math.pow(this.x - x, 2) +
            Math.pow(this.y - y, 2));
    }
}
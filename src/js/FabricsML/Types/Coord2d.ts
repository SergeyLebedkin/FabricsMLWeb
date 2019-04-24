// Coord2d
export class Coord2d {
    // parameters
    public x: number = 0;
    public y: number = 0;

    // constructor
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // clone
    public clone(): Coord2d {
        return new Coord2d(this.x, this.y);
    }
}
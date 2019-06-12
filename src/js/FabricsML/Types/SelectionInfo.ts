import { SelectionInfoType } from "./SelectionInfoType"
import { SelectionInfoMode } from "./SelectionInfoMode"
import { Point2d } from "./Point2d";

export class SelectionInfo {
    // SelectionInfoMode
    public selectionInfoMode: SelectionInfoMode = SelectionInfoMode.INCLUDE;

    // constructor
    constructor() {
        // SelectionInfoMode
        this.selectionInfoMode = SelectionInfoMode.INCLUDE
    }

    // getType (I don`t like this solution. This function must return something like "Unknown". But, let it be as is)
    public getType(): SelectionInfoType {
        return SelectionInfoType.RECT;
    }

    // drawToContext
    public drawToContext(context: CanvasRenderingContext2D) {
        // nothing (MUST be empty)
    }

    // toStringXmlNode
    public toStringXmlNode(): string {
        if (this.selectionInfoMode === SelectionInfoMode.INCLUDE)
            return "      <Selection/>";
        return "      <Exclusion/>";
    }

};

// SelectionInfoRect
export class SelectionInfoRect extends SelectionInfo {
    // rectangle
    public x: number = 0.0;
    public y: number = 0.0;
    public width: number = 0.0;
    public height: number = 0.0;

    // constructor
    constructor(x: number, y: number, width: number, height: number) {
        super();
        // rectangle
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    // constructor
    public clone(): SelectionInfoRect {
        // create new selection info
        let selectionInfo: SelectionInfoRect = new SelectionInfoRect(
            this.x, this.y, this.width, this.height);
        // copy area selection mode
        selectionInfo.selectionInfoMode = this.selectionInfoMode;
        // return new element
        return selectionInfo;
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

    // getType
    public getType(): SelectionInfoType {
        return SelectionInfoType.RECT;
    }

    // drawToContext
    public drawToContext(context: CanvasRenderingContext2D) {
        // fill mask
        context.fillStyle = (this.selectionInfoMode === SelectionInfoMode.INCLUDE) ? "#FF0000" : "#000000";
        context.beginPath();
        context.fillRect(this.x, this.y, this.width, this.height);
        context.closePath();
        //context.fill();
    }

    // toStringXmlNode
    public toStringXmlNode(): string {
        let node: string = "      ";
        // append open tag
        if (this.selectionInfoMode === SelectionInfoMode.INCLUDE)
            node += "<Selection ";
        if (this.selectionInfoMode === SelectionInfoMode.EXCLUDE)
            node += "<Exclusion ";

        // append points
        node += 'x0="' + (this.x) + '" y0="' + (this.y) + '" ';
        node += 'x1="' + (this.x + this.width) + '" y1="' + (this.y) + '" ';
        node += 'x2="' + (this.x + this.width) + '" y2="' + (this.y + this.height) + '" ';
        node += 'x3="' + (this.x) + '" y3="' + (this.y + this.height) + '" ';

        // append close tag
        if (this.selectionInfoMode === SelectionInfoMode.INCLUDE)
            node += "></Selection>";
        if (this.selectionInfoMode === SelectionInfoMode.EXCLUDE)
            node += "></Exclusion>";
        return node;
    }
}

// SelectionInfoArea
export class SelectionInfoArea extends SelectionInfo {
    // points
    public points: Array<Point2d> = new Array<Point2d>();

    // constructor
    constructor() {
        super();
        // rectangle
        this.points = [];
    }

    // addPoint
    public addPoint(x: number, y: number) {
        this.points.push(new Point2d(x, y));
    }

    // constructor
    public clone(): SelectionInfoArea {
        // create new selection info
        let selectionInfo: SelectionInfoArea = new SelectionInfoArea();
        // copy points (this is a noce method, but I need to test it)
        selectionInfo.points = [...this.points];
        selectionInfo.selectionInfoMode = this.selectionInfoMode;
        // return new element
        return selectionInfo;
    }

    // scale region parameters
    public scale(factor: number): void {
        // simply scale
        this.points.forEach((coord, index, array) => {
            array[index].x *= factor;
            array[index].y *= factor;
        });
    }

    // getType
    public getType(): SelectionInfoType {
        return SelectionInfoType.RECT;
    }

    // drawToContext
    public drawToContext(context: CanvasRenderingContext2D) {
        // to draw area, there shpuld be a 3 points at least
        if (this.points.length > 2) {
            context.globalAlpha = 1.0;
            context.fillStyle = (this.selectionInfoMode === SelectionInfoMode.INCLUDE) ? "#FF0000" : "#000000";
            context.beginPath();
            context.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++)
                context.lineTo(this.points[i].x, this.points[i].y);
            context.closePath();
            context.fill();
        }
    }

    // toStringXmlNode
    public toStringXmlNode(): string {
        let node: string = "      ";
        // append open tag
        if (this.selectionInfoMode === SelectionInfoMode.INCLUDE)
            node += "<Selection ";
        if (this.selectionInfoMode === SelectionInfoMode.EXCLUDE)
            node += "<Exclusion ";

        // append points
        this.points.forEach((point, index) => {
            node += "x" + index + '="' + point.x + '" ';
            node += "y" + index + '="' + point.y + '" ';
        })

        // append close tag
        if (this.selectionInfoMode === SelectionInfoMode.INCLUDE)
            node += "></Selection>";
        if (this.selectionInfoMode === SelectionInfoMode.EXCLUDE)
            node += "></Exclusion>";
        return node;
    }
}
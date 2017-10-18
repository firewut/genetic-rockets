'use strict';

import { colors } from './style';
import { makeid } from './helpers';
import { elementType, Point2D } from './classes';

let default_line_width = 1;

export class Line {
  _id: string;
  _type: elementType;
  meta: any;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  colors: any;

  constructor(x1: number, y1: number, x2: number, y2: number, width: number, id?:string, _colors?: any){
    this._id = id || makeid();
    this._type = elementType.Line;
    this.meta = {};
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.width = width || default_line_width;
    this.colors = _colors || colors;
  }

  getColors(){
    return this.colors;
  }

  setId(id: string){
    this._id = id;
  }

  get2DCenter() {
    return new Point2D(
      (this.x2 + this.x1)/2,
      (this.y2 + this.y1)/2
    );
  }

  move(points: Point2D[]){
    this.x1 = points[0].x;
    this.y1 = points[0].y;
    this.x2 = points[1].x;
    this.y2 = points[1].y;
  }

  getWidth(){
    return this.width;
  }

  get2DPath(){
    var path: Point2D[] = [];
    path.push(
      new Point2D(this.x1, this.y1)
    );
    path.push(
      new Point2D(this.x2, this.y2)
    )

    return path;
  }

  getRadius(){
    return Math.sqrt(
      (this.y1 - this.y2)**2 +
      (this.x2 - this.x2)**2
    );
  }
}

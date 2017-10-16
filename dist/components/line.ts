'use strict';

import { makeid } from './helpers';
import { elementType, Point2D } from './classes';

let default_line_width = 1;

export class Line {
  _id: string;
  _type: elementType;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;

  constructor(x1: number, y1: number, x2: number, y2: number, width: number){
    this._id = makeid();
    this._type = elementType.Line;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.width = width || default_line_width;
  }

  get2DCenter() {
    return new Point2D(this.x1, this.y1);
  }

  move(point: Point2D){
  }
}

'use strict';

import { makeid } from './helpers';
import { elementType, Point2D } from './classes';

let default_circle_radius = 10;

export class Circle {
  _id: string;
  _type: elementType;
  cx: number;
  cy: number;
  radius: number;

  constructor(cx: number, cy: number, radius: number){
    this._id = makeid();
    this._type = elementType.Circle;
    this.cx = cx;
    this.cy = cy;
    this.radius = radius || default_circle_radius;
  }

  get2DCenter() {
    return new Point2D(this.cx, this.cy);
  }

  move(point: Point2D){
    this.cx = point.x;
    this.cy = point.y;
  }
}

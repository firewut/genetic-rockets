'use strict';

import { colors } from './style';
import { makeid } from './helpers';
import { elementType, Point2D } from './classes';

let default_circle_radius = 10;

export class Circle {
  _id: string;
  _type: elementType;
  meta: any;
  cx: number;
  cy: number;
  radius: number;
  width: number;
  colors: any;

  constructor(cx: number, cy: number, radius: number, id?: string, _colors?: any){
    this._id = id || makeid();
    this._type = elementType.Circle;
    this.meta = {};
    this.cx = cx;
    this.cy = cy;
    this.radius = radius || default_circle_radius;
    this.width = this.radius / 8;
    this.colors = _colors || colors;
  }

  getColors(){
    return this.colors;
  }

  setId(id: string){
    this._id = id;
  }

  get2DCenter() {
    return new Point2D(this.cx, this.cy);
  }

  move(points: Point2D[]){
    this.cx = points[0].x;
    this.cy = points[0].y;
  }

  getWidth(){
    return this.width;
  }

  get2DPath(){
    var path: Point2D[] = [];
    path.push(
      new Point2D(this.cx, this.cy)
    );
    return path;
  }

  getRadius(){
    return this.radius;
  }
}

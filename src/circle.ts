'use strict';

import { colors } from './style';
import { makeid } from './helpers';
import { elementType, Point2D } from './classes';

let default_circle_radius = 10;

export class Circle {
  _id: string;
  _type: elementType;
  meta: any;
  center: Point2D;
  radius: number;
  colors: any;

  weight: number;

  constructor(cx: number, cy: number, radius: number, id?: string, _colors?: any){
    this._id = id || makeid();
    this._type = elementType.Circle;
    this.meta = {};
    this.center = new Point2D(cx, cy);
    this.radius = radius || default_circle_radius;
    this.colors = _colors || colors;

    this.weight = Math.PI * (this.radius**2);
  }

  getWeight(){
    return this.weight;
  }

  getColors(){
    return this.colors;
  }

  setId(id: string){
    this._id = id;
  }

  get2DCenter() {
    return this.center;
  }

  move(points: Point2D[]){
    this.center = points[0];
  }

  get2DPath(){
    let path = [this.center];
    return path;
  }

  getRadius(){
    return this.radius;
  }
}

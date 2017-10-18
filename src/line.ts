'use strict';

import { colors } from './style';
import { makeid } from './helpers';
import { elementType, Point2D } from './classes';

export class Line {
  _id: string;
  _type: elementType;
  meta: any;
  start: Point2D;
  end: Point2D;
  colors: any;
  weight: number;

  constructor(x1: number, y1: number, x2: number, y2: number, id?:string, _colors?: any){
    this._id = id || makeid();
    this._type = elementType.Line;
    this.meta = {};
    this.start = new Point2D(x1, y1);
    this.end = new Point2D(x2, y2);

    this.colors = _colors || colors;
    this.weight = Math.sqrt(
      (y1 - y2)**2 +
      (x1 - x2)**2
    );
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
    return new Point2D(
      (this.start.x + this.end.x)/2,
      (this.start.y + this.end.y)/2
    );
  }

  move(points: Point2D[]){
    this.start = points[0];
    this.end = points[1];
  }

  get2DPath(){
    let path = [
      this.start,
      this.end
    ];

    return path;
  }

  getRadius(){
    return Math.sqrt(
      (this.start.y - this.end.y)**2 +
      (this.start.x - this.end.x)**2
    );
  }
}

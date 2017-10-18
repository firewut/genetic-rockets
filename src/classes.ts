'use strict';

export class Point2D {
  x: number;
  y: number;

  constructor(x: number, y: number){
    this.x = x || 0;
    this.y = y || 0;
  }

  add = function (point: Point2D) {
      return new Point2D(this.x + point.x, this.y + point.y);
  };

  subtract = function (point: Point2D) {
      return new Point2D(this.x - point.x, this.y - point.y);
  };

  multiply = function (point: Point2D) {
      return new Point2D(this.x * point.x, this.y * point.y);
  };

  multiplyScalar = function (scalar: number) {
      return new Point2D(this.x * scalar, this.y * scalar);
  };

  divide = function (point: Point2D) {
      return new Point2D(this.x / point.x, this.y / point.y);
  };

  divideScalar = function (scalar: number) {
      return new Point2D(this.x / scalar, this.y / scalar);
  };

  length = function () {
      return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  };

  normalize = function () {
      return this.divideScalar(this.length());
  };
}

export class Point3D {
  x: number;
  y: number;
  z: number;

  constructor(x: number, y: number, z: number){
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export enum elementType {
  Circle,
  Line
}

export interface element {
  _id: string;
  _type: elementType;
  setId?: (_:string) => any;
  meta: any;

  getRadius?: () => number;
  get2DPath?: () => Point2D[];
  get2DCenter?: () => Point2D;
  getWidth?: () => number;
  getColors: () => any;

  move?: (_:Point2D[]) => any;
}

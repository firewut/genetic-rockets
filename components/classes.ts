'use strict';

export class Point2D {
  x: number;
  y: number;

  constructor(x: number, y: number){
    this.x = x;
    this.y = y;
  }
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

  radius?: number;
  get2DCenter?: () => Point2D;
  move?: (_:Point2D) => any;
}

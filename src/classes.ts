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
  setId?: (_:string) => any;

  getRadius?: () => number;
  get2DPath?: () => Point2D[];
  get2DCenter?: () => Point2D;
  getWidth?: () => number;
  getColors: () => any;

  move?: (_:Point2D[]) => any;
}

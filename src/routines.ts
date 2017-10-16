import { getRandomInt, getRandomArbitrary } from './helpers';
import { Point2D } from './classes';

let max_points = 300;

export class Routine {
  points: Point2D[];

  constructor(){
    this.points = [];
    for(let i = 0; i < max_points; i++){
      this.points[i] = new Point2D(
        getRandomArbitrary(-2, 2),
        getRandomArbitrary(-2, 2),
      )
    }
  }
}

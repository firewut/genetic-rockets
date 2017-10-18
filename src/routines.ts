import { makeid, getRandomInt, getRandomArbitrary } from './helpers';
import { Point2D } from './classes';

let max_points = 300;

export class Routine {
  _id: string;
  points: Point2D[];

  constructor(points?: Point2D[]){
    this._id = makeid();
    this.points = [];

    if(points === undefined){
      for(let i = 0; i < max_points; i++){
        this.points[i] = new Point2D(
          getRandomArbitrary(-1, 1),
          getRandomArbitrary(-1, 1),
        )
      }
    }else{
      this.points = points;
    }
  }

  crossOver(routine: Routine){
    var new_points = [];

    let rand_point = getRandomInt(0, routine.points.length)
    for(let i = 0; i < routine.points.length; i++) {
      if( i > rand_point ){
        new_points[i] = this.points[i];
      }else{
        new_points[i] = routine.points[i];
      }
    }

    return new Routine(new_points);
  }

  mutate(){
    let mutation_rate = 0.01;
    for(let i = 0; i < this.points.length; i++) {
      if(getRandomArbitrary(0, 1) < mutation_rate){
        this.points[i] = new Point2D(
          getRandomArbitrary(-1, 1),
          getRandomArbitrary(-1, 1),
        )
      }
    }
  }
}

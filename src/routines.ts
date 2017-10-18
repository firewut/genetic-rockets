import { makeid, getRandomInt, getRandomArbitrary } from './helpers';
import { Point2D } from './classes';

export class Routine {
  _id: string;
  points: Point2D[];

  constructor(max_points?: number, points?: Point2D[]){
    this._id = makeid();
    this.points = [];
    if(max_points === undefined){
      max_points = 300;
    }

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
    var parents = [
      this.points,
      routine.points,
    ]

    for (var i = 0; i < routine.points.length; i++) {
      new_points[i] = parents[
        Math.round(
          Math.random()
        )
      ][i]
    }

    return new Routine(0, new_points);
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

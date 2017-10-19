import { makeid, getRandomInt, getRandomArbitrary, pickRandomFromArray } from './helpers';
import { Point2D } from './classes';
import { constants } from './constants';

export class Direction {
  angle: number;
  distance: number;

  constructor(angle?: number, distance?: number){
    this.angle = angle || getRandomInt(-360, 360);
    this.distance = distance || getRandomInt(
      1,
      constants['pixels_per_fuel']
    );
  }

  getNewPoint(point: Point2D){
    let new_point = new Point2D(0, 0);

    new_point.x = Math.round(
      Math.cos(this.angle * Math.PI / 180) * this.distance + point.x
    );
    new_point.y = Math.round(
      Math.sin(this.angle * Math.PI / 180) * this.distance + point.y
    );

    return new_point;
  }
}

export class Routine {
  _id: string;
  directions: Direction[];

  constructor(max_directions?: number, directions?: Direction[]){
    this._id = makeid();
    this.directions = [];

    if(max_directions === undefined){
      max_directions = 100;
    }

    if(directions === undefined){
      for(let i = 0; i < max_directions; i++){
        this.directions[i] = new Direction()
      }
    }else{
      this.directions = directions;
    }
  }

  crossOver(routine: Routine){
    var new_directions = [];
    var parents = [
      this.directions,
      routine.directions,
    ]

    for (var i = 0; i < routine.directions.length; i++) {
      new_directions[i] = parents[
        Math.round(
          Math.random()
        )
      ][i]
    }

    return new Routine(0, new_directions);
  }

  mutate(){
    let mutation_rate = 0.01;
    for(let i = 0; i < this.directions.length; i++) {
      if(getRandomArbitrary(0, 1) < mutation_rate){
        this.directions[i] = new Direction()
      }
    }
  }
}

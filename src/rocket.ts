'use strict';

import { getRandomInt, getRandomArbitrary, pickRandomFromArray } from './helpers';
import { Point2D, element } from './classes';
import { Line } from './line';
import { Routine, Direction } from './routines';

export class Rocket extends Line {
  routine: Routine;
  _count: number;
  fuel: number;

  has_landed: boolean;
  is_alive: boolean;

  origin: element;
  destination: element;

  distance_to_destination: number;
  // Score to survive in natural selection
  selection_score: number;

  constructor(
    origin: element,
    destination: element,
    height: number,
    routine?: Routine
  ){
    let origin_point = origin.get2DCenter();
    let origin_radius = origin.getRadius();
    let destination_point = destination.get2DCenter();
    let destination_radius = destination.getRadius();

    super(
      origin_point.x + origin_radius,
      origin_point.y + origin_radius,
      origin_point.x + origin_radius + height,
      origin_point.y + origin_radius
    );

    this.selection_score = 0;
    this.is_alive = true;
    this.origin = origin;
    this.destination = destination;
    this._count = 0;
    this.has_landed = false;

    this.distance_to_destination = Math.sqrt(
      (origin_point.y - destination_point.y)**2 +
      (origin_point.x - destination_point.x)**2
    );

    // Maybe we need to increase this
    this.fuel = Math.round(this.distance_to_destination) * 2;

    if(routine === undefined) {
      // Calculate amount of points to achieve the destination
      let routines_count = this.distance_to_destination;
      this.routine = new Routine(routines_count);
    }else{
      this.routine = routine;
    }
  }

  crash(el: element){
    if(el === this.destination){
      this.has_landed = true;
      this.is_alive = true;
      this.distance_to_destination = 1;

      this.calculateScore();
    }else{
      this.is_alive = false;
      this.selection_score /= 10;
    }
  }

  calculateScore(){
    if(this.has_landed){
      this.selection_score = 1;
    }else{
      this.selection_score = 1/this.distance_to_destination;
    }
  }

  getRoutine(){
    return this.routine;
  }

  getRoutineDirection(){
    var direction: Direction;
    if(this._count < this.routine.directions.length){
      direction = this.routine.directions[this._count];
    }
    return direction;
  }

  lookupNextRoutineDirection(){
    var direction: Direction;
    if(this._count + 1 < this.routine.directions.length){
      direction = this.routine.directions[this._count+1];
    }
    return direction;
  }

  getNextRoutineDirection(){
    var direction: Direction;
    this._count += 1;
    if(this._count < this.routine.directions.length){
      direction = this.routine.directions[this._count];
    }
    return direction;
  }

  update(){
    if(!this.has_landed && this.is_alive){
      if(this._count < this.routine.directions.length){
        let next_direction = this.lookupNextRoutineDirection();
        if(next_direction !== undefined){
          let next_start = next_direction.getNewPoint(this.start);

          this.fuel -= Math.sqrt(
            (this.start.x - next_start.x)**2 +
            (this.start.y - next_start.y)**2
          );
        }
      }else{
        this.is_alive = false
      }

      let destination_center = this.destination.get2DCenter();
      let destination_radius = this.destination.getRadius();

      let away_from_destination = Math.sqrt(
        (this.start.y - destination_center.y)**2 +
        (this.start.x - destination_center.x)**2
      );
      if(away_from_destination < this.distance_to_destination) {
        this.distance_to_destination = away_from_destination;
      }

      // Check fuel
      if(this.fuel <= 0){
        this.is_alive = false;
      }

      if(this.is_alive){
        let direction = this.getNextRoutineDirection();

        if(direction !== undefined){
          this.start = direction.getNewPoint(this.start);
          this.end = direction.getNewPoint(this.end);
        }else{
          this.is_alive = false;
        }
      }
      this.calculateScore();
    }
  }

  getTrajectory(){
    var trajectory = "";
    var start = this.start;
    var end = this.end;

    trajectory += `${Math.round(start.x)},${Math.round(start.y)} ${Math.round(end.x)},${Math.round(end.y)} `;
    for(let direction of this.getRoutine().directions){
      start = direction.getNewPoint(start);
      end = direction.getNewPoint(end);
      trajectory += `${Math.round(start.x)},${Math.round(start.y)} ${Math.round(end.x)},${Math.round(end.y)} `;
    }

    return trajectory;
  }
}

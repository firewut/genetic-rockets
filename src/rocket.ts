'use strict';

import { getRandomInt, getRandomArbitrary, pickRandomFromArray } from './helpers';
import { Point2D, element } from './classes';
import { Line } from './line';
import { Routine } from './routines';

export class Rocket extends Line {
  velocity: number[];
  acceleration: number[];
  routine: Routine;
  count: number;

  has_landed: true;
  is_alive: boolean;
  alive_radius: number;

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
      origin_point.y + origin_radius,
      height
    );

    this.selection_score = 0;
    this.is_alive = true;
    this.origin = origin;
    this.destination = destination;
    this.count = 0;

    this.alive_radius = Math.sqrt(
      (origin_point.y - destination_point.y)**2 +
      (origin_point.x - destination_point.x)**2
    ) * 1.2;

    this.distance_to_destination = Math.sqrt(
      (origin_point.y - destination_point.y)**2 +
      (origin_point.x - destination_point.x)**2
    );

    if(routine === undefined) {
      // Calculate amount of points to achieve the destination
      let routines_count = this.distance_to_destination;
      this.routine = new Routine(routines_count);
    }else{
      this.routine = routine;
    }

    // X, Y
    this.velocity = [0, 0]
    this.acceleration = [0, 0];
  }

  crash(el: element){
    if(el === this.destination){
      this.has_landed = true;
      this.is_alive = true;
      this.selection_score *= 10;
    }else{
      this.is_alive = false;
      this.selection_score /= 10;
    }
  }

  applyForce(force: Point2D){
    this.acceleration[0] += force.x;
    this.acceleration[1] += force.y;
  }

  calculateScore(){
    this.selection_score = 1/this.distance_to_destination;
  }

  update(){
    if(!this.has_landed){
      if(this.routine.points.length > this.count){
        this.applyForce(
          this.routine.points[this.count]
        );
        this.count += 1;
      }else{
        this.is_alive = false
        return
      }

      let destination_center = this.destination.get2DCenter();
      let destination_radius = this.destination.getRadius();

      let away_from_destination = Math.sqrt(
        (this.y1 - destination_center.y)**2 +
        (this.x1 - destination_center.x)**2
      );
      if(away_from_destination < this.distance_to_destination) {
        this.distance_to_destination = away_from_destination;
      }


      // Check if we are further than `this.alive_radius`
      let origin_center = this.origin.get2DCenter();
      let origin_radius = this.origin.getRadius();

      let away_from_origin = Math.sqrt(
        (this.y1 - origin_center.y)**2 +
        (this.x1 - origin_center.x)**2
      );
      this.is_alive = away_from_origin <= this.alive_radius;

      if(this.is_alive){
        this.velocity = this.velocity.map(
          (a, i) => a + this.acceleration[i]
        );

        this.x1 += this.velocity[0];
        this.y1 += this.velocity[1];
        this.x2 += this.velocity[0];
        this.y2 += this.velocity[1];
        this.acceleration = [0, 0];
      }


      this.calculateScore();
    }
  }
}

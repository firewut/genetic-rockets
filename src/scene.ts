/// <reference path ="../node_modules/@types/jquery/index.d.ts"/>

import * as SVG from "svg.js";

'use strict';
import { Dictionary, makeid, pickRandomFromArray } from './helpers';
import { element, elementType, Point2D } from './classes';
import { Circle } from './circle';
import { Line } from './line';
import { Rocket } from './rocket';
import { Routine } from './routines';

export class Scene {
  canvas: svgjs.Container;
  elements: element[];
  svg_obstacles: svgjs.Shape[];
  obstacles: element[];
  svg_elements: Dictionary<svgjs.Element>;
  rockets: Rocket[];

  // Generation Information
  origin: element;
  destination: element;
  text_element: svgjs.Text;
  generation_info: any;

  // UI Settings
  center: Point2D;
  min_side: number;
  rockets_count: number = 20;

  constructor(width: number, height: number, setUp: (_:Scene) => any) {
    this.generation_info = {
      'generation_number': 0,
      'total_rockets': 0,
      'rockets_landed': 0,
      'max_rockets_landed': 0
    };
    this.obstacles = [];
    this.svg_obstacles = [];
    this.elements = [];
    this.rockets = [];
    this.svg_elements = {};
    this.min_side = Math.min(
      width,
      height
    );
    this.center = new Point2D(
      this.min_side / 2,
      this.min_side / 2
    );

    $(() => {
      let canvas = SVG('canvas');
      canvas.size(width, height);

      this.canvas = canvas.nested();
      setUp(this);
    });
  }

  updateGenerationInfo(){
    this.generation_info['generation_number'] += 1;
    this.generation_info['total_rockets'] = this.rockets.length;
    this.generation_info['rockets_landed'] = 0;

    for(let rocket of this.rockets){
      if(rocket.has_landed){
        this.generation_info['rockets_landed'] += 1
      }
    }
    if(this.generation_info['rockets_landed'] > this.generation_info['max_rockets_landed']){
      this.generation_info['max_rockets_landed'] = this.generation_info['rockets_landed'];
    }

    let text = `Generation ${this.generation_info['generation_number']}: \n \
      Landed: ${this.generation_info['rockets_landed']} \n \
      Max Landed: ${this.generation_info['max_rockets_landed']} \n \
      Total: ${this.rockets.length} \n \
    `

    if(this.text_element === undefined){
      this.text_element = this.canvas.text(
        text
      ).move(
        0, 0
      ).font({
        'family': 'Inconsolata',
        'size': this.min_side / 45
      })
    }else{
      this.text_element.text(text);
    }
  }

  addElement(element_type: string, properties: any, id?: string, colors?: any){
    if (typeof properties !== 'object'){
      properties = {}
    }
    var object;

    switch(element_type){
      case 'circle':
        let _circle = new Circle(
          properties['cx'],
          properties['cy'],
          properties['radius'],
          id,
          colors
        )
        this.elements.push(_circle);
        object = _circle;
        break;
      case 'line':
        let _line = new Line(
          properties['x1'],
          properties['y1'],
          properties['x2'],
          properties['y2'],
          id,
          colors
        );

        this.elements.push(_line);
        object = _line;
        break;
      default:
        console.log(elementType);
    }

    return object;
  }

  drawElements(){
    for(let element of this.elements){
      let existing_svg_element = this.svg_elements[element._id];
      let center2d = element.get2DCenter();
      let path = element.get2DPath();
      let colors = element.getColors();

      switch(element._type){
        case elementType.Circle:
          // Check if any element with same `_id` exists in canvas
          // this.canvas.has(element.svg_object)
          if( existing_svg_element === undefined){
            let svg_element = this.canvas.circle(
              element.getRadius() * 2
            )
            .attr({
                'cx': center2d.x,
                'cy': center2d.y,
                'fill': colors['fill_color'],
                'stroke': colors['stroke_color'],
                'stroke-width': 1
            });

            this.svg_elements[element._id] = svg_element;

            // If this is in obstacles
            if(this.obstacles.indexOf(element) != -1){
              this.svg_obstacles.push(
                svg_element
              )
            }

          }else{
            // Redraw or move
            if(
              center2d.x != existing_svg_element.cx() ||
              center2d.y != existing_svg_element.cy()
            ) {
              existing_svg_element.move(
                center2d.x,
                center2d.y
              );
            }
          }
          break;
        case elementType.Line:
          if( existing_svg_element === undefined){
            let svg_element = this.canvas.line(
              path[0].x,
              path[0].y,
              path[1].x,
              path[1].y,
            ).attr({
              'fill': colors['fill_color'],
              'stroke': colors['stroke_color'],
              'stroke-width': 1
            });
            this.svg_elements[element._id] = svg_element;

            // If this is in obstacles
            if(this.obstacles.indexOf(element) != -1){
              this.svg_obstacles.push(
                svg_element
              )
            }
          }else{
            // Redraw or move
            if(
              path[0].x != existing_svg_element.x() ||
              path[0].y != existing_svg_element.y()
            ) {
              existing_svg_element.move(
                path[0].x,
                path[0].y
              );
            }
            // If this is a rocket - check it's status
            for(let rocket of this.rockets){
              if(rocket._id == element._id){
                if(!rocket.is_alive){
                  this.removeElement(rocket._id);
                }
              }
            }
          }
          break;
      }
    }
  }

  removeElement(id: string){
    var el;

    for(let element of this.elements){
      if(element._id == id){
        el = element;
      }
    }
    if(el != undefined){
      let element_index = this.elements.indexOf(el);
      if(element_index != -1){
        this.elements.splice(element_index, 1);
        let existing_svg_element = this.svg_elements[el._id];
        if(existing_svg_element != undefined) {
          existing_svg_element.remove();
          delete this.svg_elements[el._id];
        }
      }
    }
  }

  checkCrashes(){
    // Rocket crases anything
    for(let rocket of this.rockets){
      if(rocket.is_alive){
        let rocket_svg_element = this.svg_elements[rocket._id];
        let rocket_x = [rocket.start.x, rocket.end.x];
        let rocket_y = [rocket.start.y, rocket.end.y];

        for(let element of this.elements){
          var crash = false;

          let center2d = element.get2DCenter();
          let path = element.get2DPath();

          let existing_svg_element = this.svg_elements[element._id];
          switch(element._type){
            case elementType.Circle:
              let element_radius = element.getRadius();

              for(let i = 0; i < rocket_x.length; i++){
                let distance = Math.sqrt(
                  (rocket_x[i] - center2d.x)**2 +
                  (rocket_y[i] - center2d.y)**2
                )
                if(distance < element_radius){
                  crash = true;
                }
              }
              break;
            case elementType.Line:
              // todo: this must be fixed

              break;
            default:
              break;
          }

          if(crash){
            rocket.crash(element);
          }
        }
      }
    }
  }

  activity(){
    // Planets
    this.checkCrashes();

    // Rockets
    var dead_rockets_count = 0;
    var landed_rockets_count = 0;

    for (let rocket of this.rockets) {
      if (rocket.is_alive) {
        if(rocket.has_landed){
          landed_rockets_count += 1;
        }
        for (let element of this.elements) {
          if (element._id == rocket._id) {
            element.move(
              rocket.get2DPath()
            );
            rocket.update();
          }
        }
      }else{
        dead_rockets_count += 1;
      }
    }

    return dead_rockets_count + landed_rockets_count == this.rockets.length
  }

  startActivity(
    interval: number
  ){
    let self = this;
    let rockets_pool = self.calcRocketsScores();
    let routines = self.selectRocketsRoutines(rockets_pool);
    self.startRockets(null, routines);

    let interval_id = setInterval(
      function(){
        let activity_finished = self.activity();
        if(activity_finished){
          window.clearInterval(interval_id);

          self.updateGenerationInfo();
          self.startActivity(
            interval
          );
        };
      },
      interval
    );
  }

  calcRocketsScores(){
    var max_score = 0;
    for(let rocket of this.rockets){
      if(rocket.selection_score > max_score){
        max_score = rocket.selection_score;
      }
    }

    for(let rocket of this.rockets){
      rocket.selection_score /= max_score; // Between 0 and 1
    }

    var rockets_pool = [];
    for(let rocket of this.rockets){
      let n = rocket.selection_score * 100;
      for(let j = 0; j < n; j++){
        rockets_pool.push(rocket)
      }
    }

    return rockets_pool;
  }

  selectRocketsRoutines(rockets_pool: Rocket[]){
    var routines = [];
    if(rockets_pool.length > 0) {
      for(let rocket of this.rockets){
        let routineA = pickRandomFromArray(rockets_pool).getRoutine();
        let routineB = pickRandomFromArray(rockets_pool).getRoutine();
        let childRoutine = routineA.crossOver(routineB);
        childRoutine.mutate();

        routines.push(childRoutine)
      }
    }

    return routines;
  }

  render(interval: number){
    setInterval(() => this.drawElements(), interval);
  }

  startRocket(rocket: Rocket){
    let _line = this.addElement(
      'line',
      {
        'x1': rocket.start.x,
        'y1': rocket.start.y,
        'x2': rocket.end.x,
        'y2': rocket.end.y
      },
      rocket._id,
      {
        fill_color: 'rgba(0, 0, 0, 1)',
        stroke_color: 'rgba(0, 0, 0, 1)',
        font_color: 'rgba(255, 255, 255, 1)',
      }
    );
    this.rockets.push(
      rocket
    );
  }

  startRockets(
    rockets_count?: number,
    routines?: Routine[]
  ){
    for(let rocket of this.rockets){
      this.removeElement(rocket._id);
    }
    this.rockets = [];

    let rocket_height = this.min_side / 100;

    var rockets = [];
    if(rockets_count > 0){
      for (let i = 0; i < rockets_count; i++) {
        let rocket = new Rocket(
          this.origin,
          this.destination,
          rocket_height,
        );
        rockets.push(
          rocket
        );
      }
    }else if(routines.length > 0){
      for(let routine of routines){
        rockets.push(
          new Rocket(
            this.origin,
            this.destination,
            rocket_height,
            routine
          )
        )
      }
    }

    for (let i = 0; i < rockets.length; i++) {
      this.startRocket(rockets[i]);
    }
  }
}

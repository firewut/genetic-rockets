/// <reference path ="./typings/index.d.ts"/>

'use strict';
import { Dictionary, makeid } from './helpers';
import { element, elementType } from './classes';
import { Circle } from './circle';
import { Line } from './line';
import { Rocket } from './rocket';

export class Scene {
  canvas: svgjs.Element;
  elements: element[];
  svg_elements: Dictionary<svgjs.Element>;
  rockets: Rocket[];

  // Generation Information
  generation_number: number;
  text_element: svgjs.Element;

  // UI Settings
  min_side: number;
  rockets_count: number = 20;

  constructor(width: number, height: number, setUp: (_:Scene) => any) {
    this.generation_number = 0;
    this.elements = [];
    this.rockets = [];
    this.svg_elements = {};
    this.min_side = Math.min(
      width,
      height
    );

    $(() => {
      let canvas = SVG('canvas');
      canvas.size(width, height, true);

      this.canvas = canvas.nested();
      setUp(this);
    });
  }

  updateGeneration(num: number){
    if(this.text_element === undefined){
      this.text_element = this.canvas.text(
        'Generation #' + num
      ).move(
        0, 0
      ).font({
        'family': 'Inconsolata',
        'size': this.min_side / 25
      })
    }else{
      this.text_element.text('Generation #' + num);
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
          properties['width'],
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
                'stroke-width': element.getWidth()
            });

            this.svg_elements[element._id] = svg_element;
          }else{
            // Redraw or move
            if(
              center2d.x != existing_svg_element.cx() ||
              center2d.y != existing_svg_element.cy()
            ) {
              existing_svg_element.move(center2d.x, center2d.y);
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
              'stroke-width': element.getWidth()
            });
            this.svg_elements[element._id] = svg_element;
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
                if(rocket.is_alive){

                }else{
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

  activity(){
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
    interval: number,
    rockets_count: number,
    origin: element,
    destination: element
  ){
    let self = this;
    self.generation_number += 1;
    self.updateGeneration(self.generation_number);
    self.start_rockets(
      rockets_count,
      origin,
      destination
    );

    let interval_id = setInterval(
      function(){
        let activity_finished = self.activity();
        if(activity_finished){
          window.clearInterval(interval_id);

          self.start_rockets(
            rockets_count,
            origin,
            destination
          );
          self.startActivity(
            interval,
            rockets_count,
            origin,
            destination
          );
        };
      },
      interval
    );
  }

  render(interval: number){
    setInterval(() => this.drawElements(), interval);
  }

  start_rockets(
    rockets_count: number,
    origin: element,
    destination: element
  ){
    var rockets = [];
    for (let i = 0; i < rockets_count; i++) {
      let rocket_height = this.min_side / 100;
      let rocket = new Rocket(
        origin,
        destination,
        rocket_height,
      );
      rockets.push(
        rocket
      );
    }

    for (let i = 0; i < rockets.length; i++) {
      let rocket = rockets[i];
      let _line = this.addElement(
        'line',
        {
          'x1': rocket.x1,
          'y1': rocket.y1,
          'x2': rocket.x2,
          'y2': rocket.y2,
          'width': rocket.width
        },
        rocket._id,
        {
          fill_color: 'rgba(0, 0, 0, .9)',
          stroke_color: 'rgba(252, 98, 93, .7)',
          font_color: 'rgba(255, 255, 255, 1)',
        }
      );
      this.rockets.push(
        rocket
      );
    }
  }
}

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var style_1 = require("./style");
var helpers_1 = require("./helpers");
var classes_1 = require("./classes");
var default_circle_radius = 10;
var Circle = /** @class */ (function () {
    function Circle(cx, cy, radius, id, _colors) {
        this._id = id || helpers_1.makeid();
        this._type = classes_1.elementType.Circle;
        this.cx = cx;
        this.cy = cy;
        this.radius = radius || default_circle_radius;
        this.width = this.radius / 8;
        this.colors = _colors || style_1.colors;
    }
    Circle.prototype.getColors = function () {
        return this.colors;
    };
    Circle.prototype.setId = function (id) {
        this._id = id;
    };
    Circle.prototype.get2DCenter = function () {
        return new classes_1.Point2D(this.cx, this.cy);
    };
    Circle.prototype.move = function (points) {
        this.cx = points[0].x;
        this.cy = points[0].y;
    };
    Circle.prototype.getWidth = function () {
        return this.width;
    };
    Circle.prototype.get2DPath = function () {
        var path = [];
        path.push(new classes_1.Point2D(this.cx, this.cy));
        return path;
    };
    Circle.prototype.getRadius = function () {
        return this.radius;
    };
    return Circle;
}());
exports.Circle = Circle;

},{"./classes":2,"./helpers":3,"./style":9}],2:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var Point2D = /** @class */ (function () {
    function Point2D(x, y) {
        this.x = x;
        this.y = y;
    }
    return Point2D;
}());
exports.Point2D = Point2D;
var Point3D = /** @class */ (function () {
    function Point3D(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    return Point3D;
}());
exports.Point3D = Point3D;
var elementType;
(function (elementType) {
    elementType[elementType["Circle"] = 0] = "Circle";
    elementType[elementType["Line"] = 1] = "Line";
})(elementType = exports.elementType || (exports.elementType = {}));

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
exports.makeid = makeid;
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}
exports.getRandomArbitrary = getRandomArbitrary;
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.getRandomInt = getRandomInt;
function pickRandomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}
exports.pickRandomFromArray = pickRandomFromArray;

},{}],4:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var style_1 = require("./style");
var helpers_1 = require("./helpers");
var classes_1 = require("./classes");
var default_line_width = 1;
var Line = /** @class */ (function () {
    function Line(x1, y1, x2, y2, width, id, _colors) {
        this._id = id || helpers_1.makeid();
        this._type = classes_1.elementType.Line;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.width = width || default_line_width;
        this.colors = _colors || style_1.colors;
    }
    Line.prototype.getColors = function () {
        return this.colors;
    };
    Line.prototype.setId = function (id) {
        this._id = id;
    };
    Line.prototype.get2DCenter = function () {
        return new classes_1.Point2D((this.x2 + this.x1) / 2, (this.y2 + this.y1) / 2);
    };
    Line.prototype.move = function (points) {
        this.x1 = points[0].x;
        this.y1 = points[0].y;
        this.x2 = points[1].x;
        this.y2 = points[1].y;
    };
    Line.prototype.getWidth = function () {
        return this.width;
    };
    Line.prototype.get2DPath = function () {
        var path = [];
        path.push(new classes_1.Point2D(this.x1, this.y1));
        path.push(new classes_1.Point2D(this.x2, this.y2));
        return path;
    };
    Line.prototype.getRadius = function () {
        return Math.sqrt(Math.pow((this.y1 - this.y2), 2) +
            Math.pow((this.x2 - this.x2), 2));
    };
    return Line;
}());
exports.Line = Line;

},{"./classes":2,"./helpers":3,"./style":9}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scene_1 = require("./scene");
var width = window.innerWidth;
var height = window.innerHeight;
var min_side = Math.min(width, height);
function setUp(scene) {
    var destination_radius = min_side / 25;
    var destination = scene.addElement('circle', {
        'cx': width / 2,
        'cy': min_side / 10,
        'radius': destination_radius
    });
    var destination_path = destination.get2DPath();
    var origin_radius = min_side / 30;
    var origin = scene.addElement('circle', {
        'cx': destination_path[0].x,
        'cy': destination_path[0].y + min_side / 4,
        'radius': origin_radius
    });
    scene.render(100);
    scene.startActivity(100, 25, origin, destination);
}
var scene = new scene_1.Scene(width, height, setUp);

},{"./scene":8}],6:[function(require,module,exports){
'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var line_1 = require("./line");
var routines_1 = require("./routines");
var Rocket = /** @class */ (function (_super) {
    __extends(Rocket, _super);
    function Rocket(origin, destination, height) {
        var _this = this;
        var origin_point = origin.get2DCenter();
        var destination_point = destination.get2DCenter();
        _this = _super.call(this, origin_point.x, origin_point.y - height, origin_point.x, origin_point.y, height) || this;
        _this.is_alive = true;
        _this.origin = origin;
        _this.destination = destination;
        _this.count = 0;
        _this.routine = new routines_1.Routine();
        _this.alive_radius = Math.sqrt(Math.pow((origin_point.y - destination_point.y), 2) +
            Math.pow((origin_point.x - destination_point.x), 2)) * 1.5;
        _this.distance_to_destination = Math.sqrt(Math.pow((origin_point.y - destination_point.y), 2) +
            Math.pow((origin_point.x - destination_point.x), 2));
        // X, Y
        _this.velocity = [0, 0];
        _this.acceleration = [0, 0];
        return _this;
    }
    Rocket.prototype.applyForce = function (force) {
        this.acceleration[0] += force.x;
        this.acceleration[1] += force.y;
    };
    Rocket.prototype.update = function () {
        var _this = this;
        if (!this.has_landed) {
            if (this.routine.points.length > this.count) {
                this.applyForce(this.routine.points[this.count]);
                this.count += 1;
            }
            else {
                this.is_alive = false;
                return;
            }
            var destination_center = this.destination.get2DCenter();
            var destination_radius = this.destination.getRadius();
            var away_from_destination = Math.sqrt(Math.pow((this.y1 - destination_center.y), 2) +
                Math.pow((this.x1 - destination_center.x), 2));
            if (away_from_destination < this.distance_to_destination) {
                this.distance_to_destination = away_from_destination;
            }
            if (away_from_destination <= destination_radius) {
                this.has_landed = true;
            }
            else {
                // Check if we are further than `this.alive_radius`
                var origin_center = this.origin.get2DCenter();
                var origin_radius = this.origin.getRadius();
                var away_from_origin = Math.sqrt(Math.pow((this.y1 - origin_center.y), 2) +
                    Math.pow((this.x1 - origin_center.x), 2));
                this.is_alive = away_from_origin <= this.alive_radius;
                if (this.is_alive) {
                    this.velocity = this.velocity.map(function (a, i) { return a + _this.acceleration[i]; });
                    this.x1 += this.velocity[0];
                    this.y1 += this.velocity[1];
                    this.x2 += this.velocity[0];
                    this.y2 += this.velocity[1];
                    this.acceleration = [0, 0];
                }
            }
        }
    };
    return Rocket;
}(line_1.Line));
exports.Rocket = Rocket;

},{"./line":4,"./routines":7}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("./helpers");
var classes_1 = require("./classes");
var max_points = 300;
var Routine = /** @class */ (function () {
    function Routine() {
        this.points = [];
        for (var i = 0; i < max_points; i++) {
            this.points[i] = new classes_1.Point2D(helpers_1.getRandomArbitrary(-2, 2), helpers_1.getRandomArbitrary(-2, 2));
        }
    }
    return Routine;
}());
exports.Routine = Routine;

},{"./classes":2,"./helpers":3}],8:[function(require,module,exports){
/// <reference path ="./typings/index.d.ts"/>
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var classes_1 = require("./classes");
var circle_1 = require("./circle");
var line_1 = require("./line");
var rocket_1 = require("./rocket");
var Scene = /** @class */ (function () {
    function Scene(width, height, setUp) {
        var _this = this;
        this.rockets_count = 20;
        this.generation_number = 0;
        this.elements = [];
        this.rockets = [];
        this.svg_elements = {};
        this.min_side = Math.min(width, height);
        $(function () {
            var canvas = SVG('canvas');
            canvas.size(width, height, true);
            _this.canvas = canvas.nested();
            setUp(_this);
        });
    }
    Scene.prototype.updateGeneration = function (num) {
        if (this.text_element === undefined) {
            this.text_element = this.canvas.text('Generation #' + num).move(0, 0).font({
                'family': 'Inconsolata',
                'size': this.min_side / 25
            });
        }
        else {
            this.text_element.text('Generation #' + num);
        }
    };
    Scene.prototype.addElement = function (element_type, properties, id, colors) {
        if (typeof properties !== 'object') {
            properties = {};
        }
        var object;
        switch (element_type) {
            case 'circle':
                var _circle = new circle_1.Circle(properties['cx'], properties['cy'], properties['radius'], id, colors);
                this.elements.push(_circle);
                object = _circle;
                break;
            case 'line':
                var _line = new line_1.Line(properties['x1'], properties['y1'], properties['x2'], properties['y2'], properties['width'], id, colors);
                this.elements.push(_line);
                object = _line;
                break;
            default:
                console.log(classes_1.elementType);
        }
        return object;
    };
    Scene.prototype.drawElements = function () {
        for (var _i = 0, _a = this.elements; _i < _a.length; _i++) {
            var element = _a[_i];
            var existing_svg_element = this.svg_elements[element._id];
            var center2d = element.get2DCenter();
            var path = element.get2DPath();
            var colors = element.getColors();
            switch (element._type) {
                case classes_1.elementType.Circle:
                    // Check if any element with same `_id` exists in canvas
                    // this.canvas.has(element.svg_object)
                    if (existing_svg_element === undefined) {
                        var svg_element = this.canvas.circle(element.getRadius() * 2)
                            .attr({
                            'cx': center2d.x,
                            'cy': center2d.y,
                            'fill': colors['fill_color'],
                            'stroke': colors['stroke_color'],
                            'stroke-width': element.getWidth()
                        });
                        this.svg_elements[element._id] = svg_element;
                    }
                    else {
                        // Redraw or move
                        if (center2d.x != existing_svg_element.cx() ||
                            center2d.y != existing_svg_element.cy()) {
                            existing_svg_element.move(center2d.x, center2d.y);
                        }
                    }
                    break;
                case classes_1.elementType.Line:
                    if (existing_svg_element === undefined) {
                        var svg_element = this.canvas.line(path[0].x, path[0].y, path[1].x, path[1].y).attr({
                            'fill': colors['fill_color'],
                            'stroke': colors['stroke_color'],
                            'stroke-width': element.getWidth()
                        });
                        this.svg_elements[element._id] = svg_element;
                    }
                    else {
                        // Redraw or move
                        if (path[0].x != existing_svg_element.x() ||
                            path[0].y != existing_svg_element.y()) {
                            existing_svg_element.move(path[0].x, path[0].y);
                        }
                        // If this is a rocket - check it's status
                        for (var _b = 0, _c = this.rockets; _b < _c.length; _b++) {
                            var rocket = _c[_b];
                            if (rocket._id == element._id) {
                                if (rocket.is_alive) {
                                }
                                else {
                                    this.removeElement(rocket._id);
                                }
                            }
                        }
                    }
                    break;
            }
        }
    };
    Scene.prototype.removeElement = function (id) {
        var el;
        for (var _i = 0, _a = this.elements; _i < _a.length; _i++) {
            var element = _a[_i];
            if (element._id == id) {
                el = element;
            }
        }
        if (el != undefined) {
            var element_index = this.elements.indexOf(el);
            if (element_index != -1) {
                this.elements.splice(element_index, 1);
                var existing_svg_element = this.svg_elements[el._id];
                if (existing_svg_element != undefined) {
                    existing_svg_element.remove();
                    delete this.svg_elements[el._id];
                }
            }
        }
    };
    Scene.prototype.activity = function () {
        var dead_rockets_count = 0;
        var landed_rockets_count = 0;
        for (var _i = 0, _a = this.rockets; _i < _a.length; _i++) {
            var rocket = _a[_i];
            if (rocket.is_alive) {
                if (rocket.has_landed) {
                    landed_rockets_count += 1;
                }
                for (var _b = 0, _c = this.elements; _b < _c.length; _b++) {
                    var element = _c[_b];
                    if (element._id == rocket._id) {
                        element.move(rocket.get2DPath());
                        rocket.update();
                    }
                }
            }
            else {
                dead_rockets_count += 1;
            }
        }
        return dead_rockets_count + landed_rockets_count == this.rockets.length;
    };
    Scene.prototype.startActivity = function (interval, rockets_count, origin, destination) {
        var self = this;
        self.generation_number += 1;
        self.updateGeneration(self.generation_number);
        self.start_rockets(rockets_count, origin, destination);
        var interval_id = setInterval(function () {
            var activity_finished = self.activity();
            if (activity_finished) {
                window.clearInterval(interval_id);
                self.start_rockets(rockets_count, origin, destination);
                self.startActivity(interval, rockets_count, origin, destination);
            }
            ;
        }, interval);
    };
    Scene.prototype.render = function (interval) {
        var _this = this;
        setInterval(function () { return _this.drawElements(); }, interval);
    };
    Scene.prototype.start_rockets = function (rockets_count, origin, destination) {
        var rockets = [];
        for (var i = 0; i < rockets_count; i++) {
            var rocket_height = this.min_side / 100;
            var rocket = new rocket_1.Rocket(origin, destination, rocket_height);
            rockets.push(rocket);
        }
        for (var i = 0; i < rockets.length; i++) {
            var rocket = rockets[i];
            var _line = this.addElement('line', {
                'x1': rocket.x1,
                'y1': rocket.y1,
                'x2': rocket.x2,
                'y2': rocket.y2,
                'width': rocket.width
            }, rocket._id, {
                fill_color: 'rgba(0, 0, 0, .9)',
                stroke_color: 'rgba(252, 98, 93, .7)',
                font_color: 'rgba(255, 255, 255, 1)',
            });
            this.rockets.push(rocket);
        }
    };
    return Scene;
}());
exports.Scene = Scene;

},{"./circle":1,"./classes":2,"./line":4,"./rocket":6}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = {
    fill_color: 'rgba(157,165,180, .9)',
    stroke_color: 'rgba(126, 133, 146, 1)',
    font_color: 'rgba(255, 255, 255, 1)',
};

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2lyY2xlLnRzIiwic3JjL2NsYXNzZXMudHMiLCJzcmMvaGVscGVycy50cyIsInNyYy9saW5lLnRzIiwic3JjL21haW4udHMiLCJzcmMvcm9ja2V0LnRzIiwic3JjL3JvdXRpbmVzLnRzIiwic3JjL3NjZW5lLnRzIiwic3JjL3N0eWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsWUFBWSxDQUFDOztBQUViLGlDQUFpQztBQUNqQyxxQ0FBbUM7QUFDbkMscUNBQWlEO0FBRWpELElBQUkscUJBQXFCLEdBQUcsRUFBRSxDQUFDO0FBRS9CO0lBU0UsZ0JBQVksRUFBVSxFQUFFLEVBQVUsRUFBRSxNQUFjLEVBQUUsRUFBVyxFQUFFLE9BQWE7UUFDNUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLElBQUksZ0JBQU0sRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxLQUFLLEdBQUcscUJBQVcsQ0FBQyxNQUFNLENBQUM7UUFDaEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLHFCQUFxQixDQUFDO1FBQzlDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLElBQUksY0FBTSxDQUFDO0lBQ2xDLENBQUM7SUFFRCwwQkFBUyxHQUFUO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDckIsQ0FBQztJQUVELHNCQUFLLEdBQUwsVUFBTSxFQUFVO1FBQ2QsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELDRCQUFXLEdBQVg7UUFDRSxNQUFNLENBQUMsSUFBSSxpQkFBTyxDQUFDLElBQUks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QyxVQUFVLEVBQUUsd0JBQXdCO0NBQ3JDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuL3N0eWxlJztcbmltcG9ydCB7IG1ha2VpZCB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBlbGVtZW50VHlwZSwgUG9pbnQyRCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5cbmxldCBkZWZhdWx0X2NpcmNsZV9yYWRpdXMgPSAxMDtcblxuZXhwb3J0IGNsYXNzIENpcmNsZSB7XG4gIF9pZDogc3RyaW5nO1xuICBfdHlwZTogZWxlbWVudFR5cGU7XG4gIGN4OiBudW1iZXI7XG4gIGN5OiBudW1iZXI7XG4gIHJhZGl1czogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xuICBjb2xvcnM6IGFueTtcblxuICBjb25zdHJ1Y3RvcihjeDogbnVtYmVyLCBjeTogbnVtYmVyLCByYWRpdXM6IG51bWJlciwgaWQ/OiBzdHJpbmcsIF9jb2xvcnM/OiBhbnkpe1xuICAgIHRoaXMuX2lkID0gaWQgfHwgbWFrZWlkKCk7XG4gICAgdGhpcy5fdHlwZSA9IGVsZW1lbnRUeXBlLkNpcmNsZTtcbiAgICB0aGlzLmN4ID0gY3g7XG4gICAgdGhpcy5jeSA9IGN5O1xuICAgIHRoaXMucmFkaXVzID0gcmFkaXVzIHx8IGRlZmF1bHRfY2lyY2xlX3JhZGl1cztcbiAgICB0aGlzLndpZHRoID0gdGhpcy5yYWRpdXMgLyA4O1xuICAgIHRoaXMuY29sb3JzID0gX2NvbG9ycyB8fCBjb2xvcnM7XG4gIH1cblxuICBnZXRDb2xvcnMoKXtcbiAgICByZXR1cm4gdGhpcy5jb2xvcnM7XG4gIH1cblxuICBzZXRJZChpZDogc3RyaW5nKXtcbiAgICB0aGlzLl9pZCA9IGlkO1xuICB9XG5cbiAgZ2V0MkRDZW50ZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBQb2ludDJEKHRoaXMuY3gsIHRoaXMuY3kpO1xuICB9XG5cbiAgbW92ZShwb2ludHM6IFBvaW50MkRbXSl7XG4gICAgdGhpcy5jeCA9IHBvaW50c1swXS54O1xuICAgIHRoaXMuY3kgPSBwb2ludHNbMF0ueTtcbiAgfVxuXG4gIGdldFdpZHRoKCl7XG4gICAgcmV0dXJuIHRoaXMud2lkdGg7XG4gIH1cblxuICBnZXQyRFBhdGgoKXtcbiAgICB2YXIgcGF0aDogUG9pbnQyRFtdID0gW107XG4gICAgcGF0aC5wdXNoKFxuICAgICAgbmV3IFBvaW50MkQodGhpcy5jeCwgdGhpcy5jeSlcbiAgICApO1xuICAgIHJldHVybiBwYXRoO1xuICB9XG5cbiAgZ2V0UmFkaXVzKCl7XG4gICAgcmV0dXJuIHRoaXMucmFkaXVzO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydCBjbGFzcyBQb2ludDJEIHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIpe1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUG9pbnQzRCB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xuICB6OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcil7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMueiA9IHo7XG4gIH1cbn1cblxuZXhwb3J0IGVudW0gZWxlbWVudFR5cGUge1xuICBDaXJjbGUsXG4gIExpbmVcbn1cblxuZXhwb3J0IGludGVyZmFjZSBlbGVtZW50IHtcbiAgX2lkOiBzdHJpbmc7XG4gIF90eXBlOiBlbGVtZW50VHlwZTtcbiAgc2V0SWQ/OiAoXzpzdHJpbmcpID0+IGFueTtcblxuICBnZXRSYWRpdXM/OiAoKSA9PiBudW1iZXI7XG4gIGdldDJEUGF0aD86ICgpID0+IFBvaW50MkRbXTtcbiAgZ2V0MkRDZW50ZXI/OiAoKSA9PiBQb2ludDJEO1xuICBnZXRXaWR0aD86ICgpID0+IG51bWJlcjtcbiAgZ2V0Q29sb3JzOiAoKSA9PiBhbnk7XG5cbiAgbW92ZT86IChfOlBvaW50MkRbXSkgPT4gYW55O1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIG1ha2VpZCgpIHtcbiAgdmFyIHRleHQgPSBcIlwiO1xuICB2YXIgcG9zc2libGUgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5XCI7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA1OyBpKyspe1xuICAgIHRleHQgKz0gcG9zc2libGUuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlLmxlbmd0aCkpO1xuICB9XG5cbiAgcmV0dXJuIHRleHQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGljdGlvbmFyeTxUPiB7XG4gICAgW0s6IHN0cmluZ106IFQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSYW5kb21BcmJpdHJhcnkobWluOiBudW1iZXIsIG1heDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhbmRvbUludChtaW46IG51bWJlciwgbWF4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBpY2tSYW5kb21Gcm9tQXJyYXkoYXJyYXk6IGFueVtdKSB7XG4gIHJldHVybiBhcnJheVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnJheS5sZW5ndGgpXTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgY29sb3JzIH0gZnJvbSAnLi9zdHlsZSc7XG5pbXBvcnQgeyBtYWtlaWQgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgZWxlbWVudFR5cGUsIFBvaW50MkQgfSBmcm9tICcuL2NsYXNzZXMnO1xuXG5sZXQgZGVmYXVsdF9saW5lX3dpZHRoID0gMTtcblxuZXhwb3J0IGNsYXNzIExpbmUge1xuICBfaWQ6IHN0cmluZztcbiAgX3R5cGU6IGVsZW1lbnRUeXBlO1xuICB4MTogbnVtYmVyO1xuICB5MTogbnVtYmVyO1xuICB4MjogbnVtYmVyO1xuICB5MjogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xuICBjb2xvcnM6IGFueTtcblxuICBjb25zdHJ1Y3Rvcih4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4MjogbnVtYmVyLCB5MjogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBpZD86c3RyaW5nLCBfY29sb3JzPzogYW55KXtcbiAgICB0aGlzLl9pZCA9IGlkIHx8IG1ha2VpZCgpO1xuICAgIHRoaXMuX3R5cGUgPSBlbGVtZW50VHlwZS5MaW5lO1xuICAgIHRoaXMueDEgPSB4MTtcbiAgICB0aGlzLnkxID0geTE7XG4gICAgdGhpcy54MiA9IHgyO1xuICAgIHRoaXMueTIgPSB5MjtcbiAgICB0aGlzLndpZHRoID0gd2lkdGggfHwgZGVmYXVsdF9saW5lX3dpZHRoO1xuICAgIHRoaXMuY29sb3JzID0gX2NvbG9ycyB8fCBjb2xvcnM7XG4gIH1cblxuICBnZXRDb2xvcnMoKXtcbiAgICByZXR1cm4gdGhpcy5jb2xvcnM7XG4gIH1cblxuICBzZXRJZChpZDogc3RyaW5nKXtcbiAgICB0aGlzLl9pZCA9IGlkO1xuICB9XG5cbiAgZ2V0MkRDZW50ZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBQb2ludDJEKFxuICAgICAgKHRoaXMueDIgKyB0aGlzLngxKS8yLFxuICAgICAgKHRoaXMueTIgKyB0aGlzLnkxKS8yXG4gICAgKTtcbiAgfVxuXG4gIG1vdmUocG9pbnRzOiBQb2ludDJEW10pe1xuICAgIHRoaXMueDEgPSBwb2ludHNbMF0ueDtcbiAgICB0aGlzLnkxID0gcG9pbnRzWzBdLnk7XG4gICAgdGhpcy54MiA9IHBvaW50c1sxXS54O1xuICAgIHRoaXMueTIgPSBwb2ludHNbMV0ueTtcbiAgfVxuXG4gIGdldFdpZHRoKCl7XG4gICAgcmV0dXJuIHRoaXMud2lkdGg7XG4gIH1cblxuICBnZXQyRFBhdGgoKXtcbiAgICB2YXIgcGF0aDogUG9pbnQyRFtdID0gW107XG4gICAgcGF0aC5wdXNoKFxuICAgICAgbmV3IFBvaW50MkQodGhpcy54MSwgdGhpcy55MSlcbiAgICApO1xuICAgIHBhdGgucHVzaChcbiAgICAgIG5ldyBQb2ludDJEKHRoaXMueDIsIHRoaXMueTIpXG4gICAgKVxuXG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBnZXRSYWRpdXMoKXtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KFxuICAgICAgKHRoaXMueTEgLSB0aGlzLnkyKSoqMiArXG4gICAgICAodGhpcy54MiAtIHRoaXMueDIpKioyXG4gICAgKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgU2NlbmUgfSBmcm9tICcuL3NjZW5lJztcbmltcG9ydCB7IFJvY2tldCB9IGZyb20gJy4vcm9ja2V0JztcbmltcG9ydCB7IFBvaW50MkQgfSBmcm9tICcuL2NsYXNzZXMnO1xuXG5sZXQgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbmxldCBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5sZXQgbWluX3NpZGUgPSBNYXRoLm1pbih3aWR0aCwgaGVpZ2h0KTtcblxuZnVuY3Rpb24gc2V0VXAoc2NlbmU6IFNjZW5lKXtcbiAgbGV0IGRlc3RpbmF0aW9uX3JhZGl1cyA9IG1pbl9zaWRlIC8gMjU7XG4gIGxldCBkZXN0aW5hdGlvbiA9IHNjZW5lLmFkZEVsZW1lbnQoXG4gICAgJ2NpcmNsZScsXG4gICAge1xuICAgICAgJ2N4Jzogd2lkdGggLyAyLFxuICAgICAgJ2N5JzogbWluX3NpZGUgLyAxMCxcbiAgICAgICdyYWRpdXMnOiBkZXN0aW5hdGlvbl9yYWRpdXNcbiAgICB9XG4gICk7XG5cbiAgbGV0IGRlc3RpbmF0aW9uX3BhdGggPSBkZXN0aW5hdGlvbi5nZXQyRFBhdGgoKTtcbiAgbGV0IG9yaWdpbl9yYWRpdXMgPSBtaW5fc2lkZSAvIDMwO1xuICBsZXQgb3JpZ2luID0gc2NlbmUuYWRkRWxlbWVudChcbiAgICAnY2lyY2xlJyxcbiAgICB7XG4gICAgICAnY3gnOiBkZXN0aW5hdGlvbl9wYXRoWzBdLngsXG4gICAgICAnY3knOiBkZXN0aW5hdGlvbl9wYXRoWzBdLnkgKyBtaW5fc2lkZSAvIDQsXG4gICAgICAncmFkaXVzJzogb3JpZ2luX3JhZGl1c1xuICAgIH1cbiAgKTtcblxuICBzY2VuZS5yZW5kZXIoMTAwKTtcbiAgc2NlbmUuc3RhcnRBY3Rpdml0eShcbiAgICAxMDAsXG4gICAgMjUsXG4gICAgb3JpZ2luLFxuICAgIGRlc3RpbmF0aW9uXG4gICk7XG59XG5cbmxldCBzY2VuZSA9IG5ldyBTY2VuZShcbiAgd2lkdGgsXG4gIGhlaWdodCxcbiAgc2V0VXBcbilcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgZ2V0UmFuZG9tSW50LCBnZXRSYW5kb21BcmJpdHJhcnksIHBpY2tSYW5kb21Gcm9tQXJyYXkgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgUG9pbnQyRCwgZWxlbWVudCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSAnLi9saW5lJztcbmltcG9ydCB7IFJvdXRpbmUgfSBmcm9tICcuL3JvdXRpbmVzJztcblxuZXhwb3J0IGNsYXNzIFJvY2tldCBleHRlbmRzIExpbmUge1xuICB2ZWxvY2l0eTogbnVtYmVyW107XG4gIGFjY2VsZXJhdGlvbjogbnVtYmVyW107XG4gIHJvdXRpbmU6IFJvdXRpbmU7XG4gIGNvdW50OiBudW1iZXI7XG5cbiAgaGFzX2xhbmRlZDogdHJ1ZTtcbiAgaXNfYWxpdmU6IGJvb2xlYW47XG4gIGFsaXZlX3JhZGl1czogbnVtYmVyO1xuXG4gIG9yaWdpbjogZWxlbWVudDtcbiAgZGVzdGluYXRpb246IGVsZW1lbnQ7XG5cbiAgZGlzdGFuY2VfdG9fZGVzdGluYXRpb246IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBvcmlnaW46IGVsZW1lbnQsXG4gICAgZGVzdGluYXRpb246IGVsZW1lbnQsXG4gICAgaGVpZ2h0OiBudW1iZXJcbiAgKXtcbiAgICBsZXQgb3JpZ2luX3BvaW50ID0gb3JpZ2luLmdldDJEQ2VudGVyKCk7XG4gICAgbGV0IGRlc3RpbmF0aW9uX3BvaW50ID0gZGVzdGluYXRpb24uZ2V0MkRDZW50ZXIoKTtcblxuICAgIHN1cGVyKFxuICAgICAgb3JpZ2luX3BvaW50LngsXG4gICAgICBvcmlnaW5fcG9pbnQueSAtIGhlaWdodCxcbiAgICAgIG9yaWdpbl9wb2ludC54LFxuICAgICAgb3JpZ2luX3BvaW50LnksXG4gICAgICBoZWlnaHRcbiAgICApO1xuXG4gICAgdGhpcy5pc19hbGl2ZSA9IHRydWU7XG4gICAgdGhpcy5vcmlnaW4gPSBvcmlnaW47XG4gICAgdGhpcy5kZXN0aW5hdGlvbiA9IGRlc3RpbmF0aW9uO1xuICAgIHRoaXMuY291bnQgPSAwO1xuICAgIHRoaXMucm91dGluZSA9IG5ldyBSb3V0aW5lKCk7XG5cbiAgICB0aGlzLmFsaXZlX3JhZGl1cyA9IE1hdGguc3FydChcbiAgICAgIChvcmlnaW5fcG9pbnQueSAtIGRlc3RpbmF0aW9uX3BvaW50LnkpKioyICtcbiAgICAgIChvcmlnaW5fcG9pbnQueCAtIGRlc3RpbmF0aW9uX3BvaW50LngpKioyXG4gICAgKSAqIDEuNTtcblxuICAgIHRoaXMuZGlzdGFuY2VfdG9fZGVzdGluYXRpb24gPSBNYXRoLnNxcnQoXG4gICAgICAob3JpZ2luX3BvaW50LnkgLSBkZXN0aW5hdGlvbl9wb2ludC55KSoqMiArXG4gICAgICAob3JpZ2luX3BvaW50LnggLSBkZXN0aW5hdGlvbl9wb2ludC54KSoqMlxuICAgICk7XG5cbiAgICAvLyBYLCBZXG4gICAgdGhpcy52ZWxvY2l0eSA9IFswLCAwXVxuICAgIHRoaXMuYWNjZWxlcmF0aW9uID0gWzAsIDBdO1xuICB9XG5cbiAgYXBwbHlGb3JjZShmb3JjZTogUG9pbnQyRCl7XG4gICAgdGhpcy5hY2NlbGVyYXRpb25bMF0gKz0gZm9yY2UueDtcbiAgICB0aGlzLmFjY2VsZXJhdGlvblsxXSArPSBmb3JjZS55O1xuICB9XG5cbiAgdXBkYXRlKCl7XG4gICAgaWYoIXRoaXMuaGFzX2xhbmRlZCl7XG4gICAgICBpZih0aGlzLnJvdXRpbmUucG9pbnRzLmxlbmd0aCA+IHRoaXMuY291bnQpe1xuICAgICAgICB0aGlzLmFwcGx5Rm9yY2UoXG4gICAgICAgICAgdGhpcy5yb3V0aW5lLnBvaW50c1t0aGlzLmNvdW50XVxuICAgICAgICApO1xuICAgICAgICB0aGlzLmNvdW50ICs9IDE7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhpcy5pc19hbGl2ZSA9IGZhbHNlXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG5cbiAgICAgIGxldCBkZXN0aW5hdGlvbl9jZW50ZXIgPSB0aGlzLmRlc3RpbmF0aW9uLmdldDJEQ2VudGVyKCk7XG4gICAgICBsZXQgZGVzdGluYXRpb25fcmFkaXVzID0gdGhpcy5kZXN0aW5hdGlvbi5nZXRSYWRpdXMoKTtcblxuICAgICAgbGV0IGF3YXlfZnJvbV9kZXN0aW5hdGlvbiA9IE1hdGguc3FydChcbiAgICAgICAgKHRoaXMueTEgLSBkZXN0aW5hdGlvbl9jZW50ZXIueSkqKjIgK1xuICAgICAgICAodGhpcy54MSAtIGRlc3RpbmF0aW9uX2NlbnRlci54KSoqMlxuICAgICAgKTtcbiAgICAgIGlmKGF3YXlfZnJvbV9kZXN0aW5hdGlvbiA8IHRoaXMuZGlzdGFuY2VfdG9fZGVzdGluYXRpb24pIHtcbiAgICAgICAgdGhpcy5kaXN0YW5jZV90b19kZXN0aW5hdGlvbiA9IGF3YXlfZnJvbV9kZXN0aW5hdGlvbjtcbiAgICAgIH1cblxuICAgICAgaWYoYXdheV9mcm9tX2Rlc3RpbmF0aW9uIDw9IGRlc3RpbmF0aW9uX3JhZGl1cyl7XG4gICAgICAgIHRoaXMuaGFzX2xhbmRlZCA9IHRydWU7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgLy8gQ2hlY2sgaWYgd2UgYXJlIGZ1cnRoZXIgdGhhbiBgdGhpcy5hbGl2ZV9yYWRpdXNgXG4gICAgICAgIGxldCBvcmlnaW5fY2VudGVyID0gdGhpcy5vcmlnaW4uZ2V0MkRDZW50ZXIoKTtcbiAgICAgICAgbGV0IG9yaWdpbl9yYWRpdXMgPSB0aGlzLm9yaWdpbi5nZXRSYWRpdXMoKTtcblxuICAgICAgICBsZXQgYXdheV9mcm9tX29yaWdpbiA9IE1hdGguc3FydChcbiAgICAgICAgICAodGhpcy55MSAtIG9yaWdpbl9jZW50ZXIueSkqKjIgK1xuICAgICAgICAgICh0aGlzLngxIC0gb3JpZ2luX2NlbnRlci54KSoqMlxuICAgICAgICApO1xuICAgICAgICB0aGlzLmlzX2FsaXZlID0gYXdheV9mcm9tX29yaWdpbiA8PSB0aGlzLmFsaXZlX3JhZGl1cztcblxuICAgICAgICBpZih0aGlzLmlzX2FsaXZlKXtcbiAgICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eS5tYXAoXG4gICAgICAgICAgICAoYSwgaSkgPT4gYSArIHRoaXMuYWNjZWxlcmF0aW9uW2ldXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHRoaXMueDEgKz0gdGhpcy52ZWxvY2l0eVswXTtcbiAgICAgICAgICB0aGlzLnkxICs9IHRoaXMudmVsb2NpdHlbMV07XG4gICAgICAgICAgdGhpcy54MiArPSB0aGlzLnZlbG9jaXR5WzBdO1xuICAgICAgICAgIHRoaXMueTIgKz0gdGhpcy52ZWxvY2l0eVsxXTtcbiAgICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IFswLCAwXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHsgZ2V0UmFuZG9tSW50LCBnZXRSYW5kb21BcmJpdHJhcnkgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgUG9pbnQyRCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5cbmxldCBtYXhfcG9pbnRzID0gMzAwO1xuXG5leHBvcnQgY2xhc3MgUm91dGluZSB7XG4gIHBvaW50czogUG9pbnQyRFtdO1xuXG4gIGNvbnN0cnVjdG9yKCl7XG4gICAgdGhpcy5wb2ludHMgPSBbXTtcbiAgICBmb3IobGV0IGkgPSAwOyBpIDwgbWF4X3BvaW50czsgaSsrKXtcbiAgICAgIHRoaXMucG9pbnRzW2ldID0gbmV3IFBvaW50MkQoXG4gICAgICAgIGdldFJhbmRvbUFyYml0cmFyeSgtMiwgMiksXG4gICAgICAgIGdldFJhbmRvbUFyYml0cmFyeSgtMiwgMiksXG4gICAgICApXG4gICAgfVxuICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoID1cIi4vdHlwaW5ncy9pbmRleC5kLnRzXCIvPlxuXG4ndXNlIHN0cmljdCc7XG5pbXBvcnQgeyBEaWN0aW9uYXJ5LCBtYWtlaWQgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgZWxlbWVudCwgZWxlbWVudFR5cGUgfSBmcm9tICcuL2NsYXNzZXMnO1xuaW1wb3J0IHsgQ2lyY2xlIH0gZnJvbSAnLi9jaXJjbGUnO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gJy4vbGluZSc7XG5pbXBvcnQgeyBSb2NrZXQgfSBmcm9tICcuL3JvY2tldCc7XG5cbmV4cG9ydCBjbGFzcyBTY2VuZSB7XG4gIGNhbnZhczogc3ZnanMuRWxlbWVudDtcbiAgZWxlbWVudHM6IGVsZW1lbnRbXTtcbiAgc3ZnX2VsZW1lbnRzOiBEaWN0aW9uYXJ5PHN2Z2pzLkVsZW1lbnQ+O1xuICByb2NrZXRzOiBSb2NrZXRbXTtcblxuICAvLyBHZW5lcmF0aW9uIEluZm9ybWF0aW9uXG4gIGdlbmVyYXRpb25fbnVtYmVyOiBudW1iZXI7XG4gIHRleHRfZWxlbWVudDogc3ZnanMuRWxlbWVudDtcblxuICAvLyBVSSBTZXR0aW5nc1xuICBtaW5fc2lkZTogbnVtYmVyO1xuICByb2NrZXRzX2NvdW50OiBudW1iZXIgPSAyMDtcblxuICBjb25zdHJ1Y3Rvcih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgc2V0VXA6IChfOlNjZW5lKSA9PiBhbnkpIHtcbiAgICB0aGlzLmdlbmVyYXRpb25fbnVtYmVyID0gMDtcbiAgICB0aGlzLmVsZW1lbnRzID0gW107XG4gICAgdGhpcy5yb2NrZXRzID0gW107XG4gICAgdGhpcy5zdmdfZWxlbWVudHMgPSB7fTtcbiAgICB0aGlzLm1pbl9zaWRlID0gTWF0aC5taW4oXG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodFxuICAgICk7XG5cbiAgICAkKCgpID0+IHtcbiAgICAgIGxldCBjYW52YXMgPSBTVkcoJ2NhbnZhcycpO1xuICAgICAgY2FudmFzLnNpemUod2lkdGgsIGhlaWdodCwgdHJ1ZSk7XG5cbiAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzLm5lc3RlZCgpO1xuICAgICAgc2V0VXAodGhpcyk7XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVHZW5lcmF0aW9uKG51bTogbnVtYmVyKXtcbiAgICBpZih0aGlzLnRleHRfZWxlbWVudCA9PT0gdW5kZWZpbmVkKXtcbiAgICAgIHRoaXMudGV4dF9lbGVtZW50ID0gdGhpcy5jYW52YXMudGV4dChcbiAgICAgICAgJ0dlbmVyYXRpb24gIycgKyBudW1cbiAgICAgICkubW92ZShcbiAgICAgICAgMCwgMFxuICAgICAgKS5mb250KHtcbiAgICAgICAgJ2ZhbWlseSc6ICdJbmNvbnNvbGF0YScsXG4gICAgICAgICdzaXplJzogdGhpcy5taW5fc2lkZSAvIDI1XG4gICAgICB9KVxuICAgIH1lbHNle1xuICAgICAgdGhpcy50ZXh0X2VsZW1lbnQudGV4dCgnR2VuZXJhdGlvbiAjJyArIG51bSk7XG4gICAgfVxuICB9XG5cbiAgYWRkRWxlbWVudChlbGVtZW50X3R5cGU6IHN0cmluZywgcHJvcGVydGllczogYW55LCBpZD86IHN0cmluZywgY29sb3JzPzogYW55KXtcbiAgICBpZiAodHlwZW9mIHByb3BlcnRpZXMgIT09ICdvYmplY3QnKXtcbiAgICAgIHByb3BlcnRpZXMgPSB7fVxuICAgIH1cbiAgICB2YXIgb2JqZWN0O1xuXG4gICAgc3dpdGNoKGVsZW1lbnRfdHlwZSl7XG4gICAgICBjYXNlICdjaXJjbGUnOlxuICAgICAgICBsZXQgX2NpcmNsZSA9IG5ldyBDaXJjbGUoXG4gICAgICAgICAgcHJvcGVydGllc1snY3gnXSxcbiAgICAgICAgICBwcm9wZXJ0aWVzWydjeSddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ3JhZGl1cyddLFxuICAgICAgICAgIGlkLFxuICAgICAgICAgIGNvbG9yc1xuICAgICAgICApXG4gICAgICAgIHRoaXMuZWxlbWVudHMucHVzaChfY2lyY2xlKTtcbiAgICAgICAgb2JqZWN0ID0gX2NpcmNsZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsaW5lJzpcbiAgICAgICAgbGV0IF9saW5lID0gbmV3IExpbmUoXG4gICAgICAgICAgcHJvcGVydGllc1sneDEnXSxcbiAgICAgICAgICBwcm9wZXJ0aWVzWyd5MSddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ3gyJ10sXG4gICAgICAgICAgcHJvcGVydGllc1sneTInXSxcbiAgICAgICAgICBwcm9wZXJ0aWVzWyd3aWR0aCddLFxuICAgICAgICAgIGlkLFxuICAgICAgICAgIGNvbG9yc1xuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudHMucHVzaChfbGluZSk7XG4gICAgICAgIG9iamVjdCA9IF9saW5lO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUubG9nKGVsZW1lbnRUeXBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgZHJhd0VsZW1lbnRzKCl7XG4gICAgZm9yKGxldCBlbGVtZW50IG9mIHRoaXMuZWxlbWVudHMpe1xuICAgICAgbGV0IGV4aXN0aW5nX3N2Z19lbGVtZW50ID0gdGhpcy5zdmdfZWxlbWVudHNbZWxlbWVudC5faWRdO1xuICAgICAgbGV0IGNlbnRlcjJkID0gZWxlbWVudC5nZXQyRENlbnRlcigpO1xuICAgICAgbGV0IHBhdGggPSBlbGVtZW50LmdldDJEUGF0aCgpO1xuICAgICAgbGV0IGNvbG9ycyA9IGVsZW1lbnQuZ2V0Q29sb3JzKCk7XG5cbiAgICAgIHN3aXRjaChlbGVtZW50Ll90eXBlKXtcbiAgICAgICAgY2FzZSBlbGVtZW50VHlwZS5DaXJjbGU6XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgYW55IGVsZW1lbnQgd2l0aCBzYW1lIGBfaWRgIGV4aXN0cyBpbiBjYW52YXNcbiAgICAgICAgICAvLyB0aGlzLmNhbnZhcy5oYXMoZWxlbWVudC5zdmdfb2JqZWN0KVxuICAgICAgICAgIGlmKCBleGlzdGluZ19zdmdfZWxlbWVudCA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIGxldCBzdmdfZWxlbWVudCA9IHRoaXMuY2FudmFzLmNpcmNsZShcbiAgICAgICAgICAgICAgZWxlbWVudC5nZXRSYWRpdXMoKSAqIDJcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAnY3gnOiBjZW50ZXIyZC54LFxuICAgICAgICAgICAgICAgICdjeSc6IGNlbnRlcjJkLnksXG4gICAgICAgICAgICAgICAgJ2ZpbGwnOiBjb2xvcnNbJ2ZpbGxfY29sb3InXSxcbiAgICAgICAgICAgICAgICAnc3Ryb2tlJzogY29sb3JzWydzdHJva2VfY29sb3InXSxcbiAgICAgICAgICAgICAgICAnc3Ryb2tlLXdpZHRoJzogZWxlbWVudC5nZXRXaWR0aCgpXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5zdmdfZWxlbWVudHNbZWxlbWVudC5faWRdID0gc3ZnX2VsZW1lbnQ7XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAvLyBSZWRyYXcgb3IgbW92ZVxuICAgICAgICAgICAgaWYoXG4gICAgICAgICAgICAgIGNlbnRlcjJkLnggIT0gZXhpc3Rpbmdfc3ZnX2VsZW1lbnQuY3goKSB8fFxuICAgICAgICAgICAgICBjZW50ZXIyZC55ICE9IGV4aXN0aW5nX3N2Z19lbGVtZW50LmN5KClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBleGlzdGluZ19zdmdfZWxlbWVudC5tb3ZlKGNlbnRlcjJkLngsIGNlbnRlcjJkLnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBlbGVtZW50VHlwZS5MaW5lOlxuICAgICAgICAgIGlmKCBleGlzdGluZ19zdmdfZWxlbWVudCA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIGxldCBzdmdfZWxlbWVudCA9IHRoaXMuY2FudmFzLmxpbmUoXG4gICAgICAgICAgICAgIHBhdGhbMF0ueCxcbiAgICAgICAgICAgICAgcGF0aFswXS55LFxuICAgICAgICAgICAgICBwYXRoWzFdLngsXG4gICAgICAgICAgICAgIHBhdGhbMV0ueSxcbiAgICAgICAgICAgICkuYXR0cih7XG4gICAgICAgICAgICAgICdmaWxsJzogY29sb3JzWydmaWxsX2NvbG9yJ10sXG4gICAgICAgICAgICAgICdzdHJva2UnOiBjb2xvcnNbJ3N0cm9rZV9jb2xvciddLFxuICAgICAgICAgICAgICAnc3Ryb2tlLXdpZHRoJzogZWxlbWVudC5nZXRXaWR0aCgpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuc3ZnX2VsZW1lbnRzW2VsZW1lbnQuX2lkXSA9IHN2Z19lbGVtZW50O1xuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgLy8gUmVkcmF3IG9yIG1vdmVcbiAgICAgICAgICAgIGlmKFxuICAgICAgICAgICAgICBwYXRoWzBdLnggIT0gZXhpc3Rpbmdfc3ZnX2VsZW1lbnQueCgpIHx8XG4gICAgICAgICAgICAgIHBhdGhbMF0ueSAhPSBleGlzdGluZ19zdmdfZWxlbWVudC55KClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBleGlzdGluZ19zdmdfZWxlbWVudC5tb3ZlKFxuICAgICAgICAgICAgICAgIHBhdGhbMF0ueCxcbiAgICAgICAgICAgICAgICBwYXRoWzBdLnlcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSByb2NrZXQgLSBjaGVjayBpdCdzIHN0YXR1c1xuICAgICAgICAgICAgZm9yKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKXtcbiAgICAgICAgICAgICAgaWYocm9ja2V0Ll9pZCA9PSBlbGVtZW50Ll9pZCl7XG4gICAgICAgICAgICAgICAgaWYocm9ja2V0LmlzX2FsaXZlKXtcblxuICAgICAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50KHJvY2tldC5faWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZW1vdmVFbGVtZW50KGlkOiBzdHJpbmcpe1xuICAgIHZhciBlbDtcblxuICAgIGZvcihsZXQgZWxlbWVudCBvZiB0aGlzLmVsZW1lbnRzKXtcbiAgICAgIGlmKGVsZW1lbnQuX2lkID09IGlkKXtcbiAgICAgICAgZWwgPSBlbGVtZW50O1xuICAgICAgfVxuICAgIH1cbiAgICBpZihlbCAhPSB1bmRlZmluZWQpe1xuICAgICAgbGV0IGVsZW1lbnRfaW5kZXggPSB0aGlzLmVsZW1lbnRzLmluZGV4T2YoZWwpO1xuICAgICAgaWYoZWxlbWVudF9pbmRleCAhPSAtMSl7XG4gICAgICAgIHRoaXMuZWxlbWVudHMuc3BsaWNlKGVsZW1lbnRfaW5kZXgsIDEpO1xuICAgICAgICBsZXQgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQgPSB0aGlzLnN2Z19lbGVtZW50c1tlbC5faWRdO1xuICAgICAgICBpZihleGlzdGluZ19zdmdfZWxlbWVudCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBleGlzdGluZ19zdmdfZWxlbWVudC5yZW1vdmUoKTtcbiAgICAgICAgICBkZWxldGUgdGhpcy5zdmdfZWxlbWVudHNbZWwuX2lkXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFjdGl2aXR5KCl7XG4gICAgdmFyIGRlYWRfcm9ja2V0c19jb3VudCA9IDA7XG4gICAgdmFyIGxhbmRlZF9yb2NrZXRzX2NvdW50ID0gMDtcblxuICAgIGZvciAobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpIHtcbiAgICAgIGlmIChyb2NrZXQuaXNfYWxpdmUpIHtcbiAgICAgICAgaWYocm9ja2V0Lmhhc19sYW5kZWQpe1xuICAgICAgICAgIGxhbmRlZF9yb2NrZXRzX2NvdW50ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiB0aGlzLmVsZW1lbnRzKSB7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuX2lkID09IHJvY2tldC5faWQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQubW92ZShcbiAgICAgICAgICAgICAgcm9ja2V0LmdldDJEUGF0aCgpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcm9ja2V0LnVwZGF0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfWVsc2V7XG4gICAgICAgIGRlYWRfcm9ja2V0c19jb3VudCArPSAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZWFkX3JvY2tldHNfY291bnQgKyBsYW5kZWRfcm9ja2V0c19jb3VudCA9PSB0aGlzLnJvY2tldHMubGVuZ3RoXG4gIH1cblxuICBzdGFydEFjdGl2aXR5KFxuICAgIGludGVydmFsOiBudW1iZXIsXG4gICAgcm9ja2V0c19jb3VudDogbnVtYmVyLFxuICAgIG9yaWdpbjogZWxlbWVudCxcbiAgICBkZXN0aW5hdGlvbjogZWxlbWVudFxuICApe1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBzZWxmLmdlbmVyYXRpb25fbnVtYmVyICs9IDE7XG4gICAgc2VsZi51cGRhdGVHZW5lcmF0aW9uKHNlbGYuZ2VuZXJhdGlvbl9udW1iZXIpO1xuICAgIHNlbGYuc3RhcnRfcm9ja2V0cyhcbiAgICAgIHJvY2tldHNfY291bnQsXG4gICAgICBvcmlnaW4sXG4gICAgICBkZXN0aW5hdGlvblxuICAgICk7XG5cbiAgICBsZXQgaW50ZXJ2YWxfaWQgPSBzZXRJbnRlcnZhbChcbiAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBhY3Rpdml0eV9maW5pc2hlZCA9IHNlbGYuYWN0aXZpdHkoKTtcbiAgICAgICAgaWYoYWN0aXZpdHlfZmluaXNoZWQpe1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsX2lkKTtcblxuICAgICAgICAgIHNlbGYuc3RhcnRfcm9ja2V0cyhcbiAgICAgICAgICAgIHJvY2tldHNfY291bnQsXG4gICAgICAgICAgICBvcmlnaW4sXG4gICAgICAgICAgICBkZXN0aW5hdGlvblxuICAgICAgICAgICk7XG4gICAgICAgICAgc2VsZi5zdGFydEFjdGl2aXR5KFxuICAgICAgICAgICAgaW50ZXJ2YWwsXG4gICAgICAgICAgICByb2NrZXRzX2NvdW50LFxuICAgICAgICAgICAgb3JpZ2luLFxuICAgICAgICAgICAgZGVzdGluYXRpb25cbiAgICAgICAgICApO1xuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIGludGVydmFsXG4gICAgKTtcbiAgfVxuXG4gIHJlbmRlcihpbnRlcnZhbDogbnVtYmVyKXtcbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmRyYXdFbGVtZW50cygpLCBpbnRlcnZhbCk7XG4gIH1cblxuICBzdGFydF9yb2NrZXRzKFxuICAgIHJvY2tldHNfY291bnQ6IG51bWJlcixcbiAgICBvcmlnaW46IGVsZW1lbnQsXG4gICAgZGVzdGluYXRpb246IGVsZW1lbnRcbiAgKXtcbiAgICB2YXIgcm9ja2V0cyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9ja2V0c19jb3VudDsgaSsrKSB7XG4gICAgICBsZXQgcm9ja2V0X2hlaWdodCA9IHRoaXMubWluX3NpZGUgLyAxMDA7XG4gICAgICBsZXQgcm9ja2V0ID0gbmV3IFJvY2tldChcbiAgICAgICAgb3JpZ2luLFxuICAgICAgICBkZXN0aW5hdGlvbixcbiAgICAgICAgcm9ja2V0X2hlaWdodCxcbiAgICAgICk7XG4gICAgICByb2NrZXRzLnB1c2goXG4gICAgICAgIHJvY2tldFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvY2tldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCByb2NrZXQgPSByb2NrZXRzW2ldO1xuICAgICAgbGV0IF9saW5lID0gdGhpcy5hZGRFbGVtZW50KFxuICAgICAgICAnbGluZScsXG4gICAgICAgIHtcbiAgICAgICAgICAneDEnOiByb2NrZXQueDEsXG4gICAgICAgICAgJ3kxJzogcm9ja2V0LnkxLFxuICAgICAgICAgICd4Mic6IHJvY2tldC54MixcbiAgICAgICAgICAneTInOiByb2NrZXQueTIsXG4gICAgICAgICAgJ3dpZHRoJzogcm9ja2V0LndpZHRoXG4gICAgICAgIH0sXG4gICAgICAgIHJvY2tldC5faWQsXG4gICAgICAgIHtcbiAgICAgICAgICBmaWxsX2NvbG9yOiAncmdiYSgwLCAwLCAwLCAuOSknLFxuICAgICAgICAgIHN0cm9rZV9jb2xvcjogJ3JnYmEoMjUyLCA5OCwgOTMsIC43KScsXG4gICAgICAgICAgZm9udF9jb2xvcjogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMSknLFxuICAgICAgICB9XG4gICAgICApO1xuICAgICAgdGhpcy5yb2NrZXRzLnB1c2goXG4gICAgICAgIHJvY2tldFxuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cbiIsImV4cG9ydCBsZXQgY29sb3JzID0ge1xuICBmaWxsX2NvbG9yOiAncmdiYSgxNTcsMTY1LDE4MCwgLjkpJyxcbiAgc3Ryb2tlX2NvbG9yOiAncmdiYSgxMjYsIDEzMywgMTQ2LCAxKScsXG4gIGZvbnRfY29sb3I6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDEpJyxcbn1cbiJdfQ==

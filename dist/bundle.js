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

},{"./classes":2,"./helpers":3,"./style":8}],2:[function(require,module,exports){
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

},{"./classes":2,"./helpers":3,"./style":8}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scene_1 = require("./scene");
var width = window.innerWidth;
var height = window.innerHeight;
var min_side = Math.min(width, height);
var scene = new scene_1.Scene(width, height);
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
scene.startActivity(100, 10, origin, destination);

},{"./scene":7}],6:[function(require,module,exports){
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
var helpers_1 = require("./helpers");
var line_1 = require("./line");
var engines_count = 4;
var Rocket = /** @class */ (function (_super) {
    __extends(Rocket, _super);
    function Rocket(origin, destination, height) {
        var _this = this;
        var origin_point = origin.get2DCenter();
        var destination_point = destination.get2DCenter();
        _this = _super.call(this, origin_point.x, origin_point.y - height, origin_point.x, origin_point.y, height / 5) || this;
        _this.is_alive = true;
        _this.origin = origin;
        _this.destination = destination;
        _this.alive_radius = Math.sqrt(Math.pow((origin_point.y - destination_point.y), 2) +
            Math.pow((origin_point.x - destination_point.x), 2)) * 1.5;
        _this.distance_to_destination = Math.sqrt(Math.pow((origin_point.y - destination_point.y), 2) +
            Math.pow((origin_point.x - destination_point.x), 2));
        _this.velocity = [
            helpers_1.getRandomArbitrary(-1, 1),
            helpers_1.getRandomArbitrary(-1, 1)
            // 0, -1
        ];
        _this.acceleration = [1, 1];
        _this.engines = [];
        for (var i = 0; i < engines_count; i++) {
            _this.engines.push(helpers_1.getRandomInt(0, 1));
        }
        return _this;
    }
    Rocket.prototype.applyForce = function (force) {
        for (var i = 0; i < this.acceleration.length; i++) {
            this.acceleration[i] += force;
        }
    };
    Rocket.prototype.update = function () {
        if (!this.has_landed) {
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
                    this.applyForce(helpers_1.getRandomArbitrary(0, 1));
                    this.x1 += (this.velocity[0] * this.acceleration[0]);
                    this.y1 += (this.velocity[1] * this.acceleration[1]);
                    this.x2 += (this.velocity[0] * this.acceleration[0]);
                    this.y2 += (this.velocity[1] * this.acceleration[1]);
                }
            }
        }
    };
    return Rocket;
}(line_1.Line));
exports.Rocket = Rocket;

},{"./helpers":3,"./line":4}],7:[function(require,module,exports){
/// <reference path ="./typings/index.d.ts"/>
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var classes_1 = require("./classes");
var circle_1 = require("./circle");
var line_1 = require("./line");
var rocket_1 = require("./rocket");
var Scene = /** @class */ (function () {
    function Scene(width, height) {
        var _this = this;
        this.rockets_count = 20;
        this.elements = [];
        this.rockets = [];
        this.svg_elements = {};
        this.min_side = Math.min(width, height);
        $(function () {
            var canvas = SVG('canvas');
            canvas.size(width, height, true);
            _this.canvas = canvas.nested();
        });
    }
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
        var interval_id = setInterval(function () {
            if (self.activity()) {
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
            var rocket_height = this.min_side / 40;
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
                stroke_color: 'rgba(255, 0, 0, 1)',
                font_color: 'rgba(255, 255, 255, 1)',
            });
            this.rockets.push(rocket);
        }
    };
    return Scene;
}());
exports.Scene = Scene;

},{"./circle":1,"./classes":2,"./line":4,"./rocket":6}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = {
    fill_color: 'rgba(157,165,180, .9)',
    stroke_color: 'rgba(126, 133, 146, 1)',
    font_color: 'rgba(255, 255, 255, 1)',
};

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2lyY2xlLnRzIiwic3JjL2NsYXNzZXMudHMiLCJzcmMvaGVscGVycy50cyIsInNyYy9saW5lLnRzIiwic3JjL21haW4udHMiLCJzcmMvcm9ja2V0LnRzIiwic3JjL3NjZW5lLnRzIiwic3JjL3N0eWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsWUFBWSxDQUFDOztBQUViLGlDQUFpQztBQUNqQyxxQ0FBbUM7QUFDbkMscUNBQWlEO0FBRWpELElBQUkscUJBQXFCLEdBQUcsRUFBRSxDQUFDO0FBRS9CO0lBU0UsZ0JBQVksRUFBVSxFQUFFLEVBQVUsRUFBRSxNQUFjLEVBQUUsRUFBVyxFQUFFLE9BQWE7UUFDNUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLElBQUksZ0JBQU0sRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxLQUFLLEdBQUcscUJBQVcsQ0FBQyxNQUFNLENBQUM7UUFDaEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLHFCQUFxQixDQUFDO1FBQzlDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLElBQUksY0FBTSxDQUFDO0lBQ2xDLENBQUM7SUFFRCwwQkFBUyxHQUFUO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDckIsQ0FBQztJQUVELHNCQUFLLEdBQUwsVUFBTSxFQUFVO1FBQ2QsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELDRCQUFXLEdBQVg7UUFDRSxNQUFNLENBQUMsSUFBSSxpQkFBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFB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O1FBQ0osQ0FBQztRQUVELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3hDLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUN6QixNQUFNLEVBQ047Z0JBQ0UsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNmLElBQUksRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDZixJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ2YsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO2dCQUNmLE9BQU8sRUFBRSxNQUFNLENBQUMsS0FBSzthQUN0QixFQUNELE1BQU0sQ0FBQyxHQUFHLEVBQ1Y7Z0JBQ0UsVUFBVSxFQUFFLG1CQUFtQjtnQkFDL0IsWUFBWSxFQUFFLG9CQUFvQjtnQkFDbEMsVUFBVSxFQUFFLHdCQUF3QjthQUNyQyxDQUNGLENBQUM7WUFDRixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FDZixNQUFNLENBQ1AsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0lBQ0gsWUFBQztBQUFELENBcFFBLEFBb1FDLElBQUE7QUFwUVksc0JBQUs7Ozs7O0FDVFAsUUFBQSxNQUFNLEdBQUc7SUFDbEIsVUFBVSxFQUFFLHVCQUF1QjtJQUNuQyxZQUFZLEVBQUUsd0JBQXdCO0lBQ3RDLFVBQVUsRUFBRSx3QkFBd0I7Q0FDckMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGNvbG9ycyB9IGZyb20gJy4vc3R5bGUnO1xuaW1wb3J0IHsgbWFrZWlkIH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IGVsZW1lbnRUeXBlLCBQb2ludDJEIH0gZnJvbSAnLi9jbGFzc2VzJztcblxubGV0IGRlZmF1bHRfY2lyY2xlX3JhZGl1cyA9IDEwO1xuXG5leHBvcnQgY2xhc3MgQ2lyY2xlIHtcbiAgX2lkOiBzdHJpbmc7XG4gIF90eXBlOiBlbGVtZW50VHlwZTtcbiAgY3g6IG51bWJlcjtcbiAgY3k6IG51bWJlcjtcbiAgcmFkaXVzOiBudW1iZXI7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGNvbG9yczogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGN4OiBudW1iZXIsIGN5OiBudW1iZXIsIHJhZGl1czogbnVtYmVyLCBpZD86IHN0cmluZywgX2NvbG9ycz86IGFueSl7XG4gICAgdGhpcy5faWQgPSBpZCB8fCBtYWtlaWQoKTtcbiAgICB0aGlzLl90eXBlID0gZWxlbWVudFR5cGUuQ2lyY2xlO1xuICAgIHRoaXMuY3ggPSBjeDtcbiAgICB0aGlzLmN5ID0gY3k7XG4gICAgdGhpcy5yYWRpdXMgPSByYWRpdXMgfHwgZGVmYXVsdF9jaXJjbGVfcmFkaXVzO1xuICAgIHRoaXMud2lkdGggPSB0aGlzLnJhZGl1cyAvIDg7XG4gICAgdGhpcy5jb2xvcnMgPSBfY29sb3JzIHx8IGNvbG9ycztcbiAgfVxuXG4gIGdldENvbG9ycygpe1xuICAgIHJldHVybiB0aGlzLmNvbG9ycztcbiAgfVxuXG4gIHNldElkKGlkOiBzdHJpbmcpe1xuICAgIHRoaXMuX2lkID0gaWQ7XG4gIH1cblxuICBnZXQyRENlbnRlcigpIHtcbiAgICByZXR1cm4gbmV3IFBvaW50MkQodGhpcy5jeCwgdGhpcy5jeSk7XG4gIH1cblxuICBtb3ZlKHBvaW50czogUG9pbnQyRFtdKXtcbiAgICB0aGlzLmN4ID0gcG9pbnRzWzBdLng7XG4gICAgdGhpcy5jeSA9IHBvaW50c1swXS55O1xuICB9XG5cbiAgZ2V0V2lkdGgoKXtcbiAgICByZXR1cm4gdGhpcy53aWR0aDtcbiAgfVxuXG4gIGdldDJEUGF0aCgpe1xuICAgIHZhciBwYXRoOiBQb2ludDJEW10gPSBbXTtcbiAgICBwYXRoLnB1c2goXG4gICAgICBuZXcgUG9pbnQyRCh0aGlzLmN4LCB0aGlzLmN5KVxuICAgICk7XG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBnZXRSYWRpdXMoKXtcbiAgICByZXR1cm4gdGhpcy5yYWRpdXM7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGNsYXNzIFBvaW50MkQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcblxuICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlcil7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQb2ludDNEIHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG4gIHo6IG51bWJlcjtcblxuICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKXtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy56ID0gejtcbiAgfVxufVxuXG5leHBvcnQgZW51bSBlbGVtZW50VHlwZSB7XG4gIENpcmNsZSxcbiAgTGluZVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIGVsZW1lbnQge1xuICBfaWQ6IHN0cmluZztcbiAgX3R5cGU6IGVsZW1lbnRUeXBlO1xuICBzZXRJZD86IChfOnN0cmluZykgPT4gYW55O1xuXG4gIGdldFJhZGl1cz86ICgpID0+IG51bWJlcjtcbiAgZ2V0MkRQYXRoPzogKCkgPT4gUG9pbnQyRFtdO1xuICBnZXQyRENlbnRlcj86ICgpID0+IFBvaW50MkQ7XG4gIGdldFdpZHRoPzogKCkgPT4gbnVtYmVyO1xuICBnZXRDb2xvcnM6ICgpID0+IGFueTtcblxuICBtb3ZlPzogKF86UG9pbnQyRFtdKSA9PiBhbnk7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gbWFrZWlkKCkge1xuICB2YXIgdGV4dCA9IFwiXCI7XG4gIHZhciBwb3NzaWJsZSA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlcIjtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IDU7IGkrKyl7XG4gICAgdGV4dCArPSBwb3NzaWJsZS5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGUubGVuZ3RoKSk7XG4gIH1cblxuICByZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEaWN0aW9uYXJ5PFQ+IHtcbiAgICBbSzogc3RyaW5nXTogVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhbmRvbUFyYml0cmFyeShtaW46IG51bWJlciwgbWF4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmFuZG9tSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcikge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGlja1JhbmRvbUZyb21BcnJheShhcnJheTogYW55W10pIHtcbiAgcmV0dXJuIGFycmF5W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFycmF5Lmxlbmd0aCldO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuL3N0eWxlJztcbmltcG9ydCB7IG1ha2VpZCB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBlbGVtZW50VHlwZSwgUG9pbnQyRCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5cbmxldCBkZWZhdWx0X2xpbmVfd2lkdGggPSAxO1xuXG5leHBvcnQgY2xhc3MgTGluZSB7XG4gIF9pZDogc3RyaW5nO1xuICBfdHlwZTogZWxlbWVudFR5cGU7XG4gIHgxOiBudW1iZXI7XG4gIHkxOiBudW1iZXI7XG4gIHgyOiBudW1iZXI7XG4gIHkyOiBudW1iZXI7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGNvbG9yczogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHgxOiBudW1iZXIsIHkxOiBudW1iZXIsIHgyOiBudW1iZXIsIHkyOiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGlkPzpzdHJpbmcsIF9jb2xvcnM/OiBhbnkpe1xuICAgIHRoaXMuX2lkID0gaWQgfHwgbWFrZWlkKCk7XG4gICAgdGhpcy5fdHlwZSA9IGVsZW1lbnRUeXBlLkxpbmU7XG4gICAgdGhpcy54MSA9IHgxO1xuICAgIHRoaXMueTEgPSB5MTtcbiAgICB0aGlzLngyID0geDI7XG4gICAgdGhpcy55MiA9IHkyO1xuICAgIHRoaXMud2lkdGggPSB3aWR0aCB8fCBkZWZhdWx0X2xpbmVfd2lkdGg7XG4gICAgdGhpcy5jb2xvcnMgPSBfY29sb3JzIHx8IGNvbG9ycztcbiAgfVxuXG4gIGdldENvbG9ycygpe1xuICAgIHJldHVybiB0aGlzLmNvbG9ycztcbiAgfVxuXG4gIHNldElkKGlkOiBzdHJpbmcpe1xuICAgIHRoaXMuX2lkID0gaWQ7XG4gIH1cblxuICBnZXQyRENlbnRlcigpIHtcbiAgICByZXR1cm4gbmV3IFBvaW50MkQoXG4gICAgICAodGhpcy54MiArIHRoaXMueDEpLzIsXG4gICAgICAodGhpcy55MiArIHRoaXMueTEpLzJcbiAgICApO1xuICB9XG5cbiAgbW92ZShwb2ludHM6IFBvaW50MkRbXSl7XG4gICAgdGhpcy54MSA9IHBvaW50c1swXS54O1xuICAgIHRoaXMueTEgPSBwb2ludHNbMF0ueTtcbiAgICB0aGlzLngyID0gcG9pbnRzWzFdLng7XG4gICAgdGhpcy55MiA9IHBvaW50c1sxXS55O1xuICB9XG5cbiAgZ2V0V2lkdGgoKXtcbiAgICByZXR1cm4gdGhpcy53aWR0aDtcbiAgfVxuXG4gIGdldDJEUGF0aCgpe1xuICAgIHZhciBwYXRoOiBQb2ludDJEW10gPSBbXTtcbiAgICBwYXRoLnB1c2goXG4gICAgICBuZXcgUG9pbnQyRCh0aGlzLngxLCB0aGlzLnkxKVxuICAgICk7XG4gICAgcGF0aC5wdXNoKFxuICAgICAgbmV3IFBvaW50MkQodGhpcy54MiwgdGhpcy55MilcbiAgICApXG5cbiAgICByZXR1cm4gcGF0aDtcbiAgfVxuXG4gIGdldFJhZGl1cygpe1xuICAgIHJldHVybiBNYXRoLnNxcnQoXG4gICAgICAodGhpcy55MSAtIHRoaXMueTIpKioyICtcbiAgICAgICh0aGlzLngyIC0gdGhpcy54MikqKjJcbiAgICApO1xuICB9XG59XG4iLCJpbXBvcnQgeyBTY2VuZSB9IGZyb20gJy4vc2NlbmUnO1xuaW1wb3J0IHsgUm9ja2V0IH0gZnJvbSAnLi9yb2NrZXQnO1xuaW1wb3J0IHsgUG9pbnQyRCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5cbmxldCB3aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xubGV0IGhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbmxldCBtaW5fc2lkZSA9IE1hdGgubWluKHdpZHRoLCBoZWlnaHQpO1xuXG5sZXQgc2NlbmUgPSBuZXcgU2NlbmUoXG4gIHdpZHRoLFxuICBoZWlnaHRcbilcblxubGV0IGRlc3RpbmF0aW9uX3JhZGl1cyA9IG1pbl9zaWRlIC8gMjU7XG5sZXQgZGVzdGluYXRpb24gPSBzY2VuZS5hZGRFbGVtZW50KFxuICAnY2lyY2xlJyxcbiAge1xuICAgICdjeCc6IHdpZHRoIC8gMixcbiAgICAnY3knOiBtaW5fc2lkZSAvIDEwLFxuICAgICdyYWRpdXMnOiBkZXN0aW5hdGlvbl9yYWRpdXNcbiAgfVxuKTtcblxubGV0IGRlc3RpbmF0aW9uX3BhdGggPSBkZXN0aW5hdGlvbi5nZXQyRFBhdGgoKTtcbmxldCBvcmlnaW5fcmFkaXVzID0gbWluX3NpZGUgLyAzMDtcbmxldCBvcmlnaW4gPSBzY2VuZS5hZGRFbGVtZW50KFxuICAnY2lyY2xlJyxcbiAge1xuICAgICdjeCc6IGRlc3RpbmF0aW9uX3BhdGhbMF0ueCxcbiAgICAnY3knOiBkZXN0aW5hdGlvbl9wYXRoWzBdLnkgKyBtaW5fc2lkZSAvIDQsXG4gICAgJ3JhZGl1cyc6IG9yaWdpbl9yYWRpdXNcbiAgfVxuKTtcblxuc2NlbmUucmVuZGVyKDEwMCk7XG5zY2VuZS5zdGFydEFjdGl2aXR5KFxuICAxMDAsXG4gIDEwLFxuICBvcmlnaW4sXG4gIGRlc3RpbmF0aW9uXG4pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBnZXRSYW5kb21JbnQsIGdldFJhbmRvbUFyYml0cmFyeSwgcGlja1JhbmRvbUZyb21BcnJheSB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBQb2ludDJELCBlbGVtZW50IH0gZnJvbSAnLi9jbGFzc2VzJztcbmltcG9ydCB7IExpbmUgfSBmcm9tICcuL2xpbmUnO1xuaW1wb3J0IHsgQ2lyY2xlIH0gZnJvbSAnLi9jaXJjbGUnO1xuXG5cbmxldCBlbmdpbmVzX2NvdW50ID0gNDtcblxuZXhwb3J0IGNsYXNzIFJvY2tldCBleHRlbmRzIExpbmUge1xuICBlbmdpbmVzOiBudW1iZXJbXTtcbiAgdmVsb2NpdHk6IG51bWJlcltdO1xuICBhY2NlbGVyYXRpb246IG51bWJlcltdO1xuXG4gIGhhc19sYW5kZWQ6IHRydWU7XG4gIGlzX2FsaXZlOiBib29sZWFuO1xuICBhbGl2ZV9yYWRpdXM6IG51bWJlcjtcblxuICBvcmlnaW46IGVsZW1lbnQ7XG4gIGRlc3RpbmF0aW9uOiBlbGVtZW50O1xuXG4gIGRpc3RhbmNlX3RvX2Rlc3RpbmF0aW9uOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgb3JpZ2luOiBlbGVtZW50LFxuICAgIGRlc3RpbmF0aW9uOiBlbGVtZW50LFxuICAgIGhlaWdodDogbnVtYmVyXG4gICl7XG4gICAgbGV0IG9yaWdpbl9wb2ludCA9IG9yaWdpbi5nZXQyRENlbnRlcigpO1xuICAgIGxldCBkZXN0aW5hdGlvbl9wb2ludCA9IGRlc3RpbmF0aW9uLmdldDJEQ2VudGVyKCk7XG5cbiAgICBzdXBlcihcbiAgICAgIG9yaWdpbl9wb2ludC54LFxuICAgICAgb3JpZ2luX3BvaW50LnkgLSBoZWlnaHQsXG4gICAgICBvcmlnaW5fcG9pbnQueCxcbiAgICAgIG9yaWdpbl9wb2ludC55LFxuICAgICAgaGVpZ2h0LzVcbiAgICApO1xuXG4gICAgdGhpcy5pc19hbGl2ZSA9IHRydWU7XG4gICAgdGhpcy5vcmlnaW4gPSBvcmlnaW47XG4gICAgdGhpcy5kZXN0aW5hdGlvbiA9IGRlc3RpbmF0aW9uO1xuICAgIHRoaXMuYWxpdmVfcmFkaXVzID0gTWF0aC5zcXJ0KFxuICAgICAgKG9yaWdpbl9wb2ludC55IC0gZGVzdGluYXRpb25fcG9pbnQueSkqKjIgK1xuICAgICAgKG9yaWdpbl9wb2ludC54IC0gZGVzdGluYXRpb25fcG9pbnQueCkqKjJcbiAgICApICogMS41O1xuXG4gICAgdGhpcy5kaXN0YW5jZV90b19kZXN0aW5hdGlvbiA9IE1hdGguc3FydChcbiAgICAgIChvcmlnaW5fcG9pbnQueSAtIGRlc3RpbmF0aW9uX3BvaW50LnkpKioyICtcbiAgICAgIChvcmlnaW5fcG9pbnQueCAtIGRlc3RpbmF0aW9uX3BvaW50LngpKioyXG4gICAgKTtcblxuXG4gICAgdGhpcy52ZWxvY2l0eSA9IFtcbiAgICAgIGdldFJhbmRvbUFyYml0cmFyeSgtMSwgMSksXG4gICAgICBnZXRSYW5kb21BcmJpdHJhcnkoLTEsIDEpXG4gICAgICAvLyAwLCAtMVxuICAgIF07XG4gICAgdGhpcy5hY2NlbGVyYXRpb24gPSBbMSwgMV07XG5cbiAgICB0aGlzLmVuZ2luZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVuZ2luZXNfY291bnQ7IGkrKykge1xuICAgICAgdGhpcy5lbmdpbmVzLnB1c2goXG4gICAgICAgIGdldFJhbmRvbUludCgwLCAxKVxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBhcHBseUZvcmNlKGZvcmNlOiBudW1iZXIpe1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5hY2NlbGVyYXRpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuYWNjZWxlcmF0aW9uW2ldICs9IGZvcmNlO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZSgpe1xuICAgIGlmKCF0aGlzLmhhc19sYW5kZWQpe1xuICAgICAgbGV0IGRlc3RpbmF0aW9uX2NlbnRlciA9IHRoaXMuZGVzdGluYXRpb24uZ2V0MkRDZW50ZXIoKTtcbiAgICAgIGxldCBkZXN0aW5hdGlvbl9yYWRpdXMgPSB0aGlzLmRlc3RpbmF0aW9uLmdldFJhZGl1cygpO1xuXG4gICAgICBsZXQgYXdheV9mcm9tX2Rlc3RpbmF0aW9uID0gTWF0aC5zcXJ0KFxuICAgICAgICAodGhpcy55MSAtIGRlc3RpbmF0aW9uX2NlbnRlci55KSoqMiArXG4gICAgICAgICh0aGlzLngxIC0gZGVzdGluYXRpb25fY2VudGVyLngpKioyXG4gICAgICApO1xuICAgICAgaWYoYXdheV9mcm9tX2Rlc3RpbmF0aW9uIDwgdGhpcy5kaXN0YW5jZV90b19kZXN0aW5hdGlvbikge1xuICAgICAgICB0aGlzLmRpc3RhbmNlX3RvX2Rlc3RpbmF0aW9uID0gYXdheV9mcm9tX2Rlc3RpbmF0aW9uO1xuICAgICAgfVxuXG4gICAgICBpZihhd2F5X2Zyb21fZGVzdGluYXRpb24gPD0gZGVzdGluYXRpb25fcmFkaXVzKXtcbiAgICAgICAgdGhpcy5oYXNfbGFuZGVkID0gdHJ1ZTtcbiAgICAgIH1lbHNle1xuICAgICAgICAvLyBDaGVjayBpZiB3ZSBhcmUgZnVydGhlciB0aGFuIGB0aGlzLmFsaXZlX3JhZGl1c2BcbiAgICAgICAgbGV0IG9yaWdpbl9jZW50ZXIgPSB0aGlzLm9yaWdpbi5nZXQyRENlbnRlcigpO1xuICAgICAgICBsZXQgb3JpZ2luX3JhZGl1cyA9IHRoaXMub3JpZ2luLmdldFJhZGl1cygpO1xuXG4gICAgICAgIGxldCBhd2F5X2Zyb21fb3JpZ2luID0gTWF0aC5zcXJ0KFxuICAgICAgICAgICh0aGlzLnkxIC0gb3JpZ2luX2NlbnRlci55KSoqMiArXG4gICAgICAgICAgKHRoaXMueDEgLSBvcmlnaW5fY2VudGVyLngpKioyXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuaXNfYWxpdmUgPSBhd2F5X2Zyb21fb3JpZ2luIDw9IHRoaXMuYWxpdmVfcmFkaXVzO1xuXG4gICAgICAgIGlmKHRoaXMuaXNfYWxpdmUpe1xuICAgICAgICAgIHRoaXMuYXBwbHlGb3JjZShnZXRSYW5kb21BcmJpdHJhcnkoMCwgMSkpO1xuICAgICAgICAgIHRoaXMueDEgKz0gKHRoaXMudmVsb2NpdHlbMF0gKiB0aGlzLmFjY2VsZXJhdGlvblswXSk7XG4gICAgICAgICAgdGhpcy55MSArPSAodGhpcy52ZWxvY2l0eVsxXSAqIHRoaXMuYWNjZWxlcmF0aW9uWzFdKTtcbiAgICAgICAgICB0aGlzLngyICs9ICh0aGlzLnZlbG9jaXR5WzBdICogdGhpcy5hY2NlbGVyYXRpb25bMF0pO1xuICAgICAgICAgIHRoaXMueTIgKz0gKHRoaXMudmVsb2NpdHlbMV0gKiB0aGlzLmFjY2VsZXJhdGlvblsxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGggPVwiLi90eXBpbmdzL2luZGV4LmQudHNcIi8+XG5cbid1c2Ugc3RyaWN0JztcbmltcG9ydCB7IERpY3Rpb25hcnkgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgZWxlbWVudCwgZWxlbWVudFR5cGUgfSBmcm9tICcuL2NsYXNzZXMnO1xuaW1wb3J0IHsgQ2lyY2xlIH0gZnJvbSAnLi9jaXJjbGUnO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gJy4vbGluZSc7XG5pbXBvcnQgeyBSb2NrZXQgfSBmcm9tICcuL3JvY2tldCc7XG5cbmV4cG9ydCBjbGFzcyBTY2VuZSB7XG4gIGNhbnZhczogc3ZnanMuRWxlbWVudDtcbiAgZWxlbWVudHM6IGVsZW1lbnRbXTtcbiAgc3ZnX2VsZW1lbnRzOiBEaWN0aW9uYXJ5PHN2Z2pzLkVsZW1lbnQ+O1xuICByb2NrZXRzOiBSb2NrZXRbXTtcblxuICAvLyBVSSBTZXR0aW5nc1xuICBtaW5fc2lkZTogbnVtYmVyO1xuICByb2NrZXRzX2NvdW50OiBudW1iZXIgPSAyMDtcblxuICBjb25zdHJ1Y3Rvcih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlcikge1xuICAgIHRoaXMuZWxlbWVudHMgPSBbXTtcbiAgICB0aGlzLnJvY2tldHMgPSBbXTtcbiAgICB0aGlzLnN2Z19lbGVtZW50cyA9IHt9O1xuICAgIHRoaXMubWluX3NpZGUgPSBNYXRoLm1pbihcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0XG4gICAgKTtcblxuICAgICQoKCkgPT4ge1xuICAgICAgbGV0IGNhbnZhcyA9IFNWRygnY2FudmFzJyk7XG4gICAgICBjYW52YXMuc2l6ZSh3aWR0aCwgaGVpZ2h0LCB0cnVlKTtcblxuICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXMubmVzdGVkKCk7XG4gICAgfSk7XG4gIH1cblxuICBhZGRFbGVtZW50KGVsZW1lbnRfdHlwZTogc3RyaW5nLCBwcm9wZXJ0aWVzOiBhbnksIGlkPzogc3RyaW5nLCBjb2xvcnM/OiBhbnkpe1xuICAgIGlmICh0eXBlb2YgcHJvcGVydGllcyAhPT0gJ29iamVjdCcpe1xuICAgICAgcHJvcGVydGllcyA9IHt9XG4gICAgfVxuICAgIHZhciBvYmplY3Q7XG5cbiAgICBzd2l0Y2goZWxlbWVudF90eXBlKXtcbiAgICAgIGNhc2UgJ2NpcmNsZSc6XG4gICAgICAgIGxldCBfY2lyY2xlID0gbmV3IENpcmNsZShcbiAgICAgICAgICBwcm9wZXJ0aWVzWydjeCddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ2N5J10sXG4gICAgICAgICAgcHJvcGVydGllc1sncmFkaXVzJ10sXG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29sb3JzXG4gICAgICAgIClcbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKF9jaXJjbGUpO1xuICAgICAgICBvYmplY3QgPSBfY2lyY2xlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xpbmUnOlxuICAgICAgICBsZXQgX2xpbmUgPSBuZXcgTGluZShcbiAgICAgICAgICBwcm9wZXJ0aWVzWyd4MSddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ3kxJ10sXG4gICAgICAgICAgcHJvcGVydGllc1sneDInXSxcbiAgICAgICAgICBwcm9wZXJ0aWVzWyd5MiddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ3dpZHRoJ10sXG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29sb3JzXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKF9saW5lKTtcbiAgICAgICAgb2JqZWN0ID0gX2xpbmU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5sb2coZWxlbWVudFR5cGUpO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICBkcmF3RWxlbWVudHMoKXtcbiAgICBmb3IobGV0IGVsZW1lbnQgb2YgdGhpcy5lbGVtZW50cyl7XG4gICAgICBsZXQgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQgPSB0aGlzLnN2Z19lbGVtZW50c1tlbGVtZW50Ll9pZF07XG4gICAgICBsZXQgY2VudGVyMmQgPSBlbGVtZW50LmdldDJEQ2VudGVyKCk7XG4gICAgICBsZXQgcGF0aCA9IGVsZW1lbnQuZ2V0MkRQYXRoKCk7XG4gICAgICBsZXQgY29sb3JzID0gZWxlbWVudC5nZXRDb2xvcnMoKTtcblxuICAgICAgc3dpdGNoKGVsZW1lbnQuX3R5cGUpe1xuICAgICAgICBjYXNlIGVsZW1lbnRUeXBlLkNpcmNsZTpcbiAgICAgICAgICAvLyBDaGVjayBpZiBhbnkgZWxlbWVudCB3aXRoIHNhbWUgYF9pZGAgZXhpc3RzIGluIGNhbnZhc1xuICAgICAgICAgIC8vIHRoaXMuY2FudmFzLmhhcyhlbGVtZW50LnN2Z19vYmplY3QpXG4gICAgICAgICAgaWYoIGV4aXN0aW5nX3N2Z19lbGVtZW50ID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgbGV0IHN2Z19lbGVtZW50ID0gdGhpcy5jYW52YXMuY2lyY2xlKFxuICAgICAgICAgICAgICBlbGVtZW50LmdldFJhZGl1cygpICogMlxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICdjeCc6IGNlbnRlcjJkLngsXG4gICAgICAgICAgICAgICAgJ2N5JzogY2VudGVyMmQueSxcbiAgICAgICAgICAgICAgICAnZmlsbCc6IGNvbG9yc1snZmlsbF9jb2xvciddLFxuICAgICAgICAgICAgICAgICdzdHJva2UnOiBjb2xvcnNbJ3N0cm9rZV9jb2xvciddLFxuICAgICAgICAgICAgICAgICdzdHJva2Utd2lkdGgnOiBlbGVtZW50LmdldFdpZHRoKClcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLnN2Z19lbGVtZW50c1tlbGVtZW50Ll9pZF0gPSBzdmdfZWxlbWVudDtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIC8vIFJlZHJhdyBvciBtb3ZlXG4gICAgICAgICAgICBpZihcbiAgICAgICAgICAgICAgY2VudGVyMmQueCAhPSBleGlzdGluZ19zdmdfZWxlbWVudC5jeCgpIHx8XG4gICAgICAgICAgICAgIGNlbnRlcjJkLnkgIT0gZXhpc3Rpbmdfc3ZnX2VsZW1lbnQuY3koKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGV4aXN0aW5nX3N2Z19lbGVtZW50Lm1vdmUoY2VudGVyMmQueCwgY2VudGVyMmQueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGVsZW1lbnRUeXBlLkxpbmU6XG4gICAgICAgICAgaWYoIGV4aXN0aW5nX3N2Z19lbGVtZW50ID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgbGV0IHN2Z19lbGVtZW50ID0gdGhpcy5jYW52YXMubGluZShcbiAgICAgICAgICAgICAgcGF0aFswXS54LFxuICAgICAgICAgICAgICBwYXRoWzBdLnksXG4gICAgICAgICAgICAgIHBhdGhbMV0ueCxcbiAgICAgICAgICAgICAgcGF0aFsxXS55LFxuICAgICAgICAgICAgKS5hdHRyKHtcbiAgICAgICAgICAgICAgJ2ZpbGwnOmNvbG9yc1snZmlsbF9jb2xvciddLFxuICAgICAgICAgICAgICAnc3Ryb2tlJzogY29sb3JzWydzdHJva2VfY29sb3InXSxcbiAgICAgICAgICAgICAgJ3N0cm9rZS13aWR0aCc6IGVsZW1lbnQuZ2V0V2lkdGgoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnN2Z19lbGVtZW50c1tlbGVtZW50Ll9pZF0gPSBzdmdfZWxlbWVudDtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIC8vIFJlZHJhdyBvciBtb3ZlXG4gICAgICAgICAgICBpZihcbiAgICAgICAgICAgICAgcGF0aFswXS54ICE9IGV4aXN0aW5nX3N2Z19lbGVtZW50LngoKSB8fFxuICAgICAgICAgICAgICBwYXRoWzBdLnkgIT0gZXhpc3Rpbmdfc3ZnX2VsZW1lbnQueSgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQubW92ZShcbiAgICAgICAgICAgICAgICBwYXRoWzBdLngsXG4gICAgICAgICAgICAgICAgcGF0aFswXS55XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgcm9ja2V0IC0gY2hlY2sgaXQncyBzdGF0dXNcbiAgICAgICAgICAgIGZvcihsZXQgcm9ja2V0IG9mIHRoaXMucm9ja2V0cyl7XG4gICAgICAgICAgICAgIGlmKHJvY2tldC5faWQgPT0gZWxlbWVudC5faWQpe1xuICAgICAgICAgICAgICAgIGlmKHJvY2tldC5pc19hbGl2ZSl7XG5cbiAgICAgICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudChyb2NrZXQuX2lkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlRWxlbWVudChpZDogc3RyaW5nKXtcbiAgICB2YXIgZWw7XG5cbiAgICBmb3IobGV0IGVsZW1lbnQgb2YgdGhpcy5lbGVtZW50cyl7XG4gICAgICBpZihlbGVtZW50Ll9pZCA9PSBpZCl7XG4gICAgICAgIGVsID0gZWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoZWwgIT0gdW5kZWZpbmVkKXtcbiAgICAgIGxldCBlbGVtZW50X2luZGV4ID0gdGhpcy5lbGVtZW50cy5pbmRleE9mKGVsKTtcbiAgICAgIGlmKGVsZW1lbnRfaW5kZXggIT0gLTEpe1xuICAgICAgICB0aGlzLmVsZW1lbnRzLnNwbGljZShlbGVtZW50X2luZGV4LCAxKTtcbiAgICAgICAgbGV0IGV4aXN0aW5nX3N2Z19lbGVtZW50ID0gdGhpcy5zdmdfZWxlbWVudHNbZWwuX2lkXTtcbiAgICAgICAgaWYoZXhpc3Rpbmdfc3ZnX2VsZW1lbnQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgZGVsZXRlIHRoaXMuc3ZnX2VsZW1lbnRzW2VsLl9pZF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhY3Rpdml0eSgpe1xuICAgIHZhciBkZWFkX3JvY2tldHNfY291bnQgPSAwO1xuICAgIHZhciBsYW5kZWRfcm9ja2V0c19jb3VudCA9IDA7XG5cbiAgICBmb3IgKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKSB7XG4gICAgICBpZiAocm9ja2V0LmlzX2FsaXZlKSB7XG4gICAgICAgIGlmKHJvY2tldC5oYXNfbGFuZGVkKXtcbiAgICAgICAgICBsYW5kZWRfcm9ja2V0c19jb3VudCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGVsZW1lbnQgb2YgdGhpcy5lbGVtZW50cykge1xuICAgICAgICAgIGlmIChlbGVtZW50Ll9pZCA9PSByb2NrZXQuX2lkKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm1vdmUoXG4gICAgICAgICAgICAgIHJvY2tldC5nZXQyRFBhdGgoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJvY2tldC51cGRhdGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1lbHNle1xuICAgICAgICBkZWFkX3JvY2tldHNfY291bnQgKz0gMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVhZF9yb2NrZXRzX2NvdW50ICsgbGFuZGVkX3JvY2tldHNfY291bnQgPT0gdGhpcy5yb2NrZXRzLmxlbmd0aFxuICB9XG5cbiAgc3RhcnRBY3Rpdml0eShcbiAgICBpbnRlcnZhbDogbnVtYmVyLFxuICAgIHJvY2tldHNfY291bnQ6IG51bWJlcixcbiAgICBvcmlnaW46IGVsZW1lbnQsXG4gICAgZGVzdGluYXRpb246IGVsZW1lbnRcbiAgKXtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGludGVydmFsX2lkID0gc2V0SW50ZXJ2YWwoXG4gICAgICBmdW5jdGlvbigpe1xuICAgICAgICBpZihzZWxmLmFjdGl2aXR5KCkpe1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsX2lkKTtcblxuICAgICAgICAgIHNlbGYuc3RhcnRfcm9ja2V0cyhcbiAgICAgICAgICAgIHJvY2tldHNfY291bnQsXG4gICAgICAgICAgICBvcmlnaW4sXG4gICAgICAgICAgICBkZXN0aW5hdGlvblxuICAgICAgICAgICk7XG4gICAgICAgICAgc2VsZi5zdGFydEFjdGl2aXR5KFxuICAgICAgICAgICAgaW50ZXJ2YWwsXG4gICAgICAgICAgICByb2NrZXRzX2NvdW50LFxuICAgICAgICAgICAgb3JpZ2luLFxuICAgICAgICAgICAgZGVzdGluYXRpb25cbiAgICAgICAgICApO1xuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIGludGVydmFsXG4gICAgKTtcbiAgfVxuXG4gIHJlbmRlcihpbnRlcnZhbDogbnVtYmVyKXtcbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmRyYXdFbGVtZW50cygpLCBpbnRlcnZhbCk7XG4gIH1cblxuICBzdGFydF9yb2NrZXRzKFxuICAgIHJvY2tldHNfY291bnQ6IG51bWJlcixcbiAgICBvcmlnaW46IGVsZW1lbnQsXG4gICAgZGVzdGluYXRpb246IGVsZW1lbnRcbiAgKXtcbiAgICB2YXIgcm9ja2V0cyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9ja2V0c19jb3VudDsgaSsrKSB7XG4gICAgICBsZXQgcm9ja2V0X2hlaWdodCA9IHRoaXMubWluX3NpZGUgLyA0MDtcbiAgICAgIGxldCByb2NrZXQgPSBuZXcgUm9ja2V0KFxuICAgICAgICBvcmlnaW4sXG4gICAgICAgIGRlc3RpbmF0aW9uLFxuICAgICAgICByb2NrZXRfaGVpZ2h0LFxuICAgICAgKTtcbiAgICAgIHJvY2tldHMucHVzaChcbiAgICAgICAgcm9ja2V0XG4gICAgICApO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9ja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHJvY2tldCA9IHJvY2tldHNbaV07XG4gICAgICBsZXQgX2xpbmUgPSB0aGlzLmFkZEVsZW1lbnQoXG4gICAgICAgICdsaW5lJyxcbiAgICAgICAge1xuICAgICAgICAgICd4MSc6IHJvY2tldC54MSxcbiAgICAgICAgICAneTEnOiByb2NrZXQueTEsXG4gICAgICAgICAgJ3gyJzogcm9ja2V0LngyLFxuICAgICAgICAgICd5Mic6IHJvY2tldC55MixcbiAgICAgICAgICAnd2lkdGgnOiByb2NrZXQud2lkdGhcbiAgICAgICAgfSxcbiAgICAgICAgcm9ja2V0Ll9pZCxcbiAgICAgICAge1xuICAgICAgICAgIGZpbGxfY29sb3I6ICdyZ2JhKDAsIDAsIDAsIC45KScsXG4gICAgICAgICAgc3Ryb2tlX2NvbG9yOiAncmdiYSgyNTUsIDAsIDAsIDEpJyxcbiAgICAgICAgICBmb250X2NvbG9yOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAxKScsXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgICB0aGlzLnJvY2tldHMucHVzaChcbiAgICAgICAgcm9ja2V0XG4gICAgICApO1xuICAgIH1cbiAgfVxufVxuIiwiZXhwb3J0IGxldCBjb2xvcnMgPSB7XG4gIGZpbGxfY29sb3I6ICdyZ2JhKDE1NywxNjUsMTgwLCAuOSknLFxuICBzdHJva2VfY29sb3I6ICdyZ2JhKDEyNiwgMTMzLCAxNDYsIDEpJyxcbiAgZm9udF9jb2xvcjogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMSknLFxufVxuIl19

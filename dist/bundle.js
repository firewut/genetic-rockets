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
        'cy': height - min_side / 4,
        'radius': origin_radius
    });
    scene.origin = origin;
    scene.destination = destination;
    scene.render(50);
    scene.startActivity(50);
    scene.startRockets(50);
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
    function Rocket(origin, destination, height, routine) {
        var _this = this;
        var origin_point = origin.get2DCenter();
        var destination_point = destination.get2DCenter();
        _this = _super.call(this, origin_point.x, origin_point.y - height, origin_point.x, origin_point.y, height) || this;
        _this.selection_score = 0;
        _this.is_alive = true;
        _this.origin = origin;
        _this.destination = destination;
        _this.count = 0;
        if (routine === undefined) {
            _this.routine = new routines_1.Routine();
        }
        else {
            _this.routine = routine;
        }
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
    Rocket.prototype.calculateScore = function () {
        this.selection_score = 1 / this.distance_to_destination;
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
            this.calculateScore();
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
    function Routine(points) {
        this.points = [];
        if (points === undefined) {
            for (var i = 0; i < max_points; i++) {
                this.points[i] = new classes_1.Point2D(helpers_1.getRandomArbitrary(-2, 2), helpers_1.getRandomArbitrary(-2, 2));
            }
        }
        else {
            this.points = points;
        }
    }
    Routine.prototype.crossOver = function (routine) {
        var new_points = [];
        var rand_point = helpers_1.getRandomInt(0, routine.points.length);
        for (var i = 0; i < routine.points.length; i++) {
            if (i > rand_point) {
                new_points[i] = this.points[i];
            }
            else {
                new_points[i] = routine.points[i];
            }
        }
        return new Routine(new_points);
    };
    return Routine;
}());
exports.Routine = Routine;

},{"./classes":2,"./helpers":3}],8:[function(require,module,exports){
/// <reference path ="./typings/index.d.ts"/>
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("./helpers");
var classes_1 = require("./classes");
var circle_1 = require("./circle");
var line_1 = require("./line");
var rocket_1 = require("./rocket");
var Scene = /** @class */ (function () {
    function Scene(width, height, setUp) {
        var _this = this;
        this.rockets_count = 20;
        this.generation_info = [];
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
    Scene.prototype.updateGenerationInfo = function () {
        var rockets_count = this.rockets.length;
        var landed_rockets_count = 0;
        for (var _i = 0, _a = this.rockets; _i < _a.length; _i++) {
            var rocket = _a[_i];
            if (rocket.has_landed) {
                landed_rockets_count += 1;
            }
        }
        this.generation_info.push([
            landed_rockets_count
        ]);
        var text = '';
        for (var i = this.generation_info.length - 1; i >= 0; i--) {
            text += "Generation " + (i + 1) + ":         [" + this.generation_info[i] + " / " + rockets_count + "]       \n";
        }
        if (this.text_element === undefined) {
            this.text_element = this.canvas.text(text).move(0, 0).font({
                'family': 'Inconsolata',
                'size': this.min_side / 40
            });
        }
        else {
            this.text_element.text(text);
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
                                if (!rocket.is_alive) {
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
    Scene.prototype.startActivity = function (interval) {
        var self = this;
        var rockets_pool = self.calcRocketsScores();
        var routines = self.selectRocketsRoutines(rockets_pool);
        self.startRockets(null, routines);
        var interval_id = setInterval(function () {
            var activity_finished = self.activity();
            if (activity_finished) {
                window.clearInterval(interval_id);
                self.updateGenerationInfo();
                self.startActivity(interval);
            }
            ;
        }, interval);
    };
    Scene.prototype.calcRocketsScores = function () {
        var max_score = 0;
        for (var _i = 0, _a = this.rockets; _i < _a.length; _i++) {
            var rocket = _a[_i];
            if (rocket.selection_score > max_score) {
                max_score = rocket.selection_score;
            }
        }
        for (var _b = 0, _c = this.rockets; _b < _c.length; _b++) {
            var rocket = _c[_b];
            rocket.selection_score /= max_score; // Between 0 and 1
        }
        var rockets_pool = [];
        for (var _d = 0, _e = this.rockets; _d < _e.length; _d++) {
            var rocket = _e[_d];
            var n = rocket.selection_score * 100;
            for (var j = 0; j < n; j++) {
                rockets_pool.push(rocket);
            }
        }
        return rockets_pool;
    };
    Scene.prototype.selectRocketsRoutines = function (rockets_pool) {
        var routines = [];
        for (var _i = 0, _a = this.rockets; _i < _a.length; _i++) {
            var rocket = _a[_i];
            var routineA = helpers_1.pickRandomFromArray(rockets_pool).routine;
            var routineB = helpers_1.pickRandomFromArray(rockets_pool).routine;
            var childRoutine = routineA.crossOver(routineB);
            routines.push(childRoutine);
        }
        return routines;
    };
    Scene.prototype.render = function (interval) {
        var _this = this;
        setInterval(function () { return _this.drawElements(); }, interval);
    };
    Scene.prototype.startRocket = function (rocket) {
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
    };
    Scene.prototype.startRockets = function (rockets_count, routines) {
        for (var _i = 0, _a = this.rockets; _i < _a.length; _i++) {
            var rocket = _a[_i];
            this.removeElement(rocket._id);
        }
        this.rockets = [];
        var rocket_height = this.min_side / 100;
        var rockets = [];
        if (rockets_count > 0) {
            for (var i = 0; i < rockets_count; i++) {
                var rocket = new rocket_1.Rocket(this.origin, this.destination, rocket_height);
                rockets.push(rocket);
            }
        }
        else if (routines.length > 0) {
            for (var _b = 0, routines_1 = routines; _b < routines_1.length; _b++) {
                var routine = routines_1[_b];
                rockets.push(new rocket_1.Rocket(this.origin, this.destination, rocket_height, routine));
            }
        }
        for (var i = 0; i < rockets.length; i++) {
            this.startRocket(rockets[i]);
        }
    };
    return Scene;
}());
exports.Scene = Scene;

},{"./circle":1,"./classes":2,"./helpers":3,"./line":4,"./rocket":6}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = {
    fill_color: 'rgba(157,165,180, .9)',
    stroke_color: 'rgba(126, 133, 146, 1)',
    font_color: 'rgba(255, 255, 255, 1)',
};

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2lyY2xlLnRzIiwic3JjL2NsYXNzZXMudHMiLCJzcmMvaGVscGVycy50cyIsInNyYy9saW5lLnRzIiwic3JjL21haW4udHMiLCJzcmMvcm9ja2V0LnRzIiwic3JjL3JvdXRpbmVzLnRzIiwic3JjL3NjZW5lLnRzIiwic3JjL3N0eWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsWUFBWSxDQUFDOztBQUViLGlDQUFpQztBQUNqQyxxQ0FBbUM7QUFDbkMscUNBQWlEO0FBRWpELElBQUkscUJBQXFCLEdBQUcsRUFBRSxDQUFDO0FBRS9CO0lBU0UsZ0JBQVksRUFBVSxFQUFFLEVBQVUsRUFBRSxNQUFjLEVBQUUsRUFBVyxFQUFFLE9BQWE7UUFDNUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLElBQUksZ0JBQU0sRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxLQUFLLEdBQUcscUJBQVcsQ0FBQyxNQUFNLENBQUM7UUFDaEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxJQUFJLHFCQUFxQixDQUFDO1FBQzlDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLElBQUksY0FBTSxDQUFDO0lBQ2xDLENBQUM7SUFFRCwwQkFBUyxHQUFUO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDckIsQ0FBQztJQUVELHNCQUFLLEdBQUwsVUFBTSxFQUFVO1FBQ2QsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELDRCQUFXLEdBQVg7UUFDRSxNQUFNLENBQUMsSUFBSSxpQkFBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxxQkFBSSxHQUFKLFVBQUssTUFBaUI7UUFDcEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQseUJBQVEsR0FBUjtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3BCLENBQUM7SUFFRCwwQkFBUyxHQUFUO1FBQ0UsSUFBSSxJQUFJLEdBQWMsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxJQUFJLENBQ1AsSUFBSSxpQkFBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUM5QixDQUFDO1FBQ0YsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCwwQkFBUyxHQUFUO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDckIsQ0FBQztJQUNILGFBQUM7QUFBRCxDQW5EQSxBQW1EQyxJQUFBO0FBbkRZLHdCQUFNOzs7QUNSbkIsWUFBWSxDQUFDOztBQUViO0lBSUUsaUJBQVksQ0FBUyxFQUFFLENBQVM7UUFDOUIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNiLENBQUM7SUFDSCxjQUFDO0FBQUQsQ0FSQSxBQVFDLElBQUE7QUFSWSwwQkFBTztBQVVwQjtJQUtFLGlCQUFZLENBQVMsRUFBRSxDQUFTLEVBQUUsQ0FBUztRQUN6QyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDYixDQUFDO0lBQ0gsY0FBQztBQUFELENBVkEsQUFVQyxJQUFBO0FBVlksMEJBQU87QUFZcEIsSUFBWSxXQUdYO0FBSEQsV0FBWSxXQUFXO0lBQ3JCLGlEQUFNLENBQUE7SUFDTiw2Q0FBSSxDQUFBO0FBQ04sQ0FBQyxFQUhXLFdBQVcsR0FBWCxtQkFBVyxLQUFYLG1CQUFXLFFBR3RCOzs7OztBQzNCRDtJQUNFLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNkLElBQUksUUFBUSxHQUFHLGdFQUFnRSxDQUFDO0lBRWhGLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFDLENBQUM7UUFDMUIsSUFBSSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBVEQsd0JBU0M7QUFNRCw0QkFBbUMsR0FBVyxFQUFFLEdBQVc7SUFDdkQsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDN0MsQ0FBQztBQUZELGdEQUVDO0FBRUQsc0JBQTZCLEdBQVcsRUFBRSxHQUFXO0lBQ2pELE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDN0QsQ0FBQztBQUZELG9DQUVDO0FBRUQsNkJBQW9DLEtBQVk7SUFDOUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUN6RCxDQUFDO0FBRkQsa0RBRUM7OztBQ3pCRCxZQUFZLENBQUM7O0FBRWIsaUNBQWlDO0FBQ2pDLHFDQUFtQztBQUNuQyxxQ0FBaUQ7QUFFakQsSUFBSSxrQkFBa0IsR0FBRyxDQUFDLENBQUM7QUFFM0I7SUFVRSxjQUFZLEVBQVUsRUFBRSxFQUFVLEVBQUUsRUFBVSxFQUFFLEVBQVUsRUFBRSxLQUFhLEVBQUUsRUFBVSxFQUFFLE9BQWE7UUFDbEcsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLElBQUksZ0JBQU0sRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxLQUFLLEdBQUcscUJBQVcsQ0FBQyxJQUFJLENBQUM7UUFDOUIsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQ2IsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDYixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxrQkFBa0IsQ0FBQztRQUN6QyxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sSUFBSSxjQUFNLENBQUM7SUFDbEMsQ0FBQztJQUVELHdCQUFTLEdBQVQ7UUFDRSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBRUQsb0JBQUssR0FBTCxVQUFNLEVBQVU7UUFDZCxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBRUQsMEJBQVcsR0FBWDtRQUNFLE1BQU0sQ0FBQyxJQUFJLGlCQUFPLENBQ2hCLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUMsQ0FBQyxFQUNyQixDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFDLENBQUMsQ0FDdEIsQ0FBQztJQUNKLENBQUM7SUFFRCxtQkFBSSxHQUFKLFVBQUssTUFBaUI7UUFDcEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsSUFBSSxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLENBQUM7SUFFRCx1QkFBUSxHQUFSO1FBQ0UsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVELHdCQUFTLEdBQVQ7UUFDRSxJQUFJLElBQUksR0FBYyxFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLElBQUksQ0FDUCxJQUFJLGlCQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQzlCLENBQUM7UUFDRixJQUFJLENBQUMsSUFBSSxDQUNQLElBQUksaUJBQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FDOUIsQ0FBQTtRQUVELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsd0JBQVMsR0FBVDtRQUNFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUNkLFNBQUEsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDdEIsU0FBQSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQSxDQUN2QixDQUFDO0lBQ0osQ0FBQztJQUNILFdBQUM7QUFBRCxDQWpFQSxBQWlFQyxJQUFBO0FBakVZLG9CQUFJOzs7OztBQ1JqQixpQ0FBZ0M7QUFJaEMsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQztBQUM5QixJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO0FBQ2hDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXZDLGVBQWUsS0FBWTtJQUN6QixJQUFJLGtCQUFrQixHQUFHLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDdkMsSUFBSSxXQUFXLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FDaEMsUUFBUSxFQUNSO1FBQ0UsSUFBSSxFQUFFLEtBQUssR0FBRyxDQUFDO1FBQ2YsSUFBSSxFQUFFLFFBQVEsR0FBRyxFQUFFO1FBQ25CLFFBQVEsRUFBRSxrQkFBa0I7S0FDN0IsQ0FDRixDQUFDO0lBRUYsSUFBSSxnQkFBZ0IsR0FBRyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDL0MsSUFBSSxhQUFhLEdBQUcsUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUNsQyxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsVUFBVSxDQUMzQixRQUFRLEVBQ1I7UUFDRSxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQixJQUFJLEVBQUUsTUFBTSxHQUFHLFFBQVEsR0FBRyxDQUFDO1FBQzNCLFFBQVEsRUFBRSxhQUFhO0tBQ3hCLENBQ0YsQ0FBQztJQUVGLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3RCLEtBQUssQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBRWhDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDakIsS0FBSyxDQUFDLGFBQWEsQ0FDakIsRUFBRSxDQUNILENBQUM7SUFDRixLQUFLLENBQUMsWUFBWSxDQUNoQixFQUFFLENBQ0gsQ0FBQztBQUNKLENBQUM7QUFFRCxJQUFJLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FDbkIsS0FBSyxFQUNMLE1BQU0sRUFDTixLQUFLLENBQ04sQ0FBQTs7O0FDOUNELFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7O0FBSWIsK0JBQThCO0FBQzlCLHVDQUFxQztBQUVyQztJQUE0QiwwQkFBSTtJQWlCOUIsZ0JBQ0UsTUFBZSxFQUNmLFdBQW9CLEVBQ3BCLE1BQWMsRUFDZCxPQUFpQjtRQUpuQixpQkF5Q0M7UUFuQ0MsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3hDLElBQUksaUJBQWlCLEdBQUcsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRWxELFFBQUEsa0JBQ0UsWUFBWSxDQUFDLENBQUMsRUFDZCxZQUFZLENBQUMsQ0FBQyxHQUFHLE1BQU0sRUFDdkIsWUFBWSxDQUFDLENBQUMsRUFDZCxZQUFZLENBQUMsQ0FBQyxFQUNkLE1BQU0sQ0FDUCxTQUFDO1FBRUYsS0FBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFDekIsS0FBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDckIsS0FBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsS0FBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsS0FBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDZixFQUFFLENBQUEsQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztZQUN6QixLQUFJLENBQUMsT0FBTyxHQUFHLElBQUksa0JBQU8sRUFBRSxDQUFDO1FBQy9CLENBQUM7UUFBQSxJQUFJLENBQUEsQ0FBQztZQUNKLEtBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3pCLENBQUM7UUFFRCxLQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQzNCLFNBQUEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUN6QyxTQUFBLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUEsQ0FDMUMsR0FBRyxHQUFHLENBQUM7UUFFUixLQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FDdEMsU0FBQSxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ3pDLFNBQUEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQSxDQUMxQyxDQUFDO1FBRUYsT0FBTztRQUNQLEtBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDdEIsS0FBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7SUFDN0IsQ0FBQztJQUVELDJCQUFVLEdBQVYsVUFBVyxLQUFjO1FBQ3ZCLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELCtCQUFjLEdBQWQ7UUFDRSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUMsR0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUM7SUFDeEQsQ0FBQztJQUVELHVCQUFNLEdBQU47UUFBQSxpQkFtREM7UUFsREMsRUFBRSxDQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUEsQ0FBQztZQUNuQixFQUFFLENBQUEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBLENBQUM7Z0JBQzFDLElBQUksQ0FBQyxVQUFVLENBQ2IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUNoQyxDQUFDO2dCQUNGLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDO1lBQ2xCLENBQUM7WUFBQSxJQUFJLENBQUEsQ0FBQztnQkFDSixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQTtnQkFDckIsTUFBTSxDQUFBO1lBQ1IsQ0FBQztZQUVELElBQUksa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUN4RCxJQUFJLGtCQUFrQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUM7WUFFdEQsSUFBSSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUNuQyxTQUFBLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUE7Z0JBQ25DLFNBQUEsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQSxDQUNwQyxDQUFDO1lBQ0YsRUFBRSxDQUFBLENBQUMscUJBQXFCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztnQkFDeEQsSUFBSSxDQUFDLHVCQUF1QixHQUFHLHFCQUFxQixDQUFDO1lBQ3ZELENBQUM7WUFFRCxFQUFFLENBQUEsQ0FBQyxxQkFBcUIsSUFBSSxrQkFBa0IsQ0FBQyxDQUFBLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLENBQUM7WUFBQSxJQUFJLENBQUEsQ0FBQztnQkFDSixtREFBbUQ7Z0JBQ25ELElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQzlDLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBRTVDLElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FDOUIsU0FBQSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtvQkFDOUIsU0FBQSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQSxDQUMvQixDQUFDO2dCQUNGLElBQUksQ0FBQyxRQUFRLEdBQUcsZ0JBQWdCLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztnQkFFdEQsRUFBRSxDQUFBLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBLENBQUM7b0JBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQy9CLFVBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSyxPQUFBLENBQUMsR0FBRyxLQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUF4QixDQUF3QixDQUNuQyxDQUFDO29CQUVGLElBQUksQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM1QixJQUFJLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVCLElBQUksQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDNUIsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0IsQ0FBQztZQUNILENBQUM7WUFFRCxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDeEIsQ0FBQztJQUNILENBQUM7SUFDSCxhQUFDO0FBQUQsQ0F6SEEsQUF5SEMsQ0F6SDJCLFdBQUksR0F5SC9CO0FBekhZLHdCQUFNOzs7OztBQ1BuQixxQ0FBNkQ7QUFDN0QscUNBQW9DO0FBRXBDLElBQUksVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUVyQjtJQUdFLGlCQUFZLE1BQWtCO1FBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBRWpCLEVBQUUsQ0FBQSxDQUFDLE1BQU0sS0FBSyxTQUFTLENBQUMsQ0FBQSxDQUFDO1lBQ3ZCLEdBQUcsQ0FBQSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFDLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxpQkFBTyxDQUMxQiw0QkFBa0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDekIsNEJBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQzFCLENBQUE7WUFDSCxDQUFDO1FBQ0gsQ0FBQztRQUFBLElBQUksQ0FBQSxDQUFDO1lBQ0osSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDdkIsQ0FBQztJQUNILENBQUM7SUFFRCwyQkFBUyxHQUFULFVBQVUsT0FBZ0I7UUFDeEIsSUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBRXBCLElBQUksVUFBVSxHQUFHLHNCQUFZLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDdkQsR0FBRyxDQUFBLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzlDLEVBQUUsQ0FBQSxDQUFFLENBQUMsR0FBRyxVQUFXLENBQUMsQ0FBQSxDQUFDO2dCQUNuQixVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQyxDQUFDO1lBQUEsSUFBSSxDQUFBLENBQUM7Z0JBQ0osVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsQ0FBQztRQUNILENBQUM7UUFFRCxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUNILGNBQUM7QUFBRCxDQWhDQSxBQWdDQyxJQUFBO0FBaENZLDBCQUFPOzs7QUNMcEIsNkNBQTZDO0FBRTdDLFlBQVksQ0FBQzs7QUFDYixxQ0FBb0U7QUFDcEUscUNBQWlEO0FBQ2pELG1DQUFrQztBQUNsQywrQkFBOEI7QUFDOUIsbUNBQWtDO0FBR2xDO0lBZ0JFLGVBQVksS0FBYSxFQUFFLE1BQWMsRUFBRSxLQUF1QjtRQUFsRSxpQkFpQkM7UUFuQkQsa0JBQWEsR0FBVyxFQUFFLENBQUM7UUFHekIsSUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUN0QixLQUFLLEVBQ0wsTUFBTSxDQUNQLENBQUM7UUFFRixDQUFDLENBQUM7WUFDQSxJQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDM0IsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWpDLEtBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQzlCLEtBQUssQ0FBQyxLQUFJLENBQUMsQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELG9DQUFvQixHQUFwQjtRQUNFLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ3hDLElBQUksb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLEdBQUcsQ0FBQSxDQUFlLFVBQVksRUFBWixLQUFBLElBQUksQ0FBQyxPQUFPLEVBQVosY0FBWSxFQUFaLElBQVk7WUFBMUIsSUFBSSxNQUFNLFNBQUE7WUFDWixFQUFFLENBQUEsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUEsQ0FBQztnQkFDcEIsb0JBQW9CLElBQUksQ0FBQyxDQUFBO1lBQzNCLENBQUM7U0FDRjtRQUVELElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDO1lBQ3hCLG9CQUFvQjtTQUNyQixDQUFDLENBQUE7UUFFRixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZCxHQUFHLENBQUEsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBQyxDQUFDO1lBQ3RELElBQUksSUFBSSxpQkFBYyxDQUFDLEdBQUMsQ0FBQyxvQkFDcEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsV0FBTyxhQUFhLGVBQzdDLENBQUE7UUFDTCxDQUFDO1FBRUQsRUFBRSxDQUFBLENBQUMsSUFBSSxDQUFDLFlBQVksS0FBSyxTQUFTLENBQUMsQ0FBQSxDQUFDO1lBQ2xDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ2xDLElBQUksQ0FDTCxDQUFDLElBQUksQ0FDSixDQUFDLEVBQUUsQ0FBQyxDQUNMLENBQUMsSUFBSSxDQUFDO2dCQUNMLFFBQVEsRUFBRSxhQUFhO2dCQUN2QixNQUFNLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFO2FBQzNCLENBQUMsQ0FBQTtRQUNKLENBQUM7UUFBQSxJQUFJLENBQUEsQ0FBQztZQUNKLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9CLENBQUM7SUFDSCxDQUFDO0lBRUQsMEJBQVUsR0FBVixVQUFXLFlBQW9CLEVBQUUsVUFBZSxFQUFFLEVBQVcsRUFBRSxNQUFZO1FBQ3pFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sVUFBVSxLQUFLLFFBQVEsQ0FBQyxDQUFBLENBQUM7WUFDbEMsVUFBVSxHQUFHLEVBQUUsQ0FBQTtRQUNqQixDQUFDO1FBQ0QsSUFBSSxNQUFNLENBQUM7UUFFWCxNQUFNLENBQUEsQ0FBQyxZQUFZLENBQUMsQ0FBQSxDQUFDO1lBQ25CLEtBQUssUUFBUTtnQkFDWCxJQUFJLE9BQU8sR0FBRyxJQUFJLGVBQU0sQ0FDdEIsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUNoQixVQUFVLENBQUMsSUFBSSxDQUFDLEVBQ2hCLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFDcEIsRUFBRSxFQUNGLE1BQU0sQ0FDUCxDQUFBO2dCQUNELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM1QixNQUFNLEdBQUcsT0FBTyxDQUFDO2dCQUNqQixLQUFLLENBQUM7WUFDUixLQUFLLE1BQU07Z0JBQ1QsSUFBSSxLQUFLLEdBQUcsSUFBSSxXQUFJLENBQ2xCLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFDaEIsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUNoQixVQUFVLENBQUMsSUFBSSxDQUFDLEVBQ2hCLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFDaEIsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUNuQixFQUFFLEVBQ0YsTUFBTSxDQUNQLENBQUM7Z0JBRUYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQzFCLE1BQU0sR0FBRyxLQUFLLENBQUM7Z0JBQ2YsS0FBSyxDQUFDO1lBQ1I7Z0JBQ0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBVyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVELE1BQU0sQ0FBQyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUVELDRCQUFZLEdBQVo7UUFDRSxHQUFHLENBQUEsQ0FBZ0IsVUFBYSxFQUFiLEtBQUEsSUFBSSxDQUFDLFFBQVEsRUFBYixjQUFhLEVBQWIsSUFBYTtZQUE1QixJQUFJLE9BQU8sU0FBQTtZQUNiLElBQUksb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUQsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3JDLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUMvQixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUM7WUFFakMsTUFBTSxDQUFBLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFBLENBQUM7Z0JBQ3BCLEtBQUsscUJBQVcsQ0FBQyxNQUFNO29CQUNyQix3REFBd0Q7b0JBQ3hELHNDQUFzQztvQkFDdEMsRUFBRSxDQUFBLENBQUUsb0JBQW9CLEtBQUssU0FBUyxDQUFDLENBQUEsQ0FBQzt3QkFDdEMsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQ2xDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLENBQ3hCOzZCQUNBLElBQUksQ0FBQzs0QkFDRixJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7NEJBQ2hCLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQzs0QkFDaEIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxZQUFZLENBQUM7NEJBQzVCLFFBQVEsRUFBRSxNQUFNLENBQUMsY0FBYyxDQUFDOzRCQUNoQyxjQUFjLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRTt5QkFDckMsQ0FBQyxDQUFDO3dCQUVILElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFdBQVcsQ0FBQztvQkFDL0MsQ0FBQztvQkFBQSxJQUFJLENBQUEsQ0FBQzt3QkFDSixpQkFBaUI7d0JBQ2pCLEVBQUUsQ0FBQSxDQUNBLFFBQVEsQ0FBQyxDQUFDLElBQUksb0JBQW9CLENBQUMsRUFBRSxFQUFFOzRCQUN2QyxRQUFRLENBQUMsQ0FBQyxJQUFJLG9CQUFvQixDQUFDLEVBQUUsRUFDdkMsQ0FBQyxDQUFDLENBQUM7NEJBQ0Qsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNwRCxDQUFDO29CQUNILENBQUM7b0JBQ0QsS0FBSyxDQUFDO2dCQUNSLEtBQUsscUJBQVcsQ0FBQyxJQUFJO29CQUNuQixFQUFFLENBQUEsQ0FBRSxvQkFBb0IsS0FBSyxTQUFTLENBQUMsQ0FBQSxDQUFDO3dCQUN0QyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FDaEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDVCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNULElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ1QsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDVixDQUFDLElBQUksQ0FBQzs0QkFDTCxNQUFNLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQzs0QkFDNUIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxjQUFjLENBQUM7NEJBQ2hDLGNBQWMsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFO3lCQUNuQyxDQUFDLENBQUM7d0JBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsV0FBVyxDQUFDO29CQUMvQyxDQUFDO29CQUFBLElBQUksQ0FBQSxDQUFDO3dCQUNKLGlCQUFpQjt3QkFDakIsRUFBRSxDQUFBLENBQ0EsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxDQUFDLEVBQUU7NEJBQ3JDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksb0JBQW9CLENBQUMsQ0FBQyxFQUNyQyxDQUFDLENBQUMsQ0FBQzs0QkFDRCxvQkFBb0IsQ0FBQyxJQUFJLENBQ3ZCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ1QsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDVixDQUFDO3dCQUNKLENBQUM7d0JBQ0QsMENBQTBDO3dCQUMxQyxHQUFHLENBQUEsQ0FBZSxVQUFZLEVBQVosS0FBQSxJQUFJLENBQUMsT0FBTyxFQUFaLGNBQVksRUFBWixJQUFZOzRCQUExQixJQUFJLE1BQU0sU0FBQTs0QkFDWixFQUFFLENBQUEsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQSxDQUFDO2dDQUM1QixFQUFFLENBQUEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQSxDQUFDO29DQUNuQixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQ0FDakMsQ0FBQzs0QkFDSCxDQUFDO3lCQUNGO29CQUNILENBQUM7b0JBQ0QsS0FBSyxDQUFDO1lBQ1YsQ0FBQztTQUNGO0lBQ0gsQ0FBQztJQUVELDZCQUFhLEdBQWIsVUFBYyxFQUFVO1FBQ3RCLElBQUksRUFBRSxDQUFDO1FBRVAsR0FBRyxDQUFBLENBQWdCLFVBQWEsRUFBYixLQUFBLElBQUksQ0FBQyxRQUFRLEVBQWIsY0FBYSxFQUFiLElBQWE7WUFBNUIsSUFBSSxPQUFPLFNBQUE7WUFDYixFQUFFLENBQUEsQ0FBQyxPQUFPLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxDQUFBLENBQUM7Z0JBQ3BCLEVBQUUsR0FBRyxPQUFPLENBQUM7WUFDZixDQUFDO1NBQ0Y7UUFDRCxFQUFFLENBQUEsQ0FBQyxFQUFFLElBQUksU0FBUyxDQUFDLENBQUEsQ0FBQztZQUNsQixJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5QyxFQUFFLENBQUEsQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQSxDQUFDO2dCQUN0QixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksb0JBQW9CLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3JELEVBQUUsQ0FBQSxDQUFDLG9CQUFvQixJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUM5QixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNuQyxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBRUQsd0JBQVEsR0FBUjtRQUNFLElBQUksa0JBQWtCLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLElBQUksb0JBQW9CLEdBQUcsQ0FBQyxDQUFDO1FBRTdCLEdBQUcsQ0FBQyxDQUFlLFVBQVksRUFBWixLQUFBLElBQUksQ0FBQyxPQUFPLEVBQVosY0FBWSxFQUFaLElBQVk7WUFBMUIsSUFBSSxNQUFNLFNBQUE7WUFDYixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDcEIsRUFBRSxDQUFBLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFBLENBQUM7b0JBQ3BCLG9CQUFvQixJQUFJLENBQUMsQ0FBQztnQkFDNUIsQ0FBQztnQkFDRCxHQUFHLENBQUMsQ0FBZ0IsVUFBYSxFQUFiLEtBQUEsSUFBSSxDQUFDLFFBQVEsRUFBYixjQUFhLEVBQWIsSUFBYTtvQkFBNUIsSUFBSSxPQUFPLFNBQUE7b0JBQ2QsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDOUIsT0FBTyxDQUFDLElBQUksQ0FDVixNQUFNLENBQUMsU0FBUyxFQUFFLENBQ25CLENBQUM7d0JBQ0YsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUNsQixDQUFDO2lCQUNGO1lBQ0gsQ0FBQztZQUFBLElBQUksQ0FBQSxDQUFDO2dCQUNKLGtCQUFrQixJQUFJLENBQUMsQ0FBQztZQUMxQixDQUFDO1NBQ0Y7UUFFRCxNQUFNLENBQUMsa0JBQWtCLEdBQUcsb0JBQW9CLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUE7SUFDekUsQ0FBQztJQUVELDZCQUFhLEdBQWIsVUFDRSxRQUFnQjtRQUVoQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDNUMsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWxDLElBQUksV0FBVyxHQUFHLFdBQVcsQ0FDM0I7WUFDRSxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN4QyxFQUFFLENBQUEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBLENBQUM7Z0JBQ3BCLE1BQU0sQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBRWxDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUM1QixJQUFJLENBQUMsYUFBYSxDQUNoQixRQUFRLENBQ1QsQ0FBQztZQUNKLENBQUM7WUFBQSxDQUFDO1FBQ0osQ0FBQyxFQUNELFFBQVEsQ0FDVCxDQUFDO0lBQ0osQ0FBQztJQUVELGlDQUFpQixHQUFqQjtRQUNFLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztRQUNsQixHQUFHLENBQUEsQ0FBZSxVQUFZLEVBQVosS0FBQSxJQUFJLENBQUMsT0FBTyxFQUFaLGNBQVksRUFBWixJQUFZO1lBQTFCLElBQUksTUFBTSxTQUFBO1lBQ1osRUFBRSxDQUFBLENBQUMsTUFBTSxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUMsQ0FBQSxDQUFDO2dCQUNyQyxTQUFTLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQztZQUNyQyxDQUFDO1NBQ0Y7UUFFRCxHQUFHLENBQUEsQ0FBZSxVQUFZLEVBQVosS0FBQSxJQUFJLENBQUMsT0FBTyxFQUFaLGNBQVksRUFBWixJQUFZO1lBQTFCLElBQUksTUFBTSxTQUFBO1lBQ1osTUFBTSxDQUFDLGVBQWUsSUFBSSxTQUFTLENBQUMsQ0FBQyxrQkFBa0I7U0FDeEQ7UUFFRCxJQUFJLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDdEIsR0FBRyxDQUFBLENBQWUsVUFBWSxFQUFaLEtBQUEsSUFBSSxDQUFDLE9BQU8sRUFBWixjQUFZLEVBQVosSUFBWTtZQUExQixJQUFJLE1BQU0sU0FBQTtZQUNaLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQyxlQUFlLEdBQUcsR0FBRyxDQUFDO1lBQ3JDLEdBQUcsQ0FBQSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFDLENBQUM7Z0JBQ3pCLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDM0IsQ0FBQztTQUNGO1FBRUQsTUFBTSxDQUFDLFlBQVksQ0FBQztJQUN0QixDQUFDO0lBRUQscUNBQXFCLEdBQXJCLFVBQXNCLFlBQXNCO1FBQzFDLElBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUNsQixHQUFHLENBQUEsQ0FBZSxVQUFZLEVBQVosS0FBQSxJQUFJLENBQUMsT0FBTyxFQUFaLGNBQVksRUFBWixJQUFZO1lBQTFCLElBQUksTUFBTSxTQUFBO1lBQ1osSUFBSSxRQUFRLEdBQUcsNkJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFDO1lBQ3pELElBQUksUUFBUSxHQUFHLDZCQUFtQixDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQztZQUN6RCxJQUFJLFlBQVksR0FBRyxRQUFRLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRWhELFFBQVEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7U0FDNUI7UUFFRCxNQUFNLENBQUMsUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxzQkFBTSxHQUFOLFVBQU8sUUFBZ0I7UUFBdkIsaUJBRUM7UUFEQyxXQUFXLENBQUMsY0FBTSxPQUFBLEtBQUksQ0FBQyxZQUFZLEVBQUUsRUFBbkIsQ0FBbUIsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsMkJBQVcsR0FBWCxVQUFZLE1BQWM7UUFDeEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FDekIsTUFBTSxFQUNOO1lBQ0UsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ2YsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ2YsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ2YsSUFBSSxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ2YsT0FBTyxFQUFFLE1BQU0sQ0FBQyxLQUFLO1NBQ3RCLEVBQ0QsTUFBTSxDQUFDLEdBQUcsRUFDVjtZQUNFLFVBQVUsRUFBRSxtQkFBbUI7WUFDL0IsWUFBWSxFQUFFLHVCQUF1QjtZQUNyQyxVQUFVLEVBQUUsd0JBQXdCO1NBQ3JDLENBQ0YsQ0FBQztRQUNGLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUNmLE1BQU0sQ0FDUCxDQUFDO0lBQ0osQ0FBQztJQUVELDRCQUFZLEdBQVosVUFDRSxhQUFzQixFQUN0QixRQUFvQjtRQUVwQixHQUFHLENBQUEsQ0FBZSxVQUFZLEVBQVosS0FBQSxJQUFJLENBQUMsT0FBTyxFQUFaLGNBQVksRUFBWixJQUFZO1lBQTFCLElBQUksTUFBTSxTQUFBO1lBQ1osSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDaEM7UUFDRCxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUVsQixJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQztRQUV4QyxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDakIsRUFBRSxDQUFBLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFBLENBQUM7WUFDcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDdkMsSUFBSSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQ3JCLElBQUksQ0FBQyxNQUFNLEVBQ1gsSUFBSSxDQUFDLFdBQVcsRUFDaEIsYUFBYSxDQUNkLENBQUM7Z0JBQ0YsT0FBTyxDQUFDLElBQUksQ0FDVixNQUFNLENBQ1AsQ0FBQztZQUNKLENBQUM7UUFDSCxDQUFDO1FBQUEsSUFBSSxDQUFDLEVBQUUsQ0FBQSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUM1QixHQUFHLENBQUEsQ0FBZ0IsVUFBUSxFQUFSLHFCQUFRLEVBQVIsc0JBQVEsRUFBUixJQUFRO2dCQUF2QixJQUFJLE9BQU8saUJBQUE7Z0JBQ2IsT0FBTyxDQUFDLElBQUksQ0FDVixJQUFJLGVBQU0sQ0FDUixJQUFJLENBQUMsTUFBTSxFQUNYLElBQUksQ0FBQyxXQUFXLEVBQ2hCLGFBQWEsRUFDYixPQUFPLENBQ1IsQ0FDRixDQUFBO2FBQ0Y7UUFDSCxDQUFDO1FBRUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDeEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMvQixDQUFDO0lBQ0gsQ0FBQztJQUNILFlBQUM7QUFBRCxDQWhXQSxBQWdXQyxJQUFBO0FBaFdZLHNCQUFLOzs7OztBQ1ZQLFFBQUEsTUFBTSxHQUFHO0lBQ2xCLFVBQVUsRUFBRSx1QkFBdUI7SUFDbkMsWUFBWSxFQUFFLHdCQUF3QjtJQUN0QyxVQUFVLEVBQUUsd0JBQXdCO0NBQ3JDLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuL3N0eWxlJztcbmltcG9ydCB7IG1ha2VpZCB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBlbGVtZW50VHlwZSwgUG9pbnQyRCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5cbmxldCBkZWZhdWx0X2NpcmNsZV9yYWRpdXMgPSAxMDtcblxuZXhwb3J0IGNsYXNzIENpcmNsZSB7XG4gIF9pZDogc3RyaW5nO1xuICBfdHlwZTogZWxlbWVudFR5cGU7XG4gIGN4OiBudW1iZXI7XG4gIGN5OiBudW1iZXI7XG4gIHJhZGl1czogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xuICBjb2xvcnM6IGFueTtcblxuICBjb25zdHJ1Y3RvcihjeDogbnVtYmVyLCBjeTogbnVtYmVyLCByYWRpdXM6IG51bWJlciwgaWQ/OiBzdHJpbmcsIF9jb2xvcnM/OiBhbnkpe1xuICAgIHRoaXMuX2lkID0gaWQgfHwgbWFrZWlkKCk7XG4gICAgdGhpcy5fdHlwZSA9IGVsZW1lbnRUeXBlLkNpcmNsZTtcbiAgICB0aGlzLmN4ID0gY3g7XG4gICAgdGhpcy5jeSA9IGN5O1xuICAgIHRoaXMucmFkaXVzID0gcmFkaXVzIHx8IGRlZmF1bHRfY2lyY2xlX3JhZGl1cztcbiAgICB0aGlzLndpZHRoID0gdGhpcy5yYWRpdXMgLyA4O1xuICAgIHRoaXMuY29sb3JzID0gX2NvbG9ycyB8fCBjb2xvcnM7XG4gIH1cblxuICBnZXRDb2xvcnMoKXtcbiAgICByZXR1cm4gdGhpcy5jb2xvcnM7XG4gIH1cblxuICBzZXRJZChpZDogc3RyaW5nKXtcbiAgICB0aGlzLl9pZCA9IGlkO1xuICB9XG5cbiAgZ2V0MkRDZW50ZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBQb2ludDJEKHRoaXMuY3gsIHRoaXMuY3kpO1xuICB9XG5cbiAgbW92ZShwb2ludHM6IFBvaW50MkRbXSl7XG4gICAgdGhpcy5jeCA9IHBvaW50c1swXS54O1xuICAgIHRoaXMuY3kgPSBwb2ludHNbMF0ueTtcbiAgfVxuXG4gIGdldFdpZHRoKCl7XG4gICAgcmV0dXJuIHRoaXMud2lkdGg7XG4gIH1cblxuICBnZXQyRFBhdGgoKXtcbiAgICB2YXIgcGF0aDogUG9pbnQyRFtdID0gW107XG4gICAgcGF0aC5wdXNoKFxuICAgICAgbmV3IFBvaW50MkQodGhpcy5jeCwgdGhpcy5jeSlcbiAgICApO1xuICAgIHJldHVybiBwYXRoO1xuICB9XG5cbiAgZ2V0UmFkaXVzKCl7XG4gICAgcmV0dXJuIHRoaXMucmFkaXVzO1xuICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydCBjbGFzcyBQb2ludDJEIHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIpe1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUG9pbnQzRCB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xuICB6OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcil7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMueiA9IHo7XG4gIH1cbn1cblxuZXhwb3J0IGVudW0gZWxlbWVudFR5cGUge1xuICBDaXJjbGUsXG4gIExpbmVcbn1cblxuZXhwb3J0IGludGVyZmFjZSBlbGVtZW50IHtcbiAgX2lkOiBzdHJpbmc7XG4gIF90eXBlOiBlbGVtZW50VHlwZTtcbiAgc2V0SWQ/OiAoXzpzdHJpbmcpID0+IGFueTtcblxuICBnZXRSYWRpdXM/OiAoKSA9PiBudW1iZXI7XG4gIGdldDJEUGF0aD86ICgpID0+IFBvaW50MkRbXTtcbiAgZ2V0MkRDZW50ZXI/OiAoKSA9PiBQb2ludDJEO1xuICBnZXRXaWR0aD86ICgpID0+IG51bWJlcjtcbiAgZ2V0Q29sb3JzOiAoKSA9PiBhbnk7XG5cbiAgbW92ZT86IChfOlBvaW50MkRbXSkgPT4gYW55O1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIG1ha2VpZCgpIHtcbiAgdmFyIHRleHQgPSBcIlwiO1xuICB2YXIgcG9zc2libGUgPSBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5XCI7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCA1OyBpKyspe1xuICAgIHRleHQgKz0gcG9zc2libGUuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHBvc3NpYmxlLmxlbmd0aCkpO1xuICB9XG5cbiAgcmV0dXJuIHRleHQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGljdGlvbmFyeTxUPiB7XG4gICAgW0s6IHN0cmluZ106IFQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSYW5kb21BcmJpdHJhcnkobWluOiBudW1iZXIsIG1heDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhbmRvbUludChtaW46IG51bWJlciwgbWF4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBpY2tSYW5kb21Gcm9tQXJyYXkoYXJyYXk6IGFueVtdKSB7XG4gIHJldHVybiBhcnJheVtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBhcnJheS5sZW5ndGgpXTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgY29sb3JzIH0gZnJvbSAnLi9zdHlsZSc7XG5pbXBvcnQgeyBtYWtlaWQgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgZWxlbWVudFR5cGUsIFBvaW50MkQgfSBmcm9tICcuL2NsYXNzZXMnO1xuXG5sZXQgZGVmYXVsdF9saW5lX3dpZHRoID0gMTtcblxuZXhwb3J0IGNsYXNzIExpbmUge1xuICBfaWQ6IHN0cmluZztcbiAgX3R5cGU6IGVsZW1lbnRUeXBlO1xuICB4MTogbnVtYmVyO1xuICB5MTogbnVtYmVyO1xuICB4MjogbnVtYmVyO1xuICB5MjogbnVtYmVyO1xuICB3aWR0aDogbnVtYmVyO1xuICBjb2xvcnM6IGFueTtcblxuICBjb25zdHJ1Y3Rvcih4MTogbnVtYmVyLCB5MTogbnVtYmVyLCB4MjogbnVtYmVyLCB5MjogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBpZD86c3RyaW5nLCBfY29sb3JzPzogYW55KXtcbiAgICB0aGlzLl9pZCA9IGlkIHx8IG1ha2VpZCgpO1xuICAgIHRoaXMuX3R5cGUgPSBlbGVtZW50VHlwZS5MaW5lO1xuICAgIHRoaXMueDEgPSB4MTtcbiAgICB0aGlzLnkxID0geTE7XG4gICAgdGhpcy54MiA9IHgyO1xuICAgIHRoaXMueTIgPSB5MjtcbiAgICB0aGlzLndpZHRoID0gd2lkdGggfHwgZGVmYXVsdF9saW5lX3dpZHRoO1xuICAgIHRoaXMuY29sb3JzID0gX2NvbG9ycyB8fCBjb2xvcnM7XG4gIH1cblxuICBnZXRDb2xvcnMoKXtcbiAgICByZXR1cm4gdGhpcy5jb2xvcnM7XG4gIH1cblxuICBzZXRJZChpZDogc3RyaW5nKXtcbiAgICB0aGlzLl9pZCA9IGlkO1xuICB9XG5cbiAgZ2V0MkRDZW50ZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBQb2ludDJEKFxuICAgICAgKHRoaXMueDIgKyB0aGlzLngxKS8yLFxuICAgICAgKHRoaXMueTIgKyB0aGlzLnkxKS8yXG4gICAgKTtcbiAgfVxuXG4gIG1vdmUocG9pbnRzOiBQb2ludDJEW10pe1xuICAgIHRoaXMueDEgPSBwb2ludHNbMF0ueDtcbiAgICB0aGlzLnkxID0gcG9pbnRzWzBdLnk7XG4gICAgdGhpcy54MiA9IHBvaW50c1sxXS54O1xuICAgIHRoaXMueTIgPSBwb2ludHNbMV0ueTtcbiAgfVxuXG4gIGdldFdpZHRoKCl7XG4gICAgcmV0dXJuIHRoaXMud2lkdGg7XG4gIH1cblxuICBnZXQyRFBhdGgoKXtcbiAgICB2YXIgcGF0aDogUG9pbnQyRFtdID0gW107XG4gICAgcGF0aC5wdXNoKFxuICAgICAgbmV3IFBvaW50MkQodGhpcy54MSwgdGhpcy55MSlcbiAgICApO1xuICAgIHBhdGgucHVzaChcbiAgICAgIG5ldyBQb2ludDJEKHRoaXMueDIsIHRoaXMueTIpXG4gICAgKVxuXG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBnZXRSYWRpdXMoKXtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KFxuICAgICAgKHRoaXMueTEgLSB0aGlzLnkyKSoqMiArXG4gICAgICAodGhpcy54MiAtIHRoaXMueDIpKioyXG4gICAgKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgU2NlbmUgfSBmcm9tICcuL3NjZW5lJztcbmltcG9ydCB7IFJvY2tldCB9IGZyb20gJy4vcm9ja2V0JztcbmltcG9ydCB7IFBvaW50MkQgfSBmcm9tICcuL2NsYXNzZXMnO1xuXG5sZXQgd2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbmxldCBoZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5sZXQgbWluX3NpZGUgPSBNYXRoLm1pbih3aWR0aCwgaGVpZ2h0KTtcblxuZnVuY3Rpb24gc2V0VXAoc2NlbmU6IFNjZW5lKXtcbiAgbGV0IGRlc3RpbmF0aW9uX3JhZGl1cyA9IG1pbl9zaWRlIC8gMjU7XG4gIGxldCBkZXN0aW5hdGlvbiA9IHNjZW5lLmFkZEVsZW1lbnQoXG4gICAgJ2NpcmNsZScsXG4gICAge1xuICAgICAgJ2N4Jzogd2lkdGggLyAyLFxuICAgICAgJ2N5JzogbWluX3NpZGUgLyAxMCxcbiAgICAgICdyYWRpdXMnOiBkZXN0aW5hdGlvbl9yYWRpdXNcbiAgICB9XG4gICk7XG5cbiAgbGV0IGRlc3RpbmF0aW9uX3BhdGggPSBkZXN0aW5hdGlvbi5nZXQyRFBhdGgoKTtcbiAgbGV0IG9yaWdpbl9yYWRpdXMgPSBtaW5fc2lkZSAvIDMwO1xuICBsZXQgb3JpZ2luID0gc2NlbmUuYWRkRWxlbWVudChcbiAgICAnY2lyY2xlJyxcbiAgICB7XG4gICAgICAnY3gnOiBkZXN0aW5hdGlvbl9wYXRoWzBdLngsXG4gICAgICAnY3knOiBoZWlnaHQgLSBtaW5fc2lkZSAvIDQsXG4gICAgICAncmFkaXVzJzogb3JpZ2luX3JhZGl1c1xuICAgIH1cbiAgKTtcblxuICBzY2VuZS5vcmlnaW4gPSBvcmlnaW47XG4gIHNjZW5lLmRlc3RpbmF0aW9uID0gZGVzdGluYXRpb247XG5cbiAgc2NlbmUucmVuZGVyKDUwKTtcbiAgc2NlbmUuc3RhcnRBY3Rpdml0eShcbiAgICA1MFxuICApO1xuICBzY2VuZS5zdGFydFJvY2tldHMoXG4gICAgNTBcbiAgKTtcbn1cblxubGV0IHNjZW5lID0gbmV3IFNjZW5lKFxuICB3aWR0aCxcbiAgaGVpZ2h0LFxuICBzZXRVcFxuKVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBnZXRSYW5kb21JbnQsIGdldFJhbmRvbUFyYml0cmFyeSwgcGlja1JhbmRvbUZyb21BcnJheSB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBQb2ludDJELCBlbGVtZW50IH0gZnJvbSAnLi9jbGFzc2VzJztcbmltcG9ydCB7IExpbmUgfSBmcm9tICcuL2xpbmUnO1xuaW1wb3J0IHsgUm91dGluZSB9IGZyb20gJy4vcm91dGluZXMnO1xuXG5leHBvcnQgY2xhc3MgUm9ja2V0IGV4dGVuZHMgTGluZSB7XG4gIHZlbG9jaXR5OiBudW1iZXJbXTtcbiAgYWNjZWxlcmF0aW9uOiBudW1iZXJbXTtcbiAgcm91dGluZTogUm91dGluZTtcbiAgY291bnQ6IG51bWJlcjtcblxuICBoYXNfbGFuZGVkOiB0cnVlO1xuICBpc19hbGl2ZTogYm9vbGVhbjtcbiAgYWxpdmVfcmFkaXVzOiBudW1iZXI7XG5cbiAgb3JpZ2luOiBlbGVtZW50O1xuICBkZXN0aW5hdGlvbjogZWxlbWVudDtcblxuICBkaXN0YW5jZV90b19kZXN0aW5hdGlvbjogbnVtYmVyO1xuICAvLyBTY29yZSB0byBzdXJ2aXZlIGluIG5hdHVyYWwgc2VsZWN0aW9uXG4gIHNlbGVjdGlvbl9zY29yZTogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG9yaWdpbjogZWxlbWVudCxcbiAgICBkZXN0aW5hdGlvbjogZWxlbWVudCxcbiAgICBoZWlnaHQ6IG51bWJlcixcbiAgICByb3V0aW5lPzogUm91dGluZVxuICApe1xuICAgIGxldCBvcmlnaW5fcG9pbnQgPSBvcmlnaW4uZ2V0MkRDZW50ZXIoKTtcbiAgICBsZXQgZGVzdGluYXRpb25fcG9pbnQgPSBkZXN0aW5hdGlvbi5nZXQyRENlbnRlcigpO1xuXG4gICAgc3VwZXIoXG4gICAgICBvcmlnaW5fcG9pbnQueCxcbiAgICAgIG9yaWdpbl9wb2ludC55IC0gaGVpZ2h0LFxuICAgICAgb3JpZ2luX3BvaW50LngsXG4gICAgICBvcmlnaW5fcG9pbnQueSxcbiAgICAgIGhlaWdodFxuICAgICk7XG5cbiAgICB0aGlzLnNlbGVjdGlvbl9zY29yZSA9IDA7XG4gICAgdGhpcy5pc19hbGl2ZSA9IHRydWU7XG4gICAgdGhpcy5vcmlnaW4gPSBvcmlnaW47XG4gICAgdGhpcy5kZXN0aW5hdGlvbiA9IGRlc3RpbmF0aW9uO1xuICAgIHRoaXMuY291bnQgPSAwO1xuICAgIGlmKHJvdXRpbmUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5yb3V0aW5lID0gbmV3IFJvdXRpbmUoKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMucm91dGluZSA9IHJvdXRpbmU7XG4gICAgfVxuXG4gICAgdGhpcy5hbGl2ZV9yYWRpdXMgPSBNYXRoLnNxcnQoXG4gICAgICAob3JpZ2luX3BvaW50LnkgLSBkZXN0aW5hdGlvbl9wb2ludC55KSoqMiArXG4gICAgICAob3JpZ2luX3BvaW50LnggLSBkZXN0aW5hdGlvbl9wb2ludC54KSoqMlxuICAgICkgKiAxLjU7XG5cbiAgICB0aGlzLmRpc3RhbmNlX3RvX2Rlc3RpbmF0aW9uID0gTWF0aC5zcXJ0KFxuICAgICAgKG9yaWdpbl9wb2ludC55IC0gZGVzdGluYXRpb25fcG9pbnQueSkqKjIgK1xuICAgICAgKG9yaWdpbl9wb2ludC54IC0gZGVzdGluYXRpb25fcG9pbnQueCkqKjJcbiAgICApO1xuXG4gICAgLy8gWCwgWVxuICAgIHRoaXMudmVsb2NpdHkgPSBbMCwgMF1cbiAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IFswLCAwXTtcbiAgfVxuXG4gIGFwcGx5Rm9yY2UoZm9yY2U6IFBvaW50MkQpe1xuICAgIHRoaXMuYWNjZWxlcmF0aW9uWzBdICs9IGZvcmNlLng7XG4gICAgdGhpcy5hY2NlbGVyYXRpb25bMV0gKz0gZm9yY2UueTtcbiAgfVxuXG4gIGNhbGN1bGF0ZVNjb3JlKCl7XG4gICAgdGhpcy5zZWxlY3Rpb25fc2NvcmUgPSAxL3RoaXMuZGlzdGFuY2VfdG9fZGVzdGluYXRpb247XG4gIH1cblxuICB1cGRhdGUoKXtcbiAgICBpZighdGhpcy5oYXNfbGFuZGVkKXtcbiAgICAgIGlmKHRoaXMucm91dGluZS5wb2ludHMubGVuZ3RoID4gdGhpcy5jb3VudCl7XG4gICAgICAgIHRoaXMuYXBwbHlGb3JjZShcbiAgICAgICAgICB0aGlzLnJvdXRpbmUucG9pbnRzW3RoaXMuY291bnRdXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmlzX2FsaXZlID0gZmFsc2VcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGxldCBkZXN0aW5hdGlvbl9jZW50ZXIgPSB0aGlzLmRlc3RpbmF0aW9uLmdldDJEQ2VudGVyKCk7XG4gICAgICBsZXQgZGVzdGluYXRpb25fcmFkaXVzID0gdGhpcy5kZXN0aW5hdGlvbi5nZXRSYWRpdXMoKTtcblxuICAgICAgbGV0IGF3YXlfZnJvbV9kZXN0aW5hdGlvbiA9IE1hdGguc3FydChcbiAgICAgICAgKHRoaXMueTEgLSBkZXN0aW5hdGlvbl9jZW50ZXIueSkqKjIgK1xuICAgICAgICAodGhpcy54MSAtIGRlc3RpbmF0aW9uX2NlbnRlci54KSoqMlxuICAgICAgKTtcbiAgICAgIGlmKGF3YXlfZnJvbV9kZXN0aW5hdGlvbiA8IHRoaXMuZGlzdGFuY2VfdG9fZGVzdGluYXRpb24pIHtcbiAgICAgICAgdGhpcy5kaXN0YW5jZV90b19kZXN0aW5hdGlvbiA9IGF3YXlfZnJvbV9kZXN0aW5hdGlvbjtcbiAgICAgIH1cblxuICAgICAgaWYoYXdheV9mcm9tX2Rlc3RpbmF0aW9uIDw9IGRlc3RpbmF0aW9uX3JhZGl1cyl7XG4gICAgICAgIHRoaXMuaGFzX2xhbmRlZCA9IHRydWU7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgLy8gQ2hlY2sgaWYgd2UgYXJlIGZ1cnRoZXIgdGhhbiBgdGhpcy5hbGl2ZV9yYWRpdXNgXG4gICAgICAgIGxldCBvcmlnaW5fY2VudGVyID0gdGhpcy5vcmlnaW4uZ2V0MkRDZW50ZXIoKTtcbiAgICAgICAgbGV0IG9yaWdpbl9yYWRpdXMgPSB0aGlzLm9yaWdpbi5nZXRSYWRpdXMoKTtcblxuICAgICAgICBsZXQgYXdheV9mcm9tX29yaWdpbiA9IE1hdGguc3FydChcbiAgICAgICAgICAodGhpcy55MSAtIG9yaWdpbl9jZW50ZXIueSkqKjIgK1xuICAgICAgICAgICh0aGlzLngxIC0gb3JpZ2luX2NlbnRlci54KSoqMlxuICAgICAgICApO1xuICAgICAgICB0aGlzLmlzX2FsaXZlID0gYXdheV9mcm9tX29yaWdpbiA8PSB0aGlzLmFsaXZlX3JhZGl1cztcblxuICAgICAgICBpZih0aGlzLmlzX2FsaXZlKXtcbiAgICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eS5tYXAoXG4gICAgICAgICAgICAoYSwgaSkgPT4gYSArIHRoaXMuYWNjZWxlcmF0aW9uW2ldXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHRoaXMueDEgKz0gdGhpcy52ZWxvY2l0eVswXTtcbiAgICAgICAgICB0aGlzLnkxICs9IHRoaXMudmVsb2NpdHlbMV07XG4gICAgICAgICAgdGhpcy54MiArPSB0aGlzLnZlbG9jaXR5WzBdO1xuICAgICAgICAgIHRoaXMueTIgKz0gdGhpcy52ZWxvY2l0eVsxXTtcbiAgICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IFswLCAwXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmNhbGN1bGF0ZVNjb3JlKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBnZXRSYW5kb21JbnQsIGdldFJhbmRvbUFyYml0cmFyeSB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBQb2ludDJEIH0gZnJvbSAnLi9jbGFzc2VzJztcblxubGV0IG1heF9wb2ludHMgPSAzMDA7XG5cbmV4cG9ydCBjbGFzcyBSb3V0aW5lIHtcbiAgcG9pbnRzOiBQb2ludDJEW107XG5cbiAgY29uc3RydWN0b3IocG9pbnRzPzogUG9pbnQyRFtdKXtcbiAgICB0aGlzLnBvaW50cyA9IFtdO1xuXG4gICAgaWYocG9pbnRzID09PSB1bmRlZmluZWQpe1xuICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG1heF9wb2ludHM7IGkrKyl7XG4gICAgICAgIHRoaXMucG9pbnRzW2ldID0gbmV3IFBvaW50MkQoXG4gICAgICAgICAgZ2V0UmFuZG9tQXJiaXRyYXJ5KC0yLCAyKSxcbiAgICAgICAgICBnZXRSYW5kb21BcmJpdHJhcnkoLTIsIDIpLFxuICAgICAgICApXG4gICAgICB9XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLnBvaW50cyA9IHBvaW50cztcbiAgICB9XG4gIH1cblxuICBjcm9zc092ZXIocm91dGluZTogUm91dGluZSl7XG4gICAgdmFyIG5ld19wb2ludHMgPSBbXTtcblxuICAgIGxldCByYW5kX3BvaW50ID0gZ2V0UmFuZG9tSW50KDAsIHJvdXRpbmUucG9pbnRzLmxlbmd0aClcbiAgICBmb3IobGV0IGkgPSAwOyBpIDwgcm91dGluZS5wb2ludHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmKCBpID4gcmFuZF9wb2ludCApe1xuICAgICAgICBuZXdfcG9pbnRzW2ldID0gdGhpcy5wb2ludHNbaV07XG4gICAgICB9ZWxzZXtcbiAgICAgICAgbmV3X3BvaW50c1tpXSA9IHJvdXRpbmUucG9pbnRzW2ldO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgUm91dGluZShuZXdfcG9pbnRzKTtcbiAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aCA9XCIuL3R5cGluZ3MvaW5kZXguZC50c1wiLz5cblxuJ3VzZSBzdHJpY3QnO1xuaW1wb3J0IHsgRGljdGlvbmFyeSwgbWFrZWlkLCBwaWNrUmFuZG9tRnJvbUFycmF5IH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IGVsZW1lbnQsIGVsZW1lbnRUeXBlIH0gZnJvbSAnLi9jbGFzc2VzJztcbmltcG9ydCB7IENpcmNsZSB9IGZyb20gJy4vY2lyY2xlJztcbmltcG9ydCB7IExpbmUgfSBmcm9tICcuL2xpbmUnO1xuaW1wb3J0IHsgUm9ja2V0IH0gZnJvbSAnLi9yb2NrZXQnO1xuaW1wb3J0IHsgUm91dGluZSB9IGZyb20gJy4vcm91dGluZXMnO1xuXG5leHBvcnQgY2xhc3MgU2NlbmUge1xuICBjYW52YXM6IHN2Z2pzLkVsZW1lbnQ7XG4gIGVsZW1lbnRzOiBlbGVtZW50W107XG4gIHN2Z19lbGVtZW50czogRGljdGlvbmFyeTxzdmdqcy5FbGVtZW50PjtcbiAgcm9ja2V0czogUm9ja2V0W107XG5cbiAgLy8gR2VuZXJhdGlvbiBJbmZvcm1hdGlvblxuICBvcmlnaW46IGVsZW1lbnQ7XG4gIGRlc3RpbmF0aW9uOiBlbGVtZW50O1xuICB0ZXh0X2VsZW1lbnQ6IHN2Z2pzLkVsZW1lbnQ7XG4gIGdlbmVyYXRpb25faW5mbzogYW55W107XG5cbiAgLy8gVUkgU2V0dGluZ3NcbiAgbWluX3NpZGU6IG51bWJlcjtcbiAgcm9ja2V0c19jb3VudDogbnVtYmVyID0gMjA7XG5cbiAgY29uc3RydWN0b3Iod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIHNldFVwOiAoXzpTY2VuZSkgPT4gYW55KSB7XG4gICAgdGhpcy5nZW5lcmF0aW9uX2luZm8gPSBbXTtcbiAgICB0aGlzLmVsZW1lbnRzID0gW107XG4gICAgdGhpcy5yb2NrZXRzID0gW107XG4gICAgdGhpcy5zdmdfZWxlbWVudHMgPSB7fTtcbiAgICB0aGlzLm1pbl9zaWRlID0gTWF0aC5taW4oXG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodFxuICAgICk7XG5cbiAgICAkKCgpID0+IHtcbiAgICAgIGxldCBjYW52YXMgPSBTVkcoJ2NhbnZhcycpO1xuICAgICAgY2FudmFzLnNpemUod2lkdGgsIGhlaWdodCwgdHJ1ZSk7XG5cbiAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzLm5lc3RlZCgpO1xuICAgICAgc2V0VXAodGhpcyk7XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVHZW5lcmF0aW9uSW5mbygpe1xuICAgIGxldCByb2NrZXRzX2NvdW50ID0gdGhpcy5yb2NrZXRzLmxlbmd0aDtcbiAgICB2YXIgbGFuZGVkX3JvY2tldHNfY291bnQgPSAwO1xuICAgIGZvcihsZXQgcm9ja2V0IG9mIHRoaXMucm9ja2V0cyl7XG4gICAgICBpZihyb2NrZXQuaGFzX2xhbmRlZCl7XG4gICAgICAgIGxhbmRlZF9yb2NrZXRzX2NvdW50ICs9IDFcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmdlbmVyYXRpb25faW5mby5wdXNoKFtcbiAgICAgIGxhbmRlZF9yb2NrZXRzX2NvdW50XG4gICAgXSlcblxuICAgIHZhciB0ZXh0ID0gJyc7XG4gICAgZm9yKHZhciBpID0gdGhpcy5nZW5lcmF0aW9uX2luZm8ubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKXtcbiAgICAgIHRleHQgKz0gYEdlbmVyYXRpb24gJHtpKzF9OiBcXFxuICAgICAgICBbJHt0aGlzLmdlbmVyYXRpb25faW5mb1tpXX0gXFwvICR7cm9ja2V0c19jb3VudH1dIFxcXG4gICAgICBcXG5gXG4gICAgfVxuXG4gICAgaWYodGhpcy50ZXh0X2VsZW1lbnQgPT09IHVuZGVmaW5lZCl7XG4gICAgICB0aGlzLnRleHRfZWxlbWVudCA9IHRoaXMuY2FudmFzLnRleHQoXG4gICAgICAgIHRleHRcbiAgICAgICkubW92ZShcbiAgICAgICAgMCwgMFxuICAgICAgKS5mb250KHtcbiAgICAgICAgJ2ZhbWlseSc6ICdJbmNvbnNvbGF0YScsXG4gICAgICAgICdzaXplJzogdGhpcy5taW5fc2lkZSAvIDQwXG4gICAgICB9KVxuICAgIH1lbHNle1xuICAgICAgdGhpcy50ZXh0X2VsZW1lbnQudGV4dCh0ZXh0KTtcbiAgICB9XG4gIH1cblxuICBhZGRFbGVtZW50KGVsZW1lbnRfdHlwZTogc3RyaW5nLCBwcm9wZXJ0aWVzOiBhbnksIGlkPzogc3RyaW5nLCBjb2xvcnM/OiBhbnkpe1xuICAgIGlmICh0eXBlb2YgcHJvcGVydGllcyAhPT0gJ29iamVjdCcpe1xuICAgICAgcHJvcGVydGllcyA9IHt9XG4gICAgfVxuICAgIHZhciBvYmplY3Q7XG5cbiAgICBzd2l0Y2goZWxlbWVudF90eXBlKXtcbiAgICAgIGNhc2UgJ2NpcmNsZSc6XG4gICAgICAgIGxldCBfY2lyY2xlID0gbmV3IENpcmNsZShcbiAgICAgICAgICBwcm9wZXJ0aWVzWydjeCddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ2N5J10sXG4gICAgICAgICAgcHJvcGVydGllc1sncmFkaXVzJ10sXG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29sb3JzXG4gICAgICAgIClcbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKF9jaXJjbGUpO1xuICAgICAgICBvYmplY3QgPSBfY2lyY2xlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xpbmUnOlxuICAgICAgICBsZXQgX2xpbmUgPSBuZXcgTGluZShcbiAgICAgICAgICBwcm9wZXJ0aWVzWyd4MSddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ3kxJ10sXG4gICAgICAgICAgcHJvcGVydGllc1sneDInXSxcbiAgICAgICAgICBwcm9wZXJ0aWVzWyd5MiddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ3dpZHRoJ10sXG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29sb3JzXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKF9saW5lKTtcbiAgICAgICAgb2JqZWN0ID0gX2xpbmU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5sb2coZWxlbWVudFR5cGUpO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICBkcmF3RWxlbWVudHMoKXtcbiAgICBmb3IobGV0IGVsZW1lbnQgb2YgdGhpcy5lbGVtZW50cyl7XG4gICAgICBsZXQgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQgPSB0aGlzLnN2Z19lbGVtZW50c1tlbGVtZW50Ll9pZF07XG4gICAgICBsZXQgY2VudGVyMmQgPSBlbGVtZW50LmdldDJEQ2VudGVyKCk7XG4gICAgICBsZXQgcGF0aCA9IGVsZW1lbnQuZ2V0MkRQYXRoKCk7XG4gICAgICBsZXQgY29sb3JzID0gZWxlbWVudC5nZXRDb2xvcnMoKTtcblxuICAgICAgc3dpdGNoKGVsZW1lbnQuX3R5cGUpe1xuICAgICAgICBjYXNlIGVsZW1lbnRUeXBlLkNpcmNsZTpcbiAgICAgICAgICAvLyBDaGVjayBpZiBhbnkgZWxlbWVudCB3aXRoIHNhbWUgYF9pZGAgZXhpc3RzIGluIGNhbnZhc1xuICAgICAgICAgIC8vIHRoaXMuY2FudmFzLmhhcyhlbGVtZW50LnN2Z19vYmplY3QpXG4gICAgICAgICAgaWYoIGV4aXN0aW5nX3N2Z19lbGVtZW50ID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgbGV0IHN2Z19lbGVtZW50ID0gdGhpcy5jYW52YXMuY2lyY2xlKFxuICAgICAgICAgICAgICBlbGVtZW50LmdldFJhZGl1cygpICogMlxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICdjeCc6IGNlbnRlcjJkLngsXG4gICAgICAgICAgICAgICAgJ2N5JzogY2VudGVyMmQueSxcbiAgICAgICAgICAgICAgICAnZmlsbCc6IGNvbG9yc1snZmlsbF9jb2xvciddLFxuICAgICAgICAgICAgICAgICdzdHJva2UnOiBjb2xvcnNbJ3N0cm9rZV9jb2xvciddLFxuICAgICAgICAgICAgICAgICdzdHJva2Utd2lkdGgnOiBlbGVtZW50LmdldFdpZHRoKClcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLnN2Z19lbGVtZW50c1tlbGVtZW50Ll9pZF0gPSBzdmdfZWxlbWVudDtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIC8vIFJlZHJhdyBvciBtb3ZlXG4gICAgICAgICAgICBpZihcbiAgICAgICAgICAgICAgY2VudGVyMmQueCAhPSBleGlzdGluZ19zdmdfZWxlbWVudC5jeCgpIHx8XG4gICAgICAgICAgICAgIGNlbnRlcjJkLnkgIT0gZXhpc3Rpbmdfc3ZnX2VsZW1lbnQuY3koKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGV4aXN0aW5nX3N2Z19lbGVtZW50Lm1vdmUoY2VudGVyMmQueCwgY2VudGVyMmQueSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGVsZW1lbnRUeXBlLkxpbmU6XG4gICAgICAgICAgaWYoIGV4aXN0aW5nX3N2Z19lbGVtZW50ID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgbGV0IHN2Z19lbGVtZW50ID0gdGhpcy5jYW52YXMubGluZShcbiAgICAgICAgICAgICAgcGF0aFswXS54LFxuICAgICAgICAgICAgICBwYXRoWzBdLnksXG4gICAgICAgICAgICAgIHBhdGhbMV0ueCxcbiAgICAgICAgICAgICAgcGF0aFsxXS55LFxuICAgICAgICAgICAgKS5hdHRyKHtcbiAgICAgICAgICAgICAgJ2ZpbGwnOiBjb2xvcnNbJ2ZpbGxfY29sb3InXSxcbiAgICAgICAgICAgICAgJ3N0cm9rZSc6IGNvbG9yc1snc3Ryb2tlX2NvbG9yJ10sXG4gICAgICAgICAgICAgICdzdHJva2Utd2lkdGgnOiBlbGVtZW50LmdldFdpZHRoKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zdmdfZWxlbWVudHNbZWxlbWVudC5faWRdID0gc3ZnX2VsZW1lbnQ7XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAvLyBSZWRyYXcgb3IgbW92ZVxuICAgICAgICAgICAgaWYoXG4gICAgICAgICAgICAgIHBhdGhbMF0ueCAhPSBleGlzdGluZ19zdmdfZWxlbWVudC54KCkgfHxcbiAgICAgICAgICAgICAgcGF0aFswXS55ICE9IGV4aXN0aW5nX3N2Z19lbGVtZW50LnkoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGV4aXN0aW5nX3N2Z19lbGVtZW50Lm1vdmUoXG4gICAgICAgICAgICAgICAgcGF0aFswXS54LFxuICAgICAgICAgICAgICAgIHBhdGhbMF0ueVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHJvY2tldCAtIGNoZWNrIGl0J3Mgc3RhdHVzXG4gICAgICAgICAgICBmb3IobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpe1xuICAgICAgICAgICAgICBpZihyb2NrZXQuX2lkID09IGVsZW1lbnQuX2lkKXtcbiAgICAgICAgICAgICAgICBpZighcm9ja2V0LmlzX2FsaXZlKXtcbiAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudChyb2NrZXQuX2lkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlRWxlbWVudChpZDogc3RyaW5nKXtcbiAgICB2YXIgZWw7XG5cbiAgICBmb3IobGV0IGVsZW1lbnQgb2YgdGhpcy5lbGVtZW50cyl7XG4gICAgICBpZihlbGVtZW50Ll9pZCA9PSBpZCl7XG4gICAgICAgIGVsID0gZWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoZWwgIT0gdW5kZWZpbmVkKXtcbiAgICAgIGxldCBlbGVtZW50X2luZGV4ID0gdGhpcy5lbGVtZW50cy5pbmRleE9mKGVsKTtcbiAgICAgIGlmKGVsZW1lbnRfaW5kZXggIT0gLTEpe1xuICAgICAgICB0aGlzLmVsZW1lbnRzLnNwbGljZShlbGVtZW50X2luZGV4LCAxKTtcbiAgICAgICAgbGV0IGV4aXN0aW5nX3N2Z19lbGVtZW50ID0gdGhpcy5zdmdfZWxlbWVudHNbZWwuX2lkXTtcbiAgICAgICAgaWYoZXhpc3Rpbmdfc3ZnX2VsZW1lbnQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgZGVsZXRlIHRoaXMuc3ZnX2VsZW1lbnRzW2VsLl9pZF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBhY3Rpdml0eSgpe1xuICAgIHZhciBkZWFkX3JvY2tldHNfY291bnQgPSAwO1xuICAgIHZhciBsYW5kZWRfcm9ja2V0c19jb3VudCA9IDA7XG5cbiAgICBmb3IgKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKSB7XG4gICAgICBpZiAocm9ja2V0LmlzX2FsaXZlKSB7XG4gICAgICAgIGlmKHJvY2tldC5oYXNfbGFuZGVkKXtcbiAgICAgICAgICBsYW5kZWRfcm9ja2V0c19jb3VudCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGVsZW1lbnQgb2YgdGhpcy5lbGVtZW50cykge1xuICAgICAgICAgIGlmIChlbGVtZW50Ll9pZCA9PSByb2NrZXQuX2lkKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm1vdmUoXG4gICAgICAgICAgICAgIHJvY2tldC5nZXQyRFBhdGgoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJvY2tldC51cGRhdGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1lbHNle1xuICAgICAgICBkZWFkX3JvY2tldHNfY291bnQgKz0gMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVhZF9yb2NrZXRzX2NvdW50ICsgbGFuZGVkX3JvY2tldHNfY291bnQgPT0gdGhpcy5yb2NrZXRzLmxlbmd0aFxuICB9XG5cbiAgc3RhcnRBY3Rpdml0eShcbiAgICBpbnRlcnZhbDogbnVtYmVyXG4gICl7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCByb2NrZXRzX3Bvb2wgPSBzZWxmLmNhbGNSb2NrZXRzU2NvcmVzKCk7XG4gICAgbGV0IHJvdXRpbmVzID0gc2VsZi5zZWxlY3RSb2NrZXRzUm91dGluZXMocm9ja2V0c19wb29sKTtcbiAgICBzZWxmLnN0YXJ0Um9ja2V0cyhudWxsLCByb3V0aW5lcyk7XG5cbiAgICBsZXQgaW50ZXJ2YWxfaWQgPSBzZXRJbnRlcnZhbChcbiAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBhY3Rpdml0eV9maW5pc2hlZCA9IHNlbGYuYWN0aXZpdHkoKTtcbiAgICAgICAgaWYoYWN0aXZpdHlfZmluaXNoZWQpe1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsX2lkKTtcblxuICAgICAgICAgIHNlbGYudXBkYXRlR2VuZXJhdGlvbkluZm8oKTtcbiAgICAgICAgICBzZWxmLnN0YXJ0QWN0aXZpdHkoXG4gICAgICAgICAgICBpbnRlcnZhbFxuICAgICAgICAgICk7XG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgaW50ZXJ2YWxcbiAgICApO1xuICB9XG5cbiAgY2FsY1JvY2tldHNTY29yZXMoKXtcbiAgICB2YXIgbWF4X3Njb3JlID0gMDtcbiAgICBmb3IobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpe1xuICAgICAgaWYocm9ja2V0LnNlbGVjdGlvbl9zY29yZSA+IG1heF9zY29yZSl7XG4gICAgICAgIG1heF9zY29yZSA9IHJvY2tldC5zZWxlY3Rpb25fc2NvcmU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKXtcbiAgICAgIHJvY2tldC5zZWxlY3Rpb25fc2NvcmUgLz0gbWF4X3Njb3JlOyAvLyBCZXR3ZWVuIDAgYW5kIDFcbiAgICB9XG5cbiAgICB2YXIgcm9ja2V0c19wb29sID0gW107XG4gICAgZm9yKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKXtcbiAgICAgIGxldCBuID0gcm9ja2V0LnNlbGVjdGlvbl9zY29yZSAqIDEwMDtcbiAgICAgIGZvcihsZXQgaiA9IDA7IGogPCBuOyBqKyspe1xuICAgICAgICByb2NrZXRzX3Bvb2wucHVzaChyb2NrZXQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvY2tldHNfcG9vbDtcbiAgfVxuXG4gIHNlbGVjdFJvY2tldHNSb3V0aW5lcyhyb2NrZXRzX3Bvb2w6IFJvY2tldFtdKXtcbiAgICB2YXIgcm91dGluZXMgPSBbXTtcbiAgICBmb3IobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpe1xuICAgICAgbGV0IHJvdXRpbmVBID0gcGlja1JhbmRvbUZyb21BcnJheShyb2NrZXRzX3Bvb2wpLnJvdXRpbmU7XG4gICAgICBsZXQgcm91dGluZUIgPSBwaWNrUmFuZG9tRnJvbUFycmF5KHJvY2tldHNfcG9vbCkucm91dGluZTtcbiAgICAgIGxldCBjaGlsZFJvdXRpbmUgPSByb3V0aW5lQS5jcm9zc092ZXIocm91dGluZUIpO1xuXG4gICAgICByb3V0aW5lcy5wdXNoKGNoaWxkUm91dGluZSlcbiAgICB9XG5cbiAgICByZXR1cm4gcm91dGluZXM7XG4gIH1cblxuICByZW5kZXIoaW50ZXJ2YWw6IG51bWJlcil7XG4gICAgc2V0SW50ZXJ2YWwoKCkgPT4gdGhpcy5kcmF3RWxlbWVudHMoKSwgaW50ZXJ2YWwpO1xuICB9XG5cbiAgc3RhcnRSb2NrZXQocm9ja2V0OiBSb2NrZXQpe1xuICAgIGxldCBfbGluZSA9IHRoaXMuYWRkRWxlbWVudChcbiAgICAgICdsaW5lJyxcbiAgICAgIHtcbiAgICAgICAgJ3gxJzogcm9ja2V0LngxLFxuICAgICAgICAneTEnOiByb2NrZXQueTEsXG4gICAgICAgICd4Mic6IHJvY2tldC54MixcbiAgICAgICAgJ3kyJzogcm9ja2V0LnkyLFxuICAgICAgICAnd2lkdGgnOiByb2NrZXQud2lkdGhcbiAgICAgIH0sXG4gICAgICByb2NrZXQuX2lkLFxuICAgICAge1xuICAgICAgICBmaWxsX2NvbG9yOiAncmdiYSgwLCAwLCAwLCAuOSknLFxuICAgICAgICBzdHJva2VfY29sb3I6ICdyZ2JhKDI1MiwgOTgsIDkzLCAuNyknLFxuICAgICAgICBmb250X2NvbG9yOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAxKScsXG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLnJvY2tldHMucHVzaChcbiAgICAgIHJvY2tldFxuICAgICk7XG4gIH1cblxuICBzdGFydFJvY2tldHMoXG4gICAgcm9ja2V0c19jb3VudD86IG51bWJlcixcbiAgICByb3V0aW5lcz86IFJvdXRpbmVbXVxuICApe1xuICAgIGZvcihsZXQgcm9ja2V0IG9mIHRoaXMucm9ja2V0cyl7XG4gICAgICB0aGlzLnJlbW92ZUVsZW1lbnQocm9ja2V0Ll9pZCk7XG4gICAgfVxuICAgIHRoaXMucm9ja2V0cyA9IFtdO1xuXG4gICAgbGV0IHJvY2tldF9oZWlnaHQgPSB0aGlzLm1pbl9zaWRlIC8gMTAwO1xuXG4gICAgdmFyIHJvY2tldHMgPSBbXTtcbiAgICBpZihyb2NrZXRzX2NvdW50ID4gMCl7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvY2tldHNfY291bnQ7IGkrKykge1xuICAgICAgICBsZXQgcm9ja2V0ID0gbmV3IFJvY2tldChcbiAgICAgICAgICB0aGlzLm9yaWdpbixcbiAgICAgICAgICB0aGlzLmRlc3RpbmF0aW9uLFxuICAgICAgICAgIHJvY2tldF9oZWlnaHQsXG4gICAgICAgICk7XG4gICAgICAgIHJvY2tldHMucHVzaChcbiAgICAgICAgICByb2NrZXRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9ZWxzZSBpZihyb3V0aW5lcy5sZW5ndGggPiAwKXtcbiAgICAgIGZvcihsZXQgcm91dGluZSBvZiByb3V0aW5lcyl7XG4gICAgICAgIHJvY2tldHMucHVzaChcbiAgICAgICAgICBuZXcgUm9ja2V0KFxuICAgICAgICAgICAgdGhpcy5vcmlnaW4sXG4gICAgICAgICAgICB0aGlzLmRlc3RpbmF0aW9uLFxuICAgICAgICAgICAgcm9ja2V0X2hlaWdodCxcbiAgICAgICAgICAgIHJvdXRpbmVcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJvY2tldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuc3RhcnRSb2NrZXQocm9ja2V0c1tpXSk7XG4gICAgfVxuICB9XG59XG4iLCJleHBvcnQgbGV0IGNvbG9ycyA9IHtcbiAgZmlsbF9jb2xvcjogJ3JnYmEoMTU3LDE2NSwxODAsIC45KScsXG4gIHN0cm9rZV9jb2xvcjogJ3JnYmEoMTI2LCAxMzMsIDE0NiwgMSknLFxuICBmb250X2NvbG9yOiAncmdiYSgyNTUsIDI1NSwgMjU1LCAxKScsXG59XG4iXX0=

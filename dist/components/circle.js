'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("./helpers");
var classes_1 = require("./classes");
var default_circle_radius = 10;
var Circle = /** @class */ (function () {
    function Circle(cx, cy, radius) {
        this._id = helpers_1.makeid();
        this._type = classes_1.elementType.Circle;
        this.cx = cx;
        this.cy = cy;
        this.radius = radius || default_circle_radius;
    }
    Circle.prototype.get2DCenter = function () {
        return new classes_1.Point2D(this.cx, this.cy);
    };
    Circle.prototype.move = function (point) {
        this.cx = point.x;
        this.cy = point.y;
    };
    return Circle;
}());
exports.Circle = Circle;

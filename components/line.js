'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("./helpers");
var classes_1 = require("./classes");
var default_line_width = 1;
var Line = /** @class */ (function () {
    function Line(x1, y1, x2, y2, width) {
        this._id = helpers_1.makeid();
        this._type = classes_1.elementType.Line;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.width = width || default_line_width;
    }
    Line.prototype.get2DCenter = function () {
        return new classes_1.Point2D(this.x1, this.y1);
    };
    Line.prototype.move = function (point) {
    };
    return Line;
}());
exports.Line = Line;

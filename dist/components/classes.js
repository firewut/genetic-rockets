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

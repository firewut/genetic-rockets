(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
* svg.js - A lightweight library for manipulating and animating SVG.
* @version 2.6.3
* https://svgdotjs.github.io/
*
* @copyright Wout Fierens <wout@mick-wout.com>
* @license MIT
*
* BUILT: Fri Jul 21 2017 14:50:37 GMT+0200 (Mitteleuropäische Sommerzeit)
*/;
(function(root, factory) {
  /* istanbul ignore next */
  if (typeof define === 'function' && define.amd) {
    define(function(){
      return factory(root, root.document)
    })
  } else if (typeof exports === 'object') {
    module.exports = root.document ? factory(root, root.document) : function(w){ return factory(w, w.document) }
  } else {
    root.SVG = factory(root, root.document)
  }
}(typeof window !== "undefined" ? window : this, function(window, document) {

// The main wrapping element
var SVG = this.SVG = function(element) {
  if (SVG.supported) {
    element = new SVG.Doc(element)

    if(!SVG.parser.draw)
      SVG.prepare()

    return element
  }
}

// Default namespaces
SVG.ns    = 'http://www.w3.org/2000/svg'
SVG.xmlns = 'http://www.w3.org/2000/xmlns/'
SVG.xlink = 'http://www.w3.org/1999/xlink'
SVG.svgjs = 'http://svgjs.com/svgjs'

// Svg support test
SVG.supported = (function() {
  return !! document.createElementNS &&
         !! document.createElementNS(SVG.ns,'svg').createSVGRect
})()

// Don't bother to continue if SVG is not supported
if (!SVG.supported) return false

// Element id sequence
SVG.did  = 1000

// Get next named element id
SVG.eid = function(name) {
  return 'Svgjs' + capitalize(name) + (SVG.did++)
}

// Method for element creation
SVG.create = function(name) {
  // create element
  var element = document.createElementNS(this.ns, name)

  // apply unique id
  element.setAttribute('id', this.eid(name))

  return element
}

// Method for extending objects
SVG.extend = function() {
  var modules, methods, key, i

  // Get list of modules
  modules = [].slice.call(arguments)

  // Get object with extensions
  methods = modules.pop()

  for (i = modules.length - 1; i >= 0; i--)
    if (modules[i])
      for (key in methods)
        modules[i].prototype[key] = methods[key]

  // Make sure SVG.Set inherits any newly added methods
  if (SVG.Set && SVG.Set.inherit)
    SVG.Set.inherit()
}

// Invent new element
SVG.invent = function(config) {
  // Create element initializer
  var initializer = typeof config.create == 'function' ?
    config.create :
    function() {
      this.constructor.call(this, SVG.create(config.create))
    }

  // Inherit prototype
  if (config.inherit)
    initializer.prototype = new config.inherit

  // Extend with methods
  if (config.extend)
    SVG.extend(initializer, config.extend)

  // Attach construct method to parent
  if (config.construct)
    SVG.extend(config.parent || SVG.Container, config.construct)

  return initializer
}

// Adopt existing svg elements
SVG.adopt = function(node) {
  // check for presence of node
  if (!node) return null

  // make sure a node isn't already adopted
  if (node.instance) return node.instance

  // initialize variables
  var element

  // adopt with element-specific settings
  if (node.nodeName == 'svg')
    element = node.parentNode instanceof window.SVGElement ? new SVG.Nested : new SVG.Doc
  else if (node.nodeName == 'linearGradient')
    element = new SVG.Gradient('linear')
  else if (node.nodeName == 'radialGradient')
    element = new SVG.Gradient('radial')
  else if (SVG[capitalize(node.nodeName)])
    element = new SVG[capitalize(node.nodeName)]
  else
    element = new SVG.Element(node)

  // ensure references
  element.type  = node.nodeName
  element.node  = node
  node.instance = element

  // SVG.Class specific preparations
  if (element instanceof SVG.Doc)
    element.namespace().defs()

  // pull svgjs data from the dom (getAttributeNS doesn't work in html5)
  element.setData(JSON.parse(node.getAttribute('svgjs:data')) || {})

  return element
}

// Initialize parsing element
SVG.prepare = function() {
  // Select document body and create invisible svg element
  var body = document.getElementsByTagName('body')[0]
    , draw = (body ? new SVG.Doc(body) : SVG.adopt(document.documentElement).nested()).size(2, 0)

  // Create parser object
  SVG.parser = {
    body: body || document.documentElement
  , draw: draw.style('opacity:0;position:absolute;left:-100%;top:-100%;overflow:hidden').node
  , poly: draw.polyline().node
  , path: draw.path().node
  , native: SVG.create('svg')
  }
}

SVG.parser = {
  native: SVG.create('svg')
}

document.addEventListener('DOMContentLoaded', function() {
  if(!SVG.parser.draw)
    SVG.prepare()
}, false)

// Storage for regular expressions
SVG.regex = {
  // Parse unit value
  numberAndUnit:    /^([+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?)([a-z%]*)$/i

  // Parse hex value
, hex:              /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i

  // Parse rgb value
, rgb:              /rgb\((\d+),(\d+),(\d+)\)/

  // Parse reference id
, reference:        /#([a-z0-9\-_]+)/i

  // splits a transformation chain
, transforms:       /\)\s*,?\s*/

  // Whitespace
, whitespace:       /\s/g

  // Test hex value
, isHex:            /^#[a-f0-9]{3,6}$/i

  // Test rgb value
, isRgb:            /^rgb\(/

  // Test css declaration
, isCss:            /[^:]+:[^;]+;?/

  // Test for blank string
, isBlank:          /^(\s+)?$/

  // Test for numeric string
, isNumber:         /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i

  // Test for percent value
, isPercent:        /^-?[\d\.]+%$/

  // Test for image url
, isImage:          /\.(jpg|jpeg|png|gif|svg)(\?[^=]+.*)?/i

  // split at whitespace and comma
, delimiter:        /[\s,]+/

  // The following regex are used to parse the d attribute of a path

  // Matches all hyphens which are not after an exponent
, hyphen:           /([^e])\-/gi

  // Replaces and tests for all path letters
, pathLetters:      /[MLHVCSQTAZ]/gi

  // yes we need this one, too
, isPathLetter:     /[MLHVCSQTAZ]/i

  // matches 0.154.23.45
, numbersWithDots:  /((\d?\.\d+(?:e[+-]?\d+)?)((?:\.\d+(?:e[+-]?\d+)?)+))+/gi

  // matches .
, dots:             /\./g
}

SVG.utils = {
  // Map function
  map: function(array, block) {
    var i
      , il = array.length
      , result = []

    for (i = 0; i < il; i++)
      result.push(block(array[i]))

    return result
  }

  // Filter function
, filter: function(array, block) {
    var i
      , il = array.length
      , result = []

    for (i = 0; i < il; i++)
      if (block(array[i]))
        result.push(array[i])

    return result
  }

  // Degrees to radians
, radians: function(d) {
    return d % 360 * Math.PI / 180
  }

  // Radians to degrees
, degrees: function(r) {
    return r * 180 / Math.PI % 360
  }

, filterSVGElements: function(nodes) {
    return this.filter( nodes, function(el) { return el instanceof window.SVGElement })
  }

}

SVG.defaults = {
  // Default attribute values
  attrs: {
    // fill and stroke
    'fill-opacity':     1
  , 'stroke-opacity':   1
  , 'stroke-width':     0
  , 'stroke-linejoin':  'miter'
  , 'stroke-linecap':   'butt'
  , fill:               '#000000'
  , stroke:             '#000000'
  , opacity:            1
    // position
  , x:                  0
  , y:                  0
  , cx:                 0
  , cy:                 0
    // size
  , width:              0
  , height:             0
    // radius
  , r:                  0
  , rx:                 0
  , ry:                 0
    // gradient
  , offset:             0
  , 'stop-opacity':     1
  , 'stop-color':       '#000000'
    // text
  , 'font-size':        16
  , 'font-family':      'Helvetica, Arial, sans-serif'
  , 'text-anchor':      'start'
  }

}
// Module for color convertions
SVG.Color = function(color) {
  var match

  // initialize defaults
  this.r = 0
  this.g = 0
  this.b = 0

  if(!color) return

  // parse color
  if (typeof color === 'string') {
    if (SVG.regex.isRgb.test(color)) {
      // get rgb values
      match = SVG.regex.rgb.exec(color.replace(SVG.regex.whitespace,''))

      // parse numeric values
      this.r = parseInt(match[1])
      this.g = parseInt(match[2])
      this.b = parseInt(match[3])

    } else if (SVG.regex.isHex.test(color)) {
      // get hex values
      match = SVG.regex.hex.exec(fullHex(color))

      // parse numeric values
      this.r = parseInt(match[1], 16)
      this.g = parseInt(match[2], 16)
      this.b = parseInt(match[3], 16)

    }

  } else if (typeof color === 'object') {
    this.r = color.r
    this.g = color.g
    this.b = color.b

  }

}

SVG.extend(SVG.Color, {
  // Default to hex conversion
  toString: function() {
    return this.toHex()
  }
  // Build hex value
, toHex: function() {
    return '#'
      + compToHex(this.r)
      + compToHex(this.g)
      + compToHex(this.b)
  }
  // Build rgb value
, toRgb: function() {
    return 'rgb(' + [this.r, this.g, this.b].join() + ')'
  }
  // Calculate true brightness
, brightness: function() {
    return (this.r / 255 * 0.30)
         + (this.g / 255 * 0.59)
         + (this.b / 255 * 0.11)
  }
  // Make color morphable
, morph: function(color) {
    this.destination = new SVG.Color(color)

    return this
  }
  // Get morphed color at given position
, at: function(pos) {
    // make sure a destination is defined
    if (!this.destination) return this

    // normalise pos
    pos = pos < 0 ? 0 : pos > 1 ? 1 : pos

    // generate morphed color
    return new SVG.Color({
      r: ~~(this.r + (this.destination.r - this.r) * pos)
    , g: ~~(this.g + (this.destination.g - this.g) * pos)
    , b: ~~(this.b + (this.destination.b - this.b) * pos)
    })
  }

})

// Testers

// Test if given value is a color string
SVG.Color.test = function(color) {
  color += ''
  return SVG.regex.isHex.test(color)
      || SVG.regex.isRgb.test(color)
}

// Test if given value is a rgb object
SVG.Color.isRgb = function(color) {
  return color && typeof color.r == 'number'
               && typeof color.g == 'number'
               && typeof color.b == 'number'
}

// Test if given value is a color
SVG.Color.isColor = function(color) {
  return SVG.Color.isRgb(color) || SVG.Color.test(color)
}
// Module for array conversion
SVG.Array = function(array, fallback) {
  array = (array || []).valueOf()

  // if array is empty and fallback is provided, use fallback
  if (array.length == 0 && fallback)
    array = fallback.valueOf()

  // parse array
  this.value = this.parse(array)
}

SVG.extend(SVG.Array, {
  // Make array morphable
  morph: function(array) {
    this.destination = this.parse(array)

    // normalize length of arrays
    if (this.value.length != this.destination.length) {
      var lastValue       = this.value[this.value.length - 1]
        , lastDestination = this.destination[this.destination.length - 1]

      while(this.value.length > this.destination.length)
        this.destination.push(lastDestination)
      while(this.value.length < this.destination.length)
        this.value.push(lastValue)
    }

    return this
  }
  // Clean up any duplicate points
, settle: function() {
    // find all unique values
    for (var i = 0, il = this.value.length, seen = []; i < il; i++)
      if (seen.indexOf(this.value[i]) == -1)
        seen.push(this.value[i])

    // set new value
    return this.value = seen
  }
  // Get morphed array at given position
, at: function(pos) {
    // make sure a destination is defined
    if (!this.destination) return this

    // generate morphed array
    for (var i = 0, il = this.value.length, array = []; i < il; i++)
      array.push(this.value[i] + (this.destination[i] - this.value[i]) * pos)

    return new SVG.Array(array)
  }
  // Convert array to string
, toString: function() {
    return this.value.join(' ')
  }
  // Real value
, valueOf: function() {
    return this.value
  }
  // Parse whitespace separated string
, parse: function(array) {
    array = array.valueOf()

    // if already is an array, no need to parse it
    if (Array.isArray(array)) return array

    return this.split(array)
  }
  // Strip unnecessary whitespace
, split: function(string) {
    return string.trim().split(SVG.regex.delimiter).map(parseFloat)
  }
  // Reverse array
, reverse: function() {
    this.value.reverse()

    return this
  }
, clone: function() {
    var clone = new this.constructor()
    clone.value = array_clone(this.value)
    return clone
  }
})
// Poly points array
SVG.PointArray = function(array, fallback) {
  SVG.Array.call(this, array, fallback || [[0,0]])
}

// Inherit from SVG.Array
SVG.PointArray.prototype = new SVG.Array
SVG.PointArray.prototype.constructor = SVG.PointArray

SVG.extend(SVG.PointArray, {
  // Convert array to string
  toString: function() {
    // convert to a poly point string
    for (var i = 0, il = this.value.length, array = []; i < il; i++)
      array.push(this.value[i].join(','))

    return array.join(' ')
  }
  // Convert array to line object
, toLine: function() {
    return {
      x1: this.value[0][0]
    , y1: this.value[0][1]
    , x2: this.value[1][0]
    , y2: this.value[1][1]
    }
  }
  // Get morphed array at given position
, at: function(pos) {
    // make sure a destination is defined
    if (!this.destination) return this

    // generate morphed point string
    for (var i = 0, il = this.value.length, array = []; i < il; i++)
      array.push([
        this.value[i][0] + (this.destination[i][0] - this.value[i][0]) * pos
      , this.value[i][1] + (this.destination[i][1] - this.value[i][1]) * pos
      ])

    return new SVG.PointArray(array)
  }
  // Parse point string and flat array
, parse: function(array) {
    var points = []

    array = array.valueOf()

    // if it is an array
    if (Array.isArray(array)) {
      // and it is not flat, there is no need to parse it
      if(Array.isArray(array[0])) {
        return array
      }
    } else { // Else, it is considered as a string
      // parse points
      array = array.trim().split(SVG.regex.delimiter).map(parseFloat)
    }

    // validate points - https://svgwg.org/svg2-draft/shapes.html#DataTypePoints
    // Odd number of coordinates is an error. In such cases, drop the last odd coordinate.
    if (array.length % 2 !== 0) array.pop()

    // wrap points in two-tuples and parse points as floats
    for(var i = 0, len = array.length; i < len; i = i + 2)
      points.push([ array[i], array[i+1] ])

    return points
  }
  // Move point string
, move: function(x, y) {
    var box = this.bbox()

    // get relative offset
    x -= box.x
    y -= box.y

    // move every point
    if (!isNaN(x) && !isNaN(y))
      for (var i = this.value.length - 1; i >= 0; i--)
        this.value[i] = [this.value[i][0] + x, this.value[i][1] + y]

    return this
  }
  // Resize poly string
, size: function(width, height) {
    var i, box = this.bbox()

    // recalculate position of all points according to new size
    for (i = this.value.length - 1; i >= 0; i--) {
      if(box.width) this.value[i][0] = ((this.value[i][0] - box.x) * width)  / box.width  + box.x
      if(box.height) this.value[i][1] = ((this.value[i][1] - box.y) * height) / box.height + box.y
    }

    return this
  }
  // Get bounding box of points
, bbox: function() {
    SVG.parser.poly.setAttribute('points', this.toString())

    return SVG.parser.poly.getBBox()
  }
})

var pathHandlers = {
  M: function(c, p, p0) {
    p.x = p0.x = c[0]
    p.y = p0.y = c[1]

    return ['M', p.x, p.y]
  },
  L: function(c, p) {
    p.x = c[0]
    p.y = c[1]
    return ['L', c[0], c[1]]
  },
  H: function(c, p) {
    p.x = c[0]
    return ['H', c[0]]
  },
  V: function(c, p) {
    p.y = c[0]
    return ['V', c[0]]
  },
  C: function(c, p) {
    p.x = c[4]
    p.y = c[5]
    return ['C', c[0], c[1], c[2], c[3], c[4], c[5]]
  },
  S: function(c, p) {
    p.x = c[2]
    p.y = c[3]
    return ['S', c[0], c[1], c[2], c[3]]
  },
  Q: function(c, p) {
    p.x = c[2]
    p.y = c[3]
    return ['Q', c[0], c[1], c[2], c[3]]
  },
  T: function(c, p) {
    p.x = c[0]
    p.y = c[1]
    return ['T', c[0], c[1]]
  },
  Z: function(c, p, p0) {
    p.x = p0.x
    p.y = p0.y
    return ['Z']
  },
  A: function(c, p) {
    p.x = c[5]
    p.y = c[6]
    return ['A', c[0], c[1], c[2], c[3], c[4], c[5], c[6]]
  }
}

var mlhvqtcsa = 'mlhvqtcsaz'.split('')

for(var i = 0, il = mlhvqtcsa.length; i < il; ++i){
  pathHandlers[mlhvqtcsa[i]] = (function(i){
    return function(c, p, p0) {
      if(i == 'H') c[0] = c[0] + p.x
      else if(i == 'V') c[0] = c[0] + p.y
      else if(i == 'A'){
        c[5] = c[5] + p.x,
        c[6] = c[6] + p.y
      }
      else
        for(var j = 0, jl = c.length; j < jl; ++j) {
          c[j] = c[j] + (j%2 ? p.y : p.x)
        }

      return pathHandlers[i](c, p, p0)
    }
  })(mlhvqtcsa[i].toUpperCase())
}

// Path points array
SVG.PathArray = function(array, fallback) {
  SVG.Array.call(this, array, fallback || [['M', 0, 0]])
}

// Inherit from SVG.Array
SVG.PathArray.prototype = new SVG.Array
SVG.PathArray.prototype.constructor = SVG.PathArray

SVG.extend(SVG.PathArray, {
  // Convert array to string
  toString: function() {
    return arrayToString(this.value)
  }
  // Move path string
, move: function(x, y) {
    // get bounding box of current situation
    var box = this.bbox()

    // get relative offset
    x -= box.x
    y -= box.y

    if (!isNaN(x) && !isNaN(y)) {
      // move every point
      for (var l, i = this.value.length - 1; i >= 0; i--) {
        l = this.value[i][0]

        if (l == 'M' || l == 'L' || l == 'T')  {
          this.value[i][1] += x
          this.value[i][2] += y

        } else if (l == 'H')  {
          this.value[i][1] += x

        } else if (l == 'V')  {
          this.value[i][1] += y

        } else if (l == 'C' || l == 'S' || l == 'Q')  {
          this.value[i][1] += x
          this.value[i][2] += y
          this.value[i][3] += x
          this.value[i][4] += y

          if (l == 'C')  {
            this.value[i][5] += x
            this.value[i][6] += y
          }

        } else if (l == 'A')  {
          this.value[i][6] += x
          this.value[i][7] += y
        }

      }
    }

    return this
  }
  // Resize path string
, size: function(width, height) {
    // get bounding box of current situation
    var i, l, box = this.bbox()

    // recalculate position of all points according to new size
    for (i = this.value.length - 1; i >= 0; i--) {
      l = this.value[i][0]

      if (l == 'M' || l == 'L' || l == 'T')  {
        this.value[i][1] = ((this.value[i][1] - box.x) * width)  / box.width  + box.x
        this.value[i][2] = ((this.value[i][2] - box.y) * height) / box.height + box.y

      } else if (l == 'H')  {
        this.value[i][1] = ((this.value[i][1] - box.x) * width)  / box.width  + box.x

      } else if (l == 'V')  {
        this.value[i][1] = ((this.value[i][1] - box.y) * height) / box.height + box.y

      } else if (l == 'C' || l == 'S' || l == 'Q')  {
        this.value[i][1] = ((this.value[i][1] - box.x) * width)  / box.width  + box.x
        this.value[i][2] = ((this.value[i][2] - box.y) * height) / box.height + box.y
        this.value[i][3] = ((this.value[i][3] - box.x) * width)  / box.width  + box.x
        this.value[i][4] = ((this.value[i][4] - box.y) * height) / box.height + box.y

        if (l == 'C')  {
          this.value[i][5] = ((this.value[i][5] - box.x) * width)  / box.width  + box.x
          this.value[i][6] = ((this.value[i][6] - box.y) * height) / box.height + box.y
        }

      } else if (l == 'A')  {
        // resize radii
        this.value[i][1] = (this.value[i][1] * width)  / box.width
        this.value[i][2] = (this.value[i][2] * height) / box.height

        // move position values
        this.value[i][6] = ((this.value[i][6] - box.x) * width)  / box.width  + box.x
        this.value[i][7] = ((this.value[i][7] - box.y) * height) / box.height + box.y
      }

    }

    return this
  }
  // Test if the passed path array use the same path data commands as this path array
, equalCommands: function(pathArray) {
    var i, il, equalCommands

    pathArray = new SVG.PathArray(pathArray)

    equalCommands = this.value.length === pathArray.value.length
    for(i = 0, il = this.value.length; equalCommands && i < il; i++) {
      equalCommands = this.value[i][0] === pathArray.value[i][0]
    }

    return equalCommands
  }
  // Make path array morphable
, morph: function(pathArray) {
    pathArray = new SVG.PathArray(pathArray)

    if(this.equalCommands(pathArray)) {
      this.destination = pathArray
    } else {
      this.destination = null
    }

    return this
  }
  // Get morphed path array at given position
, at: function(pos) {
    // make sure a destination is defined
    if (!this.destination) return this

    var sourceArray = this.value
      , destinationArray = this.destination.value
      , array = [], pathArray = new SVG.PathArray()
      , i, il, j, jl

    // Animate has specified in the SVG spec
    // See: https://www.w3.org/TR/SVG11/paths.html#PathElement
    for (i = 0, il = sourceArray.length; i < il; i++) {
      array[i] = [sourceArray[i][0]]
      for(j = 1, jl = sourceArray[i].length; j < jl; j++) {
        array[i][j] = sourceArray[i][j] + (destinationArray[i][j] - sourceArray[i][j]) * pos
      }
      // For the two flags of the elliptical arc command, the SVG spec say:
      // Flags and booleans are interpolated as fractions between zero and one, with any non-zero value considered to be a value of one/true
      // Elliptical arc command as an array followed by corresponding indexes:
      // ['A', rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y]
      //   0    1   2        3                 4             5      6  7
      if(array[i][0] === 'A') {
        array[i][4] = +(array[i][4] != 0)
        array[i][5] = +(array[i][5] != 0)
      }
    }

    // Directly modify the value of a path array, this is done this way for performance
    pathArray.value = array
    return pathArray
  }
  // Absolutize and parse path to array
, parse: function(array) {
    // if it's already a patharray, no need to parse it
    if (array instanceof SVG.PathArray) return array.valueOf()

    // prepare for parsing
    var i, x0, y0, s, seg, arr
      , x = 0
      , y = 0
      , paramCnt = { 'M':2, 'L':2, 'H':1, 'V':1, 'C':6, 'S':4, 'Q':4, 'T':2, 'A':7, 'Z':0 }

    if(typeof array == 'string'){

      array = array
        .replace(SVG.regex.numbersWithDots, pathRegReplace) // convert 45.123.123 to 45.123 .123
        .replace(SVG.regex.pathLetters, ' $& ') // put some room between letters and numbers
        .replace(SVG.regex.hyphen, '$1 -')      // add space before hyphen
        .trim()                                 // trim
        .split(SVG.regex.delimiter)   // split into array

    }else{
      array = array.reduce(function(prev, curr){
        return [].concat.call(prev, curr)
      }, [])
    }

    // array now is an array containing all parts of a path e.g. ['M', '0', '0', 'L', '30', '30' ...]
    var arr = []
      , p = new SVG.Point()
      , p0 = new SVG.Point()
      , index = 0
      , len = array.length

    do{
      // Test if we have a path letter
      if(SVG.regex.isPathLetter.test(array[index])){
        s = array[index]
        ++index
      // If last letter was a move command and we got no new, it defaults to [L]ine
      }else if(s == 'M'){
        s = 'L'
      }else if(s == 'm'){
        s = 'l'
      }

      arr.push(pathHandlers[s].call(null,
          array.slice(index, (index = index + paramCnt[s.toUpperCase()])).map(parseFloat),
          p, p0
        )
      )

    }while(len > index)

    return arr

  }
  // Get bounding box of path
, bbox: function() {
    SVG.parser.path.setAttribute('d', this.toString())

    return SVG.parser.path.getBBox()
  }

})

// Module for unit convertions
SVG.Number = SVG.invent({
  // Initialize
  create: function(value, unit) {
    // initialize defaults
    this.value = 0
    this.unit  = unit || ''

    // parse value
    if (typeof value === 'number') {
      // ensure a valid numeric value
      this.value = isNaN(value) ? 0 : !isFinite(value) ? (value < 0 ? -3.4e+38 : +3.4e+38) : value

    } else if (typeof value === 'string') {
      unit = value.match(SVG.regex.numberAndUnit)

      if (unit) {
        // make value numeric
        this.value = parseFloat(unit[1])

        // normalize
        if (unit[5] == '%')
          this.value /= 100
        else if (unit[5] == 's')
          this.value *= 1000

        // store unit
        this.unit = unit[5]
      }

    } else {
      if (value instanceof SVG.Number) {
        this.value = value.valueOf()
        this.unit  = value.unit
      }
    }

  }
  // Add methods
, extend: {
    // Stringalize
    toString: function() {
      return (
        this.unit == '%' ?
          ~~(this.value * 1e8) / 1e6:
        this.unit == 's' ?
          this.value / 1e3 :
          this.value
      ) + this.unit
    }
  , toJSON: function() {
      return this.toString()
    }
  , // Convert to primitive
    valueOf: function() {
      return this.value
    }
    // Add number
  , plus: function(number) {
      number = new SVG.Number(number)
      return new SVG.Number(this + number, this.unit || number.unit)
    }
    // Subtract number
  , minus: function(number) {
      number = new SVG.Number(number)
      return new SVG.Number(this - number, this.unit || number.unit)
    }
    // Multiply number
  , times: function(number) {
      number = new SVG.Number(number)
      return new SVG.Number(this * number, this.unit || number.unit)
    }
    // Divide number
  , divide: function(number) {
      number = new SVG.Number(number)
      return new SVG.Number(this / number, this.unit || number.unit)
    }
    // Convert to different unit
  , to: function(unit) {
      var number = new SVG.Number(this)

      if (typeof unit === 'string')
        number.unit = unit

      return number
    }
    // Make number morphable
  , morph: function(number) {
      this.destination = new SVG.Number(number)

      if(number.relative) {
        this.destination.value += this.value
      }

      return this
    }
    // Get morphed number at given position
  , at: function(pos) {
      // Make sure a destination is defined
      if (!this.destination) return this

      // Generate new morphed number
      return new SVG.Number(this.destination)
          .minus(this)
          .times(pos)
          .plus(this)
    }

  }
})


SVG.Element = SVG.invent({
  // Initialize node
  create: function(node) {
    // make stroke value accessible dynamically
    this._stroke = SVG.defaults.attrs.stroke
    this._event = null

    // initialize data object
    this.dom = {}

    // create circular reference
    if (this.node = node) {
      this.type = node.nodeName
      this.node.instance = this

      // store current attribute value
      this._stroke = node.getAttribute('stroke') || this._stroke
    }
  }

  // Add class methods
, extend: {
    // Move over x-axis
    x: function(x) {
      return this.attr('x', x)
    }
    // Move over y-axis
  , y: function(y) {
      return this.attr('y', y)
    }
    // Move by center over x-axis
  , cx: function(x) {
      return x == null ? this.x() + this.width() / 2 : this.x(x - this.width() / 2)
    }
    // Move by center over y-axis
  , cy: function(y) {
      return y == null ? this.y() + this.height() / 2 : this.y(y - this.height() / 2)
    }
    // Move element to given x and y values
  , move: function(x, y) {
      return this.x(x).y(y)
    }
    // Move element by its center
  , center: function(x, y) {
      return this.cx(x).cy(y)
    }
    // Set width of element
  , width: function(width) {
      return this.attr('width', width)
    }
    // Set height of element
  , height: function(height) {
      return this.attr('height', height)
    }
    // Set element size to given width and height
  , size: function(width, height) {
      var p = proportionalSize(this, width, height)

      return this
        .width(new SVG.Number(p.width))
        .height(new SVG.Number(p.height))
    }
    // Clone element
  , clone: function(parent, withData) {
      // write dom data to the dom so the clone can pickup the data
      this.writeDataToDom()

      // clone element and assign new id
      var clone = assignNewId(this.node.cloneNode(true))

      // insert the clone in the given parent or after myself
      if(parent) parent.add(clone)
      else this.after(clone)

      return clone
    }
    // Remove element
  , remove: function() {
      if (this.parent())
        this.parent().removeElement(this)

      return this
    }
    // Replace element
  , replace: function(element) {
      this.after(element).remove()

      return element
    }
    // Add element to given container and return self
  , addTo: function(parent) {
      return parent.put(this)
    }
    // Add element to given container and return container
  , putIn: function(parent) {
      return parent.add(this)
    }
    // Get / set id
  , id: function(id) {
      return this.attr('id', id)
    }
    // Checks whether the given point inside the bounding box of the element
  , inside: function(x, y) {
      var box = this.bbox()

      return x > box.x
          && y > box.y
          && x < box.x + box.width
          && y < box.y + box.height
    }
    // Show element
  , show: function() {
      return this.style('display', '')
    }
    // Hide element
  , hide: function() {
      return this.style('display', 'none')
    }
    // Is element visible?
  , visible: function() {
      return this.style('display') != 'none'
    }
    // Return id on string conversion
  , toString: function() {
      return this.attr('id')
    }
    // Return array of classes on the node
  , classes: function() {
      var attr = this.attr('class')

      return attr == null ? [] : attr.trim().split(SVG.regex.delimiter)
    }
    // Return true if class exists on the node, false otherwise
  , hasClass: function(name) {
      return this.classes().indexOf(name) != -1
    }
    // Add class to the node
  , addClass: function(name) {
      if (!this.hasClass(name)) {
        var array = this.classes()
        array.push(name)
        this.attr('class', array.join(' '))
      }

      return this
    }
    // Remove class from the node
  , removeClass: function(name) {
      if (this.hasClass(name)) {
        this.attr('class', this.classes().filter(function(c) {
          return c != name
        }).join(' '))
      }

      return this
    }
    // Toggle the presence of a class on the node
  , toggleClass: function(name) {
      return this.hasClass(name) ? this.removeClass(name) : this.addClass(name)
    }
    // Get referenced element form attribute value
  , reference: function(attr) {
      return SVG.get(this.attr(attr))
    }
    // Returns the parent element instance
  , parent: function(type) {
      var parent = this

      // check for parent
      if(!parent.node.parentNode) return null

      // get parent element
      parent = SVG.adopt(parent.node.parentNode)

      if(!type) return parent

      // loop trough ancestors if type is given
      while(parent && parent.node instanceof window.SVGElement){
        if(typeof type === 'string' ? parent.matches(type) : parent instanceof type) return parent
        if(parent.node.parentNode.nodeName == '#document') return null // #720
        parent = SVG.adopt(parent.node.parentNode)
      }
    }
    // Get parent document
  , doc: function() {
      return this instanceof SVG.Doc ? this : this.parent(SVG.Doc)
    }
    // return array of all ancestors of given type up to the root svg
  , parents: function(type) {
      var parents = [], parent = this

      do{
        parent = parent.parent(type)
        if(!parent || !parent.node) break

        parents.push(parent)
      } while(parent.parent)

      return parents
    }
    // matches the element vs a css selector
  , matches: function(selector){
      return matches(this.node, selector)
    }
    // Returns the svg node to call native svg methods on it
  , native: function() {
      return this.node
    }
    // Import raw svg
  , svg: function(svg) {
      // create temporary holder
      var well = document.createElement('svg')

      // act as a setter if svg is given
      if (svg && this instanceof SVG.Parent) {
        // dump raw svg
        well.innerHTML = '<svg>' + svg.replace(/\n/, '').replace(/<(\w+)([^<]+?)\/>/g, '<$1$2></$1>') + '</svg>'

        // transplant nodes
        for (var i = 0, il = well.firstChild.childNodes.length; i < il; i++)
          this.node.appendChild(well.firstChild.firstChild)

      // otherwise act as a getter
      } else {
        // create a wrapping svg element in case of partial content
        well.appendChild(svg = document.createElement('svg'))

        // write svgjs data to the dom
        this.writeDataToDom()

        // insert a copy of this node
        svg.appendChild(this.node.cloneNode(true))

        // return target element
        return well.innerHTML.replace(/^<svg>/, '').replace(/<\/svg>$/, '')
      }

      return this
    }
  // write svgjs data to the dom
  , writeDataToDom: function() {

      // dump variables recursively
      if(this.each || this.lines){
        var fn = this.each ? this : this.lines();
        fn.each(function(){
          this.writeDataToDom()
        })
      }

      // remove previously set data
      this.node.removeAttribute('svgjs:data')

      if(Object.keys(this.dom).length)
        this.node.setAttribute('svgjs:data', JSON.stringify(this.dom)) // see #428

      return this
    }
  // set given data to the elements data property
  , setData: function(o){
      this.dom = o
      return this
    }
  , is: function(obj){
      return is(this, obj)
    }
  }
})

SVG.easing = {
  '-': function(pos){return pos}
, '<>':function(pos){return -Math.cos(pos * Math.PI) / 2 + 0.5}
, '>': function(pos){return  Math.sin(pos * Math.PI / 2)}
, '<': function(pos){return -Math.cos(pos * Math.PI / 2) + 1}
}

SVG.morph = function(pos){
  return function(from, to) {
    return new SVG.MorphObj(from, to).at(pos)
  }
}

SVG.Situation = SVG.invent({

  create: function(o){
    this.init = false
    this.reversed = false
    this.reversing = false

    this.duration = new SVG.Number(o.duration).valueOf()
    this.delay = new SVG.Number(o.delay).valueOf()

    this.start = +new Date() + this.delay
    this.finish = this.start + this.duration
    this.ease = o.ease

    // this.loop is incremented from 0 to this.loops
    // it is also incremented when in an infinite loop (when this.loops is true)
    this.loop = 0
    this.loops = false

    this.animations = {
      // functionToCall: [list of morphable objects]
      // e.g. move: [SVG.Number, SVG.Number]
    }

    this.attrs = {
      // holds all attributes which are not represented from a function svg.js provides
      // e.g. someAttr: SVG.Number
    }

    this.styles = {
      // holds all styles which should be animated
      // e.g. fill-color: SVG.Color
    }

    this.transforms = [
      // holds all transformations as transformation objects
      // e.g. [SVG.Rotate, SVG.Translate, SVG.Matrix]
    ]

    this.once = {
      // functions to fire at a specific position
      // e.g. "0.5": function foo(){}
    }

  }

})


SVG.FX = SVG.invent({

  create: function(element) {
    this._target = element
    this.situations = []
    this.active = false
    this.situation = null
    this.paused = false
    this.lastPos = 0
    this.pos = 0
    // The absolute position of an animation is its position in the context of its complete duration (including delay and loops)
    // When performing a delay, absPos is below 0 and when performing a loop, its value is above 1
    this.absPos = 0
    this._speed = 1
  }

, extend: {

    /**
     * sets or returns the target of this animation
     * @param o object || number In case of Object it holds all parameters. In case of number its the duration of the animation
     * @param ease function || string Function which should be used for easing or easing keyword
     * @param delay Number indicating the delay before the animation starts
     * @return target || this
     */
    animate: function(o, ease, delay){

      if(typeof o == 'object'){
        ease = o.ease
        delay = o.delay
        o = o.duration
      }

      var situation = new SVG.Situation({
        duration: o || 1000,
        delay: delay || 0,
        ease: SVG.easing[ease || '-'] || ease
      })

      this.queue(situation)

      return this
    }

    /**
     * sets a delay before the next element of the queue is called
     * @param delay Duration of delay in milliseconds
     * @return this.target()
     */
  , delay: function(delay){
      // The delay is performed by an empty situation with its duration
      // attribute set to the duration of the delay
      var situation = new SVG.Situation({
        duration: delay,
        delay: 0,
        ease: SVG.easing['-']
      })

      return this.queue(situation)
    }

    /**
     * sets or returns the target of this animation
     * @param null || target SVG.Element which should be set as new target
     * @return target || this
     */
  , target: function(target){
      if(target && target instanceof SVG.Element){
        this._target = target
        return this
      }

      return this._target
    }

    // returns the absolute position at a given time
  , timeToAbsPos: function(timestamp){
      return (timestamp - this.situation.start) / (this.situation.duration/this._speed)
    }

    // returns the timestamp from a given absolute positon
  , absPosToTime: function(absPos){
      return this.situation.duration/this._speed * absPos + this.situation.start
    }

    // starts the animationloop
  , startAnimFrame: function(){
      this.stopAnimFrame()
      this.animationFrame = window.requestAnimationFrame(function(){ this.step() }.bind(this))
    }

    // cancels the animationframe
  , stopAnimFrame: function(){
      window.cancelAnimationFrame(this.animationFrame)
    }

    // kicks off the animation - only does something when the queue is currently not active and at least one situation is set
  , start: function(){
      // dont start if already started
      if(!this.active && this.situation){
        this.active = true
        this.startCurrent()
      }

      return this
    }

    // start the current situation
  , startCurrent: function(){
      this.situation.start = +new Date + this.situation.delay/this._speed
      this.situation.finish = this.situation.start + this.situation.duration/this._speed
      return this.initAnimations().step()
    }

    /**
     * adds a function / Situation to the animation queue
     * @param fn function / situation to add
     * @return this
     */
  , queue: function(fn){
      if(typeof fn == 'function' || fn instanceof SVG.Situation)
        this.situations.push(fn)

      if(!this.situation) this.situation = this.situations.shift()

      return this
    }

    /**
     * pulls next element from the queue and execute it
     * @return this
     */
  , dequeue: function(){
      // stop current animation
      this.stop()

      // get next animation from queue
      this.situation = this.situations.shift()

      if(this.situation){
        if(this.situation instanceof SVG.Situation) {
          this.start()
        } else {
          // If it is not a SVG.Situation, then it is a function, we execute it
          this.situation.call(this)
        }
      }

      return this
    }

    // updates all animations to the current state of the element
    // this is important when one property could be changed from another property
  , initAnimations: function() {
      var i, j, source
      var s = this.situation

      if(s.init) return this

      for(i in s.animations){
        source = this.target()[i]()

        if(!Array.isArray(source)) {
          source = [source]
        }

        if(!Array.isArray(s.animations[i])) {
          s.animations[i] = [s.animations[i]]
        }

        //if(s.animations[i].length > source.length) {
        //  source.concat = source.concat(s.animations[i].slice(source.length, s.animations[i].length))
        //}

        for(j = source.length; j--;) {
          // The condition is because some methods return a normal number instead
          // of a SVG.Number
          if(s.animations[i][j] instanceof SVG.Number)
            source[j] = new SVG.Number(source[j])

          s.animations[i][j] = source[j].morph(s.animations[i][j])
        }
      }

      for(i in s.attrs){
        s.attrs[i] = new SVG.MorphObj(this.target().attr(i), s.attrs[i])
      }

      for(i in s.styles){
        s.styles[i] = new SVG.MorphObj(this.target().style(i), s.styles[i])
      }

      s.initialTransformation = this.target().matrixify()

      s.init = true
      return this
    }
  , clearQueue: function(){
      this.situations = []
      return this
    }
  , clearCurrent: function(){
      this.situation = null
      return this
    }
    /** stops the animation immediately
     * @param jumpToEnd A Boolean indicating whether to complete the current animation immediately.
     * @param clearQueue A Boolean indicating whether to remove queued animation as well.
     * @return this
     */
  , stop: function(jumpToEnd, clearQueue){
      var active = this.active
      this.active = false

      if(clearQueue){
        this.clearQueue()
      }

      if(jumpToEnd && this.situation){
        // initialize the situation if it was not
        !active && this.startCurrent()
        this.atEnd()
      }

      this.stopAnimFrame()

      return this.clearCurrent()
    }

    /** resets the element to the state where the current element has started
     * @return this
     */
  , reset: function(){
      if(this.situation){
        var temp = this.situation
        this.stop()
        this.situation = temp
        this.atStart()
      }
      return this
    }

    // Stop the currently-running animation, remove all queued animations, and complete all animations for the element.
  , finish: function(){

      this.stop(true, false)

      while(this.dequeue().situation && this.stop(true, false));

      this.clearQueue().clearCurrent()

      return this
    }

    // set the internal animation pointer at the start position, before any loops, and updates the visualisation
  , atStart: function() {
      return this.at(0, true)
    }

    // set the internal animation pointer at the end position, after all the loops, and updates the visualisation
  , atEnd: function() {
      if (this.situation.loops === true) {
        // If in a infinite loop, we end the current iteration
        this.situation.loops = this.situation.loop + 1
      }

      if(typeof this.situation.loops == 'number') {
        // If performing a finite number of loops, we go after all the loops
        return this.at(this.situation.loops, true)
      } else {
        // If no loops, we just go at the end
        return this.at(1, true)
      }
    }

    // set the internal animation pointer to the specified position and updates the visualisation
    // if isAbsPos is true, pos is treated as an absolute position
  , at: function(pos, isAbsPos){
      var durDivSpd = this.situation.duration/this._speed

      this.absPos = pos
      // If pos is not an absolute position, we convert it into one
      if (!isAbsPos) {
        if (this.situation.reversed) this.absPos = 1 - this.absPos
        this.absPos += this.situation.loop
      }

      this.situation.start = +new Date - this.absPos * durDivSpd
      this.situation.finish = this.situation.start + durDivSpd

      return this.step(true)
    }

    /**
     * sets or returns the speed of the animations
     * @param speed null || Number The new speed of the animations
     * @return Number || this
     */
  , speed: function(speed){
      if (speed === 0) return this.pause()

      if (speed) {
        this._speed = speed
        // We use an absolute position here so that speed can affect the delay before the animation
        return this.at(this.absPos, true)
      } else return this._speed
    }

    // Make loopable
  , loop: function(times, reverse) {
      var c = this.last()

      // store total loops
      c.loops = (times != null) ? times : true
      c.loop = 0

      if(reverse) c.reversing = true
      return this
    }

    // pauses the animation
  , pause: function(){
      this.paused = true
      this.stopAnimFrame()

      return this
    }

    // unpause the animation
  , play: function(){
      if(!this.paused) return this
      this.paused = false
      // We use an absolute position here so that the delay before the animation can be paused
      return this.at(this.absPos, true)
    }

    /**
     * toggle or set the direction of the animation
     * true sets direction to backwards while false sets it to forwards
     * @param reversed Boolean indicating whether to reverse the animation or not (default: toggle the reverse status)
     * @return this
     */
  , reverse: function(reversed){
      var c = this.last()

      if(typeof reversed == 'undefined') c.reversed = !c.reversed
      else c.reversed = reversed

      return this
    }


    /**
     * returns a float from 0-1 indicating the progress of the current animation
     * @param eased Boolean indicating whether the returned position should be eased or not
     * @return number
     */
  , progress: function(easeIt){
      return easeIt ? this.situation.ease(this.pos) : this.pos
    }

    /**
     * adds a callback function which is called when the current animation is finished
     * @param fn Function which should be executed as callback
     * @return number
     */
  , after: function(fn){
      var c = this.last()
        , wrapper = function wrapper(e){
            if(e.detail.situation == c){
              fn.call(this, c)
              this.off('finished.fx', wrapper) // prevent memory leak
            }
          }

      this.target().on('finished.fx', wrapper)

      return this._callStart()
    }

    // adds a callback which is called whenever one animation step is performed
  , during: function(fn){
      var c = this.last()
        , wrapper = function(e){
            if(e.detail.situation == c){
              fn.call(this, e.detail.pos, SVG.morph(e.detail.pos), e.detail.eased, c)
            }
          }

      // see above
      this.target().off('during.fx', wrapper).on('during.fx', wrapper)

      this.after(function(){
        this.off('during.fx', wrapper)
      })

      return this._callStart()
    }

    // calls after ALL animations in the queue are finished
  , afterAll: function(fn){
      var wrapper = function wrapper(e){
            fn.call(this)
            this.off('allfinished.fx', wrapper)
          }

      // see above
      this.target().off('allfinished.fx', wrapper).on('allfinished.fx', wrapper)

      return this._callStart()
    }

    // calls on every animation step for all animations
  , duringAll: function(fn){
      var wrapper = function(e){
            fn.call(this, e.detail.pos, SVG.morph(e.detail.pos), e.detail.eased, e.detail.situation)
          }

      this.target().off('during.fx', wrapper).on('during.fx', wrapper)

      this.afterAll(function(){
        this.off('during.fx', wrapper)
      })

      return this._callStart()
    }

  , last: function(){
      return this.situations.length ? this.situations[this.situations.length-1] : this.situation
    }

    // adds one property to the animations
  , add: function(method, args, type){
      this.last()[type || 'animations'][method] = args
      return this._callStart()
    }

    /** perform one step of the animation
     *  @param ignoreTime Boolean indicating whether to ignore time and use position directly or recalculate position based on time
     *  @return this
     */
  , step: function(ignoreTime){

      // convert current time to an absolute position
      if(!ignoreTime) this.absPos = this.timeToAbsPos(+new Date)

      // This part convert an absolute position to a position
      if(this.situation.loops !== false) {
        var absPos, absPosInt, lastLoop

        // If the absolute position is below 0, we just treat it as if it was 0
        absPos = Math.max(this.absPos, 0)
        absPosInt = Math.floor(absPos)

        if(this.situation.loops === true || absPosInt < this.situation.loops) {
          this.pos = absPos - absPosInt
          lastLoop = this.situation.loop
          this.situation.loop = absPosInt
        } else {
          this.absPos = this.situation.loops
          this.pos = 1
          // The -1 here is because we don't want to toggle reversed when all the loops have been completed
          lastLoop = this.situation.loop - 1
          this.situation.loop = this.situation.loops
        }

        if(this.situation.reversing) {
          // Toggle reversed if an odd number of loops as occured since the last call of step
          this.situation.reversed = this.situation.reversed != Boolean((this.situation.loop - lastLoop) % 2)
        }

      } else {
        // If there are no loop, the absolute position must not be above 1
        this.absPos = Math.min(this.absPos, 1)
        this.pos = this.absPos
      }

      // while the absolute position can be below 0, the position must not be below 0
      if(this.pos < 0) this.pos = 0

      if(this.situation.reversed) this.pos = 1 - this.pos


      // apply easing
      var eased = this.situation.ease(this.pos)

      // call once-callbacks
      for(var i in this.situation.once){
        if(i > this.lastPos && i <= eased){
          this.situation.once[i].call(this.target(), this.pos, eased)
          delete this.situation.once[i]
        }
      }

      // fire during callback with position, eased position and current situation as parameter
      if(this.active) this.target().fire('during', {pos: this.pos, eased: eased, fx: this, situation: this.situation})

      // the user may call stop or finish in the during callback
      // so make sure that we still have a valid situation
      if(!this.situation){
        return this
      }

      // apply the actual animation to every property
      this.eachAt()

      // do final code when situation is finished
      if((this.pos == 1 && !this.situation.reversed) || (this.situation.reversed && this.pos == 0)){

        // stop animation callback
        this.stopAnimFrame()

        // fire finished callback with current situation as parameter
        this.target().fire('finished', {fx:this, situation: this.situation})

        if(!this.situations.length){
          this.target().fire('allfinished')

          // Recheck the length since the user may call animate in the afterAll callback
          if(!this.situations.length){
            this.target().off('.fx') // there shouldnt be any binding left, but to make sure...
            this.active = false
          }
        }

        // start next animation
        if(this.active) this.dequeue()
        else this.clearCurrent()

      }else if(!this.paused && this.active){
        // we continue animating when we are not at the end
        this.startAnimFrame()
      }

      // save last eased position for once callback triggering
      this.lastPos = eased
      return this

    }

    // calculates the step for every property and calls block with it
  , eachAt: function(){
      var i, len, at, self = this, target = this.target(), s = this.situation

      // apply animations which can be called trough a method
      for(i in s.animations){

        at = [].concat(s.animations[i]).map(function(el){
          return typeof el !== 'string' && el.at ? el.at(s.ease(self.pos), self.pos) : el
        })

        target[i].apply(target, at)

      }

      // apply animation which has to be applied with attr()
      for(i in s.attrs){

        at = [i].concat(s.attrs[i]).map(function(el){
          return typeof el !== 'string' && el.at ? el.at(s.ease(self.pos), self.pos) : el
        })

        target.attr.apply(target, at)

      }

      // apply animation which has to be applied with style()
      for(i in s.styles){

        at = [i].concat(s.styles[i]).map(function(el){
          return typeof el !== 'string' && el.at ? el.at(s.ease(self.pos), self.pos) : el
        })

        target.style.apply(target, at)

      }

      // animate initialTransformation which has to be chained
      if(s.transforms.length){

        // get initial initialTransformation
        at = s.initialTransformation
        for(i = 0, len = s.transforms.length; i < len; i++){

          // get next transformation in chain
          var a = s.transforms[i]

          // multiply matrix directly
          if(a instanceof SVG.Matrix){

            if(a.relative){
              at = at.multiply(new SVG.Matrix().morph(a).at(s.ease(this.pos)))
            }else{
              at = at.morph(a).at(s.ease(this.pos))
            }
            continue
          }

          // when transformation is absolute we have to reset the needed transformation first
          if(!a.relative)
            a.undo(at.extract())

          // and reapply it after
          at = at.multiply(a.at(s.ease(this.pos)))

        }

        // set new matrix on element
        target.matrix(at)
      }

      return this

    }


    // adds an once-callback which is called at a specific position and never again
  , once: function(pos, fn, isEased){
      var c = this.last()
      if(!isEased) pos = c.ease(pos)

      c.once[pos] = fn

      return this
    }

  , _callStart: function() {
      setTimeout(function(){this.start()}.bind(this), 0)
      return this
    }

  }

, parent: SVG.Element

  // Add method to parent elements
, construct: {
    // Get fx module or create a new one, then animate with given duration and ease
    animate: function(o, ease, delay) {
      return (this.fx || (this.fx = new SVG.FX(this))).animate(o, ease, delay)
    }
  , delay: function(delay){
      return (this.fx || (this.fx = new SVG.FX(this))).delay(delay)
    }
  , stop: function(jumpToEnd, clearQueue) {
      if (this.fx)
        this.fx.stop(jumpToEnd, clearQueue)

      return this
    }
  , finish: function() {
      if (this.fx)
        this.fx.finish()

      return this
    }
    // Pause current animation
  , pause: function() {
      if (this.fx)
        this.fx.pause()

      return this
    }
    // Play paused current animation
  , play: function() {
      if (this.fx)
        this.fx.play()

      return this
    }
    // Set/Get the speed of the animations
  , speed: function(speed) {
      if (this.fx)
        if (speed == null)
          return this.fx.speed()
        else
          this.fx.speed(speed)

      return this
    }
  }

})

// MorphObj is used whenever no morphable object is given
SVG.MorphObj = SVG.invent({

  create: function(from, to){
    // prepare color for morphing
    if(SVG.Color.isColor(to)) return new SVG.Color(from).morph(to)
    // prepare value list for morphing
    if(SVG.regex.delimiter.test(from)) return new SVG.Array(from).morph(to)
    // prepare number for morphing
    if(SVG.regex.numberAndUnit.test(to)) return new SVG.Number(from).morph(to)

    // prepare for plain morphing
    this.value = from
    this.destination = to
  }

, extend: {
    at: function(pos, real){
      return real < 1 ? this.value : this.destination
    },

    valueOf: function(){
      return this.value
    }
  }

})

SVG.extend(SVG.FX, {
  // Add animatable attributes
  attr: function(a, v, relative) {
    // apply attributes individually
    if (typeof a == 'object') {
      for (var key in a)
        this.attr(key, a[key])

    } else {
      this.add(a, v, 'attrs')
    }

    return this
  }
  // Add animatable styles
, style: function(s, v) {
    if (typeof s == 'object')
      for (var key in s)
        this.style(key, s[key])

    else
      this.add(s, v, 'styles')

    return this
  }
  // Animatable x-axis
, x: function(x, relative) {
    if(this.target() instanceof SVG.G){
      this.transform({x:x}, relative)
      return this
    }

    var num = new SVG.Number(x)
    num.relative = relative
    return this.add('x', num)
  }
  // Animatable y-axis
, y: function(y, relative) {
    if(this.target() instanceof SVG.G){
      this.transform({y:y}, relative)
      return this
    }

    var num = new SVG.Number(y)
    num.relative = relative
    return this.add('y', num)
  }
  // Animatable center x-axis
, cx: function(x) {
    return this.add('cx', new SVG.Number(x))
  }
  // Animatable center y-axis
, cy: function(y) {
    return this.add('cy', new SVG.Number(y))
  }
  // Add animatable move
, move: function(x, y) {
    return this.x(x).y(y)
  }
  // Add animatable center
, center: function(x, y) {
    return this.cx(x).cy(y)
  }
  // Add animatable size
, size: function(width, height) {
    if (this.target() instanceof SVG.Text) {
      // animate font size for Text elements
      this.attr('font-size', width)

    } else {
      // animate bbox based size for all other elements
      var box

      if(!width || !height){
        box = this.target().bbox()
      }

      if(!width){
        width = box.width / box.height  * height
      }

      if(!height){
        height = box.height / box.width  * width
      }

      this.add('width' , new SVG.Number(width))
          .add('height', new SVG.Number(height))

    }

    return this
  }
  // Add animatable width
, width: function(width) {
    return this.add('width', new SVG.Number(width))
  }
  // Add animatable height
, height: function(height) {
    return this.add('height', new SVG.Number(height))
  }
  // Add animatable plot
, plot: function(a, b, c, d) {
    // Lines can be plotted with 4 arguments
    if(arguments.length == 4) {
      return this.plot([a, b, c, d])
    }

    return this.add('plot', new (this.target().morphArray)(a))
  }
  // Add leading method
, leading: function(value) {
    return this.target().leading ?
      this.add('leading', new SVG.Number(value)) :
      this
  }
  // Add animatable viewbox
, viewbox: function(x, y, width, height) {
    if (this.target() instanceof SVG.Container) {
      this.add('viewbox', new SVG.ViewBox(x, y, width, height))
    }

    return this
  }
, update: function(o) {
    if (this.target() instanceof SVG.Stop) {
      if (typeof o == 'number' || o instanceof SVG.Number) {
        return this.update({
          offset:  arguments[0]
        , color:   arguments[1]
        , opacity: arguments[2]
        })
      }

      if (o.opacity != null) this.attr('stop-opacity', o.opacity)
      if (o.color   != null) this.attr('stop-color', o.color)
      if (o.offset  != null) this.attr('offset', o.offset)
    }

    return this
  }
})

SVG.Box = SVG.invent({
  create: function(x, y, width, height) {
    if (typeof x == 'object' && !(x instanceof SVG.Element)) {
      // chromes getBoundingClientRect has no x and y property
      return SVG.Box.call(this, x.left != null ? x.left : x.x , x.top != null ? x.top : x.y, x.width, x.height)
    } else if (arguments.length == 4) {
      this.x = x
      this.y = y
      this.width = width
      this.height = height
    }

    // add center, right, bottom...
    fullBox(this)
  }
, extend: {
    // Merge rect box with another, return a new instance
    merge: function(box) {
      var b = new this.constructor()

      // merge boxes
      b.x      = Math.min(this.x, box.x)
      b.y      = Math.min(this.y, box.y)
      b.width  = Math.max(this.x + this.width,  box.x + box.width)  - b.x
      b.height = Math.max(this.y + this.height, box.y + box.height) - b.y

      return fullBox(b)
    }

  , transform: function(m) {
      var xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, p, bbox

      var pts = [
        new SVG.Point(this.x, this.y),
        new SVG.Point(this.x2, this.y),
        new SVG.Point(this.x, this.y2),
        new SVG.Point(this.x2, this.y2)
      ]

      pts.forEach(function(p) {
        p = p.transform(m)
        xMin = Math.min(xMin,p.x)
        xMax = Math.max(xMax,p.x)
        yMin = Math.min(yMin,p.y)
        yMax = Math.max(yMax,p.y)
      })

      bbox = new this.constructor()
      bbox.x = xMin
      bbox.width = xMax-xMin
      bbox.y = yMin
      bbox.height = yMax-yMin

      fullBox(bbox)

      return bbox
    }
  }
})

SVG.BBox = SVG.invent({
  // Initialize
  create: function(element) {
    SVG.Box.apply(this, [].slice.call(arguments))

    // get values if element is given
    if (element instanceof SVG.Element) {
      var box

      // yes this is ugly, but Firefox can be a bitch when it comes to elements that are not yet rendered
      try {

        if (!document.documentElement.contains){
          // This is IE - it does not support contains() for top-level SVGs
          var topParent = element.node
          while (topParent.parentNode){
            topParent = topParent.parentNode
          }
          if (topParent != document) throw new Exception('Element not in the dom')
        } else {
          // the element is NOT in the dom, throw error
          if(!document.documentElement.contains(element.node)) throw new Exception('Element not in the dom')
        }

        // find native bbox
        box = element.node.getBBox()
      } catch(e) {
        if(element instanceof SVG.Shape){
          var clone = element.clone(SVG.parser.draw.instance).show()
          box = clone.node.getBBox()
          clone.remove()
        }else{
          box = {
            x:      element.node.clientLeft
          , y:      element.node.clientTop
          , width:  element.node.clientWidth
          , height: element.node.clientHeight
          }
        }
      }

      SVG.Box.call(this, box)
    }

  }

  // Define ancestor
, inherit: SVG.Box

  // Define Parent
, parent: SVG.Element

  // Constructor
, construct: {
    // Get bounding box
    bbox: function() {
      return new SVG.BBox(this)
    }
  }

})

SVG.BBox.prototype.constructor = SVG.BBox


SVG.extend(SVG.Element, {
  tbox: function(){
    console.warn('Use of TBox is deprecated and mapped to RBox. Use .rbox() instead.')
    return this.rbox(this.doc())
  }
})

SVG.RBox = SVG.invent({
  // Initialize
  create: function(element) {
    SVG.Box.apply(this, [].slice.call(arguments))

    if (element instanceof SVG.Element) {
      SVG.Box.call(this, element.node.getBoundingClientRect())
    }
  }

, inherit: SVG.Box

  // define Parent
, parent: SVG.Element

, extend: {
    addOffset: function() {
      // offset by window scroll position, because getBoundingClientRect changes when window is scrolled
      this.x += window.pageXOffset
      this.y += window.pageYOffset
      return this
    }
  }

  // Constructor
, construct: {
    // Get rect box
    rbox: function(el) {
      if (el) return new SVG.RBox(this).transform(el.screenCTM().inverse())
      return new SVG.RBox(this).addOffset()
    }
  }

})

SVG.RBox.prototype.constructor = SVG.RBox

SVG.Matrix = SVG.invent({
  // Initialize
  create: function(source) {
    var i, base = arrayToMatrix([1, 0, 0, 1, 0, 0])

    // ensure source as object
    source = source instanceof SVG.Element ?
      source.matrixify() :
    typeof source === 'string' ?
      arrayToMatrix(source.split(SVG.regex.delimiter).map(parseFloat)) :
    arguments.length == 6 ?
      arrayToMatrix([].slice.call(arguments)) :
    Array.isArray(source) ?
      arrayToMatrix(source) :
    typeof source === 'object' ?
      source : base

    // merge source
    for (i = abcdef.length - 1; i >= 0; --i)
      this[abcdef[i]] = source[abcdef[i]] != null ?
        source[abcdef[i]] : base[abcdef[i]]
  }

  // Add methods
, extend: {
    // Extract individual transformations
    extract: function() {
      // find delta transform points
      var px    = deltaTransformPoint(this, 0, 1)
        , py    = deltaTransformPoint(this, 1, 0)
        , skewX = 180 / Math.PI * Math.atan2(px.y, px.x) - 90

      return {
        // translation
        x:        this.e
      , y:        this.f
      , transformedX:(this.e * Math.cos(skewX * Math.PI / 180) + this.f * Math.sin(skewX * Math.PI / 180)) / Math.sqrt(this.a * this.a + this.b * this.b)
      , transformedY:(this.f * Math.cos(skewX * Math.PI / 180) + this.e * Math.sin(-skewX * Math.PI / 180)) / Math.sqrt(this.c * this.c + this.d * this.d)
        // skew
      , skewX:    -skewX
      , skewY:    180 / Math.PI * Math.atan2(py.y, py.x)
        // scale
      , scaleX:   Math.sqrt(this.a * this.a + this.b * this.b)
      , scaleY:   Math.sqrt(this.c * this.c + this.d * this.d)
        // rotation
      , rotation: skewX
      , a: this.a
      , b: this.b
      , c: this.c
      , d: this.d
      , e: this.e
      , f: this.f
      , matrix: new SVG.Matrix(this)
      }
    }
    // Clone matrix
  , clone: function() {
      return new SVG.Matrix(this)
    }
    // Morph one matrix into another
  , morph: function(matrix) {
      // store new destination
      this.destination = new SVG.Matrix(matrix)

      return this
    }
    // Get morphed matrix at a given position
  , at: function(pos) {
      // make sure a destination is defined
      if (!this.destination) return this

      // calculate morphed matrix at a given position
      var matrix = new SVG.Matrix({
        a: this.a + (this.destination.a - this.a) * pos
      , b: this.b + (this.destination.b - this.b) * pos
      , c: this.c + (this.destination.c - this.c) * pos
      , d: this.d + (this.destination.d - this.d) * pos
      , e: this.e + (this.destination.e - this.e) * pos
      , f: this.f + (this.destination.f - this.f) * pos
      })

      return matrix
    }
    // Multiplies by given matrix
  , multiply: function(matrix) {
      return new SVG.Matrix(this.native().multiply(parseMatrix(matrix).native()))
    }
    // Inverses matrix
  , inverse: function() {
      return new SVG.Matrix(this.native().inverse())
    }
    // Translate matrix
  , translate: function(x, y) {
      return new SVG.Matrix(this.native().translate(x || 0, y || 0))
    }
    // Scale matrix
  , scale: function(x, y, cx, cy) {
      // support uniformal scale
      if (arguments.length == 1) {
        y = x
      } else if (arguments.length == 3) {
        cy = cx
        cx = y
        y = x
      }

      return this.around(cx, cy, new SVG.Matrix(x, 0, 0, y, 0, 0))
    }
    // Rotate matrix
  , rotate: function(r, cx, cy) {
      // convert degrees to radians
      r = SVG.utils.radians(r)

      return this.around(cx, cy, new SVG.Matrix(Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0))
    }
    // Flip matrix on x or y, at a given offset
  , flip: function(a, o) {
      return a == 'x' ?
          this.scale(-1, 1, o, 0) :
        a == 'y' ?
          this.scale(1, -1, 0, o) :
          this.scale(-1, -1, a, o != null ? o : a)
    }
    // Skew
  , skew: function(x, y, cx, cy) {
      // support uniformal skew
      if (arguments.length == 1) {
        y = x
      } else if (arguments.length == 3) {
        cy = cx
        cx = y
        y = x
      }

      // convert degrees to radians
      x = SVG.utils.radians(x)
      y = SVG.utils.radians(y)

      return this.around(cx, cy, new SVG.Matrix(1, Math.tan(y), Math.tan(x), 1, 0, 0))
    }
    // SkewX
  , skewX: function(x, cx, cy) {
      return this.skew(x, 0, cx, cy)
    }
    // SkewY
  , skewY: function(y, cx, cy) {
      return this.skew(0, y, cx, cy)
    }
    // Transform around a center point
  , around: function(cx, cy, matrix) {
      return this
        .multiply(new SVG.Matrix(1, 0, 0, 1, cx || 0, cy || 0))
        .multiply(matrix)
        .multiply(new SVG.Matrix(1, 0, 0, 1, -cx || 0, -cy || 0))
    }
    // Convert to native SVGMatrix
  , native: function() {
      // create new matrix
      var matrix = SVG.parser.native.createSVGMatrix()

      // update with current values
      for (var i = abcdef.length - 1; i >= 0; i--)
        matrix[abcdef[i]] = this[abcdef[i]]

      return matrix
    }
    // Convert matrix to string
  , toString: function() {
      return 'matrix(' + this.a + ',' + this.b + ',' + this.c + ',' + this.d + ',' + this.e + ',' + this.f + ')'
    }
  }

  // Define parent
, parent: SVG.Element

  // Add parent method
, construct: {
    // Get current matrix
    ctm: function() {
      return new SVG.Matrix(this.node.getCTM())
    },
    // Get current screen matrix
    screenCTM: function() {
      /* https://bugzilla.mozilla.org/show_bug.cgi?id=1344537
         This is needed because FF does not return the transformation matrix
         for the inner coordinate system when getScreenCTM() is called on nested svgs.
         However all other Browsers do that */
      if(this instanceof SVG.Nested) {
        var rect = this.rect(1,1)
        var m = rect.node.getScreenCTM()
        rect.remove()
        return new SVG.Matrix(m)
      }
      return new SVG.Matrix(this.node.getScreenCTM())
    }

  }

})

SVG.Point = SVG.invent({
  // Initialize
  create: function(x,y) {
    var i, source, base = {x:0, y:0}

    // ensure source as object
    source = Array.isArray(x) ?
      {x:x[0], y:x[1]} :
    typeof x === 'object' ?
      {x:x.x, y:x.y} :
    x != null ?
      {x:x, y:(y != null ? y : x)} : base // If y has no value, then x is used has its value

    // merge source
    this.x = source.x
    this.y = source.y
  }

  // Add methods
, extend: {
    // Clone point
    clone: function() {
      return new SVG.Point(this)
    }
    // Morph one point into another
  , morph: function(x, y) {
      // store new destination
      this.destination = new SVG.Point(x, y)

      return this
    }
    // Get morphed point at a given position
  , at: function(pos) {
      // make sure a destination is defined
      if (!this.destination) return this

      // calculate morphed matrix at a given position
      var point = new SVG.Point({
        x: this.x + (this.destination.x - this.x) * pos
      , y: this.y + (this.destination.y - this.y) * pos
      })

      return point
    }
    // Convert to native SVGPoint
  , native: function() {
      // create new point
      var point = SVG.parser.native.createSVGPoint()

      // update with current values
      point.x = this.x
      point.y = this.y

      return point
    }
    // transform point with matrix
  , transform: function(matrix) {
      return new SVG.Point(this.native().matrixTransform(matrix.native()))
    }

  }

})

SVG.extend(SVG.Element, {

  // Get point
  point: function(x, y) {
    return new SVG.Point(x,y).transform(this.screenCTM().inverse());
  }

})

SVG.extend(SVG.Element, {
  // Set svg element attribute
  attr: function(a, v, n) {
    // act as full getter
    if (a == null) {
      // get an object of attributes
      a = {}
      v = this.node.attributes
      for (n = v.length - 1; n >= 0; n--)
        a[v[n].nodeName] = SVG.regex.isNumber.test(v[n].nodeValue) ? parseFloat(v[n].nodeValue) : v[n].nodeValue

      return a

    } else if (typeof a == 'object') {
      // apply every attribute individually if an object is passed
      for (v in a) this.attr(v, a[v])

    } else if (v === null) {
        // remove value
        this.node.removeAttribute(a)

    } else if (v == null) {
      // act as a getter if the first and only argument is not an object
      v = this.node.getAttribute(a)
      return v == null ?
        SVG.defaults.attrs[a] :
      SVG.regex.isNumber.test(v) ?
        parseFloat(v) : v

    } else {
      // BUG FIX: some browsers will render a stroke if a color is given even though stroke width is 0
      if (a == 'stroke-width')
        this.attr('stroke', parseFloat(v) > 0 ? this._stroke : null)
      else if (a == 'stroke')
        this._stroke = v

      // convert image fill and stroke to patterns
      if (a == 'fill' || a == 'stroke') {
        if (SVG.regex.isImage.test(v))
          v = this.doc().defs().image(v, 0, 0)

        if (v instanceof SVG.Image)
          v = this.doc().defs().pattern(0, 0, function() {
            this.add(v)
          })
      }

      // ensure correct numeric values (also accepts NaN and Infinity)
      if (typeof v === 'number')
        v = new SVG.Number(v)

      // ensure full hex color
      else if (SVG.Color.isColor(v))
        v = new SVG.Color(v)

      // parse array values
      else if (Array.isArray(v))
        v = new SVG.Array(v)

      // if the passed attribute is leading...
      if (a == 'leading') {
        // ... call the leading method instead
        if (this.leading)
          this.leading(v)
      } else {
        // set given attribute on node
        typeof n === 'string' ?
          this.node.setAttributeNS(n, a, v.toString()) :
          this.node.setAttribute(a, v.toString())
      }

      // rebuild if required
      if (this.rebuild && (a == 'font-size' || a == 'x'))
        this.rebuild(a, v)
    }

    return this
  }
})
SVG.extend(SVG.Element, {
  // Add transformations
  transform: function(o, relative) {
    // get target in case of the fx module, otherwise reference this
    var target = this
      , matrix, bbox

    // act as a getter
    if (typeof o !== 'object') {
      // get current matrix
      matrix = new SVG.Matrix(target).extract()

      return typeof o === 'string' ? matrix[o] : matrix
    }

    // get current matrix
    matrix = new SVG.Matrix(target)

    // ensure relative flag
    relative = !!relative || !!o.relative

    // act on matrix
    if (o.a != null) {
      matrix = relative ?
        // relative
        matrix.multiply(new SVG.Matrix(o)) :
        // absolute
        new SVG.Matrix(o)

    // act on rotation
    } else if (o.rotation != null) {
      // ensure centre point
      ensureCentre(o, target)

      // apply transformation
      matrix = relative ?
        // relative
        matrix.rotate(o.rotation, o.cx, o.cy) :
        // absolute
        matrix.rotate(o.rotation - matrix.extract().rotation, o.cx, o.cy)

    // act on scale
    } else if (o.scale != null || o.scaleX != null || o.scaleY != null) {
      // ensure centre point
      ensureCentre(o, target)

      // ensure scale values on both axes
      o.scaleX = o.scale != null ? o.scale : o.scaleX != null ? o.scaleX : 1
      o.scaleY = o.scale != null ? o.scale : o.scaleY != null ? o.scaleY : 1

      if (!relative) {
        // absolute; multiply inversed values
        var e = matrix.extract()
        o.scaleX = o.scaleX * 1 / e.scaleX
        o.scaleY = o.scaleY * 1 / e.scaleY
      }

      matrix = matrix.scale(o.scaleX, o.scaleY, o.cx, o.cy)

    // act on skew
    } else if (o.skew != null || o.skewX != null || o.skewY != null) {
      // ensure centre point
      ensureCentre(o, target)

      // ensure skew values on both axes
      o.skewX = o.skew != null ? o.skew : o.skewX != null ? o.skewX : 0
      o.skewY = o.skew != null ? o.skew : o.skewY != null ? o.skewY : 0

      if (!relative) {
        // absolute; reset skew values
        var e = matrix.extract()
        matrix = matrix.multiply(new SVG.Matrix().skew(e.skewX, e.skewY, o.cx, o.cy).inverse())
      }

      matrix = matrix.skew(o.skewX, o.skewY, o.cx, o.cy)

    // act on flip
    } else if (o.flip) {
      if(o.flip == 'x' || o.flip == 'y') {
        o.offset = o.offset == null ? target.bbox()['c' + o.flip] : o.offset
      } else {
        if(o.offset == null) {
          bbox = target.bbox()
          o.flip = bbox.cx
          o.offset = bbox.cy
        } else {
          o.flip = o.offset
        }
      }

      matrix = new SVG.Matrix().flip(o.flip, o.offset)

    // act on translate
    } else if (o.x != null || o.y != null) {
      if (relative) {
        // relative
        matrix = matrix.translate(o.x, o.y)
      } else {
        // absolute
        if (o.x != null) matrix.e = o.x
        if (o.y != null) matrix.f = o.y
      }
    }

    return this.attr('transform', matrix)
  }
})

SVG.extend(SVG.FX, {
  transform: function(o, relative) {
    // get target in case of the fx module, otherwise reference this
    var target = this.target()
      , matrix, bbox

    // act as a getter
    if (typeof o !== 'object') {
      // get current matrix
      matrix = new SVG.Matrix(target).extract()

      return typeof o === 'string' ? matrix[o] : matrix
    }

    // ensure relative flag
    relative = !!relative || !!o.relative

    // act on matrix
    if (o.a != null) {
      matrix = new SVG.Matrix(o)

    // act on rotation
    } else if (o.rotation != null) {
      // ensure centre point
      ensureCentre(o, target)

      // apply transformation
      matrix = new SVG.Rotate(o.rotation, o.cx, o.cy)

    // act on scale
    } else if (o.scale != null || o.scaleX != null || o.scaleY != null) {
      // ensure centre point
      ensureCentre(o, target)

      // ensure scale values on both axes
      o.scaleX = o.scale != null ? o.scale : o.scaleX != null ? o.scaleX : 1
      o.scaleY = o.scale != null ? o.scale : o.scaleY != null ? o.scaleY : 1

      matrix = new SVG.Scale(o.scaleX, o.scaleY, o.cx, o.cy)

    // act on skew
    } else if (o.skewX != null || o.skewY != null) {
      // ensure centre point
      ensureCentre(o, target)

      // ensure skew values on both axes
      o.skewX = o.skewX != null ? o.skewX : 0
      o.skewY = o.skewY != null ? o.skewY : 0

      matrix = new SVG.Skew(o.skewX, o.skewY, o.cx, o.cy)

    // act on flip
    } else if (o.flip) {
      if(o.flip == 'x' || o.flip == 'y') {
        o.offset = o.offset == null ? target.bbox()['c' + o.flip] : o.offset
      } else {
        if(o.offset == null) {
          bbox = target.bbox()
          o.flip = bbox.cx
          o.offset = bbox.cy
        } else {
          o.flip = o.offset
        }
      }

      matrix = new SVG.Matrix().flip(o.flip, o.offset)

    // act on translate
    } else if (o.x != null || o.y != null) {
      matrix = new SVG.Translate(o.x, o.y)
    }

    if(!matrix) return this

    matrix.relative = relative

    this.last().transforms.push(matrix)

    return this._callStart()
  }
})

SVG.extend(SVG.Element, {
  // Reset all transformations
  untransform: function() {
    return this.attr('transform', null)
  },
  // merge the whole transformation chain into one matrix and returns it
  matrixify: function() {

    var matrix = (this.attr('transform') || '')
      // split transformations
      .split(SVG.regex.transforms).slice(0,-1).map(function(str){
        // generate key => value pairs
        var kv = str.trim().split('(')
        return [kv[0], kv[1].split(SVG.regex.delimiter).map(function(str){ return parseFloat(str) })]
      })
      // merge every transformation into one matrix
      .reduce(function(matrix, transform){

        if(transform[0] == 'matrix') return matrix.multiply(arrayToMatrix(transform[1]))
        return matrix[transform[0]].apply(matrix, transform[1])

      }, new SVG.Matrix())

    return matrix
  },
  // add an element to another parent without changing the visual representation on the screen
  toParent: function(parent) {
    if(this == parent) return this
    var ctm = this.screenCTM()
    var pCtm = parent.screenCTM().inverse()

    this.addTo(parent).untransform().transform(pCtm.multiply(ctm))

    return this
  },
  // same as above with parent equals root-svg
  toDoc: function() {
    return this.toParent(this.doc())
  }

})

SVG.Transformation = SVG.invent({

  create: function(source, inversed){

    if(arguments.length > 1 && typeof inversed != 'boolean'){
      return this.constructor.call(this, [].slice.call(arguments))
    }

    if(Array.isArray(source)){
      for(var i = 0, len = this.arguments.length; i < len; ++i){
        this[this.arguments[i]] = source[i]
      }
    } else if(typeof source == 'object'){
      for(var i = 0, len = this.arguments.length; i < len; ++i){
        this[this.arguments[i]] = source[this.arguments[i]]
      }
    }

    this.inversed = false

    if(inversed === true){
      this.inversed = true
    }

  }

, extend: {

    arguments: []
  , method: ''

  , at: function(pos){

      var params = []

      for(var i = 0, len = this.arguments.length; i < len; ++i){
        params.push(this[this.arguments[i]])
      }

      var m = this._undo || new SVG.Matrix()

      m = new SVG.Matrix().morph(SVG.Matrix.prototype[this.method].apply(m, params)).at(pos)

      return this.inversed ? m.inverse() : m

    }

  , undo: function(o){
      for(var i = 0, len = this.arguments.length; i < len; ++i){
        o[this.arguments[i]] = typeof this[this.arguments[i]] == 'undefined' ? 0 : o[this.arguments[i]]
      }

      // The method SVG.Matrix.extract which was used before calling this
      // method to obtain a value for the parameter o doesn't return a cx and
      // a cy so we use the ones that were provided to this object at its creation
      o.cx = this.cx
      o.cy = this.cy

      this._undo = new SVG[capitalize(this.method)](o, true).at(1)

      return this
    }

  }

})

SVG.Translate = SVG.invent({

  parent: SVG.Matrix
, inherit: SVG.Transformation

, create: function(source, inversed){
    this.constructor.apply(this, [].slice.call(arguments))
  }

, extend: {
    arguments: ['transformedX', 'transformedY']
  , method: 'translate'
  }

})

SVG.Rotate = SVG.invent({

  parent: SVG.Matrix
, inherit: SVG.Transformation

, create: function(source, inversed){
    this.constructor.apply(this, [].slice.call(arguments))
  }

, extend: {
    arguments: ['rotation', 'cx', 'cy']
  , method: 'rotate'
  , at: function(pos){
      var m = new SVG.Matrix().rotate(new SVG.Number().morph(this.rotation - (this._undo ? this._undo.rotation : 0)).at(pos), this.cx, this.cy)
      return this.inversed ? m.inverse() : m
    }
  , undo: function(o){
      this._undo = o
      return this
    }
  }

})

SVG.Scale = SVG.invent({

  parent: SVG.Matrix
, inherit: SVG.Transformation

, create: function(source, inversed){
    this.constructor.apply(this, [].slice.call(arguments))
  }

, extend: {
    arguments: ['scaleX', 'scaleY', 'cx', 'cy']
  , method: 'scale'
  }

})

SVG.Skew = SVG.invent({

  parent: SVG.Matrix
, inherit: SVG.Transformation

, create: function(source, inversed){
    this.constructor.apply(this, [].slice.call(arguments))
  }

, extend: {
    arguments: ['skewX', 'skewY', 'cx', 'cy']
  , method: 'skew'
  }

})

SVG.extend(SVG.Element, {
  // Dynamic style generator
  style: function(s, v) {
    if (arguments.length == 0) {
      // get full style
      return this.node.style.cssText || ''

    } else if (arguments.length < 2) {
      // apply every style individually if an object is passed
      if (typeof s == 'object') {
        for (v in s) this.style(v, s[v])

      } else if (SVG.regex.isCss.test(s)) {
        // parse css string
        s = s.split(/\s*;\s*/)
          // filter out suffix ; and stuff like ;;
          .filter(function(e) { return !!e })
          .map(function(e){ return e.split(/\s*:\s*/) })

        // apply every definition individually
        while (v = s.pop()) {
          this.style(v[0], v[1])
        }
      } else {
        // act as a getter if the first and only argument is not an object
        return this.node.style[camelCase(s)]
      }

    } else {
      this.node.style[camelCase(s)] = v === null || SVG.regex.isBlank.test(v) ? '' : v
    }

    return this
  }
})
SVG.Parent = SVG.invent({
  // Initialize node
  create: function(element) {
    this.constructor.call(this, element)
  }

  // Inherit from
, inherit: SVG.Element

  // Add class methods
, extend: {
    // Returns all child elements
    children: function() {
      return SVG.utils.map(SVG.utils.filterSVGElements(this.node.childNodes), function(node) {
        return SVG.adopt(node)
      })
    }
    // Add given element at a position
  , add: function(element, i) {
      if (i == null)
        this.node.appendChild(element.node)
      else if (element.node != this.node.childNodes[i])
        this.node.insertBefore(element.node, this.node.childNodes[i])

      return this
    }
    // Basically does the same as `add()` but returns the added element instead
  , put: function(element, i) {
      this.add(element, i)
      return element
    }
    // Checks if the given element is a child
  , has: function(element) {
      return this.index(element) >= 0
    }
    // Gets index of given element
  , index: function(element) {
      return [].slice.call(this.node.childNodes).indexOf(element.node)
    }
    // Get a element at the given index
  , get: function(i) {
      return SVG.adopt(this.node.childNodes[i])
    }
    // Get first child
  , first: function() {
      return this.get(0)
    }
    // Get the last child
  , last: function() {
      return this.get(this.node.childNodes.length - 1)
    }
    // Iterates over all children and invokes a given block
  , each: function(block, deep) {
      var i, il
        , children = this.children()

      for (i = 0, il = children.length; i < il; i++) {
        if (children[i] instanceof SVG.Element)
          block.apply(children[i], [i, children])

        if (deep && (children[i] instanceof SVG.Container))
          children[i].each(block, deep)
      }

      return this
    }
    // Remove a given child
  , removeElement: function(element) {
      this.node.removeChild(element.node)

      return this
    }
    // Remove all elements in this container
  , clear: function() {
      // remove children
      while(this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild)

      // remove defs reference
      delete this._defs

      return this
    }
  , // Get defs
    defs: function() {
      return this.doc().defs()
    }
  }

})

SVG.extend(SVG.Parent, {

  ungroup: function(parent, depth) {
    if(depth === 0 || this instanceof SVG.Defs || this.node == SVG.parser.draw) return this

    parent = parent || (this instanceof SVG.Doc ? this : this.parent(SVG.Parent))
    depth = depth || Infinity

    this.each(function(){
      if(this instanceof SVG.Defs) return this
      if(this instanceof SVG.Parent) return this.ungroup(parent, depth-1)
      return this.toParent(parent)
    })

    this.node.firstChild || this.remove()

    return this
  },

  flatten: function(parent, depth) {
    return this.ungroup(parent, depth)
  }

})
SVG.Container = SVG.invent({
  // Initialize node
  create: function(element) {
    this.constructor.call(this, element)
  }

  // Inherit from
, inherit: SVG.Parent

})

SVG.ViewBox = SVG.invent({

  create: function(source) {
    var i, base = [0, 0, 0, 0]

    var x, y, width, height, box, view, we, he
      , wm   = 1 // width multiplier
      , hm   = 1 // height multiplier
      , reg  = /[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi

    if(source instanceof SVG.Element){

      we = source
      he = source
      view = (source.attr('viewBox') || '').match(reg)
      box = source.bbox

      // get dimensions of current node
      width  = new SVG.Number(source.width())
      height = new SVG.Number(source.height())

      // find nearest non-percentual dimensions
      while (width.unit == '%') {
        wm *= width.value
        width = new SVG.Number(we instanceof SVG.Doc ? we.parent().offsetWidth : we.parent().width())
        we = we.parent()
      }
      while (height.unit == '%') {
        hm *= height.value
        height = new SVG.Number(he instanceof SVG.Doc ? he.parent().offsetHeight : he.parent().height())
        he = he.parent()
      }

      // ensure defaults
      this.x      = 0
      this.y      = 0
      this.width  = width  * wm
      this.height = height * hm
      this.zoom   = 1

      if (view) {
        // get width and height from viewbox
        x      = parseFloat(view[0])
        y      = parseFloat(view[1])
        width  = parseFloat(view[2])
        height = parseFloat(view[3])

        // calculate zoom accoring to viewbox
        this.zoom = ((this.width / this.height) > (width / height)) ?
          this.height / height :
          this.width  / width

        // calculate real pixel dimensions on parent SVG.Doc element
        this.x      = x
        this.y      = y
        this.width  = width
        this.height = height

      }

    }else{

      // ensure source as object
      source = typeof source === 'string' ?
        source.match(reg).map(function(el){ return parseFloat(el) }) :
      Array.isArray(source) ?
        source :
      typeof source == 'object' ?
        [source.x, source.y, source.width, source.height] :
      arguments.length == 4 ?
        [].slice.call(arguments) :
        base

      this.x = source[0]
      this.y = source[1]
      this.width = source[2]
      this.height = source[3]
    }


  }

, extend: {

    toString: function() {
      return this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height
    }
  , morph: function(x, y, width, height){
      this.destination = new SVG.ViewBox(x, y, width, height)
      return this
    }

  , at: function(pos) {

      if(!this.destination) return this

      return new SVG.ViewBox([
          this.x + (this.destination.x - this.x) * pos
        , this.y + (this.destination.y - this.y) * pos
        , this.width + (this.destination.width - this.width) * pos
        , this.height + (this.destination.height - this.height) * pos
      ])

    }

  }

  // Define parent
, parent: SVG.Container

  // Add parent method
, construct: {

    // get/set viewbox
    viewbox: function(x, y, width, height) {
      if (arguments.length == 0)
        // act as a getter if there are no arguments
        return new SVG.ViewBox(this)

      // otherwise act as a setter
      return this.attr('viewBox', new SVG.ViewBox(x, y, width, height))
    }

  }

})
// Add events to elements
;[  'click'
  , 'dblclick'
  , 'mousedown'
  , 'mouseup'
  , 'mouseover'
  , 'mouseout'
  , 'mousemove'
  // , 'mouseenter' -> not supported by IE
  // , 'mouseleave' -> not supported by IE
  , 'touchstart'
  , 'touchmove'
  , 'touchleave'
  , 'touchend'
  , 'touchcancel' ].forEach(function(event) {

  // add event to SVG.Element
  SVG.Element.prototype[event] = function(f) {
    // bind event to element rather than element node
    SVG.on(this.node, event, f)
    return this
  }
})

// Initialize listeners stack
SVG.listeners = []
SVG.handlerMap = []
SVG.listenerId = 0

// Add event binder in the SVG namespace
SVG.on = function(node, event, listener, binding, options) {
  // create listener, get object-index
  var l     = listener.bind(binding || node.instance || node)
    , index = (SVG.handlerMap.indexOf(node) + 1 || SVG.handlerMap.push(node)) - 1
    , ev    = event.split('.')[0]
    , ns    = event.split('.')[1] || '*'


  // ensure valid object
  SVG.listeners[index]         = SVG.listeners[index]         || {}
  SVG.listeners[index][ev]     = SVG.listeners[index][ev]     || {}
  SVG.listeners[index][ev][ns] = SVG.listeners[index][ev][ns] || {}

  if(!listener._svgjsListenerId)
    listener._svgjsListenerId = ++SVG.listenerId

  // reference listener
  SVG.listeners[index][ev][ns][listener._svgjsListenerId] = l

  // add listener
  node.addEventListener(ev, l, options || false)
}

// Add event unbinder in the SVG namespace
SVG.off = function(node, event, listener) {
  var index = SVG.handlerMap.indexOf(node)
    , ev    = event && event.split('.')[0]
    , ns    = event && event.split('.')[1]
    , namespace = ''

  if(index == -1) return

  if (listener) {
    if(typeof listener == 'function') listener = listener._svgjsListenerId
    if(!listener) return

    // remove listener reference
    if (SVG.listeners[index][ev] && SVG.listeners[index][ev][ns || '*']) {
      // remove listener
      node.removeEventListener(ev, SVG.listeners[index][ev][ns || '*'][listener], false)

      delete SVG.listeners[index][ev][ns || '*'][listener]
    }

  } else if (ns && ev) {
    // remove all listeners for a namespaced event
    if (SVG.listeners[index][ev] && SVG.listeners[index][ev][ns]) {
      for (listener in SVG.listeners[index][ev][ns])
        SVG.off(node, [ev, ns].join('.'), listener)

      delete SVG.listeners[index][ev][ns]
    }

  } else if (ns){
    // remove all listeners for a specific namespace
    for(event in SVG.listeners[index]){
        for(namespace in SVG.listeners[index][event]){
            if(ns === namespace){
                SVG.off(node, [event, ns].join('.'))
            }
        }
    }

  } else if (ev) {
    // remove all listeners for the event
    if (SVG.listeners[index][ev]) {
      for (namespace in SVG.listeners[index][ev])
        SVG.off(node, [ev, namespace].join('.'))

      delete SVG.listeners[index][ev]
    }

  } else {
    // remove all listeners on a given node
    for (event in SVG.listeners[index])
      SVG.off(node, event)

    delete SVG.listeners[index]
    delete SVG.handlerMap[index]

  }
}

//
SVG.extend(SVG.Element, {
  // Bind given event to listener
  on: function(event, listener, binding, options) {
    SVG.on(this.node, event, listener, binding, options)

    return this
  }
  // Unbind event from listener
, off: function(event, listener) {
    SVG.off(this.node, event, listener)

    return this
  }
  // Fire given event
, fire: function(event, data) {

    // Dispatch event
    if(event instanceof window.Event){
        this.node.dispatchEvent(event)
    }else{
        this.node.dispatchEvent(event = new window.CustomEvent(event, {detail:data, cancelable: true}))
    }

    this._event = event
    return this
  }
, event: function() {
    return this._event
  }
})


SVG.Defs = SVG.invent({
  // Initialize node
  create: 'defs'

  // Inherit from
, inherit: SVG.Container

})
SVG.G = SVG.invent({
  // Initialize node
  create: 'g'

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Move over x-axis
    x: function(x) {
      return x == null ? this.transform('x') : this.transform({ x: x - this.x() }, true)
    }
    // Move over y-axis
  , y: function(y) {
      return y == null ? this.transform('y') : this.transform({ y: y - this.y() }, true)
    }
    // Move by center over x-axis
  , cx: function(x) {
      return x == null ? this.gbox().cx : this.x(x - this.gbox().width / 2)
    }
    // Move by center over y-axis
  , cy: function(y) {
      return y == null ? this.gbox().cy : this.y(y - this.gbox().height / 2)
    }
  , gbox: function() {

      var bbox  = this.bbox()
        , trans = this.transform()

      bbox.x  += trans.x
      bbox.x2 += trans.x
      bbox.cx += trans.x

      bbox.y  += trans.y
      bbox.y2 += trans.y
      bbox.cy += trans.y

      return bbox
    }
  }

  // Add parent method
, construct: {
    // Create a group element
    group: function() {
      return this.put(new SVG.G)
    }
  }
})

// ### This module adds backward / forward functionality to elements.

//
SVG.extend(SVG.Element, {
  // Get all siblings, including myself
  siblings: function() {
    return this.parent().children()
  }
  // Get the curent position siblings
, position: function() {
    return this.parent().index(this)
  }
  // Get the next element (will return null if there is none)
, next: function() {
    return this.siblings()[this.position() + 1]
  }
  // Get the next element (will return null if there is none)
, previous: function() {
    return this.siblings()[this.position() - 1]
  }
  // Send given element one step forward
, forward: function() {
    var i = this.position() + 1
      , p = this.parent()

    // move node one step forward
    p.removeElement(this).add(this, i)

    // make sure defs node is always at the top
    if (p instanceof SVG.Doc)
      p.node.appendChild(p.defs().node)

    return this
  }
  // Send given element one step backward
, backward: function() {
    var i = this.position()

    if (i > 0)
      this.parent().removeElement(this).add(this, i - 1)

    return this
  }
  // Send given element all the way to the front
, front: function() {
    var p = this.parent()

    // Move node forward
    p.node.appendChild(this.node)

    // Make sure defs node is always at the top
    if (p instanceof SVG.Doc)
      p.node.appendChild(p.defs().node)

    return this
  }
  // Send given element all the way to the back
, back: function() {
    if (this.position() > 0)
      this.parent().removeElement(this).add(this, 0)

    return this
  }
  // Inserts a given element before the targeted element
, before: function(element) {
    element.remove()

    var i = this.position()

    this.parent().add(element, i)

    return this
  }
  // Insters a given element after the targeted element
, after: function(element) {
    element.remove()

    var i = this.position()

    this.parent().add(element, i + 1)

    return this
  }

})
SVG.Mask = SVG.invent({
  // Initialize node
  create: function() {
    this.constructor.call(this, SVG.create('mask'))

    // keep references to masked elements
    this.targets = []
  }

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Unmask all masked elements and remove itself
    remove: function() {
      // unmask all targets
      for (var i = this.targets.length - 1; i >= 0; i--)
        if (this.targets[i])
          this.targets[i].unmask()
      this.targets = []

      // remove mask from parent
      this.parent().removeElement(this)

      return this
    }
  }

  // Add parent method
, construct: {
    // Create masking element
    mask: function() {
      return this.defs().put(new SVG.Mask)
    }
  }
})


SVG.extend(SVG.Element, {
  // Distribute mask to svg element
  maskWith: function(element) {
    // use given mask or create a new one
    this.masker = element instanceof SVG.Mask ? element : this.parent().mask().add(element)

    // store reverence on self in mask
    this.masker.targets.push(this)

    // apply mask
    return this.attr('mask', 'url("#' + this.masker.attr('id') + '")')
  }
  // Unmask element
, unmask: function() {
    delete this.masker
    return this.attr('mask', null)
  }

})

SVG.ClipPath = SVG.invent({
  // Initialize node
  create: function() {
    this.constructor.call(this, SVG.create('clipPath'))

    // keep references to clipped elements
    this.targets = []
  }

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Unclip all clipped elements and remove itself
    remove: function() {
      // unclip all targets
      for (var i = this.targets.length - 1; i >= 0; i--)
        if (this.targets[i])
          this.targets[i].unclip()
      this.targets = []

      // remove clipPath from parent
      this.parent().removeElement(this)

      return this
    }
  }

  // Add parent method
, construct: {
    // Create clipping element
    clip: function() {
      return this.defs().put(new SVG.ClipPath)
    }
  }
})

//
SVG.extend(SVG.Element, {
  // Distribute clipPath to svg element
  clipWith: function(element) {
    // use given clip or create a new one
    this.clipper = element instanceof SVG.ClipPath ? element : this.parent().clip().add(element)

    // store reverence on self in mask
    this.clipper.targets.push(this)

    // apply mask
    return this.attr('clip-path', 'url("#' + this.clipper.attr('id') + '")')
  }
  // Unclip element
, unclip: function() {
    delete this.clipper
    return this.attr('clip-path', null)
  }

})
SVG.Gradient = SVG.invent({
  // Initialize node
  create: function(type) {
    this.constructor.call(this, SVG.create(type + 'Gradient'))

    // store type
    this.type = type
  }

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Add a color stop
    at: function(offset, color, opacity) {
      return this.put(new SVG.Stop).update(offset, color, opacity)
    }
    // Update gradient
  , update: function(block) {
      // remove all stops
      this.clear()

      // invoke passed block
      if (typeof block == 'function')
        block.call(this, this)

      return this
    }
    // Return the fill id
  , fill: function() {
      return 'url(#' + this.id() + ')'
    }
    // Alias string convertion to fill
  , toString: function() {
      return this.fill()
    }
    // custom attr to handle transform
  , attr: function(a, b, c) {
      if(a == 'transform') a = 'gradientTransform'
      return SVG.Container.prototype.attr.call(this, a, b, c)
    }
  }

  // Add parent method
, construct: {
    // Create gradient element in defs
    gradient: function(type, block) {
      return this.defs().gradient(type, block)
    }
  }
})

// Add animatable methods to both gradient and fx module
SVG.extend(SVG.Gradient, SVG.FX, {
  // From position
  from: function(x, y) {
    return (this._target || this).type == 'radial' ?
      this.attr({ fx: new SVG.Number(x), fy: new SVG.Number(y) }) :
      this.attr({ x1: new SVG.Number(x), y1: new SVG.Number(y) })
  }
  // To position
, to: function(x, y) {
    return (this._target || this).type == 'radial' ?
      this.attr({ cx: new SVG.Number(x), cy: new SVG.Number(y) }) :
      this.attr({ x2: new SVG.Number(x), y2: new SVG.Number(y) })
  }
})

// Base gradient generation
SVG.extend(SVG.Defs, {
  // define gradient
  gradient: function(type, block) {
    return this.put(new SVG.Gradient(type)).update(block)
  }

})

SVG.Stop = SVG.invent({
  // Initialize node
  create: 'stop'

  // Inherit from
, inherit: SVG.Element

  // Add class methods
, extend: {
    // add color stops
    update: function(o) {
      if (typeof o == 'number' || o instanceof SVG.Number) {
        o = {
          offset:  arguments[0]
        , color:   arguments[1]
        , opacity: arguments[2]
        }
      }

      // set attributes
      if (o.opacity != null) this.attr('stop-opacity', o.opacity)
      if (o.color   != null) this.attr('stop-color', o.color)
      if (o.offset  != null) this.attr('offset', new SVG.Number(o.offset))

      return this
    }
  }

})

SVG.Pattern = SVG.invent({
  // Initialize node
  create: 'pattern'

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Return the fill id
    fill: function() {
      return 'url(#' + this.id() + ')'
    }
    // Update pattern by rebuilding
  , update: function(block) {
      // remove content
      this.clear()

      // invoke passed block
      if (typeof block == 'function')
        block.call(this, this)

      return this
    }
    // Alias string convertion to fill
  , toString: function() {
      return this.fill()
    }
    // custom attr to handle transform
  , attr: function(a, b, c) {
      if(a == 'transform') a = 'patternTransform'
      return SVG.Container.prototype.attr.call(this, a, b, c)
    }

  }

  // Add parent method
, construct: {
    // Create pattern element in defs
    pattern: function(width, height, block) {
      return this.defs().pattern(width, height, block)
    }
  }
})

SVG.extend(SVG.Defs, {
  // Define gradient
  pattern: function(width, height, block) {
    return this.put(new SVG.Pattern).update(block).attr({
      x:            0
    , y:            0
    , width:        width
    , height:       height
    , patternUnits: 'userSpaceOnUse'
    })
  }

})
SVG.Doc = SVG.invent({
  // Initialize node
  create: function(element) {
    if (element) {
      // ensure the presence of a dom element
      element = typeof element == 'string' ?
        document.getElementById(element) :
        element

      // If the target is an svg element, use that element as the main wrapper.
      // This allows svg.js to work with svg documents as well.
      if (element.nodeName == 'svg') {
        this.constructor.call(this, element)
      } else {
        this.constructor.call(this, SVG.create('svg'))
        element.appendChild(this.node)
        this.size('100%', '100%')
      }

      // set svg element attributes and ensure defs node
      this.namespace().defs()
    }
  }

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Add namespaces
    namespace: function() {
      return this
        .attr({ xmlns: SVG.ns, version: '1.1' })
        .attr('xmlns:xlink', SVG.xlink, SVG.xmlns)
        .attr('xmlns:svgjs', SVG.svgjs, SVG.xmlns)
    }
    // Creates and returns defs element
  , defs: function() {
      if (!this._defs) {
        var defs

        // Find or create a defs element in this instance
        if (defs = this.node.getElementsByTagName('defs')[0])
          this._defs = SVG.adopt(defs)
        else
          this._defs = new SVG.Defs

        // Make sure the defs node is at the end of the stack
        this.node.appendChild(this._defs.node)
      }

      return this._defs
    }
    // custom parent method
  , parent: function() {
      return this.node.parentNode.nodeName == '#document' ? null : this.node.parentNode
    }
    // Fix for possible sub-pixel offset. See:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=608812
  , spof: function() {
      var pos = this.node.getScreenCTM()

      if (pos)
        this
          .style('left', (-pos.e % 1) + 'px')
          .style('top',  (-pos.f % 1) + 'px')

      return this
    }

      // Removes the doc from the DOM
  , remove: function() {
      if(this.parent()) {
        this.parent().removeChild(this.node)
      }

      return this
    }
  , clear: function() {
      // remove children
      while(this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild)

      // remove defs reference
      delete this._defs

      // add back parser
      if(!SVG.parser.draw.parentNode)
        this.node.appendChild(SVG.parser.draw)

      return this
    }
  }

})

SVG.Shape = SVG.invent({
  // Initialize node
  create: function(element) {
    this.constructor.call(this, element)
  }

  // Inherit from
, inherit: SVG.Element

})

SVG.Bare = SVG.invent({
  // Initialize
  create: function(element, inherit) {
    // construct element
    this.constructor.call(this, SVG.create(element))

    // inherit custom methods
    if (inherit)
      for (var method in inherit.prototype)
        if (typeof inherit.prototype[method] === 'function')
          this[method] = inherit.prototype[method]
  }

  // Inherit from
, inherit: SVG.Element

  // Add methods
, extend: {
    // Insert some plain text
    words: function(text) {
      // remove contents
      while (this.node.hasChildNodes())
        this.node.removeChild(this.node.lastChild)

      // create text node
      this.node.appendChild(document.createTextNode(text))

      return this
    }
  }
})


SVG.extend(SVG.Parent, {
  // Create an element that is not described by SVG.js
  element: function(element, inherit) {
    return this.put(new SVG.Bare(element, inherit))
  }
})

SVG.Symbol = SVG.invent({
  // Initialize node
  create: 'symbol'

  // Inherit from
, inherit: SVG.Container

, construct: {
    // create symbol
    symbol: function() {
      return this.put(new SVG.Symbol)
    }
  }
})

SVG.Use = SVG.invent({
  // Initialize node
  create: 'use'

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // Use element as a reference
    element: function(element, file) {
      // Set lined element
      return this.attr('href', (file || '') + '#' + element, SVG.xlink)
    }
  }

  // Add parent method
, construct: {
    // Create a use element
    use: function(element, file) {
      return this.put(new SVG.Use).element(element, file)
    }
  }
})
SVG.Rect = SVG.invent({
  // Initialize node
  create: 'rect'

  // Inherit from
, inherit: SVG.Shape

  // Add parent method
, construct: {
    // Create a rect element
    rect: function(width, height) {
      return this.put(new SVG.Rect()).size(width, height)
    }
  }
})
SVG.Circle = SVG.invent({
  // Initialize node
  create: 'circle'

  // Inherit from
, inherit: SVG.Shape

  // Add parent method
, construct: {
    // Create circle element, based on ellipse
    circle: function(size) {
      return this.put(new SVG.Circle).rx(new SVG.Number(size).divide(2)).move(0, 0)
    }
  }
})

SVG.extend(SVG.Circle, SVG.FX, {
  // Radius x value
  rx: function(rx) {
    return this.attr('r', rx)
  }
  // Alias radius x value
, ry: function(ry) {
    return this.rx(ry)
  }
})

SVG.Ellipse = SVG.invent({
  // Initialize node
  create: 'ellipse'

  // Inherit from
, inherit: SVG.Shape

  // Add parent method
, construct: {
    // Create an ellipse
    ellipse: function(width, height) {
      return this.put(new SVG.Ellipse).size(width, height).move(0, 0)
    }
  }
})

SVG.extend(SVG.Ellipse, SVG.Rect, SVG.FX, {
  // Radius x value
  rx: function(rx) {
    return this.attr('rx', rx)
  }
  // Radius y value
, ry: function(ry) {
    return this.attr('ry', ry)
  }
})

// Add common method
SVG.extend(SVG.Circle, SVG.Ellipse, {
    // Move over x-axis
    x: function(x) {
      return x == null ? this.cx() - this.rx() : this.cx(x + this.rx())
    }
    // Move over y-axis
  , y: function(y) {
      return y == null ? this.cy() - this.ry() : this.cy(y + this.ry())
    }
    // Move by center over x-axis
  , cx: function(x) {
      return x == null ? this.attr('cx') : this.attr('cx', x)
    }
    // Move by center over y-axis
  , cy: function(y) {
      return y == null ? this.attr('cy') : this.attr('cy', y)
    }
    // Set width of element
  , width: function(width) {
      return width == null ? this.rx() * 2 : this.rx(new SVG.Number(width).divide(2))
    }
    // Set height of element
  , height: function(height) {
      return height == null ? this.ry() * 2 : this.ry(new SVG.Number(height).divide(2))
    }
    // Custom size function
  , size: function(width, height) {
      var p = proportionalSize(this, width, height)

      return this
        .rx(new SVG.Number(p.width).divide(2))
        .ry(new SVG.Number(p.height).divide(2))
    }
})
SVG.Line = SVG.invent({
  // Initialize node
  create: 'line'

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // Get array
    array: function() {
      return new SVG.PointArray([
        [ this.attr('x1'), this.attr('y1') ]
      , [ this.attr('x2'), this.attr('y2') ]
      ])
    }
    // Overwrite native plot() method
  , plot: function(x1, y1, x2, y2) {
      if (x1 == null)
        return this.array()
      else if (typeof y1 !== 'undefined')
        x1 = { x1: x1, y1: y1, x2: x2, y2: y2 }
      else
        x1 = new SVG.PointArray(x1).toLine()

      return this.attr(x1)
    }
    // Move by left top corner
  , move: function(x, y) {
      return this.attr(this.array().move(x, y).toLine())
    }
    // Set element size to given width and height
  , size: function(width, height) {
      var p = proportionalSize(this, width, height)

      return this.attr(this.array().size(p.width, p.height).toLine())
    }
  }

  // Add parent method
, construct: {
    // Create a line element
    line: function(x1, y1, x2, y2) {
      // make sure plot is called as a setter
      // x1 is not necessarily a number, it can also be an array, a string and a SVG.PointArray
      return SVG.Line.prototype.plot.apply(
        this.put(new SVG.Line)
      , x1 != null ? [x1, y1, x2, y2] : [0, 0, 0, 0]
      )
    }
  }
})

SVG.Polyline = SVG.invent({
  // Initialize node
  create: 'polyline'

  // Inherit from
, inherit: SVG.Shape

  // Add parent method
, construct: {
    // Create a wrapped polyline element
    polyline: function(p) {
      // make sure plot is called as a setter
      return this.put(new SVG.Polyline).plot(p || new SVG.PointArray)
    }
  }
})

SVG.Polygon = SVG.invent({
  // Initialize node
  create: 'polygon'

  // Inherit from
, inherit: SVG.Shape

  // Add parent method
, construct: {
    // Create a wrapped polygon element
    polygon: function(p) {
      // make sure plot is called as a setter
      return this.put(new SVG.Polygon).plot(p || new SVG.PointArray)
    }
  }
})

// Add polygon-specific functions
SVG.extend(SVG.Polyline, SVG.Polygon, {
  // Get array
  array: function() {
    return this._array || (this._array = new SVG.PointArray(this.attr('points')))
  }
  // Plot new path
, plot: function(p) {
    return (p == null) ?
      this.array() :
      this.clear().attr('points', typeof p == 'string' ? p : (this._array = new SVG.PointArray(p)))
  }
  // Clear array cache
, clear: function() {
    delete this._array
    return this
  }
  // Move by left top corner
, move: function(x, y) {
    return this.attr('points', this.array().move(x, y))
  }
  // Set element size to given width and height
, size: function(width, height) {
    var p = proportionalSize(this, width, height)

    return this.attr('points', this.array().size(p.width, p.height))
  }

})

// unify all point to point elements
SVG.extend(SVG.Line, SVG.Polyline, SVG.Polygon, {
  // Define morphable array
  morphArray:  SVG.PointArray
  // Move by left top corner over x-axis
, x: function(x) {
    return x == null ? this.bbox().x : this.move(x, this.bbox().y)
  }
  // Move by left top corner over y-axis
, y: function(y) {
    return y == null ? this.bbox().y : this.move(this.bbox().x, y)
  }
  // Set width of element
, width: function(width) {
    var b = this.bbox()

    return width == null ? b.width : this.size(width, b.height)
  }
  // Set height of element
, height: function(height) {
    var b = this.bbox()

    return height == null ? b.height : this.size(b.width, height)
  }
})
SVG.Path = SVG.invent({
  // Initialize node
  create: 'path'

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // Define morphable array
    morphArray:  SVG.PathArray
    // Get array
  , array: function() {
      return this._array || (this._array = new SVG.PathArray(this.attr('d')))
    }
    // Plot new path
  , plot: function(d) {
      return (d == null) ?
        this.array() :
        this.clear().attr('d', typeof d == 'string' ? d : (this._array = new SVG.PathArray(d)))
    }
    // Clear array cache
  , clear: function() {
      delete this._array
      return this
    }
    // Move by left top corner
  , move: function(x, y) {
      return this.attr('d', this.array().move(x, y))
    }
    // Move by left top corner over x-axis
  , x: function(x) {
      return x == null ? this.bbox().x : this.move(x, this.bbox().y)
    }
    // Move by left top corner over y-axis
  , y: function(y) {
      return y == null ? this.bbox().y : this.move(this.bbox().x, y)
    }
    // Set element size to given width and height
  , size: function(width, height) {
      var p = proportionalSize(this, width, height)

      return this.attr('d', this.array().size(p.width, p.height))
    }
    // Set width of element
  , width: function(width) {
      return width == null ? this.bbox().width : this.size(width, this.bbox().height)
    }
    // Set height of element
  , height: function(height) {
      return height == null ? this.bbox().height : this.size(this.bbox().width, height)
    }

  }

  // Add parent method
, construct: {
    // Create a wrapped path element
    path: function(d) {
      // make sure plot is called as a setter
      return this.put(new SVG.Path).plot(d || new SVG.PathArray)
    }
  }
})

SVG.Image = SVG.invent({
  // Initialize node
  create: 'image'

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // (re)load image
    load: function(url) {
      if (!url) return this

      var self = this
        , img  = new window.Image()

      // preload image
      SVG.on(img, 'load', function() {
        var p = self.parent(SVG.Pattern)

        if(p === null) return

        // ensure image size
        if (self.width() == 0 && self.height() == 0)
          self.size(img.width, img.height)

        // ensure pattern size if not set
        if (p && p.width() == 0 && p.height() == 0)
          p.size(self.width(), self.height())

        // callback
        if (typeof self._loaded === 'function')
          self._loaded.call(self, {
            width:  img.width
          , height: img.height
          , ratio:  img.width / img.height
          , url:    url
          })
      })

      SVG.on(img, 'error', function(e){
        if (typeof self._error === 'function'){
            self._error.call(self, e)
        }
      })

      return this.attr('href', (img.src = this.src = url), SVG.xlink)
    }
    // Add loaded callback
  , loaded: function(loaded) {
      this._loaded = loaded
      return this
    }

  , error: function(error) {
      this._error = error
      return this
    }
  }

  // Add parent method
, construct: {
    // create image element, load image and set its size
    image: function(source, width, height) {
      return this.put(new SVG.Image).load(source).size(width || 0, height || width || 0)
    }
  }

})
SVG.Text = SVG.invent({
  // Initialize node
  create: function() {
    this.constructor.call(this, SVG.create('text'))

    this.dom.leading = new SVG.Number(1.3)    // store leading value for rebuilding
    this._rebuild = true                      // enable automatic updating of dy values
    this._build   = false                     // disable build mode for adding multiple lines

    // set default font
    this.attr('font-family', SVG.defaults.attrs['font-family'])
  }

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // Move over x-axis
    x: function(x) {
      // act as getter
      if (x == null)
        return this.attr('x')

      return this.attr('x', x)
    }
    // Move over y-axis
  , y: function(y) {
      var oy = this.attr('y')
        , o  = typeof oy === 'number' ? oy - this.bbox().y : 0

      // act as getter
      if (y == null)
        return typeof oy === 'number' ? oy - o : oy

      return this.attr('y', typeof y === 'number' ? y + o : y)
    }
    // Move center over x-axis
  , cx: function(x) {
      return x == null ? this.bbox().cx : this.x(x - this.bbox().width / 2)
    }
    // Move center over y-axis
  , cy: function(y) {
      return y == null ? this.bbox().cy : this.y(y - this.bbox().height / 2)
    }
    // Set the text content
  , text: function(text) {
      // act as getter
      if (typeof text === 'undefined'){
        var text = ''
        var children = this.node.childNodes
        for(var i = 0, len = children.length; i < len; ++i){

          // add newline if its not the first child and newLined is set to true
          if(i != 0 && children[i].nodeType != 3 && SVG.adopt(children[i]).dom.newLined == true){
            text += '\n'
          }

          // add content of this node
          text += children[i].textContent
        }

        return text
      }

      // remove existing content
      this.clear().build(true)

      if (typeof text === 'function') {
        // call block
        text.call(this, this)

      } else {
        // store text and make sure text is not blank
        text = text.split('\n')

        // build new lines
        for (var i = 0, il = text.length; i < il; i++)
          this.tspan(text[i]).newLine()
      }

      // disable build mode and rebuild lines
      return this.build(false).rebuild()
    }
    // Set font size
  , size: function(size) {
      return this.attr('font-size', size).rebuild()
    }
    // Set / get leading
  , leading: function(value) {
      // act as getter
      if (value == null)
        return this.dom.leading

      // act as setter
      this.dom.leading = new SVG.Number(value)

      return this.rebuild()
    }
    // Get all the first level lines
  , lines: function() {
      var node = (this.textPath && this.textPath() || this).node

      // filter tspans and map them to SVG.js instances
      var lines = SVG.utils.map(SVG.utils.filterSVGElements(node.childNodes), function(el){
        return SVG.adopt(el)
      })

      // return an instance of SVG.set
      return new SVG.Set(lines)
    }
    // Rebuild appearance type
  , rebuild: function(rebuild) {
      // store new rebuild flag if given
      if (typeof rebuild == 'boolean')
        this._rebuild = rebuild

      // define position of all lines
      if (this._rebuild) {
        var self = this
          , blankLineOffset = 0
          , dy = this.dom.leading * new SVG.Number(this.attr('font-size'))

        this.lines().each(function() {
          if (this.dom.newLined) {
            if (!self.textPath())
              this.attr('x', self.attr('x'))
            if(this.text() == '\n') {
              blankLineOffset += dy
            }else{
              this.attr('dy', dy + blankLineOffset)
              blankLineOffset = 0
            }
          }
        })

        this.fire('rebuild')
      }

      return this
    }
    // Enable / disable build mode
  , build: function(build) {
      this._build = !!build
      return this
    }
    // overwrite method from parent to set data properly
  , setData: function(o){
      this.dom = o
      this.dom.leading = new SVG.Number(o.leading || 1.3)
      return this
    }
  }

  // Add parent method
, construct: {
    // Create text element
    text: function(text) {
      return this.put(new SVG.Text).text(text)
    }
    // Create plain text element
  , plain: function(text) {
      return this.put(new SVG.Text).plain(text)
    }
  }

})

SVG.Tspan = SVG.invent({
  // Initialize node
  create: 'tspan'

  // Inherit from
, inherit: SVG.Shape

  // Add class methods
, extend: {
    // Set text content
    text: function(text) {
      if(text == null) return this.node.textContent + (this.dom.newLined ? '\n' : '')

      typeof text === 'function' ? text.call(this, this) : this.plain(text)

      return this
    }
    // Shortcut dx
  , dx: function(dx) {
      return this.attr('dx', dx)
    }
    // Shortcut dy
  , dy: function(dy) {
      return this.attr('dy', dy)
    }
    // Create new line
  , newLine: function() {
      // fetch text parent
      var t = this.parent(SVG.Text)

      // mark new line
      this.dom.newLined = true

      // apply new hy¡n
      return this.dy(t.dom.leading * t.attr('font-size')).attr('x', t.x())
    }
  }

})

SVG.extend(SVG.Text, SVG.Tspan, {
  // Create plain text node
  plain: function(text) {
    // clear if build mode is disabled
    if (this._build === false)
      this.clear()

    // create text node
    this.node.appendChild(document.createTextNode(text))

    return this
  }
  // Create a tspan
, tspan: function(text) {
    var node  = (this.textPath && this.textPath() || this).node
      , tspan = new SVG.Tspan

    // clear if build mode is disabled
    if (this._build === false)
      this.clear()

    // add new tspan
    node.appendChild(tspan.node)

    return tspan.text(text)
  }
  // Clear all lines
, clear: function() {
    var node = (this.textPath && this.textPath() || this).node

    // remove existing child nodes
    while (node.hasChildNodes())
      node.removeChild(node.lastChild)

    return this
  }
  // Get length of text element
, length: function() {
    return this.node.getComputedTextLength()
  }
})

SVG.TextPath = SVG.invent({
  // Initialize node
  create: 'textPath'

  // Inherit from
, inherit: SVG.Parent

  // Define parent class
, parent: SVG.Text

  // Add parent method
, construct: {
    morphArray: SVG.PathArray
    // Create path for text to run on
  , path: function(d) {
      // create textPath element
      var path  = new SVG.TextPath
        , track = this.doc().defs().path(d)

      // move lines to textpath
      while (this.node.hasChildNodes())
        path.node.appendChild(this.node.firstChild)

      // add textPath element as child node
      this.node.appendChild(path.node)

      // link textPath to path and add content
      path.attr('href', '#' + track, SVG.xlink)

      return this
    }
    // return the array of the path track element
  , array: function() {
      var track = this.track()

      return track ? track.array() : null
    }
    // Plot path if any
  , plot: function(d) {
      var track = this.track()
        , pathArray = null

      if (track) {
        pathArray = track.plot(d)
      }

      return (d == null) ? pathArray : this
    }
    // Get the path track element
  , track: function() {
      var path = this.textPath()

      if (path)
        return path.reference('href')
    }
    // Get the textPath child
  , textPath: function() {
      if (this.node.firstChild && this.node.firstChild.nodeName == 'textPath')
        return SVG.adopt(this.node.firstChild)
    }
  }
})

SVG.Nested = SVG.invent({
  // Initialize node
  create: function() {
    this.constructor.call(this, SVG.create('svg'))

    this.style('overflow', 'visible')
  }

  // Inherit from
, inherit: SVG.Container

  // Add parent method
, construct: {
    // Create nested svg document
    nested: function() {
      return this.put(new SVG.Nested)
    }
  }
})
SVG.A = SVG.invent({
  // Initialize node
  create: 'a'

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Link url
    to: function(url) {
      return this.attr('href', url, SVG.xlink)
    }
    // Link show attribute
  , show: function(target) {
      return this.attr('show', target, SVG.xlink)
    }
    // Link target attribute
  , target: function(target) {
      return this.attr('target', target)
    }
  }

  // Add parent method
, construct: {
    // Create a hyperlink element
    link: function(url) {
      return this.put(new SVG.A).to(url)
    }
  }
})

SVG.extend(SVG.Element, {
  // Create a hyperlink element
  linkTo: function(url) {
    var link = new SVG.A

    if (typeof url == 'function')
      url.call(link, link)
    else
      link.to(url)

    return this.parent().put(link).put(this)
  }

})
SVG.Marker = SVG.invent({
  // Initialize node
  create: 'marker'

  // Inherit from
, inherit: SVG.Container

  // Add class methods
, extend: {
    // Set width of element
    width: function(width) {
      return this.attr('markerWidth', width)
    }
    // Set height of element
  , height: function(height) {
      return this.attr('markerHeight', height)
    }
    // Set marker refX and refY
  , ref: function(x, y) {
      return this.attr('refX', x).attr('refY', y)
    }
    // Update marker
  , update: function(block) {
      // remove all content
      this.clear()

      // invoke passed block
      if (typeof block == 'function')
        block.call(this, this)

      return this
    }
    // Return the fill id
  , toString: function() {
      return 'url(#' + this.id() + ')'
    }
  }

  // Add parent method
, construct: {
    marker: function(width, height, block) {
      // Create marker element in defs
      return this.defs().marker(width, height, block)
    }
  }

})

SVG.extend(SVG.Defs, {
  // Create marker
  marker: function(width, height, block) {
    // Set default viewbox to match the width and height, set ref to cx and cy and set orient to auto
    return this.put(new SVG.Marker)
      .size(width, height)
      .ref(width / 2, height / 2)
      .viewbox(0, 0, width, height)
      .attr('orient', 'auto')
      .update(block)
  }

})

SVG.extend(SVG.Line, SVG.Polyline, SVG.Polygon, SVG.Path, {
  // Create and attach markers
  marker: function(marker, width, height, block) {
    var attr = ['marker']

    // Build attribute name
    if (marker != 'all') attr.push(marker)
    attr = attr.join('-')

    // Set marker attribute
    marker = arguments[1] instanceof SVG.Marker ?
      arguments[1] :
      this.doc().marker(width, height, block)

    return this.attr(attr, marker)
  }

})
// Define list of available attributes for stroke and fill
var sugar = {
  stroke: ['color', 'width', 'opacity', 'linecap', 'linejoin', 'miterlimit', 'dasharray', 'dashoffset']
, fill:   ['color', 'opacity', 'rule']
, prefix: function(t, a) {
    return a == 'color' ? t : t + '-' + a
  }
}

// Add sugar for fill and stroke
;['fill', 'stroke'].forEach(function(m) {
  var i, extension = {}

  extension[m] = function(o) {
    if (typeof o == 'undefined')
      return this
    if (typeof o == 'string' || SVG.Color.isRgb(o) || (o && typeof o.fill === 'function'))
      this.attr(m, o)

    else
      // set all attributes from sugar.fill and sugar.stroke list
      for (i = sugar[m].length - 1; i >= 0; i--)
        if (o[sugar[m][i]] != null)
          this.attr(sugar.prefix(m, sugar[m][i]), o[sugar[m][i]])

    return this
  }

  SVG.extend(SVG.Element, SVG.FX, extension)

})

SVG.extend(SVG.Element, SVG.FX, {
  // Map rotation to transform
  rotate: function(d, cx, cy) {
    return this.transform({ rotation: d, cx: cx, cy: cy })
  }
  // Map skew to transform
, skew: function(x, y, cx, cy) {
    return arguments.length == 1  || arguments.length == 3 ?
      this.transform({ skew: x, cx: y, cy: cx }) :
      this.transform({ skewX: x, skewY: y, cx: cx, cy: cy })
  }
  // Map scale to transform
, scale: function(x, y, cx, cy) {
    return arguments.length == 1  || arguments.length == 3 ?
      this.transform({ scale: x, cx: y, cy: cx }) :
      this.transform({ scaleX: x, scaleY: y, cx: cx, cy: cy })
  }
  // Map translate to transform
, translate: function(x, y) {
    return this.transform({ x: x, y: y })
  }
  // Map flip to transform
, flip: function(a, o) {
    o = typeof a == 'number' ? a : o
    return this.transform({ flip: a || 'both', offset: o })
  }
  // Map matrix to transform
, matrix: function(m) {
    return this.attr('transform', new SVG.Matrix(arguments.length == 6 ? [].slice.call(arguments) : m))
  }
  // Opacity
, opacity: function(value) {
    return this.attr('opacity', value)
  }
  // Relative move over x axis
, dx: function(x) {
    return this.x(new SVG.Number(x).plus(this instanceof SVG.FX ? 0 : this.x()), true)
  }
  // Relative move over y axis
, dy: function(y) {
    return this.y(new SVG.Number(y).plus(this instanceof SVG.FX ? 0 : this.y()), true)
  }
  // Relative move over x and y axes
, dmove: function(x, y) {
    return this.dx(x).dy(y)
  }
})

SVG.extend(SVG.Rect, SVG.Ellipse, SVG.Circle, SVG.Gradient, SVG.FX, {
  // Add x and y radius
  radius: function(x, y) {
    var type = (this._target || this).type;
    return type == 'radial' || type == 'circle' ?
      this.attr('r', new SVG.Number(x)) :
      this.rx(x).ry(y == null ? x : y)
  }
})

SVG.extend(SVG.Path, {
  // Get path length
  length: function() {
    return this.node.getTotalLength()
  }
  // Get point at length
, pointAt: function(length) {
    return this.node.getPointAtLength(length)
  }
})

SVG.extend(SVG.Parent, SVG.Text, SVG.Tspan, SVG.FX, {
  // Set font
  font: function(a, v) {
    if (typeof a == 'object') {
      for (v in a) this.font(v, a[v])
    }

    return a == 'leading' ?
        this.leading(v) :
      a == 'anchor' ?
        this.attr('text-anchor', v) :
      a == 'size' || a == 'family' || a == 'weight' || a == 'stretch' || a == 'variant' || a == 'style' ?
        this.attr('font-'+ a, v) :
        this.attr(a, v)
  }
})

SVG.Set = SVG.invent({
  // Initialize
  create: function(members) {
    // Set initial state
    Array.isArray(members) ? this.members = members : this.clear()
  }

  // Add class methods
, extend: {
    // Add element to set
    add: function() {
      var i, il, elements = [].slice.call(arguments)

      for (i = 0, il = elements.length; i < il; i++)
        this.members.push(elements[i])

      return this
    }
    // Remove element from set
  , remove: function(element) {
      var i = this.index(element)

      // remove given child
      if (i > -1)
        this.members.splice(i, 1)

      return this
    }
    // Iterate over all members
  , each: function(block) {
      for (var i = 0, il = this.members.length; i < il; i++)
        block.apply(this.members[i], [i, this.members])

      return this
    }
    // Restore to defaults
  , clear: function() {
      // initialize store
      this.members = []

      return this
    }
    // Get the length of a set
  , length: function() {
      return this.members.length
    }
    // Checks if a given element is present in set
  , has: function(element) {
      return this.index(element) >= 0
    }
    // retuns index of given element in set
  , index: function(element) {
      return this.members.indexOf(element)
    }
    // Get member at given index
  , get: function(i) {
      return this.members[i]
    }
    // Get first member
  , first: function() {
      return this.get(0)
    }
    // Get last member
  , last: function() {
      return this.get(this.members.length - 1)
    }
    // Default value
  , valueOf: function() {
      return this.members
    }
    // Get the bounding box of all members included or empty box if set has no items
  , bbox: function(){
      // return an empty box of there are no members
      if (this.members.length == 0)
        return new SVG.RBox()

      // get the first rbox and update the target bbox
      var rbox = this.members[0].rbox(this.members[0].doc())

      this.each(function() {
        // user rbox for correct position and visual representation
        rbox = rbox.merge(this.rbox(this.doc()))
      })

      return rbox
    }
  }

  // Add parent method
, construct: {
    // Create a new set
    set: function(members) {
      return new SVG.Set(members)
    }
  }
})

SVG.FX.Set = SVG.invent({
  // Initialize node
  create: function(set) {
    // store reference to set
    this.set = set
  }

})

// Alias methods
SVG.Set.inherit = function() {
  var m
    , methods = []

  // gather shape methods
  for(var m in SVG.Shape.prototype)
    if (typeof SVG.Shape.prototype[m] == 'function' && typeof SVG.Set.prototype[m] != 'function')
      methods.push(m)

  // apply shape aliasses
  methods.forEach(function(method) {
    SVG.Set.prototype[method] = function() {
      for (var i = 0, il = this.members.length; i < il; i++)
        if (this.members[i] && typeof this.members[i][method] == 'function')
          this.members[i][method].apply(this.members[i], arguments)

      return method == 'animate' ? (this.fx || (this.fx = new SVG.FX.Set(this))) : this
    }
  })

  // clear methods for the next round
  methods = []

  // gather fx methods
  for(var m in SVG.FX.prototype)
    if (typeof SVG.FX.prototype[m] == 'function' && typeof SVG.FX.Set.prototype[m] != 'function')
      methods.push(m)

  // apply fx aliasses
  methods.forEach(function(method) {
    SVG.FX.Set.prototype[method] = function() {
      for (var i = 0, il = this.set.members.length; i < il; i++)
        this.set.members[i].fx[method].apply(this.set.members[i].fx, arguments)

      return this
    }
  })
}




SVG.extend(SVG.Element, {
  // Store data values on svg nodes
  data: function(a, v, r) {
    if (typeof a == 'object') {
      for (v in a)
        this.data(v, a[v])

    } else if (arguments.length < 2) {
      try {
        return JSON.parse(this.attr('data-' + a))
      } catch(e) {
        return this.attr('data-' + a)
      }

    } else {
      this.attr(
        'data-' + a
      , v === null ?
          null :
        r === true || typeof v === 'string' || typeof v === 'number' ?
          v :
          JSON.stringify(v)
      )
    }

    return this
  }
})
SVG.extend(SVG.Element, {
  // Remember arbitrary data
  remember: function(k, v) {
    // remember every item in an object individually
    if (typeof arguments[0] == 'object')
      for (var v in k)
        this.remember(v, k[v])

    // retrieve memory
    else if (arguments.length == 1)
      return this.memory()[k]

    // store memory
    else
      this.memory()[k] = v

    return this
  }

  // Erase a given memory
, forget: function() {
    if (arguments.length == 0)
      this._memory = {}
    else
      for (var i = arguments.length - 1; i >= 0; i--)
        delete this.memory()[arguments[i]]

    return this
  }

  // Initialize or return local memory object
, memory: function() {
    return this._memory || (this._memory = {})
  }

})
// Method for getting an element by id
SVG.get = function(id) {
  var node = document.getElementById(idFromReference(id) || id)
  return SVG.adopt(node)
}

// Select elements by query string
SVG.select = function(query, parent) {
  return new SVG.Set(
    SVG.utils.map((parent || document).querySelectorAll(query), function(node) {
      return SVG.adopt(node)
    })
  )
}

SVG.extend(SVG.Parent, {
  // Scoped select method
  select: function(query) {
    return SVG.select(query, this.node)
  }

})
function pathRegReplace(a, b, c, d) {
  return c + d.replace(SVG.regex.dots, ' .')
}

// creates deep clone of array
function array_clone(arr){
  var clone = arr.slice(0)
  for(var i = clone.length; i--;){
    if(Array.isArray(clone[i])){
      clone[i] = array_clone(clone[i])
    }
  }
  return clone
}

// tests if a given element is instance of an object
function is(el, obj){
  return el instanceof obj
}

// tests if a given selector matches an element
function matches(el, selector) {
  return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
}

// Convert dash-separated-string to camelCase
function camelCase(s) {
  return s.toLowerCase().replace(/-(.)/g, function(m, g) {
    return g.toUpperCase()
  })
}

// Capitalize first letter of a string
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Ensure to six-based hex
function fullHex(hex) {
  return hex.length == 4 ?
    [ '#',
      hex.substring(1, 2), hex.substring(1, 2)
    , hex.substring(2, 3), hex.substring(2, 3)
    , hex.substring(3, 4), hex.substring(3, 4)
    ].join('') : hex
}

// Component to hex value
function compToHex(comp) {
  var hex = comp.toString(16)
  return hex.length == 1 ? '0' + hex : hex
}

// Calculate proportional width and height values when necessary
function proportionalSize(element, width, height) {
  if (width == null || height == null) {
    var box = element.bbox()

    if (width == null)
      width = box.width / box.height * height
    else if (height == null)
      height = box.height / box.width * width
  }

  return {
    width:  width
  , height: height
  }
}

// Delta transform point
function deltaTransformPoint(matrix, x, y) {
  return {
    x: x * matrix.a + y * matrix.c + 0
  , y: x * matrix.b + y * matrix.d + 0
  }
}

// Map matrix array to object
function arrayToMatrix(a) {
  return { a: a[0], b: a[1], c: a[2], d: a[3], e: a[4], f: a[5] }
}

// Parse matrix if required
function parseMatrix(matrix) {
  if (!(matrix instanceof SVG.Matrix))
    matrix = new SVG.Matrix(matrix)

  return matrix
}

// Add centre point to transform object
function ensureCentre(o, target) {
  o.cx = o.cx == null ? target.bbox().cx : o.cx
  o.cy = o.cy == null ? target.bbox().cy : o.cy
}

// PathArray Helpers
function arrayToString(a) {
  for (var i = 0, il = a.length, s = ''; i < il; i++) {
    s += a[i][0]

    if (a[i][1] != null) {
      s += a[i][1]

      if (a[i][2] != null) {
        s += ' '
        s += a[i][2]

        if (a[i][3] != null) {
          s += ' '
          s += a[i][3]
          s += ' '
          s += a[i][4]

          if (a[i][5] != null) {
            s += ' '
            s += a[i][5]
            s += ' '
            s += a[i][6]

            if (a[i][7] != null) {
              s += ' '
              s += a[i][7]
            }
          }
        }
      }
    }
  }

  return s + ' '
}

// Deep new id assignment
function assignNewId(node) {
  // do the same for SVG child nodes as well
  for (var i = node.childNodes.length - 1; i >= 0; i--)
    if (node.childNodes[i] instanceof window.SVGElement)
      assignNewId(node.childNodes[i])

  return SVG.adopt(node).id(SVG.eid(node.nodeName))
}

// Add more bounding box properties
function fullBox(b) {
  if (b.x == null) {
    b.x      = 0
    b.y      = 0
    b.width  = 0
    b.height = 0
  }

  b.w  = b.width
  b.h  = b.height
  b.x2 = b.x + b.width
  b.y2 = b.y + b.height
  b.cx = b.x + b.width / 2
  b.cy = b.y + b.height / 2

  return b
}

// Get id from reference string
function idFromReference(url) {
  var m = url.toString().match(SVG.regex.reference)

  if (m) return m[1]
}

// Create matrix array for looping
var abcdef = 'abcdef'.split('')
// Add CustomEvent to IE9 and IE10
if (typeof window.CustomEvent !== 'function') {
  // Code from: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
  var CustomEvent = function(event, options) {
    options = options || { bubbles: false, cancelable: false, detail: undefined }
    var e = document.createEvent('CustomEvent')
    e.initCustomEvent(event, options.bubbles, options.cancelable, options.detail)
    return e
  }

  CustomEvent.prototype = window.Event.prototype

  window.CustomEvent = CustomEvent
}

// requestAnimationFrame / cancelAnimationFrame Polyfill with fallback based on Paul Irish
(function(w) {
  var lastTime = 0
  var vendors = ['moz', 'webkit']

  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    w.requestAnimationFrame = w[vendors[x] + 'RequestAnimationFrame']
    w.cancelAnimationFrame  = w[vendors[x] + 'CancelAnimationFrame'] ||
                              w[vendors[x] + 'CancelRequestAnimationFrame']
  }

  w.requestAnimationFrame = w.requestAnimationFrame ||
    function(callback) {
      var currTime = new Date().getTime()
      var timeToCall = Math.max(0, 16 - (currTime - lastTime))

      var id = w.setTimeout(function() {
        callback(currTime + timeToCall)
      }, timeToCall)

      lastTime = currTime + timeToCall
      return id
    }

  w.cancelAnimationFrame = w.cancelAnimationFrame || w.clearTimeout;

}(window))

return SVG

}));
},{}],2:[function(require,module,exports){
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
        this.meta = {};
        this.center = new classes_1.Point2D(cx, cy);
        this.radius = radius || default_circle_radius;
        this.colors = _colors || style_1.colors;
        this.weight = Math.PI * (Math.pow(this.radius, 2));
    }
    Circle.prototype.getWeight = function () {
        return this.weight;
    };
    Circle.prototype.getColors = function () {
        return this.colors;
    };
    Circle.prototype.setId = function (id) {
        this._id = id;
    };
    Circle.prototype.get2DCenter = function () {
        return this.center;
    };
    Circle.prototype.move = function (points) {
        this.center = points[0];
    };
    Circle.prototype.get2DPath = function () {
        var path = [this.center];
        return path;
    };
    Circle.prototype.getRadius = function () {
        return this.radius;
    };
    return Circle;
}());
exports.Circle = Circle;

},{"./classes":3,"./helpers":5,"./style":11}],3:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var Point2D = /** @class */ (function () {
    function Point2D(x, y) {
        this.add = function (point) {
            this.x += point.x;
            this.y += point.y;
        };
        this.subtract = function (point) {
            this.x -= point.x;
            this.y -= point.y;
        };
        this.multiply = function (point) {
            this.x *= point.x;
            this.y *= point.y;
        };
        this.multiplyScalar = function (scalar) {
            this.x *= scalar;
            this.y *= scalar;
        };
        this.divide = function (point) {
            this.x /= point.x;
            this.y /= point.y;
        };
        this.divideScalar = function (scalar) {
            this.x /= scalar;
            this.y /= scalar;
        };
        this.length = function () {
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        };
        this.normalize = function () {
            this.divideScalar(this.length());
        };
        this.x = x || 0;
        this.y = y || 0;
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

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constants = {
    'pixels_per_fuel': 20,
    'rockets_count': 50,
    'tick_interval_ms': 50
};

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var style_1 = require("./style");
var helpers_1 = require("./helpers");
var classes_1 = require("./classes");
var Line = /** @class */ (function () {
    function Line(x1, y1, x2, y2, id, _colors) {
        this._id = id || helpers_1.makeid();
        this._type = classes_1.elementType.Line;
        this.meta = {};
        this.start = new classes_1.Point2D(x1, y1);
        this.end = new classes_1.Point2D(x2, y2);
        this.colors = _colors || style_1.colors;
        this.weight = Math.sqrt(Math.pow((y1 - y2), 2) +
            Math.pow((x1 - x2), 2));
    }
    Line.prototype.getWeight = function () {
        return this.weight;
    };
    Line.prototype.getColors = function () {
        return this.colors;
    };
    Line.prototype.setId = function (id) {
        this._id = id;
    };
    Line.prototype.get2DCenter = function () {
        return new classes_1.Point2D((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2);
    };
    Line.prototype.move = function (points) {
        this.start = points[0];
        this.end = points[1];
    };
    Line.prototype.get2DPath = function () {
        var path = [
            this.start,
            this.end
        ];
        return path;
    };
    Line.prototype.getRadius = function () {
        return Math.sqrt(Math.pow((this.start.y - this.end.y), 2) +
            Math.pow((this.start.x - this.end.x), 2));
    };
    return Line;
}());
exports.Line = Line;

},{"./classes":3,"./helpers":5,"./style":11}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scene_1 = require("./scene");
var constants_1 = require("./constants");
var width = window.innerWidth;
var height = window.innerHeight;
var min_side = Math.min(width, height);
function setUp(scene) {
    var big_obstacle = scene.addElement('circle', {
        'cx': width / 2,
        'cy': min_side / 2,
        'radius': min_side / 10
    });
    var big_obstacle_center = big_obstacle.get2DCenter();
    var big_obstacle_radius = big_obstacle.getRadius();
    var destination_radius = big_obstacle_radius / 5;
    var destination = scene.addElement('circle', {
        'cx': big_obstacle_center.x + big_obstacle_radius + destination_radius,
        'cy': big_obstacle_center.y + big_obstacle_radius + destination_radius,
        'radius': destination_radius
    });
    var origin_radius = big_obstacle_radius / 7;
    var origin = scene.addElement('circle', {
        'cx': big_obstacle_center.x - big_obstacle_radius * 2 - origin_radius,
        'cy': big_obstacle_center.y - big_obstacle_radius * 2 - origin_radius,
        'radius': origin_radius
    });
    scene.origin = origin;
    scene.destination = destination;
    scene.obstacles = [
        big_obstacle,
        origin
    ];
    scene.render(constants_1.constants['tick_interval_ms']);
    scene.startActivity(constants_1.constants['tick_interval_ms']);
    scene.startRockets(constants_1.constants['rockets_count']);
}
var scene = new scene_1.Scene(width, height, setUp);

},{"./constants":4,"./scene":10}],8:[function(require,module,exports){
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
        var origin_radius = origin.getRadius();
        var destination_point = destination.get2DCenter();
        var destination_radius = destination.getRadius();
        _this = _super.call(this, origin_point.x + origin_radius, origin_point.y + origin_radius, origin_point.x + origin_radius + height, origin_point.y + origin_radius) || this;
        _this.selection_score = 0;
        _this.is_alive = true;
        _this.origin = origin;
        _this.destination = destination;
        _this._count = 0;
        _this.has_landed = false;
        _this.distance_to_destination = Math.sqrt(Math.pow((origin_point.y - destination_point.y), 2) +
            Math.pow((origin_point.x - destination_point.x), 2));
        // Maybe we need to increase this
        _this.fuel = Math.round(_this.distance_to_destination) * 2;
        if (routine === undefined) {
            // Calculate amount of points to achieve the destination
            var routines_count = _this.distance_to_destination;
            _this.routine = new routines_1.Routine(routines_count);
        }
        else {
            _this.routine = routine;
        }
        return _this;
    }
    Rocket.prototype.crash = function (el) {
        if (el === this.destination) {
            this.has_landed = true;
            this.is_alive = true;
            this.distance_to_destination = 1;
            this.calculateScore();
        }
        else {
            this.is_alive = false;
            this.selection_score /= 10;
        }
    };
    Rocket.prototype.calculateScore = function () {
        if (this.has_landed) {
            this.selection_score = 1;
        }
        else {
            this.selection_score = 1 / this.distance_to_destination;
        }
    };
    Rocket.prototype.getRoutine = function () {
        return this.routine;
    };
    Rocket.prototype.getRoutineDirection = function () {
        var direction;
        if (this._count < this.routine.directions.length) {
            direction = this.routine.directions[this._count];
        }
        return direction;
    };
    Rocket.prototype.lookupNextRoutineDirection = function () {
        var direction;
        if (this._count + 1 < this.routine.directions.length) {
            direction = this.routine.directions[this._count + 1];
        }
        return direction;
    };
    Rocket.prototype.getNextRoutineDirection = function () {
        var direction;
        this._count += 1;
        if (this._count < this.routine.directions.length) {
            direction = this.routine.directions[this._count];
        }
        return direction;
    };
    Rocket.prototype.update = function () {
        if (!this.has_landed && this.is_alive) {
            if (this._count < this.routine.directions.length) {
                var next_direction = this.lookupNextRoutineDirection();
                if (next_direction !== undefined) {
                    var next_start = next_direction.getNewPoint(this.start);
                    this.fuel -= Math.sqrt(Math.pow((this.start.x - next_start.x), 2) +
                        Math.pow((this.start.y - next_start.y), 2));
                }
            }
            else {
                this.is_alive = false;
            }
            var destination_center = this.destination.get2DCenter();
            var destination_radius = this.destination.getRadius();
            var away_from_destination = Math.sqrt(Math.pow((this.start.y - destination_center.y), 2) +
                Math.pow((this.start.x - destination_center.x), 2));
            if (away_from_destination < this.distance_to_destination) {
                this.distance_to_destination = away_from_destination;
            }
            // Check fuel
            if (this.fuel <= 0) {
                this.is_alive = false;
            }
            if (this.is_alive) {
                var direction = this.getNextRoutineDirection();
                if (direction !== undefined) {
                    this.start = direction.getNewPoint(this.start);
                    this.end = direction.getNewPoint(this.end);
                }
                else {
                    this.is_alive = false;
                }
            }
            this.calculateScore();
        }
    };
    Rocket.prototype.getTrajectory = function () {
        var trajectory = "";
        var start = this.start;
        var end = this.end;
        trajectory += Math.round(start.x) + "," + Math.round(start.y) + " " + Math.round(end.x) + "," + Math.round(end.y) + " ";
        for (var _i = 0, _a = this.getRoutine().directions; _i < _a.length; _i++) {
            var direction = _a[_i];
            start = direction.getNewPoint(start);
            end = direction.getNewPoint(end);
            trajectory += Math.round(start.x) + "," + Math.round(start.y) + " " + Math.round(end.x) + "," + Math.round(end.y) + " ";
        }
        return trajectory;
    };
    return Rocket;
}(line_1.Line));
exports.Rocket = Rocket;

},{"./line":6,"./routines":9}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("./helpers");
var classes_1 = require("./classes");
var constants_1 = require("./constants");
var Direction = /** @class */ (function () {
    function Direction(angle, distance) {
        this.angle = angle || helpers_1.getRandomInt(-360, 360);
        this.distance = distance || helpers_1.getRandomInt(1, constants_1.constants['pixels_per_fuel']);
    }
    Direction.prototype.getNewPoint = function (point) {
        var new_point = new classes_1.Point2D(0, 0);
        new_point.x = Math.round(Math.cos(this.angle * Math.PI / 180) * this.distance + point.x);
        new_point.y = Math.round(Math.sin(this.angle * Math.PI / 180) * this.distance + point.y);
        return new_point;
    };
    return Direction;
}());
exports.Direction = Direction;
var Routine = /** @class */ (function () {
    function Routine(max_directions, directions) {
        this._id = helpers_1.makeid();
        this.directions = [];
        if (max_directions === undefined) {
            max_directions = 100;
        }
        if (directions === undefined) {
            for (var i = 0; i < max_directions; i++) {
                this.directions[i] = new Direction();
            }
        }
        else {
            this.directions = directions;
        }
    }
    Routine.prototype.crossOver = function (routine) {
        var new_directions = [];
        var parents = [
            this.directions,
            routine.directions,
        ];
        for (var i = 0; i < routine.directions.length; i++) {
            new_directions[i] = parents[Math.round(Math.random())][i];
        }
        return new Routine(0, new_directions);
    };
    Routine.prototype.mutate = function () {
        var mutation_rate = 0.01;
        for (var i = 0; i < this.directions.length; i++) {
            if (helpers_1.getRandomArbitrary(0, 1) < mutation_rate) {
                this.directions[i] = new Direction();
            }
        }
    };
    return Routine;
}());
exports.Routine = Routine;

},{"./classes":3,"./constants":4,"./helpers":5}],10:[function(require,module,exports){
"use strict";
/// <reference path ="../node_modules/@types/jquery/index.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
var SVG = require("svg.js");
'use strict';
var helpers_1 = require("./helpers");
var classes_1 = require("./classes");
var circle_1 = require("./circle");
var line_1 = require("./line");
var rocket_1 = require("./rocket");
var Scene = /** @class */ (function () {
    function Scene(width, height, setUp) {
        var _this = this;
        this.rockets_count = 20;
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
        this.min_side = Math.min(width, height);
        this.center = new classes_1.Point2D(this.min_side / 2, this.min_side / 2);
        $(function () {
            var canvas = SVG('canvas');
            canvas.size(width, height);
            _this.canvas = canvas.nested();
            setUp(_this);
        });
    }
    Scene.prototype.updateGenerationInfo = function () {
        this.generation_info['generation_number'] += 1;
        this.generation_info['total_rockets'] = this.rockets.length;
        this.generation_info['rockets_landed'] = 0;
        for (var _i = 0, _a = this.rockets; _i < _a.length; _i++) {
            var rocket = _a[_i];
            if (rocket.has_landed) {
                this.generation_info['rockets_landed'] += 1;
            }
        }
        if (this.generation_info['rockets_landed'] > this.generation_info['max_rockets_landed']) {
            this.generation_info['max_rockets_landed'] = this.generation_info['rockets_landed'];
        }
        var text = "Generation " + this.generation_info['generation_number'] + ": \n       Landed: " + this.generation_info['rockets_landed'] + " \n       Max Landed: " + this.generation_info['max_rockets_landed'] + " \n       Total: " + this.rockets.length + " \n     ";
        if (this.text_element === undefined) {
            this.text_element = this.canvas.text(text).move(0, 0).font({
                'family': 'Inconsolata',
                'size': this.min_side / 45
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
                var _line = new line_1.Line(properties['x1'], properties['y1'], properties['x2'], properties['y2'], id, colors);
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
                            'stroke-width': 1
                        });
                        this.svg_elements[element._id] = svg_element;
                        // If this is in obstacles
                        if (this.obstacles.indexOf(element) != -1) {
                            this.svg_obstacles.push(svg_element);
                        }
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
                            'stroke-width': 1
                        });
                        this.svg_elements[element._id] = svg_element;
                        // If this is in obstacles
                        if (this.obstacles.indexOf(element) != -1) {
                            this.svg_obstacles.push(svg_element);
                        }
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
    Scene.prototype.checkCrashes = function () {
        // Rocket crases anything
        for (var _i = 0, _a = this.rockets; _i < _a.length; _i++) {
            var rocket = _a[_i];
            if (rocket.is_alive) {
                var rocket_svg_element = this.svg_elements[rocket._id];
                var rocket_x = [rocket.start.x, rocket.end.x];
                var rocket_y = [rocket.start.y, rocket.end.y];
                for (var _b = 0, _c = this.elements; _b < _c.length; _b++) {
                    var element = _c[_b];
                    var crash = false;
                    var center2d = element.get2DCenter();
                    var path = element.get2DPath();
                    var existing_svg_element = this.svg_elements[element._id];
                    switch (element._type) {
                        case classes_1.elementType.Circle:
                            var element_radius = element.getRadius();
                            for (var i = 0; i < rocket_x.length; i++) {
                                var distance = Math.sqrt(Math.pow((rocket_x[i] - center2d.x), 2) +
                                    Math.pow((rocket_y[i] - center2d.y), 2));
                                if (distance < element_radius) {
                                    crash = true;
                                }
                            }
                            break;
                        case classes_1.elementType.Line:
                            // todo: this must be fixed
                            break;
                        default:
                            break;
                    }
                    if (crash) {
                        rocket.crash(element);
                    }
                }
            }
        }
    };
    Scene.prototype.activity = function () {
        // Planets
        this.checkCrashes();
        // Rockets
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
        if (rockets_pool.length > 0) {
            for (var _i = 0, _a = this.rockets; _i < _a.length; _i++) {
                var rocket = _a[_i];
                var routineA = helpers_1.pickRandomFromArray(rockets_pool).getRoutine();
                var routineB = helpers_1.pickRandomFromArray(rockets_pool).getRoutine();
                var childRoutine = routineA.crossOver(routineB);
                childRoutine.mutate();
                routines.push(childRoutine);
            }
        }
        return routines;
    };
    Scene.prototype.render = function (interval) {
        var _this = this;
        setInterval(function () { return _this.drawElements(); }, interval);
    };
    Scene.prototype.startRocket = function (rocket) {
        var _line = this.addElement('line', {
            'x1': rocket.start.x,
            'y1': rocket.start.y,
            'x2': rocket.end.x,
            'y2': rocket.end.y
        }, rocket._id, {
            fill_color: 'rgba(0, 0, 0, 1)',
            stroke_color: 'rgba(0, 0, 0, 1)',
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

},{"./circle":2,"./classes":3,"./helpers":5,"./line":6,"./rocket":8,"svg.js":1}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = {
    fill_color: 'rgba(157,165,180, .9)',
    stroke_color: 'rgba(126, 133, 146, 1)',
    font_color: 'rgba(255, 255, 255, 1)',
};

},{}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc3ZnLmpzL2Rpc3Qvc3ZnLmpzIiwic3JjL2NpcmNsZS50cyIsInNyYy9jbGFzc2VzLnRzIiwic3JjL2NvbnN0YW50cy50cyIsInNyYy9oZWxwZXJzLnRzIiwic3JjL2xpbmUudHMiLCJzcmMvbWFpbi50cyIsInNyYy9yb2NrZXQudHMiLCJzcmMvcm91dGluZXMudHMiLCJzcmMvc2NlbmUudHMiLCJzcmMvc3R5bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQSxDQUFDO1lBQzVCLEdBQUcsQ0FBQSxDQUFnQixVQUFRLEVBQVIscUJBQVEsRUFBUixzQkFBUSxFQUFSLElBQVE7Z0JBQXZCLElBQUksT0FBTyxpQkFBQTtnQkFDYixPQUFPLENBQUMsSUFBSSxDQUNWLElBQUksZUFBTSxDQUNSLElBQUksQ0FBQyxNQUFNLEVBQ1gsSUFBSSxDQUFDLFdBQVcsRUFDaEIsYUFBYSxFQUNiLE9BQU8sQ0FDUixDQUNGLENBQUE7YUFDRjtRQUNILENBQUM7UUFFRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUN4QyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9CLENBQUM7SUFDSCxDQUFDO0lBQ0gsWUFBQztBQUFELENBbGJBLEFBa2JDLElBQUE7QUFsYlksc0JBQUs7Ozs7O0FDWlAsUUFBQSxNQUFNLEdBQUc7SUFDbEIsVUFBVSxFQUFFLHVCQUF1QjtJQUNuQyxZQUFZLEVBQUUsd0JBQXdCO0lBQ3RDLFVBQVUsRUFBRSx3QkFBd0I7Q0FDckMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiogc3ZnLmpzIC0gQSBsaWdodHdlaWdodCBsaWJyYXJ5IGZvciBtYW5pcHVsYXRpbmcgYW5kIGFuaW1hdGluZyBTVkcuXG4qIEB2ZXJzaW9uIDIuNi4zXG4qIGh0dHBzOi8vc3ZnZG90anMuZ2l0aHViLmlvL1xuKlxuKiBAY29weXJpZ2h0IFdvdXQgRmllcmVucyA8d291dEBtaWNrLXdvdXQuY29tPlxuKiBAbGljZW5zZSBNSVRcbipcbiogQlVJTFQ6IEZyaSBKdWwgMjEgMjAxNyAxNDo1MDozNyBHTVQrMDIwMCAoTWl0dGVsZXVyb3DDpGlzY2hlIFNvbW1lcnplaXQpXG4qLztcbihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XHJcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICBkZWZpbmUoZnVuY3Rpb24oKXtcclxuICAgICAgcmV0dXJuIGZhY3Rvcnkocm9vdCwgcm9vdC5kb2N1bWVudClcclxuICAgIH0pXHJcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgIG1vZHVsZS5leHBvcnRzID0gcm9vdC5kb2N1bWVudCA/IGZhY3Rvcnkocm9vdCwgcm9vdC5kb2N1bWVudCkgOiBmdW5jdGlvbih3KXsgcmV0dXJuIGZhY3Rvcnkodywgdy5kb2N1bWVudCkgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICByb290LlNWRyA9IGZhY3Rvcnkocm9vdCwgcm9vdC5kb2N1bWVudClcclxuICB9XHJcbn0odHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHRoaXMsIGZ1bmN0aW9uKHdpbmRvdywgZG9jdW1lbnQpIHtcclxuXHJcbi8vIFRoZSBtYWluIHdyYXBwaW5nIGVsZW1lbnRcclxudmFyIFNWRyA9IHRoaXMuU1ZHID0gZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gIGlmIChTVkcuc3VwcG9ydGVkKSB7XHJcbiAgICBlbGVtZW50ID0gbmV3IFNWRy5Eb2MoZWxlbWVudClcclxuXHJcbiAgICBpZighU1ZHLnBhcnNlci5kcmF3KVxyXG4gICAgICBTVkcucHJlcGFyZSgpXHJcblxyXG4gICAgcmV0dXJuIGVsZW1lbnRcclxuICB9XHJcbn1cclxuXHJcbi8vIERlZmF1bHQgbmFtZXNwYWNlc1xyXG5TVkcubnMgICAgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnXHJcblNWRy54bWxucyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3htbG5zLydcclxuU1ZHLnhsaW5rID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnXHJcblNWRy5zdmdqcyA9ICdodHRwOi8vc3ZnanMuY29tL3N2Z2pzJ1xyXG5cclxuLy8gU3ZnIHN1cHBvcnQgdGVzdFxyXG5TVkcuc3VwcG9ydGVkID0gKGZ1bmN0aW9uKCkge1xyXG4gIHJldHVybiAhISBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMgJiZcclxuICAgICAgICAgISEgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFNWRy5ucywnc3ZnJykuY3JlYXRlU1ZHUmVjdFxyXG59KSgpXHJcblxyXG4vLyBEb24ndCBib3RoZXIgdG8gY29udGludWUgaWYgU1ZHIGlzIG5vdCBzdXBwb3J0ZWRcclxuaWYgKCFTVkcuc3VwcG9ydGVkKSByZXR1cm4gZmFsc2VcclxuXHJcbi8vIEVsZW1lbnQgaWQgc2VxdWVuY2VcclxuU1ZHLmRpZCAgPSAxMDAwXHJcblxyXG4vLyBHZXQgbmV4dCBuYW1lZCBlbGVtZW50IGlkXHJcblNWRy5laWQgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgcmV0dXJuICdTdmdqcycgKyBjYXBpdGFsaXplKG5hbWUpICsgKFNWRy5kaWQrKylcclxufVxyXG5cclxuLy8gTWV0aG9kIGZvciBlbGVtZW50IGNyZWF0aW9uXHJcblNWRy5jcmVhdGUgPSBmdW5jdGlvbihuYW1lKSB7XHJcbiAgLy8gY3JlYXRlIGVsZW1lbnRcclxuICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyh0aGlzLm5zLCBuYW1lKVxyXG5cclxuICAvLyBhcHBseSB1bmlxdWUgaWRcclxuICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnaWQnLCB0aGlzLmVpZChuYW1lKSlcclxuXHJcbiAgcmV0dXJuIGVsZW1lbnRcclxufVxyXG5cclxuLy8gTWV0aG9kIGZvciBleHRlbmRpbmcgb2JqZWN0c1xyXG5TVkcuZXh0ZW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIG1vZHVsZXMsIG1ldGhvZHMsIGtleSwgaVxyXG5cclxuICAvLyBHZXQgbGlzdCBvZiBtb2R1bGVzXHJcbiAgbW9kdWxlcyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxyXG5cclxuICAvLyBHZXQgb2JqZWN0IHdpdGggZXh0ZW5zaW9uc1xyXG4gIG1ldGhvZHMgPSBtb2R1bGVzLnBvcCgpXHJcblxyXG4gIGZvciAoaSA9IG1vZHVsZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXHJcbiAgICBpZiAobW9kdWxlc1tpXSlcclxuICAgICAgZm9yIChrZXkgaW4gbWV0aG9kcylcclxuICAgICAgICBtb2R1bGVzW2ldLnByb3RvdHlwZVtrZXldID0gbWV0aG9kc1trZXldXHJcblxyXG4gIC8vIE1ha2Ugc3VyZSBTVkcuU2V0IGluaGVyaXRzIGFueSBuZXdseSBhZGRlZCBtZXRob2RzXHJcbiAgaWYgKFNWRy5TZXQgJiYgU1ZHLlNldC5pbmhlcml0KVxyXG4gICAgU1ZHLlNldC5pbmhlcml0KClcclxufVxyXG5cclxuLy8gSW52ZW50IG5ldyBlbGVtZW50XHJcblNWRy5pbnZlbnQgPSBmdW5jdGlvbihjb25maWcpIHtcclxuICAvLyBDcmVhdGUgZWxlbWVudCBpbml0aWFsaXplclxyXG4gIHZhciBpbml0aWFsaXplciA9IHR5cGVvZiBjb25maWcuY3JlYXRlID09ICdmdW5jdGlvbicgP1xyXG4gICAgY29uZmlnLmNyZWF0ZSA6XHJcbiAgICBmdW5jdGlvbigpIHtcclxuICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIFNWRy5jcmVhdGUoY29uZmlnLmNyZWF0ZSkpXHJcbiAgICB9XHJcblxyXG4gIC8vIEluaGVyaXQgcHJvdG90eXBlXHJcbiAgaWYgKGNvbmZpZy5pbmhlcml0KVxyXG4gICAgaW5pdGlhbGl6ZXIucHJvdG90eXBlID0gbmV3IGNvbmZpZy5pbmhlcml0XHJcblxyXG4gIC8vIEV4dGVuZCB3aXRoIG1ldGhvZHNcclxuICBpZiAoY29uZmlnLmV4dGVuZClcclxuICAgIFNWRy5leHRlbmQoaW5pdGlhbGl6ZXIsIGNvbmZpZy5leHRlbmQpXHJcblxyXG4gIC8vIEF0dGFjaCBjb25zdHJ1Y3QgbWV0aG9kIHRvIHBhcmVudFxyXG4gIGlmIChjb25maWcuY29uc3RydWN0KVxyXG4gICAgU1ZHLmV4dGVuZChjb25maWcucGFyZW50IHx8IFNWRy5Db250YWluZXIsIGNvbmZpZy5jb25zdHJ1Y3QpXHJcblxyXG4gIHJldHVybiBpbml0aWFsaXplclxyXG59XHJcblxyXG4vLyBBZG9wdCBleGlzdGluZyBzdmcgZWxlbWVudHNcclxuU1ZHLmFkb3B0ID0gZnVuY3Rpb24obm9kZSkge1xyXG4gIC8vIGNoZWNrIGZvciBwcmVzZW5jZSBvZiBub2RlXHJcbiAgaWYgKCFub2RlKSByZXR1cm4gbnVsbFxyXG5cclxuICAvLyBtYWtlIHN1cmUgYSBub2RlIGlzbid0IGFscmVhZHkgYWRvcHRlZFxyXG4gIGlmIChub2RlLmluc3RhbmNlKSByZXR1cm4gbm9kZS5pbnN0YW5jZVxyXG5cclxuICAvLyBpbml0aWFsaXplIHZhcmlhYmxlc1xyXG4gIHZhciBlbGVtZW50XHJcblxyXG4gIC8vIGFkb3B0IHdpdGggZWxlbWVudC1zcGVjaWZpYyBzZXR0aW5nc1xyXG4gIGlmIChub2RlLm5vZGVOYW1lID09ICdzdmcnKVxyXG4gICAgZWxlbWVudCA9IG5vZGUucGFyZW50Tm9kZSBpbnN0YW5jZW9mIHdpbmRvdy5TVkdFbGVtZW50ID8gbmV3IFNWRy5OZXN0ZWQgOiBuZXcgU1ZHLkRvY1xyXG4gIGVsc2UgaWYgKG5vZGUubm9kZU5hbWUgPT0gJ2xpbmVhckdyYWRpZW50JylcclxuICAgIGVsZW1lbnQgPSBuZXcgU1ZHLkdyYWRpZW50KCdsaW5lYXInKVxyXG4gIGVsc2UgaWYgKG5vZGUubm9kZU5hbWUgPT0gJ3JhZGlhbEdyYWRpZW50JylcclxuICAgIGVsZW1lbnQgPSBuZXcgU1ZHLkdyYWRpZW50KCdyYWRpYWwnKVxyXG4gIGVsc2UgaWYgKFNWR1tjYXBpdGFsaXplKG5vZGUubm9kZU5hbWUpXSlcclxuICAgIGVsZW1lbnQgPSBuZXcgU1ZHW2NhcGl0YWxpemUobm9kZS5ub2RlTmFtZSldXHJcbiAgZWxzZVxyXG4gICAgZWxlbWVudCA9IG5ldyBTVkcuRWxlbWVudChub2RlKVxyXG5cclxuICAvLyBlbnN1cmUgcmVmZXJlbmNlc1xyXG4gIGVsZW1lbnQudHlwZSAgPSBub2RlLm5vZGVOYW1lXHJcbiAgZWxlbWVudC5ub2RlICA9IG5vZGVcclxuICBub2RlLmluc3RhbmNlID0gZWxlbWVudFxyXG5cclxuICAvLyBTVkcuQ2xhc3Mgc3BlY2lmaWMgcHJlcGFyYXRpb25zXHJcbiAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBTVkcuRG9jKVxyXG4gICAgZWxlbWVudC5uYW1lc3BhY2UoKS5kZWZzKClcclxuXHJcbiAgLy8gcHVsbCBzdmdqcyBkYXRhIGZyb20gdGhlIGRvbSAoZ2V0QXR0cmlidXRlTlMgZG9lc24ndCB3b3JrIGluIGh0bWw1KVxyXG4gIGVsZW1lbnQuc2V0RGF0YShKU09OLnBhcnNlKG5vZGUuZ2V0QXR0cmlidXRlKCdzdmdqczpkYXRhJykpIHx8IHt9KVxyXG5cclxuICByZXR1cm4gZWxlbWVudFxyXG59XHJcblxyXG4vLyBJbml0aWFsaXplIHBhcnNpbmcgZWxlbWVudFxyXG5TVkcucHJlcGFyZSA9IGZ1bmN0aW9uKCkge1xyXG4gIC8vIFNlbGVjdCBkb2N1bWVudCBib2R5IGFuZCBjcmVhdGUgaW52aXNpYmxlIHN2ZyBlbGVtZW50XHJcbiAgdmFyIGJvZHkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnYm9keScpWzBdXHJcbiAgICAsIGRyYXcgPSAoYm9keSA/IG5ldyBTVkcuRG9jKGJvZHkpIDogU1ZHLmFkb3B0KGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkubmVzdGVkKCkpLnNpemUoMiwgMClcclxuXHJcbiAgLy8gQ3JlYXRlIHBhcnNlciBvYmplY3RcclxuICBTVkcucGFyc2VyID0ge1xyXG4gICAgYm9keTogYm9keSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcclxuICAsIGRyYXc6IGRyYXcuc3R5bGUoJ29wYWNpdHk6MDtwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0Oi0xMDAlO3RvcDotMTAwJTtvdmVyZmxvdzpoaWRkZW4nKS5ub2RlXHJcbiAgLCBwb2x5OiBkcmF3LnBvbHlsaW5lKCkubm9kZVxyXG4gICwgcGF0aDogZHJhdy5wYXRoKCkubm9kZVxyXG4gICwgbmF0aXZlOiBTVkcuY3JlYXRlKCdzdmcnKVxyXG4gIH1cclxufVxyXG5cclxuU1ZHLnBhcnNlciA9IHtcclxuICBuYXRpdmU6IFNWRy5jcmVhdGUoJ3N2ZycpXHJcbn1cclxuXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHtcclxuICBpZighU1ZHLnBhcnNlci5kcmF3KVxyXG4gICAgU1ZHLnByZXBhcmUoKVxyXG59LCBmYWxzZSlcclxuXG4vLyBTdG9yYWdlIGZvciByZWd1bGFyIGV4cHJlc3Npb25zXHJcblNWRy5yZWdleCA9IHtcclxuICAvLyBQYXJzZSB1bml0IHZhbHVlXHJcbiAgbnVtYmVyQW5kVW5pdDogICAgL14oWystXT8oXFxkKyhcXC5cXGQqKT98XFwuXFxkKykoZVsrLV0/XFxkKyk/KShbYS16JV0qKSQvaVxyXG5cclxuICAvLyBQYXJzZSBoZXggdmFsdWVcclxuLCBoZXg6ICAgICAgICAgICAgICAvXiM/KFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkoW2EtZlxcZF17Mn0pJC9pXHJcblxyXG4gIC8vIFBhcnNlIHJnYiB2YWx1ZVxyXG4sIHJnYjogICAgICAgICAgICAgIC9yZ2JcXCgoXFxkKyksKFxcZCspLChcXGQrKVxcKS9cclxuXHJcbiAgLy8gUGFyc2UgcmVmZXJlbmNlIGlkXHJcbiwgcmVmZXJlbmNlOiAgICAgICAgLyMoW2EtejAtOVxcLV9dKykvaVxyXG5cclxuICAvLyBzcGxpdHMgYSB0cmFuc2Zvcm1hdGlvbiBjaGFpblxyXG4sIHRyYW5zZm9ybXM6ICAgICAgIC9cXClcXHMqLD9cXHMqL1xyXG5cclxuICAvLyBXaGl0ZXNwYWNlXHJcbiwgd2hpdGVzcGFjZTogICAgICAgL1xccy9nXHJcblxyXG4gIC8vIFRlc3QgaGV4IHZhbHVlXHJcbiwgaXNIZXg6ICAgICAgICAgICAgL14jW2EtZjAtOV17Myw2fSQvaVxyXG5cclxuICAvLyBUZXN0IHJnYiB2YWx1ZVxyXG4sIGlzUmdiOiAgICAgICAgICAgIC9ecmdiXFwoL1xyXG5cclxuICAvLyBUZXN0IGNzcyBkZWNsYXJhdGlvblxyXG4sIGlzQ3NzOiAgICAgICAgICAgIC9bXjpdKzpbXjtdKzs/L1xyXG5cclxuICAvLyBUZXN0IGZvciBibGFuayBzdHJpbmdcclxuLCBpc0JsYW5rOiAgICAgICAgICAvXihcXHMrKT8kL1xyXG5cclxuICAvLyBUZXN0IGZvciBudW1lcmljIHN0cmluZ1xyXG4sIGlzTnVtYmVyOiAgICAgICAgIC9eWystXT8oXFxkKyhcXC5cXGQqKT98XFwuXFxkKykoZVsrLV0/XFxkKyk/JC9pXHJcblxyXG4gIC8vIFRlc3QgZm9yIHBlcmNlbnQgdmFsdWVcclxuLCBpc1BlcmNlbnQ6ICAgICAgICAvXi0/W1xcZFxcLl0rJSQvXHJcblxyXG4gIC8vIFRlc3QgZm9yIGltYWdlIHVybFxyXG4sIGlzSW1hZ2U6ICAgICAgICAgIC9cXC4oanBnfGpwZWd8cG5nfGdpZnxzdmcpKFxcP1tePV0rLiopPy9pXHJcblxyXG4gIC8vIHNwbGl0IGF0IHdoaXRlc3BhY2UgYW5kIGNvbW1hXHJcbiwgZGVsaW1pdGVyOiAgICAgICAgL1tcXHMsXSsvXHJcblxyXG4gIC8vIFRoZSBmb2xsb3dpbmcgcmVnZXggYXJlIHVzZWQgdG8gcGFyc2UgdGhlIGQgYXR0cmlidXRlIG9mIGEgcGF0aFxyXG5cclxuICAvLyBNYXRjaGVzIGFsbCBoeXBoZW5zIHdoaWNoIGFyZSBub3QgYWZ0ZXIgYW4gZXhwb25lbnRcclxuLCBoeXBoZW46ICAgICAgICAgICAvKFteZV0pXFwtL2dpXHJcblxyXG4gIC8vIFJlcGxhY2VzIGFuZCB0ZXN0cyBmb3IgYWxsIHBhdGggbGV0dGVyc1xyXG4sIHBhdGhMZXR0ZXJzOiAgICAgIC9bTUxIVkNTUVRBWl0vZ2lcclxuXHJcbiAgLy8geWVzIHdlIG5lZWQgdGhpcyBvbmUsIHRvb1xyXG4sIGlzUGF0aExldHRlcjogICAgIC9bTUxIVkNTUVRBWl0vaVxyXG5cclxuICAvLyBtYXRjaGVzIDAuMTU0LjIzLjQ1XHJcbiwgbnVtYmVyc1dpdGhEb3RzOiAgLygoXFxkP1xcLlxcZCsoPzplWystXT9cXGQrKT8pKCg/OlxcLlxcZCsoPzplWystXT9cXGQrKT8pKykpKy9naVxyXG5cclxuICAvLyBtYXRjaGVzIC5cclxuLCBkb3RzOiAgICAgICAgICAgICAvXFwuL2dcclxufVxyXG5cblNWRy51dGlscyA9IHtcclxuICAvLyBNYXAgZnVuY3Rpb25cclxuICBtYXA6IGZ1bmN0aW9uKGFycmF5LCBibG9jaykge1xyXG4gICAgdmFyIGlcclxuICAgICAgLCBpbCA9IGFycmF5Lmxlbmd0aFxyXG4gICAgICAsIHJlc3VsdCA9IFtdXHJcblxyXG4gICAgZm9yIChpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgIHJlc3VsdC5wdXNoKGJsb2NrKGFycmF5W2ldKSlcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0XHJcbiAgfVxyXG5cclxuICAvLyBGaWx0ZXIgZnVuY3Rpb25cclxuLCBmaWx0ZXI6IGZ1bmN0aW9uKGFycmF5LCBibG9jaykge1xyXG4gICAgdmFyIGlcclxuICAgICAgLCBpbCA9IGFycmF5Lmxlbmd0aFxyXG4gICAgICAsIHJlc3VsdCA9IFtdXHJcblxyXG4gICAgZm9yIChpID0gMDsgaSA8IGlsOyBpKyspXHJcbiAgICAgIGlmIChibG9jayhhcnJheVtpXSkpXHJcbiAgICAgICAgcmVzdWx0LnB1c2goYXJyYXlbaV0pXHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdFxyXG4gIH1cclxuXHJcbiAgLy8gRGVncmVlcyB0byByYWRpYW5zXHJcbiwgcmFkaWFuczogZnVuY3Rpb24oZCkge1xyXG4gICAgcmV0dXJuIGQgJSAzNjAgKiBNYXRoLlBJIC8gMTgwXHJcbiAgfVxyXG5cclxuICAvLyBSYWRpYW5zIHRvIGRlZ3JlZXNcclxuLCBkZWdyZWVzOiBmdW5jdGlvbihyKSB7XHJcbiAgICByZXR1cm4gciAqIDE4MCAvIE1hdGguUEkgJSAzNjBcclxuICB9XHJcblxyXG4sIGZpbHRlclNWR0VsZW1lbnRzOiBmdW5jdGlvbihub2Rlcykge1xyXG4gICAgcmV0dXJuIHRoaXMuZmlsdGVyKCBub2RlcywgZnVuY3Rpb24oZWwpIHsgcmV0dXJuIGVsIGluc3RhbmNlb2Ygd2luZG93LlNWR0VsZW1lbnQgfSlcclxuICB9XHJcblxyXG59XG5cclxuU1ZHLmRlZmF1bHRzID0ge1xyXG4gIC8vIERlZmF1bHQgYXR0cmlidXRlIHZhbHVlc1xyXG4gIGF0dHJzOiB7XHJcbiAgICAvLyBmaWxsIGFuZCBzdHJva2VcclxuICAgICdmaWxsLW9wYWNpdHknOiAgICAgMVxyXG4gICwgJ3N0cm9rZS1vcGFjaXR5JzogICAxXHJcbiAgLCAnc3Ryb2tlLXdpZHRoJzogICAgIDBcclxuICAsICdzdHJva2UtbGluZWpvaW4nOiAgJ21pdGVyJ1xyXG4gICwgJ3N0cm9rZS1saW5lY2FwJzogICAnYnV0dCdcclxuICAsIGZpbGw6ICAgICAgICAgICAgICAgJyMwMDAwMDAnXHJcbiAgLCBzdHJva2U6ICAgICAgICAgICAgICcjMDAwMDAwJ1xyXG4gICwgb3BhY2l0eTogICAgICAgICAgICAxXHJcbiAgICAvLyBwb3NpdGlvblxyXG4gICwgeDogICAgICAgICAgICAgICAgICAwXHJcbiAgLCB5OiAgICAgICAgICAgICAgICAgIDBcclxuICAsIGN4OiAgICAgICAgICAgICAgICAgMFxyXG4gICwgY3k6ICAgICAgICAgICAgICAgICAwXHJcbiAgICAvLyBzaXplXHJcbiAgLCB3aWR0aDogICAgICAgICAgICAgIDBcclxuICAsIGhlaWdodDogICAgICAgICAgICAgMFxyXG4gICAgLy8gcmFkaXVzXHJcbiAgLCByOiAgICAgICAgICAgICAgICAgIDBcclxuICAsIHJ4OiAgICAgICAgICAgICAgICAgMFxyXG4gICwgcnk6ICAgICAgICAgICAgICAgICAwXHJcbiAgICAvLyBncmFkaWVudFxyXG4gICwgb2Zmc2V0OiAgICAgICAgICAgICAwXHJcbiAgLCAnc3RvcC1vcGFjaXR5JzogICAgIDFcclxuICAsICdzdG9wLWNvbG9yJzogICAgICAgJyMwMDAwMDAnXHJcbiAgICAvLyB0ZXh0XHJcbiAgLCAnZm9udC1zaXplJzogICAgICAgIDE2XHJcbiAgLCAnZm9udC1mYW1pbHknOiAgICAgICdIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmJ1xyXG4gICwgJ3RleHQtYW5jaG9yJzogICAgICAnc3RhcnQnXHJcbiAgfVxyXG5cclxufVxuLy8gTW9kdWxlIGZvciBjb2xvciBjb252ZXJ0aW9uc1xyXG5TVkcuQ29sb3IgPSBmdW5jdGlvbihjb2xvcikge1xyXG4gIHZhciBtYXRjaFxyXG5cclxuICAvLyBpbml0aWFsaXplIGRlZmF1bHRzXHJcbiAgdGhpcy5yID0gMFxyXG4gIHRoaXMuZyA9IDBcclxuICB0aGlzLmIgPSAwXHJcblxyXG4gIGlmKCFjb2xvcikgcmV0dXJuXHJcblxyXG4gIC8vIHBhcnNlIGNvbG9yXHJcbiAgaWYgKHR5cGVvZiBjb2xvciA9PT0gJ3N0cmluZycpIHtcclxuICAgIGlmIChTVkcucmVnZXguaXNSZ2IudGVzdChjb2xvcikpIHtcclxuICAgICAgLy8gZ2V0IHJnYiB2YWx1ZXNcclxuICAgICAgbWF0Y2ggPSBTVkcucmVnZXgucmdiLmV4ZWMoY29sb3IucmVwbGFjZShTVkcucmVnZXgud2hpdGVzcGFjZSwnJykpXHJcblxyXG4gICAgICAvLyBwYXJzZSBudW1lcmljIHZhbHVlc1xyXG4gICAgICB0aGlzLnIgPSBwYXJzZUludChtYXRjaFsxXSlcclxuICAgICAgdGhpcy5nID0gcGFyc2VJbnQobWF0Y2hbMl0pXHJcbiAgICAgIHRoaXMuYiA9IHBhcnNlSW50KG1hdGNoWzNdKVxyXG5cclxuICAgIH0gZWxzZSBpZiAoU1ZHLnJlZ2V4LmlzSGV4LnRlc3QoY29sb3IpKSB7XHJcbiAgICAgIC8vIGdldCBoZXggdmFsdWVzXHJcbiAgICAgIG1hdGNoID0gU1ZHLnJlZ2V4LmhleC5leGVjKGZ1bGxIZXgoY29sb3IpKVxyXG5cclxuICAgICAgLy8gcGFyc2UgbnVtZXJpYyB2YWx1ZXNcclxuICAgICAgdGhpcy5yID0gcGFyc2VJbnQobWF0Y2hbMV0sIDE2KVxyXG4gICAgICB0aGlzLmcgPSBwYXJzZUludChtYXRjaFsyXSwgMTYpXHJcbiAgICAgIHRoaXMuYiA9IHBhcnNlSW50KG1hdGNoWzNdLCAxNilcclxuXHJcbiAgICB9XHJcblxyXG4gIH0gZWxzZSBpZiAodHlwZW9mIGNvbG9yID09PSAnb2JqZWN0Jykge1xyXG4gICAgdGhpcy5yID0gY29sb3IuclxyXG4gICAgdGhpcy5nID0gY29sb3IuZ1xyXG4gICAgdGhpcy5iID0gY29sb3IuYlxyXG5cclxuICB9XHJcblxyXG59XHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5Db2xvciwge1xyXG4gIC8vIERlZmF1bHQgdG8gaGV4IGNvbnZlcnNpb25cclxuICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy50b0hleCgpXHJcbiAgfVxyXG4gIC8vIEJ1aWxkIGhleCB2YWx1ZVxyXG4sIHRvSGV4OiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiAnIydcclxuICAgICAgKyBjb21wVG9IZXgodGhpcy5yKVxyXG4gICAgICArIGNvbXBUb0hleCh0aGlzLmcpXHJcbiAgICAgICsgY29tcFRvSGV4KHRoaXMuYilcclxuICB9XHJcbiAgLy8gQnVpbGQgcmdiIHZhbHVlXHJcbiwgdG9SZ2I6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuICdyZ2IoJyArIFt0aGlzLnIsIHRoaXMuZywgdGhpcy5iXS5qb2luKCkgKyAnKSdcclxuICB9XHJcbiAgLy8gQ2FsY3VsYXRlIHRydWUgYnJpZ2h0bmVzc1xyXG4sIGJyaWdodG5lc3M6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuICh0aGlzLnIgLyAyNTUgKiAwLjMwKVxyXG4gICAgICAgICArICh0aGlzLmcgLyAyNTUgKiAwLjU5KVxyXG4gICAgICAgICArICh0aGlzLmIgLyAyNTUgKiAwLjExKVxyXG4gIH1cclxuICAvLyBNYWtlIGNvbG9yIG1vcnBoYWJsZVxyXG4sIG1vcnBoOiBmdW5jdGlvbihjb2xvcikge1xyXG4gICAgdGhpcy5kZXN0aW5hdGlvbiA9IG5ldyBTVkcuQ29sb3IoY29sb3IpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gR2V0IG1vcnBoZWQgY29sb3IgYXQgZ2l2ZW4gcG9zaXRpb25cclxuLCBhdDogZnVuY3Rpb24ocG9zKSB7XHJcbiAgICAvLyBtYWtlIHN1cmUgYSBkZXN0aW5hdGlvbiBpcyBkZWZpbmVkXHJcbiAgICBpZiAoIXRoaXMuZGVzdGluYXRpb24pIHJldHVybiB0aGlzXHJcblxyXG4gICAgLy8gbm9ybWFsaXNlIHBvc1xyXG4gICAgcG9zID0gcG9zIDwgMCA/IDAgOiBwb3MgPiAxID8gMSA6IHBvc1xyXG5cclxuICAgIC8vIGdlbmVyYXRlIG1vcnBoZWQgY29sb3JcclxuICAgIHJldHVybiBuZXcgU1ZHLkNvbG9yKHtcclxuICAgICAgcjogfn4odGhpcy5yICsgKHRoaXMuZGVzdGluYXRpb24uciAtIHRoaXMucikgKiBwb3MpXHJcbiAgICAsIGc6IH5+KHRoaXMuZyArICh0aGlzLmRlc3RpbmF0aW9uLmcgLSB0aGlzLmcpICogcG9zKVxyXG4gICAgLCBiOiB+fih0aGlzLmIgKyAodGhpcy5kZXN0aW5hdGlvbi5iIC0gdGhpcy5iKSAqIHBvcylcclxuICAgIH0pXHJcbiAgfVxyXG5cclxufSlcclxuXHJcbi8vIFRlc3RlcnNcclxuXHJcbi8vIFRlc3QgaWYgZ2l2ZW4gdmFsdWUgaXMgYSBjb2xvciBzdHJpbmdcclxuU1ZHLkNvbG9yLnRlc3QgPSBmdW5jdGlvbihjb2xvcikge1xyXG4gIGNvbG9yICs9ICcnXHJcbiAgcmV0dXJuIFNWRy5yZWdleC5pc0hleC50ZXN0KGNvbG9yKVxyXG4gICAgICB8fCBTVkcucmVnZXguaXNSZ2IudGVzdChjb2xvcilcclxufVxyXG5cclxuLy8gVGVzdCBpZiBnaXZlbiB2YWx1ZSBpcyBhIHJnYiBvYmplY3RcclxuU1ZHLkNvbG9yLmlzUmdiID0gZnVuY3Rpb24oY29sb3IpIHtcclxuICByZXR1cm4gY29sb3IgJiYgdHlwZW9mIGNvbG9yLnIgPT0gJ251bWJlcidcclxuICAgICAgICAgICAgICAgJiYgdHlwZW9mIGNvbG9yLmcgPT0gJ251bWJlcidcclxuICAgICAgICAgICAgICAgJiYgdHlwZW9mIGNvbG9yLmIgPT0gJ251bWJlcidcclxufVxyXG5cclxuLy8gVGVzdCBpZiBnaXZlbiB2YWx1ZSBpcyBhIGNvbG9yXHJcblNWRy5Db2xvci5pc0NvbG9yID0gZnVuY3Rpb24oY29sb3IpIHtcclxuICByZXR1cm4gU1ZHLkNvbG9yLmlzUmdiKGNvbG9yKSB8fCBTVkcuQ29sb3IudGVzdChjb2xvcilcclxufVxuLy8gTW9kdWxlIGZvciBhcnJheSBjb252ZXJzaW9uXHJcblNWRy5BcnJheSA9IGZ1bmN0aW9uKGFycmF5LCBmYWxsYmFjaykge1xyXG4gIGFycmF5ID0gKGFycmF5IHx8IFtdKS52YWx1ZU9mKClcclxuXHJcbiAgLy8gaWYgYXJyYXkgaXMgZW1wdHkgYW5kIGZhbGxiYWNrIGlzIHByb3ZpZGVkLCB1c2UgZmFsbGJhY2tcclxuICBpZiAoYXJyYXkubGVuZ3RoID09IDAgJiYgZmFsbGJhY2spXHJcbiAgICBhcnJheSA9IGZhbGxiYWNrLnZhbHVlT2YoKVxyXG5cclxuICAvLyBwYXJzZSBhcnJheVxyXG4gIHRoaXMudmFsdWUgPSB0aGlzLnBhcnNlKGFycmF5KVxyXG59XHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5BcnJheSwge1xyXG4gIC8vIE1ha2UgYXJyYXkgbW9ycGhhYmxlXHJcbiAgbW9ycGg6IGZ1bmN0aW9uKGFycmF5KSB7XHJcbiAgICB0aGlzLmRlc3RpbmF0aW9uID0gdGhpcy5wYXJzZShhcnJheSlcclxuXHJcbiAgICAvLyBub3JtYWxpemUgbGVuZ3RoIG9mIGFycmF5c1xyXG4gICAgaWYgKHRoaXMudmFsdWUubGVuZ3RoICE9IHRoaXMuZGVzdGluYXRpb24ubGVuZ3RoKSB7XHJcbiAgICAgIHZhciBsYXN0VmFsdWUgICAgICAgPSB0aGlzLnZhbHVlW3RoaXMudmFsdWUubGVuZ3RoIC0gMV1cclxuICAgICAgICAsIGxhc3REZXN0aW5hdGlvbiA9IHRoaXMuZGVzdGluYXRpb25bdGhpcy5kZXN0aW5hdGlvbi5sZW5ndGggLSAxXVxyXG5cclxuICAgICAgd2hpbGUodGhpcy52YWx1ZS5sZW5ndGggPiB0aGlzLmRlc3RpbmF0aW9uLmxlbmd0aClcclxuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uLnB1c2gobGFzdERlc3RpbmF0aW9uKVxyXG4gICAgICB3aGlsZSh0aGlzLnZhbHVlLmxlbmd0aCA8IHRoaXMuZGVzdGluYXRpb24ubGVuZ3RoKVxyXG4gICAgICAgIHRoaXMudmFsdWUucHVzaChsYXN0VmFsdWUpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gQ2xlYW4gdXAgYW55IGR1cGxpY2F0ZSBwb2ludHNcclxuLCBzZXR0bGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gZmluZCBhbGwgdW5pcXVlIHZhbHVlc1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gdGhpcy52YWx1ZS5sZW5ndGgsIHNlZW4gPSBbXTsgaSA8IGlsOyBpKyspXHJcbiAgICAgIGlmIChzZWVuLmluZGV4T2YodGhpcy52YWx1ZVtpXSkgPT0gLTEpXHJcbiAgICAgICAgc2Vlbi5wdXNoKHRoaXMudmFsdWVbaV0pXHJcblxyXG4gICAgLy8gc2V0IG5ldyB2YWx1ZVxyXG4gICAgcmV0dXJuIHRoaXMudmFsdWUgPSBzZWVuXHJcbiAgfVxyXG4gIC8vIEdldCBtb3JwaGVkIGFycmF5IGF0IGdpdmVuIHBvc2l0aW9uXHJcbiwgYXQ6IGZ1bmN0aW9uKHBvcykge1xyXG4gICAgLy8gbWFrZSBzdXJlIGEgZGVzdGluYXRpb24gaXMgZGVmaW5lZFxyXG4gICAgaWYgKCF0aGlzLmRlc3RpbmF0aW9uKSByZXR1cm4gdGhpc1xyXG5cclxuICAgIC8vIGdlbmVyYXRlIG1vcnBoZWQgYXJyYXlcclxuICAgIGZvciAodmFyIGkgPSAwLCBpbCA9IHRoaXMudmFsdWUubGVuZ3RoLCBhcnJheSA9IFtdOyBpIDwgaWw7IGkrKylcclxuICAgICAgYXJyYXkucHVzaCh0aGlzLnZhbHVlW2ldICsgKHRoaXMuZGVzdGluYXRpb25baV0gLSB0aGlzLnZhbHVlW2ldKSAqIHBvcylcclxuXHJcbiAgICByZXR1cm4gbmV3IFNWRy5BcnJheShhcnJheSlcclxuICB9XHJcbiAgLy8gQ29udmVydCBhcnJheSB0byBzdHJpbmdcclxuLCB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5qb2luKCcgJylcclxuICB9XHJcbiAgLy8gUmVhbCB2YWx1ZVxyXG4sIHZhbHVlT2Y6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMudmFsdWVcclxuICB9XHJcbiAgLy8gUGFyc2Ugd2hpdGVzcGFjZSBzZXBhcmF0ZWQgc3RyaW5nXHJcbiwgcGFyc2U6IGZ1bmN0aW9uKGFycmF5KSB7XHJcbiAgICBhcnJheSA9IGFycmF5LnZhbHVlT2YoKVxyXG5cclxuICAgIC8vIGlmIGFscmVhZHkgaXMgYW4gYXJyYXksIG5vIG5lZWQgdG8gcGFyc2UgaXRcclxuICAgIGlmIChBcnJheS5pc0FycmF5KGFycmF5KSkgcmV0dXJuIGFycmF5XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuc3BsaXQoYXJyYXkpXHJcbiAgfVxyXG4gIC8vIFN0cmlwIHVubmVjZXNzYXJ5IHdoaXRlc3BhY2VcclxuLCBzcGxpdDogZnVuY3Rpb24oc3RyaW5nKSB7XHJcbiAgICByZXR1cm4gc3RyaW5nLnRyaW0oKS5zcGxpdChTVkcucmVnZXguZGVsaW1pdGVyKS5tYXAocGFyc2VGbG9hdClcclxuICB9XHJcbiAgLy8gUmV2ZXJzZSBhcnJheVxyXG4sIHJldmVyc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy52YWx1ZS5yZXZlcnNlKClcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuLCBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgY2xvbmUgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcigpXHJcbiAgICBjbG9uZS52YWx1ZSA9IGFycmF5X2Nsb25lKHRoaXMudmFsdWUpXHJcbiAgICByZXR1cm4gY2xvbmVcclxuICB9XHJcbn0pXG4vLyBQb2x5IHBvaW50cyBhcnJheVxyXG5TVkcuUG9pbnRBcnJheSA9IGZ1bmN0aW9uKGFycmF5LCBmYWxsYmFjaykge1xyXG4gIFNWRy5BcnJheS5jYWxsKHRoaXMsIGFycmF5LCBmYWxsYmFjayB8fCBbWzAsMF1dKVxyXG59XHJcblxyXG4vLyBJbmhlcml0IGZyb20gU1ZHLkFycmF5XHJcblNWRy5Qb2ludEFycmF5LnByb3RvdHlwZSA9IG5ldyBTVkcuQXJyYXlcclxuU1ZHLlBvaW50QXJyYXkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU1ZHLlBvaW50QXJyYXlcclxuXHJcblNWRy5leHRlbmQoU1ZHLlBvaW50QXJyYXksIHtcclxuICAvLyBDb252ZXJ0IGFycmF5IHRvIHN0cmluZ1xyXG4gIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgIC8vIGNvbnZlcnQgdG8gYSBwb2x5IHBvaW50IHN0cmluZ1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gdGhpcy52YWx1ZS5sZW5ndGgsIGFycmF5ID0gW107IGkgPCBpbDsgaSsrKVxyXG4gICAgICBhcnJheS5wdXNoKHRoaXMudmFsdWVbaV0uam9pbignLCcpKVxyXG5cclxuICAgIHJldHVybiBhcnJheS5qb2luKCcgJylcclxuICB9XHJcbiAgLy8gQ29udmVydCBhcnJheSB0byBsaW5lIG9iamVjdFxyXG4sIHRvTGluZTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB4MTogdGhpcy52YWx1ZVswXVswXVxyXG4gICAgLCB5MTogdGhpcy52YWx1ZVswXVsxXVxyXG4gICAgLCB4MjogdGhpcy52YWx1ZVsxXVswXVxyXG4gICAgLCB5MjogdGhpcy52YWx1ZVsxXVsxXVxyXG4gICAgfVxyXG4gIH1cclxuICAvLyBHZXQgbW9ycGhlZCBhcnJheSBhdCBnaXZlbiBwb3NpdGlvblxyXG4sIGF0OiBmdW5jdGlvbihwb3MpIHtcclxuICAgIC8vIG1ha2Ugc3VyZSBhIGRlc3RpbmF0aW9uIGlzIGRlZmluZWRcclxuICAgIGlmICghdGhpcy5kZXN0aW5hdGlvbikgcmV0dXJuIHRoaXNcclxuXHJcbiAgICAvLyBnZW5lcmF0ZSBtb3JwaGVkIHBvaW50IHN0cmluZ1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gdGhpcy52YWx1ZS5sZW5ndGgsIGFycmF5ID0gW107IGkgPCBpbDsgaSsrKVxyXG4gICAgICBhcnJheS5wdXNoKFtcclxuICAgICAgICB0aGlzLnZhbHVlW2ldWzBdICsgKHRoaXMuZGVzdGluYXRpb25baV1bMF0gLSB0aGlzLnZhbHVlW2ldWzBdKSAqIHBvc1xyXG4gICAgICAsIHRoaXMudmFsdWVbaV1bMV0gKyAodGhpcy5kZXN0aW5hdGlvbltpXVsxXSAtIHRoaXMudmFsdWVbaV1bMV0pICogcG9zXHJcbiAgICAgIF0pXHJcblxyXG4gICAgcmV0dXJuIG5ldyBTVkcuUG9pbnRBcnJheShhcnJheSlcclxuICB9XHJcbiAgLy8gUGFyc2UgcG9pbnQgc3RyaW5nIGFuZCBmbGF0IGFycmF5XHJcbiwgcGFyc2U6IGZ1bmN0aW9uKGFycmF5KSB7XHJcbiAgICB2YXIgcG9pbnRzID0gW11cclxuXHJcbiAgICBhcnJheSA9IGFycmF5LnZhbHVlT2YoKVxyXG5cclxuICAgIC8vIGlmIGl0IGlzIGFuIGFycmF5XHJcbiAgICBpZiAoQXJyYXkuaXNBcnJheShhcnJheSkpIHtcclxuICAgICAgLy8gYW5kIGl0IGlzIG5vdCBmbGF0LCB0aGVyZSBpcyBubyBuZWVkIHRvIHBhcnNlIGl0XHJcbiAgICAgIGlmKEFycmF5LmlzQXJyYXkoYXJyYXlbMF0pKSB7XHJcbiAgICAgICAgcmV0dXJuIGFycmF5XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7IC8vIEVsc2UsIGl0IGlzIGNvbnNpZGVyZWQgYXMgYSBzdHJpbmdcclxuICAgICAgLy8gcGFyc2UgcG9pbnRzXHJcbiAgICAgIGFycmF5ID0gYXJyYXkudHJpbSgpLnNwbGl0KFNWRy5yZWdleC5kZWxpbWl0ZXIpLm1hcChwYXJzZUZsb2F0KVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHZhbGlkYXRlIHBvaW50cyAtIGh0dHBzOi8vc3Znd2cub3JnL3N2ZzItZHJhZnQvc2hhcGVzLmh0bWwjRGF0YVR5cGVQb2ludHNcclxuICAgIC8vIE9kZCBudW1iZXIgb2YgY29vcmRpbmF0ZXMgaXMgYW4gZXJyb3IuIEluIHN1Y2ggY2FzZXMsIGRyb3AgdGhlIGxhc3Qgb2RkIGNvb3JkaW5hdGUuXHJcbiAgICBpZiAoYXJyYXkubGVuZ3RoICUgMiAhPT0gMCkgYXJyYXkucG9wKClcclxuXHJcbiAgICAvLyB3cmFwIHBvaW50cyBpbiB0d28tdHVwbGVzIGFuZCBwYXJzZSBwb2ludHMgYXMgZmxvYXRzXHJcbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSBhcnJheS5sZW5ndGg7IGkgPCBsZW47IGkgPSBpICsgMilcclxuICAgICAgcG9pbnRzLnB1c2goWyBhcnJheVtpXSwgYXJyYXlbaSsxXSBdKVxyXG5cclxuICAgIHJldHVybiBwb2ludHNcclxuICB9XHJcbiAgLy8gTW92ZSBwb2ludCBzdHJpbmdcclxuLCBtb3ZlOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICB2YXIgYm94ID0gdGhpcy5iYm94KClcclxuXHJcbiAgICAvLyBnZXQgcmVsYXRpdmUgb2Zmc2V0XHJcbiAgICB4IC09IGJveC54XHJcbiAgICB5IC09IGJveC55XHJcblxyXG4gICAgLy8gbW92ZSBldmVyeSBwb2ludFxyXG4gICAgaWYgKCFpc05hTih4KSAmJiAhaXNOYU4oeSkpXHJcbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnZhbHVlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKVxyXG4gICAgICAgIHRoaXMudmFsdWVbaV0gPSBbdGhpcy52YWx1ZVtpXVswXSArIHgsIHRoaXMudmFsdWVbaV1bMV0gKyB5XVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIFJlc2l6ZSBwb2x5IHN0cmluZ1xyXG4sIHNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIHZhciBpLCBib3ggPSB0aGlzLmJib3goKVxyXG5cclxuICAgIC8vIHJlY2FsY3VsYXRlIHBvc2l0aW9uIG9mIGFsbCBwb2ludHMgYWNjb3JkaW5nIHRvIG5ldyBzaXplXHJcbiAgICBmb3IgKGkgPSB0aGlzLnZhbHVlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIGlmKGJveC53aWR0aCkgdGhpcy52YWx1ZVtpXVswXSA9ICgodGhpcy52YWx1ZVtpXVswXSAtIGJveC54KSAqIHdpZHRoKSAgLyBib3gud2lkdGggICsgYm94LnhcclxuICAgICAgaWYoYm94LmhlaWdodCkgdGhpcy52YWx1ZVtpXVsxXSA9ICgodGhpcy52YWx1ZVtpXVsxXSAtIGJveC55KSAqIGhlaWdodCkgLyBib3guaGVpZ2h0ICsgYm94LnlcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBHZXQgYm91bmRpbmcgYm94IG9mIHBvaW50c1xyXG4sIGJib3g6IGZ1bmN0aW9uKCkge1xyXG4gICAgU1ZHLnBhcnNlci5wb2x5LnNldEF0dHJpYnV0ZSgncG9pbnRzJywgdGhpcy50b1N0cmluZygpKVxyXG5cclxuICAgIHJldHVybiBTVkcucGFyc2VyLnBvbHkuZ2V0QkJveCgpXHJcbiAgfVxyXG59KVxyXG5cbnZhciBwYXRoSGFuZGxlcnMgPSB7XHJcbiAgTTogZnVuY3Rpb24oYywgcCwgcDApIHtcclxuICAgIHAueCA9IHAwLnggPSBjWzBdXHJcbiAgICBwLnkgPSBwMC55ID0gY1sxXVxyXG5cclxuICAgIHJldHVybiBbJ00nLCBwLngsIHAueV1cclxuICB9LFxyXG4gIEw6IGZ1bmN0aW9uKGMsIHApIHtcclxuICAgIHAueCA9IGNbMF1cclxuICAgIHAueSA9IGNbMV1cclxuICAgIHJldHVybiBbJ0wnLCBjWzBdLCBjWzFdXVxyXG4gIH0sXHJcbiAgSDogZnVuY3Rpb24oYywgcCkge1xyXG4gICAgcC54ID0gY1swXVxyXG4gICAgcmV0dXJuIFsnSCcsIGNbMF1dXHJcbiAgfSxcclxuICBWOiBmdW5jdGlvbihjLCBwKSB7XHJcbiAgICBwLnkgPSBjWzBdXHJcbiAgICByZXR1cm4gWydWJywgY1swXV1cclxuICB9LFxyXG4gIEM6IGZ1bmN0aW9uKGMsIHApIHtcclxuICAgIHAueCA9IGNbNF1cclxuICAgIHAueSA9IGNbNV1cclxuICAgIHJldHVybiBbJ0MnLCBjWzBdLCBjWzFdLCBjWzJdLCBjWzNdLCBjWzRdLCBjWzVdXVxyXG4gIH0sXHJcbiAgUzogZnVuY3Rpb24oYywgcCkge1xyXG4gICAgcC54ID0gY1syXVxyXG4gICAgcC55ID0gY1szXVxyXG4gICAgcmV0dXJuIFsnUycsIGNbMF0sIGNbMV0sIGNbMl0sIGNbM11dXHJcbiAgfSxcclxuICBROiBmdW5jdGlvbihjLCBwKSB7XHJcbiAgICBwLnggPSBjWzJdXHJcbiAgICBwLnkgPSBjWzNdXHJcbiAgICByZXR1cm4gWydRJywgY1swXSwgY1sxXSwgY1syXSwgY1szXV1cclxuICB9LFxyXG4gIFQ6IGZ1bmN0aW9uKGMsIHApIHtcclxuICAgIHAueCA9IGNbMF1cclxuICAgIHAueSA9IGNbMV1cclxuICAgIHJldHVybiBbJ1QnLCBjWzBdLCBjWzFdXVxyXG4gIH0sXHJcbiAgWjogZnVuY3Rpb24oYywgcCwgcDApIHtcclxuICAgIHAueCA9IHAwLnhcclxuICAgIHAueSA9IHAwLnlcclxuICAgIHJldHVybiBbJ1onXVxyXG4gIH0sXHJcbiAgQTogZnVuY3Rpb24oYywgcCkge1xyXG4gICAgcC54ID0gY1s1XVxyXG4gICAgcC55ID0gY1s2XVxyXG4gICAgcmV0dXJuIFsnQScsIGNbMF0sIGNbMV0sIGNbMl0sIGNbM10sIGNbNF0sIGNbNV0sIGNbNl1dXHJcbiAgfVxyXG59XHJcblxyXG52YXIgbWxodnF0Y3NhID0gJ21saHZxdGNzYXonLnNwbGl0KCcnKVxyXG5cclxuZm9yKHZhciBpID0gMCwgaWwgPSBtbGh2cXRjc2EubGVuZ3RoOyBpIDwgaWw7ICsraSl7XHJcbiAgcGF0aEhhbmRsZXJzW21saHZxdGNzYVtpXV0gPSAoZnVuY3Rpb24oaSl7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24oYywgcCwgcDApIHtcclxuICAgICAgaWYoaSA9PSAnSCcpIGNbMF0gPSBjWzBdICsgcC54XHJcbiAgICAgIGVsc2UgaWYoaSA9PSAnVicpIGNbMF0gPSBjWzBdICsgcC55XHJcbiAgICAgIGVsc2UgaWYoaSA9PSAnQScpe1xyXG4gICAgICAgIGNbNV0gPSBjWzVdICsgcC54LFxyXG4gICAgICAgIGNbNl0gPSBjWzZdICsgcC55XHJcbiAgICAgIH1cclxuICAgICAgZWxzZVxyXG4gICAgICAgIGZvcih2YXIgaiA9IDAsIGpsID0gYy5sZW5ndGg7IGogPCBqbDsgKytqKSB7XHJcbiAgICAgICAgICBjW2pdID0gY1tqXSArIChqJTIgPyBwLnkgOiBwLngpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHBhdGhIYW5kbGVyc1tpXShjLCBwLCBwMClcclxuICAgIH1cclxuICB9KShtbGh2cXRjc2FbaV0udG9VcHBlckNhc2UoKSlcclxufVxyXG5cclxuLy8gUGF0aCBwb2ludHMgYXJyYXlcclxuU1ZHLlBhdGhBcnJheSA9IGZ1bmN0aW9uKGFycmF5LCBmYWxsYmFjaykge1xyXG4gIFNWRy5BcnJheS5jYWxsKHRoaXMsIGFycmF5LCBmYWxsYmFjayB8fCBbWydNJywgMCwgMF1dKVxyXG59XHJcblxyXG4vLyBJbmhlcml0IGZyb20gU1ZHLkFycmF5XHJcblNWRy5QYXRoQXJyYXkucHJvdG90eXBlID0gbmV3IFNWRy5BcnJheVxyXG5TVkcuUGF0aEFycmF5LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNWRy5QYXRoQXJyYXlcclxuXHJcblNWRy5leHRlbmQoU1ZHLlBhdGhBcnJheSwge1xyXG4gIC8vIENvbnZlcnQgYXJyYXkgdG8gc3RyaW5nXHJcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIGFycmF5VG9TdHJpbmcodGhpcy52YWx1ZSlcclxuICB9XHJcbiAgLy8gTW92ZSBwYXRoIHN0cmluZ1xyXG4sIG1vdmU6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIC8vIGdldCBib3VuZGluZyBib3ggb2YgY3VycmVudCBzaXR1YXRpb25cclxuICAgIHZhciBib3ggPSB0aGlzLmJib3goKVxyXG5cclxuICAgIC8vIGdldCByZWxhdGl2ZSBvZmZzZXRcclxuICAgIHggLT0gYm94LnhcclxuICAgIHkgLT0gYm94LnlcclxuXHJcbiAgICBpZiAoIWlzTmFOKHgpICYmICFpc05hTih5KSkge1xyXG4gICAgICAvLyBtb3ZlIGV2ZXJ5IHBvaW50XHJcbiAgICAgIGZvciAodmFyIGwsIGkgPSB0aGlzLnZhbHVlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgbCA9IHRoaXMudmFsdWVbaV1bMF1cclxuXHJcbiAgICAgICAgaWYgKGwgPT0gJ00nIHx8IGwgPT0gJ0wnIHx8IGwgPT0gJ1QnKSAge1xyXG4gICAgICAgICAgdGhpcy52YWx1ZVtpXVsxXSArPSB4XHJcbiAgICAgICAgICB0aGlzLnZhbHVlW2ldWzJdICs9IHlcclxuXHJcbiAgICAgICAgfSBlbHNlIGlmIChsID09ICdIJykgIHtcclxuICAgICAgICAgIHRoaXMudmFsdWVbaV1bMV0gKz0geFxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGwgPT0gJ1YnKSAge1xyXG4gICAgICAgICAgdGhpcy52YWx1ZVtpXVsxXSArPSB5XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAobCA9PSAnQycgfHwgbCA9PSAnUycgfHwgbCA9PSAnUScpICB7XHJcbiAgICAgICAgICB0aGlzLnZhbHVlW2ldWzFdICs9IHhcclxuICAgICAgICAgIHRoaXMudmFsdWVbaV1bMl0gKz0geVxyXG4gICAgICAgICAgdGhpcy52YWx1ZVtpXVszXSArPSB4XHJcbiAgICAgICAgICB0aGlzLnZhbHVlW2ldWzRdICs9IHlcclxuXHJcbiAgICAgICAgICBpZiAobCA9PSAnQycpICB7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVbaV1bNV0gKz0geFxyXG4gICAgICAgICAgICB0aGlzLnZhbHVlW2ldWzZdICs9IHlcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIGlmIChsID09ICdBJykgIHtcclxuICAgICAgICAgIHRoaXMudmFsdWVbaV1bNl0gKz0geFxyXG4gICAgICAgICAgdGhpcy52YWx1ZVtpXVs3XSArPSB5XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIFJlc2l6ZSBwYXRoIHN0cmluZ1xyXG4sIHNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIC8vIGdldCBib3VuZGluZyBib3ggb2YgY3VycmVudCBzaXR1YXRpb25cclxuICAgIHZhciBpLCBsLCBib3ggPSB0aGlzLmJib3goKVxyXG5cclxuICAgIC8vIHJlY2FsY3VsYXRlIHBvc2l0aW9uIG9mIGFsbCBwb2ludHMgYWNjb3JkaW5nIHRvIG5ldyBzaXplXHJcbiAgICBmb3IgKGkgPSB0aGlzLnZhbHVlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgIGwgPSB0aGlzLnZhbHVlW2ldWzBdXHJcblxyXG4gICAgICBpZiAobCA9PSAnTScgfHwgbCA9PSAnTCcgfHwgbCA9PSAnVCcpICB7XHJcbiAgICAgICAgdGhpcy52YWx1ZVtpXVsxXSA9ICgodGhpcy52YWx1ZVtpXVsxXSAtIGJveC54KSAqIHdpZHRoKSAgLyBib3gud2lkdGggICsgYm94LnhcclxuICAgICAgICB0aGlzLnZhbHVlW2ldWzJdID0gKCh0aGlzLnZhbHVlW2ldWzJdIC0gYm94LnkpICogaGVpZ2h0KSAvIGJveC5oZWlnaHQgKyBib3gueVxyXG5cclxuICAgICAgfSBlbHNlIGlmIChsID09ICdIJykgIHtcclxuICAgICAgICB0aGlzLnZhbHVlW2ldWzFdID0gKCh0aGlzLnZhbHVlW2ldWzFdIC0gYm94LngpICogd2lkdGgpICAvIGJveC53aWR0aCAgKyBib3gueFxyXG5cclxuICAgICAgfSBlbHNlIGlmIChsID09ICdWJykgIHtcclxuICAgICAgICB0aGlzLnZhbHVlW2ldWzFdID0gKCh0aGlzLnZhbHVlW2ldWzFdIC0gYm94LnkpICogaGVpZ2h0KSAvIGJveC5oZWlnaHQgKyBib3gueVxyXG5cclxuICAgICAgfSBlbHNlIGlmIChsID09ICdDJyB8fCBsID09ICdTJyB8fCBsID09ICdRJykgIHtcclxuICAgICAgICB0aGlzLnZhbHVlW2ldWzFdID0gKCh0aGlzLnZhbHVlW2ldWzFdIC0gYm94LngpICogd2lkdGgpICAvIGJveC53aWR0aCAgKyBib3gueFxyXG4gICAgICAgIHRoaXMudmFsdWVbaV1bMl0gPSAoKHRoaXMudmFsdWVbaV1bMl0gLSBib3gueSkgKiBoZWlnaHQpIC8gYm94LmhlaWdodCArIGJveC55XHJcbiAgICAgICAgdGhpcy52YWx1ZVtpXVszXSA9ICgodGhpcy52YWx1ZVtpXVszXSAtIGJveC54KSAqIHdpZHRoKSAgLyBib3gud2lkdGggICsgYm94LnhcclxuICAgICAgICB0aGlzLnZhbHVlW2ldWzRdID0gKCh0aGlzLnZhbHVlW2ldWzRdIC0gYm94LnkpICogaGVpZ2h0KSAvIGJveC5oZWlnaHQgKyBib3gueVxyXG5cclxuICAgICAgICBpZiAobCA9PSAnQycpICB7XHJcbiAgICAgICAgICB0aGlzLnZhbHVlW2ldWzVdID0gKCh0aGlzLnZhbHVlW2ldWzVdIC0gYm94LngpICogd2lkdGgpICAvIGJveC53aWR0aCAgKyBib3gueFxyXG4gICAgICAgICAgdGhpcy52YWx1ZVtpXVs2XSA9ICgodGhpcy52YWx1ZVtpXVs2XSAtIGJveC55KSAqIGhlaWdodCkgLyBib3guaGVpZ2h0ICsgYm94LnlcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2UgaWYgKGwgPT0gJ0EnKSAge1xyXG4gICAgICAgIC8vIHJlc2l6ZSByYWRpaVxyXG4gICAgICAgIHRoaXMudmFsdWVbaV1bMV0gPSAodGhpcy52YWx1ZVtpXVsxXSAqIHdpZHRoKSAgLyBib3gud2lkdGhcclxuICAgICAgICB0aGlzLnZhbHVlW2ldWzJdID0gKHRoaXMudmFsdWVbaV1bMl0gKiBoZWlnaHQpIC8gYm94LmhlaWdodFxyXG5cclxuICAgICAgICAvLyBtb3ZlIHBvc2l0aW9uIHZhbHVlc1xyXG4gICAgICAgIHRoaXMudmFsdWVbaV1bNl0gPSAoKHRoaXMudmFsdWVbaV1bNl0gLSBib3gueCkgKiB3aWR0aCkgIC8gYm94LndpZHRoICArIGJveC54XHJcbiAgICAgICAgdGhpcy52YWx1ZVtpXVs3XSA9ICgodGhpcy52YWx1ZVtpXVs3XSAtIGJveC55KSAqIGhlaWdodCkgLyBib3guaGVpZ2h0ICsgYm94LnlcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBUZXN0IGlmIHRoZSBwYXNzZWQgcGF0aCBhcnJheSB1c2UgdGhlIHNhbWUgcGF0aCBkYXRhIGNvbW1hbmRzIGFzIHRoaXMgcGF0aCBhcnJheVxyXG4sIGVxdWFsQ29tbWFuZHM6IGZ1bmN0aW9uKHBhdGhBcnJheSkge1xyXG4gICAgdmFyIGksIGlsLCBlcXVhbENvbW1hbmRzXHJcblxyXG4gICAgcGF0aEFycmF5ID0gbmV3IFNWRy5QYXRoQXJyYXkocGF0aEFycmF5KVxyXG5cclxuICAgIGVxdWFsQ29tbWFuZHMgPSB0aGlzLnZhbHVlLmxlbmd0aCA9PT0gcGF0aEFycmF5LnZhbHVlLmxlbmd0aFxyXG4gICAgZm9yKGkgPSAwLCBpbCA9IHRoaXMudmFsdWUubGVuZ3RoOyBlcXVhbENvbW1hbmRzICYmIGkgPCBpbDsgaSsrKSB7XHJcbiAgICAgIGVxdWFsQ29tbWFuZHMgPSB0aGlzLnZhbHVlW2ldWzBdID09PSBwYXRoQXJyYXkudmFsdWVbaV1bMF1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZXF1YWxDb21tYW5kc1xyXG4gIH1cclxuICAvLyBNYWtlIHBhdGggYXJyYXkgbW9ycGhhYmxlXHJcbiwgbW9ycGg6IGZ1bmN0aW9uKHBhdGhBcnJheSkge1xyXG4gICAgcGF0aEFycmF5ID0gbmV3IFNWRy5QYXRoQXJyYXkocGF0aEFycmF5KVxyXG5cclxuICAgIGlmKHRoaXMuZXF1YWxDb21tYW5kcyhwYXRoQXJyYXkpKSB7XHJcbiAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBwYXRoQXJyYXlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBudWxsXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gR2V0IG1vcnBoZWQgcGF0aCBhcnJheSBhdCBnaXZlbiBwb3NpdGlvblxyXG4sIGF0OiBmdW5jdGlvbihwb3MpIHtcclxuICAgIC8vIG1ha2Ugc3VyZSBhIGRlc3RpbmF0aW9uIGlzIGRlZmluZWRcclxuICAgIGlmICghdGhpcy5kZXN0aW5hdGlvbikgcmV0dXJuIHRoaXNcclxuXHJcbiAgICB2YXIgc291cmNlQXJyYXkgPSB0aGlzLnZhbHVlXHJcbiAgICAgICwgZGVzdGluYXRpb25BcnJheSA9IHRoaXMuZGVzdGluYXRpb24udmFsdWVcclxuICAgICAgLCBhcnJheSA9IFtdLCBwYXRoQXJyYXkgPSBuZXcgU1ZHLlBhdGhBcnJheSgpXHJcbiAgICAgICwgaSwgaWwsIGosIGpsXHJcblxyXG4gICAgLy8gQW5pbWF0ZSBoYXMgc3BlY2lmaWVkIGluIHRoZSBTVkcgc3BlY1xyXG4gICAgLy8gU2VlOiBodHRwczovL3d3dy53My5vcmcvVFIvU1ZHMTEvcGF0aHMuaHRtbCNQYXRoRWxlbWVudFxyXG4gICAgZm9yIChpID0gMCwgaWwgPSBzb3VyY2VBcnJheS5sZW5ndGg7IGkgPCBpbDsgaSsrKSB7XHJcbiAgICAgIGFycmF5W2ldID0gW3NvdXJjZUFycmF5W2ldWzBdXVxyXG4gICAgICBmb3IoaiA9IDEsIGpsID0gc291cmNlQXJyYXlbaV0ubGVuZ3RoOyBqIDwgamw7IGorKykge1xyXG4gICAgICAgIGFycmF5W2ldW2pdID0gc291cmNlQXJyYXlbaV1bal0gKyAoZGVzdGluYXRpb25BcnJheVtpXVtqXSAtIHNvdXJjZUFycmF5W2ldW2pdKSAqIHBvc1xyXG4gICAgICB9XHJcbiAgICAgIC8vIEZvciB0aGUgdHdvIGZsYWdzIG9mIHRoZSBlbGxpcHRpY2FsIGFyYyBjb21tYW5kLCB0aGUgU1ZHIHNwZWMgc2F5OlxyXG4gICAgICAvLyBGbGFncyBhbmQgYm9vbGVhbnMgYXJlIGludGVycG9sYXRlZCBhcyBmcmFjdGlvbnMgYmV0d2VlbiB6ZXJvIGFuZCBvbmUsIHdpdGggYW55IG5vbi16ZXJvIHZhbHVlIGNvbnNpZGVyZWQgdG8gYmUgYSB2YWx1ZSBvZiBvbmUvdHJ1ZVxyXG4gICAgICAvLyBFbGxpcHRpY2FsIGFyYyBjb21tYW5kIGFzIGFuIGFycmF5IGZvbGxvd2VkIGJ5IGNvcnJlc3BvbmRpbmcgaW5kZXhlczpcclxuICAgICAgLy8gWydBJywgcngsIHJ5LCB4LWF4aXMtcm90YXRpb24sIGxhcmdlLWFyYy1mbGFnLCBzd2VlcC1mbGFnLCB4LCB5XVxyXG4gICAgICAvLyAgIDAgICAgMSAgIDIgICAgICAgIDMgICAgICAgICAgICAgICAgIDQgICAgICAgICAgICAgNSAgICAgIDYgIDdcclxuICAgICAgaWYoYXJyYXlbaV1bMF0gPT09ICdBJykge1xyXG4gICAgICAgIGFycmF5W2ldWzRdID0gKyhhcnJheVtpXVs0XSAhPSAwKVxyXG4gICAgICAgIGFycmF5W2ldWzVdID0gKyhhcnJheVtpXVs1XSAhPSAwKVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRGlyZWN0bHkgbW9kaWZ5IHRoZSB2YWx1ZSBvZiBhIHBhdGggYXJyYXksIHRoaXMgaXMgZG9uZSB0aGlzIHdheSBmb3IgcGVyZm9ybWFuY2VcclxuICAgIHBhdGhBcnJheS52YWx1ZSA9IGFycmF5XHJcbiAgICByZXR1cm4gcGF0aEFycmF5XHJcbiAgfVxyXG4gIC8vIEFic29sdXRpemUgYW5kIHBhcnNlIHBhdGggdG8gYXJyYXlcclxuLCBwYXJzZTogZnVuY3Rpb24oYXJyYXkpIHtcclxuICAgIC8vIGlmIGl0J3MgYWxyZWFkeSBhIHBhdGhhcnJheSwgbm8gbmVlZCB0byBwYXJzZSBpdFxyXG4gICAgaWYgKGFycmF5IGluc3RhbmNlb2YgU1ZHLlBhdGhBcnJheSkgcmV0dXJuIGFycmF5LnZhbHVlT2YoKVxyXG5cclxuICAgIC8vIHByZXBhcmUgZm9yIHBhcnNpbmdcclxuICAgIHZhciBpLCB4MCwgeTAsIHMsIHNlZywgYXJyXHJcbiAgICAgICwgeCA9IDBcclxuICAgICAgLCB5ID0gMFxyXG4gICAgICAsIHBhcmFtQ250ID0geyAnTSc6MiwgJ0wnOjIsICdIJzoxLCAnVic6MSwgJ0MnOjYsICdTJzo0LCAnUSc6NCwgJ1QnOjIsICdBJzo3LCAnWic6MCB9XHJcblxyXG4gICAgaWYodHlwZW9mIGFycmF5ID09ICdzdHJpbmcnKXtcclxuXHJcbiAgICAgIGFycmF5ID0gYXJyYXlcclxuICAgICAgICAucmVwbGFjZShTVkcucmVnZXgubnVtYmVyc1dpdGhEb3RzLCBwYXRoUmVnUmVwbGFjZSkgLy8gY29udmVydCA0NS4xMjMuMTIzIHRvIDQ1LjEyMyAuMTIzXHJcbiAgICAgICAgLnJlcGxhY2UoU1ZHLnJlZ2V4LnBhdGhMZXR0ZXJzLCAnICQmICcpIC8vIHB1dCBzb21lIHJvb20gYmV0d2VlbiBsZXR0ZXJzIGFuZCBudW1iZXJzXHJcbiAgICAgICAgLnJlcGxhY2UoU1ZHLnJlZ2V4Lmh5cGhlbiwgJyQxIC0nKSAgICAgIC8vIGFkZCBzcGFjZSBiZWZvcmUgaHlwaGVuXHJcbiAgICAgICAgLnRyaW0oKSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRyaW1cclxuICAgICAgICAuc3BsaXQoU1ZHLnJlZ2V4LmRlbGltaXRlcikgICAvLyBzcGxpdCBpbnRvIGFycmF5XHJcblxyXG4gICAgfWVsc2V7XHJcbiAgICAgIGFycmF5ID0gYXJyYXkucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cnIpe1xyXG4gICAgICAgIHJldHVybiBbXS5jb25jYXQuY2FsbChwcmV2LCBjdXJyKVxyXG4gICAgICB9LCBbXSlcclxuICAgIH1cclxuXHJcbiAgICAvLyBhcnJheSBub3cgaXMgYW4gYXJyYXkgY29udGFpbmluZyBhbGwgcGFydHMgb2YgYSBwYXRoIGUuZy4gWydNJywgJzAnLCAnMCcsICdMJywgJzMwJywgJzMwJyAuLi5dXHJcbiAgICB2YXIgYXJyID0gW11cclxuICAgICAgLCBwID0gbmV3IFNWRy5Qb2ludCgpXHJcbiAgICAgICwgcDAgPSBuZXcgU1ZHLlBvaW50KClcclxuICAgICAgLCBpbmRleCA9IDBcclxuICAgICAgLCBsZW4gPSBhcnJheS5sZW5ndGhcclxuXHJcbiAgICBkb3tcclxuICAgICAgLy8gVGVzdCBpZiB3ZSBoYXZlIGEgcGF0aCBsZXR0ZXJcclxuICAgICAgaWYoU1ZHLnJlZ2V4LmlzUGF0aExldHRlci50ZXN0KGFycmF5W2luZGV4XSkpe1xyXG4gICAgICAgIHMgPSBhcnJheVtpbmRleF1cclxuICAgICAgICArK2luZGV4XHJcbiAgICAgIC8vIElmIGxhc3QgbGV0dGVyIHdhcyBhIG1vdmUgY29tbWFuZCBhbmQgd2UgZ290IG5vIG5ldywgaXQgZGVmYXVsdHMgdG8gW0xdaW5lXHJcbiAgICAgIH1lbHNlIGlmKHMgPT0gJ00nKXtcclxuICAgICAgICBzID0gJ0wnXHJcbiAgICAgIH1lbHNlIGlmKHMgPT0gJ20nKXtcclxuICAgICAgICBzID0gJ2wnXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGFyci5wdXNoKHBhdGhIYW5kbGVyc1tzXS5jYWxsKG51bGwsXHJcbiAgICAgICAgICBhcnJheS5zbGljZShpbmRleCwgKGluZGV4ID0gaW5kZXggKyBwYXJhbUNudFtzLnRvVXBwZXJDYXNlKCldKSkubWFwKHBhcnNlRmxvYXQpLFxyXG4gICAgICAgICAgcCwgcDBcclxuICAgICAgICApXHJcbiAgICAgIClcclxuXHJcbiAgICB9d2hpbGUobGVuID4gaW5kZXgpXHJcblxyXG4gICAgcmV0dXJuIGFyclxyXG5cclxuICB9XHJcbiAgLy8gR2V0IGJvdW5kaW5nIGJveCBvZiBwYXRoXHJcbiwgYmJveDogZnVuY3Rpb24oKSB7XHJcbiAgICBTVkcucGFyc2VyLnBhdGguc2V0QXR0cmlidXRlKCdkJywgdGhpcy50b1N0cmluZygpKVxyXG5cclxuICAgIHJldHVybiBTVkcucGFyc2VyLnBhdGguZ2V0QkJveCgpXHJcbiAgfVxyXG5cclxufSlcclxuXG4vLyBNb2R1bGUgZm9yIHVuaXQgY29udmVydGlvbnNcclxuU1ZHLk51bWJlciA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemVcclxuICBjcmVhdGU6IGZ1bmN0aW9uKHZhbHVlLCB1bml0KSB7XHJcbiAgICAvLyBpbml0aWFsaXplIGRlZmF1bHRzXHJcbiAgICB0aGlzLnZhbHVlID0gMFxyXG4gICAgdGhpcy51bml0ICA9IHVuaXQgfHwgJydcclxuXHJcbiAgICAvLyBwYXJzZSB2YWx1ZVxyXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcclxuICAgICAgLy8gZW5zdXJlIGEgdmFsaWQgbnVtZXJpYyB2YWx1ZVxyXG4gICAgICB0aGlzLnZhbHVlID0gaXNOYU4odmFsdWUpID8gMCA6ICFpc0Zpbml0ZSh2YWx1ZSkgPyAodmFsdWUgPCAwID8gLTMuNGUrMzggOiArMy40ZSszOCkgOiB2YWx1ZVxyXG5cclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xyXG4gICAgICB1bml0ID0gdmFsdWUubWF0Y2goU1ZHLnJlZ2V4Lm51bWJlckFuZFVuaXQpXHJcblxyXG4gICAgICBpZiAodW5pdCkge1xyXG4gICAgICAgIC8vIG1ha2UgdmFsdWUgbnVtZXJpY1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSBwYXJzZUZsb2F0KHVuaXRbMV0pXHJcblxyXG4gICAgICAgIC8vIG5vcm1hbGl6ZVxyXG4gICAgICAgIGlmICh1bml0WzVdID09ICclJylcclxuICAgICAgICAgIHRoaXMudmFsdWUgLz0gMTAwXHJcbiAgICAgICAgZWxzZSBpZiAodW5pdFs1XSA9PSAncycpXHJcbiAgICAgICAgICB0aGlzLnZhbHVlICo9IDEwMDBcclxuXHJcbiAgICAgICAgLy8gc3RvcmUgdW5pdFxyXG4gICAgICAgIHRoaXMudW5pdCA9IHVuaXRbNV1cclxuICAgICAgfVxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFNWRy5OdW1iZXIpIHtcclxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWUudmFsdWVPZigpXHJcbiAgICAgICAgdGhpcy51bml0ICA9IHZhbHVlLnVuaXRcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICB9XHJcbiAgLy8gQWRkIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIFN0cmluZ2FsaXplXHJcbiAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAoXHJcbiAgICAgICAgdGhpcy51bml0ID09ICclJyA/XHJcbiAgICAgICAgICB+fih0aGlzLnZhbHVlICogMWU4KSAvIDFlNjpcclxuICAgICAgICB0aGlzLnVuaXQgPT0gJ3MnID9cclxuICAgICAgICAgIHRoaXMudmFsdWUgLyAxZTMgOlxyXG4gICAgICAgICAgdGhpcy52YWx1ZVxyXG4gICAgICApICsgdGhpcy51bml0XHJcbiAgICB9XHJcbiAgLCB0b0pTT046IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy50b1N0cmluZygpXHJcbiAgICB9XHJcbiAgLCAvLyBDb252ZXJ0IHRvIHByaW1pdGl2ZVxyXG4gICAgdmFsdWVPZjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnZhbHVlXHJcbiAgICB9XHJcbiAgICAvLyBBZGQgbnVtYmVyXHJcbiAgLCBwbHVzOiBmdW5jdGlvbihudW1iZXIpIHtcclxuICAgICAgbnVtYmVyID0gbmV3IFNWRy5OdW1iZXIobnVtYmVyKVxyXG4gICAgICByZXR1cm4gbmV3IFNWRy5OdW1iZXIodGhpcyArIG51bWJlciwgdGhpcy51bml0IHx8IG51bWJlci51bml0KVxyXG4gICAgfVxyXG4gICAgLy8gU3VidHJhY3QgbnVtYmVyXHJcbiAgLCBtaW51czogZnVuY3Rpb24obnVtYmVyKSB7XHJcbiAgICAgIG51bWJlciA9IG5ldyBTVkcuTnVtYmVyKG51bWJlcilcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuTnVtYmVyKHRoaXMgLSBudW1iZXIsIHRoaXMudW5pdCB8fCBudW1iZXIudW5pdClcclxuICAgIH1cclxuICAgIC8vIE11bHRpcGx5IG51bWJlclxyXG4gICwgdGltZXM6IGZ1bmN0aW9uKG51bWJlcikge1xyXG4gICAgICBudW1iZXIgPSBuZXcgU1ZHLk51bWJlcihudW1iZXIpXHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLk51bWJlcih0aGlzICogbnVtYmVyLCB0aGlzLnVuaXQgfHwgbnVtYmVyLnVuaXQpXHJcbiAgICB9XHJcbiAgICAvLyBEaXZpZGUgbnVtYmVyXHJcbiAgLCBkaXZpZGU6IGZ1bmN0aW9uKG51bWJlcikge1xyXG4gICAgICBudW1iZXIgPSBuZXcgU1ZHLk51bWJlcihudW1iZXIpXHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLk51bWJlcih0aGlzIC8gbnVtYmVyLCB0aGlzLnVuaXQgfHwgbnVtYmVyLnVuaXQpXHJcbiAgICB9XHJcbiAgICAvLyBDb252ZXJ0IHRvIGRpZmZlcmVudCB1bml0XHJcbiAgLCB0bzogZnVuY3Rpb24odW5pdCkge1xyXG4gICAgICB2YXIgbnVtYmVyID0gbmV3IFNWRy5OdW1iZXIodGhpcylcclxuXHJcbiAgICAgIGlmICh0eXBlb2YgdW5pdCA9PT0gJ3N0cmluZycpXHJcbiAgICAgICAgbnVtYmVyLnVuaXQgPSB1bml0XHJcblxyXG4gICAgICByZXR1cm4gbnVtYmVyXHJcbiAgICB9XHJcbiAgICAvLyBNYWtlIG51bWJlciBtb3JwaGFibGVcclxuICAsIG1vcnBoOiBmdW5jdGlvbihudW1iZXIpIHtcclxuICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IG5ldyBTVkcuTnVtYmVyKG51bWJlcilcclxuXHJcbiAgICAgIGlmKG51bWJlci5yZWxhdGl2ZSkge1xyXG4gICAgICAgIHRoaXMuZGVzdGluYXRpb24udmFsdWUgKz0gdGhpcy52YWx1ZVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gR2V0IG1vcnBoZWQgbnVtYmVyIGF0IGdpdmVuIHBvc2l0aW9uXHJcbiAgLCBhdDogZnVuY3Rpb24ocG9zKSB7XHJcbiAgICAgIC8vIE1ha2Ugc3VyZSBhIGRlc3RpbmF0aW9uIGlzIGRlZmluZWRcclxuICAgICAgaWYgKCF0aGlzLmRlc3RpbmF0aW9uKSByZXR1cm4gdGhpc1xyXG5cclxuICAgICAgLy8gR2VuZXJhdGUgbmV3IG1vcnBoZWQgbnVtYmVyXHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLk51bWJlcih0aGlzLmRlc3RpbmF0aW9uKVxyXG4gICAgICAgICAgLm1pbnVzKHRoaXMpXHJcbiAgICAgICAgICAudGltZXMocG9zKVxyXG4gICAgICAgICAgLnBsdXModGhpcylcclxuICAgIH1cclxuXHJcbiAgfVxyXG59KVxyXG5cblxyXG5TVkcuRWxlbWVudCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24obm9kZSkge1xyXG4gICAgLy8gbWFrZSBzdHJva2UgdmFsdWUgYWNjZXNzaWJsZSBkeW5hbWljYWxseVxyXG4gICAgdGhpcy5fc3Ryb2tlID0gU1ZHLmRlZmF1bHRzLmF0dHJzLnN0cm9rZVxyXG4gICAgdGhpcy5fZXZlbnQgPSBudWxsXHJcblxyXG4gICAgLy8gaW5pdGlhbGl6ZSBkYXRhIG9iamVjdFxyXG4gICAgdGhpcy5kb20gPSB7fVxyXG5cclxuICAgIC8vIGNyZWF0ZSBjaXJjdWxhciByZWZlcmVuY2VcclxuICAgIGlmICh0aGlzLm5vZGUgPSBub2RlKSB7XHJcbiAgICAgIHRoaXMudHlwZSA9IG5vZGUubm9kZU5hbWVcclxuICAgICAgdGhpcy5ub2RlLmluc3RhbmNlID0gdGhpc1xyXG5cclxuICAgICAgLy8gc3RvcmUgY3VycmVudCBhdHRyaWJ1dGUgdmFsdWVcclxuICAgICAgdGhpcy5fc3Ryb2tlID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ3N0cm9rZScpIHx8IHRoaXMuX3N0cm9rZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIE1vdmUgb3ZlciB4LWF4aXNcclxuICAgIHg6IGZ1bmN0aW9uKHgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cigneCcsIHgpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIG92ZXIgeS1heGlzXHJcbiAgLCB5OiBmdW5jdGlvbih5KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ3knLCB5KVxyXG4gICAgfVxyXG4gICAgLy8gTW92ZSBieSBjZW50ZXIgb3ZlciB4LWF4aXNcclxuICAsIGN4OiBmdW5jdGlvbih4KSB7XHJcbiAgICAgIHJldHVybiB4ID09IG51bGwgPyB0aGlzLngoKSArIHRoaXMud2lkdGgoKSAvIDIgOiB0aGlzLngoeCAtIHRoaXMud2lkdGgoKSAvIDIpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGJ5IGNlbnRlciBvdmVyIHktYXhpc1xyXG4gICwgY3k6IGZ1bmN0aW9uKHkpIHtcclxuICAgICAgcmV0dXJuIHkgPT0gbnVsbCA/IHRoaXMueSgpICsgdGhpcy5oZWlnaHQoKSAvIDIgOiB0aGlzLnkoeSAtIHRoaXMuaGVpZ2h0KCkgLyAyKVxyXG4gICAgfVxyXG4gICAgLy8gTW92ZSBlbGVtZW50IHRvIGdpdmVuIHggYW5kIHkgdmFsdWVzXHJcbiAgLCBtb3ZlOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLngoeCkueSh5KVxyXG4gICAgfVxyXG4gICAgLy8gTW92ZSBlbGVtZW50IGJ5IGl0cyBjZW50ZXJcclxuICAsIGNlbnRlcjogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5jeCh4KS5jeSh5KVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IHdpZHRoIG9mIGVsZW1lbnRcclxuICAsIHdpZHRoOiBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCd3aWR0aCcsIHdpZHRoKVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IGhlaWdodCBvZiBlbGVtZW50XHJcbiAgLCBoZWlnaHQ6IGZ1bmN0aW9uKGhlaWdodCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdoZWlnaHQnLCBoZWlnaHQpXHJcbiAgICB9XHJcbiAgICAvLyBTZXQgZWxlbWVudCBzaXplIHRvIGdpdmVuIHdpZHRoIGFuZCBoZWlnaHRcclxuICAsIHNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgdmFyIHAgPSBwcm9wb3J0aW9uYWxTaXplKHRoaXMsIHdpZHRoLCBoZWlnaHQpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgICAgIC53aWR0aChuZXcgU1ZHLk51bWJlcihwLndpZHRoKSlcclxuICAgICAgICAuaGVpZ2h0KG5ldyBTVkcuTnVtYmVyKHAuaGVpZ2h0KSlcclxuICAgIH1cclxuICAgIC8vIENsb25lIGVsZW1lbnRcclxuICAsIGNsb25lOiBmdW5jdGlvbihwYXJlbnQsIHdpdGhEYXRhKSB7XHJcbiAgICAgIC8vIHdyaXRlIGRvbSBkYXRhIHRvIHRoZSBkb20gc28gdGhlIGNsb25lIGNhbiBwaWNrdXAgdGhlIGRhdGFcclxuICAgICAgdGhpcy53cml0ZURhdGFUb0RvbSgpXHJcblxyXG4gICAgICAvLyBjbG9uZSBlbGVtZW50IGFuZCBhc3NpZ24gbmV3IGlkXHJcbiAgICAgIHZhciBjbG9uZSA9IGFzc2lnbk5ld0lkKHRoaXMubm9kZS5jbG9uZU5vZGUodHJ1ZSkpXHJcblxyXG4gICAgICAvLyBpbnNlcnQgdGhlIGNsb25lIGluIHRoZSBnaXZlbiBwYXJlbnQgb3IgYWZ0ZXIgbXlzZWxmXHJcbiAgICAgIGlmKHBhcmVudCkgcGFyZW50LmFkZChjbG9uZSlcclxuICAgICAgZWxzZSB0aGlzLmFmdGVyKGNsb25lKVxyXG5cclxuICAgICAgcmV0dXJuIGNsb25lXHJcbiAgICB9XHJcbiAgICAvLyBSZW1vdmUgZWxlbWVudFxyXG4gICwgcmVtb3ZlOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMucGFyZW50KCkpXHJcbiAgICAgICAgdGhpcy5wYXJlbnQoKS5yZW1vdmVFbGVtZW50KHRoaXMpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gUmVwbGFjZSBlbGVtZW50XHJcbiAgLCByZXBsYWNlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgIHRoaXMuYWZ0ZXIoZWxlbWVudCkucmVtb3ZlKClcclxuXHJcbiAgICAgIHJldHVybiBlbGVtZW50XHJcbiAgICB9XHJcbiAgICAvLyBBZGQgZWxlbWVudCB0byBnaXZlbiBjb250YWluZXIgYW5kIHJldHVybiBzZWxmXHJcbiAgLCBhZGRUbzogZnVuY3Rpb24ocGFyZW50KSB7XHJcbiAgICAgIHJldHVybiBwYXJlbnQucHV0KHRoaXMpXHJcbiAgICB9XHJcbiAgICAvLyBBZGQgZWxlbWVudCB0byBnaXZlbiBjb250YWluZXIgYW5kIHJldHVybiBjb250YWluZXJcclxuICAsIHB1dEluOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuICAgICAgcmV0dXJuIHBhcmVudC5hZGQodGhpcylcclxuICAgIH1cclxuICAgIC8vIEdldCAvIHNldCBpZFxyXG4gICwgaWQ6IGZ1bmN0aW9uKGlkKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ2lkJywgaWQpXHJcbiAgICB9XHJcbiAgICAvLyBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gcG9pbnQgaW5zaWRlIHRoZSBib3VuZGluZyBib3ggb2YgdGhlIGVsZW1lbnRcclxuICAsIGluc2lkZTogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICB2YXIgYm94ID0gdGhpcy5iYm94KClcclxuXHJcbiAgICAgIHJldHVybiB4ID4gYm94LnhcclxuICAgICAgICAgICYmIHkgPiBib3gueVxyXG4gICAgICAgICAgJiYgeCA8IGJveC54ICsgYm94LndpZHRoXHJcbiAgICAgICAgICAmJiB5IDwgYm94LnkgKyBib3guaGVpZ2h0XHJcbiAgICB9XHJcbiAgICAvLyBTaG93IGVsZW1lbnRcclxuICAsIHNob3c6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdHlsZSgnZGlzcGxheScsICcnKVxyXG4gICAgfVxyXG4gICAgLy8gSGlkZSBlbGVtZW50XHJcbiAgLCBoaWRlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3R5bGUoJ2Rpc3BsYXknLCAnbm9uZScpXHJcbiAgICB9XHJcbiAgICAvLyBJcyBlbGVtZW50IHZpc2libGU/XHJcbiAgLCB2aXNpYmxlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3R5bGUoJ2Rpc3BsYXknKSAhPSAnbm9uZSdcclxuICAgIH1cclxuICAgIC8vIFJldHVybiBpZCBvbiBzdHJpbmcgY29udmVyc2lvblxyXG4gICwgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdpZCcpXHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm4gYXJyYXkgb2YgY2xhc3NlcyBvbiB0aGUgbm9kZVxyXG4gICwgY2xhc3NlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBhdHRyID0gdGhpcy5hdHRyKCdjbGFzcycpXHJcblxyXG4gICAgICByZXR1cm4gYXR0ciA9PSBudWxsID8gW10gOiBhdHRyLnRyaW0oKS5zcGxpdChTVkcucmVnZXguZGVsaW1pdGVyKVxyXG4gICAgfVxyXG4gICAgLy8gUmV0dXJuIHRydWUgaWYgY2xhc3MgZXhpc3RzIG9uIHRoZSBub2RlLCBmYWxzZSBvdGhlcndpc2VcclxuICAsIGhhc0NsYXNzOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmNsYXNzZXMoKS5pbmRleE9mKG5hbWUpICE9IC0xXHJcbiAgICB9XHJcbiAgICAvLyBBZGQgY2xhc3MgdG8gdGhlIG5vZGVcclxuICAsIGFkZENsYXNzOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgIGlmICghdGhpcy5oYXNDbGFzcyhuYW1lKSkge1xyXG4gICAgICAgIHZhciBhcnJheSA9IHRoaXMuY2xhc3NlcygpXHJcbiAgICAgICAgYXJyYXkucHVzaChuYW1lKVxyXG4gICAgICAgIHRoaXMuYXR0cignY2xhc3MnLCBhcnJheS5qb2luKCcgJykpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBSZW1vdmUgY2xhc3MgZnJvbSB0aGUgbm9kZVxyXG4gICwgcmVtb3ZlQ2xhc3M6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgaWYgKHRoaXMuaGFzQ2xhc3MobmFtZSkpIHtcclxuICAgICAgICB0aGlzLmF0dHIoJ2NsYXNzJywgdGhpcy5jbGFzc2VzKCkuZmlsdGVyKGZ1bmN0aW9uKGMpIHtcclxuICAgICAgICAgIHJldHVybiBjICE9IG5hbWVcclxuICAgICAgICB9KS5qb2luKCcgJykpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBUb2dnbGUgdGhlIHByZXNlbmNlIG9mIGEgY2xhc3Mgb24gdGhlIG5vZGVcclxuICAsIHRvZ2dsZUNsYXNzOiBmdW5jdGlvbihuYW1lKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmhhc0NsYXNzKG5hbWUpID8gdGhpcy5yZW1vdmVDbGFzcyhuYW1lKSA6IHRoaXMuYWRkQ2xhc3MobmFtZSlcclxuICAgIH1cclxuICAgIC8vIEdldCByZWZlcmVuY2VkIGVsZW1lbnQgZm9ybSBhdHRyaWJ1dGUgdmFsdWVcclxuICAsIHJlZmVyZW5jZTogZnVuY3Rpb24oYXR0cikge1xyXG4gICAgICByZXR1cm4gU1ZHLmdldCh0aGlzLmF0dHIoYXR0cikpXHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm5zIHRoZSBwYXJlbnQgZWxlbWVudCBpbnN0YW5jZVxyXG4gICwgcGFyZW50OiBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICAgIHZhciBwYXJlbnQgPSB0aGlzXHJcblxyXG4gICAgICAvLyBjaGVjayBmb3IgcGFyZW50XHJcbiAgICAgIGlmKCFwYXJlbnQubm9kZS5wYXJlbnROb2RlKSByZXR1cm4gbnVsbFxyXG5cclxuICAgICAgLy8gZ2V0IHBhcmVudCBlbGVtZW50XHJcbiAgICAgIHBhcmVudCA9IFNWRy5hZG9wdChwYXJlbnQubm9kZS5wYXJlbnROb2RlKVxyXG5cclxuICAgICAgaWYoIXR5cGUpIHJldHVybiBwYXJlbnRcclxuXHJcbiAgICAgIC8vIGxvb3AgdHJvdWdoIGFuY2VzdG9ycyBpZiB0eXBlIGlzIGdpdmVuXHJcbiAgICAgIHdoaWxlKHBhcmVudCAmJiBwYXJlbnQubm9kZSBpbnN0YW5jZW9mIHdpbmRvdy5TVkdFbGVtZW50KXtcclxuICAgICAgICBpZih0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyBwYXJlbnQubWF0Y2hlcyh0eXBlKSA6IHBhcmVudCBpbnN0YW5jZW9mIHR5cGUpIHJldHVybiBwYXJlbnRcclxuICAgICAgICBpZihwYXJlbnQubm9kZS5wYXJlbnROb2RlLm5vZGVOYW1lID09ICcjZG9jdW1lbnQnKSByZXR1cm4gbnVsbCAvLyAjNzIwXHJcbiAgICAgICAgcGFyZW50ID0gU1ZHLmFkb3B0KHBhcmVudC5ub2RlLnBhcmVudE5vZGUpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIEdldCBwYXJlbnQgZG9jdW1lbnRcclxuICAsIGRvYzogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgU1ZHLkRvYyA/IHRoaXMgOiB0aGlzLnBhcmVudChTVkcuRG9jKVxyXG4gICAgfVxyXG4gICAgLy8gcmV0dXJuIGFycmF5IG9mIGFsbCBhbmNlc3RvcnMgb2YgZ2l2ZW4gdHlwZSB1cCB0byB0aGUgcm9vdCBzdmdcclxuICAsIHBhcmVudHM6IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgdmFyIHBhcmVudHMgPSBbXSwgcGFyZW50ID0gdGhpc1xyXG5cclxuICAgICAgZG97XHJcbiAgICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudCh0eXBlKVxyXG4gICAgICAgIGlmKCFwYXJlbnQgfHwgIXBhcmVudC5ub2RlKSBicmVha1xyXG5cclxuICAgICAgICBwYXJlbnRzLnB1c2gocGFyZW50KVxyXG4gICAgICB9IHdoaWxlKHBhcmVudC5wYXJlbnQpXHJcblxyXG4gICAgICByZXR1cm4gcGFyZW50c1xyXG4gICAgfVxyXG4gICAgLy8gbWF0Y2hlcyB0aGUgZWxlbWVudCB2cyBhIGNzcyBzZWxlY3RvclxyXG4gICwgbWF0Y2hlczogZnVuY3Rpb24oc2VsZWN0b3Ipe1xyXG4gICAgICByZXR1cm4gbWF0Y2hlcyh0aGlzLm5vZGUsIHNlbGVjdG9yKVxyXG4gICAgfVxyXG4gICAgLy8gUmV0dXJucyB0aGUgc3ZnIG5vZGUgdG8gY2FsbCBuYXRpdmUgc3ZnIG1ldGhvZHMgb24gaXRcclxuICAsIG5hdGl2ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm5vZGVcclxuICAgIH1cclxuICAgIC8vIEltcG9ydCByYXcgc3ZnXHJcbiAgLCBzdmc6IGZ1bmN0aW9uKHN2Zykge1xyXG4gICAgICAvLyBjcmVhdGUgdGVtcG9yYXJ5IGhvbGRlclxyXG4gICAgICB2YXIgd2VsbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N2ZycpXHJcblxyXG4gICAgICAvLyBhY3QgYXMgYSBzZXR0ZXIgaWYgc3ZnIGlzIGdpdmVuXHJcbiAgICAgIGlmIChzdmcgJiYgdGhpcyBpbnN0YW5jZW9mIFNWRy5QYXJlbnQpIHtcclxuICAgICAgICAvLyBkdW1wIHJhdyBzdmdcclxuICAgICAgICB3ZWxsLmlubmVySFRNTCA9ICc8c3ZnPicgKyBzdmcucmVwbGFjZSgvXFxuLywgJycpLnJlcGxhY2UoLzwoXFx3KykoW148XSs/KVxcLz4vZywgJzwkMSQyPjwvJDE+JykgKyAnPC9zdmc+J1xyXG5cclxuICAgICAgICAvLyB0cmFuc3BsYW50IG5vZGVzXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlsID0gd2VsbC5maXJzdENoaWxkLmNoaWxkTm9kZXMubGVuZ3RoOyBpIDwgaWw7IGkrKylcclxuICAgICAgICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZCh3ZWxsLmZpcnN0Q2hpbGQuZmlyc3RDaGlsZClcclxuXHJcbiAgICAgIC8vIG90aGVyd2lzZSBhY3QgYXMgYSBnZXR0ZXJcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBjcmVhdGUgYSB3cmFwcGluZyBzdmcgZWxlbWVudCBpbiBjYXNlIG9mIHBhcnRpYWwgY29udGVudFxyXG4gICAgICAgIHdlbGwuYXBwZW5kQ2hpbGQoc3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3ZnJykpXHJcblxyXG4gICAgICAgIC8vIHdyaXRlIHN2Z2pzIGRhdGEgdG8gdGhlIGRvbVxyXG4gICAgICAgIHRoaXMud3JpdGVEYXRhVG9Eb20oKVxyXG5cclxuICAgICAgICAvLyBpbnNlcnQgYSBjb3B5IG9mIHRoaXMgbm9kZVxyXG4gICAgICAgIHN2Zy5hcHBlbmRDaGlsZCh0aGlzLm5vZGUuY2xvbmVOb2RlKHRydWUpKVxyXG5cclxuICAgICAgICAvLyByZXR1cm4gdGFyZ2V0IGVsZW1lbnRcclxuICAgICAgICByZXR1cm4gd2VsbC5pbm5lckhUTUwucmVwbGFjZSgvXjxzdmc+LywgJycpLnJlcGxhY2UoLzxcXC9zdmc+JC8sICcnKVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gIC8vIHdyaXRlIHN2Z2pzIGRhdGEgdG8gdGhlIGRvbVxyXG4gICwgd3JpdGVEYXRhVG9Eb206IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgICAgLy8gZHVtcCB2YXJpYWJsZXMgcmVjdXJzaXZlbHlcclxuICAgICAgaWYodGhpcy5lYWNoIHx8IHRoaXMubGluZXMpe1xyXG4gICAgICAgIHZhciBmbiA9IHRoaXMuZWFjaCA/IHRoaXMgOiB0aGlzLmxpbmVzKCk7XHJcbiAgICAgICAgZm4uZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgdGhpcy53cml0ZURhdGFUb0RvbSgpXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcmVtb3ZlIHByZXZpb3VzbHkgc2V0IGRhdGFcclxuICAgICAgdGhpcy5ub2RlLnJlbW92ZUF0dHJpYnV0ZSgnc3ZnanM6ZGF0YScpXHJcblxyXG4gICAgICBpZihPYmplY3Qua2V5cyh0aGlzLmRvbSkubGVuZ3RoKVxyXG4gICAgICAgIHRoaXMubm9kZS5zZXRBdHRyaWJ1dGUoJ3N2Z2pzOmRhdGEnLCBKU09OLnN0cmluZ2lmeSh0aGlzLmRvbSkpIC8vIHNlZSAjNDI4XHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gIC8vIHNldCBnaXZlbiBkYXRhIHRvIHRoZSBlbGVtZW50cyBkYXRhIHByb3BlcnR5XHJcbiAgLCBzZXREYXRhOiBmdW5jdGlvbihvKXtcclxuICAgICAgdGhpcy5kb20gPSBvXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgLCBpczogZnVuY3Rpb24ob2JqKXtcclxuICAgICAgcmV0dXJuIGlzKHRoaXMsIG9iailcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxuU1ZHLmVhc2luZyA9IHtcclxuICAnLSc6IGZ1bmN0aW9uKHBvcyl7cmV0dXJuIHBvc31cclxuLCAnPD4nOmZ1bmN0aW9uKHBvcyl7cmV0dXJuIC1NYXRoLmNvcyhwb3MgKiBNYXRoLlBJKSAvIDIgKyAwLjV9XHJcbiwgJz4nOiBmdW5jdGlvbihwb3Mpe3JldHVybiAgTWF0aC5zaW4ocG9zICogTWF0aC5QSSAvIDIpfVxyXG4sICc8JzogZnVuY3Rpb24ocG9zKXtyZXR1cm4gLU1hdGguY29zKHBvcyAqIE1hdGguUEkgLyAyKSArIDF9XHJcbn1cclxuXHJcblNWRy5tb3JwaCA9IGZ1bmN0aW9uKHBvcyl7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKGZyb20sIHRvKSB7XHJcbiAgICByZXR1cm4gbmV3IFNWRy5Nb3JwaE9iaihmcm9tLCB0bykuYXQocG9zKVxyXG4gIH1cclxufVxyXG5cclxuU1ZHLlNpdHVhdGlvbiA9IFNWRy5pbnZlbnQoe1xyXG5cclxuICBjcmVhdGU6IGZ1bmN0aW9uKG8pe1xyXG4gICAgdGhpcy5pbml0ID0gZmFsc2VcclxuICAgIHRoaXMucmV2ZXJzZWQgPSBmYWxzZVxyXG4gICAgdGhpcy5yZXZlcnNpbmcgPSBmYWxzZVxyXG5cclxuICAgIHRoaXMuZHVyYXRpb24gPSBuZXcgU1ZHLk51bWJlcihvLmR1cmF0aW9uKS52YWx1ZU9mKClcclxuICAgIHRoaXMuZGVsYXkgPSBuZXcgU1ZHLk51bWJlcihvLmRlbGF5KS52YWx1ZU9mKClcclxuXHJcbiAgICB0aGlzLnN0YXJ0ID0gK25ldyBEYXRlKCkgKyB0aGlzLmRlbGF5XHJcbiAgICB0aGlzLmZpbmlzaCA9IHRoaXMuc3RhcnQgKyB0aGlzLmR1cmF0aW9uXHJcbiAgICB0aGlzLmVhc2UgPSBvLmVhc2VcclxuXHJcbiAgICAvLyB0aGlzLmxvb3AgaXMgaW5jcmVtZW50ZWQgZnJvbSAwIHRvIHRoaXMubG9vcHNcclxuICAgIC8vIGl0IGlzIGFsc28gaW5jcmVtZW50ZWQgd2hlbiBpbiBhbiBpbmZpbml0ZSBsb29wICh3aGVuIHRoaXMubG9vcHMgaXMgdHJ1ZSlcclxuICAgIHRoaXMubG9vcCA9IDBcclxuICAgIHRoaXMubG9vcHMgPSBmYWxzZVxyXG5cclxuICAgIHRoaXMuYW5pbWF0aW9ucyA9IHtcclxuICAgICAgLy8gZnVuY3Rpb25Ub0NhbGw6IFtsaXN0IG9mIG1vcnBoYWJsZSBvYmplY3RzXVxyXG4gICAgICAvLyBlLmcuIG1vdmU6IFtTVkcuTnVtYmVyLCBTVkcuTnVtYmVyXVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuYXR0cnMgPSB7XHJcbiAgICAgIC8vIGhvbGRzIGFsbCBhdHRyaWJ1dGVzIHdoaWNoIGFyZSBub3QgcmVwcmVzZW50ZWQgZnJvbSBhIGZ1bmN0aW9uIHN2Zy5qcyBwcm92aWRlc1xyXG4gICAgICAvLyBlLmcuIHNvbWVBdHRyOiBTVkcuTnVtYmVyXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zdHlsZXMgPSB7XHJcbiAgICAgIC8vIGhvbGRzIGFsbCBzdHlsZXMgd2hpY2ggc2hvdWxkIGJlIGFuaW1hdGVkXHJcbiAgICAgIC8vIGUuZy4gZmlsbC1jb2xvcjogU1ZHLkNvbG9yXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50cmFuc2Zvcm1zID0gW1xyXG4gICAgICAvLyBob2xkcyBhbGwgdHJhbnNmb3JtYXRpb25zIGFzIHRyYW5zZm9ybWF0aW9uIG9iamVjdHNcclxuICAgICAgLy8gZS5nLiBbU1ZHLlJvdGF0ZSwgU1ZHLlRyYW5zbGF0ZSwgU1ZHLk1hdHJpeF1cclxuICAgIF1cclxuXHJcbiAgICB0aGlzLm9uY2UgPSB7XHJcbiAgICAgIC8vIGZ1bmN0aW9ucyB0byBmaXJlIGF0IGEgc3BlY2lmaWMgcG9zaXRpb25cclxuICAgICAgLy8gZS5nLiBcIjAuNVwiOiBmdW5jdGlvbiBmb28oKXt9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5cclxuU1ZHLkZYID0gU1ZHLmludmVudCh7XHJcblxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgdGhpcy5fdGFyZ2V0ID0gZWxlbWVudFxyXG4gICAgdGhpcy5zaXR1YXRpb25zID0gW11cclxuICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgIHRoaXMuc2l0dWF0aW9uID0gbnVsbFxyXG4gICAgdGhpcy5wYXVzZWQgPSBmYWxzZVxyXG4gICAgdGhpcy5sYXN0UG9zID0gMFxyXG4gICAgdGhpcy5wb3MgPSAwXHJcbiAgICAvLyBUaGUgYWJzb2x1dGUgcG9zaXRpb24gb2YgYW4gYW5pbWF0aW9uIGlzIGl0cyBwb3NpdGlvbiBpbiB0aGUgY29udGV4dCBvZiBpdHMgY29tcGxldGUgZHVyYXRpb24gKGluY2x1ZGluZyBkZWxheSBhbmQgbG9vcHMpXHJcbiAgICAvLyBXaGVuIHBlcmZvcm1pbmcgYSBkZWxheSwgYWJzUG9zIGlzIGJlbG93IDAgYW5kIHdoZW4gcGVyZm9ybWluZyBhIGxvb3AsIGl0cyB2YWx1ZSBpcyBhYm92ZSAxXHJcbiAgICB0aGlzLmFic1BvcyA9IDBcclxuICAgIHRoaXMuX3NwZWVkID0gMVxyXG4gIH1cclxuXHJcbiwgZXh0ZW5kOiB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZXRzIG9yIHJldHVybnMgdGhlIHRhcmdldCBvZiB0aGlzIGFuaW1hdGlvblxyXG4gICAgICogQHBhcmFtIG8gb2JqZWN0IHx8IG51bWJlciBJbiBjYXNlIG9mIE9iamVjdCBpdCBob2xkcyBhbGwgcGFyYW1ldGVycy4gSW4gY2FzZSBvZiBudW1iZXIgaXRzIHRoZSBkdXJhdGlvbiBvZiB0aGUgYW5pbWF0aW9uXHJcbiAgICAgKiBAcGFyYW0gZWFzZSBmdW5jdGlvbiB8fCBzdHJpbmcgRnVuY3Rpb24gd2hpY2ggc2hvdWxkIGJlIHVzZWQgZm9yIGVhc2luZyBvciBlYXNpbmcga2V5d29yZFxyXG4gICAgICogQHBhcmFtIGRlbGF5IE51bWJlciBpbmRpY2F0aW5nIHRoZSBkZWxheSBiZWZvcmUgdGhlIGFuaW1hdGlvbiBzdGFydHNcclxuICAgICAqIEByZXR1cm4gdGFyZ2V0IHx8IHRoaXNcclxuICAgICAqL1xyXG4gICAgYW5pbWF0ZTogZnVuY3Rpb24obywgZWFzZSwgZGVsYXkpe1xyXG5cclxuICAgICAgaWYodHlwZW9mIG8gPT0gJ29iamVjdCcpe1xyXG4gICAgICAgIGVhc2UgPSBvLmVhc2VcclxuICAgICAgICBkZWxheSA9IG8uZGVsYXlcclxuICAgICAgICBvID0gby5kdXJhdGlvblxyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgc2l0dWF0aW9uID0gbmV3IFNWRy5TaXR1YXRpb24oe1xyXG4gICAgICAgIGR1cmF0aW9uOiBvIHx8IDEwMDAsXHJcbiAgICAgICAgZGVsYXk6IGRlbGF5IHx8IDAsXHJcbiAgICAgICAgZWFzZTogU1ZHLmVhc2luZ1tlYXNlIHx8ICctJ10gfHwgZWFzZVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgdGhpcy5xdWV1ZShzaXR1YXRpb24pXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2V0cyBhIGRlbGF5IGJlZm9yZSB0aGUgbmV4dCBlbGVtZW50IG9mIHRoZSBxdWV1ZSBpcyBjYWxsZWRcclxuICAgICAqIEBwYXJhbSBkZWxheSBEdXJhdGlvbiBvZiBkZWxheSBpbiBtaWxsaXNlY29uZHNcclxuICAgICAqIEByZXR1cm4gdGhpcy50YXJnZXQoKVxyXG4gICAgICovXHJcbiAgLCBkZWxheTogZnVuY3Rpb24oZGVsYXkpe1xyXG4gICAgICAvLyBUaGUgZGVsYXkgaXMgcGVyZm9ybWVkIGJ5IGFuIGVtcHR5IHNpdHVhdGlvbiB3aXRoIGl0cyBkdXJhdGlvblxyXG4gICAgICAvLyBhdHRyaWJ1dGUgc2V0IHRvIHRoZSBkdXJhdGlvbiBvZiB0aGUgZGVsYXlcclxuICAgICAgdmFyIHNpdHVhdGlvbiA9IG5ldyBTVkcuU2l0dWF0aW9uKHtcclxuICAgICAgICBkdXJhdGlvbjogZGVsYXksXHJcbiAgICAgICAgZGVsYXk6IDAsXHJcbiAgICAgICAgZWFzZTogU1ZHLmVhc2luZ1snLSddXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5xdWV1ZShzaXR1YXRpb24pXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZXRzIG9yIHJldHVybnMgdGhlIHRhcmdldCBvZiB0aGlzIGFuaW1hdGlvblxyXG4gICAgICogQHBhcmFtIG51bGwgfHwgdGFyZ2V0IFNWRy5FbGVtZW50IHdoaWNoIHNob3VsZCBiZSBzZXQgYXMgbmV3IHRhcmdldFxyXG4gICAgICogQHJldHVybiB0YXJnZXQgfHwgdGhpc1xyXG4gICAgICovXHJcbiAgLCB0YXJnZXQ6IGZ1bmN0aW9uKHRhcmdldCl7XHJcbiAgICAgIGlmKHRhcmdldCAmJiB0YXJnZXQgaW5zdGFuY2VvZiBTVkcuRWxlbWVudCl7XHJcbiAgICAgICAgdGhpcy5fdGFyZ2V0ID0gdGFyZ2V0XHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuX3RhcmdldFxyXG4gICAgfVxyXG5cclxuICAgIC8vIHJldHVybnMgdGhlIGFic29sdXRlIHBvc2l0aW9uIGF0IGEgZ2l2ZW4gdGltZVxyXG4gICwgdGltZVRvQWJzUG9zOiBmdW5jdGlvbih0aW1lc3RhbXApe1xyXG4gICAgICByZXR1cm4gKHRpbWVzdGFtcCAtIHRoaXMuc2l0dWF0aW9uLnN0YXJ0KSAvICh0aGlzLnNpdHVhdGlvbi5kdXJhdGlvbi90aGlzLl9zcGVlZClcclxuICAgIH1cclxuXHJcbiAgICAvLyByZXR1cm5zIHRoZSB0aW1lc3RhbXAgZnJvbSBhIGdpdmVuIGFic29sdXRlIHBvc2l0b25cclxuICAsIGFic1Bvc1RvVGltZTogZnVuY3Rpb24oYWJzUG9zKXtcclxuICAgICAgcmV0dXJuIHRoaXMuc2l0dWF0aW9uLmR1cmF0aW9uL3RoaXMuX3NwZWVkICogYWJzUG9zICsgdGhpcy5zaXR1YXRpb24uc3RhcnRcclxuICAgIH1cclxuXHJcbiAgICAvLyBzdGFydHMgdGhlIGFuaW1hdGlvbmxvb3BcclxuICAsIHN0YXJ0QW5pbUZyYW1lOiBmdW5jdGlvbigpe1xyXG4gICAgICB0aGlzLnN0b3BBbmltRnJhbWUoKVxyXG4gICAgICB0aGlzLmFuaW1hdGlvbkZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpeyB0aGlzLnN0ZXAoKSB9LmJpbmQodGhpcykpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2FuY2VscyB0aGUgYW5pbWF0aW9uZnJhbWVcclxuICAsIHN0b3BBbmltRnJhbWU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLmFuaW1hdGlvbkZyYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGtpY2tzIG9mZiB0aGUgYW5pbWF0aW9uIC0gb25seSBkb2VzIHNvbWV0aGluZyB3aGVuIHRoZSBxdWV1ZSBpcyBjdXJyZW50bHkgbm90IGFjdGl2ZSBhbmQgYXQgbGVhc3Qgb25lIHNpdHVhdGlvbiBpcyBzZXRcclxuICAsIHN0YXJ0OiBmdW5jdGlvbigpe1xyXG4gICAgICAvLyBkb250IHN0YXJ0IGlmIGFscmVhZHkgc3RhcnRlZFxyXG4gICAgICBpZighdGhpcy5hY3RpdmUgJiYgdGhpcy5zaXR1YXRpb24pe1xyXG4gICAgICAgIHRoaXMuYWN0aXZlID0gdHJ1ZVxyXG4gICAgICAgIHRoaXMuc3RhcnRDdXJyZW50KClcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICAvLyBzdGFydCB0aGUgY3VycmVudCBzaXR1YXRpb25cclxuICAsIHN0YXJ0Q3VycmVudDogZnVuY3Rpb24oKXtcclxuICAgICAgdGhpcy5zaXR1YXRpb24uc3RhcnQgPSArbmV3IERhdGUgKyB0aGlzLnNpdHVhdGlvbi5kZWxheS90aGlzLl9zcGVlZFxyXG4gICAgICB0aGlzLnNpdHVhdGlvbi5maW5pc2ggPSB0aGlzLnNpdHVhdGlvbi5zdGFydCArIHRoaXMuc2l0dWF0aW9uLmR1cmF0aW9uL3RoaXMuX3NwZWVkXHJcbiAgICAgIHJldHVybiB0aGlzLmluaXRBbmltYXRpb25zKCkuc3RlcCgpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBhZGRzIGEgZnVuY3Rpb24gLyBTaXR1YXRpb24gdG8gdGhlIGFuaW1hdGlvbiBxdWV1ZVxyXG4gICAgICogQHBhcmFtIGZuIGZ1bmN0aW9uIC8gc2l0dWF0aW9uIHRvIGFkZFxyXG4gICAgICogQHJldHVybiB0aGlzXHJcbiAgICAgKi9cclxuICAsIHF1ZXVlOiBmdW5jdGlvbihmbil7XHJcbiAgICAgIGlmKHR5cGVvZiBmbiA9PSAnZnVuY3Rpb24nIHx8IGZuIGluc3RhbmNlb2YgU1ZHLlNpdHVhdGlvbilcclxuICAgICAgICB0aGlzLnNpdHVhdGlvbnMucHVzaChmbilcclxuXHJcbiAgICAgIGlmKCF0aGlzLnNpdHVhdGlvbikgdGhpcy5zaXR1YXRpb24gPSB0aGlzLnNpdHVhdGlvbnMuc2hpZnQoKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHB1bGxzIG5leHQgZWxlbWVudCBmcm9tIHRoZSBxdWV1ZSBhbmQgZXhlY3V0ZSBpdFxyXG4gICAgICogQHJldHVybiB0aGlzXHJcbiAgICAgKi9cclxuICAsIGRlcXVldWU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIC8vIHN0b3AgY3VycmVudCBhbmltYXRpb25cclxuICAgICAgdGhpcy5zdG9wKClcclxuXHJcbiAgICAgIC8vIGdldCBuZXh0IGFuaW1hdGlvbiBmcm9tIHF1ZXVlXHJcbiAgICAgIHRoaXMuc2l0dWF0aW9uID0gdGhpcy5zaXR1YXRpb25zLnNoaWZ0KClcclxuXHJcbiAgICAgIGlmKHRoaXMuc2l0dWF0aW9uKXtcclxuICAgICAgICBpZih0aGlzLnNpdHVhdGlvbiBpbnN0YW5jZW9mIFNWRy5TaXR1YXRpb24pIHtcclxuICAgICAgICAgIHRoaXMuc3RhcnQoKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBJZiBpdCBpcyBub3QgYSBTVkcuU2l0dWF0aW9uLCB0aGVuIGl0IGlzIGEgZnVuY3Rpb24sIHdlIGV4ZWN1dGUgaXRcclxuICAgICAgICAgIHRoaXMuc2l0dWF0aW9uLmNhbGwodGhpcylcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgLy8gdXBkYXRlcyBhbGwgYW5pbWF0aW9ucyB0byB0aGUgY3VycmVudCBzdGF0ZSBvZiB0aGUgZWxlbWVudFxyXG4gICAgLy8gdGhpcyBpcyBpbXBvcnRhbnQgd2hlbiBvbmUgcHJvcGVydHkgY291bGQgYmUgY2hhbmdlZCBmcm9tIGFub3RoZXIgcHJvcGVydHlcclxuICAsIGluaXRBbmltYXRpb25zOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGksIGosIHNvdXJjZVxyXG4gICAgICB2YXIgcyA9IHRoaXMuc2l0dWF0aW9uXHJcblxyXG4gICAgICBpZihzLmluaXQpIHJldHVybiB0aGlzXHJcblxyXG4gICAgICBmb3IoaSBpbiBzLmFuaW1hdGlvbnMpe1xyXG4gICAgICAgIHNvdXJjZSA9IHRoaXMudGFyZ2V0KClbaV0oKVxyXG5cclxuICAgICAgICBpZighQXJyYXkuaXNBcnJheShzb3VyY2UpKSB7XHJcbiAgICAgICAgICBzb3VyY2UgPSBbc291cmNlXVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIUFycmF5LmlzQXJyYXkocy5hbmltYXRpb25zW2ldKSkge1xyXG4gICAgICAgICAgcy5hbmltYXRpb25zW2ldID0gW3MuYW5pbWF0aW9uc1tpXV1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vaWYocy5hbmltYXRpb25zW2ldLmxlbmd0aCA+IHNvdXJjZS5sZW5ndGgpIHtcclxuICAgICAgICAvLyAgc291cmNlLmNvbmNhdCA9IHNvdXJjZS5jb25jYXQocy5hbmltYXRpb25zW2ldLnNsaWNlKHNvdXJjZS5sZW5ndGgsIHMuYW5pbWF0aW9uc1tpXS5sZW5ndGgpKVxyXG4gICAgICAgIC8vfVxyXG5cclxuICAgICAgICBmb3IoaiA9IHNvdXJjZS5sZW5ndGg7IGotLTspIHtcclxuICAgICAgICAgIC8vIFRoZSBjb25kaXRpb24gaXMgYmVjYXVzZSBzb21lIG1ldGhvZHMgcmV0dXJuIGEgbm9ybWFsIG51bWJlciBpbnN0ZWFkXHJcbiAgICAgICAgICAvLyBvZiBhIFNWRy5OdW1iZXJcclxuICAgICAgICAgIGlmKHMuYW5pbWF0aW9uc1tpXVtqXSBpbnN0YW5jZW9mIFNWRy5OdW1iZXIpXHJcbiAgICAgICAgICAgIHNvdXJjZVtqXSA9IG5ldyBTVkcuTnVtYmVyKHNvdXJjZVtqXSlcclxuXHJcbiAgICAgICAgICBzLmFuaW1hdGlvbnNbaV1bal0gPSBzb3VyY2Vbal0ubW9ycGgocy5hbmltYXRpb25zW2ldW2pdKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yKGkgaW4gcy5hdHRycyl7XHJcbiAgICAgICAgcy5hdHRyc1tpXSA9IG5ldyBTVkcuTW9ycGhPYmoodGhpcy50YXJnZXQoKS5hdHRyKGkpLCBzLmF0dHJzW2ldKVxyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IoaSBpbiBzLnN0eWxlcyl7XHJcbiAgICAgICAgcy5zdHlsZXNbaV0gPSBuZXcgU1ZHLk1vcnBoT2JqKHRoaXMudGFyZ2V0KCkuc3R5bGUoaSksIHMuc3R5bGVzW2ldKVxyXG4gICAgICB9XHJcblxyXG4gICAgICBzLmluaXRpYWxUcmFuc2Zvcm1hdGlvbiA9IHRoaXMudGFyZ2V0KCkubWF0cml4aWZ5KClcclxuXHJcbiAgICAgIHMuaW5pdCA9IHRydWVcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAsIGNsZWFyUXVldWU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIHRoaXMuc2l0dWF0aW9ucyA9IFtdXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgLCBjbGVhckN1cnJlbnQ6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIHRoaXMuc2l0dWF0aW9uID0gbnVsbFxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLyoqIHN0b3BzIHRoZSBhbmltYXRpb24gaW1tZWRpYXRlbHlcclxuICAgICAqIEBwYXJhbSBqdW1wVG9FbmQgQSBCb29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0byBjb21wbGV0ZSB0aGUgY3VycmVudCBhbmltYXRpb24gaW1tZWRpYXRlbHkuXHJcbiAgICAgKiBAcGFyYW0gY2xlYXJRdWV1ZSBBIEJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRvIHJlbW92ZSBxdWV1ZWQgYW5pbWF0aW9uIGFzIHdlbGwuXHJcbiAgICAgKiBAcmV0dXJuIHRoaXNcclxuICAgICAqL1xyXG4gICwgc3RvcDogZnVuY3Rpb24oanVtcFRvRW5kLCBjbGVhclF1ZXVlKXtcclxuICAgICAgdmFyIGFjdGl2ZSA9IHRoaXMuYWN0aXZlXHJcbiAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuXHJcbiAgICAgIGlmKGNsZWFyUXVldWUpe1xyXG4gICAgICAgIHRoaXMuY2xlYXJRdWV1ZSgpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKGp1bXBUb0VuZCAmJiB0aGlzLnNpdHVhdGlvbil7XHJcbiAgICAgICAgLy8gaW5pdGlhbGl6ZSB0aGUgc2l0dWF0aW9uIGlmIGl0IHdhcyBub3RcclxuICAgICAgICAhYWN0aXZlICYmIHRoaXMuc3RhcnRDdXJyZW50KClcclxuICAgICAgICB0aGlzLmF0RW5kKClcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5zdG9wQW5pbUZyYW1lKClcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmNsZWFyQ3VycmVudCgpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqIHJlc2V0cyB0aGUgZWxlbWVudCB0byB0aGUgc3RhdGUgd2hlcmUgdGhlIGN1cnJlbnQgZWxlbWVudCBoYXMgc3RhcnRlZFxyXG4gICAgICogQHJldHVybiB0aGlzXHJcbiAgICAgKi9cclxuICAsIHJlc2V0OiBmdW5jdGlvbigpe1xyXG4gICAgICBpZih0aGlzLnNpdHVhdGlvbil7XHJcbiAgICAgICAgdmFyIHRlbXAgPSB0aGlzLnNpdHVhdGlvblxyXG4gICAgICAgIHRoaXMuc3RvcCgpXHJcbiAgICAgICAgdGhpcy5zaXR1YXRpb24gPSB0ZW1wXHJcbiAgICAgICAgdGhpcy5hdFN0YXJ0KClcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFN0b3AgdGhlIGN1cnJlbnRseS1ydW5uaW5nIGFuaW1hdGlvbiwgcmVtb3ZlIGFsbCBxdWV1ZWQgYW5pbWF0aW9ucywgYW5kIGNvbXBsZXRlIGFsbCBhbmltYXRpb25zIGZvciB0aGUgZWxlbWVudC5cclxuICAsIGZpbmlzaDogZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgIHRoaXMuc3RvcCh0cnVlLCBmYWxzZSlcclxuXHJcbiAgICAgIHdoaWxlKHRoaXMuZGVxdWV1ZSgpLnNpdHVhdGlvbiAmJiB0aGlzLnN0b3AodHJ1ZSwgZmFsc2UpKTtcclxuXHJcbiAgICAgIHRoaXMuY2xlYXJRdWV1ZSgpLmNsZWFyQ3VycmVudCgpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCB0aGUgaW50ZXJuYWwgYW5pbWF0aW9uIHBvaW50ZXIgYXQgdGhlIHN0YXJ0IHBvc2l0aW9uLCBiZWZvcmUgYW55IGxvb3BzLCBhbmQgdXBkYXRlcyB0aGUgdmlzdWFsaXNhdGlvblxyXG4gICwgYXRTdGFydDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmF0KDAsIHRydWUpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2V0IHRoZSBpbnRlcm5hbCBhbmltYXRpb24gcG9pbnRlciBhdCB0aGUgZW5kIHBvc2l0aW9uLCBhZnRlciBhbGwgdGhlIGxvb3BzLCBhbmQgdXBkYXRlcyB0aGUgdmlzdWFsaXNhdGlvblxyXG4gICwgYXRFbmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAodGhpcy5zaXR1YXRpb24ubG9vcHMgPT09IHRydWUpIHtcclxuICAgICAgICAvLyBJZiBpbiBhIGluZmluaXRlIGxvb3AsIHdlIGVuZCB0aGUgY3VycmVudCBpdGVyYXRpb25cclxuICAgICAgICB0aGlzLnNpdHVhdGlvbi5sb29wcyA9IHRoaXMuc2l0dWF0aW9uLmxvb3AgKyAxXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKHR5cGVvZiB0aGlzLnNpdHVhdGlvbi5sb29wcyA9PSAnbnVtYmVyJykge1xyXG4gICAgICAgIC8vIElmIHBlcmZvcm1pbmcgYSBmaW5pdGUgbnVtYmVyIG9mIGxvb3BzLCB3ZSBnbyBhZnRlciBhbGwgdGhlIGxvb3BzXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXQodGhpcy5zaXR1YXRpb24ubG9vcHMsIHRydWUpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gSWYgbm8gbG9vcHMsIHdlIGp1c3QgZ28gYXQgdGhlIGVuZFxyXG4gICAgICAgIHJldHVybiB0aGlzLmF0KDEsIHRydWUpXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgdGhlIGludGVybmFsIGFuaW1hdGlvbiBwb2ludGVyIHRvIHRoZSBzcGVjaWZpZWQgcG9zaXRpb24gYW5kIHVwZGF0ZXMgdGhlIHZpc3VhbGlzYXRpb25cclxuICAgIC8vIGlmIGlzQWJzUG9zIGlzIHRydWUsIHBvcyBpcyB0cmVhdGVkIGFzIGFuIGFic29sdXRlIHBvc2l0aW9uXHJcbiAgLCBhdDogZnVuY3Rpb24ocG9zLCBpc0Fic1Bvcyl7XHJcbiAgICAgIHZhciBkdXJEaXZTcGQgPSB0aGlzLnNpdHVhdGlvbi5kdXJhdGlvbi90aGlzLl9zcGVlZFxyXG5cclxuICAgICAgdGhpcy5hYnNQb3MgPSBwb3NcclxuICAgICAgLy8gSWYgcG9zIGlzIG5vdCBhbiBhYnNvbHV0ZSBwb3NpdGlvbiwgd2UgY29udmVydCBpdCBpbnRvIG9uZVxyXG4gICAgICBpZiAoIWlzQWJzUG9zKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc2l0dWF0aW9uLnJldmVyc2VkKSB0aGlzLmFic1BvcyA9IDEgLSB0aGlzLmFic1Bvc1xyXG4gICAgICAgIHRoaXMuYWJzUG9zICs9IHRoaXMuc2l0dWF0aW9uLmxvb3BcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5zaXR1YXRpb24uc3RhcnQgPSArbmV3IERhdGUgLSB0aGlzLmFic1BvcyAqIGR1ckRpdlNwZFxyXG4gICAgICB0aGlzLnNpdHVhdGlvbi5maW5pc2ggPSB0aGlzLnNpdHVhdGlvbi5zdGFydCArIGR1ckRpdlNwZFxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuc3RlcCh0cnVlKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogc2V0cyBvciByZXR1cm5zIHRoZSBzcGVlZCBvZiB0aGUgYW5pbWF0aW9uc1xyXG4gICAgICogQHBhcmFtIHNwZWVkIG51bGwgfHwgTnVtYmVyIFRoZSBuZXcgc3BlZWQgb2YgdGhlIGFuaW1hdGlvbnNcclxuICAgICAqIEByZXR1cm4gTnVtYmVyIHx8IHRoaXNcclxuICAgICAqL1xyXG4gICwgc3BlZWQ6IGZ1bmN0aW9uKHNwZWVkKXtcclxuICAgICAgaWYgKHNwZWVkID09PSAwKSByZXR1cm4gdGhpcy5wYXVzZSgpXHJcblxyXG4gICAgICBpZiAoc3BlZWQpIHtcclxuICAgICAgICB0aGlzLl9zcGVlZCA9IHNwZWVkXHJcbiAgICAgICAgLy8gV2UgdXNlIGFuIGFic29sdXRlIHBvc2l0aW9uIGhlcmUgc28gdGhhdCBzcGVlZCBjYW4gYWZmZWN0IHRoZSBkZWxheSBiZWZvcmUgdGhlIGFuaW1hdGlvblxyXG4gICAgICAgIHJldHVybiB0aGlzLmF0KHRoaXMuYWJzUG9zLCB0cnVlKVxyXG4gICAgICB9IGVsc2UgcmV0dXJuIHRoaXMuX3NwZWVkXHJcbiAgICB9XHJcblxyXG4gICAgLy8gTWFrZSBsb29wYWJsZVxyXG4gICwgbG9vcDogZnVuY3Rpb24odGltZXMsIHJldmVyc2UpIHtcclxuICAgICAgdmFyIGMgPSB0aGlzLmxhc3QoKVxyXG5cclxuICAgICAgLy8gc3RvcmUgdG90YWwgbG9vcHNcclxuICAgICAgYy5sb29wcyA9ICh0aW1lcyAhPSBudWxsKSA/IHRpbWVzIDogdHJ1ZVxyXG4gICAgICBjLmxvb3AgPSAwXHJcblxyXG4gICAgICBpZihyZXZlcnNlKSBjLnJldmVyc2luZyA9IHRydWVcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICAvLyBwYXVzZXMgdGhlIGFuaW1hdGlvblxyXG4gICwgcGF1c2U6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZVxyXG4gICAgICB0aGlzLnN0b3BBbmltRnJhbWUoKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICAvLyB1bnBhdXNlIHRoZSBhbmltYXRpb25cclxuICAsIHBsYXk6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmKCF0aGlzLnBhdXNlZCkgcmV0dXJuIHRoaXNcclxuICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZVxyXG4gICAgICAvLyBXZSB1c2UgYW4gYWJzb2x1dGUgcG9zaXRpb24gaGVyZSBzbyB0aGF0IHRoZSBkZWxheSBiZWZvcmUgdGhlIGFuaW1hdGlvbiBjYW4gYmUgcGF1c2VkXHJcbiAgICAgIHJldHVybiB0aGlzLmF0KHRoaXMuYWJzUG9zLCB0cnVlKVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogdG9nZ2xlIG9yIHNldCB0aGUgZGlyZWN0aW9uIG9mIHRoZSBhbmltYXRpb25cclxuICAgICAqIHRydWUgc2V0cyBkaXJlY3Rpb24gdG8gYmFja3dhcmRzIHdoaWxlIGZhbHNlIHNldHMgaXQgdG8gZm9yd2FyZHNcclxuICAgICAqIEBwYXJhbSByZXZlcnNlZCBCb29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0byByZXZlcnNlIHRoZSBhbmltYXRpb24gb3Igbm90IChkZWZhdWx0OiB0b2dnbGUgdGhlIHJldmVyc2Ugc3RhdHVzKVxyXG4gICAgICogQHJldHVybiB0aGlzXHJcbiAgICAgKi9cclxuICAsIHJldmVyc2U6IGZ1bmN0aW9uKHJldmVyc2VkKXtcclxuICAgICAgdmFyIGMgPSB0aGlzLmxhc3QoKVxyXG5cclxuICAgICAgaWYodHlwZW9mIHJldmVyc2VkID09ICd1bmRlZmluZWQnKSBjLnJldmVyc2VkID0gIWMucmV2ZXJzZWRcclxuICAgICAgZWxzZSBjLnJldmVyc2VkID0gcmV2ZXJzZWRcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcmV0dXJucyBhIGZsb2F0IGZyb20gMC0xIGluZGljYXRpbmcgdGhlIHByb2dyZXNzIG9mIHRoZSBjdXJyZW50IGFuaW1hdGlvblxyXG4gICAgICogQHBhcmFtIGVhc2VkIEJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSByZXR1cm5lZCBwb3NpdGlvbiBzaG91bGQgYmUgZWFzZWQgb3Igbm90XHJcbiAgICAgKiBAcmV0dXJuIG51bWJlclxyXG4gICAgICovXHJcbiAgLCBwcm9ncmVzczogZnVuY3Rpb24oZWFzZUl0KXtcclxuICAgICAgcmV0dXJuIGVhc2VJdCA/IHRoaXMuc2l0dWF0aW9uLmVhc2UodGhpcy5wb3MpIDogdGhpcy5wb3NcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgYSBjYWxsYmFjayBmdW5jdGlvbiB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGUgY3VycmVudCBhbmltYXRpb24gaXMgZmluaXNoZWRcclxuICAgICAqIEBwYXJhbSBmbiBGdW5jdGlvbiB3aGljaCBzaG91bGQgYmUgZXhlY3V0ZWQgYXMgY2FsbGJhY2tcclxuICAgICAqIEByZXR1cm4gbnVtYmVyXHJcbiAgICAgKi9cclxuICAsIGFmdGVyOiBmdW5jdGlvbihmbil7XHJcbiAgICAgIHZhciBjID0gdGhpcy5sYXN0KClcclxuICAgICAgICAsIHdyYXBwZXIgPSBmdW5jdGlvbiB3cmFwcGVyKGUpe1xyXG4gICAgICAgICAgICBpZihlLmRldGFpbC5zaXR1YXRpb24gPT0gYyl7XHJcbiAgICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBjKVxyXG4gICAgICAgICAgICAgIHRoaXMub2ZmKCdmaW5pc2hlZC5meCcsIHdyYXBwZXIpIC8vIHByZXZlbnQgbWVtb3J5IGxlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgdGhpcy50YXJnZXQoKS5vbignZmluaXNoZWQuZngnLCB3cmFwcGVyKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuX2NhbGxTdGFydCgpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWRkcyBhIGNhbGxiYWNrIHdoaWNoIGlzIGNhbGxlZCB3aGVuZXZlciBvbmUgYW5pbWF0aW9uIHN0ZXAgaXMgcGVyZm9ybWVkXHJcbiAgLCBkdXJpbmc6IGZ1bmN0aW9uKGZuKXtcclxuICAgICAgdmFyIGMgPSB0aGlzLmxhc3QoKVxyXG4gICAgICAgICwgd3JhcHBlciA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgICAgICBpZihlLmRldGFpbC5zaXR1YXRpb24gPT0gYyl7XHJcbiAgICAgICAgICAgICAgZm4uY2FsbCh0aGlzLCBlLmRldGFpbC5wb3MsIFNWRy5tb3JwaChlLmRldGFpbC5wb3MpLCBlLmRldGFpbC5lYXNlZCwgYylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgLy8gc2VlIGFib3ZlXHJcbiAgICAgIHRoaXMudGFyZ2V0KCkub2ZmKCdkdXJpbmcuZngnLCB3cmFwcGVyKS5vbignZHVyaW5nLmZ4Jywgd3JhcHBlcilcclxuXHJcbiAgICAgIHRoaXMuYWZ0ZXIoZnVuY3Rpb24oKXtcclxuICAgICAgICB0aGlzLm9mZignZHVyaW5nLmZ4Jywgd3JhcHBlcilcclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLl9jYWxsU3RhcnQoKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNhbGxzIGFmdGVyIEFMTCBhbmltYXRpb25zIGluIHRoZSBxdWV1ZSBhcmUgZmluaXNoZWRcclxuICAsIGFmdGVyQWxsOiBmdW5jdGlvbihmbil7XHJcbiAgICAgIHZhciB3cmFwcGVyID0gZnVuY3Rpb24gd3JhcHBlcihlKXtcclxuICAgICAgICAgICAgZm4uY2FsbCh0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLm9mZignYWxsZmluaXNoZWQuZngnLCB3cmFwcGVyKVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgLy8gc2VlIGFib3ZlXHJcbiAgICAgIHRoaXMudGFyZ2V0KCkub2ZmKCdhbGxmaW5pc2hlZC5meCcsIHdyYXBwZXIpLm9uKCdhbGxmaW5pc2hlZC5meCcsIHdyYXBwZXIpXHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5fY2FsbFN0YXJ0KClcclxuICAgIH1cclxuXHJcbiAgICAvLyBjYWxscyBvbiBldmVyeSBhbmltYXRpb24gc3RlcCBmb3IgYWxsIGFuaW1hdGlvbnNcclxuICAsIGR1cmluZ0FsbDogZnVuY3Rpb24oZm4pe1xyXG4gICAgICB2YXIgd3JhcHBlciA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGUuZGV0YWlsLnBvcywgU1ZHLm1vcnBoKGUuZGV0YWlsLnBvcyksIGUuZGV0YWlsLmVhc2VkLCBlLmRldGFpbC5zaXR1YXRpb24pXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICB0aGlzLnRhcmdldCgpLm9mZignZHVyaW5nLmZ4Jywgd3JhcHBlcikub24oJ2R1cmluZy5meCcsIHdyYXBwZXIpXHJcblxyXG4gICAgICB0aGlzLmFmdGVyQWxsKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgdGhpcy5vZmYoJ2R1cmluZy5meCcsIHdyYXBwZXIpXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5fY2FsbFN0YXJ0KClcclxuICAgIH1cclxuXHJcbiAgLCBsYXN0OiBmdW5jdGlvbigpe1xyXG4gICAgICByZXR1cm4gdGhpcy5zaXR1YXRpb25zLmxlbmd0aCA/IHRoaXMuc2l0dWF0aW9uc1t0aGlzLnNpdHVhdGlvbnMubGVuZ3RoLTFdIDogdGhpcy5zaXR1YXRpb25cclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGRzIG9uZSBwcm9wZXJ0eSB0byB0aGUgYW5pbWF0aW9uc1xyXG4gICwgYWRkOiBmdW5jdGlvbihtZXRob2QsIGFyZ3MsIHR5cGUpe1xyXG4gICAgICB0aGlzLmxhc3QoKVt0eXBlIHx8ICdhbmltYXRpb25zJ11bbWV0aG9kXSA9IGFyZ3NcclxuICAgICAgcmV0dXJuIHRoaXMuX2NhbGxTdGFydCgpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqIHBlcmZvcm0gb25lIHN0ZXAgb2YgdGhlIGFuaW1hdGlvblxyXG4gICAgICogIEBwYXJhbSBpZ25vcmVUaW1lIEJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRvIGlnbm9yZSB0aW1lIGFuZCB1c2UgcG9zaXRpb24gZGlyZWN0bHkgb3IgcmVjYWxjdWxhdGUgcG9zaXRpb24gYmFzZWQgb24gdGltZVxyXG4gICAgICogIEByZXR1cm4gdGhpc1xyXG4gICAgICovXHJcbiAgLCBzdGVwOiBmdW5jdGlvbihpZ25vcmVUaW1lKXtcclxuXHJcbiAgICAgIC8vIGNvbnZlcnQgY3VycmVudCB0aW1lIHRvIGFuIGFic29sdXRlIHBvc2l0aW9uXHJcbiAgICAgIGlmKCFpZ25vcmVUaW1lKSB0aGlzLmFic1BvcyA9IHRoaXMudGltZVRvQWJzUG9zKCtuZXcgRGF0ZSlcclxuXHJcbiAgICAgIC8vIFRoaXMgcGFydCBjb252ZXJ0IGFuIGFic29sdXRlIHBvc2l0aW9uIHRvIGEgcG9zaXRpb25cclxuICAgICAgaWYodGhpcy5zaXR1YXRpb24ubG9vcHMgIT09IGZhbHNlKSB7XHJcbiAgICAgICAgdmFyIGFic1BvcywgYWJzUG9zSW50LCBsYXN0TG9vcFxyXG5cclxuICAgICAgICAvLyBJZiB0aGUgYWJzb2x1dGUgcG9zaXRpb24gaXMgYmVsb3cgMCwgd2UganVzdCB0cmVhdCBpdCBhcyBpZiBpdCB3YXMgMFxyXG4gICAgICAgIGFic1BvcyA9IE1hdGgubWF4KHRoaXMuYWJzUG9zLCAwKVxyXG4gICAgICAgIGFic1Bvc0ludCA9IE1hdGguZmxvb3IoYWJzUG9zKVxyXG5cclxuICAgICAgICBpZih0aGlzLnNpdHVhdGlvbi5sb29wcyA9PT0gdHJ1ZSB8fCBhYnNQb3NJbnQgPCB0aGlzLnNpdHVhdGlvbi5sb29wcykge1xyXG4gICAgICAgICAgdGhpcy5wb3MgPSBhYnNQb3MgLSBhYnNQb3NJbnRcclxuICAgICAgICAgIGxhc3RMb29wID0gdGhpcy5zaXR1YXRpb24ubG9vcFxyXG4gICAgICAgICAgdGhpcy5zaXR1YXRpb24ubG9vcCA9IGFic1Bvc0ludFxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB0aGlzLmFic1BvcyA9IHRoaXMuc2l0dWF0aW9uLmxvb3BzXHJcbiAgICAgICAgICB0aGlzLnBvcyA9IDFcclxuICAgICAgICAgIC8vIFRoZSAtMSBoZXJlIGlzIGJlY2F1c2Ugd2UgZG9uJ3Qgd2FudCB0byB0b2dnbGUgcmV2ZXJzZWQgd2hlbiBhbGwgdGhlIGxvb3BzIGhhdmUgYmVlbiBjb21wbGV0ZWRcclxuICAgICAgICAgIGxhc3RMb29wID0gdGhpcy5zaXR1YXRpb24ubG9vcCAtIDFcclxuICAgICAgICAgIHRoaXMuc2l0dWF0aW9uLmxvb3AgPSB0aGlzLnNpdHVhdGlvbi5sb29wc1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhpcy5zaXR1YXRpb24ucmV2ZXJzaW5nKSB7XHJcbiAgICAgICAgICAvLyBUb2dnbGUgcmV2ZXJzZWQgaWYgYW4gb2RkIG51bWJlciBvZiBsb29wcyBhcyBvY2N1cmVkIHNpbmNlIHRoZSBsYXN0IGNhbGwgb2Ygc3RlcFxyXG4gICAgICAgICAgdGhpcy5zaXR1YXRpb24ucmV2ZXJzZWQgPSB0aGlzLnNpdHVhdGlvbi5yZXZlcnNlZCAhPSBCb29sZWFuKCh0aGlzLnNpdHVhdGlvbi5sb29wIC0gbGFzdExvb3ApICUgMilcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBsb29wLCB0aGUgYWJzb2x1dGUgcG9zaXRpb24gbXVzdCBub3QgYmUgYWJvdmUgMVxyXG4gICAgICAgIHRoaXMuYWJzUG9zID0gTWF0aC5taW4odGhpcy5hYnNQb3MsIDEpXHJcbiAgICAgICAgdGhpcy5wb3MgPSB0aGlzLmFic1Bvc1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyB3aGlsZSB0aGUgYWJzb2x1dGUgcG9zaXRpb24gY2FuIGJlIGJlbG93IDAsIHRoZSBwb3NpdGlvbiBtdXN0IG5vdCBiZSBiZWxvdyAwXHJcbiAgICAgIGlmKHRoaXMucG9zIDwgMCkgdGhpcy5wb3MgPSAwXHJcblxyXG4gICAgICBpZih0aGlzLnNpdHVhdGlvbi5yZXZlcnNlZCkgdGhpcy5wb3MgPSAxIC0gdGhpcy5wb3NcclxuXHJcblxyXG4gICAgICAvLyBhcHBseSBlYXNpbmdcclxuICAgICAgdmFyIGVhc2VkID0gdGhpcy5zaXR1YXRpb24uZWFzZSh0aGlzLnBvcylcclxuXHJcbiAgICAgIC8vIGNhbGwgb25jZS1jYWxsYmFja3NcclxuICAgICAgZm9yKHZhciBpIGluIHRoaXMuc2l0dWF0aW9uLm9uY2Upe1xyXG4gICAgICAgIGlmKGkgPiB0aGlzLmxhc3RQb3MgJiYgaSA8PSBlYXNlZCl7XHJcbiAgICAgICAgICB0aGlzLnNpdHVhdGlvbi5vbmNlW2ldLmNhbGwodGhpcy50YXJnZXQoKSwgdGhpcy5wb3MsIGVhc2VkKVxyXG4gICAgICAgICAgZGVsZXRlIHRoaXMuc2l0dWF0aW9uLm9uY2VbaV1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGZpcmUgZHVyaW5nIGNhbGxiYWNrIHdpdGggcG9zaXRpb24sIGVhc2VkIHBvc2l0aW9uIGFuZCBjdXJyZW50IHNpdHVhdGlvbiBhcyBwYXJhbWV0ZXJcclxuICAgICAgaWYodGhpcy5hY3RpdmUpIHRoaXMudGFyZ2V0KCkuZmlyZSgnZHVyaW5nJywge3BvczogdGhpcy5wb3MsIGVhc2VkOiBlYXNlZCwgZng6IHRoaXMsIHNpdHVhdGlvbjogdGhpcy5zaXR1YXRpb259KVxyXG5cclxuICAgICAgLy8gdGhlIHVzZXIgbWF5IGNhbGwgc3RvcCBvciBmaW5pc2ggaW4gdGhlIGR1cmluZyBjYWxsYmFja1xyXG4gICAgICAvLyBzbyBtYWtlIHN1cmUgdGhhdCB3ZSBzdGlsbCBoYXZlIGEgdmFsaWQgc2l0dWF0aW9uXHJcbiAgICAgIGlmKCF0aGlzLnNpdHVhdGlvbil7XHJcbiAgICAgICAgcmV0dXJuIHRoaXNcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gYXBwbHkgdGhlIGFjdHVhbCBhbmltYXRpb24gdG8gZXZlcnkgcHJvcGVydHlcclxuICAgICAgdGhpcy5lYWNoQXQoKVxyXG5cclxuICAgICAgLy8gZG8gZmluYWwgY29kZSB3aGVuIHNpdHVhdGlvbiBpcyBmaW5pc2hlZFxyXG4gICAgICBpZigodGhpcy5wb3MgPT0gMSAmJiAhdGhpcy5zaXR1YXRpb24ucmV2ZXJzZWQpIHx8ICh0aGlzLnNpdHVhdGlvbi5yZXZlcnNlZCAmJiB0aGlzLnBvcyA9PSAwKSl7XHJcblxyXG4gICAgICAgIC8vIHN0b3AgYW5pbWF0aW9uIGNhbGxiYWNrXHJcbiAgICAgICAgdGhpcy5zdG9wQW5pbUZyYW1lKClcclxuXHJcbiAgICAgICAgLy8gZmlyZSBmaW5pc2hlZCBjYWxsYmFjayB3aXRoIGN1cnJlbnQgc2l0dWF0aW9uIGFzIHBhcmFtZXRlclxyXG4gICAgICAgIHRoaXMudGFyZ2V0KCkuZmlyZSgnZmluaXNoZWQnLCB7Zng6dGhpcywgc2l0dWF0aW9uOiB0aGlzLnNpdHVhdGlvbn0pXHJcblxyXG4gICAgICAgIGlmKCF0aGlzLnNpdHVhdGlvbnMubGVuZ3RoKXtcclxuICAgICAgICAgIHRoaXMudGFyZ2V0KCkuZmlyZSgnYWxsZmluaXNoZWQnKVxyXG5cclxuICAgICAgICAgIC8vIFJlY2hlY2sgdGhlIGxlbmd0aCBzaW5jZSB0aGUgdXNlciBtYXkgY2FsbCBhbmltYXRlIGluIHRoZSBhZnRlckFsbCBjYWxsYmFja1xyXG4gICAgICAgICAgaWYoIXRoaXMuc2l0dWF0aW9ucy5sZW5ndGgpe1xyXG4gICAgICAgICAgICB0aGlzLnRhcmdldCgpLm9mZignLmZ4JykgLy8gdGhlcmUgc2hvdWxkbnQgYmUgYW55IGJpbmRpbmcgbGVmdCwgYnV0IHRvIG1ha2Ugc3VyZS4uLlxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBzdGFydCBuZXh0IGFuaW1hdGlvblxyXG4gICAgICAgIGlmKHRoaXMuYWN0aXZlKSB0aGlzLmRlcXVldWUoKVxyXG4gICAgICAgIGVsc2UgdGhpcy5jbGVhckN1cnJlbnQoKVxyXG5cclxuICAgICAgfWVsc2UgaWYoIXRoaXMucGF1c2VkICYmIHRoaXMuYWN0aXZlKXtcclxuICAgICAgICAvLyB3ZSBjb250aW51ZSBhbmltYXRpbmcgd2hlbiB3ZSBhcmUgbm90IGF0IHRoZSBlbmRcclxuICAgICAgICB0aGlzLnN0YXJ0QW5pbUZyYW1lKClcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc2F2ZSBsYXN0IGVhc2VkIHBvc2l0aW9uIGZvciBvbmNlIGNhbGxiYWNrIHRyaWdnZXJpbmdcclxuICAgICAgdGhpcy5sYXN0UG9zID0gZWFzZWRcclxuICAgICAgcmV0dXJuIHRoaXNcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2FsY3VsYXRlcyB0aGUgc3RlcCBmb3IgZXZlcnkgcHJvcGVydHkgYW5kIGNhbGxzIGJsb2NrIHdpdGggaXRcclxuICAsIGVhY2hBdDogZnVuY3Rpb24oKXtcclxuICAgICAgdmFyIGksIGxlbiwgYXQsIHNlbGYgPSB0aGlzLCB0YXJnZXQgPSB0aGlzLnRhcmdldCgpLCBzID0gdGhpcy5zaXR1YXRpb25cclxuXHJcbiAgICAgIC8vIGFwcGx5IGFuaW1hdGlvbnMgd2hpY2ggY2FuIGJlIGNhbGxlZCB0cm91Z2ggYSBtZXRob2RcclxuICAgICAgZm9yKGkgaW4gcy5hbmltYXRpb25zKXtcclxuXHJcbiAgICAgICAgYXQgPSBbXS5jb25jYXQocy5hbmltYXRpb25zW2ldKS5tYXAoZnVuY3Rpb24oZWwpe1xyXG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBlbCAhPT0gJ3N0cmluZycgJiYgZWwuYXQgPyBlbC5hdChzLmVhc2Uoc2VsZi5wb3MpLCBzZWxmLnBvcykgOiBlbFxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRhcmdldFtpXS5hcHBseSh0YXJnZXQsIGF0KVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gYXBwbHkgYW5pbWF0aW9uIHdoaWNoIGhhcyB0byBiZSBhcHBsaWVkIHdpdGggYXR0cigpXHJcbiAgICAgIGZvcihpIGluIHMuYXR0cnMpe1xyXG5cclxuICAgICAgICBhdCA9IFtpXS5jb25jYXQocy5hdHRyc1tpXSkubWFwKGZ1bmN0aW9uKGVsKXtcclxuICAgICAgICAgIHJldHVybiB0eXBlb2YgZWwgIT09ICdzdHJpbmcnICYmIGVsLmF0ID8gZWwuYXQocy5lYXNlKHNlbGYucG9zKSwgc2VsZi5wb3MpIDogZWxcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0YXJnZXQuYXR0ci5hcHBseSh0YXJnZXQsIGF0KVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gYXBwbHkgYW5pbWF0aW9uIHdoaWNoIGhhcyB0byBiZSBhcHBsaWVkIHdpdGggc3R5bGUoKVxyXG4gICAgICBmb3IoaSBpbiBzLnN0eWxlcyl7XHJcblxyXG4gICAgICAgIGF0ID0gW2ldLmNvbmNhdChzLnN0eWxlc1tpXSkubWFwKGZ1bmN0aW9uKGVsKXtcclxuICAgICAgICAgIHJldHVybiB0eXBlb2YgZWwgIT09ICdzdHJpbmcnICYmIGVsLmF0ID8gZWwuYXQocy5lYXNlKHNlbGYucG9zKSwgc2VsZi5wb3MpIDogZWxcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0YXJnZXQuc3R5bGUuYXBwbHkodGFyZ2V0LCBhdClcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGFuaW1hdGUgaW5pdGlhbFRyYW5zZm9ybWF0aW9uIHdoaWNoIGhhcyB0byBiZSBjaGFpbmVkXHJcbiAgICAgIGlmKHMudHJhbnNmb3Jtcy5sZW5ndGgpe1xyXG5cclxuICAgICAgICAvLyBnZXQgaW5pdGlhbCBpbml0aWFsVHJhbnNmb3JtYXRpb25cclxuICAgICAgICBhdCA9IHMuaW5pdGlhbFRyYW5zZm9ybWF0aW9uXHJcbiAgICAgICAgZm9yKGkgPSAwLCBsZW4gPSBzLnRyYW5zZm9ybXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspe1xyXG5cclxuICAgICAgICAgIC8vIGdldCBuZXh0IHRyYW5zZm9ybWF0aW9uIGluIGNoYWluXHJcbiAgICAgICAgICB2YXIgYSA9IHMudHJhbnNmb3Jtc1tpXVxyXG5cclxuICAgICAgICAgIC8vIG11bHRpcGx5IG1hdHJpeCBkaXJlY3RseVxyXG4gICAgICAgICAgaWYoYSBpbnN0YW5jZW9mIFNWRy5NYXRyaXgpe1xyXG5cclxuICAgICAgICAgICAgaWYoYS5yZWxhdGl2ZSl7XHJcbiAgICAgICAgICAgICAgYXQgPSBhdC5tdWx0aXBseShuZXcgU1ZHLk1hdHJpeCgpLm1vcnBoKGEpLmF0KHMuZWFzZSh0aGlzLnBvcykpKVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICBhdCA9IGF0Lm1vcnBoKGEpLmF0KHMuZWFzZSh0aGlzLnBvcykpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29udGludWVcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyB3aGVuIHRyYW5zZm9ybWF0aW9uIGlzIGFic29sdXRlIHdlIGhhdmUgdG8gcmVzZXQgdGhlIG5lZWRlZCB0cmFuc2Zvcm1hdGlvbiBmaXJzdFxyXG4gICAgICAgICAgaWYoIWEucmVsYXRpdmUpXHJcbiAgICAgICAgICAgIGEudW5kbyhhdC5leHRyYWN0KCkpXHJcblxyXG4gICAgICAgICAgLy8gYW5kIHJlYXBwbHkgaXQgYWZ0ZXJcclxuICAgICAgICAgIGF0ID0gYXQubXVsdGlwbHkoYS5hdChzLmVhc2UodGhpcy5wb3MpKSlcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBzZXQgbmV3IG1hdHJpeCBvbiBlbGVtZW50XHJcbiAgICAgICAgdGFyZ2V0Lm1hdHJpeChhdClcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIGFkZHMgYW4gb25jZS1jYWxsYmFjayB3aGljaCBpcyBjYWxsZWQgYXQgYSBzcGVjaWZpYyBwb3NpdGlvbiBhbmQgbmV2ZXIgYWdhaW5cclxuICAsIG9uY2U6IGZ1bmN0aW9uKHBvcywgZm4sIGlzRWFzZWQpe1xyXG4gICAgICB2YXIgYyA9IHRoaXMubGFzdCgpXHJcbiAgICAgIGlmKCFpc0Vhc2VkKSBwb3MgPSBjLmVhc2UocG9zKVxyXG5cclxuICAgICAgYy5vbmNlW3Bvc10gPSBmblxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgLCBfY2FsbFN0YXJ0OiBmdW5jdGlvbigpIHtcclxuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe3RoaXMuc3RhcnQoKX0uYmluZCh0aGlzKSwgMClcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxuLCBwYXJlbnQ6IFNWRy5FbGVtZW50XHJcblxyXG4gIC8vIEFkZCBtZXRob2QgdG8gcGFyZW50IGVsZW1lbnRzXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBHZXQgZnggbW9kdWxlIG9yIGNyZWF0ZSBhIG5ldyBvbmUsIHRoZW4gYW5pbWF0ZSB3aXRoIGdpdmVuIGR1cmF0aW9uIGFuZCBlYXNlXHJcbiAgICBhbmltYXRlOiBmdW5jdGlvbihvLCBlYXNlLCBkZWxheSkge1xyXG4gICAgICByZXR1cm4gKHRoaXMuZnggfHwgKHRoaXMuZnggPSBuZXcgU1ZHLkZYKHRoaXMpKSkuYW5pbWF0ZShvLCBlYXNlLCBkZWxheSlcclxuICAgIH1cclxuICAsIGRlbGF5OiBmdW5jdGlvbihkZWxheSl7XHJcbiAgICAgIHJldHVybiAodGhpcy5meCB8fCAodGhpcy5meCA9IG5ldyBTVkcuRlgodGhpcykpKS5kZWxheShkZWxheSlcclxuICAgIH1cclxuICAsIHN0b3A6IGZ1bmN0aW9uKGp1bXBUb0VuZCwgY2xlYXJRdWV1ZSkge1xyXG4gICAgICBpZiAodGhpcy5meClcclxuICAgICAgICB0aGlzLmZ4LnN0b3AoanVtcFRvRW5kLCBjbGVhclF1ZXVlKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAsIGZpbmlzaDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLmZ4KVxyXG4gICAgICAgIHRoaXMuZnguZmluaXNoKClcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBQYXVzZSBjdXJyZW50IGFuaW1hdGlvblxyXG4gICwgcGF1c2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAodGhpcy5meClcclxuICAgICAgICB0aGlzLmZ4LnBhdXNlKClcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBQbGF5IHBhdXNlZCBjdXJyZW50IGFuaW1hdGlvblxyXG4gICwgcGxheTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLmZ4KVxyXG4gICAgICAgIHRoaXMuZngucGxheSgpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gU2V0L0dldCB0aGUgc3BlZWQgb2YgdGhlIGFuaW1hdGlvbnNcclxuICAsIHNwZWVkOiBmdW5jdGlvbihzcGVlZCkge1xyXG4gICAgICBpZiAodGhpcy5meClcclxuICAgICAgICBpZiAoc3BlZWQgPT0gbnVsbClcclxuICAgICAgICAgIHJldHVybiB0aGlzLmZ4LnNwZWVkKClcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICB0aGlzLmZ4LnNwZWVkKHNwZWVkKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICB9XHJcblxyXG59KVxyXG5cclxuLy8gTW9ycGhPYmogaXMgdXNlZCB3aGVuZXZlciBubyBtb3JwaGFibGUgb2JqZWN0IGlzIGdpdmVuXHJcblNWRy5Nb3JwaE9iaiA9IFNWRy5pbnZlbnQoe1xyXG5cclxuICBjcmVhdGU6IGZ1bmN0aW9uKGZyb20sIHRvKXtcclxuICAgIC8vIHByZXBhcmUgY29sb3IgZm9yIG1vcnBoaW5nXHJcbiAgICBpZihTVkcuQ29sb3IuaXNDb2xvcih0bykpIHJldHVybiBuZXcgU1ZHLkNvbG9yKGZyb20pLm1vcnBoKHRvKVxyXG4gICAgLy8gcHJlcGFyZSB2YWx1ZSBsaXN0IGZvciBtb3JwaGluZ1xyXG4gICAgaWYoU1ZHLnJlZ2V4LmRlbGltaXRlci50ZXN0KGZyb20pKSByZXR1cm4gbmV3IFNWRy5BcnJheShmcm9tKS5tb3JwaCh0bylcclxuICAgIC8vIHByZXBhcmUgbnVtYmVyIGZvciBtb3JwaGluZ1xyXG4gICAgaWYoU1ZHLnJlZ2V4Lm51bWJlckFuZFVuaXQudGVzdCh0bykpIHJldHVybiBuZXcgU1ZHLk51bWJlcihmcm9tKS5tb3JwaCh0bylcclxuXHJcbiAgICAvLyBwcmVwYXJlIGZvciBwbGFpbiBtb3JwaGluZ1xyXG4gICAgdGhpcy52YWx1ZSA9IGZyb21cclxuICAgIHRoaXMuZGVzdGluYXRpb24gPSB0b1xyXG4gIH1cclxuXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICBhdDogZnVuY3Rpb24ocG9zLCByZWFsKXtcclxuICAgICAgcmV0dXJuIHJlYWwgPCAxID8gdGhpcy52YWx1ZSA6IHRoaXMuZGVzdGluYXRpb25cclxuICAgIH0sXHJcblxyXG4gICAgdmFsdWVPZjogZnVuY3Rpb24oKXtcclxuICAgICAgcmV0dXJuIHRoaXMudmFsdWVcclxuICAgIH1cclxuICB9XHJcblxyXG59KVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuRlgsIHtcclxuICAvLyBBZGQgYW5pbWF0YWJsZSBhdHRyaWJ1dGVzXHJcbiAgYXR0cjogZnVuY3Rpb24oYSwgdiwgcmVsYXRpdmUpIHtcclxuICAgIC8vIGFwcGx5IGF0dHJpYnV0ZXMgaW5kaXZpZHVhbGx5XHJcbiAgICBpZiAodHlwZW9mIGEgPT0gJ29iamVjdCcpIHtcclxuICAgICAgZm9yICh2YXIga2V5IGluIGEpXHJcbiAgICAgICAgdGhpcy5hdHRyKGtleSwgYVtrZXldKVxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuYWRkKGEsIHYsICdhdHRycycpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gQWRkIGFuaW1hdGFibGUgc3R5bGVzXHJcbiwgc3R5bGU6IGZ1bmN0aW9uKHMsIHYpIHtcclxuICAgIGlmICh0eXBlb2YgcyA9PSAnb2JqZWN0JylcclxuICAgICAgZm9yICh2YXIga2V5IGluIHMpXHJcbiAgICAgICAgdGhpcy5zdHlsZShrZXksIHNba2V5XSlcclxuXHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMuYWRkKHMsIHYsICdzdHlsZXMnKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIEFuaW1hdGFibGUgeC1heGlzXHJcbiwgeDogZnVuY3Rpb24oeCwgcmVsYXRpdmUpIHtcclxuICAgIGlmKHRoaXMudGFyZ2V0KCkgaW5zdGFuY2VvZiBTVkcuRyl7XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtKHt4Onh9LCByZWxhdGl2ZSlcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbnVtID0gbmV3IFNWRy5OdW1iZXIoeClcclxuICAgIG51bS5yZWxhdGl2ZSA9IHJlbGF0aXZlXHJcbiAgICByZXR1cm4gdGhpcy5hZGQoJ3gnLCBudW0pXHJcbiAgfVxyXG4gIC8vIEFuaW1hdGFibGUgeS1heGlzXHJcbiwgeTogZnVuY3Rpb24oeSwgcmVsYXRpdmUpIHtcclxuICAgIGlmKHRoaXMudGFyZ2V0KCkgaW5zdGFuY2VvZiBTVkcuRyl7XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtKHt5Onl9LCByZWxhdGl2ZSlcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbnVtID0gbmV3IFNWRy5OdW1iZXIoeSlcclxuICAgIG51bS5yZWxhdGl2ZSA9IHJlbGF0aXZlXHJcbiAgICByZXR1cm4gdGhpcy5hZGQoJ3knLCBudW0pXHJcbiAgfVxyXG4gIC8vIEFuaW1hdGFibGUgY2VudGVyIHgtYXhpc1xyXG4sIGN4OiBmdW5jdGlvbih4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQoJ2N4JywgbmV3IFNWRy5OdW1iZXIoeCkpXHJcbiAgfVxyXG4gIC8vIEFuaW1hdGFibGUgY2VudGVyIHktYXhpc1xyXG4sIGN5OiBmdW5jdGlvbih5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQoJ2N5JywgbmV3IFNWRy5OdW1iZXIoeSkpXHJcbiAgfVxyXG4gIC8vIEFkZCBhbmltYXRhYmxlIG1vdmVcclxuLCBtb3ZlOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICByZXR1cm4gdGhpcy54KHgpLnkoeSlcclxuICB9XHJcbiAgLy8gQWRkIGFuaW1hdGFibGUgY2VudGVyXHJcbiwgY2VudGVyOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5jeCh4KS5jeSh5KVxyXG4gIH1cclxuICAvLyBBZGQgYW5pbWF0YWJsZSBzaXplXHJcbiwgc2l6ZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xyXG4gICAgaWYgKHRoaXMudGFyZ2V0KCkgaW5zdGFuY2VvZiBTVkcuVGV4dCkge1xyXG4gICAgICAvLyBhbmltYXRlIGZvbnQgc2l6ZSBmb3IgVGV4dCBlbGVtZW50c1xyXG4gICAgICB0aGlzLmF0dHIoJ2ZvbnQtc2l6ZScsIHdpZHRoKVxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIGFuaW1hdGUgYmJveCBiYXNlZCBzaXplIGZvciBhbGwgb3RoZXIgZWxlbWVudHNcclxuICAgICAgdmFyIGJveFxyXG5cclxuICAgICAgaWYoIXdpZHRoIHx8ICFoZWlnaHQpe1xyXG4gICAgICAgIGJveCA9IHRoaXMudGFyZ2V0KCkuYmJveCgpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKCF3aWR0aCl7XHJcbiAgICAgICAgd2lkdGggPSBib3gud2lkdGggLyBib3guaGVpZ2h0ICAqIGhlaWdodFxyXG4gICAgICB9XHJcblxyXG4gICAgICBpZighaGVpZ2h0KXtcclxuICAgICAgICBoZWlnaHQgPSBib3guaGVpZ2h0IC8gYm94LndpZHRoICAqIHdpZHRoXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuYWRkKCd3aWR0aCcgLCBuZXcgU1ZHLk51bWJlcih3aWR0aCkpXHJcbiAgICAgICAgICAuYWRkKCdoZWlnaHQnLCBuZXcgU1ZHLk51bWJlcihoZWlnaHQpKVxyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBBZGQgYW5pbWF0YWJsZSB3aWR0aFxyXG4sIHdpZHRoOiBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgcmV0dXJuIHRoaXMuYWRkKCd3aWR0aCcsIG5ldyBTVkcuTnVtYmVyKHdpZHRoKSlcclxuICB9XHJcbiAgLy8gQWRkIGFuaW1hdGFibGUgaGVpZ2h0XHJcbiwgaGVpZ2h0OiBmdW5jdGlvbihoZWlnaHQpIHtcclxuICAgIHJldHVybiB0aGlzLmFkZCgnaGVpZ2h0JywgbmV3IFNWRy5OdW1iZXIoaGVpZ2h0KSlcclxuICB9XHJcbiAgLy8gQWRkIGFuaW1hdGFibGUgcGxvdFxyXG4sIHBsb3Q6IGZ1bmN0aW9uKGEsIGIsIGMsIGQpIHtcclxuICAgIC8vIExpbmVzIGNhbiBiZSBwbG90dGVkIHdpdGggNCBhcmd1bWVudHNcclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPT0gNCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5wbG90KFthLCBiLCBjLCBkXSlcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5hZGQoJ3Bsb3QnLCBuZXcgKHRoaXMudGFyZ2V0KCkubW9ycGhBcnJheSkoYSkpXHJcbiAgfVxyXG4gIC8vIEFkZCBsZWFkaW5nIG1ldGhvZFxyXG4sIGxlYWRpbmc6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy50YXJnZXQoKS5sZWFkaW5nID9cclxuICAgICAgdGhpcy5hZGQoJ2xlYWRpbmcnLCBuZXcgU1ZHLk51bWJlcih2YWx1ZSkpIDpcclxuICAgICAgdGhpc1xyXG4gIH1cclxuICAvLyBBZGQgYW5pbWF0YWJsZSB2aWV3Ym94XHJcbiwgdmlld2JveDogZnVuY3Rpb24oeCwgeSwgd2lkdGgsIGhlaWdodCkge1xyXG4gICAgaWYgKHRoaXMudGFyZ2V0KCkgaW5zdGFuY2VvZiBTVkcuQ29udGFpbmVyKSB7XHJcbiAgICAgIHRoaXMuYWRkKCd2aWV3Ym94JywgbmV3IFNWRy5WaWV3Qm94KHgsIHksIHdpZHRoLCBoZWlnaHQpKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4sIHVwZGF0ZTogZnVuY3Rpb24obykge1xyXG4gICAgaWYgKHRoaXMudGFyZ2V0KCkgaW5zdGFuY2VvZiBTVkcuU3RvcCkge1xyXG4gICAgICBpZiAodHlwZW9mIG8gPT0gJ251bWJlcicgfHwgbyBpbnN0YW5jZW9mIFNWRy5OdW1iZXIpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy51cGRhdGUoe1xyXG4gICAgICAgICAgb2Zmc2V0OiAgYXJndW1lbnRzWzBdXHJcbiAgICAgICAgLCBjb2xvcjogICBhcmd1bWVudHNbMV1cclxuICAgICAgICAsIG9wYWNpdHk6IGFyZ3VtZW50c1syXVxyXG4gICAgICAgIH0pXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChvLm9wYWNpdHkgIT0gbnVsbCkgdGhpcy5hdHRyKCdzdG9wLW9wYWNpdHknLCBvLm9wYWNpdHkpXHJcbiAgICAgIGlmIChvLmNvbG9yICAgIT0gbnVsbCkgdGhpcy5hdHRyKCdzdG9wLWNvbG9yJywgby5jb2xvcilcclxuICAgICAgaWYgKG8ub2Zmc2V0ICAhPSBudWxsKSB0aGlzLmF0dHIoJ29mZnNldCcsIG8ub2Zmc2V0KVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG59KVxyXG5cblNWRy5Cb3ggPSBTVkcuaW52ZW50KHtcclxuICBjcmVhdGU6IGZ1bmN0aW9uKHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIGlmICh0eXBlb2YgeCA9PSAnb2JqZWN0JyAmJiAhKHggaW5zdGFuY2VvZiBTVkcuRWxlbWVudCkpIHtcclxuICAgICAgLy8gY2hyb21lcyBnZXRCb3VuZGluZ0NsaWVudFJlY3QgaGFzIG5vIHggYW5kIHkgcHJvcGVydHlcclxuICAgICAgcmV0dXJuIFNWRy5Cb3guY2FsbCh0aGlzLCB4LmxlZnQgIT0gbnVsbCA/IHgubGVmdCA6IHgueCAsIHgudG9wICE9IG51bGwgPyB4LnRvcCA6IHgueSwgeC53aWR0aCwgeC5oZWlnaHQpXHJcbiAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gNCkge1xyXG4gICAgICB0aGlzLnggPSB4XHJcbiAgICAgIHRoaXMueSA9IHlcclxuICAgICAgdGhpcy53aWR0aCA9IHdpZHRoXHJcbiAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWRkIGNlbnRlciwgcmlnaHQsIGJvdHRvbS4uLlxyXG4gICAgZnVsbEJveCh0aGlzKVxyXG4gIH1cclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIE1lcmdlIHJlY3QgYm94IHdpdGggYW5vdGhlciwgcmV0dXJuIGEgbmV3IGluc3RhbmNlXHJcbiAgICBtZXJnZTogZnVuY3Rpb24oYm94KSB7XHJcbiAgICAgIHZhciBiID0gbmV3IHRoaXMuY29uc3RydWN0b3IoKVxyXG5cclxuICAgICAgLy8gbWVyZ2UgYm94ZXNcclxuICAgICAgYi54ICAgICAgPSBNYXRoLm1pbih0aGlzLngsIGJveC54KVxyXG4gICAgICBiLnkgICAgICA9IE1hdGgubWluKHRoaXMueSwgYm94LnkpXHJcbiAgICAgIGIud2lkdGggID0gTWF0aC5tYXgodGhpcy54ICsgdGhpcy53aWR0aCwgIGJveC54ICsgYm94LndpZHRoKSAgLSBiLnhcclxuICAgICAgYi5oZWlnaHQgPSBNYXRoLm1heCh0aGlzLnkgKyB0aGlzLmhlaWdodCwgYm94LnkgKyBib3guaGVpZ2h0KSAtIGIueVxyXG5cclxuICAgICAgcmV0dXJuIGZ1bGxCb3goYilcclxuICAgIH1cclxuXHJcbiAgLCB0cmFuc2Zvcm06IGZ1bmN0aW9uKG0pIHtcclxuICAgICAgdmFyIHhNaW4gPSBJbmZpbml0eSwgeE1heCA9IC1JbmZpbml0eSwgeU1pbiA9IEluZmluaXR5LCB5TWF4ID0gLUluZmluaXR5LCBwLCBiYm94XHJcblxyXG4gICAgICB2YXIgcHRzID0gW1xyXG4gICAgICAgIG5ldyBTVkcuUG9pbnQodGhpcy54LCB0aGlzLnkpLFxyXG4gICAgICAgIG5ldyBTVkcuUG9pbnQodGhpcy54MiwgdGhpcy55KSxcclxuICAgICAgICBuZXcgU1ZHLlBvaW50KHRoaXMueCwgdGhpcy55MiksXHJcbiAgICAgICAgbmV3IFNWRy5Qb2ludCh0aGlzLngyLCB0aGlzLnkyKVxyXG4gICAgICBdXHJcblxyXG4gICAgICBwdHMuZm9yRWFjaChmdW5jdGlvbihwKSB7XHJcbiAgICAgICAgcCA9IHAudHJhbnNmb3JtKG0pXHJcbiAgICAgICAgeE1pbiA9IE1hdGgubWluKHhNaW4scC54KVxyXG4gICAgICAgIHhNYXggPSBNYXRoLm1heCh4TWF4LHAueClcclxuICAgICAgICB5TWluID0gTWF0aC5taW4oeU1pbixwLnkpXHJcbiAgICAgICAgeU1heCA9IE1hdGgubWF4KHlNYXgscC55KVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgYmJveCA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKClcclxuICAgICAgYmJveC54ID0geE1pblxyXG4gICAgICBiYm94LndpZHRoID0geE1heC14TWluXHJcbiAgICAgIGJib3gueSA9IHlNaW5cclxuICAgICAgYmJveC5oZWlnaHQgPSB5TWF4LXlNaW5cclxuXHJcbiAgICAgIGZ1bGxCb3goYmJveClcclxuXHJcbiAgICAgIHJldHVybiBiYm94XHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cclxuU1ZHLkJCb3ggPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICBTVkcuQm94LmFwcGx5KHRoaXMsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSlcclxuXHJcbiAgICAvLyBnZXQgdmFsdWVzIGlmIGVsZW1lbnQgaXMgZ2l2ZW5cclxuICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgU1ZHLkVsZW1lbnQpIHtcclxuICAgICAgdmFyIGJveFxyXG5cclxuICAgICAgLy8geWVzIHRoaXMgaXMgdWdseSwgYnV0IEZpcmVmb3ggY2FuIGJlIGEgYml0Y2ggd2hlbiBpdCBjb21lcyB0byBlbGVtZW50cyB0aGF0IGFyZSBub3QgeWV0IHJlbmRlcmVkXHJcbiAgICAgIHRyeSB7XHJcblxyXG4gICAgICAgIGlmICghZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNvbnRhaW5zKXtcclxuICAgICAgICAgIC8vIFRoaXMgaXMgSUUgLSBpdCBkb2VzIG5vdCBzdXBwb3J0IGNvbnRhaW5zKCkgZm9yIHRvcC1sZXZlbCBTVkdzXHJcbiAgICAgICAgICB2YXIgdG9wUGFyZW50ID0gZWxlbWVudC5ub2RlXHJcbiAgICAgICAgICB3aGlsZSAodG9wUGFyZW50LnBhcmVudE5vZGUpe1xyXG4gICAgICAgICAgICB0b3BQYXJlbnQgPSB0b3BQYXJlbnQucGFyZW50Tm9kZVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKHRvcFBhcmVudCAhPSBkb2N1bWVudCkgdGhyb3cgbmV3IEV4Y2VwdGlvbignRWxlbWVudCBub3QgaW4gdGhlIGRvbScpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIHRoZSBlbGVtZW50IGlzIE5PVCBpbiB0aGUgZG9tLCB0aHJvdyBlcnJvclxyXG4gICAgICAgICAgaWYoIWRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jb250YWlucyhlbGVtZW50Lm5vZGUpKSB0aHJvdyBuZXcgRXhjZXB0aW9uKCdFbGVtZW50IG5vdCBpbiB0aGUgZG9tJylcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZpbmQgbmF0aXZlIGJib3hcclxuICAgICAgICBib3ggPSBlbGVtZW50Lm5vZGUuZ2V0QkJveCgpXHJcbiAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIGlmKGVsZW1lbnQgaW5zdGFuY2VvZiBTVkcuU2hhcGUpe1xyXG4gICAgICAgICAgdmFyIGNsb25lID0gZWxlbWVudC5jbG9uZShTVkcucGFyc2VyLmRyYXcuaW5zdGFuY2UpLnNob3coKVxyXG4gICAgICAgICAgYm94ID0gY2xvbmUubm9kZS5nZXRCQm94KClcclxuICAgICAgICAgIGNsb25lLnJlbW92ZSgpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICBib3ggPSB7XHJcbiAgICAgICAgICAgIHg6ICAgICAgZWxlbWVudC5ub2RlLmNsaWVudExlZnRcclxuICAgICAgICAgICwgeTogICAgICBlbGVtZW50Lm5vZGUuY2xpZW50VG9wXHJcbiAgICAgICAgICAsIHdpZHRoOiAgZWxlbWVudC5ub2RlLmNsaWVudFdpZHRoXHJcbiAgICAgICAgICAsIGhlaWdodDogZWxlbWVudC5ub2RlLmNsaWVudEhlaWdodFxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgU1ZHLkJveC5jYWxsKHRoaXMsIGJveClcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxuICAvLyBEZWZpbmUgYW5jZXN0b3JcclxuLCBpbmhlcml0OiBTVkcuQm94XHJcblxyXG4gIC8vIERlZmluZSBQYXJlbnRcclxuLCBwYXJlbnQ6IFNWRy5FbGVtZW50XHJcblxyXG4gIC8vIENvbnN0cnVjdG9yXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBHZXQgYm91bmRpbmcgYm94XHJcbiAgICBiYm94OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuQkJveCh0aGlzKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuQkJveC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTVkcuQkJveFxyXG5cclxuXHJcblNWRy5leHRlbmQoU1ZHLkVsZW1lbnQsIHtcclxuICB0Ym94OiBmdW5jdGlvbigpe1xyXG4gICAgY29uc29sZS53YXJuKCdVc2Ugb2YgVEJveCBpcyBkZXByZWNhdGVkIGFuZCBtYXBwZWQgdG8gUkJveC4gVXNlIC5yYm94KCkgaW5zdGVhZC4nKVxyXG4gICAgcmV0dXJuIHRoaXMucmJveCh0aGlzLmRvYygpKVxyXG4gIH1cclxufSlcclxuXHJcblNWRy5SQm94ID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgU1ZHLkJveC5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpXHJcblxyXG4gICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBTVkcuRWxlbWVudCkge1xyXG4gICAgICBTVkcuQm94LmNhbGwodGhpcywgZWxlbWVudC5ub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiwgaW5oZXJpdDogU1ZHLkJveFxyXG5cclxuICAvLyBkZWZpbmUgUGFyZW50XHJcbiwgcGFyZW50OiBTVkcuRWxlbWVudFxyXG5cclxuLCBleHRlbmQ6IHtcclxuICAgIGFkZE9mZnNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIG9mZnNldCBieSB3aW5kb3cgc2Nyb2xsIHBvc2l0aW9uLCBiZWNhdXNlIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBjaGFuZ2VzIHdoZW4gd2luZG93IGlzIHNjcm9sbGVkXHJcbiAgICAgIHRoaXMueCArPSB3aW5kb3cucGFnZVhPZmZzZXRcclxuICAgICAgdGhpcy55ICs9IHdpbmRvdy5wYWdlWU9mZnNldFxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQ29uc3RydWN0b3JcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIEdldCByZWN0IGJveFxyXG4gICAgcmJveDogZnVuY3Rpb24oZWwpIHtcclxuICAgICAgaWYgKGVsKSByZXR1cm4gbmV3IFNWRy5SQm94KHRoaXMpLnRyYW5zZm9ybShlbC5zY3JlZW5DVE0oKS5pbnZlcnNlKCkpXHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLlJCb3godGhpcykuYWRkT2Zmc2V0KClcclxuICAgIH1cclxuICB9XHJcblxyXG59KVxyXG5cclxuU1ZHLlJCb3gucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU1ZHLlJCb3hcclxuXG5TVkcuTWF0cml4ID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oc291cmNlKSB7XHJcbiAgICB2YXIgaSwgYmFzZSA9IGFycmF5VG9NYXRyaXgoWzEsIDAsIDAsIDEsIDAsIDBdKVxyXG5cclxuICAgIC8vIGVuc3VyZSBzb3VyY2UgYXMgb2JqZWN0XHJcbiAgICBzb3VyY2UgPSBzb3VyY2UgaW5zdGFuY2VvZiBTVkcuRWxlbWVudCA/XHJcbiAgICAgIHNvdXJjZS5tYXRyaXhpZnkoKSA6XHJcbiAgICB0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJyA/XHJcbiAgICAgIGFycmF5VG9NYXRyaXgoc291cmNlLnNwbGl0KFNWRy5yZWdleC5kZWxpbWl0ZXIpLm1hcChwYXJzZUZsb2F0KSkgOlxyXG4gICAgYXJndW1lbnRzLmxlbmd0aCA9PSA2ID9cclxuICAgICAgYXJyYXlUb01hdHJpeChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpIDpcclxuICAgIEFycmF5LmlzQXJyYXkoc291cmNlKSA/XHJcbiAgICAgIGFycmF5VG9NYXRyaXgoc291cmNlKSA6XHJcbiAgICB0eXBlb2Ygc291cmNlID09PSAnb2JqZWN0JyA/XHJcbiAgICAgIHNvdXJjZSA6IGJhc2VcclxuXHJcbiAgICAvLyBtZXJnZSBzb3VyY2VcclxuICAgIGZvciAoaSA9IGFiY2RlZi5sZW5ndGggLSAxOyBpID49IDA7IC0taSlcclxuICAgICAgdGhpc1thYmNkZWZbaV1dID0gc291cmNlW2FiY2RlZltpXV0gIT0gbnVsbCA/XHJcbiAgICAgICAgc291cmNlW2FiY2RlZltpXV0gOiBiYXNlW2FiY2RlZltpXV1cclxuICB9XHJcblxyXG4gIC8vIEFkZCBtZXRob2RzXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICAvLyBFeHRyYWN0IGluZGl2aWR1YWwgdHJhbnNmb3JtYXRpb25zXHJcbiAgICBleHRyYWN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gZmluZCBkZWx0YSB0cmFuc2Zvcm0gcG9pbnRzXHJcbiAgICAgIHZhciBweCAgICA9IGRlbHRhVHJhbnNmb3JtUG9pbnQodGhpcywgMCwgMSlcclxuICAgICAgICAsIHB5ICAgID0gZGVsdGFUcmFuc2Zvcm1Qb2ludCh0aGlzLCAxLCAwKVxyXG4gICAgICAgICwgc2tld1ggPSAxODAgLyBNYXRoLlBJICogTWF0aC5hdGFuMihweC55LCBweC54KSAtIDkwXHJcblxyXG4gICAgICByZXR1cm4ge1xyXG4gICAgICAgIC8vIHRyYW5zbGF0aW9uXHJcbiAgICAgICAgeDogICAgICAgIHRoaXMuZVxyXG4gICAgICAsIHk6ICAgICAgICB0aGlzLmZcclxuICAgICAgLCB0cmFuc2Zvcm1lZFg6KHRoaXMuZSAqIE1hdGguY29zKHNrZXdYICogTWF0aC5QSSAvIDE4MCkgKyB0aGlzLmYgKiBNYXRoLnNpbihza2V3WCAqIE1hdGguUEkgLyAxODApKSAvIE1hdGguc3FydCh0aGlzLmEgKiB0aGlzLmEgKyB0aGlzLmIgKiB0aGlzLmIpXHJcbiAgICAgICwgdHJhbnNmb3JtZWRZOih0aGlzLmYgKiBNYXRoLmNvcyhza2V3WCAqIE1hdGguUEkgLyAxODApICsgdGhpcy5lICogTWF0aC5zaW4oLXNrZXdYICogTWF0aC5QSSAvIDE4MCkpIC8gTWF0aC5zcXJ0KHRoaXMuYyAqIHRoaXMuYyArIHRoaXMuZCAqIHRoaXMuZClcclxuICAgICAgICAvLyBza2V3XHJcbiAgICAgICwgc2tld1g6ICAgIC1za2V3WFxyXG4gICAgICAsIHNrZXdZOiAgICAxODAgLyBNYXRoLlBJICogTWF0aC5hdGFuMihweS55LCBweS54KVxyXG4gICAgICAgIC8vIHNjYWxlXHJcbiAgICAgICwgc2NhbGVYOiAgIE1hdGguc3FydCh0aGlzLmEgKiB0aGlzLmEgKyB0aGlzLmIgKiB0aGlzLmIpXHJcbiAgICAgICwgc2NhbGVZOiAgIE1hdGguc3FydCh0aGlzLmMgKiB0aGlzLmMgKyB0aGlzLmQgKiB0aGlzLmQpXHJcbiAgICAgICAgLy8gcm90YXRpb25cclxuICAgICAgLCByb3RhdGlvbjogc2tld1hcclxuICAgICAgLCBhOiB0aGlzLmFcclxuICAgICAgLCBiOiB0aGlzLmJcclxuICAgICAgLCBjOiB0aGlzLmNcclxuICAgICAgLCBkOiB0aGlzLmRcclxuICAgICAgLCBlOiB0aGlzLmVcclxuICAgICAgLCBmOiB0aGlzLmZcclxuICAgICAgLCBtYXRyaXg6IG5ldyBTVkcuTWF0cml4KHRoaXMpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIENsb25lIG1hdHJpeFxyXG4gICwgY2xvbmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFNWRy5NYXRyaXgodGhpcylcclxuICAgIH1cclxuICAgIC8vIE1vcnBoIG9uZSBtYXRyaXggaW50byBhbm90aGVyXHJcbiAgLCBtb3JwaDogZnVuY3Rpb24obWF0cml4KSB7XHJcbiAgICAgIC8vIHN0b3JlIG5ldyBkZXN0aW5hdGlvblxyXG4gICAgICB0aGlzLmRlc3RpbmF0aW9uID0gbmV3IFNWRy5NYXRyaXgobWF0cml4KVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIEdldCBtb3JwaGVkIG1hdHJpeCBhdCBhIGdpdmVuIHBvc2l0aW9uXHJcbiAgLCBhdDogZnVuY3Rpb24ocG9zKSB7XHJcbiAgICAgIC8vIG1ha2Ugc3VyZSBhIGRlc3RpbmF0aW9uIGlzIGRlZmluZWRcclxuICAgICAgaWYgKCF0aGlzLmRlc3RpbmF0aW9uKSByZXR1cm4gdGhpc1xyXG5cclxuICAgICAgLy8gY2FsY3VsYXRlIG1vcnBoZWQgbWF0cml4IGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICAgICAgdmFyIG1hdHJpeCA9IG5ldyBTVkcuTWF0cml4KHtcclxuICAgICAgICBhOiB0aGlzLmEgKyAodGhpcy5kZXN0aW5hdGlvbi5hIC0gdGhpcy5hKSAqIHBvc1xyXG4gICAgICAsIGI6IHRoaXMuYiArICh0aGlzLmRlc3RpbmF0aW9uLmIgLSB0aGlzLmIpICogcG9zXHJcbiAgICAgICwgYzogdGhpcy5jICsgKHRoaXMuZGVzdGluYXRpb24uYyAtIHRoaXMuYykgKiBwb3NcclxuICAgICAgLCBkOiB0aGlzLmQgKyAodGhpcy5kZXN0aW5hdGlvbi5kIC0gdGhpcy5kKSAqIHBvc1xyXG4gICAgICAsIGU6IHRoaXMuZSArICh0aGlzLmRlc3RpbmF0aW9uLmUgLSB0aGlzLmUpICogcG9zXHJcbiAgICAgICwgZjogdGhpcy5mICsgKHRoaXMuZGVzdGluYXRpb24uZiAtIHRoaXMuZikgKiBwb3NcclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiBtYXRyaXhcclxuICAgIH1cclxuICAgIC8vIE11bHRpcGxpZXMgYnkgZ2l2ZW4gbWF0cml4XHJcbiAgLCBtdWx0aXBseTogZnVuY3Rpb24obWF0cml4KSB7XHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLk1hdHJpeCh0aGlzLm5hdGl2ZSgpLm11bHRpcGx5KHBhcnNlTWF0cml4KG1hdHJpeCkubmF0aXZlKCkpKVxyXG4gICAgfVxyXG4gICAgLy8gSW52ZXJzZXMgbWF0cml4XHJcbiAgLCBpbnZlcnNlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuTWF0cml4KHRoaXMubmF0aXZlKCkuaW52ZXJzZSgpKVxyXG4gICAgfVxyXG4gICAgLy8gVHJhbnNsYXRlIG1hdHJpeFxyXG4gICwgdHJhbnNsYXRlOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLk1hdHJpeCh0aGlzLm5hdGl2ZSgpLnRyYW5zbGF0ZSh4IHx8IDAsIHkgfHwgMCkpXHJcbiAgICB9XHJcbiAgICAvLyBTY2FsZSBtYXRyaXhcclxuICAsIHNjYWxlOiBmdW5jdGlvbih4LCB5LCBjeCwgY3kpIHtcclxuICAgICAgLy8gc3VwcG9ydCB1bmlmb3JtYWwgc2NhbGVcclxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgIHkgPSB4XHJcbiAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAzKSB7XHJcbiAgICAgICAgY3kgPSBjeFxyXG4gICAgICAgIGN4ID0geVxyXG4gICAgICAgIHkgPSB4XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmFyb3VuZChjeCwgY3ksIG5ldyBTVkcuTWF0cml4KHgsIDAsIDAsIHksIDAsIDApKVxyXG4gICAgfVxyXG4gICAgLy8gUm90YXRlIG1hdHJpeFxyXG4gICwgcm90YXRlOiBmdW5jdGlvbihyLCBjeCwgY3kpIHtcclxuICAgICAgLy8gY29udmVydCBkZWdyZWVzIHRvIHJhZGlhbnNcclxuICAgICAgciA9IFNWRy51dGlscy5yYWRpYW5zKHIpXHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5hcm91bmQoY3gsIGN5LCBuZXcgU1ZHLk1hdHJpeChNYXRoLmNvcyhyKSwgTWF0aC5zaW4ociksIC1NYXRoLnNpbihyKSwgTWF0aC5jb3MociksIDAsIDApKVxyXG4gICAgfVxyXG4gICAgLy8gRmxpcCBtYXRyaXggb24geCBvciB5LCBhdCBhIGdpdmVuIG9mZnNldFxyXG4gICwgZmxpcDogZnVuY3Rpb24oYSwgbykge1xyXG4gICAgICByZXR1cm4gYSA9PSAneCcgP1xyXG4gICAgICAgICAgdGhpcy5zY2FsZSgtMSwgMSwgbywgMCkgOlxyXG4gICAgICAgIGEgPT0gJ3knID9cclxuICAgICAgICAgIHRoaXMuc2NhbGUoMSwgLTEsIDAsIG8pIDpcclxuICAgICAgICAgIHRoaXMuc2NhbGUoLTEsIC0xLCBhLCBvICE9IG51bGwgPyBvIDogYSlcclxuICAgIH1cclxuICAgIC8vIFNrZXdcclxuICAsIHNrZXc6IGZ1bmN0aW9uKHgsIHksIGN4LCBjeSkge1xyXG4gICAgICAvLyBzdXBwb3J0IHVuaWZvcm1hbCBza2V3XHJcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEpIHtcclxuICAgICAgICB5ID0geFxyXG4gICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMykge1xyXG4gICAgICAgIGN5ID0gY3hcclxuICAgICAgICBjeCA9IHlcclxuICAgICAgICB5ID0geFxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBjb252ZXJ0IGRlZ3JlZXMgdG8gcmFkaWFuc1xyXG4gICAgICB4ID0gU1ZHLnV0aWxzLnJhZGlhbnMoeClcclxuICAgICAgeSA9IFNWRy51dGlscy5yYWRpYW5zKHkpXHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5hcm91bmQoY3gsIGN5LCBuZXcgU1ZHLk1hdHJpeCgxLCBNYXRoLnRhbih5KSwgTWF0aC50YW4oeCksIDEsIDAsIDApKVxyXG4gICAgfVxyXG4gICAgLy8gU2tld1hcclxuICAsIHNrZXdYOiBmdW5jdGlvbih4LCBjeCwgY3kpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc2tldyh4LCAwLCBjeCwgY3kpXHJcbiAgICB9XHJcbiAgICAvLyBTa2V3WVxyXG4gICwgc2tld1k6IGZ1bmN0aW9uKHksIGN4LCBjeSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5za2V3KDAsIHksIGN4LCBjeSlcclxuICAgIH1cclxuICAgIC8vIFRyYW5zZm9ybSBhcm91bmQgYSBjZW50ZXIgcG9pbnRcclxuICAsIGFyb3VuZDogZnVuY3Rpb24oY3gsIGN5LCBtYXRyaXgpIHtcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgICAgICAubXVsdGlwbHkobmV3IFNWRy5NYXRyaXgoMSwgMCwgMCwgMSwgY3ggfHwgMCwgY3kgfHwgMCkpXHJcbiAgICAgICAgLm11bHRpcGx5KG1hdHJpeClcclxuICAgICAgICAubXVsdGlwbHkobmV3IFNWRy5NYXRyaXgoMSwgMCwgMCwgMSwgLWN4IHx8IDAsIC1jeSB8fCAwKSlcclxuICAgIH1cclxuICAgIC8vIENvbnZlcnQgdG8gbmF0aXZlIFNWR01hdHJpeFxyXG4gICwgbmF0aXZlOiBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gY3JlYXRlIG5ldyBtYXRyaXhcclxuICAgICAgdmFyIG1hdHJpeCA9IFNWRy5wYXJzZXIubmF0aXZlLmNyZWF0ZVNWR01hdHJpeCgpXHJcblxyXG4gICAgICAvLyB1cGRhdGUgd2l0aCBjdXJyZW50IHZhbHVlc1xyXG4gICAgICBmb3IgKHZhciBpID0gYWJjZGVmLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKVxyXG4gICAgICAgIG1hdHJpeFthYmNkZWZbaV1dID0gdGhpc1thYmNkZWZbaV1dXHJcblxyXG4gICAgICByZXR1cm4gbWF0cml4XHJcbiAgICB9XHJcbiAgICAvLyBDb252ZXJ0IG1hdHJpeCB0byBzdHJpbmdcclxuICAsIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuICdtYXRyaXgoJyArIHRoaXMuYSArICcsJyArIHRoaXMuYiArICcsJyArIHRoaXMuYyArICcsJyArIHRoaXMuZCArICcsJyArIHRoaXMuZSArICcsJyArIHRoaXMuZiArICcpJ1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gRGVmaW5lIHBhcmVudFxyXG4sIHBhcmVudDogU1ZHLkVsZW1lbnRcclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIEdldCBjdXJyZW50IG1hdHJpeFxyXG4gICAgY3RtOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuTWF0cml4KHRoaXMubm9kZS5nZXRDVE0oKSlcclxuICAgIH0sXHJcbiAgICAvLyBHZXQgY3VycmVudCBzY3JlZW4gbWF0cml4XHJcbiAgICBzY3JlZW5DVE06IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvKiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD0xMzQ0NTM3XHJcbiAgICAgICAgIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgRkYgZG9lcyBub3QgcmV0dXJuIHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcclxuICAgICAgICAgZm9yIHRoZSBpbm5lciBjb29yZGluYXRlIHN5c3RlbSB3aGVuIGdldFNjcmVlbkNUTSgpIGlzIGNhbGxlZCBvbiBuZXN0ZWQgc3Zncy5cclxuICAgICAgICAgSG93ZXZlciBhbGwgb3RoZXIgQnJvd3NlcnMgZG8gdGhhdCAqL1xyXG4gICAgICBpZih0aGlzIGluc3RhbmNlb2YgU1ZHLk5lc3RlZCkge1xyXG4gICAgICAgIHZhciByZWN0ID0gdGhpcy5yZWN0KDEsMSlcclxuICAgICAgICB2YXIgbSA9IHJlY3Qubm9kZS5nZXRTY3JlZW5DVE0oKVxyXG4gICAgICAgIHJlY3QucmVtb3ZlKClcclxuICAgICAgICByZXR1cm4gbmV3IFNWRy5NYXRyaXgobSlcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbmV3IFNWRy5NYXRyaXgodGhpcy5ub2RlLmdldFNjcmVlbkNUTSgpKVxyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG59KVxyXG5cblNWRy5Qb2ludCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemVcclxuICBjcmVhdGU6IGZ1bmN0aW9uKHgseSkge1xyXG4gICAgdmFyIGksIHNvdXJjZSwgYmFzZSA9IHt4OjAsIHk6MH1cclxuXHJcbiAgICAvLyBlbnN1cmUgc291cmNlIGFzIG9iamVjdFxyXG4gICAgc291cmNlID0gQXJyYXkuaXNBcnJheSh4KSA/XHJcbiAgICAgIHt4OnhbMF0sIHk6eFsxXX0gOlxyXG4gICAgdHlwZW9mIHggPT09ICdvYmplY3QnID9cclxuICAgICAge3g6eC54LCB5OngueX0gOlxyXG4gICAgeCAhPSBudWxsID9cclxuICAgICAge3g6eCwgeTooeSAhPSBudWxsID8geSA6IHgpfSA6IGJhc2UgLy8gSWYgeSBoYXMgbm8gdmFsdWUsIHRoZW4geCBpcyB1c2VkIGhhcyBpdHMgdmFsdWVcclxuXHJcbiAgICAvLyBtZXJnZSBzb3VyY2VcclxuICAgIHRoaXMueCA9IHNvdXJjZS54XHJcbiAgICB0aGlzLnkgPSBzb3VyY2UueVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIENsb25lIHBvaW50XHJcbiAgICBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLlBvaW50KHRoaXMpXHJcbiAgICB9XHJcbiAgICAvLyBNb3JwaCBvbmUgcG9pbnQgaW50byBhbm90aGVyXHJcbiAgLCBtb3JwaDogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICAvLyBzdG9yZSBuZXcgZGVzdGluYXRpb25cclxuICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IG5ldyBTVkcuUG9pbnQoeCwgeSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgbW9ycGhlZCBwb2ludCBhdCBhIGdpdmVuIHBvc2l0aW9uXHJcbiAgLCBhdDogZnVuY3Rpb24ocG9zKSB7XHJcbiAgICAgIC8vIG1ha2Ugc3VyZSBhIGRlc3RpbmF0aW9uIGlzIGRlZmluZWRcclxuICAgICAgaWYgKCF0aGlzLmRlc3RpbmF0aW9uKSByZXR1cm4gdGhpc1xyXG5cclxuICAgICAgLy8gY2FsY3VsYXRlIG1vcnBoZWQgbWF0cml4IGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICAgICAgdmFyIHBvaW50ID0gbmV3IFNWRy5Qb2ludCh7XHJcbiAgICAgICAgeDogdGhpcy54ICsgKHRoaXMuZGVzdGluYXRpb24ueCAtIHRoaXMueCkgKiBwb3NcclxuICAgICAgLCB5OiB0aGlzLnkgKyAodGhpcy5kZXN0aW5hdGlvbi55IC0gdGhpcy55KSAqIHBvc1xyXG4gICAgICB9KVxyXG5cclxuICAgICAgcmV0dXJuIHBvaW50XHJcbiAgICB9XHJcbiAgICAvLyBDb252ZXJ0IHRvIG5hdGl2ZSBTVkdQb2ludFxyXG4gICwgbmF0aXZlOiBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gY3JlYXRlIG5ldyBwb2ludFxyXG4gICAgICB2YXIgcG9pbnQgPSBTVkcucGFyc2VyLm5hdGl2ZS5jcmVhdGVTVkdQb2ludCgpXHJcblxyXG4gICAgICAvLyB1cGRhdGUgd2l0aCBjdXJyZW50IHZhbHVlc1xyXG4gICAgICBwb2ludC54ID0gdGhpcy54XHJcbiAgICAgIHBvaW50LnkgPSB0aGlzLnlcclxuXHJcbiAgICAgIHJldHVybiBwb2ludFxyXG4gICAgfVxyXG4gICAgLy8gdHJhbnNmb3JtIHBvaW50IHdpdGggbWF0cml4XHJcbiAgLCB0cmFuc2Zvcm06IGZ1bmN0aW9uKG1hdHJpeCkge1xyXG4gICAgICByZXR1cm4gbmV3IFNWRy5Qb2ludCh0aGlzLm5hdGl2ZSgpLm1hdHJpeFRyYW5zZm9ybShtYXRyaXgubmF0aXZlKCkpKVxyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG59KVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG5cclxuICAvLyBHZXQgcG9pbnRcclxuICBwb2ludDogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgcmV0dXJuIG5ldyBTVkcuUG9pbnQoeCx5KS50cmFuc2Zvcm0odGhpcy5zY3JlZW5DVE0oKS5pbnZlcnNlKCkpO1xyXG4gIH1cclxuXHJcbn0pXHJcblxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG4gIC8vIFNldCBzdmcgZWxlbWVudCBhdHRyaWJ1dGVcclxuICBhdHRyOiBmdW5jdGlvbihhLCB2LCBuKSB7XHJcbiAgICAvLyBhY3QgYXMgZnVsbCBnZXR0ZXJcclxuICAgIGlmIChhID09IG51bGwpIHtcclxuICAgICAgLy8gZ2V0IGFuIG9iamVjdCBvZiBhdHRyaWJ1dGVzXHJcbiAgICAgIGEgPSB7fVxyXG4gICAgICB2ID0gdGhpcy5ub2RlLmF0dHJpYnV0ZXNcclxuICAgICAgZm9yIChuID0gdi5sZW5ndGggLSAxOyBuID49IDA7IG4tLSlcclxuICAgICAgICBhW3Zbbl0ubm9kZU5hbWVdID0gU1ZHLnJlZ2V4LmlzTnVtYmVyLnRlc3QodltuXS5ub2RlVmFsdWUpID8gcGFyc2VGbG9hdCh2W25dLm5vZGVWYWx1ZSkgOiB2W25dLm5vZGVWYWx1ZVxyXG5cclxuICAgICAgcmV0dXJuIGFcclxuXHJcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhID09ICdvYmplY3QnKSB7XHJcbiAgICAgIC8vIGFwcGx5IGV2ZXJ5IGF0dHJpYnV0ZSBpbmRpdmlkdWFsbHkgaWYgYW4gb2JqZWN0IGlzIHBhc3NlZFxyXG4gICAgICBmb3IgKHYgaW4gYSkgdGhpcy5hdHRyKHYsIGFbdl0pXHJcblxyXG4gICAgfSBlbHNlIGlmICh2ID09PSBudWxsKSB7XHJcbiAgICAgICAgLy8gcmVtb3ZlIHZhbHVlXHJcbiAgICAgICAgdGhpcy5ub2RlLnJlbW92ZUF0dHJpYnV0ZShhKVxyXG5cclxuICAgIH0gZWxzZSBpZiAodiA9PSBudWxsKSB7XHJcbiAgICAgIC8vIGFjdCBhcyBhIGdldHRlciBpZiB0aGUgZmlyc3QgYW5kIG9ubHkgYXJndW1lbnQgaXMgbm90IGFuIG9iamVjdFxyXG4gICAgICB2ID0gdGhpcy5ub2RlLmdldEF0dHJpYnV0ZShhKVxyXG4gICAgICByZXR1cm4gdiA9PSBudWxsID9cclxuICAgICAgICBTVkcuZGVmYXVsdHMuYXR0cnNbYV0gOlxyXG4gICAgICBTVkcucmVnZXguaXNOdW1iZXIudGVzdCh2KSA/XHJcbiAgICAgICAgcGFyc2VGbG9hdCh2KSA6IHZcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBCVUcgRklYOiBzb21lIGJyb3dzZXJzIHdpbGwgcmVuZGVyIGEgc3Ryb2tlIGlmIGEgY29sb3IgaXMgZ2l2ZW4gZXZlbiB0aG91Z2ggc3Ryb2tlIHdpZHRoIGlzIDBcclxuICAgICAgaWYgKGEgPT0gJ3N0cm9rZS13aWR0aCcpXHJcbiAgICAgICAgdGhpcy5hdHRyKCdzdHJva2UnLCBwYXJzZUZsb2F0KHYpID4gMCA/IHRoaXMuX3N0cm9rZSA6IG51bGwpXHJcbiAgICAgIGVsc2UgaWYgKGEgPT0gJ3N0cm9rZScpXHJcbiAgICAgICAgdGhpcy5fc3Ryb2tlID0gdlxyXG5cclxuICAgICAgLy8gY29udmVydCBpbWFnZSBmaWxsIGFuZCBzdHJva2UgdG8gcGF0dGVybnNcclxuICAgICAgaWYgKGEgPT0gJ2ZpbGwnIHx8IGEgPT0gJ3N0cm9rZScpIHtcclxuICAgICAgICBpZiAoU1ZHLnJlZ2V4LmlzSW1hZ2UudGVzdCh2KSlcclxuICAgICAgICAgIHYgPSB0aGlzLmRvYygpLmRlZnMoKS5pbWFnZSh2LCAwLCAwKVxyXG5cclxuICAgICAgICBpZiAodiBpbnN0YW5jZW9mIFNWRy5JbWFnZSlcclxuICAgICAgICAgIHYgPSB0aGlzLmRvYygpLmRlZnMoKS5wYXR0ZXJuKDAsIDAsIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICB0aGlzLmFkZCh2KVxyXG4gICAgICAgICAgfSlcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZW5zdXJlIGNvcnJlY3QgbnVtZXJpYyB2YWx1ZXMgKGFsc28gYWNjZXB0cyBOYU4gYW5kIEluZmluaXR5KVxyXG4gICAgICBpZiAodHlwZW9mIHYgPT09ICdudW1iZXInKVxyXG4gICAgICAgIHYgPSBuZXcgU1ZHLk51bWJlcih2KVxyXG5cclxuICAgICAgLy8gZW5zdXJlIGZ1bGwgaGV4IGNvbG9yXHJcbiAgICAgIGVsc2UgaWYgKFNWRy5Db2xvci5pc0NvbG9yKHYpKVxyXG4gICAgICAgIHYgPSBuZXcgU1ZHLkNvbG9yKHYpXHJcblxyXG4gICAgICAvLyBwYXJzZSBhcnJheSB2YWx1ZXNcclxuICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2KSlcclxuICAgICAgICB2ID0gbmV3IFNWRy5BcnJheSh2KVxyXG5cclxuICAgICAgLy8gaWYgdGhlIHBhc3NlZCBhdHRyaWJ1dGUgaXMgbGVhZGluZy4uLlxyXG4gICAgICBpZiAoYSA9PSAnbGVhZGluZycpIHtcclxuICAgICAgICAvLyAuLi4gY2FsbCB0aGUgbGVhZGluZyBtZXRob2QgaW5zdGVhZFxyXG4gICAgICAgIGlmICh0aGlzLmxlYWRpbmcpXHJcbiAgICAgICAgICB0aGlzLmxlYWRpbmcodilcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBzZXQgZ2l2ZW4gYXR0cmlidXRlIG9uIG5vZGVcclxuICAgICAgICB0eXBlb2YgbiA9PT0gJ3N0cmluZycgP1xyXG4gICAgICAgICAgdGhpcy5ub2RlLnNldEF0dHJpYnV0ZU5TKG4sIGEsIHYudG9TdHJpbmcoKSkgOlxyXG4gICAgICAgICAgdGhpcy5ub2RlLnNldEF0dHJpYnV0ZShhLCB2LnRvU3RyaW5nKCkpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHJlYnVpbGQgaWYgcmVxdWlyZWRcclxuICAgICAgaWYgKHRoaXMucmVidWlsZCAmJiAoYSA9PSAnZm9udC1zaXplJyB8fCBhID09ICd4JykpXHJcbiAgICAgICAgdGhpcy5yZWJ1aWxkKGEsIHYpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbn0pXG5TVkcuZXh0ZW5kKFNWRy5FbGVtZW50LCB7XHJcbiAgLy8gQWRkIHRyYW5zZm9ybWF0aW9uc1xyXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24obywgcmVsYXRpdmUpIHtcclxuICAgIC8vIGdldCB0YXJnZXQgaW4gY2FzZSBvZiB0aGUgZnggbW9kdWxlLCBvdGhlcndpc2UgcmVmZXJlbmNlIHRoaXNcclxuICAgIHZhciB0YXJnZXQgPSB0aGlzXHJcbiAgICAgICwgbWF0cml4LCBiYm94XHJcblxyXG4gICAgLy8gYWN0IGFzIGEgZ2V0dGVyXHJcbiAgICBpZiAodHlwZW9mIG8gIT09ICdvYmplY3QnKSB7XHJcbiAgICAgIC8vIGdldCBjdXJyZW50IG1hdHJpeFxyXG4gICAgICBtYXRyaXggPSBuZXcgU1ZHLk1hdHJpeCh0YXJnZXQpLmV4dHJhY3QoKVxyXG5cclxuICAgICAgcmV0dXJuIHR5cGVvZiBvID09PSAnc3RyaW5nJyA/IG1hdHJpeFtvXSA6IG1hdHJpeFxyXG4gICAgfVxyXG5cclxuICAgIC8vIGdldCBjdXJyZW50IG1hdHJpeFxyXG4gICAgbWF0cml4ID0gbmV3IFNWRy5NYXRyaXgodGFyZ2V0KVxyXG5cclxuICAgIC8vIGVuc3VyZSByZWxhdGl2ZSBmbGFnXHJcbiAgICByZWxhdGl2ZSA9ICEhcmVsYXRpdmUgfHwgISFvLnJlbGF0aXZlXHJcblxyXG4gICAgLy8gYWN0IG9uIG1hdHJpeFxyXG4gICAgaWYgKG8uYSAhPSBudWxsKSB7XHJcbiAgICAgIG1hdHJpeCA9IHJlbGF0aXZlID9cclxuICAgICAgICAvLyByZWxhdGl2ZVxyXG4gICAgICAgIG1hdHJpeC5tdWx0aXBseShuZXcgU1ZHLk1hdHJpeChvKSkgOlxyXG4gICAgICAgIC8vIGFic29sdXRlXHJcbiAgICAgICAgbmV3IFNWRy5NYXRyaXgobylcclxuXHJcbiAgICAvLyBhY3Qgb24gcm90YXRpb25cclxuICAgIH0gZWxzZSBpZiAoby5yb3RhdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgIC8vIGVuc3VyZSBjZW50cmUgcG9pbnRcclxuICAgICAgZW5zdXJlQ2VudHJlKG8sIHRhcmdldClcclxuXHJcbiAgICAgIC8vIGFwcGx5IHRyYW5zZm9ybWF0aW9uXHJcbiAgICAgIG1hdHJpeCA9IHJlbGF0aXZlID9cclxuICAgICAgICAvLyByZWxhdGl2ZVxyXG4gICAgICAgIG1hdHJpeC5yb3RhdGUoby5yb3RhdGlvbiwgby5jeCwgby5jeSkgOlxyXG4gICAgICAgIC8vIGFic29sdXRlXHJcbiAgICAgICAgbWF0cml4LnJvdGF0ZShvLnJvdGF0aW9uIC0gbWF0cml4LmV4dHJhY3QoKS5yb3RhdGlvbiwgby5jeCwgby5jeSlcclxuXHJcbiAgICAvLyBhY3Qgb24gc2NhbGVcclxuICAgIH0gZWxzZSBpZiAoby5zY2FsZSAhPSBudWxsIHx8IG8uc2NhbGVYICE9IG51bGwgfHwgby5zY2FsZVkgIT0gbnVsbCkge1xyXG4gICAgICAvLyBlbnN1cmUgY2VudHJlIHBvaW50XHJcbiAgICAgIGVuc3VyZUNlbnRyZShvLCB0YXJnZXQpXHJcblxyXG4gICAgICAvLyBlbnN1cmUgc2NhbGUgdmFsdWVzIG9uIGJvdGggYXhlc1xyXG4gICAgICBvLnNjYWxlWCA9IG8uc2NhbGUgIT0gbnVsbCA/IG8uc2NhbGUgOiBvLnNjYWxlWCAhPSBudWxsID8gby5zY2FsZVggOiAxXHJcbiAgICAgIG8uc2NhbGVZID0gby5zY2FsZSAhPSBudWxsID8gby5zY2FsZSA6IG8uc2NhbGVZICE9IG51bGwgPyBvLnNjYWxlWSA6IDFcclxuXHJcbiAgICAgIGlmICghcmVsYXRpdmUpIHtcclxuICAgICAgICAvLyBhYnNvbHV0ZTsgbXVsdGlwbHkgaW52ZXJzZWQgdmFsdWVzXHJcbiAgICAgICAgdmFyIGUgPSBtYXRyaXguZXh0cmFjdCgpXHJcbiAgICAgICAgby5zY2FsZVggPSBvLnNjYWxlWCAqIDEgLyBlLnNjYWxlWFxyXG4gICAgICAgIG8uc2NhbGVZID0gby5zY2FsZVkgKiAxIC8gZS5zY2FsZVlcclxuICAgICAgfVxyXG5cclxuICAgICAgbWF0cml4ID0gbWF0cml4LnNjYWxlKG8uc2NhbGVYLCBvLnNjYWxlWSwgby5jeCwgby5jeSlcclxuXHJcbiAgICAvLyBhY3Qgb24gc2tld1xyXG4gICAgfSBlbHNlIGlmIChvLnNrZXcgIT0gbnVsbCB8fCBvLnNrZXdYICE9IG51bGwgfHwgby5za2V3WSAhPSBudWxsKSB7XHJcbiAgICAgIC8vIGVuc3VyZSBjZW50cmUgcG9pbnRcclxuICAgICAgZW5zdXJlQ2VudHJlKG8sIHRhcmdldClcclxuXHJcbiAgICAgIC8vIGVuc3VyZSBza2V3IHZhbHVlcyBvbiBib3RoIGF4ZXNcclxuICAgICAgby5za2V3WCA9IG8uc2tldyAhPSBudWxsID8gby5za2V3IDogby5za2V3WCAhPSBudWxsID8gby5za2V3WCA6IDBcclxuICAgICAgby5za2V3WSA9IG8uc2tldyAhPSBudWxsID8gby5za2V3IDogby5za2V3WSAhPSBudWxsID8gby5za2V3WSA6IDBcclxuXHJcbiAgICAgIGlmICghcmVsYXRpdmUpIHtcclxuICAgICAgICAvLyBhYnNvbHV0ZTsgcmVzZXQgc2tldyB2YWx1ZXNcclxuICAgICAgICB2YXIgZSA9IG1hdHJpeC5leHRyYWN0KClcclxuICAgICAgICBtYXRyaXggPSBtYXRyaXgubXVsdGlwbHkobmV3IFNWRy5NYXRyaXgoKS5za2V3KGUuc2tld1gsIGUuc2tld1ksIG8uY3gsIG8uY3kpLmludmVyc2UoKSlcclxuICAgICAgfVxyXG5cclxuICAgICAgbWF0cml4ID0gbWF0cml4LnNrZXcoby5za2V3WCwgby5za2V3WSwgby5jeCwgby5jeSlcclxuXHJcbiAgICAvLyBhY3Qgb24gZmxpcFxyXG4gICAgfSBlbHNlIGlmIChvLmZsaXApIHtcclxuICAgICAgaWYoby5mbGlwID09ICd4JyB8fCBvLmZsaXAgPT0gJ3knKSB7XHJcbiAgICAgICAgby5vZmZzZXQgPSBvLm9mZnNldCA9PSBudWxsID8gdGFyZ2V0LmJib3goKVsnYycgKyBvLmZsaXBdIDogby5vZmZzZXRcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZihvLm9mZnNldCA9PSBudWxsKSB7XHJcbiAgICAgICAgICBiYm94ID0gdGFyZ2V0LmJib3goKVxyXG4gICAgICAgICAgby5mbGlwID0gYmJveC5jeFxyXG4gICAgICAgICAgby5vZmZzZXQgPSBiYm94LmN5XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG8uZmxpcCA9IG8ub2Zmc2V0XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBtYXRyaXggPSBuZXcgU1ZHLk1hdHJpeCgpLmZsaXAoby5mbGlwLCBvLm9mZnNldClcclxuXHJcbiAgICAvLyBhY3Qgb24gdHJhbnNsYXRlXHJcbiAgICB9IGVsc2UgaWYgKG8ueCAhPSBudWxsIHx8IG8ueSAhPSBudWxsKSB7XHJcbiAgICAgIGlmIChyZWxhdGl2ZSkge1xyXG4gICAgICAgIC8vIHJlbGF0aXZlXHJcbiAgICAgICAgbWF0cml4ID0gbWF0cml4LnRyYW5zbGF0ZShvLngsIG8ueSlcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBhYnNvbHV0ZVxyXG4gICAgICAgIGlmIChvLnggIT0gbnVsbCkgbWF0cml4LmUgPSBvLnhcclxuICAgICAgICBpZiAoby55ICE9IG51bGwpIG1hdHJpeC5mID0gby55XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCd0cmFuc2Zvcm0nLCBtYXRyaXgpXHJcbiAgfVxyXG59KVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuRlgsIHtcclxuICB0cmFuc2Zvcm06IGZ1bmN0aW9uKG8sIHJlbGF0aXZlKSB7XHJcbiAgICAvLyBnZXQgdGFyZ2V0IGluIGNhc2Ugb2YgdGhlIGZ4IG1vZHVsZSwgb3RoZXJ3aXNlIHJlZmVyZW5jZSB0aGlzXHJcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQoKVxyXG4gICAgICAsIG1hdHJpeCwgYmJveFxyXG5cclxuICAgIC8vIGFjdCBhcyBhIGdldHRlclxyXG4gICAgaWYgKHR5cGVvZiBvICE9PSAnb2JqZWN0Jykge1xyXG4gICAgICAvLyBnZXQgY3VycmVudCBtYXRyaXhcclxuICAgICAgbWF0cml4ID0gbmV3IFNWRy5NYXRyaXgodGFyZ2V0KS5leHRyYWN0KClcclxuXHJcbiAgICAgIHJldHVybiB0eXBlb2YgbyA9PT0gJ3N0cmluZycgPyBtYXRyaXhbb10gOiBtYXRyaXhcclxuICAgIH1cclxuXHJcbiAgICAvLyBlbnN1cmUgcmVsYXRpdmUgZmxhZ1xyXG4gICAgcmVsYXRpdmUgPSAhIXJlbGF0aXZlIHx8ICEhby5yZWxhdGl2ZVxyXG5cclxuICAgIC8vIGFjdCBvbiBtYXRyaXhcclxuICAgIGlmIChvLmEgIT0gbnVsbCkge1xyXG4gICAgICBtYXRyaXggPSBuZXcgU1ZHLk1hdHJpeChvKVxyXG5cclxuICAgIC8vIGFjdCBvbiByb3RhdGlvblxyXG4gICAgfSBlbHNlIGlmIChvLnJvdGF0aW9uICE9IG51bGwpIHtcclxuICAgICAgLy8gZW5zdXJlIGNlbnRyZSBwb2ludFxyXG4gICAgICBlbnN1cmVDZW50cmUobywgdGFyZ2V0KVxyXG5cclxuICAgICAgLy8gYXBwbHkgdHJhbnNmb3JtYXRpb25cclxuICAgICAgbWF0cml4ID0gbmV3IFNWRy5Sb3RhdGUoby5yb3RhdGlvbiwgby5jeCwgby5jeSlcclxuXHJcbiAgICAvLyBhY3Qgb24gc2NhbGVcclxuICAgIH0gZWxzZSBpZiAoby5zY2FsZSAhPSBudWxsIHx8IG8uc2NhbGVYICE9IG51bGwgfHwgby5zY2FsZVkgIT0gbnVsbCkge1xyXG4gICAgICAvLyBlbnN1cmUgY2VudHJlIHBvaW50XHJcbiAgICAgIGVuc3VyZUNlbnRyZShvLCB0YXJnZXQpXHJcblxyXG4gICAgICAvLyBlbnN1cmUgc2NhbGUgdmFsdWVzIG9uIGJvdGggYXhlc1xyXG4gICAgICBvLnNjYWxlWCA9IG8uc2NhbGUgIT0gbnVsbCA/IG8uc2NhbGUgOiBvLnNjYWxlWCAhPSBudWxsID8gby5zY2FsZVggOiAxXHJcbiAgICAgIG8uc2NhbGVZID0gby5zY2FsZSAhPSBudWxsID8gby5zY2FsZSA6IG8uc2NhbGVZICE9IG51bGwgPyBvLnNjYWxlWSA6IDFcclxuXHJcbiAgICAgIG1hdHJpeCA9IG5ldyBTVkcuU2NhbGUoby5zY2FsZVgsIG8uc2NhbGVZLCBvLmN4LCBvLmN5KVxyXG5cclxuICAgIC8vIGFjdCBvbiBza2V3XHJcbiAgICB9IGVsc2UgaWYgKG8uc2tld1ggIT0gbnVsbCB8fCBvLnNrZXdZICE9IG51bGwpIHtcclxuICAgICAgLy8gZW5zdXJlIGNlbnRyZSBwb2ludFxyXG4gICAgICBlbnN1cmVDZW50cmUobywgdGFyZ2V0KVxyXG5cclxuICAgICAgLy8gZW5zdXJlIHNrZXcgdmFsdWVzIG9uIGJvdGggYXhlc1xyXG4gICAgICBvLnNrZXdYID0gby5za2V3WCAhPSBudWxsID8gby5za2V3WCA6IDBcclxuICAgICAgby5za2V3WSA9IG8uc2tld1kgIT0gbnVsbCA/IG8uc2tld1kgOiAwXHJcblxyXG4gICAgICBtYXRyaXggPSBuZXcgU1ZHLlNrZXcoby5za2V3WCwgby5za2V3WSwgby5jeCwgby5jeSlcclxuXHJcbiAgICAvLyBhY3Qgb24gZmxpcFxyXG4gICAgfSBlbHNlIGlmIChvLmZsaXApIHtcclxuICAgICAgaWYoby5mbGlwID09ICd4JyB8fCBvLmZsaXAgPT0gJ3knKSB7XHJcbiAgICAgICAgby5vZmZzZXQgPSBvLm9mZnNldCA9PSBudWxsID8gdGFyZ2V0LmJib3goKVsnYycgKyBvLmZsaXBdIDogby5vZmZzZXRcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBpZihvLm9mZnNldCA9PSBudWxsKSB7XHJcbiAgICAgICAgICBiYm94ID0gdGFyZ2V0LmJib3goKVxyXG4gICAgICAgICAgby5mbGlwID0gYmJveC5jeFxyXG4gICAgICAgICAgby5vZmZzZXQgPSBiYm94LmN5XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIG8uZmxpcCA9IG8ub2Zmc2V0XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBtYXRyaXggPSBuZXcgU1ZHLk1hdHJpeCgpLmZsaXAoby5mbGlwLCBvLm9mZnNldClcclxuXHJcbiAgICAvLyBhY3Qgb24gdHJhbnNsYXRlXHJcbiAgICB9IGVsc2UgaWYgKG8ueCAhPSBudWxsIHx8IG8ueSAhPSBudWxsKSB7XHJcbiAgICAgIG1hdHJpeCA9IG5ldyBTVkcuVHJhbnNsYXRlKG8ueCwgby55KVxyXG4gICAgfVxyXG5cclxuICAgIGlmKCFtYXRyaXgpIHJldHVybiB0aGlzXHJcblxyXG4gICAgbWF0cml4LnJlbGF0aXZlID0gcmVsYXRpdmVcclxuXHJcbiAgICB0aGlzLmxhc3QoKS50cmFuc2Zvcm1zLnB1c2gobWF0cml4KVxyXG5cclxuICAgIHJldHVybiB0aGlzLl9jYWxsU3RhcnQoKVxyXG4gIH1cclxufSlcclxuXHJcblNWRy5leHRlbmQoU1ZHLkVsZW1lbnQsIHtcclxuICAvLyBSZXNldCBhbGwgdHJhbnNmb3JtYXRpb25zXHJcbiAgdW50cmFuc2Zvcm06IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cigndHJhbnNmb3JtJywgbnVsbClcclxuICB9LFxyXG4gIC8vIG1lcmdlIHRoZSB3aG9sZSB0cmFuc2Zvcm1hdGlvbiBjaGFpbiBpbnRvIG9uZSBtYXRyaXggYW5kIHJldHVybnMgaXRcclxuICBtYXRyaXhpZnk6IGZ1bmN0aW9uKCkge1xyXG5cclxuICAgIHZhciBtYXRyaXggPSAodGhpcy5hdHRyKCd0cmFuc2Zvcm0nKSB8fCAnJylcclxuICAgICAgLy8gc3BsaXQgdHJhbnNmb3JtYXRpb25zXHJcbiAgICAgIC5zcGxpdChTVkcucmVnZXgudHJhbnNmb3Jtcykuc2xpY2UoMCwtMSkubWFwKGZ1bmN0aW9uKHN0cil7XHJcbiAgICAgICAgLy8gZ2VuZXJhdGUga2V5ID0+IHZhbHVlIHBhaXJzXHJcbiAgICAgICAgdmFyIGt2ID0gc3RyLnRyaW0oKS5zcGxpdCgnKCcpXHJcbiAgICAgICAgcmV0dXJuIFtrdlswXSwga3ZbMV0uc3BsaXQoU1ZHLnJlZ2V4LmRlbGltaXRlcikubWFwKGZ1bmN0aW9uKHN0cil7IHJldHVybiBwYXJzZUZsb2F0KHN0cikgfSldXHJcbiAgICAgIH0pXHJcbiAgICAgIC8vIG1lcmdlIGV2ZXJ5IHRyYW5zZm9ybWF0aW9uIGludG8gb25lIG1hdHJpeFxyXG4gICAgICAucmVkdWNlKGZ1bmN0aW9uKG1hdHJpeCwgdHJhbnNmb3JtKXtcclxuXHJcbiAgICAgICAgaWYodHJhbnNmb3JtWzBdID09ICdtYXRyaXgnKSByZXR1cm4gbWF0cml4Lm11bHRpcGx5KGFycmF5VG9NYXRyaXgodHJhbnNmb3JtWzFdKSlcclxuICAgICAgICByZXR1cm4gbWF0cml4W3RyYW5zZm9ybVswXV0uYXBwbHkobWF0cml4LCB0cmFuc2Zvcm1bMV0pXHJcblxyXG4gICAgICB9LCBuZXcgU1ZHLk1hdHJpeCgpKVxyXG5cclxuICAgIHJldHVybiBtYXRyaXhcclxuICB9LFxyXG4gIC8vIGFkZCBhbiBlbGVtZW50IHRvIGFub3RoZXIgcGFyZW50IHdpdGhvdXQgY2hhbmdpbmcgdGhlIHZpc3VhbCByZXByZXNlbnRhdGlvbiBvbiB0aGUgc2NyZWVuXHJcbiAgdG9QYXJlbnQ6IGZ1bmN0aW9uKHBhcmVudCkge1xyXG4gICAgaWYodGhpcyA9PSBwYXJlbnQpIHJldHVybiB0aGlzXHJcbiAgICB2YXIgY3RtID0gdGhpcy5zY3JlZW5DVE0oKVxyXG4gICAgdmFyIHBDdG0gPSBwYXJlbnQuc2NyZWVuQ1RNKCkuaW52ZXJzZSgpXHJcblxyXG4gICAgdGhpcy5hZGRUbyhwYXJlbnQpLnVudHJhbnNmb3JtKCkudHJhbnNmb3JtKHBDdG0ubXVsdGlwbHkoY3RtKSlcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH0sXHJcbiAgLy8gc2FtZSBhcyBhYm92ZSB3aXRoIHBhcmVudCBlcXVhbHMgcm9vdC1zdmdcclxuICB0b0RvYzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy50b1BhcmVudCh0aGlzLmRvYygpKVxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuVHJhbnNmb3JtYXRpb24gPSBTVkcuaW52ZW50KHtcclxuXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihzb3VyY2UsIGludmVyc2VkKXtcclxuXHJcbiAgICBpZihhcmd1bWVudHMubGVuZ3RoID4gMSAmJiB0eXBlb2YgaW52ZXJzZWQgIT0gJ2Jvb2xlYW4nKXtcclxuICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpXHJcbiAgICB9XHJcblxyXG4gICAgaWYoQXJyYXkuaXNBcnJheShzb3VyY2UpKXtcclxuICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy5hcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpe1xyXG4gICAgICAgIHRoaXNbdGhpcy5hcmd1bWVudHNbaV1dID0gc291cmNlW2ldXHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZih0eXBlb2Ygc291cmNlID09ICdvYmplY3QnKXtcclxuICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy5hcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpe1xyXG4gICAgICAgIHRoaXNbdGhpcy5hcmd1bWVudHNbaV1dID0gc291cmNlW3RoaXMuYXJndW1lbnRzW2ldXVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5pbnZlcnNlZCA9IGZhbHNlXHJcblxyXG4gICAgaWYoaW52ZXJzZWQgPT09IHRydWUpe1xyXG4gICAgICB0aGlzLmludmVyc2VkID0gdHJ1ZVxyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4sIGV4dGVuZDoge1xyXG5cclxuICAgIGFyZ3VtZW50czogW11cclxuICAsIG1ldGhvZDogJydcclxuXHJcbiAgLCBhdDogZnVuY3Rpb24ocG9zKXtcclxuXHJcbiAgICAgIHZhciBwYXJhbXMgPSBbXVxyXG5cclxuICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy5hcmd1bWVudHMubGVuZ3RoOyBpIDwgbGVuOyArK2kpe1xyXG4gICAgICAgIHBhcmFtcy5wdXNoKHRoaXNbdGhpcy5hcmd1bWVudHNbaV1dKVxyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgbSA9IHRoaXMuX3VuZG8gfHwgbmV3IFNWRy5NYXRyaXgoKVxyXG5cclxuICAgICAgbSA9IG5ldyBTVkcuTWF0cml4KCkubW9ycGgoU1ZHLk1hdHJpeC5wcm90b3R5cGVbdGhpcy5tZXRob2RdLmFwcGx5KG0sIHBhcmFtcykpLmF0KHBvcylcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmludmVyc2VkID8gbS5pbnZlcnNlKCkgOiBtXHJcblxyXG4gICAgfVxyXG5cclxuICAsIHVuZG86IGZ1bmN0aW9uKG8pe1xyXG4gICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW47ICsraSl7XHJcbiAgICAgICAgb1t0aGlzLmFyZ3VtZW50c1tpXV0gPSB0eXBlb2YgdGhpc1t0aGlzLmFyZ3VtZW50c1tpXV0gPT0gJ3VuZGVmaW5lZCcgPyAwIDogb1t0aGlzLmFyZ3VtZW50c1tpXV1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gVGhlIG1ldGhvZCBTVkcuTWF0cml4LmV4dHJhY3Qgd2hpY2ggd2FzIHVzZWQgYmVmb3JlIGNhbGxpbmcgdGhpc1xyXG4gICAgICAvLyBtZXRob2QgdG8gb2J0YWluIGEgdmFsdWUgZm9yIHRoZSBwYXJhbWV0ZXIgbyBkb2Vzbid0IHJldHVybiBhIGN4IGFuZFxyXG4gICAgICAvLyBhIGN5IHNvIHdlIHVzZSB0aGUgb25lcyB0aGF0IHdlcmUgcHJvdmlkZWQgdG8gdGhpcyBvYmplY3QgYXQgaXRzIGNyZWF0aW9uXHJcbiAgICAgIG8uY3ggPSB0aGlzLmN4XHJcbiAgICAgIG8uY3kgPSB0aGlzLmN5XHJcblxyXG4gICAgICB0aGlzLl91bmRvID0gbmV3IFNWR1tjYXBpdGFsaXplKHRoaXMubWV0aG9kKV0obywgdHJ1ZSkuYXQoMSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuVHJhbnNsYXRlID0gU1ZHLmludmVudCh7XHJcblxyXG4gIHBhcmVudDogU1ZHLk1hdHJpeFxyXG4sIGluaGVyaXQ6IFNWRy5UcmFuc2Zvcm1hdGlvblxyXG5cclxuLCBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgaW52ZXJzZWQpe1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpXHJcbiAgfVxyXG5cclxuLCBleHRlbmQ6IHtcclxuICAgIGFyZ3VtZW50czogWyd0cmFuc2Zvcm1lZFgnLCAndHJhbnNmb3JtZWRZJ11cclxuICAsIG1ldGhvZDogJ3RyYW5zbGF0ZSdcclxuICB9XHJcblxyXG59KVxyXG5cclxuU1ZHLlJvdGF0ZSA9IFNWRy5pbnZlbnQoe1xyXG5cclxuICBwYXJlbnQ6IFNWRy5NYXRyaXhcclxuLCBpbmhlcml0OiBTVkcuVHJhbnNmb3JtYXRpb25cclxuXHJcbiwgY3JlYXRlOiBmdW5jdGlvbihzb3VyY2UsIGludmVyc2VkKXtcclxuICAgIHRoaXMuY29uc3RydWN0b3IuYXBwbHkodGhpcywgW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKVxyXG4gIH1cclxuXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICBhcmd1bWVudHM6IFsncm90YXRpb24nLCAnY3gnLCAnY3knXVxyXG4gICwgbWV0aG9kOiAncm90YXRlJ1xyXG4gICwgYXQ6IGZ1bmN0aW9uKHBvcyl7XHJcbiAgICAgIHZhciBtID0gbmV3IFNWRy5NYXRyaXgoKS5yb3RhdGUobmV3IFNWRy5OdW1iZXIoKS5tb3JwaCh0aGlzLnJvdGF0aW9uIC0gKHRoaXMuX3VuZG8gPyB0aGlzLl91bmRvLnJvdGF0aW9uIDogMCkpLmF0KHBvcyksIHRoaXMuY3gsIHRoaXMuY3kpXHJcbiAgICAgIHJldHVybiB0aGlzLmludmVyc2VkID8gbS5pbnZlcnNlKCkgOiBtXHJcbiAgICB9XHJcbiAgLCB1bmRvOiBmdW5jdGlvbihvKXtcclxuICAgICAgdGhpcy5fdW5kbyA9IG9cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICB9XHJcblxyXG59KVxyXG5cclxuU1ZHLlNjYWxlID0gU1ZHLmludmVudCh7XHJcblxyXG4gIHBhcmVudDogU1ZHLk1hdHJpeFxyXG4sIGluaGVyaXQ6IFNWRy5UcmFuc2Zvcm1hdGlvblxyXG5cclxuLCBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgaW52ZXJzZWQpe1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpXHJcbiAgfVxyXG5cclxuLCBleHRlbmQ6IHtcclxuICAgIGFyZ3VtZW50czogWydzY2FsZVgnLCAnc2NhbGVZJywgJ2N4JywgJ2N5J11cclxuICAsIG1ldGhvZDogJ3NjYWxlJ1xyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuU2tldyA9IFNWRy5pbnZlbnQoe1xyXG5cclxuICBwYXJlbnQ6IFNWRy5NYXRyaXhcclxuLCBpbmhlcml0OiBTVkcuVHJhbnNmb3JtYXRpb25cclxuXHJcbiwgY3JlYXRlOiBmdW5jdGlvbihzb3VyY2UsIGludmVyc2VkKXtcclxuICAgIHRoaXMuY29uc3RydWN0b3IuYXBwbHkodGhpcywgW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKVxyXG4gIH1cclxuXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICBhcmd1bWVudHM6IFsnc2tld1gnLCAnc2tld1knLCAnY3gnLCAnY3knXVxyXG4gICwgbWV0aG9kOiAnc2tldydcclxuICB9XHJcblxyXG59KVxyXG5cblNWRy5leHRlbmQoU1ZHLkVsZW1lbnQsIHtcclxuICAvLyBEeW5hbWljIHN0eWxlIGdlbmVyYXRvclxyXG4gIHN0eWxlOiBmdW5jdGlvbihzLCB2KSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgIC8vIGdldCBmdWxsIHN0eWxlXHJcbiAgICAgIHJldHVybiB0aGlzLm5vZGUuc3R5bGUuY3NzVGV4dCB8fCAnJ1xyXG5cclxuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcclxuICAgICAgLy8gYXBwbHkgZXZlcnkgc3R5bGUgaW5kaXZpZHVhbGx5IGlmIGFuIG9iamVjdCBpcyBwYXNzZWRcclxuICAgICAgaWYgKHR5cGVvZiBzID09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgZm9yICh2IGluIHMpIHRoaXMuc3R5bGUodiwgc1t2XSlcclxuXHJcbiAgICAgIH0gZWxzZSBpZiAoU1ZHLnJlZ2V4LmlzQ3NzLnRlc3QocykpIHtcclxuICAgICAgICAvLyBwYXJzZSBjc3Mgc3RyaW5nXHJcbiAgICAgICAgcyA9IHMuc3BsaXQoL1xccyo7XFxzKi8pXHJcbiAgICAgICAgICAvLyBmaWx0ZXIgb3V0IHN1ZmZpeCA7IGFuZCBzdHVmZiBsaWtlIDs7XHJcbiAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uKGUpIHsgcmV0dXJuICEhZSB9KVxyXG4gICAgICAgICAgLm1hcChmdW5jdGlvbihlKXsgcmV0dXJuIGUuc3BsaXQoL1xccyo6XFxzKi8pIH0pXHJcblxyXG4gICAgICAgIC8vIGFwcGx5IGV2ZXJ5IGRlZmluaXRpb24gaW5kaXZpZHVhbGx5XHJcbiAgICAgICAgd2hpbGUgKHYgPSBzLnBvcCgpKSB7XHJcbiAgICAgICAgICB0aGlzLnN0eWxlKHZbMF0sIHZbMV0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGFjdCBhcyBhIGdldHRlciBpZiB0aGUgZmlyc3QgYW5kIG9ubHkgYXJndW1lbnQgaXMgbm90IGFuIG9iamVjdFxyXG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUuc3R5bGVbY2FtZWxDYXNlKHMpXVxyXG4gICAgICB9XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5ub2RlLnN0eWxlW2NhbWVsQ2FzZShzKV0gPSB2ID09PSBudWxsIHx8IFNWRy5yZWdleC5pc0JsYW5rLnRlc3QodikgPyAnJyA6IHZcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxufSlcblNWRy5QYXJlbnQgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgIHRoaXMuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBlbGVtZW50KVxyXG4gIH1cclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkVsZW1lbnRcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIFJldHVybnMgYWxsIGNoaWxkIGVsZW1lbnRzXHJcbiAgICBjaGlsZHJlbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBTVkcudXRpbHMubWFwKFNWRy51dGlscy5maWx0ZXJTVkdFbGVtZW50cyh0aGlzLm5vZGUuY2hpbGROb2RlcyksIGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgICByZXR1cm4gU1ZHLmFkb3B0KG5vZGUpXHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgICAvLyBBZGQgZ2l2ZW4gZWxlbWVudCBhdCBhIHBvc2l0aW9uXHJcbiAgLCBhZGQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGkpIHtcclxuICAgICAgaWYgKGkgPT0gbnVsbClcclxuICAgICAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQoZWxlbWVudC5ub2RlKVxyXG4gICAgICBlbHNlIGlmIChlbGVtZW50Lm5vZGUgIT0gdGhpcy5ub2RlLmNoaWxkTm9kZXNbaV0pXHJcbiAgICAgICAgdGhpcy5ub2RlLmluc2VydEJlZm9yZShlbGVtZW50Lm5vZGUsIHRoaXMubm9kZS5jaGlsZE5vZGVzW2ldKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIEJhc2ljYWxseSBkb2VzIHRoZSBzYW1lIGFzIGBhZGQoKWAgYnV0IHJldHVybnMgdGhlIGFkZGVkIGVsZW1lbnQgaW5zdGVhZFxyXG4gICwgcHV0OiBmdW5jdGlvbihlbGVtZW50LCBpKSB7XHJcbiAgICAgIHRoaXMuYWRkKGVsZW1lbnQsIGkpXHJcbiAgICAgIHJldHVybiBlbGVtZW50XHJcbiAgICB9XHJcbiAgICAvLyBDaGVja3MgaWYgdGhlIGdpdmVuIGVsZW1lbnQgaXMgYSBjaGlsZFxyXG4gICwgaGFzOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmluZGV4KGVsZW1lbnQpID49IDBcclxuICAgIH1cclxuICAgIC8vIEdldHMgaW5kZXggb2YgZ2l2ZW4gZWxlbWVudFxyXG4gICwgaW5kZXg6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgcmV0dXJuIFtdLnNsaWNlLmNhbGwodGhpcy5ub2RlLmNoaWxkTm9kZXMpLmluZGV4T2YoZWxlbWVudC5ub2RlKVxyXG4gICAgfVxyXG4gICAgLy8gR2V0IGEgZWxlbWVudCBhdCB0aGUgZ2l2ZW4gaW5kZXhcclxuICAsIGdldDogZnVuY3Rpb24oaSkge1xyXG4gICAgICByZXR1cm4gU1ZHLmFkb3B0KHRoaXMubm9kZS5jaGlsZE5vZGVzW2ldKVxyXG4gICAgfVxyXG4gICAgLy8gR2V0IGZpcnN0IGNoaWxkXHJcbiAgLCBmaXJzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmdldCgwKVxyXG4gICAgfVxyXG4gICAgLy8gR2V0IHRoZSBsYXN0IGNoaWxkXHJcbiAgLCBsYXN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZ2V0KHRoaXMubm9kZS5jaGlsZE5vZGVzLmxlbmd0aCAtIDEpXHJcbiAgICB9XHJcbiAgICAvLyBJdGVyYXRlcyBvdmVyIGFsbCBjaGlsZHJlbiBhbmQgaW52b2tlcyBhIGdpdmVuIGJsb2NrXHJcbiAgLCBlYWNoOiBmdW5jdGlvbihibG9jaywgZGVlcCkge1xyXG4gICAgICB2YXIgaSwgaWxcclxuICAgICAgICAsIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbigpXHJcblxyXG4gICAgICBmb3IgKGkgPSAwLCBpbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcclxuICAgICAgICBpZiAoY2hpbGRyZW5baV0gaW5zdGFuY2VvZiBTVkcuRWxlbWVudClcclxuICAgICAgICAgIGJsb2NrLmFwcGx5KGNoaWxkcmVuW2ldLCBbaSwgY2hpbGRyZW5dKVxyXG5cclxuICAgICAgICBpZiAoZGVlcCAmJiAoY2hpbGRyZW5baV0gaW5zdGFuY2VvZiBTVkcuQ29udGFpbmVyKSlcclxuICAgICAgICAgIGNoaWxkcmVuW2ldLmVhY2goYmxvY2ssIGRlZXApXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBSZW1vdmUgYSBnaXZlbiBjaGlsZFxyXG4gICwgcmVtb3ZlRWxlbWVudDogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICB0aGlzLm5vZGUucmVtb3ZlQ2hpbGQoZWxlbWVudC5ub2RlKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIFJlbW92ZSBhbGwgZWxlbWVudHMgaW4gdGhpcyBjb250YWluZXJcclxuICAsIGNsZWFyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gcmVtb3ZlIGNoaWxkcmVuXHJcbiAgICAgIHdoaWxlKHRoaXMubm9kZS5oYXNDaGlsZE5vZGVzKCkpXHJcbiAgICAgICAgdGhpcy5ub2RlLnJlbW92ZUNoaWxkKHRoaXMubm9kZS5sYXN0Q2hpbGQpXHJcblxyXG4gICAgICAvLyByZW1vdmUgZGVmcyByZWZlcmVuY2VcclxuICAgICAgZGVsZXRlIHRoaXMuX2RlZnNcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgLCAvLyBHZXQgZGVmc1xyXG4gICAgZGVmczogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRvYygpLmRlZnMoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbn0pXHJcblxuU1ZHLmV4dGVuZChTVkcuUGFyZW50LCB7XHJcblxyXG4gIHVuZ3JvdXA6IGZ1bmN0aW9uKHBhcmVudCwgZGVwdGgpIHtcclxuICAgIGlmKGRlcHRoID09PSAwIHx8IHRoaXMgaW5zdGFuY2VvZiBTVkcuRGVmcyB8fCB0aGlzLm5vZGUgPT0gU1ZHLnBhcnNlci5kcmF3KSByZXR1cm4gdGhpc1xyXG5cclxuICAgIHBhcmVudCA9IHBhcmVudCB8fCAodGhpcyBpbnN0YW5jZW9mIFNWRy5Eb2MgPyB0aGlzIDogdGhpcy5wYXJlbnQoU1ZHLlBhcmVudCkpXHJcbiAgICBkZXB0aCA9IGRlcHRoIHx8IEluZmluaXR5XHJcblxyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmKHRoaXMgaW5zdGFuY2VvZiBTVkcuRGVmcykgcmV0dXJuIHRoaXNcclxuICAgICAgaWYodGhpcyBpbnN0YW5jZW9mIFNWRy5QYXJlbnQpIHJldHVybiB0aGlzLnVuZ3JvdXAocGFyZW50LCBkZXB0aC0xKVxyXG4gICAgICByZXR1cm4gdGhpcy50b1BhcmVudChwYXJlbnQpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMubm9kZS5maXJzdENoaWxkIHx8IHRoaXMucmVtb3ZlKClcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH0sXHJcblxyXG4gIGZsYXR0ZW46IGZ1bmN0aW9uKHBhcmVudCwgZGVwdGgpIHtcclxuICAgIHJldHVybiB0aGlzLnVuZ3JvdXAocGFyZW50LCBkZXB0aClcclxuICB9XHJcblxyXG59KVxuU1ZHLkNvbnRhaW5lciA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGVsZW1lbnQpXHJcbiAgfVxyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuUGFyZW50XHJcblxyXG59KVxuXHJcblNWRy5WaWV3Qm94ID0gU1ZHLmludmVudCh7XHJcblxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oc291cmNlKSB7XHJcbiAgICB2YXIgaSwgYmFzZSA9IFswLCAwLCAwLCAwXVxyXG5cclxuICAgIHZhciB4LCB5LCB3aWR0aCwgaGVpZ2h0LCBib3gsIHZpZXcsIHdlLCBoZVxyXG4gICAgICAsIHdtICAgPSAxIC8vIHdpZHRoIG11bHRpcGxpZXJcclxuICAgICAgLCBobSAgID0gMSAvLyBoZWlnaHQgbXVsdGlwbGllclxyXG4gICAgICAsIHJlZyAgPSAvWystXT8oPzpcXGQrKD86XFwuXFxkKik/fFxcLlxcZCspKD86ZVsrLV0/XFxkKyk/L2dpXHJcblxyXG4gICAgaWYoc291cmNlIGluc3RhbmNlb2YgU1ZHLkVsZW1lbnQpe1xyXG5cclxuICAgICAgd2UgPSBzb3VyY2VcclxuICAgICAgaGUgPSBzb3VyY2VcclxuICAgICAgdmlldyA9IChzb3VyY2UuYXR0cigndmlld0JveCcpIHx8ICcnKS5tYXRjaChyZWcpXHJcbiAgICAgIGJveCA9IHNvdXJjZS5iYm94XHJcblxyXG4gICAgICAvLyBnZXQgZGltZW5zaW9ucyBvZiBjdXJyZW50IG5vZGVcclxuICAgICAgd2lkdGggID0gbmV3IFNWRy5OdW1iZXIoc291cmNlLndpZHRoKCkpXHJcbiAgICAgIGhlaWdodCA9IG5ldyBTVkcuTnVtYmVyKHNvdXJjZS5oZWlnaHQoKSlcclxuXHJcbiAgICAgIC8vIGZpbmQgbmVhcmVzdCBub24tcGVyY2VudHVhbCBkaW1lbnNpb25zXHJcbiAgICAgIHdoaWxlICh3aWR0aC51bml0ID09ICclJykge1xyXG4gICAgICAgIHdtICo9IHdpZHRoLnZhbHVlXHJcbiAgICAgICAgd2lkdGggPSBuZXcgU1ZHLk51bWJlcih3ZSBpbnN0YW5jZW9mIFNWRy5Eb2MgPyB3ZS5wYXJlbnQoKS5vZmZzZXRXaWR0aCA6IHdlLnBhcmVudCgpLndpZHRoKCkpXHJcbiAgICAgICAgd2UgPSB3ZS5wYXJlbnQoKVxyXG4gICAgICB9XHJcbiAgICAgIHdoaWxlIChoZWlnaHQudW5pdCA9PSAnJScpIHtcclxuICAgICAgICBobSAqPSBoZWlnaHQudmFsdWVcclxuICAgICAgICBoZWlnaHQgPSBuZXcgU1ZHLk51bWJlcihoZSBpbnN0YW5jZW9mIFNWRy5Eb2MgPyBoZS5wYXJlbnQoKS5vZmZzZXRIZWlnaHQgOiBoZS5wYXJlbnQoKS5oZWlnaHQoKSlcclxuICAgICAgICBoZSA9IGhlLnBhcmVudCgpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGVuc3VyZSBkZWZhdWx0c1xyXG4gICAgICB0aGlzLnggICAgICA9IDBcclxuICAgICAgdGhpcy55ICAgICAgPSAwXHJcbiAgICAgIHRoaXMud2lkdGggID0gd2lkdGggICogd21cclxuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQgKiBobVxyXG4gICAgICB0aGlzLnpvb20gICA9IDFcclxuXHJcbiAgICAgIGlmICh2aWV3KSB7XHJcbiAgICAgICAgLy8gZ2V0IHdpZHRoIGFuZCBoZWlnaHQgZnJvbSB2aWV3Ym94XHJcbiAgICAgICAgeCAgICAgID0gcGFyc2VGbG9hdCh2aWV3WzBdKVxyXG4gICAgICAgIHkgICAgICA9IHBhcnNlRmxvYXQodmlld1sxXSlcclxuICAgICAgICB3aWR0aCAgPSBwYXJzZUZsb2F0KHZpZXdbMl0pXHJcbiAgICAgICAgaGVpZ2h0ID0gcGFyc2VGbG9hdCh2aWV3WzNdKVxyXG5cclxuICAgICAgICAvLyBjYWxjdWxhdGUgem9vbSBhY2NvcmluZyB0byB2aWV3Ym94XHJcbiAgICAgICAgdGhpcy56b29tID0gKCh0aGlzLndpZHRoIC8gdGhpcy5oZWlnaHQpID4gKHdpZHRoIC8gaGVpZ2h0KSkgP1xyXG4gICAgICAgICAgdGhpcy5oZWlnaHQgLyBoZWlnaHQgOlxyXG4gICAgICAgICAgdGhpcy53aWR0aCAgLyB3aWR0aFxyXG5cclxuICAgICAgICAvLyBjYWxjdWxhdGUgcmVhbCBwaXhlbCBkaW1lbnNpb25zIG9uIHBhcmVudCBTVkcuRG9jIGVsZW1lbnRcclxuICAgICAgICB0aGlzLnggICAgICA9IHhcclxuICAgICAgICB0aGlzLnkgICAgICA9IHlcclxuICAgICAgICB0aGlzLndpZHRoICA9IHdpZHRoXHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHRcclxuXHJcbiAgICAgIH1cclxuXHJcbiAgICB9ZWxzZXtcclxuXHJcbiAgICAgIC8vIGVuc3VyZSBzb3VyY2UgYXMgb2JqZWN0XHJcbiAgICAgIHNvdXJjZSA9IHR5cGVvZiBzb3VyY2UgPT09ICdzdHJpbmcnID9cclxuICAgICAgICBzb3VyY2UubWF0Y2gocmVnKS5tYXAoZnVuY3Rpb24oZWwpeyByZXR1cm4gcGFyc2VGbG9hdChlbCkgfSkgOlxyXG4gICAgICBBcnJheS5pc0FycmF5KHNvdXJjZSkgP1xyXG4gICAgICAgIHNvdXJjZSA6XHJcbiAgICAgIHR5cGVvZiBzb3VyY2UgPT0gJ29iamVjdCcgP1xyXG4gICAgICAgIFtzb3VyY2UueCwgc291cmNlLnksIHNvdXJjZS53aWR0aCwgc291cmNlLmhlaWdodF0gOlxyXG4gICAgICBhcmd1bWVudHMubGVuZ3RoID09IDQgP1xyXG4gICAgICAgIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSA6XHJcbiAgICAgICAgYmFzZVxyXG5cclxuICAgICAgdGhpcy54ID0gc291cmNlWzBdXHJcbiAgICAgIHRoaXMueSA9IHNvdXJjZVsxXVxyXG4gICAgICB0aGlzLndpZHRoID0gc291cmNlWzJdXHJcbiAgICAgIHRoaXMuaGVpZ2h0ID0gc291cmNlWzNdXHJcbiAgICB9XHJcblxyXG5cclxuICB9XHJcblxyXG4sIGV4dGVuZDoge1xyXG5cclxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMueCArICcgJyArIHRoaXMueSArICcgJyArIHRoaXMud2lkdGggKyAnICcgKyB0aGlzLmhlaWdodFxyXG4gICAgfVxyXG4gICwgbW9ycGg6IGZ1bmN0aW9uKHgsIHksIHdpZHRoLCBoZWlnaHQpe1xyXG4gICAgICB0aGlzLmRlc3RpbmF0aW9uID0gbmV3IFNWRy5WaWV3Qm94KHgsIHksIHdpZHRoLCBoZWlnaHQpXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICwgYXQ6IGZ1bmN0aW9uKHBvcykge1xyXG5cclxuICAgICAgaWYoIXRoaXMuZGVzdGluYXRpb24pIHJldHVybiB0aGlzXHJcblxyXG4gICAgICByZXR1cm4gbmV3IFNWRy5WaWV3Qm94KFtcclxuICAgICAgICAgIHRoaXMueCArICh0aGlzLmRlc3RpbmF0aW9uLnggLSB0aGlzLngpICogcG9zXHJcbiAgICAgICAgLCB0aGlzLnkgKyAodGhpcy5kZXN0aW5hdGlvbi55IC0gdGhpcy55KSAqIHBvc1xyXG4gICAgICAgICwgdGhpcy53aWR0aCArICh0aGlzLmRlc3RpbmF0aW9uLndpZHRoIC0gdGhpcy53aWR0aCkgKiBwb3NcclxuICAgICAgICAsIHRoaXMuaGVpZ2h0ICsgKHRoaXMuZGVzdGluYXRpb24uaGVpZ2h0IC0gdGhpcy5oZWlnaHQpICogcG9zXHJcbiAgICAgIF0pXHJcblxyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIC8vIERlZmluZSBwYXJlbnRcclxuLCBwYXJlbnQ6IFNWRy5Db250YWluZXJcclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuXHJcbiAgICAvLyBnZXQvc2V0IHZpZXdib3hcclxuICAgIHZpZXdib3g6IGZ1bmN0aW9uKHgsIHksIHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMClcclxuICAgICAgICAvLyBhY3QgYXMgYSBnZXR0ZXIgaWYgdGhlcmUgYXJlIG5vIGFyZ3VtZW50c1xyXG4gICAgICAgIHJldHVybiBuZXcgU1ZHLlZpZXdCb3godGhpcylcclxuXHJcbiAgICAgIC8vIG90aGVyd2lzZSBhY3QgYXMgYSBzZXR0ZXJcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cigndmlld0JveCcsIG5ldyBTVkcuVmlld0JveCh4LCB5LCB3aWR0aCwgaGVpZ2h0KSlcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxufSlcbi8vIEFkZCBldmVudHMgdG8gZWxlbWVudHNcclxuO1sgICdjbGljaydcclxuICAsICdkYmxjbGljaydcclxuICAsICdtb3VzZWRvd24nXHJcbiAgLCAnbW91c2V1cCdcclxuICAsICdtb3VzZW92ZXInXHJcbiAgLCAnbW91c2VvdXQnXHJcbiAgLCAnbW91c2Vtb3ZlJ1xyXG4gIC8vICwgJ21vdXNlZW50ZXInIC0+IG5vdCBzdXBwb3J0ZWQgYnkgSUVcclxuICAvLyAsICdtb3VzZWxlYXZlJyAtPiBub3Qgc3VwcG9ydGVkIGJ5IElFXHJcbiAgLCAndG91Y2hzdGFydCdcclxuICAsICd0b3VjaG1vdmUnXHJcbiAgLCAndG91Y2hsZWF2ZSdcclxuICAsICd0b3VjaGVuZCdcclxuICAsICd0b3VjaGNhbmNlbCcgXS5mb3JFYWNoKGZ1bmN0aW9uKGV2ZW50KSB7XHJcblxyXG4gIC8vIGFkZCBldmVudCB0byBTVkcuRWxlbWVudFxyXG4gIFNWRy5FbGVtZW50LnByb3RvdHlwZVtldmVudF0gPSBmdW5jdGlvbihmKSB7XHJcbiAgICAvLyBiaW5kIGV2ZW50IHRvIGVsZW1lbnQgcmF0aGVyIHRoYW4gZWxlbWVudCBub2RlXHJcbiAgICBTVkcub24odGhpcy5ub2RlLCBldmVudCwgZilcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG59KVxyXG5cclxuLy8gSW5pdGlhbGl6ZSBsaXN0ZW5lcnMgc3RhY2tcclxuU1ZHLmxpc3RlbmVycyA9IFtdXHJcblNWRy5oYW5kbGVyTWFwID0gW11cclxuU1ZHLmxpc3RlbmVySWQgPSAwXHJcblxyXG4vLyBBZGQgZXZlbnQgYmluZGVyIGluIHRoZSBTVkcgbmFtZXNwYWNlXHJcblNWRy5vbiA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50LCBsaXN0ZW5lciwgYmluZGluZywgb3B0aW9ucykge1xyXG4gIC8vIGNyZWF0ZSBsaXN0ZW5lciwgZ2V0IG9iamVjdC1pbmRleFxyXG4gIHZhciBsICAgICA9IGxpc3RlbmVyLmJpbmQoYmluZGluZyB8fCBub2RlLmluc3RhbmNlIHx8IG5vZGUpXHJcbiAgICAsIGluZGV4ID0gKFNWRy5oYW5kbGVyTWFwLmluZGV4T2Yobm9kZSkgKyAxIHx8IFNWRy5oYW5kbGVyTWFwLnB1c2gobm9kZSkpIC0gMVxyXG4gICAgLCBldiAgICA9IGV2ZW50LnNwbGl0KCcuJylbMF1cclxuICAgICwgbnMgICAgPSBldmVudC5zcGxpdCgnLicpWzFdIHx8ICcqJ1xyXG5cclxuXHJcbiAgLy8gZW5zdXJlIHZhbGlkIG9iamVjdFxyXG4gIFNWRy5saXN0ZW5lcnNbaW5kZXhdICAgICAgICAgPSBTVkcubGlzdGVuZXJzW2luZGV4XSAgICAgICAgIHx8IHt9XHJcbiAgU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZdICAgICA9IFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XSAgICAgfHwge31cclxuICBTVkcubGlzdGVuZXJzW2luZGV4XVtldl1bbnNdID0gU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZdW25zXSB8fCB7fVxyXG5cclxuICBpZighbGlzdGVuZXIuX3N2Z2pzTGlzdGVuZXJJZClcclxuICAgIGxpc3RlbmVyLl9zdmdqc0xpc3RlbmVySWQgPSArK1NWRy5saXN0ZW5lcklkXHJcblxyXG4gIC8vIHJlZmVyZW5jZSBsaXN0ZW5lclxyXG4gIFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XVtuc11bbGlzdGVuZXIuX3N2Z2pzTGlzdGVuZXJJZF0gPSBsXHJcblxyXG4gIC8vIGFkZCBsaXN0ZW5lclxyXG4gIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldiwgbCwgb3B0aW9ucyB8fCBmYWxzZSlcclxufVxyXG5cclxuLy8gQWRkIGV2ZW50IHVuYmluZGVyIGluIHRoZSBTVkcgbmFtZXNwYWNlXHJcblNWRy5vZmYgPSBmdW5jdGlvbihub2RlLCBldmVudCwgbGlzdGVuZXIpIHtcclxuICB2YXIgaW5kZXggPSBTVkcuaGFuZGxlck1hcC5pbmRleE9mKG5vZGUpXHJcbiAgICAsIGV2ICAgID0gZXZlbnQgJiYgZXZlbnQuc3BsaXQoJy4nKVswXVxyXG4gICAgLCBucyAgICA9IGV2ZW50ICYmIGV2ZW50LnNwbGl0KCcuJylbMV1cclxuICAgICwgbmFtZXNwYWNlID0gJydcclxuXHJcbiAgaWYoaW5kZXggPT0gLTEpIHJldHVyblxyXG5cclxuICBpZiAobGlzdGVuZXIpIHtcclxuICAgIGlmKHR5cGVvZiBsaXN0ZW5lciA9PSAnZnVuY3Rpb24nKSBsaXN0ZW5lciA9IGxpc3RlbmVyLl9zdmdqc0xpc3RlbmVySWRcclxuICAgIGlmKCFsaXN0ZW5lcikgcmV0dXJuXHJcblxyXG4gICAgLy8gcmVtb3ZlIGxpc3RlbmVyIHJlZmVyZW5jZVxyXG4gICAgaWYgKFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XSAmJiBTVkcubGlzdGVuZXJzW2luZGV4XVtldl1bbnMgfHwgJyonXSkge1xyXG4gICAgICAvLyByZW1vdmUgbGlzdGVuZXJcclxuICAgICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2LCBTVkcubGlzdGVuZXJzW2luZGV4XVtldl1bbnMgfHwgJyonXVtsaXN0ZW5lcl0sIGZhbHNlKVxyXG5cclxuICAgICAgZGVsZXRlIFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XVtucyB8fCAnKiddW2xpc3RlbmVyXVxyXG4gICAgfVxyXG5cclxuICB9IGVsc2UgaWYgKG5zICYmIGV2KSB7XHJcbiAgICAvLyByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgYSBuYW1lc3BhY2VkIGV2ZW50XHJcbiAgICBpZiAoU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZdICYmIFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XVtuc10pIHtcclxuICAgICAgZm9yIChsaXN0ZW5lciBpbiBTVkcubGlzdGVuZXJzW2luZGV4XVtldl1bbnNdKVxyXG4gICAgICAgIFNWRy5vZmYobm9kZSwgW2V2LCBuc10uam9pbignLicpLCBsaXN0ZW5lcilcclxuXHJcbiAgICAgIGRlbGV0ZSBTVkcubGlzdGVuZXJzW2luZGV4XVtldl1bbnNdXHJcbiAgICB9XHJcblxyXG4gIH0gZWxzZSBpZiAobnMpe1xyXG4gICAgLy8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yIGEgc3BlY2lmaWMgbmFtZXNwYWNlXHJcbiAgICBmb3IoZXZlbnQgaW4gU1ZHLmxpc3RlbmVyc1tpbmRleF0pe1xyXG4gICAgICAgIGZvcihuYW1lc3BhY2UgaW4gU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZlbnRdKXtcclxuICAgICAgICAgICAgaWYobnMgPT09IG5hbWVzcGFjZSl7XHJcbiAgICAgICAgICAgICAgICBTVkcub2ZmKG5vZGUsIFtldmVudCwgbnNdLmpvaW4oJy4nKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfSBlbHNlIGlmIChldikge1xyXG4gICAgLy8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yIHRoZSBldmVudFxyXG4gICAgaWYgKFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XSkge1xyXG4gICAgICBmb3IgKG5hbWVzcGFjZSBpbiBTVkcubGlzdGVuZXJzW2luZGV4XVtldl0pXHJcbiAgICAgICAgU1ZHLm9mZihub2RlLCBbZXYsIG5hbWVzcGFjZV0uam9pbignLicpKVxyXG5cclxuICAgICAgZGVsZXRlIFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XVxyXG4gICAgfVxyXG5cclxuICB9IGVsc2Uge1xyXG4gICAgLy8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgb24gYSBnaXZlbiBub2RlXHJcbiAgICBmb3IgKGV2ZW50IGluIFNWRy5saXN0ZW5lcnNbaW5kZXhdKVxyXG4gICAgICBTVkcub2ZmKG5vZGUsIGV2ZW50KVxyXG5cclxuICAgIGRlbGV0ZSBTVkcubGlzdGVuZXJzW2luZGV4XVxyXG4gICAgZGVsZXRlIFNWRy5oYW5kbGVyTWFwW2luZGV4XVxyXG5cclxuICB9XHJcbn1cclxuXHJcbi8vXHJcblNWRy5leHRlbmQoU1ZHLkVsZW1lbnQsIHtcclxuICAvLyBCaW5kIGdpdmVuIGV2ZW50IHRvIGxpc3RlbmVyXHJcbiAgb246IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lciwgYmluZGluZywgb3B0aW9ucykge1xyXG4gICAgU1ZHLm9uKHRoaXMubm9kZSwgZXZlbnQsIGxpc3RlbmVyLCBiaW5kaW5nLCBvcHRpb25zKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIFVuYmluZCBldmVudCBmcm9tIGxpc3RlbmVyXHJcbiwgb2ZmOiBmdW5jdGlvbihldmVudCwgbGlzdGVuZXIpIHtcclxuICAgIFNWRy5vZmYodGhpcy5ub2RlLCBldmVudCwgbGlzdGVuZXIpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gRmlyZSBnaXZlbiBldmVudFxyXG4sIGZpcmU6IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XHJcblxyXG4gICAgLy8gRGlzcGF0Y2ggZXZlbnRcclxuICAgIGlmKGV2ZW50IGluc3RhbmNlb2Ygd2luZG93LkV2ZW50KXtcclxuICAgICAgICB0aGlzLm5vZGUuZGlzcGF0Y2hFdmVudChldmVudClcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMubm9kZS5kaXNwYXRjaEV2ZW50KGV2ZW50ID0gbmV3IHdpbmRvdy5DdXN0b21FdmVudChldmVudCwge2RldGFpbDpkYXRhLCBjYW5jZWxhYmxlOiB0cnVlfSkpXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZXZlbnQgPSBldmVudFxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiwgZXZlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2V2ZW50XHJcbiAgfVxyXG59KVxyXG5cblxyXG5TVkcuRGVmcyA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ2RlZnMnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5Db250YWluZXJcclxuXHJcbn0pXG5TVkcuRyA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ2cnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5Db250YWluZXJcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIE1vdmUgb3ZlciB4LWF4aXNcclxuICAgIHg6IGZ1bmN0aW9uKHgpIHtcclxuICAgICAgcmV0dXJuIHggPT0gbnVsbCA/IHRoaXMudHJhbnNmb3JtKCd4JykgOiB0aGlzLnRyYW5zZm9ybSh7IHg6IHggLSB0aGlzLngoKSB9LCB0cnVlKVxyXG4gICAgfVxyXG4gICAgLy8gTW92ZSBvdmVyIHktYXhpc1xyXG4gICwgeTogZnVuY3Rpb24oeSkge1xyXG4gICAgICByZXR1cm4geSA9PSBudWxsID8gdGhpcy50cmFuc2Zvcm0oJ3knKSA6IHRoaXMudHJhbnNmb3JtKHsgeTogeSAtIHRoaXMueSgpIH0sIHRydWUpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGJ5IGNlbnRlciBvdmVyIHgtYXhpc1xyXG4gICwgY3g6IGZ1bmN0aW9uKHgpIHtcclxuICAgICAgcmV0dXJuIHggPT0gbnVsbCA/IHRoaXMuZ2JveCgpLmN4IDogdGhpcy54KHggLSB0aGlzLmdib3goKS53aWR0aCAvIDIpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGJ5IGNlbnRlciBvdmVyIHktYXhpc1xyXG4gICwgY3k6IGZ1bmN0aW9uKHkpIHtcclxuICAgICAgcmV0dXJuIHkgPT0gbnVsbCA/IHRoaXMuZ2JveCgpLmN5IDogdGhpcy55KHkgLSB0aGlzLmdib3goKS5oZWlnaHQgLyAyKVxyXG4gICAgfVxyXG4gICwgZ2JveDogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICB2YXIgYmJveCAgPSB0aGlzLmJib3goKVxyXG4gICAgICAgICwgdHJhbnMgPSB0aGlzLnRyYW5zZm9ybSgpXHJcblxyXG4gICAgICBiYm94LnggICs9IHRyYW5zLnhcclxuICAgICAgYmJveC54MiArPSB0cmFucy54XHJcbiAgICAgIGJib3guY3ggKz0gdHJhbnMueFxyXG5cclxuICAgICAgYmJveC55ICArPSB0cmFucy55XHJcbiAgICAgIGJib3gueTIgKz0gdHJhbnMueVxyXG4gICAgICBiYm94LmN5ICs9IHRyYW5zLnlcclxuXHJcbiAgICAgIHJldHVybiBiYm94XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIGEgZ3JvdXAgZWxlbWVudFxyXG4gICAgZ3JvdXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5wdXQobmV3IFNWRy5HKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXG4vLyAjIyMgVGhpcyBtb2R1bGUgYWRkcyBiYWNrd2FyZCAvIGZvcndhcmQgZnVuY3Rpb25hbGl0eSB0byBlbGVtZW50cy5cclxuXHJcbi8vXHJcblNWRy5leHRlbmQoU1ZHLkVsZW1lbnQsIHtcclxuICAvLyBHZXQgYWxsIHNpYmxpbmdzLCBpbmNsdWRpbmcgbXlzZWxmXHJcbiAgc2libGluZ3M6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50KCkuY2hpbGRyZW4oKVxyXG4gIH1cclxuICAvLyBHZXQgdGhlIGN1cmVudCBwb3NpdGlvbiBzaWJsaW5nc1xyXG4sIHBvc2l0aW9uOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnBhcmVudCgpLmluZGV4KHRoaXMpXHJcbiAgfVxyXG4gIC8vIEdldCB0aGUgbmV4dCBlbGVtZW50ICh3aWxsIHJldHVybiBudWxsIGlmIHRoZXJlIGlzIG5vbmUpXHJcbiwgbmV4dDogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zaWJsaW5ncygpW3RoaXMucG9zaXRpb24oKSArIDFdXHJcbiAgfVxyXG4gIC8vIEdldCB0aGUgbmV4dCBlbGVtZW50ICh3aWxsIHJldHVybiBudWxsIGlmIHRoZXJlIGlzIG5vbmUpXHJcbiwgcHJldmlvdXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc2libGluZ3MoKVt0aGlzLnBvc2l0aW9uKCkgLSAxXVxyXG4gIH1cclxuICAvLyBTZW5kIGdpdmVuIGVsZW1lbnQgb25lIHN0ZXAgZm9yd2FyZFxyXG4sIGZvcndhcmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGkgPSB0aGlzLnBvc2l0aW9uKCkgKyAxXHJcbiAgICAgICwgcCA9IHRoaXMucGFyZW50KClcclxuXHJcbiAgICAvLyBtb3ZlIG5vZGUgb25lIHN0ZXAgZm9yd2FyZFxyXG4gICAgcC5yZW1vdmVFbGVtZW50KHRoaXMpLmFkZCh0aGlzLCBpKVxyXG5cclxuICAgIC8vIG1ha2Ugc3VyZSBkZWZzIG5vZGUgaXMgYWx3YXlzIGF0IHRoZSB0b3BcclxuICAgIGlmIChwIGluc3RhbmNlb2YgU1ZHLkRvYylcclxuICAgICAgcC5ub2RlLmFwcGVuZENoaWxkKHAuZGVmcygpLm5vZGUpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gU2VuZCBnaXZlbiBlbGVtZW50IG9uZSBzdGVwIGJhY2t3YXJkXHJcbiwgYmFja3dhcmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGkgPSB0aGlzLnBvc2l0aW9uKClcclxuXHJcbiAgICBpZiAoaSA+IDApXHJcbiAgICAgIHRoaXMucGFyZW50KCkucmVtb3ZlRWxlbWVudCh0aGlzKS5hZGQodGhpcywgaSAtIDEpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gU2VuZCBnaXZlbiBlbGVtZW50IGFsbCB0aGUgd2F5IHRvIHRoZSBmcm9udFxyXG4sIGZyb250OiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBwID0gdGhpcy5wYXJlbnQoKVxyXG5cclxuICAgIC8vIE1vdmUgbm9kZSBmb3J3YXJkXHJcbiAgICBwLm5vZGUuYXBwZW5kQ2hpbGQodGhpcy5ub2RlKVxyXG5cclxuICAgIC8vIE1ha2Ugc3VyZSBkZWZzIG5vZGUgaXMgYWx3YXlzIGF0IHRoZSB0b3BcclxuICAgIGlmIChwIGluc3RhbmNlb2YgU1ZHLkRvYylcclxuICAgICAgcC5ub2RlLmFwcGVuZENoaWxkKHAuZGVmcygpLm5vZGUpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gU2VuZCBnaXZlbiBlbGVtZW50IGFsbCB0aGUgd2F5IHRvIHRoZSBiYWNrXHJcbiwgYmFjazogZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAodGhpcy5wb3NpdGlvbigpID4gMClcclxuICAgICAgdGhpcy5wYXJlbnQoKS5yZW1vdmVFbGVtZW50KHRoaXMpLmFkZCh0aGlzLCAwKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIEluc2VydHMgYSBnaXZlbiBlbGVtZW50IGJlZm9yZSB0aGUgdGFyZ2V0ZWQgZWxlbWVudFxyXG4sIGJlZm9yZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgZWxlbWVudC5yZW1vdmUoKVxyXG5cclxuICAgIHZhciBpID0gdGhpcy5wb3NpdGlvbigpXHJcblxyXG4gICAgdGhpcy5wYXJlbnQoKS5hZGQoZWxlbWVudCwgaSlcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBJbnN0ZXJzIGEgZ2l2ZW4gZWxlbWVudCBhZnRlciB0aGUgdGFyZ2V0ZWQgZWxlbWVudFxyXG4sIGFmdGVyOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICBlbGVtZW50LnJlbW92ZSgpXHJcblxyXG4gICAgdmFyIGkgPSB0aGlzLnBvc2l0aW9uKClcclxuXHJcbiAgICB0aGlzLnBhcmVudCgpLmFkZChlbGVtZW50LCBpICsgMSlcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbn0pXG5TVkcuTWFzayA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgU1ZHLmNyZWF0ZSgnbWFzaycpKVxyXG5cclxuICAgIC8vIGtlZXAgcmVmZXJlbmNlcyB0byBtYXNrZWQgZWxlbWVudHNcclxuICAgIHRoaXMudGFyZ2V0cyA9IFtdXHJcbiAgfVxyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuQ29udGFpbmVyXHJcblxyXG4gIC8vIEFkZCBjbGFzcyBtZXRob2RzXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICAvLyBVbm1hc2sgYWxsIG1hc2tlZCBlbGVtZW50cyBhbmQgcmVtb3ZlIGl0c2VsZlxyXG4gICAgcmVtb3ZlOiBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gdW5tYXNrIGFsbCB0YXJnZXRzXHJcbiAgICAgIGZvciAodmFyIGkgPSB0aGlzLnRhcmdldHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXHJcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0c1tpXSlcclxuICAgICAgICAgIHRoaXMudGFyZ2V0c1tpXS51bm1hc2soKVxyXG4gICAgICB0aGlzLnRhcmdldHMgPSBbXVxyXG5cclxuICAgICAgLy8gcmVtb3ZlIG1hc2sgZnJvbSBwYXJlbnRcclxuICAgICAgdGhpcy5wYXJlbnQoKS5yZW1vdmVFbGVtZW50KHRoaXMpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIENyZWF0ZSBtYXNraW5nIGVsZW1lbnRcclxuICAgIG1hc2s6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5kZWZzKCkucHV0KG5ldyBTVkcuTWFzaylcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxyXG5cclxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG4gIC8vIERpc3RyaWJ1dGUgbWFzayB0byBzdmcgZWxlbWVudFxyXG4gIG1hc2tXaXRoOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAvLyB1c2UgZ2l2ZW4gbWFzayBvciBjcmVhdGUgYSBuZXcgb25lXHJcbiAgICB0aGlzLm1hc2tlciA9IGVsZW1lbnQgaW5zdGFuY2VvZiBTVkcuTWFzayA/IGVsZW1lbnQgOiB0aGlzLnBhcmVudCgpLm1hc2soKS5hZGQoZWxlbWVudClcclxuXHJcbiAgICAvLyBzdG9yZSByZXZlcmVuY2Ugb24gc2VsZiBpbiBtYXNrXHJcbiAgICB0aGlzLm1hc2tlci50YXJnZXRzLnB1c2godGhpcylcclxuXHJcbiAgICAvLyBhcHBseSBtYXNrXHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCdtYXNrJywgJ3VybChcIiMnICsgdGhpcy5tYXNrZXIuYXR0cignaWQnKSArICdcIiknKVxyXG4gIH1cclxuICAvLyBVbm1hc2sgZWxlbWVudFxyXG4sIHVubWFzazogZnVuY3Rpb24oKSB7XHJcbiAgICBkZWxldGUgdGhpcy5tYXNrZXJcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ21hc2snLCBudWxsKVxyXG4gIH1cclxuXHJcbn0pXHJcblxuU1ZHLkNsaXBQYXRoID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBTVkcuY3JlYXRlKCdjbGlwUGF0aCcpKVxyXG5cclxuICAgIC8vIGtlZXAgcmVmZXJlbmNlcyB0byBjbGlwcGVkIGVsZW1lbnRzXHJcbiAgICB0aGlzLnRhcmdldHMgPSBbXVxyXG4gIH1cclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkNvbnRhaW5lclxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gVW5jbGlwIGFsbCBjbGlwcGVkIGVsZW1lbnRzIGFuZCByZW1vdmUgaXRzZWxmXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvLyB1bmNsaXAgYWxsIHRhcmdldHNcclxuICAgICAgZm9yICh2YXIgaSA9IHRoaXMudGFyZ2V0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSlcclxuICAgICAgICBpZiAodGhpcy50YXJnZXRzW2ldKVxyXG4gICAgICAgICAgdGhpcy50YXJnZXRzW2ldLnVuY2xpcCgpXHJcbiAgICAgIHRoaXMudGFyZ2V0cyA9IFtdXHJcblxyXG4gICAgICAvLyByZW1vdmUgY2xpcFBhdGggZnJvbSBwYXJlbnRcclxuICAgICAgdGhpcy5wYXJlbnQoKS5yZW1vdmVFbGVtZW50KHRoaXMpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIENyZWF0ZSBjbGlwcGluZyBlbGVtZW50XHJcbiAgICBjbGlwOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGVmcygpLnB1dChuZXcgU1ZHLkNsaXBQYXRoKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXHJcbi8vXHJcblNWRy5leHRlbmQoU1ZHLkVsZW1lbnQsIHtcclxuICAvLyBEaXN0cmlidXRlIGNsaXBQYXRoIHRvIHN2ZyBlbGVtZW50XHJcbiAgY2xpcFdpdGg6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgIC8vIHVzZSBnaXZlbiBjbGlwIG9yIGNyZWF0ZSBhIG5ldyBvbmVcclxuICAgIHRoaXMuY2xpcHBlciA9IGVsZW1lbnQgaW5zdGFuY2VvZiBTVkcuQ2xpcFBhdGggPyBlbGVtZW50IDogdGhpcy5wYXJlbnQoKS5jbGlwKCkuYWRkKGVsZW1lbnQpXHJcblxyXG4gICAgLy8gc3RvcmUgcmV2ZXJlbmNlIG9uIHNlbGYgaW4gbWFza1xyXG4gICAgdGhpcy5jbGlwcGVyLnRhcmdldHMucHVzaCh0aGlzKVxyXG5cclxuICAgIC8vIGFwcGx5IG1hc2tcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ2NsaXAtcGF0aCcsICd1cmwoXCIjJyArIHRoaXMuY2xpcHBlci5hdHRyKCdpZCcpICsgJ1wiKScpXHJcbiAgfVxyXG4gIC8vIFVuY2xpcCBlbGVtZW50XHJcbiwgdW5jbGlwOiBmdW5jdGlvbigpIHtcclxuICAgIGRlbGV0ZSB0aGlzLmNsaXBwZXJcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ2NsaXAtcGF0aCcsIG51bGwpXHJcbiAgfVxyXG5cclxufSlcblNWRy5HcmFkaWVudCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24odHlwZSkge1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIFNWRy5jcmVhdGUodHlwZSArICdHcmFkaWVudCcpKVxyXG5cclxuICAgIC8vIHN0b3JlIHR5cGVcclxuICAgIHRoaXMudHlwZSA9IHR5cGVcclxuICB9XHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5Db250YWluZXJcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIEFkZCBhIGNvbG9yIHN0b3BcclxuICAgIGF0OiBmdW5jdGlvbihvZmZzZXQsIGNvbG9yLCBvcGFjaXR5KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLlN0b3ApLnVwZGF0ZShvZmZzZXQsIGNvbG9yLCBvcGFjaXR5KVxyXG4gICAgfVxyXG4gICAgLy8gVXBkYXRlIGdyYWRpZW50XHJcbiAgLCB1cGRhdGU6IGZ1bmN0aW9uKGJsb2NrKSB7XHJcbiAgICAgIC8vIHJlbW92ZSBhbGwgc3RvcHNcclxuICAgICAgdGhpcy5jbGVhcigpXHJcblxyXG4gICAgICAvLyBpbnZva2UgcGFzc2VkIGJsb2NrXHJcbiAgICAgIGlmICh0eXBlb2YgYmxvY2sgPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICBibG9jay5jYWxsKHRoaXMsIHRoaXMpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gUmV0dXJuIHRoZSBmaWxsIGlkXHJcbiAgLCBmaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuICd1cmwoIycgKyB0aGlzLmlkKCkgKyAnKSdcclxuICAgIH1cclxuICAgIC8vIEFsaWFzIHN0cmluZyBjb252ZXJ0aW9uIHRvIGZpbGxcclxuICAsIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZmlsbCgpXHJcbiAgICB9XHJcbiAgICAvLyBjdXN0b20gYXR0ciB0byBoYW5kbGUgdHJhbnNmb3JtXHJcbiAgLCBhdHRyOiBmdW5jdGlvbihhLCBiLCBjKSB7XHJcbiAgICAgIGlmKGEgPT0gJ3RyYW5zZm9ybScpIGEgPSAnZ3JhZGllbnRUcmFuc2Zvcm0nXHJcbiAgICAgIHJldHVybiBTVkcuQ29udGFpbmVyLnByb3RvdHlwZS5hdHRyLmNhbGwodGhpcywgYSwgYiwgYylcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgZ3JhZGllbnQgZWxlbWVudCBpbiBkZWZzXHJcbiAgICBncmFkaWVudDogZnVuY3Rpb24odHlwZSwgYmxvY2spIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGVmcygpLmdyYWRpZW50KHR5cGUsIGJsb2NrKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXHJcbi8vIEFkZCBhbmltYXRhYmxlIG1ldGhvZHMgdG8gYm90aCBncmFkaWVudCBhbmQgZnggbW9kdWxlXHJcblNWRy5leHRlbmQoU1ZHLkdyYWRpZW50LCBTVkcuRlgsIHtcclxuICAvLyBGcm9tIHBvc2l0aW9uXHJcbiAgZnJvbTogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgcmV0dXJuICh0aGlzLl90YXJnZXQgfHwgdGhpcykudHlwZSA9PSAncmFkaWFsJyA/XHJcbiAgICAgIHRoaXMuYXR0cih7IGZ4OiBuZXcgU1ZHLk51bWJlcih4KSwgZnk6IG5ldyBTVkcuTnVtYmVyKHkpIH0pIDpcclxuICAgICAgdGhpcy5hdHRyKHsgeDE6IG5ldyBTVkcuTnVtYmVyKHgpLCB5MTogbmV3IFNWRy5OdW1iZXIoeSkgfSlcclxuICB9XHJcbiAgLy8gVG8gcG9zaXRpb25cclxuLCB0bzogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgcmV0dXJuICh0aGlzLl90YXJnZXQgfHwgdGhpcykudHlwZSA9PSAncmFkaWFsJyA/XHJcbiAgICAgIHRoaXMuYXR0cih7IGN4OiBuZXcgU1ZHLk51bWJlcih4KSwgY3k6IG5ldyBTVkcuTnVtYmVyKHkpIH0pIDpcclxuICAgICAgdGhpcy5hdHRyKHsgeDI6IG5ldyBTVkcuTnVtYmVyKHgpLCB5MjogbmV3IFNWRy5OdW1iZXIoeSkgfSlcclxuICB9XHJcbn0pXHJcblxyXG4vLyBCYXNlIGdyYWRpZW50IGdlbmVyYXRpb25cclxuU1ZHLmV4dGVuZChTVkcuRGVmcywge1xyXG4gIC8vIGRlZmluZSBncmFkaWVudFxyXG4gIGdyYWRpZW50OiBmdW5jdGlvbih0eXBlLCBibG9jaykge1xyXG4gICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuR3JhZGllbnQodHlwZSkpLnVwZGF0ZShibG9jaylcclxuICB9XHJcblxyXG59KVxyXG5cclxuU1ZHLlN0b3AgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6ICdzdG9wJ1xyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuRWxlbWVudFxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gYWRkIGNvbG9yIHN0b3BzXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKG8pIHtcclxuICAgICAgaWYgKHR5cGVvZiBvID09ICdudW1iZXInIHx8IG8gaW5zdGFuY2VvZiBTVkcuTnVtYmVyKSB7XHJcbiAgICAgICAgbyA9IHtcclxuICAgICAgICAgIG9mZnNldDogIGFyZ3VtZW50c1swXVxyXG4gICAgICAgICwgY29sb3I6ICAgYXJndW1lbnRzWzFdXHJcbiAgICAgICAgLCBvcGFjaXR5OiBhcmd1bWVudHNbMl1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHNldCBhdHRyaWJ1dGVzXHJcbiAgICAgIGlmIChvLm9wYWNpdHkgIT0gbnVsbCkgdGhpcy5hdHRyKCdzdG9wLW9wYWNpdHknLCBvLm9wYWNpdHkpXHJcbiAgICAgIGlmIChvLmNvbG9yICAgIT0gbnVsbCkgdGhpcy5hdHRyKCdzdG9wLWNvbG9yJywgby5jb2xvcilcclxuICAgICAgaWYgKG8ub2Zmc2V0ICAhPSBudWxsKSB0aGlzLmF0dHIoJ29mZnNldCcsIG5ldyBTVkcuTnVtYmVyKG8ub2Zmc2V0KSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgfVxyXG5cclxufSlcclxuXG5TVkcuUGF0dGVybiA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ3BhdHRlcm4nXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5Db250YWluZXJcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIFJldHVybiB0aGUgZmlsbCBpZFxyXG4gICAgZmlsbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAndXJsKCMnICsgdGhpcy5pZCgpICsgJyknXHJcbiAgICB9XHJcbiAgICAvLyBVcGRhdGUgcGF0dGVybiBieSByZWJ1aWxkaW5nXHJcbiAgLCB1cGRhdGU6IGZ1bmN0aW9uKGJsb2NrKSB7XHJcbiAgICAgIC8vIHJlbW92ZSBjb250ZW50XHJcbiAgICAgIHRoaXMuY2xlYXIoKVxyXG5cclxuICAgICAgLy8gaW52b2tlIHBhc3NlZCBibG9ja1xyXG4gICAgICBpZiAodHlwZW9mIGJsb2NrID09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgYmxvY2suY2FsbCh0aGlzLCB0aGlzKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIEFsaWFzIHN0cmluZyBjb252ZXJ0aW9uIHRvIGZpbGxcclxuICAsIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZmlsbCgpXHJcbiAgICB9XHJcbiAgICAvLyBjdXN0b20gYXR0ciB0byBoYW5kbGUgdHJhbnNmb3JtXHJcbiAgLCBhdHRyOiBmdW5jdGlvbihhLCBiLCBjKSB7XHJcbiAgICAgIGlmKGEgPT0gJ3RyYW5zZm9ybScpIGEgPSAncGF0dGVyblRyYW5zZm9ybSdcclxuICAgICAgcmV0dXJuIFNWRy5Db250YWluZXIucHJvdG90eXBlLmF0dHIuY2FsbCh0aGlzLCBhLCBiLCBjKVxyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgcGF0dGVybiBlbGVtZW50IGluIGRlZnNcclxuICAgIHBhdHRlcm46IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIGJsb2NrKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRlZnMoKS5wYXR0ZXJuKHdpZHRoLCBoZWlnaHQsIGJsb2NrKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXHJcblNWRy5leHRlbmQoU1ZHLkRlZnMsIHtcclxuICAvLyBEZWZpbmUgZ3JhZGllbnRcclxuICBwYXR0ZXJuOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBibG9jaykge1xyXG4gICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuUGF0dGVybikudXBkYXRlKGJsb2NrKS5hdHRyKHtcclxuICAgICAgeDogICAgICAgICAgICAwXHJcbiAgICAsIHk6ICAgICAgICAgICAgMFxyXG4gICAgLCB3aWR0aDogICAgICAgIHdpZHRoXHJcbiAgICAsIGhlaWdodDogICAgICAgaGVpZ2h0XHJcbiAgICAsIHBhdHRlcm5Vbml0czogJ3VzZXJTcGFjZU9uVXNlJ1xyXG4gICAgfSlcclxuICB9XHJcblxyXG59KVxuU1ZHLkRvYyA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgaWYgKGVsZW1lbnQpIHtcclxuICAgICAgLy8gZW5zdXJlIHRoZSBwcmVzZW5jZSBvZiBhIGRvbSBlbGVtZW50XHJcbiAgICAgIGVsZW1lbnQgPSB0eXBlb2YgZWxlbWVudCA9PSAnc3RyaW5nJyA/XHJcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWxlbWVudCkgOlxyXG4gICAgICAgIGVsZW1lbnRcclxuXHJcbiAgICAgIC8vIElmIHRoZSB0YXJnZXQgaXMgYW4gc3ZnIGVsZW1lbnQsIHVzZSB0aGF0IGVsZW1lbnQgYXMgdGhlIG1haW4gd3JhcHBlci5cclxuICAgICAgLy8gVGhpcyBhbGxvd3Mgc3ZnLmpzIHRvIHdvcmsgd2l0aCBzdmcgZG9jdW1lbnRzIGFzIHdlbGwuXHJcbiAgICAgIGlmIChlbGVtZW50Lm5vZGVOYW1lID09ICdzdmcnKSB7XHJcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGVsZW1lbnQpXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIFNWRy5jcmVhdGUoJ3N2ZycpKVxyXG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5ub2RlKVxyXG4gICAgICAgIHRoaXMuc2l6ZSgnMTAwJScsICcxMDAlJylcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc2V0IHN2ZyBlbGVtZW50IGF0dHJpYnV0ZXMgYW5kIGVuc3VyZSBkZWZzIG5vZGVcclxuICAgICAgdGhpcy5uYW1lc3BhY2UoKS5kZWZzKClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5Db250YWluZXJcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIEFkZCBuYW1lc3BhY2VzXHJcbiAgICBuYW1lc3BhY2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgICAgIC5hdHRyKHsgeG1sbnM6IFNWRy5ucywgdmVyc2lvbjogJzEuMScgfSlcclxuICAgICAgICAuYXR0cigneG1sbnM6eGxpbmsnLCBTVkcueGxpbmssIFNWRy54bWxucylcclxuICAgICAgICAuYXR0cigneG1sbnM6c3ZnanMnLCBTVkcuc3ZnanMsIFNWRy54bWxucylcclxuICAgIH1cclxuICAgIC8vIENyZWF0ZXMgYW5kIHJldHVybnMgZGVmcyBlbGVtZW50XHJcbiAgLCBkZWZzOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKCF0aGlzLl9kZWZzKSB7XHJcbiAgICAgICAgdmFyIGRlZnNcclxuXHJcbiAgICAgICAgLy8gRmluZCBvciBjcmVhdGUgYSBkZWZzIGVsZW1lbnQgaW4gdGhpcyBpbnN0YW5jZVxyXG4gICAgICAgIGlmIChkZWZzID0gdGhpcy5ub2RlLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdkZWZzJylbMF0pXHJcbiAgICAgICAgICB0aGlzLl9kZWZzID0gU1ZHLmFkb3B0KGRlZnMpXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgdGhpcy5fZGVmcyA9IG5ldyBTVkcuRGVmc1xyXG5cclxuICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIGRlZnMgbm9kZSBpcyBhdCB0aGUgZW5kIG9mIHRoZSBzdGFja1xyXG4gICAgICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZCh0aGlzLl9kZWZzLm5vZGUpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzLl9kZWZzXHJcbiAgICB9XHJcbiAgICAvLyBjdXN0b20gcGFyZW50IG1ldGhvZFxyXG4gICwgcGFyZW50OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubm9kZS5wYXJlbnROb2RlLm5vZGVOYW1lID09ICcjZG9jdW1lbnQnID8gbnVsbCA6IHRoaXMubm9kZS5wYXJlbnROb2RlXHJcbiAgICB9XHJcbiAgICAvLyBGaXggZm9yIHBvc3NpYmxlIHN1Yi1waXhlbCBvZmZzZXQuIFNlZTpcclxuICAgIC8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTYwODgxMlxyXG4gICwgc3BvZjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBwb3MgPSB0aGlzLm5vZGUuZ2V0U2NyZWVuQ1RNKClcclxuXHJcbiAgICAgIGlmIChwb3MpXHJcbiAgICAgICAgdGhpc1xyXG4gICAgICAgICAgLnN0eWxlKCdsZWZ0JywgKC1wb3MuZSAlIDEpICsgJ3B4JylcclxuICAgICAgICAgIC5zdHlsZSgndG9wJywgICgtcG9zLmYgJSAxKSArICdweCcpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgICAgLy8gUmVtb3ZlcyB0aGUgZG9jIGZyb20gdGhlIERPTVxyXG4gICwgcmVtb3ZlOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYodGhpcy5wYXJlbnQoKSkge1xyXG4gICAgICAgIHRoaXMucGFyZW50KCkucmVtb3ZlQ2hpbGQodGhpcy5ub2RlKVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICwgY2xlYXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvLyByZW1vdmUgY2hpbGRyZW5cclxuICAgICAgd2hpbGUodGhpcy5ub2RlLmhhc0NoaWxkTm9kZXMoKSlcclxuICAgICAgICB0aGlzLm5vZGUucmVtb3ZlQ2hpbGQodGhpcy5ub2RlLmxhc3RDaGlsZClcclxuXHJcbiAgICAgIC8vIHJlbW92ZSBkZWZzIHJlZmVyZW5jZVxyXG4gICAgICBkZWxldGUgdGhpcy5fZGVmc1xyXG5cclxuICAgICAgLy8gYWRkIGJhY2sgcGFyc2VyXHJcbiAgICAgIGlmKCFTVkcucGFyc2VyLmRyYXcucGFyZW50Tm9kZSlcclxuICAgICAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQoU1ZHLnBhcnNlci5kcmF3KVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICB9XHJcblxyXG59KVxyXG5cblNWRy5TaGFwZSA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGVsZW1lbnQpXHJcbiAgfVxyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuRWxlbWVudFxyXG5cclxufSlcblxyXG5TVkcuQmFyZSA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemVcclxuICBjcmVhdGU6IGZ1bmN0aW9uKGVsZW1lbnQsIGluaGVyaXQpIHtcclxuICAgIC8vIGNvbnN0cnVjdCBlbGVtZW50XHJcbiAgICB0aGlzLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgU1ZHLmNyZWF0ZShlbGVtZW50KSlcclxuXHJcbiAgICAvLyBpbmhlcml0IGN1c3RvbSBtZXRob2RzXHJcbiAgICBpZiAoaW5oZXJpdClcclxuICAgICAgZm9yICh2YXIgbWV0aG9kIGluIGluaGVyaXQucHJvdG90eXBlKVxyXG4gICAgICAgIGlmICh0eXBlb2YgaW5oZXJpdC5wcm90b3R5cGVbbWV0aG9kXSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgIHRoaXNbbWV0aG9kXSA9IGluaGVyaXQucHJvdG90eXBlW21ldGhvZF1cclxuICB9XHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5FbGVtZW50XHJcblxyXG4gIC8vIEFkZCBtZXRob2RzXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICAvLyBJbnNlcnQgc29tZSBwbGFpbiB0ZXh0XHJcbiAgICB3b3JkczogZnVuY3Rpb24odGV4dCkge1xyXG4gICAgICAvLyByZW1vdmUgY29udGVudHNcclxuICAgICAgd2hpbGUgKHRoaXMubm9kZS5oYXNDaGlsZE5vZGVzKCkpXHJcbiAgICAgICAgdGhpcy5ub2RlLnJlbW92ZUNoaWxkKHRoaXMubm9kZS5sYXN0Q2hpbGQpXHJcblxyXG4gICAgICAvLyBjcmVhdGUgdGV4dCBub2RlXHJcbiAgICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0KSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cclxuXHJcblNWRy5leHRlbmQoU1ZHLlBhcmVudCwge1xyXG4gIC8vIENyZWF0ZSBhbiBlbGVtZW50IHRoYXQgaXMgbm90IGRlc2NyaWJlZCBieSBTVkcuanNcclxuICBlbGVtZW50OiBmdW5jdGlvbihlbGVtZW50LCBpbmhlcml0KSB7XHJcbiAgICByZXR1cm4gdGhpcy5wdXQobmV3IFNWRy5CYXJlKGVsZW1lbnQsIGluaGVyaXQpKVxyXG4gIH1cclxufSlcclxuXG5TVkcuU3ltYm9sID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAnc3ltYm9sJ1xyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuQ29udGFpbmVyXHJcblxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gY3JlYXRlIHN5bWJvbFxyXG4gICAgc3ltYm9sOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuU3ltYm9sKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXG5TVkcuVXNlID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAndXNlJ1xyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuU2hhcGVcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIFVzZSBlbGVtZW50IGFzIGEgcmVmZXJlbmNlXHJcbiAgICBlbGVtZW50OiBmdW5jdGlvbihlbGVtZW50LCBmaWxlKSB7XHJcbiAgICAgIC8vIFNldCBsaW5lZCBlbGVtZW50XHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ2hyZWYnLCAoZmlsZSB8fCAnJykgKyAnIycgKyBlbGVtZW50LCBTVkcueGxpbmspXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIGEgdXNlIGVsZW1lbnRcclxuICAgIHVzZTogZnVuY3Rpb24oZWxlbWVudCwgZmlsZSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5wdXQobmV3IFNWRy5Vc2UpLmVsZW1lbnQoZWxlbWVudCwgZmlsZSlcclxuICAgIH1cclxuICB9XHJcbn0pXG5TVkcuUmVjdCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ3JlY3QnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5TaGFwZVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIGEgcmVjdCBlbGVtZW50XHJcbiAgICByZWN0OiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLlJlY3QoKSkuc2l6ZSh3aWR0aCwgaGVpZ2h0KVxyXG4gICAgfVxyXG4gIH1cclxufSlcblNWRy5DaXJjbGUgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6ICdjaXJjbGUnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5TaGFwZVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIGNpcmNsZSBlbGVtZW50LCBiYXNlZCBvbiBlbGxpcHNlXHJcbiAgICBjaXJjbGU6IGZ1bmN0aW9uKHNpemUpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuQ2lyY2xlKS5yeChuZXcgU1ZHLk51bWJlcihzaXplKS5kaXZpZGUoMikpLm1vdmUoMCwgMClcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5DaXJjbGUsIFNWRy5GWCwge1xyXG4gIC8vIFJhZGl1cyB4IHZhbHVlXHJcbiAgcng6IGZ1bmN0aW9uKHJ4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCdyJywgcngpXHJcbiAgfVxyXG4gIC8vIEFsaWFzIHJhZGl1cyB4IHZhbHVlXHJcbiwgcnk6IGZ1bmN0aW9uKHJ5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5yeChyeSlcclxuICB9XHJcbn0pXHJcblxyXG5TVkcuRWxsaXBzZSA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ2VsbGlwc2UnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5TaGFwZVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIGFuIGVsbGlwc2VcclxuICAgIGVsbGlwc2U6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuRWxsaXBzZSkuc2l6ZSh3aWR0aCwgaGVpZ2h0KS5tb3ZlKDAsIDApXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuRWxsaXBzZSwgU1ZHLlJlY3QsIFNWRy5GWCwge1xyXG4gIC8vIFJhZGl1cyB4IHZhbHVlXHJcbiAgcng6IGZ1bmN0aW9uKHJ4KSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCdyeCcsIHJ4KVxyXG4gIH1cclxuICAvLyBSYWRpdXMgeSB2YWx1ZVxyXG4sIHJ5OiBmdW5jdGlvbihyeSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cigncnknLCByeSlcclxuICB9XHJcbn0pXHJcblxyXG4vLyBBZGQgY29tbW9uIG1ldGhvZFxyXG5TVkcuZXh0ZW5kKFNWRy5DaXJjbGUsIFNWRy5FbGxpcHNlLCB7XHJcbiAgICAvLyBNb3ZlIG92ZXIgeC1heGlzXHJcbiAgICB4OiBmdW5jdGlvbih4KSB7XHJcbiAgICAgIHJldHVybiB4ID09IG51bGwgPyB0aGlzLmN4KCkgLSB0aGlzLnJ4KCkgOiB0aGlzLmN4KHggKyB0aGlzLnJ4KCkpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIG92ZXIgeS1heGlzXHJcbiAgLCB5OiBmdW5jdGlvbih5KSB7XHJcbiAgICAgIHJldHVybiB5ID09IG51bGwgPyB0aGlzLmN5KCkgLSB0aGlzLnJ5KCkgOiB0aGlzLmN5KHkgKyB0aGlzLnJ5KCkpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGJ5IGNlbnRlciBvdmVyIHgtYXhpc1xyXG4gICwgY3g6IGZ1bmN0aW9uKHgpIHtcclxuICAgICAgcmV0dXJuIHggPT0gbnVsbCA/IHRoaXMuYXR0cignY3gnKSA6IHRoaXMuYXR0cignY3gnLCB4KVxyXG4gICAgfVxyXG4gICAgLy8gTW92ZSBieSBjZW50ZXIgb3ZlciB5LWF4aXNcclxuICAsIGN5OiBmdW5jdGlvbih5KSB7XHJcbiAgICAgIHJldHVybiB5ID09IG51bGwgPyB0aGlzLmF0dHIoJ2N5JykgOiB0aGlzLmF0dHIoJ2N5JywgeSlcclxuICAgIH1cclxuICAgIC8vIFNldCB3aWR0aCBvZiBlbGVtZW50XHJcbiAgLCB3aWR0aDogZnVuY3Rpb24od2lkdGgpIHtcclxuICAgICAgcmV0dXJuIHdpZHRoID09IG51bGwgPyB0aGlzLnJ4KCkgKiAyIDogdGhpcy5yeChuZXcgU1ZHLk51bWJlcih3aWR0aCkuZGl2aWRlKDIpKVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IGhlaWdodCBvZiBlbGVtZW50XHJcbiAgLCBoZWlnaHQ6IGZ1bmN0aW9uKGhlaWdodCkge1xyXG4gICAgICByZXR1cm4gaGVpZ2h0ID09IG51bGwgPyB0aGlzLnJ5KCkgKiAyIDogdGhpcy5yeShuZXcgU1ZHLk51bWJlcihoZWlnaHQpLmRpdmlkZSgyKSlcclxuICAgIH1cclxuICAgIC8vIEN1c3RvbSBzaXplIGZ1bmN0aW9uXHJcbiAgLCBzaXplOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICAgIHZhciBwID0gcHJvcG9ydGlvbmFsU2l6ZSh0aGlzLCB3aWR0aCwgaGVpZ2h0KVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgICAgICAucngobmV3IFNWRy5OdW1iZXIocC53aWR0aCkuZGl2aWRlKDIpKVxyXG4gICAgICAgIC5yeShuZXcgU1ZHLk51bWJlcihwLmhlaWdodCkuZGl2aWRlKDIpKVxyXG4gICAgfVxyXG59KVxuU1ZHLkxpbmUgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6ICdsaW5lJ1xyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuU2hhcGVcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIEdldCBhcnJheVxyXG4gICAgYXJyYXk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFNWRy5Qb2ludEFycmF5KFtcclxuICAgICAgICBbIHRoaXMuYXR0cigneDEnKSwgdGhpcy5hdHRyKCd5MScpIF1cclxuICAgICAgLCBbIHRoaXMuYXR0cigneDInKSwgdGhpcy5hdHRyKCd5MicpIF1cclxuICAgICAgXSlcclxuICAgIH1cclxuICAgIC8vIE92ZXJ3cml0ZSBuYXRpdmUgcGxvdCgpIG1ldGhvZFxyXG4gICwgcGxvdDogZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpIHtcclxuICAgICAgaWYgKHgxID09IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXJyYXkoKVxyXG4gICAgICBlbHNlIGlmICh0eXBlb2YgeTEgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIHgxID0geyB4MTogeDEsIHkxOiB5MSwgeDI6IHgyLCB5MjogeTIgfVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgeDEgPSBuZXcgU1ZHLlBvaW50QXJyYXkoeDEpLnRvTGluZSgpXHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKHgxKVxyXG4gICAgfVxyXG4gICAgLy8gTW92ZSBieSBsZWZ0IHRvcCBjb3JuZXJcclxuICAsIG1vdmU6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cih0aGlzLmFycmF5KCkubW92ZSh4LCB5KS50b0xpbmUoKSlcclxuICAgIH1cclxuICAgIC8vIFNldCBlbGVtZW50IHNpemUgdG8gZ2l2ZW4gd2lkdGggYW5kIGhlaWdodFxyXG4gICwgc2l6ZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xyXG4gICAgICB2YXIgcCA9IHByb3BvcnRpb25hbFNpemUodGhpcywgd2lkdGgsIGhlaWdodClcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIodGhpcy5hcnJheSgpLnNpemUocC53aWR0aCwgcC5oZWlnaHQpLnRvTGluZSgpKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIENyZWF0ZSBhIGxpbmUgZWxlbWVudFxyXG4gICAgbGluZTogZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpIHtcclxuICAgICAgLy8gbWFrZSBzdXJlIHBsb3QgaXMgY2FsbGVkIGFzIGEgc2V0dGVyXHJcbiAgICAgIC8vIHgxIGlzIG5vdCBuZWNlc3NhcmlseSBhIG51bWJlciwgaXQgY2FuIGFsc28gYmUgYW4gYXJyYXksIGEgc3RyaW5nIGFuZCBhIFNWRy5Qb2ludEFycmF5XHJcbiAgICAgIHJldHVybiBTVkcuTGluZS5wcm90b3R5cGUucGxvdC5hcHBseShcclxuICAgICAgICB0aGlzLnB1dChuZXcgU1ZHLkxpbmUpXHJcbiAgICAgICwgeDEgIT0gbnVsbCA/IFt4MSwgeTEsIHgyLCB5Ml0gOiBbMCwgMCwgMCwgMF1cclxuICAgICAgKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXG5TVkcuUG9seWxpbmUgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6ICdwb2x5bGluZSdcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLlNoYXBlXHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgYSB3cmFwcGVkIHBvbHlsaW5lIGVsZW1lbnRcclxuICAgIHBvbHlsaW5lOiBmdW5jdGlvbihwKSB7XHJcbiAgICAgIC8vIG1ha2Ugc3VyZSBwbG90IGlzIGNhbGxlZCBhcyBhIHNldHRlclxyXG4gICAgICByZXR1cm4gdGhpcy5wdXQobmV3IFNWRy5Qb2x5bGluZSkucGxvdChwIHx8IG5ldyBTVkcuUG9pbnRBcnJheSlcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxyXG5TVkcuUG9seWdvbiA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ3BvbHlnb24nXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5TaGFwZVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIGEgd3JhcHBlZCBwb2x5Z29uIGVsZW1lbnRcclxuICAgIHBvbHlnb246IGZ1bmN0aW9uKHApIHtcclxuICAgICAgLy8gbWFrZSBzdXJlIHBsb3QgaXMgY2FsbGVkIGFzIGEgc2V0dGVyXHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLlBvbHlnb24pLnBsb3QocCB8fCBuZXcgU1ZHLlBvaW50QXJyYXkpXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cclxuLy8gQWRkIHBvbHlnb24tc3BlY2lmaWMgZnVuY3Rpb25zXHJcblNWRy5leHRlbmQoU1ZHLlBvbHlsaW5lLCBTVkcuUG9seWdvbiwge1xyXG4gIC8vIEdldCBhcnJheVxyXG4gIGFycmF5OiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLl9hcnJheSB8fCAodGhpcy5fYXJyYXkgPSBuZXcgU1ZHLlBvaW50QXJyYXkodGhpcy5hdHRyKCdwb2ludHMnKSkpXHJcbiAgfVxyXG4gIC8vIFBsb3QgbmV3IHBhdGhcclxuLCBwbG90OiBmdW5jdGlvbihwKSB7XHJcbiAgICByZXR1cm4gKHAgPT0gbnVsbCkgP1xyXG4gICAgICB0aGlzLmFycmF5KCkgOlxyXG4gICAgICB0aGlzLmNsZWFyKCkuYXR0cigncG9pbnRzJywgdHlwZW9mIHAgPT0gJ3N0cmluZycgPyBwIDogKHRoaXMuX2FycmF5ID0gbmV3IFNWRy5Qb2ludEFycmF5KHApKSlcclxuICB9XHJcbiAgLy8gQ2xlYXIgYXJyYXkgY2FjaGVcclxuLCBjbGVhcjogZnVuY3Rpb24oKSB7XHJcbiAgICBkZWxldGUgdGhpcy5fYXJyYXlcclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIE1vdmUgYnkgbGVmdCB0b3AgY29ybmVyXHJcbiwgbW92ZTogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cigncG9pbnRzJywgdGhpcy5hcnJheSgpLm1vdmUoeCwgeSkpXHJcbiAgfVxyXG4gIC8vIFNldCBlbGVtZW50IHNpemUgdG8gZ2l2ZW4gd2lkdGggYW5kIGhlaWdodFxyXG4sIHNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgIHZhciBwID0gcHJvcG9ydGlvbmFsU2l6ZSh0aGlzLCB3aWR0aCwgaGVpZ2h0KVxyXG5cclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ3BvaW50cycsIHRoaXMuYXJyYXkoKS5zaXplKHAud2lkdGgsIHAuaGVpZ2h0KSlcclxuICB9XHJcblxyXG59KVxyXG5cbi8vIHVuaWZ5IGFsbCBwb2ludCB0byBwb2ludCBlbGVtZW50c1xyXG5TVkcuZXh0ZW5kKFNWRy5MaW5lLCBTVkcuUG9seWxpbmUsIFNWRy5Qb2x5Z29uLCB7XHJcbiAgLy8gRGVmaW5lIG1vcnBoYWJsZSBhcnJheVxyXG4gIG1vcnBoQXJyYXk6ICBTVkcuUG9pbnRBcnJheVxyXG4gIC8vIE1vdmUgYnkgbGVmdCB0b3AgY29ybmVyIG92ZXIgeC1heGlzXHJcbiwgeDogZnVuY3Rpb24oeCkge1xyXG4gICAgcmV0dXJuIHggPT0gbnVsbCA/IHRoaXMuYmJveCgpLnggOiB0aGlzLm1vdmUoeCwgdGhpcy5iYm94KCkueSlcclxuICB9XHJcbiAgLy8gTW92ZSBieSBsZWZ0IHRvcCBjb3JuZXIgb3ZlciB5LWF4aXNcclxuLCB5OiBmdW5jdGlvbih5KSB7XHJcbiAgICByZXR1cm4geSA9PSBudWxsID8gdGhpcy5iYm94KCkueSA6IHRoaXMubW92ZSh0aGlzLmJib3goKS54LCB5KVxyXG4gIH1cclxuICAvLyBTZXQgd2lkdGggb2YgZWxlbWVudFxyXG4sIHdpZHRoOiBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgdmFyIGIgPSB0aGlzLmJib3goKVxyXG5cclxuICAgIHJldHVybiB3aWR0aCA9PSBudWxsID8gYi53aWR0aCA6IHRoaXMuc2l6ZSh3aWR0aCwgYi5oZWlnaHQpXHJcbiAgfVxyXG4gIC8vIFNldCBoZWlnaHQgb2YgZWxlbWVudFxyXG4sIGhlaWdodDogZnVuY3Rpb24oaGVpZ2h0KSB7XHJcbiAgICB2YXIgYiA9IHRoaXMuYmJveCgpXHJcblxyXG4gICAgcmV0dXJuIGhlaWdodCA9PSBudWxsID8gYi5oZWlnaHQgOiB0aGlzLnNpemUoYi53aWR0aCwgaGVpZ2h0KVxyXG4gIH1cclxufSlcblNWRy5QYXRoID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAncGF0aCdcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLlNoYXBlXHJcblxyXG4gIC8vIEFkZCBjbGFzcyBtZXRob2RzXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICAvLyBEZWZpbmUgbW9ycGhhYmxlIGFycmF5XHJcbiAgICBtb3JwaEFycmF5OiAgU1ZHLlBhdGhBcnJheVxyXG4gICAgLy8gR2V0IGFycmF5XHJcbiAgLCBhcnJheTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9hcnJheSB8fCAodGhpcy5fYXJyYXkgPSBuZXcgU1ZHLlBhdGhBcnJheSh0aGlzLmF0dHIoJ2QnKSkpXHJcbiAgICB9XHJcbiAgICAvLyBQbG90IG5ldyBwYXRoXHJcbiAgLCBwbG90OiBmdW5jdGlvbihkKSB7XHJcbiAgICAgIHJldHVybiAoZCA9PSBudWxsKSA/XHJcbiAgICAgICAgdGhpcy5hcnJheSgpIDpcclxuICAgICAgICB0aGlzLmNsZWFyKCkuYXR0cignZCcsIHR5cGVvZiBkID09ICdzdHJpbmcnID8gZCA6ICh0aGlzLl9hcnJheSA9IG5ldyBTVkcuUGF0aEFycmF5KGQpKSlcclxuICAgIH1cclxuICAgIC8vIENsZWFyIGFycmF5IGNhY2hlXHJcbiAgLCBjbGVhcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGRlbGV0ZSB0aGlzLl9hcnJheVxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gTW92ZSBieSBsZWZ0IHRvcCBjb3JuZXJcclxuICAsIG1vdmU6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cignZCcsIHRoaXMuYXJyYXkoKS5tb3ZlKHgsIHkpKVxyXG4gICAgfVxyXG4gICAgLy8gTW92ZSBieSBsZWZ0IHRvcCBjb3JuZXIgb3ZlciB4LWF4aXNcclxuICAsIHg6IGZ1bmN0aW9uKHgpIHtcclxuICAgICAgcmV0dXJuIHggPT0gbnVsbCA/IHRoaXMuYmJveCgpLnggOiB0aGlzLm1vdmUoeCwgdGhpcy5iYm94KCkueSlcclxuICAgIH1cclxuICAgIC8vIE1vdmUgYnkgbGVmdCB0b3AgY29ybmVyIG92ZXIgeS1heGlzXHJcbiAgLCB5OiBmdW5jdGlvbih5KSB7XHJcbiAgICAgIHJldHVybiB5ID09IG51bGwgPyB0aGlzLmJib3goKS55IDogdGhpcy5tb3ZlKHRoaXMuYmJveCgpLngsIHkpXHJcbiAgICB9XHJcbiAgICAvLyBTZXQgZWxlbWVudCBzaXplIHRvIGdpdmVuIHdpZHRoIGFuZCBoZWlnaHRcclxuICAsIHNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgdmFyIHAgPSBwcm9wb3J0aW9uYWxTaXplKHRoaXMsIHdpZHRoLCBoZWlnaHQpXHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdkJywgdGhpcy5hcnJheSgpLnNpemUocC53aWR0aCwgcC5oZWlnaHQpKVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IHdpZHRoIG9mIGVsZW1lbnRcclxuICAsIHdpZHRoOiBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgICByZXR1cm4gd2lkdGggPT0gbnVsbCA/IHRoaXMuYmJveCgpLndpZHRoIDogdGhpcy5zaXplKHdpZHRoLCB0aGlzLmJib3goKS5oZWlnaHQpXHJcbiAgICB9XHJcbiAgICAvLyBTZXQgaGVpZ2h0IG9mIGVsZW1lbnRcclxuICAsIGhlaWdodDogZnVuY3Rpb24oaGVpZ2h0KSB7XHJcbiAgICAgIHJldHVybiBoZWlnaHQgPT0gbnVsbCA/IHRoaXMuYmJveCgpLmhlaWdodCA6IHRoaXMuc2l6ZSh0aGlzLmJib3goKS53aWR0aCwgaGVpZ2h0KVxyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgYSB3cmFwcGVkIHBhdGggZWxlbWVudFxyXG4gICAgcGF0aDogZnVuY3Rpb24oZCkge1xyXG4gICAgICAvLyBtYWtlIHN1cmUgcGxvdCBpcyBjYWxsZWQgYXMgYSBzZXR0ZXJcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuUGF0aCkucGxvdChkIHx8IG5ldyBTVkcuUGF0aEFycmF5KVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXG5TVkcuSW1hZ2UgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6ICdpbWFnZSdcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLlNoYXBlXHJcblxyXG4gIC8vIEFkZCBjbGFzcyBtZXRob2RzXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICAvLyAocmUpbG9hZCBpbWFnZVxyXG4gICAgbG9hZDogZnVuY3Rpb24odXJsKSB7XHJcbiAgICAgIGlmICghdXJsKSByZXR1cm4gdGhpc1xyXG5cclxuICAgICAgdmFyIHNlbGYgPSB0aGlzXHJcbiAgICAgICAgLCBpbWcgID0gbmV3IHdpbmRvdy5JbWFnZSgpXHJcblxyXG4gICAgICAvLyBwcmVsb2FkIGltYWdlXHJcbiAgICAgIFNWRy5vbihpbWcsICdsb2FkJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIHAgPSBzZWxmLnBhcmVudChTVkcuUGF0dGVybilcclxuXHJcbiAgICAgICAgaWYocCA9PT0gbnVsbCkgcmV0dXJuXHJcblxyXG4gICAgICAgIC8vIGVuc3VyZSBpbWFnZSBzaXplXHJcbiAgICAgICAgaWYgKHNlbGYud2lkdGgoKSA9PSAwICYmIHNlbGYuaGVpZ2h0KCkgPT0gMClcclxuICAgICAgICAgIHNlbGYuc2l6ZShpbWcud2lkdGgsIGltZy5oZWlnaHQpXHJcblxyXG4gICAgICAgIC8vIGVuc3VyZSBwYXR0ZXJuIHNpemUgaWYgbm90IHNldFxyXG4gICAgICAgIGlmIChwICYmIHAud2lkdGgoKSA9PSAwICYmIHAuaGVpZ2h0KCkgPT0gMClcclxuICAgICAgICAgIHAuc2l6ZShzZWxmLndpZHRoKCksIHNlbGYuaGVpZ2h0KCkpXHJcblxyXG4gICAgICAgIC8vIGNhbGxiYWNrXHJcbiAgICAgICAgaWYgKHR5cGVvZiBzZWxmLl9sb2FkZWQgPT09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICBzZWxmLl9sb2FkZWQuY2FsbChzZWxmLCB7XHJcbiAgICAgICAgICAgIHdpZHRoOiAgaW1nLndpZHRoXHJcbiAgICAgICAgICAsIGhlaWdodDogaW1nLmhlaWdodFxyXG4gICAgICAgICAgLCByYXRpbzogIGltZy53aWR0aCAvIGltZy5oZWlnaHRcclxuICAgICAgICAgICwgdXJsOiAgICB1cmxcclxuICAgICAgICAgIH0pXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICBTVkcub24oaW1nLCAnZXJyb3InLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBpZiAodHlwZW9mIHNlbGYuX2Vycm9yID09PSAnZnVuY3Rpb24nKXtcclxuICAgICAgICAgICAgc2VsZi5fZXJyb3IuY2FsbChzZWxmLCBlKVxyXG4gICAgICAgIH1cclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ2hyZWYnLCAoaW1nLnNyYyA9IHRoaXMuc3JjID0gdXJsKSwgU1ZHLnhsaW5rKVxyXG4gICAgfVxyXG4gICAgLy8gQWRkIGxvYWRlZCBjYWxsYmFja1xyXG4gICwgbG9hZGVkOiBmdW5jdGlvbihsb2FkZWQpIHtcclxuICAgICAgdGhpcy5fbG9hZGVkID0gbG9hZGVkXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICwgZXJyb3I6IGZ1bmN0aW9uKGVycm9yKSB7XHJcbiAgICAgIHRoaXMuX2Vycm9yID0gZXJyb3JcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBjcmVhdGUgaW1hZ2UgZWxlbWVudCwgbG9hZCBpbWFnZSBhbmQgc2V0IGl0cyBzaXplXHJcbiAgICBpbWFnZTogZnVuY3Rpb24oc291cmNlLCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLkltYWdlKS5sb2FkKHNvdXJjZSkuc2l6ZSh3aWR0aCB8fCAwLCBoZWlnaHQgfHwgd2lkdGggfHwgMClcclxuICAgIH1cclxuICB9XHJcblxyXG59KVxuU1ZHLlRleHQgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIFNWRy5jcmVhdGUoJ3RleHQnKSlcclxuXHJcbiAgICB0aGlzLmRvbS5sZWFkaW5nID0gbmV3IFNWRy5OdW1iZXIoMS4zKSAgICAvLyBzdG9yZSBsZWFkaW5nIHZhbHVlIGZvciByZWJ1aWxkaW5nXHJcbiAgICB0aGlzLl9yZWJ1aWxkID0gdHJ1ZSAgICAgICAgICAgICAgICAgICAgICAvLyBlbmFibGUgYXV0b21hdGljIHVwZGF0aW5nIG9mIGR5IHZhbHVlc1xyXG4gICAgdGhpcy5fYnVpbGQgICA9IGZhbHNlICAgICAgICAgICAgICAgICAgICAgLy8gZGlzYWJsZSBidWlsZCBtb2RlIGZvciBhZGRpbmcgbXVsdGlwbGUgbGluZXNcclxuXHJcbiAgICAvLyBzZXQgZGVmYXVsdCBmb250XHJcbiAgICB0aGlzLmF0dHIoJ2ZvbnQtZmFtaWx5JywgU1ZHLmRlZmF1bHRzLmF0dHJzWydmb250LWZhbWlseSddKVxyXG4gIH1cclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLlNoYXBlXHJcblxyXG4gIC8vIEFkZCBjbGFzcyBtZXRob2RzXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICAvLyBNb3ZlIG92ZXIgeC1heGlzXHJcbiAgICB4OiBmdW5jdGlvbih4KSB7XHJcbiAgICAgIC8vIGFjdCBhcyBnZXR0ZXJcclxuICAgICAgaWYgKHggPT0gbnVsbClcclxuICAgICAgICByZXR1cm4gdGhpcy5hdHRyKCd4JylcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ3gnLCB4KVxyXG4gICAgfVxyXG4gICAgLy8gTW92ZSBvdmVyIHktYXhpc1xyXG4gICwgeTogZnVuY3Rpb24oeSkge1xyXG4gICAgICB2YXIgb3kgPSB0aGlzLmF0dHIoJ3knKVxyXG4gICAgICAgICwgbyAgPSB0eXBlb2Ygb3kgPT09ICdudW1iZXInID8gb3kgLSB0aGlzLmJib3goKS55IDogMFxyXG5cclxuICAgICAgLy8gYWN0IGFzIGdldHRlclxyXG4gICAgICBpZiAoeSA9PSBudWxsKVxyXG4gICAgICAgIHJldHVybiB0eXBlb2Ygb3kgPT09ICdudW1iZXInID8gb3kgLSBvIDogb3lcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ3knLCB0eXBlb2YgeSA9PT0gJ251bWJlcicgPyB5ICsgbyA6IHkpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGNlbnRlciBvdmVyIHgtYXhpc1xyXG4gICwgY3g6IGZ1bmN0aW9uKHgpIHtcclxuICAgICAgcmV0dXJuIHggPT0gbnVsbCA/IHRoaXMuYmJveCgpLmN4IDogdGhpcy54KHggLSB0aGlzLmJib3goKS53aWR0aCAvIDIpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGNlbnRlciBvdmVyIHktYXhpc1xyXG4gICwgY3k6IGZ1bmN0aW9uKHkpIHtcclxuICAgICAgcmV0dXJuIHkgPT0gbnVsbCA/IHRoaXMuYmJveCgpLmN5IDogdGhpcy55KHkgLSB0aGlzLmJib3goKS5oZWlnaHQgLyAyKVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IHRoZSB0ZXh0IGNvbnRlbnRcclxuICAsIHRleHQ6IGZ1bmN0aW9uKHRleHQpIHtcclxuICAgICAgLy8gYWN0IGFzIGdldHRlclxyXG4gICAgICBpZiAodHlwZW9mIHRleHQgPT09ICd1bmRlZmluZWQnKXtcclxuICAgICAgICB2YXIgdGV4dCA9ICcnXHJcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdGhpcy5ub2RlLmNoaWxkTm9kZXNcclxuICAgICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47ICsraSl7XHJcblxyXG4gICAgICAgICAgLy8gYWRkIG5ld2xpbmUgaWYgaXRzIG5vdCB0aGUgZmlyc3QgY2hpbGQgYW5kIG5ld0xpbmVkIGlzIHNldCB0byB0cnVlXHJcbiAgICAgICAgICBpZihpICE9IDAgJiYgY2hpbGRyZW5baV0ubm9kZVR5cGUgIT0gMyAmJiBTVkcuYWRvcHQoY2hpbGRyZW5baV0pLmRvbS5uZXdMaW5lZCA9PSB0cnVlKXtcclxuICAgICAgICAgICAgdGV4dCArPSAnXFxuJ1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIGFkZCBjb250ZW50IG9mIHRoaXMgbm9kZVxyXG4gICAgICAgICAgdGV4dCArPSBjaGlsZHJlbltpXS50ZXh0Q29udGVudFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRleHRcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcmVtb3ZlIGV4aXN0aW5nIGNvbnRlbnRcclxuICAgICAgdGhpcy5jbGVhcigpLmJ1aWxkKHRydWUpXHJcblxyXG4gICAgICBpZiAodHlwZW9mIHRleHQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAvLyBjYWxsIGJsb2NrXHJcbiAgICAgICAgdGV4dC5jYWxsKHRoaXMsIHRoaXMpXHJcblxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIHN0b3JlIHRleHQgYW5kIG1ha2Ugc3VyZSB0ZXh0IGlzIG5vdCBibGFua1xyXG4gICAgICAgIHRleHQgPSB0ZXh0LnNwbGl0KCdcXG4nKVxyXG5cclxuICAgICAgICAvLyBidWlsZCBuZXcgbGluZXNcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWwgPSB0ZXh0Lmxlbmd0aDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgICB0aGlzLnRzcGFuKHRleHRbaV0pLm5ld0xpbmUoKVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBkaXNhYmxlIGJ1aWxkIG1vZGUgYW5kIHJlYnVpbGQgbGluZXNcclxuICAgICAgcmV0dXJuIHRoaXMuYnVpbGQoZmFsc2UpLnJlYnVpbGQoKVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IGZvbnQgc2l6ZVxyXG4gICwgc2l6ZTogZnVuY3Rpb24oc2l6ZSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdmb250LXNpemUnLCBzaXplKS5yZWJ1aWxkKClcclxuICAgIH1cclxuICAgIC8vIFNldCAvIGdldCBsZWFkaW5nXHJcbiAgLCBsZWFkaW5nOiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAvLyBhY3QgYXMgZ2V0dGVyXHJcbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKVxyXG4gICAgICAgIHJldHVybiB0aGlzLmRvbS5sZWFkaW5nXHJcblxyXG4gICAgICAvLyBhY3QgYXMgc2V0dGVyXHJcbiAgICAgIHRoaXMuZG9tLmxlYWRpbmcgPSBuZXcgU1ZHLk51bWJlcih2YWx1ZSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLnJlYnVpbGQoKVxyXG4gICAgfVxyXG4gICAgLy8gR2V0IGFsbCB0aGUgZmlyc3QgbGV2ZWwgbGluZXNcclxuICAsIGxpbmVzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIG5vZGUgPSAodGhpcy50ZXh0UGF0aCAmJiB0aGlzLnRleHRQYXRoKCkgfHwgdGhpcykubm9kZVxyXG5cclxuICAgICAgLy8gZmlsdGVyIHRzcGFucyBhbmQgbWFwIHRoZW0gdG8gU1ZHLmpzIGluc3RhbmNlc1xyXG4gICAgICB2YXIgbGluZXMgPSBTVkcudXRpbHMubWFwKFNWRy51dGlscy5maWx0ZXJTVkdFbGVtZW50cyhub2RlLmNoaWxkTm9kZXMpLCBmdW5jdGlvbihlbCl7XHJcbiAgICAgICAgcmV0dXJuIFNWRy5hZG9wdChlbClcclxuICAgICAgfSlcclxuXHJcbiAgICAgIC8vIHJldHVybiBhbiBpbnN0YW5jZSBvZiBTVkcuc2V0XHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLlNldChsaW5lcylcclxuICAgIH1cclxuICAgIC8vIFJlYnVpbGQgYXBwZWFyYW5jZSB0eXBlXHJcbiAgLCByZWJ1aWxkOiBmdW5jdGlvbihyZWJ1aWxkKSB7XHJcbiAgICAgIC8vIHN0b3JlIG5ldyByZWJ1aWxkIGZsYWcgaWYgZ2l2ZW5cclxuICAgICAgaWYgKHR5cGVvZiByZWJ1aWxkID09ICdib29sZWFuJylcclxuICAgICAgICB0aGlzLl9yZWJ1aWxkID0gcmVidWlsZFxyXG5cclxuICAgICAgLy8gZGVmaW5lIHBvc2l0aW9uIG9mIGFsbCBsaW5lc1xyXG4gICAgICBpZiAodGhpcy5fcmVidWlsZCkge1xyXG4gICAgICAgIHZhciBzZWxmID0gdGhpc1xyXG4gICAgICAgICAgLCBibGFua0xpbmVPZmZzZXQgPSAwXHJcbiAgICAgICAgICAsIGR5ID0gdGhpcy5kb20ubGVhZGluZyAqIG5ldyBTVkcuTnVtYmVyKHRoaXMuYXR0cignZm9udC1zaXplJykpXHJcblxyXG4gICAgICAgIHRoaXMubGluZXMoKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKHRoaXMuZG9tLm5ld0xpbmVkKSB7XHJcbiAgICAgICAgICAgIGlmICghc2VsZi50ZXh0UGF0aCgpKVxyXG4gICAgICAgICAgICAgIHRoaXMuYXR0cigneCcsIHNlbGYuYXR0cigneCcpKVxyXG4gICAgICAgICAgICBpZih0aGlzLnRleHQoKSA9PSAnXFxuJykge1xyXG4gICAgICAgICAgICAgIGJsYW5rTGluZU9mZnNldCArPSBkeVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICB0aGlzLmF0dHIoJ2R5JywgZHkgKyBibGFua0xpbmVPZmZzZXQpXHJcbiAgICAgICAgICAgICAgYmxhbmtMaW5lT2Zmc2V0ID0gMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy5maXJlKCdyZWJ1aWxkJylcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIEVuYWJsZSAvIGRpc2FibGUgYnVpbGQgbW9kZVxyXG4gICwgYnVpbGQ6IGZ1bmN0aW9uKGJ1aWxkKSB7XHJcbiAgICAgIHRoaXMuX2J1aWxkID0gISFidWlsZFxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gb3ZlcndyaXRlIG1ldGhvZCBmcm9tIHBhcmVudCB0byBzZXQgZGF0YSBwcm9wZXJseVxyXG4gICwgc2V0RGF0YTogZnVuY3Rpb24obyl7XHJcbiAgICAgIHRoaXMuZG9tID0gb1xyXG4gICAgICB0aGlzLmRvbS5sZWFkaW5nID0gbmV3IFNWRy5OdW1iZXIoby5sZWFkaW5nIHx8IDEuMylcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgdGV4dCBlbGVtZW50XHJcbiAgICB0ZXh0OiBmdW5jdGlvbih0ZXh0KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLlRleHQpLnRleHQodGV4dClcclxuICAgIH1cclxuICAgIC8vIENyZWF0ZSBwbGFpbiB0ZXh0IGVsZW1lbnRcclxuICAsIHBsYWluOiBmdW5jdGlvbih0ZXh0KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLlRleHQpLnBsYWluKHRleHQpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxufSlcclxuXHJcblNWRy5Uc3BhbiA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ3RzcGFuJ1xyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuU2hhcGVcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIFNldCB0ZXh0IGNvbnRlbnRcclxuICAgIHRleHQ6IGZ1bmN0aW9uKHRleHQpIHtcclxuICAgICAgaWYodGV4dCA9PSBudWxsKSByZXR1cm4gdGhpcy5ub2RlLnRleHRDb250ZW50ICsgKHRoaXMuZG9tLm5ld0xpbmVkID8gJ1xcbicgOiAnJylcclxuXHJcbiAgICAgIHR5cGVvZiB0ZXh0ID09PSAnZnVuY3Rpb24nID8gdGV4dC5jYWxsKHRoaXMsIHRoaXMpIDogdGhpcy5wbGFpbih0ZXh0KVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIFNob3J0Y3V0IGR4XHJcbiAgLCBkeDogZnVuY3Rpb24oZHgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cignZHgnLCBkeClcclxuICAgIH1cclxuICAgIC8vIFNob3J0Y3V0IGR5XHJcbiAgLCBkeTogZnVuY3Rpb24oZHkpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cignZHknLCBkeSlcclxuICAgIH1cclxuICAgIC8vIENyZWF0ZSBuZXcgbGluZVxyXG4gICwgbmV3TGluZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIGZldGNoIHRleHQgcGFyZW50XHJcbiAgICAgIHZhciB0ID0gdGhpcy5wYXJlbnQoU1ZHLlRleHQpXHJcblxyXG4gICAgICAvLyBtYXJrIG5ldyBsaW5lXHJcbiAgICAgIHRoaXMuZG9tLm5ld0xpbmVkID0gdHJ1ZVxyXG5cclxuICAgICAgLy8gYXBwbHkgbmV3IGh5wqFuXHJcbiAgICAgIHJldHVybiB0aGlzLmR5KHQuZG9tLmxlYWRpbmcgKiB0LmF0dHIoJ2ZvbnQtc2l6ZScpKS5hdHRyKCd4JywgdC54KCkpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxufSlcclxuXHJcblNWRy5leHRlbmQoU1ZHLlRleHQsIFNWRy5Uc3Bhbiwge1xyXG4gIC8vIENyZWF0ZSBwbGFpbiB0ZXh0IG5vZGVcclxuICBwbGFpbjogZnVuY3Rpb24odGV4dCkge1xyXG4gICAgLy8gY2xlYXIgaWYgYnVpbGQgbW9kZSBpcyBkaXNhYmxlZFxyXG4gICAgaWYgKHRoaXMuX2J1aWxkID09PSBmYWxzZSlcclxuICAgICAgdGhpcy5jbGVhcigpXHJcblxyXG4gICAgLy8gY3JlYXRlIHRleHQgbm9kZVxyXG4gICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIENyZWF0ZSBhIHRzcGFuXHJcbiwgdHNwYW46IGZ1bmN0aW9uKHRleHQpIHtcclxuICAgIHZhciBub2RlICA9ICh0aGlzLnRleHRQYXRoICYmIHRoaXMudGV4dFBhdGgoKSB8fCB0aGlzKS5ub2RlXHJcbiAgICAgICwgdHNwYW4gPSBuZXcgU1ZHLlRzcGFuXHJcblxyXG4gICAgLy8gY2xlYXIgaWYgYnVpbGQgbW9kZSBpcyBkaXNhYmxlZFxyXG4gICAgaWYgKHRoaXMuX2J1aWxkID09PSBmYWxzZSlcclxuICAgICAgdGhpcy5jbGVhcigpXHJcblxyXG4gICAgLy8gYWRkIG5ldyB0c3BhblxyXG4gICAgbm9kZS5hcHBlbmRDaGlsZCh0c3Bhbi5ub2RlKVxyXG5cclxuICAgIHJldHVybiB0c3Bhbi50ZXh0KHRleHQpXHJcbiAgfVxyXG4gIC8vIENsZWFyIGFsbCBsaW5lc1xyXG4sIGNsZWFyOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBub2RlID0gKHRoaXMudGV4dFBhdGggJiYgdGhpcy50ZXh0UGF0aCgpIHx8IHRoaXMpLm5vZGVcclxuXHJcbiAgICAvLyByZW1vdmUgZXhpc3RpbmcgY2hpbGQgbm9kZXNcclxuICAgIHdoaWxlIChub2RlLmhhc0NoaWxkTm9kZXMoKSlcclxuICAgICAgbm9kZS5yZW1vdmVDaGlsZChub2RlLmxhc3RDaGlsZClcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBHZXQgbGVuZ3RoIG9mIHRleHQgZWxlbWVudFxyXG4sIGxlbmd0aDogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2RlLmdldENvbXB1dGVkVGV4dExlbmd0aCgpXHJcbiAgfVxyXG59KVxyXG5cblNWRy5UZXh0UGF0aCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ3RleHRQYXRoJ1xyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuUGFyZW50XHJcblxyXG4gIC8vIERlZmluZSBwYXJlbnQgY2xhc3NcclxuLCBwYXJlbnQ6IFNWRy5UZXh0XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICBtb3JwaEFycmF5OiBTVkcuUGF0aEFycmF5XHJcbiAgICAvLyBDcmVhdGUgcGF0aCBmb3IgdGV4dCB0byBydW4gb25cclxuICAsIHBhdGg6IGZ1bmN0aW9uKGQpIHtcclxuICAgICAgLy8gY3JlYXRlIHRleHRQYXRoIGVsZW1lbnRcclxuICAgICAgdmFyIHBhdGggID0gbmV3IFNWRy5UZXh0UGF0aFxyXG4gICAgICAgICwgdHJhY2sgPSB0aGlzLmRvYygpLmRlZnMoKS5wYXRoKGQpXHJcblxyXG4gICAgICAvLyBtb3ZlIGxpbmVzIHRvIHRleHRwYXRoXHJcbiAgICAgIHdoaWxlICh0aGlzLm5vZGUuaGFzQ2hpbGROb2RlcygpKVxyXG4gICAgICAgIHBhdGgubm9kZS5hcHBlbmRDaGlsZCh0aGlzLm5vZGUuZmlyc3RDaGlsZClcclxuXHJcbiAgICAgIC8vIGFkZCB0ZXh0UGF0aCBlbGVtZW50IGFzIGNoaWxkIG5vZGVcclxuICAgICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKHBhdGgubm9kZSlcclxuXHJcbiAgICAgIC8vIGxpbmsgdGV4dFBhdGggdG8gcGF0aCBhbmQgYWRkIGNvbnRlbnRcclxuICAgICAgcGF0aC5hdHRyKCdocmVmJywgJyMnICsgdHJhY2ssIFNWRy54bGluaylcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyByZXR1cm4gdGhlIGFycmF5IG9mIHRoZSBwYXRoIHRyYWNrIGVsZW1lbnRcclxuICAsIGFycmF5OiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHRyYWNrID0gdGhpcy50cmFjaygpXHJcblxyXG4gICAgICByZXR1cm4gdHJhY2sgPyB0cmFjay5hcnJheSgpIDogbnVsbFxyXG4gICAgfVxyXG4gICAgLy8gUGxvdCBwYXRoIGlmIGFueVxyXG4gICwgcGxvdDogZnVuY3Rpb24oZCkge1xyXG4gICAgICB2YXIgdHJhY2sgPSB0aGlzLnRyYWNrKClcclxuICAgICAgICAsIHBhdGhBcnJheSA9IG51bGxcclxuXHJcbiAgICAgIGlmICh0cmFjaykge1xyXG4gICAgICAgIHBhdGhBcnJheSA9IHRyYWNrLnBsb3QoZClcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIChkID09IG51bGwpID8gcGF0aEFycmF5IDogdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gR2V0IHRoZSBwYXRoIHRyYWNrIGVsZW1lbnRcclxuICAsIHRyYWNrOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHBhdGggPSB0aGlzLnRleHRQYXRoKClcclxuXHJcbiAgICAgIGlmIChwYXRoKVxyXG4gICAgICAgIHJldHVybiBwYXRoLnJlZmVyZW5jZSgnaHJlZicpXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgdGhlIHRleHRQYXRoIGNoaWxkXHJcbiAgLCB0ZXh0UGF0aDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLm5vZGUuZmlyc3RDaGlsZCAmJiB0aGlzLm5vZGUuZmlyc3RDaGlsZC5ub2RlTmFtZSA9PSAndGV4dFBhdGgnKVxyXG4gICAgICAgIHJldHVybiBTVkcuYWRvcHQodGhpcy5ub2RlLmZpcnN0Q2hpbGQpXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cblNWRy5OZXN0ZWQgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIFNWRy5jcmVhdGUoJ3N2ZycpKVxyXG5cclxuICAgIHRoaXMuc3R5bGUoJ292ZXJmbG93JywgJ3Zpc2libGUnKVxyXG4gIH1cclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkNvbnRhaW5lclxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIG5lc3RlZCBzdmcgZG9jdW1lbnRcclxuICAgIG5lc3RlZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLk5lc3RlZClcclxuICAgIH1cclxuICB9XHJcbn0pXG5TVkcuQSA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ2EnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5Db250YWluZXJcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIExpbmsgdXJsXHJcbiAgICB0bzogZnVuY3Rpb24odXJsKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ2hyZWYnLCB1cmwsIFNWRy54bGluaylcclxuICAgIH1cclxuICAgIC8vIExpbmsgc2hvdyBhdHRyaWJ1dGVcclxuICAsIHNob3c6IGZ1bmN0aW9uKHRhcmdldCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdzaG93JywgdGFyZ2V0LCBTVkcueGxpbmspXHJcbiAgICB9XHJcbiAgICAvLyBMaW5rIHRhcmdldCBhdHRyaWJ1dGVcclxuICAsIHRhcmdldDogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ3RhcmdldCcsIHRhcmdldClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgYSBoeXBlcmxpbmsgZWxlbWVudFxyXG4gICAgbGluazogZnVuY3Rpb24odXJsKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLkEpLnRvKHVybClcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5FbGVtZW50LCB7XHJcbiAgLy8gQ3JlYXRlIGEgaHlwZXJsaW5rIGVsZW1lbnRcclxuICBsaW5rVG86IGZ1bmN0aW9uKHVybCkge1xyXG4gICAgdmFyIGxpbmsgPSBuZXcgU1ZHLkFcclxuXHJcbiAgICBpZiAodHlwZW9mIHVybCA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICB1cmwuY2FsbChsaW5rLCBsaW5rKVxyXG4gICAgZWxzZVxyXG4gICAgICBsaW5rLnRvKHVybClcclxuXHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnQoKS5wdXQobGluaykucHV0KHRoaXMpXHJcbiAgfVxyXG5cclxufSlcblNWRy5NYXJrZXIgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6ICdtYXJrZXInXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5Db250YWluZXJcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIFNldCB3aWR0aCBvZiBlbGVtZW50XHJcbiAgICB3aWR0aDogZnVuY3Rpb24od2lkdGgpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cignbWFya2VyV2lkdGgnLCB3aWR0aClcclxuICAgIH1cclxuICAgIC8vIFNldCBoZWlnaHQgb2YgZWxlbWVudFxyXG4gICwgaGVpZ2h0OiBmdW5jdGlvbihoZWlnaHQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cignbWFya2VySGVpZ2h0JywgaGVpZ2h0KVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IG1hcmtlciByZWZYIGFuZCByZWZZXHJcbiAgLCByZWY6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cigncmVmWCcsIHgpLmF0dHIoJ3JlZlknLCB5KVxyXG4gICAgfVxyXG4gICAgLy8gVXBkYXRlIG1hcmtlclxyXG4gICwgdXBkYXRlOiBmdW5jdGlvbihibG9jaykge1xyXG4gICAgICAvLyByZW1vdmUgYWxsIGNvbnRlbnRcclxuICAgICAgdGhpcy5jbGVhcigpXHJcblxyXG4gICAgICAvLyBpbnZva2UgcGFzc2VkIGJsb2NrXHJcbiAgICAgIGlmICh0eXBlb2YgYmxvY2sgPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICBibG9jay5jYWxsKHRoaXMsIHRoaXMpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gUmV0dXJuIHRoZSBmaWxsIGlkXHJcbiAgLCB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiAndXJsKCMnICsgdGhpcy5pZCgpICsgJyknXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgbWFya2VyOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBibG9jaykge1xyXG4gICAgICAvLyBDcmVhdGUgbWFya2VyIGVsZW1lbnQgaW4gZGVmc1xyXG4gICAgICByZXR1cm4gdGhpcy5kZWZzKCkubWFya2VyKHdpZHRoLCBoZWlnaHQsIGJsb2NrKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5EZWZzLCB7XHJcbiAgLy8gQ3JlYXRlIG1hcmtlclxyXG4gIG1hcmtlcjogZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgYmxvY2spIHtcclxuICAgIC8vIFNldCBkZWZhdWx0IHZpZXdib3ggdG8gbWF0Y2ggdGhlIHdpZHRoIGFuZCBoZWlnaHQsIHNldCByZWYgdG8gY3ggYW5kIGN5IGFuZCBzZXQgb3JpZW50IHRvIGF1dG9cclxuICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLk1hcmtlcilcclxuICAgICAgLnNpemUod2lkdGgsIGhlaWdodClcclxuICAgICAgLnJlZih3aWR0aCAvIDIsIGhlaWdodCAvIDIpXHJcbiAgICAgIC52aWV3Ym94KDAsIDAsIHdpZHRoLCBoZWlnaHQpXHJcbiAgICAgIC5hdHRyKCdvcmllbnQnLCAnYXV0bycpXHJcbiAgICAgIC51cGRhdGUoYmxvY2spXHJcbiAgfVxyXG5cclxufSlcclxuXHJcblNWRy5leHRlbmQoU1ZHLkxpbmUsIFNWRy5Qb2x5bGluZSwgU1ZHLlBvbHlnb24sIFNWRy5QYXRoLCB7XHJcbiAgLy8gQ3JlYXRlIGFuZCBhdHRhY2ggbWFya2Vyc1xyXG4gIG1hcmtlcjogZnVuY3Rpb24obWFya2VyLCB3aWR0aCwgaGVpZ2h0LCBibG9jaykge1xyXG4gICAgdmFyIGF0dHIgPSBbJ21hcmtlciddXHJcblxyXG4gICAgLy8gQnVpbGQgYXR0cmlidXRlIG5hbWVcclxuICAgIGlmIChtYXJrZXIgIT0gJ2FsbCcpIGF0dHIucHVzaChtYXJrZXIpXHJcbiAgICBhdHRyID0gYXR0ci5qb2luKCctJylcclxuXHJcbiAgICAvLyBTZXQgbWFya2VyIGF0dHJpYnV0ZVxyXG4gICAgbWFya2VyID0gYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgU1ZHLk1hcmtlciA/XHJcbiAgICAgIGFyZ3VtZW50c1sxXSA6XHJcbiAgICAgIHRoaXMuZG9jKCkubWFya2VyKHdpZHRoLCBoZWlnaHQsIGJsb2NrKVxyXG5cclxuICAgIHJldHVybiB0aGlzLmF0dHIoYXR0ciwgbWFya2VyKVxyXG4gIH1cclxuXHJcbn0pXG4vLyBEZWZpbmUgbGlzdCBvZiBhdmFpbGFibGUgYXR0cmlidXRlcyBmb3Igc3Ryb2tlIGFuZCBmaWxsXHJcbnZhciBzdWdhciA9IHtcclxuICBzdHJva2U6IFsnY29sb3InLCAnd2lkdGgnLCAnb3BhY2l0eScsICdsaW5lY2FwJywgJ2xpbmVqb2luJywgJ21pdGVybGltaXQnLCAnZGFzaGFycmF5JywgJ2Rhc2hvZmZzZXQnXVxyXG4sIGZpbGw6ICAgWydjb2xvcicsICdvcGFjaXR5JywgJ3J1bGUnXVxyXG4sIHByZWZpeDogZnVuY3Rpb24odCwgYSkge1xyXG4gICAgcmV0dXJuIGEgPT0gJ2NvbG9yJyA/IHQgOiB0ICsgJy0nICsgYVxyXG4gIH1cclxufVxyXG5cclxuLy8gQWRkIHN1Z2FyIGZvciBmaWxsIGFuZCBzdHJva2VcclxuO1snZmlsbCcsICdzdHJva2UnXS5mb3JFYWNoKGZ1bmN0aW9uKG0pIHtcclxuICB2YXIgaSwgZXh0ZW5zaW9uID0ge31cclxuXHJcbiAgZXh0ZW5zaW9uW21dID0gZnVuY3Rpb24obykge1xyXG4gICAgaWYgKHR5cGVvZiBvID09ICd1bmRlZmluZWQnKVxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgaWYgKHR5cGVvZiBvID09ICdzdHJpbmcnIHx8IFNWRy5Db2xvci5pc1JnYihvKSB8fCAobyAmJiB0eXBlb2Ygby5maWxsID09PSAnZnVuY3Rpb24nKSlcclxuICAgICAgdGhpcy5hdHRyKG0sIG8pXHJcblxyXG4gICAgZWxzZVxyXG4gICAgICAvLyBzZXQgYWxsIGF0dHJpYnV0ZXMgZnJvbSBzdWdhci5maWxsIGFuZCBzdWdhci5zdHJva2UgbGlzdFxyXG4gICAgICBmb3IgKGkgPSBzdWdhclttXS5sZW5ndGggLSAxOyBpID49IDA7IGktLSlcclxuICAgICAgICBpZiAob1tzdWdhclttXVtpXV0gIT0gbnVsbClcclxuICAgICAgICAgIHRoaXMuYXR0cihzdWdhci5wcmVmaXgobSwgc3VnYXJbbV1baV0pLCBvW3N1Z2FyW21dW2ldXSlcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwgU1ZHLkZYLCBleHRlbnNpb24pXHJcblxyXG59KVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwgU1ZHLkZYLCB7XHJcbiAgLy8gTWFwIHJvdGF0aW9uIHRvIHRyYW5zZm9ybVxyXG4gIHJvdGF0ZTogZnVuY3Rpb24oZCwgY3gsIGN5KSB7XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm0oeyByb3RhdGlvbjogZCwgY3g6IGN4LCBjeTogY3kgfSlcclxuICB9XHJcbiAgLy8gTWFwIHNrZXcgdG8gdHJhbnNmb3JtXHJcbiwgc2tldzogZnVuY3Rpb24oeCwgeSwgY3gsIGN5KSB7XHJcbiAgICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PSAxICB8fCBhcmd1bWVudHMubGVuZ3RoID09IDMgP1xyXG4gICAgICB0aGlzLnRyYW5zZm9ybSh7IHNrZXc6IHgsIGN4OiB5LCBjeTogY3ggfSkgOlxyXG4gICAgICB0aGlzLnRyYW5zZm9ybSh7IHNrZXdYOiB4LCBza2V3WTogeSwgY3g6IGN4LCBjeTogY3kgfSlcclxuICB9XHJcbiAgLy8gTWFwIHNjYWxlIHRvIHRyYW5zZm9ybVxyXG4sIHNjYWxlOiBmdW5jdGlvbih4LCB5LCBjeCwgY3kpIHtcclxuICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09IDEgIHx8IGFyZ3VtZW50cy5sZW5ndGggPT0gMyA/XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtKHsgc2NhbGU6IHgsIGN4OiB5LCBjeTogY3ggfSkgOlxyXG4gICAgICB0aGlzLnRyYW5zZm9ybSh7IHNjYWxlWDogeCwgc2NhbGVZOiB5LCBjeDogY3gsIGN5OiBjeSB9KVxyXG4gIH1cclxuICAvLyBNYXAgdHJhbnNsYXRlIHRvIHRyYW5zZm9ybVxyXG4sIHRyYW5zbGF0ZTogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtKHsgeDogeCwgeTogeSB9KVxyXG4gIH1cclxuICAvLyBNYXAgZmxpcCB0byB0cmFuc2Zvcm1cclxuLCBmbGlwOiBmdW5jdGlvbihhLCBvKSB7XHJcbiAgICBvID0gdHlwZW9mIGEgPT0gJ251bWJlcicgPyBhIDogb1xyXG4gICAgcmV0dXJuIHRoaXMudHJhbnNmb3JtKHsgZmxpcDogYSB8fCAnYm90aCcsIG9mZnNldDogbyB9KVxyXG4gIH1cclxuICAvLyBNYXAgbWF0cml4IHRvIHRyYW5zZm9ybVxyXG4sIG1hdHJpeDogZnVuY3Rpb24obSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cigndHJhbnNmb3JtJywgbmV3IFNWRy5NYXRyaXgoYXJndW1lbnRzLmxlbmd0aCA9PSA2ID8gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpIDogbSkpXHJcbiAgfVxyXG4gIC8vIE9wYWNpdHlcclxuLCBvcGFjaXR5OiBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cignb3BhY2l0eScsIHZhbHVlKVxyXG4gIH1cclxuICAvLyBSZWxhdGl2ZSBtb3ZlIG92ZXIgeCBheGlzXHJcbiwgZHg6IGZ1bmN0aW9uKHgpIHtcclxuICAgIHJldHVybiB0aGlzLngobmV3IFNWRy5OdW1iZXIoeCkucGx1cyh0aGlzIGluc3RhbmNlb2YgU1ZHLkZYID8gMCA6IHRoaXMueCgpKSwgdHJ1ZSlcclxuICB9XHJcbiAgLy8gUmVsYXRpdmUgbW92ZSBvdmVyIHkgYXhpc1xyXG4sIGR5OiBmdW5jdGlvbih5KSB7XHJcbiAgICByZXR1cm4gdGhpcy55KG5ldyBTVkcuTnVtYmVyKHkpLnBsdXModGhpcyBpbnN0YW5jZW9mIFNWRy5GWCA/IDAgOiB0aGlzLnkoKSksIHRydWUpXHJcbiAgfVxyXG4gIC8vIFJlbGF0aXZlIG1vdmUgb3ZlciB4IGFuZCB5IGF4ZXNcclxuLCBkbW92ZTogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgcmV0dXJuIHRoaXMuZHgoeCkuZHkoeSlcclxuICB9XHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5SZWN0LCBTVkcuRWxsaXBzZSwgU1ZHLkNpcmNsZSwgU1ZHLkdyYWRpZW50LCBTVkcuRlgsIHtcclxuICAvLyBBZGQgeCBhbmQgeSByYWRpdXNcclxuICByYWRpdXM6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHZhciB0eXBlID0gKHRoaXMuX3RhcmdldCB8fCB0aGlzKS50eXBlO1xyXG4gICAgcmV0dXJuIHR5cGUgPT0gJ3JhZGlhbCcgfHwgdHlwZSA9PSAnY2lyY2xlJyA/XHJcbiAgICAgIHRoaXMuYXR0cigncicsIG5ldyBTVkcuTnVtYmVyKHgpKSA6XHJcbiAgICAgIHRoaXMucngoeCkucnkoeSA9PSBudWxsID8geCA6IHkpXHJcbiAgfVxyXG59KVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuUGF0aCwge1xyXG4gIC8vIEdldCBwYXRoIGxlbmd0aFxyXG4gIGxlbmd0aDogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2RlLmdldFRvdGFsTGVuZ3RoKClcclxuICB9XHJcbiAgLy8gR2V0IHBvaW50IGF0IGxlbmd0aFxyXG4sIHBvaW50QXQ6IGZ1bmN0aW9uKGxlbmd0aCkge1xyXG4gICAgcmV0dXJuIHRoaXMubm9kZS5nZXRQb2ludEF0TGVuZ3RoKGxlbmd0aClcclxuICB9XHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5QYXJlbnQsIFNWRy5UZXh0LCBTVkcuVHNwYW4sIFNWRy5GWCwge1xyXG4gIC8vIFNldCBmb250XHJcbiAgZm9udDogZnVuY3Rpb24oYSwgdikge1xyXG4gICAgaWYgKHR5cGVvZiBhID09ICdvYmplY3QnKSB7XHJcbiAgICAgIGZvciAodiBpbiBhKSB0aGlzLmZvbnQodiwgYVt2XSlcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYSA9PSAnbGVhZGluZycgP1xyXG4gICAgICAgIHRoaXMubGVhZGluZyh2KSA6XHJcbiAgICAgIGEgPT0gJ2FuY2hvcicgP1xyXG4gICAgICAgIHRoaXMuYXR0cigndGV4dC1hbmNob3InLCB2KSA6XHJcbiAgICAgIGEgPT0gJ3NpemUnIHx8IGEgPT0gJ2ZhbWlseScgfHwgYSA9PSAnd2VpZ2h0JyB8fCBhID09ICdzdHJldGNoJyB8fCBhID09ICd2YXJpYW50JyB8fCBhID09ICdzdHlsZScgP1xyXG4gICAgICAgIHRoaXMuYXR0cignZm9udC0nKyBhLCB2KSA6XHJcbiAgICAgICAgdGhpcy5hdHRyKGEsIHYpXHJcbiAgfVxyXG59KVxyXG5cblNWRy5TZXQgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihtZW1iZXJzKSB7XHJcbiAgICAvLyBTZXQgaW5pdGlhbCBzdGF0ZVxyXG4gICAgQXJyYXkuaXNBcnJheShtZW1iZXJzKSA/IHRoaXMubWVtYmVycyA9IG1lbWJlcnMgOiB0aGlzLmNsZWFyKClcclxuICB9XHJcblxyXG4gIC8vIEFkZCBjbGFzcyBtZXRob2RzXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICAvLyBBZGQgZWxlbWVudCB0byBzZXRcclxuICAgIGFkZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBpLCBpbCwgZWxlbWVudHMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cylcclxuXHJcbiAgICAgIGZvciAoaSA9IDAsIGlsID0gZWxlbWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKylcclxuICAgICAgICB0aGlzLm1lbWJlcnMucHVzaChlbGVtZW50c1tpXSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBSZW1vdmUgZWxlbWVudCBmcm9tIHNldFxyXG4gICwgcmVtb3ZlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgIHZhciBpID0gdGhpcy5pbmRleChlbGVtZW50KVxyXG5cclxuICAgICAgLy8gcmVtb3ZlIGdpdmVuIGNoaWxkXHJcbiAgICAgIGlmIChpID4gLTEpXHJcbiAgICAgICAgdGhpcy5tZW1iZXJzLnNwbGljZShpLCAxKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIEl0ZXJhdGUgb3ZlciBhbGwgbWVtYmVyc1xyXG4gICwgZWFjaDogZnVuY3Rpb24oYmxvY2spIHtcclxuICAgICAgZm9yICh2YXIgaSA9IDAsIGlsID0gdGhpcy5tZW1iZXJzLmxlbmd0aDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgYmxvY2suYXBwbHkodGhpcy5tZW1iZXJzW2ldLCBbaSwgdGhpcy5tZW1iZXJzXSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBSZXN0b3JlIHRvIGRlZmF1bHRzXHJcbiAgLCBjbGVhcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIGluaXRpYWxpemUgc3RvcmVcclxuICAgICAgdGhpcy5tZW1iZXJzID0gW11cclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgdGhlIGxlbmd0aCBvZiBhIHNldFxyXG4gICwgbGVuZ3RoOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubWVtYmVycy5sZW5ndGhcclxuICAgIH1cclxuICAgIC8vIENoZWNrcyBpZiBhIGdpdmVuIGVsZW1lbnQgaXMgcHJlc2VudCBpbiBzZXRcclxuICAsIGhhczogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5pbmRleChlbGVtZW50KSA+PSAwXHJcbiAgICB9XHJcbiAgICAvLyByZXR1bnMgaW5kZXggb2YgZ2l2ZW4gZWxlbWVudCBpbiBzZXRcclxuICAsIGluZGV4OiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm1lbWJlcnMuaW5kZXhPZihlbGVtZW50KVxyXG4gICAgfVxyXG4gICAgLy8gR2V0IG1lbWJlciBhdCBnaXZlbiBpbmRleFxyXG4gICwgZ2V0OiBmdW5jdGlvbihpKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm1lbWJlcnNbaV1cclxuICAgIH1cclxuICAgIC8vIEdldCBmaXJzdCBtZW1iZXJcclxuICAsIGZpcnN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZ2V0KDApXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgbGFzdCBtZW1iZXJcclxuICAsIGxhc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5nZXQodGhpcy5tZW1iZXJzLmxlbmd0aCAtIDEpXHJcbiAgICB9XHJcbiAgICAvLyBEZWZhdWx0IHZhbHVlXHJcbiAgLCB2YWx1ZU9mOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubWVtYmVyc1xyXG4gICAgfVxyXG4gICAgLy8gR2V0IHRoZSBib3VuZGluZyBib3ggb2YgYWxsIG1lbWJlcnMgaW5jbHVkZWQgb3IgZW1wdHkgYm94IGlmIHNldCBoYXMgbm8gaXRlbXNcclxuICAsIGJib3g6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIC8vIHJldHVybiBhbiBlbXB0eSBib3ggb2YgdGhlcmUgYXJlIG5vIG1lbWJlcnNcclxuICAgICAgaWYgKHRoaXMubWVtYmVycy5sZW5ndGggPT0gMClcclxuICAgICAgICByZXR1cm4gbmV3IFNWRy5SQm94KClcclxuXHJcbiAgICAgIC8vIGdldCB0aGUgZmlyc3QgcmJveCBhbmQgdXBkYXRlIHRoZSB0YXJnZXQgYmJveFxyXG4gICAgICB2YXIgcmJveCA9IHRoaXMubWVtYmVyc1swXS5yYm94KHRoaXMubWVtYmVyc1swXS5kb2MoKSlcclxuXHJcbiAgICAgIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyB1c2VyIHJib3ggZm9yIGNvcnJlY3QgcG9zaXRpb24gYW5kIHZpc3VhbCByZXByZXNlbnRhdGlvblxyXG4gICAgICAgIHJib3ggPSByYm94Lm1lcmdlKHRoaXMucmJveCh0aGlzLmRvYygpKSlcclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiByYm94XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIGEgbmV3IHNldFxyXG4gICAgc2V0OiBmdW5jdGlvbihtZW1iZXJzKSB7XHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLlNldChtZW1iZXJzKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXHJcblNWRy5GWC5TZXQgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6IGZ1bmN0aW9uKHNldCkge1xyXG4gICAgLy8gc3RvcmUgcmVmZXJlbmNlIHRvIHNldFxyXG4gICAgdGhpcy5zZXQgPSBzZXRcclxuICB9XHJcblxyXG59KVxyXG5cclxuLy8gQWxpYXMgbWV0aG9kc1xyXG5TVkcuU2V0LmluaGVyaXQgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbVxyXG4gICAgLCBtZXRob2RzID0gW11cclxuXHJcbiAgLy8gZ2F0aGVyIHNoYXBlIG1ldGhvZHNcclxuICBmb3IodmFyIG0gaW4gU1ZHLlNoYXBlLnByb3RvdHlwZSlcclxuICAgIGlmICh0eXBlb2YgU1ZHLlNoYXBlLnByb3RvdHlwZVttXSA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTVkcuU2V0LnByb3RvdHlwZVttXSAhPSAnZnVuY3Rpb24nKVxyXG4gICAgICBtZXRob2RzLnB1c2gobSlcclxuXHJcbiAgLy8gYXBwbHkgc2hhcGUgYWxpYXNzZXNcclxuICBtZXRob2RzLmZvckVhY2goZnVuY3Rpb24obWV0aG9kKSB7XHJcbiAgICBTVkcuU2V0LnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwLCBpbCA9IHRoaXMubWVtYmVycy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGlmICh0aGlzLm1lbWJlcnNbaV0gJiYgdHlwZW9mIHRoaXMubWVtYmVyc1tpXVttZXRob2RdID09ICdmdW5jdGlvbicpXHJcbiAgICAgICAgICB0aGlzLm1lbWJlcnNbaV1bbWV0aG9kXS5hcHBseSh0aGlzLm1lbWJlcnNbaV0sIGFyZ3VtZW50cylcclxuXHJcbiAgICAgIHJldHVybiBtZXRob2QgPT0gJ2FuaW1hdGUnID8gKHRoaXMuZnggfHwgKHRoaXMuZnggPSBuZXcgU1ZHLkZYLlNldCh0aGlzKSkpIDogdGhpc1xyXG4gICAgfVxyXG4gIH0pXHJcblxyXG4gIC8vIGNsZWFyIG1ldGhvZHMgZm9yIHRoZSBuZXh0IHJvdW5kXHJcbiAgbWV0aG9kcyA9IFtdXHJcblxyXG4gIC8vIGdhdGhlciBmeCBtZXRob2RzXHJcbiAgZm9yKHZhciBtIGluIFNWRy5GWC5wcm90b3R5cGUpXHJcbiAgICBpZiAodHlwZW9mIFNWRy5GWC5wcm90b3R5cGVbbV0gPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgU1ZHLkZYLlNldC5wcm90b3R5cGVbbV0gIT0gJ2Z1bmN0aW9uJylcclxuICAgICAgbWV0aG9kcy5wdXNoKG0pXHJcblxyXG4gIC8vIGFwcGx5IGZ4IGFsaWFzc2VzXHJcbiAgbWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZCkge1xyXG4gICAgU1ZHLkZYLlNldC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICBmb3IgKHZhciBpID0gMCwgaWwgPSB0aGlzLnNldC5tZW1iZXJzLmxlbmd0aDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgdGhpcy5zZXQubWVtYmVyc1tpXS5meFttZXRob2RdLmFwcGx5KHRoaXMuc2V0Lm1lbWJlcnNbaV0uZngsIGFyZ3VtZW50cylcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgfSlcclxufVxyXG5cclxuXHJcblxuXHJcblNWRy5leHRlbmQoU1ZHLkVsZW1lbnQsIHtcclxuICAvLyBTdG9yZSBkYXRhIHZhbHVlcyBvbiBzdmcgbm9kZXNcclxuICBkYXRhOiBmdW5jdGlvbihhLCB2LCByKSB7XHJcbiAgICBpZiAodHlwZW9mIGEgPT0gJ29iamVjdCcpIHtcclxuICAgICAgZm9yICh2IGluIGEpXHJcbiAgICAgICAgdGhpcy5kYXRhKHYsIGFbdl0pXHJcblxyXG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKHRoaXMuYXR0cignZGF0YS0nICsgYSkpXHJcbiAgICAgIH0gY2F0Y2goZSkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHIoJ2RhdGEtJyArIGEpXHJcbiAgICAgIH1cclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLmF0dHIoXHJcbiAgICAgICAgJ2RhdGEtJyArIGFcclxuICAgICAgLCB2ID09PSBudWxsID9cclxuICAgICAgICAgIG51bGwgOlxyXG4gICAgICAgIHIgPT09IHRydWUgfHwgdHlwZW9mIHYgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiB2ID09PSAnbnVtYmVyJyA/XHJcbiAgICAgICAgICB2IDpcclxuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHYpXHJcbiAgICAgIClcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxufSlcblNWRy5leHRlbmQoU1ZHLkVsZW1lbnQsIHtcclxuICAvLyBSZW1lbWJlciBhcmJpdHJhcnkgZGF0YVxyXG4gIHJlbWVtYmVyOiBmdW5jdGlvbihrLCB2KSB7XHJcbiAgICAvLyByZW1lbWJlciBldmVyeSBpdGVtIGluIGFuIG9iamVjdCBpbmRpdmlkdWFsbHlcclxuICAgIGlmICh0eXBlb2YgYXJndW1lbnRzWzBdID09ICdvYmplY3QnKVxyXG4gICAgICBmb3IgKHZhciB2IGluIGspXHJcbiAgICAgICAgdGhpcy5yZW1lbWJlcih2LCBrW3ZdKVxyXG5cclxuICAgIC8vIHJldHJpZXZlIG1lbW9yeVxyXG4gICAgZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxKVxyXG4gICAgICByZXR1cm4gdGhpcy5tZW1vcnkoKVtrXVxyXG5cclxuICAgIC8vIHN0b3JlIG1lbW9yeVxyXG4gICAgZWxzZVxyXG4gICAgICB0aGlzLm1lbW9yeSgpW2tdID0gdlxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAvLyBFcmFzZSBhIGdpdmVuIG1lbW9yeVxyXG4sIGZvcmdldDogZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKVxyXG4gICAgICB0aGlzLl9tZW1vcnkgPSB7fVxyXG4gICAgZWxzZVxyXG4gICAgICBmb3IgKHZhciBpID0gYXJndW1lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKVxyXG4gICAgICAgIGRlbGV0ZSB0aGlzLm1lbW9yeSgpW2FyZ3VtZW50c1tpXV1cclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuXHJcbiAgLy8gSW5pdGlhbGl6ZSBvciByZXR1cm4gbG9jYWwgbWVtb3J5IG9iamVjdFxyXG4sIG1lbW9yeTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fbWVtb3J5IHx8ICh0aGlzLl9tZW1vcnkgPSB7fSlcclxuICB9XHJcblxyXG59KVxuLy8gTWV0aG9kIGZvciBnZXR0aW5nIGFuIGVsZW1lbnQgYnkgaWRcclxuU1ZHLmdldCA9IGZ1bmN0aW9uKGlkKSB7XHJcbiAgdmFyIG5vZGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZEZyb21SZWZlcmVuY2UoaWQpIHx8IGlkKVxyXG4gIHJldHVybiBTVkcuYWRvcHQobm9kZSlcclxufVxyXG5cclxuLy8gU2VsZWN0IGVsZW1lbnRzIGJ5IHF1ZXJ5IHN0cmluZ1xyXG5TVkcuc2VsZWN0ID0gZnVuY3Rpb24ocXVlcnksIHBhcmVudCkge1xyXG4gIHJldHVybiBuZXcgU1ZHLlNldChcclxuICAgIFNWRy51dGlscy5tYXAoKHBhcmVudCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvckFsbChxdWVyeSksIGZ1bmN0aW9uKG5vZGUpIHtcclxuICAgICAgcmV0dXJuIFNWRy5hZG9wdChub2RlKVxyXG4gICAgfSlcclxuICApXHJcbn1cclxuXHJcblNWRy5leHRlbmQoU1ZHLlBhcmVudCwge1xyXG4gIC8vIFNjb3BlZCBzZWxlY3QgbWV0aG9kXHJcbiAgc2VsZWN0OiBmdW5jdGlvbihxdWVyeSkge1xyXG4gICAgcmV0dXJuIFNWRy5zZWxlY3QocXVlcnksIHRoaXMubm9kZSlcclxuICB9XHJcblxyXG59KVxuZnVuY3Rpb24gcGF0aFJlZ1JlcGxhY2UoYSwgYiwgYywgZCkge1xyXG4gIHJldHVybiBjICsgZC5yZXBsYWNlKFNWRy5yZWdleC5kb3RzLCAnIC4nKVxyXG59XHJcblxyXG4vLyBjcmVhdGVzIGRlZXAgY2xvbmUgb2YgYXJyYXlcclxuZnVuY3Rpb24gYXJyYXlfY2xvbmUoYXJyKXtcclxuICB2YXIgY2xvbmUgPSBhcnIuc2xpY2UoMClcclxuICBmb3IodmFyIGkgPSBjbG9uZS5sZW5ndGg7IGktLTspe1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShjbG9uZVtpXSkpe1xyXG4gICAgICBjbG9uZVtpXSA9IGFycmF5X2Nsb25lKGNsb25lW2ldKVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gY2xvbmVcclxufVxyXG5cclxuLy8gdGVzdHMgaWYgYSBnaXZlbiBlbGVtZW50IGlzIGluc3RhbmNlIG9mIGFuIG9iamVjdFxyXG5mdW5jdGlvbiBpcyhlbCwgb2JqKXtcclxuICByZXR1cm4gZWwgaW5zdGFuY2VvZiBvYmpcclxufVxyXG5cclxuLy8gdGVzdHMgaWYgYSBnaXZlbiBzZWxlY3RvciBtYXRjaGVzIGFuIGVsZW1lbnRcclxuZnVuY3Rpb24gbWF0Y2hlcyhlbCwgc2VsZWN0b3IpIHtcclxuICByZXR1cm4gKGVsLm1hdGNoZXMgfHwgZWwubWF0Y2hlc1NlbGVjdG9yIHx8IGVsLm1zTWF0Y2hlc1NlbGVjdG9yIHx8IGVsLm1vek1hdGNoZXNTZWxlY3RvciB8fCBlbC53ZWJraXRNYXRjaGVzU2VsZWN0b3IgfHwgZWwub01hdGNoZXNTZWxlY3RvcikuY2FsbChlbCwgc2VsZWN0b3IpO1xyXG59XHJcblxyXG4vLyBDb252ZXJ0IGRhc2gtc2VwYXJhdGVkLXN0cmluZyB0byBjYW1lbENhc2VcclxuZnVuY3Rpb24gY2FtZWxDYXNlKHMpIHtcclxuICByZXR1cm4gcy50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoLy0oLikvZywgZnVuY3Rpb24obSwgZykge1xyXG4gICAgcmV0dXJuIGcudG9VcHBlckNhc2UoKVxyXG4gIH0pXHJcbn1cclxuXHJcbi8vIENhcGl0YWxpemUgZmlyc3QgbGV0dGVyIG9mIGEgc3RyaW5nXHJcbmZ1bmN0aW9uIGNhcGl0YWxpemUocykge1xyXG4gIHJldHVybiBzLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgcy5zbGljZSgxKVxyXG59XHJcblxyXG4vLyBFbnN1cmUgdG8gc2l4LWJhc2VkIGhleFxyXG5mdW5jdGlvbiBmdWxsSGV4KGhleCkge1xyXG4gIHJldHVybiBoZXgubGVuZ3RoID09IDQgP1xyXG4gICAgWyAnIycsXHJcbiAgICAgIGhleC5zdWJzdHJpbmcoMSwgMiksIGhleC5zdWJzdHJpbmcoMSwgMilcclxuICAgICwgaGV4LnN1YnN0cmluZygyLCAzKSwgaGV4LnN1YnN0cmluZygyLCAzKVxyXG4gICAgLCBoZXguc3Vic3RyaW5nKDMsIDQpLCBoZXguc3Vic3RyaW5nKDMsIDQpXHJcbiAgICBdLmpvaW4oJycpIDogaGV4XHJcbn1cclxuXHJcbi8vIENvbXBvbmVudCB0byBoZXggdmFsdWVcclxuZnVuY3Rpb24gY29tcFRvSGV4KGNvbXApIHtcclxuICB2YXIgaGV4ID0gY29tcC50b1N0cmluZygxNilcclxuICByZXR1cm4gaGV4Lmxlbmd0aCA9PSAxID8gJzAnICsgaGV4IDogaGV4XHJcbn1cclxuXHJcbi8vIENhbGN1bGF0ZSBwcm9wb3J0aW9uYWwgd2lkdGggYW5kIGhlaWdodCB2YWx1ZXMgd2hlbiBuZWNlc3NhcnlcclxuZnVuY3Rpb24gcHJvcG9ydGlvbmFsU2l6ZShlbGVtZW50LCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgaWYgKHdpZHRoID09IG51bGwgfHwgaGVpZ2h0ID09IG51bGwpIHtcclxuICAgIHZhciBib3ggPSBlbGVtZW50LmJib3goKVxyXG5cclxuICAgIGlmICh3aWR0aCA9PSBudWxsKVxyXG4gICAgICB3aWR0aCA9IGJveC53aWR0aCAvIGJveC5oZWlnaHQgKiBoZWlnaHRcclxuICAgIGVsc2UgaWYgKGhlaWdodCA9PSBudWxsKVxyXG4gICAgICBoZWlnaHQgPSBib3guaGVpZ2h0IC8gYm94LndpZHRoICogd2lkdGhcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICB3aWR0aDogIHdpZHRoXHJcbiAgLCBoZWlnaHQ6IGhlaWdodFxyXG4gIH1cclxufVxyXG5cclxuLy8gRGVsdGEgdHJhbnNmb3JtIHBvaW50XHJcbmZ1bmN0aW9uIGRlbHRhVHJhbnNmb3JtUG9pbnQobWF0cml4LCB4LCB5KSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHg6IHggKiBtYXRyaXguYSArIHkgKiBtYXRyaXguYyArIDBcclxuICAsIHk6IHggKiBtYXRyaXguYiArIHkgKiBtYXRyaXguZCArIDBcclxuICB9XHJcbn1cclxuXHJcbi8vIE1hcCBtYXRyaXggYXJyYXkgdG8gb2JqZWN0XHJcbmZ1bmN0aW9uIGFycmF5VG9NYXRyaXgoYSkge1xyXG4gIHJldHVybiB7IGE6IGFbMF0sIGI6IGFbMV0sIGM6IGFbMl0sIGQ6IGFbM10sIGU6IGFbNF0sIGY6IGFbNV0gfVxyXG59XHJcblxyXG4vLyBQYXJzZSBtYXRyaXggaWYgcmVxdWlyZWRcclxuZnVuY3Rpb24gcGFyc2VNYXRyaXgobWF0cml4KSB7XHJcbiAgaWYgKCEobWF0cml4IGluc3RhbmNlb2YgU1ZHLk1hdHJpeCkpXHJcbiAgICBtYXRyaXggPSBuZXcgU1ZHLk1hdHJpeChtYXRyaXgpXHJcblxyXG4gIHJldHVybiBtYXRyaXhcclxufVxyXG5cclxuLy8gQWRkIGNlbnRyZSBwb2ludCB0byB0cmFuc2Zvcm0gb2JqZWN0XHJcbmZ1bmN0aW9uIGVuc3VyZUNlbnRyZShvLCB0YXJnZXQpIHtcclxuICBvLmN4ID0gby5jeCA9PSBudWxsID8gdGFyZ2V0LmJib3goKS5jeCA6IG8uY3hcclxuICBvLmN5ID0gby5jeSA9PSBudWxsID8gdGFyZ2V0LmJib3goKS5jeSA6IG8uY3lcclxufVxyXG5cclxuLy8gUGF0aEFycmF5IEhlbHBlcnNcclxuZnVuY3Rpb24gYXJyYXlUb1N0cmluZyhhKSB7XHJcbiAgZm9yICh2YXIgaSA9IDAsIGlsID0gYS5sZW5ndGgsIHMgPSAnJzsgaSA8IGlsOyBpKyspIHtcclxuICAgIHMgKz0gYVtpXVswXVxyXG5cclxuICAgIGlmIChhW2ldWzFdICE9IG51bGwpIHtcclxuICAgICAgcyArPSBhW2ldWzFdXHJcblxyXG4gICAgICBpZiAoYVtpXVsyXSAhPSBudWxsKSB7XHJcbiAgICAgICAgcyArPSAnICdcclxuICAgICAgICBzICs9IGFbaV1bMl1cclxuXHJcbiAgICAgICAgaWYgKGFbaV1bM10gIT0gbnVsbCkge1xyXG4gICAgICAgICAgcyArPSAnICdcclxuICAgICAgICAgIHMgKz0gYVtpXVszXVxyXG4gICAgICAgICAgcyArPSAnICdcclxuICAgICAgICAgIHMgKz0gYVtpXVs0XVxyXG5cclxuICAgICAgICAgIGlmIChhW2ldWzVdICE9IG51bGwpIHtcclxuICAgICAgICAgICAgcyArPSAnICdcclxuICAgICAgICAgICAgcyArPSBhW2ldWzVdXHJcbiAgICAgICAgICAgIHMgKz0gJyAnXHJcbiAgICAgICAgICAgIHMgKz0gYVtpXVs2XVxyXG5cclxuICAgICAgICAgICAgaWYgKGFbaV1bN10gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgIHMgKz0gJyAnXHJcbiAgICAgICAgICAgICAgcyArPSBhW2ldWzddXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiBzICsgJyAnXHJcbn1cclxuXHJcbi8vIERlZXAgbmV3IGlkIGFzc2lnbm1lbnRcclxuZnVuY3Rpb24gYXNzaWduTmV3SWQobm9kZSkge1xyXG4gIC8vIGRvIHRoZSBzYW1lIGZvciBTVkcgY2hpbGQgbm9kZXMgYXMgd2VsbFxyXG4gIGZvciAodmFyIGkgPSBub2RlLmNoaWxkTm9kZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXHJcbiAgICBpZiAobm9kZS5jaGlsZE5vZGVzW2ldIGluc3RhbmNlb2Ygd2luZG93LlNWR0VsZW1lbnQpXHJcbiAgICAgIGFzc2lnbk5ld0lkKG5vZGUuY2hpbGROb2Rlc1tpXSlcclxuXHJcbiAgcmV0dXJuIFNWRy5hZG9wdChub2RlKS5pZChTVkcuZWlkKG5vZGUubm9kZU5hbWUpKVxyXG59XHJcblxyXG4vLyBBZGQgbW9yZSBib3VuZGluZyBib3ggcHJvcGVydGllc1xyXG5mdW5jdGlvbiBmdWxsQm94KGIpIHtcclxuICBpZiAoYi54ID09IG51bGwpIHtcclxuICAgIGIueCAgICAgID0gMFxyXG4gICAgYi55ICAgICAgPSAwXHJcbiAgICBiLndpZHRoICA9IDBcclxuICAgIGIuaGVpZ2h0ID0gMFxyXG4gIH1cclxuXHJcbiAgYi53ICA9IGIud2lkdGhcclxuICBiLmggID0gYi5oZWlnaHRcclxuICBiLngyID0gYi54ICsgYi53aWR0aFxyXG4gIGIueTIgPSBiLnkgKyBiLmhlaWdodFxyXG4gIGIuY3ggPSBiLnggKyBiLndpZHRoIC8gMlxyXG4gIGIuY3kgPSBiLnkgKyBiLmhlaWdodCAvIDJcclxuXHJcbiAgcmV0dXJuIGJcclxufVxyXG5cclxuLy8gR2V0IGlkIGZyb20gcmVmZXJlbmNlIHN0cmluZ1xyXG5mdW5jdGlvbiBpZEZyb21SZWZlcmVuY2UodXJsKSB7XHJcbiAgdmFyIG0gPSB1cmwudG9TdHJpbmcoKS5tYXRjaChTVkcucmVnZXgucmVmZXJlbmNlKVxyXG5cclxuICBpZiAobSkgcmV0dXJuIG1bMV1cclxufVxyXG5cclxuLy8gQ3JlYXRlIG1hdHJpeCBhcnJheSBmb3IgbG9vcGluZ1xyXG52YXIgYWJjZGVmID0gJ2FiY2RlZicuc3BsaXQoJycpXG4vLyBBZGQgQ3VzdG9tRXZlbnQgdG8gSUU5IGFuZCBJRTEwXHJcbmlmICh0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ICE9PSAnZnVuY3Rpb24nKSB7XHJcbiAgLy8gQ29kZSBmcm9tOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQ3VzdG9tRXZlbnRcclxuICB2YXIgQ3VzdG9tRXZlbnQgPSBmdW5jdGlvbihldmVudCwgb3B0aW9ucykge1xyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwgeyBidWJibGVzOiBmYWxzZSwgY2FuY2VsYWJsZTogZmFsc2UsIGRldGFpbDogdW5kZWZpbmVkIH1cclxuICAgIHZhciBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50JylcclxuICAgIGUuaW5pdEN1c3RvbUV2ZW50KGV2ZW50LCBvcHRpb25zLmJ1YmJsZXMsIG9wdGlvbnMuY2FuY2VsYWJsZSwgb3B0aW9ucy5kZXRhaWwpXHJcbiAgICByZXR1cm4gZVxyXG4gIH1cclxuXHJcbiAgQ3VzdG9tRXZlbnQucHJvdG90eXBlID0gd2luZG93LkV2ZW50LnByb3RvdHlwZVxyXG5cclxuICB3aW5kb3cuQ3VzdG9tRXZlbnQgPSBDdXN0b21FdmVudFxyXG59XHJcblxyXG4vLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgLyBjYW5jZWxBbmltYXRpb25GcmFtZSBQb2x5ZmlsbCB3aXRoIGZhbGxiYWNrIGJhc2VkIG9uIFBhdWwgSXJpc2hcclxuKGZ1bmN0aW9uKHcpIHtcclxuICB2YXIgbGFzdFRpbWUgPSAwXHJcbiAgdmFyIHZlbmRvcnMgPSBbJ21veicsICd3ZWJraXQnXVxyXG5cclxuICBmb3IodmFyIHggPSAwOyB4IDwgdmVuZG9ycy5sZW5ndGggJiYgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsreCkge1xyXG4gICAgdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3W3ZlbmRvcnNbeF0gKyAnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ11cclxuICAgIHcuY2FuY2VsQW5pbWF0aW9uRnJhbWUgID0gd1t2ZW5kb3JzW3hdICsgJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ10gfHxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd1t2ZW5kb3JzW3hdICsgJ0NhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZSddXHJcbiAgfVxyXG5cclxuICB3LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHcucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgICBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gICAgICB2YXIgY3VyclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKVxyXG4gICAgICB2YXIgdGltZVRvQ2FsbCA9IE1hdGgubWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKVxyXG5cclxuICAgICAgdmFyIGlkID0gdy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbClcclxuICAgICAgfSwgdGltZVRvQ2FsbClcclxuXHJcbiAgICAgIGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsXHJcbiAgICAgIHJldHVybiBpZFxyXG4gICAgfVxyXG5cclxuICB3LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCB3LmNsZWFyVGltZW91dDtcclxuXHJcbn0od2luZG93KSlcclxuXHJcbnJldHVybiBTVkdcclxuXHJcbn0pKTtcciIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHsgY29sb3JzIH0gZnJvbSAnLi9zdHlsZSc7XG5pbXBvcnQgeyBtYWtlaWQgfSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0IHsgZWxlbWVudFR5cGUsIFBvaW50MkQgfSBmcm9tICcuL2NsYXNzZXMnO1xuXG5sZXQgZGVmYXVsdF9jaXJjbGVfcmFkaXVzID0gMTA7XG5cbmV4cG9ydCBjbGFzcyBDaXJjbGUge1xuICBfaWQ6IHN0cmluZztcbiAgX3R5cGU6IGVsZW1lbnRUeXBlO1xuICBtZXRhOiBhbnk7XG4gIGNlbnRlcjogUG9pbnQyRDtcbiAgcmFkaXVzOiBudW1iZXI7XG4gIGNvbG9yczogYW55O1xuXG4gIHdlaWdodDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKGN4OiBudW1iZXIsIGN5OiBudW1iZXIsIHJhZGl1czogbnVtYmVyLCBpZD86IHN0cmluZywgX2NvbG9ycz86IGFueSl7XG4gICAgdGhpcy5faWQgPSBpZCB8fCBtYWtlaWQoKTtcbiAgICB0aGlzLl90eXBlID0gZWxlbWVudFR5cGUuQ2lyY2xlO1xuICAgIHRoaXMubWV0YSA9IHt9O1xuICAgIHRoaXMuY2VudGVyID0gbmV3IFBvaW50MkQoY3gsIGN5KTtcbiAgICB0aGlzLnJhZGl1cyA9IHJhZGl1cyB8fCBkZWZhdWx0X2NpcmNsZV9yYWRpdXM7XG4gICAgdGhpcy5jb2xvcnMgPSBfY29sb3JzIHx8IGNvbG9ycztcblxuICAgIHRoaXMud2VpZ2h0ID0gTWF0aC5QSSAqICh0aGlzLnJhZGl1cyoqMik7XG4gIH1cblxuICBnZXRXZWlnaHQoKXtcbiAgICByZXR1cm4gdGhpcy53ZWlnaHQ7XG4gIH1cblxuICBnZXRDb2xvcnMoKXtcbiAgICByZXR1cm4gdGhpcy5jb2xvcnM7XG4gIH1cblxuICBzZXRJZChpZDogc3RyaW5nKXtcbiAgICB0aGlzLl9pZCA9IGlkO1xuICB9XG5cbiAgZ2V0MkRDZW50ZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMuY2VudGVyO1xuICB9XG5cbiAgbW92ZShwb2ludHM6IFBvaW50MkRbXSl7XG4gICAgdGhpcy5jZW50ZXIgPSBwb2ludHNbMF07XG4gIH1cblxuICBnZXQyRFBhdGgoKXtcbiAgICBsZXQgcGF0aCA9IFt0aGlzLmNlbnRlcl07XG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBnZXRSYWRpdXMoKXtcbiAgICByZXR1cm4gdGhpcy5yYWRpdXM7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGNsYXNzIFBvaW50MkQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcblxuICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlcil7XG4gICAgdGhpcy54ID0geCB8fCAwO1xuICAgIHRoaXMueSA9IHkgfHwgMDtcbiAgfVxuXG4gIGFkZCA9IGZ1bmN0aW9uIChwb2ludDogUG9pbnQyRCkge1xuICAgICAgdGhpcy54ICs9IHBvaW50Lng7XG4gICAgICB0aGlzLnkgKz0gcG9pbnQueTtcbiAgfTtcblxuICBzdWJ0cmFjdCA9IGZ1bmN0aW9uIChwb2ludDogUG9pbnQyRCkge1xuICAgIHRoaXMueCAtPSBwb2ludC54O1xuICAgIHRoaXMueSAtPSBwb2ludC55O1xuICB9O1xuXG4gIG11bHRpcGx5ID0gZnVuY3Rpb24gKHBvaW50OiBQb2ludDJEKSB7XG4gICAgdGhpcy54ICo9IHBvaW50Lng7XG4gICAgdGhpcy55ICo9IHBvaW50Lnk7XG4gIH07XG5cbiAgbXVsdGlwbHlTY2FsYXIgPSBmdW5jdGlvbiAoc2NhbGFyOiBudW1iZXIpIHtcbiAgICB0aGlzLnggKj0gc2NhbGFyO1xuICAgIHRoaXMueSAqPSBzY2FsYXI7XG4gIH07XG5cbiAgZGl2aWRlID0gZnVuY3Rpb24gKHBvaW50OiBQb2ludDJEKSB7XG4gICAgdGhpcy54IC89IHBvaW50Lng7XG4gICAgdGhpcy55IC89IHBvaW50Lnk7XG4gIH07XG5cbiAgZGl2aWRlU2NhbGFyID0gZnVuY3Rpb24gKHNjYWxhcjogbnVtYmVyKSB7XG4gICAgdGhpcy54IC89IHNjYWxhcjtcbiAgICB0aGlzLnkgLz0gc2NhbGFyO1xuICB9O1xuXG4gIGxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KE1hdGgucG93KHRoaXMueCwgMikgKyBNYXRoLnBvdyh0aGlzLnksIDIpKTtcbiAgfTtcblxuICBub3JtYWxpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5kaXZpZGVTY2FsYXIodGhpcy5sZW5ndGgoKSk7XG4gIH07XG59XG5cbmV4cG9ydCBjbGFzcyBQb2ludDNEIHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG4gIHo6IG51bWJlcjtcblxuICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKXtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy56ID0gejtcbiAgfVxufVxuXG5leHBvcnQgZW51bSBlbGVtZW50VHlwZSB7XG4gIENpcmNsZSxcbiAgTGluZVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIGVsZW1lbnQge1xuICBfaWQ6IHN0cmluZztcbiAgX3R5cGU6IGVsZW1lbnRUeXBlO1xuICBzZXRJZD86IChfOnN0cmluZykgPT4gYW55O1xuICBtZXRhOiBhbnk7XG5cbiAgZ2V0UmFkaXVzPzogKCkgPT4gbnVtYmVyO1xuICBnZXQyRFBhdGg/OiAoKSA9PiBQb2ludDJEW107XG4gIGdldDJEQ2VudGVyPzogKCkgPT4gUG9pbnQyRDtcbiAgZ2V0V2lkdGg/OiAoKSA9PiBudW1iZXI7XG4gIGdldENvbG9yczogKCkgPT4gYW55O1xuICBnZXRXZWlnaHQ6ICgpID0+IG51bWJlcjtcblxuICBtb3ZlPzogKF86UG9pbnQyRFtdKSA9PiBhbnk7XG59XG4iLCJleHBvcnQgbGV0IGNvbnN0YW50cyA9IHtcbiAgJ3BpeGVsc19wZXJfZnVlbCc6IDIwLFxuICAncm9ja2V0c19jb3VudCc6IDUwLFxuICAndGlja19pbnRlcnZhbF9tcyc6IDUwXG59XG4iLCJleHBvcnQgZnVuY3Rpb24gbWFrZWlkKCkge1xuICB2YXIgdGV4dCA9IFwiXCI7XG4gIHZhciBwb3NzaWJsZSA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlcIjtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IDU7IGkrKyl7XG4gICAgdGV4dCArPSBwb3NzaWJsZS5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGUubGVuZ3RoKSk7XG4gIH1cblxuICByZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEaWN0aW9uYXJ5PFQ+IHtcbiAgICBbSzogc3RyaW5nXTogVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhbmRvbUFyYml0cmFyeShtaW46IG51bWJlciwgbWF4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmFuZG9tSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcikge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGlja1JhbmRvbUZyb21BcnJheShhcnJheTogYW55W10pIHtcbiAgcmV0dXJuIGFycmF5W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFycmF5Lmxlbmd0aCldO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuL3N0eWxlJztcbmltcG9ydCB7IG1ha2VpZCB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBlbGVtZW50VHlwZSwgUG9pbnQyRCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5cbmV4cG9ydCBjbGFzcyBMaW5lIHtcbiAgX2lkOiBzdHJpbmc7XG4gIF90eXBlOiBlbGVtZW50VHlwZTtcbiAgbWV0YTogYW55O1xuICBzdGFydDogUG9pbnQyRDtcbiAgZW5kOiBQb2ludDJEO1xuICBjb2xvcnM6IGFueTtcbiAgd2VpZ2h0OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlciwgaWQ/OnN0cmluZywgX2NvbG9ycz86IGFueSl7XG4gICAgdGhpcy5faWQgPSBpZCB8fCBtYWtlaWQoKTtcbiAgICB0aGlzLl90eXBlID0gZWxlbWVudFR5cGUuTGluZTtcbiAgICB0aGlzLm1ldGEgPSB7fTtcbiAgICB0aGlzLnN0YXJ0ID0gbmV3IFBvaW50MkQoeDEsIHkxKTtcbiAgICB0aGlzLmVuZCA9IG5ldyBQb2ludDJEKHgyLCB5Mik7XG5cbiAgICB0aGlzLmNvbG9ycyA9IF9jb2xvcnMgfHwgY29sb3JzO1xuICAgIHRoaXMud2VpZ2h0ID0gTWF0aC5zcXJ0KFxuICAgICAgKHkxIC0geTIpKioyICtcbiAgICAgICh4MSAtIHgyKSoqMlxuICAgICk7XG4gIH1cblxuICBnZXRXZWlnaHQoKXtcbiAgICByZXR1cm4gdGhpcy53ZWlnaHQ7XG4gIH1cblxuICBnZXRDb2xvcnMoKXtcbiAgICByZXR1cm4gdGhpcy5jb2xvcnM7XG4gIH1cblxuICBzZXRJZChpZDogc3RyaW5nKXtcbiAgICB0aGlzLl9pZCA9IGlkO1xuICB9XG5cbiAgZ2V0MkRDZW50ZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBQb2ludDJEKFxuICAgICAgKHRoaXMuc3RhcnQueCArIHRoaXMuZW5kLngpLzIsXG4gICAgICAodGhpcy5zdGFydC55ICsgdGhpcy5lbmQueSkvMlxuICAgICk7XG4gIH1cblxuICBtb3ZlKHBvaW50czogUG9pbnQyRFtdKXtcbiAgICB0aGlzLnN0YXJ0ID0gcG9pbnRzWzBdO1xuICAgIHRoaXMuZW5kID0gcG9pbnRzWzFdO1xuICB9XG5cbiAgZ2V0MkRQYXRoKCl7XG4gICAgbGV0IHBhdGggPSBbXG4gICAgICB0aGlzLnN0YXJ0LFxuICAgICAgdGhpcy5lbmRcbiAgICBdO1xuXG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBnZXRSYWRpdXMoKXtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KFxuICAgICAgKHRoaXMuc3RhcnQueSAtIHRoaXMuZW5kLnkpKioyICtcbiAgICAgICh0aGlzLnN0YXJ0LnggLSB0aGlzLmVuZC54KSoqMlxuICAgICk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFNjZW5lIH0gZnJvbSAnLi9zY2VuZSc7XG5pbXBvcnQgeyBSb2NrZXQgfSBmcm9tICcuL3JvY2tldCc7XG5pbXBvcnQgeyBQb2ludDJEIH0gZnJvbSAnLi9jbGFzc2VzJztcbmltcG9ydCB7IGNvbnN0YW50cyB9IGZyb20gJy4vY29uc3RhbnRzJztcblxubGV0IHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG5sZXQgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xubGV0IG1pbl9zaWRlID0gTWF0aC5taW4od2lkdGgsIGhlaWdodCk7XG5cbmZ1bmN0aW9uIHNldFVwKHNjZW5lOiBTY2VuZSl7XG4gIGxldCBiaWdfb2JzdGFjbGUgPSBzY2VuZS5hZGRFbGVtZW50KFxuICAgICdjaXJjbGUnLFxuICAgIHtcbiAgICAgICdjeCc6IHdpZHRoIC8gMixcbiAgICAgICdjeSc6IG1pbl9zaWRlIC8gMixcbiAgICAgICdyYWRpdXMnOiBtaW5fc2lkZSAvIDEwXG4gICAgfVxuICApO1xuICBsZXQgYmlnX29ic3RhY2xlX2NlbnRlciA9IGJpZ19vYnN0YWNsZS5nZXQyRENlbnRlcigpO1xuICBsZXQgYmlnX29ic3RhY2xlX3JhZGl1cyA9IGJpZ19vYnN0YWNsZS5nZXRSYWRpdXMoKTtcblxuICBsZXQgZGVzdGluYXRpb25fcmFkaXVzID0gYmlnX29ic3RhY2xlX3JhZGl1cyAvIDU7XG4gIGxldCBkZXN0aW5hdGlvbiA9IHNjZW5lLmFkZEVsZW1lbnQoXG4gICAgJ2NpcmNsZScsXG4gICAge1xuICAgICAgJ2N4JzogYmlnX29ic3RhY2xlX2NlbnRlci54ICsgYmlnX29ic3RhY2xlX3JhZGl1cyArIGRlc3RpbmF0aW9uX3JhZGl1cyxcbiAgICAgICdjeSc6IGJpZ19vYnN0YWNsZV9jZW50ZXIueSArIGJpZ19vYnN0YWNsZV9yYWRpdXMgKyBkZXN0aW5hdGlvbl9yYWRpdXMsXG4gICAgICAncmFkaXVzJzogZGVzdGluYXRpb25fcmFkaXVzXG4gICAgfVxuICApO1xuXG4gIGxldCBvcmlnaW5fcmFkaXVzID0gYmlnX29ic3RhY2xlX3JhZGl1cyAvIDc7XG4gIGxldCBvcmlnaW4gPSBzY2VuZS5hZGRFbGVtZW50KFxuICAgICdjaXJjbGUnLFxuICAgIHtcbiAgICAgICdjeCc6IGJpZ19vYnN0YWNsZV9jZW50ZXIueCAtIGJpZ19vYnN0YWNsZV9yYWRpdXMgKiAyIC0gb3JpZ2luX3JhZGl1cyxcbiAgICAgICdjeSc6IGJpZ19vYnN0YWNsZV9jZW50ZXIueSAtIGJpZ19vYnN0YWNsZV9yYWRpdXMgKiAyIC0gb3JpZ2luX3JhZGl1cyxcbiAgICAgICdyYWRpdXMnOiBvcmlnaW5fcmFkaXVzXG4gICAgfVxuICApO1xuXG4gIHNjZW5lLm9yaWdpbiA9IG9yaWdpbjtcbiAgc2NlbmUuZGVzdGluYXRpb24gPSBkZXN0aW5hdGlvbjtcblxuICBzY2VuZS5vYnN0YWNsZXMgPSBbXG4gICAgYmlnX29ic3RhY2xlLFxuICAgIG9yaWdpblxuICBdXG5cbiAgc2NlbmUucmVuZGVyKGNvbnN0YW50c1sndGlja19pbnRlcnZhbF9tcyddKTtcbiAgc2NlbmUuc3RhcnRBY3Rpdml0eShcbiAgICBjb25zdGFudHNbJ3RpY2tfaW50ZXJ2YWxfbXMnXVxuICApO1xuICBzY2VuZS5zdGFydFJvY2tldHMoXG4gICAgY29uc3RhbnRzWydyb2NrZXRzX2NvdW50J11cbiAgKTtcbn1cblxubGV0IHNjZW5lID0gbmV3IFNjZW5lKFxuICB3aWR0aCxcbiAgaGVpZ2h0LFxuICBzZXRVcFxuKVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBnZXRSYW5kb21JbnQsIGdldFJhbmRvbUFyYml0cmFyeSwgcGlja1JhbmRvbUZyb21BcnJheSB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBQb2ludDJELCBlbGVtZW50IH0gZnJvbSAnLi9jbGFzc2VzJztcbmltcG9ydCB7IExpbmUgfSBmcm9tICcuL2xpbmUnO1xuaW1wb3J0IHsgUm91dGluZSwgRGlyZWN0aW9uIH0gZnJvbSAnLi9yb3V0aW5lcyc7XG5cbmV4cG9ydCBjbGFzcyBSb2NrZXQgZXh0ZW5kcyBMaW5lIHtcbiAgcm91dGluZTogUm91dGluZTtcbiAgX2NvdW50OiBudW1iZXI7XG4gIGZ1ZWw6IG51bWJlcjtcblxuICBoYXNfbGFuZGVkOiBib29sZWFuO1xuICBpc19hbGl2ZTogYm9vbGVhbjtcblxuICBvcmlnaW46IGVsZW1lbnQ7XG4gIGRlc3RpbmF0aW9uOiBlbGVtZW50O1xuXG4gIGRpc3RhbmNlX3RvX2Rlc3RpbmF0aW9uOiBudW1iZXI7XG4gIC8vIFNjb3JlIHRvIHN1cnZpdmUgaW4gbmF0dXJhbCBzZWxlY3Rpb25cbiAgc2VsZWN0aW9uX3Njb3JlOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgb3JpZ2luOiBlbGVtZW50LFxuICAgIGRlc3RpbmF0aW9uOiBlbGVtZW50LFxuICAgIGhlaWdodDogbnVtYmVyLFxuICAgIHJvdXRpbmU/OiBSb3V0aW5lXG4gICl7XG4gICAgbGV0IG9yaWdpbl9wb2ludCA9IG9yaWdpbi5nZXQyRENlbnRlcigpO1xuICAgIGxldCBvcmlnaW5fcmFkaXVzID0gb3JpZ2luLmdldFJhZGl1cygpO1xuICAgIGxldCBkZXN0aW5hdGlvbl9wb2ludCA9IGRlc3RpbmF0aW9uLmdldDJEQ2VudGVyKCk7XG4gICAgbGV0IGRlc3RpbmF0aW9uX3JhZGl1cyA9IGRlc3RpbmF0aW9uLmdldFJhZGl1cygpO1xuXG4gICAgc3VwZXIoXG4gICAgICBvcmlnaW5fcG9pbnQueCArIG9yaWdpbl9yYWRpdXMsXG4gICAgICBvcmlnaW5fcG9pbnQueSArIG9yaWdpbl9yYWRpdXMsXG4gICAgICBvcmlnaW5fcG9pbnQueCArIG9yaWdpbl9yYWRpdXMgKyBoZWlnaHQsXG4gICAgICBvcmlnaW5fcG9pbnQueSArIG9yaWdpbl9yYWRpdXNcbiAgICApO1xuXG4gICAgdGhpcy5zZWxlY3Rpb25fc2NvcmUgPSAwO1xuICAgIHRoaXMuaXNfYWxpdmUgPSB0cnVlO1xuICAgIHRoaXMub3JpZ2luID0gb3JpZ2luO1xuICAgIHRoaXMuZGVzdGluYXRpb24gPSBkZXN0aW5hdGlvbjtcbiAgICB0aGlzLl9jb3VudCA9IDA7XG4gICAgdGhpcy5oYXNfbGFuZGVkID0gZmFsc2U7XG5cbiAgICB0aGlzLmRpc3RhbmNlX3RvX2Rlc3RpbmF0aW9uID0gTWF0aC5zcXJ0KFxuICAgICAgKG9yaWdpbl9wb2ludC55IC0gZGVzdGluYXRpb25fcG9pbnQueSkqKjIgK1xuICAgICAgKG9yaWdpbl9wb2ludC54IC0gZGVzdGluYXRpb25fcG9pbnQueCkqKjJcbiAgICApO1xuXG4gICAgLy8gTWF5YmUgd2UgbmVlZCB0byBpbmNyZWFzZSB0aGlzXG4gICAgdGhpcy5mdWVsID0gTWF0aC5yb3VuZCh0aGlzLmRpc3RhbmNlX3RvX2Rlc3RpbmF0aW9uKSAqIDI7XG5cbiAgICBpZihyb3V0aW5lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIENhbGN1bGF0ZSBhbW91bnQgb2YgcG9pbnRzIHRvIGFjaGlldmUgdGhlIGRlc3RpbmF0aW9uXG4gICAgICBsZXQgcm91dGluZXNfY291bnQgPSB0aGlzLmRpc3RhbmNlX3RvX2Rlc3RpbmF0aW9uO1xuICAgICAgdGhpcy5yb3V0aW5lID0gbmV3IFJvdXRpbmUocm91dGluZXNfY291bnQpO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5yb3V0aW5lID0gcm91dGluZTtcbiAgICB9XG4gIH1cblxuICBjcmFzaChlbDogZWxlbWVudCl7XG4gICAgaWYoZWwgPT09IHRoaXMuZGVzdGluYXRpb24pe1xuICAgICAgdGhpcy5oYXNfbGFuZGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuaXNfYWxpdmUgPSB0cnVlO1xuICAgICAgdGhpcy5kaXN0YW5jZV90b19kZXN0aW5hdGlvbiA9IDE7XG5cbiAgICAgIHRoaXMuY2FsY3VsYXRlU2NvcmUoKTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuaXNfYWxpdmUgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2VsZWN0aW9uX3Njb3JlIC89IDEwO1xuICAgIH1cbiAgfVxuXG4gIGNhbGN1bGF0ZVNjb3JlKCl7XG4gICAgaWYodGhpcy5oYXNfbGFuZGVkKXtcbiAgICAgIHRoaXMuc2VsZWN0aW9uX3Njb3JlID0gMTtcbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuc2VsZWN0aW9uX3Njb3JlID0gMS90aGlzLmRpc3RhbmNlX3RvX2Rlc3RpbmF0aW9uO1xuICAgIH1cbiAgfVxuXG4gIGdldFJvdXRpbmUoKXtcbiAgICByZXR1cm4gdGhpcy5yb3V0aW5lO1xuICB9XG5cbiAgZ2V0Um91dGluZURpcmVjdGlvbigpe1xuICAgIHZhciBkaXJlY3Rpb246IERpcmVjdGlvbjtcbiAgICBpZih0aGlzLl9jb3VudCA8IHRoaXMucm91dGluZS5kaXJlY3Rpb25zLmxlbmd0aCl7XG4gICAgICBkaXJlY3Rpb24gPSB0aGlzLnJvdXRpbmUuZGlyZWN0aW9uc1t0aGlzLl9jb3VudF07XG4gICAgfVxuICAgIHJldHVybiBkaXJlY3Rpb247XG4gIH1cblxuICBsb29rdXBOZXh0Um91dGluZURpcmVjdGlvbigpe1xuICAgIHZhciBkaXJlY3Rpb246IERpcmVjdGlvbjtcbiAgICBpZih0aGlzLl9jb3VudCArIDEgPCB0aGlzLnJvdXRpbmUuZGlyZWN0aW9ucy5sZW5ndGgpe1xuICAgICAgZGlyZWN0aW9uID0gdGhpcy5yb3V0aW5lLmRpcmVjdGlvbnNbdGhpcy5fY291bnQrMV07XG4gICAgfVxuICAgIHJldHVybiBkaXJlY3Rpb247XG4gIH1cblxuICBnZXROZXh0Um91dGluZURpcmVjdGlvbigpe1xuICAgIHZhciBkaXJlY3Rpb246IERpcmVjdGlvbjtcbiAgICB0aGlzLl9jb3VudCArPSAxO1xuICAgIGlmKHRoaXMuX2NvdW50IDwgdGhpcy5yb3V0aW5lLmRpcmVjdGlvbnMubGVuZ3RoKXtcbiAgICAgIGRpcmVjdGlvbiA9IHRoaXMucm91dGluZS5kaXJlY3Rpb25zW3RoaXMuX2NvdW50XTtcbiAgICB9XG4gICAgcmV0dXJuIGRpcmVjdGlvbjtcbiAgfVxuXG4gIHVwZGF0ZSgpe1xuICAgIGlmKCF0aGlzLmhhc19sYW5kZWQgJiYgdGhpcy5pc19hbGl2ZSl7XG4gICAgICBpZih0aGlzLl9jb3VudCA8IHRoaXMucm91dGluZS5kaXJlY3Rpb25zLmxlbmd0aCl7XG4gICAgICAgIGxldCBuZXh0X2RpcmVjdGlvbiA9IHRoaXMubG9va3VwTmV4dFJvdXRpbmVEaXJlY3Rpb24oKTtcbiAgICAgICAgaWYobmV4dF9kaXJlY3Rpb24gIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgbGV0IG5leHRfc3RhcnQgPSBuZXh0X2RpcmVjdGlvbi5nZXROZXdQb2ludCh0aGlzLnN0YXJ0KTtcblxuICAgICAgICAgIHRoaXMuZnVlbCAtPSBNYXRoLnNxcnQoXG4gICAgICAgICAgICAodGhpcy5zdGFydC54IC0gbmV4dF9zdGFydC54KSoqMiArXG4gICAgICAgICAgICAodGhpcy5zdGFydC55IC0gbmV4dF9zdGFydC55KSoqMlxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmlzX2FsaXZlID0gZmFsc2VcbiAgICAgIH1cblxuICAgICAgbGV0IGRlc3RpbmF0aW9uX2NlbnRlciA9IHRoaXMuZGVzdGluYXRpb24uZ2V0MkRDZW50ZXIoKTtcbiAgICAgIGxldCBkZXN0aW5hdGlvbl9yYWRpdXMgPSB0aGlzLmRlc3RpbmF0aW9uLmdldFJhZGl1cygpO1xuXG4gICAgICBsZXQgYXdheV9mcm9tX2Rlc3RpbmF0aW9uID0gTWF0aC5zcXJ0KFxuICAgICAgICAodGhpcy5zdGFydC55IC0gZGVzdGluYXRpb25fY2VudGVyLnkpKioyICtcbiAgICAgICAgKHRoaXMuc3RhcnQueCAtIGRlc3RpbmF0aW9uX2NlbnRlci54KSoqMlxuICAgICAgKTtcbiAgICAgIGlmKGF3YXlfZnJvbV9kZXN0aW5hdGlvbiA8IHRoaXMuZGlzdGFuY2VfdG9fZGVzdGluYXRpb24pIHtcbiAgICAgICAgdGhpcy5kaXN0YW5jZV90b19kZXN0aW5hdGlvbiA9IGF3YXlfZnJvbV9kZXN0aW5hdGlvbjtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgZnVlbFxuICAgICAgaWYodGhpcy5mdWVsIDw9IDApe1xuICAgICAgICB0aGlzLmlzX2FsaXZlID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmKHRoaXMuaXNfYWxpdmUpe1xuICAgICAgICBsZXQgZGlyZWN0aW9uID0gdGhpcy5nZXROZXh0Um91dGluZURpcmVjdGlvbigpO1xuXG4gICAgICAgIGlmKGRpcmVjdGlvbiAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICB0aGlzLnN0YXJ0ID0gZGlyZWN0aW9uLmdldE5ld1BvaW50KHRoaXMuc3RhcnQpO1xuICAgICAgICAgIHRoaXMuZW5kID0gZGlyZWN0aW9uLmdldE5ld1BvaW50KHRoaXMuZW5kKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgdGhpcy5pc19hbGl2ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmNhbGN1bGF0ZVNjb3JlKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0VHJhamVjdG9yeSgpe1xuICAgIHZhciB0cmFqZWN0b3J5ID0gXCJcIjtcbiAgICB2YXIgc3RhcnQgPSB0aGlzLnN0YXJ0O1xuICAgIHZhciBlbmQgPSB0aGlzLmVuZDtcblxuICAgIHRyYWplY3RvcnkgKz0gYCR7TWF0aC5yb3VuZChzdGFydC54KX0sJHtNYXRoLnJvdW5kKHN0YXJ0LnkpfSAke01hdGgucm91bmQoZW5kLngpfSwke01hdGgucm91bmQoZW5kLnkpfSBgO1xuICAgIGZvcihsZXQgZGlyZWN0aW9uIG9mIHRoaXMuZ2V0Um91dGluZSgpLmRpcmVjdGlvbnMpe1xuICAgICAgc3RhcnQgPSBkaXJlY3Rpb24uZ2V0TmV3UG9pbnQoc3RhcnQpO1xuICAgICAgZW5kID0gZGlyZWN0aW9uLmdldE5ld1BvaW50KGVuZCk7XG4gICAgICB0cmFqZWN0b3J5ICs9IGAke01hdGgucm91bmQoc3RhcnQueCl9LCR7TWF0aC5yb3VuZChzdGFydC55KX0gJHtNYXRoLnJvdW5kKGVuZC54KX0sJHtNYXRoLnJvdW5kKGVuZC55KX0gYDtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJhamVjdG9yeTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgbWFrZWlkLCBnZXRSYW5kb21JbnQsIGdldFJhbmRvbUFyYml0cmFyeSwgcGlja1JhbmRvbUZyb21BcnJheSB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBQb2ludDJEIH0gZnJvbSAnLi9jbGFzc2VzJztcbmltcG9ydCB7IGNvbnN0YW50cyB9IGZyb20gJy4vY29uc3RhbnRzJztcblxuZXhwb3J0IGNsYXNzIERpcmVjdGlvbiB7XG4gIGFuZ2xlOiBudW1iZXI7XG4gIGRpc3RhbmNlOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoYW5nbGU/OiBudW1iZXIsIGRpc3RhbmNlPzogbnVtYmVyKXtcbiAgICB0aGlzLmFuZ2xlID0gYW5nbGUgfHwgZ2V0UmFuZG9tSW50KC0zNjAsIDM2MCk7XG4gICAgdGhpcy5kaXN0YW5jZSA9IGRpc3RhbmNlIHx8IGdldFJhbmRvbUludChcbiAgICAgIDEsXG4gICAgICBjb25zdGFudHNbJ3BpeGVsc19wZXJfZnVlbCddXG4gICAgKTtcbiAgfVxuXG4gIGdldE5ld1BvaW50KHBvaW50OiBQb2ludDJEKXtcbiAgICBsZXQgbmV3X3BvaW50ID0gbmV3IFBvaW50MkQoMCwgMCk7XG5cbiAgICBuZXdfcG9pbnQueCA9IE1hdGgucm91bmQoXG4gICAgICBNYXRoLmNvcyh0aGlzLmFuZ2xlICogTWF0aC5QSSAvIDE4MCkgKiB0aGlzLmRpc3RhbmNlICsgcG9pbnQueFxuICAgICk7XG4gICAgbmV3X3BvaW50LnkgPSBNYXRoLnJvdW5kKFxuICAgICAgTWF0aC5zaW4odGhpcy5hbmdsZSAqIE1hdGguUEkgLyAxODApICogdGhpcy5kaXN0YW5jZSArIHBvaW50LnlcbiAgICApO1xuXG4gICAgcmV0dXJuIG5ld19wb2ludDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUm91dGluZSB7XG4gIF9pZDogc3RyaW5nO1xuICBkaXJlY3Rpb25zOiBEaXJlY3Rpb25bXTtcblxuICBjb25zdHJ1Y3RvcihtYXhfZGlyZWN0aW9ucz86IG51bWJlciwgZGlyZWN0aW9ucz86IERpcmVjdGlvbltdKXtcbiAgICB0aGlzLl9pZCA9IG1ha2VpZCgpO1xuICAgIHRoaXMuZGlyZWN0aW9ucyA9IFtdO1xuXG4gICAgaWYobWF4X2RpcmVjdGlvbnMgPT09IHVuZGVmaW5lZCl7XG4gICAgICBtYXhfZGlyZWN0aW9ucyA9IDEwMDtcbiAgICB9XG5cbiAgICBpZihkaXJlY3Rpb25zID09PSB1bmRlZmluZWQpe1xuICAgICAgZm9yKGxldCBpID0gMDsgaSA8IG1heF9kaXJlY3Rpb25zOyBpKyspe1xuICAgICAgICB0aGlzLmRpcmVjdGlvbnNbaV0gPSBuZXcgRGlyZWN0aW9uKClcbiAgICAgIH1cbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMuZGlyZWN0aW9ucyA9IGRpcmVjdGlvbnM7XG4gICAgfVxuICB9XG5cbiAgY3Jvc3NPdmVyKHJvdXRpbmU6IFJvdXRpbmUpe1xuICAgIHZhciBuZXdfZGlyZWN0aW9ucyA9IFtdO1xuICAgIHZhciBwYXJlbnRzID0gW1xuICAgICAgdGhpcy5kaXJlY3Rpb25zLFxuICAgICAgcm91dGluZS5kaXJlY3Rpb25zLFxuICAgIF1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcm91dGluZS5kaXJlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBuZXdfZGlyZWN0aW9uc1tpXSA9IHBhcmVudHNbXG4gICAgICAgIE1hdGgucm91bmQoXG4gICAgICAgICAgTWF0aC5yYW5kb20oKVxuICAgICAgICApXG4gICAgICBdW2ldXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBSb3V0aW5lKDAsIG5ld19kaXJlY3Rpb25zKTtcbiAgfVxuXG4gIG11dGF0ZSgpe1xuICAgIGxldCBtdXRhdGlvbl9yYXRlID0gMC4wMTtcbiAgICBmb3IobGV0IGkgPSAwOyBpIDwgdGhpcy5kaXJlY3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZihnZXRSYW5kb21BcmJpdHJhcnkoMCwgMSkgPCBtdXRhdGlvbl9yYXRlKXtcbiAgICAgICAgdGhpcy5kaXJlY3Rpb25zW2ldID0gbmV3IERpcmVjdGlvbigpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoID1cIi4uL25vZGVfbW9kdWxlcy9AdHlwZXMvanF1ZXJ5L2luZGV4LmQudHNcIi8+XG5cbmltcG9ydCAqIGFzIFNWRyBmcm9tIFwic3ZnLmpzXCI7XG5cbid1c2Ugc3RyaWN0JztcbmltcG9ydCB7IERpY3Rpb25hcnksIG1ha2VpZCwgcGlja1JhbmRvbUZyb21BcnJheSB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBlbGVtZW50LCBlbGVtZW50VHlwZSwgUG9pbnQyRCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5pbXBvcnQgeyBDaXJjbGUgfSBmcm9tICcuL2NpcmNsZSc7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSAnLi9saW5lJztcbmltcG9ydCB7IFJvY2tldCB9IGZyb20gJy4vcm9ja2V0JztcbmltcG9ydCB7IFJvdXRpbmUgfSBmcm9tICcuL3JvdXRpbmVzJztcblxuZXhwb3J0IGNsYXNzIFNjZW5lIHtcbiAgY2FudmFzOiBzdmdqcy5Db250YWluZXI7XG4gIGVsZW1lbnRzOiBlbGVtZW50W107XG4gIHN2Z19vYnN0YWNsZXM6IHN2Z2pzLlNoYXBlW107XG4gIG9ic3RhY2xlczogZWxlbWVudFtdO1xuICBzdmdfZWxlbWVudHM6IERpY3Rpb25hcnk8c3ZnanMuRWxlbWVudD47XG4gIHJvY2tldHM6IFJvY2tldFtdO1xuXG4gIC8vIEdlbmVyYXRpb24gSW5mb3JtYXRpb25cbiAgb3JpZ2luOiBlbGVtZW50O1xuICBkZXN0aW5hdGlvbjogZWxlbWVudDtcbiAgdGV4dF9lbGVtZW50OiBzdmdqcy5UZXh0O1xuICBnZW5lcmF0aW9uX2luZm86IGFueTtcblxuICAvLyBVSSBTZXR0aW5nc1xuICBjZW50ZXI6IFBvaW50MkQ7XG4gIG1pbl9zaWRlOiBudW1iZXI7XG4gIHJvY2tldHNfY291bnQ6IG51bWJlciA9IDIwO1xuXG4gIGNvbnN0cnVjdG9yKHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBzZXRVcDogKF86U2NlbmUpID0+IGFueSkge1xuICAgIHRoaXMuZ2VuZXJhdGlvbl9pbmZvID0ge1xuICAgICAgJ2dlbmVyYXRpb25fbnVtYmVyJzogMCxcbiAgICAgICd0b3RhbF9yb2NrZXRzJzogMCxcbiAgICAgICdyb2NrZXRzX2xhbmRlZCc6IDAsXG4gICAgICAnbWF4X3JvY2tldHNfbGFuZGVkJzogMFxuICAgIH07XG4gICAgdGhpcy5vYnN0YWNsZXMgPSBbXTtcbiAgICB0aGlzLnN2Z19vYnN0YWNsZXMgPSBbXTtcbiAgICB0aGlzLmVsZW1lbnRzID0gW107XG4gICAgdGhpcy5yb2NrZXRzID0gW107XG4gICAgdGhpcy5zdmdfZWxlbWVudHMgPSB7fTtcbiAgICB0aGlzLm1pbl9zaWRlID0gTWF0aC5taW4oXG4gICAgICB3aWR0aCxcbiAgICAgIGhlaWdodFxuICAgICk7XG4gICAgdGhpcy5jZW50ZXIgPSBuZXcgUG9pbnQyRChcbiAgICAgIHRoaXMubWluX3NpZGUgLyAyLFxuICAgICAgdGhpcy5taW5fc2lkZSAvIDJcbiAgICApO1xuXG4gICAgJCgoKSA9PiB7XG4gICAgICBsZXQgY2FudmFzID0gU1ZHKCdjYW52YXMnKTtcbiAgICAgIGNhbnZhcy5zaXplKHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcy5uZXN0ZWQoKTtcbiAgICAgIHNldFVwKHRoaXMpO1xuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlR2VuZXJhdGlvbkluZm8oKXtcbiAgICB0aGlzLmdlbmVyYXRpb25faW5mb1snZ2VuZXJhdGlvbl9udW1iZXInXSArPSAxO1xuICAgIHRoaXMuZ2VuZXJhdGlvbl9pbmZvWyd0b3RhbF9yb2NrZXRzJ10gPSB0aGlzLnJvY2tldHMubGVuZ3RoO1xuICAgIHRoaXMuZ2VuZXJhdGlvbl9pbmZvWydyb2NrZXRzX2xhbmRlZCddID0gMDtcblxuICAgIGZvcihsZXQgcm9ja2V0IG9mIHRoaXMucm9ja2V0cyl7XG4gICAgICBpZihyb2NrZXQuaGFzX2xhbmRlZCl7XG4gICAgICAgIHRoaXMuZ2VuZXJhdGlvbl9pbmZvWydyb2NrZXRzX2xhbmRlZCddICs9IDFcbiAgICAgIH1cbiAgICB9XG4gICAgaWYodGhpcy5nZW5lcmF0aW9uX2luZm9bJ3JvY2tldHNfbGFuZGVkJ10gPiB0aGlzLmdlbmVyYXRpb25faW5mb1snbWF4X3JvY2tldHNfbGFuZGVkJ10pe1xuICAgICAgdGhpcy5nZW5lcmF0aW9uX2luZm9bJ21heF9yb2NrZXRzX2xhbmRlZCddID0gdGhpcy5nZW5lcmF0aW9uX2luZm9bJ3JvY2tldHNfbGFuZGVkJ107XG4gICAgfVxuXG4gICAgbGV0IHRleHQgPSBgR2VuZXJhdGlvbiAke3RoaXMuZ2VuZXJhdGlvbl9pbmZvWydnZW5lcmF0aW9uX251bWJlciddfTogXFxuIFxcXG4gICAgICBMYW5kZWQ6ICR7dGhpcy5nZW5lcmF0aW9uX2luZm9bJ3JvY2tldHNfbGFuZGVkJ119IFxcbiBcXFxuICAgICAgTWF4IExhbmRlZDogJHt0aGlzLmdlbmVyYXRpb25faW5mb1snbWF4X3JvY2tldHNfbGFuZGVkJ119IFxcbiBcXFxuICAgICAgVG90YWw6ICR7dGhpcy5yb2NrZXRzLmxlbmd0aH0gXFxuIFxcXG4gICAgYFxuXG4gICAgaWYodGhpcy50ZXh0X2VsZW1lbnQgPT09IHVuZGVmaW5lZCl7XG4gICAgICB0aGlzLnRleHRfZWxlbWVudCA9IHRoaXMuY2FudmFzLnRleHQoXG4gICAgICAgIHRleHRcbiAgICAgICkubW92ZShcbiAgICAgICAgMCwgMFxuICAgICAgKS5mb250KHtcbiAgICAgICAgJ2ZhbWlseSc6ICdJbmNvbnNvbGF0YScsXG4gICAgICAgICdzaXplJzogdGhpcy5taW5fc2lkZSAvIDQ1XG4gICAgICB9KVxuICAgIH1lbHNle1xuICAgICAgdGhpcy50ZXh0X2VsZW1lbnQudGV4dCh0ZXh0KTtcbiAgICB9XG4gIH1cblxuICBhZGRFbGVtZW50KGVsZW1lbnRfdHlwZTogc3RyaW5nLCBwcm9wZXJ0aWVzOiBhbnksIGlkPzogc3RyaW5nLCBjb2xvcnM/OiBhbnkpe1xuICAgIGlmICh0eXBlb2YgcHJvcGVydGllcyAhPT0gJ29iamVjdCcpe1xuICAgICAgcHJvcGVydGllcyA9IHt9XG4gICAgfVxuICAgIHZhciBvYmplY3Q7XG5cbiAgICBzd2l0Y2goZWxlbWVudF90eXBlKXtcbiAgICAgIGNhc2UgJ2NpcmNsZSc6XG4gICAgICAgIGxldCBfY2lyY2xlID0gbmV3IENpcmNsZShcbiAgICAgICAgICBwcm9wZXJ0aWVzWydjeCddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ2N5J10sXG4gICAgICAgICAgcHJvcGVydGllc1sncmFkaXVzJ10sXG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29sb3JzXG4gICAgICAgIClcbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKF9jaXJjbGUpO1xuICAgICAgICBvYmplY3QgPSBfY2lyY2xlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xpbmUnOlxuICAgICAgICBsZXQgX2xpbmUgPSBuZXcgTGluZShcbiAgICAgICAgICBwcm9wZXJ0aWVzWyd4MSddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ3kxJ10sXG4gICAgICAgICAgcHJvcGVydGllc1sneDInXSxcbiAgICAgICAgICBwcm9wZXJ0aWVzWyd5MiddLFxuICAgICAgICAgIGlkLFxuICAgICAgICAgIGNvbG9yc1xuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudHMucHVzaChfbGluZSk7XG4gICAgICAgIG9iamVjdCA9IF9saW5lO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUubG9nKGVsZW1lbnRUeXBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgZHJhd0VsZW1lbnRzKCl7XG4gICAgZm9yKGxldCBlbGVtZW50IG9mIHRoaXMuZWxlbWVudHMpe1xuICAgICAgbGV0IGV4aXN0aW5nX3N2Z19lbGVtZW50ID0gdGhpcy5zdmdfZWxlbWVudHNbZWxlbWVudC5faWRdO1xuICAgICAgbGV0IGNlbnRlcjJkID0gZWxlbWVudC5nZXQyRENlbnRlcigpO1xuICAgICAgbGV0IHBhdGggPSBlbGVtZW50LmdldDJEUGF0aCgpO1xuICAgICAgbGV0IGNvbG9ycyA9IGVsZW1lbnQuZ2V0Q29sb3JzKCk7XG5cbiAgICAgIHN3aXRjaChlbGVtZW50Ll90eXBlKXtcbiAgICAgICAgY2FzZSBlbGVtZW50VHlwZS5DaXJjbGU6XG4gICAgICAgICAgLy8gQ2hlY2sgaWYgYW55IGVsZW1lbnQgd2l0aCBzYW1lIGBfaWRgIGV4aXN0cyBpbiBjYW52YXNcbiAgICAgICAgICAvLyB0aGlzLmNhbnZhcy5oYXMoZWxlbWVudC5zdmdfb2JqZWN0KVxuICAgICAgICAgIGlmKCBleGlzdGluZ19zdmdfZWxlbWVudCA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIGxldCBzdmdfZWxlbWVudCA9IHRoaXMuY2FudmFzLmNpcmNsZShcbiAgICAgICAgICAgICAgZWxlbWVudC5nZXRSYWRpdXMoKSAqIDJcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIC5hdHRyKHtcbiAgICAgICAgICAgICAgICAnY3gnOiBjZW50ZXIyZC54LFxuICAgICAgICAgICAgICAgICdjeSc6IGNlbnRlcjJkLnksXG4gICAgICAgICAgICAgICAgJ2ZpbGwnOiBjb2xvcnNbJ2ZpbGxfY29sb3InXSxcbiAgICAgICAgICAgICAgICAnc3Ryb2tlJzogY29sb3JzWydzdHJva2VfY29sb3InXSxcbiAgICAgICAgICAgICAgICAnc3Ryb2tlLXdpZHRoJzogMVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuc3ZnX2VsZW1lbnRzW2VsZW1lbnQuX2lkXSA9IHN2Z19lbGVtZW50O1xuXG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGluIG9ic3RhY2xlc1xuICAgICAgICAgICAgaWYodGhpcy5vYnN0YWNsZXMuaW5kZXhPZihlbGVtZW50KSAhPSAtMSl7XG4gICAgICAgICAgICAgIHRoaXMuc3ZnX29ic3RhY2xlcy5wdXNoKFxuICAgICAgICAgICAgICAgIHN2Z19lbGVtZW50XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgLy8gUmVkcmF3IG9yIG1vdmVcbiAgICAgICAgICAgIGlmKFxuICAgICAgICAgICAgICBjZW50ZXIyZC54ICE9IGV4aXN0aW5nX3N2Z19lbGVtZW50LmN4KCkgfHxcbiAgICAgICAgICAgICAgY2VudGVyMmQueSAhPSBleGlzdGluZ19zdmdfZWxlbWVudC5jeSgpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQubW92ZShcbiAgICAgICAgICAgICAgICBjZW50ZXIyZC54LFxuICAgICAgICAgICAgICAgIGNlbnRlcjJkLnlcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgZWxlbWVudFR5cGUuTGluZTpcbiAgICAgICAgICBpZiggZXhpc3Rpbmdfc3ZnX2VsZW1lbnQgPT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICBsZXQgc3ZnX2VsZW1lbnQgPSB0aGlzLmNhbnZhcy5saW5lKFxuICAgICAgICAgICAgICBwYXRoWzBdLngsXG4gICAgICAgICAgICAgIHBhdGhbMF0ueSxcbiAgICAgICAgICAgICAgcGF0aFsxXS54LFxuICAgICAgICAgICAgICBwYXRoWzFdLnksXG4gICAgICAgICAgICApLmF0dHIoe1xuICAgICAgICAgICAgICAnZmlsbCc6IGNvbG9yc1snZmlsbF9jb2xvciddLFxuICAgICAgICAgICAgICAnc3Ryb2tlJzogY29sb3JzWydzdHJva2VfY29sb3InXSxcbiAgICAgICAgICAgICAgJ3N0cm9rZS13aWR0aCc6IDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zdmdfZWxlbWVudHNbZWxlbWVudC5faWRdID0gc3ZnX2VsZW1lbnQ7XG5cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgaW4gb2JzdGFjbGVzXG4gICAgICAgICAgICBpZih0aGlzLm9ic3RhY2xlcy5pbmRleE9mKGVsZW1lbnQpICE9IC0xKXtcbiAgICAgICAgICAgICAgdGhpcy5zdmdfb2JzdGFjbGVzLnB1c2goXG4gICAgICAgICAgICAgICAgc3ZnX2VsZW1lbnRcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgLy8gUmVkcmF3IG9yIG1vdmVcbiAgICAgICAgICAgIGlmKFxuICAgICAgICAgICAgICBwYXRoWzBdLnggIT0gZXhpc3Rpbmdfc3ZnX2VsZW1lbnQueCgpIHx8XG4gICAgICAgICAgICAgIHBhdGhbMF0ueSAhPSBleGlzdGluZ19zdmdfZWxlbWVudC55KClcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBleGlzdGluZ19zdmdfZWxlbWVudC5tb3ZlKFxuICAgICAgICAgICAgICAgIHBhdGhbMF0ueCxcbiAgICAgICAgICAgICAgICBwYXRoWzBdLnlcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSByb2NrZXQgLSBjaGVjayBpdCdzIHN0YXR1c1xuICAgICAgICAgICAgZm9yKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKXtcbiAgICAgICAgICAgICAgaWYocm9ja2V0Ll9pZCA9PSBlbGVtZW50Ll9pZCl7XG4gICAgICAgICAgICAgICAgaWYoIXJvY2tldC5pc19hbGl2ZSl7XG4gICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnQocm9ja2V0Ll9pZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJlbW92ZUVsZW1lbnQoaWQ6IHN0cmluZyl7XG4gICAgdmFyIGVsO1xuXG4gICAgZm9yKGxldCBlbGVtZW50IG9mIHRoaXMuZWxlbWVudHMpe1xuICAgICAgaWYoZWxlbWVudC5faWQgPT0gaWQpe1xuICAgICAgICBlbCA9IGVsZW1lbnQ7XG4gICAgICB9XG4gICAgfVxuICAgIGlmKGVsICE9IHVuZGVmaW5lZCl7XG4gICAgICBsZXQgZWxlbWVudF9pbmRleCA9IHRoaXMuZWxlbWVudHMuaW5kZXhPZihlbCk7XG4gICAgICBpZihlbGVtZW50X2luZGV4ICE9IC0xKXtcbiAgICAgICAgdGhpcy5lbGVtZW50cy5zcGxpY2UoZWxlbWVudF9pbmRleCwgMSk7XG4gICAgICAgIGxldCBleGlzdGluZ19zdmdfZWxlbWVudCA9IHRoaXMuc3ZnX2VsZW1lbnRzW2VsLl9pZF07XG4gICAgICAgIGlmKGV4aXN0aW5nX3N2Z19lbGVtZW50ICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGV4aXN0aW5nX3N2Z19lbGVtZW50LnJlbW92ZSgpO1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLnN2Z19lbGVtZW50c1tlbC5faWRdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY2hlY2tDcmFzaGVzKCl7XG4gICAgLy8gUm9ja2V0IGNyYXNlcyBhbnl0aGluZ1xuICAgIGZvcihsZXQgcm9ja2V0IG9mIHRoaXMucm9ja2V0cyl7XG4gICAgICBpZihyb2NrZXQuaXNfYWxpdmUpe1xuICAgICAgICBsZXQgcm9ja2V0X3N2Z19lbGVtZW50ID0gdGhpcy5zdmdfZWxlbWVudHNbcm9ja2V0Ll9pZF07XG4gICAgICAgIGxldCByb2NrZXRfeCA9IFtyb2NrZXQuc3RhcnQueCwgcm9ja2V0LmVuZC54XTtcbiAgICAgICAgbGV0IHJvY2tldF95ID0gW3JvY2tldC5zdGFydC55LCByb2NrZXQuZW5kLnldO1xuXG4gICAgICAgIGZvcihsZXQgZWxlbWVudCBvZiB0aGlzLmVsZW1lbnRzKXtcbiAgICAgICAgICB2YXIgY3Jhc2ggPSBmYWxzZTtcblxuICAgICAgICAgIGxldCBjZW50ZXIyZCA9IGVsZW1lbnQuZ2V0MkRDZW50ZXIoKTtcbiAgICAgICAgICBsZXQgcGF0aCA9IGVsZW1lbnQuZ2V0MkRQYXRoKCk7XG5cbiAgICAgICAgICBsZXQgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQgPSB0aGlzLnN2Z19lbGVtZW50c1tlbGVtZW50Ll9pZF07XG4gICAgICAgICAgc3dpdGNoKGVsZW1lbnQuX3R5cGUpe1xuICAgICAgICAgICAgY2FzZSBlbGVtZW50VHlwZS5DaXJjbGU6XG4gICAgICAgICAgICAgIGxldCBlbGVtZW50X3JhZGl1cyA9IGVsZW1lbnQuZ2V0UmFkaXVzKCk7XG5cbiAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHJvY2tldF94Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICBsZXQgZGlzdGFuY2UgPSBNYXRoLnNxcnQoXG4gICAgICAgICAgICAgICAgICAocm9ja2V0X3hbaV0gLSBjZW50ZXIyZC54KSoqMiArXG4gICAgICAgICAgICAgICAgICAocm9ja2V0X3lbaV0gLSBjZW50ZXIyZC55KSoqMlxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICBpZihkaXN0YW5jZSA8IGVsZW1lbnRfcmFkaXVzKXtcbiAgICAgICAgICAgICAgICAgIGNyYXNoID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGVsZW1lbnRUeXBlLkxpbmU6XG4gICAgICAgICAgICAgIC8vIHRvZG86IHRoaXMgbXVzdCBiZSBmaXhlZFxuXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYoY3Jhc2gpe1xuICAgICAgICAgICAgcm9ja2V0LmNyYXNoKGVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFjdGl2aXR5KCl7XG4gICAgLy8gUGxhbmV0c1xuICAgIHRoaXMuY2hlY2tDcmFzaGVzKCk7XG5cbiAgICAvLyBSb2NrZXRzXG4gICAgdmFyIGRlYWRfcm9ja2V0c19jb3VudCA9IDA7XG4gICAgdmFyIGxhbmRlZF9yb2NrZXRzX2NvdW50ID0gMDtcblxuICAgIGZvciAobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpIHtcbiAgICAgIGlmIChyb2NrZXQuaXNfYWxpdmUpIHtcbiAgICAgICAgaWYocm9ja2V0Lmhhc19sYW5kZWQpe1xuICAgICAgICAgIGxhbmRlZF9yb2NrZXRzX2NvdW50ICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiB0aGlzLmVsZW1lbnRzKSB7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuX2lkID09IHJvY2tldC5faWQpIHtcbiAgICAgICAgICAgIGVsZW1lbnQubW92ZShcbiAgICAgICAgICAgICAgcm9ja2V0LmdldDJEUGF0aCgpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcm9ja2V0LnVwZGF0ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfWVsc2V7XG4gICAgICAgIGRlYWRfcm9ja2V0c19jb3VudCArPSAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZWFkX3JvY2tldHNfY291bnQgKyBsYW5kZWRfcm9ja2V0c19jb3VudCA9PSB0aGlzLnJvY2tldHMubGVuZ3RoXG4gIH1cblxuICBzdGFydEFjdGl2aXR5KFxuICAgIGludGVydmFsOiBudW1iZXJcbiAgKXtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IHJvY2tldHNfcG9vbCA9IHNlbGYuY2FsY1JvY2tldHNTY29yZXMoKTtcbiAgICBsZXQgcm91dGluZXMgPSBzZWxmLnNlbGVjdFJvY2tldHNSb3V0aW5lcyhyb2NrZXRzX3Bvb2wpO1xuICAgIHNlbGYuc3RhcnRSb2NrZXRzKG51bGwsIHJvdXRpbmVzKTtcblxuICAgIGxldCBpbnRlcnZhbF9pZCA9IHNldEludGVydmFsKFxuICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgbGV0IGFjdGl2aXR5X2ZpbmlzaGVkID0gc2VsZi5hY3Rpdml0eSgpO1xuICAgICAgICBpZihhY3Rpdml0eV9maW5pc2hlZCl7XG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxfaWQpO1xuXG4gICAgICAgICAgc2VsZi51cGRhdGVHZW5lcmF0aW9uSW5mbygpO1xuICAgICAgICAgIHNlbGYuc3RhcnRBY3Rpdml0eShcbiAgICAgICAgICAgIGludGVydmFsXG4gICAgICAgICAgKTtcbiAgICAgICAgfTtcbiAgICAgIH0sXG4gICAgICBpbnRlcnZhbFxuICAgICk7XG4gIH1cblxuICBjYWxjUm9ja2V0c1Njb3Jlcygpe1xuICAgIHZhciBtYXhfc2NvcmUgPSAwO1xuICAgIGZvcihsZXQgcm9ja2V0IG9mIHRoaXMucm9ja2V0cyl7XG4gICAgICBpZihyb2NrZXQuc2VsZWN0aW9uX3Njb3JlID4gbWF4X3Njb3JlKXtcbiAgICAgICAgbWF4X3Njb3JlID0gcm9ja2V0LnNlbGVjdGlvbl9zY29yZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpe1xuICAgICAgcm9ja2V0LnNlbGVjdGlvbl9zY29yZSAvPSBtYXhfc2NvcmU7IC8vIEJldHdlZW4gMCBhbmQgMVxuICAgIH1cblxuICAgIHZhciByb2NrZXRzX3Bvb2wgPSBbXTtcbiAgICBmb3IobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpe1xuICAgICAgbGV0IG4gPSByb2NrZXQuc2VsZWN0aW9uX3Njb3JlICogMTAwO1xuICAgICAgZm9yKGxldCBqID0gMDsgaiA8IG47IGorKyl7XG4gICAgICAgIHJvY2tldHNfcG9vbC5wdXNoKHJvY2tldClcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcm9ja2V0c19wb29sO1xuICB9XG5cbiAgc2VsZWN0Um9ja2V0c1JvdXRpbmVzKHJvY2tldHNfcG9vbDogUm9ja2V0W10pe1xuICAgIHZhciByb3V0aW5lcyA9IFtdO1xuICAgIGlmKHJvY2tldHNfcG9vbC5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpe1xuICAgICAgICBsZXQgcm91dGluZUEgPSBwaWNrUmFuZG9tRnJvbUFycmF5KHJvY2tldHNfcG9vbCkuZ2V0Um91dGluZSgpO1xuICAgICAgICBsZXQgcm91dGluZUIgPSBwaWNrUmFuZG9tRnJvbUFycmF5KHJvY2tldHNfcG9vbCkuZ2V0Um91dGluZSgpO1xuICAgICAgICBsZXQgY2hpbGRSb3V0aW5lID0gcm91dGluZUEuY3Jvc3NPdmVyKHJvdXRpbmVCKTtcbiAgICAgICAgY2hpbGRSb3V0aW5lLm11dGF0ZSgpO1xuXG4gICAgICAgIHJvdXRpbmVzLnB1c2goY2hpbGRSb3V0aW5lKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByb3V0aW5lcztcbiAgfVxuXG4gIHJlbmRlcihpbnRlcnZhbDogbnVtYmVyKXtcbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmRyYXdFbGVtZW50cygpLCBpbnRlcnZhbCk7XG4gIH1cblxuICBzdGFydFJvY2tldChyb2NrZXQ6IFJvY2tldCl7XG4gICAgbGV0IF9saW5lID0gdGhpcy5hZGRFbGVtZW50KFxuICAgICAgJ2xpbmUnLFxuICAgICAge1xuICAgICAgICAneDEnOiByb2NrZXQuc3RhcnQueCxcbiAgICAgICAgJ3kxJzogcm9ja2V0LnN0YXJ0LnksXG4gICAgICAgICd4Mic6IHJvY2tldC5lbmQueCxcbiAgICAgICAgJ3kyJzogcm9ja2V0LmVuZC55XG4gICAgICB9LFxuICAgICAgcm9ja2V0Ll9pZCxcbiAgICAgIHtcbiAgICAgICAgZmlsbF9jb2xvcjogJ3JnYmEoMCwgMCwgMCwgMSknLFxuICAgICAgICBzdHJva2VfY29sb3I6ICdyZ2JhKDAsIDAsIDAsIDEpJyxcbiAgICAgICAgZm9udF9jb2xvcjogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMSknLFxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5yb2NrZXRzLnB1c2goXG4gICAgICByb2NrZXRcbiAgICApO1xuICB9XG5cbiAgc3RhcnRSb2NrZXRzKFxuICAgIHJvY2tldHNfY291bnQ/OiBudW1iZXIsXG4gICAgcm91dGluZXM/OiBSb3V0aW5lW11cbiAgKXtcbiAgICBmb3IobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpe1xuICAgICAgdGhpcy5yZW1vdmVFbGVtZW50KHJvY2tldC5faWQpO1xuICAgIH1cbiAgICB0aGlzLnJvY2tldHMgPSBbXTtcblxuICAgIGxldCByb2NrZXRfaGVpZ2h0ID0gdGhpcy5taW5fc2lkZSAvIDEwMDtcblxuICAgIHZhciByb2NrZXRzID0gW107XG4gICAgaWYocm9ja2V0c19jb3VudCA+IDApe1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb2NrZXRzX2NvdW50OyBpKyspIHtcbiAgICAgICAgbGV0IHJvY2tldCA9IG5ldyBSb2NrZXQoXG4gICAgICAgICAgdGhpcy5vcmlnaW4sXG4gICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbixcbiAgICAgICAgICByb2NrZXRfaGVpZ2h0LFxuICAgICAgICApO1xuICAgICAgICByb2NrZXRzLnB1c2goXG4gICAgICAgICAgcm9ja2V0XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfWVsc2UgaWYocm91dGluZXMubGVuZ3RoID4gMCl7XG4gICAgICBmb3IobGV0IHJvdXRpbmUgb2Ygcm91dGluZXMpe1xuICAgICAgICByb2NrZXRzLnB1c2goXG4gICAgICAgICAgbmV3IFJvY2tldChcbiAgICAgICAgICAgIHRoaXMub3JpZ2luLFxuICAgICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbixcbiAgICAgICAgICAgIHJvY2tldF9oZWlnaHQsXG4gICAgICAgICAgICByb3V0aW5lXG4gICAgICAgICAgKVxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb2NrZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnN0YXJ0Um9ja2V0KHJvY2tldHNbaV0pO1xuICAgIH1cbiAgfVxufVxuIiwiZXhwb3J0IGxldCBjb2xvcnMgPSB7XG4gIGZpbGxfY29sb3I6ICdyZ2JhKDE1NywxNjUsMTgwLCAuOSknLFxuICBzdHJva2VfY29sb3I6ICdyZ2JhKDEyNiwgMTMzLCAxNDYsIDEpJyxcbiAgZm9udF9jb2xvcjogJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMSknLFxufVxuIl19

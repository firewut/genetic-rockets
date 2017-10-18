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

},{"./classes":3,"./helpers":4,"./style":10}],3:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var Point2D = /** @class */ (function () {
    function Point2D(x, y) {
        this.add = function (point) {
            return new Point2D(this.x + point.x, this.y + point.y);
        };
        this.subtract = function (point) {
            return new Point2D(this.x - point.x, this.y - point.y);
        };
        this.multiply = function (point) {
            return new Point2D(this.x * point.x, this.y * point.y);
        };
        this.multiplyScalar = function (scalar) {
            return new Point2D(this.x * scalar, this.y * scalar);
        };
        this.divide = function (point) {
            return new Point2D(this.x / point.x, this.y / point.y);
        };
        this.divideScalar = function (scalar) {
            return new Point2D(this.x / scalar, this.y / scalar);
        };
        this.length = function () {
            return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        };
        this.normalize = function () {
            return this.divideScalar(this.length());
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

},{}],5:[function(require,module,exports){
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
        this.meta = {};
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

},{"./classes":3,"./helpers":4,"./style":10}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scene_1 = require("./scene");
var width = window.innerWidth;
var height = window.innerHeight;
var min_side = Math.min(width, height);
function setUp(scene) {
    var sun = scene.addElement('circle', {
        'cx': width / 2,
        'cy': min_side / 2,
        'radius': min_side / 8
    });
    var sun_center = sun.get2DCenter();
    var sun_radius = sun.getRadius();
    var destination_radius = sun_radius / 5;
    var destination = scene.addElement('circle', {
        'cx': sun_center.x + sun_radius + destination_radius,
        'cy': sun_center.y + sun_radius + destination_radius,
        'radius': destination_radius
    });
    var origin_radius = sun_radius / 3;
    var origin = scene.addElement('circle', {
        'cx': sun_center.x - sun_radius - origin_radius,
        'cy': sun_center.y - sun_radius - origin_radius,
        'radius': origin_radius
    });
    scene.origin = origin;
    scene.destination = destination;
    scene.render(50);
    scene.startActivity(50);
    scene.startRockets(50);
}
var scene = new scene_1.Scene(width, height, setUp);

},{"./scene":9}],7:[function(require,module,exports){
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
        _this = _super.call(this, origin_point.x + origin_radius, origin_point.y + origin_radius, origin_point.x + origin_radius + height, origin_point.y + origin_radius, height) || this;
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
    Rocket.prototype.crash = function (el) {
        if (el === this.destination) {
            this.has_landed = true;
            this.is_alive = true;
        }
        else {
            this.is_alive = false;
        }
    };
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
            // if(away_from_destination <= destination_radius){
            //   this.has_landed = true;
            // }else{
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
            // }
            this.calculateScore();
        }
    };
    return Rocket;
}(line_1.Line));
exports.Rocket = Rocket;

},{"./line":5,"./routines":8}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("./helpers");
var classes_1 = require("./classes");
var max_points = 300;
var Routine = /** @class */ (function () {
    function Routine(points) {
        this._id = helpers_1.makeid();
        this.points = [];
        if (points === undefined) {
            for (var i = 0; i < max_points; i++) {
                this.points[i] = new classes_1.Point2D(helpers_1.getRandomArbitrary(-1, 1), helpers_1.getRandomArbitrary(-1, 1));
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
    Routine.prototype.mutate = function () {
        var mutation_rate = 0.01;
        for (var i = 0; i < this.points.length; i++) {
            if (helpers_1.getRandomArbitrary(0, 1) < mutation_rate) {
                this.points[i] = new classes_1.Point2D(helpers_1.getRandomArbitrary(-1, 1), helpers_1.getRandomArbitrary(-1, 1));
            }
        }
    };
    return Routine;
}());
exports.Routine = Routine;

},{"./classes":3,"./helpers":4}],9:[function(require,module,exports){
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
        this.generation_info = [];
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
    Scene.prototype.orbitTrajectory = function (el, around) {
        // let el_center = el.get2DCenter();
        // let radius = Math.sqrt(
        //   (el_center.x - around.x)**2 +
        //   (el_center.y - around.y)**2
        // )
        //
        // if(el.meta['ctr'] === undefined){
        //   el.meta['ctr'] = 0;
        // }
        // if(el.meta['ctr'] == 360){
        //   el.meta['ctr'] = 0;
        // }
        //
        // let x = radius * Math.cos(el.meta['ctr'] * Math.PI / 180.0) + el_center.x;
        // let y = radius * Math.cos(el.meta['ctr'] * Math.PI / 180.0) + el_center.y;
        //
        // el.meta['ctr'] += 1;
        // console.log(radius, el.meta['ctr'])
        // el.move([new Point2D(x,y)]);
    };
    Scene.prototype.checkCrashes = function () {
        // Rocket crases anything
        for (var _i = 0, _a = this.rockets; _i < _a.length; _i++) {
            var rocket = _a[_i];
            if (rocket.is_alive) {
                var rocket_svg_element = this.svg_elements[rocket._id];
                var rocket_x = [rocket.x1, rocket.x2];
                var rocket_y = [rocket.y1, rocket.y2];
                for (var _b = 0, _c = this.elements; _b < _c.length; _b++) {
                    var element = _c[_b];
                    var crash = false;
                    var center2d = element.get2DCenter();
                    var path = element.get2DPath();
                    var width = element.getWidth();
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
        this.orbitTrajectory(this.destination, this.center);
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
                var routineA = helpers_1.pickRandomFromArray(rockets_pool).routine;
                var routineB = helpers_1.pickRandomFromArray(rockets_pool).routine;
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

},{"./circle":2,"./classes":3,"./helpers":4,"./line":5,"./rocket":7,"svg.js":1}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.colors = {
    fill_color: 'rgba(157,165,180, .9)',
    stroke_color: 'rgba(126, 133, 146, 1)',
    font_color: 'rgba(255, 255, 255, 1)',
};

},{}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc3ZnLmpzL2Rpc3Qvc3ZnLmpzIiwic3JjL2NpcmNsZS50cyIsInNyYy9jbGFzc2VzLnRzIiwic3JjL2hlbHBlcnMudHMiLCJzcmMvbGluZS50cyIsInNyYy9tYWluLnRzIiwic3JjL3JvY2tldC50cyIsInNyYy9yb3V0aW5lcy50cyIsInNyYy9zY2VuZS50cyIsInNyYy9zdHlsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3hDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0IsQ0FBQztJQUNILENBQUM7SUFDSCxZQUFDO0FBQUQsQ0FwYkEsQUFvYkMsSUFBQTtBQXBiWSxzQkFBSzs7Ozs7QUNaUCxRQUFBLE1BQU0sR0FBRztJQUNsQixVQUFVLEVBQUUsdUJBQXVCO0lBQ25DLFlBQVksRUFBRSx3QkFBd0I7SUFDdEMsVUFBVSxFQUFFLHdCQUF3QjtDQUNyQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuKiBzdmcuanMgLSBBIGxpZ2h0d2VpZ2h0IGxpYnJhcnkgZm9yIG1hbmlwdWxhdGluZyBhbmQgYW5pbWF0aW5nIFNWRy5cbiogQHZlcnNpb24gMi42LjNcbiogaHR0cHM6Ly9zdmdkb3Rqcy5naXRodWIuaW8vXG4qXG4qIEBjb3B5cmlnaHQgV291dCBGaWVyZW5zIDx3b3V0QG1pY2std291dC5jb20+XG4qIEBsaWNlbnNlIE1JVFxuKlxuKiBCVUlMVDogRnJpIEp1bCAyMSAyMDE3IDE0OjUwOjM3IEdNVCswMjAwIChNaXR0ZWxldXJvcMOkaXNjaGUgU29tbWVyemVpdClcbiovO1xuKGZ1bmN0aW9uKHJvb3QsIGZhY3RvcnkpIHtcclxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcclxuICAgIGRlZmluZShmdW5jdGlvbigpe1xyXG4gICAgICByZXR1cm4gZmFjdG9yeShyb290LCByb290LmRvY3VtZW50KVxyXG4gICAgfSlcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSByb290LmRvY3VtZW50ID8gZmFjdG9yeShyb290LCByb290LmRvY3VtZW50KSA6IGZ1bmN0aW9uKHcpeyByZXR1cm4gZmFjdG9yeSh3LCB3LmRvY3VtZW50KSB9XHJcbiAgfSBlbHNlIHtcclxuICAgIHJvb3QuU1ZHID0gZmFjdG9yeShyb290LCByb290LmRvY3VtZW50KVxyXG4gIH1cclxufSh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogdGhpcywgZnVuY3Rpb24od2luZG93LCBkb2N1bWVudCkge1xyXG5cclxuLy8gVGhlIG1haW4gd3JhcHBpbmcgZWxlbWVudFxyXG52YXIgU1ZHID0gdGhpcy5TVkcgPSBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgaWYgKFNWRy5zdXBwb3J0ZWQpIHtcclxuICAgIGVsZW1lbnQgPSBuZXcgU1ZHLkRvYyhlbGVtZW50KVxyXG5cclxuICAgIGlmKCFTVkcucGFyc2VyLmRyYXcpXHJcbiAgICAgIFNWRy5wcmVwYXJlKClcclxuXHJcbiAgICByZXR1cm4gZWxlbWVudFxyXG4gIH1cclxufVxyXG5cclxuLy8gRGVmYXVsdCBuYW1lc3BhY2VzXHJcblNWRy5ucyAgICA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZydcclxuU1ZHLnhtbG5zID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAveG1sbnMvJ1xyXG5TVkcueGxpbmsgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaydcclxuU1ZHLnN2Z2pzID0gJ2h0dHA6Ly9zdmdqcy5jb20vc3ZnanMnXHJcblxyXG4vLyBTdmcgc3VwcG9ydCB0ZXN0XHJcblNWRy5zdXBwb3J0ZWQgPSAoZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuICEhIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyAmJlxyXG4gICAgICAgICAhISBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHLm5zLCdzdmcnKS5jcmVhdGVTVkdSZWN0XHJcbn0pKClcclxuXHJcbi8vIERvbid0IGJvdGhlciB0byBjb250aW51ZSBpZiBTVkcgaXMgbm90IHN1cHBvcnRlZFxyXG5pZiAoIVNWRy5zdXBwb3J0ZWQpIHJldHVybiBmYWxzZVxyXG5cclxuLy8gRWxlbWVudCBpZCBzZXF1ZW5jZVxyXG5TVkcuZGlkICA9IDEwMDBcclxuXHJcbi8vIEdldCBuZXh0IG5hbWVkIGVsZW1lbnQgaWRcclxuU1ZHLmVpZCA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICByZXR1cm4gJ1N2Z2pzJyArIGNhcGl0YWxpemUobmFtZSkgKyAoU1ZHLmRpZCsrKVxyXG59XHJcblxyXG4vLyBNZXRob2QgZm9yIGVsZW1lbnQgY3JlYXRpb25cclxuU1ZHLmNyZWF0ZSA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAvLyBjcmVhdGUgZWxlbWVudFxyXG4gIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKHRoaXMubnMsIG5hbWUpXHJcblxyXG4gIC8vIGFwcGx5IHVuaXF1ZSBpZFxyXG4gIGVsZW1lbnQuc2V0QXR0cmlidXRlKCdpZCcsIHRoaXMuZWlkKG5hbWUpKVxyXG5cclxuICByZXR1cm4gZWxlbWVudFxyXG59XHJcblxyXG4vLyBNZXRob2QgZm9yIGV4dGVuZGluZyBvYmplY3RzXHJcblNWRy5leHRlbmQgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgbW9kdWxlcywgbWV0aG9kcywga2V5LCBpXHJcblxyXG4gIC8vIEdldCBsaXN0IG9mIG1vZHVsZXNcclxuICBtb2R1bGVzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXHJcblxyXG4gIC8vIEdldCBvYmplY3Qgd2l0aCBleHRlbnNpb25zXHJcbiAgbWV0aG9kcyA9IG1vZHVsZXMucG9wKClcclxuXHJcbiAgZm9yIChpID0gbW9kdWxlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSlcclxuICAgIGlmIChtb2R1bGVzW2ldKVxyXG4gICAgICBmb3IgKGtleSBpbiBtZXRob2RzKVxyXG4gICAgICAgIG1vZHVsZXNbaV0ucHJvdG90eXBlW2tleV0gPSBtZXRob2RzW2tleV1cclxuXHJcbiAgLy8gTWFrZSBzdXJlIFNWRy5TZXQgaW5oZXJpdHMgYW55IG5ld2x5IGFkZGVkIG1ldGhvZHNcclxuICBpZiAoU1ZHLlNldCAmJiBTVkcuU2V0LmluaGVyaXQpXHJcbiAgICBTVkcuU2V0LmluaGVyaXQoKVxyXG59XHJcblxyXG4vLyBJbnZlbnQgbmV3IGVsZW1lbnRcclxuU1ZHLmludmVudCA9IGZ1bmN0aW9uKGNvbmZpZykge1xyXG4gIC8vIENyZWF0ZSBlbGVtZW50IGluaXRpYWxpemVyXHJcbiAgdmFyIGluaXRpYWxpemVyID0gdHlwZW9mIGNvbmZpZy5jcmVhdGUgPT0gJ2Z1bmN0aW9uJyA/XHJcbiAgICBjb25maWcuY3JlYXRlIDpcclxuICAgIGZ1bmN0aW9uKCkge1xyXG4gICAgICB0aGlzLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgU1ZHLmNyZWF0ZShjb25maWcuY3JlYXRlKSlcclxuICAgIH1cclxuXHJcbiAgLy8gSW5oZXJpdCBwcm90b3R5cGVcclxuICBpZiAoY29uZmlnLmluaGVyaXQpXHJcbiAgICBpbml0aWFsaXplci5wcm90b3R5cGUgPSBuZXcgY29uZmlnLmluaGVyaXRcclxuXHJcbiAgLy8gRXh0ZW5kIHdpdGggbWV0aG9kc1xyXG4gIGlmIChjb25maWcuZXh0ZW5kKVxyXG4gICAgU1ZHLmV4dGVuZChpbml0aWFsaXplciwgY29uZmlnLmV4dGVuZClcclxuXHJcbiAgLy8gQXR0YWNoIGNvbnN0cnVjdCBtZXRob2QgdG8gcGFyZW50XHJcbiAgaWYgKGNvbmZpZy5jb25zdHJ1Y3QpXHJcbiAgICBTVkcuZXh0ZW5kKGNvbmZpZy5wYXJlbnQgfHwgU1ZHLkNvbnRhaW5lciwgY29uZmlnLmNvbnN0cnVjdClcclxuXHJcbiAgcmV0dXJuIGluaXRpYWxpemVyXHJcbn1cclxuXHJcbi8vIEFkb3B0IGV4aXN0aW5nIHN2ZyBlbGVtZW50c1xyXG5TVkcuYWRvcHQgPSBmdW5jdGlvbihub2RlKSB7XHJcbiAgLy8gY2hlY2sgZm9yIHByZXNlbmNlIG9mIG5vZGVcclxuICBpZiAoIW5vZGUpIHJldHVybiBudWxsXHJcblxyXG4gIC8vIG1ha2Ugc3VyZSBhIG5vZGUgaXNuJ3QgYWxyZWFkeSBhZG9wdGVkXHJcbiAgaWYgKG5vZGUuaW5zdGFuY2UpIHJldHVybiBub2RlLmluc3RhbmNlXHJcblxyXG4gIC8vIGluaXRpYWxpemUgdmFyaWFibGVzXHJcbiAgdmFyIGVsZW1lbnRcclxuXHJcbiAgLy8gYWRvcHQgd2l0aCBlbGVtZW50LXNwZWNpZmljIHNldHRpbmdzXHJcbiAgaWYgKG5vZGUubm9kZU5hbWUgPT0gJ3N2ZycpXHJcbiAgICBlbGVtZW50ID0gbm9kZS5wYXJlbnROb2RlIGluc3RhbmNlb2Ygd2luZG93LlNWR0VsZW1lbnQgPyBuZXcgU1ZHLk5lc3RlZCA6IG5ldyBTVkcuRG9jXHJcbiAgZWxzZSBpZiAobm9kZS5ub2RlTmFtZSA9PSAnbGluZWFyR3JhZGllbnQnKVxyXG4gICAgZWxlbWVudCA9IG5ldyBTVkcuR3JhZGllbnQoJ2xpbmVhcicpXHJcbiAgZWxzZSBpZiAobm9kZS5ub2RlTmFtZSA9PSAncmFkaWFsR3JhZGllbnQnKVxyXG4gICAgZWxlbWVudCA9IG5ldyBTVkcuR3JhZGllbnQoJ3JhZGlhbCcpXHJcbiAgZWxzZSBpZiAoU1ZHW2NhcGl0YWxpemUobm9kZS5ub2RlTmFtZSldKVxyXG4gICAgZWxlbWVudCA9IG5ldyBTVkdbY2FwaXRhbGl6ZShub2RlLm5vZGVOYW1lKV1cclxuICBlbHNlXHJcbiAgICBlbGVtZW50ID0gbmV3IFNWRy5FbGVtZW50KG5vZGUpXHJcblxyXG4gIC8vIGVuc3VyZSByZWZlcmVuY2VzXHJcbiAgZWxlbWVudC50eXBlICA9IG5vZGUubm9kZU5hbWVcclxuICBlbGVtZW50Lm5vZGUgID0gbm9kZVxyXG4gIG5vZGUuaW5zdGFuY2UgPSBlbGVtZW50XHJcblxyXG4gIC8vIFNWRy5DbGFzcyBzcGVjaWZpYyBwcmVwYXJhdGlvbnNcclxuICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFNWRy5Eb2MpXHJcbiAgICBlbGVtZW50Lm5hbWVzcGFjZSgpLmRlZnMoKVxyXG5cclxuICAvLyBwdWxsIHN2Z2pzIGRhdGEgZnJvbSB0aGUgZG9tIChnZXRBdHRyaWJ1dGVOUyBkb2Vzbid0IHdvcmsgaW4gaHRtbDUpXHJcbiAgZWxlbWVudC5zZXREYXRhKEpTT04ucGFyc2Uobm9kZS5nZXRBdHRyaWJ1dGUoJ3N2Z2pzOmRhdGEnKSkgfHwge30pXHJcblxyXG4gIHJldHVybiBlbGVtZW50XHJcbn1cclxuXHJcbi8vIEluaXRpYWxpemUgcGFyc2luZyBlbGVtZW50XHJcblNWRy5wcmVwYXJlID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gU2VsZWN0IGRvY3VtZW50IGJvZHkgYW5kIGNyZWF0ZSBpbnZpc2libGUgc3ZnIGVsZW1lbnRcclxuICB2YXIgYm9keSA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF1cclxuICAgICwgZHJhdyA9IChib2R5ID8gbmV3IFNWRy5Eb2MoYm9keSkgOiBTVkcuYWRvcHQoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5uZXN0ZWQoKSkuc2l6ZSgyLCAwKVxyXG5cclxuICAvLyBDcmVhdGUgcGFyc2VyIG9iamVjdFxyXG4gIFNWRy5wYXJzZXIgPSB7XHJcbiAgICBib2R5OiBib2R5IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudFxyXG4gICwgZHJhdzogZHJhdy5zdHlsZSgnb3BhY2l0eTowO3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6LTEwMCU7dG9wOi0xMDAlO292ZXJmbG93OmhpZGRlbicpLm5vZGVcclxuICAsIHBvbHk6IGRyYXcucG9seWxpbmUoKS5ub2RlXHJcbiAgLCBwYXRoOiBkcmF3LnBhdGgoKS5ub2RlXHJcbiAgLCBuYXRpdmU6IFNWRy5jcmVhdGUoJ3N2ZycpXHJcbiAgfVxyXG59XHJcblxyXG5TVkcucGFyc2VyID0ge1xyXG4gIG5hdGl2ZTogU1ZHLmNyZWF0ZSgnc3ZnJylcclxufVxyXG5cclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uKCkge1xyXG4gIGlmKCFTVkcucGFyc2VyLmRyYXcpXHJcbiAgICBTVkcucHJlcGFyZSgpXHJcbn0sIGZhbHNlKVxyXG5cbi8vIFN0b3JhZ2UgZm9yIHJlZ3VsYXIgZXhwcmVzc2lvbnNcclxuU1ZHLnJlZ2V4ID0ge1xyXG4gIC8vIFBhcnNlIHVuaXQgdmFsdWVcclxuICBudW1iZXJBbmRVbml0OiAgICAvXihbKy1dPyhcXGQrKFxcLlxcZCopP3xcXC5cXGQrKShlWystXT9cXGQrKT8pKFthLXolXSopJC9pXHJcblxyXG4gIC8vIFBhcnNlIGhleCB2YWx1ZVxyXG4sIGhleDogICAgICAgICAgICAgIC9eIz8oW2EtZlxcZF17Mn0pKFthLWZcXGRdezJ9KShbYS1mXFxkXXsyfSkkL2lcclxuXHJcbiAgLy8gUGFyc2UgcmdiIHZhbHVlXHJcbiwgcmdiOiAgICAgICAgICAgICAgL3JnYlxcKChcXGQrKSwoXFxkKyksKFxcZCspXFwpL1xyXG5cclxuICAvLyBQYXJzZSByZWZlcmVuY2UgaWRcclxuLCByZWZlcmVuY2U6ICAgICAgICAvIyhbYS16MC05XFwtX10rKS9pXHJcblxyXG4gIC8vIHNwbGl0cyBhIHRyYW5zZm9ybWF0aW9uIGNoYWluXHJcbiwgdHJhbnNmb3JtczogICAgICAgL1xcKVxccyosP1xccyovXHJcblxyXG4gIC8vIFdoaXRlc3BhY2VcclxuLCB3aGl0ZXNwYWNlOiAgICAgICAvXFxzL2dcclxuXHJcbiAgLy8gVGVzdCBoZXggdmFsdWVcclxuLCBpc0hleDogICAgICAgICAgICAvXiNbYS1mMC05XXszLDZ9JC9pXHJcblxyXG4gIC8vIFRlc3QgcmdiIHZhbHVlXHJcbiwgaXNSZ2I6ICAgICAgICAgICAgL15yZ2JcXCgvXHJcblxyXG4gIC8vIFRlc3QgY3NzIGRlY2xhcmF0aW9uXHJcbiwgaXNDc3M6ICAgICAgICAgICAgL1teOl0rOlteO10rOz8vXHJcblxyXG4gIC8vIFRlc3QgZm9yIGJsYW5rIHN0cmluZ1xyXG4sIGlzQmxhbms6ICAgICAgICAgIC9eKFxccyspPyQvXHJcblxyXG4gIC8vIFRlc3QgZm9yIG51bWVyaWMgc3RyaW5nXHJcbiwgaXNOdW1iZXI6ICAgICAgICAgL15bKy1dPyhcXGQrKFxcLlxcZCopP3xcXC5cXGQrKShlWystXT9cXGQrKT8kL2lcclxuXHJcbiAgLy8gVGVzdCBmb3IgcGVyY2VudCB2YWx1ZVxyXG4sIGlzUGVyY2VudDogICAgICAgIC9eLT9bXFxkXFwuXSslJC9cclxuXHJcbiAgLy8gVGVzdCBmb3IgaW1hZ2UgdXJsXHJcbiwgaXNJbWFnZTogICAgICAgICAgL1xcLihqcGd8anBlZ3xwbmd8Z2lmfHN2ZykoXFw/W149XSsuKik/L2lcclxuXHJcbiAgLy8gc3BsaXQgYXQgd2hpdGVzcGFjZSBhbmQgY29tbWFcclxuLCBkZWxpbWl0ZXI6ICAgICAgICAvW1xccyxdKy9cclxuXHJcbiAgLy8gVGhlIGZvbGxvd2luZyByZWdleCBhcmUgdXNlZCB0byBwYXJzZSB0aGUgZCBhdHRyaWJ1dGUgb2YgYSBwYXRoXHJcblxyXG4gIC8vIE1hdGNoZXMgYWxsIGh5cGhlbnMgd2hpY2ggYXJlIG5vdCBhZnRlciBhbiBleHBvbmVudFxyXG4sIGh5cGhlbjogICAgICAgICAgIC8oW15lXSlcXC0vZ2lcclxuXHJcbiAgLy8gUmVwbGFjZXMgYW5kIHRlc3RzIGZvciBhbGwgcGF0aCBsZXR0ZXJzXHJcbiwgcGF0aExldHRlcnM6ICAgICAgL1tNTEhWQ1NRVEFaXS9naVxyXG5cclxuICAvLyB5ZXMgd2UgbmVlZCB0aGlzIG9uZSwgdG9vXHJcbiwgaXNQYXRoTGV0dGVyOiAgICAgL1tNTEhWQ1NRVEFaXS9pXHJcblxyXG4gIC8vIG1hdGNoZXMgMC4xNTQuMjMuNDVcclxuLCBudW1iZXJzV2l0aERvdHM6ICAvKChcXGQ/XFwuXFxkKyg/OmVbKy1dP1xcZCspPykoKD86XFwuXFxkKyg/OmVbKy1dP1xcZCspPykrKSkrL2dpXHJcblxyXG4gIC8vIG1hdGNoZXMgLlxyXG4sIGRvdHM6ICAgICAgICAgICAgIC9cXC4vZ1xyXG59XHJcblxuU1ZHLnV0aWxzID0ge1xyXG4gIC8vIE1hcCBmdW5jdGlvblxyXG4gIG1hcDogZnVuY3Rpb24oYXJyYXksIGJsb2NrKSB7XHJcbiAgICB2YXIgaVxyXG4gICAgICAsIGlsID0gYXJyYXkubGVuZ3RoXHJcbiAgICAgICwgcmVzdWx0ID0gW11cclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgaWw7IGkrKylcclxuICAgICAgcmVzdWx0LnB1c2goYmxvY2soYXJyYXlbaV0pKVxyXG5cclxuICAgIHJldHVybiByZXN1bHRcclxuICB9XHJcblxyXG4gIC8vIEZpbHRlciBmdW5jdGlvblxyXG4sIGZpbHRlcjogZnVuY3Rpb24oYXJyYXksIGJsb2NrKSB7XHJcbiAgICB2YXIgaVxyXG4gICAgICAsIGlsID0gYXJyYXkubGVuZ3RoXHJcbiAgICAgICwgcmVzdWx0ID0gW11cclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgaWw7IGkrKylcclxuICAgICAgaWYgKGJsb2NrKGFycmF5W2ldKSlcclxuICAgICAgICByZXN1bHQucHVzaChhcnJheVtpXSlcclxuXHJcbiAgICByZXR1cm4gcmVzdWx0XHJcbiAgfVxyXG5cclxuICAvLyBEZWdyZWVzIHRvIHJhZGlhbnNcclxuLCByYWRpYW5zOiBmdW5jdGlvbihkKSB7XHJcbiAgICByZXR1cm4gZCAlIDM2MCAqIE1hdGguUEkgLyAxODBcclxuICB9XHJcblxyXG4gIC8vIFJhZGlhbnMgdG8gZGVncmVlc1xyXG4sIGRlZ3JlZXM6IGZ1bmN0aW9uKHIpIHtcclxuICAgIHJldHVybiByICogMTgwIC8gTWF0aC5QSSAlIDM2MFxyXG4gIH1cclxuXHJcbiwgZmlsdGVyU1ZHRWxlbWVudHM6IGZ1bmN0aW9uKG5vZGVzKSB7XHJcbiAgICByZXR1cm4gdGhpcy5maWx0ZXIoIG5vZGVzLCBmdW5jdGlvbihlbCkgeyByZXR1cm4gZWwgaW5zdGFuY2VvZiB3aW5kb3cuU1ZHRWxlbWVudCB9KVxyXG4gIH1cclxuXHJcbn1cblxyXG5TVkcuZGVmYXVsdHMgPSB7XHJcbiAgLy8gRGVmYXVsdCBhdHRyaWJ1dGUgdmFsdWVzXHJcbiAgYXR0cnM6IHtcclxuICAgIC8vIGZpbGwgYW5kIHN0cm9rZVxyXG4gICAgJ2ZpbGwtb3BhY2l0eSc6ICAgICAxXHJcbiAgLCAnc3Ryb2tlLW9wYWNpdHknOiAgIDFcclxuICAsICdzdHJva2Utd2lkdGgnOiAgICAgMFxyXG4gICwgJ3N0cm9rZS1saW5lam9pbic6ICAnbWl0ZXInXHJcbiAgLCAnc3Ryb2tlLWxpbmVjYXAnOiAgICdidXR0J1xyXG4gICwgZmlsbDogICAgICAgICAgICAgICAnIzAwMDAwMCdcclxuICAsIHN0cm9rZTogICAgICAgICAgICAgJyMwMDAwMDAnXHJcbiAgLCBvcGFjaXR5OiAgICAgICAgICAgIDFcclxuICAgIC8vIHBvc2l0aW9uXHJcbiAgLCB4OiAgICAgICAgICAgICAgICAgIDBcclxuICAsIHk6ICAgICAgICAgICAgICAgICAgMFxyXG4gICwgY3g6ICAgICAgICAgICAgICAgICAwXHJcbiAgLCBjeTogICAgICAgICAgICAgICAgIDBcclxuICAgIC8vIHNpemVcclxuICAsIHdpZHRoOiAgICAgICAgICAgICAgMFxyXG4gICwgaGVpZ2h0OiAgICAgICAgICAgICAwXHJcbiAgICAvLyByYWRpdXNcclxuICAsIHI6ICAgICAgICAgICAgICAgICAgMFxyXG4gICwgcng6ICAgICAgICAgICAgICAgICAwXHJcbiAgLCByeTogICAgICAgICAgICAgICAgIDBcclxuICAgIC8vIGdyYWRpZW50XHJcbiAgLCBvZmZzZXQ6ICAgICAgICAgICAgIDBcclxuICAsICdzdG9wLW9wYWNpdHknOiAgICAgMVxyXG4gICwgJ3N0b3AtY29sb3InOiAgICAgICAnIzAwMDAwMCdcclxuICAgIC8vIHRleHRcclxuICAsICdmb250LXNpemUnOiAgICAgICAgMTZcclxuICAsICdmb250LWZhbWlseSc6ICAgICAgJ0hlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWYnXHJcbiAgLCAndGV4dC1hbmNob3InOiAgICAgICdzdGFydCdcclxuICB9XHJcblxyXG59XG4vLyBNb2R1bGUgZm9yIGNvbG9yIGNvbnZlcnRpb25zXHJcblNWRy5Db2xvciA9IGZ1bmN0aW9uKGNvbG9yKSB7XHJcbiAgdmFyIG1hdGNoXHJcblxyXG4gIC8vIGluaXRpYWxpemUgZGVmYXVsdHNcclxuICB0aGlzLnIgPSAwXHJcbiAgdGhpcy5nID0gMFxyXG4gIHRoaXMuYiA9IDBcclxuXHJcbiAgaWYoIWNvbG9yKSByZXR1cm5cclxuXHJcbiAgLy8gcGFyc2UgY29sb3JcclxuICBpZiAodHlwZW9mIGNvbG9yID09PSAnc3RyaW5nJykge1xyXG4gICAgaWYgKFNWRy5yZWdleC5pc1JnYi50ZXN0KGNvbG9yKSkge1xyXG4gICAgICAvLyBnZXQgcmdiIHZhbHVlc1xyXG4gICAgICBtYXRjaCA9IFNWRy5yZWdleC5yZ2IuZXhlYyhjb2xvci5yZXBsYWNlKFNWRy5yZWdleC53aGl0ZXNwYWNlLCcnKSlcclxuXHJcbiAgICAgIC8vIHBhcnNlIG51bWVyaWMgdmFsdWVzXHJcbiAgICAgIHRoaXMuciA9IHBhcnNlSW50KG1hdGNoWzFdKVxyXG4gICAgICB0aGlzLmcgPSBwYXJzZUludChtYXRjaFsyXSlcclxuICAgICAgdGhpcy5iID0gcGFyc2VJbnQobWF0Y2hbM10pXHJcblxyXG4gICAgfSBlbHNlIGlmIChTVkcucmVnZXguaXNIZXgudGVzdChjb2xvcikpIHtcclxuICAgICAgLy8gZ2V0IGhleCB2YWx1ZXNcclxuICAgICAgbWF0Y2ggPSBTVkcucmVnZXguaGV4LmV4ZWMoZnVsbEhleChjb2xvcikpXHJcblxyXG4gICAgICAvLyBwYXJzZSBudW1lcmljIHZhbHVlc1xyXG4gICAgICB0aGlzLnIgPSBwYXJzZUludChtYXRjaFsxXSwgMTYpXHJcbiAgICAgIHRoaXMuZyA9IHBhcnNlSW50KG1hdGNoWzJdLCAxNilcclxuICAgICAgdGhpcy5iID0gcGFyc2VJbnQobWF0Y2hbM10sIDE2KVxyXG5cclxuICAgIH1cclxuXHJcbiAgfSBlbHNlIGlmICh0eXBlb2YgY29sb3IgPT09ICdvYmplY3QnKSB7XHJcbiAgICB0aGlzLnIgPSBjb2xvci5yXHJcbiAgICB0aGlzLmcgPSBjb2xvci5nXHJcbiAgICB0aGlzLmIgPSBjb2xvci5iXHJcblxyXG4gIH1cclxuXHJcbn1cclxuXHJcblNWRy5leHRlbmQoU1ZHLkNvbG9yLCB7XHJcbiAgLy8gRGVmYXVsdCB0byBoZXggY29udmVyc2lvblxyXG4gIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnRvSGV4KClcclxuICB9XHJcbiAgLy8gQnVpbGQgaGV4IHZhbHVlXHJcbiwgdG9IZXg6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuICcjJ1xyXG4gICAgICArIGNvbXBUb0hleCh0aGlzLnIpXHJcbiAgICAgICsgY29tcFRvSGV4KHRoaXMuZylcclxuICAgICAgKyBjb21wVG9IZXgodGhpcy5iKVxyXG4gIH1cclxuICAvLyBCdWlsZCByZ2IgdmFsdWVcclxuLCB0b1JnYjogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gJ3JnYignICsgW3RoaXMuciwgdGhpcy5nLCB0aGlzLmJdLmpvaW4oKSArICcpJ1xyXG4gIH1cclxuICAvLyBDYWxjdWxhdGUgdHJ1ZSBicmlnaHRuZXNzXHJcbiwgYnJpZ2h0bmVzczogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gKHRoaXMuciAvIDI1NSAqIDAuMzApXHJcbiAgICAgICAgICsgKHRoaXMuZyAvIDI1NSAqIDAuNTkpXHJcbiAgICAgICAgICsgKHRoaXMuYiAvIDI1NSAqIDAuMTEpXHJcbiAgfVxyXG4gIC8vIE1ha2UgY29sb3IgbW9ycGhhYmxlXHJcbiwgbW9ycGg6IGZ1bmN0aW9uKGNvbG9yKSB7XHJcbiAgICB0aGlzLmRlc3RpbmF0aW9uID0gbmV3IFNWRy5Db2xvcihjb2xvcilcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBHZXQgbW9ycGhlZCBjb2xvciBhdCBnaXZlbiBwb3NpdGlvblxyXG4sIGF0OiBmdW5jdGlvbihwb3MpIHtcclxuICAgIC8vIG1ha2Ugc3VyZSBhIGRlc3RpbmF0aW9uIGlzIGRlZmluZWRcclxuICAgIGlmICghdGhpcy5kZXN0aW5hdGlvbikgcmV0dXJuIHRoaXNcclxuXHJcbiAgICAvLyBub3JtYWxpc2UgcG9zXHJcbiAgICBwb3MgPSBwb3MgPCAwID8gMCA6IHBvcyA+IDEgPyAxIDogcG9zXHJcblxyXG4gICAgLy8gZ2VuZXJhdGUgbW9ycGhlZCBjb2xvclxyXG4gICAgcmV0dXJuIG5ldyBTVkcuQ29sb3Ioe1xyXG4gICAgICByOiB+fih0aGlzLnIgKyAodGhpcy5kZXN0aW5hdGlvbi5yIC0gdGhpcy5yKSAqIHBvcylcclxuICAgICwgZzogfn4odGhpcy5nICsgKHRoaXMuZGVzdGluYXRpb24uZyAtIHRoaXMuZykgKiBwb3MpXHJcbiAgICAsIGI6IH5+KHRoaXMuYiArICh0aGlzLmRlc3RpbmF0aW9uLmIgLSB0aGlzLmIpICogcG9zKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG59KVxyXG5cclxuLy8gVGVzdGVyc1xyXG5cclxuLy8gVGVzdCBpZiBnaXZlbiB2YWx1ZSBpcyBhIGNvbG9yIHN0cmluZ1xyXG5TVkcuQ29sb3IudGVzdCA9IGZ1bmN0aW9uKGNvbG9yKSB7XHJcbiAgY29sb3IgKz0gJydcclxuICByZXR1cm4gU1ZHLnJlZ2V4LmlzSGV4LnRlc3QoY29sb3IpXHJcbiAgICAgIHx8IFNWRy5yZWdleC5pc1JnYi50ZXN0KGNvbG9yKVxyXG59XHJcblxyXG4vLyBUZXN0IGlmIGdpdmVuIHZhbHVlIGlzIGEgcmdiIG9iamVjdFxyXG5TVkcuQ29sb3IuaXNSZ2IgPSBmdW5jdGlvbihjb2xvcikge1xyXG4gIHJldHVybiBjb2xvciAmJiB0eXBlb2YgY29sb3IuciA9PSAnbnVtYmVyJ1xyXG4gICAgICAgICAgICAgICAmJiB0eXBlb2YgY29sb3IuZyA9PSAnbnVtYmVyJ1xyXG4gICAgICAgICAgICAgICAmJiB0eXBlb2YgY29sb3IuYiA9PSAnbnVtYmVyJ1xyXG59XHJcblxyXG4vLyBUZXN0IGlmIGdpdmVuIHZhbHVlIGlzIGEgY29sb3JcclxuU1ZHLkNvbG9yLmlzQ29sb3IgPSBmdW5jdGlvbihjb2xvcikge1xyXG4gIHJldHVybiBTVkcuQ29sb3IuaXNSZ2IoY29sb3IpIHx8IFNWRy5Db2xvci50ZXN0KGNvbG9yKVxyXG59XG4vLyBNb2R1bGUgZm9yIGFycmF5IGNvbnZlcnNpb25cclxuU1ZHLkFycmF5ID0gZnVuY3Rpb24oYXJyYXksIGZhbGxiYWNrKSB7XHJcbiAgYXJyYXkgPSAoYXJyYXkgfHwgW10pLnZhbHVlT2YoKVxyXG5cclxuICAvLyBpZiBhcnJheSBpcyBlbXB0eSBhbmQgZmFsbGJhY2sgaXMgcHJvdmlkZWQsIHVzZSBmYWxsYmFja1xyXG4gIGlmIChhcnJheS5sZW5ndGggPT0gMCAmJiBmYWxsYmFjaylcclxuICAgIGFycmF5ID0gZmFsbGJhY2sudmFsdWVPZigpXHJcblxyXG4gIC8vIHBhcnNlIGFycmF5XHJcbiAgdGhpcy52YWx1ZSA9IHRoaXMucGFyc2UoYXJyYXkpXHJcbn1cclxuXHJcblNWRy5leHRlbmQoU1ZHLkFycmF5LCB7XHJcbiAgLy8gTWFrZSBhcnJheSBtb3JwaGFibGVcclxuICBtb3JwaDogZnVuY3Rpb24oYXJyYXkpIHtcclxuICAgIHRoaXMuZGVzdGluYXRpb24gPSB0aGlzLnBhcnNlKGFycmF5KVxyXG5cclxuICAgIC8vIG5vcm1hbGl6ZSBsZW5ndGggb2YgYXJyYXlzXHJcbiAgICBpZiAodGhpcy52YWx1ZS5sZW5ndGggIT0gdGhpcy5kZXN0aW5hdGlvbi5sZW5ndGgpIHtcclxuICAgICAgdmFyIGxhc3RWYWx1ZSAgICAgICA9IHRoaXMudmFsdWVbdGhpcy52YWx1ZS5sZW5ndGggLSAxXVxyXG4gICAgICAgICwgbGFzdERlc3RpbmF0aW9uID0gdGhpcy5kZXN0aW5hdGlvblt0aGlzLmRlc3RpbmF0aW9uLmxlbmd0aCAtIDFdXHJcblxyXG4gICAgICB3aGlsZSh0aGlzLnZhbHVlLmxlbmd0aCA+IHRoaXMuZGVzdGluYXRpb24ubGVuZ3RoKVxyXG4gICAgICAgIHRoaXMuZGVzdGluYXRpb24ucHVzaChsYXN0RGVzdGluYXRpb24pXHJcbiAgICAgIHdoaWxlKHRoaXMudmFsdWUubGVuZ3RoIDwgdGhpcy5kZXN0aW5hdGlvbi5sZW5ndGgpXHJcbiAgICAgICAgdGhpcy52YWx1ZS5wdXNoKGxhc3RWYWx1ZSlcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBDbGVhbiB1cCBhbnkgZHVwbGljYXRlIHBvaW50c1xyXG4sIHNldHRsZTogZnVuY3Rpb24oKSB7XHJcbiAgICAvLyBmaW5kIGFsbCB1bmlxdWUgdmFsdWVzXHJcbiAgICBmb3IgKHZhciBpID0gMCwgaWwgPSB0aGlzLnZhbHVlLmxlbmd0aCwgc2VlbiA9IFtdOyBpIDwgaWw7IGkrKylcclxuICAgICAgaWYgKHNlZW4uaW5kZXhPZih0aGlzLnZhbHVlW2ldKSA9PSAtMSlcclxuICAgICAgICBzZWVuLnB1c2godGhpcy52YWx1ZVtpXSlcclxuXHJcbiAgICAvLyBzZXQgbmV3IHZhbHVlXHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZSA9IHNlZW5cclxuICB9XHJcbiAgLy8gR2V0IG1vcnBoZWQgYXJyYXkgYXQgZ2l2ZW4gcG9zaXRpb25cclxuLCBhdDogZnVuY3Rpb24ocG9zKSB7XHJcbiAgICAvLyBtYWtlIHN1cmUgYSBkZXN0aW5hdGlvbiBpcyBkZWZpbmVkXHJcbiAgICBpZiAoIXRoaXMuZGVzdGluYXRpb24pIHJldHVybiB0aGlzXHJcblxyXG4gICAgLy8gZ2VuZXJhdGUgbW9ycGhlZCBhcnJheVxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gdGhpcy52YWx1ZS5sZW5ndGgsIGFycmF5ID0gW107IGkgPCBpbDsgaSsrKVxyXG4gICAgICBhcnJheS5wdXNoKHRoaXMudmFsdWVbaV0gKyAodGhpcy5kZXN0aW5hdGlvbltpXSAtIHRoaXMudmFsdWVbaV0pICogcG9zKVxyXG5cclxuICAgIHJldHVybiBuZXcgU1ZHLkFycmF5KGFycmF5KVxyXG4gIH1cclxuICAvLyBDb252ZXJ0IGFycmF5IHRvIHN0cmluZ1xyXG4sIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnZhbHVlLmpvaW4oJyAnKVxyXG4gIH1cclxuICAvLyBSZWFsIHZhbHVlXHJcbiwgdmFsdWVPZjogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy52YWx1ZVxyXG4gIH1cclxuICAvLyBQYXJzZSB3aGl0ZXNwYWNlIHNlcGFyYXRlZCBzdHJpbmdcclxuLCBwYXJzZTogZnVuY3Rpb24oYXJyYXkpIHtcclxuICAgIGFycmF5ID0gYXJyYXkudmFsdWVPZigpXHJcblxyXG4gICAgLy8gaWYgYWxyZWFkeSBpcyBhbiBhcnJheSwgbm8gbmVlZCB0byBwYXJzZSBpdFxyXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYXJyYXkpKSByZXR1cm4gYXJyYXlcclxuXHJcbiAgICByZXR1cm4gdGhpcy5zcGxpdChhcnJheSlcclxuICB9XHJcbiAgLy8gU3RyaXAgdW5uZWNlc3Nhcnkgd2hpdGVzcGFjZVxyXG4sIHNwbGl0OiBmdW5jdGlvbihzdHJpbmcpIHtcclxuICAgIHJldHVybiBzdHJpbmcudHJpbSgpLnNwbGl0KFNWRy5yZWdleC5kZWxpbWl0ZXIpLm1hcChwYXJzZUZsb2F0KVxyXG4gIH1cclxuICAvLyBSZXZlcnNlIGFycmF5XHJcbiwgcmV2ZXJzZTogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLnZhbHVlLnJldmVyc2UoKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4sIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBjbG9uZSA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKClcclxuICAgIGNsb25lLnZhbHVlID0gYXJyYXlfY2xvbmUodGhpcy52YWx1ZSlcclxuICAgIHJldHVybiBjbG9uZVxyXG4gIH1cclxufSlcbi8vIFBvbHkgcG9pbnRzIGFycmF5XHJcblNWRy5Qb2ludEFycmF5ID0gZnVuY3Rpb24oYXJyYXksIGZhbGxiYWNrKSB7XHJcbiAgU1ZHLkFycmF5LmNhbGwodGhpcywgYXJyYXksIGZhbGxiYWNrIHx8IFtbMCwwXV0pXHJcbn1cclxuXHJcbi8vIEluaGVyaXQgZnJvbSBTVkcuQXJyYXlcclxuU1ZHLlBvaW50QXJyYXkucHJvdG90eXBlID0gbmV3IFNWRy5BcnJheVxyXG5TVkcuUG9pbnRBcnJheS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTVkcuUG9pbnRBcnJheVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuUG9pbnRBcnJheSwge1xyXG4gIC8vIENvbnZlcnQgYXJyYXkgdG8gc3RyaW5nXHJcbiAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgLy8gY29udmVydCB0byBhIHBvbHkgcG9pbnQgc3RyaW5nXHJcbiAgICBmb3IgKHZhciBpID0gMCwgaWwgPSB0aGlzLnZhbHVlLmxlbmd0aCwgYXJyYXkgPSBbXTsgaSA8IGlsOyBpKyspXHJcbiAgICAgIGFycmF5LnB1c2godGhpcy52YWx1ZVtpXS5qb2luKCcsJykpXHJcblxyXG4gICAgcmV0dXJuIGFycmF5LmpvaW4oJyAnKVxyXG4gIH1cclxuICAvLyBDb252ZXJ0IGFycmF5IHRvIGxpbmUgb2JqZWN0XHJcbiwgdG9MaW5lOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHgxOiB0aGlzLnZhbHVlWzBdWzBdXHJcbiAgICAsIHkxOiB0aGlzLnZhbHVlWzBdWzFdXHJcbiAgICAsIHgyOiB0aGlzLnZhbHVlWzFdWzBdXHJcbiAgICAsIHkyOiB0aGlzLnZhbHVlWzFdWzFdXHJcbiAgICB9XHJcbiAgfVxyXG4gIC8vIEdldCBtb3JwaGVkIGFycmF5IGF0IGdpdmVuIHBvc2l0aW9uXHJcbiwgYXQ6IGZ1bmN0aW9uKHBvcykge1xyXG4gICAgLy8gbWFrZSBzdXJlIGEgZGVzdGluYXRpb24gaXMgZGVmaW5lZFxyXG4gICAgaWYgKCF0aGlzLmRlc3RpbmF0aW9uKSByZXR1cm4gdGhpc1xyXG5cclxuICAgIC8vIGdlbmVyYXRlIG1vcnBoZWQgcG9pbnQgc3RyaW5nXHJcbiAgICBmb3IgKHZhciBpID0gMCwgaWwgPSB0aGlzLnZhbHVlLmxlbmd0aCwgYXJyYXkgPSBbXTsgaSA8IGlsOyBpKyspXHJcbiAgICAgIGFycmF5LnB1c2goW1xyXG4gICAgICAgIHRoaXMudmFsdWVbaV1bMF0gKyAodGhpcy5kZXN0aW5hdGlvbltpXVswXSAtIHRoaXMudmFsdWVbaV1bMF0pICogcG9zXHJcbiAgICAgICwgdGhpcy52YWx1ZVtpXVsxXSArICh0aGlzLmRlc3RpbmF0aW9uW2ldWzFdIC0gdGhpcy52YWx1ZVtpXVsxXSkgKiBwb3NcclxuICAgICAgXSlcclxuXHJcbiAgICByZXR1cm4gbmV3IFNWRy5Qb2ludEFycmF5KGFycmF5KVxyXG4gIH1cclxuICAvLyBQYXJzZSBwb2ludCBzdHJpbmcgYW5kIGZsYXQgYXJyYXlcclxuLCBwYXJzZTogZnVuY3Rpb24oYXJyYXkpIHtcclxuICAgIHZhciBwb2ludHMgPSBbXVxyXG5cclxuICAgIGFycmF5ID0gYXJyYXkudmFsdWVPZigpXHJcblxyXG4gICAgLy8gaWYgaXQgaXMgYW4gYXJyYXlcclxuICAgIGlmIChBcnJheS5pc0FycmF5KGFycmF5KSkge1xyXG4gICAgICAvLyBhbmQgaXQgaXMgbm90IGZsYXQsIHRoZXJlIGlzIG5vIG5lZWQgdG8gcGFyc2UgaXRcclxuICAgICAgaWYoQXJyYXkuaXNBcnJheShhcnJheVswXSkpIHtcclxuICAgICAgICByZXR1cm4gYXJyYXlcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHsgLy8gRWxzZSwgaXQgaXMgY29uc2lkZXJlZCBhcyBhIHN0cmluZ1xyXG4gICAgICAvLyBwYXJzZSBwb2ludHNcclxuICAgICAgYXJyYXkgPSBhcnJheS50cmltKCkuc3BsaXQoU1ZHLnJlZ2V4LmRlbGltaXRlcikubWFwKHBhcnNlRmxvYXQpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gdmFsaWRhdGUgcG9pbnRzIC0gaHR0cHM6Ly9zdmd3Zy5vcmcvc3ZnMi1kcmFmdC9zaGFwZXMuaHRtbCNEYXRhVHlwZVBvaW50c1xyXG4gICAgLy8gT2RkIG51bWJlciBvZiBjb29yZGluYXRlcyBpcyBhbiBlcnJvci4gSW4gc3VjaCBjYXNlcywgZHJvcCB0aGUgbGFzdCBvZGQgY29vcmRpbmF0ZS5cclxuICAgIGlmIChhcnJheS5sZW5ndGggJSAyICE9PSAwKSBhcnJheS5wb3AoKVxyXG5cclxuICAgIC8vIHdyYXAgcG9pbnRzIGluIHR3by10dXBsZXMgYW5kIHBhcnNlIHBvaW50cyBhcyBmbG9hdHNcclxuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSA9IGkgKyAyKVxyXG4gICAgICBwb2ludHMucHVzaChbIGFycmF5W2ldLCBhcnJheVtpKzFdIF0pXHJcblxyXG4gICAgcmV0dXJuIHBvaW50c1xyXG4gIH1cclxuICAvLyBNb3ZlIHBvaW50IHN0cmluZ1xyXG4sIG1vdmU6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHZhciBib3ggPSB0aGlzLmJib3goKVxyXG5cclxuICAgIC8vIGdldCByZWxhdGl2ZSBvZmZzZXRcclxuICAgIHggLT0gYm94LnhcclxuICAgIHkgLT0gYm94LnlcclxuXHJcbiAgICAvLyBtb3ZlIGV2ZXJ5IHBvaW50XHJcbiAgICBpZiAoIWlzTmFOKHgpICYmICFpc05hTih5KSlcclxuICAgICAgZm9yICh2YXIgaSA9IHRoaXMudmFsdWUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXHJcbiAgICAgICAgdGhpcy52YWx1ZVtpXSA9IFt0aGlzLnZhbHVlW2ldWzBdICsgeCwgdGhpcy52YWx1ZVtpXVsxXSArIHldXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gUmVzaXplIHBvbHkgc3RyaW5nXHJcbiwgc2l6ZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xyXG4gICAgdmFyIGksIGJveCA9IHRoaXMuYmJveCgpXHJcblxyXG4gICAgLy8gcmVjYWxjdWxhdGUgcG9zaXRpb24gb2YgYWxsIHBvaW50cyBhY2NvcmRpbmcgdG8gbmV3IHNpemVcclxuICAgIGZvciAoaSA9IHRoaXMudmFsdWUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgaWYoYm94LndpZHRoKSB0aGlzLnZhbHVlW2ldWzBdID0gKCh0aGlzLnZhbHVlW2ldWzBdIC0gYm94LngpICogd2lkdGgpICAvIGJveC53aWR0aCAgKyBib3gueFxyXG4gICAgICBpZihib3guaGVpZ2h0KSB0aGlzLnZhbHVlW2ldWzFdID0gKCh0aGlzLnZhbHVlW2ldWzFdIC0gYm94LnkpICogaGVpZ2h0KSAvIGJveC5oZWlnaHQgKyBib3gueVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIEdldCBib3VuZGluZyBib3ggb2YgcG9pbnRzXHJcbiwgYmJveDogZnVuY3Rpb24oKSB7XHJcbiAgICBTVkcucGFyc2VyLnBvbHkuc2V0QXR0cmlidXRlKCdwb2ludHMnLCB0aGlzLnRvU3RyaW5nKCkpXHJcblxyXG4gICAgcmV0dXJuIFNWRy5wYXJzZXIucG9seS5nZXRCQm94KClcclxuICB9XHJcbn0pXHJcblxudmFyIHBhdGhIYW5kbGVycyA9IHtcclxuICBNOiBmdW5jdGlvbihjLCBwLCBwMCkge1xyXG4gICAgcC54ID0gcDAueCA9IGNbMF1cclxuICAgIHAueSA9IHAwLnkgPSBjWzFdXHJcblxyXG4gICAgcmV0dXJuIFsnTScsIHAueCwgcC55XVxyXG4gIH0sXHJcbiAgTDogZnVuY3Rpb24oYywgcCkge1xyXG4gICAgcC54ID0gY1swXVxyXG4gICAgcC55ID0gY1sxXVxyXG4gICAgcmV0dXJuIFsnTCcsIGNbMF0sIGNbMV1dXHJcbiAgfSxcclxuICBIOiBmdW5jdGlvbihjLCBwKSB7XHJcbiAgICBwLnggPSBjWzBdXHJcbiAgICByZXR1cm4gWydIJywgY1swXV1cclxuICB9LFxyXG4gIFY6IGZ1bmN0aW9uKGMsIHApIHtcclxuICAgIHAueSA9IGNbMF1cclxuICAgIHJldHVybiBbJ1YnLCBjWzBdXVxyXG4gIH0sXHJcbiAgQzogZnVuY3Rpb24oYywgcCkge1xyXG4gICAgcC54ID0gY1s0XVxyXG4gICAgcC55ID0gY1s1XVxyXG4gICAgcmV0dXJuIFsnQycsIGNbMF0sIGNbMV0sIGNbMl0sIGNbM10sIGNbNF0sIGNbNV1dXHJcbiAgfSxcclxuICBTOiBmdW5jdGlvbihjLCBwKSB7XHJcbiAgICBwLnggPSBjWzJdXHJcbiAgICBwLnkgPSBjWzNdXHJcbiAgICByZXR1cm4gWydTJywgY1swXSwgY1sxXSwgY1syXSwgY1szXV1cclxuICB9LFxyXG4gIFE6IGZ1bmN0aW9uKGMsIHApIHtcclxuICAgIHAueCA9IGNbMl1cclxuICAgIHAueSA9IGNbM11cclxuICAgIHJldHVybiBbJ1EnLCBjWzBdLCBjWzFdLCBjWzJdLCBjWzNdXVxyXG4gIH0sXHJcbiAgVDogZnVuY3Rpb24oYywgcCkge1xyXG4gICAgcC54ID0gY1swXVxyXG4gICAgcC55ID0gY1sxXVxyXG4gICAgcmV0dXJuIFsnVCcsIGNbMF0sIGNbMV1dXHJcbiAgfSxcclxuICBaOiBmdW5jdGlvbihjLCBwLCBwMCkge1xyXG4gICAgcC54ID0gcDAueFxyXG4gICAgcC55ID0gcDAueVxyXG4gICAgcmV0dXJuIFsnWiddXHJcbiAgfSxcclxuICBBOiBmdW5jdGlvbihjLCBwKSB7XHJcbiAgICBwLnggPSBjWzVdXHJcbiAgICBwLnkgPSBjWzZdXHJcbiAgICByZXR1cm4gWydBJywgY1swXSwgY1sxXSwgY1syXSwgY1szXSwgY1s0XSwgY1s1XSwgY1s2XV1cclxuICB9XHJcbn1cclxuXHJcbnZhciBtbGh2cXRjc2EgPSAnbWxodnF0Y3Nheicuc3BsaXQoJycpXHJcblxyXG5mb3IodmFyIGkgPSAwLCBpbCA9IG1saHZxdGNzYS5sZW5ndGg7IGkgPCBpbDsgKytpKXtcclxuICBwYXRoSGFuZGxlcnNbbWxodnF0Y3NhW2ldXSA9IChmdW5jdGlvbihpKXtcclxuICAgIHJldHVybiBmdW5jdGlvbihjLCBwLCBwMCkge1xyXG4gICAgICBpZihpID09ICdIJykgY1swXSA9IGNbMF0gKyBwLnhcclxuICAgICAgZWxzZSBpZihpID09ICdWJykgY1swXSA9IGNbMF0gKyBwLnlcclxuICAgICAgZWxzZSBpZihpID09ICdBJyl7XHJcbiAgICAgICAgY1s1XSA9IGNbNV0gKyBwLngsXHJcbiAgICAgICAgY1s2XSA9IGNbNl0gKyBwLnlcclxuICAgICAgfVxyXG4gICAgICBlbHNlXHJcbiAgICAgICAgZm9yKHZhciBqID0gMCwgamwgPSBjLmxlbmd0aDsgaiA8IGpsOyArK2opIHtcclxuICAgICAgICAgIGNbal0gPSBjW2pdICsgKGolMiA/IHAueSA6IHAueClcclxuICAgICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gcGF0aEhhbmRsZXJzW2ldKGMsIHAsIHAwKVxyXG4gICAgfVxyXG4gIH0pKG1saHZxdGNzYVtpXS50b1VwcGVyQ2FzZSgpKVxyXG59XHJcblxyXG4vLyBQYXRoIHBvaW50cyBhcnJheVxyXG5TVkcuUGF0aEFycmF5ID0gZnVuY3Rpb24oYXJyYXksIGZhbGxiYWNrKSB7XHJcbiAgU1ZHLkFycmF5LmNhbGwodGhpcywgYXJyYXksIGZhbGxiYWNrIHx8IFtbJ00nLCAwLCAwXV0pXHJcbn1cclxuXHJcbi8vIEluaGVyaXQgZnJvbSBTVkcuQXJyYXlcclxuU1ZHLlBhdGhBcnJheS5wcm90b3R5cGUgPSBuZXcgU1ZHLkFycmF5XHJcblNWRy5QYXRoQXJyYXkucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gU1ZHLlBhdGhBcnJheVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuUGF0aEFycmF5LCB7XHJcbiAgLy8gQ29udmVydCBhcnJheSB0byBzdHJpbmdcclxuICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gYXJyYXlUb1N0cmluZyh0aGlzLnZhbHVlKVxyXG4gIH1cclxuICAvLyBNb3ZlIHBhdGggc3RyaW5nXHJcbiwgbW92ZTogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgLy8gZ2V0IGJvdW5kaW5nIGJveCBvZiBjdXJyZW50IHNpdHVhdGlvblxyXG4gICAgdmFyIGJveCA9IHRoaXMuYmJveCgpXHJcblxyXG4gICAgLy8gZ2V0IHJlbGF0aXZlIG9mZnNldFxyXG4gICAgeCAtPSBib3gueFxyXG4gICAgeSAtPSBib3gueVxyXG5cclxuICAgIGlmICghaXNOYU4oeCkgJiYgIWlzTmFOKHkpKSB7XHJcbiAgICAgIC8vIG1vdmUgZXZlcnkgcG9pbnRcclxuICAgICAgZm9yICh2YXIgbCwgaSA9IHRoaXMudmFsdWUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICBsID0gdGhpcy52YWx1ZVtpXVswXVxyXG5cclxuICAgICAgICBpZiAobCA9PSAnTScgfHwgbCA9PSAnTCcgfHwgbCA9PSAnVCcpICB7XHJcbiAgICAgICAgICB0aGlzLnZhbHVlW2ldWzFdICs9IHhcclxuICAgICAgICAgIHRoaXMudmFsdWVbaV1bMl0gKz0geVxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGwgPT0gJ0gnKSAge1xyXG4gICAgICAgICAgdGhpcy52YWx1ZVtpXVsxXSArPSB4XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAobCA9PSAnVicpICB7XHJcbiAgICAgICAgICB0aGlzLnZhbHVlW2ldWzFdICs9IHlcclxuXHJcbiAgICAgICAgfSBlbHNlIGlmIChsID09ICdDJyB8fCBsID09ICdTJyB8fCBsID09ICdRJykgIHtcclxuICAgICAgICAgIHRoaXMudmFsdWVbaV1bMV0gKz0geFxyXG4gICAgICAgICAgdGhpcy52YWx1ZVtpXVsyXSArPSB5XHJcbiAgICAgICAgICB0aGlzLnZhbHVlW2ldWzNdICs9IHhcclxuICAgICAgICAgIHRoaXMudmFsdWVbaV1bNF0gKz0geVxyXG5cclxuICAgICAgICAgIGlmIChsID09ICdDJykgIHtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZVtpXVs1XSArPSB4XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVbaV1bNl0gKz0geVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGwgPT0gJ0EnKSAge1xyXG4gICAgICAgICAgdGhpcy52YWx1ZVtpXVs2XSArPSB4XHJcbiAgICAgICAgICB0aGlzLnZhbHVlW2ldWzddICs9IHlcclxuICAgICAgICB9XHJcblxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gUmVzaXplIHBhdGggc3RyaW5nXHJcbiwgc2l6ZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xyXG4gICAgLy8gZ2V0IGJvdW5kaW5nIGJveCBvZiBjdXJyZW50IHNpdHVhdGlvblxyXG4gICAgdmFyIGksIGwsIGJveCA9IHRoaXMuYmJveCgpXHJcblxyXG4gICAgLy8gcmVjYWxjdWxhdGUgcG9zaXRpb24gb2YgYWxsIHBvaW50cyBhY2NvcmRpbmcgdG8gbmV3IHNpemVcclxuICAgIGZvciAoaSA9IHRoaXMudmFsdWUubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgbCA9IHRoaXMudmFsdWVbaV1bMF1cclxuXHJcbiAgICAgIGlmIChsID09ICdNJyB8fCBsID09ICdMJyB8fCBsID09ICdUJykgIHtcclxuICAgICAgICB0aGlzLnZhbHVlW2ldWzFdID0gKCh0aGlzLnZhbHVlW2ldWzFdIC0gYm94LngpICogd2lkdGgpICAvIGJveC53aWR0aCAgKyBib3gueFxyXG4gICAgICAgIHRoaXMudmFsdWVbaV1bMl0gPSAoKHRoaXMudmFsdWVbaV1bMl0gLSBib3gueSkgKiBoZWlnaHQpIC8gYm94LmhlaWdodCArIGJveC55XHJcblxyXG4gICAgICB9IGVsc2UgaWYgKGwgPT0gJ0gnKSAge1xyXG4gICAgICAgIHRoaXMudmFsdWVbaV1bMV0gPSAoKHRoaXMudmFsdWVbaV1bMV0gLSBib3gueCkgKiB3aWR0aCkgIC8gYm94LndpZHRoICArIGJveC54XHJcblxyXG4gICAgICB9IGVsc2UgaWYgKGwgPT0gJ1YnKSAge1xyXG4gICAgICAgIHRoaXMudmFsdWVbaV1bMV0gPSAoKHRoaXMudmFsdWVbaV1bMV0gLSBib3gueSkgKiBoZWlnaHQpIC8gYm94LmhlaWdodCArIGJveC55XHJcblxyXG4gICAgICB9IGVsc2UgaWYgKGwgPT0gJ0MnIHx8IGwgPT0gJ1MnIHx8IGwgPT0gJ1EnKSAge1xyXG4gICAgICAgIHRoaXMudmFsdWVbaV1bMV0gPSAoKHRoaXMudmFsdWVbaV1bMV0gLSBib3gueCkgKiB3aWR0aCkgIC8gYm94LndpZHRoICArIGJveC54XHJcbiAgICAgICAgdGhpcy52YWx1ZVtpXVsyXSA9ICgodGhpcy52YWx1ZVtpXVsyXSAtIGJveC55KSAqIGhlaWdodCkgLyBib3guaGVpZ2h0ICsgYm94LnlcclxuICAgICAgICB0aGlzLnZhbHVlW2ldWzNdID0gKCh0aGlzLnZhbHVlW2ldWzNdIC0gYm94LngpICogd2lkdGgpICAvIGJveC53aWR0aCAgKyBib3gueFxyXG4gICAgICAgIHRoaXMudmFsdWVbaV1bNF0gPSAoKHRoaXMudmFsdWVbaV1bNF0gLSBib3gueSkgKiBoZWlnaHQpIC8gYm94LmhlaWdodCArIGJveC55XHJcblxyXG4gICAgICAgIGlmIChsID09ICdDJykgIHtcclxuICAgICAgICAgIHRoaXMudmFsdWVbaV1bNV0gPSAoKHRoaXMudmFsdWVbaV1bNV0gLSBib3gueCkgKiB3aWR0aCkgIC8gYm94LndpZHRoICArIGJveC54XHJcbiAgICAgICAgICB0aGlzLnZhbHVlW2ldWzZdID0gKCh0aGlzLnZhbHVlW2ldWzZdIC0gYm94LnkpICogaGVpZ2h0KSAvIGJveC5oZWlnaHQgKyBib3gueVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSBpZiAobCA9PSAnQScpICB7XHJcbiAgICAgICAgLy8gcmVzaXplIHJhZGlpXHJcbiAgICAgICAgdGhpcy52YWx1ZVtpXVsxXSA9ICh0aGlzLnZhbHVlW2ldWzFdICogd2lkdGgpICAvIGJveC53aWR0aFxyXG4gICAgICAgIHRoaXMudmFsdWVbaV1bMl0gPSAodGhpcy52YWx1ZVtpXVsyXSAqIGhlaWdodCkgLyBib3guaGVpZ2h0XHJcblxyXG4gICAgICAgIC8vIG1vdmUgcG9zaXRpb24gdmFsdWVzXHJcbiAgICAgICAgdGhpcy52YWx1ZVtpXVs2XSA9ICgodGhpcy52YWx1ZVtpXVs2XSAtIGJveC54KSAqIHdpZHRoKSAgLyBib3gud2lkdGggICsgYm94LnhcclxuICAgICAgICB0aGlzLnZhbHVlW2ldWzddID0gKCh0aGlzLnZhbHVlW2ldWzddIC0gYm94LnkpICogaGVpZ2h0KSAvIGJveC5oZWlnaHQgKyBib3gueVxyXG4gICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIFRlc3QgaWYgdGhlIHBhc3NlZCBwYXRoIGFycmF5IHVzZSB0aGUgc2FtZSBwYXRoIGRhdGEgY29tbWFuZHMgYXMgdGhpcyBwYXRoIGFycmF5XHJcbiwgZXF1YWxDb21tYW5kczogZnVuY3Rpb24ocGF0aEFycmF5KSB7XHJcbiAgICB2YXIgaSwgaWwsIGVxdWFsQ29tbWFuZHNcclxuXHJcbiAgICBwYXRoQXJyYXkgPSBuZXcgU1ZHLlBhdGhBcnJheShwYXRoQXJyYXkpXHJcblxyXG4gICAgZXF1YWxDb21tYW5kcyA9IHRoaXMudmFsdWUubGVuZ3RoID09PSBwYXRoQXJyYXkudmFsdWUubGVuZ3RoXHJcbiAgICBmb3IoaSA9IDAsIGlsID0gdGhpcy52YWx1ZS5sZW5ndGg7IGVxdWFsQ29tbWFuZHMgJiYgaSA8IGlsOyBpKyspIHtcclxuICAgICAgZXF1YWxDb21tYW5kcyA9IHRoaXMudmFsdWVbaV1bMF0gPT09IHBhdGhBcnJheS52YWx1ZVtpXVswXVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlcXVhbENvbW1hbmRzXHJcbiAgfVxyXG4gIC8vIE1ha2UgcGF0aCBhcnJheSBtb3JwaGFibGVcclxuLCBtb3JwaDogZnVuY3Rpb24ocGF0aEFycmF5KSB7XHJcbiAgICBwYXRoQXJyYXkgPSBuZXcgU1ZHLlBhdGhBcnJheShwYXRoQXJyYXkpXHJcblxyXG4gICAgaWYodGhpcy5lcXVhbENvbW1hbmRzKHBhdGhBcnJheSkpIHtcclxuICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IHBhdGhBcnJheVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5kZXN0aW5hdGlvbiA9IG51bGxcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBHZXQgbW9ycGhlZCBwYXRoIGFycmF5IGF0IGdpdmVuIHBvc2l0aW9uXHJcbiwgYXQ6IGZ1bmN0aW9uKHBvcykge1xyXG4gICAgLy8gbWFrZSBzdXJlIGEgZGVzdGluYXRpb24gaXMgZGVmaW5lZFxyXG4gICAgaWYgKCF0aGlzLmRlc3RpbmF0aW9uKSByZXR1cm4gdGhpc1xyXG5cclxuICAgIHZhciBzb3VyY2VBcnJheSA9IHRoaXMudmFsdWVcclxuICAgICAgLCBkZXN0aW5hdGlvbkFycmF5ID0gdGhpcy5kZXN0aW5hdGlvbi52YWx1ZVxyXG4gICAgICAsIGFycmF5ID0gW10sIHBhdGhBcnJheSA9IG5ldyBTVkcuUGF0aEFycmF5KClcclxuICAgICAgLCBpLCBpbCwgaiwgamxcclxuXHJcbiAgICAvLyBBbmltYXRlIGhhcyBzcGVjaWZpZWQgaW4gdGhlIFNWRyBzcGVjXHJcbiAgICAvLyBTZWU6IGh0dHBzOi8vd3d3LnczLm9yZy9UUi9TVkcxMS9wYXRocy5odG1sI1BhdGhFbGVtZW50XHJcbiAgICBmb3IgKGkgPSAwLCBpbCA9IHNvdXJjZUFycmF5Lmxlbmd0aDsgaSA8IGlsOyBpKyspIHtcclxuICAgICAgYXJyYXlbaV0gPSBbc291cmNlQXJyYXlbaV1bMF1dXHJcbiAgICAgIGZvcihqID0gMSwgamwgPSBzb3VyY2VBcnJheVtpXS5sZW5ndGg7IGogPCBqbDsgaisrKSB7XHJcbiAgICAgICAgYXJyYXlbaV1bal0gPSBzb3VyY2VBcnJheVtpXVtqXSArIChkZXN0aW5hdGlvbkFycmF5W2ldW2pdIC0gc291cmNlQXJyYXlbaV1bal0pICogcG9zXHJcbiAgICAgIH1cclxuICAgICAgLy8gRm9yIHRoZSB0d28gZmxhZ3Mgb2YgdGhlIGVsbGlwdGljYWwgYXJjIGNvbW1hbmQsIHRoZSBTVkcgc3BlYyBzYXk6XHJcbiAgICAgIC8vIEZsYWdzIGFuZCBib29sZWFucyBhcmUgaW50ZXJwb2xhdGVkIGFzIGZyYWN0aW9ucyBiZXR3ZWVuIHplcm8gYW5kIG9uZSwgd2l0aCBhbnkgbm9uLXplcm8gdmFsdWUgY29uc2lkZXJlZCB0byBiZSBhIHZhbHVlIG9mIG9uZS90cnVlXHJcbiAgICAgIC8vIEVsbGlwdGljYWwgYXJjIGNvbW1hbmQgYXMgYW4gYXJyYXkgZm9sbG93ZWQgYnkgY29ycmVzcG9uZGluZyBpbmRleGVzOlxyXG4gICAgICAvLyBbJ0EnLCByeCwgcnksIHgtYXhpcy1yb3RhdGlvbiwgbGFyZ2UtYXJjLWZsYWcsIHN3ZWVwLWZsYWcsIHgsIHldXHJcbiAgICAgIC8vICAgMCAgICAxICAgMiAgICAgICAgMyAgICAgICAgICAgICAgICAgNCAgICAgICAgICAgICA1ICAgICAgNiAgN1xyXG4gICAgICBpZihhcnJheVtpXVswXSA9PT0gJ0EnKSB7XHJcbiAgICAgICAgYXJyYXlbaV1bNF0gPSArKGFycmF5W2ldWzRdICE9IDApXHJcbiAgICAgICAgYXJyYXlbaV1bNV0gPSArKGFycmF5W2ldWzVdICE9IDApXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBEaXJlY3RseSBtb2RpZnkgdGhlIHZhbHVlIG9mIGEgcGF0aCBhcnJheSwgdGhpcyBpcyBkb25lIHRoaXMgd2F5IGZvciBwZXJmb3JtYW5jZVxyXG4gICAgcGF0aEFycmF5LnZhbHVlID0gYXJyYXlcclxuICAgIHJldHVybiBwYXRoQXJyYXlcclxuICB9XHJcbiAgLy8gQWJzb2x1dGl6ZSBhbmQgcGFyc2UgcGF0aCB0byBhcnJheVxyXG4sIHBhcnNlOiBmdW5jdGlvbihhcnJheSkge1xyXG4gICAgLy8gaWYgaXQncyBhbHJlYWR5IGEgcGF0aGFycmF5LCBubyBuZWVkIHRvIHBhcnNlIGl0XHJcbiAgICBpZiAoYXJyYXkgaW5zdGFuY2VvZiBTVkcuUGF0aEFycmF5KSByZXR1cm4gYXJyYXkudmFsdWVPZigpXHJcblxyXG4gICAgLy8gcHJlcGFyZSBmb3IgcGFyc2luZ1xyXG4gICAgdmFyIGksIHgwLCB5MCwgcywgc2VnLCBhcnJcclxuICAgICAgLCB4ID0gMFxyXG4gICAgICAsIHkgPSAwXHJcbiAgICAgICwgcGFyYW1DbnQgPSB7ICdNJzoyLCAnTCc6MiwgJ0gnOjEsICdWJzoxLCAnQyc6NiwgJ1MnOjQsICdRJzo0LCAnVCc6MiwgJ0EnOjcsICdaJzowIH1cclxuXHJcbiAgICBpZih0eXBlb2YgYXJyYXkgPT0gJ3N0cmluZycpe1xyXG5cclxuICAgICAgYXJyYXkgPSBhcnJheVxyXG4gICAgICAgIC5yZXBsYWNlKFNWRy5yZWdleC5udW1iZXJzV2l0aERvdHMsIHBhdGhSZWdSZXBsYWNlKSAvLyBjb252ZXJ0IDQ1LjEyMy4xMjMgdG8gNDUuMTIzIC4xMjNcclxuICAgICAgICAucmVwbGFjZShTVkcucmVnZXgucGF0aExldHRlcnMsICcgJCYgJykgLy8gcHV0IHNvbWUgcm9vbSBiZXR3ZWVuIGxldHRlcnMgYW5kIG51bWJlcnNcclxuICAgICAgICAucmVwbGFjZShTVkcucmVnZXguaHlwaGVuLCAnJDEgLScpICAgICAgLy8gYWRkIHNwYWNlIGJlZm9yZSBoeXBoZW5cclxuICAgICAgICAudHJpbSgpICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdHJpbVxyXG4gICAgICAgIC5zcGxpdChTVkcucmVnZXguZGVsaW1pdGVyKSAgIC8vIHNwbGl0IGludG8gYXJyYXlcclxuXHJcbiAgICB9ZWxzZXtcclxuICAgICAgYXJyYXkgPSBhcnJheS5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3Vycil7XHJcbiAgICAgICAgcmV0dXJuIFtdLmNvbmNhdC5jYWxsKHByZXYsIGN1cnIpXHJcbiAgICAgIH0sIFtdKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGFycmF5IG5vdyBpcyBhbiBhcnJheSBjb250YWluaW5nIGFsbCBwYXJ0cyBvZiBhIHBhdGggZS5nLiBbJ00nLCAnMCcsICcwJywgJ0wnLCAnMzAnLCAnMzAnIC4uLl1cclxuICAgIHZhciBhcnIgPSBbXVxyXG4gICAgICAsIHAgPSBuZXcgU1ZHLlBvaW50KClcclxuICAgICAgLCBwMCA9IG5ldyBTVkcuUG9pbnQoKVxyXG4gICAgICAsIGluZGV4ID0gMFxyXG4gICAgICAsIGxlbiA9IGFycmF5Lmxlbmd0aFxyXG5cclxuICAgIGRve1xyXG4gICAgICAvLyBUZXN0IGlmIHdlIGhhdmUgYSBwYXRoIGxldHRlclxyXG4gICAgICBpZihTVkcucmVnZXguaXNQYXRoTGV0dGVyLnRlc3QoYXJyYXlbaW5kZXhdKSl7XHJcbiAgICAgICAgcyA9IGFycmF5W2luZGV4XVxyXG4gICAgICAgICsraW5kZXhcclxuICAgICAgLy8gSWYgbGFzdCBsZXR0ZXIgd2FzIGEgbW92ZSBjb21tYW5kIGFuZCB3ZSBnb3Qgbm8gbmV3LCBpdCBkZWZhdWx0cyB0byBbTF1pbmVcclxuICAgICAgfWVsc2UgaWYocyA9PSAnTScpe1xyXG4gICAgICAgIHMgPSAnTCdcclxuICAgICAgfWVsc2UgaWYocyA9PSAnbScpe1xyXG4gICAgICAgIHMgPSAnbCdcclxuICAgICAgfVxyXG5cclxuICAgICAgYXJyLnB1c2gocGF0aEhhbmRsZXJzW3NdLmNhbGwobnVsbCxcclxuICAgICAgICAgIGFycmF5LnNsaWNlKGluZGV4LCAoaW5kZXggPSBpbmRleCArIHBhcmFtQ250W3MudG9VcHBlckNhc2UoKV0pKS5tYXAocGFyc2VGbG9hdCksXHJcbiAgICAgICAgICBwLCBwMFxyXG4gICAgICAgIClcclxuICAgICAgKVxyXG5cclxuICAgIH13aGlsZShsZW4gPiBpbmRleClcclxuXHJcbiAgICByZXR1cm4gYXJyXHJcblxyXG4gIH1cclxuICAvLyBHZXQgYm91bmRpbmcgYm94IG9mIHBhdGhcclxuLCBiYm94OiBmdW5jdGlvbigpIHtcclxuICAgIFNWRy5wYXJzZXIucGF0aC5zZXRBdHRyaWJ1dGUoJ2QnLCB0aGlzLnRvU3RyaW5nKCkpXHJcblxyXG4gICAgcmV0dXJuIFNWRy5wYXJzZXIucGF0aC5nZXRCQm94KClcclxuICB9XHJcblxyXG59KVxyXG5cbi8vIE1vZHVsZSBmb3IgdW5pdCBjb252ZXJ0aW9uc1xyXG5TVkcuTnVtYmVyID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24odmFsdWUsIHVuaXQpIHtcclxuICAgIC8vIGluaXRpYWxpemUgZGVmYXVsdHNcclxuICAgIHRoaXMudmFsdWUgPSAwXHJcbiAgICB0aGlzLnVuaXQgID0gdW5pdCB8fCAnJ1xyXG5cclxuICAgIC8vIHBhcnNlIHZhbHVlXHJcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xyXG4gICAgICAvLyBlbnN1cmUgYSB2YWxpZCBudW1lcmljIHZhbHVlXHJcbiAgICAgIHRoaXMudmFsdWUgPSBpc05hTih2YWx1ZSkgPyAwIDogIWlzRmluaXRlKHZhbHVlKSA/ICh2YWx1ZSA8IDAgPyAtMy40ZSszOCA6ICszLjRlKzM4KSA6IHZhbHVlXHJcblxyXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHVuaXQgPSB2YWx1ZS5tYXRjaChTVkcucmVnZXgubnVtYmVyQW5kVW5pdClcclxuXHJcbiAgICAgIGlmICh1bml0KSB7XHJcbiAgICAgICAgLy8gbWFrZSB2YWx1ZSBudW1lcmljXHJcbiAgICAgICAgdGhpcy52YWx1ZSA9IHBhcnNlRmxvYXQodW5pdFsxXSlcclxuXHJcbiAgICAgICAgLy8gbm9ybWFsaXplXHJcbiAgICAgICAgaWYgKHVuaXRbNV0gPT0gJyUnKVxyXG4gICAgICAgICAgdGhpcy52YWx1ZSAvPSAxMDBcclxuICAgICAgICBlbHNlIGlmICh1bml0WzVdID09ICdzJylcclxuICAgICAgICAgIHRoaXMudmFsdWUgKj0gMTAwMFxyXG5cclxuICAgICAgICAvLyBzdG9yZSB1bml0XHJcbiAgICAgICAgdGhpcy51bml0ID0gdW5pdFs1XVxyXG4gICAgICB9XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgU1ZHLk51bWJlcikge1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZS52YWx1ZU9mKClcclxuICAgICAgICB0aGlzLnVuaXQgID0gdmFsdWUudW5pdFxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gIH1cclxuICAvLyBBZGQgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gU3RyaW5nYWxpemVcclxuICAgIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIChcclxuICAgICAgICB0aGlzLnVuaXQgPT0gJyUnID9cclxuICAgICAgICAgIH5+KHRoaXMudmFsdWUgKiAxZTgpIC8gMWU2OlxyXG4gICAgICAgIHRoaXMudW5pdCA9PSAncycgP1xyXG4gICAgICAgICAgdGhpcy52YWx1ZSAvIDFlMyA6XHJcbiAgICAgICAgICB0aGlzLnZhbHVlXHJcbiAgICAgICkgKyB0aGlzLnVuaXRcclxuICAgIH1cclxuICAsIHRvSlNPTjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnRvU3RyaW5nKClcclxuICAgIH1cclxuICAsIC8vIENvbnZlcnQgdG8gcHJpbWl0aXZlXHJcbiAgICB2YWx1ZU9mOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMudmFsdWVcclxuICAgIH1cclxuICAgIC8vIEFkZCBudW1iZXJcclxuICAsIHBsdXM6IGZ1bmN0aW9uKG51bWJlcikge1xyXG4gICAgICBudW1iZXIgPSBuZXcgU1ZHLk51bWJlcihudW1iZXIpXHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLk51bWJlcih0aGlzICsgbnVtYmVyLCB0aGlzLnVuaXQgfHwgbnVtYmVyLnVuaXQpXHJcbiAgICB9XHJcbiAgICAvLyBTdWJ0cmFjdCBudW1iZXJcclxuICAsIG1pbnVzOiBmdW5jdGlvbihudW1iZXIpIHtcclxuICAgICAgbnVtYmVyID0gbmV3IFNWRy5OdW1iZXIobnVtYmVyKVxyXG4gICAgICByZXR1cm4gbmV3IFNWRy5OdW1iZXIodGhpcyAtIG51bWJlciwgdGhpcy51bml0IHx8IG51bWJlci51bml0KVxyXG4gICAgfVxyXG4gICAgLy8gTXVsdGlwbHkgbnVtYmVyXHJcbiAgLCB0aW1lczogZnVuY3Rpb24obnVtYmVyKSB7XHJcbiAgICAgIG51bWJlciA9IG5ldyBTVkcuTnVtYmVyKG51bWJlcilcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuTnVtYmVyKHRoaXMgKiBudW1iZXIsIHRoaXMudW5pdCB8fCBudW1iZXIudW5pdClcclxuICAgIH1cclxuICAgIC8vIERpdmlkZSBudW1iZXJcclxuICAsIGRpdmlkZTogZnVuY3Rpb24obnVtYmVyKSB7XHJcbiAgICAgIG51bWJlciA9IG5ldyBTVkcuTnVtYmVyKG51bWJlcilcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuTnVtYmVyKHRoaXMgLyBudW1iZXIsIHRoaXMudW5pdCB8fCBudW1iZXIudW5pdClcclxuICAgIH1cclxuICAgIC8vIENvbnZlcnQgdG8gZGlmZmVyZW50IHVuaXRcclxuICAsIHRvOiBmdW5jdGlvbih1bml0KSB7XHJcbiAgICAgIHZhciBudW1iZXIgPSBuZXcgU1ZHLk51bWJlcih0aGlzKVxyXG5cclxuICAgICAgaWYgKHR5cGVvZiB1bml0ID09PSAnc3RyaW5nJylcclxuICAgICAgICBudW1iZXIudW5pdCA9IHVuaXRcclxuXHJcbiAgICAgIHJldHVybiBudW1iZXJcclxuICAgIH1cclxuICAgIC8vIE1ha2UgbnVtYmVyIG1vcnBoYWJsZVxyXG4gICwgbW9ycGg6IGZ1bmN0aW9uKG51bWJlcikge1xyXG4gICAgICB0aGlzLmRlc3RpbmF0aW9uID0gbmV3IFNWRy5OdW1iZXIobnVtYmVyKVxyXG5cclxuICAgICAgaWYobnVtYmVyLnJlbGF0aXZlKSB7XHJcbiAgICAgICAgdGhpcy5kZXN0aW5hdGlvbi52YWx1ZSArPSB0aGlzLnZhbHVlXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgbW9ycGhlZCBudW1iZXIgYXQgZ2l2ZW4gcG9zaXRpb25cclxuICAsIGF0OiBmdW5jdGlvbihwb3MpIHtcclxuICAgICAgLy8gTWFrZSBzdXJlIGEgZGVzdGluYXRpb24gaXMgZGVmaW5lZFxyXG4gICAgICBpZiAoIXRoaXMuZGVzdGluYXRpb24pIHJldHVybiB0aGlzXHJcblxyXG4gICAgICAvLyBHZW5lcmF0ZSBuZXcgbW9ycGhlZCBudW1iZXJcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuTnVtYmVyKHRoaXMuZGVzdGluYXRpb24pXHJcbiAgICAgICAgICAubWludXModGhpcylcclxuICAgICAgICAgIC50aW1lcyhwb3MpXHJcbiAgICAgICAgICAucGx1cyh0aGlzKVxyXG4gICAgfVxyXG5cclxuICB9XHJcbn0pXHJcblxuXHJcblNWRy5FbGVtZW50ID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihub2RlKSB7XHJcbiAgICAvLyBtYWtlIHN0cm9rZSB2YWx1ZSBhY2Nlc3NpYmxlIGR5bmFtaWNhbGx5XHJcbiAgICB0aGlzLl9zdHJva2UgPSBTVkcuZGVmYXVsdHMuYXR0cnMuc3Ryb2tlXHJcbiAgICB0aGlzLl9ldmVudCA9IG51bGxcclxuXHJcbiAgICAvLyBpbml0aWFsaXplIGRhdGEgb2JqZWN0XHJcbiAgICB0aGlzLmRvbSA9IHt9XHJcblxyXG4gICAgLy8gY3JlYXRlIGNpcmN1bGFyIHJlZmVyZW5jZVxyXG4gICAgaWYgKHRoaXMubm9kZSA9IG5vZGUpIHtcclxuICAgICAgdGhpcy50eXBlID0gbm9kZS5ub2RlTmFtZVxyXG4gICAgICB0aGlzLm5vZGUuaW5zdGFuY2UgPSB0aGlzXHJcblxyXG4gICAgICAvLyBzdG9yZSBjdXJyZW50IGF0dHJpYnV0ZSB2YWx1ZVxyXG4gICAgICB0aGlzLl9zdHJva2UgPSBub2RlLmdldEF0dHJpYnV0ZSgnc3Ryb2tlJykgfHwgdGhpcy5fc3Ryb2tlXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gTW92ZSBvdmVyIHgtYXhpc1xyXG4gICAgeDogZnVuY3Rpb24oeCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCd4JywgeClcclxuICAgIH1cclxuICAgIC8vIE1vdmUgb3ZlciB5LWF4aXNcclxuICAsIHk6IGZ1bmN0aW9uKHkpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cigneScsIHkpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGJ5IGNlbnRlciBvdmVyIHgtYXhpc1xyXG4gICwgY3g6IGZ1bmN0aW9uKHgpIHtcclxuICAgICAgcmV0dXJuIHggPT0gbnVsbCA/IHRoaXMueCgpICsgdGhpcy53aWR0aCgpIC8gMiA6IHRoaXMueCh4IC0gdGhpcy53aWR0aCgpIC8gMilcclxuICAgIH1cclxuICAgIC8vIE1vdmUgYnkgY2VudGVyIG92ZXIgeS1heGlzXHJcbiAgLCBjeTogZnVuY3Rpb24oeSkge1xyXG4gICAgICByZXR1cm4geSA9PSBudWxsID8gdGhpcy55KCkgKyB0aGlzLmhlaWdodCgpIC8gMiA6IHRoaXMueSh5IC0gdGhpcy5oZWlnaHQoKSAvIDIpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGVsZW1lbnQgdG8gZ2l2ZW4geCBhbmQgeSB2YWx1ZXNcclxuICAsIG1vdmU6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgcmV0dXJuIHRoaXMueCh4KS55KHkpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGVsZW1lbnQgYnkgaXRzIGNlbnRlclxyXG4gICwgY2VudGVyOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmN4KHgpLmN5KHkpXHJcbiAgICB9XHJcbiAgICAvLyBTZXQgd2lkdGggb2YgZWxlbWVudFxyXG4gICwgd2lkdGg6IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ3dpZHRoJywgd2lkdGgpXHJcbiAgICB9XHJcbiAgICAvLyBTZXQgaGVpZ2h0IG9mIGVsZW1lbnRcclxuICAsIGhlaWdodDogZnVuY3Rpb24oaGVpZ2h0KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ2hlaWdodCcsIGhlaWdodClcclxuICAgIH1cclxuICAgIC8vIFNldCBlbGVtZW50IHNpemUgdG8gZ2l2ZW4gd2lkdGggYW5kIGhlaWdodFxyXG4gICwgc2l6ZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xyXG4gICAgICB2YXIgcCA9IHByb3BvcnRpb25hbFNpemUodGhpcywgd2lkdGgsIGhlaWdodClcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICAgICAgLndpZHRoKG5ldyBTVkcuTnVtYmVyKHAud2lkdGgpKVxyXG4gICAgICAgIC5oZWlnaHQobmV3IFNWRy5OdW1iZXIocC5oZWlnaHQpKVxyXG4gICAgfVxyXG4gICAgLy8gQ2xvbmUgZWxlbWVudFxyXG4gICwgY2xvbmU6IGZ1bmN0aW9uKHBhcmVudCwgd2l0aERhdGEpIHtcclxuICAgICAgLy8gd3JpdGUgZG9tIGRhdGEgdG8gdGhlIGRvbSBzbyB0aGUgY2xvbmUgY2FuIHBpY2t1cCB0aGUgZGF0YVxyXG4gICAgICB0aGlzLndyaXRlRGF0YVRvRG9tKClcclxuXHJcbiAgICAgIC8vIGNsb25lIGVsZW1lbnQgYW5kIGFzc2lnbiBuZXcgaWRcclxuICAgICAgdmFyIGNsb25lID0gYXNzaWduTmV3SWQodGhpcy5ub2RlLmNsb25lTm9kZSh0cnVlKSlcclxuXHJcbiAgICAgIC8vIGluc2VydCB0aGUgY2xvbmUgaW4gdGhlIGdpdmVuIHBhcmVudCBvciBhZnRlciBteXNlbGZcclxuICAgICAgaWYocGFyZW50KSBwYXJlbnQuYWRkKGNsb25lKVxyXG4gICAgICBlbHNlIHRoaXMuYWZ0ZXIoY2xvbmUpXHJcblxyXG4gICAgICByZXR1cm4gY2xvbmVcclxuICAgIH1cclxuICAgIC8vIFJlbW92ZSBlbGVtZW50XHJcbiAgLCByZW1vdmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAodGhpcy5wYXJlbnQoKSlcclxuICAgICAgICB0aGlzLnBhcmVudCgpLnJlbW92ZUVsZW1lbnQodGhpcylcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBSZXBsYWNlIGVsZW1lbnRcclxuICAsIHJlcGxhY2U6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgdGhpcy5hZnRlcihlbGVtZW50KS5yZW1vdmUoKVxyXG5cclxuICAgICAgcmV0dXJuIGVsZW1lbnRcclxuICAgIH1cclxuICAgIC8vIEFkZCBlbGVtZW50IHRvIGdpdmVuIGNvbnRhaW5lciBhbmQgcmV0dXJuIHNlbGZcclxuICAsIGFkZFRvOiBmdW5jdGlvbihwYXJlbnQpIHtcclxuICAgICAgcmV0dXJuIHBhcmVudC5wdXQodGhpcylcclxuICAgIH1cclxuICAgIC8vIEFkZCBlbGVtZW50IHRvIGdpdmVuIGNvbnRhaW5lciBhbmQgcmV0dXJuIGNvbnRhaW5lclxyXG4gICwgcHV0SW46IGZ1bmN0aW9uKHBhcmVudCkge1xyXG4gICAgICByZXR1cm4gcGFyZW50LmFkZCh0aGlzKVxyXG4gICAgfVxyXG4gICAgLy8gR2V0IC8gc2V0IGlkXHJcbiAgLCBpZDogZnVuY3Rpb24oaWQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cignaWQnLCBpZClcclxuICAgIH1cclxuICAgIC8vIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBwb2ludCBpbnNpZGUgdGhlIGJvdW5kaW5nIGJveCBvZiB0aGUgZWxlbWVudFxyXG4gICwgaW5zaWRlOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgIHZhciBib3ggPSB0aGlzLmJib3goKVxyXG5cclxuICAgICAgcmV0dXJuIHggPiBib3gueFxyXG4gICAgICAgICAgJiYgeSA+IGJveC55XHJcbiAgICAgICAgICAmJiB4IDwgYm94LnggKyBib3gud2lkdGhcclxuICAgICAgICAgICYmIHkgPCBib3gueSArIGJveC5oZWlnaHRcclxuICAgIH1cclxuICAgIC8vIFNob3cgZWxlbWVudFxyXG4gICwgc2hvdzogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnN0eWxlKCdkaXNwbGF5JywgJycpXHJcbiAgICB9XHJcbiAgICAvLyBIaWRlIGVsZW1lbnRcclxuICAsIGhpZGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdHlsZSgnZGlzcGxheScsICdub25lJylcclxuICAgIH1cclxuICAgIC8vIElzIGVsZW1lbnQgdmlzaWJsZT9cclxuICAsIHZpc2libGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5zdHlsZSgnZGlzcGxheScpICE9ICdub25lJ1xyXG4gICAgfVxyXG4gICAgLy8gUmV0dXJuIGlkIG9uIHN0cmluZyBjb252ZXJzaW9uXHJcbiAgLCB0b1N0cmluZzogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ2lkJylcclxuICAgIH1cclxuICAgIC8vIFJldHVybiBhcnJheSBvZiBjbGFzc2VzIG9uIHRoZSBub2RlXHJcbiAgLCBjbGFzc2VzOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGF0dHIgPSB0aGlzLmF0dHIoJ2NsYXNzJylcclxuXHJcbiAgICAgIHJldHVybiBhdHRyID09IG51bGwgPyBbXSA6IGF0dHIudHJpbSgpLnNwbGl0KFNWRy5yZWdleC5kZWxpbWl0ZXIpXHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm4gdHJ1ZSBpZiBjbGFzcyBleGlzdHMgb24gdGhlIG5vZGUsIGZhbHNlIG90aGVyd2lzZVxyXG4gICwgaGFzQ2xhc3M6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuY2xhc3NlcygpLmluZGV4T2YobmFtZSkgIT0gLTFcclxuICAgIH1cclxuICAgIC8vIEFkZCBjbGFzcyB0byB0aGUgbm9kZVxyXG4gICwgYWRkQ2xhc3M6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgaWYgKCF0aGlzLmhhc0NsYXNzKG5hbWUpKSB7XHJcbiAgICAgICAgdmFyIGFycmF5ID0gdGhpcy5jbGFzc2VzKClcclxuICAgICAgICBhcnJheS5wdXNoKG5hbWUpXHJcbiAgICAgICAgdGhpcy5hdHRyKCdjbGFzcycsIGFycmF5LmpvaW4oJyAnKSlcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIFJlbW92ZSBjbGFzcyBmcm9tIHRoZSBub2RlXHJcbiAgLCByZW1vdmVDbGFzczogZnVuY3Rpb24obmFtZSkge1xyXG4gICAgICBpZiAodGhpcy5oYXNDbGFzcyhuYW1lKSkge1xyXG4gICAgICAgIHRoaXMuYXR0cignY2xhc3MnLCB0aGlzLmNsYXNzZXMoKS5maWx0ZXIoZnVuY3Rpb24oYykge1xyXG4gICAgICAgICAgcmV0dXJuIGMgIT0gbmFtZVxyXG4gICAgICAgIH0pLmpvaW4oJyAnKSlcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIFRvZ2dsZSB0aGUgcHJlc2VuY2Ugb2YgYSBjbGFzcyBvbiB0aGUgbm9kZVxyXG4gICwgdG9nZ2xlQ2xhc3M6IGZ1bmN0aW9uKG5hbWUpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuaGFzQ2xhc3MobmFtZSkgPyB0aGlzLnJlbW92ZUNsYXNzKG5hbWUpIDogdGhpcy5hZGRDbGFzcyhuYW1lKVxyXG4gICAgfVxyXG4gICAgLy8gR2V0IHJlZmVyZW5jZWQgZWxlbWVudCBmb3JtIGF0dHJpYnV0ZSB2YWx1ZVxyXG4gICwgcmVmZXJlbmNlOiBmdW5jdGlvbihhdHRyKSB7XHJcbiAgICAgIHJldHVybiBTVkcuZ2V0KHRoaXMuYXR0cihhdHRyKSlcclxuICAgIH1cclxuICAgIC8vIFJldHVybnMgdGhlIHBhcmVudCBlbGVtZW50IGluc3RhbmNlXHJcbiAgLCBwYXJlbnQ6IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgICAgdmFyIHBhcmVudCA9IHRoaXNcclxuXHJcbiAgICAgIC8vIGNoZWNrIGZvciBwYXJlbnRcclxuICAgICAgaWYoIXBhcmVudC5ub2RlLnBhcmVudE5vZGUpIHJldHVybiBudWxsXHJcblxyXG4gICAgICAvLyBnZXQgcGFyZW50IGVsZW1lbnRcclxuICAgICAgcGFyZW50ID0gU1ZHLmFkb3B0KHBhcmVudC5ub2RlLnBhcmVudE5vZGUpXHJcblxyXG4gICAgICBpZighdHlwZSkgcmV0dXJuIHBhcmVudFxyXG5cclxuICAgICAgLy8gbG9vcCB0cm91Z2ggYW5jZXN0b3JzIGlmIHR5cGUgaXMgZ2l2ZW5cclxuICAgICAgd2hpbGUocGFyZW50ICYmIHBhcmVudC5ub2RlIGluc3RhbmNlb2Ygd2luZG93LlNWR0VsZW1lbnQpe1xyXG4gICAgICAgIGlmKHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHBhcmVudC5tYXRjaGVzKHR5cGUpIDogcGFyZW50IGluc3RhbmNlb2YgdHlwZSkgcmV0dXJuIHBhcmVudFxyXG4gICAgICAgIGlmKHBhcmVudC5ub2RlLnBhcmVudE5vZGUubm9kZU5hbWUgPT0gJyNkb2N1bWVudCcpIHJldHVybiBudWxsIC8vICM3MjBcclxuICAgICAgICBwYXJlbnQgPSBTVkcuYWRvcHQocGFyZW50Lm5vZGUucGFyZW50Tm9kZSlcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gR2V0IHBhcmVudCBkb2N1bWVudFxyXG4gICwgZG9jOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBTVkcuRG9jID8gdGhpcyA6IHRoaXMucGFyZW50KFNWRy5Eb2MpXHJcbiAgICB9XHJcbiAgICAvLyByZXR1cm4gYXJyYXkgb2YgYWxsIGFuY2VzdG9ycyBvZiBnaXZlbiB0eXBlIHVwIHRvIHRoZSByb290IHN2Z1xyXG4gICwgcGFyZW50czogZnVuY3Rpb24odHlwZSkge1xyXG4gICAgICB2YXIgcGFyZW50cyA9IFtdLCBwYXJlbnQgPSB0aGlzXHJcblxyXG4gICAgICBkb3tcclxuICAgICAgICBwYXJlbnQgPSBwYXJlbnQucGFyZW50KHR5cGUpXHJcbiAgICAgICAgaWYoIXBhcmVudCB8fCAhcGFyZW50Lm5vZGUpIGJyZWFrXHJcblxyXG4gICAgICAgIHBhcmVudHMucHVzaChwYXJlbnQpXHJcbiAgICAgIH0gd2hpbGUocGFyZW50LnBhcmVudClcclxuXHJcbiAgICAgIHJldHVybiBwYXJlbnRzXHJcbiAgICB9XHJcbiAgICAvLyBtYXRjaGVzIHRoZSBlbGVtZW50IHZzIGEgY3NzIHNlbGVjdG9yXHJcbiAgLCBtYXRjaGVzOiBmdW5jdGlvbihzZWxlY3Rvcil7XHJcbiAgICAgIHJldHVybiBtYXRjaGVzKHRoaXMubm9kZSwgc2VsZWN0b3IpXHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm5zIHRoZSBzdmcgbm9kZSB0byBjYWxsIG5hdGl2ZSBzdmcgbWV0aG9kcyBvbiBpdFxyXG4gICwgbmF0aXZlOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubm9kZVxyXG4gICAgfVxyXG4gICAgLy8gSW1wb3J0IHJhdyBzdmdcclxuICAsIHN2ZzogZnVuY3Rpb24oc3ZnKSB7XHJcbiAgICAgIC8vIGNyZWF0ZSB0ZW1wb3JhcnkgaG9sZGVyXHJcbiAgICAgIHZhciB3ZWxsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3ZnJylcclxuXHJcbiAgICAgIC8vIGFjdCBhcyBhIHNldHRlciBpZiBzdmcgaXMgZ2l2ZW5cclxuICAgICAgaWYgKHN2ZyAmJiB0aGlzIGluc3RhbmNlb2YgU1ZHLlBhcmVudCkge1xyXG4gICAgICAgIC8vIGR1bXAgcmF3IHN2Z1xyXG4gICAgICAgIHdlbGwuaW5uZXJIVE1MID0gJzxzdmc+JyArIHN2Zy5yZXBsYWNlKC9cXG4vLCAnJykucmVwbGFjZSgvPChcXHcrKShbXjxdKz8pXFwvPi9nLCAnPCQxJDI+PC8kMT4nKSArICc8L3N2Zz4nXHJcblxyXG4gICAgICAgIC8vIHRyYW5zcGxhbnQgbm9kZXNcclxuICAgICAgICBmb3IgKHZhciBpID0gMCwgaWwgPSB3ZWxsLmZpcnN0Q2hpbGQuY2hpbGROb2Rlcy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKHdlbGwuZmlyc3RDaGlsZC5maXJzdENoaWxkKVxyXG5cclxuICAgICAgLy8gb3RoZXJ3aXNlIGFjdCBhcyBhIGdldHRlclxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGNyZWF0ZSBhIHdyYXBwaW5nIHN2ZyBlbGVtZW50IGluIGNhc2Ugb2YgcGFydGlhbCBjb250ZW50XHJcbiAgICAgICAgd2VsbC5hcHBlbmRDaGlsZChzdmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdmcnKSlcclxuXHJcbiAgICAgICAgLy8gd3JpdGUgc3ZnanMgZGF0YSB0byB0aGUgZG9tXHJcbiAgICAgICAgdGhpcy53cml0ZURhdGFUb0RvbSgpXHJcblxyXG4gICAgICAgIC8vIGluc2VydCBhIGNvcHkgb2YgdGhpcyBub2RlXHJcbiAgICAgICAgc3ZnLmFwcGVuZENoaWxkKHRoaXMubm9kZS5jbG9uZU5vZGUodHJ1ZSkpXHJcblxyXG4gICAgICAgIC8vIHJldHVybiB0YXJnZXQgZWxlbWVudFxyXG4gICAgICAgIHJldHVybiB3ZWxsLmlubmVySFRNTC5yZXBsYWNlKC9ePHN2Zz4vLCAnJykucmVwbGFjZSgvPFxcL3N2Zz4kLywgJycpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgLy8gd3JpdGUgc3ZnanMgZGF0YSB0byB0aGUgZG9tXHJcbiAgLCB3cml0ZURhdGFUb0RvbTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgICAvLyBkdW1wIHZhcmlhYmxlcyByZWN1cnNpdmVseVxyXG4gICAgICBpZih0aGlzLmVhY2ggfHwgdGhpcy5saW5lcyl7XHJcbiAgICAgICAgdmFyIGZuID0gdGhpcy5lYWNoID8gdGhpcyA6IHRoaXMubGluZXMoKTtcclxuICAgICAgICBmbi5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICB0aGlzLndyaXRlRGF0YVRvRG9tKClcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyByZW1vdmUgcHJldmlvdXNseSBzZXQgZGF0YVxyXG4gICAgICB0aGlzLm5vZGUucmVtb3ZlQXR0cmlidXRlKCdzdmdqczpkYXRhJylcclxuXHJcbiAgICAgIGlmKE9iamVjdC5rZXlzKHRoaXMuZG9tKS5sZW5ndGgpXHJcbiAgICAgICAgdGhpcy5ub2RlLnNldEF0dHJpYnV0ZSgnc3ZnanM6ZGF0YScsIEpTT04uc3RyaW5naWZ5KHRoaXMuZG9tKSkgLy8gc2VlICM0MjhcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgLy8gc2V0IGdpdmVuIGRhdGEgdG8gdGhlIGVsZW1lbnRzIGRhdGEgcHJvcGVydHlcclxuICAsIHNldERhdGE6IGZ1bmN0aW9uKG8pe1xyXG4gICAgICB0aGlzLmRvbSA9IG9cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAsIGlzOiBmdW5jdGlvbihvYmope1xyXG4gICAgICByZXR1cm4gaXModGhpcywgb2JqKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXG5TVkcuZWFzaW5nID0ge1xyXG4gICctJzogZnVuY3Rpb24ocG9zKXtyZXR1cm4gcG9zfVxyXG4sICc8Pic6ZnVuY3Rpb24ocG9zKXtyZXR1cm4gLU1hdGguY29zKHBvcyAqIE1hdGguUEkpIC8gMiArIDAuNX1cclxuLCAnPic6IGZ1bmN0aW9uKHBvcyl7cmV0dXJuICBNYXRoLnNpbihwb3MgKiBNYXRoLlBJIC8gMil9XHJcbiwgJzwnOiBmdW5jdGlvbihwb3Mpe3JldHVybiAtTWF0aC5jb3MocG9zICogTWF0aC5QSSAvIDIpICsgMX1cclxufVxyXG5cclxuU1ZHLm1vcnBoID0gZnVuY3Rpb24ocG9zKXtcclxuICByZXR1cm4gZnVuY3Rpb24oZnJvbSwgdG8pIHtcclxuICAgIHJldHVybiBuZXcgU1ZHLk1vcnBoT2JqKGZyb20sIHRvKS5hdChwb3MpXHJcbiAgfVxyXG59XHJcblxyXG5TVkcuU2l0dWF0aW9uID0gU1ZHLmludmVudCh7XHJcblxyXG4gIGNyZWF0ZTogZnVuY3Rpb24obyl7XHJcbiAgICB0aGlzLmluaXQgPSBmYWxzZVxyXG4gICAgdGhpcy5yZXZlcnNlZCA9IGZhbHNlXHJcbiAgICB0aGlzLnJldmVyc2luZyA9IGZhbHNlXHJcblxyXG4gICAgdGhpcy5kdXJhdGlvbiA9IG5ldyBTVkcuTnVtYmVyKG8uZHVyYXRpb24pLnZhbHVlT2YoKVxyXG4gICAgdGhpcy5kZWxheSA9IG5ldyBTVkcuTnVtYmVyKG8uZGVsYXkpLnZhbHVlT2YoKVxyXG5cclxuICAgIHRoaXMuc3RhcnQgPSArbmV3IERhdGUoKSArIHRoaXMuZGVsYXlcclxuICAgIHRoaXMuZmluaXNoID0gdGhpcy5zdGFydCArIHRoaXMuZHVyYXRpb25cclxuICAgIHRoaXMuZWFzZSA9IG8uZWFzZVxyXG5cclxuICAgIC8vIHRoaXMubG9vcCBpcyBpbmNyZW1lbnRlZCBmcm9tIDAgdG8gdGhpcy5sb29wc1xyXG4gICAgLy8gaXQgaXMgYWxzbyBpbmNyZW1lbnRlZCB3aGVuIGluIGFuIGluZmluaXRlIGxvb3AgKHdoZW4gdGhpcy5sb29wcyBpcyB0cnVlKVxyXG4gICAgdGhpcy5sb29wID0gMFxyXG4gICAgdGhpcy5sb29wcyA9IGZhbHNlXHJcblxyXG4gICAgdGhpcy5hbmltYXRpb25zID0ge1xyXG4gICAgICAvLyBmdW5jdGlvblRvQ2FsbDogW2xpc3Qgb2YgbW9ycGhhYmxlIG9iamVjdHNdXHJcbiAgICAgIC8vIGUuZy4gbW92ZTogW1NWRy5OdW1iZXIsIFNWRy5OdW1iZXJdXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hdHRycyA9IHtcclxuICAgICAgLy8gaG9sZHMgYWxsIGF0dHJpYnV0ZXMgd2hpY2ggYXJlIG5vdCByZXByZXNlbnRlZCBmcm9tIGEgZnVuY3Rpb24gc3ZnLmpzIHByb3ZpZGVzXHJcbiAgICAgIC8vIGUuZy4gc29tZUF0dHI6IFNWRy5OdW1iZXJcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnN0eWxlcyA9IHtcclxuICAgICAgLy8gaG9sZHMgYWxsIHN0eWxlcyB3aGljaCBzaG91bGQgYmUgYW5pbWF0ZWRcclxuICAgICAgLy8gZS5nLiBmaWxsLWNvbG9yOiBTVkcuQ29sb3JcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyYW5zZm9ybXMgPSBbXHJcbiAgICAgIC8vIGhvbGRzIGFsbCB0cmFuc2Zvcm1hdGlvbnMgYXMgdHJhbnNmb3JtYXRpb24gb2JqZWN0c1xyXG4gICAgICAvLyBlLmcuIFtTVkcuUm90YXRlLCBTVkcuVHJhbnNsYXRlLCBTVkcuTWF0cml4XVxyXG4gICAgXVxyXG5cclxuICAgIHRoaXMub25jZSA9IHtcclxuICAgICAgLy8gZnVuY3Rpb25zIHRvIGZpcmUgYXQgYSBzcGVjaWZpYyBwb3NpdGlvblxyXG4gICAgICAvLyBlLmcuIFwiMC41XCI6IGZ1bmN0aW9uIGZvbygpe31cclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxufSlcclxuXHJcblxyXG5TVkcuRlggPSBTVkcuaW52ZW50KHtcclxuXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICB0aGlzLl90YXJnZXQgPSBlbGVtZW50XHJcbiAgICB0aGlzLnNpdHVhdGlvbnMgPSBbXVxyXG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG4gICAgdGhpcy5zaXR1YXRpb24gPSBudWxsXHJcbiAgICB0aGlzLnBhdXNlZCA9IGZhbHNlXHJcbiAgICB0aGlzLmxhc3RQb3MgPSAwXHJcbiAgICB0aGlzLnBvcyA9IDBcclxuICAgIC8vIFRoZSBhYnNvbHV0ZSBwb3NpdGlvbiBvZiBhbiBhbmltYXRpb24gaXMgaXRzIHBvc2l0aW9uIGluIHRoZSBjb250ZXh0IG9mIGl0cyBjb21wbGV0ZSBkdXJhdGlvbiAoaW5jbHVkaW5nIGRlbGF5IGFuZCBsb29wcylcclxuICAgIC8vIFdoZW4gcGVyZm9ybWluZyBhIGRlbGF5LCBhYnNQb3MgaXMgYmVsb3cgMCBhbmQgd2hlbiBwZXJmb3JtaW5nIGEgbG9vcCwgaXRzIHZhbHVlIGlzIGFib3ZlIDFcclxuICAgIHRoaXMuYWJzUG9zID0gMFxyXG4gICAgdGhpcy5fc3BlZWQgPSAxXHJcbiAgfVxyXG5cclxuLCBleHRlbmQ6IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIHNldHMgb3IgcmV0dXJucyB0aGUgdGFyZ2V0IG9mIHRoaXMgYW5pbWF0aW9uXHJcbiAgICAgKiBAcGFyYW0gbyBvYmplY3QgfHwgbnVtYmVyIEluIGNhc2Ugb2YgT2JqZWN0IGl0IGhvbGRzIGFsbCBwYXJhbWV0ZXJzLiBJbiBjYXNlIG9mIG51bWJlciBpdHMgdGhlIGR1cmF0aW9uIG9mIHRoZSBhbmltYXRpb25cclxuICAgICAqIEBwYXJhbSBlYXNlIGZ1bmN0aW9uIHx8IHN0cmluZyBGdW5jdGlvbiB3aGljaCBzaG91bGQgYmUgdXNlZCBmb3IgZWFzaW5nIG9yIGVhc2luZyBrZXl3b3JkXHJcbiAgICAgKiBAcGFyYW0gZGVsYXkgTnVtYmVyIGluZGljYXRpbmcgdGhlIGRlbGF5IGJlZm9yZSB0aGUgYW5pbWF0aW9uIHN0YXJ0c1xyXG4gICAgICogQHJldHVybiB0YXJnZXQgfHwgdGhpc1xyXG4gICAgICovXHJcbiAgICBhbmltYXRlOiBmdW5jdGlvbihvLCBlYXNlLCBkZWxheSl7XHJcblxyXG4gICAgICBpZih0eXBlb2YgbyA9PSAnb2JqZWN0Jyl7XHJcbiAgICAgICAgZWFzZSA9IG8uZWFzZVxyXG4gICAgICAgIGRlbGF5ID0gby5kZWxheVxyXG4gICAgICAgIG8gPSBvLmR1cmF0aW9uXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBzaXR1YXRpb24gPSBuZXcgU1ZHLlNpdHVhdGlvbih7XHJcbiAgICAgICAgZHVyYXRpb246IG8gfHwgMTAwMCxcclxuICAgICAgICBkZWxheTogZGVsYXkgfHwgMCxcclxuICAgICAgICBlYXNlOiBTVkcuZWFzaW5nW2Vhc2UgfHwgJy0nXSB8fCBlYXNlXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICB0aGlzLnF1ZXVlKHNpdHVhdGlvbilcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZXRzIGEgZGVsYXkgYmVmb3JlIHRoZSBuZXh0IGVsZW1lbnQgb2YgdGhlIHF1ZXVlIGlzIGNhbGxlZFxyXG4gICAgICogQHBhcmFtIGRlbGF5IER1cmF0aW9uIG9mIGRlbGF5IGluIG1pbGxpc2Vjb25kc1xyXG4gICAgICogQHJldHVybiB0aGlzLnRhcmdldCgpXHJcbiAgICAgKi9cclxuICAsIGRlbGF5OiBmdW5jdGlvbihkZWxheSl7XHJcbiAgICAgIC8vIFRoZSBkZWxheSBpcyBwZXJmb3JtZWQgYnkgYW4gZW1wdHkgc2l0dWF0aW9uIHdpdGggaXRzIGR1cmF0aW9uXHJcbiAgICAgIC8vIGF0dHJpYnV0ZSBzZXQgdG8gdGhlIGR1cmF0aW9uIG9mIHRoZSBkZWxheVxyXG4gICAgICB2YXIgc2l0dWF0aW9uID0gbmV3IFNWRy5TaXR1YXRpb24oe1xyXG4gICAgICAgIGR1cmF0aW9uOiBkZWxheSxcclxuICAgICAgICBkZWxheTogMCxcclxuICAgICAgICBlYXNlOiBTVkcuZWFzaW5nWyctJ11cclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLnF1ZXVlKHNpdHVhdGlvbilcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNldHMgb3IgcmV0dXJucyB0aGUgdGFyZ2V0IG9mIHRoaXMgYW5pbWF0aW9uXHJcbiAgICAgKiBAcGFyYW0gbnVsbCB8fCB0YXJnZXQgU1ZHLkVsZW1lbnQgd2hpY2ggc2hvdWxkIGJlIHNldCBhcyBuZXcgdGFyZ2V0XHJcbiAgICAgKiBAcmV0dXJuIHRhcmdldCB8fCB0aGlzXHJcbiAgICAgKi9cclxuICAsIHRhcmdldDogZnVuY3Rpb24odGFyZ2V0KXtcclxuICAgICAgaWYodGFyZ2V0ICYmIHRhcmdldCBpbnN0YW5jZW9mIFNWRy5FbGVtZW50KXtcclxuICAgICAgICB0aGlzLl90YXJnZXQgPSB0YXJnZXRcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5fdGFyZ2V0XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmV0dXJucyB0aGUgYWJzb2x1dGUgcG9zaXRpb24gYXQgYSBnaXZlbiB0aW1lXHJcbiAgLCB0aW1lVG9BYnNQb3M6IGZ1bmN0aW9uKHRpbWVzdGFtcCl7XHJcbiAgICAgIHJldHVybiAodGltZXN0YW1wIC0gdGhpcy5zaXR1YXRpb24uc3RhcnQpIC8gKHRoaXMuc2l0dWF0aW9uLmR1cmF0aW9uL3RoaXMuX3NwZWVkKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHJldHVybnMgdGhlIHRpbWVzdGFtcCBmcm9tIGEgZ2l2ZW4gYWJzb2x1dGUgcG9zaXRvblxyXG4gICwgYWJzUG9zVG9UaW1lOiBmdW5jdGlvbihhYnNQb3Mpe1xyXG4gICAgICByZXR1cm4gdGhpcy5zaXR1YXRpb24uZHVyYXRpb24vdGhpcy5fc3BlZWQgKiBhYnNQb3MgKyB0aGlzLnNpdHVhdGlvbi5zdGFydFxyXG4gICAgfVxyXG5cclxuICAgIC8vIHN0YXJ0cyB0aGUgYW5pbWF0aW9ubG9vcFxyXG4gICwgc3RhcnRBbmltRnJhbWU6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIHRoaXMuc3RvcEFuaW1GcmFtZSgpXHJcbiAgICAgIHRoaXMuYW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uKCl7IHRoaXMuc3RlcCgpIH0uYmluZCh0aGlzKSlcclxuICAgIH1cclxuXHJcbiAgICAvLyBjYW5jZWxzIHRoZSBhbmltYXRpb25mcmFtZVxyXG4gICwgc3RvcEFuaW1GcmFtZTogZnVuY3Rpb24oKXtcclxuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuYW5pbWF0aW9uRnJhbWUpXHJcbiAgICB9XHJcblxyXG4gICAgLy8ga2lja3Mgb2ZmIHRoZSBhbmltYXRpb24gLSBvbmx5IGRvZXMgc29tZXRoaW5nIHdoZW4gdGhlIHF1ZXVlIGlzIGN1cnJlbnRseSBub3QgYWN0aXZlIGFuZCBhdCBsZWFzdCBvbmUgc2l0dWF0aW9uIGlzIHNldFxyXG4gICwgc3RhcnQ6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIC8vIGRvbnQgc3RhcnQgaWYgYWxyZWFkeSBzdGFydGVkXHJcbiAgICAgIGlmKCF0aGlzLmFjdGl2ZSAmJiB0aGlzLnNpdHVhdGlvbil7XHJcbiAgICAgICAgdGhpcy5hY3RpdmUgPSB0cnVlXHJcbiAgICAgICAgdGhpcy5zdGFydEN1cnJlbnQoKVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHN0YXJ0IHRoZSBjdXJyZW50IHNpdHVhdGlvblxyXG4gICwgc3RhcnRDdXJyZW50OiBmdW5jdGlvbigpe1xyXG4gICAgICB0aGlzLnNpdHVhdGlvbi5zdGFydCA9ICtuZXcgRGF0ZSArIHRoaXMuc2l0dWF0aW9uLmRlbGF5L3RoaXMuX3NwZWVkXHJcbiAgICAgIHRoaXMuc2l0dWF0aW9uLmZpbmlzaCA9IHRoaXMuc2l0dWF0aW9uLnN0YXJ0ICsgdGhpcy5zaXR1YXRpb24uZHVyYXRpb24vdGhpcy5fc3BlZWRcclxuICAgICAgcmV0dXJuIHRoaXMuaW5pdEFuaW1hdGlvbnMoKS5zdGVwKClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIGFkZHMgYSBmdW5jdGlvbiAvIFNpdHVhdGlvbiB0byB0aGUgYW5pbWF0aW9uIHF1ZXVlXHJcbiAgICAgKiBAcGFyYW0gZm4gZnVuY3Rpb24gLyBzaXR1YXRpb24gdG8gYWRkXHJcbiAgICAgKiBAcmV0dXJuIHRoaXNcclxuICAgICAqL1xyXG4gICwgcXVldWU6IGZ1bmN0aW9uKGZuKXtcclxuICAgICAgaWYodHlwZW9mIGZuID09ICdmdW5jdGlvbicgfHwgZm4gaW5zdGFuY2VvZiBTVkcuU2l0dWF0aW9uKVxyXG4gICAgICAgIHRoaXMuc2l0dWF0aW9ucy5wdXNoKGZuKVxyXG5cclxuICAgICAgaWYoIXRoaXMuc2l0dWF0aW9uKSB0aGlzLnNpdHVhdGlvbiA9IHRoaXMuc2l0dWF0aW9ucy5zaGlmdCgpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcHVsbHMgbmV4dCBlbGVtZW50IGZyb20gdGhlIHF1ZXVlIGFuZCBleGVjdXRlIGl0XHJcbiAgICAgKiBAcmV0dXJuIHRoaXNcclxuICAgICAqL1xyXG4gICwgZGVxdWV1ZTogZnVuY3Rpb24oKXtcclxuICAgICAgLy8gc3RvcCBjdXJyZW50IGFuaW1hdGlvblxyXG4gICAgICB0aGlzLnN0b3AoKVxyXG5cclxuICAgICAgLy8gZ2V0IG5leHQgYW5pbWF0aW9uIGZyb20gcXVldWVcclxuICAgICAgdGhpcy5zaXR1YXRpb24gPSB0aGlzLnNpdHVhdGlvbnMuc2hpZnQoKVxyXG5cclxuICAgICAgaWYodGhpcy5zaXR1YXRpb24pe1xyXG4gICAgICAgIGlmKHRoaXMuc2l0dWF0aW9uIGluc3RhbmNlb2YgU1ZHLlNpdHVhdGlvbikge1xyXG4gICAgICAgICAgdGhpcy5zdGFydCgpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIElmIGl0IGlzIG5vdCBhIFNWRy5TaXR1YXRpb24sIHRoZW4gaXQgaXMgYSBmdW5jdGlvbiwgd2UgZXhlY3V0ZSBpdFxyXG4gICAgICAgICAgdGhpcy5zaXR1YXRpb24uY2FsbCh0aGlzKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgICAvLyB1cGRhdGVzIGFsbCBhbmltYXRpb25zIHRvIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBlbGVtZW50XHJcbiAgICAvLyB0aGlzIGlzIGltcG9ydGFudCB3aGVuIG9uZSBwcm9wZXJ0eSBjb3VsZCBiZSBjaGFuZ2VkIGZyb20gYW5vdGhlciBwcm9wZXJ0eVxyXG4gICwgaW5pdEFuaW1hdGlvbnM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgaSwgaiwgc291cmNlXHJcbiAgICAgIHZhciBzID0gdGhpcy5zaXR1YXRpb25cclxuXHJcbiAgICAgIGlmKHMuaW5pdCkgcmV0dXJuIHRoaXNcclxuXHJcbiAgICAgIGZvcihpIGluIHMuYW5pbWF0aW9ucyl7XHJcbiAgICAgICAgc291cmNlID0gdGhpcy50YXJnZXQoKVtpXSgpXHJcblxyXG4gICAgICAgIGlmKCFBcnJheS5pc0FycmF5KHNvdXJjZSkpIHtcclxuICAgICAgICAgIHNvdXJjZSA9IFtzb3VyY2VdXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZighQXJyYXkuaXNBcnJheShzLmFuaW1hdGlvbnNbaV0pKSB7XHJcbiAgICAgICAgICBzLmFuaW1hdGlvbnNbaV0gPSBbcy5hbmltYXRpb25zW2ldXVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9pZihzLmFuaW1hdGlvbnNbaV0ubGVuZ3RoID4gc291cmNlLmxlbmd0aCkge1xyXG4gICAgICAgIC8vICBzb3VyY2UuY29uY2F0ID0gc291cmNlLmNvbmNhdChzLmFuaW1hdGlvbnNbaV0uc2xpY2Uoc291cmNlLmxlbmd0aCwgcy5hbmltYXRpb25zW2ldLmxlbmd0aCkpXHJcbiAgICAgICAgLy99XHJcblxyXG4gICAgICAgIGZvcihqID0gc291cmNlLmxlbmd0aDsgai0tOykge1xyXG4gICAgICAgICAgLy8gVGhlIGNvbmRpdGlvbiBpcyBiZWNhdXNlIHNvbWUgbWV0aG9kcyByZXR1cm4gYSBub3JtYWwgbnVtYmVyIGluc3RlYWRcclxuICAgICAgICAgIC8vIG9mIGEgU1ZHLk51bWJlclxyXG4gICAgICAgICAgaWYocy5hbmltYXRpb25zW2ldW2pdIGluc3RhbmNlb2YgU1ZHLk51bWJlcilcclxuICAgICAgICAgICAgc291cmNlW2pdID0gbmV3IFNWRy5OdW1iZXIoc291cmNlW2pdKVxyXG5cclxuICAgICAgICAgIHMuYW5pbWF0aW9uc1tpXVtqXSA9IHNvdXJjZVtqXS5tb3JwaChzLmFuaW1hdGlvbnNbaV1bal0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBmb3IoaSBpbiBzLmF0dHJzKXtcclxuICAgICAgICBzLmF0dHJzW2ldID0gbmV3IFNWRy5Nb3JwaE9iaih0aGlzLnRhcmdldCgpLmF0dHIoaSksIHMuYXR0cnNbaV0pXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvcihpIGluIHMuc3R5bGVzKXtcclxuICAgICAgICBzLnN0eWxlc1tpXSA9IG5ldyBTVkcuTW9ycGhPYmoodGhpcy50YXJnZXQoKS5zdHlsZShpKSwgcy5zdHlsZXNbaV0pXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHMuaW5pdGlhbFRyYW5zZm9ybWF0aW9uID0gdGhpcy50YXJnZXQoKS5tYXRyaXhpZnkoKVxyXG5cclxuICAgICAgcy5pbml0ID0gdHJ1ZVxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICwgY2xlYXJRdWV1ZTogZnVuY3Rpb24oKXtcclxuICAgICAgdGhpcy5zaXR1YXRpb25zID0gW11cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAsIGNsZWFyQ3VycmVudDogZnVuY3Rpb24oKXtcclxuICAgICAgdGhpcy5zaXR1YXRpb24gPSBudWxsXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvKiogc3RvcHMgdGhlIGFuaW1hdGlvbiBpbW1lZGlhdGVseVxyXG4gICAgICogQHBhcmFtIGp1bXBUb0VuZCBBIEJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRvIGNvbXBsZXRlIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBpbW1lZGlhdGVseS5cclxuICAgICAqIEBwYXJhbSBjbGVhclF1ZXVlIEEgQm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gcmVtb3ZlIHF1ZXVlZCBhbmltYXRpb24gYXMgd2VsbC5cclxuICAgICAqIEByZXR1cm4gdGhpc1xyXG4gICAgICovXHJcbiAgLCBzdG9wOiBmdW5jdGlvbihqdW1wVG9FbmQsIGNsZWFyUXVldWUpe1xyXG4gICAgICB2YXIgYWN0aXZlID0gdGhpcy5hY3RpdmVcclxuICAgICAgdGhpcy5hY3RpdmUgPSBmYWxzZVxyXG5cclxuICAgICAgaWYoY2xlYXJRdWV1ZSl7XHJcbiAgICAgICAgdGhpcy5jbGVhclF1ZXVlKClcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYoanVtcFRvRW5kICYmIHRoaXMuc2l0dWF0aW9uKXtcclxuICAgICAgICAvLyBpbml0aWFsaXplIHRoZSBzaXR1YXRpb24gaWYgaXQgd2FzIG5vdFxyXG4gICAgICAgICFhY3RpdmUgJiYgdGhpcy5zdGFydEN1cnJlbnQoKVxyXG4gICAgICAgIHRoaXMuYXRFbmQoKVxyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnN0b3BBbmltRnJhbWUoKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuY2xlYXJDdXJyZW50KClcclxuICAgIH1cclxuXHJcbiAgICAvKiogcmVzZXRzIHRoZSBlbGVtZW50IHRvIHRoZSBzdGF0ZSB3aGVyZSB0aGUgY3VycmVudCBlbGVtZW50IGhhcyBzdGFydGVkXHJcbiAgICAgKiBAcmV0dXJuIHRoaXNcclxuICAgICAqL1xyXG4gICwgcmVzZXQ6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmKHRoaXMuc2l0dWF0aW9uKXtcclxuICAgICAgICB2YXIgdGVtcCA9IHRoaXMuc2l0dWF0aW9uXHJcbiAgICAgICAgdGhpcy5zdG9wKClcclxuICAgICAgICB0aGlzLnNpdHVhdGlvbiA9IHRlbXBcclxuICAgICAgICB0aGlzLmF0U3RhcnQoKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RvcCB0aGUgY3VycmVudGx5LXJ1bm5pbmcgYW5pbWF0aW9uLCByZW1vdmUgYWxsIHF1ZXVlZCBhbmltYXRpb25zLCBhbmQgY29tcGxldGUgYWxsIGFuaW1hdGlvbnMgZm9yIHRoZSBlbGVtZW50LlxyXG4gICwgZmluaXNoOiBmdW5jdGlvbigpe1xyXG5cclxuICAgICAgdGhpcy5zdG9wKHRydWUsIGZhbHNlKVxyXG5cclxuICAgICAgd2hpbGUodGhpcy5kZXF1ZXVlKCkuc2l0dWF0aW9uICYmIHRoaXMuc3RvcCh0cnVlLCBmYWxzZSkpO1xyXG5cclxuICAgICAgdGhpcy5jbGVhclF1ZXVlKCkuY2xlYXJDdXJyZW50KClcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgLy8gc2V0IHRoZSBpbnRlcm5hbCBhbmltYXRpb24gcG9pbnRlciBhdCB0aGUgc3RhcnQgcG9zaXRpb24sIGJlZm9yZSBhbnkgbG9vcHMsIGFuZCB1cGRhdGVzIHRoZSB2aXN1YWxpc2F0aW9uXHJcbiAgLCBhdFN0YXJ0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXQoMCwgdHJ1ZSlcclxuICAgIH1cclxuXHJcbiAgICAvLyBzZXQgdGhlIGludGVybmFsIGFuaW1hdGlvbiBwb2ludGVyIGF0IHRoZSBlbmQgcG9zaXRpb24sIGFmdGVyIGFsbCB0aGUgbG9vcHMsIGFuZCB1cGRhdGVzIHRoZSB2aXN1YWxpc2F0aW9uXHJcbiAgLCBhdEVuZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLnNpdHVhdGlvbi5sb29wcyA9PT0gdHJ1ZSkge1xyXG4gICAgICAgIC8vIElmIGluIGEgaW5maW5pdGUgbG9vcCwgd2UgZW5kIHRoZSBjdXJyZW50IGl0ZXJhdGlvblxyXG4gICAgICAgIHRoaXMuc2l0dWF0aW9uLmxvb3BzID0gdGhpcy5zaXR1YXRpb24ubG9vcCArIDFcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYodHlwZW9mIHRoaXMuc2l0dWF0aW9uLmxvb3BzID09ICdudW1iZXInKSB7XHJcbiAgICAgICAgLy8gSWYgcGVyZm9ybWluZyBhIGZpbml0ZSBudW1iZXIgb2YgbG9vcHMsIHdlIGdvIGFmdGVyIGFsbCB0aGUgbG9vcHNcclxuICAgICAgICByZXR1cm4gdGhpcy5hdCh0aGlzLnNpdHVhdGlvbi5sb29wcywgdHJ1ZSlcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBJZiBubyBsb29wcywgd2UganVzdCBnbyBhdCB0aGUgZW5kXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXQoMSwgdHJ1ZSlcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIHNldCB0aGUgaW50ZXJuYWwgYW5pbWF0aW9uIHBvaW50ZXIgdG8gdGhlIHNwZWNpZmllZCBwb3NpdGlvbiBhbmQgdXBkYXRlcyB0aGUgdmlzdWFsaXNhdGlvblxyXG4gICAgLy8gaWYgaXNBYnNQb3MgaXMgdHJ1ZSwgcG9zIGlzIHRyZWF0ZWQgYXMgYW4gYWJzb2x1dGUgcG9zaXRpb25cclxuICAsIGF0OiBmdW5jdGlvbihwb3MsIGlzQWJzUG9zKXtcclxuICAgICAgdmFyIGR1ckRpdlNwZCA9IHRoaXMuc2l0dWF0aW9uLmR1cmF0aW9uL3RoaXMuX3NwZWVkXHJcblxyXG4gICAgICB0aGlzLmFic1BvcyA9IHBvc1xyXG4gICAgICAvLyBJZiBwb3MgaXMgbm90IGFuIGFic29sdXRlIHBvc2l0aW9uLCB3ZSBjb252ZXJ0IGl0IGludG8gb25lXHJcbiAgICAgIGlmICghaXNBYnNQb3MpIHtcclxuICAgICAgICBpZiAodGhpcy5zaXR1YXRpb24ucmV2ZXJzZWQpIHRoaXMuYWJzUG9zID0gMSAtIHRoaXMuYWJzUG9zXHJcbiAgICAgICAgdGhpcy5hYnNQb3MgKz0gdGhpcy5zaXR1YXRpb24ubG9vcFxyXG4gICAgICB9XHJcblxyXG4gICAgICB0aGlzLnNpdHVhdGlvbi5zdGFydCA9ICtuZXcgRGF0ZSAtIHRoaXMuYWJzUG9zICogZHVyRGl2U3BkXHJcbiAgICAgIHRoaXMuc2l0dWF0aW9uLmZpbmlzaCA9IHRoaXMuc2l0dWF0aW9uLnN0YXJ0ICsgZHVyRGl2U3BkXHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5zdGVwKHRydWUpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBzZXRzIG9yIHJldHVybnMgdGhlIHNwZWVkIG9mIHRoZSBhbmltYXRpb25zXHJcbiAgICAgKiBAcGFyYW0gc3BlZWQgbnVsbCB8fCBOdW1iZXIgVGhlIG5ldyBzcGVlZCBvZiB0aGUgYW5pbWF0aW9uc1xyXG4gICAgICogQHJldHVybiBOdW1iZXIgfHwgdGhpc1xyXG4gICAgICovXHJcbiAgLCBzcGVlZDogZnVuY3Rpb24oc3BlZWQpe1xyXG4gICAgICBpZiAoc3BlZWQgPT09IDApIHJldHVybiB0aGlzLnBhdXNlKClcclxuXHJcbiAgICAgIGlmIChzcGVlZCkge1xyXG4gICAgICAgIHRoaXMuX3NwZWVkID0gc3BlZWRcclxuICAgICAgICAvLyBXZSB1c2UgYW4gYWJzb2x1dGUgcG9zaXRpb24gaGVyZSBzbyB0aGF0IHNwZWVkIGNhbiBhZmZlY3QgdGhlIGRlbGF5IGJlZm9yZSB0aGUgYW5pbWF0aW9uXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXQodGhpcy5hYnNQb3MsIHRydWUpXHJcbiAgICAgIH0gZWxzZSByZXR1cm4gdGhpcy5fc3BlZWRcclxuICAgIH1cclxuXHJcbiAgICAvLyBNYWtlIGxvb3BhYmxlXHJcbiAgLCBsb29wOiBmdW5jdGlvbih0aW1lcywgcmV2ZXJzZSkge1xyXG4gICAgICB2YXIgYyA9IHRoaXMubGFzdCgpXHJcblxyXG4gICAgICAvLyBzdG9yZSB0b3RhbCBsb29wc1xyXG4gICAgICBjLmxvb3BzID0gKHRpbWVzICE9IG51bGwpID8gdGltZXMgOiB0cnVlXHJcbiAgICAgIGMubG9vcCA9IDBcclxuXHJcbiAgICAgIGlmKHJldmVyc2UpIGMucmV2ZXJzaW5nID0gdHJ1ZVxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHBhdXNlcyB0aGUgYW5pbWF0aW9uXHJcbiAgLCBwYXVzZTogZnVuY3Rpb24oKXtcclxuICAgICAgdGhpcy5wYXVzZWQgPSB0cnVlXHJcbiAgICAgIHRoaXMuc3RvcEFuaW1GcmFtZSgpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHVucGF1c2UgdGhlIGFuaW1hdGlvblxyXG4gICwgcGxheTogZnVuY3Rpb24oKXtcclxuICAgICAgaWYoIXRoaXMucGF1c2VkKSByZXR1cm4gdGhpc1xyXG4gICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlXHJcbiAgICAgIC8vIFdlIHVzZSBhbiBhYnNvbHV0ZSBwb3NpdGlvbiBoZXJlIHNvIHRoYXQgdGhlIGRlbGF5IGJlZm9yZSB0aGUgYW5pbWF0aW9uIGNhbiBiZSBwYXVzZWRcclxuICAgICAgcmV0dXJuIHRoaXMuYXQodGhpcy5hYnNQb3MsIHRydWUpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiB0b2dnbGUgb3Igc2V0IHRoZSBkaXJlY3Rpb24gb2YgdGhlIGFuaW1hdGlvblxyXG4gICAgICogdHJ1ZSBzZXRzIGRpcmVjdGlvbiB0byBiYWNrd2FyZHMgd2hpbGUgZmFsc2Ugc2V0cyBpdCB0byBmb3J3YXJkc1xyXG4gICAgICogQHBhcmFtIHJldmVyc2VkIEJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRvIHJldmVyc2UgdGhlIGFuaW1hdGlvbiBvciBub3QgKGRlZmF1bHQ6IHRvZ2dsZSB0aGUgcmV2ZXJzZSBzdGF0dXMpXHJcbiAgICAgKiBAcmV0dXJuIHRoaXNcclxuICAgICAqL1xyXG4gICwgcmV2ZXJzZTogZnVuY3Rpb24ocmV2ZXJzZWQpe1xyXG4gICAgICB2YXIgYyA9IHRoaXMubGFzdCgpXHJcblxyXG4gICAgICBpZih0eXBlb2YgcmV2ZXJzZWQgPT0gJ3VuZGVmaW5lZCcpIGMucmV2ZXJzZWQgPSAhYy5yZXZlcnNlZFxyXG4gICAgICBlbHNlIGMucmV2ZXJzZWQgPSByZXZlcnNlZFxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXR1cm5zIGEgZmxvYXQgZnJvbSAwLTEgaW5kaWNhdGluZyB0aGUgcHJvZ3Jlc3Mgb2YgdGhlIGN1cnJlbnQgYW5pbWF0aW9uXHJcbiAgICAgKiBAcGFyYW0gZWFzZWQgQm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHJldHVybmVkIHBvc2l0aW9uIHNob3VsZCBiZSBlYXNlZCBvciBub3RcclxuICAgICAqIEByZXR1cm4gbnVtYmVyXHJcbiAgICAgKi9cclxuICAsIHByb2dyZXNzOiBmdW5jdGlvbihlYXNlSXQpe1xyXG4gICAgICByZXR1cm4gZWFzZUl0ID8gdGhpcy5zaXR1YXRpb24uZWFzZSh0aGlzLnBvcykgOiB0aGlzLnBvc1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogYWRkcyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBpcyBmaW5pc2hlZFxyXG4gICAgICogQHBhcmFtIGZuIEZ1bmN0aW9uIHdoaWNoIHNob3VsZCBiZSBleGVjdXRlZCBhcyBjYWxsYmFja1xyXG4gICAgICogQHJldHVybiBudW1iZXJcclxuICAgICAqL1xyXG4gICwgYWZ0ZXI6IGZ1bmN0aW9uKGZuKXtcclxuICAgICAgdmFyIGMgPSB0aGlzLmxhc3QoKVxyXG4gICAgICAgICwgd3JhcHBlciA9IGZ1bmN0aW9uIHdyYXBwZXIoZSl7XHJcbiAgICAgICAgICAgIGlmKGUuZGV0YWlsLnNpdHVhdGlvbiA9PSBjKXtcclxuICAgICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGMpXHJcbiAgICAgICAgICAgICAgdGhpcy5vZmYoJ2ZpbmlzaGVkLmZ4Jywgd3JhcHBlcikgLy8gcHJldmVudCBtZW1vcnkgbGVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICB0aGlzLnRhcmdldCgpLm9uKCdmaW5pc2hlZC5meCcsIHdyYXBwZXIpXHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5fY2FsbFN0YXJ0KClcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGRzIGEgY2FsbGJhY2sgd2hpY2ggaXMgY2FsbGVkIHdoZW5ldmVyIG9uZSBhbmltYXRpb24gc3RlcCBpcyBwZXJmb3JtZWRcclxuICAsIGR1cmluZzogZnVuY3Rpb24oZm4pe1xyXG4gICAgICB2YXIgYyA9IHRoaXMubGFzdCgpXHJcbiAgICAgICAgLCB3cmFwcGVyID0gZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICAgIGlmKGUuZGV0YWlsLnNpdHVhdGlvbiA9PSBjKXtcclxuICAgICAgICAgICAgICBmbi5jYWxsKHRoaXMsIGUuZGV0YWlsLnBvcywgU1ZHLm1vcnBoKGUuZGV0YWlsLnBvcyksIGUuZGV0YWlsLmVhc2VkLCBjKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAvLyBzZWUgYWJvdmVcclxuICAgICAgdGhpcy50YXJnZXQoKS5vZmYoJ2R1cmluZy5meCcsIHdyYXBwZXIpLm9uKCdkdXJpbmcuZngnLCB3cmFwcGVyKVxyXG5cclxuICAgICAgdGhpcy5hZnRlcihmdW5jdGlvbigpe1xyXG4gICAgICAgIHRoaXMub2ZmKCdkdXJpbmcuZngnLCB3cmFwcGVyKVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuX2NhbGxTdGFydCgpXHJcbiAgICB9XHJcblxyXG4gICAgLy8gY2FsbHMgYWZ0ZXIgQUxMIGFuaW1hdGlvbnMgaW4gdGhlIHF1ZXVlIGFyZSBmaW5pc2hlZFxyXG4gICwgYWZ0ZXJBbGw6IGZ1bmN0aW9uKGZuKXtcclxuICAgICAgdmFyIHdyYXBwZXIgPSBmdW5jdGlvbiB3cmFwcGVyKGUpe1xyXG4gICAgICAgICAgICBmbi5jYWxsKHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMub2ZmKCdhbGxmaW5pc2hlZC5meCcsIHdyYXBwZXIpXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAvLyBzZWUgYWJvdmVcclxuICAgICAgdGhpcy50YXJnZXQoKS5vZmYoJ2FsbGZpbmlzaGVkLmZ4Jywgd3JhcHBlcikub24oJ2FsbGZpbmlzaGVkLmZ4Jywgd3JhcHBlcilcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLl9jYWxsU3RhcnQoKVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGNhbGxzIG9uIGV2ZXJ5IGFuaW1hdGlvbiBzdGVwIGZvciBhbGwgYW5pbWF0aW9uc1xyXG4gICwgZHVyaW5nQWxsOiBmdW5jdGlvbihmbil7XHJcbiAgICAgIHZhciB3cmFwcGVyID0gZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICAgIGZuLmNhbGwodGhpcywgZS5kZXRhaWwucG9zLCBTVkcubW9ycGgoZS5kZXRhaWwucG9zKSwgZS5kZXRhaWwuZWFzZWQsIGUuZGV0YWlsLnNpdHVhdGlvbilcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMudGFyZ2V0KCkub2ZmKCdkdXJpbmcuZngnLCB3cmFwcGVyKS5vbignZHVyaW5nLmZ4Jywgd3JhcHBlcilcclxuXHJcbiAgICAgIHRoaXMuYWZ0ZXJBbGwoZnVuY3Rpb24oKXtcclxuICAgICAgICB0aGlzLm9mZignZHVyaW5nLmZ4Jywgd3JhcHBlcilcclxuICAgICAgfSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLl9jYWxsU3RhcnQoKVxyXG4gICAgfVxyXG5cclxuICAsIGxhc3Q6IGZ1bmN0aW9uKCl7XHJcbiAgICAgIHJldHVybiB0aGlzLnNpdHVhdGlvbnMubGVuZ3RoID8gdGhpcy5zaXR1YXRpb25zW3RoaXMuc2l0dWF0aW9ucy5sZW5ndGgtMV0gOiB0aGlzLnNpdHVhdGlvblxyXG4gICAgfVxyXG5cclxuICAgIC8vIGFkZHMgb25lIHByb3BlcnR5IHRvIHRoZSBhbmltYXRpb25zXHJcbiAgLCBhZGQ6IGZ1bmN0aW9uKG1ldGhvZCwgYXJncywgdHlwZSl7XHJcbiAgICAgIHRoaXMubGFzdCgpW3R5cGUgfHwgJ2FuaW1hdGlvbnMnXVttZXRob2RdID0gYXJnc1xyXG4gICAgICByZXR1cm4gdGhpcy5fY2FsbFN0YXJ0KClcclxuICAgIH1cclxuXHJcbiAgICAvKiogcGVyZm9ybSBvbmUgc3RlcCBvZiB0aGUgYW5pbWF0aW9uXHJcbiAgICAgKiAgQHBhcmFtIGlnbm9yZVRpbWUgQm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gaWdub3JlIHRpbWUgYW5kIHVzZSBwb3NpdGlvbiBkaXJlY3RseSBvciByZWNhbGN1bGF0ZSBwb3NpdGlvbiBiYXNlZCBvbiB0aW1lXHJcbiAgICAgKiAgQHJldHVybiB0aGlzXHJcbiAgICAgKi9cclxuICAsIHN0ZXA6IGZ1bmN0aW9uKGlnbm9yZVRpbWUpe1xyXG5cclxuICAgICAgLy8gY29udmVydCBjdXJyZW50IHRpbWUgdG8gYW4gYWJzb2x1dGUgcG9zaXRpb25cclxuICAgICAgaWYoIWlnbm9yZVRpbWUpIHRoaXMuYWJzUG9zID0gdGhpcy50aW1lVG9BYnNQb3MoK25ldyBEYXRlKVxyXG5cclxuICAgICAgLy8gVGhpcyBwYXJ0IGNvbnZlcnQgYW4gYWJzb2x1dGUgcG9zaXRpb24gdG8gYSBwb3NpdGlvblxyXG4gICAgICBpZih0aGlzLnNpdHVhdGlvbi5sb29wcyAhPT0gZmFsc2UpIHtcclxuICAgICAgICB2YXIgYWJzUG9zLCBhYnNQb3NJbnQsIGxhc3RMb29wXHJcblxyXG4gICAgICAgIC8vIElmIHRoZSBhYnNvbHV0ZSBwb3NpdGlvbiBpcyBiZWxvdyAwLCB3ZSBqdXN0IHRyZWF0IGl0IGFzIGlmIGl0IHdhcyAwXHJcbiAgICAgICAgYWJzUG9zID0gTWF0aC5tYXgodGhpcy5hYnNQb3MsIDApXHJcbiAgICAgICAgYWJzUG9zSW50ID0gTWF0aC5mbG9vcihhYnNQb3MpXHJcblxyXG4gICAgICAgIGlmKHRoaXMuc2l0dWF0aW9uLmxvb3BzID09PSB0cnVlIHx8IGFic1Bvc0ludCA8IHRoaXMuc2l0dWF0aW9uLmxvb3BzKSB7XHJcbiAgICAgICAgICB0aGlzLnBvcyA9IGFic1BvcyAtIGFic1Bvc0ludFxyXG4gICAgICAgICAgbGFzdExvb3AgPSB0aGlzLnNpdHVhdGlvbi5sb29wXHJcbiAgICAgICAgICB0aGlzLnNpdHVhdGlvbi5sb29wID0gYWJzUG9zSW50XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHRoaXMuYWJzUG9zID0gdGhpcy5zaXR1YXRpb24ubG9vcHNcclxuICAgICAgICAgIHRoaXMucG9zID0gMVxyXG4gICAgICAgICAgLy8gVGhlIC0xIGhlcmUgaXMgYmVjYXVzZSB3ZSBkb24ndCB3YW50IHRvIHRvZ2dsZSByZXZlcnNlZCB3aGVuIGFsbCB0aGUgbG9vcHMgaGF2ZSBiZWVuIGNvbXBsZXRlZFxyXG4gICAgICAgICAgbGFzdExvb3AgPSB0aGlzLnNpdHVhdGlvbi5sb29wIC0gMVxyXG4gICAgICAgICAgdGhpcy5zaXR1YXRpb24ubG9vcCA9IHRoaXMuc2l0dWF0aW9uLmxvb3BzXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLnNpdHVhdGlvbi5yZXZlcnNpbmcpIHtcclxuICAgICAgICAgIC8vIFRvZ2dsZSByZXZlcnNlZCBpZiBhbiBvZGQgbnVtYmVyIG9mIGxvb3BzIGFzIG9jY3VyZWQgc2luY2UgdGhlIGxhc3QgY2FsbCBvZiBzdGVwXHJcbiAgICAgICAgICB0aGlzLnNpdHVhdGlvbi5yZXZlcnNlZCA9IHRoaXMuc2l0dWF0aW9uLnJldmVyc2VkICE9IEJvb2xlYW4oKHRoaXMuc2l0dWF0aW9uLmxvb3AgLSBsYXN0TG9vcCkgJSAyKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIGxvb3AsIHRoZSBhYnNvbHV0ZSBwb3NpdGlvbiBtdXN0IG5vdCBiZSBhYm92ZSAxXHJcbiAgICAgICAgdGhpcy5hYnNQb3MgPSBNYXRoLm1pbih0aGlzLmFic1BvcywgMSlcclxuICAgICAgICB0aGlzLnBvcyA9IHRoaXMuYWJzUG9zXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIHdoaWxlIHRoZSBhYnNvbHV0ZSBwb3NpdGlvbiBjYW4gYmUgYmVsb3cgMCwgdGhlIHBvc2l0aW9uIG11c3Qgbm90IGJlIGJlbG93IDBcclxuICAgICAgaWYodGhpcy5wb3MgPCAwKSB0aGlzLnBvcyA9IDBcclxuXHJcbiAgICAgIGlmKHRoaXMuc2l0dWF0aW9uLnJldmVyc2VkKSB0aGlzLnBvcyA9IDEgLSB0aGlzLnBvc1xyXG5cclxuXHJcbiAgICAgIC8vIGFwcGx5IGVhc2luZ1xyXG4gICAgICB2YXIgZWFzZWQgPSB0aGlzLnNpdHVhdGlvbi5lYXNlKHRoaXMucG9zKVxyXG5cclxuICAgICAgLy8gY2FsbCBvbmNlLWNhbGxiYWNrc1xyXG4gICAgICBmb3IodmFyIGkgaW4gdGhpcy5zaXR1YXRpb24ub25jZSl7XHJcbiAgICAgICAgaWYoaSA+IHRoaXMubGFzdFBvcyAmJiBpIDw9IGVhc2VkKXtcclxuICAgICAgICAgIHRoaXMuc2l0dWF0aW9uLm9uY2VbaV0uY2FsbCh0aGlzLnRhcmdldCgpLCB0aGlzLnBvcywgZWFzZWQpXHJcbiAgICAgICAgICBkZWxldGUgdGhpcy5zaXR1YXRpb24ub25jZVtpXVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZmlyZSBkdXJpbmcgY2FsbGJhY2sgd2l0aCBwb3NpdGlvbiwgZWFzZWQgcG9zaXRpb24gYW5kIGN1cnJlbnQgc2l0dWF0aW9uIGFzIHBhcmFtZXRlclxyXG4gICAgICBpZih0aGlzLmFjdGl2ZSkgdGhpcy50YXJnZXQoKS5maXJlKCdkdXJpbmcnLCB7cG9zOiB0aGlzLnBvcywgZWFzZWQ6IGVhc2VkLCBmeDogdGhpcywgc2l0dWF0aW9uOiB0aGlzLnNpdHVhdGlvbn0pXHJcblxyXG4gICAgICAvLyB0aGUgdXNlciBtYXkgY2FsbCBzdG9wIG9yIGZpbmlzaCBpbiB0aGUgZHVyaW5nIGNhbGxiYWNrXHJcbiAgICAgIC8vIHNvIG1ha2Ugc3VyZSB0aGF0IHdlIHN0aWxsIGhhdmUgYSB2YWxpZCBzaXR1YXRpb25cclxuICAgICAgaWYoIXRoaXMuc2l0dWF0aW9uKXtcclxuICAgICAgICByZXR1cm4gdGhpc1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBhcHBseSB0aGUgYWN0dWFsIGFuaW1hdGlvbiB0byBldmVyeSBwcm9wZXJ0eVxyXG4gICAgICB0aGlzLmVhY2hBdCgpXHJcblxyXG4gICAgICAvLyBkbyBmaW5hbCBjb2RlIHdoZW4gc2l0dWF0aW9uIGlzIGZpbmlzaGVkXHJcbiAgICAgIGlmKCh0aGlzLnBvcyA9PSAxICYmICF0aGlzLnNpdHVhdGlvbi5yZXZlcnNlZCkgfHwgKHRoaXMuc2l0dWF0aW9uLnJldmVyc2VkICYmIHRoaXMucG9zID09IDApKXtcclxuXHJcbiAgICAgICAgLy8gc3RvcCBhbmltYXRpb24gY2FsbGJhY2tcclxuICAgICAgICB0aGlzLnN0b3BBbmltRnJhbWUoKVxyXG5cclxuICAgICAgICAvLyBmaXJlIGZpbmlzaGVkIGNhbGxiYWNrIHdpdGggY3VycmVudCBzaXR1YXRpb24gYXMgcGFyYW1ldGVyXHJcbiAgICAgICAgdGhpcy50YXJnZXQoKS5maXJlKCdmaW5pc2hlZCcsIHtmeDp0aGlzLCBzaXR1YXRpb246IHRoaXMuc2l0dWF0aW9ufSlcclxuXHJcbiAgICAgICAgaWYoIXRoaXMuc2l0dWF0aW9ucy5sZW5ndGgpe1xyXG4gICAgICAgICAgdGhpcy50YXJnZXQoKS5maXJlKCdhbGxmaW5pc2hlZCcpXHJcblxyXG4gICAgICAgICAgLy8gUmVjaGVjayB0aGUgbGVuZ3RoIHNpbmNlIHRoZSB1c2VyIG1heSBjYWxsIGFuaW1hdGUgaW4gdGhlIGFmdGVyQWxsIGNhbGxiYWNrXHJcbiAgICAgICAgICBpZighdGhpcy5zaXR1YXRpb25zLmxlbmd0aCl7XHJcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0KCkub2ZmKCcuZngnKSAvLyB0aGVyZSBzaG91bGRudCBiZSBhbnkgYmluZGluZyBsZWZ0LCBidXQgdG8gbWFrZSBzdXJlLi4uXHJcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlID0gZmFsc2VcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHN0YXJ0IG5leHQgYW5pbWF0aW9uXHJcbiAgICAgICAgaWYodGhpcy5hY3RpdmUpIHRoaXMuZGVxdWV1ZSgpXHJcbiAgICAgICAgZWxzZSB0aGlzLmNsZWFyQ3VycmVudCgpXHJcblxyXG4gICAgICB9ZWxzZSBpZighdGhpcy5wYXVzZWQgJiYgdGhpcy5hY3RpdmUpe1xyXG4gICAgICAgIC8vIHdlIGNvbnRpbnVlIGFuaW1hdGluZyB3aGVuIHdlIGFyZSBub3QgYXQgdGhlIGVuZFxyXG4gICAgICAgIHRoaXMuc3RhcnRBbmltRnJhbWUoKVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzYXZlIGxhc3QgZWFzZWQgcG9zaXRpb24gZm9yIG9uY2UgY2FsbGJhY2sgdHJpZ2dlcmluZ1xyXG4gICAgICB0aGlzLmxhc3RQb3MgPSBlYXNlZFxyXG4gICAgICByZXR1cm4gdGhpc1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLyBjYWxjdWxhdGVzIHRoZSBzdGVwIGZvciBldmVyeSBwcm9wZXJ0eSBhbmQgY2FsbHMgYmxvY2sgd2l0aCBpdFxyXG4gICwgZWFjaEF0OiBmdW5jdGlvbigpe1xyXG4gICAgICB2YXIgaSwgbGVuLCBhdCwgc2VsZiA9IHRoaXMsIHRhcmdldCA9IHRoaXMudGFyZ2V0KCksIHMgPSB0aGlzLnNpdHVhdGlvblxyXG5cclxuICAgICAgLy8gYXBwbHkgYW5pbWF0aW9ucyB3aGljaCBjYW4gYmUgY2FsbGVkIHRyb3VnaCBhIG1ldGhvZFxyXG4gICAgICBmb3IoaSBpbiBzLmFuaW1hdGlvbnMpe1xyXG5cclxuICAgICAgICBhdCA9IFtdLmNvbmNhdChzLmFuaW1hdGlvbnNbaV0pLm1hcChmdW5jdGlvbihlbCl7XHJcbiAgICAgICAgICByZXR1cm4gdHlwZW9mIGVsICE9PSAnc3RyaW5nJyAmJiBlbC5hdCA/IGVsLmF0KHMuZWFzZShzZWxmLnBvcyksIHNlbGYucG9zKSA6IGVsXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGFyZ2V0W2ldLmFwcGx5KHRhcmdldCwgYXQpXHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBhcHBseSBhbmltYXRpb24gd2hpY2ggaGFzIHRvIGJlIGFwcGxpZWQgd2l0aCBhdHRyKClcclxuICAgICAgZm9yKGkgaW4gcy5hdHRycyl7XHJcblxyXG4gICAgICAgIGF0ID0gW2ldLmNvbmNhdChzLmF0dHJzW2ldKS5tYXAoZnVuY3Rpb24oZWwpe1xyXG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBlbCAhPT0gJ3N0cmluZycgJiYgZWwuYXQgPyBlbC5hdChzLmVhc2Uoc2VsZi5wb3MpLCBzZWxmLnBvcykgOiBlbFxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRhcmdldC5hdHRyLmFwcGx5KHRhcmdldCwgYXQpXHJcblxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBhcHBseSBhbmltYXRpb24gd2hpY2ggaGFzIHRvIGJlIGFwcGxpZWQgd2l0aCBzdHlsZSgpXHJcbiAgICAgIGZvcihpIGluIHMuc3R5bGVzKXtcclxuXHJcbiAgICAgICAgYXQgPSBbaV0uY29uY2F0KHMuc3R5bGVzW2ldKS5tYXAoZnVuY3Rpb24oZWwpe1xyXG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiBlbCAhPT0gJ3N0cmluZycgJiYgZWwuYXQgPyBlbC5hdChzLmVhc2Uoc2VsZi5wb3MpLCBzZWxmLnBvcykgOiBlbFxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRhcmdldC5zdHlsZS5hcHBseSh0YXJnZXQsIGF0KVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gYW5pbWF0ZSBpbml0aWFsVHJhbnNmb3JtYXRpb24gd2hpY2ggaGFzIHRvIGJlIGNoYWluZWRcclxuICAgICAgaWYocy50cmFuc2Zvcm1zLmxlbmd0aCl7XHJcblxyXG4gICAgICAgIC8vIGdldCBpbml0aWFsIGluaXRpYWxUcmFuc2Zvcm1hdGlvblxyXG4gICAgICAgIGF0ID0gcy5pbml0aWFsVHJhbnNmb3JtYXRpb25cclxuICAgICAgICBmb3IoaSA9IDAsIGxlbiA9IHMudHJhbnNmb3Jtcy5sZW5ndGg7IGkgPCBsZW47IGkrKyl7XHJcblxyXG4gICAgICAgICAgLy8gZ2V0IG5leHQgdHJhbnNmb3JtYXRpb24gaW4gY2hhaW5cclxuICAgICAgICAgIHZhciBhID0gcy50cmFuc2Zvcm1zW2ldXHJcblxyXG4gICAgICAgICAgLy8gbXVsdGlwbHkgbWF0cml4IGRpcmVjdGx5XHJcbiAgICAgICAgICBpZihhIGluc3RhbmNlb2YgU1ZHLk1hdHJpeCl7XHJcblxyXG4gICAgICAgICAgICBpZihhLnJlbGF0aXZlKXtcclxuICAgICAgICAgICAgICBhdCA9IGF0Lm11bHRpcGx5KG5ldyBTVkcuTWF0cml4KCkubW9ycGgoYSkuYXQocy5lYXNlKHRoaXMucG9zKSkpXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgIGF0ID0gYXQubW9ycGgoYSkuYXQocy5lYXNlKHRoaXMucG9zKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIHdoZW4gdHJhbnNmb3JtYXRpb24gaXMgYWJzb2x1dGUgd2UgaGF2ZSB0byByZXNldCB0aGUgbmVlZGVkIHRyYW5zZm9ybWF0aW9uIGZpcnN0XHJcbiAgICAgICAgICBpZighYS5yZWxhdGl2ZSlcclxuICAgICAgICAgICAgYS51bmRvKGF0LmV4dHJhY3QoKSlcclxuXHJcbiAgICAgICAgICAvLyBhbmQgcmVhcHBseSBpdCBhZnRlclxyXG4gICAgICAgICAgYXQgPSBhdC5tdWx0aXBseShhLmF0KHMuZWFzZSh0aGlzLnBvcykpKVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNldCBuZXcgbWF0cml4IG9uIGVsZW1lbnRcclxuICAgICAgICB0YXJnZXQubWF0cml4KGF0KVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gYWRkcyBhbiBvbmNlLWNhbGxiYWNrIHdoaWNoIGlzIGNhbGxlZCBhdCBhIHNwZWNpZmljIHBvc2l0aW9uIGFuZCBuZXZlciBhZ2FpblxyXG4gICwgb25jZTogZnVuY3Rpb24ocG9zLCBmbiwgaXNFYXNlZCl7XHJcbiAgICAgIHZhciBjID0gdGhpcy5sYXN0KClcclxuICAgICAgaWYoIWlzRWFzZWQpIHBvcyA9IGMuZWFzZShwb3MpXHJcblxyXG4gICAgICBjLm9uY2VbcG9zXSA9IGZuXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAsIF9jYWxsU3RhcnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7dGhpcy5zdGFydCgpfS5iaW5kKHRoaXMpLCAwKVxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4sIHBhcmVudDogU1ZHLkVsZW1lbnRcclxuXHJcbiAgLy8gQWRkIG1ldGhvZCB0byBwYXJlbnQgZWxlbWVudHNcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIEdldCBmeCBtb2R1bGUgb3IgY3JlYXRlIGEgbmV3IG9uZSwgdGhlbiBhbmltYXRlIHdpdGggZ2l2ZW4gZHVyYXRpb24gYW5kIGVhc2VcclxuICAgIGFuaW1hdGU6IGZ1bmN0aW9uKG8sIGVhc2UsIGRlbGF5KSB7XHJcbiAgICAgIHJldHVybiAodGhpcy5meCB8fCAodGhpcy5meCA9IG5ldyBTVkcuRlgodGhpcykpKS5hbmltYXRlKG8sIGVhc2UsIGRlbGF5KVxyXG4gICAgfVxyXG4gICwgZGVsYXk6IGZ1bmN0aW9uKGRlbGF5KXtcclxuICAgICAgcmV0dXJuICh0aGlzLmZ4IHx8ICh0aGlzLmZ4ID0gbmV3IFNWRy5GWCh0aGlzKSkpLmRlbGF5KGRlbGF5KVxyXG4gICAgfVxyXG4gICwgc3RvcDogZnVuY3Rpb24oanVtcFRvRW5kLCBjbGVhclF1ZXVlKSB7XHJcbiAgICAgIGlmICh0aGlzLmZ4KVxyXG4gICAgICAgIHRoaXMuZnguc3RvcChqdW1wVG9FbmQsIGNsZWFyUXVldWUpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICwgZmluaXNoOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMuZngpXHJcbiAgICAgICAgdGhpcy5meC5maW5pc2goKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIFBhdXNlIGN1cnJlbnQgYW5pbWF0aW9uXHJcbiAgLCBwYXVzZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLmZ4KVxyXG4gICAgICAgIHRoaXMuZngucGF1c2UoKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIFBsYXkgcGF1c2VkIGN1cnJlbnQgYW5pbWF0aW9uXHJcbiAgLCBwbGF5OiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMuZngpXHJcbiAgICAgICAgdGhpcy5meC5wbGF5KClcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBTZXQvR2V0IHRoZSBzcGVlZCBvZiB0aGUgYW5pbWF0aW9uc1xyXG4gICwgc3BlZWQ6IGZ1bmN0aW9uKHNwZWVkKSB7XHJcbiAgICAgIGlmICh0aGlzLmZ4KVxyXG4gICAgICAgIGlmIChzcGVlZCA9PSBudWxsKVxyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuZnguc3BlZWQoKVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICAgIHRoaXMuZnguc3BlZWQoc3BlZWQpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG4vLyBNb3JwaE9iaiBpcyB1c2VkIHdoZW5ldmVyIG5vIG1vcnBoYWJsZSBvYmplY3QgaXMgZ2l2ZW5cclxuU1ZHLk1vcnBoT2JqID0gU1ZHLmludmVudCh7XHJcblxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oZnJvbSwgdG8pe1xyXG4gICAgLy8gcHJlcGFyZSBjb2xvciBmb3IgbW9ycGhpbmdcclxuICAgIGlmKFNWRy5Db2xvci5pc0NvbG9yKHRvKSkgcmV0dXJuIG5ldyBTVkcuQ29sb3IoZnJvbSkubW9ycGgodG8pXHJcbiAgICAvLyBwcmVwYXJlIHZhbHVlIGxpc3QgZm9yIG1vcnBoaW5nXHJcbiAgICBpZihTVkcucmVnZXguZGVsaW1pdGVyLnRlc3QoZnJvbSkpIHJldHVybiBuZXcgU1ZHLkFycmF5KGZyb20pLm1vcnBoKHRvKVxyXG4gICAgLy8gcHJlcGFyZSBudW1iZXIgZm9yIG1vcnBoaW5nXHJcbiAgICBpZihTVkcucmVnZXgubnVtYmVyQW5kVW5pdC50ZXN0KHRvKSkgcmV0dXJuIG5ldyBTVkcuTnVtYmVyKGZyb20pLm1vcnBoKHRvKVxyXG5cclxuICAgIC8vIHByZXBhcmUgZm9yIHBsYWluIG1vcnBoaW5nXHJcbiAgICB0aGlzLnZhbHVlID0gZnJvbVxyXG4gICAgdGhpcy5kZXN0aW5hdGlvbiA9IHRvXHJcbiAgfVxyXG5cclxuLCBleHRlbmQ6IHtcclxuICAgIGF0OiBmdW5jdGlvbihwb3MsIHJlYWwpe1xyXG4gICAgICByZXR1cm4gcmVhbCA8IDEgPyB0aGlzLnZhbHVlIDogdGhpcy5kZXN0aW5hdGlvblxyXG4gICAgfSxcclxuXHJcbiAgICB2YWx1ZU9mOiBmdW5jdGlvbigpe1xyXG4gICAgICByZXR1cm4gdGhpcy52YWx1ZVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5GWCwge1xyXG4gIC8vIEFkZCBhbmltYXRhYmxlIGF0dHJpYnV0ZXNcclxuICBhdHRyOiBmdW5jdGlvbihhLCB2LCByZWxhdGl2ZSkge1xyXG4gICAgLy8gYXBwbHkgYXR0cmlidXRlcyBpbmRpdmlkdWFsbHlcclxuICAgIGlmICh0eXBlb2YgYSA9PSAnb2JqZWN0Jykge1xyXG4gICAgICBmb3IgKHZhciBrZXkgaW4gYSlcclxuICAgICAgICB0aGlzLmF0dHIoa2V5LCBhW2tleV0pXHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5hZGQoYSwgdiwgJ2F0dHJzJylcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBBZGQgYW5pbWF0YWJsZSBzdHlsZXNcclxuLCBzdHlsZTogZnVuY3Rpb24ocywgdikge1xyXG4gICAgaWYgKHR5cGVvZiBzID09ICdvYmplY3QnKVxyXG4gICAgICBmb3IgKHZhciBrZXkgaW4gcylcclxuICAgICAgICB0aGlzLnN0eWxlKGtleSwgc1trZXldKVxyXG5cclxuICAgIGVsc2VcclxuICAgICAgdGhpcy5hZGQocywgdiwgJ3N0eWxlcycpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gQW5pbWF0YWJsZSB4LWF4aXNcclxuLCB4OiBmdW5jdGlvbih4LCByZWxhdGl2ZSkge1xyXG4gICAgaWYodGhpcy50YXJnZXQoKSBpbnN0YW5jZW9mIFNWRy5HKXtcclxuICAgICAgdGhpcy50cmFuc2Zvcm0oe3g6eH0sIHJlbGF0aXZlKVxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBudW0gPSBuZXcgU1ZHLk51bWJlcih4KVxyXG4gICAgbnVtLnJlbGF0aXZlID0gcmVsYXRpdmVcclxuICAgIHJldHVybiB0aGlzLmFkZCgneCcsIG51bSlcclxuICB9XHJcbiAgLy8gQW5pbWF0YWJsZSB5LWF4aXNcclxuLCB5OiBmdW5jdGlvbih5LCByZWxhdGl2ZSkge1xyXG4gICAgaWYodGhpcy50YXJnZXQoKSBpbnN0YW5jZW9mIFNWRy5HKXtcclxuICAgICAgdGhpcy50cmFuc2Zvcm0oe3k6eX0sIHJlbGF0aXZlKVxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBudW0gPSBuZXcgU1ZHLk51bWJlcih5KVxyXG4gICAgbnVtLnJlbGF0aXZlID0gcmVsYXRpdmVcclxuICAgIHJldHVybiB0aGlzLmFkZCgneScsIG51bSlcclxuICB9XHJcbiAgLy8gQW5pbWF0YWJsZSBjZW50ZXIgeC1heGlzXHJcbiwgY3g6IGZ1bmN0aW9uKHgpIHtcclxuICAgIHJldHVybiB0aGlzLmFkZCgnY3gnLCBuZXcgU1ZHLk51bWJlcih4KSlcclxuICB9XHJcbiAgLy8gQW5pbWF0YWJsZSBjZW50ZXIgeS1heGlzXHJcbiwgY3k6IGZ1bmN0aW9uKHkpIHtcclxuICAgIHJldHVybiB0aGlzLmFkZCgnY3knLCBuZXcgU1ZHLk51bWJlcih5KSlcclxuICB9XHJcbiAgLy8gQWRkIGFuaW1hdGFibGUgbW92ZVxyXG4sIG1vdmU6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHJldHVybiB0aGlzLngoeCkueSh5KVxyXG4gIH1cclxuICAvLyBBZGQgYW5pbWF0YWJsZSBjZW50ZXJcclxuLCBjZW50ZXI6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgIHJldHVybiB0aGlzLmN4KHgpLmN5KHkpXHJcbiAgfVxyXG4gIC8vIEFkZCBhbmltYXRhYmxlIHNpemVcclxuLCBzaXplOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICBpZiAodGhpcy50YXJnZXQoKSBpbnN0YW5jZW9mIFNWRy5UZXh0KSB7XHJcbiAgICAgIC8vIGFuaW1hdGUgZm9udCBzaXplIGZvciBUZXh0IGVsZW1lbnRzXHJcbiAgICAgIHRoaXMuYXR0cignZm9udC1zaXplJywgd2lkdGgpXHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gYW5pbWF0ZSBiYm94IGJhc2VkIHNpemUgZm9yIGFsbCBvdGhlciBlbGVtZW50c1xyXG4gICAgICB2YXIgYm94XHJcblxyXG4gICAgICBpZighd2lkdGggfHwgIWhlaWdodCl7XHJcbiAgICAgICAgYm94ID0gdGhpcy50YXJnZXQoKS5iYm94KClcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYoIXdpZHRoKXtcclxuICAgICAgICB3aWR0aCA9IGJveC53aWR0aCAvIGJveC5oZWlnaHQgICogaGVpZ2h0XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmKCFoZWlnaHQpe1xyXG4gICAgICAgIGhlaWdodCA9IGJveC5oZWlnaHQgLyBib3gud2lkdGggICogd2lkdGhcclxuICAgICAgfVxyXG5cclxuICAgICAgdGhpcy5hZGQoJ3dpZHRoJyAsIG5ldyBTVkcuTnVtYmVyKHdpZHRoKSlcclxuICAgICAgICAgIC5hZGQoJ2hlaWdodCcsIG5ldyBTVkcuTnVtYmVyKGhlaWdodCkpXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIEFkZCBhbmltYXRhYmxlIHdpZHRoXHJcbiwgd2lkdGg6IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hZGQoJ3dpZHRoJywgbmV3IFNWRy5OdW1iZXIod2lkdGgpKVxyXG4gIH1cclxuICAvLyBBZGQgYW5pbWF0YWJsZSBoZWlnaHRcclxuLCBoZWlnaHQ6IGZ1bmN0aW9uKGhlaWdodCkge1xyXG4gICAgcmV0dXJuIHRoaXMuYWRkKCdoZWlnaHQnLCBuZXcgU1ZHLk51bWJlcihoZWlnaHQpKVxyXG4gIH1cclxuICAvLyBBZGQgYW5pbWF0YWJsZSBwbG90XHJcbiwgcGxvdDogZnVuY3Rpb24oYSwgYiwgYywgZCkge1xyXG4gICAgLy8gTGluZXMgY2FuIGJlIHBsb3R0ZWQgd2l0aCA0IGFyZ3VtZW50c1xyXG4gICAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PSA0KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnBsb3QoW2EsIGIsIGMsIGRdKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLmFkZCgncGxvdCcsIG5ldyAodGhpcy50YXJnZXQoKS5tb3JwaEFycmF5KShhKSlcclxuICB9XHJcbiAgLy8gQWRkIGxlYWRpbmcgbWV0aG9kXHJcbiwgbGVhZGluZzogZnVuY3Rpb24odmFsdWUpIHtcclxuICAgIHJldHVybiB0aGlzLnRhcmdldCgpLmxlYWRpbmcgP1xyXG4gICAgICB0aGlzLmFkZCgnbGVhZGluZycsIG5ldyBTVkcuTnVtYmVyKHZhbHVlKSkgOlxyXG4gICAgICB0aGlzXHJcbiAgfVxyXG4gIC8vIEFkZCBhbmltYXRhYmxlIHZpZXdib3hcclxuLCB2aWV3Ym94OiBmdW5jdGlvbih4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICBpZiAodGhpcy50YXJnZXQoKSBpbnN0YW5jZW9mIFNWRy5Db250YWluZXIpIHtcclxuICAgICAgdGhpcy5hZGQoJ3ZpZXdib3gnLCBuZXcgU1ZHLlZpZXdCb3goeCwgeSwgd2lkdGgsIGhlaWdodCkpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiwgdXBkYXRlOiBmdW5jdGlvbihvKSB7XHJcbiAgICBpZiAodGhpcy50YXJnZXQoKSBpbnN0YW5jZW9mIFNWRy5TdG9wKSB7XHJcbiAgICAgIGlmICh0eXBlb2YgbyA9PSAnbnVtYmVyJyB8fCBvIGluc3RhbmNlb2YgU1ZHLk51bWJlcikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVwZGF0ZSh7XHJcbiAgICAgICAgICBvZmZzZXQ6ICBhcmd1bWVudHNbMF1cclxuICAgICAgICAsIGNvbG9yOiAgIGFyZ3VtZW50c1sxXVxyXG4gICAgICAgICwgb3BhY2l0eTogYXJndW1lbnRzWzJdXHJcbiAgICAgICAgfSlcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKG8ub3BhY2l0eSAhPSBudWxsKSB0aGlzLmF0dHIoJ3N0b3Atb3BhY2l0eScsIG8ub3BhY2l0eSlcclxuICAgICAgaWYgKG8uY29sb3IgICAhPSBudWxsKSB0aGlzLmF0dHIoJ3N0b3AtY29sb3InLCBvLmNvbG9yKVxyXG4gICAgICBpZiAoby5vZmZzZXQgICE9IG51bGwpIHRoaXMuYXR0cignb2Zmc2V0Jywgby5vZmZzZXQpXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbn0pXHJcblxuU1ZHLkJveCA9IFNWRy5pbnZlbnQoe1xyXG4gIGNyZWF0ZTogZnVuY3Rpb24oeCwgeSwgd2lkdGgsIGhlaWdodCkge1xyXG4gICAgaWYgKHR5cGVvZiB4ID09ICdvYmplY3QnICYmICEoeCBpbnN0YW5jZW9mIFNWRy5FbGVtZW50KSkge1xyXG4gICAgICAvLyBjaHJvbWVzIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBoYXMgbm8geCBhbmQgeSBwcm9wZXJ0eVxyXG4gICAgICByZXR1cm4gU1ZHLkJveC5jYWxsKHRoaXMsIHgubGVmdCAhPSBudWxsID8geC5sZWZ0IDogeC54ICwgeC50b3AgIT0gbnVsbCA/IHgudG9wIDogeC55LCB4LndpZHRoLCB4LmhlaWdodClcclxuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSA0KSB7XHJcbiAgICAgIHRoaXMueCA9IHhcclxuICAgICAgdGhpcy55ID0geVxyXG4gICAgICB0aGlzLndpZHRoID0gd2lkdGhcclxuICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHRcclxuICAgIH1cclxuXHJcbiAgICAvLyBhZGQgY2VudGVyLCByaWdodCwgYm90dG9tLi4uXHJcbiAgICBmdWxsQm94KHRoaXMpXHJcbiAgfVxyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gTWVyZ2UgcmVjdCBib3ggd2l0aCBhbm90aGVyLCByZXR1cm4gYSBuZXcgaW5zdGFuY2VcclxuICAgIG1lcmdlOiBmdW5jdGlvbihib3gpIHtcclxuICAgICAgdmFyIGIgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcigpXHJcblxyXG4gICAgICAvLyBtZXJnZSBib3hlc1xyXG4gICAgICBiLnggICAgICA9IE1hdGgubWluKHRoaXMueCwgYm94LngpXHJcbiAgICAgIGIueSAgICAgID0gTWF0aC5taW4odGhpcy55LCBib3gueSlcclxuICAgICAgYi53aWR0aCAgPSBNYXRoLm1heCh0aGlzLnggKyB0aGlzLndpZHRoLCAgYm94LnggKyBib3gud2lkdGgpICAtIGIueFxyXG4gICAgICBiLmhlaWdodCA9IE1hdGgubWF4KHRoaXMueSArIHRoaXMuaGVpZ2h0LCBib3gueSArIGJveC5oZWlnaHQpIC0gYi55XHJcblxyXG4gICAgICByZXR1cm4gZnVsbEJveChiKVxyXG4gICAgfVxyXG5cclxuICAsIHRyYW5zZm9ybTogZnVuY3Rpb24obSkge1xyXG4gICAgICB2YXIgeE1pbiA9IEluZmluaXR5LCB4TWF4ID0gLUluZmluaXR5LCB5TWluID0gSW5maW5pdHksIHlNYXggPSAtSW5maW5pdHksIHAsIGJib3hcclxuXHJcbiAgICAgIHZhciBwdHMgPSBbXHJcbiAgICAgICAgbmV3IFNWRy5Qb2ludCh0aGlzLngsIHRoaXMueSksXHJcbiAgICAgICAgbmV3IFNWRy5Qb2ludCh0aGlzLngyLCB0aGlzLnkpLFxyXG4gICAgICAgIG5ldyBTVkcuUG9pbnQodGhpcy54LCB0aGlzLnkyKSxcclxuICAgICAgICBuZXcgU1ZHLlBvaW50KHRoaXMueDIsIHRoaXMueTIpXHJcbiAgICAgIF1cclxuXHJcbiAgICAgIHB0cy5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcclxuICAgICAgICBwID0gcC50cmFuc2Zvcm0obSlcclxuICAgICAgICB4TWluID0gTWF0aC5taW4oeE1pbixwLngpXHJcbiAgICAgICAgeE1heCA9IE1hdGgubWF4KHhNYXgscC54KVxyXG4gICAgICAgIHlNaW4gPSBNYXRoLm1pbih5TWluLHAueSlcclxuICAgICAgICB5TWF4ID0gTWF0aC5tYXgoeU1heCxwLnkpXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICBiYm94ID0gbmV3IHRoaXMuY29uc3RydWN0b3IoKVxyXG4gICAgICBiYm94LnggPSB4TWluXHJcbiAgICAgIGJib3gud2lkdGggPSB4TWF4LXhNaW5cclxuICAgICAgYmJveC55ID0geU1pblxyXG4gICAgICBiYm94LmhlaWdodCA9IHlNYXgteU1pblxyXG5cclxuICAgICAgZnVsbEJveChiYm94KVxyXG5cclxuICAgICAgcmV0dXJuIGJib3hcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxyXG5TVkcuQkJveCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemVcclxuICBjcmVhdGU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgIFNWRy5Cb3guYXBwbHkodGhpcywgW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKVxyXG5cclxuICAgIC8vIGdldCB2YWx1ZXMgaWYgZWxlbWVudCBpcyBnaXZlblxyXG4gICAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBTVkcuRWxlbWVudCkge1xyXG4gICAgICB2YXIgYm94XHJcblxyXG4gICAgICAvLyB5ZXMgdGhpcyBpcyB1Z2x5LCBidXQgRmlyZWZveCBjYW4gYmUgYSBiaXRjaCB3aGVuIGl0IGNvbWVzIHRvIGVsZW1lbnRzIHRoYXQgYXJlIG5vdCB5ZXQgcmVuZGVyZWRcclxuICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgaWYgKCFkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY29udGFpbnMpe1xyXG4gICAgICAgICAgLy8gVGhpcyBpcyBJRSAtIGl0IGRvZXMgbm90IHN1cHBvcnQgY29udGFpbnMoKSBmb3IgdG9wLWxldmVsIFNWR3NcclxuICAgICAgICAgIHZhciB0b3BQYXJlbnQgPSBlbGVtZW50Lm5vZGVcclxuICAgICAgICAgIHdoaWxlICh0b3BQYXJlbnQucGFyZW50Tm9kZSl7XHJcbiAgICAgICAgICAgIHRvcFBhcmVudCA9IHRvcFBhcmVudC5wYXJlbnROb2RlXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAodG9wUGFyZW50ICE9IGRvY3VtZW50KSB0aHJvdyBuZXcgRXhjZXB0aW9uKCdFbGVtZW50IG5vdCBpbiB0aGUgZG9tJylcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgTk9UIGluIHRoZSBkb20sIHRocm93IGVycm9yXHJcbiAgICAgICAgICBpZighZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNvbnRhaW5zKGVsZW1lbnQubm9kZSkpIHRocm93IG5ldyBFeGNlcHRpb24oJ0VsZW1lbnQgbm90IGluIHRoZSBkb20nKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmluZCBuYXRpdmUgYmJveFxyXG4gICAgICAgIGJveCA9IGVsZW1lbnQubm9kZS5nZXRCQm94KClcclxuICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgaWYoZWxlbWVudCBpbnN0YW5jZW9mIFNWRy5TaGFwZSl7XHJcbiAgICAgICAgICB2YXIgY2xvbmUgPSBlbGVtZW50LmNsb25lKFNWRy5wYXJzZXIuZHJhdy5pbnN0YW5jZSkuc2hvdygpXHJcbiAgICAgICAgICBib3ggPSBjbG9uZS5ub2RlLmdldEJCb3goKVxyXG4gICAgICAgICAgY2xvbmUucmVtb3ZlKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIGJveCA9IHtcclxuICAgICAgICAgICAgeDogICAgICBlbGVtZW50Lm5vZGUuY2xpZW50TGVmdFxyXG4gICAgICAgICAgLCB5OiAgICAgIGVsZW1lbnQubm9kZS5jbGllbnRUb3BcclxuICAgICAgICAgICwgd2lkdGg6ICBlbGVtZW50Lm5vZGUuY2xpZW50V2lkdGhcclxuICAgICAgICAgICwgaGVpZ2h0OiBlbGVtZW50Lm5vZGUuY2xpZW50SGVpZ2h0XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICBTVkcuQm94LmNhbGwodGhpcywgYm94KVxyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG4gIC8vIERlZmluZSBhbmNlc3RvclxyXG4sIGluaGVyaXQ6IFNWRy5Cb3hcclxuXHJcbiAgLy8gRGVmaW5lIFBhcmVudFxyXG4sIHBhcmVudDogU1ZHLkVsZW1lbnRcclxuXHJcbiAgLy8gQ29uc3RydWN0b3JcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIEdldCBib3VuZGluZyBib3hcclxuICAgIGJib3g6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFNWRy5CQm94KHRoaXMpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxufSlcclxuXHJcblNWRy5CQm94LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNWRy5CQm94XHJcblxyXG5cclxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG4gIHRib3g6IGZ1bmN0aW9uKCl7XHJcbiAgICBjb25zb2xlLndhcm4oJ1VzZSBvZiBUQm94IGlzIGRlcHJlY2F0ZWQgYW5kIG1hcHBlZCB0byBSQm94LiBVc2UgLnJib3goKSBpbnN0ZWFkLicpXHJcbiAgICByZXR1cm4gdGhpcy5yYm94KHRoaXMuZG9jKCkpXHJcbiAgfVxyXG59KVxyXG5cclxuU1ZHLlJCb3ggPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICBTVkcuQm94LmFwcGx5KHRoaXMsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSlcclxuXHJcbiAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIFNWRy5FbGVtZW50KSB7XHJcbiAgICAgIFNWRy5Cb3guY2FsbCh0aGlzLCBlbGVtZW50Lm5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuLCBpbmhlcml0OiBTVkcuQm94XHJcblxyXG4gIC8vIGRlZmluZSBQYXJlbnRcclxuLCBwYXJlbnQ6IFNWRy5FbGVtZW50XHJcblxyXG4sIGV4dGVuZDoge1xyXG4gICAgYWRkT2Zmc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gb2Zmc2V0IGJ5IHdpbmRvdyBzY3JvbGwgcG9zaXRpb24sIGJlY2F1c2UgZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGNoYW5nZXMgd2hlbiB3aW5kb3cgaXMgc2Nyb2xsZWRcclxuICAgICAgdGhpcy54ICs9IHdpbmRvdy5wYWdlWE9mZnNldFxyXG4gICAgICB0aGlzLnkgKz0gd2luZG93LnBhZ2VZT2Zmc2V0XHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBDb25zdHJ1Y3RvclxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gR2V0IHJlY3QgYm94XHJcbiAgICByYm94OiBmdW5jdGlvbihlbCkge1xyXG4gICAgICBpZiAoZWwpIHJldHVybiBuZXcgU1ZHLlJCb3godGhpcykudHJhbnNmb3JtKGVsLnNjcmVlbkNUTSgpLmludmVyc2UoKSlcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuUkJveCh0aGlzKS5hZGRPZmZzZXQoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuUkJveC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTVkcuUkJveFxyXG5cblNWRy5NYXRyaXggPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihzb3VyY2UpIHtcclxuICAgIHZhciBpLCBiYXNlID0gYXJyYXlUb01hdHJpeChbMSwgMCwgMCwgMSwgMCwgMF0pXHJcblxyXG4gICAgLy8gZW5zdXJlIHNvdXJjZSBhcyBvYmplY3RcclxuICAgIHNvdXJjZSA9IHNvdXJjZSBpbnN0YW5jZW9mIFNWRy5FbGVtZW50ID9cclxuICAgICAgc291cmNlLm1hdHJpeGlmeSgpIDpcclxuICAgIHR5cGVvZiBzb3VyY2UgPT09ICdzdHJpbmcnID9cclxuICAgICAgYXJyYXlUb01hdHJpeChzb3VyY2Uuc3BsaXQoU1ZHLnJlZ2V4LmRlbGltaXRlcikubWFwKHBhcnNlRmxvYXQpKSA6XHJcbiAgICBhcmd1bWVudHMubGVuZ3RoID09IDYgP1xyXG4gICAgICBhcnJheVRvTWF0cml4KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkgOlxyXG4gICAgQXJyYXkuaXNBcnJheShzb3VyY2UpID9cclxuICAgICAgYXJyYXlUb01hdHJpeChzb3VyY2UpIDpcclxuICAgIHR5cGVvZiBzb3VyY2UgPT09ICdvYmplY3QnID9cclxuICAgICAgc291cmNlIDogYmFzZVxyXG5cclxuICAgIC8vIG1lcmdlIHNvdXJjZVxyXG4gICAgZm9yIChpID0gYWJjZGVmLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKVxyXG4gICAgICB0aGlzW2FiY2RlZltpXV0gPSBzb3VyY2VbYWJjZGVmW2ldXSAhPSBudWxsID9cclxuICAgICAgICBzb3VyY2VbYWJjZGVmW2ldXSA6IGJhc2VbYWJjZGVmW2ldXVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIEV4dHJhY3QgaW5kaXZpZHVhbCB0cmFuc2Zvcm1hdGlvbnNcclxuICAgIGV4dHJhY3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvLyBmaW5kIGRlbHRhIHRyYW5zZm9ybSBwb2ludHNcclxuICAgICAgdmFyIHB4ICAgID0gZGVsdGFUcmFuc2Zvcm1Qb2ludCh0aGlzLCAwLCAxKVxyXG4gICAgICAgICwgcHkgICAgPSBkZWx0YVRyYW5zZm9ybVBvaW50KHRoaXMsIDEsIDApXHJcbiAgICAgICAgLCBza2V3WCA9IDE4MCAvIE1hdGguUEkgKiBNYXRoLmF0YW4yKHB4LnksIHB4LngpIC0gOTBcclxuXHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgLy8gdHJhbnNsYXRpb25cclxuICAgICAgICB4OiAgICAgICAgdGhpcy5lXHJcbiAgICAgICwgeTogICAgICAgIHRoaXMuZlxyXG4gICAgICAsIHRyYW5zZm9ybWVkWDoodGhpcy5lICogTWF0aC5jb3Moc2tld1ggKiBNYXRoLlBJIC8gMTgwKSArIHRoaXMuZiAqIE1hdGguc2luKHNrZXdYICogTWF0aC5QSSAvIDE4MCkpIC8gTWF0aC5zcXJ0KHRoaXMuYSAqIHRoaXMuYSArIHRoaXMuYiAqIHRoaXMuYilcclxuICAgICAgLCB0cmFuc2Zvcm1lZFk6KHRoaXMuZiAqIE1hdGguY29zKHNrZXdYICogTWF0aC5QSSAvIDE4MCkgKyB0aGlzLmUgKiBNYXRoLnNpbigtc2tld1ggKiBNYXRoLlBJIC8gMTgwKSkgLyBNYXRoLnNxcnQodGhpcy5jICogdGhpcy5jICsgdGhpcy5kICogdGhpcy5kKVxyXG4gICAgICAgIC8vIHNrZXdcclxuICAgICAgLCBza2V3WDogICAgLXNrZXdYXHJcbiAgICAgICwgc2tld1k6ICAgIDE4MCAvIE1hdGguUEkgKiBNYXRoLmF0YW4yKHB5LnksIHB5LngpXHJcbiAgICAgICAgLy8gc2NhbGVcclxuICAgICAgLCBzY2FsZVg6ICAgTWF0aC5zcXJ0KHRoaXMuYSAqIHRoaXMuYSArIHRoaXMuYiAqIHRoaXMuYilcclxuICAgICAgLCBzY2FsZVk6ICAgTWF0aC5zcXJ0KHRoaXMuYyAqIHRoaXMuYyArIHRoaXMuZCAqIHRoaXMuZClcclxuICAgICAgICAvLyByb3RhdGlvblxyXG4gICAgICAsIHJvdGF0aW9uOiBza2V3WFxyXG4gICAgICAsIGE6IHRoaXMuYVxyXG4gICAgICAsIGI6IHRoaXMuYlxyXG4gICAgICAsIGM6IHRoaXMuY1xyXG4gICAgICAsIGQ6IHRoaXMuZFxyXG4gICAgICAsIGU6IHRoaXMuZVxyXG4gICAgICAsIGY6IHRoaXMuZlxyXG4gICAgICAsIG1hdHJpeDogbmV3IFNWRy5NYXRyaXgodGhpcylcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gQ2xvbmUgbWF0cml4XHJcbiAgLCBjbG9uZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLk1hdHJpeCh0aGlzKVxyXG4gICAgfVxyXG4gICAgLy8gTW9ycGggb25lIG1hdHJpeCBpbnRvIGFub3RoZXJcclxuICAsIG1vcnBoOiBmdW5jdGlvbihtYXRyaXgpIHtcclxuICAgICAgLy8gc3RvcmUgbmV3IGRlc3RpbmF0aW9uXHJcbiAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBuZXcgU1ZHLk1hdHJpeChtYXRyaXgpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gR2V0IG1vcnBoZWQgbWF0cml4IGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICAsIGF0OiBmdW5jdGlvbihwb3MpIHtcclxuICAgICAgLy8gbWFrZSBzdXJlIGEgZGVzdGluYXRpb24gaXMgZGVmaW5lZFxyXG4gICAgICBpZiAoIXRoaXMuZGVzdGluYXRpb24pIHJldHVybiB0aGlzXHJcblxyXG4gICAgICAvLyBjYWxjdWxhdGUgbW9ycGhlZCBtYXRyaXggYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gICAgICB2YXIgbWF0cml4ID0gbmV3IFNWRy5NYXRyaXgoe1xyXG4gICAgICAgIGE6IHRoaXMuYSArICh0aGlzLmRlc3RpbmF0aW9uLmEgLSB0aGlzLmEpICogcG9zXHJcbiAgICAgICwgYjogdGhpcy5iICsgKHRoaXMuZGVzdGluYXRpb24uYiAtIHRoaXMuYikgKiBwb3NcclxuICAgICAgLCBjOiB0aGlzLmMgKyAodGhpcy5kZXN0aW5hdGlvbi5jIC0gdGhpcy5jKSAqIHBvc1xyXG4gICAgICAsIGQ6IHRoaXMuZCArICh0aGlzLmRlc3RpbmF0aW9uLmQgLSB0aGlzLmQpICogcG9zXHJcbiAgICAgICwgZTogdGhpcy5lICsgKHRoaXMuZGVzdGluYXRpb24uZSAtIHRoaXMuZSkgKiBwb3NcclxuICAgICAgLCBmOiB0aGlzLmYgKyAodGhpcy5kZXN0aW5hdGlvbi5mIC0gdGhpcy5mKSAqIHBvc1xyXG4gICAgICB9KVxyXG5cclxuICAgICAgcmV0dXJuIG1hdHJpeFxyXG4gICAgfVxyXG4gICAgLy8gTXVsdGlwbGllcyBieSBnaXZlbiBtYXRyaXhcclxuICAsIG11bHRpcGx5OiBmdW5jdGlvbihtYXRyaXgpIHtcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuTWF0cml4KHRoaXMubmF0aXZlKCkubXVsdGlwbHkocGFyc2VNYXRyaXgobWF0cml4KS5uYXRpdmUoKSkpXHJcbiAgICB9XHJcbiAgICAvLyBJbnZlcnNlcyBtYXRyaXhcclxuICAsIGludmVyc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFNWRy5NYXRyaXgodGhpcy5uYXRpdmUoKS5pbnZlcnNlKCkpXHJcbiAgICB9XHJcbiAgICAvLyBUcmFuc2xhdGUgbWF0cml4XHJcbiAgLCB0cmFuc2xhdGU6IGZ1bmN0aW9uKHgsIHkpIHtcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuTWF0cml4KHRoaXMubmF0aXZlKCkudHJhbnNsYXRlKHggfHwgMCwgeSB8fCAwKSlcclxuICAgIH1cclxuICAgIC8vIFNjYWxlIG1hdHJpeFxyXG4gICwgc2NhbGU6IGZ1bmN0aW9uKHgsIHksIGN4LCBjeSkge1xyXG4gICAgICAvLyBzdXBwb3J0IHVuaWZvcm1hbCBzY2FsZVxyXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgeSA9IHhcclxuICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDMpIHtcclxuICAgICAgICBjeSA9IGN4XHJcbiAgICAgICAgY3ggPSB5XHJcbiAgICAgICAgeSA9IHhcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuYXJvdW5kKGN4LCBjeSwgbmV3IFNWRy5NYXRyaXgoeCwgMCwgMCwgeSwgMCwgMCkpXHJcbiAgICB9XHJcbiAgICAvLyBSb3RhdGUgbWF0cml4XHJcbiAgLCByb3RhdGU6IGZ1bmN0aW9uKHIsIGN4LCBjeSkge1xyXG4gICAgICAvLyBjb252ZXJ0IGRlZ3JlZXMgdG8gcmFkaWFuc1xyXG4gICAgICByID0gU1ZHLnV0aWxzLnJhZGlhbnMocilcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmFyb3VuZChjeCwgY3ksIG5ldyBTVkcuTWF0cml4KE1hdGguY29zKHIpLCBNYXRoLnNpbihyKSwgLU1hdGguc2luKHIpLCBNYXRoLmNvcyhyKSwgMCwgMCkpXHJcbiAgICB9XHJcbiAgICAvLyBGbGlwIG1hdHJpeCBvbiB4IG9yIHksIGF0IGEgZ2l2ZW4gb2Zmc2V0XHJcbiAgLCBmbGlwOiBmdW5jdGlvbihhLCBvKSB7XHJcbiAgICAgIHJldHVybiBhID09ICd4JyA/XHJcbiAgICAgICAgICB0aGlzLnNjYWxlKC0xLCAxLCBvLCAwKSA6XHJcbiAgICAgICAgYSA9PSAneScgP1xyXG4gICAgICAgICAgdGhpcy5zY2FsZSgxLCAtMSwgMCwgbykgOlxyXG4gICAgICAgICAgdGhpcy5zY2FsZSgtMSwgLTEsIGEsIG8gIT0gbnVsbCA/IG8gOiBhKVxyXG4gICAgfVxyXG4gICAgLy8gU2tld1xyXG4gICwgc2tldzogZnVuY3Rpb24oeCwgeSwgY3gsIGN5KSB7XHJcbiAgICAgIC8vIHN1cHBvcnQgdW5pZm9ybWFsIHNrZXdcclxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgIHkgPSB4XHJcbiAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAzKSB7XHJcbiAgICAgICAgY3kgPSBjeFxyXG4gICAgICAgIGN4ID0geVxyXG4gICAgICAgIHkgPSB4XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGNvbnZlcnQgZGVncmVlcyB0byByYWRpYW5zXHJcbiAgICAgIHggPSBTVkcudXRpbHMucmFkaWFucyh4KVxyXG4gICAgICB5ID0gU1ZHLnV0aWxzLnJhZGlhbnMoeSlcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmFyb3VuZChjeCwgY3ksIG5ldyBTVkcuTWF0cml4KDEsIE1hdGgudGFuKHkpLCBNYXRoLnRhbih4KSwgMSwgMCwgMCkpXHJcbiAgICB9XHJcbiAgICAvLyBTa2V3WFxyXG4gICwgc2tld1g6IGZ1bmN0aW9uKHgsIGN4LCBjeSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5za2V3KHgsIDAsIGN4LCBjeSlcclxuICAgIH1cclxuICAgIC8vIFNrZXdZXHJcbiAgLCBza2V3WTogZnVuY3Rpb24oeSwgY3gsIGN5KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnNrZXcoMCwgeSwgY3gsIGN5KVxyXG4gICAgfVxyXG4gICAgLy8gVHJhbnNmb3JtIGFyb3VuZCBhIGNlbnRlciBwb2ludFxyXG4gICwgYXJvdW5kOiBmdW5jdGlvbihjeCwgY3ksIG1hdHJpeCkge1xyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgICAgIC5tdWx0aXBseShuZXcgU1ZHLk1hdHJpeCgxLCAwLCAwLCAxLCBjeCB8fCAwLCBjeSB8fCAwKSlcclxuICAgICAgICAubXVsdGlwbHkobWF0cml4KVxyXG4gICAgICAgIC5tdWx0aXBseShuZXcgU1ZHLk1hdHJpeCgxLCAwLCAwLCAxLCAtY3ggfHwgMCwgLWN5IHx8IDApKVxyXG4gICAgfVxyXG4gICAgLy8gQ29udmVydCB0byBuYXRpdmUgU1ZHTWF0cml4XHJcbiAgLCBuYXRpdmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvLyBjcmVhdGUgbmV3IG1hdHJpeFxyXG4gICAgICB2YXIgbWF0cml4ID0gU1ZHLnBhcnNlci5uYXRpdmUuY3JlYXRlU1ZHTWF0cml4KClcclxuXHJcbiAgICAgIC8vIHVwZGF0ZSB3aXRoIGN1cnJlbnQgdmFsdWVzXHJcbiAgICAgIGZvciAodmFyIGkgPSBhYmNkZWYubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXHJcbiAgICAgICAgbWF0cml4W2FiY2RlZltpXV0gPSB0aGlzW2FiY2RlZltpXV1cclxuXHJcbiAgICAgIHJldHVybiBtYXRyaXhcclxuICAgIH1cclxuICAgIC8vIENvbnZlcnQgbWF0cml4IHRvIHN0cmluZ1xyXG4gICwgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gJ21hdHJpeCgnICsgdGhpcy5hICsgJywnICsgdGhpcy5iICsgJywnICsgdGhpcy5jICsgJywnICsgdGhpcy5kICsgJywnICsgdGhpcy5lICsgJywnICsgdGhpcy5mICsgJyknXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBEZWZpbmUgcGFyZW50XHJcbiwgcGFyZW50OiBTVkcuRWxlbWVudFxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gR2V0IGN1cnJlbnQgbWF0cml4XHJcbiAgICBjdG06IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gbmV3IFNWRy5NYXRyaXgodGhpcy5ub2RlLmdldENUTSgpKVxyXG4gICAgfSxcclxuICAgIC8vIEdldCBjdXJyZW50IHNjcmVlbiBtYXRyaXhcclxuICAgIHNjcmVlbkNUTTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8qIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTEzNDQ1MzdcclxuICAgICAgICAgVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSBGRiBkb2VzIG5vdCByZXR1cm4gdGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxyXG4gICAgICAgICBmb3IgdGhlIGlubmVyIGNvb3JkaW5hdGUgc3lzdGVtIHdoZW4gZ2V0U2NyZWVuQ1RNKCkgaXMgY2FsbGVkIG9uIG5lc3RlZCBzdmdzLlxyXG4gICAgICAgICBIb3dldmVyIGFsbCBvdGhlciBCcm93c2VycyBkbyB0aGF0ICovXHJcbiAgICAgIGlmKHRoaXMgaW5zdGFuY2VvZiBTVkcuTmVzdGVkKSB7XHJcbiAgICAgICAgdmFyIHJlY3QgPSB0aGlzLnJlY3QoMSwxKVxyXG4gICAgICAgIHZhciBtID0gcmVjdC5ub2RlLmdldFNjcmVlbkNUTSgpXHJcbiAgICAgICAgcmVjdC5yZW1vdmUoKVxyXG4gICAgICAgIHJldHVybiBuZXcgU1ZHLk1hdHJpeChtKVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLk1hdHJpeCh0aGlzLm5vZGUuZ2V0U2NyZWVuQ1RNKCkpXHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn0pXHJcblxuU1ZHLlBvaW50ID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oeCx5KSB7XHJcbiAgICB2YXIgaSwgc291cmNlLCBiYXNlID0ge3g6MCwgeTowfVxyXG5cclxuICAgIC8vIGVuc3VyZSBzb3VyY2UgYXMgb2JqZWN0XHJcbiAgICBzb3VyY2UgPSBBcnJheS5pc0FycmF5KHgpID9cclxuICAgICAge3g6eFswXSwgeTp4WzFdfSA6XHJcbiAgICB0eXBlb2YgeCA9PT0gJ29iamVjdCcgP1xyXG4gICAgICB7eDp4LngsIHk6eC55fSA6XHJcbiAgICB4ICE9IG51bGwgP1xyXG4gICAgICB7eDp4LCB5Oih5ICE9IG51bGwgPyB5IDogeCl9IDogYmFzZSAvLyBJZiB5IGhhcyBubyB2YWx1ZSwgdGhlbiB4IGlzIHVzZWQgaGFzIGl0cyB2YWx1ZVxyXG5cclxuICAgIC8vIG1lcmdlIHNvdXJjZVxyXG4gICAgdGhpcy54ID0gc291cmNlLnhcclxuICAgIHRoaXMueSA9IHNvdXJjZS55XHJcbiAgfVxyXG5cclxuICAvLyBBZGQgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gQ2xvbmUgcG9pbnRcclxuICAgIGNsb25lOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuUG9pbnQodGhpcylcclxuICAgIH1cclxuICAgIC8vIE1vcnBoIG9uZSBwb2ludCBpbnRvIGFub3RoZXJcclxuICAsIG1vcnBoOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICAgIC8vIHN0b3JlIG5ldyBkZXN0aW5hdGlvblxyXG4gICAgICB0aGlzLmRlc3RpbmF0aW9uID0gbmV3IFNWRy5Qb2ludCh4LCB5KVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIEdldCBtb3JwaGVkIHBvaW50IGF0IGEgZ2l2ZW4gcG9zaXRpb25cclxuICAsIGF0OiBmdW5jdGlvbihwb3MpIHtcclxuICAgICAgLy8gbWFrZSBzdXJlIGEgZGVzdGluYXRpb24gaXMgZGVmaW5lZFxyXG4gICAgICBpZiAoIXRoaXMuZGVzdGluYXRpb24pIHJldHVybiB0aGlzXHJcblxyXG4gICAgICAvLyBjYWxjdWxhdGUgbW9ycGhlZCBtYXRyaXggYXQgYSBnaXZlbiBwb3NpdGlvblxyXG4gICAgICB2YXIgcG9pbnQgPSBuZXcgU1ZHLlBvaW50KHtcclxuICAgICAgICB4OiB0aGlzLnggKyAodGhpcy5kZXN0aW5hdGlvbi54IC0gdGhpcy54KSAqIHBvc1xyXG4gICAgICAsIHk6IHRoaXMueSArICh0aGlzLmRlc3RpbmF0aW9uLnkgLSB0aGlzLnkpICogcG9zXHJcbiAgICAgIH0pXHJcblxyXG4gICAgICByZXR1cm4gcG9pbnRcclxuICAgIH1cclxuICAgIC8vIENvbnZlcnQgdG8gbmF0aXZlIFNWR1BvaW50XHJcbiAgLCBuYXRpdmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvLyBjcmVhdGUgbmV3IHBvaW50XHJcbiAgICAgIHZhciBwb2ludCA9IFNWRy5wYXJzZXIubmF0aXZlLmNyZWF0ZVNWR1BvaW50KClcclxuXHJcbiAgICAgIC8vIHVwZGF0ZSB3aXRoIGN1cnJlbnQgdmFsdWVzXHJcbiAgICAgIHBvaW50LnggPSB0aGlzLnhcclxuICAgICAgcG9pbnQueSA9IHRoaXMueVxyXG5cclxuICAgICAgcmV0dXJuIHBvaW50XHJcbiAgICB9XHJcbiAgICAvLyB0cmFuc2Zvcm0gcG9pbnQgd2l0aCBtYXRyaXhcclxuICAsIHRyYW5zZm9ybTogZnVuY3Rpb24obWF0cml4KSB7XHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLlBvaW50KHRoaXMubmF0aXZlKCkubWF0cml4VHJhbnNmb3JtKG1hdHJpeC5uYXRpdmUoKSkpXHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5FbGVtZW50LCB7XHJcblxyXG4gIC8vIEdldCBwb2ludFxyXG4gIHBvaW50OiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICByZXR1cm4gbmV3IFNWRy5Qb2ludCh4LHkpLnRyYW5zZm9ybSh0aGlzLnNjcmVlbkNUTSgpLmludmVyc2UoKSk7XHJcbiAgfVxyXG5cclxufSlcclxuXG5TVkcuZXh0ZW5kKFNWRy5FbGVtZW50LCB7XHJcbiAgLy8gU2V0IHN2ZyBlbGVtZW50IGF0dHJpYnV0ZVxyXG4gIGF0dHI6IGZ1bmN0aW9uKGEsIHYsIG4pIHtcclxuICAgIC8vIGFjdCBhcyBmdWxsIGdldHRlclxyXG4gICAgaWYgKGEgPT0gbnVsbCkge1xyXG4gICAgICAvLyBnZXQgYW4gb2JqZWN0IG9mIGF0dHJpYnV0ZXNcclxuICAgICAgYSA9IHt9XHJcbiAgICAgIHYgPSB0aGlzLm5vZGUuYXR0cmlidXRlc1xyXG4gICAgICBmb3IgKG4gPSB2Lmxlbmd0aCAtIDE7IG4gPj0gMDsgbi0tKVxyXG4gICAgICAgIGFbdltuXS5ub2RlTmFtZV0gPSBTVkcucmVnZXguaXNOdW1iZXIudGVzdCh2W25dLm5vZGVWYWx1ZSkgPyBwYXJzZUZsb2F0KHZbbl0ubm9kZVZhbHVlKSA6IHZbbl0ubm9kZVZhbHVlXHJcblxyXG4gICAgICByZXR1cm4gYVxyXG5cclxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGEgPT0gJ29iamVjdCcpIHtcclxuICAgICAgLy8gYXBwbHkgZXZlcnkgYXR0cmlidXRlIGluZGl2aWR1YWxseSBpZiBhbiBvYmplY3QgaXMgcGFzc2VkXHJcbiAgICAgIGZvciAodiBpbiBhKSB0aGlzLmF0dHIodiwgYVt2XSlcclxuXHJcbiAgICB9IGVsc2UgaWYgKHYgPT09IG51bGwpIHtcclxuICAgICAgICAvLyByZW1vdmUgdmFsdWVcclxuICAgICAgICB0aGlzLm5vZGUucmVtb3ZlQXR0cmlidXRlKGEpXHJcblxyXG4gICAgfSBlbHNlIGlmICh2ID09IG51bGwpIHtcclxuICAgICAgLy8gYWN0IGFzIGEgZ2V0dGVyIGlmIHRoZSBmaXJzdCBhbmQgb25seSBhcmd1bWVudCBpcyBub3QgYW4gb2JqZWN0XHJcbiAgICAgIHYgPSB0aGlzLm5vZGUuZ2V0QXR0cmlidXRlKGEpXHJcbiAgICAgIHJldHVybiB2ID09IG51bGwgP1xyXG4gICAgICAgIFNWRy5kZWZhdWx0cy5hdHRyc1thXSA6XHJcbiAgICAgIFNWRy5yZWdleC5pc051bWJlci50ZXN0KHYpID9cclxuICAgICAgICBwYXJzZUZsb2F0KHYpIDogdlxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIEJVRyBGSVg6IHNvbWUgYnJvd3NlcnMgd2lsbCByZW5kZXIgYSBzdHJva2UgaWYgYSBjb2xvciBpcyBnaXZlbiBldmVuIHRob3VnaCBzdHJva2Ugd2lkdGggaXMgMFxyXG4gICAgICBpZiAoYSA9PSAnc3Ryb2tlLXdpZHRoJylcclxuICAgICAgICB0aGlzLmF0dHIoJ3N0cm9rZScsIHBhcnNlRmxvYXQodikgPiAwID8gdGhpcy5fc3Ryb2tlIDogbnVsbClcclxuICAgICAgZWxzZSBpZiAoYSA9PSAnc3Ryb2tlJylcclxuICAgICAgICB0aGlzLl9zdHJva2UgPSB2XHJcblxyXG4gICAgICAvLyBjb252ZXJ0IGltYWdlIGZpbGwgYW5kIHN0cm9rZSB0byBwYXR0ZXJuc1xyXG4gICAgICBpZiAoYSA9PSAnZmlsbCcgfHwgYSA9PSAnc3Ryb2tlJykge1xyXG4gICAgICAgIGlmIChTVkcucmVnZXguaXNJbWFnZS50ZXN0KHYpKVxyXG4gICAgICAgICAgdiA9IHRoaXMuZG9jKCkuZGVmcygpLmltYWdlKHYsIDAsIDApXHJcblxyXG4gICAgICAgIGlmICh2IGluc3RhbmNlb2YgU1ZHLkltYWdlKVxyXG4gICAgICAgICAgdiA9IHRoaXMuZG9jKCkuZGVmcygpLnBhdHRlcm4oMCwgMCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkKHYpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBlbnN1cmUgY29ycmVjdCBudW1lcmljIHZhbHVlcyAoYWxzbyBhY2NlcHRzIE5hTiBhbmQgSW5maW5pdHkpXHJcbiAgICAgIGlmICh0eXBlb2YgdiA9PT0gJ251bWJlcicpXHJcbiAgICAgICAgdiA9IG5ldyBTVkcuTnVtYmVyKHYpXHJcblxyXG4gICAgICAvLyBlbnN1cmUgZnVsbCBoZXggY29sb3JcclxuICAgICAgZWxzZSBpZiAoU1ZHLkNvbG9yLmlzQ29sb3IodikpXHJcbiAgICAgICAgdiA9IG5ldyBTVkcuQ29sb3IodilcclxuXHJcbiAgICAgIC8vIHBhcnNlIGFycmF5IHZhbHVlc1xyXG4gICAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHYpKVxyXG4gICAgICAgIHYgPSBuZXcgU1ZHLkFycmF5KHYpXHJcblxyXG4gICAgICAvLyBpZiB0aGUgcGFzc2VkIGF0dHJpYnV0ZSBpcyBsZWFkaW5nLi4uXHJcbiAgICAgIGlmIChhID09ICdsZWFkaW5nJykge1xyXG4gICAgICAgIC8vIC4uLiBjYWxsIHRoZSBsZWFkaW5nIG1ldGhvZCBpbnN0ZWFkXHJcbiAgICAgICAgaWYgKHRoaXMubGVhZGluZylcclxuICAgICAgICAgIHRoaXMubGVhZGluZyh2KVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIHNldCBnaXZlbiBhdHRyaWJ1dGUgb24gbm9kZVxyXG4gICAgICAgIHR5cGVvZiBuID09PSAnc3RyaW5nJyA/XHJcbiAgICAgICAgICB0aGlzLm5vZGUuc2V0QXR0cmlidXRlTlMobiwgYSwgdi50b1N0cmluZygpKSA6XHJcbiAgICAgICAgICB0aGlzLm5vZGUuc2V0QXR0cmlidXRlKGEsIHYudG9TdHJpbmcoKSlcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gcmVidWlsZCBpZiByZXF1aXJlZFxyXG4gICAgICBpZiAodGhpcy5yZWJ1aWxkICYmIChhID09ICdmb250LXNpemUnIHx8IGEgPT0gJ3gnKSlcclxuICAgICAgICB0aGlzLnJlYnVpbGQoYSwgdilcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxufSlcblNWRy5leHRlbmQoU1ZHLkVsZW1lbnQsIHtcclxuICAvLyBBZGQgdHJhbnNmb3JtYXRpb25zXHJcbiAgdHJhbnNmb3JtOiBmdW5jdGlvbihvLCByZWxhdGl2ZSkge1xyXG4gICAgLy8gZ2V0IHRhcmdldCBpbiBjYXNlIG9mIHRoZSBmeCBtb2R1bGUsIG90aGVyd2lzZSByZWZlcmVuY2UgdGhpc1xyXG4gICAgdmFyIHRhcmdldCA9IHRoaXNcclxuICAgICAgLCBtYXRyaXgsIGJib3hcclxuXHJcbiAgICAvLyBhY3QgYXMgYSBnZXR0ZXJcclxuICAgIGlmICh0eXBlb2YgbyAhPT0gJ29iamVjdCcpIHtcclxuICAgICAgLy8gZ2V0IGN1cnJlbnQgbWF0cml4XHJcbiAgICAgIG1hdHJpeCA9IG5ldyBTVkcuTWF0cml4KHRhcmdldCkuZXh0cmFjdCgpXHJcblxyXG4gICAgICByZXR1cm4gdHlwZW9mIG8gPT09ICdzdHJpbmcnID8gbWF0cml4W29dIDogbWF0cml4XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZ2V0IGN1cnJlbnQgbWF0cml4XHJcbiAgICBtYXRyaXggPSBuZXcgU1ZHLk1hdHJpeCh0YXJnZXQpXHJcblxyXG4gICAgLy8gZW5zdXJlIHJlbGF0aXZlIGZsYWdcclxuICAgIHJlbGF0aXZlID0gISFyZWxhdGl2ZSB8fCAhIW8ucmVsYXRpdmVcclxuXHJcbiAgICAvLyBhY3Qgb24gbWF0cml4XHJcbiAgICBpZiAoby5hICE9IG51bGwpIHtcclxuICAgICAgbWF0cml4ID0gcmVsYXRpdmUgP1xyXG4gICAgICAgIC8vIHJlbGF0aXZlXHJcbiAgICAgICAgbWF0cml4Lm11bHRpcGx5KG5ldyBTVkcuTWF0cml4KG8pKSA6XHJcbiAgICAgICAgLy8gYWJzb2x1dGVcclxuICAgICAgICBuZXcgU1ZHLk1hdHJpeChvKVxyXG5cclxuICAgIC8vIGFjdCBvbiByb3RhdGlvblxyXG4gICAgfSBlbHNlIGlmIChvLnJvdGF0aW9uICE9IG51bGwpIHtcclxuICAgICAgLy8gZW5zdXJlIGNlbnRyZSBwb2ludFxyXG4gICAgICBlbnN1cmVDZW50cmUobywgdGFyZ2V0KVxyXG5cclxuICAgICAgLy8gYXBwbHkgdHJhbnNmb3JtYXRpb25cclxuICAgICAgbWF0cml4ID0gcmVsYXRpdmUgP1xyXG4gICAgICAgIC8vIHJlbGF0aXZlXHJcbiAgICAgICAgbWF0cml4LnJvdGF0ZShvLnJvdGF0aW9uLCBvLmN4LCBvLmN5KSA6XHJcbiAgICAgICAgLy8gYWJzb2x1dGVcclxuICAgICAgICBtYXRyaXgucm90YXRlKG8ucm90YXRpb24gLSBtYXRyaXguZXh0cmFjdCgpLnJvdGF0aW9uLCBvLmN4LCBvLmN5KVxyXG5cclxuICAgIC8vIGFjdCBvbiBzY2FsZVxyXG4gICAgfSBlbHNlIGlmIChvLnNjYWxlICE9IG51bGwgfHwgby5zY2FsZVggIT0gbnVsbCB8fCBvLnNjYWxlWSAhPSBudWxsKSB7XHJcbiAgICAgIC8vIGVuc3VyZSBjZW50cmUgcG9pbnRcclxuICAgICAgZW5zdXJlQ2VudHJlKG8sIHRhcmdldClcclxuXHJcbiAgICAgIC8vIGVuc3VyZSBzY2FsZSB2YWx1ZXMgb24gYm90aCBheGVzXHJcbiAgICAgIG8uc2NhbGVYID0gby5zY2FsZSAhPSBudWxsID8gby5zY2FsZSA6IG8uc2NhbGVYICE9IG51bGwgPyBvLnNjYWxlWCA6IDFcclxuICAgICAgby5zY2FsZVkgPSBvLnNjYWxlICE9IG51bGwgPyBvLnNjYWxlIDogby5zY2FsZVkgIT0gbnVsbCA/IG8uc2NhbGVZIDogMVxyXG5cclxuICAgICAgaWYgKCFyZWxhdGl2ZSkge1xyXG4gICAgICAgIC8vIGFic29sdXRlOyBtdWx0aXBseSBpbnZlcnNlZCB2YWx1ZXNcclxuICAgICAgICB2YXIgZSA9IG1hdHJpeC5leHRyYWN0KClcclxuICAgICAgICBvLnNjYWxlWCA9IG8uc2NhbGVYICogMSAvIGUuc2NhbGVYXHJcbiAgICAgICAgby5zY2FsZVkgPSBvLnNjYWxlWSAqIDEgLyBlLnNjYWxlWVxyXG4gICAgICB9XHJcblxyXG4gICAgICBtYXRyaXggPSBtYXRyaXguc2NhbGUoby5zY2FsZVgsIG8uc2NhbGVZLCBvLmN4LCBvLmN5KVxyXG5cclxuICAgIC8vIGFjdCBvbiBza2V3XHJcbiAgICB9IGVsc2UgaWYgKG8uc2tldyAhPSBudWxsIHx8IG8uc2tld1ggIT0gbnVsbCB8fCBvLnNrZXdZICE9IG51bGwpIHtcclxuICAgICAgLy8gZW5zdXJlIGNlbnRyZSBwb2ludFxyXG4gICAgICBlbnN1cmVDZW50cmUobywgdGFyZ2V0KVxyXG5cclxuICAgICAgLy8gZW5zdXJlIHNrZXcgdmFsdWVzIG9uIGJvdGggYXhlc1xyXG4gICAgICBvLnNrZXdYID0gby5za2V3ICE9IG51bGwgPyBvLnNrZXcgOiBvLnNrZXdYICE9IG51bGwgPyBvLnNrZXdYIDogMFxyXG4gICAgICBvLnNrZXdZID0gby5za2V3ICE9IG51bGwgPyBvLnNrZXcgOiBvLnNrZXdZICE9IG51bGwgPyBvLnNrZXdZIDogMFxyXG5cclxuICAgICAgaWYgKCFyZWxhdGl2ZSkge1xyXG4gICAgICAgIC8vIGFic29sdXRlOyByZXNldCBza2V3IHZhbHVlc1xyXG4gICAgICAgIHZhciBlID0gbWF0cml4LmV4dHJhY3QoKVxyXG4gICAgICAgIG1hdHJpeCA9IG1hdHJpeC5tdWx0aXBseShuZXcgU1ZHLk1hdHJpeCgpLnNrZXcoZS5za2V3WCwgZS5za2V3WSwgby5jeCwgby5jeSkuaW52ZXJzZSgpKVxyXG4gICAgICB9XHJcblxyXG4gICAgICBtYXRyaXggPSBtYXRyaXguc2tldyhvLnNrZXdYLCBvLnNrZXdZLCBvLmN4LCBvLmN5KVxyXG5cclxuICAgIC8vIGFjdCBvbiBmbGlwXHJcbiAgICB9IGVsc2UgaWYgKG8uZmxpcCkge1xyXG4gICAgICBpZihvLmZsaXAgPT0gJ3gnIHx8IG8uZmxpcCA9PSAneScpIHtcclxuICAgICAgICBvLm9mZnNldCA9IG8ub2Zmc2V0ID09IG51bGwgPyB0YXJnZXQuYmJveCgpWydjJyArIG8uZmxpcF0gOiBvLm9mZnNldFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmKG8ub2Zmc2V0ID09IG51bGwpIHtcclxuICAgICAgICAgIGJib3ggPSB0YXJnZXQuYmJveCgpXHJcbiAgICAgICAgICBvLmZsaXAgPSBiYm94LmN4XHJcbiAgICAgICAgICBvLm9mZnNldCA9IGJib3guY3lcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgby5mbGlwID0gby5vZmZzZXRcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG1hdHJpeCA9IG5ldyBTVkcuTWF0cml4KCkuZmxpcChvLmZsaXAsIG8ub2Zmc2V0KVxyXG5cclxuICAgIC8vIGFjdCBvbiB0cmFuc2xhdGVcclxuICAgIH0gZWxzZSBpZiAoby54ICE9IG51bGwgfHwgby55ICE9IG51bGwpIHtcclxuICAgICAgaWYgKHJlbGF0aXZlKSB7XHJcbiAgICAgICAgLy8gcmVsYXRpdmVcclxuICAgICAgICBtYXRyaXggPSBtYXRyaXgudHJhbnNsYXRlKG8ueCwgby55KVxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIC8vIGFic29sdXRlXHJcbiAgICAgICAgaWYgKG8ueCAhPSBudWxsKSBtYXRyaXguZSA9IG8ueFxyXG4gICAgICAgIGlmIChvLnkgIT0gbnVsbCkgbWF0cml4LmYgPSBvLnlcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ3RyYW5zZm9ybScsIG1hdHJpeClcclxuICB9XHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5GWCwge1xyXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24obywgcmVsYXRpdmUpIHtcclxuICAgIC8vIGdldCB0YXJnZXQgaW4gY2FzZSBvZiB0aGUgZnggbW9kdWxlLCBvdGhlcndpc2UgcmVmZXJlbmNlIHRoaXNcclxuICAgIHZhciB0YXJnZXQgPSB0aGlzLnRhcmdldCgpXHJcbiAgICAgICwgbWF0cml4LCBiYm94XHJcblxyXG4gICAgLy8gYWN0IGFzIGEgZ2V0dGVyXHJcbiAgICBpZiAodHlwZW9mIG8gIT09ICdvYmplY3QnKSB7XHJcbiAgICAgIC8vIGdldCBjdXJyZW50IG1hdHJpeFxyXG4gICAgICBtYXRyaXggPSBuZXcgU1ZHLk1hdHJpeCh0YXJnZXQpLmV4dHJhY3QoKVxyXG5cclxuICAgICAgcmV0dXJuIHR5cGVvZiBvID09PSAnc3RyaW5nJyA/IG1hdHJpeFtvXSA6IG1hdHJpeFxyXG4gICAgfVxyXG5cclxuICAgIC8vIGVuc3VyZSByZWxhdGl2ZSBmbGFnXHJcbiAgICByZWxhdGl2ZSA9ICEhcmVsYXRpdmUgfHwgISFvLnJlbGF0aXZlXHJcblxyXG4gICAgLy8gYWN0IG9uIG1hdHJpeFxyXG4gICAgaWYgKG8uYSAhPSBudWxsKSB7XHJcbiAgICAgIG1hdHJpeCA9IG5ldyBTVkcuTWF0cml4KG8pXHJcblxyXG4gICAgLy8gYWN0IG9uIHJvdGF0aW9uXHJcbiAgICB9IGVsc2UgaWYgKG8ucm90YXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAvLyBlbnN1cmUgY2VudHJlIHBvaW50XHJcbiAgICAgIGVuc3VyZUNlbnRyZShvLCB0YXJnZXQpXHJcblxyXG4gICAgICAvLyBhcHBseSB0cmFuc2Zvcm1hdGlvblxyXG4gICAgICBtYXRyaXggPSBuZXcgU1ZHLlJvdGF0ZShvLnJvdGF0aW9uLCBvLmN4LCBvLmN5KVxyXG5cclxuICAgIC8vIGFjdCBvbiBzY2FsZVxyXG4gICAgfSBlbHNlIGlmIChvLnNjYWxlICE9IG51bGwgfHwgby5zY2FsZVggIT0gbnVsbCB8fCBvLnNjYWxlWSAhPSBudWxsKSB7XHJcbiAgICAgIC8vIGVuc3VyZSBjZW50cmUgcG9pbnRcclxuICAgICAgZW5zdXJlQ2VudHJlKG8sIHRhcmdldClcclxuXHJcbiAgICAgIC8vIGVuc3VyZSBzY2FsZSB2YWx1ZXMgb24gYm90aCBheGVzXHJcbiAgICAgIG8uc2NhbGVYID0gby5zY2FsZSAhPSBudWxsID8gby5zY2FsZSA6IG8uc2NhbGVYICE9IG51bGwgPyBvLnNjYWxlWCA6IDFcclxuICAgICAgby5zY2FsZVkgPSBvLnNjYWxlICE9IG51bGwgPyBvLnNjYWxlIDogby5zY2FsZVkgIT0gbnVsbCA/IG8uc2NhbGVZIDogMVxyXG5cclxuICAgICAgbWF0cml4ID0gbmV3IFNWRy5TY2FsZShvLnNjYWxlWCwgby5zY2FsZVksIG8uY3gsIG8uY3kpXHJcblxyXG4gICAgLy8gYWN0IG9uIHNrZXdcclxuICAgIH0gZWxzZSBpZiAoby5za2V3WCAhPSBudWxsIHx8IG8uc2tld1kgIT0gbnVsbCkge1xyXG4gICAgICAvLyBlbnN1cmUgY2VudHJlIHBvaW50XHJcbiAgICAgIGVuc3VyZUNlbnRyZShvLCB0YXJnZXQpXHJcblxyXG4gICAgICAvLyBlbnN1cmUgc2tldyB2YWx1ZXMgb24gYm90aCBheGVzXHJcbiAgICAgIG8uc2tld1ggPSBvLnNrZXdYICE9IG51bGwgPyBvLnNrZXdYIDogMFxyXG4gICAgICBvLnNrZXdZID0gby5za2V3WSAhPSBudWxsID8gby5za2V3WSA6IDBcclxuXHJcbiAgICAgIG1hdHJpeCA9IG5ldyBTVkcuU2tldyhvLnNrZXdYLCBvLnNrZXdZLCBvLmN4LCBvLmN5KVxyXG5cclxuICAgIC8vIGFjdCBvbiBmbGlwXHJcbiAgICB9IGVsc2UgaWYgKG8uZmxpcCkge1xyXG4gICAgICBpZihvLmZsaXAgPT0gJ3gnIHx8IG8uZmxpcCA9PSAneScpIHtcclxuICAgICAgICBvLm9mZnNldCA9IG8ub2Zmc2V0ID09IG51bGwgPyB0YXJnZXQuYmJveCgpWydjJyArIG8uZmxpcF0gOiBvLm9mZnNldFxyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmKG8ub2Zmc2V0ID09IG51bGwpIHtcclxuICAgICAgICAgIGJib3ggPSB0YXJnZXQuYmJveCgpXHJcbiAgICAgICAgICBvLmZsaXAgPSBiYm94LmN4XHJcbiAgICAgICAgICBvLm9mZnNldCA9IGJib3guY3lcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgby5mbGlwID0gby5vZmZzZXRcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIG1hdHJpeCA9IG5ldyBTVkcuTWF0cml4KCkuZmxpcChvLmZsaXAsIG8ub2Zmc2V0KVxyXG5cclxuICAgIC8vIGFjdCBvbiB0cmFuc2xhdGVcclxuICAgIH0gZWxzZSBpZiAoby54ICE9IG51bGwgfHwgby55ICE9IG51bGwpIHtcclxuICAgICAgbWF0cml4ID0gbmV3IFNWRy5UcmFuc2xhdGUoby54LCBvLnkpXHJcbiAgICB9XHJcblxyXG4gICAgaWYoIW1hdHJpeCkgcmV0dXJuIHRoaXNcclxuXHJcbiAgICBtYXRyaXgucmVsYXRpdmUgPSByZWxhdGl2ZVxyXG5cclxuICAgIHRoaXMubGFzdCgpLnRyYW5zZm9ybXMucHVzaChtYXRyaXgpXHJcblxyXG4gICAgcmV0dXJuIHRoaXMuX2NhbGxTdGFydCgpXHJcbiAgfVxyXG59KVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG4gIC8vIFJlc2V0IGFsbCB0cmFuc2Zvcm1hdGlvbnNcclxuICB1bnRyYW5zZm9ybTogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCd0cmFuc2Zvcm0nLCBudWxsKVxyXG4gIH0sXHJcbiAgLy8gbWVyZ2UgdGhlIHdob2xlIHRyYW5zZm9ybWF0aW9uIGNoYWluIGludG8gb25lIG1hdHJpeCBhbmQgcmV0dXJucyBpdFxyXG4gIG1hdHJpeGlmeTogZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdmFyIG1hdHJpeCA9ICh0aGlzLmF0dHIoJ3RyYW5zZm9ybScpIHx8ICcnKVxyXG4gICAgICAvLyBzcGxpdCB0cmFuc2Zvcm1hdGlvbnNcclxuICAgICAgLnNwbGl0KFNWRy5yZWdleC50cmFuc2Zvcm1zKS5zbGljZSgwLC0xKS5tYXAoZnVuY3Rpb24oc3RyKXtcclxuICAgICAgICAvLyBnZW5lcmF0ZSBrZXkgPT4gdmFsdWUgcGFpcnNcclxuICAgICAgICB2YXIga3YgPSBzdHIudHJpbSgpLnNwbGl0KCcoJylcclxuICAgICAgICByZXR1cm4gW2t2WzBdLCBrdlsxXS5zcGxpdChTVkcucmVnZXguZGVsaW1pdGVyKS5tYXAoZnVuY3Rpb24oc3RyKXsgcmV0dXJuIHBhcnNlRmxvYXQoc3RyKSB9KV1cclxuICAgICAgfSlcclxuICAgICAgLy8gbWVyZ2UgZXZlcnkgdHJhbnNmb3JtYXRpb24gaW50byBvbmUgbWF0cml4XHJcbiAgICAgIC5yZWR1Y2UoZnVuY3Rpb24obWF0cml4LCB0cmFuc2Zvcm0pe1xyXG5cclxuICAgICAgICBpZih0cmFuc2Zvcm1bMF0gPT0gJ21hdHJpeCcpIHJldHVybiBtYXRyaXgubXVsdGlwbHkoYXJyYXlUb01hdHJpeCh0cmFuc2Zvcm1bMV0pKVxyXG4gICAgICAgIHJldHVybiBtYXRyaXhbdHJhbnNmb3JtWzBdXS5hcHBseShtYXRyaXgsIHRyYW5zZm9ybVsxXSlcclxuXHJcbiAgICAgIH0sIG5ldyBTVkcuTWF0cml4KCkpXHJcblxyXG4gICAgcmV0dXJuIG1hdHJpeFxyXG4gIH0sXHJcbiAgLy8gYWRkIGFuIGVsZW1lbnQgdG8gYW5vdGhlciBwYXJlbnQgd2l0aG91dCBjaGFuZ2luZyB0aGUgdmlzdWFsIHJlcHJlc2VudGF0aW9uIG9uIHRoZSBzY3JlZW5cclxuICB0b1BhcmVudDogZnVuY3Rpb24ocGFyZW50KSB7XHJcbiAgICBpZih0aGlzID09IHBhcmVudCkgcmV0dXJuIHRoaXNcclxuICAgIHZhciBjdG0gPSB0aGlzLnNjcmVlbkNUTSgpXHJcbiAgICB2YXIgcEN0bSA9IHBhcmVudC5zY3JlZW5DVE0oKS5pbnZlcnNlKClcclxuXHJcbiAgICB0aGlzLmFkZFRvKHBhcmVudCkudW50cmFuc2Zvcm0oKS50cmFuc2Zvcm0ocEN0bS5tdWx0aXBseShjdG0pKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfSxcclxuICAvLyBzYW1lIGFzIGFib3ZlIHdpdGggcGFyZW50IGVxdWFscyByb290LXN2Z1xyXG4gIHRvRG9jOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnRvUGFyZW50KHRoaXMuZG9jKCkpXHJcbiAgfVxyXG5cclxufSlcclxuXHJcblNWRy5UcmFuc2Zvcm1hdGlvbiA9IFNWRy5pbnZlbnQoe1xyXG5cclxuICBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgaW52ZXJzZWQpe1xyXG5cclxuICAgIGlmKGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIHR5cGVvZiBpbnZlcnNlZCAhPSAnYm9vbGVhbicpe1xyXG4gICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSlcclxuICAgIH1cclxuXHJcbiAgICBpZihBcnJheS5pc0FycmF5KHNvdXJjZSkpe1xyXG4gICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW47ICsraSl7XHJcbiAgICAgICAgdGhpc1t0aGlzLmFyZ3VtZW50c1tpXV0gPSBzb3VyY2VbaV1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIGlmKHR5cGVvZiBzb3VyY2UgPT0gJ29iamVjdCcpe1xyXG4gICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW47ICsraSl7XHJcbiAgICAgICAgdGhpc1t0aGlzLmFyZ3VtZW50c1tpXV0gPSBzb3VyY2VbdGhpcy5hcmd1bWVudHNbaV1dXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmludmVyc2VkID0gZmFsc2VcclxuXHJcbiAgICBpZihpbnZlcnNlZCA9PT0gdHJ1ZSl7XHJcbiAgICAgIHRoaXMuaW52ZXJzZWQgPSB0cnVlXHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiwgZXh0ZW5kOiB7XHJcblxyXG4gICAgYXJndW1lbnRzOiBbXVxyXG4gICwgbWV0aG9kOiAnJ1xyXG5cclxuICAsIGF0OiBmdW5jdGlvbihwb3Mpe1xyXG5cclxuICAgICAgdmFyIHBhcmFtcyA9IFtdXHJcblxyXG4gICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsZW47ICsraSl7XHJcbiAgICAgICAgcGFyYW1zLnB1c2godGhpc1t0aGlzLmFyZ3VtZW50c1tpXV0pXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHZhciBtID0gdGhpcy5fdW5kbyB8fCBuZXcgU1ZHLk1hdHJpeCgpXHJcblxyXG4gICAgICBtID0gbmV3IFNWRy5NYXRyaXgoKS5tb3JwaChTVkcuTWF0cml4LnByb3RvdHlwZVt0aGlzLm1ldGhvZF0uYXBwbHkobSwgcGFyYW1zKSkuYXQocG9zKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuaW52ZXJzZWQgPyBtLmludmVyc2UoKSA6IG1cclxuXHJcbiAgICB9XHJcblxyXG4gICwgdW5kbzogZnVuY3Rpb24obyl7XHJcbiAgICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKXtcclxuICAgICAgICBvW3RoaXMuYXJndW1lbnRzW2ldXSA9IHR5cGVvZiB0aGlzW3RoaXMuYXJndW1lbnRzW2ldXSA9PSAndW5kZWZpbmVkJyA/IDAgOiBvW3RoaXMuYXJndW1lbnRzW2ldXVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBUaGUgbWV0aG9kIFNWRy5NYXRyaXguZXh0cmFjdCB3aGljaCB3YXMgdXNlZCBiZWZvcmUgY2FsbGluZyB0aGlzXHJcbiAgICAgIC8vIG1ldGhvZCB0byBvYnRhaW4gYSB2YWx1ZSBmb3IgdGhlIHBhcmFtZXRlciBvIGRvZXNuJ3QgcmV0dXJuIGEgY3ggYW5kXHJcbiAgICAgIC8vIGEgY3kgc28gd2UgdXNlIHRoZSBvbmVzIHRoYXQgd2VyZSBwcm92aWRlZCB0byB0aGlzIG9iamVjdCBhdCBpdHMgY3JlYXRpb25cclxuICAgICAgby5jeCA9IHRoaXMuY3hcclxuICAgICAgby5jeSA9IHRoaXMuY3lcclxuXHJcbiAgICAgIHRoaXMuX3VuZG8gPSBuZXcgU1ZHW2NhcGl0YWxpemUodGhpcy5tZXRob2QpXShvLCB0cnVlKS5hdCgxKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgfVxyXG5cclxufSlcclxuXHJcblNWRy5UcmFuc2xhdGUgPSBTVkcuaW52ZW50KHtcclxuXHJcbiAgcGFyZW50OiBTVkcuTWF0cml4XHJcbiwgaW5oZXJpdDogU1ZHLlRyYW5zZm9ybWF0aW9uXHJcblxyXG4sIGNyZWF0ZTogZnVuY3Rpb24oc291cmNlLCBpbnZlcnNlZCl7XHJcbiAgICB0aGlzLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSlcclxuICB9XHJcblxyXG4sIGV4dGVuZDoge1xyXG4gICAgYXJndW1lbnRzOiBbJ3RyYW5zZm9ybWVkWCcsICd0cmFuc2Zvcm1lZFknXVxyXG4gICwgbWV0aG9kOiAndHJhbnNsYXRlJ1xyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuUm90YXRlID0gU1ZHLmludmVudCh7XHJcblxyXG4gIHBhcmVudDogU1ZHLk1hdHJpeFxyXG4sIGluaGVyaXQ6IFNWRy5UcmFuc2Zvcm1hdGlvblxyXG5cclxuLCBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgaW52ZXJzZWQpe1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpXHJcbiAgfVxyXG5cclxuLCBleHRlbmQ6IHtcclxuICAgIGFyZ3VtZW50czogWydyb3RhdGlvbicsICdjeCcsICdjeSddXHJcbiAgLCBtZXRob2Q6ICdyb3RhdGUnXHJcbiAgLCBhdDogZnVuY3Rpb24ocG9zKXtcclxuICAgICAgdmFyIG0gPSBuZXcgU1ZHLk1hdHJpeCgpLnJvdGF0ZShuZXcgU1ZHLk51bWJlcigpLm1vcnBoKHRoaXMucm90YXRpb24gLSAodGhpcy5fdW5kbyA/IHRoaXMuX3VuZG8ucm90YXRpb24gOiAwKSkuYXQocG9zKSwgdGhpcy5jeCwgdGhpcy5jeSlcclxuICAgICAgcmV0dXJuIHRoaXMuaW52ZXJzZWQgPyBtLmludmVyc2UoKSA6IG1cclxuICAgIH1cclxuICAsIHVuZG86IGZ1bmN0aW9uKG8pe1xyXG4gICAgICB0aGlzLl91bmRvID0gb1xyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuU2NhbGUgPSBTVkcuaW52ZW50KHtcclxuXHJcbiAgcGFyZW50OiBTVkcuTWF0cml4XHJcbiwgaW5oZXJpdDogU1ZHLlRyYW5zZm9ybWF0aW9uXHJcblxyXG4sIGNyZWF0ZTogZnVuY3Rpb24oc291cmNlLCBpbnZlcnNlZCl7XHJcbiAgICB0aGlzLmNvbnN0cnVjdG9yLmFwcGx5KHRoaXMsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSlcclxuICB9XHJcblxyXG4sIGV4dGVuZDoge1xyXG4gICAgYXJndW1lbnRzOiBbJ3NjYWxlWCcsICdzY2FsZVknLCAnY3gnLCAnY3knXVxyXG4gICwgbWV0aG9kOiAnc2NhbGUnXHJcbiAgfVxyXG5cclxufSlcclxuXHJcblNWRy5Ta2V3ID0gU1ZHLmludmVudCh7XHJcblxyXG4gIHBhcmVudDogU1ZHLk1hdHJpeFxyXG4sIGluaGVyaXQ6IFNWRy5UcmFuc2Zvcm1hdGlvblxyXG5cclxuLCBjcmVhdGU6IGZ1bmN0aW9uKHNvdXJjZSwgaW52ZXJzZWQpe1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpXHJcbiAgfVxyXG5cclxuLCBleHRlbmQ6IHtcclxuICAgIGFyZ3VtZW50czogWydza2V3WCcsICdza2V3WScsICdjeCcsICdjeSddXHJcbiAgLCBtZXRob2Q6ICdza2V3J1xyXG4gIH1cclxuXHJcbn0pXHJcblxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG4gIC8vIER5bmFtaWMgc3R5bGUgZ2VuZXJhdG9yXHJcbiAgc3R5bGU6IGZ1bmN0aW9uKHMsIHYpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcclxuICAgICAgLy8gZ2V0IGZ1bGwgc3R5bGVcclxuICAgICAgcmV0dXJuIHRoaXMubm9kZS5zdHlsZS5jc3NUZXh0IHx8ICcnXHJcblxyXG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikge1xyXG4gICAgICAvLyBhcHBseSBldmVyeSBzdHlsZSBpbmRpdmlkdWFsbHkgaWYgYW4gb2JqZWN0IGlzIHBhc3NlZFxyXG4gICAgICBpZiAodHlwZW9mIHMgPT0gJ29iamVjdCcpIHtcclxuICAgICAgICBmb3IgKHYgaW4gcykgdGhpcy5zdHlsZSh2LCBzW3ZdKVxyXG5cclxuICAgICAgfSBlbHNlIGlmIChTVkcucmVnZXguaXNDc3MudGVzdChzKSkge1xyXG4gICAgICAgIC8vIHBhcnNlIGNzcyBzdHJpbmdcclxuICAgICAgICBzID0gcy5zcGxpdCgvXFxzKjtcXHMqLylcclxuICAgICAgICAgIC8vIGZpbHRlciBvdXQgc3VmZml4IDsgYW5kIHN0dWZmIGxpa2UgOztcclxuICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24oZSkgeyByZXR1cm4gISFlIH0pXHJcbiAgICAgICAgICAubWFwKGZ1bmN0aW9uKGUpeyByZXR1cm4gZS5zcGxpdCgvXFxzKjpcXHMqLykgfSlcclxuXHJcbiAgICAgICAgLy8gYXBwbHkgZXZlcnkgZGVmaW5pdGlvbiBpbmRpdmlkdWFsbHlcclxuICAgICAgICB3aGlsZSAodiA9IHMucG9wKCkpIHtcclxuICAgICAgICAgIHRoaXMuc3R5bGUodlswXSwgdlsxXSlcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gYWN0IGFzIGEgZ2V0dGVyIGlmIHRoZSBmaXJzdCBhbmQgb25seSBhcmd1bWVudCBpcyBub3QgYW4gb2JqZWN0XHJcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS5zdHlsZVtjYW1lbENhc2UocyldXHJcbiAgICAgIH1cclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLm5vZGUuc3R5bGVbY2FtZWxDYXNlKHMpXSA9IHYgPT09IG51bGwgfHwgU1ZHLnJlZ2V4LmlzQmxhbmsudGVzdCh2KSA/ICcnIDogdlxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG59KVxuU1ZHLlBhcmVudCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGVsZW1lbnQpXHJcbiAgfVxyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuRWxlbWVudFxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gUmV0dXJucyBhbGwgY2hpbGQgZWxlbWVudHNcclxuICAgIGNoaWxkcmVuOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIFNWRy51dGlscy5tYXAoU1ZHLnV0aWxzLmZpbHRlclNWR0VsZW1lbnRzKHRoaXMubm9kZS5jaGlsZE5vZGVzKSwgZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICAgIHJldHVybiBTVkcuYWRvcHQobm9kZSlcclxuICAgICAgfSlcclxuICAgIH1cclxuICAgIC8vIEFkZCBnaXZlbiBlbGVtZW50IGF0IGEgcG9zaXRpb25cclxuICAsIGFkZDogZnVuY3Rpb24oZWxlbWVudCwgaSkge1xyXG4gICAgICBpZiAoaSA9PSBudWxsKVxyXG4gICAgICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZChlbGVtZW50Lm5vZGUpXHJcbiAgICAgIGVsc2UgaWYgKGVsZW1lbnQubm9kZSAhPSB0aGlzLm5vZGUuY2hpbGROb2Rlc1tpXSlcclxuICAgICAgICB0aGlzLm5vZGUuaW5zZXJ0QmVmb3JlKGVsZW1lbnQubm9kZSwgdGhpcy5ub2RlLmNoaWxkTm9kZXNbaV0pXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gQmFzaWNhbGx5IGRvZXMgdGhlIHNhbWUgYXMgYGFkZCgpYCBidXQgcmV0dXJucyB0aGUgYWRkZWQgZWxlbWVudCBpbnN0ZWFkXHJcbiAgLCBwdXQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGkpIHtcclxuICAgICAgdGhpcy5hZGQoZWxlbWVudCwgaSlcclxuICAgICAgcmV0dXJuIGVsZW1lbnRcclxuICAgIH1cclxuICAgIC8vIENoZWNrcyBpZiB0aGUgZ2l2ZW4gZWxlbWVudCBpcyBhIGNoaWxkXHJcbiAgLCBoYXM6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuaW5kZXgoZWxlbWVudCkgPj0gMFxyXG4gICAgfVxyXG4gICAgLy8gR2V0cyBpbmRleCBvZiBnaXZlbiBlbGVtZW50XHJcbiAgLCBpbmRleDogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgICByZXR1cm4gW10uc2xpY2UuY2FsbCh0aGlzLm5vZGUuY2hpbGROb2RlcykuaW5kZXhPZihlbGVtZW50Lm5vZGUpXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgYSBlbGVtZW50IGF0IHRoZSBnaXZlbiBpbmRleFxyXG4gICwgZ2V0OiBmdW5jdGlvbihpKSB7XHJcbiAgICAgIHJldHVybiBTVkcuYWRvcHQodGhpcy5ub2RlLmNoaWxkTm9kZXNbaV0pXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgZmlyc3QgY2hpbGRcclxuICAsIGZpcnN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZ2V0KDApXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgdGhlIGxhc3QgY2hpbGRcclxuICAsIGxhc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5nZXQodGhpcy5ub2RlLmNoaWxkTm9kZXMubGVuZ3RoIC0gMSlcclxuICAgIH1cclxuICAgIC8vIEl0ZXJhdGVzIG92ZXIgYWxsIGNoaWxkcmVuIGFuZCBpbnZva2VzIGEgZ2l2ZW4gYmxvY2tcclxuICAsIGVhY2g6IGZ1bmN0aW9uKGJsb2NrLCBkZWVwKSB7XHJcbiAgICAgIHZhciBpLCBpbFxyXG4gICAgICAgICwgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuKClcclxuXHJcbiAgICAgIGZvciAoaSA9IDAsIGlsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgaWw7IGkrKykge1xyXG4gICAgICAgIGlmIChjaGlsZHJlbltpXSBpbnN0YW5jZW9mIFNWRy5FbGVtZW50KVxyXG4gICAgICAgICAgYmxvY2suYXBwbHkoY2hpbGRyZW5baV0sIFtpLCBjaGlsZHJlbl0pXHJcblxyXG4gICAgICAgIGlmIChkZWVwICYmIChjaGlsZHJlbltpXSBpbnN0YW5jZW9mIFNWRy5Db250YWluZXIpKVxyXG4gICAgICAgICAgY2hpbGRyZW5baV0uZWFjaChibG9jaywgZGVlcClcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIFJlbW92ZSBhIGdpdmVuIGNoaWxkXHJcbiAgLCByZW1vdmVFbGVtZW50OiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgIHRoaXMubm9kZS5yZW1vdmVDaGlsZChlbGVtZW50Lm5vZGUpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gUmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGlzIGNvbnRhaW5lclxyXG4gICwgY2xlYXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvLyByZW1vdmUgY2hpbGRyZW5cclxuICAgICAgd2hpbGUodGhpcy5ub2RlLmhhc0NoaWxkTm9kZXMoKSlcclxuICAgICAgICB0aGlzLm5vZGUucmVtb3ZlQ2hpbGQodGhpcy5ub2RlLmxhc3RDaGlsZClcclxuXHJcbiAgICAgIC8vIHJlbW92ZSBkZWZzIHJlZmVyZW5jZVxyXG4gICAgICBkZWxldGUgdGhpcy5fZGVmc1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAsIC8vIEdldCBkZWZzXHJcbiAgICBkZWZzOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZG9jKCkuZGVmcygpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxufSlcclxuXG5TVkcuZXh0ZW5kKFNWRy5QYXJlbnQsIHtcclxuXHJcbiAgdW5ncm91cDogZnVuY3Rpb24ocGFyZW50LCBkZXB0aCkge1xyXG4gICAgaWYoZGVwdGggPT09IDAgfHwgdGhpcyBpbnN0YW5jZW9mIFNWRy5EZWZzIHx8IHRoaXMubm9kZSA9PSBTVkcucGFyc2VyLmRyYXcpIHJldHVybiB0aGlzXHJcblxyXG4gICAgcGFyZW50ID0gcGFyZW50IHx8ICh0aGlzIGluc3RhbmNlb2YgU1ZHLkRvYyA/IHRoaXMgOiB0aGlzLnBhcmVudChTVkcuUGFyZW50KSlcclxuICAgIGRlcHRoID0gZGVwdGggfHwgSW5maW5pdHlcclxuXHJcbiAgICB0aGlzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgaWYodGhpcyBpbnN0YW5jZW9mIFNWRy5EZWZzKSByZXR1cm4gdGhpc1xyXG4gICAgICBpZih0aGlzIGluc3RhbmNlb2YgU1ZHLlBhcmVudCkgcmV0dXJuIHRoaXMudW5ncm91cChwYXJlbnQsIGRlcHRoLTEpXHJcbiAgICAgIHJldHVybiB0aGlzLnRvUGFyZW50KHBhcmVudClcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5ub2RlLmZpcnN0Q2hpbGQgfHwgdGhpcy5yZW1vdmUoKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfSxcclxuXHJcbiAgZmxhdHRlbjogZnVuY3Rpb24ocGFyZW50LCBkZXB0aCkge1xyXG4gICAgcmV0dXJuIHRoaXMudW5ncm91cChwYXJlbnQsIGRlcHRoKVxyXG4gIH1cclxuXHJcbn0pXG5TVkcuQ29udGFpbmVyID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICB0aGlzLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgZWxlbWVudClcclxuICB9XHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5QYXJlbnRcclxuXHJcbn0pXG5cclxuU1ZHLlZpZXdCb3ggPSBTVkcuaW52ZW50KHtcclxuXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihzb3VyY2UpIHtcclxuICAgIHZhciBpLCBiYXNlID0gWzAsIDAsIDAsIDBdXHJcblxyXG4gICAgdmFyIHgsIHksIHdpZHRoLCBoZWlnaHQsIGJveCwgdmlldywgd2UsIGhlXHJcbiAgICAgICwgd20gICA9IDEgLy8gd2lkdGggbXVsdGlwbGllclxyXG4gICAgICAsIGhtICAgPSAxIC8vIGhlaWdodCBtdWx0aXBsaWVyXHJcbiAgICAgICwgcmVnICA9IC9bKy1dPyg/OlxcZCsoPzpcXC5cXGQqKT98XFwuXFxkKykoPzplWystXT9cXGQrKT8vZ2lcclxuXHJcbiAgICBpZihzb3VyY2UgaW5zdGFuY2VvZiBTVkcuRWxlbWVudCl7XHJcblxyXG4gICAgICB3ZSA9IHNvdXJjZVxyXG4gICAgICBoZSA9IHNvdXJjZVxyXG4gICAgICB2aWV3ID0gKHNvdXJjZS5hdHRyKCd2aWV3Qm94JykgfHwgJycpLm1hdGNoKHJlZylcclxuICAgICAgYm94ID0gc291cmNlLmJib3hcclxuXHJcbiAgICAgIC8vIGdldCBkaW1lbnNpb25zIG9mIGN1cnJlbnQgbm9kZVxyXG4gICAgICB3aWR0aCAgPSBuZXcgU1ZHLk51bWJlcihzb3VyY2Uud2lkdGgoKSlcclxuICAgICAgaGVpZ2h0ID0gbmV3IFNWRy5OdW1iZXIoc291cmNlLmhlaWdodCgpKVxyXG5cclxuICAgICAgLy8gZmluZCBuZWFyZXN0IG5vbi1wZXJjZW50dWFsIGRpbWVuc2lvbnNcclxuICAgICAgd2hpbGUgKHdpZHRoLnVuaXQgPT0gJyUnKSB7XHJcbiAgICAgICAgd20gKj0gd2lkdGgudmFsdWVcclxuICAgICAgICB3aWR0aCA9IG5ldyBTVkcuTnVtYmVyKHdlIGluc3RhbmNlb2YgU1ZHLkRvYyA/IHdlLnBhcmVudCgpLm9mZnNldFdpZHRoIDogd2UucGFyZW50KCkud2lkdGgoKSlcclxuICAgICAgICB3ZSA9IHdlLnBhcmVudCgpXHJcbiAgICAgIH1cclxuICAgICAgd2hpbGUgKGhlaWdodC51bml0ID09ICclJykge1xyXG4gICAgICAgIGhtICo9IGhlaWdodC52YWx1ZVxyXG4gICAgICAgIGhlaWdodCA9IG5ldyBTVkcuTnVtYmVyKGhlIGluc3RhbmNlb2YgU1ZHLkRvYyA/IGhlLnBhcmVudCgpLm9mZnNldEhlaWdodCA6IGhlLnBhcmVudCgpLmhlaWdodCgpKVxyXG4gICAgICAgIGhlID0gaGUucGFyZW50KClcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gZW5zdXJlIGRlZmF1bHRzXHJcbiAgICAgIHRoaXMueCAgICAgID0gMFxyXG4gICAgICB0aGlzLnkgICAgICA9IDBcclxuICAgICAgdGhpcy53aWR0aCAgPSB3aWR0aCAgKiB3bVxyXG4gICAgICB0aGlzLmhlaWdodCA9IGhlaWdodCAqIGhtXHJcbiAgICAgIHRoaXMuem9vbSAgID0gMVxyXG5cclxuICAgICAgaWYgKHZpZXcpIHtcclxuICAgICAgICAvLyBnZXQgd2lkdGggYW5kIGhlaWdodCBmcm9tIHZpZXdib3hcclxuICAgICAgICB4ICAgICAgPSBwYXJzZUZsb2F0KHZpZXdbMF0pXHJcbiAgICAgICAgeSAgICAgID0gcGFyc2VGbG9hdCh2aWV3WzFdKVxyXG4gICAgICAgIHdpZHRoICA9IHBhcnNlRmxvYXQodmlld1syXSlcclxuICAgICAgICBoZWlnaHQgPSBwYXJzZUZsb2F0KHZpZXdbM10pXHJcblxyXG4gICAgICAgIC8vIGNhbGN1bGF0ZSB6b29tIGFjY29yaW5nIHRvIHZpZXdib3hcclxuICAgICAgICB0aGlzLnpvb20gPSAoKHRoaXMud2lkdGggLyB0aGlzLmhlaWdodCkgPiAod2lkdGggLyBoZWlnaHQpKSA/XHJcbiAgICAgICAgICB0aGlzLmhlaWdodCAvIGhlaWdodCA6XHJcbiAgICAgICAgICB0aGlzLndpZHRoICAvIHdpZHRoXHJcblxyXG4gICAgICAgIC8vIGNhbGN1bGF0ZSByZWFsIHBpeGVsIGRpbWVuc2lvbnMgb24gcGFyZW50IFNWRy5Eb2MgZWxlbWVudFxyXG4gICAgICAgIHRoaXMueCAgICAgID0geFxyXG4gICAgICAgIHRoaXMueSAgICAgID0geVxyXG4gICAgICAgIHRoaXMud2lkdGggID0gd2lkdGhcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodFxyXG5cclxuICAgICAgfVxyXG5cclxuICAgIH1lbHNle1xyXG5cclxuICAgICAgLy8gZW5zdXJlIHNvdXJjZSBhcyBvYmplY3RcclxuICAgICAgc291cmNlID0gdHlwZW9mIHNvdXJjZSA9PT0gJ3N0cmluZycgP1xyXG4gICAgICAgIHNvdXJjZS5tYXRjaChyZWcpLm1hcChmdW5jdGlvbihlbCl7IHJldHVybiBwYXJzZUZsb2F0KGVsKSB9KSA6XHJcbiAgICAgIEFycmF5LmlzQXJyYXkoc291cmNlKSA/XHJcbiAgICAgICAgc291cmNlIDpcclxuICAgICAgdHlwZW9mIHNvdXJjZSA9PSAnb2JqZWN0JyA/XHJcbiAgICAgICAgW3NvdXJjZS54LCBzb3VyY2UueSwgc291cmNlLndpZHRoLCBzb3VyY2UuaGVpZ2h0XSA6XHJcbiAgICAgIGFyZ3VtZW50cy5sZW5ndGggPT0gNCA/XHJcbiAgICAgICAgW10uc2xpY2UuY2FsbChhcmd1bWVudHMpIDpcclxuICAgICAgICBiYXNlXHJcblxyXG4gICAgICB0aGlzLnggPSBzb3VyY2VbMF1cclxuICAgICAgdGhpcy55ID0gc291cmNlWzFdXHJcbiAgICAgIHRoaXMud2lkdGggPSBzb3VyY2VbMl1cclxuICAgICAgdGhpcy5oZWlnaHQgPSBzb3VyY2VbM11cclxuICAgIH1cclxuXHJcblxyXG4gIH1cclxuXHJcbiwgZXh0ZW5kOiB7XHJcblxyXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy54ICsgJyAnICsgdGhpcy55ICsgJyAnICsgdGhpcy53aWR0aCArICcgJyArIHRoaXMuaGVpZ2h0XHJcbiAgICB9XHJcbiAgLCBtb3JwaDogZnVuY3Rpb24oeCwgeSwgd2lkdGgsIGhlaWdodCl7XHJcbiAgICAgIHRoaXMuZGVzdGluYXRpb24gPSBuZXcgU1ZHLlZpZXdCb3goeCwgeSwgd2lkdGgsIGhlaWdodClcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgLCBhdDogZnVuY3Rpb24ocG9zKSB7XHJcblxyXG4gICAgICBpZighdGhpcy5kZXN0aW5hdGlvbikgcmV0dXJuIHRoaXNcclxuXHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLlZpZXdCb3goW1xyXG4gICAgICAgICAgdGhpcy54ICsgKHRoaXMuZGVzdGluYXRpb24ueCAtIHRoaXMueCkgKiBwb3NcclxuICAgICAgICAsIHRoaXMueSArICh0aGlzLmRlc3RpbmF0aW9uLnkgLSB0aGlzLnkpICogcG9zXHJcbiAgICAgICAgLCB0aGlzLndpZHRoICsgKHRoaXMuZGVzdGluYXRpb24ud2lkdGggLSB0aGlzLndpZHRoKSAqIHBvc1xyXG4gICAgICAgICwgdGhpcy5oZWlnaHQgKyAodGhpcy5kZXN0aW5hdGlvbi5oZWlnaHQgLSB0aGlzLmhlaWdodCkgKiBwb3NcclxuICAgICAgXSlcclxuXHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gRGVmaW5lIHBhcmVudFxyXG4sIHBhcmVudDogU1ZHLkNvbnRhaW5lclxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG5cclxuICAgIC8vIGdldC9zZXQgdmlld2JveFxyXG4gICAgdmlld2JveDogZnVuY3Rpb24oeCwgeSwgd2lkdGgsIGhlaWdodCkge1xyXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKVxyXG4gICAgICAgIC8vIGFjdCBhcyBhIGdldHRlciBpZiB0aGVyZSBhcmUgbm8gYXJndW1lbnRzXHJcbiAgICAgICAgcmV0dXJuIG5ldyBTVkcuVmlld0JveCh0aGlzKVxyXG5cclxuICAgICAgLy8gb3RoZXJ3aXNlIGFjdCBhcyBhIHNldHRlclxyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCd2aWV3Qm94JywgbmV3IFNWRy5WaWV3Qm94KHgsIHksIHdpZHRoLCBoZWlnaHQpKVxyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG59KVxuLy8gQWRkIGV2ZW50cyB0byBlbGVtZW50c1xyXG47WyAgJ2NsaWNrJ1xyXG4gICwgJ2RibGNsaWNrJ1xyXG4gICwgJ21vdXNlZG93bidcclxuICAsICdtb3VzZXVwJ1xyXG4gICwgJ21vdXNlb3ZlcidcclxuICAsICdtb3VzZW91dCdcclxuICAsICdtb3VzZW1vdmUnXHJcbiAgLy8gLCAnbW91c2VlbnRlcicgLT4gbm90IHN1cHBvcnRlZCBieSBJRVxyXG4gIC8vICwgJ21vdXNlbGVhdmUnIC0+IG5vdCBzdXBwb3J0ZWQgYnkgSUVcclxuICAsICd0b3VjaHN0YXJ0J1xyXG4gICwgJ3RvdWNobW92ZSdcclxuICAsICd0b3VjaGxlYXZlJ1xyXG4gICwgJ3RvdWNoZW5kJ1xyXG4gICwgJ3RvdWNoY2FuY2VsJyBdLmZvckVhY2goZnVuY3Rpb24oZXZlbnQpIHtcclxuXHJcbiAgLy8gYWRkIGV2ZW50IHRvIFNWRy5FbGVtZW50XHJcbiAgU1ZHLkVsZW1lbnQucHJvdG90eXBlW2V2ZW50XSA9IGZ1bmN0aW9uKGYpIHtcclxuICAgIC8vIGJpbmQgZXZlbnQgdG8gZWxlbWVudCByYXRoZXIgdGhhbiBlbGVtZW50IG5vZGVcclxuICAgIFNWRy5vbih0aGlzLm5vZGUsIGV2ZW50LCBmKVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbn0pXHJcblxyXG4vLyBJbml0aWFsaXplIGxpc3RlbmVycyBzdGFja1xyXG5TVkcubGlzdGVuZXJzID0gW11cclxuU1ZHLmhhbmRsZXJNYXAgPSBbXVxyXG5TVkcubGlzdGVuZXJJZCA9IDBcclxuXHJcbi8vIEFkZCBldmVudCBiaW5kZXIgaW4gdGhlIFNWRyBuYW1lc3BhY2VcclxuU1ZHLm9uID0gZnVuY3Rpb24obm9kZSwgZXZlbnQsIGxpc3RlbmVyLCBiaW5kaW5nLCBvcHRpb25zKSB7XHJcbiAgLy8gY3JlYXRlIGxpc3RlbmVyLCBnZXQgb2JqZWN0LWluZGV4XHJcbiAgdmFyIGwgICAgID0gbGlzdGVuZXIuYmluZChiaW5kaW5nIHx8IG5vZGUuaW5zdGFuY2UgfHwgbm9kZSlcclxuICAgICwgaW5kZXggPSAoU1ZHLmhhbmRsZXJNYXAuaW5kZXhPZihub2RlKSArIDEgfHwgU1ZHLmhhbmRsZXJNYXAucHVzaChub2RlKSkgLSAxXHJcbiAgICAsIGV2ICAgID0gZXZlbnQuc3BsaXQoJy4nKVswXVxyXG4gICAgLCBucyAgICA9IGV2ZW50LnNwbGl0KCcuJylbMV0gfHwgJyonXHJcblxyXG5cclxuICAvLyBlbnN1cmUgdmFsaWQgb2JqZWN0XHJcbiAgU1ZHLmxpc3RlbmVyc1tpbmRleF0gICAgICAgICA9IFNWRy5saXN0ZW5lcnNbaW5kZXhdICAgICAgICAgfHwge31cclxuICBTVkcubGlzdGVuZXJzW2luZGV4XVtldl0gICAgID0gU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZdICAgICB8fCB7fVxyXG4gIFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XVtuc10gPSBTVkcubGlzdGVuZXJzW2luZGV4XVtldl1bbnNdIHx8IHt9XHJcblxyXG4gIGlmKCFsaXN0ZW5lci5fc3ZnanNMaXN0ZW5lcklkKVxyXG4gICAgbGlzdGVuZXIuX3N2Z2pzTGlzdGVuZXJJZCA9ICsrU1ZHLmxpc3RlbmVySWRcclxuXHJcbiAgLy8gcmVmZXJlbmNlIGxpc3RlbmVyXHJcbiAgU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZdW25zXVtsaXN0ZW5lci5fc3ZnanNMaXN0ZW5lcklkXSA9IGxcclxuXHJcbiAgLy8gYWRkIGxpc3RlbmVyXHJcbiAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2LCBsLCBvcHRpb25zIHx8IGZhbHNlKVxyXG59XHJcblxyXG4vLyBBZGQgZXZlbnQgdW5iaW5kZXIgaW4gdGhlIFNWRyBuYW1lc3BhY2VcclxuU1ZHLm9mZiA9IGZ1bmN0aW9uKG5vZGUsIGV2ZW50LCBsaXN0ZW5lcikge1xyXG4gIHZhciBpbmRleCA9IFNWRy5oYW5kbGVyTWFwLmluZGV4T2Yobm9kZSlcclxuICAgICwgZXYgICAgPSBldmVudCAmJiBldmVudC5zcGxpdCgnLicpWzBdXHJcbiAgICAsIG5zICAgID0gZXZlbnQgJiYgZXZlbnQuc3BsaXQoJy4nKVsxXVxyXG4gICAgLCBuYW1lc3BhY2UgPSAnJ1xyXG5cclxuICBpZihpbmRleCA9PSAtMSkgcmV0dXJuXHJcblxyXG4gIGlmIChsaXN0ZW5lcikge1xyXG4gICAgaWYodHlwZW9mIGxpc3RlbmVyID09ICdmdW5jdGlvbicpIGxpc3RlbmVyID0gbGlzdGVuZXIuX3N2Z2pzTGlzdGVuZXJJZFxyXG4gICAgaWYoIWxpc3RlbmVyKSByZXR1cm5cclxuXHJcbiAgICAvLyByZW1vdmUgbGlzdGVuZXIgcmVmZXJlbmNlXHJcbiAgICBpZiAoU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZdICYmIFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XVtucyB8fCAnKiddKSB7XHJcbiAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lclxyXG4gICAgICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXYsIFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XVtucyB8fCAnKiddW2xpc3RlbmVyXSwgZmFsc2UpXHJcblxyXG4gICAgICBkZWxldGUgU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZdW25zIHx8ICcqJ11bbGlzdGVuZXJdXHJcbiAgICB9XHJcblxyXG4gIH0gZWxzZSBpZiAobnMgJiYgZXYpIHtcclxuICAgIC8vIHJlbW92ZSBhbGwgbGlzdGVuZXJzIGZvciBhIG5hbWVzcGFjZWQgZXZlbnRcclxuICAgIGlmIChTVkcubGlzdGVuZXJzW2luZGV4XVtldl0gJiYgU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZdW25zXSkge1xyXG4gICAgICBmb3IgKGxpc3RlbmVyIGluIFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XVtuc10pXHJcbiAgICAgICAgU1ZHLm9mZihub2RlLCBbZXYsIG5zXS5qb2luKCcuJyksIGxpc3RlbmVyKVxyXG5cclxuICAgICAgZGVsZXRlIFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XVtuc11cclxuICAgIH1cclxuXHJcbiAgfSBlbHNlIGlmIChucyl7XHJcbiAgICAvLyByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgYSBzcGVjaWZpYyBuYW1lc3BhY2VcclxuICAgIGZvcihldmVudCBpbiBTVkcubGlzdGVuZXJzW2luZGV4XSl7XHJcbiAgICAgICAgZm9yKG5hbWVzcGFjZSBpbiBTVkcubGlzdGVuZXJzW2luZGV4XVtldmVudF0pe1xyXG4gICAgICAgICAgICBpZihucyA9PT0gbmFtZXNwYWNlKXtcclxuICAgICAgICAgICAgICAgIFNWRy5vZmYobm9kZSwgW2V2ZW50LCBuc10uam9pbignLicpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICB9IGVsc2UgaWYgKGV2KSB7XHJcbiAgICAvLyByZW1vdmUgYWxsIGxpc3RlbmVycyBmb3IgdGhlIGV2ZW50XHJcbiAgICBpZiAoU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZdKSB7XHJcbiAgICAgIGZvciAobmFtZXNwYWNlIGluIFNWRy5saXN0ZW5lcnNbaW5kZXhdW2V2XSlcclxuICAgICAgICBTVkcub2ZmKG5vZGUsIFtldiwgbmFtZXNwYWNlXS5qb2luKCcuJykpXHJcblxyXG4gICAgICBkZWxldGUgU1ZHLmxpc3RlbmVyc1tpbmRleF1bZXZdXHJcbiAgICB9XHJcblxyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyByZW1vdmUgYWxsIGxpc3RlbmVycyBvbiBhIGdpdmVuIG5vZGVcclxuICAgIGZvciAoZXZlbnQgaW4gU1ZHLmxpc3RlbmVyc1tpbmRleF0pXHJcbiAgICAgIFNWRy5vZmYobm9kZSwgZXZlbnQpXHJcblxyXG4gICAgZGVsZXRlIFNWRy5saXN0ZW5lcnNbaW5kZXhdXHJcbiAgICBkZWxldGUgU1ZHLmhhbmRsZXJNYXBbaW5kZXhdXHJcblxyXG4gIH1cclxufVxyXG5cclxuLy9cclxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG4gIC8vIEJpbmQgZ2l2ZW4gZXZlbnQgdG8gbGlzdGVuZXJcclxuICBvbjogZnVuY3Rpb24oZXZlbnQsIGxpc3RlbmVyLCBiaW5kaW5nLCBvcHRpb25zKSB7XHJcbiAgICBTVkcub24odGhpcy5ub2RlLCBldmVudCwgbGlzdGVuZXIsIGJpbmRpbmcsIG9wdGlvbnMpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gVW5iaW5kIGV2ZW50IGZyb20gbGlzdGVuZXJcclxuLCBvZmY6IGZ1bmN0aW9uKGV2ZW50LCBsaXN0ZW5lcikge1xyXG4gICAgU1ZHLm9mZih0aGlzLm5vZGUsIGV2ZW50LCBsaXN0ZW5lcilcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBGaXJlIGdpdmVuIGV2ZW50XHJcbiwgZmlyZTogZnVuY3Rpb24oZXZlbnQsIGRhdGEpIHtcclxuXHJcbiAgICAvLyBEaXNwYXRjaCBldmVudFxyXG4gICAgaWYoZXZlbnQgaW5zdGFuY2VvZiB3aW5kb3cuRXZlbnQpe1xyXG4gICAgICAgIHRoaXMubm9kZS5kaXNwYXRjaEV2ZW50KGV2ZW50KVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5ub2RlLmRpc3BhdGNoRXZlbnQoZXZlbnQgPSBuZXcgd2luZG93LkN1c3RvbUV2ZW50KGV2ZW50LCB7ZGV0YWlsOmRhdGEsIGNhbmNlbGFibGU6IHRydWV9KSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9ldmVudCA9IGV2ZW50XHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuLCBldmVudDogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fZXZlbnRcclxuICB9XHJcbn0pXHJcblxuXHJcblNWRy5EZWZzID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAnZGVmcydcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkNvbnRhaW5lclxyXG5cclxufSlcblNWRy5HID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAnZydcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkNvbnRhaW5lclxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gTW92ZSBvdmVyIHgtYXhpc1xyXG4gICAgeDogZnVuY3Rpb24oeCkge1xyXG4gICAgICByZXR1cm4geCA9PSBudWxsID8gdGhpcy50cmFuc2Zvcm0oJ3gnKSA6IHRoaXMudHJhbnNmb3JtKHsgeDogeCAtIHRoaXMueCgpIH0sIHRydWUpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIG92ZXIgeS1heGlzXHJcbiAgLCB5OiBmdW5jdGlvbih5KSB7XHJcbiAgICAgIHJldHVybiB5ID09IG51bGwgPyB0aGlzLnRyYW5zZm9ybSgneScpIDogdGhpcy50cmFuc2Zvcm0oeyB5OiB5IC0gdGhpcy55KCkgfSwgdHJ1ZSlcclxuICAgIH1cclxuICAgIC8vIE1vdmUgYnkgY2VudGVyIG92ZXIgeC1heGlzXHJcbiAgLCBjeDogZnVuY3Rpb24oeCkge1xyXG4gICAgICByZXR1cm4geCA9PSBudWxsID8gdGhpcy5nYm94KCkuY3ggOiB0aGlzLngoeCAtIHRoaXMuZ2JveCgpLndpZHRoIC8gMilcclxuICAgIH1cclxuICAgIC8vIE1vdmUgYnkgY2VudGVyIG92ZXIgeS1heGlzXHJcbiAgLCBjeTogZnVuY3Rpb24oeSkge1xyXG4gICAgICByZXR1cm4geSA9PSBudWxsID8gdGhpcy5nYm94KCkuY3kgOiB0aGlzLnkoeSAtIHRoaXMuZ2JveCgpLmhlaWdodCAvIDIpXHJcbiAgICB9XHJcbiAgLCBnYm94OiBmdW5jdGlvbigpIHtcclxuXHJcbiAgICAgIHZhciBiYm94ICA9IHRoaXMuYmJveCgpXHJcbiAgICAgICAgLCB0cmFucyA9IHRoaXMudHJhbnNmb3JtKClcclxuXHJcbiAgICAgIGJib3gueCAgKz0gdHJhbnMueFxyXG4gICAgICBiYm94LngyICs9IHRyYW5zLnhcclxuICAgICAgYmJveC5jeCArPSB0cmFucy54XHJcblxyXG4gICAgICBiYm94LnkgICs9IHRyYW5zLnlcclxuICAgICAgYmJveC55MiArPSB0cmFucy55XHJcbiAgICAgIGJib3guY3kgKz0gdHJhbnMueVxyXG5cclxuICAgICAgcmV0dXJuIGJib3hcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgYSBncm91cCBlbGVtZW50XHJcbiAgICBncm91cDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLkcpXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cbi8vICMjIyBUaGlzIG1vZHVsZSBhZGRzIGJhY2t3YXJkIC8gZm9yd2FyZCBmdW5jdGlvbmFsaXR5IHRvIGVsZW1lbnRzLlxyXG5cclxuLy9cclxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG4gIC8vIEdldCBhbGwgc2libGluZ3MsIGluY2x1ZGluZyBteXNlbGZcclxuICBzaWJsaW5nczogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wYXJlbnQoKS5jaGlsZHJlbigpXHJcbiAgfVxyXG4gIC8vIEdldCB0aGUgY3VyZW50IHBvc2l0aW9uIHNpYmxpbmdzXHJcbiwgcG9zaXRpb246IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMucGFyZW50KCkuaW5kZXgodGhpcylcclxuICB9XHJcbiAgLy8gR2V0IHRoZSBuZXh0IGVsZW1lbnQgKHdpbGwgcmV0dXJuIG51bGwgaWYgdGhlcmUgaXMgbm9uZSlcclxuLCBuZXh0OiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLnNpYmxpbmdzKClbdGhpcy5wb3NpdGlvbigpICsgMV1cclxuICB9XHJcbiAgLy8gR2V0IHRoZSBuZXh0IGVsZW1lbnQgKHdpbGwgcmV0dXJuIG51bGwgaWYgdGhlcmUgaXMgbm9uZSlcclxuLCBwcmV2aW91czogZnVuY3Rpb24oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5zaWJsaW5ncygpW3RoaXMucG9zaXRpb24oKSAtIDFdXHJcbiAgfVxyXG4gIC8vIFNlbmQgZ2l2ZW4gZWxlbWVudCBvbmUgc3RlcCBmb3J3YXJkXHJcbiwgZm9yd2FyZDogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgaSA9IHRoaXMucG9zaXRpb24oKSArIDFcclxuICAgICAgLCBwID0gdGhpcy5wYXJlbnQoKVxyXG5cclxuICAgIC8vIG1vdmUgbm9kZSBvbmUgc3RlcCBmb3J3YXJkXHJcbiAgICBwLnJlbW92ZUVsZW1lbnQodGhpcykuYWRkKHRoaXMsIGkpXHJcblxyXG4gICAgLy8gbWFrZSBzdXJlIGRlZnMgbm9kZSBpcyBhbHdheXMgYXQgdGhlIHRvcFxyXG4gICAgaWYgKHAgaW5zdGFuY2VvZiBTVkcuRG9jKVxyXG4gICAgICBwLm5vZGUuYXBwZW5kQ2hpbGQocC5kZWZzKCkubm9kZSlcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBTZW5kIGdpdmVuIGVsZW1lbnQgb25lIHN0ZXAgYmFja3dhcmRcclxuLCBiYWNrd2FyZDogZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgaSA9IHRoaXMucG9zaXRpb24oKVxyXG5cclxuICAgIGlmIChpID4gMClcclxuICAgICAgdGhpcy5wYXJlbnQoKS5yZW1vdmVFbGVtZW50KHRoaXMpLmFkZCh0aGlzLCBpIC0gMSlcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBTZW5kIGdpdmVuIGVsZW1lbnQgYWxsIHRoZSB3YXkgdG8gdGhlIGZyb250XHJcbiwgZnJvbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHAgPSB0aGlzLnBhcmVudCgpXHJcblxyXG4gICAgLy8gTW92ZSBub2RlIGZvcndhcmRcclxuICAgIHAubm9kZS5hcHBlbmRDaGlsZCh0aGlzLm5vZGUpXHJcblxyXG4gICAgLy8gTWFrZSBzdXJlIGRlZnMgbm9kZSBpcyBhbHdheXMgYXQgdGhlIHRvcFxyXG4gICAgaWYgKHAgaW5zdGFuY2VvZiBTVkcuRG9jKVxyXG4gICAgICBwLm5vZGUuYXBwZW5kQ2hpbGQocC5kZWZzKCkubm9kZSlcclxuXHJcbiAgICByZXR1cm4gdGhpc1xyXG4gIH1cclxuICAvLyBTZW5kIGdpdmVuIGVsZW1lbnQgYWxsIHRoZSB3YXkgdG8gdGhlIGJhY2tcclxuLCBiYWNrOiBmdW5jdGlvbigpIHtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uKCkgPiAwKVxyXG4gICAgICB0aGlzLnBhcmVudCgpLnJlbW92ZUVsZW1lbnQodGhpcykuYWRkKHRoaXMsIDApXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gSW5zZXJ0cyBhIGdpdmVuIGVsZW1lbnQgYmVmb3JlIHRoZSB0YXJnZXRlZCBlbGVtZW50XHJcbiwgYmVmb3JlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICBlbGVtZW50LnJlbW92ZSgpXHJcblxyXG4gICAgdmFyIGkgPSB0aGlzLnBvc2l0aW9uKClcclxuXHJcbiAgICB0aGlzLnBhcmVudCgpLmFkZChlbGVtZW50LCBpKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIEluc3RlcnMgYSBnaXZlbiBlbGVtZW50IGFmdGVyIHRoZSB0YXJnZXRlZCBlbGVtZW50XHJcbiwgYWZ0ZXI6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgIGVsZW1lbnQucmVtb3ZlKClcclxuXHJcbiAgICB2YXIgaSA9IHRoaXMucG9zaXRpb24oKVxyXG5cclxuICAgIHRoaXMucGFyZW50KCkuYWRkKGVsZW1lbnQsIGkgKyAxKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxufSlcblNWRy5NYXNrID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBTVkcuY3JlYXRlKCdtYXNrJykpXHJcblxyXG4gICAgLy8ga2VlcCByZWZlcmVuY2VzIHRvIG1hc2tlZCBlbGVtZW50c1xyXG4gICAgdGhpcy50YXJnZXRzID0gW11cclxuICB9XHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5Db250YWluZXJcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIFVubWFzayBhbGwgbWFza2VkIGVsZW1lbnRzIGFuZCByZW1vdmUgaXRzZWxmXHJcbiAgICByZW1vdmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAvLyB1bm1hc2sgYWxsIHRhcmdldHNcclxuICAgICAgZm9yICh2YXIgaSA9IHRoaXMudGFyZ2V0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSlcclxuICAgICAgICBpZiAodGhpcy50YXJnZXRzW2ldKVxyXG4gICAgICAgICAgdGhpcy50YXJnZXRzW2ldLnVubWFzaygpXHJcbiAgICAgIHRoaXMudGFyZ2V0cyA9IFtdXHJcblxyXG4gICAgICAvLyByZW1vdmUgbWFzayBmcm9tIHBhcmVudFxyXG4gICAgICB0aGlzLnBhcmVudCgpLnJlbW92ZUVsZW1lbnQodGhpcylcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIG1hc2tpbmcgZWxlbWVudFxyXG4gICAgbWFzazogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmRlZnMoKS5wdXQobmV3IFNWRy5NYXNrKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5FbGVtZW50LCB7XHJcbiAgLy8gRGlzdHJpYnV0ZSBtYXNrIHRvIHN2ZyBlbGVtZW50XHJcbiAgbWFza1dpdGg6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgIC8vIHVzZSBnaXZlbiBtYXNrIG9yIGNyZWF0ZSBhIG5ldyBvbmVcclxuICAgIHRoaXMubWFza2VyID0gZWxlbWVudCBpbnN0YW5jZW9mIFNWRy5NYXNrID8gZWxlbWVudCA6IHRoaXMucGFyZW50KCkubWFzaygpLmFkZChlbGVtZW50KVxyXG5cclxuICAgIC8vIHN0b3JlIHJldmVyZW5jZSBvbiBzZWxmIGluIG1hc2tcclxuICAgIHRoaXMubWFza2VyLnRhcmdldHMucHVzaCh0aGlzKVxyXG5cclxuICAgIC8vIGFwcGx5IG1hc2tcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ21hc2snLCAndXJsKFwiIycgKyB0aGlzLm1hc2tlci5hdHRyKCdpZCcpICsgJ1wiKScpXHJcbiAgfVxyXG4gIC8vIFVubWFzayBlbGVtZW50XHJcbiwgdW5tYXNrOiBmdW5jdGlvbigpIHtcclxuICAgIGRlbGV0ZSB0aGlzLm1hc2tlclxyXG4gICAgcmV0dXJuIHRoaXMuYXR0cignbWFzaycsIG51bGwpXHJcbiAgfVxyXG5cclxufSlcclxuXG5TVkcuQ2xpcFBhdGggPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIFNWRy5jcmVhdGUoJ2NsaXBQYXRoJykpXHJcblxyXG4gICAgLy8ga2VlcCByZWZlcmVuY2VzIHRvIGNsaXBwZWQgZWxlbWVudHNcclxuICAgIHRoaXMudGFyZ2V0cyA9IFtdXHJcbiAgfVxyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuQ29udGFpbmVyXHJcblxyXG4gIC8vIEFkZCBjbGFzcyBtZXRob2RzXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICAvLyBVbmNsaXAgYWxsIGNsaXBwZWQgZWxlbWVudHMgYW5kIHJlbW92ZSBpdHNlbGZcclxuICAgIHJlbW92ZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIHVuY2xpcCBhbGwgdGFyZ2V0c1xyXG4gICAgICBmb3IgKHZhciBpID0gdGhpcy50YXJnZXRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKVxyXG4gICAgICAgIGlmICh0aGlzLnRhcmdldHNbaV0pXHJcbiAgICAgICAgICB0aGlzLnRhcmdldHNbaV0udW5jbGlwKClcclxuICAgICAgdGhpcy50YXJnZXRzID0gW11cclxuXHJcbiAgICAgIC8vIHJlbW92ZSBjbGlwUGF0aCBmcm9tIHBhcmVudFxyXG4gICAgICB0aGlzLnBhcmVudCgpLnJlbW92ZUVsZW1lbnQodGhpcylcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIGNsaXBwaW5nIGVsZW1lbnRcclxuICAgIGNsaXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5kZWZzKCkucHV0KG5ldyBTVkcuQ2xpcFBhdGgpXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cclxuLy9cclxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG4gIC8vIERpc3RyaWJ1dGUgY2xpcFBhdGggdG8gc3ZnIGVsZW1lbnRcclxuICBjbGlwV2l0aDogZnVuY3Rpb24oZWxlbWVudCkge1xyXG4gICAgLy8gdXNlIGdpdmVuIGNsaXAgb3IgY3JlYXRlIGEgbmV3IG9uZVxyXG4gICAgdGhpcy5jbGlwcGVyID0gZWxlbWVudCBpbnN0YW5jZW9mIFNWRy5DbGlwUGF0aCA/IGVsZW1lbnQgOiB0aGlzLnBhcmVudCgpLmNsaXAoKS5hZGQoZWxlbWVudClcclxuXHJcbiAgICAvLyBzdG9yZSByZXZlcmVuY2Ugb24gc2VsZiBpbiBtYXNrXHJcbiAgICB0aGlzLmNsaXBwZXIudGFyZ2V0cy5wdXNoKHRoaXMpXHJcblxyXG4gICAgLy8gYXBwbHkgbWFza1xyXG4gICAgcmV0dXJuIHRoaXMuYXR0cignY2xpcC1wYXRoJywgJ3VybChcIiMnICsgdGhpcy5jbGlwcGVyLmF0dHIoJ2lkJykgKyAnXCIpJylcclxuICB9XHJcbiAgLy8gVW5jbGlwIGVsZW1lbnRcclxuLCB1bmNsaXA6IGZ1bmN0aW9uKCkge1xyXG4gICAgZGVsZXRlIHRoaXMuY2xpcHBlclxyXG4gICAgcmV0dXJuIHRoaXMuYXR0cignY2xpcC1wYXRoJywgbnVsbClcclxuICB9XHJcblxyXG59KVxuU1ZHLkdyYWRpZW50ID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICB0aGlzLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgU1ZHLmNyZWF0ZSh0eXBlICsgJ0dyYWRpZW50JykpXHJcblxyXG4gICAgLy8gc3RvcmUgdHlwZVxyXG4gICAgdGhpcy50eXBlID0gdHlwZVxyXG4gIH1cclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkNvbnRhaW5lclxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gQWRkIGEgY29sb3Igc3RvcFxyXG4gICAgYXQ6IGZ1bmN0aW9uKG9mZnNldCwgY29sb3IsIG9wYWNpdHkpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuU3RvcCkudXBkYXRlKG9mZnNldCwgY29sb3IsIG9wYWNpdHkpXHJcbiAgICB9XHJcbiAgICAvLyBVcGRhdGUgZ3JhZGllbnRcclxuICAsIHVwZGF0ZTogZnVuY3Rpb24oYmxvY2spIHtcclxuICAgICAgLy8gcmVtb3ZlIGFsbCBzdG9wc1xyXG4gICAgICB0aGlzLmNsZWFyKClcclxuXHJcbiAgICAgIC8vIGludm9rZSBwYXNzZWQgYmxvY2tcclxuICAgICAgaWYgKHR5cGVvZiBibG9jayA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgIGJsb2NrLmNhbGwodGhpcywgdGhpcylcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm4gdGhlIGZpbGwgaWRcclxuICAsIGZpbGw6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gJ3VybCgjJyArIHRoaXMuaWQoKSArICcpJ1xyXG4gICAgfVxyXG4gICAgLy8gQWxpYXMgc3RyaW5nIGNvbnZlcnRpb24gdG8gZmlsbFxyXG4gICwgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5maWxsKClcclxuICAgIH1cclxuICAgIC8vIGN1c3RvbSBhdHRyIHRvIGhhbmRsZSB0cmFuc2Zvcm1cclxuICAsIGF0dHI6IGZ1bmN0aW9uKGEsIGIsIGMpIHtcclxuICAgICAgaWYoYSA9PSAndHJhbnNmb3JtJykgYSA9ICdncmFkaWVudFRyYW5zZm9ybSdcclxuICAgICAgcmV0dXJuIFNWRy5Db250YWluZXIucHJvdG90eXBlLmF0dHIuY2FsbCh0aGlzLCBhLCBiLCBjKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIENyZWF0ZSBncmFkaWVudCBlbGVtZW50IGluIGRlZnNcclxuICAgIGdyYWRpZW50OiBmdW5jdGlvbih0eXBlLCBibG9jaykge1xyXG4gICAgICByZXR1cm4gdGhpcy5kZWZzKCkuZ3JhZGllbnQodHlwZSwgYmxvY2spXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cclxuLy8gQWRkIGFuaW1hdGFibGUgbWV0aG9kcyB0byBib3RoIGdyYWRpZW50IGFuZCBmeCBtb2R1bGVcclxuU1ZHLmV4dGVuZChTVkcuR3JhZGllbnQsIFNWRy5GWCwge1xyXG4gIC8vIEZyb20gcG9zaXRpb25cclxuICBmcm9tOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICByZXR1cm4gKHRoaXMuX3RhcmdldCB8fCB0aGlzKS50eXBlID09ICdyYWRpYWwnID9cclxuICAgICAgdGhpcy5hdHRyKHsgZng6IG5ldyBTVkcuTnVtYmVyKHgpLCBmeTogbmV3IFNWRy5OdW1iZXIoeSkgfSkgOlxyXG4gICAgICB0aGlzLmF0dHIoeyB4MTogbmV3IFNWRy5OdW1iZXIoeCksIHkxOiBuZXcgU1ZHLk51bWJlcih5KSB9KVxyXG4gIH1cclxuICAvLyBUbyBwb3NpdGlvblxyXG4sIHRvOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICByZXR1cm4gKHRoaXMuX3RhcmdldCB8fCB0aGlzKS50eXBlID09ICdyYWRpYWwnID9cclxuICAgICAgdGhpcy5hdHRyKHsgY3g6IG5ldyBTVkcuTnVtYmVyKHgpLCBjeTogbmV3IFNWRy5OdW1iZXIoeSkgfSkgOlxyXG4gICAgICB0aGlzLmF0dHIoeyB4MjogbmV3IFNWRy5OdW1iZXIoeCksIHkyOiBuZXcgU1ZHLk51bWJlcih5KSB9KVxyXG4gIH1cclxufSlcclxuXHJcbi8vIEJhc2UgZ3JhZGllbnQgZ2VuZXJhdGlvblxyXG5TVkcuZXh0ZW5kKFNWRy5EZWZzLCB7XHJcbiAgLy8gZGVmaW5lIGdyYWRpZW50XHJcbiAgZ3JhZGllbnQ6IGZ1bmN0aW9uKHR5cGUsIGJsb2NrKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wdXQobmV3IFNWRy5HcmFkaWVudCh0eXBlKSkudXBkYXRlKGJsb2NrKVxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG5TVkcuU3RvcCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ3N0b3AnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5FbGVtZW50XHJcblxyXG4gIC8vIEFkZCBjbGFzcyBtZXRob2RzXHJcbiwgZXh0ZW5kOiB7XHJcbiAgICAvLyBhZGQgY29sb3Igc3RvcHNcclxuICAgIHVwZGF0ZTogZnVuY3Rpb24obykge1xyXG4gICAgICBpZiAodHlwZW9mIG8gPT0gJ251bWJlcicgfHwgbyBpbnN0YW5jZW9mIFNWRy5OdW1iZXIpIHtcclxuICAgICAgICBvID0ge1xyXG4gICAgICAgICAgb2Zmc2V0OiAgYXJndW1lbnRzWzBdXHJcbiAgICAgICAgLCBjb2xvcjogICBhcmd1bWVudHNbMV1cclxuICAgICAgICAsIG9wYWNpdHk6IGFyZ3VtZW50c1syXVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gc2V0IGF0dHJpYnV0ZXNcclxuICAgICAgaWYgKG8ub3BhY2l0eSAhPSBudWxsKSB0aGlzLmF0dHIoJ3N0b3Atb3BhY2l0eScsIG8ub3BhY2l0eSlcclxuICAgICAgaWYgKG8uY29sb3IgICAhPSBudWxsKSB0aGlzLmF0dHIoJ3N0b3AtY29sb3InLCBvLmNvbG9yKVxyXG4gICAgICBpZiAoby5vZmZzZXQgICE9IG51bGwpIHRoaXMuYXR0cignb2Zmc2V0JywgbmV3IFNWRy5OdW1iZXIoby5vZmZzZXQpKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICB9XHJcblxyXG59KVxyXG5cblNWRy5QYXR0ZXJuID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAncGF0dGVybidcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkNvbnRhaW5lclxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gUmV0dXJuIHRoZSBmaWxsIGlkXHJcbiAgICBmaWxsOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuICd1cmwoIycgKyB0aGlzLmlkKCkgKyAnKSdcclxuICAgIH1cclxuICAgIC8vIFVwZGF0ZSBwYXR0ZXJuIGJ5IHJlYnVpbGRpbmdcclxuICAsIHVwZGF0ZTogZnVuY3Rpb24oYmxvY2spIHtcclxuICAgICAgLy8gcmVtb3ZlIGNvbnRlbnRcclxuICAgICAgdGhpcy5jbGVhcigpXHJcblxyXG4gICAgICAvLyBpbnZva2UgcGFzc2VkIGJsb2NrXHJcbiAgICAgIGlmICh0eXBlb2YgYmxvY2sgPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICBibG9jay5jYWxsKHRoaXMsIHRoaXMpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gQWxpYXMgc3RyaW5nIGNvbnZlcnRpb24gdG8gZmlsbFxyXG4gICwgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5maWxsKClcclxuICAgIH1cclxuICAgIC8vIGN1c3RvbSBhdHRyIHRvIGhhbmRsZSB0cmFuc2Zvcm1cclxuICAsIGF0dHI6IGZ1bmN0aW9uKGEsIGIsIGMpIHtcclxuICAgICAgaWYoYSA9PSAndHJhbnNmb3JtJykgYSA9ICdwYXR0ZXJuVHJhbnNmb3JtJ1xyXG4gICAgICByZXR1cm4gU1ZHLkNvbnRhaW5lci5wcm90b3R5cGUuYXR0ci5jYWxsKHRoaXMsIGEsIGIsIGMpXHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIENyZWF0ZSBwYXR0ZXJuIGVsZW1lbnQgaW4gZGVmc1xyXG4gICAgcGF0dGVybjogZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgYmxvY2spIHtcclxuICAgICAgcmV0dXJuIHRoaXMuZGVmcygpLnBhdHRlcm4od2lkdGgsIGhlaWdodCwgYmxvY2spXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuRGVmcywge1xyXG4gIC8vIERlZmluZSBncmFkaWVudFxyXG4gIHBhdHRlcm46IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIGJsb2NrKSB7XHJcbiAgICByZXR1cm4gdGhpcy5wdXQobmV3IFNWRy5QYXR0ZXJuKS51cGRhdGUoYmxvY2spLmF0dHIoe1xyXG4gICAgICB4OiAgICAgICAgICAgIDBcclxuICAgICwgeTogICAgICAgICAgICAwXHJcbiAgICAsIHdpZHRoOiAgICAgICAgd2lkdGhcclxuICAgICwgaGVpZ2h0OiAgICAgICBoZWlnaHRcclxuICAgICwgcGF0dGVyblVuaXRzOiAndXNlclNwYWNlT25Vc2UnXHJcbiAgICB9KVxyXG4gIH1cclxuXHJcbn0pXG5TVkcuRG9jID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICBpZiAoZWxlbWVudCkge1xyXG4gICAgICAvLyBlbnN1cmUgdGhlIHByZXNlbmNlIG9mIGEgZG9tIGVsZW1lbnRcclxuICAgICAgZWxlbWVudCA9IHR5cGVvZiBlbGVtZW50ID09ICdzdHJpbmcnID9cclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbGVtZW50KSA6XHJcbiAgICAgICAgZWxlbWVudFxyXG5cclxuICAgICAgLy8gSWYgdGhlIHRhcmdldCBpcyBhbiBzdmcgZWxlbWVudCwgdXNlIHRoYXQgZWxlbWVudCBhcyB0aGUgbWFpbiB3cmFwcGVyLlxyXG4gICAgICAvLyBUaGlzIGFsbG93cyBzdmcuanMgdG8gd29yayB3aXRoIHN2ZyBkb2N1bWVudHMgYXMgd2VsbC5cclxuICAgICAgaWYgKGVsZW1lbnQubm9kZU5hbWUgPT0gJ3N2ZycpIHtcclxuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgZWxlbWVudClcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgU1ZHLmNyZWF0ZSgnc3ZnJykpXHJcbiAgICAgICAgZWxlbWVudC5hcHBlbmRDaGlsZCh0aGlzLm5vZGUpXHJcbiAgICAgICAgdGhpcy5zaXplKCcxMDAlJywgJzEwMCUnKVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzZXQgc3ZnIGVsZW1lbnQgYXR0cmlidXRlcyBhbmQgZW5zdXJlIGRlZnMgbm9kZVxyXG4gICAgICB0aGlzLm5hbWVzcGFjZSgpLmRlZnMoKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkNvbnRhaW5lclxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gQWRkIG5hbWVzcGFjZXNcclxuICAgIG5hbWVzcGFjZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICAgICAgLmF0dHIoeyB4bWxuczogU1ZHLm5zLCB2ZXJzaW9uOiAnMS4xJyB9KVxyXG4gICAgICAgIC5hdHRyKCd4bWxuczp4bGluaycsIFNWRy54bGluaywgU1ZHLnhtbG5zKVxyXG4gICAgICAgIC5hdHRyKCd4bWxuczpzdmdqcycsIFNWRy5zdmdqcywgU1ZHLnhtbG5zKVxyXG4gICAgfVxyXG4gICAgLy8gQ3JlYXRlcyBhbmQgcmV0dXJucyBkZWZzIGVsZW1lbnRcclxuICAsIGRlZnM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZiAoIXRoaXMuX2RlZnMpIHtcclxuICAgICAgICB2YXIgZGVmc1xyXG5cclxuICAgICAgICAvLyBGaW5kIG9yIGNyZWF0ZSBhIGRlZnMgZWxlbWVudCBpbiB0aGlzIGluc3RhbmNlXHJcbiAgICAgICAgaWYgKGRlZnMgPSB0aGlzLm5vZGUuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2RlZnMnKVswXSlcclxuICAgICAgICAgIHRoaXMuX2RlZnMgPSBTVkcuYWRvcHQoZGVmcylcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICB0aGlzLl9kZWZzID0gbmV3IFNWRy5EZWZzXHJcblxyXG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgZGVmcyBub2RlIGlzIGF0IHRoZSBlbmQgb2YgdGhlIHN0YWNrXHJcbiAgICAgICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKHRoaXMuX2RlZnMubm9kZSlcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuX2RlZnNcclxuICAgIH1cclxuICAgIC8vIGN1c3RvbSBwYXJlbnQgbWV0aG9kXHJcbiAgLCBwYXJlbnQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5ub2RlLnBhcmVudE5vZGUubm9kZU5hbWUgPT0gJyNkb2N1bWVudCcgPyBudWxsIDogdGhpcy5ub2RlLnBhcmVudE5vZGVcclxuICAgIH1cclxuICAgIC8vIEZpeCBmb3IgcG9zc2libGUgc3ViLXBpeGVsIG9mZnNldC4gU2VlOlxyXG4gICAgLy8gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NjA4ODEyXHJcbiAgLCBzcG9mOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIHBvcyA9IHRoaXMubm9kZS5nZXRTY3JlZW5DVE0oKVxyXG5cclxuICAgICAgaWYgKHBvcylcclxuICAgICAgICB0aGlzXHJcbiAgICAgICAgICAuc3R5bGUoJ2xlZnQnLCAoLXBvcy5lICUgMSkgKyAncHgnKVxyXG4gICAgICAgICAgLnN0eWxlKCd0b3AnLCAgKC1wb3MuZiAlIDEpICsgJ3B4JylcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcblxyXG4gICAgICAvLyBSZW1vdmVzIHRoZSBkb2MgZnJvbSB0aGUgRE9NXHJcbiAgLCByZW1vdmU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICBpZih0aGlzLnBhcmVudCgpKSB7XHJcbiAgICAgICAgdGhpcy5wYXJlbnQoKS5yZW1vdmVDaGlsZCh0aGlzLm5vZGUpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgLCBjbGVhcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIHJlbW92ZSBjaGlsZHJlblxyXG4gICAgICB3aGlsZSh0aGlzLm5vZGUuaGFzQ2hpbGROb2RlcygpKVxyXG4gICAgICAgIHRoaXMubm9kZS5yZW1vdmVDaGlsZCh0aGlzLm5vZGUubGFzdENoaWxkKVxyXG5cclxuICAgICAgLy8gcmVtb3ZlIGRlZnMgcmVmZXJlbmNlXHJcbiAgICAgIGRlbGV0ZSB0aGlzLl9kZWZzXHJcblxyXG4gICAgICAvLyBhZGQgYmFjayBwYXJzZXJcclxuICAgICAgaWYoIVNWRy5wYXJzZXIuZHJhdy5wYXJlbnROb2RlKVxyXG4gICAgICAgIHRoaXMubm9kZS5hcHBlbmRDaGlsZChTVkcucGFyc2VyLmRyYXcpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbn0pXHJcblxuU1ZHLlNoYXBlID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICB0aGlzLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgZWxlbWVudClcclxuICB9XHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5FbGVtZW50XHJcblxyXG59KVxuXHJcblNWRy5CYXJlID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oZWxlbWVudCwgaW5oZXJpdCkge1xyXG4gICAgLy8gY29uc3RydWN0IGVsZW1lbnRcclxuICAgIHRoaXMuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBTVkcuY3JlYXRlKGVsZW1lbnQpKVxyXG5cclxuICAgIC8vIGluaGVyaXQgY3VzdG9tIG1ldGhvZHNcclxuICAgIGlmIChpbmhlcml0KVxyXG4gICAgICBmb3IgKHZhciBtZXRob2QgaW4gaW5oZXJpdC5wcm90b3R5cGUpXHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbmhlcml0LnByb3RvdHlwZVttZXRob2RdID09PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgICAgdGhpc1ttZXRob2RdID0gaW5oZXJpdC5wcm90b3R5cGVbbWV0aG9kXVxyXG4gIH1cclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkVsZW1lbnRcclxuXHJcbiAgLy8gQWRkIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIEluc2VydCBzb21lIHBsYWluIHRleHRcclxuICAgIHdvcmRzOiBmdW5jdGlvbih0ZXh0KSB7XHJcbiAgICAgIC8vIHJlbW92ZSBjb250ZW50c1xyXG4gICAgICB3aGlsZSAodGhpcy5ub2RlLmhhc0NoaWxkTm9kZXMoKSlcclxuICAgICAgICB0aGlzLm5vZGUucmVtb3ZlQ2hpbGQodGhpcy5ub2RlLmxhc3RDaGlsZClcclxuXHJcbiAgICAgIC8vIGNyZWF0ZSB0ZXh0IG5vZGVcclxuICAgICAgdGhpcy5ub2RlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxyXG5cclxuU1ZHLmV4dGVuZChTVkcuUGFyZW50LCB7XHJcbiAgLy8gQ3JlYXRlIGFuIGVsZW1lbnQgdGhhdCBpcyBub3QgZGVzY3JpYmVkIGJ5IFNWRy5qc1xyXG4gIGVsZW1lbnQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGluaGVyaXQpIHtcclxuICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLkJhcmUoZWxlbWVudCwgaW5oZXJpdCkpXHJcbiAgfVxyXG59KVxyXG5cblNWRy5TeW1ib2wgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6ICdzeW1ib2wnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5Db250YWluZXJcclxuXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBjcmVhdGUgc3ltYm9sXHJcbiAgICBzeW1ib2w6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5wdXQobmV3IFNWRy5TeW1ib2wpXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cblNWRy5Vc2UgPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6ICd1c2UnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5TaGFwZVxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gVXNlIGVsZW1lbnQgYXMgYSByZWZlcmVuY2VcclxuICAgIGVsZW1lbnQ6IGZ1bmN0aW9uKGVsZW1lbnQsIGZpbGUpIHtcclxuICAgICAgLy8gU2V0IGxpbmVkIGVsZW1lbnRcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cignaHJlZicsIChmaWxlIHx8ICcnKSArICcjJyArIGVsZW1lbnQsIFNWRy54bGluaylcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgYSB1c2UgZWxlbWVudFxyXG4gICAgdXNlOiBmdW5jdGlvbihlbGVtZW50LCBmaWxlKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLlVzZSkuZWxlbWVudChlbGVtZW50LCBmaWxlKVxyXG4gICAgfVxyXG4gIH1cclxufSlcblNWRy5SZWN0ID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAncmVjdCdcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLlNoYXBlXHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgYSByZWN0IGVsZW1lbnRcclxuICAgIHJlY3Q6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuUmVjdCgpKS5zaXplKHdpZHRoLCBoZWlnaHQpXHJcbiAgICB9XHJcbiAgfVxyXG59KVxuU1ZHLkNpcmNsZSA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ2NpcmNsZSdcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLlNoYXBlXHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgY2lyY2xlIGVsZW1lbnQsIGJhc2VkIG9uIGVsbGlwc2VcclxuICAgIGNpcmNsZTogZnVuY3Rpb24oc2l6ZSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5wdXQobmV3IFNWRy5DaXJjbGUpLnJ4KG5ldyBTVkcuTnVtYmVyKHNpemUpLmRpdmlkZSgyKSkubW92ZSgwLCAwKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXHJcblNWRy5leHRlbmQoU1ZHLkNpcmNsZSwgU1ZHLkZYLCB7XHJcbiAgLy8gUmFkaXVzIHggdmFsdWVcclxuICByeDogZnVuY3Rpb24ocngpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ3InLCByeClcclxuICB9XHJcbiAgLy8gQWxpYXMgcmFkaXVzIHggdmFsdWVcclxuLCByeTogZnVuY3Rpb24ocnkpIHtcclxuICAgIHJldHVybiB0aGlzLnJ4KHJ5KVxyXG4gIH1cclxufSlcclxuXHJcblNWRy5FbGxpcHNlID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAnZWxsaXBzZSdcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLlNoYXBlXHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgYW4gZWxsaXBzZVxyXG4gICAgZWxsaXBzZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5wdXQobmV3IFNWRy5FbGxpcHNlKS5zaXplKHdpZHRoLCBoZWlnaHQpLm1vdmUoMCwgMClcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5FbGxpcHNlLCBTVkcuUmVjdCwgU1ZHLkZYLCB7XHJcbiAgLy8gUmFkaXVzIHggdmFsdWVcclxuICByeDogZnVuY3Rpb24ocngpIHtcclxuICAgIHJldHVybiB0aGlzLmF0dHIoJ3J4JywgcngpXHJcbiAgfVxyXG4gIC8vIFJhZGl1cyB5IHZhbHVlXHJcbiwgcnk6IGZ1bmN0aW9uKHJ5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCdyeScsIHJ5KVxyXG4gIH1cclxufSlcclxuXHJcbi8vIEFkZCBjb21tb24gbWV0aG9kXHJcblNWRy5leHRlbmQoU1ZHLkNpcmNsZSwgU1ZHLkVsbGlwc2UsIHtcclxuICAgIC8vIE1vdmUgb3ZlciB4LWF4aXNcclxuICAgIHg6IGZ1bmN0aW9uKHgpIHtcclxuICAgICAgcmV0dXJuIHggPT0gbnVsbCA/IHRoaXMuY3goKSAtIHRoaXMucngoKSA6IHRoaXMuY3goeCArIHRoaXMucngoKSlcclxuICAgIH1cclxuICAgIC8vIE1vdmUgb3ZlciB5LWF4aXNcclxuICAsIHk6IGZ1bmN0aW9uKHkpIHtcclxuICAgICAgcmV0dXJuIHkgPT0gbnVsbCA/IHRoaXMuY3koKSAtIHRoaXMucnkoKSA6IHRoaXMuY3koeSArIHRoaXMucnkoKSlcclxuICAgIH1cclxuICAgIC8vIE1vdmUgYnkgY2VudGVyIG92ZXIgeC1heGlzXHJcbiAgLCBjeDogZnVuY3Rpb24oeCkge1xyXG4gICAgICByZXR1cm4geCA9PSBudWxsID8gdGhpcy5hdHRyKCdjeCcpIDogdGhpcy5hdHRyKCdjeCcsIHgpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGJ5IGNlbnRlciBvdmVyIHktYXhpc1xyXG4gICwgY3k6IGZ1bmN0aW9uKHkpIHtcclxuICAgICAgcmV0dXJuIHkgPT0gbnVsbCA/IHRoaXMuYXR0cignY3knKSA6IHRoaXMuYXR0cignY3knLCB5KVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IHdpZHRoIG9mIGVsZW1lbnRcclxuICAsIHdpZHRoOiBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgICByZXR1cm4gd2lkdGggPT0gbnVsbCA/IHRoaXMucngoKSAqIDIgOiB0aGlzLnJ4KG5ldyBTVkcuTnVtYmVyKHdpZHRoKS5kaXZpZGUoMikpXHJcbiAgICB9XHJcbiAgICAvLyBTZXQgaGVpZ2h0IG9mIGVsZW1lbnRcclxuICAsIGhlaWdodDogZnVuY3Rpb24oaGVpZ2h0KSB7XHJcbiAgICAgIHJldHVybiBoZWlnaHQgPT0gbnVsbCA/IHRoaXMucnkoKSAqIDIgOiB0aGlzLnJ5KG5ldyBTVkcuTnVtYmVyKGhlaWdodCkuZGl2aWRlKDIpKVxyXG4gICAgfVxyXG4gICAgLy8gQ3VzdG9tIHNpemUgZnVuY3Rpb25cclxuICAsIHNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgdmFyIHAgPSBwcm9wb3J0aW9uYWxTaXplKHRoaXMsIHdpZHRoLCBoZWlnaHQpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgICAgIC5yeChuZXcgU1ZHLk51bWJlcihwLndpZHRoKS5kaXZpZGUoMikpXHJcbiAgICAgICAgLnJ5KG5ldyBTVkcuTnVtYmVyKHAuaGVpZ2h0KS5kaXZpZGUoMikpXHJcbiAgICB9XHJcbn0pXG5TVkcuTGluZSA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ2xpbmUnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5TaGFwZVxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gR2V0IGFycmF5XHJcbiAgICBhcnJheTogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBuZXcgU1ZHLlBvaW50QXJyYXkoW1xyXG4gICAgICAgIFsgdGhpcy5hdHRyKCd4MScpLCB0aGlzLmF0dHIoJ3kxJykgXVxyXG4gICAgICAsIFsgdGhpcy5hdHRyKCd4MicpLCB0aGlzLmF0dHIoJ3kyJykgXVxyXG4gICAgICBdKVxyXG4gICAgfVxyXG4gICAgLy8gT3ZlcndyaXRlIG5hdGl2ZSBwbG90KCkgbWV0aG9kXHJcbiAgLCBwbG90OiBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Mikge1xyXG4gICAgICBpZiAoeDEgPT0gbnVsbClcclxuICAgICAgICByZXR1cm4gdGhpcy5hcnJheSgpXHJcbiAgICAgIGVsc2UgaWYgKHR5cGVvZiB5MSAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgeDEgPSB7IHgxOiB4MSwgeTE6IHkxLCB4MjogeDIsIHkyOiB5MiB9XHJcbiAgICAgIGVsc2VcclxuICAgICAgICB4MSA9IG5ldyBTVkcuUG9pbnRBcnJheSh4MSkudG9MaW5lKClcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoeDEpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGJ5IGxlZnQgdG9wIGNvcm5lclxyXG4gICwgbW92ZTogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKHRoaXMuYXJyYXkoKS5tb3ZlKHgsIHkpLnRvTGluZSgpKVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IGVsZW1lbnQgc2l6ZSB0byBnaXZlbiB3aWR0aCBhbmQgaGVpZ2h0XHJcbiAgLCBzaXplOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICAgIHZhciBwID0gcHJvcG9ydGlvbmFsU2l6ZSh0aGlzLCB3aWR0aCwgaGVpZ2h0KVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cih0aGlzLmFycmF5KCkuc2l6ZShwLndpZHRoLCBwLmhlaWdodCkudG9MaW5lKCkpXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBBZGQgcGFyZW50IG1ldGhvZFxyXG4sIGNvbnN0cnVjdDoge1xyXG4gICAgLy8gQ3JlYXRlIGEgbGluZSBlbGVtZW50XHJcbiAgICBsaW5lOiBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Mikge1xyXG4gICAgICAvLyBtYWtlIHN1cmUgcGxvdCBpcyBjYWxsZWQgYXMgYSBzZXR0ZXJcclxuICAgICAgLy8geDEgaXMgbm90IG5lY2Vzc2FyaWx5IGEgbnVtYmVyLCBpdCBjYW4gYWxzbyBiZSBhbiBhcnJheSwgYSBzdHJpbmcgYW5kIGEgU1ZHLlBvaW50QXJyYXlcclxuICAgICAgcmV0dXJuIFNWRy5MaW5lLnByb3RvdHlwZS5wbG90LmFwcGx5KFxyXG4gICAgICAgIHRoaXMucHV0KG5ldyBTVkcuTGluZSlcclxuICAgICAgLCB4MSAhPSBudWxsID8gW3gxLCB5MSwgeDIsIHkyXSA6IFswLCAwLCAwLCAwXVxyXG4gICAgICApXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cblNWRy5Qb2x5bGluZSA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ3BvbHlsaW5lJ1xyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuU2hhcGVcclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIENyZWF0ZSBhIHdyYXBwZWQgcG9seWxpbmUgZWxlbWVudFxyXG4gICAgcG9seWxpbmU6IGZ1bmN0aW9uKHApIHtcclxuICAgICAgLy8gbWFrZSBzdXJlIHBsb3QgaXMgY2FsbGVkIGFzIGEgc2V0dGVyXHJcbiAgICAgIHJldHVybiB0aGlzLnB1dChuZXcgU1ZHLlBvbHlsaW5lKS5wbG90KHAgfHwgbmV3IFNWRy5Qb2ludEFycmF5KVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXHJcblNWRy5Qb2x5Z29uID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAncG9seWdvbidcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLlNoYXBlXHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgYSB3cmFwcGVkIHBvbHlnb24gZWxlbWVudFxyXG4gICAgcG9seWdvbjogZnVuY3Rpb24ocCkge1xyXG4gICAgICAvLyBtYWtlIHN1cmUgcGxvdCBpcyBjYWxsZWQgYXMgYSBzZXR0ZXJcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuUG9seWdvbikucGxvdChwIHx8IG5ldyBTVkcuUG9pbnRBcnJheSlcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxyXG4vLyBBZGQgcG9seWdvbi1zcGVjaWZpYyBmdW5jdGlvbnNcclxuU1ZHLmV4dGVuZChTVkcuUG9seWxpbmUsIFNWRy5Qb2x5Z29uLCB7XHJcbiAgLy8gR2V0IGFycmF5XHJcbiAgYXJyYXk6IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2FycmF5IHx8ICh0aGlzLl9hcnJheSA9IG5ldyBTVkcuUG9pbnRBcnJheSh0aGlzLmF0dHIoJ3BvaW50cycpKSlcclxuICB9XHJcbiAgLy8gUGxvdCBuZXcgcGF0aFxyXG4sIHBsb3Q6IGZ1bmN0aW9uKHApIHtcclxuICAgIHJldHVybiAocCA9PSBudWxsKSA/XHJcbiAgICAgIHRoaXMuYXJyYXkoKSA6XHJcbiAgICAgIHRoaXMuY2xlYXIoKS5hdHRyKCdwb2ludHMnLCB0eXBlb2YgcCA9PSAnc3RyaW5nJyA/IHAgOiAodGhpcy5fYXJyYXkgPSBuZXcgU1ZHLlBvaW50QXJyYXkocCkpKVxyXG4gIH1cclxuICAvLyBDbGVhciBhcnJheSBjYWNoZVxyXG4sIGNsZWFyOiBmdW5jdGlvbigpIHtcclxuICAgIGRlbGV0ZSB0aGlzLl9hcnJheVxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gTW92ZSBieSBsZWZ0IHRvcCBjb3JuZXJcclxuLCBtb3ZlOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCdwb2ludHMnLCB0aGlzLmFycmF5KCkubW92ZSh4LCB5KSlcclxuICB9XHJcbiAgLy8gU2V0IGVsZW1lbnQgc2l6ZSB0byBnaXZlbiB3aWR0aCBhbmQgaGVpZ2h0XHJcbiwgc2l6ZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xyXG4gICAgdmFyIHAgPSBwcm9wb3J0aW9uYWxTaXplKHRoaXMsIHdpZHRoLCBoZWlnaHQpXHJcblxyXG4gICAgcmV0dXJuIHRoaXMuYXR0cigncG9pbnRzJywgdGhpcy5hcnJheSgpLnNpemUocC53aWR0aCwgcC5oZWlnaHQpKVxyXG4gIH1cclxuXHJcbn0pXHJcblxuLy8gdW5pZnkgYWxsIHBvaW50IHRvIHBvaW50IGVsZW1lbnRzXHJcblNWRy5leHRlbmQoU1ZHLkxpbmUsIFNWRy5Qb2x5bGluZSwgU1ZHLlBvbHlnb24sIHtcclxuICAvLyBEZWZpbmUgbW9ycGhhYmxlIGFycmF5XHJcbiAgbW9ycGhBcnJheTogIFNWRy5Qb2ludEFycmF5XHJcbiAgLy8gTW92ZSBieSBsZWZ0IHRvcCBjb3JuZXIgb3ZlciB4LWF4aXNcclxuLCB4OiBmdW5jdGlvbih4KSB7XHJcbiAgICByZXR1cm4geCA9PSBudWxsID8gdGhpcy5iYm94KCkueCA6IHRoaXMubW92ZSh4LCB0aGlzLmJib3goKS55KVxyXG4gIH1cclxuICAvLyBNb3ZlIGJ5IGxlZnQgdG9wIGNvcm5lciBvdmVyIHktYXhpc1xyXG4sIHk6IGZ1bmN0aW9uKHkpIHtcclxuICAgIHJldHVybiB5ID09IG51bGwgPyB0aGlzLmJib3goKS55IDogdGhpcy5tb3ZlKHRoaXMuYmJveCgpLngsIHkpXHJcbiAgfVxyXG4gIC8vIFNldCB3aWR0aCBvZiBlbGVtZW50XHJcbiwgd2lkdGg6IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICB2YXIgYiA9IHRoaXMuYmJveCgpXHJcblxyXG4gICAgcmV0dXJuIHdpZHRoID09IG51bGwgPyBiLndpZHRoIDogdGhpcy5zaXplKHdpZHRoLCBiLmhlaWdodClcclxuICB9XHJcbiAgLy8gU2V0IGhlaWdodCBvZiBlbGVtZW50XHJcbiwgaGVpZ2h0OiBmdW5jdGlvbihoZWlnaHQpIHtcclxuICAgIHZhciBiID0gdGhpcy5iYm94KClcclxuXHJcbiAgICByZXR1cm4gaGVpZ2h0ID09IG51bGwgPyBiLmhlaWdodCA6IHRoaXMuc2l6ZShiLndpZHRoLCBoZWlnaHQpXHJcbiAgfVxyXG59KVxuU1ZHLlBhdGggPSBTVkcuaW52ZW50KHtcclxuICAvLyBJbml0aWFsaXplIG5vZGVcclxuICBjcmVhdGU6ICdwYXRoJ1xyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuU2hhcGVcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIERlZmluZSBtb3JwaGFibGUgYXJyYXlcclxuICAgIG1vcnBoQXJyYXk6ICBTVkcuUGF0aEFycmF5XHJcbiAgICAvLyBHZXQgYXJyYXlcclxuICAsIGFycmF5OiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuX2FycmF5IHx8ICh0aGlzLl9hcnJheSA9IG5ldyBTVkcuUGF0aEFycmF5KHRoaXMuYXR0cignZCcpKSlcclxuICAgIH1cclxuICAgIC8vIFBsb3QgbmV3IHBhdGhcclxuICAsIHBsb3Q6IGZ1bmN0aW9uKGQpIHtcclxuICAgICAgcmV0dXJuIChkID09IG51bGwpID9cclxuICAgICAgICB0aGlzLmFycmF5KCkgOlxyXG4gICAgICAgIHRoaXMuY2xlYXIoKS5hdHRyKCdkJywgdHlwZW9mIGQgPT0gJ3N0cmluZycgPyBkIDogKHRoaXMuX2FycmF5ID0gbmV3IFNWRy5QYXRoQXJyYXkoZCkpKVxyXG4gICAgfVxyXG4gICAgLy8gQ2xlYXIgYXJyYXkgY2FjaGVcclxuICAsIGNsZWFyOiBmdW5jdGlvbigpIHtcclxuICAgICAgZGVsZXRlIHRoaXMuX2FycmF5XHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGJ5IGxlZnQgdG9wIGNvcm5lclxyXG4gICwgbW92ZTogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdkJywgdGhpcy5hcnJheSgpLm1vdmUoeCwgeSkpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIGJ5IGxlZnQgdG9wIGNvcm5lciBvdmVyIHgtYXhpc1xyXG4gICwgeDogZnVuY3Rpb24oeCkge1xyXG4gICAgICByZXR1cm4geCA9PSBudWxsID8gdGhpcy5iYm94KCkueCA6IHRoaXMubW92ZSh4LCB0aGlzLmJib3goKS55KVxyXG4gICAgfVxyXG4gICAgLy8gTW92ZSBieSBsZWZ0IHRvcCBjb3JuZXIgb3ZlciB5LWF4aXNcclxuICAsIHk6IGZ1bmN0aW9uKHkpIHtcclxuICAgICAgcmV0dXJuIHkgPT0gbnVsbCA/IHRoaXMuYmJveCgpLnkgOiB0aGlzLm1vdmUodGhpcy5iYm94KCkueCwgeSlcclxuICAgIH1cclxuICAgIC8vIFNldCBlbGVtZW50IHNpemUgdG8gZ2l2ZW4gd2lkdGggYW5kIGhlaWdodFxyXG4gICwgc2l6ZTogZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xyXG4gICAgICB2YXIgcCA9IHByb3BvcnRpb25hbFNpemUodGhpcywgd2lkdGgsIGhlaWdodClcclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ2QnLCB0aGlzLmFycmF5KCkuc2l6ZShwLndpZHRoLCBwLmhlaWdodCkpXHJcbiAgICB9XHJcbiAgICAvLyBTZXQgd2lkdGggb2YgZWxlbWVudFxyXG4gICwgd2lkdGg6IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICAgIHJldHVybiB3aWR0aCA9PSBudWxsID8gdGhpcy5iYm94KCkud2lkdGggOiB0aGlzLnNpemUod2lkdGgsIHRoaXMuYmJveCgpLmhlaWdodClcclxuICAgIH1cclxuICAgIC8vIFNldCBoZWlnaHQgb2YgZWxlbWVudFxyXG4gICwgaGVpZ2h0OiBmdW5jdGlvbihoZWlnaHQpIHtcclxuICAgICAgcmV0dXJuIGhlaWdodCA9PSBudWxsID8gdGhpcy5iYm94KCkuaGVpZ2h0IDogdGhpcy5zaXplKHRoaXMuYmJveCgpLndpZHRoLCBoZWlnaHQpXHJcbiAgICB9XHJcblxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIENyZWF0ZSBhIHdyYXBwZWQgcGF0aCBlbGVtZW50XHJcbiAgICBwYXRoOiBmdW5jdGlvbihkKSB7XHJcbiAgICAgIC8vIG1ha2Ugc3VyZSBwbG90IGlzIGNhbGxlZCBhcyBhIHNldHRlclxyXG4gICAgICByZXR1cm4gdGhpcy5wdXQobmV3IFNWRy5QYXRoKS5wbG90KGQgfHwgbmV3IFNWRy5QYXRoQXJyYXkpXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cblNWRy5JbWFnZSA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ2ltYWdlJ1xyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuU2hhcGVcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIChyZSlsb2FkIGltYWdlXHJcbiAgICBsb2FkOiBmdW5jdGlvbih1cmwpIHtcclxuICAgICAgaWYgKCF1cmwpIHJldHVybiB0aGlzXHJcblxyXG4gICAgICB2YXIgc2VsZiA9IHRoaXNcclxuICAgICAgICAsIGltZyAgPSBuZXcgd2luZG93LkltYWdlKClcclxuXHJcbiAgICAgIC8vIHByZWxvYWQgaW1hZ2VcclxuICAgICAgU1ZHLm9uKGltZywgJ2xvYWQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgcCA9IHNlbGYucGFyZW50KFNWRy5QYXR0ZXJuKVxyXG5cclxuICAgICAgICBpZihwID09PSBudWxsKSByZXR1cm5cclxuXHJcbiAgICAgICAgLy8gZW5zdXJlIGltYWdlIHNpemVcclxuICAgICAgICBpZiAoc2VsZi53aWR0aCgpID09IDAgJiYgc2VsZi5oZWlnaHQoKSA9PSAwKVxyXG4gICAgICAgICAgc2VsZi5zaXplKGltZy53aWR0aCwgaW1nLmhlaWdodClcclxuXHJcbiAgICAgICAgLy8gZW5zdXJlIHBhdHRlcm4gc2l6ZSBpZiBub3Qgc2V0XHJcbiAgICAgICAgaWYgKHAgJiYgcC53aWR0aCgpID09IDAgJiYgcC5oZWlnaHQoKSA9PSAwKVxyXG4gICAgICAgICAgcC5zaXplKHNlbGYud2lkdGgoKSwgc2VsZi5oZWlnaHQoKSlcclxuXHJcbiAgICAgICAgLy8gY2FsbGJhY2tcclxuICAgICAgICBpZiAodHlwZW9mIHNlbGYuX2xvYWRlZCA9PT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgIHNlbGYuX2xvYWRlZC5jYWxsKHNlbGYsIHtcclxuICAgICAgICAgICAgd2lkdGg6ICBpbWcud2lkdGhcclxuICAgICAgICAgICwgaGVpZ2h0OiBpbWcuaGVpZ2h0XHJcbiAgICAgICAgICAsIHJhdGlvOiAgaW1nLndpZHRoIC8gaW1nLmhlaWdodFxyXG4gICAgICAgICAgLCB1cmw6ICAgIHVybFxyXG4gICAgICAgICAgfSlcclxuICAgICAgfSlcclxuXHJcbiAgICAgIFNWRy5vbihpbWcsICdlcnJvcicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZi5fZXJyb3IgPT09ICdmdW5jdGlvbicpe1xyXG4gICAgICAgICAgICBzZWxmLl9lcnJvci5jYWxsKHNlbGYsIGUpXHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cignaHJlZicsIChpbWcuc3JjID0gdGhpcy5zcmMgPSB1cmwpLCBTVkcueGxpbmspXHJcbiAgICB9XHJcbiAgICAvLyBBZGQgbG9hZGVkIGNhbGxiYWNrXHJcbiAgLCBsb2FkZWQ6IGZ1bmN0aW9uKGxvYWRlZCkge1xyXG4gICAgICB0aGlzLl9sb2FkZWQgPSBsb2FkZWRcclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuXHJcbiAgLCBlcnJvcjogZnVuY3Rpb24oZXJyb3IpIHtcclxuICAgICAgdGhpcy5fZXJyb3IgPSBlcnJvclxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIGNyZWF0ZSBpbWFnZSBlbGVtZW50LCBsb2FkIGltYWdlIGFuZCBzZXQgaXRzIHNpemVcclxuICAgIGltYWdlOiBmdW5jdGlvbihzb3VyY2UsIHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuSW1hZ2UpLmxvYWQoc291cmNlKS5zaXplKHdpZHRoIHx8IDAsIGhlaWdodCB8fCB3aWR0aCB8fCAwKVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbn0pXG5TVkcuVGV4dCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgU1ZHLmNyZWF0ZSgndGV4dCcpKVxyXG5cclxuICAgIHRoaXMuZG9tLmxlYWRpbmcgPSBuZXcgU1ZHLk51bWJlcigxLjMpICAgIC8vIHN0b3JlIGxlYWRpbmcgdmFsdWUgZm9yIHJlYnVpbGRpbmdcclxuICAgIHRoaXMuX3JlYnVpbGQgPSB0cnVlICAgICAgICAgICAgICAgICAgICAgIC8vIGVuYWJsZSBhdXRvbWF0aWMgdXBkYXRpbmcgb2YgZHkgdmFsdWVzXHJcbiAgICB0aGlzLl9idWlsZCAgID0gZmFsc2UgICAgICAgICAgICAgICAgICAgICAvLyBkaXNhYmxlIGJ1aWxkIG1vZGUgZm9yIGFkZGluZyBtdWx0aXBsZSBsaW5lc1xyXG5cclxuICAgIC8vIHNldCBkZWZhdWx0IGZvbnRcclxuICAgIHRoaXMuYXR0cignZm9udC1mYW1pbHknLCBTVkcuZGVmYXVsdHMuYXR0cnNbJ2ZvbnQtZmFtaWx5J10pXHJcbiAgfVxyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuU2hhcGVcclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIE1vdmUgb3ZlciB4LWF4aXNcclxuICAgIHg6IGZ1bmN0aW9uKHgpIHtcclxuICAgICAgLy8gYWN0IGFzIGdldHRlclxyXG4gICAgICBpZiAoeCA9PSBudWxsKVxyXG4gICAgICAgIHJldHVybiB0aGlzLmF0dHIoJ3gnKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cigneCcsIHgpXHJcbiAgICB9XHJcbiAgICAvLyBNb3ZlIG92ZXIgeS1heGlzXHJcbiAgLCB5OiBmdW5jdGlvbih5KSB7XHJcbiAgICAgIHZhciBveSA9IHRoaXMuYXR0cigneScpXHJcbiAgICAgICAgLCBvICA9IHR5cGVvZiBveSA9PT0gJ251bWJlcicgPyBveSAtIHRoaXMuYmJveCgpLnkgOiAwXHJcblxyXG4gICAgICAvLyBhY3QgYXMgZ2V0dGVyXHJcbiAgICAgIGlmICh5ID09IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBveSA9PT0gJ251bWJlcicgPyBveSAtIG8gOiBveVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cigneScsIHR5cGVvZiB5ID09PSAnbnVtYmVyJyA/IHkgKyBvIDogeSlcclxuICAgIH1cclxuICAgIC8vIE1vdmUgY2VudGVyIG92ZXIgeC1heGlzXHJcbiAgLCBjeDogZnVuY3Rpb24oeCkge1xyXG4gICAgICByZXR1cm4geCA9PSBudWxsID8gdGhpcy5iYm94KCkuY3ggOiB0aGlzLngoeCAtIHRoaXMuYmJveCgpLndpZHRoIC8gMilcclxuICAgIH1cclxuICAgIC8vIE1vdmUgY2VudGVyIG92ZXIgeS1heGlzXHJcbiAgLCBjeTogZnVuY3Rpb24oeSkge1xyXG4gICAgICByZXR1cm4geSA9PSBudWxsID8gdGhpcy5iYm94KCkuY3kgOiB0aGlzLnkoeSAtIHRoaXMuYmJveCgpLmhlaWdodCAvIDIpXHJcbiAgICB9XHJcbiAgICAvLyBTZXQgdGhlIHRleHQgY29udGVudFxyXG4gICwgdGV4dDogZnVuY3Rpb24odGV4dCkge1xyXG4gICAgICAvLyBhY3QgYXMgZ2V0dGVyXHJcbiAgICAgIGlmICh0eXBlb2YgdGV4dCA9PT0gJ3VuZGVmaW5lZCcpe1xyXG4gICAgICAgIHZhciB0ZXh0ID0gJydcclxuICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLm5vZGUuY2hpbGROb2Rlc1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgKytpKXtcclxuXHJcbiAgICAgICAgICAvLyBhZGQgbmV3bGluZSBpZiBpdHMgbm90IHRoZSBmaXJzdCBjaGlsZCBhbmQgbmV3TGluZWQgaXMgc2V0IHRvIHRydWVcclxuICAgICAgICAgIGlmKGkgIT0gMCAmJiBjaGlsZHJlbltpXS5ub2RlVHlwZSAhPSAzICYmIFNWRy5hZG9wdChjaGlsZHJlbltpXSkuZG9tLm5ld0xpbmVkID09IHRydWUpe1xyXG4gICAgICAgICAgICB0ZXh0ICs9ICdcXG4nXHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgLy8gYWRkIGNvbnRlbnQgb2YgdGhpcyBub2RlXHJcbiAgICAgICAgICB0ZXh0ICs9IGNoaWxkcmVuW2ldLnRleHRDb250ZW50XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGV4dFxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyByZW1vdmUgZXhpc3RpbmcgY29udGVudFxyXG4gICAgICB0aGlzLmNsZWFyKCkuYnVpbGQodHJ1ZSlcclxuXHJcbiAgICAgIGlmICh0eXBlb2YgdGV4dCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIC8vIGNhbGwgYmxvY2tcclxuICAgICAgICB0ZXh0LmNhbGwodGhpcywgdGhpcylcclxuXHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gc3RvcmUgdGV4dCBhbmQgbWFrZSBzdXJlIHRleHQgaXMgbm90IGJsYW5rXHJcbiAgICAgICAgdGV4dCA9IHRleHQuc3BsaXQoJ1xcbicpXHJcblxyXG4gICAgICAgIC8vIGJ1aWxkIG5ldyBsaW5lc1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBpbCA9IHRleHQubGVuZ3RoOyBpIDwgaWw7IGkrKylcclxuICAgICAgICAgIHRoaXMudHNwYW4odGV4dFtpXSkubmV3TGluZSgpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIGRpc2FibGUgYnVpbGQgbW9kZSBhbmQgcmVidWlsZCBsaW5lc1xyXG4gICAgICByZXR1cm4gdGhpcy5idWlsZChmYWxzZSkucmVidWlsZCgpXHJcbiAgICB9XHJcbiAgICAvLyBTZXQgZm9udCBzaXplXHJcbiAgLCBzaXplOiBmdW5jdGlvbihzaXplKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ2ZvbnQtc2l6ZScsIHNpemUpLnJlYnVpbGQoKVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IC8gZ2V0IGxlYWRpbmdcclxuICAsIGxlYWRpbmc6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICAgIC8vIGFjdCBhcyBnZXR0ZXJcclxuICAgICAgaWYgKHZhbHVlID09IG51bGwpXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZG9tLmxlYWRpbmdcclxuXHJcbiAgICAgIC8vIGFjdCBhcyBzZXR0ZXJcclxuICAgICAgdGhpcy5kb20ubGVhZGluZyA9IG5ldyBTVkcuTnVtYmVyKHZhbHVlKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXMucmVidWlsZCgpXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgYWxsIHRoZSBmaXJzdCBsZXZlbCBsaW5lc1xyXG4gICwgbGluZXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgbm9kZSA9ICh0aGlzLnRleHRQYXRoICYmIHRoaXMudGV4dFBhdGgoKSB8fCB0aGlzKS5ub2RlXHJcblxyXG4gICAgICAvLyBmaWx0ZXIgdHNwYW5zIGFuZCBtYXAgdGhlbSB0byBTVkcuanMgaW5zdGFuY2VzXHJcbiAgICAgIHZhciBsaW5lcyA9IFNWRy51dGlscy5tYXAoU1ZHLnV0aWxzLmZpbHRlclNWR0VsZW1lbnRzKG5vZGUuY2hpbGROb2RlcyksIGZ1bmN0aW9uKGVsKXtcclxuICAgICAgICByZXR1cm4gU1ZHLmFkb3B0KGVsKVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgLy8gcmV0dXJuIGFuIGluc3RhbmNlIG9mIFNWRy5zZXRcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuU2V0KGxpbmVzKVxyXG4gICAgfVxyXG4gICAgLy8gUmVidWlsZCBhcHBlYXJhbmNlIHR5cGVcclxuICAsIHJlYnVpbGQ6IGZ1bmN0aW9uKHJlYnVpbGQpIHtcclxuICAgICAgLy8gc3RvcmUgbmV3IHJlYnVpbGQgZmxhZyBpZiBnaXZlblxyXG4gICAgICBpZiAodHlwZW9mIHJlYnVpbGQgPT0gJ2Jvb2xlYW4nKVxyXG4gICAgICAgIHRoaXMuX3JlYnVpbGQgPSByZWJ1aWxkXHJcblxyXG4gICAgICAvLyBkZWZpbmUgcG9zaXRpb24gb2YgYWxsIGxpbmVzXHJcbiAgICAgIGlmICh0aGlzLl9yZWJ1aWxkKSB7XHJcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzXHJcbiAgICAgICAgICAsIGJsYW5rTGluZU9mZnNldCA9IDBcclxuICAgICAgICAgICwgZHkgPSB0aGlzLmRvbS5sZWFkaW5nICogbmV3IFNWRy5OdW1iZXIodGhpcy5hdHRyKCdmb250LXNpemUnKSlcclxuXHJcbiAgICAgICAgdGhpcy5saW5lcygpLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5kb20ubmV3TGluZWQpIHtcclxuICAgICAgICAgICAgaWYgKCFzZWxmLnRleHRQYXRoKCkpXHJcbiAgICAgICAgICAgICAgdGhpcy5hdHRyKCd4Jywgc2VsZi5hdHRyKCd4JykpXHJcbiAgICAgICAgICAgIGlmKHRoaXMudGV4dCgpID09ICdcXG4nKSB7XHJcbiAgICAgICAgICAgICAgYmxhbmtMaW5lT2Zmc2V0ICs9IGR5XHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgIHRoaXMuYXR0cignZHknLCBkeSArIGJsYW5rTGluZU9mZnNldClcclxuICAgICAgICAgICAgICBibGFua0xpbmVPZmZzZXQgPSAwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLmZpcmUoJ3JlYnVpbGQnKVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gRW5hYmxlIC8gZGlzYWJsZSBidWlsZCBtb2RlXHJcbiAgLCBidWlsZDogZnVuY3Rpb24oYnVpbGQpIHtcclxuICAgICAgdGhpcy5fYnVpbGQgPSAhIWJ1aWxkXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBvdmVyd3JpdGUgbWV0aG9kIGZyb20gcGFyZW50IHRvIHNldCBkYXRhIHByb3Blcmx5XHJcbiAgLCBzZXREYXRhOiBmdW5jdGlvbihvKXtcclxuICAgICAgdGhpcy5kb20gPSBvXHJcbiAgICAgIHRoaXMuZG9tLmxlYWRpbmcgPSBuZXcgU1ZHLk51bWJlcihvLmxlYWRpbmcgfHwgMS4zKVxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIENyZWF0ZSB0ZXh0IGVsZW1lbnRcclxuICAgIHRleHQ6IGZ1bmN0aW9uKHRleHQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuVGV4dCkudGV4dCh0ZXh0KVxyXG4gICAgfVxyXG4gICAgLy8gQ3JlYXRlIHBsYWluIHRleHQgZWxlbWVudFxyXG4gICwgcGxhaW46IGZ1bmN0aW9uKHRleHQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuVGV4dCkucGxhaW4odGV4dClcclxuICAgIH1cclxuICB9XHJcblxyXG59KVxyXG5cclxuU1ZHLlRzcGFuID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAndHNwYW4nXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5TaGFwZVxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gU2V0IHRleHQgY29udGVudFxyXG4gICAgdGV4dDogZnVuY3Rpb24odGV4dCkge1xyXG4gICAgICBpZih0ZXh0ID09IG51bGwpIHJldHVybiB0aGlzLm5vZGUudGV4dENvbnRlbnQgKyAodGhpcy5kb20ubmV3TGluZWQgPyAnXFxuJyA6ICcnKVxyXG5cclxuICAgICAgdHlwZW9mIHRleHQgPT09ICdmdW5jdGlvbicgPyB0ZXh0LmNhbGwodGhpcywgdGhpcykgOiB0aGlzLnBsYWluKHRleHQpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gU2hvcnRjdXQgZHhcclxuICAsIGR4OiBmdW5jdGlvbihkeCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdkeCcsIGR4KVxyXG4gICAgfVxyXG4gICAgLy8gU2hvcnRjdXQgZHlcclxuICAsIGR5OiBmdW5jdGlvbihkeSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdkeScsIGR5KVxyXG4gICAgfVxyXG4gICAgLy8gQ3JlYXRlIG5ldyBsaW5lXHJcbiAgLCBuZXdMaW5lOiBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gZmV0Y2ggdGV4dCBwYXJlbnRcclxuICAgICAgdmFyIHQgPSB0aGlzLnBhcmVudChTVkcuVGV4dClcclxuXHJcbiAgICAgIC8vIG1hcmsgbmV3IGxpbmVcclxuICAgICAgdGhpcy5kb20ubmV3TGluZWQgPSB0cnVlXHJcblxyXG4gICAgICAvLyBhcHBseSBuZXcgaHnCoW5cclxuICAgICAgcmV0dXJuIHRoaXMuZHkodC5kb20ubGVhZGluZyAqIHQuYXR0cignZm9udC1zaXplJykpLmF0dHIoJ3gnLCB0LngoKSlcclxuICAgIH1cclxuICB9XHJcblxyXG59KVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuVGV4dCwgU1ZHLlRzcGFuLCB7XHJcbiAgLy8gQ3JlYXRlIHBsYWluIHRleHQgbm9kZVxyXG4gIHBsYWluOiBmdW5jdGlvbih0ZXh0KSB7XHJcbiAgICAvLyBjbGVhciBpZiBidWlsZCBtb2RlIGlzIGRpc2FibGVkXHJcbiAgICBpZiAodGhpcy5fYnVpbGQgPT09IGZhbHNlKVxyXG4gICAgICB0aGlzLmNsZWFyKClcclxuXHJcbiAgICAvLyBjcmVhdGUgdGV4dCBub2RlXHJcbiAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCkpXHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcbiAgLy8gQ3JlYXRlIGEgdHNwYW5cclxuLCB0c3BhbjogZnVuY3Rpb24odGV4dCkge1xyXG4gICAgdmFyIG5vZGUgID0gKHRoaXMudGV4dFBhdGggJiYgdGhpcy50ZXh0UGF0aCgpIHx8IHRoaXMpLm5vZGVcclxuICAgICAgLCB0c3BhbiA9IG5ldyBTVkcuVHNwYW5cclxuXHJcbiAgICAvLyBjbGVhciBpZiBidWlsZCBtb2RlIGlzIGRpc2FibGVkXHJcbiAgICBpZiAodGhpcy5fYnVpbGQgPT09IGZhbHNlKVxyXG4gICAgICB0aGlzLmNsZWFyKClcclxuXHJcbiAgICAvLyBhZGQgbmV3IHRzcGFuXHJcbiAgICBub2RlLmFwcGVuZENoaWxkKHRzcGFuLm5vZGUpXHJcblxyXG4gICAgcmV0dXJuIHRzcGFuLnRleHQodGV4dClcclxuICB9XHJcbiAgLy8gQ2xlYXIgYWxsIGxpbmVzXHJcbiwgY2xlYXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIG5vZGUgPSAodGhpcy50ZXh0UGF0aCAmJiB0aGlzLnRleHRQYXRoKCkgfHwgdGhpcykubm9kZVxyXG5cclxuICAgIC8vIHJlbW92ZSBleGlzdGluZyBjaGlsZCBub2Rlc1xyXG4gICAgd2hpbGUgKG5vZGUuaGFzQ2hpbGROb2RlcygpKVxyXG4gICAgICBub2RlLnJlbW92ZUNoaWxkKG5vZGUubGFzdENoaWxkKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG4gIC8vIEdldCBsZW5ndGggb2YgdGV4dCBlbGVtZW50XHJcbiwgbGVuZ3RoOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLm5vZGUuZ2V0Q29tcHV0ZWRUZXh0TGVuZ3RoKClcclxuICB9XHJcbn0pXHJcblxuU1ZHLlRleHRQYXRoID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAndGV4dFBhdGgnXHJcblxyXG4gIC8vIEluaGVyaXQgZnJvbVxyXG4sIGluaGVyaXQ6IFNWRy5QYXJlbnRcclxuXHJcbiAgLy8gRGVmaW5lIHBhcmVudCBjbGFzc1xyXG4sIHBhcmVudDogU1ZHLlRleHRcclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIG1vcnBoQXJyYXk6IFNWRy5QYXRoQXJyYXlcclxuICAgIC8vIENyZWF0ZSBwYXRoIGZvciB0ZXh0IHRvIHJ1biBvblxyXG4gICwgcGF0aDogZnVuY3Rpb24oZCkge1xyXG4gICAgICAvLyBjcmVhdGUgdGV4dFBhdGggZWxlbWVudFxyXG4gICAgICB2YXIgcGF0aCAgPSBuZXcgU1ZHLlRleHRQYXRoXHJcbiAgICAgICAgLCB0cmFjayA9IHRoaXMuZG9jKCkuZGVmcygpLnBhdGgoZClcclxuXHJcbiAgICAgIC8vIG1vdmUgbGluZXMgdG8gdGV4dHBhdGhcclxuICAgICAgd2hpbGUgKHRoaXMubm9kZS5oYXNDaGlsZE5vZGVzKCkpXHJcbiAgICAgICAgcGF0aC5ub2RlLmFwcGVuZENoaWxkKHRoaXMubm9kZS5maXJzdENoaWxkKVxyXG5cclxuICAgICAgLy8gYWRkIHRleHRQYXRoIGVsZW1lbnQgYXMgY2hpbGQgbm9kZVxyXG4gICAgICB0aGlzLm5vZGUuYXBwZW5kQ2hpbGQocGF0aC5ub2RlKVxyXG5cclxuICAgICAgLy8gbGluayB0ZXh0UGF0aCB0byBwYXRoIGFuZCBhZGQgY29udGVudFxyXG4gICAgICBwYXRoLmF0dHIoJ2hyZWYnLCAnIycgKyB0cmFjaywgU1ZHLnhsaW5rKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIHJldHVybiB0aGUgYXJyYXkgb2YgdGhlIHBhdGggdHJhY2sgZWxlbWVudFxyXG4gICwgYXJyYXk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgdHJhY2sgPSB0aGlzLnRyYWNrKClcclxuXHJcbiAgICAgIHJldHVybiB0cmFjayA/IHRyYWNrLmFycmF5KCkgOiBudWxsXHJcbiAgICB9XHJcbiAgICAvLyBQbG90IHBhdGggaWYgYW55XHJcbiAgLCBwbG90OiBmdW5jdGlvbihkKSB7XHJcbiAgICAgIHZhciB0cmFjayA9IHRoaXMudHJhY2soKVxyXG4gICAgICAgICwgcGF0aEFycmF5ID0gbnVsbFxyXG5cclxuICAgICAgaWYgKHRyYWNrKSB7XHJcbiAgICAgICAgcGF0aEFycmF5ID0gdHJhY2sucGxvdChkKVxyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKGQgPT0gbnVsbCkgPyBwYXRoQXJyYXkgOiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgdGhlIHBhdGggdHJhY2sgZWxlbWVudFxyXG4gICwgdHJhY2s6IGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgcGF0aCA9IHRoaXMudGV4dFBhdGgoKVxyXG5cclxuICAgICAgaWYgKHBhdGgpXHJcbiAgICAgICAgcmV0dXJuIHBhdGgucmVmZXJlbmNlKCdocmVmJylcclxuICAgIH1cclxuICAgIC8vIEdldCB0aGUgdGV4dFBhdGggY2hpbGRcclxuICAsIHRleHRQYXRoOiBmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKHRoaXMubm9kZS5maXJzdENoaWxkICYmIHRoaXMubm9kZS5maXJzdENoaWxkLm5vZGVOYW1lID09ICd0ZXh0UGF0aCcpXHJcbiAgICAgICAgcmV0dXJuIFNWRy5hZG9wdCh0aGlzLm5vZGUuZmlyc3RDaGlsZClcclxuICAgIH1cclxuICB9XHJcbn0pXHJcblxuU1ZHLk5lc3RlZCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgU1ZHLmNyZWF0ZSgnc3ZnJykpXHJcblxyXG4gICAgdGhpcy5zdHlsZSgnb3ZlcmZsb3cnLCAndmlzaWJsZScpXHJcbiAgfVxyXG5cclxuICAvLyBJbmhlcml0IGZyb21cclxuLCBpbmhlcml0OiBTVkcuQ29udGFpbmVyXHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgbmVzdGVkIHN2ZyBkb2N1bWVudFxyXG4gICAgbmVzdGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuTmVzdGVkKVxyXG4gICAgfVxyXG4gIH1cclxufSlcblNWRy5BID0gU1ZHLmludmVudCh7XHJcbiAgLy8gSW5pdGlhbGl6ZSBub2RlXHJcbiAgY3JlYXRlOiAnYSdcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkNvbnRhaW5lclxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gTGluayB1cmxcclxuICAgIHRvOiBmdW5jdGlvbih1cmwpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cignaHJlZicsIHVybCwgU1ZHLnhsaW5rKVxyXG4gICAgfVxyXG4gICAgLy8gTGluayBzaG93IGF0dHJpYnV0ZVxyXG4gICwgc2hvdzogZnVuY3Rpb24odGFyZ2V0KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmF0dHIoJ3Nob3cnLCB0YXJnZXQsIFNWRy54bGluaylcclxuICAgIH1cclxuICAgIC8vIExpbmsgdGFyZ2V0IGF0dHJpYnV0ZVxyXG4gICwgdGFyZ2V0OiBmdW5jdGlvbih0YXJnZXQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMuYXR0cigndGFyZ2V0JywgdGFyZ2V0KVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIHBhcmVudCBtZXRob2RcclxuLCBjb25zdHJ1Y3Q6IHtcclxuICAgIC8vIENyZWF0ZSBhIGh5cGVybGluayBlbGVtZW50XHJcbiAgICBsaW5rOiBmdW5jdGlvbih1cmwpIHtcclxuICAgICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuQSkudG8odXJsKVxyXG4gICAgfVxyXG4gIH1cclxufSlcclxuXHJcblNWRy5leHRlbmQoU1ZHLkVsZW1lbnQsIHtcclxuICAvLyBDcmVhdGUgYSBoeXBlcmxpbmsgZWxlbWVudFxyXG4gIGxpbmtUbzogZnVuY3Rpb24odXJsKSB7XHJcbiAgICB2YXIgbGluayA9IG5ldyBTVkcuQVxyXG5cclxuICAgIGlmICh0eXBlb2YgdXJsID09ICdmdW5jdGlvbicpXHJcbiAgICAgIHVybC5jYWxsKGxpbmssIGxpbmspXHJcbiAgICBlbHNlXHJcbiAgICAgIGxpbmsudG8odXJsKVxyXG5cclxuICAgIHJldHVybiB0aGlzLnBhcmVudCgpLnB1dChsaW5rKS5wdXQodGhpcylcclxuICB9XHJcblxyXG59KVxuU1ZHLk1hcmtlciA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogJ21hcmtlcidcclxuXHJcbiAgLy8gSW5oZXJpdCBmcm9tXHJcbiwgaW5oZXJpdDogU1ZHLkNvbnRhaW5lclxyXG5cclxuICAvLyBBZGQgY2xhc3MgbWV0aG9kc1xyXG4sIGV4dGVuZDoge1xyXG4gICAgLy8gU2V0IHdpZHRoIG9mIGVsZW1lbnRcclxuICAgIHdpZHRoOiBmdW5jdGlvbih3aWR0aCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdtYXJrZXJXaWR0aCcsIHdpZHRoKVxyXG4gICAgfVxyXG4gICAgLy8gU2V0IGhlaWdodCBvZiBlbGVtZW50XHJcbiAgLCBoZWlnaHQ6IGZ1bmN0aW9uKGhlaWdodCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdtYXJrZXJIZWlnaHQnLCBoZWlnaHQpXHJcbiAgICB9XHJcbiAgICAvLyBTZXQgbWFya2VyIHJlZlggYW5kIHJlZllcclxuICAsIHJlZjogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICByZXR1cm4gdGhpcy5hdHRyKCdyZWZYJywgeCkuYXR0cigncmVmWScsIHkpXHJcbiAgICB9XHJcbiAgICAvLyBVcGRhdGUgbWFya2VyXHJcbiAgLCB1cGRhdGU6IGZ1bmN0aW9uKGJsb2NrKSB7XHJcbiAgICAgIC8vIHJlbW92ZSBhbGwgY29udGVudFxyXG4gICAgICB0aGlzLmNsZWFyKClcclxuXHJcbiAgICAgIC8vIGludm9rZSBwYXNzZWQgYmxvY2tcclxuICAgICAgaWYgKHR5cGVvZiBibG9jayA9PSAnZnVuY3Rpb24nKVxyXG4gICAgICAgIGJsb2NrLmNhbGwodGhpcywgdGhpcylcclxuXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICB9XHJcbiAgICAvLyBSZXR1cm4gdGhlIGZpbGwgaWRcclxuICAsIHRvU3RyaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuICd1cmwoIycgKyB0aGlzLmlkKCkgKyAnKSdcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICBtYXJrZXI6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQsIGJsb2NrKSB7XHJcbiAgICAgIC8vIENyZWF0ZSBtYXJrZXIgZWxlbWVudCBpbiBkZWZzXHJcbiAgICAgIHJldHVybiB0aGlzLmRlZnMoKS5tYXJrZXIod2lkdGgsIGhlaWdodCwgYmxvY2spXHJcbiAgICB9XHJcbiAgfVxyXG5cclxufSlcclxuXHJcblNWRy5leHRlbmQoU1ZHLkRlZnMsIHtcclxuICAvLyBDcmVhdGUgbWFya2VyXHJcbiAgbWFya2VyOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBibG9jaykge1xyXG4gICAgLy8gU2V0IGRlZmF1bHQgdmlld2JveCB0byBtYXRjaCB0aGUgd2lkdGggYW5kIGhlaWdodCwgc2V0IHJlZiB0byBjeCBhbmQgY3kgYW5kIHNldCBvcmllbnQgdG8gYXV0b1xyXG4gICAgcmV0dXJuIHRoaXMucHV0KG5ldyBTVkcuTWFya2VyKVxyXG4gICAgICAuc2l6ZSh3aWR0aCwgaGVpZ2h0KVxyXG4gICAgICAucmVmKHdpZHRoIC8gMiwgaGVpZ2h0IC8gMilcclxuICAgICAgLnZpZXdib3goMCwgMCwgd2lkdGgsIGhlaWdodClcclxuICAgICAgLmF0dHIoJ29yaWVudCcsICdhdXRvJylcclxuICAgICAgLnVwZGF0ZShibG9jaylcclxuICB9XHJcblxyXG59KVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuTGluZSwgU1ZHLlBvbHlsaW5lLCBTVkcuUG9seWdvbiwgU1ZHLlBhdGgsIHtcclxuICAvLyBDcmVhdGUgYW5kIGF0dGFjaCBtYXJrZXJzXHJcbiAgbWFya2VyOiBmdW5jdGlvbihtYXJrZXIsIHdpZHRoLCBoZWlnaHQsIGJsb2NrKSB7XHJcbiAgICB2YXIgYXR0ciA9IFsnbWFya2VyJ11cclxuXHJcbiAgICAvLyBCdWlsZCBhdHRyaWJ1dGUgbmFtZVxyXG4gICAgaWYgKG1hcmtlciAhPSAnYWxsJykgYXR0ci5wdXNoKG1hcmtlcilcclxuICAgIGF0dHIgPSBhdHRyLmpvaW4oJy0nKVxyXG5cclxuICAgIC8vIFNldCBtYXJrZXIgYXR0cmlidXRlXHJcbiAgICBtYXJrZXIgPSBhcmd1bWVudHNbMV0gaW5zdGFuY2VvZiBTVkcuTWFya2VyID9cclxuICAgICAgYXJndW1lbnRzWzFdIDpcclxuICAgICAgdGhpcy5kb2MoKS5tYXJrZXIod2lkdGgsIGhlaWdodCwgYmxvY2spXHJcblxyXG4gICAgcmV0dXJuIHRoaXMuYXR0cihhdHRyLCBtYXJrZXIpXHJcbiAgfVxyXG5cclxufSlcbi8vIERlZmluZSBsaXN0IG9mIGF2YWlsYWJsZSBhdHRyaWJ1dGVzIGZvciBzdHJva2UgYW5kIGZpbGxcclxudmFyIHN1Z2FyID0ge1xyXG4gIHN0cm9rZTogWydjb2xvcicsICd3aWR0aCcsICdvcGFjaXR5JywgJ2xpbmVjYXAnLCAnbGluZWpvaW4nLCAnbWl0ZXJsaW1pdCcsICdkYXNoYXJyYXknLCAnZGFzaG9mZnNldCddXHJcbiwgZmlsbDogICBbJ2NvbG9yJywgJ29wYWNpdHknLCAncnVsZSddXHJcbiwgcHJlZml4OiBmdW5jdGlvbih0LCBhKSB7XHJcbiAgICByZXR1cm4gYSA9PSAnY29sb3InID8gdCA6IHQgKyAnLScgKyBhXHJcbiAgfVxyXG59XHJcblxyXG4vLyBBZGQgc3VnYXIgZm9yIGZpbGwgYW5kIHN0cm9rZVxyXG47WydmaWxsJywgJ3N0cm9rZSddLmZvckVhY2goZnVuY3Rpb24obSkge1xyXG4gIHZhciBpLCBleHRlbnNpb24gPSB7fVxyXG5cclxuICBleHRlbnNpb25bbV0gPSBmdW5jdGlvbihvKSB7XHJcbiAgICBpZiAodHlwZW9mIG8gPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgIHJldHVybiB0aGlzXHJcbiAgICBpZiAodHlwZW9mIG8gPT0gJ3N0cmluZycgfHwgU1ZHLkNvbG9yLmlzUmdiKG8pIHx8IChvICYmIHR5cGVvZiBvLmZpbGwgPT09ICdmdW5jdGlvbicpKVxyXG4gICAgICB0aGlzLmF0dHIobSwgbylcclxuXHJcbiAgICBlbHNlXHJcbiAgICAgIC8vIHNldCBhbGwgYXR0cmlidXRlcyBmcm9tIHN1Z2FyLmZpbGwgYW5kIHN1Z2FyLnN0cm9rZSBsaXN0XHJcbiAgICAgIGZvciAoaSA9IHN1Z2FyW21dLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKVxyXG4gICAgICAgIGlmIChvW3N1Z2FyW21dW2ldXSAhPSBudWxsKVxyXG4gICAgICAgICAgdGhpcy5hdHRyKHN1Z2FyLnByZWZpeChtLCBzdWdhclttXVtpXSksIG9bc3VnYXJbbV1baV1dKVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICBTVkcuZXh0ZW5kKFNWRy5FbGVtZW50LCBTVkcuRlgsIGV4dGVuc2lvbilcclxuXHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5FbGVtZW50LCBTVkcuRlgsIHtcclxuICAvLyBNYXAgcm90YXRpb24gdG8gdHJhbnNmb3JtXHJcbiAgcm90YXRlOiBmdW5jdGlvbihkLCBjeCwgY3kpIHtcclxuICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybSh7IHJvdGF0aW9uOiBkLCBjeDogY3gsIGN5OiBjeSB9KVxyXG4gIH1cclxuICAvLyBNYXAgc2tldyB0byB0cmFuc2Zvcm1cclxuLCBza2V3OiBmdW5jdGlvbih4LCB5LCBjeCwgY3kpIHtcclxuICAgIHJldHVybiBhcmd1bWVudHMubGVuZ3RoID09IDEgIHx8IGFyZ3VtZW50cy5sZW5ndGggPT0gMyA/XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtKHsgc2tldzogeCwgY3g6IHksIGN5OiBjeCB9KSA6XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtKHsgc2tld1g6IHgsIHNrZXdZOiB5LCBjeDogY3gsIGN5OiBjeSB9KVxyXG4gIH1cclxuICAvLyBNYXAgc2NhbGUgdG8gdHJhbnNmb3JtXHJcbiwgc2NhbGU6IGZ1bmN0aW9uKHgsIHksIGN4LCBjeSkge1xyXG4gICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT0gMSAgfHwgYXJndW1lbnRzLmxlbmd0aCA9PSAzID9cclxuICAgICAgdGhpcy50cmFuc2Zvcm0oeyBzY2FsZTogeCwgY3g6IHksIGN5OiBjeCB9KSA6XHJcbiAgICAgIHRoaXMudHJhbnNmb3JtKHsgc2NhbGVYOiB4LCBzY2FsZVk6IHksIGN4OiBjeCwgY3k6IGN5IH0pXHJcbiAgfVxyXG4gIC8vIE1hcCB0cmFuc2xhdGUgdG8gdHJhbnNmb3JtXHJcbiwgdHJhbnNsYXRlOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm0oeyB4OiB4LCB5OiB5IH0pXHJcbiAgfVxyXG4gIC8vIE1hcCBmbGlwIHRvIHRyYW5zZm9ybVxyXG4sIGZsaXA6IGZ1bmN0aW9uKGEsIG8pIHtcclxuICAgIG8gPSB0eXBlb2YgYSA9PSAnbnVtYmVyJyA/IGEgOiBvXHJcbiAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm0oeyBmbGlwOiBhIHx8ICdib3RoJywgb2Zmc2V0OiBvIH0pXHJcbiAgfVxyXG4gIC8vIE1hcCBtYXRyaXggdG8gdHJhbnNmb3JtXHJcbiwgbWF0cml4OiBmdW5jdGlvbihtKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCd0cmFuc2Zvcm0nLCBuZXcgU1ZHLk1hdHJpeChhcmd1bWVudHMubGVuZ3RoID09IDYgPyBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykgOiBtKSlcclxuICB9XHJcbiAgLy8gT3BhY2l0eVxyXG4sIG9wYWNpdHk6IGZ1bmN0aW9uKHZhbHVlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5hdHRyKCdvcGFjaXR5JywgdmFsdWUpXHJcbiAgfVxyXG4gIC8vIFJlbGF0aXZlIG1vdmUgb3ZlciB4IGF4aXNcclxuLCBkeDogZnVuY3Rpb24oeCkge1xyXG4gICAgcmV0dXJuIHRoaXMueChuZXcgU1ZHLk51bWJlcih4KS5wbHVzKHRoaXMgaW5zdGFuY2VvZiBTVkcuRlggPyAwIDogdGhpcy54KCkpLCB0cnVlKVxyXG4gIH1cclxuICAvLyBSZWxhdGl2ZSBtb3ZlIG92ZXIgeSBheGlzXHJcbiwgZHk6IGZ1bmN0aW9uKHkpIHtcclxuICAgIHJldHVybiB0aGlzLnkobmV3IFNWRy5OdW1iZXIoeSkucGx1cyh0aGlzIGluc3RhbmNlb2YgU1ZHLkZYID8gMCA6IHRoaXMueSgpKSwgdHJ1ZSlcclxuICB9XHJcbiAgLy8gUmVsYXRpdmUgbW92ZSBvdmVyIHggYW5kIHkgYXhlc1xyXG4sIGRtb3ZlOiBmdW5jdGlvbih4LCB5KSB7XHJcbiAgICByZXR1cm4gdGhpcy5keCh4KS5keSh5KVxyXG4gIH1cclxufSlcclxuXHJcblNWRy5leHRlbmQoU1ZHLlJlY3QsIFNWRy5FbGxpcHNlLCBTVkcuQ2lyY2xlLCBTVkcuR3JhZGllbnQsIFNWRy5GWCwge1xyXG4gIC8vIEFkZCB4IGFuZCB5IHJhZGl1c1xyXG4gIHJhZGl1czogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgdmFyIHR5cGUgPSAodGhpcy5fdGFyZ2V0IHx8IHRoaXMpLnR5cGU7XHJcbiAgICByZXR1cm4gdHlwZSA9PSAncmFkaWFsJyB8fCB0eXBlID09ICdjaXJjbGUnID9cclxuICAgICAgdGhpcy5hdHRyKCdyJywgbmV3IFNWRy5OdW1iZXIoeCkpIDpcclxuICAgICAgdGhpcy5yeCh4KS5yeSh5ID09IG51bGwgPyB4IDogeSlcclxuICB9XHJcbn0pXHJcblxyXG5TVkcuZXh0ZW5kKFNWRy5QYXRoLCB7XHJcbiAgLy8gR2V0IHBhdGggbGVuZ3RoXHJcbiAgbGVuZ3RoOiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLm5vZGUuZ2V0VG90YWxMZW5ndGgoKVxyXG4gIH1cclxuICAvLyBHZXQgcG9pbnQgYXQgbGVuZ3RoXHJcbiwgcG9pbnRBdDogZnVuY3Rpb24obGVuZ3RoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5ub2RlLmdldFBvaW50QXRMZW5ndGgobGVuZ3RoKVxyXG4gIH1cclxufSlcclxuXHJcblNWRy5leHRlbmQoU1ZHLlBhcmVudCwgU1ZHLlRleHQsIFNWRy5Uc3BhbiwgU1ZHLkZYLCB7XHJcbiAgLy8gU2V0IGZvbnRcclxuICBmb250OiBmdW5jdGlvbihhLCB2KSB7XHJcbiAgICBpZiAodHlwZW9mIGEgPT0gJ29iamVjdCcpIHtcclxuICAgICAgZm9yICh2IGluIGEpIHRoaXMuZm9udCh2LCBhW3ZdKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhID09ICdsZWFkaW5nJyA/XHJcbiAgICAgICAgdGhpcy5sZWFkaW5nKHYpIDpcclxuICAgICAgYSA9PSAnYW5jaG9yJyA/XHJcbiAgICAgICAgdGhpcy5hdHRyKCd0ZXh0LWFuY2hvcicsIHYpIDpcclxuICAgICAgYSA9PSAnc2l6ZScgfHwgYSA9PSAnZmFtaWx5JyB8fCBhID09ICd3ZWlnaHQnIHx8IGEgPT0gJ3N0cmV0Y2gnIHx8IGEgPT0gJ3ZhcmlhbnQnIHx8IGEgPT0gJ3N0eWxlJyA/XHJcbiAgICAgICAgdGhpcy5hdHRyKCdmb250LScrIGEsIHYpIDpcclxuICAgICAgICB0aGlzLmF0dHIoYSwgdilcclxuICB9XHJcbn0pXHJcblxuU1ZHLlNldCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemVcclxuICBjcmVhdGU6IGZ1bmN0aW9uKG1lbWJlcnMpIHtcclxuICAgIC8vIFNldCBpbml0aWFsIHN0YXRlXHJcbiAgICBBcnJheS5pc0FycmF5KG1lbWJlcnMpID8gdGhpcy5tZW1iZXJzID0gbWVtYmVycyA6IHRoaXMuY2xlYXIoKVxyXG4gIH1cclxuXHJcbiAgLy8gQWRkIGNsYXNzIG1ldGhvZHNcclxuLCBleHRlbmQ6IHtcclxuICAgIC8vIEFkZCBlbGVtZW50IHRvIHNldFxyXG4gICAgYWRkOiBmdW5jdGlvbigpIHtcclxuICAgICAgdmFyIGksIGlsLCBlbGVtZW50cyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxyXG5cclxuICAgICAgZm9yIChpID0gMCwgaWwgPSBlbGVtZW50cy5sZW5ndGg7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIHRoaXMubWVtYmVycy5wdXNoKGVsZW1lbnRzW2ldKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIFJlbW92ZSBlbGVtZW50IGZyb20gc2V0XHJcbiAgLCByZW1vdmU6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgdmFyIGkgPSB0aGlzLmluZGV4KGVsZW1lbnQpXHJcblxyXG4gICAgICAvLyByZW1vdmUgZ2l2ZW4gY2hpbGRcclxuICAgICAgaWYgKGkgPiAtMSlcclxuICAgICAgICB0aGlzLm1lbWJlcnMuc3BsaWNlKGksIDEpXHJcblxyXG4gICAgICByZXR1cm4gdGhpc1xyXG4gICAgfVxyXG4gICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCBtZW1iZXJzXHJcbiAgLCBlYWNoOiBmdW5jdGlvbihibG9jaykge1xyXG4gICAgICBmb3IgKHZhciBpID0gMCwgaWwgPSB0aGlzLm1lbWJlcnMubGVuZ3RoOyBpIDwgaWw7IGkrKylcclxuICAgICAgICBibG9jay5hcHBseSh0aGlzLm1lbWJlcnNbaV0sIFtpLCB0aGlzLm1lbWJlcnNdKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIFJlc3RvcmUgdG8gZGVmYXVsdHNcclxuICAsIGNsZWFyOiBmdW5jdGlvbigpIHtcclxuICAgICAgLy8gaW5pdGlhbGl6ZSBzdG9yZVxyXG4gICAgICB0aGlzLm1lbWJlcnMgPSBbXVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICAgIC8vIEdldCB0aGUgbGVuZ3RoIG9mIGEgc2V0XHJcbiAgLCBsZW5ndGg6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5tZW1iZXJzLmxlbmd0aFxyXG4gICAgfVxyXG4gICAgLy8gQ2hlY2tzIGlmIGEgZ2l2ZW4gZWxlbWVudCBpcyBwcmVzZW50IGluIHNldFxyXG4gICwgaGFzOiBmdW5jdGlvbihlbGVtZW50KSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmluZGV4KGVsZW1lbnQpID49IDBcclxuICAgIH1cclxuICAgIC8vIHJldHVucyBpbmRleCBvZiBnaXZlbiBlbGVtZW50IGluIHNldFxyXG4gICwgaW5kZXg6IGZ1bmN0aW9uKGVsZW1lbnQpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubWVtYmVycy5pbmRleE9mKGVsZW1lbnQpXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgbWVtYmVyIGF0IGdpdmVuIGluZGV4XHJcbiAgLCBnZXQ6IGZ1bmN0aW9uKGkpIHtcclxuICAgICAgcmV0dXJuIHRoaXMubWVtYmVyc1tpXVxyXG4gICAgfVxyXG4gICAgLy8gR2V0IGZpcnN0IG1lbWJlclxyXG4gICwgZmlyc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5nZXQoMClcclxuICAgIH1cclxuICAgIC8vIEdldCBsYXN0IG1lbWJlclxyXG4gICwgbGFzdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLmdldCh0aGlzLm1lbWJlcnMubGVuZ3RoIC0gMSlcclxuICAgIH1cclxuICAgIC8vIERlZmF1bHQgdmFsdWVcclxuICAsIHZhbHVlT2Y6IGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5tZW1iZXJzXHJcbiAgICB9XHJcbiAgICAvLyBHZXQgdGhlIGJvdW5kaW5nIGJveCBvZiBhbGwgbWVtYmVycyBpbmNsdWRlZCBvciBlbXB0eSBib3ggaWYgc2V0IGhhcyBubyBpdGVtc1xyXG4gICwgYmJveDogZnVuY3Rpb24oKXtcclxuICAgICAgLy8gcmV0dXJuIGFuIGVtcHR5IGJveCBvZiB0aGVyZSBhcmUgbm8gbWVtYmVyc1xyXG4gICAgICBpZiAodGhpcy5tZW1iZXJzLmxlbmd0aCA9PSAwKVxyXG4gICAgICAgIHJldHVybiBuZXcgU1ZHLlJCb3goKVxyXG5cclxuICAgICAgLy8gZ2V0IHRoZSBmaXJzdCByYm94IGFuZCB1cGRhdGUgdGhlIHRhcmdldCBiYm94XHJcbiAgICAgIHZhciByYm94ID0gdGhpcy5tZW1iZXJzWzBdLnJib3godGhpcy5tZW1iZXJzWzBdLmRvYygpKVxyXG5cclxuICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIC8vIHVzZXIgcmJveCBmb3IgY29ycmVjdCBwb3NpdGlvbiBhbmQgdmlzdWFsIHJlcHJlc2VudGF0aW9uXHJcbiAgICAgICAgcmJveCA9IHJib3gubWVyZ2UodGhpcy5yYm94KHRoaXMuZG9jKCkpKVxyXG4gICAgICB9KVxyXG5cclxuICAgICAgcmV0dXJuIHJib3hcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEFkZCBwYXJlbnQgbWV0aG9kXHJcbiwgY29uc3RydWN0OiB7XHJcbiAgICAvLyBDcmVhdGUgYSBuZXcgc2V0XHJcbiAgICBzZXQ6IGZ1bmN0aW9uKG1lbWJlcnMpIHtcclxuICAgICAgcmV0dXJuIG5ldyBTVkcuU2V0KG1lbWJlcnMpXHJcbiAgICB9XHJcbiAgfVxyXG59KVxyXG5cclxuU1ZHLkZYLlNldCA9IFNWRy5pbnZlbnQoe1xyXG4gIC8vIEluaXRpYWxpemUgbm9kZVxyXG4gIGNyZWF0ZTogZnVuY3Rpb24oc2V0KSB7XHJcbiAgICAvLyBzdG9yZSByZWZlcmVuY2UgdG8gc2V0XHJcbiAgICB0aGlzLnNldCA9IHNldFxyXG4gIH1cclxuXHJcbn0pXHJcblxyXG4vLyBBbGlhcyBtZXRob2RzXHJcblNWRy5TZXQuaW5oZXJpdCA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBtXHJcbiAgICAsIG1ldGhvZHMgPSBbXVxyXG5cclxuICAvLyBnYXRoZXIgc2hhcGUgbWV0aG9kc1xyXG4gIGZvcih2YXIgbSBpbiBTVkcuU2hhcGUucHJvdG90eXBlKVxyXG4gICAgaWYgKHR5cGVvZiBTVkcuU2hhcGUucHJvdG90eXBlW21dID09ICdmdW5jdGlvbicgJiYgdHlwZW9mIFNWRy5TZXQucHJvdG90eXBlW21dICE9ICdmdW5jdGlvbicpXHJcbiAgICAgIG1ldGhvZHMucHVzaChtKVxyXG5cclxuICAvLyBhcHBseSBzaGFwZSBhbGlhc3Nlc1xyXG4gIG1ldGhvZHMuZm9yRWFjaChmdW5jdGlvbihtZXRob2QpIHtcclxuICAgIFNWRy5TZXQucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbigpIHtcclxuICAgICAgZm9yICh2YXIgaSA9IDAsIGlsID0gdGhpcy5tZW1iZXJzLmxlbmd0aDsgaSA8IGlsOyBpKyspXHJcbiAgICAgICAgaWYgKHRoaXMubWVtYmVyc1tpXSAmJiB0eXBlb2YgdGhpcy5tZW1iZXJzW2ldW21ldGhvZF0gPT0gJ2Z1bmN0aW9uJylcclxuICAgICAgICAgIHRoaXMubWVtYmVyc1tpXVttZXRob2RdLmFwcGx5KHRoaXMubWVtYmVyc1tpXSwgYXJndW1lbnRzKVxyXG5cclxuICAgICAgcmV0dXJuIG1ldGhvZCA9PSAnYW5pbWF0ZScgPyAodGhpcy5meCB8fCAodGhpcy5meCA9IG5ldyBTVkcuRlguU2V0KHRoaXMpKSkgOiB0aGlzXHJcbiAgICB9XHJcbiAgfSlcclxuXHJcbiAgLy8gY2xlYXIgbWV0aG9kcyBmb3IgdGhlIG5leHQgcm91bmRcclxuICBtZXRob2RzID0gW11cclxuXHJcbiAgLy8gZ2F0aGVyIGZ4IG1ldGhvZHNcclxuICBmb3IodmFyIG0gaW4gU1ZHLkZYLnByb3RvdHlwZSlcclxuICAgIGlmICh0eXBlb2YgU1ZHLkZYLnByb3RvdHlwZVttXSA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTVkcuRlguU2V0LnByb3RvdHlwZVttXSAhPSAnZnVuY3Rpb24nKVxyXG4gICAgICBtZXRob2RzLnB1c2gobSlcclxuXHJcbiAgLy8gYXBwbHkgZnggYWxpYXNzZXNcclxuICBtZXRob2RzLmZvckVhY2goZnVuY3Rpb24obWV0aG9kKSB7XHJcbiAgICBTVkcuRlguU2V0LnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwLCBpbCA9IHRoaXMuc2V0Lm1lbWJlcnMubGVuZ3RoOyBpIDwgaWw7IGkrKylcclxuICAgICAgICB0aGlzLnNldC5tZW1iZXJzW2ldLmZ4W21ldGhvZF0uYXBwbHkodGhpcy5zZXQubWVtYmVyc1tpXS5meCwgYXJndW1lbnRzKVxyXG5cclxuICAgICAgcmV0dXJuIHRoaXNcclxuICAgIH1cclxuICB9KVxyXG59XHJcblxyXG5cclxuXG5cclxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG4gIC8vIFN0b3JlIGRhdGEgdmFsdWVzIG9uIHN2ZyBub2Rlc1xyXG4gIGRhdGE6IGZ1bmN0aW9uKGEsIHYsIHIpIHtcclxuICAgIGlmICh0eXBlb2YgYSA9PSAnb2JqZWN0Jykge1xyXG4gICAgICBmb3IgKHYgaW4gYSlcclxuICAgICAgICB0aGlzLmRhdGEodiwgYVt2XSlcclxuXHJcbiAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgcmV0dXJuIEpTT04ucGFyc2UodGhpcy5hdHRyKCdkYXRhLScgKyBhKSlcclxuICAgICAgfSBjYXRjaChlKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cignZGF0YS0nICsgYSlcclxuICAgICAgfVxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRoaXMuYXR0cihcclxuICAgICAgICAnZGF0YS0nICsgYVxyXG4gICAgICAsIHYgPT09IG51bGwgP1xyXG4gICAgICAgICAgbnVsbCA6XHJcbiAgICAgICAgciA9PT0gdHJ1ZSB8fCB0eXBlb2YgdiA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHYgPT09ICdudW1iZXInID9cclxuICAgICAgICAgIHYgOlxyXG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodilcclxuICAgICAgKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG59KVxuU1ZHLmV4dGVuZChTVkcuRWxlbWVudCwge1xyXG4gIC8vIFJlbWVtYmVyIGFyYml0cmFyeSBkYXRhXHJcbiAgcmVtZW1iZXI6IGZ1bmN0aW9uKGssIHYpIHtcclxuICAgIC8vIHJlbWVtYmVyIGV2ZXJ5IGl0ZW0gaW4gYW4gb2JqZWN0IGluZGl2aWR1YWxseVxyXG4gICAgaWYgKHR5cGVvZiBhcmd1bWVudHNbMF0gPT0gJ29iamVjdCcpXHJcbiAgICAgIGZvciAodmFyIHYgaW4gaylcclxuICAgICAgICB0aGlzLnJlbWVtYmVyKHYsIGtbdl0pXHJcblxyXG4gICAgLy8gcmV0cmlldmUgbWVtb3J5XHJcbiAgICBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDEpXHJcbiAgICAgIHJldHVybiB0aGlzLm1lbW9yeSgpW2tdXHJcblxyXG4gICAgLy8gc3RvcmUgbWVtb3J5XHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMubWVtb3J5KClba10gPSB2XHJcblxyXG4gICAgcmV0dXJuIHRoaXNcclxuICB9XHJcblxyXG4gIC8vIEVyYXNlIGEgZ2l2ZW4gbWVtb3J5XHJcbiwgZm9yZ2V0OiBmdW5jdGlvbigpIHtcclxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApXHJcbiAgICAgIHRoaXMuX21lbW9yeSA9IHt9XHJcbiAgICBlbHNlXHJcbiAgICAgIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pXHJcbiAgICAgICAgZGVsZXRlIHRoaXMubWVtb3J5KClbYXJndW1lbnRzW2ldXVxyXG5cclxuICAgIHJldHVybiB0aGlzXHJcbiAgfVxyXG5cclxuICAvLyBJbml0aWFsaXplIG9yIHJldHVybiBsb2NhbCBtZW1vcnkgb2JqZWN0XHJcbiwgbWVtb3J5OiBmdW5jdGlvbigpIHtcclxuICAgIHJldHVybiB0aGlzLl9tZW1vcnkgfHwgKHRoaXMuX21lbW9yeSA9IHt9KVxyXG4gIH1cclxuXHJcbn0pXG4vLyBNZXRob2QgZm9yIGdldHRpbmcgYW4gZWxlbWVudCBieSBpZFxyXG5TVkcuZ2V0ID0gZnVuY3Rpb24oaWQpIHtcclxuICB2YXIgbm9kZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkRnJvbVJlZmVyZW5jZShpZCkgfHwgaWQpXHJcbiAgcmV0dXJuIFNWRy5hZG9wdChub2RlKVxyXG59XHJcblxyXG4vLyBTZWxlY3QgZWxlbWVudHMgYnkgcXVlcnkgc3RyaW5nXHJcblNWRy5zZWxlY3QgPSBmdW5jdGlvbihxdWVyeSwgcGFyZW50KSB7XHJcbiAgcmV0dXJuIG5ldyBTVkcuU2V0KFxyXG4gICAgU1ZHLnV0aWxzLm1hcCgocGFyZW50IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSwgZnVuY3Rpb24obm9kZSkge1xyXG4gICAgICByZXR1cm4gU1ZHLmFkb3B0KG5vZGUpXHJcbiAgICB9KVxyXG4gIClcclxufVxyXG5cclxuU1ZHLmV4dGVuZChTVkcuUGFyZW50LCB7XHJcbiAgLy8gU2NvcGVkIHNlbGVjdCBtZXRob2RcclxuICBzZWxlY3Q6IGZ1bmN0aW9uKHF1ZXJ5KSB7XHJcbiAgICByZXR1cm4gU1ZHLnNlbGVjdChxdWVyeSwgdGhpcy5ub2RlKVxyXG4gIH1cclxuXHJcbn0pXG5mdW5jdGlvbiBwYXRoUmVnUmVwbGFjZShhLCBiLCBjLCBkKSB7XHJcbiAgcmV0dXJuIGMgKyBkLnJlcGxhY2UoU1ZHLnJlZ2V4LmRvdHMsICcgLicpXHJcbn1cclxuXHJcbi8vIGNyZWF0ZXMgZGVlcCBjbG9uZSBvZiBhcnJheVxyXG5mdW5jdGlvbiBhcnJheV9jbG9uZShhcnIpe1xyXG4gIHZhciBjbG9uZSA9IGFyci5zbGljZSgwKVxyXG4gIGZvcih2YXIgaSA9IGNsb25lLmxlbmd0aDsgaS0tOyl7XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGNsb25lW2ldKSl7XHJcbiAgICAgIGNsb25lW2ldID0gYXJyYXlfY2xvbmUoY2xvbmVbaV0pXHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBjbG9uZVxyXG59XHJcblxyXG4vLyB0ZXN0cyBpZiBhIGdpdmVuIGVsZW1lbnQgaXMgaW5zdGFuY2Ugb2YgYW4gb2JqZWN0XHJcbmZ1bmN0aW9uIGlzKGVsLCBvYmope1xyXG4gIHJldHVybiBlbCBpbnN0YW5jZW9mIG9ialxyXG59XHJcblxyXG4vLyB0ZXN0cyBpZiBhIGdpdmVuIHNlbGVjdG9yIG1hdGNoZXMgYW4gZWxlbWVudFxyXG5mdW5jdGlvbiBtYXRjaGVzKGVsLCBzZWxlY3Rvcikge1xyXG4gIHJldHVybiAoZWwubWF0Y2hlcyB8fCBlbC5tYXRjaGVzU2VsZWN0b3IgfHwgZWwubXNNYXRjaGVzU2VsZWN0b3IgfHwgZWwubW96TWF0Y2hlc1NlbGVjdG9yIHx8IGVsLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fCBlbC5vTWF0Y2hlc1NlbGVjdG9yKS5jYWxsKGVsLCBzZWxlY3Rvcik7XHJcbn1cclxuXHJcbi8vIENvbnZlcnQgZGFzaC1zZXBhcmF0ZWQtc3RyaW5nIHRvIGNhbWVsQ2FzZVxyXG5mdW5jdGlvbiBjYW1lbENhc2Uocykge1xyXG4gIHJldHVybiBzLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvLSguKS9nLCBmdW5jdGlvbihtLCBnKSB7XHJcbiAgICByZXR1cm4gZy50b1VwcGVyQ2FzZSgpXHJcbiAgfSlcclxufVxyXG5cclxuLy8gQ2FwaXRhbGl6ZSBmaXJzdCBsZXR0ZXIgb2YgYSBzdHJpbmdcclxuZnVuY3Rpb24gY2FwaXRhbGl6ZShzKSB7XHJcbiAgcmV0dXJuIHMuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzLnNsaWNlKDEpXHJcbn1cclxuXHJcbi8vIEVuc3VyZSB0byBzaXgtYmFzZWQgaGV4XHJcbmZ1bmN0aW9uIGZ1bGxIZXgoaGV4KSB7XHJcbiAgcmV0dXJuIGhleC5sZW5ndGggPT0gNCA/XHJcbiAgICBbICcjJyxcclxuICAgICAgaGV4LnN1YnN0cmluZygxLCAyKSwgaGV4LnN1YnN0cmluZygxLCAyKVxyXG4gICAgLCBoZXguc3Vic3RyaW5nKDIsIDMpLCBoZXguc3Vic3RyaW5nKDIsIDMpXHJcbiAgICAsIGhleC5zdWJzdHJpbmcoMywgNCksIGhleC5zdWJzdHJpbmcoMywgNClcclxuICAgIF0uam9pbignJykgOiBoZXhcclxufVxyXG5cclxuLy8gQ29tcG9uZW50IHRvIGhleCB2YWx1ZVxyXG5mdW5jdGlvbiBjb21wVG9IZXgoY29tcCkge1xyXG4gIHZhciBoZXggPSBjb21wLnRvU3RyaW5nKDE2KVxyXG4gIHJldHVybiBoZXgubGVuZ3RoID09IDEgPyAnMCcgKyBoZXggOiBoZXhcclxufVxyXG5cclxuLy8gQ2FsY3VsYXRlIHByb3BvcnRpb25hbCB3aWR0aCBhbmQgaGVpZ2h0IHZhbHVlcyB3aGVuIG5lY2Vzc2FyeVxyXG5mdW5jdGlvbiBwcm9wb3J0aW9uYWxTaXplKGVsZW1lbnQsIHdpZHRoLCBoZWlnaHQpIHtcclxuICBpZiAod2lkdGggPT0gbnVsbCB8fCBoZWlnaHQgPT0gbnVsbCkge1xyXG4gICAgdmFyIGJveCA9IGVsZW1lbnQuYmJveCgpXHJcblxyXG4gICAgaWYgKHdpZHRoID09IG51bGwpXHJcbiAgICAgIHdpZHRoID0gYm94LndpZHRoIC8gYm94LmhlaWdodCAqIGhlaWdodFxyXG4gICAgZWxzZSBpZiAoaGVpZ2h0ID09IG51bGwpXHJcbiAgICAgIGhlaWdodCA9IGJveC5oZWlnaHQgLyBib3gud2lkdGggKiB3aWR0aFxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHdpZHRoOiAgd2lkdGhcclxuICAsIGhlaWdodDogaGVpZ2h0XHJcbiAgfVxyXG59XHJcblxyXG4vLyBEZWx0YSB0cmFuc2Zvcm0gcG9pbnRcclxuZnVuY3Rpb24gZGVsdGFUcmFuc2Zvcm1Qb2ludChtYXRyaXgsIHgsIHkpIHtcclxuICByZXR1cm4ge1xyXG4gICAgeDogeCAqIG1hdHJpeC5hICsgeSAqIG1hdHJpeC5jICsgMFxyXG4gICwgeTogeCAqIG1hdHJpeC5iICsgeSAqIG1hdHJpeC5kICsgMFxyXG4gIH1cclxufVxyXG5cclxuLy8gTWFwIG1hdHJpeCBhcnJheSB0byBvYmplY3RcclxuZnVuY3Rpb24gYXJyYXlUb01hdHJpeChhKSB7XHJcbiAgcmV0dXJuIHsgYTogYVswXSwgYjogYVsxXSwgYzogYVsyXSwgZDogYVszXSwgZTogYVs0XSwgZjogYVs1XSB9XHJcbn1cclxuXHJcbi8vIFBhcnNlIG1hdHJpeCBpZiByZXF1aXJlZFxyXG5mdW5jdGlvbiBwYXJzZU1hdHJpeChtYXRyaXgpIHtcclxuICBpZiAoIShtYXRyaXggaW5zdGFuY2VvZiBTVkcuTWF0cml4KSlcclxuICAgIG1hdHJpeCA9IG5ldyBTVkcuTWF0cml4KG1hdHJpeClcclxuXHJcbiAgcmV0dXJuIG1hdHJpeFxyXG59XHJcblxyXG4vLyBBZGQgY2VudHJlIHBvaW50IHRvIHRyYW5zZm9ybSBvYmplY3RcclxuZnVuY3Rpb24gZW5zdXJlQ2VudHJlKG8sIHRhcmdldCkge1xyXG4gIG8uY3ggPSBvLmN4ID09IG51bGwgPyB0YXJnZXQuYmJveCgpLmN4IDogby5jeFxyXG4gIG8uY3kgPSBvLmN5ID09IG51bGwgPyB0YXJnZXQuYmJveCgpLmN5IDogby5jeVxyXG59XHJcblxyXG4vLyBQYXRoQXJyYXkgSGVscGVyc1xyXG5mdW5jdGlvbiBhcnJheVRvU3RyaW5nKGEpIHtcclxuICBmb3IgKHZhciBpID0gMCwgaWwgPSBhLmxlbmd0aCwgcyA9ICcnOyBpIDwgaWw7IGkrKykge1xyXG4gICAgcyArPSBhW2ldWzBdXHJcblxyXG4gICAgaWYgKGFbaV1bMV0gIT0gbnVsbCkge1xyXG4gICAgICBzICs9IGFbaV1bMV1cclxuXHJcbiAgICAgIGlmIChhW2ldWzJdICE9IG51bGwpIHtcclxuICAgICAgICBzICs9ICcgJ1xyXG4gICAgICAgIHMgKz0gYVtpXVsyXVxyXG5cclxuICAgICAgICBpZiAoYVtpXVszXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICBzICs9ICcgJ1xyXG4gICAgICAgICAgcyArPSBhW2ldWzNdXHJcbiAgICAgICAgICBzICs9ICcgJ1xyXG4gICAgICAgICAgcyArPSBhW2ldWzRdXHJcblxyXG4gICAgICAgICAgaWYgKGFbaV1bNV0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBzICs9ICcgJ1xyXG4gICAgICAgICAgICBzICs9IGFbaV1bNV1cclxuICAgICAgICAgICAgcyArPSAnICdcclxuICAgICAgICAgICAgcyArPSBhW2ldWzZdXHJcblxyXG4gICAgICAgICAgICBpZiAoYVtpXVs3XSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgcyArPSAnICdcclxuICAgICAgICAgICAgICBzICs9IGFbaV1bN11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHMgKyAnICdcclxufVxyXG5cclxuLy8gRGVlcCBuZXcgaWQgYXNzaWdubWVudFxyXG5mdW5jdGlvbiBhc3NpZ25OZXdJZChub2RlKSB7XHJcbiAgLy8gZG8gdGhlIHNhbWUgZm9yIFNWRyBjaGlsZCBub2RlcyBhcyB3ZWxsXHJcbiAgZm9yICh2YXIgaSA9IG5vZGUuY2hpbGROb2Rlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSlcclxuICAgIGlmIChub2RlLmNoaWxkTm9kZXNbaV0gaW5zdGFuY2VvZiB3aW5kb3cuU1ZHRWxlbWVudClcclxuICAgICAgYXNzaWduTmV3SWQobm9kZS5jaGlsZE5vZGVzW2ldKVxyXG5cclxuICByZXR1cm4gU1ZHLmFkb3B0KG5vZGUpLmlkKFNWRy5laWQobm9kZS5ub2RlTmFtZSkpXHJcbn1cclxuXHJcbi8vIEFkZCBtb3JlIGJvdW5kaW5nIGJveCBwcm9wZXJ0aWVzXHJcbmZ1bmN0aW9uIGZ1bGxCb3goYikge1xyXG4gIGlmIChiLnggPT0gbnVsbCkge1xyXG4gICAgYi54ICAgICAgPSAwXHJcbiAgICBiLnkgICAgICA9IDBcclxuICAgIGIud2lkdGggID0gMFxyXG4gICAgYi5oZWlnaHQgPSAwXHJcbiAgfVxyXG5cclxuICBiLncgID0gYi53aWR0aFxyXG4gIGIuaCAgPSBiLmhlaWdodFxyXG4gIGIueDIgPSBiLnggKyBiLndpZHRoXHJcbiAgYi55MiA9IGIueSArIGIuaGVpZ2h0XHJcbiAgYi5jeCA9IGIueCArIGIud2lkdGggLyAyXHJcbiAgYi5jeSA9IGIueSArIGIuaGVpZ2h0IC8gMlxyXG5cclxuICByZXR1cm4gYlxyXG59XHJcblxyXG4vLyBHZXQgaWQgZnJvbSByZWZlcmVuY2Ugc3RyaW5nXHJcbmZ1bmN0aW9uIGlkRnJvbVJlZmVyZW5jZSh1cmwpIHtcclxuICB2YXIgbSA9IHVybC50b1N0cmluZygpLm1hdGNoKFNWRy5yZWdleC5yZWZlcmVuY2UpXHJcblxyXG4gIGlmIChtKSByZXR1cm4gbVsxXVxyXG59XHJcblxyXG4vLyBDcmVhdGUgbWF0cml4IGFycmF5IGZvciBsb29waW5nXHJcbnZhciBhYmNkZWYgPSAnYWJjZGVmJy5zcGxpdCgnJylcbi8vIEFkZCBDdXN0b21FdmVudCB0byBJRTkgYW5kIElFMTBcclxuaWYgKHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgIT09ICdmdW5jdGlvbicpIHtcclxuICAvLyBDb2RlIGZyb206IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DdXN0b21FdmVudFxyXG4gIHZhciBDdXN0b21FdmVudCA9IGZ1bmN0aW9uKGV2ZW50LCBvcHRpb25zKSB7XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7IGJ1YmJsZXM6IGZhbHNlLCBjYW5jZWxhYmxlOiBmYWxzZSwgZGV0YWlsOiB1bmRlZmluZWQgfVxyXG4gICAgdmFyIGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKVxyXG4gICAgZS5pbml0Q3VzdG9tRXZlbnQoZXZlbnQsIG9wdGlvbnMuYnViYmxlcywgb3B0aW9ucy5jYW5jZWxhYmxlLCBvcHRpb25zLmRldGFpbClcclxuICAgIHJldHVybiBlXHJcbiAgfVxyXG5cclxuICBDdXN0b21FdmVudC5wcm90b3R5cGUgPSB3aW5kb3cuRXZlbnQucHJvdG90eXBlXHJcblxyXG4gIHdpbmRvdy5DdXN0b21FdmVudCA9IEN1c3RvbUV2ZW50XHJcbn1cclxuXHJcbi8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSAvIGNhbmNlbEFuaW1hdGlvbkZyYW1lIFBvbHlmaWxsIHdpdGggZmFsbGJhY2sgYmFzZWQgb24gUGF1bCBJcmlzaFxyXG4oZnVuY3Rpb24odykge1xyXG4gIHZhciBsYXN0VGltZSA9IDBcclxuICB2YXIgdmVuZG9ycyA9IFsnbW96JywgJ3dlYmtpdCddXHJcblxyXG4gIGZvcih2YXIgeCA9IDA7IHggPCB2ZW5kb3JzLmxlbmd0aCAmJiAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKyt4KSB7XHJcbiAgICB3LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdbdmVuZG9yc1t4XSArICdSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXVxyXG4gICAgdy5jYW5jZWxBbmltYXRpb25GcmFtZSAgPSB3W3ZlbmRvcnNbeF0gKyAnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXSB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3W3ZlbmRvcnNbeF0gKyAnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ11cclxuICB9XHJcblxyXG4gIHcucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuICAgIGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgIHZhciBjdXJyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXHJcbiAgICAgIHZhciB0aW1lVG9DYWxsID0gTWF0aC5tYXgoMCwgMTYgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpXHJcblxyXG4gICAgICB2YXIgaWQgPSB3LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKVxyXG4gICAgICB9LCB0aW1lVG9DYWxsKVxyXG5cclxuICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGxcclxuICAgICAgcmV0dXJuIGlkXHJcbiAgICB9XHJcblxyXG4gIHcuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSB3LmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHcuY2xlYXJUaW1lb3V0O1xyXG5cclxufSh3aW5kb3cpKVxyXG5cclxucmV0dXJuIFNWR1xyXG5cclxufSkpO1xyIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuL3N0eWxlJztcbmltcG9ydCB7IG1ha2VpZCB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBlbGVtZW50VHlwZSwgUG9pbnQyRCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5cbmxldCBkZWZhdWx0X2NpcmNsZV9yYWRpdXMgPSAxMDtcblxuZXhwb3J0IGNsYXNzIENpcmNsZSB7XG4gIF9pZDogc3RyaW5nO1xuICBfdHlwZTogZWxlbWVudFR5cGU7XG4gIG1ldGE6IGFueTtcbiAgY3g6IG51bWJlcjtcbiAgY3k6IG51bWJlcjtcbiAgcmFkaXVzOiBudW1iZXI7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGNvbG9yczogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGN4OiBudW1iZXIsIGN5OiBudW1iZXIsIHJhZGl1czogbnVtYmVyLCBpZD86IHN0cmluZywgX2NvbG9ycz86IGFueSl7XG4gICAgdGhpcy5faWQgPSBpZCB8fCBtYWtlaWQoKTtcbiAgICB0aGlzLl90eXBlID0gZWxlbWVudFR5cGUuQ2lyY2xlO1xuICAgIHRoaXMubWV0YSA9IHt9O1xuICAgIHRoaXMuY3ggPSBjeDtcbiAgICB0aGlzLmN5ID0gY3k7XG4gICAgdGhpcy5yYWRpdXMgPSByYWRpdXMgfHwgZGVmYXVsdF9jaXJjbGVfcmFkaXVzO1xuICAgIHRoaXMud2lkdGggPSB0aGlzLnJhZGl1cyAvIDg7XG4gICAgdGhpcy5jb2xvcnMgPSBfY29sb3JzIHx8IGNvbG9ycztcbiAgfVxuXG4gIGdldENvbG9ycygpe1xuICAgIHJldHVybiB0aGlzLmNvbG9ycztcbiAgfVxuXG4gIHNldElkKGlkOiBzdHJpbmcpe1xuICAgIHRoaXMuX2lkID0gaWQ7XG4gIH1cblxuICBnZXQyRENlbnRlcigpIHtcbiAgICByZXR1cm4gbmV3IFBvaW50MkQodGhpcy5jeCwgdGhpcy5jeSk7XG4gIH1cblxuICBtb3ZlKHBvaW50czogUG9pbnQyRFtdKXtcbiAgICB0aGlzLmN4ID0gcG9pbnRzWzBdLng7XG4gICAgdGhpcy5jeSA9IHBvaW50c1swXS55O1xuICB9XG5cbiAgZ2V0V2lkdGgoKXtcbiAgICByZXR1cm4gdGhpcy53aWR0aDtcbiAgfVxuXG4gIGdldDJEUGF0aCgpe1xuICAgIHZhciBwYXRoOiBQb2ludDJEW10gPSBbXTtcbiAgICBwYXRoLnB1c2goXG4gICAgICBuZXcgUG9pbnQyRCh0aGlzLmN4LCB0aGlzLmN5KVxuICAgICk7XG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBnZXRSYWRpdXMoKXtcbiAgICByZXR1cm4gdGhpcy5yYWRpdXM7XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuZXhwb3J0IGNsYXNzIFBvaW50MkQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcblxuICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlcil7XG4gICAgdGhpcy54ID0geCB8fCAwO1xuICAgIHRoaXMueSA9IHkgfHwgMDtcbiAgfVxuXG4gIGFkZCA9IGZ1bmN0aW9uIChwb2ludDogUG9pbnQyRCkge1xuICAgICAgcmV0dXJuIG5ldyBQb2ludDJEKHRoaXMueCArIHBvaW50LngsIHRoaXMueSArIHBvaW50LnkpO1xuICB9O1xuXG4gIHN1YnRyYWN0ID0gZnVuY3Rpb24gKHBvaW50OiBQb2ludDJEKSB7XG4gICAgICByZXR1cm4gbmV3IFBvaW50MkQodGhpcy54IC0gcG9pbnQueCwgdGhpcy55IC0gcG9pbnQueSk7XG4gIH07XG5cbiAgbXVsdGlwbHkgPSBmdW5jdGlvbiAocG9pbnQ6IFBvaW50MkQpIHtcbiAgICAgIHJldHVybiBuZXcgUG9pbnQyRCh0aGlzLnggKiBwb2ludC54LCB0aGlzLnkgKiBwb2ludC55KTtcbiAgfTtcblxuICBtdWx0aXBseVNjYWxhciA9IGZ1bmN0aW9uIChzY2FsYXI6IG51bWJlcikge1xuICAgICAgcmV0dXJuIG5ldyBQb2ludDJEKHRoaXMueCAqIHNjYWxhciwgdGhpcy55ICogc2NhbGFyKTtcbiAgfTtcblxuICBkaXZpZGUgPSBmdW5jdGlvbiAocG9pbnQ6IFBvaW50MkQpIHtcbiAgICAgIHJldHVybiBuZXcgUG9pbnQyRCh0aGlzLnggLyBwb2ludC54LCB0aGlzLnkgLyBwb2ludC55KTtcbiAgfTtcblxuICBkaXZpZGVTY2FsYXIgPSBmdW5jdGlvbiAoc2NhbGFyOiBudW1iZXIpIHtcbiAgICAgIHJldHVybiBuZXcgUG9pbnQyRCh0aGlzLnggLyBzY2FsYXIsIHRoaXMueSAvIHNjYWxhcik7XG4gIH07XG5cbiAgbGVuZ3RoID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIE1hdGguc3FydChNYXRoLnBvdyh0aGlzLngsIDIpICsgTWF0aC5wb3codGhpcy55LCAyKSk7XG4gIH07XG5cbiAgbm9ybWFsaXplID0gZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZGl2aWRlU2NhbGFyKHRoaXMubGVuZ3RoKCkpO1xuICB9O1xufVxuXG5leHBvcnQgY2xhc3MgUG9pbnQzRCB7XG4gIHg6IG51bWJlcjtcbiAgeTogbnVtYmVyO1xuICB6OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcil7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xuICAgIHRoaXMueiA9IHo7XG4gIH1cbn1cblxuZXhwb3J0IGVudW0gZWxlbWVudFR5cGUge1xuICBDaXJjbGUsXG4gIExpbmVcbn1cblxuZXhwb3J0IGludGVyZmFjZSBlbGVtZW50IHtcbiAgX2lkOiBzdHJpbmc7XG4gIF90eXBlOiBlbGVtZW50VHlwZTtcbiAgc2V0SWQ/OiAoXzpzdHJpbmcpID0+IGFueTtcbiAgbWV0YTogYW55O1xuXG4gIGdldFJhZGl1cz86ICgpID0+IG51bWJlcjtcbiAgZ2V0MkRQYXRoPzogKCkgPT4gUG9pbnQyRFtdO1xuICBnZXQyRENlbnRlcj86ICgpID0+IFBvaW50MkQ7XG4gIGdldFdpZHRoPzogKCkgPT4gbnVtYmVyO1xuICBnZXRDb2xvcnM6ICgpID0+IGFueTtcblxuICBtb3ZlPzogKF86UG9pbnQyRFtdKSA9PiBhbnk7XG59XG4iLCJleHBvcnQgZnVuY3Rpb24gbWFrZWlkKCkge1xuICB2YXIgdGV4dCA9IFwiXCI7XG4gIHZhciBwb3NzaWJsZSA9IFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODlcIjtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IDU7IGkrKyl7XG4gICAgdGV4dCArPSBwb3NzaWJsZS5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGUubGVuZ3RoKSk7XG4gIH1cblxuICByZXR1cm4gdGV4dDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEaWN0aW9uYXJ5PFQ+IHtcbiAgICBbSzogc3RyaW5nXTogVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhbmRvbUFyYml0cmFyeShtaW46IG51bWJlciwgbWF4OiBudW1iZXIpIHtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmFuZG9tSW50KG1pbjogbnVtYmVyLCBtYXg6IG51bWJlcikge1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGlja1JhbmRvbUZyb21BcnJheShhcnJheTogYW55W10pIHtcbiAgcmV0dXJuIGFycmF5W01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGFycmF5Lmxlbmd0aCldO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgeyBjb2xvcnMgfSBmcm9tICcuL3N0eWxlJztcbmltcG9ydCB7IG1ha2VpZCB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBlbGVtZW50VHlwZSwgUG9pbnQyRCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5cbmxldCBkZWZhdWx0X2xpbmVfd2lkdGggPSAxO1xuXG5leHBvcnQgY2xhc3MgTGluZSB7XG4gIF9pZDogc3RyaW5nO1xuICBfdHlwZTogZWxlbWVudFR5cGU7XG4gIG1ldGE6IGFueTtcbiAgeDE6IG51bWJlcjtcbiAgeTE6IG51bWJlcjtcbiAgeDI6IG51bWJlcjtcbiAgeTI6IG51bWJlcjtcbiAgd2lkdGg6IG51bWJlcjtcbiAgY29sb3JzOiBhbnk7XG5cbiAgY29uc3RydWN0b3IoeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaWQ/OnN0cmluZywgX2NvbG9ycz86IGFueSl7XG4gICAgdGhpcy5faWQgPSBpZCB8fCBtYWtlaWQoKTtcbiAgICB0aGlzLl90eXBlID0gZWxlbWVudFR5cGUuTGluZTtcbiAgICB0aGlzLm1ldGEgPSB7fTtcbiAgICB0aGlzLngxID0geDE7XG4gICAgdGhpcy55MSA9IHkxO1xuICAgIHRoaXMueDIgPSB4MjtcbiAgICB0aGlzLnkyID0geTI7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoIHx8IGRlZmF1bHRfbGluZV93aWR0aDtcbiAgICB0aGlzLmNvbG9ycyA9IF9jb2xvcnMgfHwgY29sb3JzO1xuICB9XG5cbiAgZ2V0Q29sb3JzKCl7XG4gICAgcmV0dXJuIHRoaXMuY29sb3JzO1xuICB9XG5cbiAgc2V0SWQoaWQ6IHN0cmluZyl7XG4gICAgdGhpcy5faWQgPSBpZDtcbiAgfVxuXG4gIGdldDJEQ2VudGVyKCkge1xuICAgIHJldHVybiBuZXcgUG9pbnQyRChcbiAgICAgICh0aGlzLngyICsgdGhpcy54MSkvMixcbiAgICAgICh0aGlzLnkyICsgdGhpcy55MSkvMlxuICAgICk7XG4gIH1cblxuICBtb3ZlKHBvaW50czogUG9pbnQyRFtdKXtcbiAgICB0aGlzLngxID0gcG9pbnRzWzBdLng7XG4gICAgdGhpcy55MSA9IHBvaW50c1swXS55O1xuICAgIHRoaXMueDIgPSBwb2ludHNbMV0ueDtcbiAgICB0aGlzLnkyID0gcG9pbnRzWzFdLnk7XG4gIH1cblxuICBnZXRXaWR0aCgpe1xuICAgIHJldHVybiB0aGlzLndpZHRoO1xuICB9XG5cbiAgZ2V0MkRQYXRoKCl7XG4gICAgdmFyIHBhdGg6IFBvaW50MkRbXSA9IFtdO1xuICAgIHBhdGgucHVzaChcbiAgICAgIG5ldyBQb2ludDJEKHRoaXMueDEsIHRoaXMueTEpXG4gICAgKTtcbiAgICBwYXRoLnB1c2goXG4gICAgICBuZXcgUG9pbnQyRCh0aGlzLngyLCB0aGlzLnkyKVxuICAgIClcblxuICAgIHJldHVybiBwYXRoO1xuICB9XG5cbiAgZ2V0UmFkaXVzKCl7XG4gICAgcmV0dXJuIE1hdGguc3FydChcbiAgICAgICh0aGlzLnkxIC0gdGhpcy55MikqKjIgK1xuICAgICAgKHRoaXMueDIgLSB0aGlzLngyKSoqMlxuICAgICk7XG4gIH1cbn1cbiIsImltcG9ydCB7IFNjZW5lIH0gZnJvbSAnLi9zY2VuZSc7XG5pbXBvcnQgeyBSb2NrZXQgfSBmcm9tICcuL3JvY2tldCc7XG5pbXBvcnQgeyBQb2ludDJEIH0gZnJvbSAnLi9jbGFzc2VzJztcblxubGV0IHdpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG5sZXQgaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xubGV0IG1pbl9zaWRlID0gTWF0aC5taW4od2lkdGgsIGhlaWdodCk7XG5cbmZ1bmN0aW9uIHNldFVwKHNjZW5lOiBTY2VuZSl7XG4gIGxldCBzdW4gPSBzY2VuZS5hZGRFbGVtZW50KFxuICAgICdjaXJjbGUnLFxuICAgIHtcbiAgICAgICdjeCc6IHdpZHRoIC8gMixcbiAgICAgICdjeSc6IG1pbl9zaWRlIC8gMixcbiAgICAgICdyYWRpdXMnOiBtaW5fc2lkZSAvIDhcbiAgICB9XG4gICk7XG4gIGxldCBzdW5fY2VudGVyID0gc3VuLmdldDJEQ2VudGVyKCk7XG4gIGxldCBzdW5fcmFkaXVzID0gc3VuLmdldFJhZGl1cygpO1xuXG4gIGxldCBkZXN0aW5hdGlvbl9yYWRpdXMgPSBzdW5fcmFkaXVzIC8gNTtcbiAgbGV0IGRlc3RpbmF0aW9uID0gc2NlbmUuYWRkRWxlbWVudChcbiAgICAnY2lyY2xlJyxcbiAgICB7XG4gICAgICAnY3gnOiBzdW5fY2VudGVyLnggKyBzdW5fcmFkaXVzICsgZGVzdGluYXRpb25fcmFkaXVzLFxuICAgICAgJ2N5Jzogc3VuX2NlbnRlci55ICsgc3VuX3JhZGl1cyArIGRlc3RpbmF0aW9uX3JhZGl1cyxcbiAgICAgICdyYWRpdXMnOiBkZXN0aW5hdGlvbl9yYWRpdXNcbiAgICB9XG4gICk7XG5cbiAgbGV0IG9yaWdpbl9yYWRpdXMgPSBzdW5fcmFkaXVzIC8gMztcbiAgbGV0IG9yaWdpbiA9IHNjZW5lLmFkZEVsZW1lbnQoXG4gICAgJ2NpcmNsZScsXG4gICAge1xuICAgICAgJ2N4Jzogc3VuX2NlbnRlci54IC0gc3VuX3JhZGl1cyAtIG9yaWdpbl9yYWRpdXMsXG4gICAgICAnY3knOiBzdW5fY2VudGVyLnkgLSBzdW5fcmFkaXVzIC0gb3JpZ2luX3JhZGl1cyxcbiAgICAgICdyYWRpdXMnOiBvcmlnaW5fcmFkaXVzXG4gICAgfVxuICApO1xuXG4gIHNjZW5lLm9yaWdpbiA9IG9yaWdpbjtcbiAgc2NlbmUuZGVzdGluYXRpb24gPSBkZXN0aW5hdGlvbjtcblxuICBzY2VuZS5yZW5kZXIoNTApO1xuICBzY2VuZS5zdGFydEFjdGl2aXR5KFxuICAgIDUwXG4gICk7XG4gIHNjZW5lLnN0YXJ0Um9ja2V0cyhcbiAgICA1MFxuICApO1xufVxuXG5sZXQgc2NlbmUgPSBuZXcgU2NlbmUoXG4gIHdpZHRoLFxuICBoZWlnaHQsXG4gIHNldFVwXG4pXG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IGdldFJhbmRvbUludCwgZ2V0UmFuZG9tQXJiaXRyYXJ5LCBwaWNrUmFuZG9tRnJvbUFycmF5IH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IFBvaW50MkQsIGVsZW1lbnQgfSBmcm9tICcuL2NsYXNzZXMnO1xuaW1wb3J0IHsgTGluZSB9IGZyb20gJy4vbGluZSc7XG5pbXBvcnQgeyBSb3V0aW5lIH0gZnJvbSAnLi9yb3V0aW5lcyc7XG5cbmV4cG9ydCBjbGFzcyBSb2NrZXQgZXh0ZW5kcyBMaW5lIHtcbiAgdmVsb2NpdHk6IG51bWJlcltdO1xuICBhY2NlbGVyYXRpb246IG51bWJlcltdO1xuICByb3V0aW5lOiBSb3V0aW5lO1xuICBjb3VudDogbnVtYmVyO1xuXG4gIGhhc19sYW5kZWQ6IHRydWU7XG4gIGlzX2FsaXZlOiBib29sZWFuO1xuICBhbGl2ZV9yYWRpdXM6IG51bWJlcjtcblxuICBvcmlnaW46IGVsZW1lbnQ7XG4gIGRlc3RpbmF0aW9uOiBlbGVtZW50O1xuXG4gIGRpc3RhbmNlX3RvX2Rlc3RpbmF0aW9uOiBudW1iZXI7XG4gIC8vIFNjb3JlIHRvIHN1cnZpdmUgaW4gbmF0dXJhbCBzZWxlY3Rpb25cbiAgc2VsZWN0aW9uX3Njb3JlOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgb3JpZ2luOiBlbGVtZW50LFxuICAgIGRlc3RpbmF0aW9uOiBlbGVtZW50LFxuICAgIGhlaWdodDogbnVtYmVyLFxuICAgIHJvdXRpbmU/OiBSb3V0aW5lXG4gICl7XG4gICAgbGV0IG9yaWdpbl9wb2ludCA9IG9yaWdpbi5nZXQyRENlbnRlcigpO1xuICAgIGxldCBvcmlnaW5fcmFkaXVzID0gb3JpZ2luLmdldFJhZGl1cygpO1xuICAgIGxldCBkZXN0aW5hdGlvbl9wb2ludCA9IGRlc3RpbmF0aW9uLmdldDJEQ2VudGVyKCk7XG4gICAgbGV0IGRlc3RpbmF0aW9uX3JhZGl1cyA9IGRlc3RpbmF0aW9uLmdldFJhZGl1cygpO1xuXG4gICAgc3VwZXIoXG4gICAgICBvcmlnaW5fcG9pbnQueCArIG9yaWdpbl9yYWRpdXMsXG4gICAgICBvcmlnaW5fcG9pbnQueSArIG9yaWdpbl9yYWRpdXMsXG4gICAgICBvcmlnaW5fcG9pbnQueCArIG9yaWdpbl9yYWRpdXMgKyBoZWlnaHQsXG4gICAgICBvcmlnaW5fcG9pbnQueSArIG9yaWdpbl9yYWRpdXMsXG4gICAgICBoZWlnaHRcbiAgICApO1xuXG4gICAgdGhpcy5zZWxlY3Rpb25fc2NvcmUgPSAwO1xuICAgIHRoaXMuaXNfYWxpdmUgPSB0cnVlO1xuICAgIHRoaXMub3JpZ2luID0gb3JpZ2luO1xuICAgIHRoaXMuZGVzdGluYXRpb24gPSBkZXN0aW5hdGlvbjtcbiAgICB0aGlzLmNvdW50ID0gMDtcbiAgICBpZihyb3V0aW5lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucm91dGluZSA9IG5ldyBSb3V0aW5lKCk7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLnJvdXRpbmUgPSByb3V0aW5lO1xuICAgIH1cblxuICAgIHRoaXMuYWxpdmVfcmFkaXVzID0gTWF0aC5zcXJ0KFxuICAgICAgKG9yaWdpbl9wb2ludC55IC0gZGVzdGluYXRpb25fcG9pbnQueSkqKjIgK1xuICAgICAgKG9yaWdpbl9wb2ludC54IC0gZGVzdGluYXRpb25fcG9pbnQueCkqKjJcbiAgICApICogMS41O1xuXG4gICAgdGhpcy5kaXN0YW5jZV90b19kZXN0aW5hdGlvbiA9IE1hdGguc3FydChcbiAgICAgIChvcmlnaW5fcG9pbnQueSAtIGRlc3RpbmF0aW9uX3BvaW50LnkpKioyICtcbiAgICAgIChvcmlnaW5fcG9pbnQueCAtIGRlc3RpbmF0aW9uX3BvaW50LngpKioyXG4gICAgKTtcblxuICAgIC8vIFgsIFlcbiAgICB0aGlzLnZlbG9jaXR5ID0gWzAsIDBdXG4gICAgdGhpcy5hY2NlbGVyYXRpb24gPSBbMCwgMF07XG4gIH1cblxuICBjcmFzaChlbDogZWxlbWVudCl7XG4gICAgaWYoZWwgPT09IHRoaXMuZGVzdGluYXRpb24pe1xuICAgICAgdGhpcy5oYXNfbGFuZGVkID0gdHJ1ZTtcbiAgICAgIHRoaXMuaXNfYWxpdmUgPSB0cnVlO1xuICAgIH1lbHNle1xuICAgICAgdGhpcy5pc19hbGl2ZSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5Rm9yY2UoZm9yY2U6IFBvaW50MkQpe1xuICAgIHRoaXMuYWNjZWxlcmF0aW9uWzBdICs9IGZvcmNlLng7XG4gICAgdGhpcy5hY2NlbGVyYXRpb25bMV0gKz0gZm9yY2UueTtcbiAgfVxuXG4gIGNhbGN1bGF0ZVNjb3JlKCl7XG4gICAgdGhpcy5zZWxlY3Rpb25fc2NvcmUgPSAxL3RoaXMuZGlzdGFuY2VfdG9fZGVzdGluYXRpb247XG4gIH1cblxuICB1cGRhdGUoKXtcbiAgICBpZighdGhpcy5oYXNfbGFuZGVkKXtcbiAgICAgIGlmKHRoaXMucm91dGluZS5wb2ludHMubGVuZ3RoID4gdGhpcy5jb3VudCl7XG4gICAgICAgIHRoaXMuYXBwbHlGb3JjZShcbiAgICAgICAgICB0aGlzLnJvdXRpbmUucG9pbnRzW3RoaXMuY291bnRdXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgIH1lbHNle1xuICAgICAgICB0aGlzLmlzX2FsaXZlID0gZmFsc2VcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGxldCBkZXN0aW5hdGlvbl9jZW50ZXIgPSB0aGlzLmRlc3RpbmF0aW9uLmdldDJEQ2VudGVyKCk7XG4gICAgICBsZXQgZGVzdGluYXRpb25fcmFkaXVzID0gdGhpcy5kZXN0aW5hdGlvbi5nZXRSYWRpdXMoKTtcblxuICAgICAgbGV0IGF3YXlfZnJvbV9kZXN0aW5hdGlvbiA9IE1hdGguc3FydChcbiAgICAgICAgKHRoaXMueTEgLSBkZXN0aW5hdGlvbl9jZW50ZXIueSkqKjIgK1xuICAgICAgICAodGhpcy54MSAtIGRlc3RpbmF0aW9uX2NlbnRlci54KSoqMlxuICAgICAgKTtcbiAgICAgIGlmKGF3YXlfZnJvbV9kZXN0aW5hdGlvbiA8IHRoaXMuZGlzdGFuY2VfdG9fZGVzdGluYXRpb24pIHtcbiAgICAgICAgdGhpcy5kaXN0YW5jZV90b19kZXN0aW5hdGlvbiA9IGF3YXlfZnJvbV9kZXN0aW5hdGlvbjtcbiAgICAgIH1cblxuICAgICAgLy8gaWYoYXdheV9mcm9tX2Rlc3RpbmF0aW9uIDw9IGRlc3RpbmF0aW9uX3JhZGl1cyl7XG4gICAgICAvLyAgIHRoaXMuaGFzX2xhbmRlZCA9IHRydWU7XG4gICAgICAvLyB9ZWxzZXtcbiAgICAgICAgLy8gQ2hlY2sgaWYgd2UgYXJlIGZ1cnRoZXIgdGhhbiBgdGhpcy5hbGl2ZV9yYWRpdXNgXG4gICAgICAgIGxldCBvcmlnaW5fY2VudGVyID0gdGhpcy5vcmlnaW4uZ2V0MkRDZW50ZXIoKTtcbiAgICAgICAgbGV0IG9yaWdpbl9yYWRpdXMgPSB0aGlzLm9yaWdpbi5nZXRSYWRpdXMoKTtcblxuICAgICAgICBsZXQgYXdheV9mcm9tX29yaWdpbiA9IE1hdGguc3FydChcbiAgICAgICAgICAodGhpcy55MSAtIG9yaWdpbl9jZW50ZXIueSkqKjIgK1xuICAgICAgICAgICh0aGlzLngxIC0gb3JpZ2luX2NlbnRlci54KSoqMlxuICAgICAgICApO1xuICAgICAgICB0aGlzLmlzX2FsaXZlID0gYXdheV9mcm9tX29yaWdpbiA8PSB0aGlzLmFsaXZlX3JhZGl1cztcblxuICAgICAgICBpZih0aGlzLmlzX2FsaXZlKXtcbiAgICAgICAgICB0aGlzLnZlbG9jaXR5ID0gdGhpcy52ZWxvY2l0eS5tYXAoXG4gICAgICAgICAgICAoYSwgaSkgPT4gYSArIHRoaXMuYWNjZWxlcmF0aW9uW2ldXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHRoaXMueDEgKz0gdGhpcy52ZWxvY2l0eVswXTtcbiAgICAgICAgICB0aGlzLnkxICs9IHRoaXMudmVsb2NpdHlbMV07XG4gICAgICAgICAgdGhpcy54MiArPSB0aGlzLnZlbG9jaXR5WzBdO1xuICAgICAgICAgIHRoaXMueTIgKz0gdGhpcy52ZWxvY2l0eVsxXTtcbiAgICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IFswLCAwXTtcbiAgICAgICAgfVxuICAgICAgLy8gfVxuXG4gICAgICB0aGlzLmNhbGN1bGF0ZVNjb3JlKCk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgeyBtYWtlaWQsIGdldFJhbmRvbUludCwgZ2V0UmFuZG9tQXJiaXRyYXJ5IH0gZnJvbSAnLi9oZWxwZXJzJztcbmltcG9ydCB7IFBvaW50MkQgfSBmcm9tICcuL2NsYXNzZXMnO1xuXG5sZXQgbWF4X3BvaW50cyA9IDMwMDtcblxuZXhwb3J0IGNsYXNzIFJvdXRpbmUge1xuICBfaWQ6IHN0cmluZztcbiAgcG9pbnRzOiBQb2ludDJEW107XG5cbiAgY29uc3RydWN0b3IocG9pbnRzPzogUG9pbnQyRFtdKXtcbiAgICB0aGlzLl9pZCA9IG1ha2VpZCgpO1xuICAgIHRoaXMucG9pbnRzID0gW107XG5cbiAgICBpZihwb2ludHMgPT09IHVuZGVmaW5lZCl7XG4gICAgICBmb3IobGV0IGkgPSAwOyBpIDwgbWF4X3BvaW50czsgaSsrKXtcbiAgICAgICAgdGhpcy5wb2ludHNbaV0gPSBuZXcgUG9pbnQyRChcbiAgICAgICAgICBnZXRSYW5kb21BcmJpdHJhcnkoLTEsIDEpLFxuICAgICAgICAgIGdldFJhbmRvbUFyYml0cmFyeSgtMSwgMSksXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9ZWxzZXtcbiAgICAgIHRoaXMucG9pbnRzID0gcG9pbnRzO1xuICAgIH1cbiAgfVxuXG4gIGNyb3NzT3Zlcihyb3V0aW5lOiBSb3V0aW5lKXtcbiAgICB2YXIgbmV3X3BvaW50cyA9IFtdO1xuXG4gICAgbGV0IHJhbmRfcG9pbnQgPSBnZXRSYW5kb21JbnQoMCwgcm91dGluZS5wb2ludHMubGVuZ3RoKVxuICAgIGZvcihsZXQgaSA9IDA7IGkgPCByb3V0aW5lLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYoIGkgPiByYW5kX3BvaW50ICl7XG4gICAgICAgIG5ld19wb2ludHNbaV0gPSB0aGlzLnBvaW50c1tpXTtcbiAgICAgIH1lbHNle1xuICAgICAgICBuZXdfcG9pbnRzW2ldID0gcm91dGluZS5wb2ludHNbaV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBSb3V0aW5lKG5ld19wb2ludHMpO1xuICB9XG5cbiAgbXV0YXRlKCl7XG4gICAgbGV0IG11dGF0aW9uX3JhdGUgPSAwLjAxO1xuICAgIGZvcihsZXQgaSA9IDA7IGkgPCB0aGlzLnBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYoZ2V0UmFuZG9tQXJiaXRyYXJ5KDAsIDEpIDwgbXV0YXRpb25fcmF0ZSl7XG4gICAgICAgIHRoaXMucG9pbnRzW2ldID0gbmV3IFBvaW50MkQoXG4gICAgICAgICAgZ2V0UmFuZG9tQXJiaXRyYXJ5KC0xLCAxKSxcbiAgICAgICAgICBnZXRSYW5kb21BcmJpdHJhcnkoLTEsIDEpLFxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoID1cIi4uL25vZGVfbW9kdWxlcy9AdHlwZXMvanF1ZXJ5L2luZGV4LmQudHNcIi8+XG5cbmltcG9ydCAqIGFzIFNWRyBmcm9tIFwic3ZnLmpzXCI7XG5cbid1c2Ugc3RyaWN0JztcbmltcG9ydCB7IERpY3Rpb25hcnksIG1ha2VpZCwgcGlja1JhbmRvbUZyb21BcnJheSB9IGZyb20gJy4vaGVscGVycyc7XG5pbXBvcnQgeyBlbGVtZW50LCBlbGVtZW50VHlwZSwgUG9pbnQyRCB9IGZyb20gJy4vY2xhc3Nlcyc7XG5pbXBvcnQgeyBDaXJjbGUgfSBmcm9tICcuL2NpcmNsZSc7XG5pbXBvcnQgeyBMaW5lIH0gZnJvbSAnLi9saW5lJztcbmltcG9ydCB7IFJvY2tldCB9IGZyb20gJy4vcm9ja2V0JztcbmltcG9ydCB7IFJvdXRpbmUgfSBmcm9tICcuL3JvdXRpbmVzJztcblxuZXhwb3J0IGNsYXNzIFNjZW5lIHtcbiAgY2FudmFzOiBzdmdqcy5Db250YWluZXI7XG4gIGVsZW1lbnRzOiBlbGVtZW50W107XG4gIHN2Z19lbGVtZW50czogRGljdGlvbmFyeTxzdmdqcy5FbGVtZW50PjtcbiAgcm9ja2V0czogUm9ja2V0W107XG5cbiAgLy8gR2VuZXJhdGlvbiBJbmZvcm1hdGlvblxuICBvcmlnaW46IGVsZW1lbnQ7XG4gIGRlc3RpbmF0aW9uOiBlbGVtZW50O1xuICB0ZXh0X2VsZW1lbnQ6IHN2Z2pzLlRleHQ7XG4gIGdlbmVyYXRpb25faW5mbzogYW55W107XG5cbiAgLy8gVUkgU2V0dGluZ3NcbiAgY2VudGVyOiBQb2ludDJEO1xuICBtaW5fc2lkZTogbnVtYmVyO1xuICByb2NrZXRzX2NvdW50OiBudW1iZXIgPSAyMDtcblxuICBjb25zdHJ1Y3Rvcih3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgc2V0VXA6IChfOlNjZW5lKSA9PiBhbnkpIHtcbiAgICB0aGlzLmdlbmVyYXRpb25faW5mbyA9IFtdO1xuICAgIHRoaXMuZWxlbWVudHMgPSBbXTtcbiAgICB0aGlzLnJvY2tldHMgPSBbXTtcbiAgICB0aGlzLnN2Z19lbGVtZW50cyA9IHt9O1xuICAgIHRoaXMubWluX3NpZGUgPSBNYXRoLm1pbihcbiAgICAgIHdpZHRoLFxuICAgICAgaGVpZ2h0XG4gICAgKTtcbiAgICB0aGlzLmNlbnRlciA9IG5ldyBQb2ludDJEKFxuICAgICAgdGhpcy5taW5fc2lkZSAvIDIsXG4gICAgICB0aGlzLm1pbl9zaWRlIC8gMlxuICAgICk7XG5cbiAgICAkKCgpID0+IHtcbiAgICAgIGxldCBjYW52YXMgPSBTVkcoJ2NhbnZhcycpO1xuICAgICAgY2FudmFzLnNpemUod2lkdGgsIGhlaWdodCk7XG5cbiAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzLm5lc3RlZCgpO1xuICAgICAgc2V0VXAodGhpcyk7XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVHZW5lcmF0aW9uSW5mbygpe1xuICAgIGxldCByb2NrZXRzX2NvdW50ID0gdGhpcy5yb2NrZXRzLmxlbmd0aDtcbiAgICB2YXIgbGFuZGVkX3JvY2tldHNfY291bnQgPSAwO1xuICAgIGZvcihsZXQgcm9ja2V0IG9mIHRoaXMucm9ja2V0cyl7XG4gICAgICBpZihyb2NrZXQuaGFzX2xhbmRlZCl7XG4gICAgICAgIGxhbmRlZF9yb2NrZXRzX2NvdW50ICs9IDFcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmdlbmVyYXRpb25faW5mby5wdXNoKFtcbiAgICAgIGxhbmRlZF9yb2NrZXRzX2NvdW50XG4gICAgXSlcblxuICAgIHZhciB0ZXh0ID0gJyc7XG4gICAgZm9yKHZhciBpID0gdGhpcy5nZW5lcmF0aW9uX2luZm8ubGVuZ3RoLTE7IGkgPj0gMDsgaS0tKXtcbiAgICAgIHRleHQgKz0gYEdlbmVyYXRpb24gJHtpKzF9OiBcXFxuICAgICAgICBbJHt0aGlzLmdlbmVyYXRpb25faW5mb1tpXX0gXFwvICR7cm9ja2V0c19jb3VudH1dIFxcXG4gICAgICBcXG5gXG4gICAgfVxuXG4gICAgaWYodGhpcy50ZXh0X2VsZW1lbnQgPT09IHVuZGVmaW5lZCl7XG4gICAgICB0aGlzLnRleHRfZWxlbWVudCA9IHRoaXMuY2FudmFzLnRleHQoXG4gICAgICAgIHRleHRcbiAgICAgICkubW92ZShcbiAgICAgICAgMCwgMFxuICAgICAgKS5mb250KHtcbiAgICAgICAgJ2ZhbWlseSc6ICdJbmNvbnNvbGF0YScsXG4gICAgICAgICdzaXplJzogdGhpcy5taW5fc2lkZSAvIDQwXG4gICAgICB9KVxuICAgIH1lbHNle1xuICAgICAgdGhpcy50ZXh0X2VsZW1lbnQudGV4dCh0ZXh0KTtcbiAgICB9XG4gIH1cblxuICBhZGRFbGVtZW50KGVsZW1lbnRfdHlwZTogc3RyaW5nLCBwcm9wZXJ0aWVzOiBhbnksIGlkPzogc3RyaW5nLCBjb2xvcnM/OiBhbnkpe1xuICAgIGlmICh0eXBlb2YgcHJvcGVydGllcyAhPT0gJ29iamVjdCcpe1xuICAgICAgcHJvcGVydGllcyA9IHt9XG4gICAgfVxuICAgIHZhciBvYmplY3Q7XG5cbiAgICBzd2l0Y2goZWxlbWVudF90eXBlKXtcbiAgICAgIGNhc2UgJ2NpcmNsZSc6XG4gICAgICAgIGxldCBfY2lyY2xlID0gbmV3IENpcmNsZShcbiAgICAgICAgICBwcm9wZXJ0aWVzWydjeCddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ2N5J10sXG4gICAgICAgICAgcHJvcGVydGllc1sncmFkaXVzJ10sXG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29sb3JzXG4gICAgICAgIClcbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKF9jaXJjbGUpO1xuICAgICAgICBvYmplY3QgPSBfY2lyY2xlO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xpbmUnOlxuICAgICAgICBsZXQgX2xpbmUgPSBuZXcgTGluZShcbiAgICAgICAgICBwcm9wZXJ0aWVzWyd4MSddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ3kxJ10sXG4gICAgICAgICAgcHJvcGVydGllc1sneDInXSxcbiAgICAgICAgICBwcm9wZXJ0aWVzWyd5MiddLFxuICAgICAgICAgIHByb3BlcnRpZXNbJ3dpZHRoJ10sXG4gICAgICAgICAgaWQsXG4gICAgICAgICAgY29sb3JzXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKF9saW5lKTtcbiAgICAgICAgb2JqZWN0ID0gX2xpbmU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5sb2coZWxlbWVudFR5cGUpO1xuICAgIH1cblxuICAgIHJldHVybiBvYmplY3Q7XG4gIH1cblxuICBkcmF3RWxlbWVudHMoKXtcbiAgICBmb3IobGV0IGVsZW1lbnQgb2YgdGhpcy5lbGVtZW50cyl7XG4gICAgICBsZXQgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQgPSB0aGlzLnN2Z19lbGVtZW50c1tlbGVtZW50Ll9pZF07XG4gICAgICBsZXQgY2VudGVyMmQgPSBlbGVtZW50LmdldDJEQ2VudGVyKCk7XG4gICAgICBsZXQgcGF0aCA9IGVsZW1lbnQuZ2V0MkRQYXRoKCk7XG4gICAgICBsZXQgY29sb3JzID0gZWxlbWVudC5nZXRDb2xvcnMoKTtcblxuICAgICAgc3dpdGNoKGVsZW1lbnQuX3R5cGUpe1xuICAgICAgICBjYXNlIGVsZW1lbnRUeXBlLkNpcmNsZTpcbiAgICAgICAgICAvLyBDaGVjayBpZiBhbnkgZWxlbWVudCB3aXRoIHNhbWUgYF9pZGAgZXhpc3RzIGluIGNhbnZhc1xuICAgICAgICAgIC8vIHRoaXMuY2FudmFzLmhhcyhlbGVtZW50LnN2Z19vYmplY3QpXG4gICAgICAgICAgaWYoIGV4aXN0aW5nX3N2Z19lbGVtZW50ID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgbGV0IHN2Z19lbGVtZW50ID0gdGhpcy5jYW52YXMuY2lyY2xlKFxuICAgICAgICAgICAgICBlbGVtZW50LmdldFJhZGl1cygpICogMlxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLmF0dHIoe1xuICAgICAgICAgICAgICAgICdjeCc6IGNlbnRlcjJkLngsXG4gICAgICAgICAgICAgICAgJ2N5JzogY2VudGVyMmQueSxcbiAgICAgICAgICAgICAgICAnZmlsbCc6IGNvbG9yc1snZmlsbF9jb2xvciddLFxuICAgICAgICAgICAgICAgICdzdHJva2UnOiBjb2xvcnNbJ3N0cm9rZV9jb2xvciddLFxuICAgICAgICAgICAgICAgICdzdHJva2Utd2lkdGgnOiBlbGVtZW50LmdldFdpZHRoKClcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLnN2Z19lbGVtZW50c1tlbGVtZW50Ll9pZF0gPSBzdmdfZWxlbWVudDtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIC8vIFJlZHJhdyBvciBtb3ZlXG4gICAgICAgICAgICBpZihcbiAgICAgICAgICAgICAgY2VudGVyMmQueCAhPSBleGlzdGluZ19zdmdfZWxlbWVudC5jeCgpIHx8XG4gICAgICAgICAgICAgIGNlbnRlcjJkLnkgIT0gZXhpc3Rpbmdfc3ZnX2VsZW1lbnQuY3koKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGV4aXN0aW5nX3N2Z19lbGVtZW50Lm1vdmUoXG4gICAgICAgICAgICAgICAgY2VudGVyMmQueCxcbiAgICAgICAgICAgICAgICBjZW50ZXIyZC55XG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIGVsZW1lbnRUeXBlLkxpbmU6XG4gICAgICAgICAgaWYoIGV4aXN0aW5nX3N2Z19lbGVtZW50ID09PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgbGV0IHN2Z19lbGVtZW50ID0gdGhpcy5jYW52YXMubGluZShcbiAgICAgICAgICAgICAgcGF0aFswXS54LFxuICAgICAgICAgICAgICBwYXRoWzBdLnksXG4gICAgICAgICAgICAgIHBhdGhbMV0ueCxcbiAgICAgICAgICAgICAgcGF0aFsxXS55LFxuICAgICAgICAgICAgKS5hdHRyKHtcbiAgICAgICAgICAgICAgJ2ZpbGwnOiBjb2xvcnNbJ2ZpbGxfY29sb3InXSxcbiAgICAgICAgICAgICAgJ3N0cm9rZSc6IGNvbG9yc1snc3Ryb2tlX2NvbG9yJ10sXG4gICAgICAgICAgICAgICdzdHJva2Utd2lkdGgnOiBlbGVtZW50LmdldFdpZHRoKClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5zdmdfZWxlbWVudHNbZWxlbWVudC5faWRdID0gc3ZnX2VsZW1lbnQ7XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAvLyBSZWRyYXcgb3IgbW92ZVxuICAgICAgICAgICAgaWYoXG4gICAgICAgICAgICAgIHBhdGhbMF0ueCAhPSBleGlzdGluZ19zdmdfZWxlbWVudC54KCkgfHxcbiAgICAgICAgICAgICAgcGF0aFswXS55ICE9IGV4aXN0aW5nX3N2Z19lbGVtZW50LnkoKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGV4aXN0aW5nX3N2Z19lbGVtZW50Lm1vdmUoXG4gICAgICAgICAgICAgICAgcGF0aFswXS54LFxuICAgICAgICAgICAgICAgIHBhdGhbMF0ueVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIHJvY2tldCAtIGNoZWNrIGl0J3Mgc3RhdHVzXG4gICAgICAgICAgICBmb3IobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpe1xuICAgICAgICAgICAgICBpZihyb2NrZXQuX2lkID09IGVsZW1lbnQuX2lkKXtcbiAgICAgICAgICAgICAgICBpZighcm9ja2V0LmlzX2FsaXZlKXtcbiAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudChyb2NrZXQuX2lkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlRWxlbWVudChpZDogc3RyaW5nKXtcbiAgICB2YXIgZWw7XG5cbiAgICBmb3IobGV0IGVsZW1lbnQgb2YgdGhpcy5lbGVtZW50cyl7XG4gICAgICBpZihlbGVtZW50Ll9pZCA9PSBpZCl7XG4gICAgICAgIGVsID0gZWxlbWVudDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYoZWwgIT0gdW5kZWZpbmVkKXtcbiAgICAgIGxldCBlbGVtZW50X2luZGV4ID0gdGhpcy5lbGVtZW50cy5pbmRleE9mKGVsKTtcbiAgICAgIGlmKGVsZW1lbnRfaW5kZXggIT0gLTEpe1xuICAgICAgICB0aGlzLmVsZW1lbnRzLnNwbGljZShlbGVtZW50X2luZGV4LCAxKTtcbiAgICAgICAgbGV0IGV4aXN0aW5nX3N2Z19lbGVtZW50ID0gdGhpcy5zdmdfZWxlbWVudHNbZWwuX2lkXTtcbiAgICAgICAgaWYoZXhpc3Rpbmdfc3ZnX2VsZW1lbnQgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgZGVsZXRlIHRoaXMuc3ZnX2VsZW1lbnRzW2VsLl9pZF07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBvcmJpdFRyYWplY3RvcnkoZWw6IGVsZW1lbnQsIGFyb3VuZDogUG9pbnQyRCl7XG4gICAgLy8gbGV0IGVsX2NlbnRlciA9IGVsLmdldDJEQ2VudGVyKCk7XG4gICAgLy8gbGV0IHJhZGl1cyA9IE1hdGguc3FydChcbiAgICAvLyAgIChlbF9jZW50ZXIueCAtIGFyb3VuZC54KSoqMiArXG4gICAgLy8gICAoZWxfY2VudGVyLnkgLSBhcm91bmQueSkqKjJcbiAgICAvLyApXG4gICAgLy9cbiAgICAvLyBpZihlbC5tZXRhWydjdHInXSA9PT0gdW5kZWZpbmVkKXtcbiAgICAvLyAgIGVsLm1ldGFbJ2N0ciddID0gMDtcbiAgICAvLyB9XG4gICAgLy8gaWYoZWwubWV0YVsnY3RyJ10gPT0gMzYwKXtcbiAgICAvLyAgIGVsLm1ldGFbJ2N0ciddID0gMDtcbiAgICAvLyB9XG4gICAgLy9cbiAgICAvLyBsZXQgeCA9IHJhZGl1cyAqIE1hdGguY29zKGVsLm1ldGFbJ2N0ciddICogTWF0aC5QSSAvIDE4MC4wKSArIGVsX2NlbnRlci54O1xuICAgIC8vIGxldCB5ID0gcmFkaXVzICogTWF0aC5jb3MoZWwubWV0YVsnY3RyJ10gKiBNYXRoLlBJIC8gMTgwLjApICsgZWxfY2VudGVyLnk7XG4gICAgLy9cbiAgICAvLyBlbC5tZXRhWydjdHInXSArPSAxO1xuICAgIC8vIGNvbnNvbGUubG9nKHJhZGl1cywgZWwubWV0YVsnY3RyJ10pXG4gICAgLy8gZWwubW92ZShbbmV3IFBvaW50MkQoeCx5KV0pO1xuICB9XG5cbiAgY2hlY2tDcmFzaGVzKCl7XG4gICAgLy8gUm9ja2V0IGNyYXNlcyBhbnl0aGluZ1xuICAgIGZvcihsZXQgcm9ja2V0IG9mIHRoaXMucm9ja2V0cyl7XG4gICAgICBpZihyb2NrZXQuaXNfYWxpdmUpe1xuICAgICAgICBsZXQgcm9ja2V0X3N2Z19lbGVtZW50ID0gdGhpcy5zdmdfZWxlbWVudHNbcm9ja2V0Ll9pZF07XG4gICAgICAgIGxldCByb2NrZXRfeCA9IFtyb2NrZXQueDEsIHJvY2tldC54Ml07XG4gICAgICAgIGxldCByb2NrZXRfeSA9IFtyb2NrZXQueTEsIHJvY2tldC55Ml07XG5cbiAgICAgICAgZm9yKGxldCBlbGVtZW50IG9mIHRoaXMuZWxlbWVudHMpe1xuICAgICAgICAgIHZhciBjcmFzaCA9IGZhbHNlO1xuXG4gICAgICAgICAgbGV0IGNlbnRlcjJkID0gZWxlbWVudC5nZXQyRENlbnRlcigpO1xuICAgICAgICAgIGxldCBwYXRoID0gZWxlbWVudC5nZXQyRFBhdGgoKTtcbiAgICAgICAgICBsZXQgd2lkdGggPSBlbGVtZW50LmdldFdpZHRoKCk7XG5cbiAgICAgICAgICBsZXQgZXhpc3Rpbmdfc3ZnX2VsZW1lbnQgPSB0aGlzLnN2Z19lbGVtZW50c1tlbGVtZW50Ll9pZF07XG4gICAgICAgICAgc3dpdGNoKGVsZW1lbnQuX3R5cGUpe1xuICAgICAgICAgICAgY2FzZSBlbGVtZW50VHlwZS5DaXJjbGU6XG4gICAgICAgICAgICAgIGxldCBlbGVtZW50X3JhZGl1cyA9IGVsZW1lbnQuZ2V0UmFkaXVzKCk7XG5cbiAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHJvY2tldF94Lmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICBsZXQgZGlzdGFuY2UgPSBNYXRoLnNxcnQoXG4gICAgICAgICAgICAgICAgICAocm9ja2V0X3hbaV0gLSBjZW50ZXIyZC54KSoqMiArXG4gICAgICAgICAgICAgICAgICAocm9ja2V0X3lbaV0gLSBjZW50ZXIyZC55KSoqMlxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICBpZihkaXN0YW5jZSA8IGVsZW1lbnRfcmFkaXVzKXtcbiAgICAgICAgICAgICAgICAgIGNyYXNoID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIGVsZW1lbnRUeXBlLkxpbmU6XG4gICAgICAgICAgICAgIC8vIHRvZG86IHRoaXMgbXVzdCBiZSBmaXhlZFxuXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYoY3Jhc2gpe1xuICAgICAgICAgICAgcm9ja2V0LmNyYXNoKGVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGFjdGl2aXR5KCl7XG4gICAgLy8gUGxhbmV0c1xuICAgIHRoaXMuY2hlY2tDcmFzaGVzKCk7XG4gICAgdGhpcy5vcmJpdFRyYWplY3RvcnkodGhpcy5kZXN0aW5hdGlvbiwgdGhpcy5jZW50ZXIpO1xuXG4gICAgLy8gUm9ja2V0c1xuICAgIHZhciBkZWFkX3JvY2tldHNfY291bnQgPSAwO1xuICAgIHZhciBsYW5kZWRfcm9ja2V0c19jb3VudCA9IDA7XG5cbiAgICBmb3IgKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKSB7XG4gICAgICBpZiAocm9ja2V0LmlzX2FsaXZlKSB7XG4gICAgICAgIGlmKHJvY2tldC5oYXNfbGFuZGVkKXtcbiAgICAgICAgICBsYW5kZWRfcm9ja2V0c19jb3VudCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGVsZW1lbnQgb2YgdGhpcy5lbGVtZW50cykge1xuICAgICAgICAgIGlmIChlbGVtZW50Ll9pZCA9PSByb2NrZXQuX2lkKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm1vdmUoXG4gICAgICAgICAgICAgIHJvY2tldC5nZXQyRFBhdGgoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJvY2tldC51cGRhdGUoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1lbHNle1xuICAgICAgICBkZWFkX3JvY2tldHNfY291bnQgKz0gMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVhZF9yb2NrZXRzX2NvdW50ICsgbGFuZGVkX3JvY2tldHNfY291bnQgPT0gdGhpcy5yb2NrZXRzLmxlbmd0aFxuICB9XG5cbiAgc3RhcnRBY3Rpdml0eShcbiAgICBpbnRlcnZhbDogbnVtYmVyXG4gICl7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCByb2NrZXRzX3Bvb2wgPSBzZWxmLmNhbGNSb2NrZXRzU2NvcmVzKCk7XG4gICAgbGV0IHJvdXRpbmVzID0gc2VsZi5zZWxlY3RSb2NrZXRzUm91dGluZXMocm9ja2V0c19wb29sKTtcbiAgICBzZWxmLnN0YXJ0Um9ja2V0cyhudWxsLCByb3V0aW5lcyk7XG5cbiAgICBsZXQgaW50ZXJ2YWxfaWQgPSBzZXRJbnRlcnZhbChcbiAgICAgIGZ1bmN0aW9uKCl7XG4gICAgICAgIGxldCBhY3Rpdml0eV9maW5pc2hlZCA9IHNlbGYuYWN0aXZpdHkoKTtcbiAgICAgICAgaWYoYWN0aXZpdHlfZmluaXNoZWQpe1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsX2lkKTtcblxuICAgICAgICAgIHNlbGYudXBkYXRlR2VuZXJhdGlvbkluZm8oKTtcbiAgICAgICAgICBzZWxmLnN0YXJ0QWN0aXZpdHkoXG4gICAgICAgICAgICBpbnRlcnZhbFxuICAgICAgICAgICk7XG4gICAgICAgIH07XG4gICAgICB9LFxuICAgICAgaW50ZXJ2YWxcbiAgICApO1xuICB9XG5cbiAgY2FsY1JvY2tldHNTY29yZXMoKXtcbiAgICB2YXIgbWF4X3Njb3JlID0gMDtcbiAgICBmb3IobGV0IHJvY2tldCBvZiB0aGlzLnJvY2tldHMpe1xuICAgICAgaWYocm9ja2V0LnNlbGVjdGlvbl9zY29yZSA+IG1heF9zY29yZSl7XG4gICAgICAgIG1heF9zY29yZSA9IHJvY2tldC5zZWxlY3Rpb25fc2NvcmU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKXtcbiAgICAgIHJvY2tldC5zZWxlY3Rpb25fc2NvcmUgLz0gbWF4X3Njb3JlOyAvLyBCZXR3ZWVuIDAgYW5kIDFcbiAgICB9XG5cbiAgICB2YXIgcm9ja2V0c19wb29sID0gW107XG4gICAgZm9yKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKXtcbiAgICAgIGxldCBuID0gcm9ja2V0LnNlbGVjdGlvbl9zY29yZSAqIDEwMDtcbiAgICAgIGZvcihsZXQgaiA9IDA7IGogPCBuOyBqKyspe1xuICAgICAgICByb2NrZXRzX3Bvb2wucHVzaChyb2NrZXQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvY2tldHNfcG9vbDtcbiAgfVxuXG4gIHNlbGVjdFJvY2tldHNSb3V0aW5lcyhyb2NrZXRzX3Bvb2w6IFJvY2tldFtdKXtcbiAgICB2YXIgcm91dGluZXMgPSBbXTtcbiAgICBpZihyb2NrZXRzX3Bvb2wubGVuZ3RoID4gMCkge1xuICAgICAgZm9yKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKXtcbiAgICAgICAgbGV0IHJvdXRpbmVBID0gcGlja1JhbmRvbUZyb21BcnJheShyb2NrZXRzX3Bvb2wpLnJvdXRpbmU7XG4gICAgICAgIGxldCByb3V0aW5lQiA9IHBpY2tSYW5kb21Gcm9tQXJyYXkocm9ja2V0c19wb29sKS5yb3V0aW5lO1xuICAgICAgICBsZXQgY2hpbGRSb3V0aW5lID0gcm91dGluZUEuY3Jvc3NPdmVyKHJvdXRpbmVCKTtcbiAgICAgICAgY2hpbGRSb3V0aW5lLm11dGF0ZSgpO1xuXG4gICAgICAgIHJvdXRpbmVzLnB1c2goY2hpbGRSb3V0aW5lKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByb3V0aW5lcztcbiAgfVxuXG4gIHJlbmRlcihpbnRlcnZhbDogbnVtYmVyKXtcbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB0aGlzLmRyYXdFbGVtZW50cygpLCBpbnRlcnZhbCk7XG4gIH1cblxuICBzdGFydFJvY2tldChyb2NrZXQ6IFJvY2tldCl7XG4gICAgbGV0IF9saW5lID0gdGhpcy5hZGRFbGVtZW50KFxuICAgICAgJ2xpbmUnLFxuICAgICAge1xuICAgICAgICAneDEnOiByb2NrZXQueDEsXG4gICAgICAgICd5MSc6IHJvY2tldC55MSxcbiAgICAgICAgJ3gyJzogcm9ja2V0LngyLFxuICAgICAgICAneTInOiByb2NrZXQueTIsXG4gICAgICAgICd3aWR0aCc6IHJvY2tldC53aWR0aFxuICAgICAgfSxcbiAgICAgIHJvY2tldC5faWQsXG4gICAgICB7XG4gICAgICAgIGZpbGxfY29sb3I6ICdyZ2JhKDAsIDAsIDAsIC45KScsXG4gICAgICAgIHN0cm9rZV9jb2xvcjogJ3JnYmEoMjUyLCA5OCwgOTMsIC43KScsXG4gICAgICAgIGZvbnRfY29sb3I6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDEpJyxcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMucm9ja2V0cy5wdXNoKFxuICAgICAgcm9ja2V0XG4gICAgKTtcbiAgfVxuXG4gIHN0YXJ0Um9ja2V0cyhcbiAgICByb2NrZXRzX2NvdW50PzogbnVtYmVyLFxuICAgIHJvdXRpbmVzPzogUm91dGluZVtdXG4gICl7XG4gICAgZm9yKGxldCByb2NrZXQgb2YgdGhpcy5yb2NrZXRzKXtcbiAgICAgIHRoaXMucmVtb3ZlRWxlbWVudChyb2NrZXQuX2lkKTtcbiAgICB9XG4gICAgdGhpcy5yb2NrZXRzID0gW107XG5cbiAgICBsZXQgcm9ja2V0X2hlaWdodCA9IHRoaXMubWluX3NpZGUgLyAxMDA7XG5cbiAgICB2YXIgcm9ja2V0cyA9IFtdO1xuICAgIGlmKHJvY2tldHNfY291bnQgPiAwKXtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9ja2V0c19jb3VudDsgaSsrKSB7XG4gICAgICAgIGxldCByb2NrZXQgPSBuZXcgUm9ja2V0KFxuICAgICAgICAgIHRoaXMub3JpZ2luLFxuICAgICAgICAgIHRoaXMuZGVzdGluYXRpb24sXG4gICAgICAgICAgcm9ja2V0X2hlaWdodCxcbiAgICAgICAgKTtcbiAgICAgICAgcm9ja2V0cy5wdXNoKFxuICAgICAgICAgIHJvY2tldFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1lbHNlIGlmKHJvdXRpbmVzLmxlbmd0aCA+IDApe1xuICAgICAgZm9yKGxldCByb3V0aW5lIG9mIHJvdXRpbmVzKXtcbiAgICAgICAgcm9ja2V0cy5wdXNoKFxuICAgICAgICAgIG5ldyBSb2NrZXQoXG4gICAgICAgICAgICB0aGlzLm9yaWdpbixcbiAgICAgICAgICAgIHRoaXMuZGVzdGluYXRpb24sXG4gICAgICAgICAgICByb2NrZXRfaGVpZ2h0LFxuICAgICAgICAgICAgcm91dGluZVxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm9ja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5zdGFydFJvY2tldChyb2NrZXRzW2ldKTtcbiAgICB9XG4gIH1cbn1cbiIsImV4cG9ydCBsZXQgY29sb3JzID0ge1xuICBmaWxsX2NvbG9yOiAncmdiYSgxNTcsMTY1LDE4MCwgLjkpJyxcbiAgc3Ryb2tlX2NvbG9yOiAncmdiYSgxMjYsIDEzMywgMTQ2LCAxKScsXG4gIGZvbnRfY29sb3I6ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDEpJyxcbn1cbiJdfQ==

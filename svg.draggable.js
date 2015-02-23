// svg.draggable.js 0.1.0 - Copyright (c) 2014 Wout Fierens - Licensed under the MIT license
// extended by Florian Loch
;(function() {

  var new_point = function(element, x, y) {
     var p = element.doc().node.createSVGPoint();
     p.x = x;
     p.y = y;
     return p;
  };

  var to_constrainer = function(constraint) {
    return function (x, y, width, height) {
      var result = {x:x, y:y};
      /*
      if (typeof constraint === 'function') {
        var coord = constraint(x, y)
        if (typeof coord === 'object') {
          if (typeof coord.x != 'boolean' || coord.x) {
            result.x = typeof coord.x === 'number' ? coord.x : x;
          }
          if (typeof coord.y != 'boolean' || coord.y) {
            result.y = typeof coord.y === 'number' ? coord.y : y;
          }
        } else if (typeof coord === 'boolean' && coord) {
            result.x=x;
            result.y=y;
        }
      } else if (typeof constraint === 'object') {*/
        /* keep element within constrained box */
        /*if (constraint.minX != null && x < constraint.minX)
          result.x = constraint.minX
        else if (constraint.maxX != null && x > constraint.maxX - width)
          result.x = constraint.maxX - width
        if (constraint.minY != null && y < constraint.minY)
          result.y = constraint.minY
        else if (constraint.maxY != null && y > constraint.maxY - height)
          result.y = constraint.maxY - height

        console.log({startX: element.startPosition.x, startY: element.startPosition.y,
        curX: element.x(), curY: element.y(),
        nextX: x, nextY: y,
        deltaX: deltaX, deltaY: deltaY});
        // x, y setting 
        result = {x:x, y:y};
      }*/
      return result;
    }
  };

  SVG.extend(SVG.Element, {
    // Make element draggable
    // Constraint might be a object (as described in readme.md) or a function in the form "function (x, y)" that gets called before every move.
    // The function can return a boolean or a object of the form {x, y}, to which the element will be moved. "False" skips moving, true moves to raw x, y.
    draggable: function(constraint, with_transform) {
      var start, drag, end
        , element = this
        , parent  = this.parent._parent(SVG.Nested) || this._parent(SVG.Doc)

      /* remove draggable if already present */
      if (typeof this.fixed === 'function')
        this.fixed()

      /* ensure constraint object */
      constraint = constraint || {}

      constrain = to_constrainer(constraint);

      /* start dragging */
      start = function(event) {
        event = event || window.event

        /* invoke any callbacks */
        if (element.beforedrag)
          element.beforedrag(event)

        /* store event */
        element.startEvent = event

        /* store start position */
        element.startPosition = {x:element.x(), y:element.y()};

        /* add while and end events to window */
        SVG.on(window, 'mousemove', drag)
        SVG.on(window, 'mouseup',   end)

        /* invoke any callbacks */
        if (element.dragstart)
          element.dragstart({ x: 0, y: 0, zoom: element.startPosition.zoom }, event)

        /* prevent selection dragging */
        event.preventDefault ? event.preventDefault() : event.returnValue = false
      }

      /* while dragging */
      drag = function(event) {
        event = event || window.event

        if (element.startEvent) {
          /* calculate move position */

          var windowStartDrag = new_point(element, element.startEvent.pageX, element.startEvent.pageY);
          var windowCurDrag = new_point(element, event.pageX, event.pageY);

          //var parentNode = element.parent.node;
          // x, y of the element is actually in the coordinate system of the parent.
          var elemToScreen = element.node.getScreenCTM();
          var screenToElem = elemToScreen.inverse();

          var elementStartDrag = windowStartDrag.matrixTransform(screenToElem);
          var elementCurDrag = windowCurDrag.matrixTransform(screenToElem);

          var deltaX = elementCurDrag.x - elementStartDrag.x;
          var deltaY = elementCurDrag.y - elementStartDrag.y;

          var x = element.startPosition.x + deltaX;
          var y = element.startPosition.y + deltaY;
          /* move the element to its new position, if possible by constraint */
          //var constrained = constrain(x, y);
          if (with_transform) {
            element.move(x,y);
          } else {
            element.attr({x:x, y:y});
          }

          /* invoke any callbacks */
          if (element.dragmove)
            element.dragmove(delta, event)
        }
      }

      /* when dragging ends */
      end = function(event) {
        event = event || window.event

        /* calculate move position */
        var delta = {
          x:    event.pageX - element.startEvent.pageX
        , y:    event.pageY - element.startEvent.pageY
        , zoom: element.startPosition.zoom
        }

        /* reset store */
        element.startEvent    = null
        element.startPosition = null

        /* remove while and end events to window */
        SVG.off(window, 'mousemove', drag)
        SVG.off(window, 'mouseup',   end)

        /* invoke any callbacks */
        if (element.dragend)
          element.dragend(delta, event)
      }

      /* bind mousedown event */
      element.on('mousedown', start)

      /* disable draggable */
      element.fixed = function() {
        element.off('mousedown', start)

        SVG.off(window, 'mousemove', drag)
        SVG.off(window, 'mouseup',   end)

        start = drag = end = null

        return element
      }

      return this
    }

  })

}).call(this);

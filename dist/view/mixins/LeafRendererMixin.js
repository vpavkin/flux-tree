/** @jsx React.DOM */
"use strict";

var assign = require("object-assign");
var DraggableElementRendererMixin = require("./DraggableElementRendererMixin");
var RemovableElementRendererMixin = require("./RemovableElementRendererMixin");

module.exports = assign({}, RemovableElementRendererMixin, DraggableElementRendererMixin, {
	leafRendererClasses: function () {
		return {
			dragged: this.props.isDragged,
			"leaf-renderer": true
		};
	}

});
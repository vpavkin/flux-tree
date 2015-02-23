/** @jsx React.DOM */
"use strict";

var assign = require("object-assign");
var DraggableElementRendererMixin = require("./DraggableElementRendererMixin");
var RemovableElementRendererMixin = require("./RemovableElementRendererMixin");

module.exports = assign({}, RemovableElementRendererMixin, DraggableElementRendererMixin, {
	collapse: function () {
		this.props.actionCreator.collapseElement({ element: this.props.element });
	},

	expand: function () {
		this.props.actionCreator.expandElement({ element: this.props.element });
	},

	treeRendererClasses: function () {
		return {
			dragged: this.props.isDragged,
			"tree-renderer": true
		};
	}
});
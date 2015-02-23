/** @jsx React.DOM */
"use strict";
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = require("react");

var TreeViewFactory = function (LeafRenderer, TreeRenderer, typeExtractor) {
	this._leafRenderer = LeafRenderer;
	this._treeRenderer = TreeRenderer;
	this._typeExtractor = typeExtractor;

	this._rendertree = function (element, props) {
		var SequenceRenderer = this._treeRenderer;
		return React.createElement(SequenceRenderer, _extends({ element: element, key: props.key }, props));
	};

	this._renderleaf = function (element, props) {
		var LeafRenderer = this._leafRenderer;
		return React.createElement(LeafRenderer, _extends({ element: element, key: props.key }, props));
	};

	this.element = function (element, props) {
		var type = this._typeExtractor(element);
		if (!element || !type || !this["_render" + type]) {
			throw new Error("Unknown element type " + type);
		}
		return this["_render" + type].call(this, element, props);
	};
};

module.exports = TreeViewFactory;
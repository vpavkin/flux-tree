/** @jsx React.DOM */
'use strict';
var React = require('react');

var TreeViewFactory = function (LeafRenderer, TreeRenderer, typeExtractor) {

	this._leafRenderer = LeafRenderer;
	this._treeRenderer = TreeRenderer;
	this._typeExtractor = typeExtractor;

	this._rendertree = function (element, props) {
		var SequenceRenderer = this._treeRenderer;
		return (
			<SequenceRenderer element={element} key={props.key} {...props}/>
		)
	};

	this._renderleaf = function (element, props) {
		var LeafRenderer = this._leafRenderer;
		return (
			<LeafRenderer element={element} key={props.key} {...props}/>
		)
	};

	this.element = function (element, props) {
		var type = this._typeExtractor(element);
		if (!element || !type || !this['_render' + type]) {
			throw new Error('Unknown element type ' + type)
		}
		return this['_render' + type].call(this, element, props);
	};
};

module.exports = TreeViewFactory;

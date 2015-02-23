"use strict";
var events = require("events");
var immutable = require("immutable");
var ActionTypes = require("../ActionTypes");

var ExpandedElementsStore = function (dispatcher, identifier) {
	this._identifier = identifier;
	this._dispatcher = dispatcher;
	this.expandedElements = immutable.Set();
	this.updateStream = new events.EventEmitter();
	this.register();
};

ExpandedElementsStore.prototype = {

	register: function () {
		this._dispatcher.register(ActionTypes.EXPAND_ELEMENT, this.onExpand, this);
		this._dispatcher.register(ActionTypes.COLLAPSE_ELEMENT, this.onCollapse, this);
	},

	update: function (element) {
		this.updateStream.emit("update", element);
	},

	onExpand: function (action) {
		this.expandedElements = this.expandedElements.add(this._identifier(action.element));
		this.update(action.element);
	},

	onCollapse: function (action) {
		this.expandedElements = this.expandedElements.remove(this._identifier(action.element));
		this.update(action.element);
	},

	isExpanded: function (element) {
		return this.expandedElements.contains(this._identifier(element));
	}
};

module.exports = ExpandedElementsStore;
'use strict';
var events = require('events');
var assert = require('assert');
var ActionTypes = require('../ActionTypes');
var IU = require('../util/ImmutableUtil');

/**
 * Store, that handles all form model events
 */
var DataStore = function (dispatcher, dndStore, data) {

	this._dndStore = dndStore;
	this._dispatcher = dispatcher;
	this._data = data;

	this.dataStream = new events.EventEmitter();
	this._register();
};

DataStore.prototype = {

	/* Public API */

	/**
	 * Current form state
	 * @return {Form|null}
	 */
	data: function () {
		return this._data;
	},

	setData: function (data) {
		this._data = data;
	},
	/* private */
	_register: function () {
		this._dispatcher.register(ActionTypes.SET_DATA,
			this._onFormLoaded, this);
		this._dispatcher.register(ActionTypes.DELETE_ELEMENT,
			this._onDeleteElement, this);
		this._dispatcher.register(ActionTypes.DRAG_END,
			this._onDragEnd, this);
	},

	_onFormLoaded: function (action) {
		this._data = action.data;
		this._emitData();
	},

	_emitData: function () {
		this.dataStream.emit('update', this._data);
	},

	_onDragEnd: function (action) {
		this._dispatcher.waitFor([this._dndStore]);

		if (action.target && !action.source) {
			// only one drag operation target
			var keyPath = IU.deepKeyOf(this._data, action.target.before);
			this._data = this._data.setIn(keyPath, action.target.after);
		} else if (action.target) {
			// source and target, apply them one by one
			this._data = this._data.withMutations(function (form) {
				var sourceKeyPath = IU.deepKeyOf(form, action.source.before);
				var targetKeyPath = IU.deepKeyOf(form, action.target.before);
				return form
					.setIn(sourceKeyPath, action.source.after)
					.setIn(targetKeyPath, action.target.after);
			});
		}
		this._emitData();
	},

	_onDeleteElement: function (action) {
		var keyPath = IU.deepKeyOf(this._data, action.element);
		assert(keyPath, 'Cannot delete element, that doesnot exist');
		this._data = this._data.deleteIn(keyPath);
		this._emitData();
	}

};

module.exports = DataStore;

'use strict';

var assert = require('assert');
var F = require('../util/Functions');

/**
 * Dispatcher allows stores to subscribe to actions.
 */
var Dispatcher = function () {

	this._callbacks = {};
	this._isPending = {};
	this._isHandled = {};
	this._isDispatching = false;
	this._pendingPayload = null;
};

/**
 * Registers a callback to be invoked
 * with every dispatched payload of specified type
 * @param {String} actionId action type to subscribe to.
 * Callback will be called only on this action.
 * @param {Function} callback a callback to be called
 * @param {Store} store a store, that is being subscribed,
 * which is also the callback context.
 * @returns {Dispatcher}
 */
Dispatcher.prototype.register = function (actionId, callback, store) {
	if (this._callbackExists(actionId, callback)) {
		return this;
	}
	if (!this._callbacks[actionId]) {
		this._callbacks[actionId] = [];
	}

	this._callbacks[actionId].push({
		callback: callback,
		store: store
	});
	return this;
};

/**
 * Removes a callback.
 * @param {String} actionId Action type, that the callback was subscribed to
 * @param {Function} callback callback function
 */
Dispatcher.prototype.unregister = function (actionId, callback) {
	assert(
		this._callbackExists(actionId, callback),
		'Dispatcher.unregister(...): This callback was never registered with id `' +
		actionId + '`'
	);
	this._callbacks[actionId].splice(
		F.findIndex(
			F.propEq('callback', callback),
			this._callbacks[actionId]),
		1);
};

/**
 * Waits for the callbacks specified to be invoked before continuing execution
 * of the current callback. This method should only be used by a callback in
 * response to a dispatched payload.
 *
 * @param {array<Store>} stores Array of stores to wait for.
 */
Dispatcher.prototype.waitFor = function (stores) {
	assert(
		this._isDispatching,
		'Dispatcher.waitFor(...): Must be invoked while dispatching.'
	);
	for (var i = 0; i < stores.length; i++) {
		var index = F.findIndex(
			F.propEq('store', stores[i]),
			this._callbacks[this._currentActionId()]
		);

		if (!this._callbacks[this._currentActionId()][index]) {
			continue;
		}

		if (this._isPending[index]) {
			assert(
				this._isHandled[index],
				'Dispatcher.waitFor(...): Circular dependency detected while ' +
				'waiting within action `' +
				this._callbacks[this._currentActionId()] + '`.'
			);
			continue;
		}

		this._invokeCallback(index);
	}
};

/**
 * Dispatches a payload to all callbacks, registered to payload.type.
 * Payload has to have a defined type
 * @param {object} payload Action object
 * @param {string} payload.type A required type string
 */
Dispatcher.prototype.dispatch = function (payload) {
	assert(
		!this._isDispatching,
		'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
	);
	assert(
		payload && payload.type,
		'Dispatch.dispatch(...): Cannot dispatch payload without a type.'
	);
	this._startDispatching(payload);
	try {
		this._callbacks[this._currentActionId()].forEach(function (item, index) {
			if (!this._isPending[index]) {
				this._invokeCallback(index);
			}
		}, this);
	} finally {
		this._stopDispatching();
	}
};

/**
 * Is this Dispatcher currently dispatching.
 *
 * @return {boolean}
 */
Dispatcher.prototype.isDispatching = function () {
	return this._isDispatching;
};

/**
 * Current payload Action Id
 * @returns {String} Current payload Action Id
 * @private
 */
Dispatcher.prototype._currentActionId = function () {
	assert(
		this._isDispatching && this._pendingPayload,
		'Dispatch._dispatchingActionId(...): ' +
		'Can only have a dispatched action during dispatch.'
	);
	return this._pendingPayload.type;
};

/**
 * Call the callback stored with the given index. Also do some internal
 * bookkeeping.
 * @param {int} index callback index in the subarray
 * of callbacks, belonging to currently dispatched action
 * @private
 */
Dispatcher.prototype._invokeCallback = function (index) {
	assert(
		this._isDispatching,
		'Dispatch._dispatchingActionId(...): Can invoke callback during dispatch'
	);
	assert(
		this._callbacks[this._currentActionId()][index],
		'Dispatch._dispatchingActionId(...): Cannot invoke `' +
		this._currentActionId() + '` callback with index ' + index
	);

	this._isPending[index] = true;
	var callbackObj = this._callbacks[this._currentActionId()][index];
	callbackObj.callback.call(
		callbackObj.store,
		this._pendingPayload
	);
	this._isHandled[index] = true;
};

/**
 * Set up bookkeeping needed when dispatching.
 * @param {object} payload Payload, being dispatched
 * @private
 */
Dispatcher.prototype._startDispatching = function (payload) {
	this._isPending = this._callbacks[payload.type].map(F.always(false));
	this._isHandled = this._callbacks[payload.type].map(F.always(false));
	this._pendingPayload = payload;
	this._isDispatching = true;
};

/**
 * Clear bookkeeping used for dispatching.
 *
 * @internal
 */
Dispatcher.prototype._stopDispatching = function () {
	this._pendingPayload = null;
	this._isDispatching = false;
};

/**
 * Check, if supplied callback is already registered
 * @param {String} actionId
 * @param {Function} callback
 * @returns {boolean}
 * @private
 */
Dispatcher.prototype._callbackExists = function (actionId, callback) {
	return this._callbacks[actionId] &&
		this._callbacks[actionId].some(F.propEq('callback', callback));
};

module.exports = Dispatcher;

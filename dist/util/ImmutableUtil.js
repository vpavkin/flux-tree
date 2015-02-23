"use strict";

var F = require("./Functions");
var Immutable = require("immutable");

/**
 * Performs depth first search of a value in
 * an immutable structure, and returns the keyPath
 * of found value.
 * @param {Immutable.Iterable} immutable structure to search in
 * @param {Object} value value to search for
 * @return {Immutable.List} keypath or undefined,
 * if value wasn't found
 */
var deepKeyOf = function (immutable, value) {
	return deepKey(immutable, F.eq(value));
};

/*jslint latedef:false*/
var deepKey = function (immutable, predicate) {
	return _deepKey(Immutable.List(), immutable, predicate);
};

var _deepKey = function (currentKeyPath, immutable, predicate) {
	if (predicate(immutable)) {
		return currentKeyPath;
	}
	if (!Immutable.Iterable.isIterable(immutable)) {
		return undefined;
	}
	var resultKeyPath;
	immutable.forEach(function (value, key) {
		var k = _deepKey(currentKeyPath.push(key), value, predicate);
		if (k) {
			resultKeyPath = k;
			return false; // stop the forEach
		}
	});
	return resultKeyPath;
};

/**
 * Returns a new List with element at 'from' moved to index 'to'
 * and other elements shifted accordingly
 * @param {Immutable.List} list source list
 * @param {int} from
 * @param {int} to
 * @return {Immutable.List}
 */
var moveInList = function (list, from, to) {
	return Immutable.fromJS(F.moveInArray(list.toArray(), from, to));
};

var insertAt = function (list, element, at) {
	return list.splice(at, 0, element);
};

/**
 * Analogue to Iterable.contains, but with strict equality check
 * @param {Immutable.Iterable} iterable
 * @param {Object} element
 * @return {boolean}
 */
var strictContains = function (iterable, element) {
	return !!iterable.find(F.eq(element));
};

var removeInList = function (list, value) {
	if (!Immutable.List.isList(list) || !list.contains(value)) {
		return list;
	}
	return list.remove(list.indexOf(value));
};

module.exports = {
	deepKey: deepKey,
	deepKeyOf: deepKeyOf,
	insertAt: insertAt,
	moveInList: moveInList,
	removeInList: removeInList,
	strictContains: strictContains
};
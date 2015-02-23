'use strict';
var F = require('./Functions');
var IU = require('./ImmutableUtil');

/**
 * Checks if mutated nodeA contains initial (before mutation) nodeB
 * and if it is, returns nodeB's keyPath.
 * Otherwise, returns undefined
 * @param {Object} mutationA
 * @param {Object} mutationB
 * @returns {boolean}
 * @private
 */
var _deepBKeyInA = function (mutationA, mutationB) {
	return IU.deepKey(mutationA.after, F.eq(mutationB.before));
};

/**
 * Returns 'merged' mutation, if nodeA is a child of nodeB.
 * Returns undefined otherwise.
 * @param {Object} mutationA
 * @param {Object} mutationB
 * @returns {Array|undefined}
 * @private
 */
var _mergedMutation = function (mutationA, mutationB) {
	var keyPath = _deepBKeyInA(mutationA, mutationB);
	if (keyPath) {
		return [{
			before: mutationA.before,
			after: mutationA.after.setIn(keyPath, mutationB.after)
		}];
	}
	return undefined;
};

var _independentMutations = function (mutationA, mutationB) {
	return [mutationA, mutationB];
};

/**
 * A method to preform smart simultaneous mutations of two subtrees.
 * If nodes are in parent-child relation, method returns just one
 * resulting mutation.
 * Otherwise, both mutations returned unchanged
 * @param {Object} mutationA first subtree
 * @param {Object} mutationB second subtree
 * @param {Immutable.Iterable} mutationA.before
 * @param {Immutable.Iterable} mutationB.before
 * @param {Immutable.Iterable} mutationA.after
 * @param {Immutable.Iterable} mutationB.after
 * @returns {Array} mutation array of resulting mutations
 * @returns {Immutable.Iterable} mutation.before
 * @returns {Immutable.Iterable} mutation.after
 */
var resolveTreeMutation = function (mutationA, mutationB) {
	return _mergedMutation(mutationA, mutationB) ||
		_mergedMutation(mutationB, mutationA) ||
		_independentMutations(mutationA, mutationB);
};

module.exports = resolveTreeMutation;

'use strict';

var assign = require('object-assign');
var events = require('events');
var IU = require('../util/ImmutableUtil');
var ActionTypes = require('../ActionTypes');
var DragType = require('./DragType');
var resolveTreeMutation = require('../util/resolveTreeMutation');

/**
 * Store, that controls dragging new and existing elements
 * from and to lists (including one that are in parent-child relationship)
 *
 * Public API:
 *
 * To start a drag operation, spawn one of two actions:
 * ActionTypes.DRAG_START_EXISTING or ActionTypes.DRAG_START_NEW
 *
 * Store works on wrapper objects, not on lists!
 *
 * A Component can find out, if and how it was changed by drag operations,
 * by calling methods:
 * isInvolvedInDragOperations(object)
 * isMutatedByDragOperations(object)
 * relevantStateFor(object)
 * @constructor
 */
var DragAndDropStore = function (dispatcher, identifier, elementsExtractor,
	elementsUpdater) {

	this._dispatcher = dispatcher;
	this._identifier = identifier;
	this._elementsExtractor = elementsExtractor;
	this._elementsUpdater = elementsUpdater;

	this._reset();

	/**
	 * Stream of updates
	 */
	this.updateStream = new events.EventEmitter();

	this._register();
};

DragAndDropStore.prototype = {

	_register: function () {
		this._dispatcher.register(ActionTypes.DRAG_START_EXISTING,
			this._onDragStartExisting, this);
		this._dispatcher.register(ActionTypes.DRAG_START_NEW,
			this._onDragStartNew, this);
		this._dispatcher.register(ActionTypes.DRAG_OVER,
			this._onDragOver, this);
		this._dispatcher.register(ActionTypes.DRAG_END,
			this._onDragEnd, this);
	},

	_reset: function () {
		this.dragType = DragType.NONE;
		this.elementDragged = this.elementUnderDragged =
			this.target = this.source = null;
	},

	_update: function () {
		this.updateStream.emit('update');
	},

	/**
	 * Returns true, if current operation involves one object
	 * (reorder within the same list, or drag a new element)
	 * @returns {boolean}
	 * @private
	 */
	_isSingleListOperation: function () {
		return !this.source && this.target;
	},

	_isDraggedOverItself: function () {
		return this.elementUnderDragged === this.elementDragged;
	},

	_mutatedTargetList: function () {
		return this._elementsExtractor(this.target.after);
	},

	_mutatedSourceList: function () {
		return this._elementsExtractor(this.source.after);
	},

	_draggedIndex: function () {
		return this._mutatedTargetList().indexOf(this.elementDragged);
	},

	_underDraggedIndex: function () {
		return this._mutatedTargetList().indexOf(this.elementUnderDragged);
	},

	/**
	 * Returns true, if dragged element already exists in target list
	 * @returns {boolean}
	 * @private
	 */
	_isDraggedInTarget: function () {
		return this._mutatedTargetList().contains(this.elementDragged);
	},

	/**
	 * Removes element from source object.
	 * Is used when dragging element to another list
	 * @private
	 */
	_removeFromSource: function () {
		if (this.source) {
			this.source.after = this._elementsUpdater(this.source.after,
				IU.removeInList(this._mutatedSourceList(), this.elementDragged));
		}
	},

	/**
	 * Inserts element in target object.
	 * Is used when dragging element to another list
	 * @private
	 */
	_insertInTarget: function () {
		this.target.after = this._elementsUpdater(this.target.after,
			IU.insertAt(
				this._mutatedTargetList(),
				this.elementDragged,
				this._underDraggedIndex()
			)
		);
	},

	/**
	 * Sorts list after dragging element over new element
	 * within the same target
	 * @private
	 */
	_reorderElements: function () {
		this.target.after = this._elementsUpdater(this.target.after,
			IU.moveInList(
				this._mutatedTargetList(),
				this._draggedIndex(),
				this._underDraggedIndex()
			)
		);
	},

	_shouldReorderElements: function () {
		return !this._isDraggedOverItself();
	},

	/**
	 * Starts drag of existing element.
	 * Initiates source and target
	 * @param {object} action
	 * @see ActionTypes.DRAG_START_EXISTING
	 * @private
	 */
	_onDragStartExisting: function (action) {
		this.dragType = DragType.EXISTING;
		this.elementDragged = action.dragged;
		this.source = {
			before: action.source,
			after: action.source
		};
		this.target = {
			before: action.source,
			after: action.source
		};
		this._update();
	},

	/**
	 * Starts new element drag.
	 * Creates new element from supplied type
	 * @param {object} action
	 * @see ActionTypes.DRAG_START_NEW
	 * @private
	 */
	_onDragStartNew: function (action) {
		this.dragType = DragType.NEW;
		this.elementDragged = action.dragged;
		this._update();
	},

	/**
	 * Handles all the drag moves
	 * Updates the target if it changed
	 * Updates element, which dragged is currently over
	 * Mutated target and source, if necessary
	 * @param {object} action
	 * @see ActionTypes.DRAG_OVER
	 * @private
	 */
	_onDragOver: function (action) {
		if (!this.target || action.target !== this.target.before) {
			this.target = {
				before: action.target,
				after: action.target
			};
		}
		this.elementUnderDragged = action.underDragged;

		if (!this._isDraggedInTarget()) {
			this._removeFromSource();
			this._insertInTarget();
		} else if (this._shouldReorderElements()) {
			this._reorderElements();
		}
		this._update();
	},

	_actionResult: function () {
		if (this._isSingleListOperation()) {
			return {
				target: this.target
			};
		}
		var mutation = resolveTreeMutation(this.target, this.source);
		return {
			target: mutation[0],
			source: mutation[1]
		};
	},

	/**
	 * Ends drag. Injects results into action,
	 * which is passed along to other stores
	 * @param {object} action
	 * @see ActionTypes.DRAG_END
	 * @private
	 */
	_onDragEnd: function (action) {
		// pass source and result seq to waiting stores
		assign(action, this._actionResult());
		this._reset();
	},

	/* Public API */

	/**
	 * If object is a source or a target of drag'n'drop
	 * @param {object} object tested object
	 * @returns {boolean}
	 */
	isInvolvedInDragOperations: function (object) {
		return this.isDragOperationSource(object) ||
			this.isDragOperationTarget(object);
	},

	isDragOperationSource: function (object) {
		return this.source && this.source.before === object;
	},

	isDragOperationTarget: function (object) {
		return this.target && this.target.before === object;
	},

	isSourceMutated: function () {
		return this.source.before !== this.source.after;
	},

	isTargetMutated: function () {
		return this.target.before !== this.target.after;
	},

	isMutatedSource: function (object) {
		return this.isDragOperationSource(object) &&
			this.isSourceMutated();
	},

	isMutatedTarget: function (object) {
		return this.isDragOperationTarget(object) &&
			this.isTargetMutated();
	},

	/**
	 * If object is a source or a target of drag'n'drop
	 * that was mutated
	 * @param {object} object tested object
	 * @returns {boolean}
	 */
	isMutatedByDragOperations: function (object) {
		return this.isMutatedSource(object) ||
			this.isMutatedTarget(object);
	},

	/**
	 * Returns mutated state for object, if it was mutated
	 * and object itself, if it didn't change
	 * @param {object} object object
	 * @returns {object}
	 */
	relevantStateFor: function (object) {
		if (this.isMutatedTarget(object)) {
			return this.target.after;
		} else if (this.isMutatedSource(object)) {
			return this.source.after;
		}
		return object;
	}

};

module.exports = DragAndDropStore;

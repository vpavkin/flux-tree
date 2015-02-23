'use strict';
var ActionTypes = require('../ActionTypes');

/**
 * @module ActionCreator
 * Defines actions, that relate to the form model
 * changes via ui interactions
 */
class ActionCreator {

	constructor (dispatcher) {
		this._dispatcher = dispatcher;
	}

	/**
	 * an action to load data into the component
	 * @param {Immutable.KeyedIterable} data immutable object
	 * with some children
	 */
	setData (data) {
		this._dispatcher.dispatch({
			type: ActionTypes.SET_DATA,
			data: data
		});
	}

	/**
	 * Start dragging existing element
	 * @param {object} action
	 * @param {StaticSequence} action.source source sequence,
	 * from which element is dragged
	 * @param {Template} action.dragged dragged element template
	 */
	startExistingElementDrag (action) {
		this._dispatcher.dispatch({
			type: ActionTypes.DRAG_START_EXISTING,
			dragged: action.dragged,
			source: action.source
		});
	}

	/**
	 * Start dragging a new element instance
	 * @param {object} action
	 * @param {Template} action.dragged dragged element
	 */
	startNewElementDrag (action) {
		this._dispatcher.dispatch({
			type: ActionTypes.DRAG_START_NEW,
			dragged: action.dragged
		});
	}

	/**
	 * Dragged element is over another element
	 * @param {object} action
	 * @param {StaticSequence} action.target target sequence
	 * @param {Template} action.underDragged element,
	 * that is under the dragged
	 */
	dragElementOverAnother (action) {
		this._dispatcher.dispatch({
			type: ActionTypes.DRAG_OVER,
			underDragged: action.underDragged,
			target: action.target
		});
	}

	/**
	 * Element is dropped
	 * no action , everything that is needed to handle the drop
	 * should be already supplied by dragover actions
	 */
	endElementDrag () {
		this._dispatcher.dispatch({
			type: ActionTypes.DRAG_END
		});
	}

	/**
	 * user expands an expandable element
	 * @param {Object} action
	 * @param {Template} action.element
	 */
	expandElement (action) {
		this._dispatcher.dispatch({
			type: ActionTypes.EXPAND_ELEMENT,
			element: action.element
		});
	}

	/**
	 * user collapses an expandable element
	 * @param {Object} action
	 * @param {Template} action.element
	 */
	collapseElement (action) {
		this._dispatcher.dispatch({
			type: ActionTypes.COLLAPSE_ELEMENT,
			element: action.element
		});
	}

	/**
	 * user deletes an element
	 * @param {Object} action
	 * @param {Template} action.element
	 */
	deleteElement (action) {
		this._dispatcher.dispatch({
			type: ActionTypes.DELETE_ELEMENT,
			element: action.element
		});
	}

}
module.exports = ActionCreator;

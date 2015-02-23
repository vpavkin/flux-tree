"use strict";
var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var ActionTypes = require("../ActionTypes");

/**
 * @module ActionCreator
 * Defines actions, that relate to the form model
 * changes via ui interactions
 */
var ActionCreator = (function () {
	function ActionCreator(dispatcher) {
		_classCallCheck(this, ActionCreator);

		this._dispatcher = dispatcher;
	}

	_prototypeProperties(ActionCreator, null, {
		setData: {

			/**
    * an action to load data into the component
    * @param {Immutable.KeyedIterable} data immutable object
    * with some children
    */
			value: function setData(data) {
				this._dispatcher.dispatch({
					type: ActionTypes.SET_DATA,
					data: data
				});
			},
			writable: true,
			configurable: true
		},
		startExistingElementDrag: {

			/**
    * Start dragging existing element
    * @param {object} action
    * @param {StaticSequence} action.source source sequence,
    * from which element is dragged
    * @param {Template} action.dragged dragged element template
    */
			value: function startExistingElementDrag(action) {
				this._dispatcher.dispatch({
					type: ActionTypes.DRAG_START_EXISTING,
					dragged: action.dragged,
					source: action.source
				});
			},
			writable: true,
			configurable: true
		},
		startNewElementDrag: {

			/**
    * Start dragging a new element instance
    * @param {object} action
    * @param {Template} action.dragged dragged element
    */
			value: function startNewElementDrag(action) {
				this._dispatcher.dispatch({
					type: ActionTypes.DRAG_START_NEW,
					dragged: action.dragged
				});
			},
			writable: true,
			configurable: true
		},
		dragElementOverAnother: {

			/**
    * Dragged element is over another element
    * @param {object} action
    * @param {StaticSequence} action.target target sequence
    * @param {Template} action.underDragged element,
    * that is under the dragged
    */
			value: function dragElementOverAnother(action) {
				this._dispatcher.dispatch({
					type: ActionTypes.DRAG_OVER,
					underDragged: action.underDragged,
					target: action.target
				});
			},
			writable: true,
			configurable: true
		},
		endElementDrag: {

			/**
    * Element is dropped
    * no action , everything that is needed to handle the drop
    * should be already supplied by dragover actions
    */
			value: function endElementDrag() {
				this._dispatcher.dispatch({
					type: ActionTypes.DRAG_END
				});
			},
			writable: true,
			configurable: true
		},
		expandElement: {

			/**
    * user expands an expandable element
    * @param {Object} action
    * @param {Template} action.element
    */
			value: function expandElement(action) {
				this._dispatcher.dispatch({
					type: ActionTypes.EXPAND_ELEMENT,
					element: action.element
				});
			},
			writable: true,
			configurable: true
		},
		collapseElement: {

			/**
    * user collapses an expandable element
    * @param {Object} action
    * @param {Template} action.element
    */
			value: function collapseElement(action) {
				this._dispatcher.dispatch({
					type: ActionTypes.COLLAPSE_ELEMENT,
					element: action.element
				});
			},
			writable: true,
			configurable: true
		},
		deleteElement: {

			/**
    * user deletes an element
    * @param {Object} action
    * @param {Template} action.element
    */
			value: function deleteElement(action) {
				this._dispatcher.dispatch({
					type: ActionTypes.DELETE_ELEMENT,
					element: action.element
				});
			},
			writable: true,
			configurable: true
		}
	});

	return ActionCreator;
})();

module.exports = ActionCreator;
/** @jsx React.DOM */
'use strict';

var assign = require('object-assign');
module.exports = {

	componentDidMount: function () {
		this.props.dndStore.updateStream
			.on('update', this.onDnDUpdate);
		this.props.expandedStore.updateStream
			.on('update', this.onExpandedUpdate);
	},

	componentWillUnmount: function () {
		this.props.dndStore.updateStream
			.removeListener('update', this.onDnDUpdate);
		this.props.expandedStore.updateStream
			.removeListener('update', this.onExpandedUpdate);
	},

	elements: function () {
		return this.props.elementsExtractor(this.props.tree);
	},

	isElementFromHere: function (element) {
		return this.elements().indexOf(element) !== -1;
	},

	onDnDUpdate: function () {
		// no check for if this template is involved in drags,
		// because it can have rendered a new element, which is already
		// dragged away. In that case, it's not involved in drag,
		// but has to update
		this.forceUpdate();
	},

	onExpandedUpdate: function (element) {
		if (this.isElementFromHere(element)) {
			this.forceUpdate();
		}
	},

	onExitingElementDragStart: function (event, element) {
		if (!this.props.dndStore.elementDragged) {
			this.props.actionCreator.startExistingElementDrag({
				dragged: element,
				source: this.props.tree
			});
		}
	},

	onDragOver: function (event, element) {
		event.preventDefault();
		if (!element || this.isElementFromHere(element)) {
			this.props.actionCreator.dragElementOverAnother({
				underDragged: element,
				target: this.props.tree
			});
		}
	},

	onDragEnd: function () {
		this.props.actionCreator.endElementDrag({});
	},

	relevantItemRenderList: function () {
		return this.props.elementsExtractor(
			this.props.dndStore
				.relevantStateFor(this.props.tree)
		);
	},

	renderItem: function (item, index) {
		return this.props.viewFactory.element(item,
			assign({}, this.props, {
				onDragStart: this.onExitingElementDragStart,
				onDragOver: this.onDragOver,
				onDragEnd: this.onDragEnd,
				isDragged: this.props.dndStore.elementDragged === item,
				isExpanded: this.props.expandedStore.isExpanded(item),
				key: index
			})
		);
	},

	renderItems: function () {
		var relevant = this.relevantItemRenderList();
		if (relevant.size) {
			return relevant.map(this.renderItem, this).toArray();
		} else {
			return this.renderStub();
		}
	},

	renderStub: function () {
		var that = this;
		return (
			<div className='stub-renderer'
				onDragOverCapture={function (e) {
					that.onDragOver(e)
				}}
			>
			</div>
		)
	}
};

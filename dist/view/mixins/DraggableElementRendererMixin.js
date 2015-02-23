"use strict";

module.exports = {

	onDragStart: function (event) {
		// to work in FF, drag event needs data to be set
		event.dataTransfer.setData("text/plain", "whatever");

		// Workaround of react's event and render system.
		// When component is re-rendered and DOM Node is replaced,
		// it no longer receives drag events: they just can't get
		// through to the root delegate.
		// So we listen to the dom element itself.

		// Possible cleaner solution - make identical drag-wrappers,
		// so that dom element is reused and never unmounted
		this.getDOMNode().addEventListener("dragend", this.onDragEnd, false);
		this.props.onDragStart(event, this.props.element);
	},

	onDragOver: function (event) {
		this.props.onDragOver(event, this.props.element);
	},

	onDragEnd: function (event) {
		if (this.isMounted()) {
			this.getDOMNode().removeEventListener("dragend", this.onDragEnd, false);
		}
		this.props.onDragEnd(event, this.props.element);
	}
};
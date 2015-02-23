/** @jsx React.DOM */
"use strict";

module.exports = {

	onDelete: function (e) {
		e.stopPropagation();
		this.props.actionCreator.deleteElement({
			element: this.props.element
		});
	}
};
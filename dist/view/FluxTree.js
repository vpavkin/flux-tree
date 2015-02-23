/** @jsx React.DOM */
"use strict";
var React = require("react/addons");
var PureRenderMixin = React.PureRenderMixin;
var DataStore = require("../stores/DataStoreClass");
var ExpandedStore = require("../stores/ExpandedElementsStoreClass");
var DNDStore = require("../stores/DragAndDropStoreClass");
var FluxTreeActionCreator = require("../actions/FluxTreeActionCreatorClass");
var FluxTreeDispatcher = require("../dispatcher/FluxTreeDispatcherClass");
var TreeViewFactory = require("./TreeViewFactory");

module.exports = React.createClass({
	displayName: "exports",


	propTypes: {
		elementsExtractor: React.PropTypes.func.isRequired,
		elementsUpdater: React.PropTypes.func.isRequired,
		identifier: React.PropTypes.func.isRequired,
		typeExtractor: React.PropTypes.func.isRequired,

		leafRenderer: React.PropTypes.func.isRequired,
		nodeListRenderer: React.PropTypes.func.isRequired,
		treeRenderer: React.PropTypes.func.isRequired,

		onDataUpdate: React.PropTypes.func
	},

	mixins: [PureRenderMixin],

	getInitialState: function () {
		var dispatcher = new FluxTreeDispatcher();
		var dndStore = new DNDStore(dispatcher, this.props.identifier, this.props.elementsExtractor, this.props.elementsUpdater);

		return {
			dataStore: new DataStore(dispatcher, dndStore, this.props.data),
			expandedStore: new ExpandedStore(dispatcher, this.props.identifier),
			dndStore: dndStore,
			actionCreator: new FluxTreeActionCreator(dispatcher),
			viewFactory: new TreeViewFactory(this.props.leafRenderer, this.props.treeRenderer, this.props.typeExtractor)
		};
	},

	_preventDefault: function (e) {
		e = e || event;
		e.preventDefault();
	},

	componentDidMount: function () {
		this.state.dataStore.dataStream.on("update", this.props.onDataUpdate);

		/**
   * A top level hook to prevent redirects on drop events
   */
		window.addEventListener("dragover", this._preventDefault);
		window.addEventListener("drop", this._preventDefault);
	},

	componentWillUnmount: function () {
		this.state.dataStore.dataStream.removeListener("update", this.props.onDataUpdate);

		window.removeEventListener("dragover", this._preventDefault);
		window.removeEventListener("drop", this._preventDefault);
	},

	componentWillReceiveProps: function (nextProps) {
		if (nextProps.data !== this.props.data) {
			this.state.dataStore.setData(nextProps.data);
		}
		if (nextProps.leafRenderer !== this.props.leafRenderer || nextProps.treeRenderer !== this.props.treeRenderer) {
			this.state.viewFactory = new TreeViewFactory(this.props.leafRenderer, this.props.treeRenderer);
		}
	},

	dragNew: function (element) {
		this.state.actionCreator.startNewElementDrag({
			dragged: element
		});
	},

	dragNewEnd: function () {
		this.state.actionCreator.endElementDrag();
	},

	render: function () {
		var NodeListRenderer = this.props.nodeListRenderer;
		return React.createElement(
			"div",
			{ className: "flux-tree" },
			React.createElement(NodeListRenderer, {
				actionCreator: this.state.actionCreator,
				dndStore: this.state.dndStore,
				elementsExtractor: this.props.elementsExtractor,
				expandedStore: this.state.expandedStore,
				tree: this.props.data,
				viewFactory: this.state.viewFactory
			})
		);
	}
});
'use strict';

var expect = require('chai').expect;
var immutable = require('immutable');
var sinon = require('sinon');
var ActionTypes = require('../dist/ActionTypes');
var DragType = require('../dist/stores/DragType');
var DND = require('../dist/stores/DragAndDropStoreClass');
var DispatcherClass = require('../dist/dispatcher/FluxTreeDispatcherClass');
var Dispatcher = new DispatcherClass();

var store;
var dispatcherStub;
var updateStub;
var callbacks = {};

describe('DragAndDropStore', function () {

	beforeEach(function () {
		dispatcherStub = sinon.stub(Dispatcher, 'register',
			function (str, callback) {
				callbacks[str] = callback;
			});
		store = new DND(
			Dispatcher,
			function (node) {
				return node.get('id')
			},
			function (node) {
				return node.get('elements')
			},
			function (node, newElements) {
				return node.set('elements', newElements)
			}
		);
		updateStub = sinon.stub(store.updateStream, 'emit');
	});

	afterEach(function () {
		dispatcherStub.restore();
		updateStub.restore();
	});

	describe('construction', function () {

		it('should register to DRAG_START_EXISTING event', function () {
			expect(dispatcherStub.calledWith(ActionTypes.DRAG_START_EXISTING))
				.to.be.true();
		});
		it('should register to DRAG_OVER event', function () {
			expect(dispatcherStub.calledWith(ActionTypes.DRAG_OVER))
				.to.be.true();
		});
		it('should register to DRAG_START_NEW event', function () {
			expect(dispatcherStub.calledWith(ActionTypes.DRAG_START_NEW))
				.to.be.true();
		});
		it('should register to DRAG_OVER event', function () {
			expect(dispatcherStub.calledWith(ActionTypes.DRAG_OVER))
				.to.be.true();
		});
		it('should register to DRAG_END event', function () {
			expect(dispatcherStub.calledWith(ActionTypes.DRAG_END))
				.to.be.true();
		});

		it('should have initial state', function () {
			expect(store.dragType).to.equal(DragType.NONE);
			expect(store.source).to.be.null();
			expect(store.target).to.be.null();
			expect(store.elementDragged).to.be.null();
			expect(store.elementUnderDragged).to.be.null();
			expect(updateStub.called).to.be.false();
		});

	});

	/* Drag existing element */

	describe('drag start existing element', function () {
		var sourceList;
		beforeEach(function () {
			sourceList = immutable.fromJS({
				elements: ['a', 'b', 'draggable']
			});
			callbacks[ActionTypes.DRAG_START_EXISTING].call(store, {
				dragged: 'draggable',
				source: sourceList
			});
		});
		it('should set dragType', function () {
			expect(store.dragType).to.equal(DragType.EXISTING);
		});
		it('should set dragged element', function () {
			expect(store.elementDragged).to.equal('draggable');
		});
		it('should set list states', function () {
			expect(store.source.before).to.equal(sourceList);
			expect(store.source.after).to.equal(sourceList);
			expect(store.target.before).to.equal(sourceList);
			expect(store.target.after).to.equal(sourceList);
		});
		it('should not have elementUnderDragged', function () {
			expect(store.elementUnderDragged).to.be.null();
		});
		it('should update observers', function () {
			expect(updateStub.calledOnce).to.be.true();
		});
	});

	describe('reorder within the same list', function () {
		var sourceList;
		beforeEach(function () {
			sourceList = immutable.fromJS({
				elements: ['a', 'b', 'c', 'draggable', 'e']
			});
			callbacks[ActionTypes.DRAG_START_EXISTING].call(store, {
				dragged: 'draggable',
				source: sourceList
			});
			callbacks[ActionTypes.DRAG_OVER].call(store, {
				target: sourceList,
				underDragged: 'b'
			});
		});
		describe('#drag', function () {
			it('should set underDragged', function () {
				expect(store.elementUnderDragged).to.equal('b');
			});
			it('should not update initial list state', function () {
				expect(store.source.before).to.equal(sourceList);
				expect(store.target.before).to.equal(sourceList);
			});
			it('should reorder elements', function () {
				expect(store.target.after.get('elements').toJS())
					.to.deep.equal(['a', 'draggable', 'b', 'c', 'e']);
			});
			it('should update observers', function () {
				expect(updateStub.calledTwice).to.be.true();
			});
			it('should not reorder id element dragged over itself', function () {
				callbacks[ActionTypes.DRAG_OVER].call(store, {
					target: sourceList,
					underDragged: 'draggable'
				});
				expect(store.target.after.get('elements').toJS())
					.to.deep.equal(['a', 'draggable', 'b', 'c', 'e']);
				expect(updateStub.calledThrice).to.be.true();
			});
		});
		describe('#drop', function () {
			var action = {};
			beforeEach(function () {
				callbacks[ActionTypes.DRAG_END].call(store, action);
			});
			it('should reset state', function () {
				expect(store.dragType).to.equal(DragType.NONE);
				expect(store.source).to.be.null();
				expect(store.target).to.be.null();
				expect(store.elementDragged).to.be.null();
				expect(store.elementUnderDragged).to.be.null();
			});

			it('should only inject target results in the action', function () {
				expect(action.target.before).to.equal(sourceList);
				expect(action.target.after.get('elements').toJS())
					.to.deep.equal(['a', 'draggable', 'b', 'c', 'e']);
				expect(action.source).to.be.undefined();
			});
		});
	});

	/* From List to List tests */

	describe('move existing element to a parent list', function () {
		var sourceList;
		var targetList;
		beforeEach(function () {
			sourceList = immutable.fromJS({
				_id: 'source',
				elements: ['a1', 'b1', 'draggable', 'c1']
			});
			targetList = immutable.fromJS({
				_id: 'target',
				elements: ['a', 'b', 'c', sourceList, 'e']
			});
			callbacks[ActionTypes.DRAG_START_EXISTING].call(store, {
				dragged: 'draggable',
				source: sourceList
			});
			callbacks[ActionTypes.DRAG_OVER].call(store, {
				target: sourceList,
				underDragged: 'b1'
			});
			callbacks[ActionTypes.DRAG_OVER].call(store, {
				target: targetList,
				underDragged: 'b'
			});
		});
		describe('#drag', function () {
			it('should set underDragged', function () {
				expect(store.elementUnderDragged).to.equal('b');
			});
			it('should not update initial list state', function () {
				expect(store.source.before).to.equal(sourceList);
			});
			it('should update target initial state', function () {
				expect(store.target.before).to.equal(targetList);
			});
			it('should remove element from the source', function () {
				expect(store.source.after.get('elements').toJS())
					.to.deep.equal(['a1', 'b1', 'c1']);
			});
			it('should add element in the correct place in the target', function () {
				expect(store.target.after.get('elements').toJS())
					.to.deep.equal(['a', 'draggable', 'b', 'c', sourceList.toJS(), 'e']);
			});
			it('should update observers', function () {
				expect(updateStub.calledThrice).to.be.true();
			});
		});
		describe('#drop', function () {
			var action = {};
			beforeEach(function () {
				callbacks[ActionTypes.DRAG_END].call(store, action);
			});
			it('should merge result source into result target' +
			'and inject it as target', function () {
				expect(action.target.before).to.equal(targetList);
				expect(action.target.after.get('elements').toJS())
					.to.deep.equal(['a', 'draggable', 'b', 'c', {
						_id: 'source',
						elements: ['a1', 'b1', 'c1']
					}, 'e']);
			});
		});
	});

	describe('move existing element to a child list', function () {
		var sourceList;
		var targetList;
		beforeEach(function () {
			targetList = immutable.fromJS({
				_id: 'target',
				elements: ['a1', 'b1', 'c1']
			});
			sourceList = immutable.fromJS({
				_id: 'source',
				elements: ['a', 'draggable', 'c', targetList, 'e']
			});
			callbacks[ActionTypes.DRAG_START_EXISTING].call(store, {
				dragged: 'draggable',
				source: sourceList
			});
			callbacks[ActionTypes.DRAG_OVER].call(store, {
				target: sourceList,
				underDragged: 'c'
			});
			callbacks[ActionTypes.DRAG_OVER].call(store, {
				target: targetList,
				underDragged: 'b1'
			});
		});
		describe('#drag', function () {
			it('should set underDragged', function () {
				expect(store.elementUnderDragged).to.equal('b1');
			});
			it('should not update initial list state', function () {
				expect(store.source.before).to.equal(sourceList);
			});
			it('should update target initial state', function () {
				expect(store.target.before).to.equal(targetList);
			});
			it('should remove element from the source', function () {
				expect(store.source.after.get('elements').toJS())
					.to.deep.equal(['a', 'c', targetList.toJS(), 'e']);
			});
			it('should add element in the correct place in the target', function () {
				expect(store.target.after.get('elements').toJS())
					.to.deep.equal(['a1', 'draggable', 'b1', 'c1']);
			});
			it('should update observers', function () {
				expect(updateStub.calledThrice).to.be.true();
			});
		});
		describe('#drop', function () {
			var action = {};
			beforeEach(function () {
				callbacks[ActionTypes.DRAG_END].call(store, action);
			});
			it('should merge result target into result source' +
			'and inject it as target', function () {
				expect(action.target.before).to.equal(sourceList);
				expect(action.target.after.get('elements').toJS())
					.to.deep.equal(['a', 'c', {
						_id: 'target',
						elements: ['a1', 'draggable', 'b1', 'c1']
					}, 'e']);
				expect(action.source).to.be.undefined();
			});
		});
	});

	describe('move existing element to a not-related list', function () {
		var sourceList;
		var targetList;
		beforeEach(function () {
			targetList = immutable.fromJS({
				_id: 'target',
				elements: ['a1', 'b1', 'c1']
			});
			sourceList = immutable.fromJS({
				_id: 'source',
				elements: ['d', 'draggable', 'e', 'f']
			});
			callbacks[ActionTypes.DRAG_START_EXISTING].call(store, {
				dragged: 'draggable',
				source: sourceList
			});
			callbacks[ActionTypes.DRAG_OVER].call(store, {
				target: sourceList,
				underDragged: 'e'
			});
			callbacks[ActionTypes.DRAG_OVER].call(store, {
				target: targetList,
				underDragged: 'c1'
			});
		});
		describe('#drag', function () {
			it('should set underDragged', function () {
				expect(store.elementUnderDragged).to.equal('c1');
			});
			it('should not update initial list state', function () {
				expect(store.source.before).to.equal(sourceList);
			});
			it('should update target initial state', function () {
				expect(store.target.before).to.equal(targetList);
			});
			it('should remove element from the source', function () {
				expect(store.source.after.get('elements').toJS())
					.to.deep.equal(['d', 'e', 'f']);
			});
			it('should add element in the correct place in the target', function () {
				expect(store.target.after.get('elements').toJS())
					.to.deep.equal(['a1', 'b1', 'draggable', 'c1']);
			});
			it('should update observers', function () {
				expect(updateStub.calledThrice).to.be.true();
			});
		});
		describe('#drop', function () {
			var action = {};
			beforeEach(function () {
				callbacks[ActionTypes.DRAG_END].call(store, action);
			});
			it('should inject both source and target', function () {
				expect(action.source.before).to.equal(sourceList);
				expect(action.source.after.get('elements').toJS())
					.to.deep.equal(['d', 'e', 'f']);
				expect(action.target.before).to.equal(targetList);
				expect(action.target.after.get('elements').toJS())
					.to.deep.equal(['a1', 'b1', 'draggable', 'c1']);
			});
		});
	});

	/* Drag new element */

	describe('add new element', function () {
		var sourceList;
		beforeEach(function () {
			sourceList = immutable.fromJS({
				elements: ['a', 'b']
			});
			callbacks[ActionTypes.DRAG_START_NEW].call(store, {
				dragged: 'draggable'
			});
		});
		describe('#grab', function () {
			it('should set dragType', function () {
				expect(store.dragType).to.equal(DragType.NEW);
			});
			it('should create and set dragged element', function () {
				expect(store.elementDragged).to.equal('draggable');
			});
			it('should not update list states', function () {
				expect(store.source).to.be.null();
				expect(store.target).to.be.null();
			});
			it('should not have elementUnderDragged', function () {
				expect(store.elementUnderDragged).to.be.null();
			});
			it('should update observers', function () {
				expect(updateStub.calledOnce).to.be.true();
			});
		});

		describe('#dragIn', function () {
			beforeEach(function () {
				callbacks[ActionTypes.DRAG_OVER].call(store, {
					target: sourceList,
					underDragged: 'a'
				});
			});
			it('should set underDragged', function () {
				expect(store.elementUnderDragged).to.equal('a');
			});
			it('should update initial list state', function () {
				expect(store.target.before).to.equal(sourceList);
			});
			it('should add element in the correct place in the source/target',
				function () {
					expect(store.target.after.get('elements').toJS())
						.to.deep.equal(['draggable', 'a', 'b']);
				});
			it('should update observers', function () {
				expect(updateStub.calledTwice).to.be.true();
			});
		});

		describe('#dragIn->Out->InAnother', function () {
			var anotherSource;
			beforeEach(function () {
				anotherSource = immutable.fromJS({
					elements: ['a2', 'b2']
				});
				callbacks[ActionTypes.DRAG_OVER].call(store, {
					target: sourceList,
					underDragged: 'a'
				});
				callbacks[ActionTypes.DRAG_OVER].call(store, {
					target: anotherSource,
					underDragged: 'b2'
				});
			});
			it('should set underDragged', function () {
				expect(store.elementUnderDragged).to.equal('b2');
			});
			it('should update initial list state', function () {
				expect(store.target.before).to.equal(anotherSource);
			});
			it('should add element in the correct place in the source/target',
				function () {
					expect(store.target.after.get('elements').toJS())
						.to.deep.equal(['a2', 'draggable', 'b2']);
				});
			it('should update observers', function () {
				expect(updateStub.calledThrice).to.be.true();
			});
		});

		describe('#drop', function () {
			var action = {};
			beforeEach(function () {
				callbacks[ActionTypes.DRAG_OVER].call(store, {
					target: sourceList,
					underDragged: 'a'
				});
				callbacks[ActionTypes.DRAG_END].call(store, action);
			});
			it('should only inject target results in the action', function () {
				expect(action.target.before).to.equal(sourceList);
				expect(action.target.after.get('elements').toJS())
					.to.deep.equal(['draggable', 'a', 'b']);
				expect(action.source).to.be.undefined();
			});
		});
	});

	describe('public API', function () {
		var sourceList;
		var targetList;
		beforeEach(function () {
			targetList = immutable.fromJS({
				_id: 'target',
				elements: ['a1', 'b1', 'c1']
			});
			sourceList = immutable.fromJS({
				_id: 'source',
				elements: ['d', 'draggable', 'e', 'f']
			});
			callbacks[ActionTypes.DRAG_START_EXISTING].call(store, {
				dragged: 'draggable',
				source: sourceList
			});
		});
		describe('after dragStart', function () {

			it('#isInvolvedInDragOperations', function () {
				expect(store.isInvolvedInDragOperations(sourceList))
					.to.be.true();
				expect(store.isInvolvedInDragOperations(targetList))
					.to.be.false();
			});
			it('#isDragOperationSource', function () {
				expect(store.isDragOperationSource(sourceList))
					.to.be.true();
				expect(store.isDragOperationSource(targetList))
					.to.be.false();
			});
			it('#isDragOperationTarget', function () {
				expect(store.isDragOperationTarget(sourceList))
					.to.be.true();
				expect(store.isDragOperationTarget(targetList))
					.to.be.false();
			});
			it('#isSourceMutated', function () {
				expect(store.isSourceMutated()).to.be.false();
			});
			it('#isTargetMutated', function () {
				expect(store.isSourceMutated()).to.be.false();
			});
			it('#isTemplateTheMutatedSource', function () {
				expect(store.isMutatedSource(sourceList))
					.to.be.false();
				expect(store.isMutatedSource(targetList))
					.to.be.false();
			});
			it('#isTemplateTheMutatedTarget', function () {
				expect(store.isMutatedTarget(sourceList))
					.to.be.false();
				expect(store.isMutatedTarget(targetList))
					.to.be.false();
			});
			it('#isMutatedByDragOperations', function () {
				expect(store.isMutatedByDragOperations(sourceList))
					.to.be.false();
				expect(store.isMutatedByDragOperations(targetList))
					.to.be.false();
			});
			it('#relevantStateFor', function () {
				expect(store.relevantStateFor(sourceList))
					.to.be.equal(sourceList);
				expect(store.relevantStateFor(targetList))
					.to.be.equal(targetList);
			});
		});

		describe('after drag mutation', function () {
			beforeEach(function () {
				callbacks[ActionTypes.DRAG_OVER].call(store, {
					underDragged: 'b1',
					target: targetList
				});
			});

			it('#isInvolvedInDragOperations', function () {
				expect(store.isInvolvedInDragOperations(sourceList))
					.to.be.true();
				expect(store.isInvolvedInDragOperations(targetList))
					.to.be.true();
			});

			it('#isDragOperationSource', function () {
				expect(store.isDragOperationSource(sourceList))
					.to.be.true();
				expect(store.isDragOperationSource(targetList))
					.to.be.false();
			});
			it('#isDragOperationTarget', function () {
				expect(store.isDragOperationTarget(sourceList))
					.to.be.false();
				expect(store.isDragOperationTarget(targetList))
					.to.be.true();
			});
			it('#isSourceMutated', function () {
				expect(store.isSourceMutated()).to.be.true();
			});
			it('#isTargetMutated', function () {
				expect(store.isSourceMutated()).to.be.true();
			});
			it('#isTemplateTheMutatedSource', function () {
				expect(store.isMutatedSource(sourceList))
					.to.be.true();
				expect(store.isMutatedSource(targetList))
					.to.be.false();
			});
			it('#isTemplateTheMutatedTarget', function () {
				expect(store.isMutatedTarget(sourceList))
					.to.be.false();
				expect(store.isMutatedTarget(targetList))
					.to.be.true();
			});
			it('#isMutatedByDragOperations', function () {
				expect(store.isMutatedByDragOperations(sourceList))
					.to.be.true();
				expect(store.isMutatedByDragOperations(targetList))
					.to.be.true();
			});
			it('#relevantStateFor', function () {
				expect(store.relevantStateFor(sourceList))
					.to.be.equal(store.source.after);
				expect(store.relevantStateFor(targetList))
					.to.be.equal(store.target.after);
			});
		});
	});
});

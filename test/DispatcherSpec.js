'use strict';

var sinon = require('sinon');
var expect = require('chai').expect;

// jshint -W071
describe('Dispatcher', function () {

	var Dispatcher = require('../dist/dispatcher/Dispatcher');
	var dispatcher;
	var StoreA;
	var StoreB;

	beforeEach(function () {
		dispatcher = new Dispatcher();
		StoreA = {callback: sinon.stub()};
		StoreB = {callback: sinon.stub()};
	});

	it('should execute all subscriber callbacks', function () {
		dispatcher.register('some_type', StoreA.callback, StoreA);
		dispatcher.register('some_type', StoreB.callback, StoreB);

		var payload = {type: 'some_type'};
		dispatcher.dispatch(payload);

		expect(StoreA.callback.calledOnce).to.be.true();
		expect(StoreA.callback.calledWith(payload)).to.be.true();

		expect(StoreB.callback.calledOnce).to.be.true();
		expect(StoreB.callback.calledWith(payload)).to.be.true();

		dispatcher.dispatch(payload);

		expect(StoreA.callback.calledTwice).to.be.true();
		expect(StoreA.callback.getCall(1).args[0]).to.equal(payload);

		expect(StoreB.callback.calledTwice).to.be.true();
		expect(StoreB.callback.getCall(1).args[0]).to.equal(payload);
	});

	it('should wait for callbacks registered earlier', function () {
		dispatcher.register('some_type', StoreA.callback, StoreA);

		dispatcher.register('some_type', function (payload) {
			dispatcher.waitFor([StoreA]);
			expect(StoreA.callback.callCount).to.equal(1);
			expect(StoreA.callback.getCall(0).args[0]).to.equal(payload);
			StoreB.callback(payload);
		});

		var payload = {type: 'some_type'};
		dispatcher.dispatch(payload);

		expect(StoreA.callback.callCount).to.equal(1);
		expect(StoreA.callback.getCall(0).args[0]).to.equal(payload);

		expect(StoreB.callback.callCount).to.equal(1);
		expect(StoreB.callback.getCall(0).args[0]).to.equal(payload);
	});

	it('should wait for callbacks registered later', function () {
		dispatcher.register('some_type', function (payload) {
			dispatcher.waitFor([StoreB]);
			expect(StoreB.callback.callCount).to.equal(1);
			expect(StoreB.callback.getCall(0).args[0]).to.equal(payload);
			StoreA.callback(payload);
		});

		dispatcher.register('some_type', StoreB.callback, StoreB);

		var payload = {type: 'some_type'};
		dispatcher.dispatch(payload);

		expect(StoreA.callback.callCount).to.equal(1);
		expect(StoreA.callback.getCall(0).args[0]).to.equal(payload);

		expect(StoreB.callback.callCount).to.equal(1);
		expect(StoreB.callback.getCall(0).args[0]).to.equal(payload);
	});

	it('should throw if dispatch() while dispatching', function () {
		dispatcher.register('some_type', function (payload) {
			dispatcher.dispatch(payload);
			StoreA.callback();
		});

		var payload = {type: 'some_type'};
		expect(function () {
			dispatcher.dispatch(payload);
		}).to.throw(Error);

		expect(StoreA.callback.callCount).to.equal(0);
	});

	it('should throw if waitFor() while not dispatching', function () {
		dispatcher.register('some_type', StoreA.callback, StoreA);

		expect(function () {
			dispatcher.waitFor([StoreA]);
		}).to.throw(Error);

		expect(StoreA.callback.callCount).to.equal(0);
	});

	it('shouldn\'t throw if waitFor() not dispatched store', function () {
		dispatcher.register('some_type', function () {
			dispatcher.waitFor([StoreA]);
		}, StoreB);

		var payload = {type: 'some_type'};
		expect(function () {
			dispatcher.dispatch(payload);
		}).not.to.throw(Error);
	});

	it('should throw on self-circular dependencies', function () {
		dispatcher.register('some_type', function (payload) {
			dispatcher.waitFor([StoreA]);
			StoreA.callback(payload);
		}, StoreA);

		var payload = {type: 'some_type'};
		expect(function () {
			dispatcher.dispatch(payload);
		}).to.throw(Error);

		expect(StoreA.callback.callCount).to.equal(0);
	});

	it('should throw on multi-circular dependencies', function () {
		dispatcher.register('some_type', function (payload) {
			dispatcher.waitFor([StoreB]);
			StoreA.callback(payload);
		}, StoreA);

		dispatcher.register('some_type', function (payload) {
			dispatcher.waitFor([StoreA]);
			StoreB.callback(payload);
		}, StoreB);

		var payload = {type: 'some_type'};
		expect(function () {
			dispatcher.dispatch(payload);
		}).to.throw(Error);

		expect(StoreA.callback.callCount).to.equal(0);
		expect(StoreB.callback.callCount).to.equal(0);
	});

	it('should remain consistent after a failed dispatch', function () {
		dispatcher.register('some_type', StoreA.callback, StoreA);
		dispatcher.register('some_type', function (payload) {
			if (payload.shouldThrow) {
				throw new Error();
			}
			StoreB.callback();
		}, StoreB);

		expect(function () {
			dispatcher.dispatch({type: 'some_type', shouldThrow: true});
		}).to.throw(Error);

		// Cannot make assumptions about a failed dispatch.
		var StoreAcallbackCount = StoreA.callback.callCount;

		dispatcher.dispatch({type: 'some_type', shouldThrow: false});

		expect(StoreA.callback.callCount).to.equal(StoreAcallbackCount + 1);
		expect(StoreB.callback.callCount).to.equal(1);
	});

	it('should properly unregister callbacks', function () {
		dispatcher.register('some_type', StoreA.callback, StoreA);

		dispatcher.register('some_type', StoreB.callback, StoreB);

		var payload = {type: 'some_type'};
		dispatcher.dispatch(payload);

		expect(StoreA.callback.callCount).to.equal(1);
		expect(StoreA.callback.getCall(0).args[0]).to.equal(payload);

		expect(StoreB.callback.callCount).to.equal(1);
		expect(StoreB.callback.getCall(0).args[0]).to.equal(payload);

		dispatcher.unregister('some_type', StoreB.callback);

		dispatcher.dispatch(payload);

		expect(StoreA.callback.callCount).to.equal(2);
		expect(StoreA.callback.getCall(1).args[0]).to.equal(payload);

		expect(StoreB.callback.callCount).to.equal(1);
	});

	it('should dispatch only to stores, subscribed to actionId', function () {
		dispatcher.register('some_type', StoreA.callback, StoreA);
		dispatcher.register('other_type', StoreB.callback, StoreB);

		var payload = {type: 'some_type'};
		dispatcher.dispatch(payload);

		expect(StoreA.callback.callCount).to.equal(1);
		expect(StoreA.callback.getCall(0).args[0]).to.equal(payload);

		expect(StoreB.callback.callCount).to.equal(0);
	});

	it('should not register the same callback twice', function () {
		dispatcher.register('some_type', StoreA.callback, StoreA);
		dispatcher.register('some_type', StoreA.callback, StoreA);
		dispatcher.register('some_type', StoreA.callback, StoreA);

		var payload = {type: 'some_type'};
		dispatcher.dispatch(payload);

		expect(StoreA.callback.callCount).to.equal(1);
		expect(StoreA.callback.getCall(0).args[0]).to.equal(payload);
	});

	it('should throw if payload is null or undefined', function () {
		dispatcher.register('some_type', StoreA.callback, StoreA);

		expect(function () {
			dispatcher.dispatch();
		}).to.throw(Error);

		expect(function () {
			dispatcher.dispatch(null);
		}).to.throw(Error);

		expect(StoreA.callback.callCount).to.equal(0);
	});

	it('should throw if payload doesn\'t have a type', function () {
		dispatcher.register('some_type', StoreA.callback, StoreA);

		expect(function () {
			dispatcher.dispatch({});
		}).to.throw(Error);

		expect(StoreA.callback.callCount).to.equal(0);
	});
});

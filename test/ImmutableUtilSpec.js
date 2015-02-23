'use strict';

var expect = require('chai').expect;
var immutable = require('immutable');
var IU = require('../dist/util/ImmutableUtil');

describe('Immutable Util', function () {

	describe('#deepKeyOf', function () {

		var struct = immutable.fromJS({
			a: 'a',
			b: 'b',
			c: [
				{d: 'd'},
				{e: 'e'},
				{
					f: {
						g: 'g',
						h: 'h'
					}
				}
			],
			i: 'i',
			j: {
				k: {
					l: ['l', {
						m: 'm'
					}]
				},
				o: 'o'
			}
		});

		it('should return undefined when value is not found', function () {
			expect(IU.deepKeyOf(struct, 'noo')).to.be.undefined();
			expect(IU.deepKeyOf(struct, null)).to.be.undefined();
			expect(IU.deepKeyOf(null, 'noo')).to.be.undefined();
			expect(IU.deepKeyOf('', 'noo')).to.be.undefined();
		});

		it('should return empty key if structure to search in equals the value',
			function () {
				expect(IU.deepKeyOf(struct, struct).toJS()).to.deep.equal([]);
				expect(IU.deepKeyOf(struct.get('a'), struct.get('a')).toJS())
					.to.deep.equal([]);
				expect(IU.deepKeyOf(null, null).toJS()).to.deep.equal([]);
			});

		it('should return deep key if value is found ', function () {
			expect(IU.deepKeyOf(immutable.List.of(1, 2, 3, 4), 3).toJS())
				.to.deep.equal([2]);
			expect(IU.deepKeyOf(struct, struct.get('a')).toJS()).to.deep.equal(['a']);
			expect(IU.deepKeyOf(struct, struct.get('j')).toJS()).to.deep.equal(['j']);
			expect(IU.deepKeyOf(struct, struct.getIn(['j', 'k'])).toJS())
				.to.deep.equal(['j', 'k']);
			expect(IU.deepKeyOf(struct, struct.getIn(['c', 0])).toJS())
				.to.deep.equal(['c', 0]);
			expect(IU.deepKeyOf(struct, 'm').toJS())
				.to.deep.equal(['j', 'k', 'l', 1, 'm']);
			expect(IU.deepKeyOf(struct, 'g').toJS())
				.to.deep.equal(['c', 2, 'f', 'g']);
		});
	});

	describe('moveInList', function () {
		var source = immutable.fromJS(['a', 'b', 'c', 'd', 'e']);
		it('should move item', function () {
			expect(IU.moveInList(source, 0, 1).toJS())
				.to.deep.equal(['b', 'a', 'c', 'd', 'e']);
			expect(IU.moveInList(source, 1, 0).toJS())
				.to.deep.equal(['b', 'a', 'c', 'd', 'e']);
			expect(IU.moveInList(source, 0, 2).toJS())
				.to.deep.equal(['b', 'c', 'a', 'd', 'e']);
			expect(IU.moveInList(source, 2, 4).toJS())
				.to.deep.equal(['a', 'b', 'd', 'e', 'c']);
		});
	});

	describe('insertAt', function () {
		var source = immutable.fromJS(['a', 'b', 'c', 'd', 'e']);
		it('should insert item at specified index', function () {
			expect(IU.insertAt(immutable.List(), 'q', 0).toJS())
				.to.deep.equal(['q']);
			expect(IU.insertAt(source, 'q', 0).toJS())
				.to.deep.equal(['q', 'a', 'b', 'c', 'd', 'e']);
			expect(IU.insertAt(source, 'q', 1).toJS())
				.to.deep.equal(['a', 'q', 'b', 'c', 'd', 'e']);
			expect(IU.insertAt(source, 'q', 2).toJS())
				.to.deep.equal(['a', 'b', 'q', 'c', 'd', 'e']);
			expect(IU.insertAt(source, 'q', 3).toJS())
				.to.deep.equal(['a', 'b', 'c', 'q', 'd', 'e']);
		});
	});

	describe('strictContains', function () {
		var a = immutable.fromJS({a: [1, 2]});
		var b = immutable.fromJS({a: [1, 2]});
		var l = immutable.List.of(a);
		it('should return true for exact same instance',
			function () {
				expect(IU.strictContains(l, a)).to.be.true();
			});

		it('should return false for deep equal object',
			function () {
				expect(IU.strictContains(l, b)).to.be.false();
			});
	});
});

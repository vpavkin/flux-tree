'use strict';

var expect = require('chai').expect;
var F = require('../dist/util/Functions');
describe('Functions', function () {

	describe('propOneOf', function () {

		it('should return true when property is in supplied array', function () {
			expect(F.propOneOf('asd', ['1', '3', '12'], {asd: '12'})).to.be.true();
		});

		it('should return false when property is not in array', function () {
			expect(F.propOneOf('asd', ['1', '3', '12'], {asd: '14'})).to.be.false();
		});

		it('should partially apply', function () {
			expect(F.propOneOf('asd', ['1', '3', '12'])({asd: '12'})).to.be.true();
			expect(F.propOneOf('asd', ['1', '3', '12'])({asd: '14'})).to.be.false();
		});
	});

	describe('pickPath', function () {
		it('picks values with supplied keys', function () {
			var picked = F.pickPath(['a', 'b', 'c'], ['p.r.a', 'p.v', 'd'], {
				p: {
					r: {
						a: 'A'
					},
					v: 'B'
				},
				d: 'C'
			});
			expect(picked).to.deep.equal({a: 'A', b: 'B', c: 'C'});
		});
	});

	describe('keyOf', function () {
		it('should find the key of existing element', function () {
			expect(F.keyOf({a: '123', b: '4', c: '33'}, '4')).to.equal('b');
		});

		it('should return undefined if there\' s no such value', function () {
			expect(F.keyOf({a: '123', b: '4', c: '33'}, '124')).to.be.undefined();
		});
	});

	describe('firstKey', function () {
		it('should find the only key', function () {
			expect(F.firstKey({a: '123'})).to.equal('a');
		});
	});

	describe('substrUntil', function () {
		it('should return a substr if a limiter found', function () {
			expect(F.substrUntil('/', 'str/foo/bar')).to.equal('str');
		});
		it('should return the whole string if limiter wasn\'t found', function () {
			expect(F.substrUntil('/', 'strfoobar')).to.equal('strfoobar');
			expect(F.strHead(F.strTail('[123]'))).to.equal('123');
		});
	});

	describe('mapObjToArray', function () {
		it('should return an array', function () {
			expect(F.mapObjToArray(F.I, {})).to.be.instanceof(Array);
		});
		it('should return an array of mapped values', function () {
			var arr = F.mapObjToArray(F.add(4), {a: 2, b: 7});
			expect(arr).to.contain(6);
			expect(arr).to.contain(11);
		});
	});

	describe('moveInArray', function () {
		var source = ['a', 'b', 'c', 'd', 'e'];
		it('should move item', function () {
			expect(F.moveInArray(source, 0, 1))
				.to.deep.equal(['b', 'a', 'c', 'd', 'e']);
			expect(F.moveInArray(source, 1, 0))
				.to.deep.equal(['b', 'a', 'c', 'd', 'e']);
			expect(F.moveInArray(source, 0, 2))
				.to.deep.equal(['b', 'c', 'a', 'd', 'e']);
			expect(F.moveInArray(source, 2, 4))
				.to.deep.equal(['a', 'b', 'd', 'e', 'c']);
		});
	});
});

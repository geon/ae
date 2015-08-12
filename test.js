'use strict';


var thenext = require('./index.js');
var vows = require('vows');
var assert = require('assert');


function makeUsersPromise () {

	return Promise.resolve([
		'geon',
		'neon',
		'peon'
	].map(function (name, index) {

		return {
			id: index + 1,
			name: name
		};
	}));
}


function asyncUppercase (string) {

	return new Promise(function(resolve, reject) {

		setTimeout(function () {

			resolve(string.toUpperCase());

		}, 0);
	});
}


function nodify (promise) {

	return function (callback) {

		promise
			.then(function (results) {

				callback(null, results);

			}, function (error) {

				callback(error);
			});
	}
}


vows.describe('thenext')
	.addBatch({
		'proxy for Array.prototype.map': {
			topic: function () {

				nodify(
					makeUsersPromise()
						.then(thenext.map(function (user) { return user.name; }))
						.then(thenext.map(asyncUppercase))
						.then(Promise.all.bind(Promise))
						.then(function (results) {

							return results.join();
						})
				)(this.callback);
			},

			'the mapped function should be applied to all elements in the array': function (topic) {
				assert.equal(topic, 'GEON,NEON,PEON');
			}
		},
		'proxy for Array.prototype.filter': {
			topic: function () {

				nodify(
					makeUsersPromise()
						.then(thenext.filter(function (user) { return user.id != 1; }))
						.then(thenext.map(function (user) { return user.name; }))
						.then(function (results) {

							return results.join();
						})
				)(this.callback);
			},

			'some elements should be filtered out': function (topic) {
				assert.equal(topic, 'neon,peon');
			}
		},
		'proxy for Array.prototype.reduce': {
			topic: function () {

				nodify(
					makeUsersPromise()
						.then(thenext.map(function (user) { return user.name; }))
						.then(thenext.reduce(function (soFar, next) { return soFar + next; }, 'foo'))
				)(this.callback);
			},

			'the array should be reduced': function (topic) {
				assert.equal(topic, 'foogeonneonpeon');
			}
		},
		'when objectifying': {
			topic: function () {

				nodify(
					Promise.resolve([
						1,
						'geon'
					])
						.then(thenext.object([
							'id',
							'name'
						]))
				)(this.callback);
			},

			'the array should objectified': function (topic) {
				assert.equal(topic.id + topic.name, '1geon');
			}
		},
		'when asserting passes': {
			topic: function () {

				nodify(
					Promise.resolve(1)
						.then(thenext.assert(
							function (result) { return result == 1; },
							'This should not be triggered.'
						))
				)(this.callback);
			},

			'the assert should pass': function (topic) {
				// throwing
			}
		},
		'when asserting fails': {
			topic: function () {

				nodify(
					Promise.resolve(1)
						.then(thenext.assert(
							function (result) { return result == 2; },
							'This SHOULD be triggered.'
						))
						.catch(function (error) {

							return error.message;
						})
				)(this.callback);
			},

			'the assert should not pass': function (topic) {
				assert.equal(topic, 'This SHOULD be triggered.')
			}
		},
		'when pipelining': {
			topic: function () {

				var counter = 0;
				function generator () {

					return function (argument) {

						return argument + ',' + counter++;
					};
				}

				nodify(
					Promise.resolve([
						generator(),
						generator()
					])
						.then(thenext.pipeline)
				)(this.callback);
			},

			'the functions should run in requence, the results passed to each other': function (topic) {
				assert.equal(topic, 'undefined,0,1');
			}
		},
		'when sequencing': {
			topic: function () {

				var counter = 0;
				function generator (delay) {

					return function (argument) {

						if (argument) {

							throw new Error('Recieved argument.');
						}

						return new Promise(function (resolve, reject) {

							setTimeout(function () {

								resolve(counter++);

							}, delay);
						});
					};
				}

				nodify(
					Promise.resolve([
						generator(100),
						generator(10)
					])
						.then(thenext.sequence)
						.then(function (results) {

							return results.join();
						})
				)(this.callback);
			},

			'the sequenced functions should not recieve the result from the last': function (topic) {
				// Throws
			},

			'the functions should run in requence': function (topic) {
				assert.equal(topic, '0,1');
			}
		}
	})
	.run();

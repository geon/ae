'use strict';


var ae = require('./index.js');
var vows = require('vows');


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


function assert (condition) {

	if (!condition) {

		throw new Error();
	}
}


vows.describe('ae')
	.addBatch({
		'proxy for Array.prototype.map': {
			topic: function () {

				nodify(
					makeUsersPromise()
						.then(ae.map(function (user) { return user.name; }))
				)(this.callback);
			},

			'the mapped function should be applied to all elements in the array': function (topic) {
				assert(topic.join() == 'geon,neon,peon');
			}
		},
		'proxy for Array.prototype.filter': {
			topic: function () {

				nodify(
					makeUsersPromise()
						.then(ae.filter(function (user) { return user.id != 1; }))
						.then(ae.map(function (user) { return user.name; }))
				)(this.callback);
			},

			'some elements should be filtered out': function (topic) {
				assert(topic.join() == 'neon,peon');
			}
		},
		'proxy for Array.prototype.reduce': {
			topic: function () {

				nodify(
					makeUsersPromise()
						.then(ae.map(function (user) { return user.name; }))
						.then(ae.reduce(function (soFar, next) { return soFar + next; }, 'foo'))
				)(this.callback);
			},

			'the array should be reduced': function (topic) {
				assert(topic == 'foogeonneonpeon');
			}
		},
		'proxy for Array.prototype.join': {
			topic: function () {

				nodify(
					makeUsersPromise()
						.then(ae.map(function (user) { return user.name; }))
						.then(ae.join(', '))
				)(this.callback);
			},

			'the array should be joined': function (topic) {
				assert(topic == 'geon, neon, peon');
			}
		},
		'when objectifying': {
			topic: function () {

				nodify(
					Promise.resolve([
						1,
						'geon'
					])
						.then(ae.object([
							'id',
							'name'
						]))
				)(this.callback);
			},

			'the array should be objectified': function (topic) {
				assert(topic.id + topic.name == '1geon');
			}
		},
		'when objectifying without an array': {
			topic: function () {

				nodify(
					Promise.resolve([
						1,
						'geon'
					])
						.then(ae.object(
							'id',
							'name'
						))
				)(this.callback);
			},

			'the arguments should be objectified': function (topic) {
				assert(topic.id + topic.name == '1geon');
			}
		},
		'when asserting passes': {
			topic: function () {

				nodify(
					Promise.resolve(1)
						.then(ae.assert(
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
						.then(ae.assert(
							function (result) { return result == 2; },
							'This SHOULD be triggered.'
						))
						.catch(function (error) {

							return error.message;
						})
				)(this.callback);
			},

			'the assert should not pass': function (topic) {
				assert(topic == 'This SHOULD be triggered.')
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
						.then(ae.pipeline)
				)(this.callback);
			},

			'the functions should run in requence, the results passed to each other': function (topic) {
				assert(topic == 'undefined,0,1');
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
						.then(ae.sequence)
				)(this.callback);
			},

			'the sequenced functions should not recieve the result from the last': function (topic) {
				// Throws
			},

			'the functions should run in requence': function (topic) {
				assert(topic.join() == '0,1');
			}
		},
		'when running n in parallel': {
			topic: function () {

				var array = [
					10,
					20,
					30,
					10,
					50,
					60,
					30,
					10,
					40,
					40,
					30,
					10,
					20,
					10,
					30,
					10
				];

				nodify(
					Promise.resolve(array)
						.then(ae.map(function (number) {

							return function () {

								return Promise.resolve(number).then(ae.delay(number));
							};
						}))
						.then(ae.parallel(4))
						.then(ae.assert(function (result) {

							return result.join() == array.join();
						}))
				)(this.callback);
			},

			'parallel not in order': function (topic) {
				// Throws
			}
		}
	})
	.run();

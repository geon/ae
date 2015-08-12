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


vows.describe('thenext')
	.addBatch({
		'proxy for Array.prototype.map': {
			topic: function () {

				var callback = this.callback;

				makeUsersPromise()
					.then(thenext.map(function (user) { return user.name; }))
					.then(thenext.map(asyncUppercase))
					.then(Promise.all.bind(Promise))
					.then(function (results) {

						return results.join();
					})
					.then(function (results) {

						callback(null, results);

					}, function (error) {

						callback(error);
					});

			},

			'the mapped function should be applied to all elements in the array': function (topic) {
				assert.equal(topic, 'GEON,NEON,PEON');
			}
		}
	})
	.addBatch({
		'proxy for Array.prototype.filter': {
			topic: function () {

				var callback = this.callback;

				makeUsersPromise()
					.then(thenext.filter(function (user) { return user.id != 1; }))
					.then(thenext.map(function (user) { return user.name; }))
					.then(function (results) {

						return results.join();
					})
					.then(function (results) {

						callback(null, results);

					}, function (error) {

						callback(error);
					});

			},

			'some elements should be filtered out': function (topic) {
				assert.equal(topic, 'neon,peon');
			}
		}
	})
	.addBatch({
		'when sequencing': {
			topic: function () {

				var callback = this.callback;

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

				Promise.resolve([
					generator(100),
					generator(10)
				])
					.then(thenext.sequence)
					.then(function (results) {

						return results.join();
					})
					.then(function (results) {

						callback(null, results);

					}, function (error) {

						callback(error);
					});
			},

			'the sequenced functions should not recieve the result from the last': function (topic) {
				// Throws
			},

			'the functions should run in requence': function (topic) {
				assert.equal(topic, '0,1');
			}
		}
	})
	.addBatch({
		'when pipelining': {
			topic: function () {

				var callback = this.callback;

				var counter = 0;
				function generator () {

					return function (argument) {

						return argument + ',' + counter++;
					};
				}

				Promise.resolve([
					generator(),
					generator()
				])
					.then(thenext.pipeline)
					.then(function (results) {

						callback(null, results);

					}, function (error) {

						callback(error);
					});
			},

			'the functions should run in requence, the results passed to each other': function (topic) {
				assert.equal(topic, 'undefined,0,1');
			}
		}
	})
	.run();

















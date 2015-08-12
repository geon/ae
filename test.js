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


function compareArrays (a, b) {

	return a.length == b.length &&
		a
			.map(function (foo, index) {
				return {
					a: a[index],
					b: b[index]
				}
			})
			.reduce(function (soFar, next) {
				return soFar && next.a === next.b;
			}, true);
}


var counter = 0;
vows.describe('thenext').addBatch({
	'when sequencing': {
		topic: function () {

			var callback = this.callback;

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
				generator(10),
				generator(100)
			])
				.then(thenext.sequence)
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
			assert.ok(compareArrays(topic, [0, 1]));
		},

		'all functions should run': function (topic) {
			assert.equal(counter, 2);
		}
	}
}).run();

















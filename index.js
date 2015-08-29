'use strict';


var Promise = require('es6-promise').Promise;


var ae = {};
module.exports = ae;


ae.method = function (methodName) {

	return function () {

		var args = arguments;

		return function (result) {

			return result[methodName].apply(result, args);
		};
	};
};


// `ae.map = ae.method('map');` and so on.
['map', 'filter', 'reduce', 'join'].forEach(function (methodName) {

	ae[methodName] = ae.method(methodName);
});


ae.object = function (names) {

	// Handle multiple arguments instead of an array.
	if (arguments.length > 1) {

		names = [].slice.call(arguments)
	}

	return function (results) {

		var object = {};

		names.forEach(function (name, index) {

			object[name] = results[index];
		});

		return object;
	};
};


ae.assert = function (assertion, errorMesage) {

	return function (result) {

		if (!assertion(result)) {

			var error = new Error(errorMesage);
			error.badInput = result;
			throw error;
		}

		return result;
	};
};


ae.all = Promise.all.bind(Promise);


ae.pipeline = ae.reduce(
	function (soFar, next) {

		// Pipe each promise into the next.
		return soFar.then(next);
	},
	// Start with an empty promise.
	Promise.resolve()
);


ae.sequence = function (array) {

	var results = [];

	return array.reduce(
		function (soFar, next) {

			return soFar
				.then(next)
				.then(function (result) {

					// Collect all results individually.
					results.push(result);
				});
		},
		// Start with an empty promise.
		Promise.resolve()
	)
		.then(function () {

			return results;
		})
		.catch(function (error) {

			// Rethrow with partial results.
			error.partialSequenceResults = results;
			throw error;
		});
};

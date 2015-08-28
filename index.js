'use strict';


var Promise = require('es6-promise').Promise;


var thenext = {};
module.exports = thenext;


thenext.method = function (methodName) {

	return function () {

		var args = arguments;

		return function (result) {

			return result[methodName].apply(result, args);
		};
	};
};


// `thenext.map = thenext.method('map');` and so on.
['map', 'filter', 'reduce'].forEach(function (methodName) {

	thenext[methodName] = thenext.method(methodName);
});


thenext.object = function (names) {

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


thenext.assert = function (assertion, errorMesage) {

	return function (result) {

		if (!assertion(result)) {

			var error = new Error(errorMesage);
			error.badInput = result;
			throw error;
		}

		return result;
	};
};


thenext.all = Promise.all.bind(Promise);


thenext.pipeline = thenext.reduce(
	function (soFar, next) {

		// Pipe each promise into the next.
		return soFar.then(next);
	},
	// Start with an empty promise.
	Promise.resolve()
);


thenext.sequence = function (array) {

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

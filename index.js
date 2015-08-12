'use strict';


var Promise = require('es6-promise').Promise;


var thenext = {};
module.exports = thenext;


thenext.map = function (func) {

	return function (array) {

		return array.map(func);
	};
};


thenext.filter = function (func) {

	return function (array) {

		return array.filter(func);
	};
};


thenext.reduce = function (func, initial) {

	return function (array) {

		return array.reduce(func, initial);
	};
};


thenext.pipeline = thenext.reduce(
	function (soFar, next) {

		// Pipe each promise into the next.
		return soFar.then(next);
	},
	// Start with an empty promise.
	Promise.resolve()
);


thenext.all = Promise.all.bind(Promise);


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


thenext.assert = function (trigger, errorMesage) {

	return function (result) {

		if (trigger(result)) {

			var error = new Error(errorMesage);
			error.badInput = result;
			throw error;
		}

		return result;
	};
};


	// .then(thenext.apply([].join))

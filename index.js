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


ae.delay = function (delayInMilliseconds) {

	return function (result) {

		return new Promise(function (resolve, reject) {

			setTimeout(function () { resolve(result); }, delayInMilliseconds);
		});
	};
};


ae.parallel = function (numWorkers) {

	return function (generators) {

		// Pair the job with it's index, so the result can be saved at the right place.
		var queue = generators.map(function (job, index) {

			return {
				job: job,
				index: index
			};
		});

		var results = [];

		var runNextJob = function () {

			// Pick a job from the common queue.
			var next = queue.shift();

			// Quit this worker if there are no more jobs.
			if (!next) {

				return;
			}

			// Do the job, save the result and loop.
			return next.job()
				.then(function (result) {

					results[next.index] = result;
				})
				.catch(function (error) {

					// There was an error, so flush the queue.
					// No point in having the other workers continue.
					generators = [];

					// The error is not handled here. Propagate.
					throw error;
				})
				.then(runNextJob);
		};

		// Start n workers.
		var workers = [];
		for (var i = 0; i < numWorkers; i++) {

			workers.push(runNextJob());
		}

		// When all workers are done...
		return Promise.all(workers)
			.then(function () {

				// ...return their common results.
				return results;
			})
	};
};

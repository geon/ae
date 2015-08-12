
Promise.all(promise1, promise2)
	.then(function (results) {

		return {
			nameA: results[0],
			nameB: results[1]
		};
	});



Promise.all(promise1, promise2)
	.then(thenext.object('nameA', 'nameB'))

Promise.all(promise1, promise2)
	.then(thenext.object(['nameA', 'nameB']))











[makePromise1(), makePromise2()]
	.reduce(function (soFar, next) { return soFar.then(next); }, Promise.resolve(firstValue))


Promise.resolve([makePromise1(), makePromise2()])
	.then(thenext.pipeline)






userPromise
	.then(throw(
		function (user) {
			return user.hasPermission;
		},
		'User missing permission.'
	))

userPromise
	.then(throw(user => user.hasPermission, 'User missing permission.'))





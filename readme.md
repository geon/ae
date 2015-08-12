

This library contains some helper functions for working with js promises.

Without thenext:

```js
Promise.all([
	readSomeFile(),
	querySomeDb()
])
	.then(function (results) {

		return {
			fileContents: results[0],
			dbRows:       results[1]
		};
	});
```

With thenext:

```js
Promise.all([
	readSomeFile(),
	querySomeDb()
])
	.then(thenext.object(
		'fileContents',
		'dbRows'
	))
```









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





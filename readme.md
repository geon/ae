

This library contains some helper functions for working with js promises.

Without thenext:

```js
somePromise
	.then(function (results) {

		return {
			someProperty:    results[0],
			anotherProperty: results[1]
			lotsOfPropertis: results[2]
			iCouldGoOn:      results[3]
		};
	});
```

With thenext:

```js
somePromise
	.then(thenext.object(
		'someProperty',
		'anotherProperty',
		'lotsOfPropertis',
		'iCouldGoOn'
	))
```

Without thenext:

```js
arrayOfPromiseGenerators
	.reduce(
		function (soFar, next) {

			return soFar.then(next);
		},
		Promise.resolve()
	)
```

With thenext:

```js
arrayOfPromiseGenerators
	.then(thenext.pipeline)
```

Without thenext:

```js
userPromise
	.then(function (user) {

		if (!user.hasPermission) {

			throw new Error('User missing permission.');
		}
	})
```

With thenext:

```js
userPromise
	.then(thenext.assert(
		function (user) { return user.hasPermission; },
		'User missing permission.'
	))
```

Or even nicer in ES6:

```js
userPromise
	.then(thenext.assert(
		user => user.hasPermission,
		'User missing permission.'
	))
```










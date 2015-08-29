

This library contains some helper functions for working with js promises.

Without ae:

```js
somePromise
	.then(function (results) {

		return {
			someProperty:     results[0],
			anotherProperty:  results[1]
			lotsOfProperties: results[2]
			iCouldGoOn:       results[3]
		};
	});
```

With ae:

```js
somePromise
	.then(ae.object(
		'someProperty',
		'anotherProperty',
		'lotsOfProperties',
		'iCouldGoOn'
	))
```

Without ae:

```js
arrayOfPromiseGenerators
	.reduce(
		function (soFar, next) {

			return soFar.then(next);
		},
		Promise.resolve()
	)
```

With ae:

```js
arrayOfPromiseGenerators
	.then(ae.pipeline)
```

Without ae:

```js
userPromise
	.then(function (user) {

		if (!user.hasPermission) {

			throw new Error('User missing permission.');
		}
	})
```

With ae:

```js
userPromise
	.then(ae.assert(
		function (user) { return user.hasPermission; },
		'User missing permission.'
	))
```

Or even nicer in ES6:

```js
userPromise
	.then(ae.assert(
		user => user.hasPermission,
		'User missing permission.'
	))
```










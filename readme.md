
Ae
==

Then æsthetics - helper functions for working with js promises.

In my experience with working with js promises over the last 2 years, I learned to appreciate a certain programming style.

At first, my code looked pretty much like the regular callback-hell based code.

```js
readSomeSettings
	.then(function (settings) {

		var relevantPieceOfSettings = extractRelevantPiece(settings);

		return fetchDataBasedOnSettings(relevantPieceOfSettings)
			.then(function (dataInJSONFormattedText) {

				var data = JSON.parse(dataInJSONFormattedText);

				return doStuffWithIt(data);
			});
	});
```

The reason was that I was more comfortable working with plain data instead of promises as soon as I had the chance.

Consider this way of doing it instead:


```js
readSomeSettings
	.then(extractRelevantPiece)
	.then(fetchDataBasedOnSettings)
	.then(JSON.parse)
	.then(doStuffWithIt)
```


Instead of trying to work in the "normal" synchronous world, all data is returned as soon as possible to be wrapped up in a promise. From there, `then` is used to transform it further.

This is a contrived example, but I find that this style of coding makes the code more readable, writable and maintainable.

However, common methods like `map` and `reduce` don't work well with `then`. This library fixes that.

Have a look at this less contrived example. Starting with this callback hell-ish implementation, let's refactor to a more æsthetic style.

```js
fetchListOfUrls
	.then(function (urlsJson) {

		return Promise.all(JSON.parse(urlsJson).map(function (url) {

			return fetchUrl(url);
				.then(function (urlContent) {

					return saveToDisk(urlContent);
				})
		}))
	});
```

It's 3 scopes deep and just barely readable. In a real application it would be even worse. We can start with the low hanging fruit by breaking out `JSON.parse` and `Promise.all`.

```js
fetchListOfUrls
	.then(JSON.parse)
	.then(function (urls) {

		return urlsJson.map(function (url) {

			return fetchUrl(url);
				.then(function (urlContent) {

					return saveToDisk(urlContent);
				})
		}))
	})
	.then(Promise.all);
```

I think this is better separation of concern. Now we don't need those nested scopes. Let's un-nest them.

```js
fetchListOfUrls
	.then(JSON.parse)
	.then(function (urls) {

		return urls.map(fetchUrl);
	})
	.then(function (urlsContent) {

		return urlsContent.map(saveToDisk);
	})
	.then(Promise.all);
```


Shallower and clearer, but with lots of boilerplate noise. All the `function () {}` and `return` (which is easy to miss, but hard to debug, by the way) just serve to confuse the meaning of the actual code.

You might have noticed how both anonymous functions are nearly identical, and completely pointless. Let's use an implementation of `map`that works with `then`.


```js
fetchListOfUrls
	.then(JSON.parse)
	.then(ae.map(fetchUrl))
	.then(ae.map(saveToDisk))
	.then(Promise.all);
```

Nice.









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

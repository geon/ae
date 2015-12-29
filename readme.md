
Ae
==

Then æsthetics - helper functions for working with js promises.

Motivation
----------

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

API
---



### Proxies for `Array.prototype.map`, `.filter`, `.reduce` and `.join`

#### Arguments

The same arguments you would pass to their `Array.prototype` counterpart.

#### Operates On

any[]

#### Description

Use these to manipulate a promise resolving with an array, much like you would in a synchronous setting.

#### Without ae:

```js
promiseOfArrayOfStrings
	.then(function (arrayOfStrings) {

		return arrayOfStrings
			.map(function (string) {

				return string.toUpperCase();
			})
			.join(', ');
	})
```

#### With ae:

```js
promiseOfArrayOfStrings
	.then(ae.map(function (string) {

		return string.toUpperCase();
	}))
	.then(ae.join(', '))
```

Or slightly shorter:

```js
promiseOfArrayOfStrings
	.then(ae.map(ae.method('toUpperCase')))
	.then(ae.join(', '))
```



### ae.object(propertyNames)

#### Arguments

`propertyNames`: string[]

#### Operates On

any[]

#### Description

Turns an array into an object with property names specified by the argument.

Can optionally be called with multiple parameters instead of an array, like `ae.object(propertyName1 [, propertyName2...])`.

#### Without ae:

```js
somePromise
	.then(function (results) {

		return {
			someProperty:     results[0],
			anotherProperty:  results[1]
			lotsOfProperties: results[2]
			iCouldGoOn:       results[3]
		};
	})
```

#### With ae:

```js
somePromise
	.then(ae.object(
		'someProperty',
		'anotherProperty',
		'lotsOfProperties',
		'iCouldGoOn'
	))
```

#### With `Promise.all`:

```js
Promise.all([
	doThis,
	doThat,
	doSomethingElse
])
	.then(ae.object([
		'this',
		'that',
		'somethingElse'
	]))
```



### ae.assert(assertionCallback, errorMessage)

#### Arguments

`assertionCallback`: function(any) => boolean
`errorMessage`: String

#### Operates On

any

#### Description

Use the assertion callback to check the result of the previous promise. If you return `false`, an error with the message `errorMessage` will be thrown.

#### Without ae:

```js
userPromise
	.then(function (user) {

		if (!user.hasPermission) {

			throw new Error('User missing permission.');
		}
	})
```

#### With ae:

```js
userPromise
	.then(ae.assert(
		function (user) { return user.hasPermission; },
		'User missing permission.'
	))
```

#### With ES6:

```js
userPromise
	.then(ae.assert(
		user => user.hasPermission,
		'User missing permission.'
	))
```



### ae.pipeline

#### Arguments

No arguments. Don't call it, just pass it in.

#### Operates On

An array of Promise generators. (function => Promise)[]

#### Description

Takes an array of promise generators. Runs each promise generator sequentially, and passes the result of each one into the next. The resulting promise contains the result of the last generated promise. If any generated promise rejects, the pipeline ends there (no more generator is executed), and the resulting promise is rejected with the error of the failed promise.

#### Without ae:

```js
arrayOfPromiseGeneratorsPromise
	.then(function (arrayOfPromiseGenerators) {

		return arrayOfPromiseGenerators
			.reduce(
				function (soFar, next) {

					return soFar.then(next);
				},
				Promise.resolve()
			);
	})

```

#### With ae:

```js
arrayOfPromiseGeneratorsPromise
	.then(ae.pipeline)
```



### ae.sequence

#### Arguments

No arguments. Don't call it, just pass it in.

#### Operates On

An array of Promise generators. (function => Promise)[]

#### Description

Takes an array of promise generators. Runs the promise generators in sequence and resolves with an array containing the results of each promise. Much like `Promise.all` but not in parallel. If any of the generated promises rejects, the resulting promise is rejected with the error of the failed promise. The error will have an array `partialSequenceResults` containing the results of the promises that resolved successfully.

Useful when you need to make sure thing are executed in order. Like db inserts following deletes, etc.

#### Without ae:

Way too much error prone code.

#### With ae:

```js
arrayOfPromiseGenerators
	.then(ae.sequence)
```



### ae.parallel(numWorkers)

#### Arguments

`numWorkers`: number

#### Operates On

An array of Promise generators. (function => Promise)[]

#### Description

Takes an array of promise generators. Runs the promise generators in parallel, but limited to `numWorkers` "threads" at any time. If any of the generated promises rejects, all workers are canceled, and the resulting promise is rejected with the error of the failed promise.

Useful when you need to convert a gazillion image files, or any other task you'd like to run in parallel, but that would use too much resources to do *all* at once.

#### Without ae:

Seriously? I don't even know. Probably close to what ae implements, copy-pasted from Stack Overflow. :P

#### With ae:

```js
arrayOfResourceIntensivePromiseGenerators
	.then(ae.parallel(4))
```

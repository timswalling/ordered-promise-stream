# Ordered Promise Stream

[![Build status](https://img.shields.io/travis/timswalling/ordered-promise-stream.svg)](https://travis-ci.org/timswalling/ordered-promise-stream)

Stream promise values, in order, as they resolve. Like `Promise.all`, but with progressive output.

## Install

```
$ npm install --save ordered-promise-stream
```

## Simple example

```javascript
const orderedPromiseStream = require('ordered-promise-stream')
 
const p1 = new Promise((resolve) => setTimeout(resolve, 2000, 'p1'))
const p2 = new Promise((resolve) => setTimeout(resolve, 1000, 'p2'))
const p3 = new Promise((resolve) => setTimeout(resolve, 3000, 'p3'))
 
const stream = orderedPromiseStream([p1, p2, p3])
 
stream.on('data', (data) => console.log(data))  // 'p1' @ ~2000ms, 'p2' @ ~2000ms, 'p3' @ ~3000ms
```

## API

### orderedPromiseStream(`array` [, `options`])

Returns a transform stream that emits promise values in the same order as the input array.

* `array` - (Array) An array of promises.
* `options` - (Object) Options to control the behaviour of the stream:
  * `resolutionFn` - (Function) A function that will run when each promise resolves. Accepts the stream as its first argument and the resolved value as its second. Is responsible for pushing the value to the stream - eg `stream.push(value)`
  * `endFn` - (Function) A function that will run when all promises have resolved. Accepts the stream as its first and only argument. Is responsible for closing the stream - eg `stream.push(null)`

### Example with options

We can use the `resolutionFn` option to manipulate the resolved values, and/or change the way they are streamed.

```javascript
const orderedPromiseStream = require('ordered-promise-stream')
 
const p1 = new Promise((resolve) => setTimeout(resolve, 2000, [0, 1]))
const p2 = new Promise((resolve) => setTimeout(resolve, 1000, [2, 3]))
const p3 = new Promise((resolve) => setTimeout(resolve, 3000, [4, 5]))
 
const options = {
  resolutionFn: (stream, value) => value.forEach((item) => stream.push(item * 10))
}
 
const stream = orderedPromiseStream([p1, p2, p3], options)
 
stream.on('data', (data) => console.log(data))  // 0, 10, 20, 30, 40, 50
```

## License

[MIT](LICENSE)

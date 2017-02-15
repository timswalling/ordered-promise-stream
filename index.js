var Transform = require('stream').Transform

var defaults = {
  endFn: function endFn (stream) {
    stream.push(null)
  },
  resolutionFn: function resultFn (stream, value) {
    stream.push(value)
  }
}

/**
 * Stream promise values, in order, as they resolve.
 * @param {Promise[]} promises - The array of promises to stream.
 * @param {object} [options] - Options to control the behaviour of the stream.
 * @param {function} [options.endFn] - A function that will be run with the stream as its first argument when all promises are resolved.
 * @param {function} [options.resolutionFn] - A function that will be run with the stream as its first argument and the resolved value as its second argument when each promise resolves.
 * @returns {stream}
 */
function orderedPromiseStream (promises, options) {
  if (!Array.isArray(promises)) {
    throw new Error('Must provide an array of promises')
  }

  if (options && typeof options !== 'object') {
    throw new Error('`options` must be an object')
  }

  if (options && 'endFn' in options && typeof options.endFn !== 'function') {
    throw new Error('`options.endFn` must be a function')
  }

  if (options && 'resolutionFn' in options && typeof options.resolutionFn !== 'function') {
    throw new Error('`options.resolutionFn` must be a function')
  }

  var config = options || {}
  var cursor = 0
  var results = {}
  var stream = new Transform({objectMode: true})

  var endFn = config.endFn || defaults.endFn
  var resolutionFn = config.resolutionFn || defaults.resolutionFn

  function flush (index, value) {
    results[index] = value

    while (cursor < promises.length) {
      if (!results.hasOwnProperty(cursor)) {
        break
      }

      var result = results[cursor]

      resolutionFn(stream, result)

      delete results[cursor]
      cursor++
    }

    if (cursor >= promises.length) {
      endFn(stream)
    }
  }

  function handleResolution (promise, index) {
    if (typeof promise !== 'object' || !('then' in promise)) {
      throw new Error('All array items must be thenable')
    }

    promise.then(flush.bind(flush, index))
  }

  promises.forEach(handleResolution)

  return stream
}

module.exports = orderedPromiseStream

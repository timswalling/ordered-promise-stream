/* eslint-env jest */
const Transform = require('stream').Transform

const orderedPromiseStream = require('../')

const mockPromise = (value) => {
  return new Promise((resolve) => resolve(value))
}

const mockNestedPromise = (promise, value) => {
  return new Promise((resolve) => {
    promise.then(() => resolve(value))
  })
}

describe('orderedPromiseStream', () => {
  it('should return a transform stream', () => {
    const promiseArray = [mockPromise()]
    const stream = orderedPromiseStream(promiseArray)

    expect(stream).toBeInstanceOf(Transform)
  })

  it('should return the values of the resolved promises in the order that they appear in the array', (done) => {
    const shallowValue = 'shallow'
    const shallowPromise = mockPromise(shallowValue)

    const nestedValue = 'nested'
    const nestedPromise = mockNestedPromise(shallowPromise, nestedValue)

    const promiseArray = [
      nestedPromise,
      shallowPromise
    ]

    const stream = orderedPromiseStream(promiseArray)
    const result = []

    stream.on('data', (data) => result.push(data))
    stream.on('end', () => {
      expect(result).toEqual([nestedValue, shallowValue])
      done()
    })
  })

  it('should call `options.resolutionFn` every time a promise resolves', (done) => {
    const values = [
      'foo',
      'bar',
      'blah'
    ]
    const promises = values.map((value) => mockPromise(value))
    const options = {
      resolutionFn: jest.fn((stream, value) => stream.push(value))
    }

    const stream = orderedPromiseStream(promises, options)

    const expectedArguments = values.map((value) => {
      return [
        stream,
        value
      ]
    })

    stream.on('data', (data) => data)

    stream.on('end', () => {
      expect(options.resolutionFn.mock.calls).toEqual(expectedArguments)
      done()
    })
  })

  it('should call `options.endFn` once all promises have resolved', (done) => {
    const values = [
      'foo',
      'bar',
      'blah'
    ]
    const promises = values.map((value) => mockPromise(value))
    const options = {
      endFn: jest.fn((stream) => stream.push(null))
    }

    const stream = orderedPromiseStream(promises, options)

    stream.on('data', (data) => {
      expect(options.endFn).not.toHaveBeenCalled()
    })

    stream.on('end', () => {
      expect(options.endFn).toHaveBeenCalledWith(stream)
      done()
    })
  })

  it('should throw an error if an array is not provided as the first argument', () => {
    expect(() => orderedPromiseStream())
      .toThrow('Must provide an array of promises')
  })

  it('should throw an error if of the items in the first array are not thenable', () => {
    const invalidArray = ['']

    expect(() => orderedPromiseStream(invalidArray))
      .toThrow('All array items must be thenable')
  })

  it('should throw an error if any truthy value that is not an object is provided as the second argument', () => {
    const promiseArray = [mockPromise()]
    const invalidOptions = true

    expect(() => orderedPromiseStream(promiseArray, invalidOptions))
      .toThrow('`options` must be an object')
  })

  it('should throw an error if `options.endFn` is truthy and not a function', () => {
    const promiseArray = [mockPromise()]
    const invalidOptions = {
      endFn: true
    }

    expect(() => orderedPromiseStream(promiseArray, invalidOptions))
      .toThrow('`options.endFn` must be a function')
  })

  it('should throw an error if `options.resolutionFn` is truthy and not a function', () => {
    const promiseArray = [mockPromise()]
    const invalidOptions = {
      resolutionFn: true
    }

    expect(() => orderedPromiseStream(promiseArray, invalidOptions))
      .toThrow('`options.resolutionFn` must be a function')
  })
})

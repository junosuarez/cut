# cut
Aspect-oriented (AOP) helper for sync or async code

## installation

    $ npm install cut

## about

Wrap a function to extend its behavior before and/or after
it is called (See http://en.wikipedia.org/wiki/Aspect-oriented_programming)

This is useful, for example, to add logging, tracking, to modify its output,
or for other orthogonal concerns to maintain Single Responsibility.

`cut` is named after the term pointcut. Think of this as a way to cut into
a location in your program and modify behavior - in this case, around a
function.

By building up chains of functionality around a function, you can more easily
re-use code for validation, policy, logging, etc - and reconfigure it at
runtime.

## usage

    var cut = require('cut')

let's start with a basic identify function, which will return
it's argument:

    var targetFn = function (val) { return val }

    targetFn(true)
    // => true

    var fn = cut(targetFn)

now, we can add functionality before or after the targetFn's callsite
`cut` returns a function
with two additional properties: a `before` array and an `after` array

let's add some behavior to run before targetFn

    fn.before.push(function(args, next) {
      console.log('We\'re calling targetFn with these arguments:', args)
      next(args)
    })

now when we call fn, it will log first before calling targetFn

    fn(true)
    // We're calling targetFn with these arguments: [true]
    // => true

let's add another piece of advice to modify the arguments:

    var invert = function (args, next) { args[0] = !args[0]; next(args) }

since before advice is called in array index order, we unshift
to prepend to the `before` array

    fn.before.unshift(invert)

    fn(true)
    // We're calling targetFn with these arguments: [false]
    // => false

now let's modify the return value:

    var stringify = function (obj) { return obj.toString() }
    var shout = function (str) { return str.toUpperCase() }

    fn.after.push(stringify, shout)

    fn(true)
    // We're calling targetFn with these arguments: [false]
    // => "FALSE"

finally, we want to add a guard so `targetFn` is only called
with boolean arguments

  fn.before.unshift(function (args, next) {
    if (typeof args[0] !== 'boolean') return;
    next(args);
  })

  fn('true')
  // undefined

since `'true'` is a string, the advice never called `next` and the
call chain was aborted before calling `targetFn` or any of the
subsequent advice

  fn(true)
  // We're calling targetFn with these arguments: [false]
  // => "FALSE"


As you can see, `cut` gives you a powerful and easy way to compose, modify,
and re-use behaviors to modify and control your programs.


## api
the functions and behaviors use with `cut` are called `advice`.

** before advice **

    function(args, next) : void

Each before advice is called in serial, with each advice passing the original
or modified arguments to the `next` callback. When all before advice has been
run, the target function is invoked with the arguments passed by the last
advice.

Before advice can intercept the target function from being called (for example,
in advice implementing authorization policy) by simply not calling `next`

Note, `args` is a proper Array, rather than an `arguments` object.

Since `next` is a callback, before advice can be implemented synchronously
or async.

** after advice **

    function(val, args) : val

If the target function is called and returns normally, the after advice is
called in serial. `val` is the return value of the previous advice or the
target function, and `args` is an Array of the arguments that the target
function was called with. The return value of the after advice is passed to
the next after advice or used as the overall return value, in turn.

If you wish to use after advice asynchronously, promises must be used as of
this version.

** sealed **

    cut(fn).sealed

When `cut` is called, the resulting function has its before and after arrays
exposed. If you want to pass a function somewhere else in your program without
allowing modification of the advice, `sealed` is a function which applies the
advice without exposing those properties.


## contributors

jden <jason@denizac.org> @leJDen

Please submit pull requests and issues through github.

## license

MIT
(c) 2013 Agile Diagnosis, Inc.
see LICENSE.md
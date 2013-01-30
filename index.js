/*
//example before advice

function upper(args, next) {
// doing something to the first arg
args[0] = args[0].toUpperCase();
next(args);
}

function logger(args, next) {
// just for side effects, not modifying args
log('called something')
next(args);
}

// after advice

function resultLogger(ret, args) {
// args is set to the the value that the targetFn was invoked with

}

*/

// (args: [], next: (args: []) => void) => void

function cut(targetFn) {
  if (typeof targetFn !== 'function') {
    throw new TypeError('targetFn must be a function')
  }

  var cut = function () {
    var context = this;
    var args = toArray(arguments);

    var aborted = false;
    var spy = Spy();
    // before
    var pointArgs = cut.before.reduce(function (args, advice) {
      if (aborted) return;
      spy.reset();
      advice.call(context, args, spy)
      if (!spy.called) {
        aborted = true;
        return;
      }
      return spy.returnValue;
    }, args)

    // point
    if (aborted) return;
    var pointVal = targetFn.apply(context, pointArgs);

    //after
    var afterVal = cut.after.reduce(function (val, advice) {
      return advice(val, pointArgs);
    }, pointVal)


    return afterVal;
  }
  cut.before = [];
  cut.after = [];
  cut.sealed = function () {
    return cut.apply(this, Array.prototype.slice.call(arguments))
  }
  return cut;
}


module.exports = cut;


function toArray (arrLike) {
  return Array.prototype.slice.call(arrLike);
}

function Spy() {
  var spy = function (returnValue) {
    spy.called = true;
    spy.returnValue = returnValue;
  }
  spy.reset = function() {
    spy.called = false;
    spy.returnValue = undefined;
  }
  spy.called = false;
  return spy;
}

module.exports.spy = Spy;
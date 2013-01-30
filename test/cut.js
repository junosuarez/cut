var chai = require('chai');
chai.should();
var expect = chai.expect;
var sinon = require('sinon');
chai.use(require('sinon-chai'));
chai.use(require('chai-interface'));

describe('cut', function () {
  // a wrap a function to extend its behavior before and/or after
  // it is called (See http://en.wikipedia.org/wiki/Aspect-oriented_programming)
  //
  // this is useful, for example, to add logging, tracking, to modify its output,
  // or for other orthogonal concerns to maintain Single Responsibility.

  var cut = require('../index.js');

  it('exports a function', function () {
    cut.should.be.a('function');
    // which returns a function
    (cut(function(){})).should.be.a('function');
  })

  it('returns a new function', function () {
    var fn = function () {};
    var fn2 = cut(fn);
    fn2.should.not.equal(fn);
  })

  it('proxies arguments from the returned function to the target function', function () {
    var fn = sinon.spy();
    var fn2 = cut(fn);
    fn2(1,true,'hey');
    fn.should.have.been.calledWithExactly(1,true,'hey');
  })

  it('proxies return value from the target function', function () {
    var fn = function () { return '15x falafel'}
    var fn2 = cut(fn);
    fn2().should.equal('15x falafel');
  })

  it('calls proxies the call context to the target function', function () {
    var context = {};
    var fn = sinon.spy();
    var fn2 = cut(fn);
    fn2.call(context);
    fn.firstCall.thisValue.should.equal(context);
  })

  it('throws if @param `targetFn` is not a function', function () {
    expect(function() {
      cut()
    }).to.throw(TypeError)
    expect(function() {
      cut(1)
    }).to.throw(TypeError)
    expect(function() {
      cut(new Date())
    }).to.throw(TypeError)
    expect(function() {
      cut(/xdfs/)
    }).to.throw(TypeError)
    expect(function() {
      cut('ewerw')
    }).to.throw(TypeError)
    expect(function() {
      cut({})
    }).to.throw(TypeError)
    expect(function() {
      cut([])
    }).to.throw(TypeError)
    expect(function() {
      cut(true)
    }).to.throw(TypeError)
  })

  it('returned function has properties', function () {
    var fn2 = cut(function () {})
    fn2.should.be.a('function')
    fn2.should.have.interface({
      before: [],
      after: [],
      sealed: Function
    })
  })

  describe('#sealed', function () {
    it('is the wrapped function with .before and .after arrays protected', function () {
      var fn = sinon.spy();
      var fn2 = cut(fn);
      var fn3 = fn2.sealed;
      fn3.should.be.a('function');
      fn3.should.not.have.property('before');
      fn3.should.not.have.property('after');
      fn3('x','foo',false);
      fn.should.have.been.calledWithExactly('x','foo', false);
    })
  })

  describe('#before', function () {
    // before-advice function signature:
    // (args: [], next: (args: []) => void) => void
    it('is an array of before-advice functions, which are invoked before the target function', function () {
      var fn = sinon.spy()
      var fn2 = cut(fn);

      var shoutBeforeAdvice = function (args, next) {
        args = args.map(function (x) { return x.toUpperCase() })
        next(args);
      }

      fn2.before.push(shoutBeforeAdvice);

      fn2('i', 'like', 'pie')

      fn.should.have.been.calledWithExactly('I', 'LIKE', 'PIE')

    })

    it('can prevent the target function from being called by not calling `next`', function () {
      var fn = sinon.spy();
      var fn2 = cut(fn);

      var nopeBeforeAdvice = function () {}
      fn2.before.push(nopeBeforeAdvice);
      fn2('Are you a pirhana?')
      fn.should.not.have.been.called;

    })

  })

  describe('#around', function () {
    it('is an optional single function which wraps the callsite', function () {
      var fn = sinon.spy();
      var fn2 = cut(fn);
    })
  })

  describe('#after', function () {
    it('is an array of after-advice functions, which are invoked after the target function', function () {
      var fn = function (x) { return x; }
      var f2 = cut(fn);
      var hexify = function (x) {
        return x.toString(16);
      }
      f2.after.push(hexify);
      f2(15).should.equal('f');
      f2(0).should.equal('0');
      f2(255).should.equal('ff');

      var upper = function (x) {
        return x.toUpperCase();
      }
      f2.after.push(upper);
      f2(255).should.equal('FF');
    });

    it('is called with the chained value and the point args (the args the targetFn was invoked with)', function () {
      var fn = sinon.stub().returns('asdf')
      var fn2 = cut(fn);
      var after1 = sinon.stub().returns('yuiop');
      var after2 = sinon.spy()
      fn2.after.push(after1);
      fn2.after.push(after2);

      fn2('hjkl');

      after1.should.have.been.calledWithExactly('asdf', ['hjkl'])
      after2.should.have.been.calledWithExactly('yuiop', ['hjkl'])
    })
  })

  describe('spy', function () {
    it('returns a function', function () {
      cut.spy.should.be.a('function');
    })

    it('returns a spy', function () {
      var spy = cut.spy()
      spy.should.have.interface({
        called: Boolean
      })
      // when called, it gets a property called `returnValue`
    })

    it('reports whether it has been called', function () {
      var spy = cut.spy();
      spy.called.should.equal(false);
      spy();
      spy.called.should.equal(true);
    })

    it('reports the return value that it was called with', function () {
      var spy = cut.spy();
      expect(spy.returnValue).to.equal(undefined);
      spy('foo');
      spy.returnValue.should.equal('foo');
    })

    it('can be reset (to avoid creating more objects than necessary', function () {
      var spy = cut.spy();
      spy('foo');
      spy.returnValue.should.equal('foo');
      spy.called.should.equal(true);

      spy.reset();

      spy.called.should.equal(false);
      expect(spy.returnValue).to.equal(undefined);
    })
  })

})
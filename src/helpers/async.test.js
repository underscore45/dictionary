const {callAsync, callAsyncFor, _getDelayNumber} = require('./async');
const sinon = require('sinon');
const chai = require('chai');  chai.should();
const expect = chai.expect;


describe('helpers/async.js', function() {
  describe('_getDelayNumber()', function() {
    it('for a single value, returns that value', function() {
      _getDelayNumber(100).should.equal(100);
    });
    it('for an array, returns a number within the given bounds', function() {
      var nr = _getDelayNumber([100, 200]);
      (nr >= 100).should.equal(true);
      (nr <= 200).should.equal(true);
    });
    it('for an array, corrects invalid bounds', function() {
      _getDelayNumber([200, 100]).should.equal(200);
    });
  });


  describe('callAsync()', function() {
    var f = (a, b, cb) => cb(null, a * b);
    var count;

    beforeEach(function() {
      count = 0;
    });

    it('calls a function on the next event loop', function(cb) {
      var delay = 0;
      callAsync(f, delay, 2, 5, (err, ans) => {
        ans.should.equal(10);
        count.should.equal(1);
        cb();
      });
      count = 1;  // `f` will only be called after this assignment.
    });


    describe('with custom delay', function() {
      var clock;  // See https://stackoverflow.com/questions/17446064

      beforeEach(function() {
        clock = sinon.useFakeTimers();
      });

      afterEach(function() {
        clock.restore();
      });

      it('calls a function on the next event loop with zero delay, ' +
        'if an invalid delay value was given', function(cb) {
        var delay = -100;
        callAsync(f, delay, 2, 5, (err, ans) => {
          ans.should.equal(10);
          count.should.equal(1);
          count = 2;
        });
        count = 1;
        clock.tick(0);
        count.should.equal(2);
        cb();
      });

      it('calls a function after a given delay value', function(cb) {
        var delay = 200;
        callAsync(f, delay, 2, 5, (err, ans) => {
          ans.should.equal(10);
          count.should.equal(1);
          count = 2;
        });
        count = 1;
        clock.tick(199);
        count.should.equal(1);  // `f` was not called yet.
        clock.tick(1);
        count.should.equal(2);  // `f` has been called now.
        cb();
      });

      it('calls a function after a given delay range', function(cb) {
        var delay = [300, 500];
        callAsync(f, delay, 2, 5, (err, ans) => {
          ans.should.equal(10);
          count.should.equal(1);
          count = 2;
        });
        count = 1;
        clock.tick(299);
        count.should.equal(1);
        clock.tick(201);
        count.should.equal(2);
        cb();
      });
    });
  });


  describe('callAsyncFor()', function() {
    var f = (x) => x==0 ? ['e', undefined] : [null, x * 10];
    var delay = 0;
    var count;

    beforeEach(function() {
      count = 0;
    });

    it('calls `f` on an array, without error; ' +
      'and calls back on the next event-loop', function(cb) {
      callAsyncFor([1, 2], f, delay, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([10, 20]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
    it('calls `f` on an array, including an error; ' +
      'and calls back on the next event-loop', function(cb) {
      callAsyncFor([0, 1, 2], f, delay, (err, res) => {
        err.should.deep.equal(['e', null, null]);
        res.should.deep.equal([undefined, 10, 20]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
    it('also for an empty array, ' +
      'calls the callback on the next event-loop', function(cb) {
      callAsyncFor([], f, delay, (err, res) => {
        expect(err).to.equal(null);
        res.should.deep.equal([]);
        count.should.equal(1);
        cb();
      });
      count = 1;
    });
  });
});

const Promised = require('../../lib/promise');
const Fake = require('../../lib/fake');
const Defer = require('../../lib/actions');
const core = require('@lumjs/core');
const {needType,needObj,TYPES,S,F,N} = core.types;
const A = TYPES.ARRAY;
const STATUS = Fake.STATUS;
const DeferredPromise = Promised.DeferredPromise;

const VALID_ACTIONS = 
[
  'resolve', 'reject', 'notify', 
  'resolveWith', 'rejectWith', 'notifyWith',
];

function needAction(action)
{
  if (typeof action !== S || !VALID_ACTIONS.includes(action))
  {
    throw new TypeError("action was not valid");
  }
}

const DeferredClasses =
{
  fake: function(testSet)
  {
    return new Fake.Deferred(testSet.whenFinished, testSet.whenNotified);
  },
  promise: function(testSet)
  {
    const promise = new DeferredPromise();
    promise.always(testSet.whenFinished);
    promise.progress(testSet.whenNotified);
    return promise;
  },
}

// We'll re-export these for test files to use.
const LIB =
{
  Promised, Fake, Defer, DeferredPromise, core, TYPES, STATUS, 
  VALID_ACTIONS, DeferredClasses,
}

class TestSets
{
  constructor(testInstance, defClass='fake')
  {
    this.parentTest = testInstance;
    this.sets = [];
    this.started = null;
    this.defaultClass = defClass;
  }

  start(defClass=this.defaultClass)
  {
    if (this.started) throw new Error("TestSets already started");

    this.started = Date.now();

    // First we'll set up each of the testSet instances.
    for (const testSet of this.sets)
    {
      testSet.$setup(defClass);
    }

    // Now we'll run them.
    for (const testSet of this.sets)
    {
      testSet.$run();
    }

    return this;
  }

  add()
  {
    if (this.started) throw new Error("Cannot add TestSet once TestSets started");

    const testSet = new TestSet(this);
    this.sets.push(testSet);
    return testSet;
  }

  testFinished()
  {
    for (const testSet of this.sets)
    {
      if (testSet.deferred === null) return false;
      if (testSet.deferred.status === Fake.STATUS.PENDING) return false;
    }
    // If we reached here, we're done.
    this.parentTest.done();
  }

  // A shortcut instance method to get the LIB object.
  get LIB()
  {
    return LIB;
  }

  static new(testInstance)
  {
    return new TestSets(testInstance);
  }
}

module.exports = TestSets;
TestSets.LIB = LIB;
LIB.TestSets = TestSets;

class TestSet 
{
  constructor(parentSets)
  {
    this.parentSets = parentSets;

    this.whenDone     = null;
    this.whenFinished = null;
    this.whenNotified = null;

    this.args     = null;
    this.action   = null;
    this.timeout  = null;

    this.deferred = null;
    this.result   = null;
  }

  onDone(func)
  {
    needType(F, func);
    this.whenDone = func;
    return this;
  }

  onNotify(func)
  {
    needType(F, func);
    this.whenNotified = func;
    return this;
  }

  setArgs(...args)
  {
    this.args = args;
    return this;
  }

  setAction(action)
  {
    needAction(action);
    this.action = action;
    return this;
  }

  setTimeout(timeout)
  {
    needType(N, timeout);
    this.timeout = timeout;
    return this;
  }

  add()
  {
    return this.parentSets.add();
  }

  start()
  {
    return this.parentSets.start();
  }

  $setup(defClass)
  {
    needType(F, this.whenDone);
    needType(A, this.args);
    needType(N, this.timeout);
    needAction(this.action);

    const testSet = this;
    testSet.whenFinished = function()
    { 
      testSet.result = new TestResult(testSet, this, arguments);
      testSet.whenDone.call(testSet, testSet.result);
      testSet.parentSets.testFinished();
    }

    this.deferred = DeferredClasses[defClass](testSet);
  }

  $run()
  {
    needObj(this.deferred);
    Defer[this.action](this.deferred, this.timeout, ...this.args);
  }
}

LIB.TestSet = TestSet;

class TestResult
{
  constructor(parent, context, args)
  {
    this.parent = parent;
    this.context = context;
    this.args = args;
    this.status = parent.deferred.status;
  }
}

LIB.TestResult = TestResult;

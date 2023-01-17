// Current test count.
const plan = 2;
// A new test instance.
const t = require('@lumjs/tests').new({module, plan});
// A custom class for running deferred test sets.
const TestSets = require('./inc/testsets');
// The defer default module
const defer = require('../lib/');

t.is(defer.Promise, TestSets.LIB.DeferredPromise, 'Promise is Promise');
t.is(defer.Actions, TestSets.LIB.Defer, 'Actions is Defer');

// TODO: more tests here

// All done.
t.done();


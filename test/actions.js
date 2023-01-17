// Current test count.
const plan = 0;
// A new test instance.
const t = require('@lumjs/tests').new({module, plan});
// A custom class for running deferred test sets.
const testSets = require('./inc/testsets').new(t);
// An enum of deferred status codes.
const {STATUS} = testSets.LIB;

testSets
  .add()
    .setArgs('test 1 resolved')
    .setAction('resolve')
    .setTimeout(500)
    .onDone(function(res)
    {
      t.is(res.context, this.deferred, 'default context is deferred object');
      t.is(res.status, STATUS.RESOLVED, 'status is RESOLVED');
      t.is(res.args.length, 1, 'correct number of args');
      t.is(res.args[0], this.args[0], 'correct arg returned');
    })
  //.add()      // TODO: add more tests here.
  .start();

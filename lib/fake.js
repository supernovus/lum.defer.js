const core = require('@lumjs/core');
const {needType,F,TYPES} = core.types;
const A = TYPES.ARRAY;

const STATUS = require('./status');
exports.STATUS = STATUS;

/**
 * A fake `Deferred.notify()` message
 * 
 * @alias module:@lumjs/defer/fake.Notice
 * @property {number} time    - Timestamp of notice
 * @property {Array}  data    - Message data for notice
 * @property {object} context - Context for notice.
 */
class FakeNotice
{
  constructor(data, context=null)
  {
    needType(A, data, 'data must be an Array');

    this.time = Date.now();
    this.data = data;
    this.context = context;
  }
}
exports.Notice = FakeNotice;

/**
 * A fake Deferred class for testing purposes.
 * 
 * Is much more limited than a real deferred implementation, and only has
 * a single handler for resolve/reject, and an optional handler for notify.
 * 
 * @alias module:@lumjs/defer/fake.Deferred
 * 
 * @property {number}  status   - A `STATUS` enum value.
 * @property {object}  context  - Context when resolved/rejected.
 * @property {Array}   data     - Data passed when resolved/rejected.
 * @property {number}  started  - Timestamp when the object was created.
 * @property {number}  finished - Timestamp when resolved/rejected.
 * 
 * @property {function} whenFinished  - Handler to call when resolved/rejected.
 * 
 * @property {?(function|Array)} whenNotified - Handler for when notify() is called.
 *   If this is a `function` it will be called like expected in the Deferred API.
 *   If this is an `Array` it will be populated with message objects.
 *   If this is `null` (default), then notify() won't do anything at all.
 * 
 */
class FakeDeferred
{
  /**
   * Create a Fake Deferred instance.
   * 
   * @param {function} whenFinished - Handler to call when resolved/rejected.
   * @param {function} [whenNotified] Handler for when notify() is called. 
   */
  constructor(whenFinished, whenNotified=null)
  {
    needType(F, whenFinished, 'whenFinished must be a function');

    this.whenFinished = whenFinished;
    this.whenNotified = whenNotified;

    this.status   = STATUS.PENDING;
    this.context  = this;
    this.data     = null;
    this.started  = Date.now();
    this.finished = null;
  }

  _note(data, context=this.context)
  {
    if (typeof this.whenNotified === F)
    {
      this.whenNotified.apply(this.context, data);
    }
    else if (Array.isArray(this.whenNotified))
    {
      const note = new FakeNotice(data, context);
      this.whenNotified.push(note);
    }
  }

  _finish(status, data)
  {
    this.status   = status;
    this.data     = data;
    this.finished = Date.now();

    this.whenFinished.apply(this.context, data);
  }

  resolve(...args)
  {
    this._finish(STATUS.RESOLVED, args);
  }
  reject(...args)
  {
    this._finish(STATUS.REJECTED, args);
  }
  notify(...args)
  {
    this._note(args);
  }

  resolveWith(context, ...args)
  {
    this.context = context;
    this.resolve(...args);
  }
  rejectWith(context, ...args)
  {
    this.context = context;
    this.reject(...args);
  }
  notifyWith(context, ...args)
  {
    this._note(args, context);
  }
}
exports.Deferred = FakeDeferred;

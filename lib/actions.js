const {F,S,N,B,needObj,needType} = require('@lumjs/core/types');

const M_RES = 'resolve';
const M_REJ = 'reject';
const M_NOT = 'notify';
const M_RESW = 'resolveWith';
const M_REJW = 'rejectWith';
const M_NOTW = 'notifyWith';

/**
 * A module providing simple methods for deferring actions.
 * @module @lumjs/defer/actions
 */

/**
 * A `Registration` object.
 * 
 * Keeps track of deferred actions, and provide convenience methods.
 * 
 * @typedef {object} module:@lumjs/defer/actions.Registration
 * 
 * @property {module:@lumjs/defer.Deferred} deferred - The *Deferred* object.
 * @property {string} method - The method being called on `deferred`.
 * @property {number} delay - The delay in milliseconds.
 * @property {boolean} repeat - Is this a repeating event?
 * @property {Array} args - The arguments for the `method` call.
 * 
 * @property {?number} id - The `timeoutID` or `intervalID` for the event.
 * 
 *   This will be set to `null` when `cancel()` is called, or when
 *   a non-repeating event has ran once.
 * 
 * @property {function} cancel - A function that will cancel the event *now*. 
 * 
 *   This will update the `id` to `null` after canceling the deferred event.
 * 
 *   - If `repeat` is true` uses `clearInterval()`.
 *   - If `repeat` is `false` uses `clearTimeout()`.
 * 
 * @property {function} restart - A function that *restarts* the timer.
 * 
 *   This will update the `id` property, and set `active` to `true`.
 *   If `id` is not `null`, then `cancel` will be called first.
 *   If passed a `number` as an argument, it will become the new `delay`.
 * 
 *   - If `repeat` is true` uses `setInterval()`, so it'll be repeated.
 *   - If `repeat` is `false` uses `setTimeout()`, so it'll run only once.
 * 
 */

/**
 * A function that registers a specific *Deferred* action.
 * 
 * These all use the same parameters, and use the
 * [defer()]{@link module:@lumjs/defer/actions.defer} function to actually
 * register the deferred action handler.
 * 
 * @typedef {function} module:@lumjs/defer/actions.Func
 * @param {module:@lumjs/defer.Deferred} deferred - The *Deferred* object.
 * @param {number} delay - The delay before running the method.
 * @param  {...any} [args] Arguments to pass to `resolve()` when called.
 * @returns {module:@lumjs/defer/actions.Registration}
 * @throws {TypeError} If any of the parameters are invalid.
 */

/**
 * Ensure a `delay` value is a number greater than zero.
 * @param {*} delay - Value to test.
 * @returns {void} If the test succeeds, nothing happens.
 * @throws {TypeError} If the test fails, an error is thrown.
 * @alias module:@lumjs/defer/actions.needDelay
 */
function needDelay(delay)
{
  if (typeof delay !== N || delay <= 0)
  { // That's not valid.
    throw new TypeError('delay must be a number greater than zero');
  }
}

exports.needDelay = needDelay;

/**
 * Set a timeout or interval for a Deferred method.
 * 
 * The is the lowest-level core function for registering deferred actions.
 * It's generally not needed to use this directly unless you have custom
 * requirements.
 * 
 * @param {module:@lumjs/defer.Deferred} deferred - The *Deferred* object.
 * @param {string} method - The method to call on the `deferred` object.
 * @param {number} delay - The delay before running the method.
 * @param {boolean} repeat - Repeat the call every `delay` milliseconds?
 * @param  {...any} [args] Arguments to pass to the `method` when called.
 * 
 * @returns {module:@lumjs/defer/actions.Registration}
 * 
 * @throws {TypeError} If any of the parameters are invalid.
 * 
 * @alias module:@lumjs/defer/actions.defer
 */
function defer(deferred, method, delay, repeat, ...args)
{
  needObj(deferred, 'deferred must be an object');
  needType(S, method, 'method must be a string');
  needDelay(delay);
  needType(B, repeat, 'repeat must be a boolean');
  needType(F, deferred[method], `deferred.${method} must be a function`);

  const reg = 
  {
    deferred, method, delay, repeat, args, // The original arguments.
    id: null,
    $call()
    { // Not meant to be called directly.
      this.deferred[this.method](...this.args);
      if (!this.repeat)
      { // Not a repeating event, so we're done.
        this.id = null;
      }
    },
    cancel()
    {
      if (typeof this.id === N)
      {
        const clearFunc = this.repeat ? clearInterval : clearTimeout;
        clearFunc(this.id);
        this.id = null;
      }
      else 
      {
        console.warn("event was not running", this);
      }
    },
    restart(delay=this.delay)
    {
      if (delay !== this.delay)
      { // Check to make sure it's okay.
        needDelay(delay);
        this.delay = delay;
      }

      if (this.active)
      {
        this.cancel();
      }

      const setFunc = this.repeat ? setInterval : setTimeout;
      this.id = setFunc(() => this.$call(), delay);
    },
  };

  // Start it before returning the object.
  reg.restart();

  return reg;
}

exports.defer = defer;

// Private function for making wrappers.
function wrap(name, repeat=false)
{
  exports[name] = function(deferred, delay, ...args)
  {
    return defer(deferred, name, delay, repeat, ...args);
  }
}

/**
 * Set a *timeout* to run `deferred.resolve()`
 * 
 * @name module:@lumjs/defer/actions.resolve
 * @type {module:@lumjs/defer/actions.Func}
 */
wrap(M_RES);

/**
 * Set a *timeout* to run `deferred.reject()`
 * 
 * @name module:@lumjs/defer/actions.reject
 * @type {module:@lumjs/defer/actions.Func}
 */
wrap(M_REJ);

/**
 * Set a *repeating interval* to run `deferred.notify()`
 * 
 * @name module:@lumjs/defer/actions.notify
 * @type {module:@lumjs/defer/actions.Func}
 */
wrap(M_NOT, true);

/**
 * Set a *timeout* to run `deferred.resolveWith()`
 * 
 * @name module:@lumjs/defer/actions.resolveWith
 * @type {module:@lumjs/defer/actions.Func}
 */
wrap(M_RESW);

/**
 * Set a *timeout* to run `deferred.rejectWith()`
 * 
 * @name module:@lumjs/defer/actions.rejectWith
 * @type {module:@lumjs/defer/actions.Func}
 */
wrap(M_REJW);

/**
 * Set a *repeating interval* to run `deferred.notifyWith()`
 * 
 * @name module:@lumjs/defer/actions.notifyWith
 * @type {module:@lumjs/defer/actions.Func}
 */
wrap(M_NOTW, true);

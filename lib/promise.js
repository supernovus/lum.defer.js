const {F,isArray} = require('@lumjs/core/types');

const STATUS = require('./status');
exports.STATUS = STATUS;

/**
 * A `Symbol` for the `DeferredPromise.@promise` property.
 * @alias module:@lumjs/defer/promise.SYM_PROMISE
 */
const SF_PROMISE = Symbol('@lumjs/defer/promise.DeferredPromise~promise');
exports.SYM_PROMISE = SF_PROMISE;

/**
 * A `Symbol` for `DeferredPromise.@resolve` functions.
 * @alias module:@lumjs/defer/promise.SYM_RESOLVE_FUNCTION
 */
const SF_RES = Symbol('@lumjs/defer/promise.DeferredPromise~resolve');
exports.SYM_RESOLVE_FUNCTION = SF_RES;

/**
 * A `Symbol` for `DeferredPromise.@reject` functions.
 * @alias module:defer/promise.SYM_REJECT_FUNCTION
 */
const SF_REJ = Symbol('@lumjs/defer/promise.DeferredPromise~reject');
exports.SYM_REJECT_FUNCTION = SF_REJ;

/**
 * A `Symbol` for `DeferredPromise.@notify` functions.
 * @alias module:defer/promise.SYM_NOTIFY_FUNCTION
 */
const SF_NOT = Symbol('@lumjs/defer/promise.DeferredPromise~notify');
exports.SYM_NOTIFY_FUNCTION = SF_NOT;

function promiseState(p)
{
  const t = {};
  return Promise.race([p, t])
    .then(v => (v === t) ? "pending" : "fullfilled", () => "rejected");
}
exports.promiseState = promiseState;

/**
 * A slim `Deferred` wrapper around JS `Promise` objects.
 * 
 * It only supports a few *basic* methods from the `Deferred` API.
 * It's by no means a complete replacement, nor is it meant to be.
 * 
 * @alias module:@lumjs/defer/promise.DeferredPromise
 * 
 * @property {Promise[]} "@promise" - The underlying `Promise` objects.
 * @property {function} "@resolve" - The `resolve` callback from the `promise`.
 * @property {function} "@reject" - The `reject` callback from the `promise`.
 * @property {function[]} "@notify" - Functions for `notify`.
 * 
 * There are no *notify* functions in the official
 * Javascript `Promise` objects, but they do exist in the
 * `Deferred` API. So we are simply emulating them here.
 */
class DeferredPromise
{
  constructor()
  {
    this.status = STATUS.PENDING;
    this[SF_PROMISE] = 
    [ // Create an initial promise.
      new Promise((resolve, reject) => 
      {
        this[SF_RES] = resolve;
        this[SF_REJ] = reject;
      }).then
      (
        () => this.status = STATUS.RESOLVED, 
        () => this.status = STATUS.REJECTED
      )
    ];
    // Virtual storage for notify/progress handlers.
    this[SF_NOT] = [];
  }

  /**
   * Return an underlying Promise object
   * 
   * @param {number} [offset=-1] Optional offset of wanted Promise
   * 
   *  If negative, it will be from the end of the array.
   *  The default of `-1` will return the last Promise.
   * 
   * @returns {Promise}
   */
  promise(offset=-1)
  {
    const proms = this[SF_PROMISE];
    if (offset < 0) offset = proms.length-offset;
    return proms[offset];
  }

  /**
   * Add handlers to the current promise.
   * 
   * @param {?function} [resFunc]  A function for resolved status.
   * @param {?function} [rejFunc]  A function for rejected status.
   * @param {?function} [progFunc] A function for progress updates. 
   * @returns {Promise} Returns the newly added promise.
   */
  then(resFunc, rejFunc, progFunc)
  {
    if (typeof progFunc === F)
    { // progress functions are handled separately.
      this.progress(F);
    }

    const proms = this[SF_PROMISE];
    const current = proms[proms.length-1];
    const promise = current.then(resFunc, rejFunc);
    proms.push(promise);
    return promise;
  }

  /**
   * Add functions for resolved status.
   * 
   * @param  {...function} funcs - One or more handler functions.
   * @returns {DeferredPromise} `this`
   */
  done(...funcs)
  {
    for (const func of funcs)
    {
      if (typeof func === F)
      { // A function, add it.
        this.then(func);
      }
      else if (isArray(func))
      { // Recurse arrays.
        this.done(...func);
      }
    }
    return this;
  }

  /**
   * Add functions for rejected status.
   * 
   * @param  {...function} funcs - One or more handler functions.
   * @returns {DeferredPromise} `this`
   */
  fail(...funcs)
  {
    for (const func of funcs)
    {
      if (typeof func === F)
      { 
        this.then(undefined, func);
      }
      else if (isArray(func))
      { 
        this.fail(...func);
      }
    }
    return this;
  }

  /**
   * Add functions for progress updates.
   * 
   * @param  {...function} funcs - One or more handler functions.
   * @returns {DeferredPromise} `this`
   */
  progress(...funcs)
  {
    for (const func of funcs)
    {
      if (typeof func === F)
      { 
        this[SF_NOT].push(func);
      }
      else if (isArray(func))
      { 
        this.progress(...func);
      }
    }
    return this;
  }

  /**
   * Add functions that will be called on completion.
   * 
   * These will be called on either resolved or rejected status.
   * If the status is *resolved* the argument will be the value.
   * If the status is *rejected* the argument will be the error.
   * 
   * @param  {...function} funcs - One or more handler functions.
   * @returns {DeferredPromise} `this`
   */
  always(...funcs)
  {
    for (const func of funcs)
    {
      if (typeof func === F)
      { 
        this.then(func, func);
      }
      else if (isArray(func))
      { 
        this.always(...func);
      }
    }
    return this;
  }

  /**
   * Mark the promise chain as completed with a resolved status.
   * 
   * @param  {...any} values 
   * @returns 
   */
  resolve(...values)
  {
    this[SF_RES](...values);
    return this;
  }

  reject(...values)
  {
    this[SF_REJ](...values);
    return this;
  }

  notify(...values)
  {
    const funcs = this[SF_NOT];
    for (const func in funcs)
    {
      func(...values);
    }
    return this;
  }

}

exports.DeferredPromise = DeferredPromise;

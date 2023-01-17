const {lazy} = require('@lumjs/core/types');
const E = lazy.def.e;

/**
 * A module for working with the Deferred API.
 * @module @lumjs/defer
 */

/**
 * A `Deferred` object interface.
 * 
 * Based on the *Deferred* API from `jQuery`,
 * which itself was influenced by `CommonJS/Promises/A` proposal.
 * 
 * For our purposes we don't care about the *assignment* of callbacks,
 * so methods like `done()`, `fail()`, and `always()` are not checked
 * for. We only care about methods that affect the resolution of the
 * deferred action such as `resolve()`, `reject()`, etc.
 * 
 * @typedef {object} module:@lumjs/defer.Deferred
 * @property {function} resolve - Call `done` callbacks.
 * @property {function} reject - Call `fail` callbacks.
 * @property {function} [notify] - Call `progress` callbacks.
 * @property {function} [resolveWith] `resolve` with a *context*.
 * @property {function} [rejectWith] `reject` with a *context*.
 * @property {function} [notifyWith] `notify` with a *context*.
 */

/**
 * A sub-module providing functions for deferring actions (*lazy-loaded*)
 * 
 * @name module:@lumjs/defer.Actions
 * @see module:@lumjs/defer/actions
 */
lazy(exports, 'Actions', () => require('./actions'), E);

/**
 * A wrapper class around a Javascript Promise (*lazy-loaded*)
 * 
 * @name module:@lumjs/defer.Promise
 * @see module:@lumjs/defer/promise.DeferredPromise
 */
lazy(exports, 'Promise', () => require('./promise').DeferredPromise, E);

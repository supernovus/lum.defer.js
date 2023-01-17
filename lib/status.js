const Enum = require('@lumjs/core/enum');
//const Enum = core.Enum;

/**
 * An enum of status values for our deferred API.
 * 
 *  `PENDING, RESOLVED, REJECTED`
 * 
 * @alias module:@lumjs/defer/fake.STATUS
 */
module.exports = Enum(['PENDING','RESOLVED','REJECTED']);

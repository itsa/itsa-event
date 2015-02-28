(function (global) {

    "use strict";

    var NAME = '[promise-finalize]: ',
        NATIVE_OBJECT_OBSERVE = !!Object.observe,
        createHashMap = require('js-ext/extra/hashmap.js').createMap,
        afterFunc, afterFuncReject, finallyBKP, catchBKP, thenFulfillBKP;

    global._ITSAmodules || Object.protectedProp(global, '_ITSAmodules', createHashMap());

    if (global._ITSAmodules.PromiseFinalize) {
        return;
    }

    require('js-ext/lib/promise.js');

    afterFunc = function(response) {
        // we will run a NOOP every 500ms --> even if we tried to catch all async-actions, there still might be
        // situations where we miss model-updates.
        global.setTimeout(function() { /* NOOP */ }, 0);
        return response;
    };

    afterFuncReject = function(response) {
        // we will run a NOOP every 500ms --> even if we tried to catch all async-actions, there still might be
        // situations where we miss model-updates.
        global.setTimeout(function() { /* NOOP */ }, 0);
        throw new Error(response);
    };

    if (!NATIVE_OBJECT_OBSERVE) {
        (function(PromisePrototype) {
            finallyBKP = PromisePrototype.finally;
            PromisePrototype.finally = function () {
                return finallyBKP.apply(this, arguments)._originalThen(afterFunc, afterFuncReject);
            };

            catchBKP = PromisePrototype.catch;
            PromisePrototype.catch = function () {
                return catchBKP.apply(this, arguments)._originalThen(afterFunc, afterFuncReject);
            };

            PromisePrototype._originalThen = PromisePrototype.then;
            PromisePrototype.then = function () {
                return this._originalThen.apply(this, arguments)._originalThen(afterFunc, afterFuncReject);
            };

            thenFulfillBKP = PromisePrototype.thenFulfill;
            PromisePrototype.thenFulfill = function () {
                return thenFulfillBKP.apply(this, arguments)._originalThen(afterFunc, afterFuncReject);
            };
        }(Promise.prototype));
    }

    global._ITSAmodules.PromiseFinalize = true;

}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this));
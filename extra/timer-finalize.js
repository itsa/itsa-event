(function (global) {

    "use strict";

    var NAME = '[event-timer-finalize]: ',
        INTERVAL_AUTOFINALIZE = 500,
        createHashMap = require('js-ext/extra/hashmap.js').createMap,
        NATIVE_OBJECT_OBSERVE = !!Object.observe,
        Event, setTimeoutBKP, setIntervalBKP, setImmediateBKP;

    global._ITSAmodules || Object.protectedProp(global, '_ITSAmodules', createHashMap());

    if (global._ITSAmodules.EventTimerFinalize) {
        return;
    }

    Event = require('../event-base.js');
    // we patch the global timer functions in order to run `refreshItags` afterwards:
    setTimeoutBKP = global.setTimeout;
    setIntervalBKP = global.setInterval;

    global.setTimeout = function() {
        var args = arguments;
        args[0] = (function(originalFn) {
            return function() {
                var eventObject = {
                        type: '',
                        emitter: 'global',
                        target: global
                    };
                originalFn();
                Event.runFinalizers(eventObject);
            };
        })(args[0]);
        setTimeoutBKP.apply(this, arguments);
    };

    global.setInterval = function() {
        var args = arguments;
        args[0] = (function(originalFn) {
            return function() {
                var eventObject = {
                        type: '',
                        emitter: 'global',
                        target: global
                    };
                originalFn();
                Event.runFinalizers(eventObject);
            };
        })(args[0]);
        setIntervalBKP.apply(this, arguments);
    };

    if (typeof global.setImmediate !== 'undefined') {
        setImmediateBKP = global.setInterval;
        global.setImmediate = function() {
            var args = arguments;
            args[0] = (function(originalFn) {
                return function() {
                    var eventObject = {
                            type: '',
                            emitter: 'global',
                            target: global
                        };
                    originalFn();
                    Event.runFinalizers(eventObject);
                };
            })(args[0]);
            setImmediateBKP.apply(this, arguments);
        };
    }

    global._ITSAmodules.EventTimerFinalize = true;

    if (!NATIVE_OBJECT_OBSERVE) {
        // we will run a NOOP every 500ms --> even if we tried to catch all async-actions, there still might be
        // situations where we miss model-updates.
        global.setTimeout(function() { /* NOOP */ }, 0);
        global.setInterval(function() { /* NOOP */ }, INTERVAL_AUTOFINALIZE);
    }

}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this));
(function (global) {

    "use strict";

    var NAME = '[event-timer-finalize]: ',
        createHashMap = require('js-ext/extra/hashmap.js').createMap,
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
                console.log(NAME, 'setTimeOut will run Event.runFinalizers');
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
                console.log(NAME, 'setInterval will run Event.runFinalizers');
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
                    console.log(NAME, 'setImmediate will run Event.runFinalizers');
                    Event.runFinalizers(eventObject);
                };
            })(args[0]);
            setImmediateBKP.apply(this, arguments);
        };
    }

    global._ITSAmodules.EventTimerFinalize = true;

}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this));
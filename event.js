/**
 * Defines the Event-Class, which should be instantiated to get its functionality
 *
 * <i>Copyright (c) 2014 Parcela - https://github.com/Parcela</i>
 * New BSD License - https://github.com/ItsAsbreuk/itsa-library/blob/master/LICENSE
 *
 * @module event
 * @class Event
 * @constructor
 * @since 0.0.1
*/

require('lang-ext');

// to prevent multiple Event instances
// (which might happen: http://nodejs.org/docs/latest/api/modules.html#modules_module_caching_caveats)
// we make sure Event is defined only once. Therefore we bind it to `global` and return it if created before

(function (global, factory) {

    "use strict";

    if (!global._parcelaModules) {
        Object.defineProperty(global, '_parcelaModules', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: {} // `writable` is false means we cannot chance the value-reference, but we can change {} its members
        });
    }
    global._parcelaModules.Event || (global._parcelaModules.Event = factory());

    module.exports = global._parcelaModules.Event;

}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this, function () {

    "use strict";

    var NAME = '[core-event]: ',
        REGEXP_CUSTOMEVENT = /^((?:\w|-)+):((?:\w|-)+)$/,
        REGEXP_WILDCARD_CUSTOMEVENT = /^(?:((?:(?:\w|-)+)|\*):)?((?:(?:\w|-)+)|\*)$/,
        /* REGEXP_WILDCARD_CUSTOMEVENT :
         *
         * valid:
         * 'red:save'
         * 'red:*'
         * '*:save'
         * '*:*'
         * 'save'
         *
         * invalid:
         * '*red:save'
         * 're*d:save'
         * 'red*:save'
         * 'red:*save'
         * 'red:sa*ve'
         * 'red:save*'
         * ':save'
         */
        REGEXP_EVENTNAME_WITH_SEMICOLON = /:((?:\w|-)+)$/,
        MSG_HALTED = 'event was halted',
        MSG_PREVENTED = 'event was defaultPrevented',
        DEFINE_IMMUTAL_PROPERTY = function (obj, property, value) {
            Object.defineProperty(obj, property, {
                configurable: false,
                enumerable: false,
                writable: false,
                value: value // `writable` is false means we cannot chance the value-reference, but we can change {} or [] its members
            });
        },
        Event;

    Event = {
        /**
         * Subscribes to a customEvent. The callback will be executed `after` the defaultFn.
         *
         * @static
         * @method after
         * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
         *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
         *        If `emitterName` is not defined, `UI` is assumed.
         * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
         *        as its only argument.
         * @param [context] {Object} the instance that subscribes to the event.
         *        any object can passed through, even those are not extended with event-listener methods.
         *        Note: Objects who are extended with listener-methods should use instance.after() instead.
         * @param [filter] {String|Function} to filter the event.
         *        Use a String if you want to filter DOM-events by a `selector`
         *        Use a function if you want to filter by any other means. If the function returns a trully value, the
         *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
         *        the subscriber.
         * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of after-subscribers.
         * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
         * @since 0.0.1
        */
        after: function(customEvent, callback, context, filter, prepend) {
            console.log(NAME, 'add after subscriber to: '+customEvent);
            return this._addMultiSubs(false, customEvent, callback, context, filter, prepend);
        },

        /**
         * Subscribes to a customEvent. The callback will be executed `before` the defaultFn.
         *
         * @static
         * @method before
         * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
         *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
         *        If `emitterName` is not defined, `UI` is assumed.
         * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
         *        as its only argument.
         * @param [context] {Object} the instance that subscribes to the event.
         *        any object can passed through, even those are not extended with event-listener methods.
         *        Note: Objects who are extended with listener-methods should use instance.before() instead.
         * @param [filter] {String|Function} to filter the event.
         *        Use a String if you want to filter DOM-events by a `selector`
         *        Use a function if you want to filter by any other means. If the function returns a trully value, the
         *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
         *        the subscriber.
         * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of before-subscribers.
         * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
         * @since 0.0.1
        */
        before: function(customEvent, callback, context, filter, prepend) {
            console.log(NAME, 'add before subscriber to: '+customEvent);
            return this._addMultiSubs(true, customEvent, callback, context, filter, prepend);
        },

        /**
         * Defines an emitterName into the instance (emitter).
         * This will add a protected property `_emitterName` to the instance.
         *
         * @static
         * @method defineEmitter
         * @param emitter {Object} instance that should hold the emitterName
         * @param emitterName {String} identifier that will be added when events are sent (`emitterName:eventName`)
         * @since 0.0.1
         */
        defineEmitter: function (emitter, emitterName) {
            console.log(NAME, 'defineEmitter: '+emitterName);
            // ennumerable MUST be set `true` to enable merging
            Object.defineProperty(emitter, '_emitterName', {
                configurable: false,
                enumerable: true,
                writable: false,
                value: emitterName
            });
        },

        /**
         * Defines a CustomEvent. If the eventtype already exists, it will not be overridden,
         * unless you force to assign with `.forceAssign()`
         *
         * The returned object comes with 4 methods which can be invoked chainable:
         *
         * <ul>
         *     <li>defaultFn() --> the default-function of the event</li>
         *     <li>preventedFn() --> the function that should be invoked when the event is defaultPrevented</li>
         *     <li>forceAssign() --> overrides any previous definition</li>
         *     <li>unHaltable() --> makes the customEvent cannot be halted</li>
         *     <li>unPreventable() --> makes the customEvent's defaultFn cannot be prevented</li>
         *     <li>unSilencable() --> makes that emitters cannot make this event to perform silently (using e.silent)</li>
         *     <li>unRenderPreventable() --> makes that the customEvent's render cannot be prevented</li>
         *     <li>noRender() --> prevents this customEvent from render the dom. Overrules unRenderPreventable()</li>
         * </ul>
         *
         * @static
         * @method defineEvent
         * @param customEvent {String} name of the customEvent conform the syntax: `emitterName:eventName`
         * @return {Object} with extra methods that can be chained:
         * <ul>
         *      <li>unPreventable() --> makes the customEvent's defaultFn cannot be prevented</li>
         *      <li>unRenderPreventable() --> makes that the customEvent's render cannot be prevented</li>
         *      <li>forceAssign() --> overrides any previous definition</li>
         *      <li>defaultFn() --> the default-function of the event</li>
         *      <li>preventedFn() --> the function that should be invoked when the event is defaultPrevented</li>
         * </ul>
         * @since 0.0.1
         */
        defineEvent: function (customEvent) {
            console.log(NAME, 'Events.defineEvent: '+customEvent);
            var instance = this,
                customevents = instance._ce,
                extract, exists, newCustomEvent;

            if (typeof customEvent!=='string') {
                console.error(NAME, 'defineEvent should have a String-type as argument');
                return;
            }
            extract = customEvent.match(REGEXP_CUSTOMEVENT);
            if (!extract) {
                console.error(NAME, 'defined Customevent '+customEvent+' does not match pattern');
                return;
            }
            newCustomEvent = {
                preventable: true,
                renderPreventable: true
            };
            exists = customevents[customEvent];
            // if customEvent not yet exists, we can add it
            // else, we might need to wait for `forceAssign` to be called
            if (!exists) {
                // we can add it
                customevents[customEvent] = newCustomEvent;
            }
            return {
                defaultFn: function(defFn) {
                    newCustomEvent.defaultFn = defFn;
                    return this;
                },
                preventedFn: function(prevFn) {
                    newCustomEvent.preventedFn = prevFn;
                    return this;
                },
                unHaltable: function() {
                    newCustomEvent.unHaltable = true;
                    return this;
                },
                unSilencable: function() {
                    newCustomEvent.unSilencable = true;
                    return this;
                },
                unPreventable: function() {
                    newCustomEvent.unPreventable = true;
                    return this;
                },
                unRenderPreventable: function() {
                    newCustomEvent.unRenderPreventable = true;
                    return this;
                },
                noRender: function() {
                    newCustomEvent.noRender = true;
                    return this;
                },
                forceAssign: function() {
                    // only needed when not yet added:
                    // exists || (customevents[customEvent]=newCustomEvent);
                    customevents[customEvent] = newCustomEvent;
                    return this;
                }
            };
        },

        /**
         * Detaches (unsubscribes) the listener from the specified customEvent.
         *
         * @static
         * @method detach
         * @param [listener] {Object} The instance that is going to detach the customEvent.
         *        When not passed through (or undefined), all customevents of all instances are detached
         * @param customEvent {String} conform the syntax: `emitterName:eventName`, wildcard `*` may be used for both
         *        `emitterName` as well as only `eventName`, in which case 'UI' will become the emitterName.
         *        Can be set as the only argument.
         * @since 0.0.1
        */
        detach: function(listener, customEvent) {
            console.log('detach instance-subscriber: '+customEvent);
            // (typeof listener === 'string') means: only `customEvent` passed through
            (typeof listener === 'string') ? this._removeSubscribers(undefined, listener) : this._removeSubscribers(listener, customEvent);
        },

        /**
         * Detaches (unsubscribes) the listener from all customevents.
         *
         * @static
         * @method detachAll
         * @param listener {Object} The instance that is going to detach the customEvent
         * @since 0.0.1
        */
        detachAll: function(listener) {
            console.log(NAME, 'detach '+(listener ? 'all instance-' : 'ALL')+' subscribers');
            var instance = this;
            if (listener) {
                instance._removeSubscribers(listener, '*:*');
            }
            else {
                // we cannot just redefine _subs, for it is set as readonly
                instance._subs.each(
                    function(value, key) {
                        delete instance._subs[key];
                    }
                );
            }
        },

        /**
         * Emits the event `eventName` on behalf of `emitter`, which becomes e.target in the eventobject.
         * During this process, all subscribers and the defaultFn/preventedFn get an eventobject passed through.
         * The eventobject is created with at least these properties:
         *
         * <ul>
         *     <li>e.target --> source that triggered the event (instance or DOM-node), specified by `emitter`</li>
         *     <li>e.type --> eventName</li>
         *     <li>e.emitter --> emitterName</li>
         *     <li>e.status --> status-information:
         *          <ul>
         *               <li>e.status.ok --> `true|false` whether the event got executed (not halted or defaultPrevented)</li>
         *               <li>e.status.defaultFn (optional) --> `true` if any defaultFn got invoked</li>
         *               <li>e.status.preventedFn (optional) --> `true` if any preventedFn got invoked</li>
         *               <li>e.status.rendered (optional) --> `true` the vDOM rendered the dom</li>
         *               <li>e.status.halted (optional) --> `reason|true` if the event got halted and optional the why</li>
         *               <li>e.status.defaultPrevented (optional) -->  `reason|true` if the event got defaultPrevented and optional the why</li>
         *               <li>e.status.renderPrevented (optional) -->  `reason|true` if the event got renderPrevented and optional the why</li>
         *          </ul>
         *     </li>
         * </ul>
         *
         * The optional `payload` is merged into the eventobject and could be used by the subscribers and the defaultFn/preventedFn.
         * If payload.silent is set true, the subscribers are not getting invoked: only the defaultFn.
         *
         * The eventobject also has these methods:
         *
         * <ul>
         *     <li>e.halt() --> stops immediate all actions: no mer subscribers are invoked, no defaultFn/preventedFn</li>
         *     <li>e.preventDefault() --> instead of invoking defaultFn, preventedFn will be invoked. No aftersubscribers</li>
         *     <li>e.preventRender() --> by default, any event will trigger the vDOM (if exists) to re-render, this can be prevented by calling e.preventRender()</li>
         * </ul>
         *
         * <ul>
         *     <li>First, before-subscribers are invoked: this is the place where you might call `e.halt()`, `a.preventDefault()` or `e.preventRender()`</li>
         *     <li>Next, defaultFn or preventedFn gets invoked, depending on whether e.halt() or a.preventDefault() has been called</li>
         *     <li>Next, after-subscribers get invoked (unless e.halt() or a.preventDefault() has been called)</li>
         *     <li>Finally, the finalization takes place: any subscribers are invoked, unless e.halt() or a.preventDefault() has been called</li>
         * <ul>
         *
         * @static
         * @method emit
         * @param [emitter] {Object} instance that emits the events
         * @param customEvent {String} Full customEvent conform syntax `emitterName:eventName`.
         *        `emitterName` is available as **e.emitter**, `eventName` as **e.type**.
         * @param payload {Object} extra payload to be added to the event-object
         * @return {Object|undefined} eventobject or undefined when the event was halted or preventDefaulted.
         * @since 0.0.1
         */
        emit: function (emitter, customEvent, payload) {
            var instance = this;
            if (typeof emitter === 'string') {
                // emit is called with signature emit(customEvent, payload)
                // thus the source-emitter is the Event-instance
                payload = customEvent;
                customEvent = emitter;
                emitter = instance;
            }
            return instance._emit(emitter, customEvent, payload);
        },

        /**
         * Adds a subscriber to the finalization-cycle, which happens after the after-subscribers.
         * Only get invoked when the cycle was not preventDefaulted or halted.
         *
         * @method finalize
         * @param finallySubscriber {Function} callback to be invoked
         *        Function recieves the eventobject as its only argument
         * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
         * @since 0.0.1
         */
        finalize: function (finallySubscriber) {
            console.log(NAME, 'finalize');
            var finalHash = this._final;
            finalHash.push(finallySubscriber);
            return {
                detach: function() {
                    console.log(NAME, 'detach finalizer');
                    var index = finalHash.indexOf(finallySubscriber);
                    (index===-1) || finalHash.splice(index, 1);
                }
            };
        },

        /**
         * Creates a notifier for the customEvent.
         * You can use this to create delayed `defineEvents`. When the customEvent is called, the callback gets invoked
         * (even before the subsrcibers). Use this callback for delayed customEvent-definitions.
         *
         * Use **no** wildcards for the emitterName. You might use wildcards for the eventName. Without wildcards, the
         * notification will be unNotified (callback automaticly detached) on the first time the event occurs.

         * You **must** specify the full `emitterName:eventName` syntax.
         * The module `core-event-dom` uses `notify` to auto-define DOM-events (UI:*).
         *
         * @static
         * @method notify
         * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
         *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used only  for`eventName`.
         *        If `emitterName` should be defined.
         * @param callback {Function} subscriber: will be invoked when the customEvent is called (before any subscribers.
         *                 Recieves 2 arguments: `customEvent` and the `subscriber-object`.
         * @param context {Object} context of the callback
         * @chainable
         * @since 0.0.1
        */
        notify: function(customEvent, callback, context) {
            console.log(NAME, 'notify');
            this._notifiers[customEvent] = {
                cb: callback,
                o: context
            };
            return this;
        },

        /**
         * Alias for `after`.
         *
         * Subscribes to a customEvent. The callback will be executed `after` the defaultFn.
         *
         * @static
         * @method on
         * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
         *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
         *        If `emitterName` is not defined, `UI` is assumed.
         * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
         *        as its only argument.
         * @param [context] {Object} the instance that subscribes to the event.
         *        any object can passed through, even those are not extended with event-listener methods.
         *        Note: Objects who are extended with listener-methods should use instance.on() instead.
         * @param [filter] {String|Function} to filter the event.
         *        Use a String if you want to filter DOM-events by a `selector`
         *        Use a function if you want to filter by any other means. If the function returns a trully value, the
         *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
         *        the subscriber.
         * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of after-subscribers.
         * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
         * @since 0.0.1
        */
        on: function(/* customEvent, callback, context, filter, prepend */) {
            return this.after.apply(this, arguments);
        },

        /**
         * Alias for `onceAfter`.
         *
         * Subscribes to a customEvent. The callback will be executed `after` the defaultFn.
         * The subscriber will be automaticly removed once the callback executed the first time.
         * No need to `detach()` (unless you want to undescribe before the first event)
         *
         * @static
         * @method once
         * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
         *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
         *        If `emitterName` is not defined, `UI` is assumed.
         * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
         *        as its only argument.
         * @param [context] {Object} the instance that subscribes to the event.
         *        any object can passed through, even those are not extended with event-listener methods.
         *        Note: Objects who are extended with listener-methods should use instance.onceAfter() instead.
         * @param [filter] {String|Function} to filter the event.
         *        Use a String if you want to filter DOM-events by a `selector`
         *        Use a function if you want to filter by any other means. If the function returns a trully value, the
         *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
         *        the subscriber.
         * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of after-subscribers.
         * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
         * @since 0.0.1
        */
        once: function(/* customEvent, callback, context, filter, prepend */) {
            return this.onceAfter.apply(this, arguments);
        },

        /**
         * Subscribes to a customEvent. The callback will be executed `after` the defaultFn.
         * The subscriber will be automaticly removed once the callback executed the first time.
         * No need to `detach()` (unless you want to undescribe before the first event)
         *
         * @static
         * @method onceAfter
         * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
         *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
         *        If `emitterName` is not defined, `UI` is assumed.
         * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
         *        as its only argument.
         * @param [context] {Object} the instance that subscribes to the event.
         *        any object can passed through, even those are not extended with event-listener methods.
         *        Note: Objects who are extended with listener-methods should use instance.onceAfter() instead.
         * @param [filter] {String|Function} to filter the event.
         *        Use a String if you want to filter DOM-events by a `selector`
         *        Use a function if you want to filter by any other means. If the function returns a trully value, the
         *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
         *        the subscriber.
         * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of after-subscribers.
         * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
         * @since 0.0.1
        */
        onceAfter: function(customEvent, callback, context, filter, prepend) {
            var instance = this,
                handler, wrapperFn;
            console.log(NAME, 'add onceAfter subscriber to: '+customEvent);
            wrapperFn = function(e) {
                // CAUTIOUS: removeing the handler right now would lead into a mismatch of the dispatcher
                // who loops through the array of subscribers!
                // therefore, we must remove once the eventcycle has finished --> we detach by setting it
                // at the end of the global-eventstack:
                // yet there still is a change that the event is called multiple times BEFORE it
                // will reach the defined `setTimeout` --> to avoid multiple invocations, handler is
                // extended with the property `_detached`
                handler._detached  || callback.call(this, e);
                handler._detached = true;
                setTimeout(function() {handler.detach();}, 0);
            };
            handler = instance._addMultiSubs(false, customEvent, wrapperFn, context, filter, prepend);
            return handler;
        },

        /**
         * Subscribes to a customEvent. The callback will be executed `before` the defaultFn.
         * The subscriber will be automaticly removed once the callback executed the first time.
         * No need to `detach()` (unless you want to undescribe before the first event)
         *
         * @static
         * @method onceBefore
         * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
         *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
         *        If `emitterName` is not defined, `UI` is assumed.
         * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
         *        as its only argument.
         * @param [context] {Object} the instance that subscribes to the event.
         *        any object can passed through, even those are not extended with event-listener methods.
         *        Note: Objects who are extended with listener-methods should use instance.onceBefore() instead.
         * @param [filter] {String|Function} to filter the event.
         *        Use a String if you want to filter DOM-events by a `selector`
         *        Use a function if you want to filter by any other means. If the function returns a trully value, the
         *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
         *        the subscriber.
         * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of before-subscribers.
         * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
         * @since 0.0.1
        */
        onceBefore: function(customEvent, callback, context, filter, prepend) {
            var instance = this,
                handler, wrapperFn;
            console.log(NAME, 'add onceBefore subscriber to: '+customEvent);
            wrapperFn = function(e) {
                // CAUTIOUS: removeing the handler right now would lead into a mismatch of the dispatcher
                // who loops through the array of subscribers!
                // therefore, we must remove once the eventcycle has finished --> we detach by setting it
                // at the end of the global-eventstack.
                // yet there still is a change that the event is called multiple times BEFORE it
                // will reach the defined `setTimeout` --> to avoid multiple invocations, handler is
                // extended with the property `_detached`
                handler._detached  || callback.call(this, e);
                handler._detached = true;
                setTimeout(function() {handler.detach();}, 0);
            };
            handler = instance._addMultiSubs(true, customEvent, wrapperFn, context, filter, prepend);
            return handler;
        },

        /**
         * Removes all event-definitions of an emitter, specified by its `emitterName`.
         * When `emitterName` is not set, ALL event-definitions will be removed.
         *
         * @static
         * @method undefAllEvents
         * @param [emitterName] {String} name of the customEvent conform the syntax: `emitterName:eventName`
         * @since 0.0.1
         */
        undefAllEvents: function (emitterName) {
            console.log(NAME, 'undefAllEvents');
            var instance = this,
                pattern;
            if (emitterName) {
                pattern = new RegExp('^'+emitterName+':');
                instance._ce.each(
                    function(value, key, object) {
                        key.match(pattern) && (delete instance._ce[key]);
                    }
                );
            }
            else {
                instance._ce.each(
                    function(value, key, object) {
                        delete instance._ce[key];
                    }
                );
            }
        },

        /**
         * Removes the event-definition of the specified customEvent.
         *
         * @static
         * @method undefEvent
         * @param customEvent {String} name of the customEvent conform the syntax: `emitterName:eventName`
         * @since 0.0.1
         */
        undefEvent: function (customEvent) {
            console.log(NAME, 'undefEvent '+customEvent);
            delete this._ce[customEvent];
        },

        /**
         * unNotifies (unsubscribes) the notifier of the specified customEvent.
         *
         * @static
         * @method unNotify
         * @param customEvent {String} conform the syntax: `emitterName:eventName`.
         * @since 0.0.1
        */
        unNotify: function(customEvent) {
            console.log(NAME, 'unNotify '+customEvent);
            delete this._notifiers[customEvent];
        },

        //====================================================================================================
        // private methods:
        //====================================================================================================

        /**
         * Creates a subscriber to the specified customEvent. The customEvent must conform the syntax:
         * `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`
         * If `emitterName` is not defined, `UI` is assumed.
         *
         * Examples of valid customevents:
         *
         * <ul>
         *     <li>'redmodel:save'</li>
         *     <li>'UI:click'</li>
         *     <li>'click' --> alias for 'UI:click'</li>
         *     <li>'`*`:click' --> careful: will listen to both UIs and non-UI- click-events</li>
         *     <li>'redmodel:`*`'</li>
         *     <li>'`*`:`*`'</li>
         * </ul>
         *
         * @static
         * @method _addMultiSubs
         * @param before {Boolean} whether the subscriber is a `before` subscriber. On falsy, an `after`-subscriber is assumed.
         * @param customEvent {Array} Array of Strings. customEvent should conform the syntax: `emitterName:eventName`, wildcard `*`
         *         may be used for both `emitterName` as well as only `eventName`, in which case 'UI' will become the emitterName.
         * @param callback {Function} subscriber to the event.
         * @param listener {Object} Object that creates the subscriber (and will be listening by `listener.after(...)`)
         * @param [filter] {String|Function} to filter the event.
         *        Use a String if you want to filter DOM-events by a `selector`
         *        Use a function if you want to filter by any other means. If the function returns a trully value, the
         *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
         *        the subscriber.
         * @param [prepend=false] {Boolean} whether to make the subscriber the first in the list. By default it will pe appended.
         * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
         * @private
         * @since 0.0.1
        */
        _addMultiSubs: function(before, customEvent, callback, listener, filter, prepend) {
            console.log(NAME, '_addMultiSubs');
            var instance = this;
            if ((typeof listener === 'string') || (typeof listener === 'function')) {
                prepend = filter;
                filter = listener;
                listener = null;
            }
            else if (typeof listener === 'boolean') {
                prepend = listener;
                filter = null;
                listener = null;
            }
            if ((typeof filter==='boolean') || (typeof filter===undefined) || (typeof filter===null)) {
                // filter was not set, instead `prepend` is set at this position
                prepend = filter;
                filter = null;
            }
            if (!Array.isArray(customEvent)) {
                return instance._addSubscriber(listener, before, customEvent, callback, filter, prepend);
            }
            customEvent.forEach(
                function(ce) {
                    instance._addSubscriber(listener, before, ce, callback, filter, prepend);
                }
            );
            return {
                detach: function() {
                    customEvent.each(
                        function(ce) {
                            instance._removeSubscriber(listener, before, ce, callback);
                        }
                    );
                }
            };
        },

        /**
         * Creates a subscriber to the specified customEvent. The customEvent must conform the syntax:
         * `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`
         * If `emitterName` is not defined, `UI` is assumed.
         *
         * Examples of valid customevents:
         *
         * <ul>
         *     <li>'redmodel:save'</li>
         *     <li>'UI:click'</li>
         *     <li>'click' --> alias for 'UI:click'</li>
         *     <li>'`*`:click' --> careful: will listen to both UIs and non-UI- click-events</li>
         *     <li>'redmodel:`*`'</li>
         *     <li>'`*`:`*`'</li>
         * </ul>
         *
         * @static
         * @method _addSubscriber
         * @param listener {Object} Object that creates the subscriber (and will be listening by `listener.after(...)`)
         * @param before {Boolean} whether the subscriber is a `before` subscriber. On falsy, an `after`-subscriber is assumed.
         * @param customEvent {String} conform the syntax: `emitterName:eventName`, wildcard `*` may be used for both
         *        `emitterName` as well as only `eventName`, in which case 'UI' will become the emitterName.
         * @param callback {Function} subscriber to the event.
         * @param [filter] {String|Function} to filter the event.
         *        Use a String if you want to filter DOM-events by a `selector`
         *        Use a function if you want to filter by any other means. If the function returns a trully value, the
         *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
         *        the subscriber.
         * @param [prepend=false] {Boolean} whether to make the subscriber the first in the list. By default it will pe appended.
         * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
         * @private
         * @since 0.0.1
        */
        _addSubscriber: function(listener, before, customEvent, callback, filter, prepend) {
            var instance = this,
                allSubscribers = instance._subs,
                extract = customEvent.match(REGEXP_WILDCARD_CUSTOMEVENT),
                hashtable, item, notifier, customEventWildcardEventName;

            if (!extract) {
                console.error(NAME, 'subscribe-error: eventname does not match pattern');
                return;
            }
            // if extract[1] is undefined, a simple customEvent is going to subscribe (without :)
            // therefore: recomposite customEvent:
            extract[1] || (customEvent='UI:'+customEvent);


            allSubscribers[customEvent] || (allSubscribers[customEvent]={});
            if (before) {
                allSubscribers[customEvent].b || (allSubscribers[customEvent].b=[]);
            }
            else {
                allSubscribers[customEvent].a || (allSubscribers[customEvent].a=[]);
            }

            hashtable = allSubscribers[customEvent][before ? 'b' : 'a'];
            // we need to be able to process an array of customevents
            item = {
                o: listener || instance,
                cb: callback,
                f: filter
            };

            // in case of a defined subscription (no wildcard), we should look for notifiers
            if ((extract[1]!=='*') && (extract[2]!=='*')) {
                // before subscribing: we might need to activate notifiers --> with defined eventName should also be cleaned up:
                notifier = instance._notifiers[customEvent];
                if (notifier) {
                    notifier.cb.call(notifier.o, customEvent, item);
                    delete instance._notifiers[customEvent];
                }
                // check the same for wildcard eventName:
                customEventWildcardEventName = customEvent.replace(REGEXP_EVENTNAME_WITH_SEMICOLON, ':*');
                if ((customEventWildcardEventName !== customEvent) && (notifier=instance._notifiers[customEventWildcardEventName])) {
                    notifier.cb.call(notifier.o, customEvent, item);
                }
            }

            console.log(NAME, '_addSubscriber to customEvent: '+customEvent);
            prepend ? hashtable.unshift(item) : hashtable.push(item);

            return {
                detach: function() {
                    instance._removeSubscriber(listener, before, customEvent, callback);
                }
            };
        },

        /**
         * Emits the event `eventName` on behalf of `emitter`, which becomes e.target in the eventobject.
         * During this process, all subscribers and the defaultFn/preventedFn get an eventobject passed through.
         * The eventobject is created with at least these properties:
         *
         * <ul>
         *     <li>e.target --> source that triggered the event (instance or DOM-node), specified by `emitter`</li>
         *     <li>e.type --> eventName</li>
         *     <li>e.emitter --> emitterName</li>
         *     <li>e.status --> status-information:
         *          <ul>
         *               <li>e.status.ok --> `true|false` whether the event got executed (not halted or defaultPrevented)</li>
         *               <li>e.status.defaultFn (optional) --> `true` if any defaultFn got invoked</li>
         *               <li>e.status.preventedFn (optional) --> `true` if any preventedFn got invoked</li>
         *               <li>e.status.rendered (optional) --> `true` the vDOM rendered the dom</li>
         *               <li>e.status.halted (optional) --> `reason|true` if the event got halted and optional the why</li>
         *               <li>e.status.defaultPrevented (optional) -->  `reason|true` if the event got defaultPrevented and optional the why</li>
         *               <li>e.status.renderPrevented (optional) -->  `reason|true` if the event got renderPrevented and optional the why</li>
         *          </ul>
         *     </li>
         * </ul>
         *
         * The optional `payload` is merged into the eventobject and could be used by the subscribers and the defaultFn/preventedFn.
         * If payload.silent is set true, the subscribers are not getting invoked: only the defaultFn.
         *
         * The eventobject also has these methods:
         *
         * <ul>
         *     <li>e.halt() --> stops immediate all actions: no mer subscribers are invoked, no defaultFn/preventedFn</li>
         *     <li>e.preventDefault() --> instead of invoking defaultFn, preventedFn will be invoked. No aftersubscribers</li>
         *     <li>e.preventRender() --> by default, any event will trigger the vDOM (if exists) to re-render, this can be prevented by calling e.preventRender()</li>
         * </ul>
         *
         * <ul>
         *     <li>First, before-subscribers are invoked: this is the place where you might call `e.halt()`, `a.preventDefault()` or `e.preventRender()`</li>
         *     <li>Next, defaultFn or preventedFn gets invoked, depending on whether e.halt() or a.preventDefault() has been called</li>
         *     <li>Next, after-subscribers get invoked (unless e.halt() or a.preventDefault() has been called)</li>
         *     <li>Finally, the finalization takes place: any subscribers are invoked, unless e.halt() or a.preventDefault() has been called</li>
         * <ul>
         *
         * @static
         * @method emit
         * @param [emitter] {Object} instance that emits the events
         * @param customEvent {String} Full customEvent conform syntax `emitterName:eventName`.
         *        `emitterName` is available as **e.emitter**, `eventName` as **e.type**.
         * @param payload {Object} extra payload to be added to the event-object
         * @param [beforeSubscribers] {Array} array of functions to act as beforesubscribers. <b>should not be used</b> other than
         *                            by any submodule like `event-dom`. If used, than this list of subscribers gets invoked instead
         *                            of the subscribers that actually subscribed to the event.
         * @param [afterSubscribers] {Array} array of functions to act as afterSubscribers. <b>should not be used</b> other than
         *                            by any submodule like `event-dom`. If used, than this list of subscribers gets invoked instead
         *                            of the subscribers that actually subscribed to the event.
         * @param [preProcessor] {Function} if passed, this function will be invoked before every single subscriber
         *                       It is meant to manipulate the eventobject, something that `event-dom` needs to do
         *                       This function expects 2 arguments: `subscriber` and `eventobject`.
         *                       <b>should not be used</b> other than by any submodule like `event-dom`.
         * @param [keepPayload] {Boolean} whether `payload` should be used as the ventobject instead of creating a new
         *                      eventobject and merge payload. <b>should not be used</b> other than by any submodule like `event-dom`.
         * @return {Object|undefined} eventobject or undefined when the event was halted or preventDefaulted.
         * @since 0.0.1
         */
        _emit: function (emitter, customEvent, payload, beforeSubscribers, afterSubscribers, preProcessor, keepPayload) {
            // NOTE: emit() needs to be synchronous! otherwise we wouldn't be able
            // to preventDefault DOM-events in time.
            var instance = this,
                allCustomEvents = instance._ce,
                allSubscribers = instance._subs,
                customEventDefinition, extract, emitterName, eventName, subs, wildcard_named_subs,
                named_wildcard_subs, wildcard_wildcard_subs, e, invokeSubs;

            (customEvent.indexOf(':') !== -1) || (customEvent = emitter._emitterName+':'+customEvent);
            console.log(NAME, 'customEvent.emit: '+customEvent);

            extract = customEvent.match(REGEXP_CUSTOMEVENT);
            if (!extract) {
                console.error(NAME, 'defined emit-event does not match pattern');
                return;
            }
            emitterName = extract[1];
            eventName = extract[2];
            customEventDefinition = allCustomEvents[customEvent];

            subs = allSubscribers[customEvent];
            wildcard_named_subs = allSubscribers['*:'+eventName];
            named_wildcard_subs = allSubscribers[emitterName+':*'];
            wildcard_wildcard_subs = allSubscribers['*:*'];

            if (keepPayload) {
                e = payload;
            }
            else {
                e = Object.create(instance._defaultEventObj);
                e.target = emitter;
                e.type = eventName;
                e.emitter = emitterName;
                e.status = {};
                if (customEventDefinition) {
                    e._unPreventable = customEventDefinition.unPreventable;
                    e._unHaltable = customEventDefinition.unHaltable;
                    e._unRenderPreventable = customEventDefinition.unRenderPreventable;
                    customEventDefinition.unSilencable && (e.status.unSilencable = true);
                }
                if (payload) {
                    // e.merge(payload); is not enough --> DOM-eventobject has many properties that are not "own"-properties
                    for (var key in payload) {
                        e[key] || (e[key]=payload[key]);
                    }
                }
                if (e.status.unSilencable && e.silent) {
                    console.warn(NAME, ' event '+e.emitter+':'+e.type+' cannot made silent: this customEvent is defined as unSilencable');
                    e.silent = false;
                }
            }
            if (beforeSubscribers) {
                instance._invokeSubs(e, false, true, preProcessor, {b: beforeSubscribers});
            }
            else {
                invokeSubs = instance._invokeSubs.bind(instance, e, true, true, false);
                [subs, named_wildcard_subs, wildcard_named_subs, wildcard_wildcard_subs].forEach(invokeSubs);
            }
            e.status.ok = !e.status.halted && !e.status.defaultPrevented;
            // in case any subscriber changed e.target inside its filter (event-dom does this),
            // then we reset e.target to its original:
            e.sourceTarget && (e.target=e.sourceTarget);
            if (customEventDefinition && !e.status.halted) {
                // now invoke defFn
                e.returnValue = e.status.defaultPrevented ?
                                (customEventDefinition.preventedFn && (e.status.preventedFn=true) && customEventDefinition.preventedFn.call(e.target, e)) :
                                (customEventDefinition.defaultFn && (e.status.defaultFn=true) && customEventDefinition.defaultFn.call(e.target, e));
            }

            if (e.status.ok) {
                if (afterSubscribers) {
                    instance._invokeSubs(e, false, false, preProcessor, {a: afterSubscribers});
                }
                else {
                    invokeSubs = instance._invokeSubs.bind(instance, e, true, false, false);
                    [subs, named_wildcard_subs, wildcard_named_subs, wildcard_wildcard_subs].forEach(invokeSubs);
                }
                if (!e.silent) {
                    // in case any subscriber changed e.target inside its filter (event-dom does this),
                    // then we reset e.target to its original:
                    e.sourceTarget && (e.target=e.sourceTarget);
                    instance._final.some(function(finallySubscriber) {
                        !e.silent && finallySubscriber(e);
                        if (e.status.unSilencable && e.silent) {
                            console.warn(NAME, ' event '+e.emitter+':'+e.type+' cannot made silent: this customEvent is defined as unSilencable');
                            e.silent = false;
                        }
                        return e.silent;
                    });
                }
            }
            return e;
        },

        /**
         * Does the actual invocation of a subscriber.
         *
         * @method _invokeSubs
         * @param e {Object} event-object
         * @param [checkFilter] {Boolean}
         * @param [before] {Boolean} whether it concerns before subscribers
         * @param [checkFilter] {Boolean}
         * @param subscribers {Array} contains subscribers (objects) with these members:
         * <ul>
         *     <li>subscriber.o {Object} context of the callback</li>
         *     <li>subscriber.cb {Function} callback to be invoked</li>
         *     <li>subscriber.f {Function} filter to be applied</li>
         *     <li>subscriber.t {DOM-node} target for the specific selector, which will be set as e.target
         *         only when event-dom is active and there are filter-selectors</li>
         *     <li>subscriber.n {DOM-node} highest dom-node that acts as the container for delegation.
         *         only when event-dom is active and there are filter-selectors</li>
         * </ul>
         * @private
         * @since 0.0.1
         */
        _invokeSubs: function (e, checkFilter, before, preProcessor, subscribers) { // subscribers, plural
            console.log(NAME, '_invokeSubs');
            var subs;
            if (subscribers && !e.status.halted && !e.silent) {
                subs = before ? subscribers.b : subscribers.a;
                subs && subs.some(function(subscriber) {
                    console.log(NAME, '_invokeSubs checking invokation for single subscriber');
                    if (preProcessor && preProcessor(subscriber, e)) {
                        return true;
                    }
                    // check: does it pass the filter
                    if (!checkFilter || !subscriber.f || subscriber.f.call(subscriber.o, e)) {
                        // finally: invoke subscriber
                        console.log(NAME, '_invokeSubs is going to invoke subscriber');
                        subscriber.cb.call(subscriber.o, e);
                    }
                    if (e.status.unSilencable && e.silent) {
                        console.warn(NAME, ' event '+e.emitter+':'+e.type+' cannot made silent: this customEvent is defined as unSilencable');
                        e.silent = false;
                    }
                    return e.silent || (before && e.status.halted);  // remember to check whether it was halted for any reason
                });
            }
        },

        /**
         * Removes a subscriber from the specified customEvent. The customEvent must conform the syntax:
         * `emitterName:eventName`.
         *
         * @static
         * @method _removeSubscriber
         * @param listener {Object} Object that creates the subscriber (and will be listening by `listener.after(...)`)
         * @param before {Boolean} whether the subscriber is a `before` subscriber. On falsy, an `after`-subscriber is assumed.
         * @param customEvent {String} conform the syntax: `emitterName:eventName`, wildcard `*` may be used for both
         *        `emitterName` as well as only `eventName`, in which case 'UI' will become the emmiterName.
         * @param [callback] {Function} subscriber to the event, when not set, all subscribers of the listener to this customEvent
         *                   will be removed.
         * @private
         * @since 0.0.1
        */
        _removeSubscriber: function(listener, before, customEvent, callback) {
            console.log('_removeSubscriber: '+customEvent);
            var instance = this,
                eventSubscribers = instance._subs[customEvent],
                hashtable = eventSubscribers && eventSubscribers[before ? 'b' : 'a'],
                i, subscriber, beforeUsed, afterUsed;
            // remove only subscribers that are not subscribed to systemevents of Parcela (emitterName=='ParcelaEvent'):
            if (hashtable) {
                // unfortunatly we cannot search by reference, because the array has composed objects
                // also: can't use native Array.forEach: removing items within its callback change the array
                // during runtime, making it to skip the next item of the one that's being removed
               for (i=0; i<hashtable.length; ++i) {
                    console.log(NAME, '_removeSubscriber for single subscriber');
                    subscriber = hashtable[i];
                    if ((subscriber.o===(listener || instance)) && (!callback || (subscriber.cb===callback))) {
                        console.log('removing subscriber');
                        hashtable.splice(i--, 1);
                    }
                }
            }
            // After removal subscriber: check whether both eventSubscribers.a and eventSubscribers.b are empty
            // if so, remove the member from Event._subs to cleanup memory
            if (eventSubscribers) {
                beforeUsed = eventSubscribers.b && (eventSubscribers.b.length>0);
                afterUsed = eventSubscribers.a && (eventSubscribers.a.length>0);
                if (!beforeUsed && !afterUsed) {
                    delete instance._subs[customEvent];
                }
            }
        },

        /**
         * Removes subscribers from the multiple customevents. The customEvent must conform the syntax:
         * `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`
         * If `emitterName` is not defined, `UI` is assumed.
         *
         * Examples of valid customevents:
         *
         * <ul>
         *     <li>'redmodel:save'</li>
         *     <li>'UI:click'</li>
         *     <li>'click' --> alias for 'UI:click'</li>
         *     <li>'`*`:click' --> careful: will listen to both UIs and non-UI- click-events</li>
         *     <li>'redmodel:`*`'</li>
         *     <li>'`*`:`*`'</li>
         * </ul>
         *
         * @static
         * @method _removeSubscriber
         * @param listener {Object} Object that creates the subscriber (and will be listening by `listener.after(...)`)
         * @param customEvent {String} conform the syntax: `emitterName:eventName`, wildcard `*` may be used for both
         *        `emitterName` as well as only `eventName`, in which case 'UI' will become the emmiterName.
         * @private
         * @since 0.0.1
        */
        _removeSubscribers: function(listener, customEvent) {
            console.log('_removeSubscribers: '+customEvent);
            var instance = this,
                emitterName, eventName,
                extract = customEvent.match(REGEXP_WILDCARD_CUSTOMEVENT);
            if (!extract) {
                console.error(NAME, '_removeSubscribers-error: customEvent '+customEvent+' does not match pattern');
                return;
            }
            emitterName = extract[1] || 'UI';
            eventName = extract[2];
            if ((emitterName!=='*') && (eventName!=='*')) {
                instance._removeSubscriber(listener, true, customEvent);
                instance._removeSubscriber(listener, false, customEvent);
            }
            else {
                // wildcard, we need to look at all the members of Event._subs
                instance._subs.each(
                    function(value, key) {
                        var localExtract = key.match(REGEXP_WILDCARD_CUSTOMEVENT),
                            emitterMatch = (emitterName==='*') || (emitterName===localExtract[1]),
                            eventMatch = (eventName==='*') || (eventName===localExtract[2]);
                        if (emitterMatch && eventMatch) {
                            instance._removeSubscriber(listener, true, key);
                            instance._removeSubscriber(listener, false, key);
                        }
                    }
                );
            }
        },

        /**
         * Adds a property to the default eventobject's prototype which passes through all eventcycles.
         * Goes through Object.defineProperty with configurable, enumerable and writable
         * all set to false.
         *
         * @method _setEventObjProperty
         * @param property {String} event-object
         * @param value {Any}
         * @chainable
         * @private
         * @since 0.0.1
         */
        _setEventObjProperty: function (property, value) {
            console.log(NAME, '_setEventObjProperty');
            DEFINE_IMMUTAL_PROPERTY(this._defaultEventObj, property, value);
            return this;
        }

    };

    /**
     * Objecthash containing all defined custom-events
     * which has a structure like this:
     *
     * _ce = {
     *     'UI:click': {
     *         preventable: true,
     *         defaultFn: function(){...},
     *         preventedFn: function(){...},
     *         renderPreventable: true
     *     },
     *     'redmodel:save': {
     *         preventable: true,
     *         defaultFn: function(){...},
     *         preventedFn: function(){...},
     *         renderPreventable: true
     *     }
     * }
     *
     * @property _ce
     * @default {}
     * @type Object
     * @private
     * @since 0.0.1
    */
    Object.defineProperty(Event, '_ce', {
        configurable: false,
        enumerable: false,
        writable: false,
        value: {} // `writable` is false means we cannot chance the value-reference, but we can change {}'s properties itself
    });

    /**
     * Objecthash containing all defined before and after subscribers
     * which has a structure like this (`b` represents `before` and `a` represents `after`)
     * Every item that gets in the array consist by itself of 3 properties:
     *                                                          subscriberitem = {
     *                                                              o: listener,
     *                                                              cb: callbackFn(e),
     *                                                              f: filter
     *                                                          };
     *
     * _subs = {
     *     'UI:click': {
     *         b: [
     *             item,
     *             item
     *         ],
     *         a: [
     *             item,
     *             item
     *         ]
     *     },
     *     '*:click': {
     *         b: [
     *             item,
     *             item
     *         ],
     *         a: [
     *             item,
     *             item
     *         ]
     *     },
     *     'redmodel:save': {
     *         b: [
     *             item,
     *             item
     *         ],
     *         a: [
     *             item,
     *             item
     *         ]
     *     }
     * }
     *
     * @property _ce
     * @default {}
     * @type Object
     * @private
     * @since 0.0.1
    */
    DEFINE_IMMUTAL_PROPERTY(Event, '_subs', {});

    /**
     * Internal list of finalize-subscribers which are invoked at the finalization-cycle, which happens after the after-subscribers.
     * Is an array of function-references.
     *
     * @property _final
     * @default []
     * @type Array
     * @private
     * @since 0.0.1
    */
    DEFINE_IMMUTAL_PROPERTY(Event, '_final', []);

    /**
     * Object that acts as the prototype of the eventobject.
     * To add more methods, you can use `_setEventObjProperty`
     *
     * @property _defaultEventObj
     * @default {
     *    halt: function()
     *    preventDefault: function()
     *    preventRender: function()
     * }
     * @type Object
     * @private
     * @since 0.0.1
    */
    DEFINE_IMMUTAL_PROPERTY(Event, '_defaultEventObj', {});

    /**
     * Objecthash containing all notifiers, keyed by customEvent name.
     * This list is maintained by `notify`, `unNotify` and `unNotifyAll`
     *
     * _notifiers = {
     *     'UI:click': {
     *         cb:function() {}
     *         o: {} // context
     *     },
     *     'redmodel:*': {
     *         cb:function() {}
     *         o: {} // context
     *     },
     *     'bluemodel:save': {
     *         cb:function() {}
     *         o: {} // context
     *     }
     * }
     *
     * @property _notifiers
     * @default {}
     * @type Object
     * @private
     * @since 0.0.1
    */
    DEFINE_IMMUTAL_PROPERTY(Event, '_notifiers', {});

    Event._setEventObjProperty('halt', function(reason) {this.status.ok || this._unHaltable || (this.status.halted = (reason || true));})
         ._setEventObjProperty('preventDefault', function(reason) {this.status.ok || this._unPreventable || (this.status.defaultPrevented = (reason || true));})
         ._setEventObjProperty('preventRender', function(reason) {this.status.ok || this._unRenderPreventable || (this.status.renderPrevented = (reason || true));});

    return Event;
}));
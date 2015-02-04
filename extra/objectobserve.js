"use strict";

/**
 * Adds the `objectobserve` event, to monitor changes in objects.
 *
 *
 * <i>Copyright (c) 2014 ITSA - https://github.com/itsa</i>
 * New BSD License - http://choosealicense.com/licenses/bsd-3-clause/
 *
 * @example
 * Event = require('event/extra/objectobserve.js');
 *
 * Event.observe('myEmitterName', datamodel);
 * Event.after('myEmitterName:datachanged', function(e) {
 *     var datamodel = e.target,
 *         emitter = e.emitter;
 * });
 *
 * or
 *
 * @example
 * Event = require('event');
 * require('event/extra/objectobserve.js');
 *
 * Event.observe('myEmitterName', datamodel);
 * Event.after('myEmitterName:datachanged', function(e) {
 *     var datamodel = e.target,
 *         emitter = e.emitter;
 * });
 *
 * @module event
 * @submodule event-objectobserve
 * @class Event
 * @since 0.0.2
*/

require('js-ext/lib/object.js');
require('./timer-finalize.js');

module.exports = function (window) {

    var NAME = '[event-objectobserve]: ',
        IO = require('io')(window),
        NATIVE_OBJECT_OBSERVE = !!Object.observe,
        Event = require('../event-base.js'),
        asyncSilent = require('utils').asyncSilent,
        definitions = {},
        callbackFn, checkObjects, observeNative, observePolyfill, unobserveNative, unobservePolyfill, finalizer;

   /**
     * The function that gets invoked when object-observed objects get changed.
     *
     * @method callbackFn
     * @param emitterName {String} The emitter-name that was set on the oberver-object
     * @param obj {Object} the object that was changed
     * @protected
     * @since 0.0.1
    */
    callbackFn = function(emitterName, obj) {
        console.info(NAME, 'callbackFn for '+emitterName);
        // emit with _objectobserver: we don;t want to fall into a loop:
        Event.emit(obj, emitterName+':datachanged', {_objectobserver: true});
    };

   /**
     * The function that gets invoked in Event's finalizer in case there is no native Object.observe
     * This function will inspect all registered object for changes and invoke `callbackFn` for objects
     * that have been changed.
     *
     * @method checkObjects
     * @param e {Object} the eventobject
     * @protected
     * @since 0.0.1
    */
    checkObjects = function(e) {
        console.info(NAME, 'checkObjects');
        // check for _objectobserver: we don;t want to fall into a loop:
        if (!e._objectobserver) {
            definitions.each(function(definition) {
                var stringified;
                try {
                    stringified = JSON.stringify(definition.obj);
                }
                catch(err) {
                    // oops, a difficult object
                    console.warn(NAME, 'Trying to observe object '+definition.emitter+', but it cannot be stringified: possibly it is cycle referenced. This object will NOT emit datachange-event!!!');
                    stringified = null;
                }
                (definition.previous!==stringified) && callbackFn(definition.emitter, definition.obj);
                definition.previous = stringified;
            });
        }
    };

   /**
     * Sets up the native Object.observe for the specified object.
     *
     * @method observeNative
     * @param emitterName {String} The emitter-name to be set as the `emitterName` for the `datachanged` events
     * @param obj {Object} the object that was changed
     * @protected
     * @since 0.0.1
    */
    observeNative = function(emitterName, obj) {
        console.info(NAME, 'observeNative for '+emitterName);
        var callback = callbackFn.bind(null, emitterName, obj);
        // first we unobserve any possible previous definitions:
        unobserveNative(emitterName);
        // now set a new observer:
        definitions[emitterName] = {
            obj: obj,
            emitter: emitterName,
            callback: callback
        };
        Object.observe(obj, callback);
    };

   /**
     * Sets up the polyfill for Object.observe for the specified object.
     * Is not really a polyfill, but an alternative way of inspecting: the specified object
     * gets registered and with every Event.finalize it will be inspected for changes.
     *
     * @method observePolyfill
     * @param emitterName {String} The emitter-name to be set as the `emitterName` for the `datachanged` events
     * @param obj {Object} the object that was changed
     * @protected
     * @since 0.0.1
    */
    observePolyfill = function(emitterName, obj) {
        console.info(NAME, 'observePolyfill for '+emitterName);
        var stringified;
        // first we unobserve any possible previous definitions:
        unobservePolyfill(emitterName);
        finalizer || (finalizer=Event.finalize(checkObjects));
        // now set a new observer: be aware that JSON.stringify could throw errors in case of cycle-objects
        try {
            stringified = JSON.stringify(obj);
        }
        catch(err) {
            // oops, a difficult object
            console.warn(NAME, 'Trying to observe object '+emitterName+', but it cannot be stringified: possibly it is cycle referenced. This object will NOT emit datachange-event!!!');
            stringified = null;
        }
        definitions[emitterName] = {
            obj: obj,
            emitter: emitterName,
            previous: stringified
        };
        // because it could happen that someone sets up the observer and in the SAME eventloop changes the model.
        // we must prevent the modelchange from being registered.
        // that's why a manual `checkObjects` must be ran in a next event-cycle:
        asyncSilent(checkObjects.bind(null, {}));
    };

   /**
     * Unobserves (unregisters) a native observed object.
     *
     * @method unobserveNative
     * @param emitterName {String} The emitter-name to be set as the `emitterName` for the `datachanged` events
     * @protected
     * @since 0.0.1
    */
    unobserveNative = function(emitterName) {
        console.info(NAME, 'unobserveNative for '+emitterName);
        var definition = definitions[emitterName];
        if (definition) {
            Object.unobserve(definition.obj, definition.callback);
            delete definitions[emitterName];
        }
    };

   /**
     * Unobserves (unregisters) a polyfilled observed object.
     *
     * @method unobserveNative
     * @param emitterName {String} The emitter-name to be set as the `emitterName` for the `datachanged` events
     * @protected
     * @since 0.0.1
    */
    unobservePolyfill = function(emitterName) {
        console.info(NAME, 'unobservePolyfill for '+emitterName);
        delete definitions[emitterName];
        if (finalizer && definitions.isEmpty()) {
            finalizer.detach();
            finalizer = null;
        }
    };

   /**
     * Sets up a Object.observe for the specified object. Either native (Object.observe) or polyfilled,
     * dependend on the environment.
     *
     * @method observePolyfill
     * @param emitterName {String} The emitter-name to be set as the `emitterName` for the `datachanged` events
     * @param obj {Object} the object that was changed
     * @return {Object} handler with a `detach()`-method which can be used to detach the observer
     * @since 0.0.1
    */
    Event.observe = function(emitterName, obj) {
        console.info(NAME, 'observe '+emitterName);
        NATIVE_OBJECT_OBSERVE ? observeNative(emitterName, obj) : observePolyfill(emitterName, obj);
        return {
            detach: function() {
                Event.unobserve(emitterName);
            }
        };
    };

   /**
     * Unobserves (unregisters) a observed object.
     *
     * @method unobserveNative
     * @param emitterName {String} The emitter-name to be set as the `emitterName` for the `datachanged` events
     * @chainable
     * @since 0.0.1
    */
    Event.unobserve = function(emitterName) {
        console.info(NAME, 'unobserve '+emitterName);
        NATIVE_OBJECT_OBSERVE ? unobserveNative(emitterName) : unobservePolyfill(emitterName);
        return this;
    };

   /**
     * Unobserves (unregisters) a observed object.
     *
     * @method unobserveNative
     * @chainable
     * @since 0.0.1
    */
    Event.unobserveAll = function() {
        console.info(NAME, 'unobserveAll');
        definitions.each(function(definition) {
            Event.unobserve(definition.emitter);
        });
        return this;
    };

    IO.finalize(function() {
        console.info(NAME, 'IO-finalizer will checkObjects');
        checkObjects({});
    });

    module.exports = Event;

};
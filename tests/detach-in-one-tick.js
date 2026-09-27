/*global describe, it, afterEach */
/*jshint unused:false */

"use strict";

require("itsa-jsext");

var expect = require('chai').expect,
    Event = require("../index.js");

// A detached subscriber is removed from its list asynchronously (it may be detached inside its own callback while
// the list is being run through). When several subscribers of one event are detached within the same tick, every
// one of them must still be removed - and no subscriber that is still attached may be removed instead.

describe('Detaching several subscribers of one event within one tick', function () {

    afterEach(function() {
        Event.detachAll();
        Event.undefAllEvents();
    });

    it('removes every detached subscriber', function (done) {
        var handles = [],
            i;
        for (i = 0; i < 5; i++) {
            handles.push(Event.after('red:save', function() {}));
        }
        handles.forEach(function(handle) {
            handle.detach();
        });
        setTimeout(function() {
            var subs = Event._subs['red:save'];
            expect(subs && subs.a ? subs.a.length : 0).to.be.equal(0);
            done();
        }, 10);
    });

    it('keeps the subscribers that were not detached', function (done) {
        var called = [],
            handleA = Event.after('red:save', function() { called.push('A'); }),
            handleB = Event.after('red:save', function() { called.push('B'); });
        Event.after('red:save', function() { called.push('C'); });
        Event.after('red:save', function() { called.push('D'); });
        handleA.detach();
        handleB.detach();
        setTimeout(function() {
            Event.emit('red:save');
            setTimeout(function() {
                expect(called).to.be.eql(['C', 'D']);
                done();
            }, 10);
        }, 10);
    });

});

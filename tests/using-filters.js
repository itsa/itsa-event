/*global describe, it */
"use strict";
var expect = require('chai').expect,
	should = require('chai').should(),
    Event = require("../event.js");

    require('../event-emitter.js');
    require('../event-listener.js');

describe('Subscribers with filters', function () {
    // Code to execute before every test.
    beforeEach(function() {
    });

    // Code to execute after every test.
    afterEach(function() {
        Event.detachAll();
        Event.undefAllEvents();
    });

    it('emitterName:eventName passes filter', function (done) {
        var redObject = {a: 10};
        Event.before(
            'red:save',
            function(e) {
                expect(e.extrafilter).to.eql(50);
                done();
            },
            redObject,
            function(e) {
                e.extrafilter = 50;
                return (e.target.a===10) && (e.extra===20);
            }
        );
        Event.emit(redObject, 'red:save', {extra: 20});
    });

    it('emitterName:eventName blocked by filter', function (done) {
        var redObject = {a: 10};
        Event.before(
            'red:save',
            function() {
                done(new Error('subscriber invoked while it should have been blocked by filter'));
            },
            redObject,
            function(e) {
                return (e.target.a===10) && (e.extra===20);
            }
        );
        Event.emit(redObject, 'red:save', {extra: 15});
        setTimeout(done, 50);
    });

    it('*:eventName passes filter', function (done) {
        var redObject = {a: 10};
        Event.before(
            '*:save',
            function(e) {
                expect(e.extrafilter).to.eql(50);
                done();
            },
            redObject,
            function(e) {
                e.extrafilter = 50;
                return (e.target.a===10) && (e.extra===20);
            }
        );
        Event.emit(redObject, 'red:save', {extra: 20});
    });

    it('*:eventName blocked by filter', function (done) {
        var redObject = {a: 10};
        Event.before(
            '*:save',
            function() {
                done(new Error('subscriber invoked while it should have been blocked by filter'));
            },
            redObject,
            function(e) {
                return (e.target.a===10) && (e.extra===20);
            }
        );
        Event.emit(redObject, 'red:save', {extra: 15});
        setTimeout(done, 50);
    });

    it('emitterName:* passes filter', function (done) {
        var redObject = {a: 10};
        Event.before(
            'red:*',
            function(e) {
                expect(e.extrafilter).to.eql(50);
                done();
            },
            redObject,
            function(e) {
                e.extrafilter = 50;
                return (e.target.a===10) && (e.extra===20);
            }
        );
        Event.emit(redObject, 'red:save', {extra: 20});
    });

    it('emitterName:* blocked by filter', function (done) {
        var redObject = {a: 10};
        Event.before(
            'red:*',
            function() {
                done(new Error('subscriber invoked while it should have been blocked by filter'));
            },
            redObject,
            function(e) {
                return (e.target.a===10) && (e.extra===20);
            }
        );
        Event.emit(redObject, 'red:save', {extra: 15});
        setTimeout(done, 50);
    });

    it('*:* passes filter', function (done) {
        var redObject = {a: 10};
        Event.before(
            '*:*',
            function(e) {
                expect(e.extrafilter).to.eql(50);
                done();
            },
            redObject,
            function(e) {
                e.extrafilter = 50;
                return (e.target.a===10) && (e.extra===20);
            }
        );
        Event.emit(redObject, 'red:save', {extra: 20});
    });

    it('*:* blocked by filter', function (done) {
        var redObject = {a: 10};
        Event.before(
            '*:*',
            function() {
                done(new Error('subscriber invoked while it should have been blocked by filter'));
            },
            redObject,
            function(e) {
                return (e.target.a===10) && (e.extra===20);
            }
        );
        Event.emit(redObject, 'red:save', {extra: 15});
        setTimeout(done, 50);
    });

    it('context inside filter', function (done) {
        var redObject = {};
        Event.before(
            'red:save',
            function(e) {
                done();
            },
            redObject,
            function() {
                (this === redObject).should.be.true;
                return true;
            }
        );
        Event.emit(redObject, 'red:save');
    });
    it('context inside filter when overruled', function (done) {
        var redObject = {},
            b = {},
            filterfn = function() {
                (this === b).should.be.true;
                done();
            };
        Event.before(
            'red:save',
            function(e) {
                done();
            },
            redObject,
            filterfn.bind(b)
        );
        Event.emit(redObject, 'red:save');
    });

});

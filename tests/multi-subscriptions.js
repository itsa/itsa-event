/*global describe, it */
"use strict";
var expect = require('chai').expect,
	should = require('chai').should(),
    Event = require("../event.js");

    require('../event-emitter.js');
    require('../event-listener.js');

describe('Multi subscriptions', function () {
        // Code to execute before every test.
        beforeEach(function() {
        });

        // Code to execute after every test.
        afterEach(function() {
            Event.detachAll();
            Event.undefAllEvents();
        });

        it('invocation', function () {
            var count = 0;
            Event.after(['red:save', 'green:save'], function(e) {
                count++;
            });
            Event.emit('green:save');
            Event.emit('red:save');
            expect(count).to.eql(2);
        });

        it('invocation once-subscription', function () {
            Event.onceAfter(['red:save', 'green:save'], function(e) {
                e.emitter.should.be.eql('red');
            });
            Event.emit('red:save');
            Event.emit('green:save');
        });

        it('detach by handle', function () {
            var count = 0,
                handler = Event.after(['red:save', 'green:save'], function(e) {
                   count++;
                });
            Event.emit('red:save');
            handler.detach();
            Event.emit('green:save');
            Event.emit('red:save');
            expect(count).to.eql(1);
        });

        it('detaching', function () {
            var greenObject = {},
                count = 0,
                handler;
            greenObject.merge(Event.Listener);
            handler = Event.after(['red:save', 'green:save'], function(e) {
               count++;
            }, greenObject);
            Event.emit('red:save');
            greenObject.detach('red:save');
            Event.emit('green:save');
            Event.emit('red:save');
            expect(count).to.eql(2);
        });

        it('detach all', function () {
            var greenObject = {},
                count = 0,
                handler;
            greenObject.merge(Event.Listener);
            handler = Event.after(['red:save', 'green:save'], function(e) {
               count++;
            }, greenObject);
            Event.emit('red:save');
            greenObject.detachAll();
            Event.emit('green:save');
            Event.emit('red:save');
            expect(count).to.eql(1);
        });

        it('context inside subscriber', function () {
            var redObject = {};
            Event.after(['red:save', 'green:save'], function(e) {
                (this===redObject).should.be.true;
            }, redObject);
            Event.emit('green:save');
            Event.emit('red:save');
        });

        it('context inside oncesubscriber', function () {
            var redObject = {};
            Event.onceAfter(['red:save', 'green:save'], function(e) {
                (this===redObject).should.be.true;
            }, redObject);
            Event.emit('green:save');
        });

        it('e.target inside subscriber', function () {
            var redObject = {};
            Event.after(['red:save', 'green:save'], function(e) {
                (e.target===redObject).should.be.true;
            });
            Event.emit(redObject, 'green:save');
            Event.emit(redObject, 'red:save');
        });

        it('e.target inside oncesubscriber', function () {
            var redObject = {};
            Event.onceAfter(['red:save', 'green:save'], function(e) {
                (e.target===redObject).should.be.true;
            });
            Event.emit(redObject, 'green:save');
        });

        it('prevent default', function () {
            var count = 0,
                defFn = function() {count = count + 5;};
            Event.defineEvent('red:save').defaultFn(defFn);
            Event.defineEvent('green:save').defaultFn(defFn);
            Event.before(['red:save', 'green:save'], function(e) {
                count++;
                e.preventDefault();
            });
            Event.after(['red:save', 'green:save'], function(e) {
                count = count + 50;
            });
            Event.emit('green:save');
            Event.emit('red:save');
            expect(count).to.eql(2);
        });

        it('halted', function () {
            var count = 0,
                defFn = function() {count = count + 5;};
            Event.defineEvent('red:save').defaultFn(defFn);
            Event.defineEvent('green:save').defaultFn(defFn);
            Event.before(['red:save', 'green:save'], function(e) {
                count++;
                e.halt();
            });
            Event.after(['red:save', 'green:save'], function(e) {
                count = count + 50;
            });
            Event.emit('green:save');
            Event.emit('red:save');
            expect(count).to.eql(2);
        });

        it('silenced', function () {
            var count = 0,
                defFn = function() {count = count + 5;};
            Event.defineEvent('red:save').defaultFn(defFn);
            Event.defineEvent('green:save').defaultFn(defFn);
            Event.before(['red:save', 'green:save'], function(e) {
                count++;
                e.preventDefault();
            });
            Event.after(['red:save', 'green:save'], function(e) {
                count = count + 50;
            });
            Event.emit('green:save', {silent: true});
            Event.emit('red:save', {silent: true});
            expect(count).to.eql(10);
        });

});
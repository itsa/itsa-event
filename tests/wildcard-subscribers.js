/*global describe, it */
"use strict";
var expect = require('chai').expect,
	should = require('chai').should(),
    Event = require("../event.js");

    require('../event-emitter.js');
    require('../event-listener.js');

describe('Wildcard subscribers', function () {
    // Code to execute before every test.
    beforeEach(function() {
    });

    // Code to execute after every test.
    afterEach(function() {
        Event.detachAll();
        Event.undefAllEvents();
    });

    it('*:eventName', function (done) {
        var count = 0;
        Event.before('blue:save', function() {
            count = count + 8;
        });
        Event.before('red:save', function() {
            count = count + 2;
        });
        Event.before('*:save', function() {
            count = count + 1;
        });
        Event.after('blue:save', function() {
            count = count + 16;
        });
        Event.after('red:save', function() {
            count = count + 4;
        });
        Event.after('*:save', function() {
            expect(count).to.eql(7);
            done();
        });
        Event.emit('red:save');
    });

    it('emitterName:*', function (done) {
        var count = 0;
        Event.before('blue:save', function() {
            count = count + 8;
        });
        Event.before('red:save', function() {
            count = count + 2;
        });
        Event.before('red:*', function() {
            count = count + 1;
        });
        Event.after('blue:save', function() {
            count = count + 16;
        });
        Event.after('red:save', function() {
            count = count + 4;
        });
        Event.after('red:*', function() {
            expect(count).to.eql(7);
            done();
        });
        Event.emit('red:save');
    });

    it('*:*', function (done) {
        var count = 0;
        Event.before('blue:save', function() {
            count = count + 8;
        });
        Event.before('red:save', function() {
            count = count + 2;
        });
        Event.before('*:*', function() {
            count = count + 1;
        });
        Event.after('blue:save', function() {
            count = count + 16;
        });
        Event.after('red:save', function() {
            count = count + 4;
        });
        Event.after('*:*', function() {
            expect(count).to.eql(7);
            done();
        });
        Event.emit('red:save');
    });

    it('detach *:eventName', function () {
        Event.before('red:*', function(e) {});
        Event.before('red:save', function(e) {});
        Event.before('blue:save', function(e) {});
        Event.before('blue:load', function(e) {});
        Event.before('*:save', function(e) {});
        (Event._subs['red:*']===undefined).should.be.false;
        (Event._subs['red:save']===undefined).should.be.false;
        (Event._subs['blue:save']===undefined).should.be.false;
        (Event._subs['blue:load']===undefined).should.be.false;
        (Event._subs['*:save']===undefined).should.be.false;
        Event.detach('*:save');
        (Event._subs['red:*']===undefined).should.be.false;
        (Event._subs['red:save']===undefined).should.be.true;
        (Event._subs['blue:save']===undefined).should.be.true;
        (Event._subs['blue:load']===undefined).should.be.false;
        (Event._subs['*:save']===undefined).should.be.true;
    });

    it('detach emitterName:*', function () {
        Event.before('red:*', function(e) {});
        Event.before('red:save', function(e) {});
        Event.before('blue:save', function(e) {});
        Event.before('blue:load', function(e) {});
        Event.before('*:save', function(e) {});
        (Event._subs['red:*']===undefined).should.be.false;
        (Event._subs['red:save']===undefined).should.be.false;
        (Event._subs['blue:save']===undefined).should.be.false;
        (Event._subs['blue:load']===undefined).should.be.false;
        (Event._subs['*:save']===undefined).should.be.false;
        Event.detach('red:*');
        (Event._subs['red:*']===undefined).should.be.true;
        (Event._subs['red:save']===undefined).should.be.true;
        (Event._subs['blue:save']===undefined).should.be.false;
        (Event._subs['blue:load']===undefined).should.be.false;
        (Event._subs['*:save']===undefined).should.be.false;
    });

    it('detach *:*', function () {
        Event.before('red:*', function(e) {});
        Event.before('red:save', function(e) {});
        Event.before('blue:save', function(e) {});
        Event.before('blue:load', function(e) {});
        Event.before('*:save', function(e) {});
        (Event._subs['red:*']===undefined).should.be.false;
        (Event._subs['red:save']===undefined).should.be.false;
        (Event._subs['blue:save']===undefined).should.be.false;
        (Event._subs['blue:load']===undefined).should.be.false;
        (Event._subs['*:save']===undefined).should.be.false;
        Event.detach('*:*');
        (Event._subs['red:*']===undefined).should.be.true;
        (Event._subs['red:save']===undefined).should.be.true;
        (Event._subs['blue:save']===undefined).should.be.true;
        (Event._subs['blue:load']===undefined).should.be.true;
        (Event._subs['*:save']===undefined).should.be.true;
    });

    it('detach *:eventName on instance', function () {
        var redObject = {},
            greenObject;
        Event.before('red:*', function(e) {}, redObject);
        Event.before('red:save', function(e) {}, redObject);
        Event.before('blue:save', function(e) {}, redObject);
        Event.before('blue:load', function(e) {}, redObject);
        Event.before('*:save', function(e) {}, redObject);
        Event.before('red:*', function(e) {}, greenObject);
        Event.before('red:save', function(e) {}, greenObject);
        Event.before('blue:save', function(e) {}, greenObject);
        Event.before('blue:load', function(e) {}, greenObject);
        Event.before('*:save', function(e) {}, greenObject);
        expect(Event._subs['red:*'].b.length).to.eql(2);
        expect(Event._subs['red:save'].b.length).to.eql(2);
        expect(Event._subs['blue:save'].b.length).to.eql(2);
        expect(Event._subs['blue:load'].b.length).to.eql(2);
        expect(Event._subs['*:save'].b.length).to.eql(2);
        Event.detach('*:save');
        expect(Event._subs['red:*'].b.length).to.eql(2);
        expect(Event._subs['red:save'].b.length).to.eql(1);
        expect(Event._subs['blue:save'].b.length).to.eql(1);
        expect(Event._subs['blue:load'].b.length).to.eql(2);
        expect(Event._subs['*:save'].b.length).to.eql(1);
    });

    it('detach emitterName:* on instance', function () {
        var redObject = {},
            greenObject;
        Event.before('red:*', function(e) {}, redObject);
        Event.before('red:save', function(e) {}, redObject);
        Event.before('blue:save', function(e) {}, redObject);
        Event.before('blue:load', function(e) {}, redObject);
        Event.before('*:save', function(e) {}, redObject);
        Event.before('red:*', function(e) {}, greenObject);
        Event.before('red:save', function(e) {}, greenObject);
        Event.before('blue:save', function(e) {}, greenObject);
        Event.before('blue:load', function(e) {}, greenObject);
        Event.before('*:save', function(e) {}, greenObject);
        expect(Event._subs['red:*'].b.length).to.eql(2);
        expect(Event._subs['red:save'].b.length).to.eql(2);
        expect(Event._subs['blue:save'].b.length).to.eql(2);
        expect(Event._subs['blue:load'].b.length).to.eql(2);
        expect(Event._subs['*:save'].b.length).to.eql(2);
        Event.detach('red:*');
        expect(Event._subs['red:*'].b.length).to.eql(1);
        expect(Event._subs['red:save'].b.length).to.eql(1);
        expect(Event._subs['blue:save'].b.length).to.eql(2);
        expect(Event._subs['blue:load'].b.length).to.eql(2);
        expect(Event._subs['*:save'].b.length).to.eql(2);
    });

    it('detach *:* on instance', function () {
        var redObject = {},
            greenObject;
        Event.before('red:*', function(e) {}, redObject);
        Event.before('red:save', function(e) {}, redObject);
        Event.before('blue:save', function(e) {}, redObject);
        Event.before('blue:load', function(e) {}, redObject);
        Event.before('*:save', function(e) {}, redObject);
        Event.before('red:*', function(e) {}, greenObject);
        Event.before('red:save', function(e) {}, greenObject);
        Event.before('blue:save', function(e) {}, greenObject);
        Event.before('blue:load', function(e) {}, greenObject);
        Event.before('*:save', function(e) {}, greenObject);
        expect(Event._subs['red:*'].b.length).to.eql(2);
        expect(Event._subs['red:save'].b.length).to.eql(2);
        expect(Event._subs['blue:save'].b.length).to.eql(2);
        expect(Event._subs['blue:load'].b.length).to.eql(2);
        expect(Event._subs['*:save'].b.length).to.eql(2);
        Event.detach('*:*');
        expect(Event._subs['red:*'].b.length).to.eql(1);
        expect(Event._subs['red:save'].b.length).to.eql(1);
        expect(Event._subs['blue:save'].b.length).to.eql(1);
        expect(Event._subs['blue:load'].b.length).to.eql(1);
        expect(Event._subs['*:save'].b.length).to.eql(1);
    });

    it('preventDefault *:eventName', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            };
        Event.before('*:save', function(e) {
            (e.emitter==='red') && e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save');
        setTimeout(function() {
            expect(count).to.eql(0);
            done();
        }, 50);
    });

    it('preventDefault emitterName:*', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            };
        Event.before('red:*', function(e) {
            (e.type==='save') && e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save');
        setTimeout(function() {
            expect(count).to.eql(0);
            done();
        }, 50);
    });

    it('preventDefault *:*', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            };
        Event.before('*:*', function(e) {
            (e.emitter==='red') && (e.type==='save') && e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save');
        setTimeout(function() {
            expect(count).to.eql(0);
            done();
        }, 50);
    });

    it('halt *:eventName', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            };
        Event.before('*:save', function(e) {
            (e.emitter==='red') && e.halt();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save');
        setTimeout(function() {
            expect(count).to.eql(0);
            done();
        }, 50);
    });

    it('halt emitterName:*', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            };
        Event.before('red:*', function(e) {
            (e.type==='save') && e.halt();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save');
        setTimeout(function() {
            expect(count).to.eql(0);
            done();
        }, 50);
    });

    it('halt *:*', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            };
        Event.before('*:*', function(e) {
            (e.emitter==='red') && (e.type==='save') && e.halt();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save');
        setTimeout(function() {
            expect(count).to.eql(0);
            done();
        }, 50);
    });

    it('emit with *:eventName', function () {
        var defFn = function(e) {
                return e.a;
            };
        Event.before('*:save', function(e) {
            e.a = 10;
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        expect(Event.emit('red:save').a).to.eql(10);
    });

    it('emit with emitterName:*', function () {
        var defFn = function(e) {
                return e.a;
            };
        Event.before('red:*', function(e) {
            e.a = 10;
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        expect(Event.emit('red:save').a).to.eql(10);
    });

    it('emit with *:*', function () {
        var defFn = function(e) {
                return e.a;
            };
        Event.before('*:*', function(e) {
            e.a = 10;
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        expect(Event.emit('red:save').a).to.eql(10);
    });

    it('emit with *:eventName when prefentDefaulted', function () {
        var defFn = function(e) {
                return 10;
            };
        Event.before('*:save', function(e) {
            e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save').status.defaultPrevented.should.be.true;
    });

    it('emit with emitterName:* when prefentDefaulted', function () {
        var defFn = function(e) {
                return 10;
            };
        Event.before('red:*', function(e) {
            e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save').status.defaultPrevented.should.be.true;
    });

    it('emit-Promise with *:* when prefentDefaulted', function () {
        var defFn = function(e) {
                return 10;
            };
        Event.before('*:*', function(e) {
            e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save').status.defaultPrevented.should.be.true;
    });

    it('e.silent *:eventName', function (done) {
        var defFn = function(e) {
                done();
            };
        Event.before('*:save', function(e) {
            (e.emitter==='red') && e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save', {silent:true});
    });

    it('e.silent emitterName:*', function (done) {
        var defFn = function(e) {
                done();
            };
        Event.before('red:*', function(e) {
            (e.type==='save') && e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save', {silent:true});
    });

    it('e.silent *:*', function (done) {
        var defFn = function(e) {
                done();
            };
        Event.before('*:*', function(e) {
            (e.emitter==='red') && (e.type==='save') && e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save', {silent:true});
    });

});
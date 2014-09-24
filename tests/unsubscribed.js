/*global describe, it */
"use strict";
var expect = require('chai').expect,
    should = require('chai').should(),
    Event = require("../event.js");

    require('../event-emitter.js');
    require('../event-listener.js');

describe('Unsubscribed events', function () {
    // Code to execute before every test.
    beforeEach(function() {
    });

    // Code to execute after every test.
    afterEach(function() {
        Event.detachAll();
        Event.undefAllEvents();
    });

    //========================================================================================================
    describe('Object emitting static at ITSA.Event', function (done) {

        it('invoking before-subscriber', function (done) {
            var redObject = {};
            Event.before('red:save', function() {
                done();
            }, redObject);
            Event.emit('red:save');
        });
        it('invoking after-subscriber', function (done) {
            var redObject = {};
            Event.after('red:save', function() {
                done();
            }, redObject);
            Event.emit('red:save');
        });
        it('check order before- vs after-subscriber', function (done) {
            var redObject = {},
                count = 0;
            Event.after('red:save', function() {
                count++;
                expect(count).to.eql(2);
                done();
            }, redObject);
            Event.before('red:save', function() {
                count++;
                expect(count).to.eql(1);
            }, redObject);
            Event.emit('red:save');
        });

        it('check order multiple before- vs multiple after-subscriber with prepend subscriber', function (done) {
            var redObject = {},
                count = 0;
            Event.after('red:save', function() {
                count++;
                expect(count).to.eql(5);
            }, redObject);
            Event.after('red:save', function() {
                count++;
                expect(count).to.eql(4);
            }, redObject, true);
            Event.after('red:save', function() {
                count++;
                expect(count).to.eql(6);
                done();
            }, redObject);
            Event.before('red:save', function() {
                count++;
                expect(count).to.eql(2);
            }, redObject);
            Event.before('red:save', function() {
                count++;
                expect(count).to.eql(1);
            }, redObject, true);
            Event.before('red:save', function() {
                count++;
                expect(count).to.eql(3);
            });
            Event.emit('red:save');
        });

        it('check preventDefault', function (done) {
            var redObject = {};
            setTimeout(done, 200);
            Event.after('red:save', function() {
                throw Error('After-event occured while the event was preventDefaulted');
            }, redObject);
            Event.before('red:save', function(e) {
                e.preventDefault();
            }, redObject);
            Event.emit('red:save');
        });

        it('check preventRender', function (done) {
            var redObject = {};
            setTimeout(done, 200);
            Event.after('red:save', function(e) {
                e.status.renderPrevented.should.be.true;
            }, redObject);
            Event.before('red:save', function(e) {
                e.preventRender();
            }, redObject);
            Event.emit('red:save');
        });

        it('check e.halt()', function (done) {
            var redObject = {};
            setTimeout(done, 200);
            Event.after('red:save', function() {
                throw Error('After-event occured while the event was halted');
            }, redObject);
            Event.before('red:save', function(e) {
                e.halt();
            }, redObject);
            Event.emit('red:save');
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var redObject = {};
            Event.before('red:save', function(e) {
                expect(e.a).to.eql(10);
                done();
            }, redObject);
            Event.emit('red:save', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var redObject = {};
            Event.after('red:save', function(e) {
                expect(e.a).to.eql(10);
                done();
            }, redObject);
            Event.emit('red:save', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var redObject = {},
                count = 0;
            Event.onceAfter('red:save', function(e) {
                expect(e.a).to.eql(15);
                done();
            }, redObject);
            Event.onceBefore('red:save', function(e) {
                expect(e.a).to.eql(10);
                e.a = 15;
            }, redObject);
            Event.emit('red:save', {a: 10});
        });
        it('check halt() inside before-subscriber', function (done) {
            var redObject = {};
            Event.onceBefore('red:save', function(e) {
                e.halt();
            }, redObject);
            Event.onceBefore('red:save', function(e) {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            }, redObject);
            Event.onceAfter('red:save', function(e) {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            }, redObject);
            Event.emit('red:save');
            setTimeout(done, 100);
        });
        it('check preventDefault() inside before-subscriber', function (done) {
            var redObject = {},
                count = 0;
            Event.before('red:save', function(e) {
                count++;
                e.preventDefault();
            }, redObject);
            Event.before('red:save', function(e) {
                count++;
            }, redObject);
            Event.after('red:save', function(e) {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            }, redObject);
            Event.emit('red:save');
            setTimeout(function() {
                expect(count).to.eql(2);
                done();
            }, 100);
        });
        it('check returnValue', function (done) {
            var redObject = {};
            Event.after('red:save', function(e) {
                (e.returnValue === undefined).should.be.true;
                done();
            }, redObject);
            Event.emit('red:save');
        });

        it("check returnvalue emit", function () {
            expect(Event.emit('red:save')).be.an('object');
        });
        it("check returnvalue emit when halted", function () {
            var redObject = {};
            Event.before('red:save', function(e) {
                e.halt();
            }, redObject);
            Event.emit('red:save').status.halted.should.be.true;
        });
        it("check returnvalue emit when defaultPrevented", function () {
            var redObject = {};
            Event.before('red:save', function(e) {
                e.preventDefault();
            }, redObject);
            Event.emit('red:save').status.defaultPrevented.should.be.true;
        });
        it('context inside once-subscriber', function (done) {
            var redObject = {};
            Event.onceBefore('red:save', function() {
                (this === redObject).should.be.true;
                done();
            }, redObject);
            Event.emit('red:save');
        });
        it('context inside subscriber', function (done) {
            var redObject = {};
            var handle = Event.before('red:save', function() {
                (this === redObject).should.be.true;
                handle.detach();
                done();
            }, redObject);
            Event.emit('red:save');
        });
        it('context inside subscriber when overruled', function (done) {
            var redObject = {},
                b = {},
                fn = function() {
                    (this === b).should.be.true;
                    done();
                };
            Event.before('red:save', fn.bind(b), redObject);
            Event.emit('red:save');
        });
        it('e.target inside subscriber', function (done) {
            var redObject = {};
            Event.before('red:save', function(e) {
                (e.target === redObject).should.be.true;
                done();
            }, redObject);
            Event.emit(redObject, 'red:save');
        });

    });

    //========================================================================================================
    describe('Emitter at object-instance, listener static at ITSA.Event', function () {

        it('emitting with only eventName', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.before('green:save', function() {
                done();
            });
            greenObject.emit('save');
        });
        it('emitting with full customevent syntax', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.onceBefore('green:save', function() {
                done();
            });
            greenObject.emit('green:save');
        });
        it('emitting with full (different) customevent syntax', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.onceBefore('greenX:save', function() {
                done();
            });
            Event.onceBefore('green:save', function() {
                done(new Error('wrong emitterName'));
            });
            greenObject.emit('greenX:save');
        });
        it('emitting with full (different) customevent syntax, then again with only eventName', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.onceBefore('green:save', function() {
                done();
            });
            greenObject.emit('greenX:save');
            greenObject.emit('save'); // should be listened at
        });

        it('invoking before-subscriber', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.before('green:save', function() {
                done();
            }, greenObject);
            Event.emit(greenObject, 'save');
        });
        it('invoking after-subscriber', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.after('green:save', function() {
                done();
            });
            Event.emit(greenObject, 'save');
        });
        it('check order before- vs after-subscriber', function (done) {
            var greenObject = {},
                count = 0;
            greenObject.merge(Event.Emitter('green'));
            Event.after('green:save', function() {
                count++;
                expect(count).to.eql(2);
                done();
            });
            Event.before('green:save', function() {
                count++;
                expect(count).to.eql(1);
            });
            Event.emit(greenObject, 'save');
        });
        it('check order multiple before- vs multiple after-subscriber with prepend subscriber', function (done) {
            var greenObject = {},
                count = 0;
            greenObject.merge(Event.Emitter('green'));
            Event.after('green:save', function() {
                count++;
                expect(count).to.eql(5);
            });
            Event.after('green:save', function() {
                count++;
                expect(count).to.eql(4);
            }, true);
            Event.after('green:save', function() {
                count++;
                expect(count).to.eql(6);
                done();
            });
            Event.before('green:save', function() {
                count++;
                expect(count).to.eql(2);
            });
            Event.before('green:save', function() {
                count++;
                expect(count).to.eql(1);
            }, true);
            Event.before('green:save', function() {
                count++;
                expect(count).to.eql(3);
            });
            Event.emit(greenObject, 'save');
        });
        it('check preventDefault', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            setTimeout(done, 200);
            Event.after('green:save', function() {
                throw Error('After-event occugreen while the event was preventDefaulted');
            });
            Event.before('green:save', function(e) {
                e.preventDefault();
            });
            Event.emit(greenObject, 'save');
        });
        it('check preventRender', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            setTimeout(done, 200);
            Event.after('green:save', function(e) {
                e.status.renderPrevented.should.be.true;
            });
            Event.before('green:save', function(e) {
                e.preventRender();
            });
            Event.emit(greenObject, 'save');
        });
        it('check e.halt()', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            setTimeout(done, 200);
            Event.after('green:save', function() {
                throw Error('After-event occugreen while the event was halted');
            });
            Event.before('green:save', function(e) {
                e.halt();
            });
            Event.emit(greenObject, 'save');
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.before('green:save', function(e) {
                expect(e.a).to.eql(10);
                done();
            });
            Event.emit(greenObject, 'save', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.after('green:save', function(e) {
                expect(e.a).to.eql(10);
                done();
            });
            Event.emit(greenObject, 'save', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var greenObject = {},
                count = 0;
            greenObject.merge(Event.Emitter('green'));
            Event.after('green:save', function(e) {
                expect(e.a).to.eql(15);
                done();
            });
            Event.before('green:save', function(e) {
                expect(e.a).to.eql(10);
                e.a = 15;
            });
            Event.emit(greenObject, 'save', {a: 10});
        });
        it('check halt() inside before-subscriber', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.before('green:save', function(e) {
                e.halt();
            });
            Event.before('green:save', function(e) {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.after('green:save', function(e) {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.emit(greenObject, 'save');
            setTimeout(done, 100);
        });
        it('check preventDefault() inside before-subscriber', function (done) {
            var greenObject = {},
                count = 0;
            greenObject.merge(Event.Emitter('green'));
            Event.before('green:save', function(e) {
                count++;
                e.preventDefault();
            });
            Event.before('green:save', function(e) {
                count++;
            });
            Event.after('green:save', function(e) {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.emit(greenObject, 'save');
            setTimeout(function() {
                expect(count).to.eql(2);
                done();
            }, 100);
        });
        it('check returnValue', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.after('green:save', function(e) {
                (e.returnValue === undefined).should.be.true;
                done();
            });
            Event.emit(greenObject, 'save');
        });

        it("check returnvalue emit", function () {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            expect(Event.emit(greenObject, 'save')).be.an('object');
        });

        it("check returnvalue emit when halted", function () {
            var greenObject = {};
            Event.before('green:save', function(e) {
                e.halt();
            });
            greenObject.merge(Event.Emitter('green'));
            Event.emit(greenObject, 'save').status.halted.should.be.true;
        });
        it("check returnvalue emit when defaultPrevented", function () {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.before('green:save', function(e) {
                e.preventDefault();
            });
            Event.emit(greenObject, 'save').status.defaultPrevented.should.be.true;
        });

        it('context inside oncesubscriber', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.before('green:save', function() {
                (this === greenObject).should.be.true;
                done();
            }, greenObject);
            Event.emit(greenObject, 'save');
        });
        it('context inside subscriber', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            var handle = Event.before('green:save', function() {
                (this === greenObject).should.be.true;
                done();
            }, greenObject);
            Event.emit(greenObject, 'save');
        });
        it('context inside subscriber when overruled', function (done) {
            var greenObject = {},
                b = {},
                fn = function() {
                    (this === b).should.be.true;
                    done();
                };
            greenObject.merge(Event.Emitter('green'));
            Event.before('green:save', fn.bind(b), greenObject);
            Event.emit(greenObject, 'save');
        });
        it('e.target inside subscriber', function (done) {
            var greenObject = {};
            greenObject.merge(Event.Emitter('green'));
            Event.before('green:save', function(e) {
                (e.target === greenObject).should.be.true;
                done();
            });
            Event.emit(greenObject, 'save');
        });

    });

    //========================================================================================================
    describe('Objectemitter at ITSA.Event, listener static at object-instance', function () {
        it('invoking before-subscriber', function (done) {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            blueObject.before('blue:save', function() {
                done();
            });
            Event.emit('blue:save');
        });
        it('invoking after-subscriber', function (done) {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            blueObject.after('blue:save', function() {
                done();
            });
            Event.emit('blue:save');
        });
        it('check order before- vs after-subscriber', function (done) {
            var blueObject = {},
                count = 0;
            blueObject.merge(Event.Listener);
            blueObject.after('blue:save', function() {
                count++;
                expect(count).to.eql(2);
                done();
            });
            blueObject.before('blue:save', function() {
                count++;
                expect(count).to.eql(1);
            });
            Event.emit('blue:save');
        });
        it('check order multiple before- vs multiple after-subscriber with prepend subscriber', function (done) {
            var blueObject = {},
                count = 0;
            blueObject.merge(Event.Listener);
            blueObject.after('blue:save', function() {
                count++;
                expect(count).to.eql(5);
            });
            blueObject.after('blue:save', function() {
                count++;
                expect(count).to.eql(4);
            }, true);
            blueObject.after('blue:save', function() {
                count++;
                expect(count).to.eql(6);
                done();
            });
            blueObject.before('blue:save', function() {
                count++;
                expect(count).to.eql(2);
            });
            blueObject.before('blue:save', function() {
                count++;
                expect(count).to.eql(1);
            }, true);
            blueObject.before('blue:save', function() {
                count++;
                expect(count).to.eql(3);
            });
            Event.emit('blue:save');
        });
        it('check preventDefault', function (done) {
            var blueObject = {};
            setTimeout(done, 200);
            blueObject.merge(Event.Listener);
            blueObject.onceAfter('blue5:save', function() {
                throw Error('After-event occublue while the event was preventDefaulted');
            });
            blueObject.onceBefore('blue5:save', function(e) {
                e.preventDefault();
            });
            Event.emit('blue5:save');
        });
        it('check preventRender', function (done) {
            var blueObject = {};
            setTimeout(done, 200);
            blueObject.merge(Event.Listener);
            blueObject.onceAfter('blue5b:save', function(e) {
                e.status.renderPrevented.should.be.true;
            });
            blueObject.onceBefore('blue5b:save', function(e) {
                e.preventRender();
            });
            Event.emit('blue5b:save');
        });
        it('check e.halt()', function (done) {
            var blueObject = {};
            setTimeout(done, 200);
            blueObject.merge(Event.Listener);
            blueObject.onceAfter('blue6:save', function() {
                throw Error('After-event occublue while the event was halted');
            });
            blueObject.onceBefore('blue6:save', function(e) {
                e.halt();
            });
            Event.emit('blue6:save');
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            blueObject.onceBefore('blue7:save', function(e) {
                expect(e.a).to.eql(10);
                done();
            });
            Event.emit('blue7:save', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            blueObject.onceAfter('blue8:save', function(e) {
                expect(e.a).to.eql(10);
                done();
            });
            Event.emit('blue8:save', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var blueObject = {},
                count = 0;
            blueObject.merge(Event.Listener);
            blueObject.onceAfter('blue9:save', function(e) {
                expect(e.a).to.eql(15);
                done();
            });
            blueObject.onceBefore('blue9:save', function(e) {
                expect(e.a).to.eql(10);
                e.a = 15;
            });
            Event.emit('blue9:save', {a: 10});
        });
        it('check halt() inside before-subscriber', function (done) {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            blueObject.onceBefore('blue10:save', function(e) {
                e.halt();
            });
            blueObject.onceBefore('blue10:save', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            blueObject.onceAfter('blue10:save', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.emit('blue10:save');
            setTimeout(done, 100);
        });
        it('check preventDefault() inside before-subscriber', function (done) {
            var blueObject = {},
                count = 0;
            blueObject.merge(Event.Listener);
            blueObject.onceBefore('blue11:save', function(e) {
                count++;
                e.preventDefault();
            });
            blueObject.onceBefore('blue11:save', function() {
                count++;
            });
            blueObject.onceAfter('blue11:save', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.emit('blue11:save');
            setTimeout(function() {
                expect(count).to.eql(2);
                done();
            }, 100);
        });
        it('check returnValue', function (done) {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            blueObject.onceAfter('blue12:save', function(e) {
                (e.returnValue === undefined).should.be.true;
                done();
            });
            Event.emit('blue12:save');
        });
        it("check returnvalue emit", function () {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            expect(Event.emit('blue13:save')).be.an('object');
        });
        it("check returnvalue emit when halted", function () {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            blueObject.onceBefore('blue13b:save', function(e) {
                e.halt();
            });
            Event.emit('blue13b:save').status.halted.should.be.true;
        });
        it("check returnvalue emit when defaultPrevented", function () {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            blueObject.onceBefore('blue13c:save', function(e) {
                e.preventDefault();
            });
            Event.emit('blue13c:save').status.defaultPrevented.should.be.true;
        });
        it('context inside once subscriber', function (done) {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            blueObject.onceBefore('blue15:save', function() {
                (this === blueObject).should.be.true;
                done();
            });
            Event.emit('blue15:save');
        });
        it('context inside subscriber', function (done) {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            var handle = blueObject.onceBefore('blue15a:save', function() {
                (this === blueObject).should.be.true;
                handle.detach();
                done();
            });
            Event.emit('blue15a:save');
        });
        it('context inside subscriber when overruled', function (done) {
            var blueObject = {},
                b = {},
                    fn =function() {
                    (this === b).should.be.true;
                    done();
                };
            blueObject.merge(Event.Listener);
            blueObject.before('blue15b:save', fn.bind(b));
            Event.emit('blue15b:save');
        });
        it('e.target inside subscriber', function (done) {
            var blueObject = {};
            blueObject.merge(Event.Listener);
            blueObject.onceBefore('blue:save', function(e) {
                (e.target === blueObject).should.be.true;
                done();
            });
            Event.emit(blueObject, 'blue:save');
        });

    });

    //========================================================================================================
    describe('Emitting static at ITSA.Event, listener static at object-instance', function () {
        it('invoking before-subscriber', function (done) {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            purpleObject.onceBefore('purple1:save', function() {
                done();
            });
            Event.emit('purple1:save');
        });
        it('invoking after-subscriber', function (done) {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            purpleObject.onceAfter('purple2:save', function() {
                done();
            });
            Event.emit('purple2:save');
        });
        it('check order before- vs after-subscriber', function (done) {
            var purpleObject = {},
                count = 0;
            purpleObject.merge(Event.Listener);
            purpleObject.onceAfter('purple3:save', function() {
                count++;
                expect(count).to.eql(2);
                done();
            });
            purpleObject.onceBefore('purple3:save', function() {
                count++;
                expect(count).to.eql(1);
            });
            Event.emit('purple3:save');
        });
        it('check order multiple before- vs multiple after-subscriber with prepend subscriber', function (done) {
            var purpleObject = {},
                count = 0;
            purpleObject.merge(Event.Listener);
            purpleObject.onceAfter('purple4:save', function() {
                count++;
                expect(count).to.eql(5);
            });
            purpleObject.onceAfter('purple4:save', function() {
                count++;
                expect(count).to.eql(4);
            }, true);
            purpleObject.onceAfter('purple4:save', function() {
                count++;
                expect(count).to.eql(6);
                done();
            });
            purpleObject.onceBefore('purple4:save', function() {
                count++;
                expect(count).to.eql(2);
            });
            purpleObject.onceBefore('purple4:save', function() {
                count++;
                expect(count).to.eql(1);
            }, true);
            purpleObject.onceBefore('purple4:save', function() {
                count++;
                expect(count).to.eql(3);
            });
            Event.emit('purple4:save');
        });
        it('check preventDefault', function (done) {
            var purpleObject = {};
            setTimeout(done, 200);
            purpleObject.merge(Event.Listener);
            purpleObject.onceAfter('purple5:save', function() {
                throw Error('After-event occupurple while the event was preventDefaulted');
            });
            purpleObject.onceBefore('purple5:save', function(e) {
                e.preventDefault();
            });
            Event.emit('purple5:save');
        });
        it('check preventRender', function (done) {
            var purpleObject = {};
            setTimeout(done, 200);
            purpleObject.merge(Event.Listener);
            purpleObject.onceAfter('purple5b:save', function(e) {
                e.status.renderPrevented.should.be.true;
            });
            purpleObject.onceBefore('purple5b:save', function(e) {
                e.preventRender();
            });
            Event.emit('purple5b:save');
        });
        it('check e.halt()', function (done) {
            var purpleObject = {};
            setTimeout(done, 200);
            purpleObject.merge(Event.Listener);
            purpleObject.onceAfter('purple6:save', function() {
                throw Error('After-event occupurple while the event was halted');
            });
            purpleObject.onceBefore('purple6:save', function(e) {
                e.halt();
            });
            Event.emit('purple6:save');
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            purpleObject.onceBefore('purple7:save', function(e) {
                expect(e.a).to.eql(10);
                done();
            });
            Event.emit('purple7:save', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            purpleObject.onceAfter('purple8:save', function(e) {
                expect(e.a).to.eql(10);
                done();
            });
            Event.emit('purple8:save', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var purpleObject = {},
                count = 0;
            purpleObject.merge(Event.Listener);
            purpleObject.onceAfter('purple9:save', function(e) {
                expect(e.a).to.eql(15);
                done();
            });
            purpleObject.onceBefore('purple9:save', function(e) {
                expect(e.a).to.eql(10);
                e.a = 15;
            });
            Event.emit('purple9:save', {a: 10});
        });
        it('check halt() inside before-subscriber', function (done) {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            purpleObject.onceBefore('purple10:save', function(e) {
                e.halt();
            });
            purpleObject.onceBefore('purple10:save', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            purpleObject.onceBefore('purple10:save', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.emit('purple10:save');
            setTimeout(done, 100);
        });
        it('check preventDefault() inside before-subscriber', function (done) {
            var purpleObject = {},
                count = 0;
            purpleObject.merge(Event.Listener);
            purpleObject.onceBefore('purple11:save', function(e) {
                count++;
                e.preventDefault();
            });
            purpleObject.onceBefore('purple11:save', function() {
                count++
            });
            purpleObject.onceAfter('purple11:save', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.emit('purple11:save');
            setTimeout(function() {
                expect(count).to.eql(2);
                done();
            }, 100);
        });
        it('check returnValue', function (done) {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            purpleObject.onceAfter('purple12:save', function(e) {
                (e.returnValue === undefined).should.be.true;
                done();
            });
            Event.emit('purple12:save');
        });
        it("check returnvalue emit", function () {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            expect(Event.emit('purple13:save')).be.an('object');
        });
        it("check returnvalue emit when halted", function () {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            purpleObject.onceBefore('purple13b:save', function(e) {
                e.halt();
            });
            Event.emit('purple13b:save').status.halted.should.be.true;
        });
        it("check returnvalue emit when defaultPrevented", function () {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            purpleObject.onceBefore('purple13c:save', function(e) {
                e.preventDefault();
            });
            Event.emit('purple13c:save').status.defaultPrevented.should.be.true;
        });
        it('context inside once subscriber', function (done) {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            purpleObject.onceBefore('purple15:save', function() {
                (this === purpleObject).should.be.true;
                done();
            });
            Event.emit('purple15:save');
        });
        it('context inside subscriber', function (done) {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            var handle = purpleObject.onceBefore('purple15a:save', function() {
                (this === purpleObject).should.be.true;
                handle.detach();
                done();
            });
            Event.emit('purple15a:save');
        });
        it('context inside subscriber when overruled', function (done) {
            var purpleObject = {},
                b = {},
                fn = function() {
                    (this === b).should.be.true;
                    done();
                };
            purpleObject.merge(Event.Listener);
            purpleObject.before('purple15b:save', fn.bind(b));
            Event.emit('purple15b:save');
        });
        it('e.target inside subscriber', function (done) {
            var purpleObject = {};
            purpleObject.merge(Event.Listener);
            purpleObject.onceBefore('purple16:save', function(e) {
                (e.target === Event).should.be.true;
                done();
            });
            Event.emit('purple16:save');
        });

    });

    //========================================================================================================
    describe('Emitting and listening static at ITSA.Event', function () {
        it('invoking before-subscriber', function (done) {
            Event.onceBefore('orange1:save', function() {
                done();
            });
            Event.emit('orange1:save');
        });
        it('invoking after-subscriber', function (done) {
            Event.onceAfter('orange2:save', function() {
                done();
            });
            Event.emit('orange2:save');
        });
        it('check order before- vs after-subscriber', function (done) {
            var count = 0;
            Event.onceAfter('orange3:save', function() {
                count++;
                expect(count).to.eql(2);
                done();
            });
            Event.onceBefore('orange3:save', function() {
                count++;
                expect(count).to.eql(1);
            });
            Event.emit('orange3:save');
        });
        it('check order multiple before- vs multiple after-subscriber with prepend subscriber', function (done) {
            var count = 0;
            Event.onceAfter('orange4:save', function() {
                count++;
                expect(count).to.eql(5);
            });
            Event.onceAfter('orange4:save', function() {
                count++;
                expect(count).to.eql(4);
            }, true);
            Event.onceAfter('orange4:save', function() {
                count++;
                expect(count).to.eql(6);
                done();
            });
            Event.onceBefore('orange4:save', function() {
                count++;
                expect(count).to.eql(2);
            });
            Event.onceBefore('orange4:save', function() {
                count++;
                expect(count).to.eql(1);
            }, true);
            Event.onceBefore('orange4:save', function() {
                count++;
                expect(count).to.eql(3);
            });
            Event.emit('orange4:save');
        });
        it('check preventDefault', function (done) {
            setTimeout(done, 200);
            Event.onceAfter('orange5:save', function() {
                throw Error('After-event occured while the event was preventDefaulted');
            });
            Event.onceBefore('orange5:save', function(e) {
                e.preventDefault();
            });
            Event.emit('orange5:save');
        });
        it('check preventRender', function (done) {
            setTimeout(done, 200);
            Event.onceAfter('orange5b:save', function(e) {
                e.status.renderPrevented.should.be.true;
            });
            Event.onceBefore('orange5b:save', function(e) {
                e.preventRender();
            });
            Event.emit('orange5b:save');
        });
        it('check e.halt()', function (done) {
            setTimeout(done, 200);
            Event.onceAfter('orange6:save', function() {
                throw Error('After-event occured while the event was halted');
            });
            Event.onceBefore('orange6:save', function(e) {
                e.halt();
            });
            Event.emit('orange6:save');
        });
        it('check passing through payload inside before-subscriber', function (done) {
            Event.onceBefore('orange7:save', function(e) {
                expect(e.a).to.eql(10);
                done();
            });
            Event.emit('orange7:save', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            Event.onceAfter('orange8:save', function(e) {
                expect(e.a).to.eql(10);
                done();
            });
            Event.emit('orange8:save', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var count = 0;
            Event.onceAfter('orange9:save', function(e) {
                expect(e.a).to.eql(15);
                done();
            });
            Event.onceBefore('orange9:save', function(e) {
                expect(e.a).to.eql(10);
                e.a = 15;
            });
            Event.emit('orange9:save', {a: 10});
        });
        it('check halt() inside before-subscriber', function (done) {
            Event.onceBefore('orange10:save', function(e) {
                e.halt();
            });
            Event.onceBefore('orange10:save', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.onceBefore('orange10:save', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.emit('orange10:save');
            setTimeout(done, 100);
        });
        it('check preventDefault() inside before-subscriber', function (done) {
            var count = 0;
            Event.onceBefore('orange11:save', function(e) {
                count++
                e.preventDefault();
            });
            Event.onceBefore('orange11:save', function() {
                count++;
            });
            Event.onceAfter('orange11:save', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.emit('orange11:save');
            setTimeout(function() {
                expect(count).to.eql(2);
                done();
            }, 100);
        });
        it('check returnValue', function (done) {
            Event.onceAfter('orange12:save', function(e) {
                (e.returnValue === undefined).should.be.true;
                done();
            });
            Event.emit('orange12:save');
        });
        it("check returnvalue emit", function () {
            expect(Event.emit('orange13:save')).be.an('object');
        });
        it("check returnvalue emit when halted", function () {
            Event.onceBefore('orange13b:save', function(e) {
                e.halt();
            });
            Event.emit('orange13b:save').status.halted.should.be.true;
        });
        it("check returnvalue emit when defaultPrevented", function () {
            Event.onceBefore('orange13c:save', function(e) {
                e.preventDefault();
            });
            Event.emit('orange13c:save').status.defaultPrevented.should.be.true;
        });
        it('context inside once subscriber', function (done) {
            Event.onceBefore('orange:save', function() {
                (this === Event).should.be.true;
                done();
            });
            Event.emit('orange:save');
        });
        it('context inside subscriber', function (done) {
            var handle = Event.before('orange:save', function() {
                (this === Event).should.be.true;
                handle.detach();
                done();
            });
            Event.emit('orange:save');
        });
        it('context inside subscriber when overruled', function (done) {
            var b = {},
                fn = function() {
                    (this === b).should.be.true;
                    done();
                };
            Event.before('orange15b:save', fn.bind(b));
            Event.emit('orange15b:save');
        });
        it('e.target inside subscriber', function (done) {
            Event.onceBefore('orange16:save', function(e) {
                (e.target === Event).should.be.true;
                done();
            });
            Event.emit('orange16:save');
        });

    });

    //========================================================================================================
    describe('Listening without emitter-prefix', function () {
        it('invoking before-subscriber', function (done) {
            Event.onceBefore('save1', function() {
                done();
            });
            Event.emit('UI:save1');
        });
        it('invoking after-subscriber', function (done) {
            Event.onceAfter('save2', function() {
                done();
            });
            Event.emit('UI:save2');
        });
        it('check order before- vs after-subscriber', function (done) {
            var count = 0;
            Event.onceAfter('save3', function() {
                count++;
                expect(count).to.eql(2);
                done();
            });
            Event.onceBefore('save3', function() {
                count++;
                expect(count).to.eql(1);
            });
            Event.emit('UI:save3');
        });
        it('check order multiple before- vs multiple after-subscriber with prepend subscriber', function (done) {
            var count = 0;
            Event.onceAfter('save4', function() {
                count++;
                expect(count).to.eql(5);
            });
            Event.onceAfter('save4', function() {
                count++;
                expect(count).to.eql(4);
            }, true);
            Event.onceAfter('save4', function() {
                count++;
                expect(count).to.eql(6);
                done();
            });
            Event.onceBefore('save4', function() {
                count++;
                expect(count).to.eql(2);
            });
            Event.onceBefore('save4', function() {
                count++;
                expect(count).to.eql(1);
            }, true);
            Event.onceBefore('save4', function() {
                count++;
                expect(count).to.eql(3);
            });
            Event.emit('UI:save4');
        });
        it('check preventDefault', function (done) {
            setTimeout(done, 200);
            Event.onceAfter('save5', function() {
                throw Error('After-event occured while the event was preventDefaulted');
            });
            Event.onceBefore('save5', function(e) {
                e.preventDefault();
            });
            Event.emit('UI:save5');
        });
        it('check preventRender', function (done) {
            setTimeout(done, 200);
            Event.onceAfter('save5b', function(e) {
                e.status.renderPrevented.should.be.true;
            });
            Event.onceBefore('save5b', function(e) {
                e.preventRender();
            });
            Event.emit('UI:save5b');
        });
        it('check e.halt()', function (done) {
            setTimeout(done, 200);
            Event.onceAfter('save6', function() {
                throw Error('After-event occured while the event was halted');
            });
            Event.onceBefore('save6', function(e) {
                e.halt();
            });
            Event.emit('UI:save6');
        });
        it('check passing through payload inside before-subscriber', function (done) {
            Event.onceBefore('save7', function(e) {
                expect(e.a).to.eql(10);
                done();
            });
            Event.emit('UI:save7', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            Event.onceAfter('save8', function(e) {
                expect(e.a).to.eql(10);
                done();
            });
            Event.emit('UI:save8', {a: 10});
        });
        it('check passing through payload inside before-subscriber', function (done) {
            var count = 0;
            Event.onceAfter('save9', function(e) {
                expect(e.a).to.eql(15);
                done();
            });
            Event.onceBefore('save9', function(e) {
                expect(e.a).to.eql(10);
                e.a = 15;
            });
            Event.emit('UI:save9', {a: 10});
        });
        it('check halt() inside before-subscriber', function (done) {
            Event.onceBefore('save10', function(e) {
                e.halt();
            });
            Event.onceBefore('save10', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.onceBefore('save10', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.emit('UI:save10');
            setTimeout(done, 100);
        });
        it('check preventDefault() inside before-subscriber', function (done) {
            var count = 0;
            Event.onceBefore('save11', function(e) {
                count++;
                e.preventDefault();
            });
            Event.onceBefore('save11', function() {
                count++;
            });
            Event.onceAfter('save11', function() {
                done(new Error('Event was halted, yet came through a next before-subscriber'));
            });
            Event.emit('UI:save11');
            setTimeout(function() {
                expect(count).to.eql(2);
                done();
            }, 100);
        });
        it('check returnValue', function (done) {
            Event.onceAfter('save12', function(e) {
                (e.returnValue === undefined).should.be.true;
                done();
            });
            Event.emit('UI:save12');
        });
        it("check returnvalue emit", function () {
            expect(Event.emit('UI:save13')).be.an('object');
        });
        it("check returnvalue emit when halted", function () {
            Event.onceBefore('save13b', function(e) {
                e.halt();
            });
            Event.emit('UI:save13b').status.halted.should.be.true;
        });
        it("check returnvalue emit when defaultPrevented", function () {
            Event.onceBefore('save13c', function(e) {
                e.preventDefault();
            });
            Event.emit('UI:save13c').status.defaultPrevented.should.be.true;
        });
        it('context inside once subscriber', function (done) {
            Event.onceBefore('save', function() {
                (this === Event).should.be.true;
                done();
            });
            Event.emit('UI:save');
        });
        it('context inside subscriber', function (done) {
            var handle = Event.before('save', function() {
                (this === Event).should.be.true;
                done();
            });
            Event.emit('UI:save');
        });
        it('context inside subscriber when overruled', function (done) {
            var b = {},
                fn = function() {
                    (this === b).should.be.true;
                    done();
                };
            Event.before('save15b', fn.bind(b));
            Event.emit('UI:save15b');
        });
        it('e.target inside subscriber', function (done) {
            Event.onceBefore('save16', function(e) {
                (e.target === Event).should.be.true;
                done();
            });
            Event.emit('UI:save16');
        });

    });

});

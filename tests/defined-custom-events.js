/*global describe, it */
"use strict";
var expect = require('chai').expect,
	should = require('chai').should(),
    Event = require("../event.js");

    require('../event-emitter.js');
    require('../event-listener.js');

describe('Defined Custom Events', function () {
    // Code to execute before every test.
    beforeEach(function() {
    });

    // Code to execute after every test.
    afterEach(function() {
        Event.detachAll();
        Event.undefAllEvents();
    });

    it('consistancy Event._ce using undefEvent', function () {
        var count = Object.keys(Event._ce).length;
        Event.defineEvent('red1:save1');
        Event.defineEvent('red1:save2');
        (Object.keys(Event._ce).length===(count+2)).should.be.true;
        Event.undefEvent('red1:save1');
        (Object.keys(Event._ce).length===(count+1)).should.be.true;
        Event.undefEvent('red1:save2');
        (Object.keys(Event._ce).length===count).should.be.true;
    });

    it('consistancy Event._ce using undefAllEvents', function () {
        var count = Object.keys(Event._ce).length;
        Event.defineEvent('red2a:save');
        Event.defineEvent('red2b:save');
        Event.defineEvent('red2b:save2');
        (Object.keys(Event._ce).length===(count+3)).should.be.true;
        Event.undefAllEvents('red2b');
        (Object.keys(Event._ce).length===(count+1)).should.be.true;
        Event.undefAllEvents('red2a');
        (Object.keys(Event._ce).length===count).should.be.true;
    });

    it('consistancy Event._ce using undefAllEvents wildcard', function () {
        var count = Object.keys(Event._ce).length;
        Event.defineEvent('red3a:save');
        Event.defineEvent('red3b:save');
        Event.defineEvent('red3b:save2');
        (Object.keys(Event._ce).length===(count+3)).should.be.true;
        Event.undefAllEvents();
        (Object.keys(Event._ce).length===0).should.be.true;
    });

    it('consistancy Event._ce using undefAllEvents wildcard leaving UI in tact', function () {
        var count = Object.keys(Event._ce).length;
        Event.defineEvent('red4a:save');
        Event.defineEvent('UI:save');
        Event.defineEvent('red4b:save');
        Event.defineEvent('red4b:save2');
        (Object.keys(Event._ce).length===(count+4)).should.be.true;
        Event.undefAllEvents();
        (Object.keys(Event._ce).length===0).should.be.true;
    });

    it('check defaultFn', function (done) {
        var defFn = function(e) {
            Event.undefEvent('red5:save');
            done();
        };
        Event.defineEvent('red5:save').defaultFn(defFn);
        Event.emit('red5:save');
    });

    it('eventobject inside defaultFn', function (done) {
        var defFn = function(e) {
            Event.undefEvent('red6:save');
            expect(e.a).to.eql(10);
            done();
        };
        Event.defineEvent('red6:save').defaultFn(defFn);
        Event.emit('red6:save', {a: 10});
    });

    it('defaultFn on silent', function (done) {
        var defFn = function(e) {
            Event.undefEvent('red7:save');
            done();
        };
        Event.defineEvent('red7:save').defaultFn(defFn);
        Event.emit('red7:save', {silent: true});
    });

    it('e.silent', function (done) {
        Event.before('red8:save', function(e) {
            throw new Error('before-subscriber invoked while event was silent');
        });
        Event.after('red8:save', function(e) {
            throw new Error('after-subscriber invoked while event was silent');
        });
        Event.emit('red8:save', {silent: true});
        setTimeout(function(){
            Event.undefEvent('red8:save');
            done();
        }, 25);
    });

    it('e.silent when unsilencable', function (done) {
        var count = 0;
        Event.before('red9:save', function(e) {
            count++;
        });
        Event.after('red9:save', function(e) {
            count++;
        });
        Event.defineEvent('red9:save').unSilencable();
        Event.emit('red9:save', {silent: true});
        setTimeout(function(){
            Event.undefEvent('red9:save');
            expect(count).to.eql(2);
            done();
        }, 25);
    });

    it('preventedFn by default not executed', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            },
            preventedFn = function(e) {
                count = count+10;
            };
        Event.defineEvent('red10:save').defaultFn(defFn).preventedFn(preventedFn);
        Event.onceAfter('red10:save', function() {
            expect(count).to.eql(1);
            Event.undefEvent('red10:save');
            done();
        });
        Event.emit('red10:save');
    });

    it('preventedFn on e.preventDefault', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            },
            preventedFn = function(e) {
                count = count+10;
            };
        Event.defineEvent('red11:save').defaultFn(defFn).preventedFn(preventedFn);
        Event.onceBefore('red11:save', function(e) {
            e.preventDefault();
        });
        setTimeout(function() {
            expect(count).to.eql(10);
            Event.undefEvent('red11:save');
            done();
        }, 25);
        Event.emit('red11:save');
    });

    it('preventedFn not executed on preventDefault when unpreventable', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            },
            preventedFn = function(e) {
                count = count+10;
            };
        Event.defineEvent('red12:save').defaultFn(defFn).preventedFn(preventedFn).unPreventable();
        Event.onceBefore('red12:save', function(e) {
            e.preventDefault();
        });
        Event.onceAfter('red12:save', function() {
            expect(count).to.eql(1);
            Event.undefEvent('red12:save');
            done();
        });
        Event.emit('red12:save');
    });

    it('no defFn and prevFn when halted', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            },
            preventedFn = function(e) {
                count = count+10;
            };
        Event.defineEvent('red:save').defaultFn(defFn).preventedFn(preventedFn);
        Event.before('red:save', function(e) {
            e.halt();
        });
        Event.emit('red:save');
        setTimeout(function() {
            expect(count).to.eql(0);
            done();
        }, 25);
    });

    it('halted when unhaltable', function (done) {
        var count = 0,
            defFn = function(e) {
                count++;
            },
            preventedFn = function(e) {
                count = count+10;
            };
        Event.defineEvent('red:save').defaultFn(defFn).preventedFn(preventedFn).unHaltable();
        Event.before('red:save', function(e) {
            e.halt();
        });
        Event.emit('red:save');
        setTimeout(function() {
            expect(count).to.eql(1);
            done();
        }, 25);
    });

    it('no reassign', function (done) {
        var defFnRed = function(e) {
                done();
            },
            defFnBlue = function(e) {
                done(new Error('Custom Event should not have been reassigned'));
            };
        Event.defineEvent('dummy:save').defaultFn(defFnRed);
        Event.defineEvent('dummy:save').defaultFn(defFnBlue);
        Event.emit('dummy:save');
    });

    it('reassign with forceassign', function (done) {
        var defFnRed = function(e) {
                done(new Error('Custom Event should have been reassigned'));
            },
            defFnBlue = function(e) {
                done();
            };
        Event.defineEvent('dummy:save').defaultFn(defFnRed);
        Event.defineEvent('dummy:save').defaultFn(defFnBlue).forceAssign();
        Event.emit('dummy:save');
    });

    it('returnvalue emit with defFn', function () {
        var defFn = function(e) {
                return 10;
            };
        Event.defineEvent('red:save').defaultFn(defFn);
        expect(Event.emit('red:save').returnValue).to.eql(10);
    });

    it('returnvalue emit when prevented with preventedFn', function () {
        var defFn = function(e) {
                return 10;
            },
            prevFn = function(e) {
                return 15;
            };
        Event.before('red:save', function(e) {
            e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn).preventedFn(prevFn);
        Event.emit('red:save').status.defaultPrevented.should.be.true;
    });

    it('returnvalue emit when prevented without preventedFn', function () {
        var defFn = function(e) {
                return 10;
            }
        Event.before('red:save', function(e) {
            e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn);
        Event.emit('red:save').status.defaultPrevented.should.be.true;
    });

    it('returnvalue emit when prevented unpreventable with preventedFn', function () {
        var defFn = function(e) {
                return 10;
            },
            prevFn = function(e) {
                return 15;
            };
        Event.before('red:save', function(e) {
            e.preventDefault();
        });
        Event.defineEvent('red:save').defaultFn(defFn).preventedFn(prevFn).unPreventable();
        expect(Event.emit('red:save').returnValue).to.eql(10);
    });

    it('detach', function () {
        Event.before('red:save', function(e) {});
        Event.before('blue:save', function(e) {});
        (Event._subs['red:save']===undefined).should.be.false;
        (Event._subs['blue:save']===undefined).should.be.false;
        Event.detach('red:save');
        (Event._subs['red:save']===undefined).should.be.true;
        (Event._subs['blue:save']===undefined).should.be.false;
    });


    it('detachAll', function () {
        Event.before('red:save', function(e) {});
        Event.before('blue:save', function(e) {});
        (Event._subs['red:save']===undefined).should.be.false;
        (Event._subs['blue:save']===undefined).should.be.false;
        Event.detachAll();
        (Event._subs['red:save']===undefined).should.be.true;
        (Event._subs['blue:save']===undefined).should.be.true;
    });

    it('detach on instance', function () {
        var redObject = {},
            greenObject;
        Event.before('red:save', function(e) {}, redObject);
        Event.before('blue:save', function(e) {}, redObject);
        Event.before('blue:load', function(e) {}, redObject);
        Event.before('red:save', function(e) {}, greenObject);
        Event.before('blue:save', function(e) {}, greenObject);
        Event.before('blue:load', function(e) {}, greenObject);
        expect(Event._subs['red:save'].b.length).to.eql(2);
        expect(Event._subs['blue:save'].b.length).to.eql(2);
        expect(Event._subs['blue:load'].b.length).to.eql(2);
        Event.detach(redObject, 'red:save');
        expect(Event._subs['red:save'].b.length).to.eql(1);
        expect(Event._subs['blue:save'].b.length).to.eql(2);
        expect(Event._subs['blue:load'].b.length).to.eql(2);
    });


    it('detachAll on instance', function () {
        var redObject = {},
            greenObject;
        Event.before('red:save', function(e) {}, redObject);
        Event.before('blue:save', function(e) {}, redObject);
        Event.before('blue:load', function(e) {}, redObject);
        Event.before('red:save', function(e) {}, greenObject);
        Event.before('blue:save', function(e) {}, greenObject);
        Event.before('blue:load', function(e) {}, greenObject);
        expect(Event._subs['red:save'].b.length).to.eql(2);
        expect(Event._subs['blue:save'].b.length).to.eql(2);
        expect(Event._subs['blue:load'].b.length).to.eql(2);
        Event.detachAll(redObject);
        expect(Event._subs['red:save'].b.length).to.eql(1);
        expect(Event._subs['blue:save'].b.length).to.eql(1);
        expect(Event._subs['blue:load'].b.length).to.eql(1);
    });

});

describe('Defined Custom Events through instance', function () {
    // Code to execute before every test.
    beforeEach(function() {
    });

    // Code to execute after every test.
    afterEach(function() {
        Event.detachAll();
        Event.undefAllEvents();
    });

    it('check defaultFn', function (done) {
        var defFn = function(e) {
            done();
        },
        redObject = {}.merge(Event.Emitter('red'));
        redObject.defineEvent('save').defaultFn(defFn);
        redObject.emit('save');
    });

    it('eventobject inside defaultFn', function (done) {
        var defFn = function(e) {
            expect(e.a).to.eql(10);
            done();
        },
        redObject = {}.merge(Event.Emitter('red'));
        redObject.defineEvent('save').defaultFn(defFn);
        redObject.emit('save', {a: 10});
    });

    it('defaultFn on silent', function (done) {
        var defFn = function(e) {
            done();
        },
        redObject = {}.merge(Event.Emitter('red'));
        redObject.defineEvent('save').defaultFn(defFn);
        redObject.emit('save', {silent: true});
    });

    it('e.silent', function (done) {
        var redObject = {}.merge(Event.Emitter('red'));
        redObject.defineEvent('save');
        Event.before('red:save', function(e) {
            throw new Error('before-subscriber invoked while event was silent');
        });
        Event.after('red:save', function(e) {
            throw new Error('after-subscriber invoked while event was silent');
        });
        redObject.emit('save', {silent: true});
        setTimeout(function(){
            done();
        }, 25);
    });

    it('e.silent when unsilencable', function (done) {
        var redObject = {}.merge(Event.Emitter('red')),
            count = 0;
        redObject.defineEvent('save').unSilencable();
        Event.before('red:save', function(e) {
            count++;
        });
        Event.after('red:save', function(e) {
            count++;
        });
        redObject.emit('save', {silent: true});
        setTimeout(function(){
            expect(count).to.eql(2);
            done();
        }, 25);
    });

    it('preventedFn by default not executed', function (done) {
        var redObject = {}.merge(Event.Emitter('red')),
            count = 0,
            defFn = function(e) {
                count++;
            },
            preventedFn = function(e) {
                count = count+10;
            };
        redObject.defineEvent('save').defaultFn(defFn).preventedFn(preventedFn);
        Event.after('red:save', function() {
            expect(count).to.eql(1);
            done();
        });
        redObject.emit('save');
    });

    it('preventedFn on e.preventDefault', function (done) {
        var redObject = {}.merge(Event.Emitter('red')),
            count = 0,
            defFn = function(e) {
                count++;
            },
            preventedFn = function(e) {
                count = count+10;
            };
        redObject.defineEvent('save').defaultFn(defFn).preventedFn(preventedFn);
        Event.before('red:save', function(e) {
            e.preventDefault();
        });
        setTimeout(function() {
            expect(count).to.eql(10);
            done();
        }, 25);
        redObject.emit('save');
    });

    it('preventedFn not executed on preventDefault when unpreventable', function (done) {
        var redObject = {}.merge(Event.Emitter('red')),
            count = 0,
            defFn = function(e) {
                count++;
            },
            preventedFn = function(e) {
                count = count+10;
            };
        redObject.defineEvent('save').defaultFn(defFn).preventedFn(preventedFn).unPreventable();
        Event.before('red:save', function(e) {
            e.preventDefault();
        });
        Event.after('red:save', function() {
            expect(count).to.eql(1);
            done();
        });
        redObject.emit('save');
    });

    it('no defFn and prevFn when halted', function (done) {
        var redObject = {}.merge(Event.Emitter('red')),
            count = 0,
            defFn = function(e) {
                count++;
            },
            preventedFn = function(e) {
                count = count+10;
            };
        redObject.defineEvent('save').defaultFn(defFn).preventedFn(preventedFn);
        Event.before('red:save', function(e) {
            e.halt();
        });
        redObject.emit('save');
        setTimeout(function() {
            expect(count).to.eql(0);
            done();
        }, 25);
    });

    it('halted when unhaltable', function (done) {
        var redObject = {}.merge(Event.Emitter('red')),
            count = 0,
            defFn = function(e) {
                count++;
            },
            preventedFn = function(e) {
                count = count+10;
            };
        redObject.defineEvent('save').defaultFn(defFn).preventedFn(preventedFn).unHaltable();
        Event.before('red:save', function(e) {
            e.halt();
        });
        redObject.emit('save');
        setTimeout(function() {
            expect(count).to.eql(1);
            done();
        }, 25);
    });

    it('no reassign', function (done) {
        var redObject = {}.merge(Event.Emitter('red')),
            defFnRed = function(e) {
                done();
            },
            defFnBlue = function(e) {
                done(new Error('Custom Event should not have been reassigned'));
            };
        redObject.defineEvent('save').defaultFn(defFnRed);
        redObject.defineEvent('save').defaultFn(defFnBlue);
        redObject.emit('save');
    });

    it('reassign with forceassign', function (done) {
        var redObject = {}.merge(Event.Emitter('red')),
            defFnRed = function(e) {
                done(new Error('Custom Event should have been reassigned'));
            },
            defFnBlue = function(e) {
                done();
            };
        redObject.defineEvent('save').defaultFn(defFnRed);
        redObject.defineEvent('save').defaultFn(defFnBlue).forceAssign();
        redObject.emit('save');
    });

    it('returnvalue emit with defFn', function () {
        var redObject = {}.merge(Event.Emitter('red')),
            defFn = function(e) {
                return 10;
            };
        redObject.defineEvent('save').defaultFn(defFn);
        expect(redObject.emit('save').returnValue).to.eql(10);
    });

    it('returnvalue emit-Promise when prevented with preventedFn', function () {
        var redObject = {}.merge(Event.Emitter('red')),
            defFn = function(e) {
                return 10;
            },
            prevFn = function(e) {
                return 15;
            };
        Event.before('red:save', function(e) {
            e.preventDefault();
        });
        redObject.defineEvent('save').defaultFn(defFn).preventedFn(prevFn);
        Event.emit('red:save').status.defaultPrevented.should.be.true;
    });

    it('returnvalue emit when prevented without preventedFn', function () {
        var redObject = {}.merge(Event.Emitter('red')),
            defFn = function(e) {
                return 10;
            }
        Event.before('red:save', function(e) {
            e.preventDefault();
        });
        redObject.defineEvent('save').defaultFn(defFn);
        Event.emit('red:save').status.defaultPrevented.should.be.true;
    });

    it('returnvalue emit when prevented unpreventable with preventedFn', function () {
        var redObject = {}.merge(Event.Emitter('red')),
            defFn = function(e) {
                return 10;
            },
            prevFn = function(e) {
                return 15;
            };
        Event.before('red:save', function(e) {
            e.preventDefault();
        });
        redObject.defineEvent('save').defaultFn(defFn).preventedFn(prevFn).unPreventable();
        expect(redObject.emit('save').returnValue).to.eql(10);
    });

});
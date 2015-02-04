/*global describe, it, beforeEach, afterEach */
/*jshint unused:false */
(function (window) {

    "use strict";
    var expect = require('chai').expect,
        should = require('chai').should(),
        Event = require("../index.js");

    require("../extra/objectobserve.js")(window);

    describe('datachange-event', function () {
        // Code to execute before every test.
        beforeEach(function() {
        });

        // Code to execute after every test.
        afterEach(function() {
            Event.detachAll();
            Event.undefAllEvents();
            Event.unobserveAll();
        });

        it('Event.observe', function (done) {
            var datamodel = {
                year: 2015,
                members: 100
            };
            Event.observe('members', datamodel);
            Event.after('members:datachanged', function(e) {
                var data = e.target,
                    emitter = e.emitter;
                expect(emitter).to.be.equal('members');
                expect(data).to.be.equal(datamodel);
                expect(data.members).to.be.equal(150);
                done();
            });
            datamodel.members = 150;
        });

        it('Event.observe multiple pass through', function (done) {
            var datamodel = {
                year: 2015,
                members: 100
            },
            count = 0;
            Event.observe('members', datamodel);
            Event.after('members:datachanged', function(e) {
                count++;
            });
            datamodel.members = 150;
            setTimeout(function() {
                datamodel.members = 250;
            }, 50);
            setTimeout(function() {
                datamodel.members = 350;
            }, 100);
            setTimeout(function() {
                expect(count).to.be.equal(3);
                done();
            }, 150);
        });

        it('Event.observe multiple pass through no changes when model doesn\'t change', function (done) {
            var datamodel = {
                year: 2015,
                members: 100
            },
            count = 0;
            Event.observe('members', datamodel);
            Event.after('members:datachanged', function(e) {
                count++;
            });
            datamodel.members = 150;
            setTimeout(function() {
                datamodel.members = 250;
            }, 50);
            setTimeout(function() {
                datamodel.members = 250; // no changes
            }, 100);
            setTimeout(function() {
                datamodel.members = 350;
            }, 150);
            setTimeout(function() {
                expect(count).to.be.equal(3);
                done();
            }, 200);
        });

        it('Event.unobserve', function (done) {
            var datamodel = {
                year: 2015,
                members: 100
            },
            count = 0;
            Event.observe('members', datamodel);
            Event.after('members:datachanged', function(e) {
                count++;
            });
            datamodel.members = 150;
            setTimeout(function() {
                datamodel.members = 250;
            }, 50);
            setTimeout(function() {
                Event.unobserve('members');
            }, 100);
            setTimeout(function() {
                datamodel.members = 350; // will not be registered
            }, 150);
            setTimeout(function() {
                expect(count).to.be.equal(2);
                done();
            }, 200);
        });

        it('Unobserve using detach', function (done) {
            var datamodel = {
                year: 2015,
                members: 100
            },
            count = 0,
            observer = Event.observe('members', datamodel);
            Event.after('members:datachanged', function(e) {
                count++;
            });
            datamodel.members = 150;
            setTimeout(function() {
                datamodel.members = 250;
            }, 50);
            setTimeout(function() {
                observer.detach();
            }, 100);
            setTimeout(function() {
                datamodel.members = 350; // will not be registered
            }, 150);
            setTimeout(function() {
                expect(count).to.be.equal(2);
                done();
            }, 200);
        });

        it('using Event.unobserveAll', function (done) {
            var datamodel = {
                year: 2015,
                members: 100
            },
            count = 0;
            Event.observe('members', datamodel);
            Event.after('members:datachanged', function(e) {
                count++;
            });
            datamodel.members = 150;
            setTimeout(function() {
                datamodel.members = 250;
            }, 50);
            setTimeout(function() {
                Event.unobserveAll();
            }, 100);
            setTimeout(function() {
                datamodel.members = 350; // will not be registered
            }, 150);
            setTimeout(function() {
                expect(count).to.be.equal(2);
                done();
            }, 200);
        });
    });

}(global.window || require('node-win')));
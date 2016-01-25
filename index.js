var Event = require('./event-base.js');
require('./event-emitter.js'); // will extent Event
require('./event-listener.js'); // will extent the exported object

module.exports = Event;
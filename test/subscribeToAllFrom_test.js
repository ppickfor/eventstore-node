var util = require('util');
var uuid = require('uuid');
var client = require('../src/client');
const allCredentials = new client.UserCredentials("admin", "changeit");

function createRandomEvent() {
  return client.createJsonEventData(uuid.v4(), {a: uuid.v4(), b: Math.random()}, {createdAt: Date.now()}, 'testEvent');
}

module.exports = {
  'Test Subscribe to All From': function(test) {
    var self = this;
    var liveProcessing = false;
    var catchUpEvents = [];
    var liveEvents = [];
    function eventAppeared(s, e) {
      if (liveProcessing) {
        liveEvents.push(e);
        s.stop();
      } else {
        catchUpEvents.push(e);
      }
    }
    function liveProcessingStarted() {
      liveProcessing = true;
      var events = [createRandomEvent()];
      self.conn.appendToStream(self.testStreamName, client.expectedVersion.any, events);
    }
    function subscriptionDropped(connection, reason, error) {
      test.ok(liveEvents.length === 1, "Expecting 1 live event, got " + liveEvents.length);
      test.ok(catchUpEvents.length > 1, "Expecting at least 1 catchUp event, got " + catchUpEvents.length);
      test.done(error);
    }
    var subscription = this.conn.subscribeToAllFrom(null, false, eventAppeared, liveProcessingStarted, subscriptionDropped, allCredentials);
  }
};

require('./common/base_test').init(module.exports);
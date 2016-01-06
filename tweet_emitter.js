module.exports = function(options) {
  var lastEventTimestamp = new Date(0).valueOf();

  return {
    emit: function(tweet) {
      var now = new Date().valueOf();
      var msSinceLastEvent = now - lastEventTimestamp;
      if (msSinceLastEvent > options.minRequestIntervalMs) {
        lastEventTimestamp = now;
        options.server.emit('tweet', tweet);
        options.logger.debug('Event emitted.');
      } else {
        options.logger.debug('Event received but not emitted - too many events at once.');
        options.logger.silly('Milliseconds since last event: ' + msSinceLastEvent);
        options.logger.silly('Event emission threshold (ms): ' + options.minRequestIntervalMs);
      }
    }
  }
}

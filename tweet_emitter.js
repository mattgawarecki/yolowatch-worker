module.exports = function(options) {
  return {
    emit: function(tweet) {
      options.server.emit('tweet', tweet);
      options.logger.debug('Event emitted.');
    }
  }
}

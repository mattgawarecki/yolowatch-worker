module.exports = function(options) {
  return {
    start: function() {
      var stream = options.api.stream('statuses/filter', { track: options.track });
      stream.on('tweet', options.onTweet);
    }
  };
};

var config = require('./config');
var logger = require('winston');
logger.level = config.logger.level || 'info';

process.on('uncaughtException', function(err) {
  logger.error('Process exiting.');
  logger.error('Uncaught exception:');
  logger.error(err);

  process.exit(1);
});

initializeWorker(config, logger, function(err, data) {
  if (err) throw err;

  logger.info('Starting worker process.');
  data.streamer.start();

  logger.info('Worker process started.');
  // Run forever until the process is killed
});

var now = function() { return new Date().valueOf(); };

function initializeWorker(config, logger, initCallback) {
  var tweetEmitter = require('./tweet_emitter')({
    logger: logger,
    server: require('socket.io')(config.port),
    minRequestIntervalMs: config.events.throttle_ms || 0
  });

  var MongoClient = require('mongodb').MongoClient;
  MongoClient.connect(config.db.path, function(err, db) {
    if (err) return initCallback(err);

    initializeDatabase(logger, db, function(err, doc) {
      if (err) return initCallback(err);

      var Twit = require('twit');
      var tweetStreamer = require('./tweet_streamer')({
        logger: logger,
        api: new Twit({
          consumer_key: '7tICA3DnSrUBrazFg5Yip5t7n',
          consumer_secret: config.api.consumer_secret,
          access_token: '12466862-J0DwVlDtWPl0dtqrmQAFHOBZwawGTUlwAmP4rTO0p',
          access_token_secret: config.api.access_token_secret
        }),
        track: 'yolo',
        onTweet: function(tweet) {
          var data = {
            timestamp: now(),
            screen_name: tweet.user.screen_name,
            text: tweet.text
          };

          if (data.text && data.text.match(/yolo/i)) {
            var tweetCollection = db.collection('tweets');
            tweetCollection.insertOne(data, function(err, res) {
              if (err) throw err;

              logger.debug('Tweet recorded.');
              logger.silly('@' + data.screen_name + ': ' + data.text);

              tweetEmitter.emit(data);
            });
          } else {
            logger.debug('Tweet rejected - did not contain target phrase.');
          }
        }
      });

      return initCallback(null, {
        logger: logger,
        streamer: tweetStreamer
      });
    });
  });
}

function initializeDatabase(logger, db, callback) {
  logger.info('Ensuring database initialization.');

  var metaCollection = db.collection('meta');
  metaCollection.update(
    {}, { $setOnInsert: { start_date: now() } }, { upsert: true },
    function(err, res) {
      if (err) return callback(err);

      logger.info('Database initialized.');
      var metaCollection = db.collection('meta');
      metaCollection.findOne({}, function(err, doc) {
        logger.silly('Start date: ' + doc.start_date);
      });

      return callback();
    });
}

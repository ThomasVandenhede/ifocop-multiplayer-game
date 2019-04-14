var MongoClient = require("mongodb").MongoClient;

var state = {
  client: null
};

exports.connect = function(url, done) {
  if (state.client) {
    return done();
  }

  MongoClient.connect(
    url,
    {
      useNewUrlParser: true
    },
    function(err, client) {
      if (err) {
        return done(err);
      }
      state.client = client;
      done();
    }
  );
};

exports.get = function(dbName) {
  return state.client.db(dbName);
};

exports.close = function(done) {
  if (state.client) {
    state.client.close(function(err, result) {
      state.client = null;
      state.mode = null;
      if (err) {
        done(err);
      }
    });
  }
};

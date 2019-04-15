const MongoClient = require("mongodb").MongoClient;

const state = {
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

exports.getInstance = function() {
  return state.client;
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

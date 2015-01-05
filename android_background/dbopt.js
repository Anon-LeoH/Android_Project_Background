var DB_HOST = 'localhost';
var DB_PORT = 27017;
var DB_NAME = 'Dream_Hero';

var mongodb = require('mongodb');
var dataType = require('./dataType');
var server = new mongodb.Server(DB_HOST, DB_PORT, {auto_reconnect: true});
var db = new mongodb.Db(DB_NAME, server, {safe: true});

var dataClass = {
    'user': dataType.user,
    'task': dataType.task,
    'request': dataType.request
}

function startdb() {
    db.open(function(err, db) {
    if (!err)
            console.log('DB Connected.');
    else
        console.log(err);
    });
}

function insert(col, item, cb) {
  item.getID();
  db.collection(col, function(err, collection) {
    if (err) cb(0, err);
    collection.insert(item.toOutput(), function(err, res) {
      if (err) {
        cb(0, err);
      } else {
        cb(1, null);
      }
    });
  });
}

function remove(col, item, cb) {
  db.collection(col, function(err, collection) {
    if (err) cb(0, err);
    collection.remove(item.toOutput(), function(err, res) {
      if (err) {
        cb(0, err);
      } else {
        cb(1, null)
      }
    });
  });
}

function update(col, item, cb) {
  db.collection(col, function(err, collection) {
    if (err) cb(0, err);
    collection.update({'ID': item.ID}, {$set: item.toOutput()}, function(err) {
      if (err) {
        cb(0, err);
      } else {
        cb(1, null);
      }
    });
  });
}

function findOne(col, item, cb) {
  db.collection(col, function(err, collection) {
    if (err) cb(0, err);
    collection.findOne(item.toOutput(), function(err, res) {
      if (err) cb(0, err);
      else cb(dataClass[col].getInstance(res), null);
    });
  });
}

function find(col, item, cb) {
  db.collection(col, function(err, collection) {
    if (err) cb(0, err);
    collection.find(item.toOutput()).toArray(function(err, res) {
      if (err) cb(0, err);
      else {
        for (i = 0; i < res.length; i++) {
          res[i] = dataClass[col].getInstance(res[i]);
        }
        cb(res, null);
      }
    });
  });
}

// unfinished: some quick function

exports.startdb = startdb;
exports.insert = insert;
exports.remove = remove;
exports.update = update;
exports.findOne = findOne;
exports.find = find;


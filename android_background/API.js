var path = require('path');
var url = require('url');
var queryString = require('querystring');
var db = require('./dbopt');
var dataType = require('./dataType');
var uuid = require('./uuid');

var KEY_ERROR = 'keyError';
var KEY_ERROR_INFO = 'User Key not Match!';
var DB_ERROR = 'dbError';
var DB_ERROR_INFO = 'Error Occur When Connecting Service!';
var ALREADY_FRIEND_ERROR = 'friError';
var ALREADY_FRIEND_ERROR_INFO = 'This Guy is Already Your Friend!';
var PERMISSION_ERROR = 'permissionError';
var PERMISSION_ERROR_INFO = 'No Permission to Do This!';
var USER_EXISTED_ERROR = 'existedError';
var USER_EXISTED_ERROR_INFO = 'Username Already Existed!';

function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

var template = {
  'errno': function(argv, data) {
    return {err: 0, type: 'suc'};
  },
  'error': function(argv, data) {
    return {err: 1, type: argv, errInfo: data};
  },
  'info': function(argv, data) {
    return {err: 0, type: argv, info: data};
  }
}

function sendTask(tid) {
  db.findOne('task', dataType.task.getInstance({'ID': tid}), function(res, errno) {
    var uid = res.owner;
      db.findOne('user', dataType.user.getInstance({'ID': uid}), function(r, errno) {
        var idx = randomInt(0, r.fri.length);
        res.target = r.fri[idx];
        db.update('task', res, function(rlt, err){});
        db.insert('request', dataType.request.getInstance({
          'ID': uuid.v4(),
          'type': 'tsk',
          'target': tid,
          'recv': res.target
        }), function(rlt, err){});
      });
  });
}

function checkKey(uid, key, cb) {
  var data = {ID: uid, _key: key};
  db.findOne('user', dataType.user.getInstance(data), function(res, errno) {
    if (errno) cb(true);
    else cb(false);
  });
}

function returnMsg(res, type, argv, data) {
  var msg = template[type](argv, data);
  msg = JSON.stringify(msg);
  res.writeHead(200, {"Content-Type": "text/plain"});
  res.write(msg);
  res.end();
}

function fetchPostData(req, callback) {
  var postData = '';
  req.setEncoding('utf8');
  req.addListener('data', function(postDataChunk) {
    postData += postDataChunk;
  });
  req.addListener('end', function(postDataCHunk) {
    var data = queryString.parse(postData);
    callback(data);
  });
}

// Tool ends here

function getNews(req, res) {
  var query = url.parse(req.url).query;
  query = queryString.parse(query);
  var uid = query.uid;
  var key = query.key;
  checkKey(uid, key, function(rlt) {
    if (!rlt) {
      returnMsg(res, 'error', KEY_ERROR, KEY_ERROR_INFO);
      return;
    }
    var tmp = dataType.request.getInstance({'recv': uid});
    db.find('request', tmp, function(rlt, err) {
      if (err) {
        returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
      } else {
        var tmp = {
          fri: [],
          conf: [],
          tsk: []
        };
        for (i = 0; i < rlt.length; i++) {
          tmp[rlt[i].type].push(rlt[i].toOutput);
        }
        returnMsg(res, 'info', 'news', tmp);
      }
    });
  });
}

function getUserInfo(req, res) {
  var query = url.parse(req.url).query;
  query = queryString.parse(query);
  var uid = query.uid;
  var key = query.key;
  var target = query.target;
  checkKey(uid, key, function(rlt) {
    if (!rlt) {
      returnMsg(res, 'error', KEY_ERROR, KEY_ERROR_INFO);
      return;
    }
    var tmp = dataType.user.getInstance({'ID': target});
    db.findOne('user', tmp, function(rlt, err) {
      if (err) {
        returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
      } else {
        var tmp;
        if (uid == target) tmp = rlt.toSelfView();
        else tmp = rlt.toOtherView();
        returnMsg(res, 'info', 'user', tmp);
      }
    });
  });
}

function getTaskInfo(req, res) {
  var query = url.parse(req.url).query;
  query = queryString.parse(query);
  var uid = query.uid;
  var key = query.key;
  var target = query.target;
  checkKey(uid, key, function(rlt) {
    if (!rlt) {
      returnMsg(res, 'error', KEY_ERROR, KEY_ERROR_INFO);
      return;
    }
    var tmp = dataType.task.getInstance({'ID': target});
    db.findOne('task', tmp, function(rlt, err) {
      if (err) {
        returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
      } else {
        returnMsg(res, 'info', 'task', rlt.toOutput());
      }
    });
  });
}

function addFriend(req, res) {
  var query = url.parse(req.url).query;
  query = queryString.parse(query);
  var uid = query.uid;
  var key = query.key;
  var target = query.target;
  checkKey(uid, key, function(rlt) {
    if (!rlt) {
      returnMsg(res, 'error', KEY_ERROR, KEY_ERROR_INFO);
      return;
    }
    var tmp = dataType.user.getInstance({'ID': uid});
    db.findOne('user', tmp, function(rlt1, err) {
      if (err) {
        returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
      } else {
        if (rlt1.fri.indexOf(target) != -1) {
          returnMsg(res, 'error', ALREADY_FRIEND_ERROR, ALREADY_FRIEND_ERROR_INFO);
        } else {
          var tmp = dataType.request.getInstance({'target': uid, 'recv': target});
          db.findOne('request', tmp, function(rlt, err) {
            if (rlt) {
              returnMsg(res, 'errno', null, null);
            } else {
              var tmp = dataType.request.getInstance({'target': target, 'recv': uid});
              db.findOne('request', tmp, function(rlt, err) {
                if (rlt) {
                  db.remove('request', rlt, function(rlt, err) {
                    var tmp = dataType.user.getInstance({'ID': target});
                    db.findOne('user', tmp, function(rlt, err) {
                        rlt1.fri.push(target);
                        rlt.fri.push(uid);
                        rlt.friName[uid] = rlt1.name;
                        rlt1.friName[target] = rlt.name;
                        db.update('user', rlt, function(rlt, err){});
                        db.update('user', rlt1, function(rlt, err){});
                        returnMsg(res, 'info', 'getFriend', null);
                    });
                  });
                } else {
                  db.insert('request', dataType.request.getInstance({
                     'ID': uuid.v4(),
                     'type': 'fri',
                     'target': uid,
                     'recv': target
                  }), function(rlt, err) {
                    if (!rlt) returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
                    else returnMsg(res, 'errno', null, null);
                  });
                }
              });
            }
          });
        }
      }
    });
  });
}

function confirmTask(req, res) {
  var query = url.parse(req.url).query;
  query = queryString.parse(query);
  var uid = query.uid;
  var key = query.key;
  var target = query.target;
  checkKey(uid, key, function(rlt) {
    if (!rlt) {
      returnMsg(res, 'error', KEY_ERROR, KEY_ERROR_INFO);
      return;
    }
    var tmp = dataType.task.getInstance({'ID': target});
    db.findOne('task', tmp, function(rlt, err) {
      if (err) {
        returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
      } else {
        if (rlt.owner == uid) {
          if (!rlt.ownFin) {
            rlt.ownFin = true;
            rlt.tarFin = true;
            db.remove('request', dataType.request.getInstance({'target': rlt.ID}), function(r, err) {
              db.update('task', rlt, function(rlt, err) {
                if (!rlt) {
                  returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
                } else {
                  returnMsg(res, 'errno', null, null);
                }
              });
            });
          } else {
            returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
          }
        } else if (rlt.target == uid) {
          if (!rlt.tarFin) {
            rlt.tarFin = true;
            db.remove('request', dataType.request.getInstance({'target': rlt.ID, 'recv': uid}), function(r, err) {
              db.update('task', rlt, function(rlt, err) {
                if (!rlt) {
                  returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
                } else {
                  returnMsg(res, 'errno', null, null);
                }
              });
            });
          } else {
            returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
          }
        } else {
          returnMsg(res, 'error', PERMISSION_ERROR, PERMISSION_ERROR_INFO);
        }
      }
    });
  });
}

function removeFriend(req, res) {
  var query = url.parse(req.url).query;
  query = queryString.parse(query);
  var uid = query.uid;
  var key = query.key;
  var target = query.target;
  checkKey(uid, key, function(rlt) {
    if (!rlt) {
      returnMsg(res, 'error', KEY_ERROR, KEY_ERROR_INFO);
      return;
    }
    var tmp = dataType.user.getInstance({'ID': uid});
    db.findOne('user', tmp, function(rlt, err) {
      if (err) {
        returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
      } else {
        if (rlt.fri.indexOf(target) != -1) {
          rlt.fri.splice(rlt.fir.indexOf(target), 1);
          delete rlt.friName[target];
          var tmp = dataType.user.getInstance({'ID': target});
          db.findOne('user', tmp, function(r, err) {
            r.fri.splice(r.fri.indexOf(uid), 1);
            delete r.friName[uid];
            db.update('user', rlt, function(rlt, err) {
              db.update('user', r, function(rlt, err) {
                returnMsg(res, 'errno', null, null);
              })
            })
          });
        } else {
          returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
        }
      }
    });
  });
}

function removeTask(req, res) {
  var query = url.parse(req.url).query;
  query = queryString.parse(query);
  var uid = query.uid;
  var key = query.key;
  var target = query.target;
  checkKey(uid, key, function(rlt) {
    if (!rlt) {
      returnMsg(res, 'error', KEY_ERROR, KEY_ERROR_INFO);
      return;
    }
    var tmp = dataType.task.getInstance({'ID': target});
    db.findOne('task', tmp, function(rlt, err) {
      if (err) {
        returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
      } else {
        if (rlt.owner == uid) {
          db.remove('task', rlt, function(rlt, err){});
          db.remove('request', dataType.request.getInstance({
            'target': target,
            'recv': rlt.target
          }), function(rlt, err){});
          returnMsg(res, 'errno', null, null);
        } else if (rlt.target == uid) {
          db.remove('request', dataType.request.getInstance({
            'target': target,
            'recv': rlt.target
          }), function(rlt, err){});
          sendTask(rlt.ID);
          returnMsg(res, 'errno', null, null);
        } else {
          returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
        }
      }
    });
  });
}

function logout(req, res) {
  var query = url.parse(req.url).query;
  query = queryString.parse(query);
  var uid = query.uid;
  var key = query.key;
  checkKey(uid, key, function(rlt) {
    if (!rlt) {
      returnMsg(res, 'error', KEY_ERROR, KEY_ERROR_INFO);
      return;
    }
    var tmp = dataType.user.getInstance({'ID': uid});
    db.findOne('user', tmp, function(rlt, err) {
      if (err) {
        returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
      } else {
        rlt._key = null;
        db.update('user', rlt, function(rlt, err){});
        returnMsg(res, 'errno', null, null);
      }
    });
  });
}

function getAllTask(req, res) {
  var query = url.parse(req.url).query;
  query = queryString.parse(query);
  var uid = query.uid;
  var key = query.key;
  var type = query.type;
  checkKey(uid, key, function(rlt) {
    if (!rlt) {
      returnMsg(res, 'error', KEY_ERROR, KEY_ERROR_INFO);
      return;
    }
    var tmp;
    if (type == 'my') tmp = dataType.task.getInstance({'owner': uid});
    else tmp = dataType.task.getInstance({'target': uid});
    db.find('task', tmp, function(rlt, err) {
      if (err) {
        returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
      } else {
        for (i = 0; i < rlt.length; i++) {
          rlt[i] = rlt[i].toOutput();
        }
        returnMsg(res, 'info', 'tsks', rlt);
      }
    });
  });
}

// GET ends here

function register(req, res) {
  fetchPostData(req, function(data) {
    uid = data.uid;
    psw = data.psw;
    name = data.name;
    db.findOne('user', dataType.user.getInstance({'ID': uid}), function(rlt, err) {
      if (rlt) {
        returnMsg(res, 'error', USER_EXISTED_ERROR, USER_EXISTED_ERROR_INFO);
      } else {
        var tmp = dataType.user.getInstance({
          'ID': uid,
          'psw': psw,
          'name': name,
          'fri': [],
          '_key': null,
          'friName': {}
        });
        db.insert('user', tmp, function(rlt, err) {
          if (!err) {
            returnMsg(res, 'errno', null, null);
          } else {
            returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
          }
        });
      }
    });
  });
}

function login(req, res) {
  fetchPostData(req, function(data) {
    uid = data.uid;
    psw = data.psw;
    db.findOne('user', dataType.user.getInstance({
      'ID': uid,
      'psw': psw
    }), function(rlt, err) {
      if (!rlt) {
        returnMsg(res, 'error', NO_USER_ERROR, NO_USER_ERROR_INFO);
      } else {
        rlt._key = uuid.v4();
        db.update('user', rlt, function(r, err){
          returnMsg(res, 'info', 'key', rlt._key);
        });
      }
    });
  });
}

function addTask(req, res) {
  fetchPostData(req, function(data) {
    uid = data.uid;
    key = data.key;
    checkKey(uid, key, function(rlt) {
      if (!rlt) {
        returnMsg(res, 'error', KEY_ERROR, KEY_ERROR_INFO);
      } else {
        var tmp = dataType.task.getInstance({
          'ID': uuid.v4(),
          'title': data.title,
          'date': data.date,
          'content': data.content,
          'owner': data.uid,
          'target': null,
          'ownFin': false,
          'tarFin': false
        });
        tid = tmp.ID
        db.insert('task', tmp, function(rlt, err) {
          if (!err) {
            sendTask(tid);
            returnMsg(res, 'errno', null, null);
          } else {
            returnMsg(res, 'eriror', DB_ERROR, DB_ERROR_INFO);
          }
        });
      }
    });
  });
}

// POST ends here

function ERROR(req, res) {
  returnMsg(res, 'error', DB_ERROR, DB_ERROR_INFO);
}

exports.getNews = getNews;
exports.getUserInfo = getUserInfo;
exports.getTaskInfo = getTaskInfo;
exports.getAllTask = getAllTask;
exports.addFriend = addFriend;
exports.confirmTask = confirmTask;
exports.removeFriend = removeFriend;
exports.removeTask = removeTask;
exports.logout = logout;
exports.register = register;
exports.login = login;
exports.addTask = addTask;
exports.error = ERROR;


var uuid = require('./uuid');

var getOutput = function(data, key) {
  rlt = {};
  for (i = 0; i < key.length; i++) {
    if (data[key[i]] && data[key[i]] != [] && data[key[i]] != {}) {
      rlt[key[i]] = data[key[i]];
    }
  }
  return rlt;
}

var user = {
  getInstance: function(data) {
    var usr = {};
    if (data['ID']) usr.ID = data.ID;
    else usr.ID = null
    if (data['name']) usr.name = data.name;
    else usr.name = null
    if (data['psw']) usr.psw = data.psw;
    else usr.psw = null
    if (data['fri']) usr.fri = data.fri;
    else usr.fri = null
    if (data['_key']) usr._key = data._key;
    else usr._key = null
    if (data['friName']) usr.friName = data.friName;
    else usr.friName = null
    usr.toOutput = function() {
      return getOutput(usr, ['ID', 'name', 'psw', 'fri', '_key', 'friName']);
    }
    usr.toSelfView = function() {
      return getOutput(usr, ['ID', 'name', 'fri', '_key', 'friName']);
    }
    usr.toOtherView = function() {
      return getOutput(usr, ['ID', 'name']);
    }
    usr.checkKey = function(key) {
      if (usr._key == null) return false;
      if (key != usr._key) return false;
      else return true;
    }
    usr.buildKey = function() {
      usr._key = uuid.v4();
      return true;
    }
    return usr;
  }
}

var task = {
  getInstance: function(data) {
    var tsk = {};
    if (data['ID']) tsk.ID = data.ID;
    else tsk.ID = null
    if (data['title']) tsk.title = data.title;
    else tsk.title = null
    if (data['date']) tsk.date = data.date;
    else tsk.date = null
    if (data['content']) tsk.content = data.content;
    else tsk.content = null
    if (data['owner']) tsk.owner = data.owner;
    else tsk.owner = null
    if (data['target']) tsk.target = data.target;
    else tsk.target = null
    if (data['ownFin']) tsk.ownFin = data.ownFin;
    else tsk.ownFin = null
    if (data['tarFin']) tsk.tarFin = data.tarFin;
    else tsk.tarFin = null
    tsk.toOutput = function() {
      return getOutput(tsk, ['ID', 'title', 'date', 'content', 'owner', 'target', 'ownFin', 'tarFin']);
    }
    tsk.toSelfView = tsk.toOutput;
    tsk.toOtherView = tsk.toOutput;
    return tsk;
  }
}

var request = {
  getInstance: function(data) {
    var req = {};
    if (data['ID']) req.ID = data.ID;
    else req.ID = null
    if (data['type']) req.type = data.type;
    else req.type = null
    if (data['target']) req.target = data.target;
    else req.target = null
    if (data['recv']) req.recv = data.recv;
    else req.recv = null
    req.ID = data.ID;
    req.type = data.type;
    req.target = data.target;
    req.recv = data.recv;
    req.toOutput = function() {
      return getOutput(req, ['ID', 'target', 'type', 'recv']);
    }
    req.toSelfView = tsk.toOutput;
    req.toOtherView = tsk.toOutput;
    return req;
  }
}

exports.user = user;
exports.task = task;
exports.request = request;


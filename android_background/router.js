var path = require('path');
var fs = require('fs');
var url = require('url');
var API = require('./API');

var handle = {}; 

function init() {
    // GET part
    handle['/news'] = API.getNews; 
    handle['/uinfo'] = API.getUserInfo; 
    handle['/tinfo'] = API.getTaskInfo; 
    handle['/allt'] = API.getAllTask;  
    handle['/addFri'] = API.addFriend; 
    handle['/confTsk'] = API.confirmTask;
    handle['/remvFri'] = API.removeFriend;
    handle['/remvTsk'] = API.removeTask;
    handle['/logout'] = API.logout;
    // POST part
    handle['/reg'] = API.register;
    handle['/login'] = API.login;
    handle['/addTsk'] = API.addTask;
    console.log('Router inited.');
}

function route(request, response) {
  pathname = url.parse(request.url).pathname;
  query = url.parse(request.url).query;
  if (typeof handle[pathname] === 'function') {
    handle[pathname](request, response);
  }
  else {
    API.error(request, response);
  }
}

exports.route = route;
exports.init = init;

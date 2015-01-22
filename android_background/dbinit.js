var DB_HOST = "localhost";
var DB_PORT = 27017;
var DB_NAME = "Dream_Hero";

var mongodb = require('mongodb');
var server = new mongodb.Server(DB_HOST,DB_PORT,{auto_reconnect:true});
var db = new mongodb.Db(DB_NAME,server,{safe:true});

db.open(function(err,db){
    if (!err){  
        console.log('Connecting DataBase succeed'); //db链接成功
        db.createCollection("user",function(err,collection){  //建立用户信息的collection
            if (err) console.log("error:" + err);  //报错
            collection.remove(function(){});
        });
        db.createCollection("task",function(err,collection){  //建立用户信息的collection
            if (err) console.log("error:" + err);  //报错
            collection.remove(function(){});
        });
        db.createCollection("request",function(err,collection){  //建立用户信息的collection
            if (err) console.log("error:" + err);  //报错
            collection.remove(function(){});
        });
    }
    else console.log(err); //无法打开database
});



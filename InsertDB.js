/*db connection*/
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Project2');
var db = mongoose.connection;
var ObjectID = require('mongodb').ObjectID;
db.on('error', console.error.bind(console, 'Database connection error:'));
db.once('open', function() {
    console.log("Database is connected!!");
  });

/*Schema generation*/
var LoginSchema = new mongoose.Schema({
    userId : {type:String, required : true, unique : true},
    password : {type:String, required:true, trim:true} //trim : 공백제거
}); //Login collection에 들어가는 document들의 조건

var userInfoSchema = new mongoose.Schema({
    userId : {type:String, required : true, unique : true},
    name : {type:String, required : true},
    profile : String
}) //userInfo collection에 들어가는 document들의 조건

var friendListSchema = new mongoose.Schema({
    name : String,
    phoneNumber : String,
    profile : String
})

var friendsSchema = new mongoose.Schema({
    userId : {type : String, required:true, unique : true},
    friendList : friendListSchema,
    profile : {profile : String}
}) //friends collection에 들어가는 document들의 조건

var imgListSchema = new mongoose.Schema({
    title : String,
    img : String
})

var gallerySchema = new mongoose.Schema({
    userid : {type : String, required : true, unique : true},
    imgList : imgListSchema
})// Gallery collection에 들어가는 document들의 조건

mongoose.model('Login',LoginSchema,'Login');
mongoose.model('userInfo',userInfoSchema,'userInfo');
mongoose.model('friends',friendsSchema,'friends');
mongoose.model('gallery',gallerySchema,'gallery');

var Login_collection = mongoose.model('Login');
var userInfo_collection = mongoose.model('userInfo');
var friends_collection = mongoose.model('friends');
var gallery_collection = mongoose.model('gallery');

function insert_login(id, password){
    Login_collection.collection.insert({userId : id, password : password});
}

function insert_UserInfo(id,name,profile){
    UserInfo_collection.collection.insert({userId : id, name : name, profile : profile,_id : new ObjectID()});
}
function insert_friends(id,friendListSchema){
    friends_collection.collection.insert({userId : id, friendList : friendListSchema});
}


insert_login("john","1234");
insert_friends("john",[{name:"seongwoongJo",phoneNumber:"010-9780-3125",profile:"any path",_id : new ObjectID()}]);
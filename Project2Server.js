/* db name : Project2 
 * Login(collection) : [{"userId":"madmad"
 *                       "password":"1234"}, {...}, ...]
 * userInfo(collection) : [{"userId":"madmad", "name":"john","profile":"img_path"}, {...}, ...]
 * friends(collection) : [{"userId:"madmad","friendList":[{"name":"조성웅"
 *                                                         "phoneNumber":"01097803125"
 *                                                         "profile":"img_path"}, {...}, ...]}]
 * gallery(collection) : [{"userId" : "madmad",
 *                         "imgList": [{"title" : "셀카","img":"img_path"},{...},...]}] 
 */

/*variable for server request*/
var http = require('http');
var url =require('url');
var querystring = require('querystring');

/*db connection*/
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Project2');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Database connection error:'));
db.once('open', function() {
    console.log("Database is connected!!");
  });

/*Schema generation*/
var Login = new mongoose.Schema({
    userId : {type:String, required : true, unique : true},
    password : {type:String, required:true, trim:true} //trim : 공백제거
}); //Login collection에 들어가는 document들의 조건
var userInfo = new mongoose.Schema({
    userId : {type:String, required : true, unique : true},
    name : {type:String, required : true},
    profile : String
}) //userInfo collection에 들어가는 document들의 조건

var friendList = new mongoose.SchemaType({
    name : String,
    phoneNumber : String,
    profile : String
})

var friends = new mongoose.Schema({
    userId : {type : String, required:true, unique : true},
    friendList : friendList,
    profile : {profile : String}
}) //friends collection에 들어가는 document들의 조건

var imgList = new mongoose.Schema({
    title : String,
    img : String
})

var gallery = new mongoose.Schema({
    userid : {type : String, required : true, unique : true},
    imgList : imgList
})// Gallery collection에 들어가는 document들의 조건

/*Server Create*/

var server = http.createServer(function(request,response){
    /*GET request에 해당하는 data*/
    var parsedUrl = url.parse(request.url);
    var parsedQuery = querystring.parse(parsedUrl.query,'&','=');  
    
    /*POST request에 해당하는 data*/
    var postdata='';
    request.on('data', function(data){
        postdata=postdata+data;
    });

    /*data Handling*/
    // 1.Client에 login이 맞는지 틀린지 data 전송 
    var check = "false"; //true : login success , false : login fail
    response.on('end',function(){
        response.send(check);
    })

    // 2.login

    
});

server.listen(8080, function(){
    console.log('Server is running...');
});
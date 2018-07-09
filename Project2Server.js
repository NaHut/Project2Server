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
    userId : {type : String, required : true, unique : true},
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

/*Login Const values */
const LOGIN = 1;
const WRONG_PW = 2;
const NOT_MEMBER = 3; 

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
    var tag = "load"; // Request body 부분의 tag에 따라서 response가 달라짐.

  
    
    /*
    1. LOGIN = login 성공, 2. WRONG_PW = password 틀림, 3. NOT_MEMBER = 멤버가 아님
     */
    var isMember = NOT_MEMBER;

    request.on('end',async function(){
        
        //postdata를 parsing해준다
        //1)Post Man에서 post 형식으로 보내줄때 사용
        var postParsedQuery = querystring.parse(postdata);

        //2)android 에서 JSON Object로 보내줄때 사용
        var postParsedQuery =JSON.parse(postdata);
        
        //device에 보내줄 결과값을 저장하기 위한 JSON OBJECT
        var jsonObj ;
        //tag 값을 얻는다.
        tag = postParsedQuery.tag;

        console.log("your input");
        console.log(postParsedQuery);
    
        switch(tag){
            case "login" :
                //login 정보가 DB에 들어 있는지 확인한다.
                isMember = await isSigned(postParsedQuery,Login_collection);
               
                //각 상황별 핸들링을 해준다
                if(isMember == LOGIN){
                    console.log("Login success");
                    jsonObj = {"result" : "LOGIN"};
                    response.end(JSON.stringify(jsonObj));
                }
                else if(isMember == WRONG_PW){
                    console.log("Wrong password");
                    jsonObj = {"result" : "WRONG_PW"};
                    response.end(JSON.stringify(jsonObj));
                }
                else{
                    console.log("ID is not existed");
                    jsonObj = {"result" : "NOT_MEMBER"}
                    response.end(JSON.stringify(jsonObj));
                }
                break;
                
            case "signUp":
                //login 정보가 DB에 들어 있느지 확인한다.
                isMember = await isSigned(postParsedQuery,Login_collection);

                //각 상황별 핸들링을 해준다
                if(isMember == LOGIN || isMember == WRONG_PW){
                    console.log("You are already the member");
                    jsonObj = {"result" : "ALREADY_MEMBER"}
                    response.end(JSON.stringify(jsonObj));
                }
                else{
                    var userId = postParsedQuery.userId;
                    var password = postParsedQuery.password;
                    var user = {userId : userId, password : password};
                    Login_collection.collection.insert(user);
                    console.log("Sign Up completed");
                    jsonObj = {"result" : "SIGN_UP"}
                    response.end(JSON.stringify(jsonObj));
                }   
                break;

            case "load" :
                //GET request && userId = String형식으로 들어옴.
                var userId = parsedQuery.userId;
                var query = {userId : userId};
                var projection = {friendList : 1};
                var cursor = friends_collection.collection.find(query,projection);
                var result_json;
                cursor.each(function(err,doc){
                    if(err){
                        console.log(err);
                    }else{
                        if(doc != null){
                            //console.log(doc.friendList);
                            result_json=doc.friendList;
                        }
                        
                    }
                });
                response.end(result_json);
                break;
        }
    });
    // 2.login


});//tag 값을 얻는다.

server.listen(8080, function(){
    console.log('Server is running...');
});

/*
post로 받은 user의 id와 pw가 DB와 매칭이 되는지 확인한다.
*/
async function isSigned(postParsedQuery, Login_collection){
    var check = NOT_MEMBER;
    var userId = postParsedQuery.userId;
    var query = {userId : userId };
    var cursor = await Login_collection.collection.find(query);
    
    for(let doc = await cursor.next(); doc!=null; doc = await cursor.next()){
        try{
            if(doc.password == postParsedQuery.password && doc!=null){
                check = LOGIN;
                break;
            }
            else if(doc!=null){
                check = WRONG_PW;
                break;
            }
        }
        catch(err){
            console.log(err);
        }
    }
    
    return check;          
}
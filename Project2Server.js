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
var fs = require('fs')
var querystring = require('querystring');
var ObjectID = require('mongodb').ObjectID;

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

var friendsSchema = new mongoose.Schema({
    userId : {type : String, required:true, unique : true},
    friendList : Array,
    profile : {profile : String}
}) //friends collection에 들어가는 document들의 조건

var gallerySchema = new mongoose.Schema({
    userId : {type : String, required : true, unique : true},
    imgList : Array
})// Gallery collection에 들어가는 document들의 조건

mongoose.model('Login',LoginSchema,'Login');
mongoose.model('friends',friendsSchema,'friends');
mongoose.model('gallery',gallerySchema,'gallery');

var Login_collection = mongoose.model('Login');
var friends_collection = mongoose.model('friends');
var gallery_collection = mongoose.model('gallery');

/*Login Const values */
const LOGIN = 1;
const WRONG_PW = 2;
const NOT_MEMBER = 3;

/*update2gallery Const values */
const ADD = 1;
const DELETE = 2;

/*Server Create*/

var server = http.createServer(async function(request,response){
    console.log("---------------------Request occurs--------------------")
    /*GET request에 해당하는 data*/
    var parsedUrl = url.parse(request.url);
    var parsedQuery = querystring.parse(parsedUrl.query,'&','=');  
        
    /*POST request에 해당하는 data*/
    var postdata='';
    request.on('data', function(data){
        postdata=postdata+data;
    });
    var tag = "load"; // Request body 부분의 tag에 따라서 response가 달라짐.

    /*data Handling*/
    request.on('end',async function(){
        
        //postdata를 parsing해준다
        //1)Post Man에서 post 형식으로 보내줄때 사용
        //var postParsedQuery = querystring.parse(postdata);

        //2)android 에서 JSON Object로 보내줄때 사용
        var postParsedQuery =JSON.parse(postdata);
        
        //tag 값을 얻는다.
        tag = postParsedQuery.tag;

        console.log(postParsedQuery);
        console.log("tag : "+tag);
        switch(tag){
            case "login" :
                //POST REQUEST : userId, password
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
                //POST REQUEST : userId, password
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
                    var user_friends = {userId : userId, friendList : []};
                    var user_gallery = {userId : userId , imgList : []};
                    Login_collection.collection.insert(user);
                    friends_collection.collection.insert(user_friends);
                    gallery_collection.collection.insert(user_gallery);
                    console.log("Sign Up completed");
                    jsonObj = {"result" : "SIGN_UP"}
                    response.end(JSON.stringify(jsonObj));
                }   
                break;
                case "load" :
                //POST REQUEST : userId
                var userId = postParsedQuery.userId;
                var query = {userId : userId};
                var projection = {friendList : 1};
                var cursor = friends_collection.collection.find(query,projection);
                var result_json;
                
                for(let doc = await cursor.next(); doc!=null; doc = await cursor.next()){
                    try{
                        if(doc!=null){
                            result_json=await JSON.stringify(doc.friendList);
                            result_json = await "{friendList : "+result_json+"}";
                            console.log("Completely load contacts")
                            //console.log(result_json);
                        }
                    }
                    catch(err){
                        console.log(err);
                    }
                }
                
                response.end(result_json);
                break;

            case "add_contact" :
                ////POST REQUEST : userId, name,phoneNumber,profile

                var userId = postParsedQuery.userId;
                var name = postParsedQuery.name;
                var phoneNumber = postParsedQuery.phoneNumber;
                //var img = postParsedQuery.img;
                var profile = "/home/serverserver/images/user.png";

                /* 여기서 img로 오면 add_img로 서버에 이미지 저장하고 prifile에 path를 넣어줘야함*/
                /* 아직 구현 X*/
                var info = {name:name,phoneNumber:phoneNumber,profile:profile,_id : new ObjectID()};
                var query = {userId : userId};
                var projection = {friendList : 1};
                var cursor = friends_collection.collection.find(query,projection);
                console.log(cursor);
                for(let doc = await cursor.next(); doc!=null; doc = await cursor.next()){
                    try{
                        if(doc!=null){
                            var update_friendList = doc.friendList;
                            update_friendList.push(info);
                            friends_collection.collection.update({userId : userId},{$set : {friendList : update_friendList}});
                            console.log("Completely add contact");
                            jsonObj = {"result" : "add_complete"}
                            response.end(JSON.stringify(jsonObj));
                        }
                    }
                    catch(err){
                        console.log(err);
                    }
                }
                break;

            case "delete_contact" :
                 //request가 userId, index로 온다
                 var userId = postParsedQuery.userId;
                 var index = parseInt(postParsedQuery.index); // index는 app내부에서 check박스 만들어서 index얻어야할듯.
                 var query = {userId : userId};
                 var projection = {friendList : 1};
                 var cursor = friends_collection.collection.find(query,projection);
 
                 for(let doc = await cursor.next(); doc!=null; doc = await cursor.next()){
                     try{
                         if(doc!=null){
                             var update_friendList = doc.friendList;
                             update_friendList.splice(index,1);
                             await friends_collection.collection.update({userId : userId},{$set : {friendList : update_friendList}});
                             jsonObj = {"result" : "delete_complete"}
                             response.end(JSON.stringify(jsonObj));
                             console.log("Completely delete contact");
                         }
                     }
                     catch(err){
                         console.log(err);
                     }
                 }
                break;

            case "image_load":
               //request는 post형식으로 tag = "image_load", userId = "id" 로 옴.
               //response는 Array of base64 string : 이걸 다시 
               var userId = postParsedQuery.userId;
               var imgPath_Array;
               var base64_Array = new Array();
               var query = {userId : userId};
               var projection = {imgList : 1};
               var cursor = gallery_collection.collection.find(query,projection);
               var result_json = "imgList : [ "
               for(let doc = await cursor.next(); doc!=null; doc = await cursor.next()){
                   try{
                       if(doc!=null){
                           imgPath_Array = doc.imgList;
                           for(var i= await 0;i<imgPath_Array.length; await i++){
                               var item = ""+path2base64(imgPath_Array[i]);
                               item = String(item);
                               base64_Array[i] = await "{name : \"" + item+ "\"}";
                           }
                           //console.log(base64_Array)
                           result_json = "{imgList :["+base64_Array+"]}"; //다시 잘보자 
                           console.log("Completely load images");
                           response.end(result_json);
                       }
                       else{
                           response.writeHead(404, {'Content-Type':'text/html'});
                           response.end("no images in gallery");
                       }
                   }
                   catch(err){
                       console.log(err);
                   }
               }
               break;

            case "add_image" :
                // Request 는 POST 형식으로 tag = "add_image", userId = "id",img = byte[], filename = "filename" 으로 옴
                var userId = postParsedQuery.userId;
                var base_string = postParsedQuery.img;
                var filename = postParsedQuery.filename;
                var path = '/home/serverserver/images/';
               var jsonObj;
                path = path + filename;
                var bitmap = new Buffer.alloc(base_string.length,base_string,'base64');
                if(fs.existsSync(path)){
                    jsonObj = await {"result" : "file_name already exists"};
                    console.log("exists!")
                    response.end(JSON.stringify(jsoanObj))
                }
                else{
                    fs.appendFile(path, bitmap,async function(err){
                        if(err){
                            console.log(err);
                            await response.end(err);
                        }
                        else{
                            console.log("Completely add image")
                            update2gallery(userId,path,ADD);
                           jsonObj = await {"result" : "complete"};
                            await response.end(JSON.stringify(jsonObj));
                        }
                        console.log("append")
                    })
                }
                break;

            case "delete_image" : 
                //Request로 userId와 index가 넘어옴. 
                var userId = postParsedQuery.userId;
                var index = parseInt(postParsedQuery.index);
                var query = {userId : userId};
                var cursor = gallery_collection.collection.find(query)
                var imgPath;
                for(let doc = await cursor.next(); doc!=null; doc = await cursor.next()){
                    imgPath = doc.imgList[index];
                }
                fs.unlink(imgPath,async function(err){
                    if(err){
                        await response.writeHead(404, {'Content-Type':'text/html'});
                        await response.end("error : " + err);
                    }
                });
                await update2gallery(userId,imgPath,DELETE);
                console.log("Completely delete image");
                var json_result = await {result : 'Completely deleted'}; 
                response.end(JSON.stringify(json_result));
                break;
            case "chat" :
                //Request로 sentence (String) 받음
                var result_sentence;
                var sentence = postParsedQuery.sentence;
                var PythonShell = require('python-shell')

                var options = {
                    mode: 'text',
                    pythonPath: "/usr/bin/python3",    //ubuntu path
                    pythonOptions: ['-u'],
                    scriptPath: '/home/serverserver/model/seq2seq-chatbot-master',
                    //args: [user_data.title, user_data.content, json_data, user_data.from_email, user_data.pw] //이거는 고민해봐야함
                    args : [sentence]
                };
                 var pyshell = new PythonShell('main_simple_seq2seq.py',options)
                await PythonShell.run("main_simple_seq2seq.py", options, function(err){
                    if(err) console.log('------------err msg : ', err);
                });
                await pyshell.on('message',async function(message){
                    result_sentence = await "{sentence : [ {message : \"" + message + "\"}]}"
                    console.log("bot : "+message);
        response.end(result_sentence);
                });
                await pyshell.end(function (err,code,signal) {
                    console.log("py_Shell : end")
                    //if (err) throw err;
                    console.log('The exit code was: ' + code);
                    console.log('The exit signal was: ' + signal);
                    console.log('finished');
                    console.log('finished');
                });
   
        }
    });
});

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

    while(await cursor.hasNext()){
        try{
            let doc = await cursor.next();
            if(doc.password == await postParsedQuery.password && doc!=null){
                check = LOGIN;
                break;
            }
            else if(doc!= null){
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

async function update2gallery(id,path,tag){
    var cursor = await gallery_collection.collection.find({userId:id});
    for(let doc = await cursor.next(); doc!=null; doc = await cursor.next()){
        try{
            if(doc!=null){ 
                var update_imgList = await doc.imgList;
                if(tag == ADD) await update_imgList.push(path);
                if(tag == DELETE) await update_imgList.splice(update_imgList.indexOf(path),1);
                console.log("New imgList is : " + update_imgList);
                await gallery_collection.collection.update({userId : id},{$set : {imgList : update_imgList}});
            }
        }
        catch(err){
            console.log(err);
        }
    } 
}

function path2base64(path){
    let buff = fs.readFileSync(path);
    let base64data = buff.toString('base64')
    return base64data;
}
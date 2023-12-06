// server.js
// MongoDB와 관련된 라이브러리 및 정보 설정
const mongoclient=require("mongodb").MongoClient;
const ObjId = require('mongodb').ObjectId;
const url=
'mongodb+srv://sja06075:1234@cluster0.hukvfhc.mongodb.net/?retryWrites=true&w=majority';
let mydb;
// MongoDB에 연결하고 서버 실행
mongoclient
    .connect(url)
    .then((client)=>{
        mydb=client.db("myboard");
        app.listen(8080, function (){
            console.log("port 8080에서 서버 대기중...");
        });
    })
    .catch((err)=>{
        console.log(err);
    });

// MySQL과 관련된 라이브러리 및 정보 설정
var mysql=require("mysql2");
var conn=mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"1234",
    port:3306,
    database:"myboard",
});
conn.connect();

// Express 애플리케이션 설정
const express=require('express');
const app=express();
const sha=require('sha256');
let cookieParser=require('cookie-parser');
app.use(cookieParser('safahrr3h4328fa'));
const multer = require('multer');
const fs = require('fs');
app.use(express.static('public'));
const bodyParser=require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs').__express)
const storage = multer.memoryStorage(); // 업로드된 파일을 메모리에 저장
const upload = multer({ storage: storage });
let session=require('express-session');

// Express 애플리케이션에 세션 미들웨어 추가
app.use(session({
    secret : '3427489dsnf324',
    resave : false,
    saveUninitialized : true
}))

// 인덱스 페이지 라우트
app.get("/", function (req, res) {
    console.log("로그아웃");
    req.session.destroy();
    res.render('index.ejs', {user : null});
});

// 회원가입 페이지 라우트
app.get("/signup", function (req, res) {
    res.render("signup.ejs")
});

// 회원가입 처리 라우트
app.post("/signup", function (req, res) {
    console.log(req.body.userid);
    console.log(req.body.userpw);
    console.log(req.body.usergroup);
    console.log(req.body.useremail);
    // MongoDB에 회원 정보 추가
    mydb
    .collection("account")
    .insertOne({
        userid : req.body.userid,
        userpw : sha(req.body.userpw), 
        usergroup : req.body.usergroup,
        useremail : req.body.useremail,})
    .then((result)=>{
        console.log("회원가입 성공");
    });
    // 회원가입 후 인덱스 페이지로 리다이렉트
    res.redirect("/");
});

// 로그인 페이지 라우트
app.get("/login", function (req, res) {
    console.log(req.session);
    if(req.session.user){
        console.log('세션 유지');
        res.render('index.ejs', {user : req.session.user});
    }else{
        res.render('login.ejs');
    }
    
});

// 로그인 처리 라우트
app.post("/login", function (req, res) {  
    mydb.collection('account').findOne({ userid: req.body.userid})
    .then(result => {
        if(result.userpw==sha(req.body.userpw)){
            req.session.user=req.body;
            console.log('새로운 로그인');
            res.render('index.ejs',{user: req.session.user});
        }else{
            res.render('login.ejs');
        }
        
    });
});

// 친구 추가 창을 렌더링하는 라우트
app.get('/addfriend', function(req, res) {
    if (req.session.user) {
        res.render('addfriend.ejs', { user: req.session.user });
    } else {
        res.render('login.ejs');
    }
});

// 친구 추가 라우트
app.post('/addfriend', function(req, res) {
    const userId = req.session.user.userid; // 현재 로그인한 사용자 아이디
    const friendId = req.body.friendId; // 추가할 친구의 아이디
    // 친구 관계를 저장
    mydb
    .collection("friends")
    .insertOne({
        userId: userId,
        friendId: friendId,
    }).then(result => {
        console.log('친구 추가 성공');
        res.redirect('/login');
    }).catch(error => {
        console.error('친구 추가 실패', error);
        res.status(500).send('친구 추가 실패');
    });
});

// 친구 목록을 보여주는 라우트
app.get('/friendlist', function(req, res) {
    if (req.session.user) {
        mydb.collection('friends').find({ userId: req.session.user.userid }).toArray()
            .then(result => {
                res.render('friendlist.ejs', { data: result, user: req.session.user });
            })
            .catch(error => {
                console.error(error);
                res.status(500).send('친구 목록을 가져오는데 실패했습니다.');
            });
    } else {
        res.render('login.ejs');
    }
});

// 친구 삭제하는 라우트
app.post("/deletefriend", function (req, res) {
    console.log(req.body);
    req.body._id = new ObjId(req.body._id);
    mydb.collection('friends').deleteOne(req.body)
    .then(result=>{
        console.log('삭 제 완 료 ');
        res.status(200).send();
    })
    .catch(err =>{
        console.log(err);
        res.status(500).send();
    });
});

// MongoDB에서 데이터를 가져와서 렌더링하여 보여주는 라우트
app.get("/listmongo", function (req, res) {
    if (req.session.user) {
        mydb.collection('post').find().toArray().then(result => {
            console.log(result);
            res.render('list_mongo.ejs', { data: result, user: req.session.user });
        })
    } else {
        res.render('login.ejs');
    }
});

// MongoDB에서 데이터 삭제하는 라우트
app.post("/delete", function (req, res) {
    console.log(req.body);
    req.body._id = new ObjId(req.body._id);
    mydb.collection('post').deleteOne(req.body)
    .then(result=>{
        console.log('삭 제 완 료 ');
        res.status(200).send();
    })
    .catch(err =>{
        console.log(err);
        res.status(500).send();
    });
});

// MongoDB 폼 입력을 받는 페이지로 이동하는 라우트
app.get('/entermongo', function(req, res){
    if(req.session.user){
        console.log('세션 유지');
        res.render('enter.ejs');
    }else{
        res.render('login.ejs');
    }
});

// MongoDB에 데이터 저장하는 라우트
app.post('/savemongo', upload.single('file'), function(req, res) {
    console.log(req.body.title);
    console.log(req.body.content);
    let fileContent = ''; // 파일 내용을 저장할 변수
    let fileType = ''; // 파일 MIME 타입을 저장할 변수
    // 만약 파일이 업로드되었다면
    if (req.file) {
        fileContent = req.file.buffer; // 파일 내용 읽기
        fileType = req.file.mimetype; // 파일 MIME 타입 읽기
    }
    // 이미지 파일이면
    if (fileType && fileType.startsWith('image/')) {
        mydb.collection('post').insertOne({
            userid: req.session.user.userid,
            title: req.body.title,
            content: req.body.content,
            date: req.body.someDate,
            fileContent: fileContent,
            fileType: fileType
        }).then(result => {
            console.log(result);
            console.log('데이터 추가 성공');
            res.redirect('/listmongo');
        }).catch(error => {
            console.error(error);
            res.status(500).send('데이터 추가 실패');
        });
    }
    // 텍스트 파일이면 content에 합쳐서 내용이 나오게 함
    else {
        mydb.collection('post').insertOne({
            userid: req.session.user.userid,
            title: req.body.title,
            content: req.body.content + '\n\n' + fileContent, // 텍스트 내용과 파일 내용 결합
            date: req.body.someDate,
            fileContent: fileContent,
            fileType: fileType
        }).then(result => {
            console.log(result);
            console.log('데이터 추가 성공');
            res.redirect('/listmongo');
        }).catch(error => {
            console.error(error);
            res.status(500).send('데이터 추가 실패');
        });
    }
});

// 컨텐츠 페이지 라우트
app.get("/content/:id", function (req, res) {
    console.log(req.params.id);
    let new_id=new ObjId(req.params.id);
    mydb.collection('post').findOne({ _id: new_id })
        .then(result => {
            console.log(result);
            res.render('content.ejs', { data: result, user: req.session.user });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send();
        });
});

// 편집 페이지 라우트
app.get("/edit/:id", function (req, res) {
    console.log(req.params.id);
    let new_id=new ObjId(req.params.id);
    mydb.collection('post').findOne({ _id: new_id})
    .then(result => {
        console.log(result);
        res.render('edit.ejs', { data : result });
    }).catch(err =>{
        console.log(err);
        res.status(500).send();
    });
});

// 편집 처리 라우트
app.post('/edit', function(req, res){
    console.log(req.body.title);
    console.log(req.body.content);
    let new_id= new ObjId(req.body.id);
    mydb.collection('post').updateOne({_id:new_id},
        {$set: {title : req.body.title, content : req.body.content, date : req.body.someDate}})
        .then(result => {
            console.log('데 이 터 수 정 성 공 ');
            res.redirect('/listmongo');
        });
});


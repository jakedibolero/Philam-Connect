
// (3000, { origins: '*:*'})
const ical = require('ical-generator');
var ip = require('./ip.js');
console.log(ip.ip);
var express = require('express');
var app = express();
var dbname = "philam-connect";
var https = require('https');
var fs = require('fs');
var nodemailer = require('nodemailer');
var port = process.env.PORT || 8080;
var server = https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app)
var io;

var test = server.listen(port);
io =  require('socket.io')(test,{});
var obj = {
  data:[{
  }]
};

var clientObj = {
  data:[{
  }]
};

var bodyParser = require('body-parser');
var mongoClient = require('mongodb').MongoClient;
var url = 'mongodb://jake:jakeisgwapo123@ds241258.mlab.com:41258/philam-connect';
var id = 0;
var crypto = require('crypto');
var Distance = require('geo-distance'); //calculates the distance //

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.use(bodyParser.json());
app.set('view engine','ejs')
app.use('/', express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({extended:false}));

app.get('/', function(req, res){
  res.render('contact.ejs');
});

app.get('/agent_login_route', function(req, res){
  res.render('login.ejs');
});

io.on('connection', socket =>{
  //call request functionality
  socket.on('send-notifications', data=>{
    console.log("Data sent here is : " + JSON.stringify(data) + " and name is " +data.name);

    var clientObjn = {
      id: socket.id,
      username: data.name,
      lat: data.latitude,
      long: data.longitude,
      email:data.email,
      birth:data.birth,
      phone:data.phone
    };

    if(!clientObj.data[1]){
        clientObj.data.push(clientObjn);
      }else if(!clientObj.data.find(x => x.id == socket.id) && !clientObj.data.find(x => x.username == data.username)){
        clientObj.data.push(clientObjn);
      }else{
        console.log(clientObj); 
        clientObj.data.find(x => x.username == data.name).id = socket.id;
      }

    console.log("Object at this point is " + JSON.stringify(clientObj.data));

    //broadcast to agents
    for(var i = 1; i < Object.keys(obj.data).length; i++){
      console.log("Inside obj is " +obj.data[i].id);
      io.to(obj.data[i].id).emit('message', data);
    }
  });

  socket.on('room', data =>{
    var roomID = Math.random().toString(36).substring(2, 13);
    if(data.client){
      var clientN = clientObj.data.find(x=>x.username == data.client);
    }
    
    console.log("Client Object to Agent Value is: " + JSON.stringify(clientN));
    io.to(data.agent).emit('call', {roomID:roomID, clientN:clientN});
    console.log("Client OBJ currently is " +JSON.stringify(clientObj)+ " and data client is " +data.client);
    io.to(clientObj.data.find(x=> x.username == data.client).id).emit('call', roomID);
  });

  //agent functionality that generates and filters object data accordingly to be used later on for guest users
  socket.on('send-location', data =>{
    if(data.type == "agent"){
      var agentObj = {
        id: socket.id,
        username: data.username,
        lat: data.latitude,
        long: data.longitude
      };

      if(!obj.data[1]){
        obj.data.push(agentObj);
      }else if(!obj.data.find(x => x.id == socket.id) && !obj.data.find(x => x.username == data.username)){
        obj.data.push(agentObj);
      }else{
        obj.data.find(x => x.username == data.username).id = socket.id;
      }
      
      io.sockets.emit('guest-view', obj.data);
      console.log("JSON is" +JSON.stringify(obj.data)); 
    }
  });

  //guest functionality that gets all of the object data (agents) and filters based on Distance (set to 5 km threshold by default)
  socket.on('guest-location', data =>{  
    var retVal = {
      data:[{
      }]
    };

    
    var userData = {
      latitude: data.latitude,
      longitude: data.longitude
    };

    for(var i = 1; i < Object.keys(obj.data).length; i++){
      var agentData = {
        latitude: obj.data[i].latitude,
        longitude: obj.data[i].longitude
      };

      if(Distance.between(userData, agentData) <= Distance('500 km')){
        retVal.data.push(obj.data[i]);
      }
    }

    socket.emit('guest-view', retVal.data);
  });
});

app.get('/list_route', function(req ,res){
  
  mongoClient.connect(url, function(err, db){
    if(err) console.log(err);

    
    database = db.db(dbname);
    collection = database.collection("schedules");
    console.log("Req body here is " +req.query.agent);
    collection.find({agent: {$eq: req.query.agent} }).toArray(function(err, result){
      var obj = {
        data:[{
        }]
      };
      if(err) throw err;
      console.log("Size is " +Object.keys(result).length);
      console.log("Result here is " +JSON.stringify(result));
      
      for(var i = 0; i < Object.keys(result).length; i++){
        obj.data.push(result[i]);
      }
      res.render('todo_list.ejs', {obj:obj,username:req.query.username});
    }); 
    
    db.close();

     
  });

});

app.post('/insert', function(req, res){
  console.log("YOW")
  var data = {};
  data.name = req.body.name;
  data.email = req.body.email;
  data.birth = req.body.birth;
  data.phone = req.body.phone;
  data.sched = req.body.schedule;
  data.time = req.body.time;
  data.agent = req.body.agent;

  const mailOptions = {
    from: 'philamconnecthackathon@gmail.com', // sender address
    to: req.body.email, // list of receivers
    subject: 'Philam-Connect Appointment', // Subject line
    html: '<p>Hello '+data.name+'! Thank you for using Philam-Connect! Your schedule for an appointment on '+data.sched+' at '+data.time+' with Adviser '+data.agent+' has been successfully added!</p>'// plain text body
  };
  console.log("Here at insert");
  mongoClient.connect(url, function(err, db){
    if(err) console.log(err);
    

    console.log("Here at mongo");
    database = db.db(dbname);
    collection = database.collection("schedules");
    collection.insertOne(data, function(){
      var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
               user: 'philamconnecthackathon@gmail.com',
               pass: 'PHILAM01'
           }
       });

       transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else
          console.log(info);
       });

       
      console.log("WAW");
      res.send("1");
    });
     
  });
});


app.post('/login', function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  var ret = "0";
  
  var chk = false;

  mongoClient.connect(url, function(err, db){
    if(err) console.log(err);

    
    database = db.db(dbname);
    collection = database.collection("agents");

    collection.find().toArray(function(err, result){
      if(err) throw err;

      var length = Object.keys(result).length;

      console.log(length);
      
      console.log(result);
      for(var i = 0; i < length; i++){
        if(result[i].username == username && result[i].password == password){
          chk = true;
        }
      }

     var data = {};
    data.username = username;

    if(chk){
      res.render('index2.ejs', {data:data});  
    } 
    }); 

    db.close();

     
  });
});

app.post('/register', function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;

  mongoClient.connect(url, function(err, db){
    if(err) console.log(err);
    
    database = db.db(dbname);
    collection = database.collection("users");

    var obj = {
      'username':username,
      'password':password,
      'email':email
    };

    collection.insert(obj, function(err, resu){
      if(err){
        console.log(err);
      }

      res.send("1");
    });

    db.close();
  });
});


app.get('/clientList', function(req, res){
  var data ={};
  data.username = req.query.username;
  res.render("index2.ejs",{data:data});
});

app.get('/clientVideo', function(req, res){
  console.log(req.query.appointmentId);
  res.render("clientVideoTest.ejs",{appointmentId:req.query.appointmentId})
});
app.get('/agentVideo', function(req, res){
  console.log(req.query.appointmentId);
  res.render("agentVideoTest.ejs", {data:req.query});
});


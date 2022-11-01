const express = require("express");
const https=require('https');
const http=require('http');
const fs = require('fs');
const PORT = process.env.PORT;

const jwt = require("jsonwebtoken");
const API_KEY = process.env.API_KEY;
const authorize = require("./authorize.js");
import createUserQuery from "./userAuthentication.js";


//Get certificate and key
const cert_path = './certs/';
const pKey = fs.readFileSync(cert_path + 'selfsigned.key');
const cert = fs.readFileSync(cert_path + 'selfsigned.crt');
const options = {
  key: pKey,
  cert: cert
}

//Declare and initialize server log file
const {Console} = require("console");
const serverLogger = new Console({
    stdout: fs.createWriteStream("./logs/app.log"),
    stderr: fs.createWriteStream("./logs/app_errors.log")
});
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

let db = new sqlite3.Database("./inventory/inventory_v4.db", (err) => {
  if(err) {
    console.log(err.message);
  }
  console.log("connected to the database.");
  
  
});


app.get('/', (req, res) => {
  res.send('SmartInventory API');
})

//get endpoint that will get all assets of inventory
app.get('/display_assets', authorize(API_KEY), (req, res) => {
  let query = 'SELECT * FROM assets'
  
  db.all(query, [], (err, rows) => {
    if(err){
      res.status(500);
      throw err;
    }
    else{
      console.log(query);
      res.status(200);
      res.setHeader('Content-Type','application/json');
      res.send(JSON.stringify(rows));
    }
  });
})

//get endpoint to get items with specific asset id's
app.get('/get_assets', authorize(API_KEY), (req, res) => {
  if(!validateRequestParams(req.body, ["asset_id"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    res.send({
      "Response Message" : "Invalid Request Body"
    });
    return
  }
  console.log("Processing Request...");
  var query = `SELECT * FROM assets WHERE asset_id in(${req.body["asset_id"].toString()})`;
  db.all(query, [], (err, rows) => {
    if(err){
      res.status(500);
      res.send([])
      throw err;
    }
    else{
      console.log(query);
      res.status(200);
      res.setHeader('Content-Type','application/json');
      res.json(rows);
    }
  });
    
});

/*
  END POINT THAT HANDLES GETTING THE INFORMATION FROM THE CHECKOUT TABLE

*/
app.get('/getCheckouts', authorize(API_KEY), (req, res) => {
  let query = "SELECT * FROM checkout";
  
  let results = dbQuery(query);
  if(results != null){
    res.status(500)
    return res.json({
      status: 500,
      message: "Couldn't process your request. Server Error."
    })
  } else{
    res.status(200);
    res.setHeader('Content-Type','application/json');
    res.json(results);
  }
})

app.post('/validatePassword', authorize(API_KEY), (req, res) => {
  //const {userID, pass} = req.body
  var userID = req.query.username;
  var pass = req.query.password;
  //var body = req.body
  let InsertQuery = createUserQuery(userID, pass, 1);
  console.log("username: "+ userID + " password: " + pass);
  db.all(`SELECT * FROM users WHERE user_name = "${userID}" AND user_pass_secure = "${pass}"`, (err, rows) => {
    if(err) {
      res.status(500)
      return res.json({
        status: 500,
        message: "Couldn't process your request. Server Error."
      })
    }
    if(rows.length > 0) {
      console.log(rows)
      return res.send({validation: true})
    } else {
      return res.send({validation: false})
    }
  });
});


  
// var server = https.createServer(options, app);

// server.listen(PORT, () => {
//   console.log('Your app is listening on port ' + PORT);
// })


let validateRequestParams = (body, params) => {
  let result = true;
  for(let i = 0; i < params.length; i++){
    if(!body.hasOwnProperty(params[i])){
      result = false
      break;
    }
  }
  return result;
}

//Query function that returns are rows from result
let dbQuery = (query_string, res, req) => {
  console.log(query_string);
  db.all(query_string, [], (err, rows) => {
    if(err){
      console.log(err);
      return null;
    }
    else{
      //if()
      return rows;
    }
  });
}

app.listen(PORT, () => {
  console.log('Your app is listening on port ' + PORT);
})



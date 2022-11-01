const express = require("express");
const https=require('https');
const http=require('http');
const fs = require('fs');

const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;
const authorize = require("./authentication/authorize.js");
const {createUserQuery, verifyUserQuery} = require("./authentication/user_authentication.js");


//Get certificate and key
const cert_path = './certs/';
const pKey = fs.readFileSync(cert_path + 'selfsigned.key');
const cert = fs.readFileSync(cert_path + 'selfsigned.crt');
const options = {
  key: pKey,
  cert: cert
}

//Declare and initialize server log file
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

const Database = require('better-sqlite3');
const db = new Database("./inventory/inventory_v5.db", { verbose: console.log });



app.get('/', (req, res) => {
  res.send('SmartInventory API');
})

//get endpoint that will get all assets of inventory
app.get('/assets/display_assets', authorize(API_KEY), (req, res) => {
  let query = 'SELECT * FROM assets'
  
  try{
    const stmt = db.prepare(query)
    const results = stmt.all()
    //console.log(query);
    res.status(200);
    res.setHeader('Content-Type','application/json');
    res.json(results);
  } 
  catch (err){
    console.log(err)
    return res.send("error")
    res.status(500);
    res.send({
      "status" : 500,
      "message": "Server error"
    });
  }
})

//get endpoint to get items with specific asset id's
app.get('/assets/get_assets', authorize(API_KEY), (req, res) => {
  if(!validateRequestParams(req.body, ["asset_id"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid Request Body"
    });
    
  }
  console.log("Processing Request...");
  var query = `SELECT * FROM assets WHERE asset_id in(${req.body["asset_id"].toString()})`;
  try{
    const stmt = db.prepare(query)
    const results = stmt.all()
    //console.log(query);
    res.status(200);
    res.setHeader('Content-Type','application/json');
    res.json(results);
  } 
  catch (err){
    console.log(err)
    return res.send("error")
    res.status(500);
    res.send({
      "status" : 500,
      "message": "Server error"
    });
  }
  // db.all(query, [], (err, rows) => {
  //   if(err){
  //     res.status(500);
  //     res.setHeader('Content-Type','application/json');
  //     res.send({
  //       "status" : 500,
  //       "message": "Server error"
  //     });
  //     return
  //   }
  //   else{
  //     console.log(query);
  //     res.status(200);
  //     res.setHeader('Content-Type','application/json');
  //     res.json(rows);
  //   }
  // });
    
});

/*
  END POINT THAT HANDLES GETTING THE INFORMATION FROM THE CHECKOUT TABLE

*/
app.get('/checkout/getCheckouts', authorize(API_KEY), (req, res) => {
  let query = "SELECT * FROM checkout";
  
  try{
    const stmt = db.prepare(query)
    const results = stmt.all()
    //console.log(query);
    res.status(200);
    res.setHeader('Content-Type','application/json');
    res.json(results);
  } 
  catch (err){
    console.log(err)
    return res.send("error")
    res.status(500);
    res.send({
      "status" : 500,
      "message": "Server error"
    });
  }
})

app.get('/users/validateUser', authorize(API_KEY), (req, res) => {
  if(!validateRequestParams(req.body, ["username","password"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    res.send({
      "status" : 400,
      "message": "Invalid Request Body"
    });
    return
  }
  var user_name = req.body["username"];
  var pass = req.body["password"];
  //console.log(check_exists)
  let grab_hash_query = `SELECT salt FROM users WHERE user_name = '${user_name}'`
  let user_salt;
  try{
    const validate_stmt = db.prepare(grab_hash_query)
    const results = validate_stmt.get()
    user_salt = results["salt"];
  } 
  catch (err){
    console.log(err)
    return res.send("error")
    res.status(500);
    res.json({
      "status" : 500,
      "message": "Server error"
    });
  }
  
  //********************************************
  let validate_query = verifyUserQuery(user_name, pass, user_salt);
  console.log(validate_query)
  try{
    const validate_stmt = db.prepare(validate_query)
    const results = validate_stmt.all()
    res.status(200);
    res.setHeader('Content-Type','application/json');
    res.json(results);
  } 
  catch (err){
    console.log(err)
    return res.send("error")
    res.status(500);
    res.json({
      "status" : 500,
      "message": "Server error"
    });
  }
});

app.post('/users/newUser', authorize(API_KEY), (req, res) => {
  if(!validateRequestParams(req.body, ["username","password","user_type"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    res.send({
      "status" : 400,
      "message": "Invalid Request Body"
    });
    return
  }
  //Get variables from body payload
  var user_name = req.body["username"];
  var pass = req.body["password"];
  var user_type = req.body["user_type"]
  
  //Query
  let InsertQuery = createUserQuery(user_name, pass, user_type);
  console.log("InsertQuery: "+InsertQuery);
  try{
    const InsertQuery_stmt = db.prepare(InsertQuery)
    const results_info = InsertQuery_stmt.run()
    res.status(200);
    res.setHeader('Content-Type','application/json');
    res.json(results_info);
  } 
  catch (err){
    console.log(err)
    return res.send("error")
    res.status(500);
    res.json({
      "status" : 500,
      "message": "Server error"
    });
  }
});




const validateRequestParams = (body, params) => {
  let result = true;
  for(let i = 0; i < params.length; i++){
    if(!body.hasOwnProperty(params[i])){
      result = false
      break;
    }
  }
  return result;
}

app.listen(PORT, () => {
  console.log('Your app is listening on port ' + PORT);
})



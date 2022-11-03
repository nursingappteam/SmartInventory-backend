const express = require("express");
// const https=require('https');
// const http=require('http');
const fs = require('fs');

const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;
const authorize = require("./authentication/authorize.js");
const {createUserQuery, verifyUserQuery, getUserQuery} = require("./authentication/user_authentication.js");


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

const app = express();
app.use(cors());
app.use(express.json());

const Database = require('better-sqlite3');
const db = new Database("./inventory/inventory_v5.db", { verbose: console.log });
const {generalQuery, createInsertCheckoutsQuery} = require("./inventory/database_manager.js");



app.get('/', (req, res) => {
  res.send('SmartInventory API');
})

//get endpoint that will get all assets of inventory
app.get('/assets/display_assets', authorize(API_KEY), (req, res) => {
  let query = 'SELECT * FROM assets'

  let results = generalQuery(db, query)
  console.log(results)
  if(results["code"] == "SQLITE_ERROR"){
    res.status(500)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 500,
      message: "Server error",
      error: results
    });
  }
  res.status(200);
  res.setHeader('Content-Type','application/json');
  res.json(results);
  
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
  var query = `SELECT * FROM assets WHERE asset_id in(${req.body["asset_id"].toString()})`;
  let results = generalQuery(db, query)
  //console.log(results)
  if(results["code"] == "SQLITE_ERROR"){
    res.status(500)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 500,
      message: "Server error",
      error: results
    });
  }
  res.status(200);
  res.setHeader('Content-Type','application/json');
  res.json(results);
    
});

/*
  END POINT THAT HANDLES GETTING THE INFORMATION FROM THE CHECKOUT TABLE

*/
app.get('/checkout/getCheckouts', authorize(API_KEY), (req, res) => {
  let query = "SELECT * FROM checkout";
  
  let results = generalQuery(db, query)
  console.log(results)
  if(results["code"] == "SQLITE_ERROR"){
    res.status(500)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 500,
      message: "Server error",
      error: results
    });
  }
  res.status(200);
  res.setHeader('Content-Type','application/json');
  res.json(results);
})

app.post('/checkout/newCheckkout', authorize(API_KEY), (req, res) => {
  if(!validateRequestParams(req.body, ["asset_id","start_date","end_date","user_id"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    return res.send({
      "status" : 400,
      "message": "Invalid Request Body"
    });
  }
  let asset_id = req.body["asset_id"];
  let start_date = req.body["start_date"];
  let end_date = req.body["end_date"];
  let user_id = req.body["user_id"];
  
  let checkout_insert = createInsertCheckoutsQuery(asset_id, start_date, end_date, user_id)
  console.log(checkout_insert)
  let results = generalQuery(db, checkout_insert, "run");
  console.log(checkout_insert)
  if(results["code"] === "SQLITE_ERROR"){
    res.status(500)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 500,
      message: "Server error",
      error: results
    });
  }
  else if(results["code"] === "SQLITE_CONSTRAINT_UNIQUE"){
    res.status(409)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 409,
      message: "Server error",
      error: results
    });
  }
  res.status(201);
  res.setHeader('Content-Type','application/json');
  res.json(results);
  
})

//User endpoints
app.get('/users/getUsers', authorize(API_KEY), (req, res) => {
  let query = "SELECT user_id, user_name, user_type_id, user_enabled, register_date FROM users"
  let results = generalQuery(db, query)
  console.log(results)
  if(results["code"] == "SQLITE_ERROR"){
    res.status(500)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 500,
      message: "Server error",
      error: results
    });
  }
  res.status(200);
  res.setHeader('Content-Type','application/json');
  res.json(results);
})
app.post('/users/validateUser', authorize(API_KEY), (req, res) => {
  if(!validateRequestParams(req.body, ["username","password"])){
    console.log("\n******************\nInvalid or incomplete request");
    console.log(req.body)
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
  let salt_result = generalQuery(db, grab_hash_query, "get")
  console.log("Salt results:"+salt_result)
  if(salt_result == null){
    res.status(404)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status: 404,
      message: "User Not Found"
    })
  }
  if(salt_result["code"] == "SQLITE_ERROR" ){
    console.log(salt_result)
    res.status(500);
    return res.json({
      status : 500,
      message: "Server error",
      error: salt_result
    });
  }
  if(salt_result.length == 0){
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status: 404,
      message: "Invalid Credentials"
    })
  }
  else{
    user_salt = salt_result["salt"]
    //console.log(user_salt)
  }
  //********************************************
  let validate_query = verifyUserQuery(user_name, pass, user_salt);
  let results = generalQuery(db, validate_query)
  console.log(results)
  console.log(validate_query)
  if(results["code"] == "SQLITE_ERROR"){
    res.status(500)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 500,
      message: "Server error",
      error: results
    });
  }
  else if(results.length == 0){
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status: 400,
      message: "Invalid Credentials"
    })
  }
  res.status(200);
  res.setHeader('Content-Type','application/json');
  res.json(results);
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
  let insert_query = createUserQuery(user_name, pass, user_type);
  console.log("InsertQuery: "+insert_query);
  let results = generalQuery(db, insert_query, "run");
  console.log(insert_query)
  if(results["code"] === "SQLITE_ERROR"){
    res.status(500)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 500,
      message: "Server error",
      error: results
    });
  }
  else if(results["code"] === "SQLITE_CONSTRAINT_UNIQUE"){
    res.status(409)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 409,
      message: "Server error",
      error: results
    });
  }
  res.status(201);
  res.setHeader('Content-Type','application/json');
  res.json(results);
});

app.delete('/users/deleteUser',authorize(API_KEY), (req, res) => {
  //Check if user exists before deleting
  var username = req.body["username"];
  let user_query = getUserQuery(username)
  let user_result = generalQuery(db, user_query, "get")
  console.log(user_result)
  if(user_result == null){
    res.status(404)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status: 404,
      message: "User Not Found"
    })
  }
  else if(user_result["code"] === "SQLITE_ERROR"){
    res.status(500)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 500,
      message: "Server error",
      error: user_result
    });
  }
  else if (user_result == []){
    res.status(404)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status: 404,
      message: "User Not Found"
    })
  }
  
  let user_id = user_result["user_id"]
  let delete_query = `DELETE FROM users WHERE user_id = '${user_id}'`;
  let delete_result = generalQuery(db, delete_query, "run");
  console.log(delete_query)
  if(delete_result["code"] === "SQLITE_ERROR"){
    res.status(500)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 500,
      message: "Server error",
      error: delete_result
    });
  }
  else if(delete_result["code"] === "SQLITE_CONSTRAINT_UNIQUE"){
    res.status(409)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status : 409,
      message: "Server error",
      error: delete_result
    });
  }
  res.status(201);
  res.setHeader('Content-Type','application/json');
  res.json(delete_result);
})



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



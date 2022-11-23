require('dotenv').config({ path: "./.env" });
const express = require("express");
// const https=require('https');
// const http=require('http');
const fs = require('fs');

const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;
const authorize = require("./authentication/authorize.js");
const {createUserQuery, validate_password, getUserQuery} = require("./authentication/user_authentication.js");
//const {checkoutManager} = require("./inventory/checkout_manager.js");


//Get certificate and key
// const cert_path = './certs/';
// const pKey = fs.readFileSync(cert_path + 'selfsigned.key');
// const cert = fs.readFileSync(cert_path + 'selfsigned.crt');
// const options = {
//   key: pKey,
//   cert: cert
// }

//Declare and initialize server log file
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const Database = require('better-sqlite3');
const db = new Database("./inventory/inventory_v5.db", { verbose: console.log });
const {generalQuery, checkoutManager} = require("./inventory/database_manager.js");



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
  END POINTS THAT HANDLES GETTING THE INFORMATION FROM THE CHECKOUT TABLE
  Checkout table has the following columns: checkout_id, asset_id, start_date, due_date, user_id, approval_status, checkout_notes, return_date, available

  approval_status: 0 = pending, 1 = approved, 2 = denied
  return_status: 0 = pending, 1 = returned
  available: 0 = assets are locked, 1 = assets are available

*/
app.get('/checkout/getCheckouts', authorize(API_KEY), (req, res) => {
  //Validate request body: must have asset_id, start_date, end_date where asset_id is an array of asset_id's
  if(!validateRequestParams(req.body, ["asset_id", "start_date", "end_date"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid Request Body"
    }); 
  }
  //Validate date format
  if(!validateDate(req.body["start_date"]) || !validateDate(req.body["end_date"])){
    console.log("Invalid date format");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid date format"
    }); 
  }
  //Validate asset_id array
  if(!Array.isArray(req.body["asset_id"])){
    console.log("Invalid asset_id format");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid asset_id format"
    }); 
  }
  
  //Get checkout information using checkoutManager
  let results = checkoutManager.getCheckoutByAssetId(db, req.body["asset_id"], req.body["start_date"], req.body["end_date"]);
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

//endpoint to create new checkout record
app.post('/checkout/createCheckout', authorize(API_KEY), (req, res) => {
  //Validate request body: must have asset_id, start_date, end_date where asset_id is an array of asset_id's
  if(!validateRequestParams(req.body, ["asset_id", "start_date", "end_date", "user_id"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid Request Body"
    }); 
  }
  //Validate date format
  if(!validateDate(req.body["start_date"]) || !validateDate(req.body["end_date"])){
    console.log("Invalid date format");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid date format"
    }); 
  }
  //Validate asset_id array
  if(!Array.isArray(req.body["asset_id"])){
    console.log("Invalid asset_id format");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid asset_id format"
    }); 
  }

  //Create checkout record using checkoutManager
  let results = checkoutManager.insertCheckout(db, req.body["asset_id"], req.body["start_date"], req.body["end_date"], req.body["user_id"]);
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

//update checkout entry
app.put('/checkout/updateCheckout', authorize(API_KEY), (req, res) => {
  //Validate request body: must have asset_id, start_date, end_date where asset_id is an array of asset_id's
  if(!validateRequestParams(req.body, ["asset_id", "start_date", "end_date", "user_id"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid Request Body"
    }); 
  }
  //Validate date format
  if(!validateDate(req.body["start_date"]) || !validateDate(req.body["end_date"])){
    console.log("Invalid date format");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid date format"
    }); 
  }
  //Validate asset_id array
  if(!Array.isArray(req.body["asset_id"])){
    console.log("Invalid asset_id format");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid asset_id format"
    }); 
  }

  //Update checkout record using checkoutManager
  //Default values to fill by 0 for approval status null for checkout_notes, null for return date, and 1 for available
  let results = checkoutManager.updateCheckout(db, req.body["asset_id"], req.body["start_date"], req.body["end_date"], req.body["user_id"], 0, null, null, 1);
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

//approve checkout entry
app.put('/checkout/approveCheckout', authorize(API_KEY), (req, res) => {
  //Validate request body: must have an array of checkout_id's to approve
  if(!validateRequestParams(req.body, ["checkout_id"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid Request Body"
    }); 
  }
  //Validate checkout_id array
  if(!Array.isArray(req.body["checkout_id"])){
    console.log("Invalid checkout_id format");
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      "status" : 400,
      "message": "Invalid checkout_id format"
    }); 
  }

  //Approve checkout record using checkoutManager
  let results = checkoutManager.approveCheckout(db, req.body["checkout_id"]);
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

//get all checkout entries
app.get('/checkout/getAllCheckouts', authorize(API_KEY), (req, res) => {
  //Get all checkout records using checkoutManager
  let results = checkoutManager.getAllCheckouts(db);
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


//User endpoints
app.get('/users/getUsers', authorize(API_KEY), (req, res) => {
  let query = "SELECT user_id, user_email, user_name, user_type_id, user_enabled, register_date FROM users"
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
  let grab_hash_query = `SELECT user_pass_secure FROM users WHERE user_name = '${user_name}'`
  let user_hash;
  let hash_result = generalQuery(db, grab_hash_query, "get")
  //console.log("hash results:"+JSON.stringify(hash_result))
  if(hash_result == null){
    res.status(404)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status: 404,
      message: "User Not Found"
    })
  }
  if(hash_result["code"] == "SQLITE_ERROR" ){
    console.log(hash_result)
    res.status(500);
    return res.json({
      status : 500,
      message: "Server error",
      error: hash_result
    });
  }
  if(hash_result.length == 0){
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status: 404,
      message: "Invalid Credentials"
    })
  }
  else{
    user_hash = hash_result["user_pass_secure"]
    console.log(user_hash)
  }
  //********************************************
  let validate_password_result = validate_password(pass, user_hash);
  //if validate_password_result is true, then the password is valid
  if(validate_password_result){
    let grab_user_query = `SELECT user_id, user_email, user_name, user_type_id, user_enabled, register_date FROM users WHERE user_name = '${user_name}'`
    let user_result = generalQuery(db, grab_user_query, "get")
    console.log(user_result)
    if(user_result["code"] == "SQLITE_ERROR" ){
      console
      res.status(500);
      return res.json({
        status : 500,
        message: "Server error",
        error: user_result
      });
    }
    if(user_result.length == 0){
      res.status(400)
      res.setHeader('Content-Type','application/json');
      return res.json({
        status: 404,
        message: "Invalid Credentials"
      })
    }
    else{
      res.status(200);
      res.setHeader('Content-Type','application/json');
      return res.json(user_result)
    }
  }
  else{
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status: 404,
      message: "Invalid Credentials"
    })
  }
})



app.post('/users/newUser', authorize(API_KEY), (req, res) => {
  if(!validateRequestParams(req.body, ["username","password","user_type", "user_email"])){
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
  var user_email = req.body["user_email"];
  var pass = req.body["password"];
  var user_type = req.body["user_type"]
  //log the request
  console.log("New User Request: "+user_name+" "+user_email+" "+pass+" "+user_type)
  let check_exists = `SELECT user_id FROM users WHERE user_name = '${user_name}'`
  let check_exists_result = generalQuery(db, check_exists, "get")
  console.log("check: "+check_exists_result)
  //check if user already exists
  if(check_exists_result == null){
    
  }
  else if(check_exists_result.length > 0){
    res.status(400)
    res.setHeader('Content-Type','application/json');
    return res.json({
      status: 400,
      message: "User already exists"
    })
  }
  //********************************************
  //Get insert query using createUserQuery function
  let insert_query = createUserQuery(user_name, pass, user_email, user_type)
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

//function to validate date for sqlite datetime format YYYY-MM-DD HH:MM:SS
const validateDate = (date) => {
  let date_regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  return date_regex.test(date);
}



app.listen(PORT, () => {
  console.log('Your app is listening on port ' + PORT);
})



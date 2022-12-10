require("dotenv").config({ path: "./.env" });
const express = require("express");
const session = require("express-session");

// const https=require('https');
// const http=require('http');
const fs = require("fs");

//Get environment variables
const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;
const SESSION_SECRET = process.env.SESSION_SECRET;

const authorize = require("./authentication/authorize.js");
const {
  createUserQuery,
  validate_password,
  getUserQuery,
  resetPasswordQuery,
  createUserSession,
} = require("./authentication/user_authentication.js");
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

const {
  generalQuery,
  initializeDatabase,
  checkoutManager,
  sessionManager,
} = require("./inventory/database_manager.js");

const Database = require("better-sqlite3");
const db = new Database("./inventory/inventory_v6.db", {
  verbose: console.log,
});

//initialize database
initializeDatabase(db);
// Use the PRAGMA statement to configure the table schema
db.pragma("synchronous = 1");
db.pragma("journal_mode = wal");

// Create the checkouts table
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS checkouts (
    checkout_id INTEGER PRIMARY KEY,
    asset_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    approval_status INTEGER NOT NULL,
    checkout_notes TEXT NOT NULL,
    return_date TEXT NOT NULL,
    available INTEGER NOT NULL
  )
`
).run();

//Store session data in database
//const SqliteStore = require("better-sqlite3-session-store")(session)

app.get("/", (req, res) => {
  res.send("SmartInventory API");
});

//get endpoint that will get all assets of inventory
app.get("/assets/display_assets", authorize(API_KEY), (req, res) => {
  let query = "SELECT * FROM assets";

  let results = generalQuery(db, query);
  console.log(results);
  if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

//get endpoint to get items with specific asset id's
app.get("/assets/get_assets", authorize(API_KEY), (req, res) => {
  if (!validateRequestParams(req.body, ["asset_id"])) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid Request Body",
    });
  }
  var query = `SELECT * FROM assets WHERE asset_id in(${req.body[
    "asset_id"
  ].toString()})`;
  let results = generalQuery(db, query);
  //console.log(results)
  if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

// post endpoint for updating assets
app.post("/assets/update", authorize(API_KEY), (req, res) => {
  if (
    !validateRequestParams(req.body.values, [
      "asset_id",
      "cust_dept_desc",
      "acquisition_date",
      "tag_num",
      "tagged",
      "type",
      "sub_type",
      "description",
      "serial_id",
      "acquisition_cost",
      "company",
      "PO_IDS",
      "location",
      "sub_location",
      "building",
    ])
  ) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid Request Body",
    });
  }
  const {
    asset_id,
    cust_dept_desc,
    acquisition_date,
    tag_num,
    tagged,
    type,
    sub_type,
    description,
    serial_id,
    acquisition_cost,
    company,
    PO_IDS,
    location,
    sub_location,
    building,
  } = req.body.values;

  // check if item is on list TODO: change the check form asset ID to barcode
  var searchQ = `SELECT * FROM assets WHERE asset_id = ${asset_id}`;
  const searchRes = generalQuery(db, searchQ, "get");
  if (searchRes["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: searchRes,
    });
  }

  var updateQ = `UPDATE assets 
  SET asset_id = ${asset_id},
      cust_dept_desc = '${cust_dept_desc}',
      acquisition_date = '${acquisition_date}',
      tag_num = '${tag_num}',
      tagged = '${tagged}',
      type = '${type}',
      sub_type = '${sub_type}',
      description = '${description}',
      serial_id = '${serial_id}',
      acquisition_cost = ${acquisition_cost},
      company = '${company}',
      PO_IDS = '${PO_IDS}',
      location = '${location}',
      sub_location = '${sub_location}',
      building = '${building}' 
  WHERE asset_id = '${asset_id}'`;
  const updateRes = generalQuery(db, updateQ, "run");
  if (updateRes["code"] === "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: updateRes,
    });
  } else if (updateRes["code"] === "SQLITE_CONSTRAINT_UNIQUE") {
    res.status(409);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 409,
      message: "Server error",
      error: updateRes,
    });
  }
  console.log("Asset # " + asset_id + " Updated");
  res.status(200);
  return res.json({
    status: 200,
    message: "Asset Updated",
  });
});

// post endpoint for adding assets
app.post("/assets/add", authorize(API_KEY), (req, res) => {
  if (
    !validateRequestParams(req.body.values, [
      "cust_dept_desc",
      "tag_num",
      "tagged",
      "type",
      "sub_type",
      "description",
      "serial_id",
      "acquisition_cost",
      "company",
      "PO_IDS",
      "location",
      "sub_location",
      "building",
      "acquisition_date",
    ])
  ) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid Request Body",
    });
  }
  console.log(req.body.values);
  const {
    cust_dept_desc,
    tag_num,
    tagged,
    type,
    sub_type,
    description,
    serial_id,
    acquisition_cost,
    company,
    PO_IDS,
    location,
    sub_location,
    building,
    acquisition_date,
  } = req.body.values;

  //TODO: Check to make sure assets order lines up
  var insertQ = `INSERT INTO assets 
  VALUES (null , null,
       '${cust_dept_desc}',
       '${tag_num}',
       '${tagged}',
       '${type}',
       '${sub_type}',
       '${description}',
       '${serial_id}',
        ${acquisition_cost},
       '${company}',
       '${PO_IDS}',
       '${location}',
       '${sub_location}',
       '${building}',
       '${acquisition_date}')`;
  console.log(insertQ);

  const insertRes = generalQuery(db, insertQ, "run");
  if (insertRes["code"] === "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: insertRes,
    });
  } else if (insertRes["code"] === "SQLITE_CONSTRAINT_UNIQUE") {
    res.status(409);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 409,
      message: "Server error",
      error: insertRes,
    });
  }
  console.log("Asset Added");
  res.status(200);
  return res.json({
    status: 200,
    message: "Asset Added",
  });
});
/*
  END POINTS THAT HANDLES GETTING THE INFORMATION FROM THE CHECKOUT TABLE
  Checkout table has the following columns: checkout_id, asset_id, start_date, due_date, user_id, approval_status, checkout_notes, return_date, available

  approval_status: 0 = pending, 1 = approved, 2 = denied
  return_status: 0 = pending, 1 = returned
  available: 0 = assets are locked, 1 = assets are available

*/
app.get("/checkout/getCheckouts", authorize(API_KEY), (req, res) => {
  //Validate request body: must have asset_id, start_date, end_date where asset_id is an array of asset_id's
  if (
    !validateRequestParams(req.body, ["asset_id", "start_date", "end_date"])
  ) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid Request Body",
    });
  }
  //Validate date format
  if (
    !validateDate(req.body["start_date"]) ||
    !validateDate(req.body["end_date"])
  ) {
    console.log("Invalid date format");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid date format",
    });
  }
  //Validate asset_id array
  if (!Array.isArray(req.body["asset_id"])) {
    console.log("Invalid asset_id format");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid asset_id format",
    });
  }

  //Get checkout information using checkoutManager
  let results = checkoutManager.getCheckoutByAssetId(
    db,
    req.body["asset_id"],
    req.body["start_date"],
    req.body["end_date"]
  );
  if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

//endpoint to create new checkout record
app.post("/checkout/createCheckout", authorize(API_KEY), (req, res) => {
  //Validate request body: must have asset_id, start_date, end_date where asset_id is an array of asset_id's
  if (
    !validateRequestParams(req.body, [
      "asset_id",
      "start_date",
      "end_date",
      "user_id",
    ])
  ) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid Request Body",
    });
  }

  //Validate date format
  if (
    !validateDate(req.body["start_date"]) ||
    !validateDate(req.body["end_date"])
  ) {
    console.log("Invalid date format");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid date format",
    });
  }
  //Validate asset_id array
  if (!Array.isArray(req.body["asset_id"])) {
    console.log("Invalid asset_id format");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid asset_id format",
    });
  }
  //get request body
  let asset_id = req.body["asset_id"];
  let start_date = req.body["start_date"];
  let end_date = req.body["end_date"];
  let user_id = req.body["user_id"];

  //insert checkout record
  let results = checkoutManager.insertCheckout(
    db,
    asset_id,
    start_date,
    end_date,
    user_id
  );

  console.log("results: ", results);
  if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

//update checkout entry
app.put("/checkout/updateCheckout", authorize(API_KEY), (req, res) => {
  //Validate request body: must have asset_id, start_date, end_date where asset_id is an array of asset_id's
  if (
    !validateRequestParams(req.body, [
      "asset_id",
      "start_date",
      "end_date",
      "user_id",
    ])
  ) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid Request Body",
    });
  }
  //Validate date format
  if (
    !validateDate(req.body["start_date"]) ||
    !validateDate(req.body["end_date"])
  ) {
    console.log("Invalid date format");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid date format",
    });
  }
  //Validate asset_id array
  if (!Array.isArray(req.body["asset_id"])) {
    console.log("Invalid asset_id format");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid asset_id format",
    });
  }

  //Update checkout record using checkoutManager
  //Default values to fill by 0 for approval status null for checkout_notes, null for return date, and 1 for available
  let results = checkoutManager.updateCheckout(
    db,
    req.body["asset_id"],
    req.body["start_date"],
    req.body["end_date"],
    req.body["user_id"],
    0,
    null,
    null,
    1
  );
  if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

//approve checkout entry
app.put("/checkout/approveCheckout", authorize(API_KEY), (req, res) => {
  //Validate request body: must have an array of checkout_id's to approve
  if (!validateRequestParams(req.body, ["checkout_ids"])) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid Request Body",
    });
  }
  //Validate checkout_id array
  if (!Array.isArray(req.body["checkout_ids"])) {
    console.log("Invalid checkout_id format:" + req.body["checkout_ids"]);
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid checkout_id format",
    });
  }

  //Approve checkout record using checkoutManager
  let results = checkoutManager.approveCheckouts(db, req.body["checkout_ids"]);
  if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

//TODO: deny checkout entry

//TODO: get pending checkouts
app.get("/checkout/getPendingCheckouts", authorize(API_KEY), (req, res) => {
  //Get pending checkouts using checkoutManager
  let results = checkoutManager.getAllPendingCheckouts(db);
  if (results == null || results == undefined) {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  } else if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

//Deny multiple checkouts
app.put("/checkout/denyCheckouts", authorize(API_KEY), (req, res) => {
  //Validate request body: must have an array of checkout_id's to deny
  if (!validateRequestParams(req.body, ["checkout_id", "checkout_notes"])) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid Request Body",
    });
  }
  //Validate checkout_id array
  if (!Array.isArray(req.body["checkout_id"])) {
    console.log("Invalid checkout_id format");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid checkout_id format",
    });
  }

  //Deny checkout record using checkoutManager
  let results = checkoutManager.denyCheckout(
    db,
    req.body["checkout_id"],
    req.body["checkout_notes"]
  );
  if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

//Get checkout history
app.get("/checkout/getCheckoutHistory", authorize(API_KEY), (req, res) => {
  console.log("Getting checkout history");
  if (!validateRequestParams(req.body, ["user_id"])) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "Invalid Request Body",
    });
  }

  console.log("user_id: " + req.body["user_id"]);
  //Get checkout history using checkoutManager
  let results = checkoutManager.getUserCheckoutHistory(db, req.body["user_id"]);
  if (results == null || results == undefined) {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  } else if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

//[1507...1601]
//

//get all checkout entries
app.get("/checkout/getAllCheckouts", authorize(API_KEY), (req, res) => {
  //Get all checkout records using checkoutManager
  let results = checkoutManager.getAllCheckouts(db);
  if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

//User endpoints
app.get("/users/getUsers", authorize(API_KEY), (req, res) => {
  let query =
    //TODO: put this back
    //"SELECT user_id, user_email, user_name, user_type_id, user_enabled, register_date FROM users";
    `select * from sessions`;
  let results = generalQuery(db, query);
  console.log(results);
  if (results["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  }
  res.status(200);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

app.post("/users/validateUser", authorize(API_KEY), (req, res) => {
  if (!validateRequestParams(req.body, ["user_email", "password"])) {
    console.log("\n******************\nInvalid or incomplete request");
    console.log(req.body);
    res.status(400);
    res.send({
      status: 400,
      message: "Invalid Request Body",
    });
    return;
  }
  var user_email = req.body["user_email"];
  var pass = req.body["password"];
  //console.log(check_exists)
  let grab_hash_query = `SELECT user_pass_secure FROM users WHERE user_email = '${user_email}'`;
  let user_hash;
  let hash_result = generalQuery(db, grab_hash_query, "get");
  //console.log("hash results:"+JSON.stringify(hash_result))
  if (hash_result == null) {
    res.status(404);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "User Not Found",
    });
  }
  if (hash_result["code"] == "SQLITE_ERROR") {
    console.log(hash_result);
    res.status(500);
    return res.json({
      status: 500,
      message: "Server error",
      error: hash_result,
    });
  }
  if (hash_result.length == 0) {
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "Invalid Credentials",
    });
  } else {
    user_hash = hash_result["user_pass_secure"];
    console.log(user_hash);
  }
  //********************************************
  let validate_password_result = validate_password(pass, user_hash);
  //if validate_password_result is true, then the password is valid
  if (validate_password_result) {
    let grab_user_query = `SELECT user_id, user_email, user_name, user_type_id, user_enabled, register_date FROM users WHERE user_email = '${user_email}'`;
    let user_result = generalQuery(db, grab_user_query, "get");
    console.log(user_result);
    if (user_result["code"] == "SQLITE_ERROR") {
      console;
      res.status(500);
      return res.json({
        status: 500,
        message: "Server error",
        error: user_result,
      });
    }
    if (user_result.length == 0) {
      res.status(400);
      res.setHeader("Content-Type", "application/json");
      return res.json({
        status: 404,
        message: "Invalid Credentials",
      });
    } else {
      //TODO: add token generation and session management
      let session_result = createUserSession(db, user_result);
      //console.log("new session insert query: "+newSessionInsertQuery)
      //Insert new session into database
      //let session_result = sessionManager.createSession(db, newSessionInsertQuery, user_result["user_id"])
      console.log("session result: " + session_result);
      if (session_result == null) {
        res.status(500);
        res.setHeader("Content-Type", "application/json");
        return res.json({
          status: 500,
          message: "Server error",
          error: session_result,
        });
      }
      if (session_result["code"] == "SQLITE_ERROR") {
        console.log(session_result);
        res.status(500);
        return res.json({
          status: 500,
          message: "Server error",
          error: session_result,
        });
      }
      //login verification successful
      response_body = {
        status: 200,
        message: "Login Successful",
        user: user_result,
        cookie: session_result,
      };
      res.setHeader("Access-Control-Allow-Origin", "*");
      //console.log("Session created: "+newSession)
      res.status(200);
      return res.json(response_body);
    }
  } else {
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "Invalid Credentials",
    });
  }
});

//Validate user has logged in by checking session_id
app.post("/users/session/validateSession", authorize(API_KEY), (req, res) => {
  if (!validateRequestParams(req.body, ["session_id"])) {
    console.log("\n******************\nInvalid or incomplete request");
    console.log(req.body);
    res.status(400);
    res.send({
      status: 400,
      message: "Invalid Request Body",
    });
    return;
  }
  var session_id = req.body["session_id"];
  sessionData = sessionManager.validateSession(db, session_id);
  //let results = generalQuery(db, query, "get")
  if (sessionData["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: sessionData,
    });
  }
  if (sessionData.length == 0) {
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "Invalid Credentials",
    });
  } else {
    //sessionData = sessionManager.validateSession(db, session_id)
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 200,
      message: "Session Valid",
    });
  }
});

//update checkout cart in session
app.post("/users/session/updateCart", authorize(API_KEY), (req, res) => {
  !validateRequestParams(req.body, ["session_id", "cart_items"])
    ? res.status(400).send({
        status: 400,
        message: "Invalid Request Body",
      })
    : null;
  var session_id = req.body["session_id"];
  var cart_items = req.body["cart_items"];
  //updateSessionCheckoutCart: (db, session_id, checkout_cart)
  sessionData = sessionManager.updateSessionCheckoutCart(
    db,
    session_id,
    cart_items
  );
  //let results = generalQuery(db, query, "get")
  if (null == sessionData) {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "Session Not Found",
    });
  }
  if (sessionData["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: sessionData,
    });
  }
  if (sessionData.length == 0) {
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "Invalid Credentials",
    });
  } else {
    //let updatedcart = sessionManager.getSessionCheckoutCart(db, session_id)
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 200,
      message: "Session Valid",
    });
  }
});

//Get session data by session_id
app.post("/users/session/getSession", authorize(API_KEY), (req, res) => {
  if (!validateRequestParams(req.body, ["session_id"])) {
    console.log("\n******************\nInvalid or incomplete request");
    console.log(req.body);
    res.status(400);
    res.send({
      status: 400,
      message: "Invalid Request Body",
    });
    return;
  }
  var session_id = req.body["session_id"];
  sessionData = sessionManager.getSessionData(db, session_id);

  if (sessionData == null || sessionData == undefined) {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: sessionData,
    });
  }
  if (sessionData["code"] == "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: sessionData,
    });
  }
  if (sessionData.length == 0) {
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "Invalid Credentials",
    });
  } else {
    //sessionData = sessionManager.validateSession(db, session_id)
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 200,
      message: "Session Valid",
      session: sessionData,
    });
  }
});

//Get shopping cart by session_id
app.post("/users/session/getCart", authorize(API_KEY), (req, res) => {
  if (!validateRequestParams(req.body, ["session_id"])) {
    console.log("\n******************\nInvalid or incomplete request");
    console.log(req.body);
    res.status(400);
    return res.send({
      status: 400,
      message: "Invalid Request Body",
      error: "Invalid Request Body",
    });
  }

  //Get variables from body payload
  var session_id = req.body["session_id"];
  //log the request
  console.log("Get Cart Request: " + session_id);

  //Get cart from session
  var cart = sessionManager.getSessionCheckoutCart(db, session_id);
});

app.post("/users/newUser", authorize(API_KEY), (req, res) => {
  if (
    !validateRequestParams(req.body, [
      "username",
      "password",
      "user_type",
      "user_email",
    ])
  ) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.send({
      status: 400,
      message: "Invalid Request Body",
    });
    return;
  }
  //Get variables from body payload
  var user_name = req.body["username"];
  var user_email = req.body["user_email"];
  var pass = req.body["password"];
  var user_type = req.body["user_type"];
  //log the request
  console.log(
    "New User Request: " +
      user_name +
      " " +
      user_email +
      " " +
      pass +
      " " +
      user_type
  );
  let check_exists = `SELECT user_id FROM users WHERE user_name = '${user_name}'`;
  let check_exists_result = generalQuery(db, check_exists, "get");
  console.log("check: " + check_exists_result);
  //check if user already exists
  if (check_exists_result == null) {
  } else if (check_exists_result.length > 0) {
    res.status(400);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 400,
      message: "User already exists",
    });
  }
  //********************************************
  //Get insert query using createUserQuery function
  let insert_query = createUserQuery(user_name, pass, user_email, user_type);
  console.log("InsertQuery: " + insert_query);
  let results = generalQuery(db, insert_query, "run");
  console.log(insert_query);
  if (results["code"] === "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: results,
    });
  } else if (results["code"] === "SQLITE_CONSTRAINT_UNIQUE") {
    res.status(409);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 409,
      message: "Server error",
      error: results,
    });
  }
  res.status(201);
  res.setHeader("Content-Type", "application/json");
  res.json(results);
});

app.delete("/users/deleteUser", authorize(API_KEY), (req, res) => {
  //Check if user exists before deleting
  var username = req.body["username"];
  let user_query = getUserQuery(username);
  let user_result = generalQuery(db, user_query, "get");
  console.log(user_result);
  if (user_result == null) {
    res.status(404);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "User Not Found",
    });
  } else if (user_result["code"] === "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: user_result,
    });
  } else if (user_result == []) {
    res.status(404);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "User Not Found",
    });
  }

  let user_id = user_result["user_id"];
  let delete_query = `DELETE FROM users WHERE user_id = '${user_id}'`;
  let delete_result = generalQuery(db, delete_query, "run");
  console.log(delete_query);
  if (delete_result["code"] === "SQLITE_ERROR") {
    res.status(500);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 500,
      message: "Server error",
      error: delete_result,
    });
  } else if (delete_result["code"] === "SQLITE_CONSTRAINT_UNIQUE") {
    res.status(409);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 409,
      message: "Server error",
      error: delete_result,
    });
  }
  res.status(201);
  res.setHeader("Content-Type", "application/json");
  res.json(delete_result);
});

//reset password
app.post("/users/resetPassword", authorize(API_KEY), (req, res) => {
  if (!validateRequestParams(req.body, ["user_email", "password"])) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.send({
      status: 400,
      message: "Invalid Request Body",
    });
    return;
  }
  //Get variables from body payload
  var user_email = req.body["user_email"];
  var pass = req.body["password"];
  //log the request
  console.log("Reset Password Request: " + user_name + " " + pass);
  let check_exists = `SELECT user_id FROM users WHERE user_email = '${user_email}'`;
  let check_exists_result = generalQuery(db, check_exists, "get");
  console.log("check: " + JSON.stringify(check_exists_result).length);
  //check if user already exists
  if (check_exists_result == null) {
    res.status(404);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "User Not Found",
    });
  }
  //Check if check_exists_result is empty
  else if (!check_exists_result == []) {
    let user_id = check_exists_result["user_id"];
    let update_query = resetPasswordQuery(user_id, pass);
    let update_result = generalQuery(db, update_query, "run");
    console.log(update_query);
    if (update_result["code"] === "SQLITE_ERROR") {
      res.status(500);
      res.setHeader("Content-Type", "application/json");
      return res.json({
        status: 500,
        message: "Server error",
        error: update_result,
      });
    } else if (update_result["code"] === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409);
      res.setHeader("Content-Type", "application/json");
      return res.json({
        status: 409,
        message: "Server error",
        error: update_result,
      });
    }
    res.status(201);
    res.setHeader("Content-Type", "application/json");
    res.json(update_result);
  } else {
    res.status(404);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "User Not Found",
    });
  }
});

//Check email exists
app.post("/users/checkEmail", authorize(API_KEY), (req, res) => {
  if (!validateRequestParams(req.body, ["user_email"])) {
    console.log("Invalid or incomplete request");
    res.status(400);
    res.send({
      status: 400,
      message: "Invalid Request Body",
    });
    return;
  }
  //Get variables from body payload
  var user_email = req.body["user_email"];
  //log the request
  console.log("Check Email Request: " + user_email);
  let check_exists = `SELECT user_id FROM users WHERE user_email = '${user_email}'`;
  let check_exists_result = generalQuery(db, check_exists, "get");
  console.log("check: " + JSON.stringify(check_exists_result).length);
  //check if user already exists
  if (check_exists_result == null || check_exists_result == []) {
    res.status(404);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      status: 404,
      message: "User Not Found",
    });
  } else {
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.json({
      status: 200,
      boolean: 1,
    });
  }
});

//Gene

const validateRequestParams = (body, params) => {
  let result = true;
  for (let i = 0; i < params.length; i++) {
    if (!body.hasOwnProperty(params[i])) {
      result = false;
      break;
    }
  }
  return result;
};

//function to validate date for sqlite datetime format YYYY-MM-DD HH:MM:SS
const validateDate = (date) => {
  let date_regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  return date_regex.test(date);
};

app.listen(PORT, () => {
  console.log("Your app is listening on port " + PORT);
});

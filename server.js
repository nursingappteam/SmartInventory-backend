const express = require("express");
const https=require('https');
const http=require('http');
const fs = require('fs');

const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;
const authorize = require("./authorize.js");
const {createUserQuery, verifyUserQuery} = require("./user_authentication.js");


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

let db = new sqlite3.Database("./inventory/inventory_v5.db", (err) => {
  if(err) {
    console.log(err.message);
  }
  console.log("connected to the database.");
  
  
});


app.get('/', (req, res) => {
  res.send('SmartInventory API');
})

//get endpoint that will get all assets of inventory
app.get('/assets/display_assets', authorize(API_KEY), (req, res) => {
  let query = 'SELECT * FROM assets'
  
  db.all(query, [], (err, rows) => {
    if(err){
      res.status(500);
      res.send({
        "status" : 500,
        "message": "Server error"
      });
      return
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
app.get('/assets/get_assets', authorize(API_KEY), (req, res) => {
  if(!validateRequestParams(req.body, ["asset_id"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    res.send({
      "status" : 400,
      "message": "Invalid Request Body"
    });
    return
  }
  console.log("Processing Request...");
  var query = `SELECT * FROM assets WHERE asset_id in(${req.body["asset_id"].toString()})`;
  db.all(query, [], (err, rows) => {
    if(err){
      res.status(500);
      res.send({
        "status" : 500,
        "message": "Server error"
      });
      return
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
app.get('/checkout/getCheckouts', authorize(API_KEY), (req, res) => {
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

app.post('/users/validateUser', authorize(API_KEY), (req, res) => {
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
  let check_exists = dbQuery_user(user_name);
  //console.log(check_exists)
  if(check_exists == null){
    res.status(403)
    return res.json({
      "status": 403,
      "message": "User already exists"
    })
  }
  let validateQuery = verifyUserQuery(user_name, pass, 1);
  console.log("InsertQuery: "+validateQuery);
  console.log("username: "+ user_name + " password: " + pass);
  db.all(`SELECT * FROM users WHERE user_name = "${user_name}" AND user_pass_secure = "${pass}"`, (err, rows) => {
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

app.post('/users/newUser', authorize(API_KEY), (req, res) => {
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
  let validate_string = `SELECT * FROM users WHERE user_name = '${user_name}'`
  try{
    var check_exists = dbQuery_user(user_name)
  } catch{
    
  }

  console.log(check_exists)
  if(0){
    res.status(403)
    return res.json({
      "status": 403,
      "message": "User already exists"
    })
  }
  let InsertQuery = createUserQuery(user_name, pass, 1);
  console.log("InsertQuery: "+InsertQuery);
  //console.log("username: "+ user_name + " password: " + pass);
  db.all(InsertQuery, (err, rows) => {
    if(err) {
      res.status(500)
      return res.json({
        status: 500,
        message: "Couldn't insert new user record. Server Error.",
        err: err
      })
    }
    res.status(200)
    let new_record = dbQuery(`SELECT * FROM users WHERE user_name '${user_name}'`);
    return res.json(rows);
  });
});


  
// var server = https.createServer(options, app);

// server.listen(PORT, () => {
//   console.log('Your app is listening on port ' + PORT);
// })


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

//Query function that returns are rows from result
const dbQuery = (query_string) => {
  var result;
  console.log(query_string);
  db.all(query_string, [], (err, rows) => {
    if(err){
      console.log(err);
      return null;
    }
    else{
      console.log(rows)
      result = rows;
    }
  });
  return result;
}

//Query function that gets user using user_name
// const dbQuery_user = (user_name) => {
//   var result = [];
//   let query_string = `SELECT * FROM users`
//   console.log(query_string);
//     db.all(query_string, [], (err, rows) => {
//       if(err){
//         console.log(err)
//         return err
//       }
//       else{
//         console.log(rows.length)
//         return rows
//       } 
//   })
  
//   return result;
// }

var dbQuery_user = function(callback){

    var db = new sqlite3.Database(file, sqlite3.OPEN_READONLY);

    db.serialize(function() {

        db.all("SELECT * FROM MediaTable", function(err, allRows) {

            if(err != null){
                console.log(err);
                callback(err);
            }

            console.log(util.inspect(allRows));

            callback(allRows);
            db.close();

        });


    });

}


app.listen(PORT, () => {
  console.log('Your app is listening on port ' + PORT);
})

/*
db.all(query_string, [], (err, rows) => {
    if(err){
      console.log(err);
      return null;
    }
    else{
      console.log(rows)
      result = rows;
    }
  });

*/


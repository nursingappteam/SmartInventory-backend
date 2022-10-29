const express = require("express");
const https=require('https');
const fs = require('fs');
const PORT = process.env.PORT;
const API_KEY = process.env.API_KEY;


//Get certificate and key
const cert_path = './certs/';
const pKey = fs.readFileSync(cert_path + 'selfsigned.key');
const cert = fs.readFileSync(cert_path + 'selfsigned.crt');
const options = {
  key: pKey,
  cert: cert
}

const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

let db = new sqlite3.Database("./inventory_v3.db", (err) => {
  if(err) {
    console.log(err.message);
  }
  console.log("connected to the database.");
  
  
});


app.get('/', (req, res) => {
  res.send('SmartInventory API');
})

//get endpoint that will get all assets of inventory
app.get('/display_assets', (req, res) => {
  let query = 'SELECT * FROM assets'
  
  db.all(query, [], (err, rows) => {
    if(err){
      res.status(500);
      throw err;
    }
    else{
      console.log(rows);
      res.status(200);
      res.setHeader('Content-Type','application/json');
      res.send(JSON.stringify(rows));
    }
  });
})

//get endpoint to get items with specific asset id's
app.get('/get_assets', (req, res) => {
  if(!validateRequestKey(req.headers)){
    console.log("No Valid API_KEY supplied")
    res.status(401);
    res.send();
    return
  }
  if(!validateRequestParams(req.body, ["asset_id"])){
    console.log("Invalid or incomplete request");
    res.status(400)
    res.send();
    return
  }
  console.log("Processing Request...");
  var query = `SELECT * FROM assets WHERE asset_id in(${req.body["asset_id"].toString()})`;
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
    
});

app.post('/validatePassword', (req, res) => {
  //const {userID, pass} = req.body
  var userID = req.query.username;
  var pass = req.query.password;
  //var body = req.body
  
  console.log("username: "+ userID + " password: " + pass);
  db.all(`SELECT * FROM users WHERE username = "${userID}" AND password = "${pass}"`, (err, rows) => {
    if(err) {
      throw err;
    }
    if(rows.length > 0) {
      console.log(rows)
      res.send({validation: true})
    } else {
      res.send({validation: false})
    }
  });
});
  
// var server = https.createServer(options, app);

// server.listen(PORT, () => {
//   console.log('Your app is listening on port ' + PORT);
// })

let validateRequestKey = (headers) => {
  let result = false;
  console.log(headers)
  if(headers.hasOwnProperty('api_key')){
    if(headers["api_key"] === API_KEY) 
      result = true;
  }
  return result;
}

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

app.listen(PORT, () => {
  console.log('Your app is listening on port ' + PORT);
})



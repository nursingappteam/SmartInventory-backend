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

//get endpoint that queries the database
app.get('/get_assets', (req, res) => {
  let query = 'SELECT * FROM assets'
  
  db.all(query, [], (err, rows) => {
    if(err){
      throw err;
    }
    console.log(rows);
    res.status(200);
    res.setHeader('Content-Type','application/json');
    res.send(JSON.stringify(rows));
  });
})

app.post('/validatePassword', (req, res) => {
  //const {username, password} = req.body
  var userID = req.query.username;
  var pass = req.query.password;
  var body = req.body
  
  console.log("request body"+body.json());
  db.all(`SELECT * FROM users WHERE username = "${userID}" AND password = "${pass}"`, (err, rows) => {
    if(err) {
      throw err;
    }
    if(rows.length > 0) {
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

app.listen(PORT, () => {
  console.log('Your app is listening on port ' + PORT);
})



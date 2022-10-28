const express = require("express");
const https=require('https');
const fs = require('fs');
const PORT = process.env.PORT;


//Get certificate and key
var cert_path = './certs/';
var pKey = fs.readFileSync(cert_path + 'selfsigned.key');
var cert = fs.readFileSync(cert_path + 'selfsigned.crt');
var options = {
  key: pKey,
  cert: cert
}

const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());
app.use

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
  const {username, password} = req.body
  
  db.all('SELECT * FROM users WHERE username = "{username}" AND password = "password}"', (err, rows) => {
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
  
var server = https.createServer(options, app);

server.listen(PORT, () => {
  console.log('Your app is listening on port ' + PORT);
})




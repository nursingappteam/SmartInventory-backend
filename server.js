const express = require("express");
const https=require('https');
const fs = require('fs');
const PORT = process.env.PORT;
const app = express();

//Get certificate and key
const cert_path = './certs/';
const pKey = fs.readFileSync(cert_path + 'selfsigned.key');
const CA = fs.readFileSync(cert_path + 'selfsigned.crt');

const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

app.use(cors());
app.use(express.json());
app.use

let db = new sqlite3.Database("./inventory_v2.db", (err) => {
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
  
  db.get(query, [], (err, rows) => {
    if(err){
      throw err;
    }
    console.log(rows);
    res.status(200);
    res.setHeader('Content-Type','application/json');
    res.send(JSON.stringify(rows));
  });
})

app.get('/validatePassword', (req, res) => {
  //const {username, password} = req.body
  
  db.get('SELECT * FROM users WHERE username = "${username}" and password = "${password}"', (err, rows) => {
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
  





var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});



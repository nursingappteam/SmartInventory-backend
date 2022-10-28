const express = require("express");
const app = express();
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

app.enable('trust proxy');
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

//post endpoint 
  





var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

// app.post('/validatePassword', (req, res) => {
//   const {username, password} = req.body
  
//   db.all('SELECT * FROM users WHERE username = "${username}" and password = "${password}"', (err, rows) => {
//     if(err) {
//       throw err;
//     }
//     if(rows.length > 0) {
//       res.send({validation: true})
//     } else {
//       res.send({validation: false})
//     }
//   });
// });

const express = require("express");
const app = express();
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

app.use(cors());
app.use(express.json());


let db = new sqlite3.Database("./.data/test.db", (err) => {
  if(err) {
    console.log(err.message);
  }
  console.log("connected to the database.");
  
});

app.get('/', (req, res) => {
  res.send('SmartInventory API');
})

  
app.post('/validatePassword', (req, res) => {
  const {username, password} = req.body
  
  db.all('SELECT * FROM users WHERE username = "${username}" and password = "${password}"', (err, rows) => {
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

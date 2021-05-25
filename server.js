/*

*/

const fs = require("fs");

const path = require("path");

// init sqlite db
const dbFile = "./.data/choices.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false
});

// Setup our static files
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  }
});

// Load and parse SEO data
const seo = require("./src/seo.json");
if (seo.url === "glitch-default") {
  seo.url = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
}

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE Choices (id INTEGER PRIMARY KEY AUTOINCREMENT, language TEXT, picks INTEGER)"
    );
    db.run(
      "INSERT INTO Choices (language, picks) VALUES ('html', 0), ('js', 0), ('css', 0)"
    );
    db.run(
      "CREATE TABLE Log (id INTEGER PRIMARY KEY AUTOINCREMENT, choice TEXT, time STRING)"
    );
  } else {
    db.each("SELECT * from Choices", (err, row) => {
      if (row) {
        console.log(`record: ${row.language}`);
      }
    });
  }
});

fastify.get("/", (request, reply) => {
  // params is an object we'll pass to our handlebars template
  let params = { seo: seo };
  // The Handlebars code will be able to access the parameter values and build them into the page
  reply.view("/src/pages/index.hbs", params);
});

// endpoint to get all the options in the database
fastify.get("/choices", (request, reply) => {
  db.all("SELECT * from Choices", (err, rows) => {
    console.log(rows);
    reply.send(JSON.stringify(rows));
  });
});

// endpoint to get all logs
fastify.get("/logs", (request, reply) => {
  db.all("SELECT * from Log", (err, rows) => {
    console.log(rows);
    let params = { seo: seo };
    params.logs=rows;
    reply.view("/src/pages/admin.hbs", params);
  });
});

fastify.post("/pick", (request, reply) => {
  let params = { seo: seo, picked: true };

  db.serialize(() => {
    db.run(
      "INSERT INTO Log (choice, time) VALUES ('" +
        request.body.language +
        "', '" +
        new Date().toLocaleString() +
        "')"
    );

    db.all(
      "UPDATE Choices SET picks = picks + 1 WHERE language = '" +
        request.body.language +
        "'",
      err => {
        if (!err) {
          db.all("SELECT * from Choices", (err, rows) => {
            //          console.log(JSON.stringify(rows.map(({ color, picks }) => ({color, picks}))))
            //let result = objArray.map(a => a.foo);
            params.choices = JSON.stringify(rows.map(c => c.language));
            params.picks = JSON.stringify(rows.map(c => c.picks));
            reply.view("/src/pages/index.hbs", params);
          });
        }
      }
    );
  });
});

// endpoint to clear dreams from the database TODO change method and path
fastify.get("/clear", (request, reply) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from Choices",
      (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM Choices WHERE ID=?`, row.id, error => {
          if (row) {
            console.log(`deleted row ${row.id}`);
          }
        });
      },
      err => {
        if (err) {
          reply.send({ message: "error!" });
        } else {
          reply.send({ message: "success" });
        }
      }
    );
  }
});

// Run the server and report out to the logs
fastify.listen(process.env.PORT, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});

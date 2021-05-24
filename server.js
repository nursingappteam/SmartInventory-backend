/*

*/

const fs = require("fs");

const path = require("path");


// init sqlite db
const dbFile = "./.data/themedata.db";
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
      "CREATE TABLE Themes (id INTEGER PRIMARY KEY AUTOINCREMENT, theme TEXT)"
    );
    console.log("New table Themes created!");

    // insert default dreams
    db.serialize(() => {
      db.run(
        'INSERT INTO Themes (theme) VALUES ("neutral"), ("party"), ("relax")'
      );
    });
  } else {
    console.log('Database "Themes" ready to go!');
    db.each("SELECT * from Themes", (err, row) => {
      if (row) {
        console.log(`record: ${row.theme}`);
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


// endpoint to get all the themes in the database
fastify.get("/themes", (request, reply) => { 
  db.all("SELECT * from Themes", (err, rows) => {
    console.log(rows)
    reply.send(JSON.stringify(rows));
  });
});

//updates ui
fastify.post("/theme", (request, reply) => {
  console.log(request.body.color)
  // params is an object we'll pass to our handlebars template
  let params = { seo: seo };
  //TODO update db with user choice
  
  params.color = request.body.color;
  // The Handlebars code will be able to access the parameter values and build them into the page
  reply.view("/src/pages/index.hbs", params);
});

// endpoint to add a dream to the database
fastify.post("/new", (request, reply) => {
  console.log(`Add to themes ${request.body.theme}`);

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects
  // so they can write to the database
  // TODO replace with user set env
  if (!process.env.DISALLOW_WRITE) {
    const cleansedTheme = cleanseTheme(request.body.theme);
    db.run(`INSERT INTO Themes (theme) VALUES (?)`, cleansedTheme, error => {
      if (error) {
        reply.send({ message: "error!" });
      } else {
        reply.send({ message: "success" });
      }
    });
  }
});

// endpoint to clear dreams from the database TODO change method and path
fastify.get("/clear", (request, reply) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from Themes",
      (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM Themes WHERE ID=?`, row.id, error => {
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

// helper function that prevents html/css/script malice
const cleanseTheme = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// Run the server and report out to the logs
fastify.listen(process.env.PORT, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});

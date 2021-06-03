/*
This is the main server script that manages the app database and provides the API endpoints
- The script use the database helper db.js
- The endpoints connect to the db and return data to the page handlebars files
*/

// Utilities we need
const fs = require("fs");
const path = require("path");

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

// We use a module for handling database operations in db.js
var data = require("./db.js");

// Home route for the app
fastify.get("/", async (request, reply) => {
  // Params is the data we pass to the handlebars templates
  let params = { seo: seo };
  
  // Get the available choices from the database
  params.options = await data.getOptions();

  // Let the user know if there was a db error (the options returned will evaluate to false)
  params.error = !params.options;

  // The page builds the options into the poll form
  reply.view("/src/pages/index.hbs", params);
});

// Route to process user poll pick
fastify.post("/", async (request, reply) => {
  let params = { seo: seo };
  
  // We have a language pick
  if (request.body.language) {
    
    // Flag to indicate a choice was picked - will show the poll results instead of the poll form
    params.picked = true;
    
    // Send the user pick to the db helper to update and return votes cast
    const options = await data.processVote(request.body.language);
    
    if (options) {
      // We send the choices and numbers in parallel arrays
      params.optionNames = JSON.stringify(options.names);
      params.optionCounts = JSON.stringify(options.counts);
    } 
    else params.error = true; // Let the user know if there's an error
    
    // Return the info to the page
    reply.view("/src/pages/index.hbs", params);
  }
});

// Admin endpoint to get logs
fastify.get("/logs", async (request, reply) => {
  let params = {};
  
  // Get the log history from the db
  params.optionHistory = await data.getLogs();
  
  // Let the user know if there's an error
  params.error = !params.optionHistory;
  
  // Return the log list to the page
  reply.view("/src/pages/admin.hbs", params);
});

// Admin endpoint to empty all logs - requires auth (instructions in README)
fastify.post("/reset", async (request, reply) => {
  let params = {};

  // Authenticate the user request by checking against the env key variable
  if (
    !request.body.key ||
    request.body.key.length < 1 ||
    !process.env.ADMIN_KEY ||
    request.body.key !== process.env.ADMIN_KEY
  ) {
    console.error("Auth fail");
    
    // Auth failed, return the log data plus a failed flag
    params.failed = true;
    
    // Get the log list
    params.optionHistory = await data.getLogs();
  } else {
    
    // We have a valid key and can clear the log
    params.optionHistory = await data.clearHistory();
    
    // Check for errors - method would return false value
    params.error = !params.optionHistory;
  }

  // Log cleared, return an empty array to admin page
  reply.view("/src/pages/admin.hbs", params);
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

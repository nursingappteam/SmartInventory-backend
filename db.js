/*
Module handles database management
- Server API calls the methods in here to query and update the SQLite database
*/

// Utilities we need
const fs = require("fs");

// Initialize the database - you can create a db with a different filename
const dbFile = "./.data/choices.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;

// We're using the sqlite wrapper so that we can use async / await
//https://www.npmjs.com/package/sqlite
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database
  })
  .then(async dBase => {
    db = dBase;
  
    // We use try and catch blocks throughout to handle any database errors
    try {
      // The async / await syntax lets us write the db operations in a way that won't block the app
      if (!exists) {
        
        // Database doesn't exist yet - create Choices and Log tables
        await db.run(
          "CREATE TABLE Choices (id INTEGER PRIMARY KEY AUTOINCREMENT, language TEXT, picks INTEGER)"
        );
        
        // Add default choices to table
        await db.run(
          "INSERT INTO Choices (language, picks) VALUES ('HTML', 0), ('JavaScript', 0), ('CSS', 0)"
        );
        
        // Log can start empty - we'll insert a new record whenever the user chooses a poll option
        await db.run(
          "CREATE TABLE Log (id INTEGER PRIMARY KEY AUTOINCREMENT, choice TEXT, time STRING)"
        );
      } else {
        
        // We have a database already - write Choices records to log for info
        console.log(await db.all("SELECT * from Choices"));

        //If you need to remove a table from the database use this syntax
        //db.run("DROP TABLE Logs"); //will fail if the table doesn't exist
      }
    } catch (dbError) {
      console.error(dbError);
    }
  });

// Our server script will call these methods to connect to the db
module.exports = {
  // Get the options in the database
  getOptions: async () => {
    
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT * from Choices");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },

  // Process a user vote
  processVote: async vote => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      
      // Build the user data from the front-end and the current time into the sql query
      await db.run("INSERT INTO Log (choice, time) VALUES (?, ?)", [
        vote,
        new Date().toISOString()
      ]);
      
      // Update the number of times the choice has been picked by adding one to it
      await db.run(
        "UPDATE Choices SET picks = picks + 1 WHERE language = ?",
        vote
      );
      
      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from Choices");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  // Get logs
  getLogs: async () => {
    // Return most recent 20
    try {
      
      // Return the array of log entries to admin page
      return await db.all("SELECT * from Log ORDER BY time DESC LIMIT 20");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  // Clear logs and reset votes 
  clearHistory: async () => {
    try {
      // Delete the logs
      await db.run("DELETE from Log");
      // Reset the vote numbers
      await db.run("UPDATE Choices SET picks = 0");
      // Return empty array
      return [];
    } catch (dbError) {
      console.error(dbError);
    }
  }
};

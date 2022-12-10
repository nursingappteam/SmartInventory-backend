const createUserQuery = require('../authentication/user_authentication').createUserQuery
const { v4: uuid } = require('uuid')

/*
Existing tables
1) assets
2) approval_statuses
3) checkout
4) users
5) user_types
6) sessions
7) email_verification
*/

//function to initialize database and create tables if they don't exist asset table is not included and insert relevant data
let initializeDatabase = (db) => {
  // TODO: Remove when true way to add assets is added
  db.prepare(
    `CREATE TABLE IF NOT EXISTS assets (
        "asset_id"      INTEGER NOT NULL UNIQUE,
              "inventory_status"      TEXT,
              "cust_dept_desc"        TEXT,
              "tag_num"       TEXT,
              "tagged"        INTEGER NOT NULL,
              "type"  TEXT NOT NULL,
              "sub_type"      TEXT NOT NULL,
              "description"   TEXT,
              "serial_id"     INTEGER,
              "acquisition_cost"      INTEGER,
              "company"       TEXT,
              "PO_IDS"        TEXT,
              "location"      TEXT,
              "sub_location"  TEXT,
              "building"      TEXT,
              "acquisition_date"      TEXT,
              PRIMARY KEY("asset_id" AUTOINCREMENT)
      )
      `
  ).run();

  //Create users table and insert admin user
  db.prepare(
    `CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_pass_secure TEXT NOT NULL,
    user_type_id INTEGER NOT NULL,
    user_enabled INTEGER NOT NULL,
    salt TEXT NOT NULL,
    register_date TEXT NOT NULL
  )`
  ).run();

  //Create user_types table
  db.prepare(
    `CREATE TABLE IF NOT EXISTS user_types (
    type_id INTEGER PRIMARY KEY UNIQUE,
    type_value TEXT NOT NULL,
    type_desc TEXT
  )`
  ).run();
  //Insert user types in one statement
  try {
    db.prepare(
      `
    INSERT INTO user_types (type_id, type_value, type_desc)
    VALUES 
    (NULL, 'Admin', 'Admin user type'),
    (NULL, 'General', 'General user type')
  `
    ).run();
  } catch (err) {
    console.log(err);
  }

  //if inventoryadmin doesn't exist create it with email: nursingappteam@gmail.com
  try {
    db.prepare(
      createUserQuery(
        "inventoryadmin",
        "nusringinventory!#%UTA2022",
        "nursingappteam@gmail.com",
        1
      )
    ).run();
  } catch (err) {
    console.log(err);
  }

  //Create sessions table
  db.prepare(
    `CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    sess TEXT NOT NULL,
    expire TEXT NOT NULL
  )`
  ).run();

  //Create approval_statuses table
  db.prepare(
    `CREATE TABLE IF NOT EXISTS approval_statuses (
    status_id INTEGER PRIMARY KEY,
    status_value TEXT NOT NULL,
    status_desc TEXT
  )`
  ).run();
  //Insert approval statuses in one statement with aproved, denied, pending - 1, 2, 0
  try {
    db.prepare(
      `
    INSERT INTO approval_statuses (status_id, status_value, status_desc)
    VALUES
    (1, 'Approved', 'Checkout has been approved'),
    (2, 'Denied', 'Checkout has been denied'),
    (0, 'Pending', 'Checkout is pending approval')
  `
    ).run();
  } catch (err) {
    console.log(err);
  }

  //Create checkout table
  db.prepare(
    `CREATE TABLE IF NOT EXISTS checkouts (
    checkout_id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
    asset_id INTEGER NOT NULL REFERENCES assets(asset_id),
    start_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    approval_status INTEGER NOT NULL REFERENCES approval_statuses(approval_status_id),
    checkout_notes TEXT,
    return_date TEXT,
    available INTEGER NOT NULL
  )`
  ).run();

  //Create sessions table
  db.prepare(
    `CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY NOT NULL,
    user_id INTEGER NOT NULL,
    sess TEXT NOT NULL,
    expire TEXT NOT NULL
    )
  `
  ).run();

  //create email_verification table
  db.prepare(
    `CREATE TABLE IF NOT EXISTS email_verification (
    verification_id TEXT PRIMARY KEY NOT NULL,
    user_id INTEGER NOT NULL,
    verification_code TEXT NOT NULL,
    verification_date TEXT NOT NULL
  )`).run()

  //create assets table
  db.prepare(`CREATE TABLE IF NOT EXISTS "assets" (
    "asset_id"	INTEGER NOT NULL UNIQUE,
    "inventory_status"	TEXT,
    "cust_dept_desc"	TEXT,
    "tag_num"	TEXT,
    "tagged"	INTEGER NOT NULL,
    "type"	TEXT NOT NULL,
    "sub_type"	TEXT NOT NULL,
    "description"	TEXT,
    "serial_id"	INTEGER,
    "acquisition_cost"	INTEGER,
    "company"	TEXT,
    "PO_IDS"	TEXT,
    "location"	TEXT,
    "sub_location"	TEXT,
    "building"	TEXT,
    "acquisition_date"	TEXT,
    PRIMARY KEY("asset_id" AUTOINCREMENT)
  )
  `).run()

  try{
    //get insert statements for assets from sql file
    const fs = require('fs')
    const path = require('path')
    const sql = fs.readFileSync(path.resolve(__dirname, 'assets_121022.sql'), 'utf8')

    const stmt = db.prepare(sql)
    stmt.run()

  }
  catch(err){
    console.log(err)
  }
}


    

let generalQuery = (db, query, query_type) => {
  if (query_type === "get") {
    try {
      const stmt = db.prepare(query);
      const results = stmt.get();
      return results;
    } catch (err) {
      console.log(err);
      return err;
    }
  } else if (query_type === "run") {
    try {
      const stmt = db.prepare(query);
      const results = stmt.run();
      return results;
    } catch (err) {
      console.log(err);
      return err;
    }
  } else {
    try {
      const stmt = db.prepare(query);
      const results = stmt.all();
      return results;
    } catch (err) {
      console.log(err);
      return err;
    }
  }
};

//Define session manager
/*
Session table has the following columns:
1) sid - session id
2) user_id - user id
2) sess - session data (JSON) as string:
{
    "cookie": {
        "expires": 1670380585424,
        "httpOnly": false,
        "originalMaxAge": null,
        "path": "/"
    },
    "user_data_items": {
        "user_email": "kentest@test.com",
        "user_enabled": 1,
        "user_id": 2,
        "user_name": "kentest",
        "user_session_data": {
            "checkout_cart": [],
            "checkout_count": 0
        },
        "user_type_id": 2
    }
}
3) expire - session expiration


*/
let sessionManager = {
  //Get session data
  getSessionData: (db, session_id) => {
    let sessionData = generalQuery(
      db,
      `SELECT sess FROM sessions WHERE sid = '${session_id}'`,
      "get"
    );
    console.log("*SessionManager*: sessionData: ", sessionData);
    //Check if session data is null
    if (sessionData === undefined) {
      return null;
    } else {
      return sessionData["sess"];
    }
  },
  //Get session id
  getSessionId: (db, user_id) => {
    let sessionId = generalQuery(
      db,
      `SELECT sid FROM sessions WHERE user_id = '${user_id}'`,
      "get"
    );
    console.log("*SessionManager*: sessionId: ", sessionId);
    //Check if session id is null
    if (sessionId === undefined) {
      return null;
    } else {
      return sessionId;
    }
  },
  //delete session when user logs out or session expires
  deleteSession: (db, session_id) => {
    let deleteSessionQuery = `DELETE FROM sessions WHERE sid = '${session_id}'`;
    let deleteSession = generalQuery(db, deleteSessionQuery, "run");
    console.log("*SessionManager*: deleteSession: ", deleteSession);
    return deleteSession;
  },
  //Create session with user information and expiration date as well as user_session_data if provided which is used to store user specific data such as cart
  createSession: (db, newSessionInsertQuery, user_id) => {
    //Check user_id has existing session
    let existingSession = generalQuery(
      db,
      `SELECT * FROM sessions WHERE user_id = '${user_id}'`,
      "get"
    );
    //let existingSession = sessionManager.checkSession(db, user_id)
    //console.log("\n*existingSession: ", existingSession)
    //Check if existing session is null
    if (existingSession === undefined || existingSession === null) {
      //Create new session
      let newSession = generalQuery(db, newSessionInsertQuery, "run");
      //console.log("/n*SessionManager*: newSession: ", newSession)
      let session_id = sessionManager.getSessionId(db, user_id);
      console.log("*SessionManager*: newSession: ", session_id);
      return {
        name: "inventory_session_id",
        value: session_id["sid"],
        options: {
          httpOnly: false,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          path: "/",
          SameSite: "None",
        },
      };
    } else {
      //Return existing session
      return {
        name: "inventory_session_id",
        value: existingSession["sid"],
        options: {
          httpOnly: false,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          path: "/",
          SameSite: "None",
        },
      };
    }
  },
  //Update session with user information and expiration date as well as user_session_data if provided which is used to store user specific data such as cart
  updateSession: (
    db,
    session_id,
    user_id,
    user_type_id,
    user_name,
    user_email,
    user_session_data
  ) => {
    //Create expire date
    let expire = Date.now() + 3600000;
    console.log(expire);
    //Create session
    let updateSessionQuery = `
    UPDATE sessions
    SET sess
    = '{"cookie":{"originalMaxAge":null,"expires":${expire},"httpOnly":false,"path":"/"},"user_data_items":{"user_email":"${user_email}","user_enabled":"1","user_id":"${user_id}","user_name":"${user_name}","user_session_data":${user_session_data},"user_type_id":"${user_type_id}"}}'
    WHERE sid = '${session_id}'
    `;
    let updateSession = generalQuery(db, updateSessionQuery, "run");
    console.log("*SessionManager*: updateSession: ", updateSession);
    return updateSession;
  },
  //Check if user has an expired session
  checkSession: (db, session_id) => {
    //Get session data
    let sessionData = generalQuery(
      db,
      `SELECT * FROM sessions WHERE sid = '${session_id}'`,
      "get"
    );
    //console.log("*SessionManager*: sessionData: ", sessionData)
    //Check if session data is null
    if (sessionData === undefined) {
      return null;
    } else {
      //Get session expiration
      let sessionExpiration = sessionData.expire;
      //Check if session has expired
      if (sessionExpiration < Date.now()) {
        //Delete session
        let deleted_session = sessionManager.deleteSession(db, sessionData.sid);
        console.log("*SessionManager*: deleted_session: ", deleted_session);
        return null;
      } else {
        console.log("Valid session");
        return sessionData["sid"];
      }
    }
  },
  //update session data checkout cart with array of asset ids and checkout count
  updateSessionCheckoutCart: (db, session_id, checkout_cart) => {
    //get checkout count
    let checkout_count = checkout_cart.length;
    //Get session data
    let sessionData = sessionManager.getSessionData(db, session_id);
    console.log(sessionData);
    //Check if session data is null
    if (sessionData === undefined || sessionData === null) {
      return null;
    } else {
      //console.log(sessionData["sess"])
      //Get user_session_data string and parse to JSON
      let parsed_sessionData = JSON.parse(sessionData);
      //get expire date
      //let expire = parsed_sessionData["cookie"]["expires"]
      //console.log(parsed_sessionData)
      //Update user_session_data
      console.log(parsed_sessionData);
      let user_session_data =
        parsed_sessionData["user_data_items"]["user_session_data"];

      //Update user_session_data
      user_session_data.checkout_cart = checkout_cart;
      user_session_data.checkout_count = checkout_count;
      console.log(user_session_data);
      //stringify user_session_data
      let user_session_data_string = JSON.stringify(user_session_data);
      console.log(user_session_data_string);
      //Update session
      let updateSession = sessionManager.updateSession(
        db,
        session_id,
        parsed_sessionData.user_data_items.user_id,
        parsed_sessionData.user_data_items.user_type_id,
        parsed_sessionData.user_data_items.user_name,
        parsed_sessionData.user_data_items.user_email,
        user_session_data_string
      );
      //get updated cart count

      let updated_cart_count = JSON.parse(
        sessionManager.getSessionData(db, session_id)
      );

      return updated_cart_count.user_data_items.user_session_data
        .checkout_count;
    }
  },
  //get user session checkout cart
  getSessionCheckoutCart: (db, session_id) => {
    //Get session data
    let sessionData = sessionManager.getSessionData(db, session_id);
    //Check if session data is null
    if (sessionData === undefined) {
      return null;
    } else {
      //Get user_session_data
      let user_session_data = sessionData.user_session_data;
      //Get checkout cart
      let checkout_cart = user_session_data.checkout_cart;
      return checkout_cart;
    }
  },
  //validate session exists and is not expired
  validateSession: (db, session_id) => {
    //Get session data
    let sessionData = sessionManager.getSessionData(db, session_id);
    //Check if session data is null
    if (sessionData === undefined || sessionData === null) {
      return null;
    } else {
      //Get session expiration
      let sessionExpiration = sessionData.expire;
      //Check if session has expired
      if (sessionExpiration < Date.now()) {
        //Delete session
        let deleted_session = sessionManager.deleteSession(db, sessionData.sid);
        console.log("*SessionManager*: deleted_session: ", deleted_session);
        return null;
      } else {
        console.log("Valid session");
        return sessionData;
      }
    }
  },
};

//Define asset manager
let assetManager = {
  //get all assets
  getAllAssets: (db) => {
    let query = "SELECT * FROM assets";
    let results = generalQuery(db, query, "all");
    return results;
  },
  //get asset by id
  getAssetById: (db, asset_id) => {
    //let query = `SELECT * FROM assets WHERE asset_id = ${asset_id}`
    let results = getAssetByIdArray(db, asset_id);
    return results;
  },
  //get asset by name
  getAssetByName: (db, asset_name) => {
    let query = `SELECT * FROM assets WHERE asset_name = ${asset_name}`;
    let results = generalQuery(db, query, "get");
    return results;
  },
  //get asset by type
  getAssetByType: (db, asset_type) => {
    let query = `SELECT * FROM assets WHERE asset_type = ${asset_type}`;
    let results = generalQuery(db, query, "get");
    return results;
  },
};

//define get asset by id array
let getAssetByIdArray = (db, asset_id_array) => {
  let query = `SELECT * FROM assets WHERE asset_id IN (${asset_id_array})`;
  let results = generalQuery(db, query, "all");
  return results;
};

// Define checkout manager
/*
  Checkout table has the following columns: checkout_id, asset_id, start_date, due_date, user_id, approval_status, checkout_notes, return_date, available

  approval_status: 0 = pending, 1 = approved, 2 = denied
  return_status: 0 = pending, 1 = returned
  available: 0 = assets are locked, 1 = assets are available

  Description of checkout process:
  1) User requests checkout
  2) Checkout request is sent to admin
  3) Admin approves or denies request
  4) If approved, user can checkout assets
  5) If denied, user cannot checkout assets
  6) User can return assets before or at due date
  7) If returned before due date, user can checkout assets again
  8) If returned after due date, admin is notified
  9) Once assets are returned the checkout record is updated to reflect the return date and the assets are marked as available

*/
let checkoutManager = {
  //create checkout table
  //get all checkouts
  getAllCheckouts: (db) => {
    let query = "SELECT * FROM checkouts";
    let results = generalQuery(db, query, "all");
    return results;
  },
  //get checkout by id
  getCheckoutById: (db, checkout_id) => {
    let query = createGetCheckoutsQuery(checkout_id);
    let results = generalQuery(db, query, "all");
    return results;
  },
  //get checkout by user id
  getCheckoutByUserId: (db, user_id) => {
    let query = `SELECT * FROM checkouts WHERE user_id = ${user_id}`;
    let results = generalQuery(db, query, "all");
    return results;
  },
  //get checkout by asset id
  getCheckoutByAssetId: (db, asset_id, begin_date, end_date) => {
    let query = createGetCheckoutsQuery(asset_id, begin_date, end_date);
    let results = generalQuery(db, query, "all");
    return results;
  },
  //get checkout by approval status
  getCheckoutByApprovalStatus: (db, approval_status) => {
    let query = `SELECT * FROM checkouts WHERE approval_status = ${approval_status}`;
    let results = generalQuery(db, query, "all");
    return results;
  },
  //get checkout by return status
  getCheckoutByReturnStatus: (db, return_status) => {
    let query = `SELECT * FROM checkouts WHERE return_status = ${return_status}`;
    let results = generalQuery(db, query, "all");
    return results;
  },
  //get checkout by available status
  getCheckoutByAvailableStatus: (db, available_status) => {
    let query = `SELECT * FROM checkouts WHERE available = ${available_status}`;
    let results = generalQuery(db, query, "all");
    return results;
  },
  //insert a checkout
  insertCheckout: (db, assetIds, startDate, endDate, userId) => {
    // Check if the user has already checked out the specified asset IDs
    const duplicate_checkout = db
      .prepare(
        `
      SELECT asset_id
      FROM checkouts
      WHERE asset_id IN (${assetIds.join(",")})
      AND user_id = '${userId}'
      AND return_date IS NULL
    `
      )
      .all();

    if (duplicate_checkout.length > 0) {
      console.log("Duplicate checkout: " + duplicate_checkout);
      return {
        code: "DUPLICATE_CHECKOUT",
        message:
          "Some of the specified assets are already checked out by the user. Resubmit request when assets are available",
        duplicates: duplicate_checkout,
      };
    }

    // Check if the specified asset IDs are unavailable
    const unavailable_assets = db
      .prepare(
        `
      SELECT asset_id
      FROM checkouts
      WHERE asset_id IN (${assetIds.join(",")})
      AND available = 0
    `
      )
      .all();

    if (unavailable_assets.length > 0) {
      console.log("Unavailable assets: " + unavailable_assets);
      return {
        code: "UNAVAILABLE_ASSETS",
        message:
          "Some of the specified assets are unavailable. Resubmit request when assets are available",
        unavailable: unavailable_assets,
      };
    }

    // Insert checkout records into the checkouts table where the assets are marked are still available but not yet approved and handle errors
    try {
      const insertAssetIds = db
        .prepare(
          `
        INSERT INTO checkouts (asset_id, start_date, due_date, user_id, approval_status, available)
        VALUES ${assetIds
          .map(
            (assetId) =>
              `(${assetId}, '${startDate}', '${endDate}', '${userId}', 0, 0)`
          )
          .join(",")}
      `
        )
        .run();

      // Return the IDs of the assets that were successfully checked out
      return insertAssetIds;
    } catch (error) {
      console.log("Error inserting checkout: " + error);
      return {
        code: "ERROR_INSERTING_CHECKOUT",
        message: "Error inserting checkout. Please try again",
        error: error,
      };
    }
  },
  //update a checkout
  updateCheckout: (
    db,
    checkout_id,
    asset_id,
    start_date,
    end_date,
    user_id,
    approval_status,
    checkout_notes,
    return_date,
    available
  ) => {
    let query = checkoutQueries.createUpdateCheckoutsQuery(
      checkout_id,
      asset_id,
      start_date,
      end_date,
      user_id,
      approval_status,
      checkout_notes,
      return_date,
      available
    );
    let results = generalQuery(db, query, "run");
    return results;
  },
  //delete a checkout
  deleteCheckout: (db, checkout_id) => {
    let query = checkoutQueries.createDeleteCheckoutsQuery(checkout_id);
    let results = generalQuery(db, query, "run");
    return results;
  },
  //approve a checkout
  approveCheckouts: (db, checkout_id) => {
    let results = db
      .prepare(
        `
      UPDATE checkouts
      SET approval_status = 1, available = 0
      WHERE checkout_id IN (${checkout_id.join(",")})
    `
      )
      .run();
    return results;
  },
  //deny a checkout
  denyCheckouts: (db, checkoutIds) => {
    // Set the approval_status value for the specified checkout records
    db.prepare(
      `
      UPDATE checkouts
      SET approval_status = 2
      WHERE checkout_id IN (${checkoutIds.join(",")})
    `
    ).run();
  },
  //return a checkout
  returnItems: (db, checkoutIds, returnDate) => {
    // Set the return_date and available values for the specified checkout records
    db.prepare(
      `
      UPDATE checkouts
      SET return_date = ?, available = 1
      WHERE checkout_id IN (${checkoutIds.join(",")})
    `
    ).run(returnDate);
  },
  //lock a checkout
  lockCheckout: (db, checkout_id) => {
    let query = checkoutQueries.createLockCheckoutQuery(checkout_id);
    let results = generalQuery(db, query, "run");
    return results;
  },
  //unlock a checkout
  unlockCheckout: (db, checkout_id) => {
    let query = checkoutQueries.createUnlockCheckoutQuery(checkout_id);
    let results = generalQuery(db, query, "run");
    return results;
  },
  //get all pending checkouts
  getAllPendingCheckouts: (db) => {
    let query = checkoutQueries.createGetPendingCheckoutsQuery();
    let results = generalQuery(db, query, "all");
    return results;
  },
  //get all approved checkouts
  getAllApprovedCheckouts: (db) => {
    let query = checkoutQueries.createApproveCheckoutQuery();
    let results = generalQuery(db, query, "all");
    return results;
  },
  //Get assets that are available for checkout given an array of asset ids and return list of asset ids that are available
  getUnavailableAssets: (db, asset_id_array) => {
    let query =
      checkoutQueries.createGetUnavailableCheckoutsQuery(asset_id_array);
    let results = generalQuery(db, query, "all");

    let available_assets = [];
    for (let i = 0; i < results.length; i++) {
      available_assets.push(results[i].asset_id);
    }
    return available_assets;
  },
  //Get user checkout history
  getUserCheckoutHistory: (db, user_id) => {
    let query = `
      SELECT * FROM checkouts
      WHERE user_id = ${user_id}`;

    console.log(query);
    let results = generalQuery(db, query, "all");
    return results;
  },
};

//Function that holds all the queries for the checkout table
let checkoutQueries = {
  //get all checkouts
  getAllCheckouts: "SELECT * FROM checkouts",
  //get checkout by id and start_date is in between begin_date and end_date
  getCheckoutsById: (checkout_id, begin_date, end_date) => {
    let query = `SELECT * FROM checkouts WHERE checkout_id = ${checkout_id} AND start_date BETWEEN ${begin_date} AND ${end_date}`;
    return query;
  },

  //get checkout by user id
  getCheckoutByUserId: (user_id) => {
    let query = `SELECT * FROM checkouts WHERE user_id = ${user_id}`;
    return query;
  },
  //get checkout by asset id
  getCheckoutByAssetId: (asset_id) => {
    let query = `SELECT * FROM checkouts WHERE asset_id = ${asset_id}`;
    return query;
  },
  //get checkout by approval status
  getCheckoutByApprovalStatus: (approval_status) => {
    let query = `SELECT * FROM checkouts WHERE approval_status = ${approval_status}`;
    return query;
  },
  createInsertCheckoutsQuery: (asset_id, start_date, end_date, user_id) => {
    //asset_id is an array of asset ids that the user wants to checkout
    //Loop through the array and create a query for each asset
    //Each values will set the approval status to 0 (pending) and aa available status to 1 (available)
    let query = `INSERT INTO checkouts (asset_id, start_date, due_date, user_id, approval_status, available) VALUES `;
    for (let i = 0; i < asset_id.length; i++) {
      query += `(${asset_id[i]}, '${start_date}', '${end_date}', ${user_id}, 0, 1)`;
      if (i < asset_id.length - 1) {
        query += `,`;
      }
    }
    return query;
  },
  createGetCheckoutsQuery: (checkout_id) => {
    //checkout_id is an array of checkout_ids
    //validate input
    if (checkout_id == null) {
      return "Error: checkout_id is null";
    }
    //check if checkout_id is an array
    if (Array.isArray(checkout_id)) {
      //create a query to get all checkouts
      let query = "SELECT * FROM checkouts WHERE checkout_id IN (";
      //add all checkout_ids to the query
      for (let i = 0; i < checkout_id.length; i++) {
        query += checkout_id[i];
        if (i < checkout_id.length - 1) {
          query += ",";
        }
      }
      query += ")";
      return query;
    } else {
      //create a query to get the checkout
      let query = `SELECT * FROM checkouts WHERE checkout_id = ${checkout_id}`;
      return query;
    }
  },
  createUpdateCheckoutsQuery: (
    checkout_id,
    asset_id,
    start_date,
    end_date,
    user_id,
    approval_status,
    checkout_notes,
    return_date,
    available
  ) => {
    //validate input
    if (
      checkout_id == null ||
      asset_id == null ||
      start_date == null ||
      end_date == null ||
      user_id == null ||
      approval_status == null ||
      checkout_notes == null ||
      return_date == null ||
      available == null
    ) {
      return "Error: one or more input values are null";
    }
    //create a query to update the checkout
    let query = `UPDATE checkouts SET asset_id = ${asset_id}, start_date = '${start_date}', end_date = '${end_date}', user_id = ${user_id}, approval_status = ${approval_status}, checkout_notes = '${checkout_notes}', return_date = '${return_date}', available = ${available} WHERE checkout_id = ${checkout_id}`;
    return query;
  },
  createDeleteCheckoutsQuery: (checkout_id) => {
    //validate input
    if (checkout_id == null) {
      return "Error: checkout_id is null";
    }
    //create query
    return `
    DELETE FROM checkout WHERE checkout_id = '${checkout_id}'`;
  },
  createApproveCheckoutQuery: (checkout_id) => {
    //validate input
    if (checkout_id == null) {
      return "Error: checkout_id is null";
    }
    //create query where checkout_id is in the array
    let query = `UPDATE checkouts SET approval_status = 0, available = 0 WHERE checkout_id IN (`;
    for (let i = 0; i < checkout_id.length; i++) {
      query += checkout_id[i];
      if (i < checkout_id.length - 1) {
        query += ",";
      }
    }
    query += ")";
    return query;
  },
  createDenyCheckoutQuery: (checkout_id, checkout_msg) => {
    //validate input
    if (checkout_id == null) {
      return "Error: checkout_id is null";
    }
    //create query
    return `
    UPDATE checkouts 
    SET approval_status = 2, available = 1, checkout_notes = '${checkout_msg}' 
    WHERE checkout_id IN (${checkout_id})`;
  },
  //function to create a query to return a checkout where an array of checkout_ids is passed in as a parameter and the return_date is set to the current date, available is set to 1, and approval_status is set to 1
  createReturnCheckoutQuery: (checkout_id) => {
    //validate input
    if (checkout_id == null) {
      return "Error: checkout_id is null";
    }
    //Loop through the array and create a query for each checkout
    let query =
      "UPDATE checkouts SET return_date = CURRENT_DATE, available = 1, approval_status = 1 WHERE checkout_id IN (";
    //add all checkout_ids to the query
    for (let i = 0; i < checkout_id.length; i++) {
      query += checkout_id[i];
      if (i < checkout_id.length - 1) {
        query += ",";
      }
    }
    query += ")";
    return query;
  },
  //function to create a query to lock a checkout where an array of checkout_ids is passed in as a parameter and the available is set to 0
  createLockCheckoutQuery: (checkout_id) => {
    //validate input
    if (checkout_id == null) {
      return "Error: checkout_id is null";
    }
    //Loop through the array and create a query for each checkout
    let query = "UPDATE checkouts SET available = 0 WHERE checkout_id IN (";
    //add all checkout_ids to the query
    for (let i = 0; i < checkout_id.length; i++) {
      query += checkout_id[i];
      if (i < checkout_id.length - 1) {
        query += ",";
      }
    }
    query += ")";
    return query;
  },
  //function to create a query to unlock a checkout where an array of checkout_ids is passed in as a parameter and the available is set to 1
  createUnlockCheckoutQuery: (checkout_id) => {
    //validate input
    if (checkout_id == null) {
      return "Error: checkout_id is null";
    }
    //Loop through the array and create a query for each checkout
    let query = "UPDATE checkouts SET available = 1 WHERE checkout_id IN (";
    //add all checkout_ids to the query
    for (let i = 0; i < checkout_id.length; i++) {
      query += checkout_id[i];
      if (i < checkout_id.length - 1) {
        query += ",";
      }
    }
    query += ")";
    return query;
  },
  //function to create a query to get all pending checkouts that are available and have not been approved or denied yet and have not been returned
  createGetPendingCheckoutsQuery: () => {
    return `
    SELECT * FROM checkouts WHERE approval_status = 0 AND available = 1 AND return_date IS NULL`;
  },
  //function to create a query to get all approved checkouts that are available and have not been returned
  createGetApprovedCheckoutsQuery: () => {
    return `
    SELECT * FROM checkouts WHERE approval_status = 1 AND available = 1 AND return_date IS NULL`;
  },
  //function to create a query to get all denied checkouts that are available and have not been returned
  createGetDeniedCheckoutsQuery: () => {
    return `
    SELECT * FROM checkouts WHERE approval_status = 2 AND available = 1 AND return_date IS NULL`;
  },
  //function to create a query to get all returned checkouts that are available
  createGetReturnedCheckoutsQuery: () => {
    return `
    SELECT * FROM checkouts WHERE return_date IS NOT NULL AND available = 1`;
  },
  //Function to create a query to get all checkouts that are available given an array of asset_ids
  createGetUnavailableCheckoutsQuery: (asset_id) => {
    //validate input
    if (asset_id == null) {
      return "Error: asset_id is null";
    }
    //create a query where asset_id is in the array
    let query = `SELECT * FROM checkouts WHERE asset_id IN (`;
    for (let i = 0; i < asset_id.length; i++) {
      query += asset_id[i];
      if (i < asset_id.length - 1) {
        query += ",";
      }
    }
    query += ") AND available = 0";
    return query;
  },
};

module.exports = {
  generalQuery,
  initializeDatabase,
  checkoutManager,
  sessionManager,
  assetManager,
};

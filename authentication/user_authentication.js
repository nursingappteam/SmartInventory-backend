const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

//import crypto module
const crypto = require("crypto");

// Create user with bcrypt
let createUserQuery = (username, password, email, user_type) => {
  //Use bcrypt syncronously salt and hash password
  let salt = bcrypt.genSaltSync(10);
  let hash = bcrypt.hashSync(password, salt);
  return `
    INSERT INTO users (user_id, user_email, user_name, user_pass_secure, user_type_id, user_enabled, salt, register_date)
    VALUES (NULL, '${email}', '${username}', '${hash}', '${user_type}', '1', '${salt}', CURRENT_TIMESTAMP);
  `;
};

// Verify user log with bcrypt
let validate_password = (password, user_pass_secure) => {
  //log user_pass_secure and password
  console.log("user_pass_secure: ", user_pass_secure);
  console.log("password from user: ", password);
  //Syncronously compare password with hash
  return bcrypt.compareSync(password, user_pass_secure);
};

//reset password
let resetPasswordQuery = (user_id, password) => {
  //Use bcrypt syncronously salt and hash password
  let salt = bcrypt.genSaltSync(10);
  let hash = bcrypt.hashSync(password, salt);
  return `
    UPDATE users
    SET user_pass_secure = '${hash}', salt = '${salt}'
    WHERE user_id = '${user_id}';
  `;
};

//create user session with user_id and checkout_cart array that holes asset_ids and quantity
let createUserSession = (db, user) => {
  console.log(user);
  // Check if a session for the specified user already exists
  const existingSession = db
    .prepare(
      `
    SELECT *
    FROM sessions
    WHERE user_id = ?
  `
    )
    .get(user.user_id);

  // If a session for the specified user already exists, return the existing session ID
  if (existingSession) {
    console.log("\n\nexisting session: " + existingSession.sid);
    return existingSession.sid;
  }

  // Initialize the sess object with data from the user object
  const sess = {
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      httpOnly: false,
      originalMaxAge: null,
      path: "/",
    },
    user_data_items: {
      user_email: user.user_email,
      user_enabled: user.user_enabled,
      user_id: user.user_id,
      user_name: user.user_name,
      user_session_data: {
        checkout_cart: [],
        checkout_count: 0,
      },
      user_type_id: user.user_type_id,
    },
  };
  // Generate a session ID
  const sid = uuidv4();

  // Insert a new session record into the sessions table
  try {
    db.prepare(
      `
    INSERT INTO sessions (sid, user_id, sess, expire)
    VALUES (?, ?, ?, ?)
  `
    ).run(sid, user.user_id, JSON.stringify(sess), sess.cookie.expires);
  } catch (err) {
    console.log(err);
    return {
      error: err,
    };
  }

  // Return the session ID
  return sid;
};

//generate

let getUserQuery = (username) => {
  return `SELECT user_id FROM users WHERE user_name = '${username}'`;
};
module.exports = {
  createUserQuery,
  validate_password,
  getUserQuery,
  resetPasswordQuery,
  createUserSession,
};

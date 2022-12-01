const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid')
// Create user with bcrypt
let createUserQuery = (username, password, email, user_type) => {
  //Use bcrypt syncronously salt and hash password
  let salt = bcrypt.genSaltSync(10);
  let hash = bcrypt.hashSync(password, salt);
  return `
    INSERT INTO users (user_id, user_email, user_name, user_pass_secure, user_type_id, user_enabled, salt, register_date)
    VALUES (NULL, '${email}', '${username}', '${hash}', '${user_type}', '1', '${salt}', CURRENT_TIMESTAMP);
  `
}

// Verify user log with bcrypt
let validate_password = (password,user_pass_secure) => {
  //log user_pass_secure and password
  console.log("user_pass_secure: ", user_pass_secure);
  console.log("password from user: ", password);
  //Syncronously compare password with hash
  return bcrypt.compareSync(password, user_pass_secure);
}

//reset password
let resetPasswordQuery = (user_id, password) => {
  //Use bcrypt syncronously salt and hash password
  let salt = bcrypt.genSaltSync(10);
  let hash = bcrypt.hashSync(password, salt);
  return `
    UPDATE users
    SET user_pass_secure = '${hash}', salt = '${salt}'
    WHERE user_id = '${user_id}';
  `
}

//create user session with user_id and checkout_cart array that holes asset_ids and quantity
let createUserSession = (user_object) => {
    //

    let session_id = uuid()
    //Create expire date
    let expire = Date.now() + 3600000
    //Create session where user data is part of cookie
    let sessionData = {
     cookie: {
        originalMaxAge: null,
        expires: expire,
        httpOnly: false,
        path: '/'
      },
      user_data_items: {
        user_id: user_object["user_id"],
        user_name: user_object["user_name"],
        user_type_id: user_object["user_type_id"],
        user_email: user_object["user_email"],
        user_enabled: user_object["user_enabled"],
        user_session_data: {
          checkout_cart: [],
          checkout_count: 0,
        }
      }
    }
    //Create session query
    
    let createSessionQuery = `INSERT INTO sessions (sid, user_id, sess, expire) VALUES ('${session_id}', '${user_object["user_id"]}','${JSON.stringify(sessionData)}', '${expire}')`
    console.log(sessionData)
    return createSessionQuery
}






let getUserQuery = (username) => {
  return `SELECT user_id FROM users WHERE user_name = '${username}'`
}
module.exports = {createUserQuery, validate_password, getUserQuery, resetPasswordQuery, createUserSession};
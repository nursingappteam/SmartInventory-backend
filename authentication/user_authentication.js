var md5 = require('md5');

let createUserQuery = (username, password, email, user_type) => {
  let hash;
  try{
    const salt = Math.random().toString(36).substring(2,7);
    let hash = md5(password+salt);
    //console.log("HASH: ", hash);
    return `
      INSERT INTO users (user_id, user_email, user_name, user_pass_secure, user_type_id, user_enabled, salt, register_date)
      VALUES (NULL, '${email}', '${username}', '${hash}', '${user_type}', '1', '${salt}', CURRENT_TIMESTAMP);
    `
  } catch(err) {
    console.log();
    return ``
  }
}

let verifyUserQuery = (username, password, salt) => {
  try{
    let hash = md5(password+salt);
    //console.log("HASH: ", hash);
    return `
    SELECT user_id, user_name, user_type_id, user_enabled, register_date FROM users WHERE user_name = '${username}'
    AND user_pass_secure = '${hash}'
    `
  } catch(err){
    console.log();
    return ``
  }
}

let getUserQuery = (username) => {
  return `SELECT user_id FROM users WHERE user_name = '${username}'`
}
module.exports = {createUserQuery, verifyUserQuery, getUserQuery};
var md5 = require('md5');

let createUserQuery = (username, password, user_type) => {
  let hash;
  try{
    const salt = Math.random().toString(36).substring(2,7);
    let hash = md5(password+salt);
    //console.log("HASH: ", hash);
    return `
      INSERT INTO users (user_id,user_name,user_pass_secure,user_type_id,user_enabled,salt,register_date)
      VALUES(NULL,'${username}','${hash}',1,1,'${salt}',datetime('now','localtime'))`
    
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
var md5 = require('md5');

let createUserQuery = (username, password, user_type) => {
  let hash;
  try{
    const salt = Math.random().toString(36).substring(2,7);
    let hash = md5(password+salt);
    console.log("HASH: ", hash);
    return `
      INSERT INTO users (user_id,user_name,user_pass_secure,user_type_id,user_enabled,salt,register_date)
      VALUES(NULL,'${username}','${hash}',1,1,'${salt}',datetime('now','localtime'))`
    
  } catch(err) {
    
  }
}

let verifyUserQuery = () => {
  
}

module.exports = {createUserQuery, verifyUserQuery};
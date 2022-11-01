const argon2 = require("argon2");

let createUser = (username, password) => {
  let hash;
  try{
    const salt = Math.random().toString(36).substring(2,7);
    let hash = argon2.hash(password, {salt: salt});
    console.log("HASH: ", hash);
    let query = `INSERT INTO USERS`
    
  } catch(err) {
    
  }
}

let verifyUser = () => {
  
}

module.export = {createUser, verifyUser};
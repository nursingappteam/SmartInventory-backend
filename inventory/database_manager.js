const { v4: uuid } = require('uuid')
/*
Existing tables
1) assets
2) approval_statuses
3) checkout
4) users
5) user_types
*/
let generalQuery = (db, query, query_type) => {
  if(query_type === "get"){
    try{
      const stmt = db.prepare(query)
      const results = stmt.get()
      return results
    } 
    catch (err){
      console.log(err)
      return err
    }
  }
  else if(query_type === "run"){
    try{
      const stmt = db.prepare(query)
      const results = stmt.run()
      return results
    } 
    catch (err){
      console.log(err)
      return err
    }
  }
  else {
    try{
      const stmt = db.prepare(query)
      const results = stmt.all()
      return results
    } 
    catch (err){
      console.log(err)
      return err
    }
  }
}

//Define session manager
/*
Session table has the following columns:
1) sid - session id
2) user_id - user id
2) sess - session data (JSON) as string:
    cookie: {
          originalMaxAge: null,
          expires: expire,
          httpOnly: false,
          path: '/'
        },
        user_data: {
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
3) expire - session expiration


*/
let sessionManager = {
  //Get session data
  getSessionData: (db, session_id) => {
    let sessionData = generalQuery(db, `SELECT sess FROM sessions WHERE sid = '${session_id}'`, "get")
    //console.log("*SessionManager*: sessionData: ", sessionData)
    //Check if session data is null
    if(sessionData === undefined){
      return null
    }
    else{
      return sessionData["sess"]
    }
  },
  //Get session id
  getSessionId: (db, user_id) => {
    let sessionId = generalQuery(db, `SELECT sid FROM sessions WHERE user_id = '${user_id}'`, "get")
    console.log("*SessionManager*: sessionId: ", sessionId)
    //Check if session id is null
    if(sessionId === undefined){
      return null
    }
    else{
      return sessionId
    }
  },
  //delete session when user logs out or session expires
  deleteSession: (db, session_id) => {
    let deleteSessionQuery = `DELETE FROM sessions WHERE sid = '${session_id}'`
    let deleteSession = generalQuery(db, deleteSessionQuery, "run")
    console.log("*SessionManager*: deleteSession: ", deleteSession)
    return deleteSession
  },
  //Create session with user information and expiration date as well as user_session_data if provided which is used to store user specific data such as cart
  createSession: (db, newSessionInsertQuery, user_id) => {
    //Check user_id has existing session
    let existingSession = generalQuery(db, `SELECT * FROM sessions WHERE user_id = '${user_id}'`, "get")
    //let existingSession = sessionManager.checkSession(db, user_id)
    //console.log("\n*existingSession: ", existingSession)
    //Check if existing session is null
    if(existingSession === undefined || existingSession === null){
      //Create new session
      let newSession = generalQuery(db, newSessionInsertQuery, "run")
      //console.log("/n*SessionManager*: newSession: ", newSession)
      let session_id = sessionManager.getSessionId(db, user_id)
      console.log("*SessionManager*: newSession: ", session_id)
      return {
        name: "inventory_session_id",
        value: session_id,
        options: {
          httpOnly: false,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          path: '/',
          SameSite: 'None',
        }
      }
    }
    else{
      //Return existing session
      return {
        name: "inventory_session_id",
        value: existingSession["sid"],
        options: {
          httpOnly: false,
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          path: '/',
          SameSite: 'None',

        }
      }
    }
  },
  //Update session with user information and expiration date as well as user_session_data if provided which is used to store user specific data such as cart
  updateSession: (db, session_id, user_id, user_type_id, user_name, user_email, user_session_data) => {
    //Create expire date
    let expire = Date.now() + 3600000
    console.log(expire)
    //Create session
    let updateSessionQuery = `
    UPDATE sessions
    SET sess
    = '{"cookie":{"originalMaxAge":null,"expires":${expire},"httpOnly":false,"path":"/"},"user_data":{"user_id":"${user_id}","user_type_id":"${user_type_id}","user_name":"${user_name}","user_email":"${user_email}","user_session_data":${user_session_data}}}'
    WHERE sid = '${session_id}'
    `
    let updateSession = generalQuery(db, updateSessionQuery, "run")
    console.log("*SessionManager*: updateSession: ", updateSession)
    return updateSession
  },
  //Check if user has an expired session
  checkSession: (db, session_id) => {
    //Get session data
    let sessionData = generalQuery(db, `SELECT * FROM sessions WHERE sid = '${session_id}'`, "get")
    //console.log("*SessionManager*: sessionData: ", sessionData)
    //Check if session data is null
    if(sessionData === undefined){
      return null
    }
    else{
      //Get session expiration
      let sessionExpiration = sessionData.expire
      //Check if session has expired
      if(sessionExpiration < Date.now()){
        //Delete session
        let deleted_session = sessionManager.deleteSession(db, sessionData.sid)
        console.log("*SessionManager*: deleted_session: ", deleted_session)
        return null
      }
      else{
        console.log("Valid session")
        return sessionData["sid"]
      }
    }
  },
  //update session data checkout cart with array of asset ids and checkout count
  updateSessionCheckoutCart: (db, session_id, checkout_cart) => {
    //get checkout count
    let checkout_count = checkout_cart.length
    //Get session data
    let sessionData = sessionManager.getSessionData(db, session_id)
    console.log(sessionData)
    //Check if session data is null
    if(sessionData === undefined || sessionData === null){
      return null
    }
    else{
      //console.log(sessionData["sess"])
      //Get user_session_data string and parse to JSON
      let parsed_sessionData = JSON.parse(sessionData)
      //get expire date
      let expire = parsed_sessionData["cookie"]["expires"]
      //console.log(parsed_sessionData)
      //Update user_session_data
      let user_session_data = parsed_sessionData["user_data_items"]["user_session_data"]
      
      
      //Update user_session_data
      user_session_data.checkout_cart = checkout_cart
      user_session_data.checkout_count = checkout_count
      console.log(user_session_data)
      //stringify user_session_data
      let user_session_data_string = JSON.stringify(user_session_data)
      console.log(user_session_data_string)
      //Update session
      let updateSession = sessionManager.updateSession(db, session_id, sessionData.user_id, sessionData.user_type_id, sessionData.user_name, sessionData.user_email, user_session_data_string)
      return updateSession
    }
    

  },
  //get user session checkout cart
  getSessionCheckoutCart: (db, session_id) => {
    //Get session data
    let sessionData = sessionManager.getSessionData(db, session_id)
    //Check if session data is null
    if(sessionData === undefined){
      return null
    }
    else{
      //Get user_session_data
      let user_session_data = sessionData.user_session_data
      //Get checkout cart
      let checkout_cart = user_session_data.checkout_cart
      return checkout_cart
    }
  },
  //validate session exists and is not expired
  validateSession: (db, session_id) => {
    //Get session data
    let sessionData = sessionManager.getSessionData(db, session_id)
    //Check if session data is null
    if(sessionData === undefined || sessionData === null){
      return null
    }
    else{
      //Get session expiration
      let sessionExpiration = sessionData.expire
      //Check if session has expired
      if(sessionExpiration < Date.now()){
        //Delete session
        let deleted_session = sessionManager.deleteSession(db, sessionData.sid)
        console.log("*SessionManager*: deleted_session: ", deleted_session)
        return null
      }
      else{
        console.log("Valid session")
        return sessionData
      }
    }
  }
}


    





//Define asset manager
let assetManager = {
  //get all assets
  getAllAssets: (db) => {
    let query = "SELECT * FROM assets"
    let results = generalQuery(db, query, "all")
    return results
  },
  //get asset by id
  getAssetById: (db, asset_id) => {
    //let query = `SELECT * FROM assets WHERE asset_id = ${asset_id}`
    let results = getAssetByIdArray(db, asset_id)
    return results
  },
  //get asset by name
  getAssetByName: (db, asset_name) => {
    let query = `SELECT * FROM assets WHERE asset_name = ${asset_name}`
    let results = generalQuery(db, query, "get")
    return results
  },
  //get asset by type
  getAssetByType: (db, asset_type) => {
    let query = `SELECT * FROM assets WHERE asset_type = ${asset_type}`
    let results = generalQuery(db, query, "get")
    return results
  }
}

//define get asset by id array
let getAssetByIdArray = (db, asset_id_array) => {
  let query = `SELECT * FROM assets WHERE asset_id IN (${asset_id_array})`
  let results = generalQuery(db, query, "all")
  return results
}




// Define checkout manager
let checkoutManager = {
  //function to create a checkout
  createCheckout: (db, checkout) => {
    /* checkoout object
    {
      asset_id: [1,2,3],
      user_id: 1,
      checkout_date: "2020-01-01",
      due_date: "2020-01-01",
      return_date: "2020-01-01",
      checkout_notes: "notes"
    }
    */
    //Check if asset is available assuming asset_id is an array of asset_ids

    //define results with unavailable assets array and available assets array
    let results = {
      unavailable_assets: [],
      available_assets: [],
      query_results: []
    }
    
    //available assets
    let available_assets = checkoutManager.getAvailableCheckoutsByAssetId(db, checkout.asset_id)
    //console.log(available_assets)
    //if there are records in available_assets then will check each asset to see if it is available
    if (available_assets.length > 0){
      //Check each asset to see if it is available return unavailable asset
      //If any asset is not available, return error
      // available = 1 if asset is available
      // available = 0 if asset is not available
      for (let i = 0; i < available_assets.length; i++){
        console.log(available_assets[i].available)
        if (available_assets[i].available == 0){
          results.unavailable_assets.push(available_assets[i])
        }
        else if( available_assets[i].available == 1){
          results.available_assets.push(available_assets[i])
        }
      }

      if (results.available_assets.length > 0){
        for (let i = 0; i < results.available_assets.length; i++){
          let query = createInsertCheckoutsQuery(results.available_assets[i].asset_id, checkout.start_date, checkout.due_date, checkout.user_id)
          //push query results to results object
          //results.query_results.push(generalQuery(db, query, "run"))
        }
      }
      else{
        return results
      }
    }
    else{
      for (let i = 0; i < checkout.asset_id.length; i++){
        let query = createInsertCheckoutsQuery(checkout.asset_id[i], checkout.checkout_date, checkout.due_date, checkout.user_id)
        //push query results to results object
        results.query_results.push(generalQuery(db, query, "run"))
      }
    }
    return results
  },
  //function to approve a checkout
  approveCheckout: (db, checkout_item) => {
    //validate input
    if (checkout_item == null){
      return "checkout object is required"
    }
    //create query
    let query = `
      UPDATE checkout
      SET approval_status = 1, available = 0
      WHERE checkout_id in (${checkout_item.checkout_id})
    `
    //run query
    let results = generalQuery(db, query, "run")
    // Deny checkouts that are pending and have the same asset_id
    deny_results = checkoutManager.denyCheckoutsConflict(db, checkout_item.checkout_id, checkout_item.asset_id)
    

    return results
  },
  //function to deny a checkout with id array and notes
  denyCheckout: (db, checkout_id, notes) => {
    //validate input
    if (checkout_id == null){
      return "checkout_id is required"
    }
    if (notes == null){
      return "notes is required"
    }
    //create query
    let query = `
      UPDATE checkout
      SET approval_status = 2, available = 1, notes = ${notes}
      WHERE checkout_id in (${checkout_id})
    `
    //run query
    let results = generalQuery(db, query, "run")
    return results
  },
  //function to set checkouts to denied if another checkout is approved
  denyCheckoutsConflict: (db, checkout_id, asset_id) => {
    //validate input
    if (checkout_id == null){
      return "checkout_id is required"
    }
    //create query
    let query = `
      UPDATE checkout
      SET approval_status = 2, available = 1, notes = "Another checkout was approved for this asset"
      WHERE checkout_id NOT IN (${checkout_id})
      AND asset_id IN (${asset_id})
    `
    //run query
    let results = generalQuery(db, query, "run")
    return results
  },
  //function to get all checkouts
  getCheckouts: (db) => {
      //create a query to get all checkouts
      let query = "SELECT * FROM checkout"
      //run the queryn
      let results = generalQuery(db, query, "all")
      //return the results
      return results
  },
  //function to get a checkout
  getCheckout: (db, checkout) => {
      //create a query to get the checkout
      let query = createGetCheckoutsQuery(checkout.checkout_id)
      //run the query
      let results = generalQuery(db, query, "get")
      //return the results
      return results
  },
  //function to update a checkout
  updateCheckout: (db, checkout) => {
      //create a query to update the checkout
      let query = createUpdateCheckoutsQuery(checkout.checkout_id, checkout.asset_id, checkout.start_date, checkout.end_date, checkout.user_id, checkout.approval_status, checkout.return_status)
      //run the query
      let results = generalQuery(db, query, "run")
      //return the results
      return results
  },
  //function to delete a checkout
  deleteCheckout: (db, checkout) => {
      //create a query to delete the checkout
      let query = createDeleteCheckoutsQuery(checkout.checkout_id)
      //run the query
      let results = generalQuery(db, query, "run")
      //return the results
      return results
  },
  //function to get active checkouts
  getAvailableCheckouts: (db) => {
      //create a query to get all active checkouts
      let query = "SELECT * FROM checkout WHERE available = '1'"
      //run the query
      let results = generalQuery(db, query, "all")
      //return the results
      return results
  },
  //function to get active checkout by asset id array input
  getAvailableCheckoutsByAssetId: (db, asset_id_array) => {
      //create a query to get all active checkouts
      let query = `SELECT * FROM checkout WHERE available = '1' AND asset_id IN (${asset_id_array})`
      //run the query
      let results = generalQuery(db, query, "all")
      //return the results
      return results
  }
}

//insert a checkout
let createInsertCheckoutsQuery = (asset_id,start_date,end_date,user_id) =>{
  return `
  INSERT INTO checkout (checkout_id, asset_id, start_date, due_date, user_id, approval_status, checkout_notes, return_date, available)
  VALUES (NULL, '${asset_id}', '${start_date}', '${end_date}', '${user_id}', 0,NULL,NULL, 1)` 
}

//get a checkout
let createGetCheckoutsQuery = (checkout_id) =>{
  //checkout_id is an array of checkout_ids
  //validate input
  if (checkout_id == null){
    return "Error: checkout_id is null"
  }
  //check if checkout_id is an array
  if (Array.isArray(checkout_id)){
    //create a query to get all checkouts
    let query = "SELECT * FROM checkouts WHERE checkout_id IN ("
    //add all checkout_ids to the query
    for (let i = 0; i < checkout_id.length; i++){
      query += checkout_id[i]
      if (i < checkout_id.length - 1){
        query += ","
      }
    }
    query += ")"
    return query
  }
  else {
    //create a query to get the checkout
    let query = `SELECT * FROM checkouts WHERE checkout_id = ${checkout_id}`
    return query
  }
}

//update a checkout
let createUpdateCheckoutsQuery = (checkout_id, asset_id, start_date, end_date, user_id, approval_status, return_status) =>{
  //validate input
  if (checkout_id == null){
      return "Error: checkout_id is null"
  }
  if (asset_id == null){
      return "Error: asset_id is null"
  }
  if (start_date == null){
      return "Error: start_date is null"
  }
  if (end_date == null){
      return "Error: end_date is null"
  }
  if (user_id == null){
      return "Error: user_id is null"
  }
  if (approval_status == null){
      return "Error: approval_status is null"
  }
  if (return_status == null){
      return "Error: return_status is null"
  }
  //create query
  return `
  UPDATE checkout SET asset_id = '${asset_id}', start_date = '${start_date}', end_date = '${end_date}', user_id = '${user_id}', approval_status = '${approval_status}', return_status = '${return_status}' WHERE checkout_id = '${checkout_id}'`
}

//delete a checkout
let createDeleteCheckoutsQuery = (checkout_id) =>{
  //validate input
  if (checkout_id == null){
      return "Error: checkout_id is null"
  }
  //create query
  return `
  DELETE FROM checkout WHERE checkout_id = '${checkout_id}'`
}


module.exports = {generalQuery, checkoutManager, sessionManager}
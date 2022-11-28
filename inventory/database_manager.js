
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
  //get all checkouts
  getAllCheckouts: (db) => {
    let query = "SELECT * FROM checkouts"
    let results = generalQuery(db, query, "all")
    return results
  },
  //get checkout by id
  getCheckoutById: (db, checkout_id) => {
    let query = createGetCheckoutsQuery(checkout_id)
    let results = generalQuery(db, query, "all")
    return results
  },
  //get checkout by user id
  getCheckoutByUserId: (db, user_id) => {
    let query = `SELECT * FROM checkouts WHERE user_id = ${user_id}`
    let results = generalQuery(db, query, "all")
    return results
  },
  //get checkout by asset id
  getCheckoutByAssetId: (db, asset_id, begin_date, end_date) => {
    let query = createGetCheckoutsQuery(asset_id, begin_date, end_date)
    let results = generalQuery(db, query, "all")
    return results
  },
  //get checkout by approval status
  getCheckoutByApprovalStatus: (db, approval_status) => {
    let query = `SELECT * FROM checkouts WHERE approval_status = ${approval_status}`
    let results = generalQuery(db, query, "all")
    return results
  },
  //get checkout by return status
  getCheckoutByReturnStatus: (db, return_status) => {
    let query = `SELECT * FROM checkouts WHERE return_status = ${return_status}`
    let results = generalQuery(db, query, "all")
    return results
  },
  //get checkout by available status
  getCheckoutByAvailableStatus: (db, available_status) => {
    let query = `SELECT * FROM checkouts WHERE available = ${available_status}`
    let results = generalQuery(db, query, "all")
    return results
  },
  //insert a checkout
  insertCheckout: (db, asset_id, start_date, end_date, user_id) => {
    //Prevent duplicate checkouts where asset_id is an array of asset ids and user_id is the user id
    //Query to check if any of the assets are already checked out
    let dupe_check = `SELECT * FROM checkouts WHERE asset_id IN (${asset_id}) AND user_id = ${user_id}`
    //console.log("dupe_check: " + dupe_check)
    let dupe_results = generalQuery(db, dupe_check, "all")
    console.log("dupe_results: " + dupe_results)
    if(dupe_results.length > 0){
      return {"code" : "DUPLICATE_CHECKOUT"}
    }
    else{
      let query = checkoutQueries.createInsertCheckoutsQuery(asset_id, start_date, end_date, user_id)
      console.log(query)
      let results = generalQuery(db, query, "run")
      return results
    }

  },
  //update a checkout
  updateCheckout: (db, checkout_id, asset_id, start_date, end_date, user_id, approval_status, checkout_notes, return_date, available) => {
    let query = checkoutQueries.createUpdateCheckoutsQuery(checkout_id, asset_id, start_date, end_date, user_id, approval_status, checkout_notes, return_date, available)
    let results = generalQuery(db, query, "run")
    return results
  },
  //delete a checkout
  deleteCheckout: (db, checkout_id) => {
    let query = checkoutQueries.createDeleteCheckoutsQuery(checkout_id)
    let results = generalQuery(db, query, "run")
    return results
  },
  //approve a checkout
  approveCheckout: (db, checkout_id) => {
    let query = checkoutQueries.createApproveCheckoutQuery(checkout_id)
    let results = generalQuery(db, query, "run")
    return results
  },
  //deny a checkout
  denyCheckout: (db, checkout_id) => {
    let query = checkoutQueries.createDenyCheckoutQuery(checkout_id)
    let results = generalQuery(db, query, "run")
    return results
  },  
  //return a checkout
  returnCheckout: (db, checkout_id) => {
    let query = checkoutQueries.createReturnCheckoutQuery(checkout_id)
    let results = generalQuery(db, query, "run")
    return results
  },
  //lock a checkout
  lockCheckout: (db, checkout_id) => {
    let query = checkoutQueries.createLockCheckoutQuery(checkout_id)
    let results = generalQuery(db, query, "run")
    return results
  },
  //unlock a checkout
  unlockCheckout: (db, checkout_id) => {
    let query = checkoutQueries.createUnlockCheckoutQuery(checkout_id)
    let results = generalQuery(db, query, "run")
    return results
  },
  //get all pending checkouts
  getAllPendingCheckouts: (db) => {
    let query = checkoutQueries.createGetPendingCheckoutsQuery()
    let results = generalQuery(db, query, "all")
    return results
  },
  //get all approved checkouts
  getAllApprovedCheckouts: (db) => {
    let query = checkoutQueries.createApproveCheckoutQuery()
    let results = generalQuery(db, query, "all")
    return results
  },
  //Get assets that are available for checkout given an array of asset ids and return list of asset ids that are available
  getUnavailableAssets: (db, asset_id_array) => {
    let query = checkoutQueries.createGetUnavailableCheckoutsQuery(asset_id_array)
    let results = generalQuery(db, query, "all")

    let available_assets = []
    for (let i = 0; i < results.length; i++) {
      available_assets.push(results[i].asset_id)
    }
    return available_assets
  }

}

//Function that holds all the queries for the checkout table
let checkoutQueries = {
  //get all checkouts
  getAllCheckouts: "SELECT * FROM checkouts",
  //get checkout by id and start_date is in between begin_date and end_date
  getCheckoutsById: (checkout_id,begin_date, end_date) => {
    let query = `SELECT * FROM checkouts WHERE checkout_id = ${checkout_id} AND start_date BETWEEN ${begin_date} AND ${end_date}`
    return query
  },

  //get checkout by user id
  getCheckoutByUserId: (user_id) => {
    let query = `SELECT * FROM checkouts WHERE user_id = ${user_id}`
    return query
  },
  //get checkout by asset id
  getCheckoutByAssetId: (asset_id) => {
    let query = `SELECT * FROM checkouts WHERE asset_id = ${asset_id}`
    return query
  },
  //get checkout by approval status
  getCheckoutByApprovalStatus: (approval_status) => {
    let query = `SELECT * FROM checkouts WHERE approval_status = ${approval_status}`
    return query
  },
  createInsertCheckoutsQuery: (asset_id,start_date,end_date,user_id) =>{
    //asset_id is an array of asset ids that the user wants to checkout
    //Loop through the array and create a query for each asset
    //Each values will set the approval status to 0 (pending) and aa available status to 1 (available)
    let query = `INSERT INTO checkouts (asset_id, start_date, due_date, user_id, approval_status, available) VALUES `
    for(let i = 0; i < asset_id.length; i++){
      query += `(${asset_id[i]}, '${start_date}', '${end_date}', ${user_id}, 0, 1)`
      if(i < asset_id.length - 1){
        query += `,`
      }
    }
    return query
    
  },
  createGetCheckoutsQuery: (checkout_id) =>{
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
  },
  createUpdateCheckoutsQuery: (checkout_id, asset_id, start_date, end_date, user_id, approval_status, checkout_notes, return_date, available) =>{
    //validate input
    if (checkout_id == null || asset_id == null || start_date == null || end_date == null || user_id == null || approval_status == null || checkout_notes == null || return_date == null || available == null){
      return "Error: one or more input values are null"
    }
    //create a query to update the checkout
    let query = `UPDATE checkouts SET asset_id = ${asset_id}, start_date = '${start_date}', end_date = '${end_date}', user_id = ${user_id}, approval_status = ${approval_status}, checkout_notes = '${checkout_notes}', return_date = '${return_date}', available = ${available} WHERE checkout_id = ${checkout_id}`
    return query
  },
  createDeleteCheckoutsQuery: (checkout_id) =>{
    //validate input
    if (checkout_id == null){
        return "Error: checkout_id is null"
    }
    //create query
    return `
    DELETE FROM checkout WHERE checkout_id = '${checkout_id}'`
  },
  createApproveCheckoutQuery: (checkout_id) =>{
    //validate input
    if (checkout_id == null){
      return "Error: checkout_id is null"
    }
    //create query where checkout_id is in the array
    let query = `UPDATE checkouts SET approval_status = 0, available = 0 WHERE checkout_id IN (`
    for (let i = 0; i < checkout_id.length; i++){
      query += checkout_id[i]
      if (i < checkout_id.length - 1){
        query += ","
      }
    }
    query += ")"
    return query
  },
  createDenyCheckoutQuery: (checkout_id) =>{
    //validate input
    if (checkout_id == null){
      return "Error: checkout_id is null"
    }
    //create query
    return `
    UPDATE checkouts SET approval_status = 2 WHERE checkout_id = ${checkout_id}`
  },
  //function to create a query to return a checkout where an array of checkout_ids is passed in as a parameter and the return_date is set to the current date, available is set to 1, and approval_status is set to 1
  createReturnCheckoutQuery: (checkout_id) =>{
    //validate input
    if (checkout_id == null){
      return "Error: checkout_id is null"
    }
    //Loop through the array and create a query for each checkout
    let query = "UPDATE checkouts SET return_date = CURRENT_DATE, available = 1, approval_status = 1 WHERE checkout_id IN ("
    //add all checkout_ids to the query
    for (let i = 0; i < checkout_id.length; i++){
      query += checkout_id[i]
      if (i < checkout_id.length - 1){
        query += ","
      }
    }
    query += ")"
    return query
  },
  //function to create a query to lock a checkout where an array of checkout_ids is passed in as a parameter and the available is set to 0
  createLockCheckoutQuery: (checkout_id) =>{
    //validate input
    if (checkout_id == null){
      return "Error: checkout_id is null"
    }
    //Loop through the array and create a query for each checkout
    let query = "UPDATE checkouts SET available = 0 WHERE checkout_id IN ("
    //add all checkout_ids to the query
    for (let i = 0; i < checkout_id.length; i++){
      query += checkout_id[i]
      if (i < checkout_id.length - 1){
        query += ","
      }
    }
    query += ")"
    return query
  },
  //function to create a query to unlock a checkout where an array of checkout_ids is passed in as a parameter and the available is set to 1
  createUnlockCheckoutQuery: (checkout_id) =>{
    //validate input
    if (checkout_id == null){
      return "Error: checkout_id is null"
    }
    //Loop through the array and create a query for each checkout
    let query = "UPDATE checkouts SET available = 1 WHERE checkout_id IN ("
    //add all checkout_ids to the query
    for (let i = 0; i < checkout_id.length; i++){
      query += checkout_id[i]
      if (i < checkout_id.length - 1){
        query += ","
      }
    }
    query += ")"
    return query
  },
  //function to create a query to get all pending checkouts that are available and have not been approved or denied yet and have not been returned
  createGetPendingCheckoutsQuery: () =>{
    return `
    SELECT * FROM checkouts WHERE approval_status = 0 AND available = 1 AND return_date IS NULL`
  },
  //function to create a query to get all approved checkouts that are available and have not been returned
  createGetApprovedCheckoutsQuery: () =>{
    return `
    SELECT * FROM checkouts WHERE approval_status = 1 AND available = 1 AND return_date IS NULL`
  },
  //function to create a query to get all denied checkouts that are available and have not been returned
  createGetDeniedCheckoutsQuery: () =>{
    return `
    SELECT * FROM checkouts WHERE approval_status = 2 AND available = 1 AND return_date IS NULL`
  },
  //function to create a query to get all returned checkouts that are available
  createGetReturnedCheckoutsQuery: () =>{
    return `
    SELECT * FROM checkouts WHERE return_date IS NOT NULL AND available = 1`
  },
  //Function to create a query to get all checkouts that are available given an array of asset_ids
  createGetUnavailableCheckoutsQuery: (asset_id) =>{  
    //validate input
    if (asset_id == null){
      return "Error: asset_id is null"
    }
    //create a query where asset_id is in the array
    let query = `SELECT * FROM checkouts WHERE asset_id IN (`
    for (let i = 0; i < asset_id.length; i++){
      query += asset_id[i]
      if (i < asset_id.length - 1){
        query += ","
      }
    }
    query += ") AND available = 0"
    return query
  }
    
}






module.exports = {generalQuery, checkoutManager, assetManager}
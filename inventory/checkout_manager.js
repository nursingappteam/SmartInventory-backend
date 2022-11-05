//define checkout manager
let checkoutManager = {
    //function to create a checkout
    createCheckout: (db, checkout) => {
        //create a query to insert the checkout
        let query = createInsertCheckoutsQuery(checkout.asset_id, checkout.start_date, checkout.end_date, checkout.user_id)
        //run the query
        let results = generalQuery(db, query, "run")
        //return the results
        return results
    },
    //function to get all checkouts
    getCheckouts: (db) => {
        //create a query to get all checkouts
        let query = "SELECT * FROM checkouts"
        //run the query
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
    }
}

//insert a checkout
let createInsertCheckoutsQuery = (asset_id,start_date,end_date,user_id) =>{
    return `
    INSERT INTO checkout (checkout_id, asset_id, start_date, end_date, user_id, approval_status, return_status)
    VALUES (NULL, '${asset_id}', '${start_date}', '${end_date}', '${user_id}', 0, 1)` 
}

//get a checkout
let createGetCheckoutsQuery = (checkout_id) =>{
    return `
    SELECT * FROM checkout WHERE checkout_id = '${checkout_id}'`
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

//export checkout manager






//export the checkout manager
module.exports = {checkoutManager}

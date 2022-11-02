

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

let createInsertCheckoutsQuery = (asset_id,start_date,end_date,user_id) =>{
  return `
  INSERT INTO checkout (checkout_id, asset_id, start_date, end_date, user_id, approval_status, return_status)
  VALUES (NULL, '${asset_id}', '${start_date}', '${end_date}', '${user_id}', 0, 1)` 
}

module.exports = {generalQuery, createInsertCheckoutsQuery}
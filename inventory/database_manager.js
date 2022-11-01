

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


module.exports = {generalQuery}


let generalQuery = (db, query) => {
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

module.exports = {generalQuery}
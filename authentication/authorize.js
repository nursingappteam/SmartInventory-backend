

module.exports = (API_KEY) => {
  return (req, res, next) => {
    console.log("Authorization Middleware");
    
    const token = req.headers['api_key'];
    if(!token){
      return res.status(401).json({
        status: 401,
        message: "Missing Authorization header"
      })
    }
    else {
      if(API_KEY != token){
        return res.status(401).json({
          status: 401,
          message: "Invalid API Key"
        })
      } else{
        next();
      }
    }
  }
}
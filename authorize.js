

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
      console.log(API_KEY);
      next();
    }
  }
}
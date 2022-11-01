
module.exports = () => {
  return (req, res, next) => {
    console.log("Authorization Middleware");
    
    const token req.headers('authorization');
  }
}
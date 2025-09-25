// utils/generateToken.js
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign(
    { id },  // payload
    process.env.JWT_SECRET,  // secret key (set in .env)
    { expiresIn: "30d" }     // token expiry
  );
};

module.exports = generateToken;
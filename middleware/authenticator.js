const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/user');

//verifying the user with the token secret key
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('auth-token');
    if (token) {
      const verified = jwt.verify(token, process.env.JWT_TOKEN_SECRET_KEY);
      if (verified) {
        const user = await User.findOne({ _id: verified._id });
        if (user) {
          req.user = user;
          next();
        } else {
          res.status(401).send('Access Denied');
        }
      } else {
        res.status(401).send('Access Denied');
      }
    } else {
      res.status(401).send('Access Denied');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;

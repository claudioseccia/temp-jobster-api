const express = require('express')
const router = express.Router()
const authenticateUser = require('../middleware/authentication');
const testUser = require("../middleware/testUser");

const { register, login, updateUser } = require('../controllers/auth');
const rateLimiter = require('express-rate-limit'); //requests will be limited on specific routes
const apiLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
      msg: 'Too many requests from this IP, please try again after 15 minutes',
    },
  });

//set apiLimiter for /register and /login routes
router.post('/register', apiLimiter, register)
router.post('/login', apiLimiter, login)

// router.patch('/updateUser', authenticateUser, updateUser);
//add testUser middleware to make a guard (test user is read only):
router.patch('/updateUser', authenticateUser, testUser, updateUser); 
module.exports = router

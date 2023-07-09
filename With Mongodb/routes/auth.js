const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

// GET
router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.get('/reset', authController.getReset);

router.get('/reset/:token', authController.getNewPassword);

// POST
router.post('/login', 
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.'),
    body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
  ], 
  authController.postLogin
);

router.post('/signup',  
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email address.')
      .custom((value, { req }) => {
        return User.findOne({ email: req.body.email })
          .then(userDoc => {
            if (userDoc) {
              return Promise.reject('E-Mail exists already, Please pick a different one.');
            }
          })
      }),
    body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters.'
    )
      .isLength({ min: 5 })
      .isAlphanumeric(),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords have to match!');
        }
        return true;
      })
  ], 
  authController.postSignup
);

router.post('/logout', authController.postLogout);

router.post('/reset', authController.postReset);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
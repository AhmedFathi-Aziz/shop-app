const express = require('express');
const {body, validationResult} = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email address.'),
        body(
            'password',
            'Please enter a password with only numbers and text and at least 5 characters.'
            )
            .isLength({ min:5 })
            .isAlphanumeric()
    ],
    authController.postLogin
);

router.post(
    '/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email address.')
            .custom((value, { req }) => {
                // if (value === 'admin@admin.com') {
                //     throw new Error('This email address is forbidden');
                // }
                // return true;
                return User.findOne({ where: { email: value } })
                    .then(user => {
                        if (user) {
                            return Promise.reject('Email exists already, please pick a different one.');
                        }
                });
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

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;
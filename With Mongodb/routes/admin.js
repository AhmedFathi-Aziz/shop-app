const path = require('path');

const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const is_auth = require('../middleware/is_auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', is_auth, adminController.getAddProduct);

// /admin/add-product => POST
router.post('/add-product',
  [
    body('title')
      .isString()
      .isLength({ min: 4 })
      .trim()
      .withMessage('Please enter a valid title'),
    body('price')
      .isFloat()
      .withMessage('Please enter a valid price'),
    body('description')
      .isLength({ min: 4, max: 255 })
      .trim()
      .withMessage('Please enter a valid description')
  ],
  is_auth, adminController.postAddProduct
);

// // /admin/products => GET
router.get('/products', is_auth, adminController.getProducts);


router.get('/edit-product/:productId', is_auth, adminController.getEditProduct);

router.post('/edit-product',
  [
    body('title')
      .isString()
      .isLength({ min: 4 })
      .trim()
      .withMessage('Please enter a valid title'),
    body('price')
      .isFloat()
      .withMessage('Please enter a valid price'),
    body('description')
      .isLength({ min: 4, max: 255 })
      .trim()
      .withMessage('Please enter a valid description')
  ], 
  is_auth, adminController.postEditProduct
);

router.delete('/product/:productId', is_auth, adminController.deleteProduct);

module.exports = router;

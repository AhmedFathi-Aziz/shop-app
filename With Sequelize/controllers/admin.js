const {body, validationResult} = require('express-validator');
const Product = require('../models/product');
const User = require('../models/user');
const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
  // if (!req.session.isLoggedIn) {
  //   return res.redirect('/login');
  // }
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasErrors: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  
  if (!image) {
    // 422: validation failed
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasErrors: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image',
      validationErrors: []
    });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('validation errors:', errors);
    // 422: validation failed
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasErrors: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  const imageUrl = image.path;
  User.findOne({ where: { id: req.session.user.id } } )
    .then(user => {
      return user.createProduct({
        title: title,
        price: price,
        imageUrl: imageUrl,
        description: description
      });
    })
    .then(result => {
      console.log('Product Created');
      res.redirect('/admin/products');
    })
    .catch(err => {
      // 500: server side issue occured
      // return res.status(500).render('admin/edit-product', {
      //   pageTitle: 'Add Product',
      //   path: '/admin/add-product',
      //   editing: false,
      //   hasErrors: true,
      //   product: {
      //     title: title,
      //     imageUrl: imageUrl,
      //     price: price,
      //     description: description
      //   },
      //   errorMessage: 'Database operation failed, please try again.',
      //   validationErrors: []
      // });

      // res.redirect('/500');

      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }

  const prodId = req.params.productId;
  User.findOne({ where: { id: req.session.user.id } } )
    .then(user => {
      user.getProducts( {where : { id: prodId } } )
      .then(products => {
        const product = products[0];
        if (!product)
          return res.redirect('/');
        res.render('admin/edit-product', {
          pageTitle: 'Edit Product',
          path: '/admin/edit-product',
          editing: editMode,
          product: product,
          hasErrors: false,
          errorMessage: null,
          validationErrors: []
        });
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDes = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('validation errors:', errors);
    // 422: validation failed
    res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      hasErrors: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDes,
        id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }
  Product.findByPk(prodId)
    .then(product => {
      if (product.userId != req.session.user.id) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDes;
      if (image) {
        // fileHelper.deleteFile(product.imageUrl); // [TODO]
        product.imageUrl = image.path;
      }
      else {
        // keep it
        ;
      }

      return product.save()
        .then(result => {
          console.log(result);
          res.redirect('/admin/products');
        })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.getProducts = (req, res, next) => {
  User.findOne({ where: { id: req.session.user.id } } )
    .then(user => {  
      user.getProducts()
      .then(products => {
        res.render('admin/products', {
          prods: products,
          pageTitle: 'Admin Products',
          path: '/admin/products'
        });
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  
  Product.findByPk(prodId)
    .then(product => {
      if (product.userId != req.session.user.id) {
        return res.redirect('/');
      }
      if (!product) {
        return next(new Error('Product not found.'));
      }
      // [TODO] delete the image of this product
      product.destroy()
        .then(result => {
          console.log('Destroyed Product');
          res.status(200).json({
            message: 'Success!'
          });
        })
    })
    .catch(err => {
      res.status(500).json({
        message: 'Deleting product failed.'
      });
    })
};
const fs = require('fs');
const path = require('path');
const fileHandler = require('../util/file');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const User = require('../models/user');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
   
  Product.findAndCountAll({
    offset: (page - 1) * ITEMS_PER_PAGE,
    limit: ITEMS_PER_PAGE
  })
    .then(result => {
      const {count, rows} = result;
      res.render('shop/product-list', {
        prods: rows,
        pageTitle: 'Products',
        path: '/products',
        totalProducts: count,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < count,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(count / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  })
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findByPk(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  })
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;

  Product.findAndCountAll({
    offset: (page - 1) * ITEMS_PER_PAGE,
    limit: ITEMS_PER_PAGE
  })
    .then(result => {
      const {count, rows} = result;
      res.render('shop/index', {
        prods: rows,
        pageTitle: 'Shop',
        path: '/',
        totalProducts: count,
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < count,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(count / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  })
};

exports.getCart = (req, res, next) => {
  User.findOne({ where: { id: req.session.user.id } } )
    .then(user => {
      user.getCart()
      .then(cart => {
        if (!cart) {
          return user.createCart() // if the user does not have a cart
            .then(cart => {
              res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: []
              });
            })
        }
        return cart
          .getProducts()
          .then(products => {
            console.log(products);
            res.render('shop/cart', {
              path: '/cart',
              pageTitle: 'Your Cart',
              products: products
            });
          })
          .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        })
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  })
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedCart;
  let newQuantity = 1;
  User.findOne({ where: { id: req.session.user.id } } )
    .then(user => { 
      user.getCart()
      .then(cart => {
        if (!cart) {
          return user.createCart() // if the user does not have a cart
            .then(cart => {
              res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: []
              });
            })
        }
        fetchedCart = cart;
        return cart.getProducts( { where: { id: prodId } } );
      })
      .then(products => {
        let product;
        if (products.length) {
          product = products[0];
        }
        if (product) {
          let oldQuantity = product.cartItem.quantity;
          newQuantity = oldQuantity + 1;
          return product;
        }
        return Product.findByPk(prodId);
      })
      .then(product => {
        return fetchedCart.addProduct(product, {
          through: { quantity: newQuantity }
        });
      })
      .then(() => {
        res.redirect('/cart');
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  })
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  User.findOne({ where: { id: req.session.user.id } } )
    .then(user => {
      user.getCart()
      .then(cart => {
        return cart.getProducts({ where: { id: prodId } });
      })
      .then(products => {
        const product = products[0];
        return product.cartItem.destroy();
      })
      .then(result => {
        res.redirect('/cart');
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  })
};

exports.postOrder = (req, res, next) => {
  let fetchedCart;
  User.findOne({ where: { id: req.session.user.id } } )
    .then(user => {
      user.getCart()
        .then(cart => {
          fetchedCart = cart;
         
          return cart.getProducts();
        })
        .then(products => {
          return User.findOne({ where: { id: req.session.user.id } })
            .then(user => {
              user.createOrder()
              .then(order => {
                return order.addProducts(
                  products.map(product => {
                    product.orderItem = { quantity: product.cartItem.quantity };
                    return product;
                  })
                )
              })
              .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            })
            })
            .catch(err => {
              const error = new Error(err);
              error.httpStatusCode = 500;
              return next(error);
          })
        })
        .then(result => {
          return fetchedCart.setProducts(null);
        })
        .then(result => {
          res.redirect('/orders');
        })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  })
};

exports.getOrders = (req, res, next) => {
  User.findOne({ where: { id: req.session.user.id } } )
    .then(user => {
      user.getOrders({include: ['products']})
      .then(orders => {
        res.render('shop/orders', {
          path: '/orders',
          pageTitle: 'Your Orders',
          orders: orders
        });
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  })
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order
    .findByPk(orderId, {
      include: ['products'] // [TODO]
    })
    .then(order => {
      if (!order) {
        return next(new Error('No order found.'));
      }
      if (order.userId !== req.session.user.id) {
        return next(new Error('Unauthorized'));
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoices', invoiceName);

      const {products} = order; // [TODO]

      const pdfdoc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition', 
        'inline; filename="' + invoiceName + '"'
      );
      pdfdoc.pipe(fs.createWriteStream(invoicePath));
      pdfdoc.pipe(res);

      pdfdoc.fontSize(26).text('Invoice', {
        underline: true
      });
      pdfdoc.text('-----------------------');

      let totalPrice = 0;
      products.forEach((product) => {
        totalPrice += product.orderItem.quantity * product.price;
        pdfdoc.fontSize(14).text(`${product.title} - ${product.orderItem.quantity} items -  $ ${product.price}`);
      })
      pdfdoc.text('-----------------------');
      pdfdoc.text(`Total price: $ ${totalPrice}`);
      pdfdoc.end();

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     console.log('Data not found!');
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');
      //   res.send(data);
      //   res.end();
      // });

      // const file = fs.createReadStream(invoicePath);
      // file.pipe(res);
    })
    .catch(err => {
      return next(err);
    })
};
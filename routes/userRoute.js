const express = require('express');
const path = require('path');
const user_route = express();
const userController = require("../controllers/userController");
const myAccountController=require("../controllers/myAccountController");
const searchController = require('../controllers/searchController')
const couponController = require('../controllers/couponController')
const auth = require('../middleware/auth');

const nocache = require('nocache')

user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');


user_route.use(express.json());
user_route.use(nocache())
user_route.use(express.urlencoded({ extended: true }));
user_route.use(express.static(path.join(__dirname, 'public')));

// Signup and Login Routes
user_route.get('/signup', auth.isLogout , userController.loadSignup);
user_route.post('/signup', auth.isLogout , userController.insertUser);
user_route.get('/login', auth.isLogout, userController.loginLoad);
user_route.post('/login', auth.isLogout , userController.confirmLogin);
user_route.get('/logout', auth.isLogin,userController.logout)

// OTP Routes
user_route.get('/otp', auth.isLogout, userController.getOTP);
user_route.post('/otp', auth.isLogout, userController.submitOTP);
user_route.post('/resend-otp', auth.isLogout, userController.resendOTP);

// Home Route
user_route.get('/', userController.getAllProducts);
user_route.get('/product/:productId', userController.productPage);
user_route.get('/allproducts',userController.allProducts)

//myaccount

user_route.get('/myaccount',auth.isLogin,myAccountController.myAccount)
user_route.post('/update-detail/:id',auth.isLogin,myAccountController.updateDetails)
user_route.get('/add-address',auth.isLogin,myAccountController.addAddressPage);
user_route.post('/add-address',auth.isLogin,myAccountController.addAddress)
user_route.get('/edit-address/:id',auth.isLogin, myAccountController.editAddressPage);
user_route.post('/edit-address/:id',auth.isLogin, myAccountController.editAddress);
user_route.get('/delete-address/:addressId',auth.isLogin, myAccountController.deleteAddress);
user_route.post('/cancel-order',auth.isLogin,myAccountController.cancelMyOrder)
user_route.post('/return-order',auth.isLogin,myAccountController.returnMyOrder)
user_route.get('/myorderdetails/:orderId',auth.isLogin,myAccountController.myOrderDetails)
user_route.post('/addTowallet',myAccountController.addTowallet)

//cart management
user_route.get('/cart', auth.isLogin, userController.renderCart)
user_route.post('/add-to-cart/:productId',auth.isLogin,  userController.addToCart);
user_route.post('/update-quantity',auth.isLogin, userController.updateQuantity);
user_route.get('/remove-from-cart/:productId',auth.isLogin,  userController.remove_product_from_cart)

user_route.get('/filter',searchController.get_searchedProducts);
user_route.get('/checkout',auth.isLogin, userController.renderCheckOut);
user_route.get('/checkout-address',auth.isLogin,userController.checkoutAddresspage);
user_route.post('/checkout-address',auth.isLogin,userController.addCheckoutAddress);
user_route.get('/edit-checkoutaddress/:id',auth.isLogin, userController.editCheckoutAddressPage);
user_route.post('/edit-checkoutaddress/:id',auth.isLogin, userController.editCheckoutAddress);
user_route.post('/applyCoupon', couponController.applyCoupon)
user_route.post('/removeCoupon',couponController.removeCoupon)
user_route.post('/place-order',auth.isLogin, userController.placeOrder);
user_route.post('/verify-payment',auth.isLogin,userController.verifyPayment)
user_route.get('/ordersuccess',auth.isLogin, userController.renderOrderSuccess);


//wishlist 

user_route.get('/wishlist',userController.renderWishlist);
user_route.post('/addtowishlist/:productId',userController.addToWishlist);
user_route.post('/removefromwishlist',userController.removeFromWishlist);
user_route.post('/googleAuth',userController.googleAuth);

//category filter
user_route.get('/products/category/:categoryId',userController.categoryFiltering)

module.exports = user_route;

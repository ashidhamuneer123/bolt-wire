const express = require('express');
const path = require('path');
const user_route = express();
const userController = require("../controllers/userController");
const myAccountController=require("../controllers/myAccountController");
const searchController = require('../controllers/searchController')
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
user_route.post('/signup', userController.insertUser);
user_route.get('/login', auth.isLogout, userController.loginLoad);
user_route.post('/login', userController.confirmLogin);
user_route.get('/logout', auth.isLogin,userController.logout)

// OTP Routes
user_route.get('/otp', userController.getOTP);
user_route.post('/otp', userController.submitOTP);
user_route.post('/resend-otp', userController.resendOTP);

// Other Routes
user_route.get('/', userController.getAllProducts);
user_route.get('/product/:productId', userController.productPage);
user_route.get('/allproducts',userController.allProducts)
//myaccount

user_route.get('/myaccount',myAccountController.myAccount)
user_route.post('/update-detail/:id',myAccountController.updateDetails)
user_route.get('/add-address',myAccountController.addAddressPage);
user_route.post('/add-address',myAccountController.addAddress)
user_route.get('/edit-address/:id', myAccountController.editAddressPage);
user_route.post('/edit-address/:id', myAccountController.editAddress);
user_route.get('/delete-address/:addressId', myAccountController.deleteAddress);
user_route.get('/cart',userController.renderCart)
user_route.post('/add-to-cart/:productId', userController.addToCart);
user_route.get('/remove-from-cart/:productId', userController.remove_product_from_cart)
user_route.get('/filter',searchController.get_searchedProducts);

user_route.get('/checkout',userController.renderCheckOut)
user_route.get('/ordersuccess',userController.renderOrderSuccess);
module.exports = user_route;

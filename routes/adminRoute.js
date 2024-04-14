const express=require('express');
const auth =require('../middleware/adminAuth');
const {upload} = require('../middleware/upload');
const path=require('path')
const admin_route=express();
const adminController=require("../controllers/adminController");
const categoryController=require('../controllers/categoryController');
const productController=require('../controllers/productController')
const couponController = require('../controllers/couponController')
const orderController=require('../controllers/orderController')
const nocache = require('nocache')

admin_route.set('view engine','ejs');
admin_route.set('views','./views')

admin_route.use(express.json());
admin_route.use(nocache())
admin_route.use(express.urlencoded({extended:true}));
admin_route.use(express.static(path.join(__dirname, 'public')))

admin_route.get('/',auth.isLogout,adminController.loadLogin);
admin_route.post('/',auth.isLogout,adminController.confirmLogin);
admin_route.get('/logout', auth.isLogin,adminController.adminLogout)
admin_route.get('/dashboard', auth.isLogin , adminController.loadDashboard);
admin_route.get('/userlist',auth.isLogin,adminController.userList)
admin_route.post('/block/:id',auth.isLogin,adminController.updateUsers); 

//admin category section
admin_route.get('/category',auth.isLogin,categoryController.render_category_page);

admin_route.get('/new-category',auth.isLogin,categoryController.render_new_category);

admin_route.post('/new-category',auth.isLogin, categoryController.createCategory);

admin_route.get('/soft-delete/:id',auth.isLogin,categoryController.delete_category);

admin_route.get('/edit_category/:id',auth.isLogin,categoryController.render_Edit_Category );

admin_route.post('/update_category',auth.isLogin,categoryController.UpdateCategory );

//product dash board
admin_route.get('/product',auth.isLogin,productController.render_product_page )

//new product page
admin_route.get('/new-product',auth.isLogin,productController.render_new_product)

admin_route.post('/new-product',auth.isLogin,upload.fields([{name:"images"},{name:"primaryImage"}]),productController.add_product);

admin_route.get('/edit-product/:id',auth.isLogin,productController.render_edit_product)

admin_route.post('/update-product',auth.isLogin,upload.fields([{name:"images"},{name:"primaryImage"}]),productController.update_product)

admin_route.get('/softdelete_product/:id',auth.isLogin,productController.deleteProduct)

//order

admin_route.get('/order',auth.isLogin,orderController.getOrderList)
admin_route.post('/cancel',auth.isLogin,orderController.cancelOrder)
admin_route.post('/update-status',auth.isLogin,orderController.updateStatus)
admin_route.get('/orderdetails/:orderId',auth.isLogin,orderController.orderDetails)

//coupon
admin_route.get('/coupon',couponController.getAllCoupons)
admin_route.post('/create',couponController.createCoupon)
admin_route.post('/:id/delete', couponController.deleteCoupon);
module.exports=admin_route;
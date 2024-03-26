const express=require('express');
const auth =require('../middleware/adminAuth');
const {upload} = require('../middleware/upload');
const path=require('path')
const admin_route=express();
const adminController=require("../controllers/adminController");
const categoryController=require('../controllers/categoryController');
const productController=require('../controllers/productController')
const orderController=require('../controllers/orderController')
const nocache = require('nocache')

admin_route.set('view engine','ejs');
admin_route.set('views','./views')

admin_route.use(express.json());
admin_route.use(nocache())
admin_route.use(express.urlencoded({extended:true}));
admin_route.use(express.static(path.join(__dirname, 'public')))

admin_route.get('/',adminController.loadLogin);
admin_route.post('/',adminController.confirmLogin);
admin_route.get('/logout', auth.isLogin,adminController.adminLogout)
admin_route.get('/dashboard', auth.isLogin , adminController.loadDashboard);
admin_route.get('/userlist',auth.isLogin,adminController.userList)
admin_route.post('/block/:id',adminController.updateUsers); 

//admin category section
admin_route.get('/category',categoryController.render_category_page);

admin_route.get('/new-category',categoryController.render_new_category);

admin_route.post('/new-category', categoryController.createCategory);

admin_route.get('/soft-delete/:id',categoryController.delete_category);

admin_route.get('/edit_category/:id',categoryController.render_Edit_Category );

admin_route.post('/update_category',categoryController.UpdateCategory );

//product dash board
admin_route.get('/product',productController.render_product_page )

//new product page
admin_route.get('/new-product',productController.render_new_product)

admin_route.post('/new-product',upload.fields([{name:"images"},{name:"primaryImage"}]),productController.add_product);

admin_route.get('/edit-product/:id',productController.render_edit_product)

admin_route.post('/update-product',upload.fields([{name:"images"},{name:"primaryImage"}]),productController.update_product)

admin_route.get('/softdelete_product/:id',productController.deleteProduct)

//order

admin_route.get('/order',orderController.getOrderList)

module.exports=admin_route;
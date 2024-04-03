const User = require("../models/userModel");
const OTP=require("../models/userOTPverification");
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const Cart = require('../models/cartModel')
const Address=require('../models/addressModel')
const Order = require('../models/orderModel');

const securePassword=async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.log(error.message)
    }
}

//for sending mail

const sendverifyMail=async(name,email,otp)=>{
    try {
        const transporter = nodemailer.createTransport({
        service: 'GMAIL',

            auth: {
                user: 'ashidhaa@gmail.com', // Your Gmail email address
                pass: 'boxx qkrc ujst lgbw' // Your Gmail password or an app-specific password
            }
        });
        
        const mailOptions={
            from:'ashidhaa@gmail.com',
            to:email,
            subject:'Verify your Bolt & Wire Account',
            html:'<p>Hi '+name+' Your OTP is '+otp+' </p>'
        }
      transporter.sendMail(mailOptions,(error,info)=>{
            if(error){
                console.log(error);
            }else{
                console.log("email sent",info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
}

const loadSignup = async (req,res)=>{
    try {
        res.render("signUp")
        
    } catch (error) {
        console.log(error.message);
    }
}


const insertUser=async(req,res)=>{
    try {
        const secPassword = await securePassword(req.body.password);
        const phone = req.body.phone;
        const email = req.body.email;
        const nameRegex = /^[a-zA-Z]+$/;
        if (!nameRegex.test(req.body.name)) {
            return res.render('signUp', { message: "Invalid name format!" });
        }

    

        // Validation: Check if the email or phone is already in use
        const existingUserByEmail = await User.findOne({ email:email });
        const existingUserByphNum = await User.findOne({ phone: phone });

        if (existingUserByEmail) {
            return res.render("signUp", { message: "Email is already in use!" });
        }

        if (existingUserByphNum) {
            return res.render("signUp", { message: "Phone Num is already in use!" });
        }

        
        // Generate random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

       //save user Data and otp in session
        req.session.userData = {
            name:req.body.username,
            phone:req.body.phone,
            email:req.body.email,
            password:secPassword
        };

        const otpNum = new OTP({
            otp:otp,
            email:req.body.email
        })

        await otpNum.save();

        if(req.session.userData){
            sendverifyMail(req.body.username,req.body.email,otp)
            res.redirect('/otp')
        }
        else{
            res.render('signUp',{message:"Registration Failed!!"})
        }
    } catch (error) {
       console.log(error.message) 
    }
}

const getOTP=async (req,res)=>{
    try {
        res.render('verifyOTP')

    } catch (error) {
        console.log(error.message);
    }
}   


const submitOTP=async (req,res)=>{
    try {
         const enteredOtp=req.body.otp;
         const user=req.session.userData;
         const generatedOTP=await OTP.findOne({email:user.email,otp:enteredOtp})

         if(generatedOTP){
            const userDATA = new User({
            name:user.name,
            phone:user.phone,
            email:user.email,
            password:user.password,
            is_admin:0
            })
           const saveUser = await userDATA.save();
            req.session.user_id=saveUser._id
            res.redirect('/')
         }

    } catch (error) {
        console.log(error);
    }
}    
const resendOTP = async (req, res) => {
    try {
        const user = req.session.userData;
        if (!user) {
            return res.status(400).send('User Data not found in the session!!');
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        
        const otpNum = new OTP({
            otp:otp,
            email:user.email
        })

        await otpNum.save();
        
        sendverifyMail(user.username, user.email, otp); // Assuming sendverifyMail is a function to send emails
        req.session.OTP = otp;
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};

const loginLoad = async(req,res)=>{
    try {

        res.render('login')
        
    } catch (error) {
        console.log(error.message)
    }
}

const confirmLogin = async(req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({email:email});
        if(userData){
            const passwordMatch = bcrypt.compare(password,userData.password);
            if(passwordMatch){
                req.session.user_id = userData._id;
                res.redirect("/")
            }else{
                res.render('login',{message:"Incorrect email or password"})
            }
        }
        else{
            res.render('login',{message:"Incorrect email or password"})
        }
    } catch (error) {
        console.log(error.message)
    }
}
 
const logout=async(req,res)=>{
    try {
        req.session.destroy();
        res.redirect('/');
    
      } catch (error) {
        console.log(error.message);
    
      }
}


const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ status: true }).populate('category_id');
        const categories = await Category.find({ cat_status: true });
        const user = await User.findById(req.session.user_id);

        let sortProducts;
        const sortBy = req.query.sortBy;

        switch (sortBy) {
            case 'popularity':
                // Implement sorting logic based on popularity
                sortProducts = products; // Placeholder
                break;
            case 'averageRating':
                // Implement sorting logic based on average rating
                sortProducts = products; // Placeholder
                break;
            case 'lowToHigh':
                sortProducts = await Product.find({ status: true }).sort({ selling_price: 1 });
                break;
            case 'highToLow':
                sortProducts = await Product.find({ status: true }).sort({ selling_price: -1 });
                break;
            case 'featured':
                sortProducts = products; // Placeholder
                break;
            case 'newArrivals':
                const currentDate = new Date();
                const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                sortProducts = await Product.find({ status: true, createdAt: { $gte: oneWeekAgo } });
                break;
            case 'aA-zZ':
                sortProducts = await Product.find({ status: true }).sort({ product_name: 1 });
                break;
            case 'zZ-aA':
                sortProducts = await Product.find({ status: true }).sort({ product_name: -1 });
                break;
            default:
                sortProducts = products;
                break;
        }

    

        res.render('home', { products:sortProducts, categories, user  });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
}


const allProducts=async (req,res)=>{
    try {
       
        const products = await Product.find({ status: true }).populate('category_id');
        // Implement sorting
     const { sortBy } = req.query;
     if (sortBy === 'lowToHigh') {
         products.sort((a, b) => a.selling_price - b.selling_price);
     } else if (sortBy === 'highToLow') {
         products.sort((a, b) => b.selling_price - a.selling_price);
     }
        const user = await User.findById(req.session.user_id)
       
        res.render('allProducts', { products ,user , sortBy });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }

}

const productPage = async (req, res) => {
    try {
        const user = await User.findById(req.session.user_id);

        // Get the product ID from the request parameters
        const productId = req.params.productId;

        // Fetch the product details from the database based on the product ID
        const product = await Product.findById(productId);
        
        if (!product) {
            // If product is not found, render an error page or redirect to a 404 page
            return res.status(404).send('product not found')
        }
        const relatedProducts= await Product.find({status:true}).limit(4)
        // Render the product page and pass the product details to the view
        res.render('productPage', { product ,relatedProducts,user});
       
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send('Internal Server Error');
    }
}

const renderCart = async (req, res) => {
    try {
        
  
        if (req.session.user_id) {
            const user = await User.findById(req.session.user_id);
        
            if (!user) {
                // Handle the case where the user with the session ID is not found
                return res.status(404).send('User not found');
            }
            // Save the cart item to the database
            const userId = req.session.user_id;
          
           const cart = await Cart.findOne({ userId }).populate('products.productId');
            if (!cart) {
                // If the user's cart is empty, render an empty cart view
                return res.render('cart',{cart});
            }

              // Calculate total quantities and subtotal
              let totalQuantities = 0;
              let subtotal = 0;
              cart.products.forEach(item => {
                  totalQuantities += item.quantity;
                  subtotal += item.quantity * item.productId.selling_price;
              });
            
        res.render('cart',{ cartItems:cart.products, totalQuantities, subtotal,user})
        
        }else{
        res.render('login')
        }
        }catch(error){
        console.log(error.message)
        }

}



const addToCart = async (req, res) => {
    try {
        const userId = req.session.user_id; // Assuming user is authenticated
        const productId = req.params.productId;
        const quantity = req.body.quantity || 1;


        
        // Find the cart for the user
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // If the user does not have a cart, create a new one
            cart = new Cart({ userId, products: [] });
        }

        // Find the product in the cart
        const existingProduct = cart.products.find(item => item.productId.toString() === productId);

        if (existingProduct) {
            // If the product exists in the cart, update its quantity
            existingProduct.quantity += parseInt(quantity);
        } else {
            // If the product is not in the cart, add it
            cart.products.push({ productId, quantity: parseInt(quantity) });
        }
        // Deduct the purchased quantity from the product's stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

         //out of stock 

         if (product.stock == 0 ) {
            return res.status(400).json({ success: false, message: 'Product is out of stock' });
        }

        // Check if the requested quantity is greater than available stock
        if (product.stock < quantity) {
            return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
        }

       
        // Update the product's stock
        product.stock -= quantity;
        await product.save();

        // Save the cart to the database
        await cart.save();

         // Send success response
         res.status(200).json({ success: true, message: 'Product added to cart successfully' });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};




const updateQuantity = async (req, res) => {
    try {
        
        const { productId, operator } = req.body;
        const userId = req.session.user_id;

        const prod = await Product.findById(productId)
        if(operator=='increase'){
            if(prod.stock>0){
                await Cart.updateOne({ userId ,"products.productId":productId},{$inc:{"products.$.quantity":1}});
                await Product.findByIdAndUpdate({_id:productId},{$inc:{stock:-1}})
            }else{
                res.json({success:false , message:'Cant add more !!!Product Out of stock!!!'})
               
            }
            
        }
        else{
             await Cart.updateOne({ userId ,"products.productId":productId},{$inc:{"products.$.quantity":-1}});
             await Product.findByIdAndUpdate({_id:productId},{$inc:{stock:1}})
        }
        const cart = await Cart.findOne({ userId }).populate('products.productId');
       
         // Calculate total quantities and subtotal
         
         let totalQuantities = 0;
         let subtotal = 0;
         cart.products.forEach(item => {
             totalQuantities += item.quantity;
             subtotal += item.quantity * item.productId.selling_price;
         });
     
         res.json({ success: true , totalQuantities , subtotal});

        
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ success:false , message: 'Internal server error' });
    }
};


//remove item from cart list
const remove_product_from_cart = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const productId = req.params.productId;

 // Find the user's cart
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            // If cart is not found, send a 404 response
            return res.status(404).send('Cart not found');
        }

        // Calculate the total quantity removed
        let totalQuantityRemoved = 0;
        cart.products.forEach(item => {
            if (item.productId.toString() === productId) {
                totalQuantityRemoved += item.quantity;
            }
        });

        // Update product stock for each removed product
        await Product.findByIdAndUpdate(productId, { $inc: { stock: totalQuantityRemoved } });

        
        // Update the cart to remove the specified product
        await cart.updateOne({ $pull: { products: { productId } } });


        // Check if the cart becomes empty after removing the product
        if (cart.products.length === 0) {
            // If cart is empty, delete it from the database
            await Cart.findOneAndDelete({ userId });
        }


        res.redirect('/cart'); // Redirect back to the cart page after removal
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).send('Internal Server Error');
    }
}

const renderCheckOut = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const user = await User.find({userId})
        // Find the user's cart
        const cart = await Cart.findOne({ userId }).populate('products.productId');
        if (!cart || !cart.products.length) {
            // If the user's cart is empty, render an empty cart view
            return res.render('checkOut', { cartItems: cart ? cart.products : [] });
        }

        const addresses = await Address.find({ userId });

        // Calculate total quantities and subtotal
        let totalQuantities = 0;
        let subtotal = 0;
        cart.products.forEach(item => {
            totalQuantities += item.quantity;
            subtotal += item.quantity * item.productId.selling_price;
        });

        res.render('checkOut', { cartItems: cart.products, totalQuantities, subtotal, addresses ,user});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const placeOrder = async (req, res) => {
    try {
        const userId = req.session.user_id;

        // Find the user's cart
        const cart = await Cart.findOne({ userId }).populate('products.productId');

        // Check if the cart is empty
        if (!cart || !cart.products.length) {
            return res.status(400).send('Cart is empty');
        }

        // Get the selected address ID from the request body
        const selectedAddressId = req.body.selectedAddress;

        // Find the selected address
        const address = await Address.findOne({ _id: selectedAddressId, userId });

        // Ensure that the selected address exists and belongs to the user
        if (!address) {
            return res.status(400).send('Invalid address selected');
        }

        // Calculate total amount from cart
        let totalAmount = 0;
        cart.products.forEach(item => {
            totalAmount += item.quantity * item.productId.selling_price;
        });

        // Create the order with required fields
        const order = new Order({
            userId,
            items: cart.products,
            status: 'unpaid',
            totalAmount,
            paymentMethod: 'Cash on Delivery',
            address: address._id
        });

        // Save the order to the database
        const savedOrder = await order.save();

        // Clear the cart after placing the order
        await Cart.findOneAndUpdate({ userId }, { $set: { products: [] } });
        res.redirect('/ordersuccess');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const renderOrderSuccess = async (req, res) => {
    try {
        res.render('orderSuccess');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};





module.exports={
    loadSignup,
    insertUser,
    getOTP,
    submitOTP,
    resendOTP,
    loginLoad,
    confirmLogin,
    logout,
    getAllProducts,
    allProducts,
    productPage,
    renderCart,
    addToCart,
    placeOrder,
    updateQuantity,
    renderCheckOut,
    remove_product_from_cart,
    renderOrderSuccess
}
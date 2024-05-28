const User = require("../models/userModel");
require("dotenv").config();
const OTP = require("../models/userOTPverification");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");
const Wishlist = require("../models/wishlistSchema");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const Wallet = require("../models/walletModel");
const Payment = require("../models/paymentModel");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const Coupon = require("../models/couponModel");

const RAZORPAY_ID_KEY = process.env.RAZORPAY_ID_KEY;

const RAZORPAY_SECRET_KEY = process.env.RAZORPAY_SECRET_KEY;

// Initialize Razorpay instance
const instance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//for sending mail

const sendverifyMail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "GMAIL",

      auth: {
        user: "ashidhaa@gmail.com", // Your Gmail email address
        pass: "boxx qkrc ujst lgbw", // Your Gmail password or an app-specific password
      },
    });

    const mailOptions = {
      from: "ashidhaa@gmail.com",
      to: email,
      subject: "Verify your Bolt & Wire Account",
      html: "<p>Hi " + name + " Your OTP is " + otp + " </p>",
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log("email sent", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadSignup = async (req, res) => {
  try {
    res.render("signUp");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const secPassword = await securePassword(req.body.password);
    const phone = req.body.phone;
    const email = req.body.email;
    const nameRegex = /^[a-zA-Z]+$/;
    if (!nameRegex.test(req.body.name)) {
      return res.render("signUp", { message: "Invalid name format!" });
    }

    // Validation: Check if the email or phone is already in use
    const existingUserByEmail = await User.findOne({ email: email });
    const existingUserByphNum = await User.findOne({ phone: phone });

    if (existingUserByEmail) {
      return res.render("signUp", { message: "Email is already in use!" });
    }

    if (existingUserByphNum) {
      return res.render("signUp", { message: "Phone Num is already in use!" });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    //save user Data in session
    req.session.userData = {
      name: req.body.username,
      phone: req.body.phone,
      email: req.body.email,
      password: secPassword,
    };

    const otpNum = new OTP({
      otp: otp,
      email: req.body.email,
    });

    await otpNum.save();

    if (req.session.userData) {
      sendverifyMail(req.body.username, req.body.email, otp);
      res.redirect("/otp");
    } else {
      res.render("signUp", { message: "Registration Failed!!" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getOTP = async (req, res) => {
  try {
    res.render("verifyOTP");
  } catch (error) {
    console.log(error.message);
  }
};

const submitOTP = async (req, res) => {
  try {
    const enteredOtp = req.body.otp;
    const user = req.session.userData;
    const generatedOTP = await OTP.findOne({
      email: user.email,
      otp: enteredOtp,
    });

    if (generatedOTP) {
      const userDATA = new User({
        name: user.name,
        phone: user.phone,
        email: user.email,
        password: user.password,
        is_admin: 0,
      });
      const saveUser = await userDATA.save();
      req.session.user_id = saveUser._id;
      res.redirect("/");
    }else{
      res.render('verifyOTP',{message:"Incorrect OTP!!!"})
    }
  } catch (error) {
    console.log(error);
  }
};

const resendOTP = async (req, res) => {
  try {
    const user = req.session.userData;
    if (!user) {
      return res.status(400).send("User Data not found in the session!!");
    }
    const otp = Math.floor(100000 + Math.random() * 900000);

    const otpNum = new OTP({
      otp: otp,
      email: user.email,
    });

    await otpNum.save();

    sendverifyMail(user.username, user.email, otp); // Assuming sendverifyMail is a function to send emails
    req.session.OTP = otp;
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const confirmLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        req.session.user_id = userData._id;
        res.redirect("/");
      } else {
        res.render("login", { message: "Incorrect email or password" });
      }
    } else {
      res.render("login", { message: "Incorrect email or password" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const getAllProducts = async (req, res) => {
  try {
    let totalQuantities = 0;
    let totalWish = 0;
    const userId = req.session.user_id;
    if (userId) {
      const cart = await Cart.findOne({ userId }).populate(
        "products.productId"
      );
      if (cart) {
        cart.products.forEach((item) => {
          totalQuantities += item.quantity;
        });
      }
      const wish = await Wishlist.find({ userId });
      if (wish) {
        totalWish = wish.length;
      }
    }

    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    const products = await Product.find({
      delete: false,
      $or: [
        { product_name: { $regex: ".*" + search + ".*", $options: "i" } },
        { brand_name: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    }).populate("category_id");
    const categories = await Category.find({ cat_status: true });
    const user = await User.findById(req.session.user_id);

    let sortProducts;
    const sortBy = req.query.sortBy;

    switch (sortBy) {
      case "popularity":
        // Implement sorting logic based on popularity
        sortProducts = products; // Placeholder
        break;
      case "averageRating":
        // Implement sorting logic based on average rating
        sortProducts = products; // Placeholder
        break;
      case "lowToHigh":
        sortProducts = await Product.find({ status: true }).sort({
          selling_price: 1,
        });
        break;
      case "highToLow":
        sortProducts = await Product.find({ status: true }).sort({
          selling_price: -1,
        });
        break;
      case "featured":
        sortProducts = products; // Placeholder
        break;
      case "newArrivals":
        const currentDate = new Date();
        const oneWeekAgo = new Date(
          currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        sortProducts = await Product.find({
          status: true,
          createdAt: { $gte: oneWeekAgo },
        });
        break;
      case "aA-zZ":
        sortProducts = await Product.find({ status: true }).sort({
          product_name: 1,
        });
        break;
      case "zZ-aA":
        sortProducts = await Product.find({ status: true }).sort({
          product_name: -1,
        });
        break;
      default:
        sortProducts = products;
        break;
    }

    res.render("home", {
      products: sortProducts,
      categories,
      user,
      search: search,
      totalQuantities,
      totalWish,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
};

const allProducts = async (req, res) => {
  try {
    const products = await Product.find({ delete: false }).populate(
      "category_id"
    );

    let sortProducts;
    const sortBy = req.query.sortBy;

    switch (sortBy) {
      case "popularity":
        // Implement sorting logic based on popularity
        sortProducts = products; // Placeholder
        break;
      case "averageRating":
        // Implement sorting logic based on average rating
        sortProducts = products; // Placeholder
        break;
      case "lowToHigh":
        sortProducts = await Product.find({ status: true }).sort({
          selling_price: 1,
        });
        break;
      case "highToLow":
        sortProducts = await Product.find({ status: true }).sort({
          selling_price: -1,
        });
        break;
      case "featured":
        sortProducts = products; // Placeholder
        break;
      case "newArrivals":
        const currentDate = new Date();
        const oneWeekAgo = new Date(
          currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
        );
        sortProducts = await Product.find({
          status: true,
          createdAt: { $gte: oneWeekAgo },
        });
        break;
      case "aA-zZ":
        sortProducts = await Product.find({ status: true }).sort({
          product_name: 1,
        });
        break;
      case "zZ-aA":
        sortProducts = await Product.find({ status: true }).sort({
          product_name: -1,
        });
        break;
      default:
        sortProducts = products;
        break;
    }
    const user = await User.findById(req.session.user_id);

    res.render("allProducts", { products: sortProducts, user, sortBy });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Internal Server Error");
  }
};

const productPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user_id);

    // Get the product ID from the request parameters
    const productId = req.params.productId;

    // Fetch the product details from the database based on the product ID
    const product = await Product.findById(productId).populate("category_id");

    const wishlist = await Wishlist.findOne({
      productId,
      userId: req.session.user_id,
    });

    if (!product) {
      // If product is not found, render an error page or redirect to a 404 page
      return res.status(404).send("product not found");
    }
    const relatedProducts = await Product.find({ status: true }).limit(4);
    // Render the product page and pass the product details to the view
    res.render("productPage", { product, relatedProducts, user, wishlist });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Internal Server Error");
  }
};

const renderCart = async (req, res) => {
  try {
    if (req.session.user_id) {
      const user = await User.findById(req.session.user_id);

      if (!user) {
        // Handle the case where the user with the session ID is not found
        return res.status(404).send("User not found");
      }
      // Save the cart item to the database
      const userId = req.session.user_id;

      const cart = await Cart.findOne({ userId }).populate(
        "products.productId"
      );
      if (!cart) {
        // If the user's cart is empty, render an empty cart view
        return res.render("cart", { cart });
      }

      // Calculate total quantities and subtotal
      let totalQuantities = 0;
      let totalWish = 0;
      let subtotal = 0;
      cart.products.forEach((item) => {
        totalQuantities += item.quantity;
        const itemPrice = item.quantity * item.productId.selling_price;
        item.price = itemPrice;
        subtotal += itemPrice;
      });
      const wish = await Wishlist.find({ userId });
      if (wish) {
        totalWish = wish.length;
      }
      res.render("cart", {
        cartItems: cart.products,
        totalQuantities,
        subtotal,
        user,
        totalWish,
      });
    } else {
      res.render("signUp");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const productId = req.params.productId;
    const quantity = req.body.quantity || 1;
    const fromWishlist = req.body.fromWishlist === 'true'; // Check if the product is being added from the wishlist
    // Find the cart for the user
    let cart = await Cart.findOne({ userId });
   

    if (!cart) {
      // If the user does not have a cart, create a new one
      cart = new Cart({ userId, products: [] });
    }

    // Find the product in the cart
    const existingProduct = cart.products.find(
      (item) => item.productId.toString() === productId
    );

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
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    //out of stock
    if (product.stock == 0) {
      return res
        .status(400)
        .json({ success: false, message: "Product is out of stock" });
    }

    // If the product is added from the wishlist, bypass the stock check
    if (!fromWishlist) {
    // Check if the requested quantity is greater than available stock
    
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }
  }
    // Save the cart to the database
    await cart.save();

    // Check if the product is in the user's wishlist
    const wishlistItem = await Wishlist.findOne({ userId, productId });

    if (wishlistItem) {
      // If the product exists in the wishlist, remove it
      await Wishlist.deleteOne({ userId, productId });
    }

    // Send success response
    res
      .status(200)
      .json({ success: true, message: "Product added to cart successfully" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { productId, operator } = req.body;
    const userId = req.session.user_id;

    const prod = await Product.findById(productId);
    if (!prod) {
      return res.json({ success: false, message: "Product not found" });
    }
    const cartItem = await Cart.findOne({
      userId,
      "products.productId": productId,
    });

    if (!cartItem || cartItem.products.length === 0) {
      return res.json({
        success: false,
        message: "Product not found in the cart",
      });
    }
    const currentQuantity = cartItem.products.find((item) =>
      item.productId.equals(productId)
    ).quantity;

    // Limit maximum quantity to 10 and minimum quantity to 1
    const newQuantity =
      operator === "increase" ? currentQuantity + 1 : currentQuantity - 1;
    if (newQuantity > 10 || newQuantity < 1) {
      return res.json({
        success: false,
        message: "Quantity must be between 1 and 10",
      });
    }

    if (operator === "increase") {
      if (currentQuantity < prod.stock) {
        await Cart.updateOne(
          { userId, "products.productId": productId },
          { $inc: { "products.$.quantity": 1 } }
        );
      } else {
        return res.json({
          success: false,
          message: "Cant add more !!!Product Out of stock!!!",
        });
      }
    }
    if (operator === "decrease") {
      await Cart.updateOne(
        { userId, "products.productId": productId },
        { $inc: { "products.$.quantity": -1 } }
      );
    }

    const cart = await Cart.findOne({ userId }).populate("products.productId");
    let productQuantity = 0;
    let productPrice = 0;
    let totalQuantities = 0;
    let subtotal = 0;
    cart.products.forEach((item) => {
      if (item.productId.toString() === productId) {
        item.quantity += operator === "increase" ? 1 : -1;
      }

      productQuantity = item.quantity;
      productPrice = item.quantity * item.productId.selling_price;
      totalQuantities += item.quantity;
      subtotal += item.quantity * item.productId.selling_price;
    });

    await cart.save();

    return res.json({
      success: true,
      productQuantity,
      productPrice,
      totalQuantities,
      subtotal,
    });
  } catch (error) {
    console.error("Error updating quantity:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
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
      return res.status(404).send("Cart not found");
    }

    // Calculate the total quantity removed
    let totalQuantityRemoved = 0;
    cart.products.forEach((item) => {
      if (item.productId.toString() === productId) {
        totalQuantityRemoved += item.quantity;
      }
    });

    // Update the cart to remove the specified product
    await cart.updateOne({ $pull: { products: { productId } } });

    // Check if the cart becomes empty after removing the product
    if (cart.products.length === 0) {
      // If cart is empty, delete it from the database
      await Cart.findOneAndDelete({ userId });
    }

    res.redirect("/cart"); // Redirect back to the cart page after removal
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(500).send("Internal Server Error");
  }
};

//checking stock before proceeding to checkout page

const checkStock =async (req,res)=>{
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
        success: true,
        stock: product.stock,
        product_name: product.product_name
    });
} catch (error) {
    console.error('Error checking stock:', error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
}
}

const renderCheckOut = async (req, res) => {
  try {
    const userId = req.session.user_id;
  
    const user = await User.find({ userId });
    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate("products.productId");
    if (!cart || !cart.products.length) {
      // If the user's cart is empty, render an empty cart view
      return res.render("checkOut", {
        cartItems: cart ? cart.products : [],
        total: 0,
      });
    }

    const addresses = await Address.find({ userId });
    // Fetch available coupons
    const coupons = await Coupon.find({ isActive: true });
    // Calculate total quantities and subtotal
    let totalQuantities = 0;
    let subtotal = 0;
    cart.products.forEach((item) => {
      totalQuantities += item.quantity;
      const itemPrice = item.quantity * item.productId.selling_price;
      item.price = itemPrice;
      subtotal += itemPrice;
    });

    res.render("checkOut", {
      cartItems: cart.products,
      totalQuantities,
      subtotal,
      addresses,
      user,
      coupons,
      total: subtotal, // Pass subtotal as total initially
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const checkoutAddresspage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    res.render("checkoutAddress", { user });
  } catch (error) {
    console.log(error.message);
  }
};

const addCheckoutAddress = async (req, res) => {
  try {
    const { name, mobile, address, pincode, state, district, city } = req.body;

    const userId = req.session.user_id;

    // Create a new address object
    const newAddress = new Address({
      userId,
      name,
      mobile,
      address,
      pincode,
      state,
      district,
      city,
    });

    // Save the new address to the database
    await newAddress.save();

    res.redirect("/checkout");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editCheckoutAddressPage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const address = await Address.findById(req.params.id);
    res.render("editCheckoutAddress", { address, user });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editCheckoutAddress = async (req, res) => {
  try {
    const { name, mobile, address, pincode, state, district, city } = req.body;
    const addressId = req.params.id;
    await Address.findByIdAndUpdate(addressId, {
      name,
      mobile,
      address,
      pincode,
      state,
      district,
      city,
    });
    res.redirect("/checkout"); // Redirect to my account page after editing
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { couponCode, selectedAddress, paymentMethod} = req.body;
    
    // Store applied coupon in session or temporary storage
    req.session.appliedCoupons = [couponCode];
    const coupon = await Coupon.findOne({
      couponCode,
      isActive: true,
      expirationDate: { $gte: Date.now() },
    });

    // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate("products.productId");

    // Check if the cart is empty
    if (!cart || !cart.products.length) {
      return res.status(400).send("Cart is empty");
    }

     
    // Find the selected address
    const address = await Address.findOne({ _id: selectedAddress, userId });

    // Ensure that the selected address exists and belongs to the user
    if (!address) {
      return res.status(400).send("Invalid address selected");
    }

    let couponDiscount = 0;
    if (coupon) {
      couponDiscount = coupon.discountAmount;
    }

    // Calculate total amount and set price for each item
    let totalAmount = 0;
    for (const item of cart.products) {
      const itemPrice = item.quantity * item.productId.selling_price;
      item.price = itemPrice;
      totalAmount += itemPrice;

    }

    // Deduct coupon discount from the total amount
    let discountedAmount = (totalAmount * couponDiscount) / 100;
    totalAmount -= discountedAmount;

    // Ensure that paymentMethod is provided in the request body
    if (!paymentMethod) {
      return res.status(400).send("Payment method is required");
    }

       // Set initial delivery status based on payment method
    for (const item of cart.products) {
      item.deliveryStatus = paymentMethod === "Online" ? "Payment Pending" : "Processing";
    }

    // Create the order with required fields
    const order = new Order({
      userId,
      items: cart.products.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        price: item.price,
        deliveryStatus: item.deliveryStatus,
      })),
      status: paymentMethod === "Online" ? "pending" : "unpaid",
      totalAmount,
      paymentMethod,
      address: {
        name: address.name,
        mobile: address.mobile,
        address: address.address,
        pincode: address.pincode,
        state: address.state,
        district: address.district,
        city: address.city,
      },
      couponDiscount,
    });
    if (paymentMethod === "Cash on Delivery") {
      await order.save();
      
      // Deduct the purchased quantity from the product's stock
      for (const item of cart.products) {
      const productId = item.productId._id;
      const product = await Product.findById(productId);
      product.stock -= item.quantity;
      await product.save();
      }
    } else if (paymentMethod === "Online") {
      const createOrder = await Order.create(order);
      const razorpayOrder = await instance.orders.create({
        amount: totalAmount * 100, // Razorpay expects amount in paise (multiply by 100)
        currency: "INR",
        receipt: order._id.toString(),
        payment_capture: 1, // Auto capture payment
      });

      const timestamp = razorpayOrder.created_at;
      const date = new Date(timestamp * 1000); // Convert the Unix timestamp to milliseconds
      const formattedDate = date.toISOString();

      let payment = new Payment({
        payment_id: razorpayOrder.id,
        amount: totalAmount * 100,
        currency: razorpayOrder.currency,
        order_id: createOrder._id,
        status: razorpayOrder.status,
        created_at: formattedDate,
      });
      await payment.save();

      return res.json({
        success: true,
        orderId: razorpayOrder.id,
        amount: totalAmount * 100,
      });
    } else if (paymentMethod === "Wallet") {
      try {
        const wallet = await Wallet.findOne({ userId });

        if (!wallet || wallet.balance < totalAmount) {
          throw new Error("Insufficient balance in the wallet");
        }

        wallet.balance -= totalAmount;
        wallet.history.push({
          amount: totalAmount,
          type: "debit",
        });
        await wallet.save();
        // Set order status to "paid" and save the order
        order.status = "paid";
        await order.save();
        
      // Deduct the purchased quantity from the product's stock
      for (const item of cart.products) {
      const productId = item.productId._id;
      const product = await Product.findById(productId);
      product.stock -= item.quantity;
      await product.save();
      }
        const appliedCoupons = req.session.appliedCoupons;
        if (appliedCoupons && appliedCoupons.length > 0) {
          for (const couponCode of appliedCoupons) {
            await Coupon.findOneAndUpdate(
              {
                couponCode,
                isActive: true,
                expirationDate: { $gte: Date.now() },
              },
              { $push: { redeemedUsers: { userId, usedTime: new Date() } } }
            );
          }
        }
        delete req.session.appliedCoupons;
      } catch (error) {
        console.error(error);
        return res.status(400).send(error.message);
      }
    }

    await Cart.findOneAndUpdate({ userId }, { $set: { products: [] } });

    return res.redirect("/ordersuccess");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

const verifyPayment = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_SECRET_KEY;
    const userId = req.session.user_id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body.response;

    let hmac = crypto.createHmac("sha256", secret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    hmac = hmac.digest("hex");
    const isSignatureValid = hmac === razorpay_signature;

    if (isSignatureValid) {
      //Clear the cart after placing the order
      await Cart.findOneAndUpdate({ userId }, { $set: { products: [] } });
      let paymentId = razorpay_order_id;

      const orderID = await Payment.findOne(
        { payment_id: paymentId },
        { _id: 0, order_id: 1 }
      );

      const order_id = orderID.order_id;
      const updateOrder = await Order.updateOne(
        { _id: order_id },
        {
          $set: {
            status: "paid",
            "items.$[].deliveryStatus": "Processing"
          },
        }
      );
       // Find the user's cart
    const cart = await Cart.findOne({ userId }).populate("products.productId");

       // Deduct the purchased quantity from the product's stock
       for (const item of cart.products) {
        const productId = item.productId._id;
        const product = await Product.findById(productId);
        product.stock -= item.quantity;
        await product.save();
        }
      res.json({
        success: true,
      });
    }
  } catch (error) {
    console.error(error);
  }
};


const renderOrderSuccess = async (req, res) => {
  try {
    res.render("orderSuccess");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const renderWishlist = async (req, res) => {
  try {
    if (req.session.user_id) {
      const user = await User.findById(req.session.user_id);

      if (!user) {
        // Handle the case where the user with the session ID is not found
        return res.status(404).send("User not found");
      }
      // Save the wishlist item to the database
      const userId = req.session.user_id;
      let totalQuantities = 0;
      let totalWish = 0;
      if (userId) {
        const cart = await Cart.findOne({ userId }).populate(
          "products.productId"
        );
        if (cart) {
          cart.products.forEach((item) => {
            totalQuantities += item.quantity;
          });
        }
        const wish = await Wishlist.find({ userId });
        if (wish) {
          totalWish = wish.length;
        }
      }
      const wishlist = await Wishlist.find({ userId }).populate("productId");

      if (!wishlist) {
        // If the user's wishlist is empty, render an empty wishlist view
        return res.render("wishlist", { wishlist });
      }

      res.render("wishlist", { wishlist, user, totalQuantities, totalWish });
    } else {
      res.render("login");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;

    const productId = req.params.productId;

    const wishlist = await Wishlist.create({ userId, productId });

    res.status(201).json({ success: true, wishlist });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const { productId } = req.body;

    await Wishlist.deleteOne({ userId, productId });
    res.json({ success: true, message: "Item removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const googleAuth = async (req, res) => {
  try {
    const user = req.body.user;

    const email = user.email;
    // Check if user already exists
    let userData;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // User already exists, set session for existing user
      req.session.user_id = existingUser._id;
      userData = existingUser;
    } else {
      // Create a new user
      const newuser = new User({
        name: user.displayName,
        email: user.email,
        mobile: user.phoneNumber,
      });

      userData = await newuser.save();
    }

    // If user data is successfully obtained, respond with success message
    if (userData) {
      return res.json({
        success: true,
        message: "User data saved successfully",
      });
    } else {
      // If user data retrieval fails, render registration page with error message
      return res.render("signUp", { errmessage: "." });
    }
  } catch (error) {
    console.log(error);
  }
};

const categoryFiltering = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    // Fetch products based on the category ID
    const products = await Product.find({ category_id: categoryId }).populate(
      "category_id"
    );
    res.json({ products });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const brandFiltering = async (req, res) => {
  try {
    const brandName = req.params.brandName;
    console.log(brandName);
    // Fetch products based on the brand ID
    const products = await Product.find({ brand_name: brandName }).populate(
      "category_id"
    );
    res.json({ products });
  } catch (error) {
    console.error("Error fetching products by brands:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const colorFiltering = async (req, res) => {
  try {
    const colorName = req.params.colorName;
    console.log(colorName);
    // Fetch products based on the brand ID
    const products = await Product.find({ color: colorName }).populate(
      "category_id"
    );
    res.json({ products });
  } catch (error) {
    console.error("Error fetching products by brands:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
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
  checkStock,
  checkoutAddresspage,
  addCheckoutAddress,
  editCheckoutAddressPage,
  editCheckoutAddress,
  placeOrder,
  updateQuantity,
  renderCheckOut,
  remove_product_from_cart,
  renderOrderSuccess,
  renderWishlist,
  addToWishlist,
  removeFromWishlist,
  googleAuth,
  verifyPayment,
  categoryFiltering,
  brandFiltering,
  colorFiltering,
};

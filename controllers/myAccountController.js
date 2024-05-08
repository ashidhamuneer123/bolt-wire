const Address = require("../models/addressModel");
const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Wallet = require("../models/walletModel");
const bcrypt = require("bcrypt");
const Cart = require("../models/cartModel");
const Swal = require("sweetalert2");
const Razorpay = require("razorpay");
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

let instance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});

const myAccount = async (req, res) => {
  try {
    const PAGE_SIZE = 4;
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const addresses = await Address.find({ userId });

    // Pagination logic for orders
    const page = parseInt(req.query.page) || 1;
    const totalOrdersCount = await Order.countDocuments({ userId });
    const totalPages = Math.ceil(totalOrdersCount / PAGE_SIZE);

    const orders = await Order.find({ userId })
      .populate("items.productId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = new Wallet({ userId, balance: 0 });
      await wallet.save();
    }

    res.render("myAccount", {
      user,
      addresses,
      orders,
      wallet,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error.message);
  }
};
const updateDetails = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, phone, password, npassword, cpassword } = req.body;

    // Fetch the user from the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update basic details
    user.name = name;
    user.phone = phone;

    // Validate password change
    if (password && npassword && cpassword) {
      // Check if the current password matches
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Check if the new password matches the confirmation
      if (npassword !== cpassword) {
        return res
          .status(400)
          .json({ message: "New password and confirm password do not match" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(npassword, 10);
      user.password = hashedPassword;
    }

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "User details updated successfully" });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addAddressPage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    res.render("addAddress", { user });
  } catch (error) {
    console.log(error.message);
  }
};

const addAddress = async (req, res) => {
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

    res.redirect("/myaccount");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editAddressPage = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const user = await User.findById(userId);
    const address = await Address.findById(req.params.id);
    res.render("editAddress", { address, user });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const editAddress = async (req, res) => {
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
    res.redirect("/myaccount"); // Redirect to my account page after editing
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.addressId;

    // Delete the address from the database
    await Address.deleteOne({ _id: addressId });
    res.redirect("/myaccount");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const cancelMyOrder = async (req, res) => {
  try {
    const { orderId, productId, quantity } = req.body;

    const userId = req.session.user_id;

    // Find the order of the user
    const order = await Order.findOne({ userId, _id: orderId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Find the item in the order
    const item = order.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in order" });
    }

    // Update delivery status to "Cancelled"
    item.deliveryStatus = "Cancelled";

    // Restore stock quantity in product schema
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.stock += parseInt(quantity); // Increment stock

    // Deduct total amount of canceled products from the order
    const canceledAmount = item.quantity * item.price;
    order.totalAmount -= canceledAmount;

    // Save changes
    await order.save();
    await product.save();

    // Refund the canceled amount to the user's wallet if not cash on delivery
    if (order.paymentMethod !== "Cash on Delivery") {
      const wallet = await Wallet.findOne({ userId });
      if (!wallet) {
        return res
          .status(404)
          .json({ success: false, message: "Wallet not found for the user" });
      }

      wallet.balance += canceledAmount;
      wallet.history.push({
        amount: parseFloat(canceledAmount),
        type: "credit",

        createdAt: new Date(),
      });
      await wallet.save();
    }

    res
      .status(200)
      .json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.log(error.message);
  }
};
const returnMyOrder = async (req, res) => {
  try {
    const { orderId, productId, quantity } = req.body;
    const userId = req.session.user_id;
    // Find the order of the user
    const order = await Order.findOne({ userId, _id: orderId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Find the item in the order
    const item = order.items.find(
      (item) => item.productId.toString() === productId
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in order" });
    }

    // Update delivery status to "Returned"
    item.deliveryStatus = "Returned";

    // Restore stock quantity in product schema
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    product.stock += parseInt(quantity); // Increment stock

    // Deduct total amount of returned products from the order
    const returnedAmount = item.quantity * item.price;
    order.totalAmount -= returnedAmount;

    // Save changes
    await order.save();
    await product.save();

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found for the user" });
    }

    wallet.balance += returnedAmount;
    wallet.history.push({
      amount: parseFloat(returnedAmount),
      type: "credit",

      createdAt: new Date(),
    });
    await wallet.save();

    res.status(200).json({ success: true, message: "Order Returned" });
  } catch (error) {
    console.log(error.message);
  }
};

const myOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const productId = req.query.productId;

    const order = await Order.findById(orderId).populate(
      "userId address items.productId"
    );

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Find the item in the order's items array that matches the provided productId
    const selectedItem = order.items.find(
      (item) => String(item.productId._id) === productId
    );

    if (!selectedItem) {
      return res.status(404).send("Product not found in the order");
    }

    // Render the orderDetails view with only the selected product
    res.render("myOrderDetails", { order, selectedItem });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addTowallet = async (req, res) => {
  try {
    let amount = req.body.amount;

    const userId = req.session.user_id;
    // Create Razorpay order
    const order = await instance.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: userId,
    });

    // Update wallet balance
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({ userId, balance: parseFloat(amount) });
    } else {
      wallet.balance += parseFloat(amount);

      // Add transaction to history

      wallet.history.push({
        amount: parseFloat(amount),
        type: "credit",

        createdAt: new Date(),
      });
    }

    await wallet.save();

    res.json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  myAccount,
  updateDetails,
  addAddressPage,
  addAddress,
  editAddressPage,
  editAddress,
  deleteAddress,
  cancelMyOrder,
  returnMyOrder,
  addTowallet,
  myOrderDetails,
};

const Address=require('../models/addressModel')
const User=require('../models/userModel');
const Order=require('../models/orderModel')
const Product=require('../models/productModel')
const Wallet = require('../models/walletModel')
const bcrypt = require('bcrypt');
const Cart = require('../models/cartModel')
const Swal = require('sweetalert2');



const myAccount = async(req,res)=>{
    try {
        const userId=req.session.user_id
        const user = await User.findById(userId)
        const addresses= await Address.find({userId})
        const orders = await Order.find({ userId }).populate('items.productId');
        const walletId = user.wallet;
        // Find the wallet using the wallet ID
        const userWallet = await Wallet.findById(walletId);
        const balance = userWallet ? userWallet.balance : 0;
        const subtotal = req.query.subtotal || 0; // Retrieve subtotal from query parameter
        const selectedAddressId = req.query.addressId;
        const paymentMethod=req.query.paymentMethod
        console.log(selectedAddressId);
        res.render('myAccount',{user,addresses,orders,balance,subtotal,selectedAddressId,paymentMethod})
        
    } catch (error) {
        console.log(error.message)
    }
}
const updateDetails = async(req,res)=>{
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
                return res.status(400).json({ message: "Current password is incorrect" });
            }

            // Check if the new password matches the confirmation
            if (npassword !== cpassword) {
                return res.status(400).json({ message: "New password and confirm password do not match" });
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
}

const addAddressPage = async(req,res)=>{
    try {
        const userId=req.session.user_id
        const user = await User.findById(userId)
        res.render('addAddress',{user})
        
    } catch (error) {
        console.log(error.message)
    }
}

const addAddress = async(req,res)=>{
   
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
                city
            });

            // Save the new address to the database
            await newAddress.save();
    
            res.redirect('/myaccount'); 
        } catch (error) {
            console.log(error.message);
            res.status(500).send('Internal Server Error');
        }
        
   
}

const editAddressPage = async(req,res)=>{
    try {
        const userId=req.session.user_id
        const user = await User.findById(userId)
        const address = await Address.findById(req.params.id);
        res.render('editAddress', { address,user});
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const editAddress = async(req,res)=>{
    try {
        const { name, mobile, address, pincode, state, district, city } = req.body;
        const addressId = req.params.id;
        await Address.findByIdAndUpdate(addressId, { name, mobile, address, pincode, state, district, city });
        res.redirect('/myaccount'); // Redirect to my account page after editing
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
}

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        
        // Delete the address from the database
        await Address.deleteOne({_id:addressId})
        res.redirect('/myaccount');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


const cancelMyOrder=async (req,res)=>{
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user_id;
        // Find the order of the user
        const order = await Order.findOne({ userId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const user = await User.findById(userId)
        // Find the item in the order
        const item = order.items.find(item => item.productId.toString() === productId);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in order' });
        }

        // Update delivery status to "Cancelled"
        item.deliveryStatus = 'Cancelled';

        // Restore stock quantity in product schema
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.stock += parseInt(quantity); // Increment stock

        // Save changes
        await order.save();
        await product.save();

         // Refund amount to the user's wallet
      
            const walletId = user.wallet;
            // Find the wallet using the wallet ID
            const userWallet = await Wallet.findById(walletId);
             const refundedAmount = item.price;
              
            // Add the refunded amount to the user's wallet
            await userWallet.addToWallet(refundedAmount);
         
        

        res.status(200).json({ success: true, message: 'Order cancelled successfully' });

    } catch (error) {
        console.log(error.message);
    }
}
const returnMyOrder=async (req,res)=>{
    try {
        const { productId, quantity } = req.body;
        const userId = req.session.user_id;
        // Find the order of the user
        const order = await Order.findOne({ userId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Find the item in the order
        const item = order.items.find(item => item.productId.toString() === productId);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in order' });
        }

        // Update delivery status to "Returned"
        item.deliveryStatus = 'Returned';

        // Restore stock quantity in product schema
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.stock += parseInt(quantity); // Increment stock

        // Save changes
        await order.save();
        await product.save();

        // Refund amount to the user's wallet
        const user = await User.findById(userId)
        const walletId = user.wallet;
        // Find the wallet using the wallet ID
        const userWallet = await Wallet.findById(walletId);
         const refundedAmount = item.price;
          
        // Add the refunded amount to the user's wallet
        await userWallet.addToWallet(refundedAmount);


        res.status(200).json({ success: true, message: 'Order Returned' });

    } catch (error) {
        console.log(error.message);
    }
}

const walletPayment = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const subtotal = req.query.subtotal; 
        if (isNaN(subtotal)) {
            // Handle invalid subtotal
            return res.status(400).send('Invalid subtotal');
          }
    // Get the selected address ID from the request body
    const selectedAddressId = req.body.selectedAddress;
       
    // Find the selected address
    const address = await Address.findOne({ _id: selectedAddressId, userId });

    // Ensure that the selected address exists and belongs to the user
    if (!address) {
        return res.status(400).send('Invalid address selected');
    }
        // Find the user's cart
        const cart = await Cart.findOne({ userId }).populate('products.productId');

        // Check if the cart is empty
        if (!cart || !cart.products.length) {
            return res.status(400).send('Cart is empty');
        }
          // Calculate total amount and set price for each item
          let totalAmount = 0;
          for (const item of cart.products) {
              // Calculate price for each item based on quantity and selling price
              const itemPrice = item.quantity * item.productId.selling_price;
              item.price = itemPrice;
              totalAmount += itemPrice;
          }
          const paymentMethod = req.query.paymentMethod;
          if (!paymentMethod) {
              return res.status(400).send('Payment method is required');
          }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }
        const walletId = user.wallet;
        const userWallet = await Wallet.findById(walletId);
        if (!userWallet) {
            return res.status(404).send('Wallet not found');
        }
        if (userWallet.balance < subtotal) {
            return res.status(400).send('Insufficient balance');
        }
        userWallet.balance -= parseFloat(subtotal);
        await userWallet.save();

            const order = new Order({
            userId,
            items: cart.products,
            status: 'paid',
            totalAmount,
            paymentMethod,
            address: address._id
        });
          //Save the order to the database
          await order.save();

          //Clear the cart after placing the order
          await Cart.findOneAndUpdate({ userId }, { $set: { products: [] } });
  
          // // Redirect to success page
          return res.redirect('/ordersuccess');

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
module.exports={
    myAccount,
    updateDetails,
    addAddressPage,
    addAddress,
    editAddressPage,
    editAddress,
    deleteAddress,
    cancelMyOrder,
    returnMyOrder,
    walletPayment
}
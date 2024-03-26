const Address=require('../models/addressModel')
const User=require('../models/userModel');
const Order=require('../models/orderModel')
const bcrypt = require('bcrypt');
const Swal = require('sweetalert2');

const myAccount = async(req,res)=>{
    try {
        const userId=req.session.user_id
        const user = await User.findById(userId)
        const addresses= await Address.find({userId})
        const orders=await Order.find({userId})
        res.render('myAccount',{user,addresses,orders})
        
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

module.exports={
    myAccount,
    updateDetails,
    addAddressPage,
    addAddress,
    editAddressPage,
    editAddress,
    deleteAddress
}
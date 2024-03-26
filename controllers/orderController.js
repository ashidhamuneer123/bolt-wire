const User = require("../models/userModel");
const Order=require('../models/orderModel')
const getOrderList=async (req,res)=>{
    try {
        const orders=await Order.find().populate('userId')
       
        res.render('admin/order',{orders})
    } catch (error) {
        
    }
}

module.exports={
    getOrderList
}
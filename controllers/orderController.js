
const Order=require('../models/orderModel')
const Product = require('../models/productModel')
const getOrderList=async (req,res)=>{
    try {
        const orders = await Order.find().populate('items.productId').populate('userId');
       
        res.render('admin/order',{orders})
    } catch (error) {
        console.error(error.message)
    }
}

const cancelOrder=async (req,res)=>{
    try {
        const {orderId, productId, quantity } = req.body;
        
        const order = await Order.findOne({ _id:orderId });
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Find the item in the order
        const item = order.items.find(item => item.productId.toString() === productId);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in order' });
        }
        item.deliveryStatus = 'Cancelled';
        await order.save();

        const product = await Product.updateOne({_id:productId},{$inc:{stock:quantity}});
        
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, message: 'Order cancelled successfully' });

    } catch (error) {
        console.log(error.message);
    }
}

const updateStatus=async (req,res)=>{
    try {
        const { orderId, status ,productId} = req.body;
      
        await Order.findOneAndUpdate(
            { _id: orderId, 'items.productId': productId },
            { $set: { 'items.$.deliveryStatus': status } }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

const orderDetails=async (req,res)=>{
    try {
        const orderId = req.params.orderId;
        const productId = req.query.productId;
        
        const order = await Order.findById(orderId).populate('userId address items.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('admin/orderDetails', { order });
       
    } catch (error) {
        
    }
}

module.exports={
    getOrderList,
    cancelOrder,
    updateStatus,
    orderDetails
}
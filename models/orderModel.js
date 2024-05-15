const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Products',
                required: true
            },
            deliveryStatus: {
                type: String,
                enum: ['Processing', 'Cancelled', 'Delivered' , 'Returned','Pending'], 
                default: 'Processing' 
            },
            quantity: {
                type: Number,
                required: true,
                default: 1 
            },
            price:{
                type:Number,
                default:0
            }
           
        }
    ],
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'Online payment', 'Online', 'Wallet'],
        required: true
    },
    deliveryCharge: {
        type: Number,
        default: 0
    },
    couponDiscount: {
         type: Number,
        
         },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['paid', 'unpaid'],
        default: 'unpaid'
    },
  
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);

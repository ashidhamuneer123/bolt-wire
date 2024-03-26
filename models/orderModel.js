const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                default: 1 // Default quantity set to 1
            }
        }
    ],
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'Credit Card', 'Debit Card', 'Net Banking'],
        required: true
    },
    deliveryCharge: {
        type: Number,
        default: 0
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

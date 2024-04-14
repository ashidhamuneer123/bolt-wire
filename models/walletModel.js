const mongoose = require('mongoose')
const {Schema} = mongoose;

const walletSchema = new Schema({
    userId:{
        type:Schema.ObjectId,
        ref:'user',
        require:true
    },
    balance:{
        type:Number,
        default:0
    }
})
 
module.exports= mongoose.model("Wallet",walletSchema)



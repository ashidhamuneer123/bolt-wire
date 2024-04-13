const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
    name:{type:String,required:true},
    email:{type:String,required:true},
    password:{type:String,required:true},
    phone:{type:String,required:true},
    is_admin:{type:Number,required:true},
    blocked: { type: Number,default: 0 } ,
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet'
    }
});

module.exports = mongoose.model("user", userSchema);
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        unique:true
    },
    balance: {
        type: Number,
        default: 0
    }
});

// Method to add funds to the wallet balance
walletSchema.methods.addToWallet = async function(amount) {
    this.balance += amount;
    await this.save();
};

module.exports = mongoose.model('Wallet', walletSchema);

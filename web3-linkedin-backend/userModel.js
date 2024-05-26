const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bio: { type: String, required: true },
    avatar: { type: String, required: true },
    phantomAddress: { type: String, unique: true, required: true },
    friends: [{ type: String }], // Changed to String
    has_nft: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema);

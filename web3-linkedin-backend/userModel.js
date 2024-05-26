const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    bio: String,
    avatar: String,
    phantomAddress: { type: String, unique: true },
    profilePublicKey: String,
    friends: [{ type: String }], // Changed to String
    friendRequests: [{ type: String }],
});

const User = mongoose.model('User', userSchema);
module.exports = User;

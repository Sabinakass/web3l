const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    bio: String,
    avatar: String,
    phantomAddress: { type: String, unique: true },
    profilePublicKey: String,
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

const User = mongoose.model('User', userSchema);
module.exports = User;

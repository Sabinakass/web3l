const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Connection, Transaction } = require('@solana/web3.js');
const User = require('./userModel');
const Post = require('./postModel');
const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());

// Solana setup
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Add this route to handle transaction submission
app.post('/api/transactions/submit', async (req, res) => {
    try {
        const { transaction: transactionBase64, profilePublicKey, name, bio, avatar, phantomAddress } = req.body;

        // Deserialize the transaction
        const transactionBuffer = Buffer.from(transactionBase64, 'base64');
        const transaction = Transaction.from(transactionBuffer);

        // Send the transaction
        const signature = await connection.sendRawTransaction(transaction.serialize());
        await connection.confirmTransaction(signature);

        // Save the user details to MongoDB
        const newUser = new User({
            name,
            bio,
            avatar,
            phantomAddress,
            profilePublicKey,
        });
        await newUser.save();

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error processing transaction:', error.message);
        res.status(500).json({ message: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

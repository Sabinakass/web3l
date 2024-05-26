const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Connection, PublicKey, Keypair, SystemProgram, Transaction } = require('@solana/web3.js');
const { Program, AnchorProvider, Wallet } = require('@project-serum/anchor');
const User = require('./userModel');
const FriendRequest = require('./friendRequestModel');
const Post = require('./postModel');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5001;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/web3linkedin', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());

// Solana setup
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const keypairPath = './program-keypair.json';
const walletKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypairPath))));
const wallet = new Wallet(walletKeypair);

const idl = JSON.parse(fs.readFileSync('./idl.json', 'utf8')); // Ensure this path is correct
const programId = new PublicKey('3B3LUSr2wAHAioxNDTsecdhVsPeWy26VxoxU48HeuHyj'); // Replace with your actual program ID

const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
const program = new Program(idl, programId, provider);

// Endpoint to handle transaction submission
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

// Endpoint to fetch user profile
app.get('/api/users/profile/:phantomAddress', async (req, res) => {
    try {
        const { phantomAddress } = req.params;
        const user = await User.findOne({ phantomAddress }).populate('friends');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Endpoint to fetch available users
app.get('/api/users/available/:phantomAddress', async (req, res) => {
    try {
        const { phantomAddress } = req.params;
        const user = await User.findOne({ phantomAddress });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const friendsAddresses = user.friends.map(friend => friend.toString());
        const availableUsers = await User.find({ phantomAddress: { $nin: [...friendsAddresses, phantomAddress] } });

        res.status(200).json(availableUsers);
    } catch (error) {
        console.error('Error fetching available users:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Endpoint to send friend request
app.post('/api/send-friend-request', async (req, res) => {
    try {
        const { from, to } = req.body;

        if (!PublicKey.isOnCurve(from) || !PublicKey.isOnCurve(to)) {
            throw new Error('Invalid public key');
        }

        const sender = await User.findOne({ phantomAddress: from });
        const receiver = await User.findOne({ phantomAddress: to });

        if (!sender || !receiver) {
            return res.status(404).json({ message: 'User not found' });
        }

        const friendRequestAccount = Keypair.generate();

        await program.methods.sendFriendRequest()
            .accounts({
                friendRequest: friendRequestAccount.publicKey,
                user: new PublicKey(from),
                friend: new PublicKey(to),
                systemProgram: SystemProgram.programId,
            })
            .signers([walletKeypair, friendRequestAccount])
            .rpc();

        const friendRequest = new FriendRequest({
            from,
            to,
            requestPublicKey: friendRequestAccount.publicKey.toString(),
            status: 'Pending'
        });
        await friendRequest.save();

        res.status(200).json({ message: 'Friend request sent successfully' });
    } catch (error) {
        console.error('Error sending friend request:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Endpoint to accept friend request
app.post('/api/accept-friend-request', async (req, res) => {
    try {
        const { requestId } = req.body;
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest || friendRequest.status !== 'Pending') {
            return res.status(404).json({ message: 'Friend request not found or already processed' });
        }

        const { from, to, requestPublicKey } = friendRequest;

        if (!PublicKey.isOnCurve(from) || !PublicKey.isOnCurve(to) || !PublicKey.isOnCurve(requestPublicKey)) {
            throw new Error('Invalid public key');
        }

        const sender = await User.findOne({ phantomAddress: from });
        const receiver = await User.findOne({ phantomAddress: to });

        if (!sender || !receiver) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure the user has the token account and mint account set up
        const mintPublicKey = new PublicKey('YOUR_MINT_PUBLIC_KEY'); // Replace with your mint public key
        const tokenAccountPublicKey = new PublicKey('YOUR_TOKEN_ACCOUNT_PUBLIC_KEY'); // Replace with your token account public key

        await program.methods.acceptFriendRequest()
            .accounts({
                friendRequest: new PublicKey(requestPublicKey),
                user: new PublicKey(from),
                friend: new PublicKey(to),
                systemProgram: SystemProgram.programId,
                mint: mintPublicKey,
                token_account: tokenAccountPublicKey,
                token_program: Token.programId,
                authority: wallet.publicKey,
            })
            .signers([walletKeypair])
            .rpc();

        friendRequest.status = 'Accepted';
        await friendRequest.save();

        sender.friends.push(receiver._id);
        receiver.friends.push(sender._id);
        await sender.save();
        await receiver.save();

        res.status(200).json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Error accepting friend request:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Endpoint to reject friend request
app.post('/api/reject-friend-request', async (req, res) => {
    try {
        const { requestId } = req.body;
        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest || friendRequest.status !== 'Pending') {
            return res.status(404).json({ message: 'Friend request not found or already processed' });
        }

        friendRequest.status = 'Rejected';
        await friendRequest.save();

        res.status(200).json({ message: 'Friend request rejected' });
    } catch (error) {
        console.error('Error rejecting friend request:', error.message);
        res.status(500).json({ message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

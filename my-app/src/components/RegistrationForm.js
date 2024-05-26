import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { Connection, PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { Buffer } from 'buffer';
import idl from './idl.json';

window.Buffer = window.Buffer || Buffer;

const RegistrationForm = ({ onRegister }) => {
    const { publicKey, signTransaction, connected, connect } = useWallet();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        avatar: '',
        phantomAddress: ''
    });

    useEffect(() => {
        if (publicKey) {
            setFormData(prevFormData => ({
                ...prevFormData,
                phantomAddress: publicKey.toString()
            }));
        }
    }, [publicKey]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!connected) {
                await connect();
            }

            if (!signTransaction || !publicKey) {
                throw new Error('Wallet not connected');
            }

            const profileAccount = Keypair.generate();
            const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
            const provider = new AnchorProvider(connection, { publicKey, signTransaction }, { preflightCommitment: 'confirmed' });
            const program = new Program(idl, new PublicKey('3B3LUSr2wAHAioxNDTsecdhVsPeWy26VxoxU48HeuHyj'), provider);

            const transaction = new Transaction().add(
                await program.methods.createProfile(formData.name, formData.bio, formData.avatar)
                    .accounts({
                        profile: profileAccount.publicKey,
                        user: publicKey,
                        systemProgram: SystemProgram.programId,
                    })
                    .instruction()
            );

            transaction.feePayer = publicKey;
            transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

            const signedTransaction = await signTransaction(transaction);
            signedTransaction.partialSign(profileAccount);

            const response = await fetch('http://localhost:5001/api/transactions/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    transaction: signedTransaction.serialize().toString('base64'),
                    profilePublicKey: profileAccount.publicKey.toString(),
                    name: formData.name,
                    bio: formData.bio,
                    avatar: formData.avatar,
                    phantomAddress: formData.phantomAddress,
                })
            });

            const data = await response.json();
            if (response.ok) {
                alert('User registered successfully!');
                onRegister(); // Call the callback function to update the registration state
                navigate('/main'); // Navigate to the main page after registration
            } else {
                alert(`Registration failed: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during registration:', error);
            alert(`An error occurred during registration: ${error.message}`);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>Name:</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />

            <label>Bio:</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} required />

            <label>Profile Picture URL:</label>
            <input type="text" name="avatar" value={formData.avatar} onChange={handleChange} required />

            <label>Phantom Wallet Address:</label>
            <input type="text" name="phantomAddress" value={formData.phantomAddress} readOnly />

            <button type="submit">Register</button>
        </form>
    );
};

export default RegistrationForm;

// src/components/RegistrationForm.js
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate, Link } from 'react-router-dom';
import { Connection, PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import { Buffer } from 'buffer';
import styled from 'styled-components';
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
        <FormContainer onSubmit={handleSubmit}>
            <FormLabel>Name:</FormLabel>
            <FormInput type="text" name="name" value={formData.name} onChange={handleChange} required />

            <FormLabel>Bio:</FormLabel>
            <FormTextArea name="bio" value={formData.bio} onChange={handleChange} required />

            <FormLabel>Profile Picture URL:</FormLabel>
            <FormInput type="text" name="avatar" value={formData.avatar} onChange={handleChange} required />

            <FormLabel>Phantom Wallet Address:</FormLabel>
            <FormInput type="text" name="phantomAddress" value={formData.phantomAddress} readOnly />

            <SubmitButton type="submit">Register</SubmitButton>
            <LoginLink>
                Already have an account? <StyledLink to="/login">Login</StyledLink>
            </LoginLink>
        </FormContainer>
    );
};

export default RegistrationForm;

// Styled-components
const FormContainer = styled.form`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const FormLabel = styled.label`
    align-self: flex-start;
    margin-bottom: 5px;
    font-weight: bold;
    color: #333;
`;

const FormInput = styled.input`
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
`;

const FormTextArea = styled.textarea`
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
    resize: vertical;
`;

const SubmitButton = styled.button`
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;

    &:hover {
        background-color: #0056b3;
    }
`;

const LoginLink = styled.p`
    margin-top: 20px;
    font-size: 14px;
    color: #666;
`;

const StyledLink = styled(Link)`
    color: #007bff;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const LoginForm = ({ onLogin }) => {
    const { publicKey, connect, connected } = useWallet();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (publicKey) {
            handleLogin();
        }
    }, [publicKey]);

    const handleLogin = async () => {
        setLoading(true);
        try {
            if (!connected) {
                await connect();
            }
            if (!publicKey) {
                throw new Error('Wallet not connected');
            }

            const response = await fetch(`http://localhost:5001/api/users/profile/${publicKey.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }
            const data = await response.json();
            onLogin(data);
            navigate('/main');
        } catch (error) {
            console.error('Error during login:', error);
            alert(`An error occurred during login: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <Title>Login</Title>
            <LoginButton onClick={handleLogin} disabled={loading}>
                {loading ? 'Logging in...' : 'Login with Phantom Wallet'}
            </LoginButton>
        </Container>
    );
};

export default LoginForm;

// Styled-components
const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #f5f5f5;
    font-family: 'Arial, sans-serif';
`;

const Title = styled.h2`
    margin-bottom: 20px;
    color: #333;
`;

const LoginButton = styled.button`
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;

    &:disabled {
        background-color: #cccccc;
    }

    &:hover:enabled {
        background-color: #0056b3;
    }
`;

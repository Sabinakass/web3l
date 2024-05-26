import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@project-serum/anchor';
import idl from './idl.json'; // Ensure the path is correct
import styled from 'styled-components';

const MainPage = () => {
    const { publicKey, signTransaction, wallet } = useWallet();
    const [availableUsers, setAvailableUsers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (publicKey) {
                try {
                    const response = await fetch(`http://localhost:5001/api/users/profile/${publicKey.toString()}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch user profile');
                    }
                    const data = await response.json();
                    setUserProfile(data);
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                    alert(`Error fetching user profile: ${error.message}`);
                }
            }
        };

        fetchUserProfile();
    }, [publicKey]);

    useEffect(() => {
        const fetchAvailableUsers = async () => {
            if (publicKey) {
                try {
                    const response = await fetch(`http://localhost:5001/api/users/available/${publicKey.toString()}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch available users');
                    }
                    const data = await response.json();
                    setAvailableUsers(data);
                } catch (error) {
                    console.error('Error fetching available users:', error);
                }
            }
        };

        const fetchPendingRequests = async () => {
            if (publicKey) {
                try {
                    const response = await fetch(`http://localhost:5001/api/users/pending-requests/${publicKey.toString()}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch pending requests');
                    }
                    const data = await response.json();
                    setPendingRequests(data);
                } catch (error) {
                    console.error('Error fetching pending requests:', error);
                    alert(`Error fetching pending requests: ${error.message}`);
                }
            }
        };

        fetchAvailableUsers();
        fetchPendingRequests();
    }, [publicKey]);

    const handleSendFriendRequest = async (friendId) => {
        if (publicKey) {
            try {
                const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
                const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
                const program = new Program(idl, new PublicKey('3B3LUSr2wAHAioxNDTsecdhVsPeWy26VxoxU48HeuHyj'), provider);

                const transaction = new Transaction().add(
                    await program.methods.sendFriendRequest(new PublicKey(friendId))
                        .accounts({
                            systemProgram: SystemProgram.programId,
                        })
                        .instruction()
                );

                transaction.feePayer = publicKey;
                transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

                let signedTransaction = await signTransaction(transaction);
                const serializedTransaction = signedTransaction.serialize();
                const transactionBase64 = serializedTransaction.toString('base64');

                const response = await fetch('http://localhost:5001/api/send-friend-request', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: publicKey.toString(),
                        to: friendId,
                        transactionBase64
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to send friend request');
                }

                const data = await response.json();
                alert(data.message);

                setAvailableUsers(availableUsers.filter(user => user.phantomAddress !== friendId));
            } catch (error) {
                console.error('Error sending friend request:', error);
                alert(`Error sending friend request: ${error.message}`);
            }
        }
    };

    return (
        <Container>
            <Title>Main Page</Title>
            {userProfile && (
                <ProfileContainer>
                    <ProfileTitle>Welcome, {userProfile.name}</ProfileTitle>
                    <ProfileImage src={userProfile.avatar} alt={`${userProfile.name}'s avatar`} />
                    <ProfileBio>{userProfile.bio}</ProfileBio>
                </ProfileContainer>
            )}
            <SectionTitle>Available Users to Add as Friends</SectionTitle>
            <UserList>
                {availableUsers.map(user => (
                    <UserItem key={user.phantomAddress}>
                        {user.name} <Button onClick={() => handleSendFriendRequest(user.phantomAddress)}>Send Friend Request</Button>
                    </UserItem>
                ))}
            </UserList>
        </Container>
    );
};

export default MainPage;


const Container = styled.div`
    padding: 20px;
    max-width: 800px;
    margin: 0 auto;
    font-family: 'Arial, sans-serif';
`;

const Title = styled.h1`
    text-align: center;
    margin-bottom: 20px;
    color: #333;
`;

const ProfileContainer = styled.div`
    text-align: center;
    margin-bottom: 40px;
`;

const ProfileTitle = styled.h2`
    margin-bottom: 10px;
    color: #555;
`;

const ProfileImage = styled.img`
    border-radius: 50%;
    width: 100px;
    height: 100px;
    margin-bottom: 10px;
`;

const ProfileBio = styled.p`
    color: #777;
`;

const SectionTitle = styled.h2`
    margin-bottom: 20px;
    color: #333;
`;

const UserList = styled.ul`
    list-style: none;
    padding: 0;
`;

const UserItem = styled.li`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #eee;
`;

const Button = styled.button`
    background-color: #007bff;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        background-color: #0056b3;
    }
`;

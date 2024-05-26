// src/components/UserProfile.js
import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useParams } from 'react-router-dom';

const UserProfile = () => {
    const { publicKey } = useWallet();
    const { phantomAddress } = useParams();
    const [userData, setUserData] = useState(null);
    const [isCurrentUser, setIsCurrentUser] = useState(false);

    useEffect(() => {
        if (publicKey && publicKey.toString() === phantomAddress) {
            setIsCurrentUser(true);
        } else {
            setIsCurrentUser(false);
        }

        fetch(`http://localhost:5001/api/users/${phantomAddress}`)
            .then(response => response.json())
            .then(data => setUserData(data))
            .catch(error => console.error('Error fetching user data:', error));
    }, [publicKey, phantomAddress]);

    const handleSendFriendRequest = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/users/${userData._id}/friend-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phantomAddress: publicKey.toString() })
            });
            const data = await response.json();
            alert(data.message);
        } catch (error) {
            console.error('Error sending friend request:', error);
        }
    };

    const handleAcceptFriendRequest = async (friendId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/users/${userData._id}/accept-friend`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ friendId })
            });
            const data = await response.json();
            alert(data.message);
            // Refresh user data
            fetch(`http://localhost:5001/api/users/${phantomAddress}`)
                .then(response => response.json())
                .then(data => setUserData(data))
                .catch(error => console.error('Error fetching user data:', error));
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    return (
        <div>
            <h1>User Profile</h1>
            {userData ? (
                <div>
                    <img src={userData.avatar} alt="User Avatar" />
                    <p>Name: {userData.name}</p>
                    <p>Bio: {userData.bio}</p>
                    <p>Phantom Wallet Address: {userData.phantomAddress}</p>
                    <p>Number of Friends: {userData.friends.length}</p>

                    {!isCurrentUser && (
                        <button onClick={handleSendFriendRequest}>Add to Friend/Connect</button>
                    )}

                    {isCurrentUser && userData.friendRequests.length > 0 && (
                        <div>
                            <h2>Friend Requests</h2>
                            <ul>
                                {userData.friendRequests.map(request => (
                                    <li key={request._id}>
                                        {request.name}
                                        <button onClick={() => handleAcceptFriendRequest(request._id)}>Accept</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
};

export default UserProfile;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

const UserProfile = () => {
    const { phantomAddress } = useParams();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/users/profile/${phantomAddress}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUser();
    }, [phantomAddress]);

    if (!user) {
        return <Loading>Loading...</Loading>;
    }

    return (
        <ProfileContainer>
            <ProfileHeader>
                <ProfileName>{user.name}</ProfileName>
                <ProfileBio>{user.bio}</ProfileBio>
                {user.avatar && <ProfileImage src={user.avatar} alt={`${user.name}'s avatar`} />}
            </ProfileHeader>
            <FriendsSection>
                <FriendsTitle>Friends ({user.friends.length})</FriendsTitle>
                <FriendsList>
                    {user.friends.map(friend => (
                        <FriendItem key={friend}>{friend}</FriendItem>
                    ))}
                </FriendsList>
            </FriendsSection>
        </ProfileContainer>
    );
};

export default UserProfile;

// Styled-components
const ProfileContainer = styled.div`
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    font-family: 'Arial, sans-serif';
`;

const ProfileHeader = styled.div`
    text-align: center;
    margin-bottom: 20px;
`;

const ProfileName = styled.h1`
    margin-bottom: 10px;
    color: #333;
`;

const ProfileBio = styled.p`
    margin-bottom: 20px;
    color: #666;
`;

const ProfileImage = styled.img`
    width: 150px;
    height: 150px;
    border-radius: 50%;
`;

const FriendsSection = styled.div`
    text-align: left;
`;

const FriendsTitle = styled.h2`
    margin-bottom: 10px;
    color: #333;
`;

const FriendsList = styled.ul`
    list-style: none;
    padding: 0;
`;

const FriendItem = styled.li`
    padding: 5px 0;
    border-bottom: 1px solid #eee;
`;

const Loading = styled.div`
    text-align: center;
    font-size: 18px;
    color: #666;
    padding: 50px;
`;

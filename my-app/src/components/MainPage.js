// src/components/MainPage.js
import React, { useState, useEffect } from 'react';

const MainPage = () => {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        // Fetch posts from the server
        fetch('http://localhost:5001/api/posts')
            .then(response => response.json())
            .then(data => setPosts(data))
            .catch(error => console.error('Error fetching posts:', error));
    }, []);

    return (
        <div>
            <h1>Main Page</h1>
            <p>Welcome to the main page!</p>
            <ul>
                {posts.map(post => (
                    <li key={post._id}>
                        <p>{post.content}</p>
                        <small>By: {post.authorName}</small>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MainPage;

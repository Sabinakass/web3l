// src/components/CreatePost.js
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

const CreatePost = () => {
    const { publicKey } = useWallet();
    const [postContent, setPostContent] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5001/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: postContent, authorId: publicKey.toString() })
            });
            const data = await response.json();
            if (response.ok) {
                alert('Post submitted successfully!');
                setPostContent('');
            } else {
                alert(`Failed to submit post: ${data.message}`);
            }
        } catch (error) {
            console.error('Error during post submission:', error);
            alert('An error occurred during post submission.');
        }
    };

    return (
        <div>
            <h1>Create Post</h1>
            <form onSubmit={handleSubmit}>
                <label>Post Content:</label>
                <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    required
                />
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default CreatePost;

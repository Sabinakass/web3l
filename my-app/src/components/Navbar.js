// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';

const Navbar = ({ hasTopWeb3NFT }) => {
    const { publicKey } = useWallet();

    return (
        <nav>
            <ul>
                <li>
                    <Link to="/main">Main Page</Link>
                </li>
                {publicKey && (
                    <li>
                        <Link to={`/profile/${publicKey.toString()}`}>User Profile</Link>
                    </li>
                )}
                {hasTopWeb3NFT && (
                    <li>
                        <Link to="/create-post">Create Post</Link>
                    </li>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;

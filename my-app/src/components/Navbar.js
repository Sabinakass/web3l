// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import styled from 'styled-components';

const Navbar = ({ hasTopWeb3NFT }) => {
    const { publicKey } = useWallet();

    return (
        <Nav>
            <NavList>
                <NavItem>
                    <StyledLink to="/main">Main Page</StyledLink>
                </NavItem>
                {publicKey && (
                    <NavItem>
                        <StyledLink to={`/profile/${publicKey.toString()}`}>User Profile</StyledLink>
                    </NavItem>
                )}
                {hasTopWeb3NFT && (
                    <NavItem>
                        <StyledLink to="/create-post">Create Post</StyledLink>
                    </NavItem>
                )}
            </NavList>
        </Nav>
    );
};

export default Navbar;

// Styled-components
const Nav = styled.nav`
    background-color: #333;
    padding: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const NavList = styled.ul`
    list-style: none;
    display: flex;
    gap: 1.5rem;
    margin: 0;
    padding: 0;
`;

const NavItem = styled.li``;

const StyledLink = styled(Link)`
    color: white;
    text-decoration: none;
    font-size: 1.2rem;

    &:hover {
        text-decoration: underline;
    }
`;

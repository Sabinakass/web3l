import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import RegistrationForm from './components/RegistrationForm';
import MainPage from './components/MainPage';
import UserProfile from './components/UserProfile';
import CreatePost from './components/CreatePost';
import Navbar from './components/Navbar';

const App = () => {
    const [isRegistered, setIsRegistered] = useState(false);
    const [hasTopWeb3NFT, setHasTopWeb3NFT] = useState(false);
    const network = "https://api.devnet.solana.com";
    const wallets = [new PhantomWalletAdapter()];

    const checkForTopWeb3NFT = async () => {
        setHasTopWeb3NFT(true); // Assuming the user has the NFT for demonstration
    };

    useEffect(() => {
        if (isRegistered) {
            checkForTopWeb3NFT();
        }
    }, [isRegistered]);

    return (
        <Router>
            <ConnectionProvider endpoint={network}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        {isRegistered && <Navbar hasTopWeb3NFT={hasTopWeb3NFT} />}
                        <WalletMultiButton />
                        <Routes>
                            <Route path="/register" element={<RegistrationForm onRegister={() => setIsRegistered(true)} />} />
                            <Route path="/main" element={isRegistered ? <MainPage /> : <Navigate to="/register" />} />
                            <Route path="/profile/:phantomAddress" element={isRegistered ? <UserProfile /> : <Navigate to="/register" />} />
                            <Route path="/create-post" element={isRegistered && hasTopWeb3NFT ? <CreatePost /> : <Navigate to="/main" />} />
                            <Route path="/" element={<Navigate to="/main" />} />
                        </Routes>
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </Router>
    );
};

export default App;

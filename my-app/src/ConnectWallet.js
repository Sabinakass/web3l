import React from 'react';
import { Button } from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';

const ConnectWallet = () => {
    const { connect, connected } = useWallet();

    return (
        <div style={{ margin: '20px' }}>
            {connected ? (
                <Button variant="contained" color="primary" onClick={() => console.log('Wallet Connected!')}>
                    Wallet Connected
                </Button>
            ) : (
                <Button variant="contained" color="secondary" onClick={connect}>
                    Connect Wallet
                </Button>
            )}
        </div>
    );
};

export default ConnectWallet;

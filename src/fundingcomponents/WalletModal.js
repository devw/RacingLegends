import React, { useState, useEffect } from 'react';
import './WalletModal.css';

export const WalletModal = ({ show, onHide, onWalletConnect }) => {
  const [availableWallets, setAvailableWallets] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(null);

  // Wallet configurations
  const walletConfigs = {
    metamask: {
      name: 'MetaMask',
      icon: '🦊',
      provider: 'ethereum',
      downloadUrl: 'https://metamask.io/download/',
      description: 'Connect using browser wallet'
    },
    phantom: {
      name: 'Phantom',
      icon: '👻',
      provider: 'phantom',
      downloadUrl: 'https://phantom.app/',
      description: 'Connect using Phantom wallet'
    },
    coinbase: {
      name: 'Coinbase Wallet',
      icon: '🔵',
      provider: 'coinbaseWallet',
      downloadUrl: 'https://www.coinbase.com/wallet',
      description: 'Connect using Coinbase wallet'
    },
    walletconnect: {
      name: 'WalletConnect',
      icon: '🔗',
      provider: 'walletconnect',
      downloadUrl: 'https://walletconnect.com/',
      description: 'Connect using WalletConnect'
    },
    trust: {
      name: 'Trust Wallet',
      icon: '🛡️',
      provider: 'trustwallet',
      downloadUrl: 'https://trustwallet.com/',
      description: 'Connect using Trust wallet'
    }
  };

  useEffect(() => {
    if (show) {
      detectWallets();
    }
  }, [show]);

  const detectWallets = () => {
    const detected = [];

    // Check for MetaMask
    if (window.ethereum && window.ethereum.isMetaMask) {
      detected.push({
        ...walletConfigs.metamask,
        installed: true,
        provider: window.ethereum
      });
    }

    // Check for Phantom
    if (window.phantom && window.phantom.ethereum) {
      detected.push({
        ...walletConfigs.phantom,
        installed: true,
        provider: window.phantom.ethereum
      });
    }

    // Check for Coinbase Wallet
    if (window.ethereum && window.ethereum.isCoinbaseWallet) {
      detected.push({
        ...walletConfigs.coinbase,
        installed: true,
        provider: window.ethereum
      });
    }

    // Check for Trust Wallet
    if (window.ethereum && window.ethereum.isTrust) {
      detected.push({
        ...walletConfigs.trust,
        installed: true,
        provider: window.ethereum
      });
    }

    // Check for other injected wallets
    if (window.ethereum && !window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet && !window.ethereum.isTrust) {
      detected.push({
        name: 'Injected Wallet',
        icon: '💼',
        installed: true,
        provider: window.ethereum,
        description: 'Connect using injected wallet'
      });
    }

    // Add popular wallets that aren't installed
    Object.keys(walletConfigs).forEach(key => {
      const config = walletConfigs[key];
      const isAlreadyDetected = detected.some(wallet => wallet.name === config.name);
      
      if (!isAlreadyDetected) {
        detected.push({
          ...config,
          installed: false,
          provider: null
        });
      }
    });

    setAvailableWallets(detected);
  };

  const connectWallet = async (wallet) => {
    if (!wallet.installed) {
      window.open(wallet.downloadUrl, '_blank');
      return;
    }

    setIsConnecting(true);
    setConnectingWallet(wallet.name);

    try {
      let accounts = [];
      
      if (wallet.name === 'Phantom' && window.phantom) {
        // Phantom wallet connection
        const response = await window.phantom.ethereum.request({
          method: 'eth_requestAccounts'
        });
        accounts = response;
      } else if (wallet.provider) {
        // Standard Ethereum wallet connection
        accounts = await wallet.provider.request({
          method: 'eth_requestAccounts'
        });
      }

      if (accounts.length > 0) {
        onWalletConnect({
          address: accounts[0],
          walletName: wallet.name,
          provider: wallet.provider
        });
        onHide();
      }
    } catch (error) {
      console.error(`Error connecting to ${wallet.name}:`, error);
      alert(`Failed to connect to ${wallet.name}. Please try again.`);
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  };

  if (!show) return null;

  return (
    <div className="wallet-modal-overlay" onClick={onHide}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <h2>Connect Wallet</h2>
          <button className="wallet-modal-close" onClick={onHide}>×</button>
        </div>
        
        <div className="wallet-modal-content">
          <p className="wallet-modal-description">
            Choose how you want to connect your wallet
          </p>
          
          <div className="wallet-list">
            {availableWallets.map((wallet, index) => (
              <div
                key={index}
                className={`wallet-item ${!wallet.installed ? 'wallet-not-installed' : ''} ${
                  isConnecting && connectingWallet === wallet.name ? 'wallet-connecting' : ''
                }`}
                onClick={() => connectWallet(wallet)}
              >
                <div className="wallet-icon">{wallet.icon}</div>
                <div className="wallet-info">
                  <div className="wallet-name">{wallet.name}</div>
                  <div className="wallet-description">
                    {wallet.installed ? wallet.description : 'Not installed - Click to download'}
                  </div>
                </div>
                <div className="wallet-status">
                  {isConnecting && connectingWallet === wallet.name ? (
                    <div className="wallet-spinner">⏳</div>
                  ) : wallet.installed ? (
                    <div className="wallet-installed">✅</div>
                  ) : (
                    <div className="wallet-download">📥</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {availableWallets.filter(w => w.installed).length === 0 && (
            <div className="no-wallets-message">
              <p>No wallets detected in your browser.</p>
              <p>Install a wallet extension to continue.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface ConnectButtonProps {
    children?: ReactNode;
}

interface ConnectButtonCustomProps {
    children: (renderProps: {
        account?: {
            address: string;
            displayName: string;
        };
        chain?: {
            id: number;
            name?: string;
            unsupported?: boolean;
        };
        openAccountModal?: () => void;
        openChainModal?: () => void;
        openConnectModal?: () => void;
        mounted: boolean;
    }) => ReactNode;
}

const ConnectButtonCustom: FC<ConnectButtonCustomProps> = ({ children }) => {
    const { address, isConnected, chain } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const [mounted, setMounted] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const openAccountModal = () => {
        setShowAccountModal(true);
    };

    const openConnectModal = () => {
        setShowConnectModal(true);
    };

    const handleConnect = (connector: any) => {
        connect({ connector });
        setShowConnectModal(false);
    };

    const handleDisconnect = () => {
        disconnect();
        setShowAccountModal(false);
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    return (
        <>
            {children({
                account: address
                    ? {
                        address,
                        displayName: formatAddress(address),
                    }
                    : undefined,
                chain: chain
                    ? {
                        id: chain.id,
                        name: chain.name,
                        unsupported: false,
                    }
                    : undefined,
                openAccountModal,
                openConnectModal,
                mounted,
            })}

            {/* Connect Modal */}
            {showConnectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
                            <button
                                onClick={() => setShowConnectModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-3">
                            {connectors.map((connector) => (
                                <button
                                    key={connector.id}
                                    onClick={() => handleConnect(connector)}
                                    className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-between"
                                >
                                    <span>{connector.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Account Modal */}
            {showAccountModal && address && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Account</h2>
                            <button
                                onClick={() => setShowAccountModal(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="bg-gray-700 rounded-lg p-4">
                                <p className="text-sm text-gray-400 mb-1">Address</p>
                                <p className="text-white font-mono text-sm break-all">{address}</p>
                            </div>
                            {chain && (
                                <div className="bg-gray-700 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-1">Network</p>
                                    <p className="text-white">{chain.name}</p>
                                </div>
                            )}
                            <button
                                onClick={handleDisconnect}
                                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const ConnectButton: FC<ConnectButtonProps> & { Custom: typeof ConnectButtonCustom } = ({ children }) => {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const [showMenu, setShowMenu] = useState(false);

    const handleConnect = () => {
        const injectedConnector = connectors.find(c => c.id === 'injected');
        if (injectedConnector) {
            connect({ connector: injectedConnector });
        }
    };

    if (!isConnected) {
        return (
            <button
                onClick={handleConnect}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
            >
                {children || 'Connect Wallet'}
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition-all duration-200"
            >
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
            </button>
            {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl z-10">
                    <button
                        onClick={() => {
                            disconnect();
                            setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
};

ConnectButton.Custom = ConnectButtonCustom;

export default ConnectButton;

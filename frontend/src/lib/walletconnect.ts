import { Core } from "@walletconnect/core";
import { WalletKit, WalletKitTypes } from "@reown/walletkit";

let walletKit: WalletKit | null = null;
let core: Core | null = null;

export const initializeWalletKit = async () => {
    if (walletKit) {
        return walletKit;
    }

    const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

    if (!projectId) {
        throw new Error("WalletConnect Project ID is not defined");
    }

    core = new Core({
        projectId,
    });

    walletKit = await WalletKit.init({
        core,
        metadata: {
            name: "NameQuest",
            description: "NameQuest - An ENS-powered gaming platform",
            url: typeof window !== 'undefined' ? window.location.origin : 'https://namequest.app',
            icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : ''],
        },
    });

    return walletKit;
};

export const getWalletKit = () => {
    return walletKit;
};

export const getCore = () => {
    return core;
};

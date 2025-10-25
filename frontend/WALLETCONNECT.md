# WalletConnect Integration

This document explains the WalletConnect integration in the NameQuest frontend application.

## Overview

The application now uses **WalletConnect v2** (via Reown WalletKit) instead of RainbowKit for wallet connectivity. This provides better flexibility and follows WalletConnect's latest standards.

## Architecture

### Core Components

1. **WalletConnect Configuration** (`src/lib/walletconnect.ts`)
   - Initializes WalletKit with project metadata
   - Manages WalletConnect Core instance
   - Handles session management

2. **Wagmi Configuration** (`src/lib/wagmi.ts`)
   - Configures wagmi with WalletConnect connector
   - Sets up chain configurations (Base Sepolia, Base, Mainnet)
   - Includes injected wallet support (MetaMask, etc.)

3. **Custom ConnectButton** (`src/components/ConnectButton.tsx`)
   - Replaces RainbowKit's ConnectButton
   - Provides both simple and custom render prop interfaces
   - Includes wallet selection modal
   - Displays account information and disconnect functionality

4. **Providers** (`src/app/providers.tsx`)
   - Wraps the app with WagmiProvider and QueryClientProvider
   - No longer includes RainbowKit

## Configuration

### Environment Variables

Make sure you have the following environment variable set in your `.env.local`:

```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

Get your project ID from [WalletConnect Cloud Dashboard](https://cloud.walletconnect.com).

### Supported Connectors

- **WalletConnect**: QR code modal for mobile wallets
- **Injected**: Browser extension wallets (MetaMask, Coinbase Wallet, etc.)

## Usage

### Basic Usage

```tsx
import ConnectButton from '@/components/ConnectButton';

function MyComponent() {
  return <ConnectButton />;
}
```

### Custom Render Props

```tsx
import ConnectButton from '@/components/ConnectButton';

function MyComponent() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
        if (!mounted) return null;
        
        if (!account) {
          return (
            <button onClick={openConnectModal}>
              Connect Wallet
            </button>
          );
        }
        
        return (
          <button onClick={openAccountModal}>
            {account.displayName}
            {chain && ` on ${chain.name}`}
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
```

## Features

### Connect Modal
- Lists all available wallet connectors
- Shows connector status (ready/not ready)
- Clean, game-themed UI matching NameQuest design

### Account Modal
- Displays full wallet address
- Shows current network
- Disconnect functionality
- Copy address feature (future enhancement)

### Chain Switching
- Automatic detection of wrong network
- Prompt to switch to Base Sepolia
- Uses wagmi's `useSwitchChain` hook

## Migration from RainbowKit

The following changes were made to migrate from RainbowKit:

1. **Dependencies**
   - Removed: `@rainbow-me/rainbowkit`
   - Added: `@reown/walletkit`, `@walletconnect/utils`, `@walletconnect/core`

2. **Configuration**
   - Removed `getDefaultConfig` from RainbowKit
   - Configured wagmi directly with WalletConnect connector
   - Added custom metadata for WalletConnect

3. **Components**
   - Created custom `ConnectButton` component
   - Removed all `@rainbow-me/rainbowkit` imports
   - Updated all components using `ConnectButton`

4. **Providers**
   - Removed `RainbowKitProvider`
   - Simplified provider tree

## Session Management

WalletConnect sessions are managed by WalletKit:

- **Session Proposals**: Handled automatically by WalletConnect connector
- **Session Requests**: Processed through wagmi hooks
- **Session Disconnect**: Triggered via `disconnect()` from wagmi

## Troubleshooting

### Wallet Not Connecting

1. Ensure `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` is set
2. Check that you're on a supported network
3. Try clearing browser cache and localStorage
4. Check browser console for errors

### Wrong Network

The app will automatically prompt users to switch to Base Sepolia if they're on the wrong network.

### Session Persistence

WalletConnect sessions are persisted in browser localStorage and will automatically reconnect on page reload.

## Future Enhancements

Potential improvements for the WalletConnect integration:

1. **Copy Address**: Add button to copy wallet address to clipboard
2. **Recent Transactions**: Show recent transaction history
3. **Network Selector**: Allow users to switch networks from account modal
4. **Wallet Icons**: Add icons for different wallet types
5. **ENS Integration**: Display ENS names in account modal
6. **Multi-Account**: Support multiple accounts/wallets

## Resources

- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [Reown WalletKit](https://docs.reown.com/walletkit/overview)
- [Wagmi Documentation](https://wagmi.sh/)
- [WalletConnect Cloud Dashboard](https://cloud.walletconnect.com/)

## Support

For issues related to WalletConnect integration, check:
1. WalletConnect Cloud Dashboard for project status
2. Browser console for connection errors
3. Network inspector for WalletConnect bridge communication

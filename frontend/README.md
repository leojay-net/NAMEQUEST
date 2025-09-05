# NameQuest Frontend

This frontend can run in two modes:

- Normal mode (default): connects to Base Sepolia and interacts with the deployed contracts.
- Demo mode: bypasses onchain calls and uses local mocks so you can explore the full UI without ENS ownership or a wallet.

## Enable Demo Mode

Create or edit `.env.local` and add:

```
NEXT_PUBLIC_DEMO_MODE=1
```

Then restart the dev server.

While Demo Mode is active, you’ll see a banner in the app. Character creation and quest completions are mocked.

## Environment

Optional variables used by the app:

- NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
- NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL
- NEXT_PUBLIC_QUEST_TOKEN_ADDRESS, NEXT_PUBLIC_ACHIEVEMENT_NFT_ADDRESS, NEXT_PUBLIC_CHARACTER_REGISTRY_ADDRESS, etc.

In Demo Mode, these can be omitted.This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

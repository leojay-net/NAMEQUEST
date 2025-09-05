export default function EnsBaseGuide() {
    return (
        <div className="prose prose-invert max-w-3xl mx-auto py-10">
            <h1>Setting a Base address in your ENS record</h1>
            <p>
                Some NameQuest features prefer the ENS Base coin-type address (ENSIP-11) so your
                character maps cleanly on Base L2. If your name resolves on mainnet only, set a
                Base-specific address too.
            </p>
            <ol>
                <li>
                    Open the ENS Manager at{' '}
                    <a className="underline" href="https://app.ens.domains" target="_blank" rel="noreferrer">
                        app.ens.domains
                    </a>{' '}
                    and select your name.
                </li>
                <li>Go to Records → Addresses.</li>
                <li>
                    Add a new address with coin type “Base” (or custom EVM chain with id 8453). Save and
                    confirm.
                </li>
                <li>
                    Wait a minute, then try again. We&apos;ll fall back to the default address if the Base
                    record isn&apos;t set, but some features work best when it is.
                </li>
            </ol>
            <p className="text-sm text-gray-400">Tip: This uses ENSIP-11 coin types under the hood.</p>
        </div>
    );
}

import LinkEnsLater from '@/components/LinkEnsLater';

export default function LinkEnsPage() {
    return (
        <div className="max-w-3xl mx-auto py-10">
            <h1 className="text-2xl font-bold mb-4">Link ENS to your character</h1>
            <p className="text-sm text-gray-400 mb-6">
                If you created a character without ENS, you can link a name now to unlock bonuses.
            </p>
            <LinkEnsLater />
        </div>
    );
}

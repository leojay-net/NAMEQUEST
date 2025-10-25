'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import ConnectButton from '@/components/ConnectButton';
import {
    Sword,
    Shield,
    Users,
    Trophy,
    Globe,
    Lock,
    ChevronDown,
    User,
    Crown,
    Target,
    Zap
} from 'lucide-react';

import type { SVGProps } from 'react';

interface Feature {
    icon: React.ComponentType<SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    color: string;
}

interface GameType {
    icon: React.ComponentType<SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    time: string;
    type: string;
    color: string;
}

const LandingPage = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
    const [showHint, setShowHint] = useState(false);
    const { scrollYProgress } = useScroll();
    const gameTypesRef = useRef<HTMLDivElement | null>(null);

    // Journey-based parallax transforms
    // Move hero slightly up as you scroll so it clears the next section (prevents overlap)
    const heroY = useTransform(scrollYProgress, [0, 0.3], ['0%', '-20%']);
    const roadY = useTransform(scrollYProgress, [0, 1], ['0%', '-100%']);
    const cursorTrail = useTransform(scrollYProgress, [0, 1], [0, 360]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const features: Feature[] = [
        {
            icon: Globe,
            title: "Your ENS = Your Hero",
            description: "Transform your ENS identity into a powerful game character with persistent achievements",
            color: "text-blue-400"
        },
        {
            icon: Users,
            title: "Social Power",
            description: "Your EFP followers become allies, attestations unlock abilities, reputation drives access",
            color: "text-purple-400"
        },
        {
            icon: Sword,
            title: "Epic Quests",
            description: "Cipher chambers, shadow duels, memory vaults - solo and multiplayer adventures await",
            color: "text-orange-400"
        },
        {
            icon: Trophy,
            title: "Permanent Progress",
            description: "Achievements stored in ENS records, cross-game compatibility, never lose your progress",
            color: "text-yellow-400"
        }
    ];

    const gameTypes: GameType[] = [
        {
            icon: Lock,
            title: "Cipher Chambers",
            description: "Solve cryptographic puzzles in mysterious ancient chambers",
            time: "3-5 min",
            type: "Solo",
            color: "border-blue-500/30"
        },
        {
            icon: Sword,
            title: "Shadow Duels",
            description: "Strategic turn-based combat with your ENS abilities",
            time: "2-3 min",
            type: "Solo",
            color: "border-red-500/30"
        },
        {
            icon: Shield,
            title: "Alliance Raids",
            description: "Team up with your EFP network for epic dungeon crawls",
            time: "15-30 min",
            type: "Social",
            color: "border-green-500/30"
        },
        {
            icon: Users,
            title: "Guild Tournaments",
            description: "Compete with communities in large-scale competitions",
            time: "30-60 min",
            type: "Social",
            color: "border-purple-500/30"
        }
    ];

    // (helper components removed; rendering icons inline to keep bundle lean)

    return (
        <div className="min-h-screen bg-slate-900 text-white overflow-hidden relative">
            {/* Custom Cursor Trail */}
            <motion.div
                className="fixed top-0 left-0 w-6 h-6 bg-blue-400/30 rounded-full pointer-events-none z-50 mix-blend-screen"
                style={{
                    x: mousePosition.x - 12,
                    y: mousePosition.y - 12,
                }}
                animate={{
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    scale: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                }}
            />

            {/* Journey Path Background (no gradients) */}
            <motion.div
                className="absolute inset-0 opacity-10"
                style={{ y: roadY }}
            >
                <svg viewBox="0 0 1920 1080" className="w-full h-full">
                    <path
                        d="M0,540 Q480,400 960,540 T1920,540"
                        stroke="#64748b"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray="20,10"
                    />
                </svg>
            </motion.div>

            {/* Hero Section */}
            <motion.section
                className="relative min-h-screen flex items-center justify-center"
                style={{ y: heroY }}
            >
                {/* Solid background (no gradients) */}
                <div className="absolute inset-0 bg-slate-900" />

                <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 font-pixel text-outline">
                            <span className="text-white">NAME</span>
                            <span className="text-blue-400">QUEST</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12 font-pixel">
                            Where your <span className="text-blue-400 font-semibold">ENS identity</span> becomes
                            your <span className="text-purple-400 font-semibold">game character</span>
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                            {process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ? (
                                <ConnectButton.Custom>
                                    {({ account, chain, openConnectModal, mounted }) => {
                                        const ready = mounted;
                                        const connected = ready && account && chain;

                                        return (
                                            <div
                                                {...(!ready && {
                                                    'aria-hidden': true,
                                                    style: {
                                                        opacity: 0,
                                                        pointerEvents: 'none',
                                                        userSelect: 'none',
                                                    },
                                                })}
                                            >
                                                {(() => {
                                                    if (!connected) {
                                                        return (
                                                            <motion.button
                                                                onClick={openConnectModal}
                                                                className="btn-pixel font-pixel text-lg transition-all flex items-center gap-3"
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                            >
                                                                <span className="text-outline">Start Your Quest</span>
                                                                <Zap className="w-5 h-5" />
                                                            </motion.button>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        );
                                    }}
                                </ConnectButton.Custom>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        className="btn-pixel font-pixel text-lg"
                                        onClick={() => {
                                            setShowHint(true);
                                            gameTypesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }}
                                    >
                                        <span className="text-outline">Start Your Quest</span>
                                    </button>
                                    <button
                                        className="btn-pixel font-pixel text-lg"
                                        onClick={() => {
                                            try {
                                                window.localStorage.setItem('nq_explore', '1');
                                            } catch { }
                                            window.location.href = '/?explore=1';
                                        }}
                                        title="Explore in read-only mode"
                                    >
                                        <span className="text-outline">Explore Without Wallet</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <ChevronDown className="w-8 h-8 text-slate-400" />
                </motion.div>
            </motion.section>

            {/* Features Section */}
            <section className="relative py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                            The Future of Social Gaming
                        </h2>
                        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
                            Built on ENS and EFP protocols - your identity drives your adventure
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => {
                            const IconComponent = feature.icon;
                            return (
                                <motion.div
                                    key={index}
                                    className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{
                                        scale: 1.05,
                                        boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)"
                                    }}
                                    onMouseEnter={() => setHoveredFeature(index)}
                                    onMouseLeave={() => setHoveredFeature(null)}
                                >
                                    <div className="text-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <IconComponent className={`w-12 h-12 mx-auto ${feature.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-center">{feature.title}</h3>
                                    <p className="text-slate-400 text-center leading-relaxed text-sm">{feature.description}</p>

                                    {hoveredFeature === index && (
                                        <motion.div
                                            className="mt-4 text-center"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="inline-flex items-center text-blue-400 text-sm font-semibold">
                                                Learn more
                                                <motion.span
                                                    className="ml-2"
                                                    animate={{ x: [0, 5, 0] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                >
                                                    →
                                                </motion.span>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Game Types Section */}
            <section ref={gameTypesRef} className="relative py-24 px-6 bg-slate-800/30">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Choose Your Adventure</h2>
                        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto">
                            From quick brain teasers to epic social raids - there&apos;s a quest for every mood
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {gameTypes.map((game, index) => {
                            const IconComponent = game.icon;
                            return (
                                <motion.div
                                    key={index}
                                    className={`group bg-slate-800/50 backdrop-blur-sm p-6 rounded-xl border ${game.color} hover:shadow-lg transition-all duration-300 cursor-pointer`}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{
                                        scale: 1.03,
                                        y: -5
                                    }}
                                >
                                    <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <IconComponent className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{game.title}</h3>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-medium">{game.time}</span>
                                        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-medium">{game.type}</span>
                                    </div>
                                    <p className="text-slate-300 text-sm leading-relaxed">{game.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Journey Progress Indicator */}
            <motion.div
                className="fixed right-8 top-1/2 transform -translate-y-1/2 z-30"
                style={{ rotate: cursorTrail }}
            >
                <div className="flex flex-col items-center space-y-4">
                    <motion.div
                        className="w-3 h-3 bg-blue-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="w-1 h-16 bg-slate-600 rounded-full overflow-hidden">
                        <motion.div
                            className="w-full bg-blue-400 rounded-full"
                            style={{
                                height: useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
                            }}
                        />
                    </div>
                    <motion.div
                        className="w-3 h-3 bg-purple-400 rounded-full"
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    />
                </div>
            </motion.div>

            {/* Stats Section */}
            <section className="relative py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true }}
                    >
                        {[
                            { icon: User, label: 'Active Heroes', value: '2,847', color: 'text-blue-400' },
                            { icon: Crown, label: 'Quests Completed', value: '15,203', color: 'text-yellow-400' },
                            { icon: Trophy, label: 'Achievements', value: '8,492', color: 'text-purple-400' },
                            { icon: Target, label: 'Guilds Formed', value: '341', color: 'text-green-400' }
                        ].map((stat, index) => {
                            const IconComponent = stat.icon;
                            return (
                                <motion.div
                                    key={index}
                                    className="p-6 bg-slate-800/30 rounded-xl border border-slate-700"
                                    whileHover={{ scale: 1.05 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <IconComponent className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                                    <div className="text-slate-400 text-sm">{stat.label}</div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="relative py-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">Ready to Begin Your Journey?</h2>
                        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                            Connect your wallet, claim your character, and start building your legend in the metaverse
                        </p>

                        {process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ? (
                            <ConnectButton.Custom>
                                {({ account, chain, openConnectModal, mounted }) => {
                                    const ready = mounted;
                                    const connected = ready && account && chain;

                                    return (
                                        <div
                                            {...(!ready && {
                                                'aria-hidden': true,
                                                style: {
                                                    opacity: 0,
                                                    pointerEvents: 'none',
                                                    userSelect: 'none',
                                                },
                                            })}
                                        >
                                            {(() => {
                                                if (!connected) {
                                                    return (
                                                        <motion.button
                                                            onClick={openConnectModal}
                                                            className="bg-blue-600 hover:bg-blue-700 px-12 py-4 rounded-xl text-xl font-bold transition-all shadow-xl hover:shadow-blue-500/25 flex items-center gap-3 mx-auto"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            animate={{
                                                                boxShadow: [
                                                                    "0 0 20px rgba(59, 130, 246, 0.3)",
                                                                    "0 0 40px rgba(59, 130, 246, 0.5)",
                                                                    "0 0 20px rgba(59, 130, 246, 0.3)"
                                                                ]
                                                            }}
                                                            transition={{
                                                                boxShadow: {
                                                                    duration: 2,
                                                                    repeat: Infinity,
                                                                    ease: "easeInOut"
                                                                }
                                                            }}
                                                        >
                                                            <span>Enter NameQuest</span>
                                                            <motion.div
                                                                animate={{ x: [0, 5, 0] }}
                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                            >
                                                                →
                                                            </motion.div>
                                                        </motion.button>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    );
                                }}
                            </ConnectButton.Custom>
                        ) : (
                            <div className="space-y-4">
                                <button
                                    className="btn-pixel font-pixel text-xl mx-auto"
                                    onClick={() => {
                                        setShowHint(true);
                                        gameTypesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }}
                                >
                                    <span className="text-outline">Enter NameQuest</span>
                                </button>
                                <button
                                    className="btn-pixel font-pixel text-xl mx-auto"
                                    onClick={() => {
                                        try {
                                            window.localStorage.setItem('nq_explore', '1');
                                        } catch { }
                                        window.location.href = '/?explore=1';
                                    }}
                                >
                                    <span className="text-outline">Explore Without Wallet</span>
                                </button>
                                {showHint && (
                                    <div className="text-sm text-slate-300 max-w-xl mx-auto">
                                        Connect is disabled in this build. Add NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID to .env.local to enable wallet connect. You can still explore quests and UI in read-only.
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* Hint banner */}
            {showHint && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 z-40 shadow-xl">
                    Wallet connect not configured. Set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID to enable full gameplay. Read-only exploration is available.
                </div>
            )}

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-slate-700">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        className="flex justify-center items-center gap-4 mb-4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <Sword className="w-6 h-6 text-blue-400" />
                        <Globe className="w-6 h-6 text-purple-400" />
                        <Zap className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                    <p className="text-slate-400">
                        Built on Base • Powered by ENS • Enhanced by EFP
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

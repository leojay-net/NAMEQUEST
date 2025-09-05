import React from 'react';

type IconName =
    | 'dashboard'
    | 'quest'
    | 'guild'
    | 'tournament'
    | 'marketplace'
    | 'sword'
    | 'shield'
    | 'target'
    | 'trophy'
    | 'store'
    | 'users'
    | 'achievement'
    | 'clock'
    | 'paint'
    | 'settings'
    | 'code'
    | 'community';

interface IconProps extends React.SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number;
    className?: string;
}

const strokeProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
};

export const Icon: React.FC<IconProps> = ({ name, size = 20, className, ...rest }) => {
    const common = { width: size, height: size, className, ...rest } as const;
    switch (name) {
        case 'dashboard':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <path d="M3 13h8V3H3zM13 21h8v-8h-8zM13 3v8h8V3zM3 21h8v-4H3z" />
                </svg>
            );
        case 'quest':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <path d="M4 4h9l7 7v9a0 0 0 0 1 0 0H4a0 0 0 0 1 0 0V4Z" />
                    <path d="M13 4v7h7" />
                    <path d="M8 12h4" />
                    <path d="M8 16h8" />
                </svg>
            );
        case 'guild':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <path d="M12 3l7 4v6c0 5-3.5 7.5-7 8-3.5-.5-7-3-7-8V7l7-4Z" />
                    <path d="M9 12l2 2 4-4" />
                </svg>
            );
        case 'tournament':
        case 'trophy':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
                    <path d="M6 4h12" />
                    <path d="M6 8H4a2 2 0 0 1-2-2V4h4" />
                    <path d="M18 8h2a2 2 0 0 0 2-2V4h-4" />
                    <path d="M12 16v4" />
                    <path d="M8 20h8" />
                </svg>
            );
        case 'marketplace':
        case 'store':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <path d="M3 9h18" />
                    <path d="M5 9v10h14V9" />
                    <path d="M4 5h16l1 4H3l1-4Z" />
                    <path d="M10 13h4" />
                </svg>
            );
        case 'sword':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <path d="M14 4l6 6-8 8H6v-6l8-8Z" />
                    <path d="M16 8L8 16" />
                </svg>
            );
        case 'shield':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7l8-4Z" />
                    <path d="M10 12l2 2 4-4" />
                </svg>
            );
        case 'target':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <circle cx="12" cy="12" r="8" />
                    <circle cx="12" cy="12" r="4" />
                </svg>
            );
        case 'users':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <circle cx="9" cy="8" r="4" />
                    <path d="M17 11a4 4 0 1 0-3-7" />
                    <path d="M3 21v-2a4 4 0 0 1 4-4h4" />
                    <path d="M15 15h1a4 4 0 0 1 4 4v2" />
                </svg>
            );
        case 'achievement':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <circle cx="12" cy="8" r="5" />
                    <path d="M8 13l-2 8 6-3 6 3-2-8" />
                </svg>
            );
        case 'clock':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                </svg>
            );
        case 'paint':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <path d="M19 11a7 7 0 0 0-7-7H9a7 7 0 0 0 0 14h1a2 2 0 0 1 0 4" />
                    <circle cx="12" cy="10" r="1" />
                    <circle cx="8" cy="10" r="1" />
                    <circle cx="16" cy="10" r="1" />
                </svg>
            );
        case 'settings':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.48 0 .91.18 1.24.49.33.31.53.74.55 1.2v.62c-.02.46-.22.89-.55 1.2-.33.31-.76.49-1.24.49Z" />
                </svg>
            );
        case 'code':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <path d="M8 9l-4 3 4 3" />
                    <path d="M16 9l4 3-4 3" />
                    <path d="M12 4l-2 16" />
                </svg>
            );
        case 'community':
            return (
                <svg {...common} viewBox="0 0 24 24" {...strokeProps}>
                    <circle cx="9" cy="7" r="3" />
                    <circle cx="17" cy="7" r="3" />
                    <circle cx="13" cy="15" r="3" />
                    <path d="M5 21v-2a4 4 0 0 1 4-4h.5" />
                    <path d="M12.5 13h1" />
                    <path d="M15 21v-2a4 4 0 0 1 4-4h.5" />
                </svg>
            );
    }
    return null;
};

export default Icon;

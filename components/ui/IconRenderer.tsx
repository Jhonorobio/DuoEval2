
import React from 'react';
import { BookOpenIcon, CalculatorIcon, ChartIcon, GlobeIcon, LaptopIcon, PaletteIcon, PlayCircleIcon, UsersIcon } from '../Icons';

export const AVAILABLE_ICONS: Record<string, React.FC<{className?: string}>> = {
    calculator: CalculatorIcon,
    bookOpen: BookOpenIcon,
    palette: PaletteIcon,
    laptop: LaptopIcon,
    globe: GlobeIcon,
    users: UsersIcon,
    playCircle: PlayCircleIcon,
    chart: ChartIcon,
};

export const IconRenderer: React.FC<{iconId?: string, iconUrl?: string, className?: string}> = ({ iconId, iconUrl, className }) => {
    if (iconUrl) {
        return <img src={iconUrl} alt="Icono de la materia" className={`w-full h-full object-cover rounded-full ${className}`} />;
    }
    const IconComponent = iconId ? AVAILABLE_ICONS[iconId] : BookOpenIcon; // Default icon
    if (!IconComponent) return <BookOpenIcon className={className} />;
    return <IconComponent className={className} />;
}

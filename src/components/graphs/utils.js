// Graph utility functions

export const getSurfaceColor = (surface) => {
    if (!surface) return '#000000';
    const normalized = String(surface).trim().toLowerCase();
    switch (normalized) {
        case 'turf':
            return '#22c55e'; // Green
        case 'polytrack':
            return '#795548'; // Brown
        case 'tapeta':
            return '#bc8f8f'; // Light Brown
        case 'fibresand':
            return '#ffc107'; // Yellow
        case 'artificial':
            return '#ffeb3b'; // Light Yellow
        default:
            return '#000000'; // Black
    }
};

export const colorPalette = [
    '#4bc0c0', // Teal
    '#36a2eb', // Blue
    '#ffce56', // Yellow
    '#9966ff', // Purple
    '#ff9f40', // Orange
    '#ff6384', // Pink
    '#4ade80', // Light green
    '#f472b6', // Light pink
    '#60a5fa', // Light blue
    '#fbbf24', // Amber
];

export const transparentize = (color, opacity = 0.5) => {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Format date for display
export const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

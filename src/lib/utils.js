import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BASE_SERVER_URL } from '../services/api';

/**
 * Merges Tailwind class names with full conflict resolution.
 * Uses clsx for conditional logic and tailwind-merge to handle
 * Tailwind class conflicts (e.g. bg-primary vs bg-pink-600).
 * Required by all shadcn/ui components (Button, Input, etc.).
 */
export const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Constructs a full absolute URL for a pet image.
 *
 * The backend returns relative paths like `/uploads/pets/abc.jpg`.
 * Using those paths directly as <img src> in the React dev server
 * (localhost:5173) would 404 because the files live on the backend
 * (localhost:5000). This function prepends the correct origin.
 *
 * If the URL is already absolute (http/https) it is returned unchanged.
 * If the URL is falsy, null is returned so the caller can show a fallback.
 */
export const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BASE_SERVER_URL}${url}`;
};

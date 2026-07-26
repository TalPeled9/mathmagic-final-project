// Email clients can't read CSS custom properties, so the app's Tailwind theme
// tokens (client/src/styles/globals.css) are hardcoded here as literal hex values.
export const COLORS = {
  purple: '#8b5cf6',
  purpleDark: '#7c3aed',
  gold: '#f59e0b',
  parchment: '#fffbeb',
  emerald: '#10b981',
  blue: '#3b82f6',
  yellow: '#facc15',
  white: '#ffffff',
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray200: '#e5e7eb',
  gray100: '#f3f4f6',
  gray50: '#f9fafb',
} as const;

export const FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

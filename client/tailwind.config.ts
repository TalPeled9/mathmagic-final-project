export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#FFFBEB',
        'purple-wizzy': '#8B5CF6',
        'gold-magic': '#F59E0B',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        sparkle: 'sparkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        sparkle: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
    },
  },
};

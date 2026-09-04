/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#FFFFFF',
          subtle: '#F7F8FA',
          raised: '#FFFFFF',
        },
        border: {
          DEFAULT: '#D9DDE3',
          subtle: '#E8EBF0',
          strong: '#C5CBD4',
        },
        brand: {
          navy: '#1B3A5C',
          blue: '#2E5C8A',
          'blue-light': '#E8F0F8',
          'blue-hover': '#245175',
          accent: '#3B6FA0',
        },
        semantic: {
          success: '#1A7A3C',
          'success-bg': '#E6F4EC',
          warning: '#B45309',
          'warning-bg': '#FBF3E7',
          error: '#B91C1C',
          'error-bg': '#FDECEC',
          info: '#2E5C8A',
          'info-bg': '#E8F0F8',
        },
        text: {
          primary: '#111827',
          secondary: '#6B7280',
          muted: '#9AA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
        sidebar: '2px 0 8px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

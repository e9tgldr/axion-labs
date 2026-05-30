import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070A12',
        surface: '#121826',
        'surface-2': '#0E1320',
        line: '#1E2A3F',
        orange: '#fb923c',
        pink: '#f472b6',
        violet: '#a855f7',
        amber: '#fbbf24',
        text: '#E8EDF5',
        muted: '#94A3B8',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        axion: 'linear-gradient(135deg, #fb923c 0%, #f472b6 50%, #a855f7 100%)',
        'axion-soft':
          'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(168,85,247,0.15))',
        grid: 'linear-gradient(#1E2A3F 1px, transparent 1px), linear-gradient(90deg, #1E2A3F 1px, transparent 1px)',
        'radial-plasma':
          'radial-gradient(60% 60% at 50% 35%, rgba(168,85,247,0.22), transparent 70%), radial-gradient(50% 50% at 70% 60%, rgba(251,146,60,0.18), transparent 70%)',
      },
      boxShadow: {
        'glow-orange': '0 0 40px -8px rgba(251,146,60,0.5)',
        'glow-violet': '0 0 40px -8px rgba(168,85,247,0.5)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 24s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config

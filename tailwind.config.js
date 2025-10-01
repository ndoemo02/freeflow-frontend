/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff5eb',
          100: '#ffd8a8',
          200: '#ffb86b',
          300: '#ff9c2f',
          400: '#ff7a00',
          500: '#ff6a00',
          600: '#e55a00',
          700: '#b14000',
          800: '#7a2a00',
        },
        'brand-card': 'rgb(17 18 22 / <alpha-value>)',
        glass: 'rgba(255,255,255,0.04)',
        // legacy brand colors kept for compatibility
        'brand-orange': '#ff8a2a',
        'brand-teal': '#00e8f0',
        brandCard: { DEFAULT: '#1f1f1f' },
      },
      boxShadow: {
        'soft-3xl': '0 10px 30px rgba(0,0,0,0.6)',
        glass: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 6px 30px rgba(0,0,0,0.6)',
      },
      backdropBlur: { xs: '4px' },
      borderRadius: { xl2: '1.25rem' },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: { fadeInUp: 'fadeInUp .25s ease-out both' },
    },
  },
  safelist: [
    'bg-brand-card/90', 'bg-white/5', 'from-brand-400', 'to-brand-600',
    'text-brand-500', 'ring-brand-500', 'border-brand-500'
  ],
  // keep landing typography intact
  corePlugins: { preflight: false },
}



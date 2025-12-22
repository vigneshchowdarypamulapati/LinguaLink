/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Brand - Deep Navy Blue
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a4b8fc',
          400: '#8093f8',
          500: '#5c6df2',
          600: '#4a4de6',
          700: '#3d3bcc',
          800: '#1e2a4a',  // Main brand color for light mode
          900: '#0f172a',  // Darkest navy
          950: '#0a0f1a',  // Even darker for dark mode bg
        },
        // Accent - Soft Sky Blue / Cyan
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',  // Main accent
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Backgrounds
        surface: {
          light: '#f8fafc',      // Very light gray (not pure white)
          card: '#ffffff',       // White cards
          dark: '#0f172a',       // Very dark navy
          'dark-card': '#1e293b', // Slightly lighter dark navy
        },
        // Text colors
        text: {
          primary: '#1e293b',    // Dark Slate
          secondary: '#64748b',  // Muted cool gray
          'primary-dark': '#f1f5f9',   // Soft off-white
          'secondary-dark': '#94a3b8', // Cool gray for dark
        },
        // Semantic colors
        success: {
          light: '#22c55e',
          dark: '#4ade80',
        },
        warning: {
          light: '#f59e0b',
          dark: '#fbbf24',
        },
        error: {
          light: '#ef4444',
          dark: '#f87171',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'elevated': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
}

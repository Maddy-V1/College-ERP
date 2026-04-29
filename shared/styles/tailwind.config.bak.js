/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx}',
        './index.html',
        '../../shared/components/src/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // ============================================
            // COLORS
            // ============================================
            colors: {
                // Primary
                primary: {
                    DEFAULT: '#0066FF',
                    light: '#3385FF',
                    dark: '#0052CC',
                },
                // Secondary
                secondary: {
                    DEFAULT: '#6366F1',
                    light: '#818CF8',
                    dark: '#4F46E5',
                },
                // Accent
                accent: {
                    teal: '#14B8A6',
                    emerald: '#10B981',
                    orange: '#F97316',
                },
                // Status
                success: '#10B981',
                warning: '#F97316',
                error: '#EF4444',
                info: '#3B82F6',
                // Role-based
                role: {
                    admin: '#6366F1',
                    professor: '#0066FF',
                    student: '#14B8A6',
                },
                // Background layers
                bg: {
                    primary: '#0A0A0F',
                    secondary: '#1A1A2E',
                    tertiary: '#16213E',
                    elevated: '#1E293B',
                },
                // Text
                text: {
                    primary: '#FFFFFF',
                    secondary: '#CBD5E1',
                    tertiary: '#94A3B8',
                    muted: '#64748B',
                },
                // Neutral
                neutral: {
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    300: '#CBD5E1',
                    400: '#94A3B8',
                    500: '#64748B',
                    600: '#475569',
                    700: '#334155',
                    800: '#16213E',
                    900: '#1A1A2E',
                    950: '#0A0A0F',
                },
            },

            // ============================================
            // FONT FAMILY
            // ============================================
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },

            // ============================================
            // SPACING
            // ============================================
            spacing: {
                xs: '4px',
                sm: '8px',
                md: '16px',
                lg: '24px',
                xl: '32px',
                '2xl': '48px',
                '3xl': '64px',
                '4xl': '96px',
            },

            // ============================================
            // BORDER RADIUS
            // ============================================
            borderRadius: {
                sm: '8px',
                md: '12px',
                lg: '16px',
                xl: '24px',
                '2xl': '32px',
            },

            // ============================================
            // BOX SHADOW
            // ============================================
            boxShadow: {
                'glow-blue': '0 4px 16px rgba(0, 102, 255, 0.3)',
                'glow-indigo': '0 4px 16px rgba(99, 102, 241, 0.3)',
                'glow-teal': '0 4px 16px rgba(20, 184, 166, 0.3)',
                card: '0 4px 12px rgba(0, 102, 255, 0.15)',
                elevated: '0 8px 24px rgba(0, 102, 255, 0.2)',
                xl: '0 16px 48px rgba(0, 102, 255, 0.25)',
            },

            // ============================================
            // BACKGROUND IMAGES (Gradients)
            // ============================================
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #0066FF, #6366F1)',
                'gradient-success': 'linear-gradient(135deg, #10B981, #14B8A6)',
                'gradient-hero': 'linear-gradient(135deg, #0A1929, #1A2B3D)',
                'gradient-card': 'linear-gradient(135deg, rgba(0, 102, 255, 0.05), rgba(99, 102, 241, 0.05))',
                'gradient-accent': 'linear-gradient(135deg, #0066FF, #14B8A6)',
            },

            // ============================================
            // ANIMATIONS
            // ============================================
            animation: {
                shimmer: 'shimmer 1.5s infinite',
                pulse: 'pulse 2s ease-in-out infinite',
                slideIn: 'slideIn 0.3s ease-out',
                fadeIn: 'fadeIn 0.2s ease-out',
                scaleIn: 'scaleIn 0.2s ease-out',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
                pulse: {
                    '0%, 100%': { opacity: '1', transform: 'scale(1)' },
                    '50%': { opacity: '0.7', transform: 'scale(0.95)' },
                },
                slideIn: {
                    from: { transform: 'translateX(100%)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                fadeIn: {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                scaleIn: {
                    from: { transform: 'scale(0.95)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
                },
            },

            // ============================================
            // SCREENS (Breakpoints)
            // ============================================
            screens: {
                xs: '475px',
                sm: '640px',
                md: '768px',
                lg: '1024px',
                xl: '1280px',
                '2xl': '1536px',
            },

            // ============================================
            // Z-INDEX
            // ============================================
            zIndex: {
                dropdown: '50',
                modal: '100',
                toast: '150',
            },
        },
    },
    plugins: [],
};

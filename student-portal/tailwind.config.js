/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx}',
        './index.html',
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
                    DEFAULT: '#0F766E',
                    light: '#14B8A6',
                    dark: '#115E59',
                },
                // Secondary
                secondary: {
                    DEFAULT: '#EA580C',
                    light: '#FB923C',
                    dark: '#C2410C',
                },
                // Accent
                accent: {
                    teal: '#14B8A6',
                    emerald: '#22C55E',
                    orange: '#F97316',
                    sky: '#0EA5E9',
                    gold: '#F59E0B',
                },
                // Status
                success: '#10B981',
                warning: '#F97316',
                error: '#EF4444',
                info: '#3B82F6',
                // Role-based
                role: {
                    admin: '#EA580C',
                    professor: '#0F766E',
                    student: '#14B8A6',
                },
                // Background layers
                bg: {
                    primary: '#07110F',
                    secondary: '#10201C',
                    tertiary: '#172A25',
                    elevated: '#203832',
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
                md: '8px',
                lg: '8px',
                xl: '10px',
                '2xl': '12px',
            },

            // ============================================
            // BOX SHADOW
            // ============================================
            boxShadow: {
                'glow-blue': '0 4px 16px rgba(14, 165, 233, 0.25)',
                'glow-indigo': '0 4px 16px rgba(234, 88, 12, 0.25)',
                'glow-teal': '0 4px 18px rgba(20, 184, 166, 0.28)',
                card: '0 10px 28px rgba(0, 0, 0, 0.22)',
                elevated: '0 16px 40px rgba(0, 0, 0, 0.28)',
                xl: '0 22px 60px rgba(0, 0, 0, 0.32)',
            },

            // ============================================
            // BACKGROUND IMAGES (Gradients)
            // ============================================
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #0F766E, #0EA5E9)',
                'gradient-success': 'linear-gradient(135deg, #22C55E, #14B8A6)',
                'gradient-hero': 'linear-gradient(135deg, #07110F 0%, #10201C 52%, #1F2A18 100%)',
                'gradient-card': 'linear-gradient(135deg, rgba(20, 184, 166, 0.12), rgba(245, 158, 11, 0.08))',
                'gradient-accent': 'linear-gradient(135deg, #EA580C, #F59E0B)',
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

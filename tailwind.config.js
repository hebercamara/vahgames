/** @type {import('tailwindcss').Config} */
// Tokens extraídos de DESIGN.md (tema escuro "deep space + neon").
module.exports = {
  content: [
    "./index.html", // Importante para projetos Vite
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#0C0D14',
        surface: '#0C0D13',
        'surface-raised': '#1F2026',
        line: '#292A30',
        ink: '#FFFFFF',
        body: '#E5E6EE',
        muted: '#BDBFCE',
        'on-primary': '#222222',
        lime: { DEFAULT: '#C7FF5B', ink: '#0F1A00' },
        violet: {
          deep: '#7361FF',
          medium: '#6842FF',
          bright: '#A48EFF',
        },
        lavender: '#878A9E',
        navy: '#2F3148',
        'neutral-1': '#DCDFE8',
        'neutral-2': '#EFF0F7',
        'light-fill': '#F9FAFF',
        badge: '#F0001B',
      },
      fontFamily: {
        // APK Protocol / Artex SemiExtended são fontes proprietárias:
        // usamos substitutos livres do Google Fonts com o mesmo caráter.
        sans: ['Outfit', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        display: ['Unbounded', 'Outfit', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      fontSize: {
        caption: ['12px', { lineHeight: '1.35', fontWeight: '700' }],
        'body-md': ['14px', { lineHeight: '1.43' }],
        'body-lg': ['16px', { lineHeight: '1.25' }],
        'body-xl': ['20px', { lineHeight: '1.4', fontWeight: '700' }],
        'heading-xs': ['20px', { lineHeight: '1.4', fontWeight: '900' }],
        'heading-sm': ['24px', { lineHeight: '1.29', fontWeight: '900' }],
      },
      borderRadius: {
        xs: '16px',
        sm: '22px',
        pill: '30px',
      },
      spacing: {
        sidebar: '68px',
        section: '68px',
      },
      boxShadow: {
        lift: 'rgba(0, 0, 0, 0.7) 0px 10px 30px 0px',
        micro: 'rgba(0, 0, 0, 0.57) 0px 0px 7px 1px',
        focus: 'rgb(29, 0, 104) 0px 10px 40px 0px',
        inset: 'rgba(0, 0, 0, 0) 0px 0px 0px 1.5px inset',
      },
      backgroundImage: {
        'grad-blue': 'linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(21, 74, 111) 100%)',
        'grad-rose': 'linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(104, 41, 77) 100%)',
        'grad-teal': 'linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(31, 100, 92) 100%)',
        'grad-olive': 'linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(88, 82, 44) 100%)',
        'grad-green': 'linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(46, 97, 54) 100%)',
        'grad-violet': 'linear-gradient(285deg, rgb(23, 29, 46) 20%, rgb(61, 47, 115) 100%)',
      },
      zIndex: {
        sticky: '9',
        popover: '11',
        top: '12',
      },
    },
  },
  plugins: [],
}

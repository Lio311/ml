/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-assistant)', 'sans-serif'],
                serif: ['var(--font-assistant)', 'serif'], // Using Assistant as main for now, or add a serif font
            },
            colors: {
                gold: {
                    100: '#F9F1D8',
                    400: '#D4AF37',
                    500: '#C5A028',
                }
            }
        },
    },
    plugins: [],
}

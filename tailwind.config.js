module.exports = {
    content: [
        "./popup/**/*.{html,js}",
        "./content/**/*.{js,css}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    light: '#818cf8',
                    DEFAULT: '#6366f1',
                    dark: '#4f46e5',
                }
            }
        },
    },
    plugins: [],
}

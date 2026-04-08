module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"] ,
  theme: { 
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#06B6D4',
        accent: '#F472B6'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: [],
};

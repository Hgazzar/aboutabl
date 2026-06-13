/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        black: "#171717",
        white: "#FFFFFF",
        dark: "#1F1E1E",
        primaryDark: "#004D34",
        primaryDarkHovered: "#046244",
        primary: "#1EBBA3",
        veryLightprimary: "#F3FFFA",
        grayDark: "#44546F",
        grayDarkHoverd: "#091E4224", //border
        gray: "#8E9AA0", //for gray text
        grayShadow: "#FFFFFF1A",
        easyGray: "#c1c1c1", //for disabled buttons
        lightGray: "#EEEEEE",
        veryLightGray: "#F7F9FA",
        extraVeryLightGray: "#FCFCFC", //for card background
        softLightGray: "#FAF9F9", //For background for text
        silver: "#8E9AA0",
        green: "#1EBBA3",
        lightGreen: "#F3FFFA",
        red: "#F64C4C", // danger
        lightRed: "#ff000014", // danger
        Orange: "#EBAF53",

        // color for data in table
        blue: "#0055CC",
        lightBlue: "#E9F2FF",
        yellowDark: "#974F0C",
        lightYellow: "#FFF7D6",
        greenDark: "#216E4E",
        softGreen: "#DFFCF0",
        purble: "#5E4DB2",
        lightPurble: "#F3F0FF",
        Red: "#AE2A19",
        LightRed: "#FFEDEB",
      },
      screens: {
        xs: "576px",
        sm: "768px",
        md: "992px",
        lg: "1200px",
        xl: "1400px",
      },
    },
  },
  plugins: [require("tailwindcss"), require("autoprefixer")],
};

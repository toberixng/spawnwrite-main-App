// app\theme.ts
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      primary: '#121C27', // Dark blue-gray
      accent: '#b8c103',  // Lime yellow
      neutral: '#ffffff', // White for form backgrounds
      light: '#f5f5f5',   // Light gray for inputs
    },
  },
});

export default theme;
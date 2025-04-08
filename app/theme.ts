// app\theme.ts
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  initialColorMode: 'light', // Added from layout.tsx
  useSystemColorMode: false, // Added from layout.tsx
  colors: {
    brand: {
      primary: '#121C27', // Dark blue-gray
      accent: '#b8c103',  // Lime yellow
      neutral: '#FAFAFA', // Updated to match layout.tsx (was #ffffff)
      light: '#f5f5f5',   // Light gray for inputs
    },
  },
});

export default theme;
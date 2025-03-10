import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Define the color mode config
const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Extend the theme with custom colors, fonts, etc.
const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#e6f7ff',
      100: '#b3e7ff',
      200: '#80d6ff',
      300: '#4dc6ff',
      400: '#26b6ff',
      500: '#00a6ff', // Primary brand color
      600: '#0085cc',
      700: '#006499',
      800: '#004266',
      900: '#002133',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderColor: 'gray.200',
            backgroundColor: 'gray.50',
          },
          td: {
            borderColor: 'gray.100',
          },
        },
      },
    },
  },
});

export default theme;
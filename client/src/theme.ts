import { extendTheme, type ThemeConfig, type StyleFunctionProps } from '@chakra-ui/react';

// Define the color mode config
const config: ThemeConfig = {
  initialColorMode: 'dark', // Changed to dark as default
  useSystemColorMode: false,
};

// Define energy tones palette
const energyColors = {
  cyan: {
    50: '#e6ffff',
    100: '#b3ffff',
    200: '#80ffff',
    300: '#4dffff',
    400: '#26ffff',
    500: '#00e1ff', // Primary vibrant cyan
    600: '#00b4cc',
    700: '#008799',
    800: '#005a66',
    900: '#002d33',
  },
  magenta: {
    50: '#ffe6f7',
    100: '#ffb3e7',
    200: '#ff80d6',
    300: '#ff4dc6',
    400: '#ff26b6',
    500: '#ff00a6', // Primary vibrant magenta
    600: '#cc0085',
    700: '#990064',
    800: '#660042',
    900: '#330021',
  }
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
    // Add energy tones
    ...energyColors
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  styles: {
    global: ({ colorMode }: StyleFunctionProps) => ({
      body: {
        bg: colorMode === 'dark' ? '#121212' : 'white',
        color: colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: ({ colorMode }: StyleFunctionProps) => ({
          bg: colorMode === 'dark' ? 'cyan.500' : 'brand.500',
          color: colorMode === 'dark' ? 'black' : 'white',
          fontWeight: 'bold',
          _hover: {
            bg: colorMode === 'dark' ? 'cyan.400' : 'brand.600',
            color: colorMode === 'dark' ? 'black' : 'white',
          }
        }),
        outline: ({ colorMode }: StyleFunctionProps) => ({
          borderColor: colorMode === 'dark' ? 'whiteAlpha.800' : 'gray.200',
          color: colorMode === 'dark' ? 'white' : 'gray.800',
          _hover: {
            bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50',
            borderColor: colorMode === 'dark' ? 'white' : 'gray.300',
          }
        }),
      },
      // Only apply the black text to solid buttons with bright backgrounds in dark mode
      baseStyle: () => ({
        _dark: {
          '&[data-solid="true"]': {
            color: 'black',
            fontWeight: 'bold',
            _hover: {
              color: 'black',
            }
          }
        }
      })
    },
    Table: {
      variants: {
        simple: ({ colorMode }: StyleFunctionProps) => ({
          th: {
            borderColor: colorMode === 'dark' ? 'gray.700' : 'gray.200',
            backgroundColor: colorMode === 'dark' ? 'gray.800' : 'gray.50',
            color: colorMode === 'dark' ? 'white' : 'inherit',
          },
          td: {
            borderColor: colorMode === 'dark' ? 'gray.700' : 'gray.100',
          },
        }),
      },
    },
    Badge: {
      variants: {
        solid: ({ colorMode, colorScheme }: StyleFunctionProps) => {
          // Define the allowed color schemes
          type BadgeColorScheme = 'green' | 'gray' | 'purple';
          
          // Define a type-safe color map
          const colorMap: Record<BadgeColorScheme, string> = {
            green: colorMode === 'dark' ? 'cyan.500' : 'green.500',
            gray: colorMode === 'dark' ? 'gray.600' : 'gray.500',
            purple: colorMode === 'dark' ? 'magenta.500' : 'purple.500'
          };
          
          // Use type assertion to tell TypeScript this is a safe operation
          const bgColor = colorMap[colorScheme as BadgeColorScheme] || colorScheme;
          
          return {
            bg: bgColor,
            color: 'white'
          };
        }
      }
    },
    Stat: {
      baseStyle: ({ colorMode }: StyleFunctionProps) => ({
        container: {
          bg: colorMode === 'dark' ? 'gray.800' : 'white',
          borderColor: colorMode === 'dark' ? 'gray.700' : 'gray.200',
        },
        label: {
          color: colorMode === 'dark' ? 'gray.400' : 'gray.500',
        },
        number: {
          color: colorMode === 'dark' ? 'white' : 'gray.900',
        },
        helpText: {
          color: colorMode === 'dark' ? 'gray.400' : 'gray.600',
        },
      }),
    },
    Box: {
      variants: {
        panel: ({ colorMode }: StyleFunctionProps) => ({
          bg: colorMode === 'dark' ? 'gray.800' : 'white',
          borderColor: colorMode === 'dark' ? 'gray.700' : 'gray.200',
        }),
      }
    }
  },
});

export default theme;
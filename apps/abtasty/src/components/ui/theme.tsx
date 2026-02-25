import { createTheme } from '@mui/material/styles';

/**
 * Defines the custom Material UI theme.
 * The primary color is set to #3100BF, and MUI automatically generates
 * the corresponding light, dark, and contrast text shades.
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#3100BF',
    },
    success: {
      main: '#ddfde6',
    },
    // Optional: You can also define secondary or other colors here if needed.
  },
});

export default theme;

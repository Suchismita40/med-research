// Private Medical Research Data Exchange MUI Theme Config (Premium Light SaaS Aesthetic)

import { createTheme } from '@mui/material';

export const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    allVariants: {
      color: '#1F2937',
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#F97316',
      light: '#FFEDD5',
      dark: '#EA580C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981',
      light: '#D1FAE5',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
    divider: '#E5E7EB',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#E5E7EB',
            },
            '&:hover fieldset': {
              borderColor: '#F97316',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#F97316',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

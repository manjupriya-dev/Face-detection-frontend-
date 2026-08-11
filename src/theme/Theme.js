import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: {
            main: '#025F67', // Teal
            light: '#e0f4f5',
            dark: '#014a51',
          },
          secondary: {
            main: '#f50057',
          },
          background: {
            default: '#f8f9fa',
            paper: '#ffffff',
            sidebar: '#ffffff',
            sidebarHover: 'rgba(2, 95, 103, 0.06)',
            active: 'rgba(2, 95, 103, 0.10)',
          },
          divider: '#e0e0e0',
          text: {
            primary: '#202124',
            secondary: '#5f6368',
          },
        }
      : {
          primary: {
            main: '#4db6c4', // Lighter blue for dark mode
            light: '#e0f4f5',
            dark: '#0d8a96',
          },
          secondary: {
            main: '#f48fb1',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
            sidebar: '#1e1e1e',
            sidebarHover: 'rgba(255,255,255,0.08)',
            active: 'rgba(144, 202, 249, 0.16)',
          },
          divider: '#333333',
          text: {
            primary: '#ffffff',
            secondary: '#b0bec5',
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: mode === 'light' ? '#202124' : '#ffffff',
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: mode === 'light' ? '1px solid #e0e0e0' : '1px solid #333333',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          color: mode === 'light' ? '#202124' : '#ffffff',
          borderBottom: mode === 'light' ? '1px solid #e0e0e0' : '1px solid #333333',
          transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          borderRight: mode === 'light' ? '1px solid #e0e0e0' : '1px solid #333333',
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
      },
    },
  },
});

export default getTheme;

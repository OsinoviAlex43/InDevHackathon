import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { observer } from 'mobx-react-lite';

// Layouts
import MainLayout from './components/layouts/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import RoomsPage from './pages/RoomsPage';
import RoomDetailsPage from './pages/RoomDetailsPage';
import GuestsPage from './pages/GuestsPage';
import GuestDetailsPage from './pages/GuestDetailsPage';
import SettingsPage from './pages/SettingsPage';

// Stores
import rootStore from './stores';

// Global styles
import { GlobalStyles } from '@mui/material';

const App: React.FC = observer(() => {
  const { settingsStore } = rootStore;
  
  // Create theme based on dark mode setting
  const theme = createTheme({
    palette: {
      mode: settingsStore.darkMode ? 'dark' : 'light',
      primary: {
        main: '#6a5df7', // Modern purple shade
        light: '#9a8bfc',
        dark: '#4a3dcb',
      },
      secondary: {
        main: '#f56eb3', // Modern pink shade
        light: '#ff9dd6',
        dark: '#c13d91',
      },
      background: {
        default: settingsStore.darkMode ? '#151921' : '#f0f2f8',
        paper: settingsStore.darkMode ? '#1f2733' : '#ffffff',
      },
      error: {
        main: '#ff5a65',
      },
      warning: {
        main: '#ffb74d',
      },
      info: {
        main: '#66cfff',
      },
      success: {
        main: '#66d4b1',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backdropFilter: 'blur(10px)',
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha(theme.palette.mode === 'dark' ? '#ffffff' : '#000000', 0.1)}`,
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 4px 20px 0 rgba(0,0,0,0.5)'
              : '0 4px 20px 0 rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: theme.palette.mode === 'dark' 
                ? '0 6px 25px 0 rgba(0,0,0,0.7)'
                : '0 6px 25px 0 rgba(0,0,0,0.15)',
            },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backdropFilter: 'blur(10px)',
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            transition: 'all 0.3s ease'
          }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(10px)',
            borderBottom: `1px solid ${alpha(theme.palette.mode === 'dark' ? '#ffffff' : '#000000', 0.1)}`,
            color: theme.palette.text.primary,
            boxShadow: 'none',
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            borderRight: `1px solid ${alpha(theme.palette.mode === 'dark' ? '#ffffff' : '#000000', 0.1)}`,
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 16px',
          },
          contained: ({ theme }) => ({
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              transform: 'translateY(-2px)',
            },
          }),
        },
        defaultProps: {
          disableElevation: true,
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s ease',
          }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 12,
            margin: '4px 8px',
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.25),
              },
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          }),
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 16,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.mode === 'dark' ? '#ffffff' : '#000000', 0.1)}`,
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid rgba(224, 224, 224, 0.3)',
          },
          head: {
            fontWeight: 600,
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: alpha(theme.palette.background.default, 0.6),
            backdropFilter: 'blur(5px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.background.default, 0.8),
            },
            '&.Mui-focused': {
              backgroundColor: alpha(theme.palette.background.default, 0.9),
              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`,
            },
          }),
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
              },
            },
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            },
          }),
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles 
        styles={{
          body: {
            backgroundImage: settingsStore.darkMode 
              ? 'linear-gradient(135deg, #151921 0%, #1a1e29 100%)' 
              : 'linear-gradient(135deg, #f0f2f8 0%, #e7eaf8 100%)',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
          },
          '*::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '*::-webkit-scrollbar-track': {
            background: alpha(theme.palette.background.default, 0.05),
          },
          '*::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.primary.main, 0.2),
            borderRadius: '4px',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: alpha(theme.palette.primary.main, 0.3),
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="rooms/:id" element={<RoomDetailsPage />} />
            <Route path="guests" element={<GuestsPage />} />
            <Route path="guests/:id" element={<GuestDetailsPage />} />
            <Route path="guests/:id/edit" element={<GuestDetailsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
});

export default App; 
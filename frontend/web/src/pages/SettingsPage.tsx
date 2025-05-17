import React from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  AdminPanelSettings as AdminIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';

import rootStore from '../stores';

const SettingsPage: React.FC = observer(() => {
  const { settingsStore } = rootStore;
  const theme = useTheme();
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem sx={{ pr: 8 }}>
                <ListItemIcon>
                  {theme.palette.mode === 'dark' ? <DarkModeIcon /> : <LightModeIcon />}
                </ListItemIcon>
                <ListItemText 
                  primary="Dark Mode" 
                  secondary="Toggle between light and dark theme"
                  sx={{ mr: 6 }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settingsStore.darkMode}
                    onChange={() => settingsStore.toggleDarkMode()}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem sx={{ pr: 8 }}>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Sidebar Navigation" 
                  secondary="Always show sidebar on desktop"
                  sx={{ mr: 6 }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settingsStore.sidebarOpen}
                    onChange={() => settingsStore.toggleSidebar()}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem sx={{ pr: 8 }}>
                <ListItemIcon>
                  <LanguageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Language" 
                  secondary="Select your preferred language"
                  sx={{ mr: 6 }}
                />
                <ListItemSecondaryAction>
                  <FormControl sx={{ minWidth: 120 }} size="small">
                    <Select
                      value="en"
                      displayEmpty
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="ru">Russian</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AdminIcon sx={{ fontSize: 40, mr: 2 }} color="primary" />
                  <Box>
                    <Typography variant="h6">Admin</Typography>
                    <Typography variant="body2" color="text.secondary">
                      administrator@hotel.com
                    </Typography>
                  </Box>
                </Box>
                
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Change Password
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
            
            <List>
              <ListItem sx={{ pr: 8 }}>
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Two-Factor Authentication" 
                  secondary="Require verification code at login"
                  sx={{ mr: 6 }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={false}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem sx={{ pr: 8 }}>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Email Notifications" 
                  secondary="Receive notifications via email"
                  sx={{ mr: 6 }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={true}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem sx={{ pr: 8 }}>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Desktop Notifications" 
                  secondary="Show desktop notifications"
                  sx={{ mr: 6 }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={true}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem sx={{ pr: 8 }}>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="New Guest Alerts" 
                  secondary="Get alerted when new guests check in"
                  sx={{ mr: 6 }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={true}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem sx={{ pr: 8 }}>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Room Status Alerts" 
                  secondary="Get alerted when room status changes"
                  sx={{ mr: 6 }}
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={false}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Data Management
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
              >
                Sync Data
              </Button>
              
              <Button
                variant="outlined"
                color="error"
              >
                Clear Cache
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Last data sync: Today at {new Date().toLocaleTimeString()}
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              About
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" paragraph>
              Hotel Admin Panel v1.0.0
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              A powerful management system for hotel administrators.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              © 2023 Hotel Admin System
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
});

export default SettingsPage; 
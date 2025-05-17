import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  MeetingRoom as RoomIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

import rootStore from '../../stores';

const drawerWidth = 280;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(4),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    padding: theme.spacing(2),
  },
}));

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  [theme.breakpoints.down('md')]: {
    width: '100%',
    marginLeft: 0,
  },
  zIndex: theme.zIndex.drawer - 1,
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.main,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

interface NavigationItem {
  text: string;
  path: string;
  icon: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { text: 'Rooms', path: '/rooms', icon: <RoomIcon /> },
  { text: 'Guests', path: '/guests', icon: <PeopleIcon /> },
  { text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

const MainLayout: React.FC = observer(() => {
  const { settingsStore, roomStore, guestStore } = rootStore;
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    settingsStore.toggleSidebar();
  };

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleThemeToggle = () => {
    settingsStore.toggleDarkMode();
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  // Close mobile drawer when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Count unresolved issues
  const issuesCount = roomStore.rooms.filter(room => 
    room.status === 'service' || room.status === 'cleaning'
  ).length;

  const notificationItems = [
    { 
      title: 'Maintenance Issues', 
      content: `${issuesCount} rooms need attention`, 
      time: '10 min ago'
    },
    { 
      title: 'New Guest Check-in', 
      content: 'Emily Davis has checked in to room 202', 
      time: '1 hour ago'
    },
    { 
      title: 'Cleaning Request', 
      content: 'Room 101 needs cleaning', 
      time: '3 hours ago'
    }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <StyledAppBar position="fixed" open={settingsStore.sidebarOpen} elevation={0}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ 
              mr: 2, 
              ...(settingsStore.sidebarOpen && { display: { sm: 'none', md: 'flex' } }),
              display: { xs: 'none', md: 'flex' }
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <IconButton
            color="inherit"
            aria-label="open mobile drawer"
            onClick={handleMobileDrawerToggle}
            edge="start"
            sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}
          >
            SmartHotel Admin
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit" 
                onClick={handleNotificationsOpen}
                sx={{ 
                  mr: 1,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <Badge badgeContent={notificationItems.length} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={notificationsAnchorEl}
              open={Boolean(notificationsAnchorEl)}
              onClose={handleNotificationsClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                  mt: 1.5,
                  width: 320,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {notificationItems.map((item, index) => (
                <MenuItem 
                  key={index} 
                  onClick={handleNotificationsClose}
                  sx={{ 
                    py: 1.5,
                    px: 2.5,
                    borderBottom: index < notificationItems.length - 1 ? 
                      `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none'
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle2" noWrap>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{item.content}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>{item.time}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
            
            <Tooltip title="Toggle dark mode">
              <IconButton 
                color="inherit" 
                onClick={handleThemeToggle}
                sx={{ 
                  mr: 1,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleProfileMenuOpen}
                size="small"
                sx={{ 
                  ml: 1,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  }
                }}
              >
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      backgroundColor: theme.palette.secondary.main
                    }}
                  >
                    <PersonIcon />
                  </Avatar>
                </StyledBadge>
              </IconButton>
            </Tooltip>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleProfileMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleProfileMenuClose}>My account</MenuItem>
              <Divider />
              <MenuItem onClick={handleProfileMenuClose}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </StyledAppBar>
      
      {/* Desktop Drawer */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
          display: { xs: 'none', md: 'block' },
        }}
        variant="persistent"
        anchor="left"
        open={settingsStore.sidebarOpen}
      >
        <DrawerHeader>
          <LogoContainer>
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40
              }}
            >
              SH
            </Avatar>
            <Typography variant="h6" noWrap>
              SmartHotel
            </Typography>
          </LogoContainer>
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List sx={{ px: 1, mt: 1 }}>
          {navigationItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '12px',
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.18),
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: location.pathname === item.path ? 
                      theme.palette.primary.main : 'inherit',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontWeight: location.pathname === item.path ? 600 : 400 
                    } 
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ p: 2, mt: 2, mb: 1 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              textAlign: 'center'
            }}
          >
            <Typography variant="body2" gutterBottom>
              System Status
            </Typography>
            <Typography variant="subtitle2" color="primary">
              {rootStore.roomStore.isConnected ? "Connected" : "Offline Mode"}
            </Typography>
          </Box>
        </Box>
      </Drawer>
      
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleMobileDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            top: 0,
            height: '100%'
          },
          zIndex: theme => theme.zIndex.appBar + 100
        }}
      >
        <DrawerHeader>
          <LogoContainer>
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40
              }}
            >
              SH
            </Avatar>
            <Typography variant="h6" noWrap>
              SmartHotel
            </Typography>
          </LogoContainer>
          <IconButton onClick={handleMobileDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List sx={{ px: 1, mt: 1 }}>
          {navigationItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '12px',
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: location.pathname === item.path ? 
                      theme.palette.primary.main : 'inherit',
                    minWidth: 40
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiTypography-root': { 
                      fontWeight: location.pathname === item.path ? 600 : 400 
                    } 
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      
      <Main open={settingsStore.sidebarOpen}>
        <DrawerHeader />
        <Outlet />
      </Main>
    </Box>
  );
});

export default MainLayout; 
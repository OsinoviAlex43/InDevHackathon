import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Chip, 
  Box, 
  IconButton,
  CardActionArea,
  Grid,
  Tooltip,
  alpha,
  useTheme,
  Avatar,
  Paper,
  Slider,
  Collapse,
  Fade,
  Zoom,
  Stack,
  Button,
  ClickAwayListener
} from '@mui/material';
import { 
  Thermostat as TempIcon,
  Opacity as HumidityIcon,
  Compress as PressureIcon,
  LightbulbOutlined as LightOffIcon,
  Lightbulb as LightOnIcon,
  MeetingRoom as DoorIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  AccessTime as TimeIcon,
  KingBed as BedIcon,
  BrokenImage as BrokenImageIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import type {RoomWithSensors, RoomStatus, RoomType} from '../../types/RoomTypes';
import rootStore from '../../stores';

interface RoomCardProps {
  room: RoomWithSensors;
  isFavorite?: boolean;
}

// Room status map for chips
const statusColors: Record<RoomStatus, { color: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning', label: string }> = {
  'occupied': { color: 'error', label: 'Occupied' },
  'free': { color: 'success', label: 'Free' },
  'service': { color: 'warning', label: 'Service' },
  'cleaning': { color: 'info', label: 'Cleaning' },
  'booked': { color: 'primary', label: 'Booked' }
};

// Room type icons
const roomTypeIcons: Record<RoomType, React.ReactNode> = {
  'standart': <BedIcon />,
  'deluxe': <BedIcon sx={{ transform: 'scale(1.2)' }} />,
  'suit': <BedIcon sx={{ transform: 'scale(1.5)' }} />
};

// Mock room images for different room types
const roomImages: Record<RoomType, string> = {
  'standart': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=400&h=200&auto=format&fit=crop',
  'deluxe': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=400&h=200&auto=format&fit=crop',
  'suit': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=400&h=200&auto=format&fit=crop'
};

// Drag container to wrap our card
const DraggableCard = motion(Paper);

const RoomCard: React.FC<RoomCardProps> = observer(({ room, isFavorite = false }) => {
  const navigate = useNavigate();
  const { roomStore } = rootStore;
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [temperatureValue, setTemperatureValue] = useState(room.sensors?.temperature || 21);
  const [humidityValue, setHumidityValue] = useState(room.sensors?.humidity || 40);
  const [pressureValue, setPressureValue] = useState(room.sensors?.pressure || 1013);
  
  const handleViewRoom = () => {
    navigate(`/rooms/${room.id}`);
  };
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite) {
      roomStore.removeFromFavorites(room.id);
    } else {
      roomStore.addToFavorites(room);
    }
  };
  
  const handleToggleDoor = (e: React.MouseEvent) => {
    e.stopPropagation();
    roomStore.toggleDoorLock(room.id);
  };
  
  const handleToggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };
  
  // Handle temperature change
  const handleTemperatureChange = (event: Event, newValue: number | number[]) => {
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
    const value = newValue as number;
    setTemperatureValue(value);
    roomStore.updateSensor(room.id, 'temperature', value);
  };
  
  // Handle humidity change
  const handleHumidityChange = (event: Event, newValue: number | number[]) => {
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
    const value = newValue as number;
    setHumidityValue(value);
    roomStore.updateSensor(room.id, 'humidity', value);
  };
  
  // Handle pressure change
  const handlePressureChange = (event: Event, newValue: number | number[]) => {
    event.stopPropagation();
    if (event.cancelable) event.preventDefault();
    const value = newValue as number;
    setPressureValue(value);
    roomStore.updateSensor(room.id, 'pressure', value);
  };
  
  // Format price with currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(room.price_per_night);
  
  // Get status chip config
  const statusConfig = statusColors[room.status];

  // Temperature color based on value
  const getTempColor = (temp: number) => {
    if (temp < 18) return '#60a5fa'; // cool
    if (temp > 24) return '#f87171'; // hot
    return '#10b981'; // comfortable
  };

  // Humidity color based on value
  const getHumidityColor = (humidity: number) => {
    if (humidity < 30) return '#f87171'; // too dry
    if (humidity > 60) return '#60a5fa'; // too humid
    return '#10b981'; // comfortable
  };

  // Ensure we have valid sensor data
  const sensors = {
    temperature: room.sensors?.temperature || 21,
    humidity: room.sensors?.humidity || 40,
    pressure: room.sensors?.pressure || 1013,
    lights: {
      bathroom: room.sensors?.lights?.bathroom || false,
      bedroom: room.sensors?.lights?.bedroom || false, 
      hallway: room.sensors?.lights?.hallway || false
    }
  };

  return (
    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
      <Box sx={{ height: '100%', position: 'relative' }}>
        {isFavorite && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: -10, 
              right: -10,
              zIndex: 2
            }} 
          >
            <Avatar 
              sx={{ 
                bgcolor: theme.palette.warning.main,
                boxShadow: theme.shadows[4]
              }}
            >
              <StarIcon />
            </Avatar>
          </Box>
        )}

        <DraggableCard
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          elevation={2}
      sx={{ 
            borderRadius: '20px',
            overflow: 'hidden',
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
            backgroundColor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(12px)',
            border: `1px solid ${alpha(theme.palette.mode === 'dark' ? '#ffffff' : '#000000', 0.08)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            boxShadow: expanded 
              ? `0 10px 30px ${alpha(theme.palette.primary.main, 0.2)}`
              : `0 6px 20px ${alpha(theme.palette.mode === 'dark' ? '#000000' : '#000000', 0.1)}`,
          }}
        >
          <Box 
            sx={{ 
        position: 'relative',
              height: 160,
              overflow: 'hidden'
            }}
          >
            <img 
              src={roomImages[room.room_type]} 
              alt={`Room ${room.room_number}`}
              style={{ 
                width: '100%', 
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.5s ease',
                transform: expanded ? 'scale(1.1)' : 'scale(1)'
              }}
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none'; 
                const parent = target.parentElement;
                if (parent) {
                  parent.style.display = 'flex';
                  parent.style.alignItems = 'center';
                  parent.style.justifyContent = 'center';
                  parent.style.backgroundColor = alpha(theme.palette.primary.main, 0.1);
                  const fallback = document.createElement('div');
                  fallback.style.display = 'flex';
                  fallback.style.alignItems = 'center';
                  fallback.style.justifyContent = 'center';
                  fallback.innerHTML = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
                  parent.appendChild(fallback);
                }
              }}
            />
            <Box 
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)'
              }}
            />
            <Box 
              sx={{ 
                position: 'absolute',
                top: 12,
                left: 12,
                display: 'flex',
                gap: 1
              }}
            >
            <Chip 
              label={statusConfig.label} 
              color={statusConfig.color} 
              size="small" 
                sx={{
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  height: 28,
                  backdropFilter: 'blur(4px)',
                  backgroundColor: alpha(theme.palette[statusConfig.color].main, 0.8)
                }}
              />
              
              <Chip 
                icon={roomTypeIcons[room.room_type] as React.ReactElement} 
                label={room.room_type.charAt(0).toUpperCase() + room.room_type.slice(1)} 
                size="small"
                sx={{
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  height: 28,
                  backdropFilter: 'blur(4px)',
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                }}
            />
          </Box>
          
            <Typography 
              variant="h5" 
              component="div"
              sx={{
                position: 'absolute',
                bottom: 10,
                left: 12,
                color: 'white',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              Room {room.room_number}
          </Typography>
          </Box>
          
          <CardActionArea onClick={handleViewRoom} sx={{ flexGrow: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>              
          <Typography variant="h6" color="primary" gutterBottom>
            {formattedPrice}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              per night
            </Typography>
          </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    width: '100%',
                    justifyContent: 'space-between',
                    px: 1
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box 
                      component={motion.div}
                      whileHover={{ scale: 1.1 }}
                      sx={{ 
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 0.5,
                        bgcolor: alpha(getTempColor(sensors.temperature), 0.1),
                        color: getTempColor(sensors.temperature)
                      }}
                    >
                      <TempIcon />
                    </Box>
                    <Typography variant="body2" align="center">
                      {sensors.temperature}°C
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center">
                      Temp
                    </Typography>
                  </Box>
                
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box 
                      component={motion.div}
                      whileHover={{ scale: 1.1 }}
                      sx={{ 
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 0.5,
                        bgcolor: alpha(getHumidityColor(sensors.humidity), 0.1),
                        color: getHumidityColor(sensors.humidity)
                      }}
                    >
                      <HumidityIcon />
                    </Box>
                    <Typography variant="body2" align="center">
                      {sensors.humidity}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center">
                      Humidity
                    </Typography>
                  </Box>
                
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box 
                      component={motion.div}
                      whileHover={{ scale: 1.1 }}
                      sx={{ 
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 0.5,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main
                      }}
                    >
                      <PressureIcon />
                    </Box>
                    <Typography variant="body2" align="center">
                      {sensors.pressure}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" align="center">
                      Pressure
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </CardContent>
          </CardActionArea>
          
          {/* Controls section outside CardActionArea */}
          <Box sx={{ px: 2, pt: 0, pb: 2 }}>
            <Button 
              fullWidth
              color="primary"
              variant="outlined"
              startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              endIcon={<SettingsIcon />}
              onClick={handleToggleExpanded}
              sx={{ 
                mb: 2,
                borderRadius: '12px',
                transition: 'all 0.3s ease'
              }}
            >
              {expanded ? "Hide Controls" : "Show Controls"}
            </Button>
              
            <ClickAwayListener onClickAway={() => expanded && setExpanded(false)}>
              <Collapse in={expanded} timeout="auto">
                <Box 
                  sx={{ 
                    mt: 2,
                    p: 2,
                    borderRadius: '12px',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.4),
                    backdropFilter: 'blur(5px)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Temperature Control
                  </Typography>
                  <Slider
                    value={temperatureValue}
                    onChange={handleTemperatureChange}
                    aria-labelledby="temperature-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={15}
                    max={30}
                    sx={{
                      color: getTempColor(temperatureValue),
                      '& .MuiSlider-thumb': {
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.3)'
                        }
                      }
                    }}
                  />
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Humidity Control
                  </Typography>
                  <Slider
                    value={humidityValue}
                    onChange={handleHumidityChange}
                    aria-labelledby="humidity-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    marks
                    min={20}
                    max={80}
                    sx={{
                      color: getHumidityColor(humidityValue),
                      '& .MuiSlider-thumb': {
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.3)'
                        }
                      }
                    }}
                  />
                </Box>
              </Collapse>
            </ClickAwayListener>
            
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="body2" gutterBottom color="text.secondary">
                Lights
              </Typography>
              <Box sx={{ display: 'flex', mt: 0.5, justifyContent: 'space-around' }}>
                <Tooltip title="Bathroom Light">
                  <Box sx={{ textAlign: 'center' }}>
                    {sensors.lights.bathroom ? 
                      <LightOnIcon
                        color="warning"
                        sx={{ 
                          fontSize: 22,
                          filter: 'drop-shadow(0 0 5px rgba(255, 180, 0, 0.7))'
                        }} 
                      /> : 
                      <LightOffIcon color="disabled" sx={{ fontSize: 22 }} />}
                    <Typography variant="caption" display="block" color="text.secondary">Bath</Typography>
                  </Box>
                </Tooltip>
                
                <Tooltip title="Bedroom Light">
                  <Box sx={{ textAlign: 'center' }}>
                    {sensors.lights.bedroom ? 
                      <LightOnIcon
                        color="warning"
                        sx={{ 
                          fontSize: 22,
                          filter: 'drop-shadow(0 0 5px rgba(255, 180, 0, 0.7))'
                        }} 
                      /> : 
                      <LightOffIcon color="disabled" sx={{ fontSize: 22 }} />}
                    <Typography variant="caption" display="block" color="text.secondary">Bed</Typography>
                  </Box>
                </Tooltip>
                
                <Tooltip title="Hallway Light">
                  <Box sx={{ textAlign: 'center' }}>
                    {sensors.lights.hallway ? 
                      <LightOnIcon
                        color="warning"
                        sx={{ 
                          fontSize: 22,
                          filter: 'drop-shadow(0 0 5px rgba(255, 180, 0, 0.7))'
                        }} 
                      /> : 
                      <LightOffIcon color="disabled" sx={{ fontSize: 22 }} />}
                    <Typography variant="caption" display="block" color="text.secondary">Hall</Typography>
                  </Box>
                </Tooltip>
              </Box>
            </Box>
          </Box>
      
          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Tooltip title={room.doorLocked ? "Door Locked" : "Door Unlocked"}>
          <IconButton 
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            size="small" 
            onClick={handleToggleDoor}
                color={room.doorLocked ? "success" : "error"}
                sx={{ 
                  borderRadius: '12px',
                  backgroundColor: alpha(
                    room.doorLocked ? theme.palette.success.main : theme.palette.error.main, 
                    0.1
                  ),
                  color: room.doorLocked ? theme.palette.success.main : theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: alpha(
                      room.doorLocked ? theme.palette.success.main : theme.palette.error.main, 
                      0.2
                    ),
                  }
                }}
          >
            {room.doorLocked ? <LockIcon /> : <UnlockIcon />}
          </IconButton>
        </Tooltip>
        
        <Tooltip title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}>
          <IconButton 
                component={motion.button}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            size="small"
            onClick={handleToggleFavorite}
                sx={{ 
                  borderRadius: '12px',
                  backgroundColor: alpha(
                    isFavorite ? theme.palette.warning.main : theme.palette.action.disabled, 
                    isFavorite ? 0.1 : 0.05
                  ),
                  color: isFavorite ? theme.palette.warning.main : theme.palette.text.secondary,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.warning.main, 0.2),
                  }
                }}
          >
            {isFavorite ? <StarIcon /> : <StarBorderIcon />}
          </IconButton>
        </Tooltip>
      </CardActions>
        </DraggableCard>
      </Box>
    </Zoom>
  );
});

export default RoomCard; 
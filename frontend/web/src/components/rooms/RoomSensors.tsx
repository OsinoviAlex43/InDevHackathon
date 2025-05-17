import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  IconButton,
  Collapse,
  Slider,
  Fade
} from '@mui/material';
import { 
  Thermostat as TempIcon,
  Opacity as HumidityIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  AcUnit as ColdIcon,
  Whatshot as HotIcon
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import type { RoomWithSensors } from '../../types/RoomTypes';
import rootStore from '../../stores';
import { motion } from 'framer-motion';

interface RoomSensorsProps {
  room: RoomWithSensors;
}

// Helper functions for styling
const getTempColor = (temp: number) => {
  if (temp < 18) return '#60a5fa'; // cool
  if (temp > 24) return '#f87171'; // hot
  return '#10b981'; // comfortable
};

const getHumidityColor = (humidity: number) => {
  if (humidity < 30) return '#f87171'; // too dry
  if (humidity > 60) return '#60a5fa'; // too humid
  return '#10b981'; // comfortable
};

export const RoomSensors = observer(({ room }: RoomSensorsProps) => {
  const { roomStore } = rootStore;
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  return (
    <Card 
      elevation={0}
      sx={{
        backdropFilter: 'blur(var(--glass-blur))',
        background: 'rgba(255, 255, 255, 0.05)', 
        mb: 4,
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        overflow: 'hidden',
        '&:hover': {
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-4px)'
        },
        ...(isExpanded && {
          transform: 'scale(1.02)',
          boxShadow: '0 16px 32px rgba(0, 0, 0, 0.15)',
          zIndex: 10
        })
      }}
      onClick={() => setIsExpanded(prev => !prev)}
      component={motion.div}
      whileHover={{ y: -4 }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Room Environment
        </Typography>
        
        <IconButton 
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(prev => !prev);
          }}
          sx={{
            width: 38,
            height: 38,
            backdropFilter: 'blur(12px)',
            background: 'rgba(255, 255, 255, 0.1)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)'
            },
            transform: isExpanded 
              ? 'rotate(180deg)' 
              : 'rotate(0deg)'
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>
      
      <CardContent sx={{ p: 0 }}>
        {/* Sensors Display */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          p: 3
        }}>
          {/* Temperature */}
          <Box sx={{ 
            p: 2, 
            textAlign: 'center',
            position: 'relative' 
          }}>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Box sx={{ 
                position: 'relative',
                display: 'inline-flex',
                borderRadius: '50%',
                width: 90,
                height: 90,
                justifyContent: 'center',
                alignItems: 'center',
                background: `radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)`,
                boxShadow: `0 0 15px ${getTempColor(room.sensors?.temperature || 0)}40`
              }}>
                <TempIcon sx={{ 
                  fontSize: '2rem', 
                  color: getTempColor(room.sensors?.temperature || 0),
                  filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))',
                  position: 'absolute',
                  top: '20px',
                  mr: 2
                }} />
                <Typography variant="h6" sx={{ 
                  position: 'absolute',
                  bottom: '20px',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: getTempColor(room.sensors?.temperature || 0),
                  ml: 2
                }}>
                  {room.sensors?.temperature || 0}°C
                </Typography>
              </Box>
            </motion.div>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
              Temperature
            </Typography>
          </Box>
          
          {/* Humidity */}
          <Box sx={{ 
            p: 2, 
            textAlign: 'center',
            position: 'relative' 
          }}>
            <motion.div 
              whileHover={{ scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Box sx={{ 
                position: 'relative',
                display: 'inline-flex',
                borderRadius: '50%',
                width: 90,
                height: 90,
                justifyContent: 'center',
                alignItems: 'center',
                background: `radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)`,
                boxShadow: `0 0 15px ${getHumidityColor(room.sensors?.humidity || 0)}40`
              }}>
                <HumidityIcon sx={{ 
                  fontSize: '2rem', 
                  color: getHumidityColor(room.sensors?.humidity || 0),
                  filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))',
                  position: 'absolute',
                  top: '20px',
                  mr: 2
                }} />
                <Typography variant="h6" sx={{ 
                  position: 'absolute',
                  bottom: '20px',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: getHumidityColor(room.sensors?.humidity || 0),
                  ml: 2
                }}>
                  {room.sensors?.humidity || 0}%
                </Typography>
              </Box>
            </motion.div>
            <Typography variant="body2" sx={{ mt: 2, opacity: 0.8 }}>
              Humidity
            </Typography>
          </Box>
        </Box>
        
        {/* Controls Panel */}
        <Collapse in={isExpanded} timeout={300}>
          <Box 
            sx={{ 
              p: 3,
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              backgroundColor: 'rgba(0, 0, 0, 0.05)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="subtitle2" sx={{ 
              mb: 3, 
              opacity: 0.8, 
              fontWeight: 500,
              textAlign: 'center' 
            }}>
              Environmental Controls
            </Typography>
            
            {/* Temperature Control */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ColdIcon sx={{ color: '#60a5fa', fontSize: '1.2rem' }} />
                  <Typography variant="body2">Cool</Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: getTempColor(room.sensors?.temperature || 0)
                  }}
                >
                  {room.sensors?.temperature || 0}°C
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">Heat</Typography>
                  <HotIcon sx={{ color: '#f87171', fontSize: '1.2rem' }} />
                </Box>
              </Box>
              <Slider
                value={room.sensors?.temperature || 0}
                onChange={(e, value) => {
                  e.stopPropagation();
                  roomStore.updateSensor(room.id, 'temperature', value as number);
                }}
                min={16}
                max={30}
                step={0.5}
                sx={{
                  color: getTempColor(room.sensors?.temperature || 0),
                  height: 4,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    transition: 'transform 0.3s ease',
                    '&:hover, &.Mui-active': {
                      boxShadow: '0 0 0 10px rgba(99, 102, 241, 0.1)'
                    }
                  },
                  '& .MuiSlider-rail': {
                    background: 'linear-gradient(to right, #60a5fa, #10b981, #f87171)',
                    opacity: 0.3
                  }
                }}
              />
            </Box>
            
            {/* Humidity Control */}
            <Box>
              <Box sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1
              }}>
                <Typography variant="body2">Dry</Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: getHumidityColor(room.sensors?.humidity || 0)
                  }}
                >
                  {room.sensors?.humidity || 0}%
                </Typography>
                <Typography variant="body2">Humid</Typography>
              </Box>
              <Slider
                value={room.sensors?.humidity || 0}
                onChange={(e, value) => {
                  e.stopPropagation();
                  roomStore.updateSensor(room.id, 'humidity', value as number);
                }}
                min={20}
                max={80}
                sx={{
                  color: getHumidityColor(room.sensors?.humidity || 0),
                  height: 4,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    transition: 'transform 0.3s ease',
                    '&:hover, &.Mui-active': {
                      boxShadow: '0 0 0 10px rgba(99, 102, 241, 0.1)'
                    }
                  },
                  '& .MuiSlider-rail': {
                    background: 'linear-gradient(to right, #f87171, #10b981, #60a5fa)',
                    opacity: 0.3
                  }
                }}
              />
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
});

export default RoomSensors; 
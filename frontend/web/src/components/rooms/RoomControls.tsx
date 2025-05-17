import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  useTheme
} from '@mui/material';
import { 
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  LightbulbOutlined as LightOffIcon,
  Lightbulb as LightOnIcon
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import type { RoomWithSensors } from '../../types/RoomTypes';
import rootStore from '../../stores';
import { motion } from 'framer-motion';
import networkAPI from '../../services/NetworkAPI';

interface RoomControlsProps {
  room: RoomWithSensors;
}

export const RoomControls = observer(({ room }: RoomControlsProps) => {
  const { roomStore } = rootStore;
  const theme = useTheme();
  
  return (
    <Paper
      sx={{
        p: 5,
        mb: 4,
        borderRadius: 2,
        backdropFilter: 'blur(var(--glass-blur))',
        background: theme.palette.mode === 'dark' 
          ? 'var(--glass-gradient)' 
          : 'rgba(240, 242, 245, 0.9)',
        boxShadow: 'var(--glass-shadow)',
        border: 'var(--glass-border)',
        position: 'relative',
        overflow: 'hidden',
      }}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Glass reflection effect */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'linear-gradient(to bottom, var(--glass-reflective-top), transparent)',
        opacity: 0.6,
        zIndex: 0,
        borderRadius: '8px 8px 0 0'
      }} />
      
      <Typography 
        variant="h5" 
        sx={{ 
          mb: 3, 
          fontWeight: 600,
          position: 'relative',
          zIndex: 1
        }}
      >
        Room Controls
      </Typography>
      
      {/* Door Lock Control */}
      <Box sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
        <Card 
          variant="outlined" 
          sx={{
            borderRadius: 2,
            background: theme.palette.mode === 'dark' 
              ? 'var(--glass-gradient)' 
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(15px)',
            border: 'var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            transition: 'all 0.4s ease',
            '&:hover': {
              boxShadow: 'var(--glass-glow), var(--glass-shadow)',
              transform: 'translateY(-3px)'
            },
            position: 'relative',
            overflow: 'hidden'
          }}
          component={motion.div}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {/* Card inner reflection */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(to bottom, var(--glass-reflective-top), transparent)',
            opacity: 0.4,
            zIndex: 0
          }} />
          
          <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              Door Lock
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Typography variant="body1" sx={{
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {room.doorLocked ? (
                  <LockIcon fontSize="small" color="primary" />
                ) : (
                  <UnlockIcon fontSize="small" color="error" />
                )}
                {room.doorLocked ? 'Locked' : 'Unlocked'}
              </Typography>
              
              <Button
                variant={room.doorLocked ? "contained" : "contained"}
                color={room.doorLocked ? "primary" : "error"}
                startIcon={room.doorLocked ? <UnlockIcon /> : <LockIcon />}
                onClick={() => {
                  roomStore.toggleDoorLock(room.id);
                  // Also directly call the door control API on the mock server
                  if (room.doorLocked) {
                    networkAPI.openDoor();
                  } else {
                    networkAPI.closeDoor();
                  }
                }}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: theme.palette.mode === 'dark' 
                    ? '#FFFFFF' 
                    : (room.doorLocked ? '#FFFFFF' : '#000000'),
                  backgroundColor: room.doorLocked 
                    ? theme.palette.primary.main 
                    : '#d32f2f',
                  boxShadow: 'var(--button-shadow-normal)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    backgroundColor: room.doorLocked 
                      ? theme.palette.primary.dark 
                      : '#b71c1c',
                    boxShadow: 'var(--button-shadow-hover)'
                  }
                }}
              >
                {room.doorLocked ? "Unlock Door" : "Lock Door"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      {/* Lights Control */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Card 
          variant="outlined"
          sx={{
            borderRadius: 2,
            background: theme.palette.mode === 'dark' 
              ? 'var(--glass-gradient)' 
              : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(15px)',
            border: 'var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            transition: 'all 0.4s ease',
            '&:hover': {
              boxShadow: 'var(--glass-glow), var(--glass-shadow)',
              transform: 'translateY(-3px)'
            },
            position: 'relative',
            overflow: 'hidden'
          }}
          component={motion.div}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {/* Card inner reflection */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: 'linear-gradient(to bottom, var(--glass-reflective-top), transparent)',
            opacity: 0.4,
            zIndex: 0
          }} />
          
          <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
              Room Lights
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 4
            }}>
              {['bathroom', 'bedroom', 'hallway'].map((light) => {
                const isOn = room.sensors?.lights?.[light as 'bathroom' | 'bedroom' | 'hallway'];
                
                return (
                  <Box key={light} sx={{ textAlign: 'center' }}>
                    <Typography 
                      variant="subtitle1"
                      sx={{ 
                        mb: 2, 
                        fontWeight: isOn ? 600 : 400,
                        color: isOn ? 'primary.main' : 'text.secondary'
                      }}
                    >
                      {light.charAt(0).toUpperCase() + light.slice(1)}
                    </Typography>
                    
                    <Tooltip title={isOn ? "Turn off" : "Turn on"}>
                      <IconButton
                        onClick={() => {
                          roomStore.toggleLight(room.id, light as 'bathroom' | 'bedroom' | 'hallway');
                          // Also directly call the light control API on the mock server
                          if (isOn) {
                            networkAPI.turnLightOff();
                          } else {
                            networkAPI.turnLightOn();
                          }
                        }}
                        color={isOn ? "warning" : "default"}
                        sx={{ 
                          width: '80px',
                          height: '80px',
                          borderRadius: '40%',
                          transition: 'all 0.3s ease',
                          transform: isOn ? 'scale(1.1)' : 'scale(1)',
                          boxShadow: isOn ? '0 0 15px rgba(255, 180, 0, 0.5)' : 'none',
                          backgroundColor: isOn 
                            ? 'rgba(255, 180, 0, 0.1)' 
                            : theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.08)' 
                              : 'rgba(0, 0, 0, 0.05)',
                          color: isOn 
                            ? theme.palette.warning.main 
                            : theme.palette.text.secondary,
                          padding: 3,
                          '&:hover': {
                            transform: isOn ? 'scale(1.15)' : 'scale(1.05)',
                            boxShadow: isOn ? '0 0 20px rgba(255, 180, 0, 0.7)' : 'var(--glass-shadow)',
                            backgroundColor: isOn 
                              ? 'rgba(255, 180, 0, 0.15)' 
                              : theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.12)'
                                : 'rgba(0, 0, 0, 0.08)'
                          }
                        }}
                      >
                        <motion.div
                          animate={{ 
                            scale: isOn ? [1, 1.2, 1] : 1,
                            rotate: isOn ? [0, 5, -5, 0] : 0 
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          {isOn ? (
                            <LightOnIcon sx={{ fontSize: '2.5rem' }} />
                          ) : (
                            <LightOffIcon sx={{ fontSize: '2.5rem' }} />
                          )}
                        </motion.div>
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      {/* Bottom reflection effect */}
      <Box sx={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50px',
        background: 'linear-gradient(to top, var(--glass-reflective-bottom), transparent)',
        opacity: 0.3,
        zIndex: 0,
        borderRadius: '0 0 8px 8px'
      }} />
    </Paper>
  );
});

export default RoomControls; 
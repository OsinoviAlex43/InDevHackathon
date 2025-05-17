import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Fade,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CleaningServices as CleaningIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import rootStore from '../stores';
import RoomDetails from '../components/rooms/RoomDetails';
import RoomControls from '../components/rooms/RoomControls';
import RoomSensors from '../components/rooms/RoomSensors';
import GuestInfo from '../components/rooms/GuestInfo';
import type { RoomStatus } from '../types/RoomTypes';
import type { Guest } from '../types/GuestTypes';

// Animation constants
const TRANSITION_DURATION = 300;

// Status chip colors for the header
const statusChipColors: Record<RoomStatus, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning', label: string }> = {
  'occupied': { color: 'error', label: 'Occupied' },
  'free': { color: 'success', label: 'Free' },
  'service': { color: 'warning', label: 'Service' },
  'cleaning': { color: 'info', label: 'Cleaning' },
  'booked': { color: 'primary', label: 'Booked' },
  'locked': { color: 'error', label: 'Locked' },
  'unlocked': { color: 'success', label: 'Unlocked' }
};

const RoomDetailsPage = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { roomStore, guestStore } = rootStore;
  const [showMenu, setShowMenu] = useState(false);
  
  // Get room by ID on component mount
  useEffect(() => {
    if (id) {
      roomStore.loadRoomById(id, () => navigate('/rooms'));
    }
    
    // Cleanup on unmount
    return () => roomStore.resetRoomDetails();
  }, [id, navigate, roomStore]);
  
  // Get current room from store
  const room = roomStore.selectedRoom;
  
  // Get current room guest
  const currentGuest: Guest | null = room?.status === 'occupied' 
    ? guestStore.guests.find(g => g.room_id === room.id) || null
    : null;
  
  // Check if room is favorite
  const isFavorite = room ? roomStore.isFavorite(room.id) : false;
  
  // Show loading state
  if (roomStore.isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        backdropFilter: 'blur(var(--glass-blur))'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CircularProgress color="primary" size={60} />
        </motion.div>
      </Box>
    );
  }
  
  // Handle room not found
  if (!room) {
    return (
      <Box sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 3,
              backdropFilter: 'blur(var(--glass-blur))',
              background: 'rgba(211, 47, 47, 0.15)'
            }}
          >
            Room not found!
          </Alert>
        <Button
          startIcon={<BackIcon />}
          variant="contained"
          onClick={() => navigate('/rooms')}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              py: 1.2
            }}
        >
          Back to Rooms
        </Button>
        </motion.div>
      </Box>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          position: 'relative',
          borderRadius: 3, 
          overflow: 'hidden',
          pb: 6
        }}
      >
        {/* Header - Semi-transparent with no border */}
        <Box 
          component={motion.div}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          sx={{ 
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.1)',
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            mb: 3,
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              onClick={() => navigate('/rooms')}
              sx={{ 
                borderRadius: '50%',
                backdropFilter: 'blur(12px)',
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { 
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
            <BackIcon />
          </IconButton>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                ml: 1
              }}
            >
            Room {room.room_number}
          </Typography>
          <Chip 
            label={statusChipColors[room.status]?.label || room.status} 
            color={statusChipColors[room.status]?.color || 'default'} 
              sx={{ 
                ml: 2, 
                height: '28px',
                fontWeight: 600,
                borderRadius: '14px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
          />
        </Box>
        
          <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}>
              <IconButton 
                onClick={() => roomStore.toggleFavorite(room)}
                color={isFavorite ? "warning" : "default"}
                sx={{ 
                  borderRadius: '50%',
                  backdropFilter: 'blur(12px)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease', 
                  '&:hover': { 
                    background: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
              {isFavorite ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
          </Tooltip>
          
            <Tooltip title="Actions">
              <IconButton 
                onClick={() => setShowMenu(!showMenu)}
                sx={{ 
                  borderRadius: '50%',
                  backdropFilter: 'blur(12px)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease', 
                  '&:hover': { 
                    background: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
            
            {/* Action buttons - shown as a dropdown */}
            <Fade in={showMenu}>
              <Box sx={{ 
                position: 'absolute',
                top: '70px',
                right: '20px',
                zIndex: 20,
                borderRadius: 3,
                backdropFilter: 'blur(var(--glass-blur))',
                background: theme => theme.palette.mode === 'dark' 
                  ? 'rgba(30, 41, 59, 0.9)' 
                  : 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                border: theme => `1px solid ${theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.08)'}`,
                minWidth: '180px'
              }}>
                {roomStore.isEditing ? (
                  <>
                    <Button
                      fullWidth
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        roomStore.cancelEdit();
                        setShowMenu(false);
                      }}
                      sx={{ 
                        py: 1.5,
                        px: 3,
                        justifyContent: 'flex-start',
                        borderRadius: 0,
                        color: theme => theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: theme => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.05)'
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Divider sx={{ borderColor: theme => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(0, 0, 0, 0.08)' }} />
                    <Button
                      fullWidth
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={() => {
                        roomStore.saveEditedRoom();
                        setShowMenu(false);
                      }}
                      sx={{ 
                        py: 1.5,
                        px: 3,
                        justifyContent: 'flex-start',
                        borderRadius: 0,
                        '&:hover': {
                          backgroundColor: theme => theme.palette.mode === 'dark'
                            ? 'rgba(99, 102, 241, 0.2)'
                            : 'rgba(99, 102, 241, 0.1)'
                        }
                      }}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      fullWidth
                      startIcon={<EditIcon />}
                      onClick={() => {
                        roomStore.startEditing();
                        setShowMenu(false);
                      }}
                      sx={{ 
                        py: 1.5,
                        px: 3,
                        justifyContent: 'flex-start',
                        borderRadius: 0,
                        color: theme => theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: theme => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.05)'
                        }
                      }}
                    >
                      Edit
                    </Button>
                    <Divider sx={{ borderColor: theme => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(0, 0, 0, 0.08)' }} />
                    <Button
                      fullWidth
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        roomStore.setConfirmDelete(true);
                        setShowMenu(false);
                      }}
                      sx={{ 
                        py: 1.5,
                        px: 3,
                        justifyContent: 'flex-start',
                        borderRadius: 0,
                        '&:hover': {
                          backgroundColor: theme => theme.palette.mode === 'dark'
                            ? 'rgba(244, 67, 54, 0.2)'
                            : 'rgba(244, 67, 54, 0.1)'
                        }
                      }}
                    >
                      Delete
                    </Button>
                    <Divider sx={{ borderColor: theme => theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(0, 0, 0, 0.08)' }} />
                    <Button
                      fullWidth
                      startIcon={<CleaningIcon />}
                      onClick={() => {
                        roomStore.updateRoom(room.id, { status: 'cleaning' });
                        setShowMenu(false);
                      }}
                      disabled={room.status === 'cleaning'}
                      sx={{ 
                        py: 1.5,
                        px: 3,
                        justifyContent: 'flex-start',
                        borderRadius: 0,
                        color: theme => room.status === 'cleaning' 
                          ? theme.palette.text.disabled 
                          : theme.palette.text.primary,
                        '&:hover': {
                          backgroundColor: theme => theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.05)'
                        }
                      }}
                    >
                      {room.status === 'cleaning' ? 'Cleaning in Progress' : 'Request Cleaning'}
                    </Button>
                  </>
                )}
              </Box>
            </Fade>
          </Box>
        </Box>
        
        {/* Main content with staggered animations */}
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '3fr 2fr' },
            gap: 4
          }}
        >
          {/* Left Column */}
          <Box>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Room Details */}
              <RoomDetails room={room} transitionDuration={TRANSITION_DURATION} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* Guest Info */}
              <GuestInfo 
                guest={currentGuest} 
                roomStatus={room.status} 
                transitionDuration={TRANSITION_DURATION}
              />
            </motion.div>
          </Box>
          
          {/* Right Column */}
          <Box>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Room Controls */}
              <RoomControls room={room} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {/* Room Sensors */}
              <RoomSensors room={room} />
            </motion.div>
          </Box>
        </Box>
      </Box>
      
      {/* Delete Confirmation Dialog - Updated with a modern look */}
      <Dialog
        open={roomStore.confirmDelete}
        onClose={() => roomStore.setConfirmDelete(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(var(--glass-blur))',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }
        }}
        TransitionComponent={Fade}
        transitionDuration={300}
      >
        <DialogTitle 
          sx={{ 
            fontWeight: 600, 
            p: 3,
            bgcolor: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          Delete Room {room.room_number}?
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography>
            This action cannot be undone. All room data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => roomStore.setConfirmDelete(false)} 
            color="inherit"
            variant="outlined"
            sx={{ 
              borderRadius: '10px',
              px: 3,
              py: 1,
              textTransform: 'none',
              backdropFilter: 'blur(8px)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '&:hover': { 
                background: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              roomStore.deleteRoom(room.id);
              navigate('/rooms');
            }} 
            color="error"
            variant="contained"
            sx={{ 
              borderRadius: '10px',
              px: 3,
              py: 1,
              textTransform: 'none',
              boxShadow: '0 8px 16px rgba(244, 67, 54, 0.2)'
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
});

export default RoomDetailsPage; 
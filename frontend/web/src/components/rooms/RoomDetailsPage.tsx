import React, { useEffect } from 'react';
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
  Fade
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CleaningServices as CleaningIcon
} from '@mui/icons-material';

import rootStore from '../stores';
import RoomDetails from '../components/rooms/RoomDetails';
import RoomControls from '../components/rooms/RoomControls';
import RoomSensors from '../components/rooms/RoomSensors';
import GuestInfo from '../components/rooms/GuestInfo';
import type { RoomStatus } from '../types/RoomTypes';

// Animation constants
const TRANSITION_DURATION = 200;

// Status chip colors for the header
const statusChipColors: Record<RoomStatus, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning', label: string }> = {
  'occupied': { color: 'error', label: 'Occupied' },
  'free': { color: 'success', label: 'Free' },
  'service': { color: 'warning', label: 'Service' },
  'cleaning': { color: 'info', label: 'Cleaning' },
  'booked': { color: 'primary', label: 'Booked' }
};

const RoomDetailsPage = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { roomStore, guestStore } = rootStore;
  
  // Get room by ID on component mount
  useEffect(() => {
    if (id) {
      const roomId = BigInt(id);
      roomStore.loadRoomById(roomId, () => navigate('/rooms'));
    }
    
    // Cleanup on unmount
    return () => roomStore.resetRoomDetails();
  }, [id, navigate, roomStore]);
  
  // Get current room from store
  const room = roomStore.selectedRoom;
  
  // Get current room guest
  const currentGuest = room?.status === 'occupied' 
    ? guestStore.guests.find(g => g.room_id === room.id) 
    : null;
  
  // Check if room is favorite
  const isFavorite = room ? roomStore.isFavorite(room.id) : false;
  
  // Show loading state
  if (roomStore.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Handle room not found
  if (!room) {
    return (
      <Box>
        <Alert severity="error">Room not found!</Alert>
        <Button
          startIcon={<BackIcon />}
          variant="contained"
          onClick={() => navigate('/rooms')}
          sx={{ mt: 2 }}
        >
          Back to Rooms
        </Button>
      </Box>
    );
  }
  
  return (
    <Fade in={true} timeout={TRANSITION_DURATION}>
      <Box 
        sx={{
          position: 'relative',
          backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          borderRadius: 2,
          p: { xs: 2, md: 3 },
          minHeight: '100vh'
        }}
      >
        {/* Header with room number and actions */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            mb: 3,
            gap: 2 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => navigate('/rooms')} 
              sx={{ 
                mr: 1,
                backgroundColor: 'rgba(255,255,255,0.7)', 
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
              }}
            >
              <BackIcon />
            </IconButton>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Room {room.room_number}
            </Typography>
            <Chip 
              label={statusChipColors[room.status].label} 
              color={statusChipColors[room.status].color} 
              sx={{ ml: 2, fontWeight: 500 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}>
              <IconButton 
                onClick={() => roomStore.toggleFavorite(room)}
                color={isFavorite ? "warning" : "default"}
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.7)', 
                  transition: 'transform 0.3s ease', 
                  '&:hover': { 
                    transform: 'scale(1.2)',
                    backgroundColor: 'rgba(255,255,255,0.9)'  
                  }
                }}
              >
                {isFavorite ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            </Tooltip>
            
            {roomStore.isEditing ? (
              <>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<CancelIcon />}
                  onClick={() => roomStore.cancelEdit()}
                  sx={{ 
                    mr: 1,
                    backgroundColor: 'rgba(255,255,255,0.7)', 
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={() => roomStore.saveEditedRoom()}
                  sx={{ 
                    backgroundColor: 'rgba(25,118,210,0.9)', 
                    '&:hover': { 
                      backgroundColor: 'rgba(25,118,210,1)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => roomStore.startEditing()}
                  sx={{ 
                    mr: 1,
                    backgroundColor: 'rgba(255,255,255,0.7)', 
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => roomStore.setConfirmDelete(true)}
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.7)', 
                    '&:hover': { 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Delete
                </Button>
              </>
            )}
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={7} lg={8}>
            {/* Room Details */}
            <RoomDetails room={room} transitionDuration={TRANSITION_DURATION} />
            
            {/* Guest Info */}
            <GuestInfo 
              guest={currentGuest} 
              roomStatus={room.status} 
              transitionDuration={TRANSITION_DURATION}
            />
          </Grid>
          
          {/* Right Column */}
          <Grid item xs={12} md={5} lg={4}>
            {/* Room Controls */}
            <RoomControls room={room} />
            
            {/* Room Sensors */}
            <Box sx={{ mb: 3 }}>
              <RoomSensors room={room} />
            </Box>
            
            {/* Service Button */}
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<CleaningIcon />}
              onClick={() => roomStore.updateRoom(room.id, { status: 'cleaning' })}
              disabled={room.status === 'cleaning'}
              sx={{ 
                mb: 3,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.7)',
                transition: 'all 0.3s ease',
                '&:not(:disabled):hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                  backgroundColor: 'rgba(255,255,255,0.9)'
                }
              }}
            >
              {room.status === 'cleaning' ? 'Cleaning in Progress' : 'Request Cleaning'}
            </Button>
          </Grid>
        </Grid>
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={roomStore.confirmDelete}
          onClose={() => roomStore.setConfirmDelete(false)}
          sx={{
            '& .MuiPaper-root': {
              borderRadius: 2,
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)'
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>Delete Room</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete Room {room.room_number}? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => roomStore.setConfirmDelete(false)} 
              color="inherit"
              sx={{ 
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
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
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': { filter: 'brightness(1.1)' }
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
});

export default RoomDetailsPage; 
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Person as PersonIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import type { Guest } from '../../types/GuestTypes';
import type { Room } from '../../types/RoomTypes';
import rootStore from '../../stores';

interface GuestSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  room: Room;
}

const GuestSelectionDialog = observer(({ open, onClose, room }: GuestSelectionDialogProps) => {
  const { guestStore } = rootStore;
  const [selectedGuests, setSelectedGuests] = useState<bigint[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const theme = useTheme();

  // Filter guests that don't have a room assigned
  const availableGuests = guestStore.guests.filter(guest => !guest.room_id);
  
  // Apply search filter
  const filteredGuests = availableGuests.filter(guest => {
    const fullName = `${guest.first_name} ${guest.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (guest.phone && guest.phone.includes(searchTerm));
  });

  // Handle guest selection
  const handleToggleGuest = (guestId: bigint) => {
    setSelectedGuests(prev => {
      // If guest already selected, remove them
      if (prev.some(id => id === guestId)) {
        return prev.filter(id => id !== guestId);
      }
      
      // Check if we would exceed max guests
      if (prev.length < room.max_guests - room.current_guests_count) {
        return [...prev, guestId];
      }
      
      return prev;
    });
  };

  // Handle assign button click
  const handleAssignGuests = async () => {
    if (selectedGuests.length === 0) return;
    
    setIsAssigning(true);
    
    try {
      // Using GuestAPI to assign multiple guests
      const guestAPI = await import('../../services/api/GuestAPI').then(module => module.default);
      const success = await guestAPI.assignGuestsToRoom(selectedGuests, room.id);
      
      if (success) {
        onClose();
      }
    } finally {
      setIsAssigning(false);
    }
  };

  // Clear selection when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedGuests([]);
      setSearchTerm('');
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: theme.palette.mode === 'dark' 
            ? 'rgba(30, 41, 59, 0.85)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(var(--glass-blur))',
          border: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.05)'}`,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 3,
        bgcolor: theme.palette.mode === 'dark'
          ? 'rgba(0, 0, 0, 0.2)'
          : 'rgba(0, 0, 0, 0.03)'
      }}>
        <Typography variant="h6">
          Select Guests for Room {room.room_number}
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small" 
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Search input */}
        <Box sx={{ 
          p: 2, 
          borderBottom: `1px solid ${theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.05)'}`
        }}>
          <TextField
            fullWidth
            placeholder="Search guests by name, email, or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': { 
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(0, 0, 0, 0.2)'
                  : 'rgba(0, 0, 0, 0.03)', 
                borderRadius: 2,
                '& fieldset': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)'
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(0, 0, 0, 0.2)'
                }
              }
            }}
          />
        </Box>
        
        {/* Guest capacity info */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          bgcolor: theme.palette.mode === 'dark'
            ? 'rgba(0, 0, 0, 0.1)'
            : 'rgba(0, 0, 0, 0.02)'
        }}>
          <Typography variant="body2">
            Guests selected: {selectedGuests.length} of {room.max_guests - room.current_guests_count} available
          </Typography>
          <Chip 
            label={`Max capacity: ${room.max_guests}`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        
        {/* Guest list */}
        <List sx={{ 
          maxHeight: '400px', 
          overflow: 'auto',
          p: 0,
          '& .MuiListItem-root': {
            borderBottom: `1px solid ${theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.05)'}`,
            py: 1
          }
        }}>
          {filteredGuests.length === 0 ? (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center', 
              color: 'text.secondary' 
            }}>
              <PersonIcon sx={{ fontSize: 40, opacity: 0.5, mb: 1 }} />
              <Typography>
                {searchTerm ? "No guests match your search" : "No available guests"}
              </Typography>
            </Box>
          ) : (
            filteredGuests.map(guest => (
              <ListItem key={guest.id.toString()} disablePadding>
                <ListItemButton
                  onClick={() => handleToggleGuest(guest.id)}
                  selected={selectedGuests.some(id => id === guest.id)}
                  sx={{
                    transition: 'all 0.2s ease',
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(99, 102, 241, 0.2)'
                        : 'rgba(99, 102, 241, 0.1)',
                      color: theme.palette.mode === 'dark'
                        ? '#fff'
                        : theme.palette.text.primary
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.02)'
                    }
                  }}
                >
                  <ListItemAvatar>
                    {guest.photo_url ? (
                      <Avatar src={guest.photo_url} />
                    ) : (
                      <Avatar sx={{ backgroundColor: 'primary.main' }}>
                        {guest.first_name[0]}{guest.last_name[0]}
                      </Avatar>
                    )}
                  </ListItemAvatar>
                  <ListItemText 
                    primary={`${guest.first_name} ${guest.last_name}`} 
                    secondary={guest.email}
                  />
                  <Checkbox
                    edge="end"
                    checked={selectedGuests.some(id => id === guest.id)}
                    color="primary"
                    inputProps={{ 'aria-labelledby': `guest-${guest.id}` }}
                  />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 2, 
        justifyContent: 'space-between',
        borderTop: `1px solid ${theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(0, 0, 0, 0.05)'}`
      }}>
        <Button 
          onClick={onClose} 
          color="inherit"
          variant="outlined"
          sx={{ 
            borderRadius: 2, 
            px: 3,
            color: theme.palette.text.primary,
            borderColor: theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
            '&:hover': {
              borderColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.2)'
                : 'rgba(0, 0, 0, 0.2)',
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.02)'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleAssignGuests} 
          variant="contained" 
          color="primary"
          disabled={selectedGuests.length === 0 || isAssigning}
          startIcon={isAssigning ? <CircularProgress size={20} /> : undefined}
          sx={{ 
            borderRadius: 2, 
            px: 3,
            color: theme.palette.getContrastText(theme.palette.primary.main),
            '&.Mui-disabled': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)',
              color: theme.palette.text.disabled
            }
          }}
        >
          {isAssigning ? 'Assigning...' : 'Assign to Room'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default GuestSelectionDialog; 
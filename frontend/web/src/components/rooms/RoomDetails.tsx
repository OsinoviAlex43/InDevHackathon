import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  Grid,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  InputAdornment,
  Zoom,
  useTheme
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import type {RoomStatus, RoomType, RoomWithSensors} from '../../types/RoomTypes';
import rootStore from '../../stores';

// Constants moved from the main page
const ROOM_STATUSES: { value: RoomStatus; label: string }[] = [
  { value: 'occupied', label: 'Occupied' },
  { value: 'free', label: 'Free' },
  { value: 'service', label: 'Service' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'booked', label: 'Booked' }
];

const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: 'standart', label: 'Standard' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'suite', label: 'Suite' }
];

const statusChipColors: Record<RoomStatus, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning', label: string }> = {
  'occupied': { color: 'error', label: 'Occupied' },
  'free': { color: 'success', label: 'Free' },
  'service': { color: 'warning', label: 'Service' },
  'cleaning': { color: 'info', label: 'Cleaning' },
  'booked': { color: 'primary', label: 'Booked' },
  'locked': { color: 'error', label: 'Locked' },
  'unlocked': { color: 'success', label: 'Unlocked' }
};

interface RoomDetailsProps {
  room: RoomWithSensors;
  transitionDuration: number;
}

export const RoomDetails = observer(({ room, transitionDuration }: RoomDetailsProps) => {
  const { roomStore } = rootStore;
  const theme = useTheme();

  // Format price with currency
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(room.price_per_night);
  
  return (
    <Zoom in={true} timeout={transitionDuration}>
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        backdropFilter: 'blur(10px)',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(30, 41, 59, 0.8)' 
          : 'rgba(226, 232, 240, 0.95)', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        borderRadius: 2,
        border: theme.palette.mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.05)'
          : '1px solid rgba(0, 0, 0, 0.05)',
      }}>
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{
            color: theme.palette.mode === 'dark'
              ? theme.palette.primary.light
              : theme.palette.primary.dark,
            fontWeight: 600
          }}
        >
          Room Details
        </Typography>
        <Divider sx={{ 
          mb: 2,
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)'
        }} />
        
        {roomStore.isEditing ? (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Room Number"
                  name="room_number"
                  value={roomStore.editableRoom.room_number}
                  onChange={(e) => roomStore.updateEditableRoom('room_number', e.target.value)}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.9)'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(226, 232, 240, 0.95)', px: 1 }}>Room Type</InputLabel>
                  <Select
                    name="room_type"
                    value={roomStore.editableRoom.room_type}
                    onChange={(e) => roomStore.updateEditableRoom('room_type', e.target.value)}
                    label="Room Type"
                    sx={{
                      height: '56px', // Increased height
                      '& .MuiSelect-select': {
                        paddingY: 2, // More padding on top and bottom
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(0, 0, 0, 0.2)'
                          : 'rgba(255, 255, 255, 0.9)',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'rgba(0, 0, 0, 0.15)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.25)'
                          : 'rgba(0, 0, 0, 0.25)'
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(30, 41, 59, 0.95)'
                            : 'rgba(255, 255, 255, 0.98)',
                          maxHeight: 300,
                          '& .MuiMenuItem-root': {
                            padding: '12px 16px', // Larger padding for menu items
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)'
                            }
                          }
                        }
                      }
                    }}
                  >
                    {ROOM_TYPES.map(type => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel sx={{ background: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(226, 232, 240, 0.95)', px: 1 }}>Status</InputLabel>
                  <Select
                    name="status"
                    value={roomStore.editableRoom.status}
                    onChange={(e) => roomStore.updateEditableRoom('status', e.target.value)}
                    label="Status"
                    sx={{
                      height: '56px', // Increased height
                      '& .MuiSelect-select': {
                        paddingY: 2, // More padding on top and bottom
                        backgroundColor: theme.palette.mode === 'dark'
                          ? 'rgba(0, 0, 0, 0.2)'
                          : 'rgba(255, 255, 255, 0.9)',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'rgba(0, 0, 0, 0.15)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.25)'
                          : 'rgba(0, 0, 0, 0.25)'
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(30, 41, 59, 0.95)'
                            : 'rgba(255, 255, 255, 0.98)',
                          maxHeight: 300,
                          '& .MuiMenuItem-root': {
                            padding: '12px 16px', // Larger padding for menu items
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)'
                            }
                          }
                        }
                      }
                    }}
                  >
                    {ROOM_STATUSES.map(status => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Price per Night"
                  name="price_per_night"
                  type="number"
                  value={roomStore.editableRoom.price_per_night}
                  onChange={(e) => roomStore.updateEditableRoom('price_per_night', Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      backgroundColor: theme.palette.mode === 'dark'
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.9)'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(0, 0, 0, 0.6)',
                    fontWeight: 500,
                    mb: 0.5
                  }}
                >
                  Room Number
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.mode === 'dark'
                      ? theme.palette.common.white
                      : theme.palette.common.black
                  }} 
                  gutterBottom
                >
                  {room.room_number}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(0, 0, 0, 0.6)',
                    fontWeight: 500,
                    mb: 0.5
                  }}
                >
                  Room Type
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.mode === 'dark'
                      ? theme.palette.common.white
                      : theme.palette.common.black
                  }} 
                  gutterBottom
                >
                  {ROOM_TYPES.find(t => t.value === room.room_type)?.label || room.room_type}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(0, 0, 0, 0.6)',
                    fontWeight: 500,
                    mb: 0.5
                  }}
                >
                  Status
                </Typography>
                <Chip 
                  label={statusChipColors[room.status]?.label || room.status} 
                  color={statusChipColors[room.status]?.color || 'default'} 
                  size="medium"
                  sx={{
                    height: 32,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    boxShadow: theme.palette.mode === 'dark'
                      ? 'none'
                      : '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(0, 0, 0, 0.6)',
                    fontWeight: 500,
                    mb: 0.5
                  }}
                >
                  Price per Night
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.mode === 'dark'
                      ? theme.palette.common.white
                      : theme.palette.common.black
                  }} 
                  gutterBottom
                >
                  {formattedPrice}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(0, 0, 0, 0.6)',
                    fontWeight: 500,
                    mb: 0.5
                  }}
                >
                  Created At
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.8)'
                      : 'rgba(0, 0, 0, 0.7)'
                  }} 
                  gutterBottom
                >
                  {new Date(room.created_at).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.7)'
                      : 'rgba(0, 0, 0, 0.6)',
                    fontWeight: 500,
                    mb: 0.5
                  }}
                >
                  Last Updated
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{
                    color: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.8)'
                      : 'rgba(0, 0, 0, 0.7)'
                  }} 
                  gutterBottom
                >
                  {new Date(room.updated_at).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Zoom>
  );
});

export default RoomDetails; 
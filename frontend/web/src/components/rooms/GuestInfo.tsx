import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Zoom,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { 
  Edit as EditIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  DateRange as DateIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import type { Guest } from '../../types/GuestTypes';
import { motion } from 'framer-motion';
import GuestSelectionDialog from './GuestSelectionDialog';
import rootStore from '../../stores';

interface GuestInfoProps {
  guest: Guest | null;
  roomStatus: string;
  transitionDuration: number;
}

export const GuestInfo = observer(({ guest, roomStatus, transitionDuration }: GuestInfoProps) => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { roomStore } = rootStore;

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  return (
    <Card
      elevation={0}
      sx={{
        backdropFilter: 'blur(var(--glass-blur))',
        background: 'rgba(255, 255, 255, 0.05)', 
        mb: 4,
        borderRadius: 2,
        border: '1px solid rgba(255, 255, 255, 0.05)',
        overflow: 'visible'
      }}
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
          Guest Information
        </Typography>
        {guest && (
          <IconButton
            onClick={() => navigate(`/guests/${guest.id}/edit`)}
            sx={{
              width: 38,
              height: 38,
              backdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.1)',
              transition: 'all 0.25s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      
      <CardContent sx={{ p: 0 }}>
        {guest ? (
          <Box>
            <Box sx={{ 
              p: 3, 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 3,
              alignItems: { xs: 'center', sm: 'flex-start' }
            }}>
              {/* Photo */}
              {guest.photo_url ? (
                <Avatar
                  src={guest.photo_url}
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '2px solid rgba(255,255,255,0.1)'
                  }}
                />
              ) : (
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, var(--primary-light), var(--primary-dark))',
                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)'
                  }}
                >
                  <PersonIcon sx={{ fontSize: 50 }} />
                </Avatar>
              )}
              
              {/* Guest details */}
              <Box sx={{ flex: 1, width: '100%' }}>
                <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                  {guest.first_name} {guest.last_name}
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 2,
                  mb: 3
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'text.secondary'
                  }}>
                    <EmailIcon fontSize="small" />
                    <Typography variant="body2">{guest.email}</Typography>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'text.secondary'
                  }}>
                    <PhoneIcon fontSize="small" />
                    <Typography variant="body2">{guest.phone}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'},
                  gap: 2
                }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <DateIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Check In
                      </Typography>
                      <Typography variant="body2">
                        {guest.check_in_date 
                          ? new Date(guest.check_in_date).toLocaleDateString() 
                          : 'Not specified'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <DateIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Check Out
                      </Typography>
                      <Typography variant="body2">
                        {guest.check_out_date 
                          ? new Date(guest.check_out_date).toLocaleDateString() 
                          : 'Not specified'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
            
            {/* Action button */}
            <Box 
              sx={{ 
                p: 2, 
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >
              <Button
                variant="text"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(`/guests/${guest.id}`)}
                sx={{
                  textTransform: 'none',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: 'translateX(5px)'
                  }
                }}
              >
                View complete profile
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <PersonIcon sx={{ fontSize: 40, opacity: 0.7 }} />
            </Avatar>
            
            <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              No guest currently assigned to this room
            </Typography>
          </Box>
        )}
      </CardContent>
      
      {/* Guest selection dialog */}
      {roomStore.selectedRoom && (
        <GuestSelectionDialog 
          open={dialogOpen}
          onClose={handleCloseDialog}
          room={roomStore.selectedRoom}
        />
      )}
    </Card>
  );
});

export default GuestInfo; 
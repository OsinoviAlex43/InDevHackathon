import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Badge,
  Tabs,
  Tab,
  type SelectChangeEvent
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  CheckCircle as CheckInIcon,
  DoDisturbOn as CheckOutIcon,
  MeetingRoom as RoomIcon,
  Person as PersonIcon,
  CameraAlt as CameraIcon,
  Badge as PassportIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import rootStore from '../stores';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`guest-tabpanel-${index}`}
      aria-labelledby={`guest-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GuestDetailsPage: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { guestStore, roomStore } = rootStore;
  const location = useLocation();
  
  // State
  const [isEditing, setIsEditing] = useState(location.pathname.includes('/edit'));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [editedGuest, setEditedGuest] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    check_in_date: null as Date | null,
    check_out_date: null as Date | null,
    room_id: '',
    photo_url: '',
    passport: {
      number: '',
      issue_date: null as Date | null,
      expiry_date: null as Date | null,
      issuing_country: '',
      nationality: ''
    }
  });
  
  // Find guest by ID
  useEffect(() => {
    if (id) {
      const guestId = BigInt(id);
      const guest = guestStore.guests.find(g => g.id === guestId);
      
      if (guest) {
        guestStore.setSelectedGuest(guest);
        setEditedGuest({
          first_name: guest.first_name,
          last_name: guest.last_name,
          email: guest.email,
          phone: guest.phone,
          check_in_date: guest.check_in_date ? new Date(guest.check_in_date) : null,
          check_out_date: guest.check_out_date ? new Date(guest.check_out_date) : null,
          room_id: guest.room_id ? guest.room_id.toString() : '',
          photo_url: guest.photo_url || '',
          passport: {
            number: guest.passport?.number || '',
            issue_date: guest.passport?.issue_date ? new Date(guest.passport.issue_date) : null,
            expiry_date: guest.passport?.expiry_date ? new Date(guest.passport.expiry_date) : null,
            issuing_country: guest.passport?.issuing_country || '',
            nationality: guest.passport?.nationality || ''
          }
        });
      } else {
        // Guest not found, go back to guests list
        navigate('/guests');
      }
    }
    
    return () => {
      guestStore.setSelectedGuest(null);
    };
  }, [id, navigate, guestStore]);
  
  // Get current guest
  const guest = guestStore.selectedGuest;
  
  // Get current room
  const currentRoom = guest?.room_id 
    ? roomStore.rooms.find(r => r.id === guest.room_id) 
    : null;
  
  // Available rooms for check-in
  const availableRooms = roomStore.rooms.filter(room => room.status === 'free');
  
  // Handle edit mode
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      if (guest) {
        setEditedGuest({
          first_name: guest.first_name,
          last_name: guest.last_name,
          email: guest.email,
          phone: guest.phone,
          check_in_date: guest.check_in_date ? new Date(guest.check_in_date) : null,
          check_out_date: guest.check_out_date ? new Date(guest.check_out_date) : null,
          room_id: guest.room_id ? guest.room_id.toString() : '',
          photo_url: guest.photo_url || '',
          passport: {
            number: guest.passport?.number || '',
            issue_date: guest.passport?.issue_date ? new Date(guest.passport.issue_date) : null,
            expiry_date: guest.passport?.expiry_date ? new Date(guest.passport.expiry_date) : null,
            issuing_country: guest.passport?.issuing_country || '',
            nationality: guest.passport?.nationality || ''
          }
        });
      }
      
      // Navigate to the view URL
      if (location.pathname.includes('/edit')) {
        navigate(`/guests/${id}`);
      }
    } else {
      // Navigate to the edit URL
      navigate(`/guests/${id}/edit`);
    }
    
    setIsEditing(!isEditing);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  
  // Handle save edits
  const handleSaveEdit = () => {
    if (!guest) return;
    
    const updatedGuest: any = {
      first_name: editedGuest.first_name,
      last_name: editedGuest.last_name,
      email: editedGuest.email,
      phone: editedGuest.phone,
      photo_url: editedGuest.photo_url || undefined
    };
    
    // Add passport if data is present
    if (editedGuest.passport.number) {
      updatedGuest.passport = {
        number: editedGuest.passport.number
      };
      
      if (editedGuest.passport.issue_date) {
        updatedGuest.passport.issue_date = editedGuest.passport.issue_date.toISOString();
      }
      
      if (editedGuest.passport.expiry_date) {
        updatedGuest.passport.expiry_date = editedGuest.passport.expiry_date.toISOString();
      }
      
      if (editedGuest.passport.issuing_country) {
        updatedGuest.passport.issuing_country = editedGuest.passport.issuing_country;
      }
      
      if (editedGuest.passport.nationality) {
        updatedGuest.passport.nationality = editedGuest.passport.nationality;
      }
    }
    
    if (editedGuest.check_in_date) {
      updatedGuest.check_in_date = editedGuest.check_in_date.toISOString();
    }
    
    if (editedGuest.check_out_date) {
      updatedGuest.check_out_date = editedGuest.check_out_date.toISOString();
    }
    
    // Handle room assignment changes
    if (editedGuest.room_id && guest.room_id !== BigInt(editedGuest.room_id)) {
      // If the guest already had a room, mark it as free
      if (guest.room_id) {
        roomStore.updateRoom(guest.room_id, { status: 'free' });
      }
      
      // Assign the new room and mark it as occupied
      updatedGuest.room_id = BigInt(editedGuest.room_id);
      roomStore.updateRoom(BigInt(editedGuest.room_id), { status: 'occupied' });
    } else if (!editedGuest.room_id && guest.room_id) {
      // If the room was removed, mark the previous room as free
      roomStore.updateRoom(guest.room_id, { status: 'free' });
      updatedGuest.room_id = undefined;
    }
    
    guestStore.updateGuest(guest.id, updatedGuest);
    setIsEditing(false);
    
    // Navigate back to the view URL if we're currently on the edit URL
    if (location.pathname.includes('/edit')) {
      navigate(`/guests/${id}`);
    }
  };
  
  // Handle delete
  const handleDelete = () => {
    if (!guest) return;
    
    // If guest has a room, mark it as free
    if (guest.room_id) {
      roomStore.updateRoom(guest.room_id, { status: 'free' });
    }
    
    guestStore.deleteGuest(guest.id);
    navigate('/guests');
  };
  
  // Handle edit form text field change
  const handleEditTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties (for passport fields)
      const [parent, child] = name.split('.');
      setEditedGuest({
        ...editedGuest,
        [parent]: {
          ...editedGuest[parent as keyof typeof editedGuest] as any,
          [child]: value
        }
      });
    } else {
      setEditedGuest({
        ...editedGuest,
        [name]: value
      });
    }
  };

  // Handle photo URL update
  const handlePhotoUrlChange = (url: string) => {
    setEditedGuest({
      ...editedGuest,
      photo_url: url
    });
  };
  
  // Handle edit form select change
  const handleEditSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setEditedGuest({
      ...editedGuest,
      [name]: value
    });
  };
  
  // Handle check-in
  const handleCheckIn = () => {
    if (!guest) return;
    
    if (availableRooms.length === 0) {
      alert('No available rooms to check in the guest.');
      return;
    }
    
    // Open room selection dialog for check-in
    setIsEditing(true);
  };
  
  // Handle check-out
  const handleCheckOut = () => {
    if (!guest || !guest.room_id) return;
    
    const roomId = guest.room_id;
    guestStore.checkOutGuest(guest.id);
    roomStore.updateRoom(roomId, { status: 'free' });
  };
  
  // Sample photo URLs for demo purposes
  const samplePhotoUrls = [
    'https://randomuser.me/api/portraits/men/32.jpg',
    'https://randomuser.me/api/portraits/women/44.jpg',
    'https://randomuser.me/api/portraits/men/75.jpg',
    'https://randomuser.me/api/portraits/women/68.jpg'
  ];
  
  if (guestStore.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!guest) {
    return (
      <Box>
        <Alert severity="error">Guest not found!</Alert>
        <Button
          startIcon={<BackIcon />}
          variant="contained"
          onClick={() => navigate('/guests')}
          sx={{ mt: 2 }}
        >
          Back to Guests
        </Button>
      </Box>
    );
  }
  
  return (
    <Box className="glass" sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/guests')} sx={{ mr: 1 }} className="glass">
            <BackIcon />
          </IconButton>
          <Typography variant="h4">
            {guest.first_name} {guest.last_name}
          </Typography>
        </Box>
        
        <Box>
          {isEditing ? (
            <>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<CancelIcon />}
                onClick={handleEditToggle}
                sx={{ mr: 1 }}
                className="glass"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveEdit}
                className="glass"
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
                onClick={handleEditToggle}
                sx={{ mr: 1 }}
                className="glass"
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setConfirmDelete(true)}
                className="glass"
              >
                Delete
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3, overflow: 'hidden' }} className="glass">
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .Mui-selected': {
                  backgroundColor: 'var(--glass-background-hover)'
                }
              }}
            >
              <Tab label="Personal Details" icon={<PersonIcon />} iconPosition="start" />
              <Tab label="Passport & Documents" icon={<PassportIcon />} iconPosition="start" />
            </Tabs>
            
            <Box sx={{ px: 3 }}>
              <TabPanel value={currentTab} index={0}>
                <Grid container spacing={2}>
                  {/* Guest Photo */}
                  <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                    {isEditing ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <Avatar
                          alt={`${editedGuest.first_name} ${editedGuest.last_name}`}
                          src={editedGuest.photo_url || undefined}
                          sx={{ width: 150, height: 150, mb: 2 }}
                          className="glass"
                        >
                          <PersonIcon sx={{ fontSize: 80 }} />
                        </Avatar>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Select a sample photo:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {samplePhotoUrls.map((url, index) => (
                              <Avatar
                                key={index}
                                src={url}
                                sx={{ 
                                  width: 50, 
                                  height: 50,
                                  cursor: 'pointer',
                                  border: editedGuest.photo_url === url ? '2px solid var(--primary-color)' : 'none'
                                }}
                                onClick={() => handlePhotoUrlChange(url)}
                              />
                            ))}
                          </Box>
                          <Button 
                            variant="text" 
                            size="small" 
                            onClick={() => handlePhotoUrlChange('')}
                            sx={{ mt: 1 }}
                          >
                            Clear Photo
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Avatar
                        alt={`${guest.first_name} ${guest.last_name}`}
                        src={guest.photo_url || undefined}
                        sx={{ width: 150, height: 150, mb: 2 }}
                        className="glass"
                      >
                        <PersonIcon sx={{ fontSize: 80 }} />
                      </Avatar>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={8}>
                    {isEditing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="first_name"
                      value={editedGuest.first_name}
                      onChange={handleEditTextChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="last_name"
                      value={editedGuest.last_name}
                      onChange={handleEditTextChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={editedGuest.email}
                      onChange={handleEditTextChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={editedGuest.phone}
                      onChange={handleEditTextChange}
                    />
                  </Grid>
                      </Grid>
                    ) : (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            First Name
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {guest.first_name}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Last Name
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {guest.last_name}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {guest.email}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Phone
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {guest.phone}
                          </Typography>
                        </Grid>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              </TabPanel>
              
              <TabPanel value={currentTab} index={1}>
                <Box sx={{ mb: 3, p: 2, border: '1px solid var(--divider-color)', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PassportIcon sx={{ mr: 1 }} color="primary" />
                    <Typography variant="h6">Passport Information</Typography>
                  </Box>
                  
                  {isEditing ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Passport Number"
                          name="passport.number"
                          value={editedGuest.passport.number}
                          onChange={handleEditTextChange}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Nationality"
                          name="passport.nationality"
                          value={editedGuest.passport.nationality}
                          onChange={handleEditTextChange}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="Issue Date"
                            value={editedGuest.passport.issue_date}
                            onChange={(date) => setEditedGuest({
                              ...editedGuest,
                              passport: {
                                ...editedGuest.passport,
                                issue_date: date
                              }
                            })}
                            slotProps={{
                              textField: { fullWidth: true }
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="Expiry Date"
                            value={editedGuest.passport.expiry_date}
                            onChange={(date) => setEditedGuest({
                              ...editedGuest,
                              passport: {
                                ...editedGuest.passport,
                                expiry_date: date
                              }
                            })}
                            slotProps={{
                              textField: { fullWidth: true }
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Issuing Country"
                          name="passport.issuing_country"
                          value={editedGuest.passport.issuing_country}
                          onChange={handleEditTextChange}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <Box>
                      {guest.passport ? (
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Passport Number
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {guest.passport.number}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Nationality
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {guest.passport.nationality || 'N/A'}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Issue Date
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {guest.passport.issue_date 
                                ? new Date(guest.passport.issue_date).toLocaleDateString() 
                                : 'N/A'
                              }
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Expiry Date
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {guest.passport.expiry_date 
                                ? new Date(guest.passport.expiry_date).toLocaleDateString() 
                                : 'N/A'
                              }
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Issuing Country
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              {guest.passport.issuing_country || 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      ) : (
                        <Typography variant="body1" color="text.secondary" align="center">
                          No passport information recorded
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </TabPanel>
            </Box>
          </Paper>
          
          {/* Stay Records */}
          <Paper sx={{ p: 3, mb: { xs: 3, md: 0 } }} className="glass">
            <Typography variant="h6" gutterBottom>
              Stay History
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {isEditing ? (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Check-in Date"
                      value={editedGuest.check_in_date}
                      onChange={(date) => setEditedGuest({
                        ...editedGuest,
                        check_in_date: date
                      })}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Check-out Date"
                      value={editedGuest.check_out_date}
                      onChange={(date) => setEditedGuest({
                        ...editedGuest,
                        check_out_date: date
                      })}
                      slotProps={{
                        textField: { fullWidth: true }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ background: 'white', px: 1 }}>Assign Room</InputLabel>
                      <Select
                        name="room_id"
                        value={editedGuest.room_id}
                        onChange={handleEditSelectChange}
                        label="Assign Room"
                        sx={{ minWidth: '250px' }}
                      >
                        <MenuItem value="">No Room</MenuItem>
                        {availableRooms.map((room) => (
                          <MenuItem key={room.id.toString()} value={room.id.toString()}>
                            Room {room.room_number} - {room.room_type}
                          </MenuItem>
                        ))}
                        {currentRoom && (
                          <MenuItem key={currentRoom.id.toString()} value={currentRoom.id.toString()}>
                            Room {currentRoom.room_number} - {currentRoom.room_type} (Current)
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </LocalizationProvider>
            ) : (
              <>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Check-in Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {guest.check_in_date ? new Date(guest.check_in_date).toLocaleString() : 'Not checked in'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Check-out Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {guest.check_out_date ? new Date(guest.check_out_date).toLocaleString() : 'Not checked out'}
                  </Typography>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                  Record Created
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {new Date(guest.created_at).toLocaleString()}
                  </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                    Last Updated
                  </Typography>
                <Typography variant="body1">
                    {new Date(guest.updated_at).toLocaleString()}
                  </Typography>
              </>
            )}
          </Paper>
        </Grid>
        
        {/* Right Column - Room Assignment & Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }} className="glass">
            <Typography variant="h6" gutterBottom>
              Room Assignment
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {currentRoom ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <RoomIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Room {currentRoom.room_number}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={currentRoom.room_type.charAt(0).toUpperCase() + currentRoom.room_type.slice(1)} 
                    sx={{ ml: 1 }}
                    className="glass"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Price: ${currentRoom.price_per_night} per night
                </Typography>
                
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<RoomIcon />}
                  onClick={() => navigate(`/rooms/${currentRoom.id}`)}
                  fullWidth
                  sx={{ mb: 2, mt: 1 }}
                  className="glass"
                >
                  View Room Details
                </Button>
                
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<CheckOutIcon />}
                  onClick={handleCheckOut}
                  fullWidth
                  className="glass"
                >
                  Check Out
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No room assigned
                </Typography>
                
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckInIcon />}
                  onClick={handleCheckIn}
                  fullWidth
                  disabled={availableRooms.length === 0}
                  sx={{ mt: 2 }}
                  className="glass"
                >
                  {availableRooms.length === 0 ? 'No Rooms Available' : 'Check In'}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        PaperProps={{ className: "glass", sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Delete Guest</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {guest.first_name} {guest.last_name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)} color="inherit" className="glass">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" className="glass">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default GuestDetailsPage; 
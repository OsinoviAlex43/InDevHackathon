import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { makeAutoObservable, runInAction, observable, action, computed, reaction } from 'mobx';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  IconButton,
  Tooltip,
  type SelectChangeEvent,
  Avatar,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  FilterList as FilterIcon, 
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckInIcon,
  DoDisturbOn as CheckOutIcon,
  Person as PersonIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

import rootStore from '../stores';
import type {Guest, GuestSortOptions, GuestFilters} from '../types/GuestTypes';

// Extended interface for GuestStore to include methods used in the component
interface GuestStoreExtended {
  filteredGuests?: Guest[];
  isLoading?: boolean;
  filters?: GuestFilters;
  sortOptions?: GuestSortOptions;
  setFilters: (filters: GuestFilters) => void;
  setSortOptions: (options: GuestSortOptions) => void;
  checkInGuest?: (guestId: bigint, roomId: bigint) => void;
  checkOutGuest?: (guestId: bigint) => void;
  deleteGuest?: (guestId: bigint) => void;
  addGuest?: (guestData: any) => void;
  ensureInitialized: () => void;
  loadMockData: () => void;
}

// UI state store for Guests page
class GuestsPageStore {
  // Filter dialog state
  filterDialogOpen = false;
  createGuestDialogOpen = false;
  
  // Filter form state
  checkInFrom: Date | null = null;
  checkInTo: Date | null = null;
  checkOutFrom: Date | null = null;
  checkOutTo: Date | null = null;
  hasRoomFilter: string = 'all';
  searchQuery: string = '';
  
  // Sort state
  sortField: keyof Guest = 'last_name';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // New guest form state
  newGuest = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    check_in_date: '',
    check_out_date: '',
    room_id: ''
  };
  formErrors: Record<string, string> = {};
  
  constructor(private guestStore: GuestStoreExtended) {
    makeAutoObservable(this, {}, { autoBind: true });
    
    // Safely initialize sorting from store
    if (this.guestStore && this.guestStore.sortOptions) {
      this.sortField = this.guestStore.sortOptions.field as keyof Guest || 'last_name';
      this.sortDirection = this.guestStore.sortOptions.direction || 'asc';
    }
    
    // Set up reaction to sync search query with store filters
    reaction(
      () => this.searchQuery,
      (query) => {
        if (this.guestStore && this.guestStore.setFilters) {
          this.guestStore.setFilters({
            ...(this.guestStore.filters || {}),
            searchQuery: query || undefined
          });
        }
      }
    );
  }
  
  // Dialog actions
  setFilterDialogOpen(open: boolean) {
    this.filterDialogOpen = open;
  }
  
  setCreateGuestDialogOpen(open: boolean) {
    this.createGuestDialogOpen = open;
    
    if (!open) {
      this.resetNewGuestForm();
    }
  }
  
  // Filter actions
  setCheckInFrom(date: Date | null) {
    this.checkInFrom = date;
  }
  
  setCheckInTo(date: Date | null) {
    this.checkInTo = date;
  }
  
  setCheckOutFrom(date: Date | null) {
    this.checkOutFrom = date;
  }
  
  setCheckOutTo(date: Date | null) {
    this.checkOutTo = date;
  }
  
  setHasRoomFilter(value: string) {
    this.hasRoomFilter = value;
  }
  
  setSearchQuery(query: string) {
    this.searchQuery = query;
  }
  
  // Apply all filters to the main store
  applyFilters() {
    this.guestStore.setFilters({
      checkInFrom: this.checkInFrom ? this.checkInFrom.toISOString() : undefined,
      checkInTo: this.checkInTo ? this.checkInTo.toISOString() : undefined,
      checkOutFrom: this.checkOutFrom ? this.checkOutFrom.toISOString() : undefined,
      checkOutTo: this.checkOutTo ? this.checkOutTo.toISOString() : undefined,
      hasRoom: this.hasRoomFilter === 'has' ? true : this.hasRoomFilter === 'none' ? false : undefined,
      searchQuery: this.searchQuery || undefined
    });
    
    this.setFilterDialogOpen(false);
  }
  
  // Reset all filters
  resetFilters() {
    this.checkInFrom = null;
    this.checkInTo = null;
    this.checkOutFrom = null;
    this.checkOutTo = null;
    this.hasRoomFilter = 'all';
    this.searchQuery = '';
    
    this.guestStore.setFilters({});
    this.setFilterDialogOpen(false);
  }
  
  // Sort actions
  setSort(field: keyof Guest) {
    const newDirection = this.sortField === field && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortField = field;
    this.sortDirection = newDirection;
    
    this.guestStore.setSortOptions({
      field,
      direction: newDirection
    });
  }
  
  // New guest form actions - use runInAction for batch updates
  updateNewGuestField(name: string, value: string) {
    runInAction(() => {
      this.newGuest = {
        ...this.newGuest,
      [name]: value
      };
    
    // Clear error for this field if any
      if (this.formErrors[name]) {
        this.formErrors = {
          ...this.formErrors,
        [name]: ''
        };
      }
    });
  }
  
  validateNewGuestForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!this.newGuest.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    
    if (!this.newGuest.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    
    if (!this.newGuest.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(this.newGuest.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!this.newGuest.phone.trim()) {
      errors.phone = 'Phone is required';
    }
    
    this.formErrors = errors;
    return Object.keys(errors).length === 0;
  }
  
  createGuest() {
    if (!this.validateNewGuestForm()) return;
    
    const guestData: any = {
      first_name: this.newGuest.first_name,
      last_name: this.newGuest.last_name,
      email: this.newGuest.email,
      phone: this.newGuest.phone
    };
    
    if (this.newGuest.check_in_date) {
      guestData.check_in_date = this.newGuest.check_in_date;
    }
    
    if (this.newGuest.check_out_date) {
      guestData.check_out_date = this.newGuest.check_out_date;
    }
    
    if (this.newGuest.room_id) {
      guestData.room_id = BigInt(this.newGuest.room_id);
    }
    
    if (this.guestStore.addGuest) {
      this.guestStore.addGuest(guestData);
    }
    this.setCreateGuestDialogOpen(false);
  }
  
  resetNewGuestForm() {
    this.newGuest = {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      check_in_date: '',
      check_out_date: '',
      room_id: ''
    };
    this.formErrors = {};
  }
  
  // Helper computed properties
  get hasActiveFilters() {
    return !!(
      this.checkInFrom || 
      this.checkInTo || 
      this.checkOutFrom || 
      this.checkOutTo || 
      this.hasRoomFilter !== 'all' || 
      this.searchQuery
    );
  }
  
  get activeFilterCount() {
    let count = 0;
    if (this.checkInFrom || this.checkInTo) count++;
    if (this.checkOutFrom || this.checkOutTo) count++;
    if (this.hasRoomFilter !== 'all') count++;
    if (this.searchQuery) count++;
    return count;
  }
}

const GuestsPage: React.FC = observer(() => {
  const { guestStore, roomStore } = rootStore;
  const navigate = useNavigate();
  const [pageStore] = useState(() => new GuestsPageStore(guestStore));
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  useEffect(() => {
    // Инициализируем соединение с API и загружаем данные гостей
    guestStore.ensureInitialized();
  }, [guestStore]);
  
  const { isLoading, filteredGuests = [] } = guestStore;
  
  // Actions delegated to the store
  const handleCheckIn = (guest: Guest) => {
    // If guest already has a room, do nothing
    if (guest.room_id) return;
    
    // For demo purposes, we'll assign a random available room
    const availableRooms = roomStore.rooms.filter(room => room.status === 'free');
    
    if (availableRooms.length === 0) {
      alert('No available rooms to check in guest');
      return;
    }
    
    const randomRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
    if (guestStore.checkInGuest) {
      guestStore.checkInGuest(guest.id, randomRoom.id);
    }
  };
  
  const handleCheckOut = (guest: Guest) => {
    // Only allow checkout if guest has a room
    if (!guest.room_id) return;
    
    if (guestStore.checkOutGuest) {
      guestStore.checkOutGuest(guest.id);
    }
  };
  
  const handleViewGuest = (guestId: bigint) => {
    navigate(`/guests/${guestId}`);
  };
  
  const handleEditGuest = (guestId: bigint) => {
    navigate(`/guests/${guestId}/edit`);
  };
  
  const handleDeleteGuest = (guest: Guest) => {
    if (confirm(`Are you sure you want to delete guest ${guest.first_name} ${guest.last_name}?`)) {
      if (guestStore.deleteGuest) {
        guestStore.deleteGuest(guest.id);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Guests</Typography>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={pageStore.hasActiveFilters ? 'contained' : 'outlined'}
            startIcon={<FilterIcon />}
            onClick={() => pageStore.setFilterDialogOpen(true)}
            size={isMobile ? "small" : "medium"}
          >
            Filters
            {pageStore.activeFilterCount > 0 && (
              <Chip 
                label={pageStore.activeFilterCount} 
                color="secondary" 
                size="small" 
                sx={{ ml: 1, height: 18, minWidth: 18 }}
              />
            )}
          </Button>
        </Box>
      </Box>
      
      <Paper 
        sx={{ 
          mb: 3, 
          p: 2,
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="glass"
      >
        <TextField
          fullWidth
          placeholder="Search by name, email, or phone number..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          value={pageStore.searchQuery}
          onChange={(e) => pageStore.setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
            }
          }}
        />
      </Paper>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : isSmall ? (
        // Card view for small screens
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredGuests.length === 0 ? (
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: '16px',
                textAlign: 'center'
              }}
              className="glass"
            >
              <Typography variant="subtitle1">No guests found</Typography>
            </Paper>
          ) : (
            filteredGuests.map((guest: Guest) => (
              <Paper
                key={guest.id.toString()}
                sx={{ 
                  borderRadius: '16px',
                  overflow: 'hidden'
                }}
                className="glass"
              >
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {guest.first_name[0]}{guest.last_name[0]}
                      </Avatar>
                      <Typography variant="h6">{guest.first_name} {guest.last_name}</Typography>
                    </Box>
                    
                    <Box>
                      {guest.room_id ? (
                        <Chip 
                          label={`Room ${roomStore.rooms.find(room => room.id === guest.room_id)?.room_number || guest.room_id}`} 
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ backdropFilter: 'blur(10px)' }}
                        />
                      ) : (
                        <Chip label="No Room" variant="outlined" size="small" />
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body2">{guest.email}</Typography>
                    </Box>
                    
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Typography variant="body2">{guest.phone}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex' }}>
                      <Box sx={{ width: '50%' }}>
                        <Typography variant="caption" color="text.secondary">Check-In</Typography>
                        <Typography variant="body2">{guest.check_in_date ? new Date(guest.check_in_date).toLocaleDateString() : 'N/A'}</Typography>
                      </Box>
                      
                      <Box sx={{ width: '50%' }}>
                        <Typography variant="caption" color="text.secondary">Check-Out</Typography>
                        <Typography variant="body2">{guest.check_out_date ? new Date(guest.check_out_date).toLocaleDateString() : 'N/A'}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <IconButton 
                        onClick={() => handleViewGuest(guest.id)} 
                        size="small"
                        className="glass-icon-button"
                        sx={{ backdropFilter: 'blur(8px)', mx: 0.5 }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton 
                        onClick={() => handleEditGuest(guest.id)} 
                        size="small"
                        className="glass-icon-button"
                        sx={{ backdropFilter: 'blur(8px)', mx: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      
                      <IconButton 
                        onClick={() => handleDeleteGuest(guest)} 
                        size="small"
                        className="glass-icon-button"
                        sx={{ backdropFilter: 'blur(8px)', mx: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    <Box>
                      {!guest.room_id ? (
                        <Button
                          startIcon={<CheckInIcon />}
                          variant="outlined"
                          color="success"
                          size="small"
                          onClick={() => handleCheckIn(guest)}
                        >
                          Check In
                        </Button>
                      ) : (
                        <Button
                          startIcon={<CheckOutIcon />}
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleCheckOut(guest)}
                          sx={{
                            '.MuiButton-startIcon': {
                              color: theme.palette.mode === 'dark' ? 'white' : undefined,
                            },
                            color: theme.palette.mode === 'dark' ? 'white' : undefined
                          }}
                        >
                          Check Out
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Paper>
            ))
          )}
        </Box>
      ) : (
        <Paper
          sx={{ 
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative'
          }}
          className="glass"
        >
          <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
            <Table stickyHeader size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={pageStore.sortField === 'last_name'}
                      direction={pageStore.sortField === 'last_name' ? pageStore.sortDirection : 'asc'}
                      onClick={() => pageStore.setSort('last_name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <TableSortLabel
                        active={pageStore.sortField === 'email'}
                        direction={pageStore.sortField === 'email' ? pageStore.sortDirection : 'asc'}
                        onClick={() => pageStore.setSort('email')}
                      >
                        Email
                      </TableSortLabel>
                    </TableCell>
                  )}
                  {!isMobile && (
                    <TableCell>
                      <TableSortLabel
                        active={pageStore.sortField === 'phone'}
                        direction={pageStore.sortField === 'phone' ? pageStore.sortDirection : 'asc'}
                        onClick={() => pageStore.setSort('phone')}
                      >
                        Phone
                      </TableSortLabel>
                    </TableCell>
                  )}
                  <TableCell>
                    <TableSortLabel
                      active={pageStore.sortField === 'room_id'}
                      direction={pageStore.sortField === 'room_id' ? pageStore.sortDirection : 'asc'}
                      onClick={() => pageStore.setSort('room_id')}
                    >
                      Room
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={pageStore.sortField === 'check_in_date'}
                      direction={pageStore.sortField === 'check_in_date' ? pageStore.sortDirection : 'asc'}
                      onClick={() => pageStore.setSort('check_in_date')}
                    >
                      Check-In
                    </TableSortLabel>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <TableSortLabel
                        active={pageStore.sortField === 'check_out_date'}
                        direction={pageStore.sortField === 'check_out_date' ? pageStore.sortDirection : 'asc'}
                        onClick={() => pageStore.setSort('check_out_date')}
                      >
                        Check-Out
                      </TableSortLabel>
                    </TableCell>
                  )}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 4 : 7} align="center">
                      <Typography variant="subtitle1" sx={{ py: 2 }}>
                        No guests found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGuests.map((guest: Guest) => (
                    <TableRow key={guest.id.toString()} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          {guest.first_name} {guest.last_name}
                        </Box>
                      </TableCell>
                      {!isMobile && (
                        <TableCell>{guest.email}</TableCell>
                      )}
                      {!isMobile && (
                        <TableCell>{guest.phone}</TableCell>
                      )}
                      <TableCell>
                        {guest.room_id ? (
                          <Chip 
                            label={`Room ${roomStore.rooms.find(room => room.id === guest.room_id)?.room_number || guest.room_id}`} 
                            color="primary"
                            variant="outlined"
                            size="small" 
                            sx={{ backdropFilter: 'blur(10px)' }}
                          />
                        ) : (
                          <Chip label="No Room" variant="outlined" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {guest.check_in_date ? new Date(guest.check_in_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          {guest.check_out_date ? new Date(guest.check_out_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Box>
                          <Tooltip title="View">
                            <IconButton 
                              onClick={() => handleViewGuest(guest.id)} 
                              size="small"
                              className="glass-icon-button"
                              sx={{ 
                                backdropFilter: 'blur(8px)',
                                mx: 0.5
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {!isMobile && (
                            <Tooltip title="Edit">
                              <IconButton 
                                onClick={() => handleEditGuest(guest.id)} 
                                size="small"
                                className="glass-icon-button"
                                sx={{ 
                                  backdropFilter: 'blur(8px)',
                                  mx: 0.5
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {!isMobile && (
                            <Tooltip title="Delete">
                              <IconButton 
                                onClick={() => handleDeleteGuest(guest)} 
                                size="small"
                                className="glass-icon-button"
                                sx={{ 
                                  backdropFilter: 'blur(8px)',
                                  mx: 0.5
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {!guest.room_id ? (
                            <Tooltip title="Check In">
                              <IconButton 
                                onClick={() => handleCheckIn(guest)} 
                                size="small" 
                                color="success"
                                className="glass-icon-button"
                                sx={{ 
                                  backdropFilter: 'blur(8px)',
                                  mx: 0.5
                                }}
                              >
                                <CheckInIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Check Out">
                              <IconButton 
                                onClick={() => handleCheckOut(guest)} 
                                size="small" 
                                color="error"
                                className="glass-icon-button"
                                sx={{ 
                                  backdropFilter: 'blur(8px)',
                                  mx: 0.5
                                }}
                              >
                                <CheckOutIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
      
      {/* Filter Dialog */}
      <Dialog 
        open={pageStore.filterDialogOpen} 
        onClose={() => pageStore.setFilterDialogOpen(false)}
        fullWidth
        fullScreen={isSmall}
        maxWidth="sm"
        PaperProps={{
          className: "glass",
          sx: {
            borderRadius: isSmall ? 0 : '16px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Filter Guests
          {isSmall && (
            <IconButton onClick={() => pageStore.setFilterDialogOpen(false)}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle2" gutterBottom>
                Check-In Date Range
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: isSmall ? 'column' : 'row' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From"
                    value={pageStore.checkInFrom}
                    onChange={(date) => pageStore.setCheckInFrom(date)}
                    slotProps={{
                      textField: { 
                        variant: 'outlined', 
                        fullWidth: true,
                        size: 'small',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          }
                        }
                      }
                    }}
                  />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To"
                    value={pageStore.checkInTo}
                    onChange={(date) => pageStore.setCheckInTo(date)}
                    slotProps={{
                      textField: { 
                        variant: 'outlined', 
                        fullWidth: true,
                        size: 'small',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          }
                        }
                      }
                    }}
                    minDate={pageStore.checkInFrom || undefined}
                  />
                </LocalizationProvider>
              </Box>
            </Grid>
            
            <Grid sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle2" gutterBottom>
                Check-Out Date Range
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: isSmall ? 'column' : 'row' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From"
                    value={pageStore.checkOutFrom}
                    onChange={(date) => pageStore.setCheckOutFrom(date)}
                    slotProps={{
                      textField: { 
                        variant: 'outlined', 
                        fullWidth: true,
                        size: 'small',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          }
                        }
                      }
                    }}
                    minDate={pageStore.checkInFrom || undefined}
                  />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="To"
                    value={pageStore.checkOutTo}
                    onChange={(date) => pageStore.setCheckOutTo(date)}
                    slotProps={{
                      textField: { 
                        variant: 'outlined', 
                        fullWidth: true,
                        size: 'small',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                          }
                        }
                      }
                    }}
                    minDate={pageStore.checkOutFrom || pageStore.checkInFrom || undefined}
                  />
                </LocalizationProvider>
              </Box>
            </Grid>
            
            <Grid sx={{ gridColumn: '1 / -1' }}>
              <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                <InputLabel>Room Status</InputLabel>
                <Select
                  value={pageStore.hasRoomFilter}
                  onChange={(e) => pageStore.setHasRoomFilter(e.target.value)}
                  label="Room Status"
                >
                  <MenuItem value="all">All Guests</MenuItem>
                  <MenuItem value="has">With Room</MenuItem>
                  <MenuItem value="none">Without Room</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => pageStore.resetFilters()} color="inherit">
            Reset
          </Button>
          <Button onClick={() => pageStore.applyFilters()} color="primary" variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Guest Dialog */}
      <Dialog 
        open={pageStore.createGuestDialogOpen} 
        onClose={() => pageStore.setCreateGuestDialogOpen(false)}
        fullWidth
        fullScreen={isSmall}
        maxWidth="sm"
        PaperProps={{
          className: "glass",
          sx: {
            borderRadius: isSmall ? 0 : '16px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Add New Guest
          {isSmall && (
            <IconButton onClick={() => pageStore.setCreateGuestDialogOpen(false)}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid sx={{ gridColumn: isSmall ? '1 / -1' : 'span 6' }}>
              <TextField
                name="first_name"
                label="First Name"
                fullWidth
                value={pageStore.newGuest.first_name}
                onChange={(e) => pageStore.updateNewGuestField(e.target.name, e.target.value)}
                error={!!pageStore.formErrors.first_name}
                helperText={pageStore.formErrors.first_name}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />
            </Grid>
            <Grid sx={{ gridColumn: isSmall ? '1 / -1' : 'span 6' }}>
              <TextField
                name="last_name"
                label="Last Name"
                fullWidth
                value={pageStore.newGuest.last_name}
                onChange={(e) => pageStore.updateNewGuestField(e.target.name, e.target.value)}
                error={!!pageStore.formErrors.last_name}
                helperText={pageStore.formErrors.last_name}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />
            </Grid>
            <Grid sx={{ gridColumn: '1 / -1' }}>
              <TextField
                name="email"
                label="Email"
                fullWidth
                value={pageStore.newGuest.email}
                onChange={(e) => pageStore.updateNewGuestField(e.target.name, e.target.value)}
                error={!!pageStore.formErrors.email}
                helperText={pageStore.formErrors.email}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />
            </Grid>
            <Grid sx={{ gridColumn: '1 / -1' }}>
              <TextField
                name="phone"
                label="Phone"
                fullWidth
                value={pageStore.newGuest.phone}
                onChange={(e) => pageStore.updateNewGuestField(e.target.name, e.target.value)}
                error={!!pageStore.formErrors.phone}
                helperText={pageStore.formErrors.phone}
                margin="normal"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px'
                  }
                }}
              />
            </Grid>
            <Grid sx={{ gridColumn: isSmall ? '1 / -1' : 'span 6' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Check-In Date"
                  onChange={(date) => {
                    pageStore.updateNewGuestField('check_in_date', date ? date.toISOString() : '');
                  }}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                      margin: 'normal',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px'
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid sx={{ gridColumn: isSmall ? '1 / -1' : 'span 6' }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Check-Out Date"
                  onChange={(date) => {
                    pageStore.updateNewGuestField('check_out_date', date ? date.toISOString() : '');
                  }}
                  slotProps={{
                    textField: { 
                      fullWidth: true,
                      margin: 'normal',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px'
                        }
                      }
                    }
                  }}
                  minDate={pageStore.newGuest.check_in_date ? new Date(pageStore.newGuest.check_in_date) : undefined}
                />
              </LocalizationProvider>
            </Grid>
            <Grid sx={{ gridColumn: '1 / -1' }}>
              <FormControl fullWidth margin="normal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
                <InputLabel sx={{ background: 'white', px: 1 }}>Assign Room (Optional)</InputLabel>
                <Select
                  name="room_id"
                  value={pageStore.newGuest.room_id}
                  onChange={(e) => pageStore.updateNewGuestField(e.target.name, e.target.value)}
                  label="Assign Room (Optional)"
                  sx={{ minWidth: '250px' }}
                >
                  <MenuItem value="">None</MenuItem>
                  {roomStore.rooms
                    .filter(room => room.status === 'free')
                    .map(room => (
                      <MenuItem key={room.id.toString()} value={room.id.toString()}>
                        Room {room.room_number} ({room.room_type})
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => pageStore.setCreateGuestDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => pageStore.createGuest()} 
            variant="contained" 
            color="primary"
            sx={{ borderRadius: '12px' }}
          >
            Add Guest
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Guest FAB */}
      <Fab
        color="primary"
        sx={{ 
          position: 'fixed', 
          bottom: 24, 
          right: 24,
          backdropFilter: 'blur(20px)',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
            borderRadius: '50%',
            pointerEvents: 'none'
          }
        }}
        className="glass"
        onClick={() => pageStore.setCreateGuestDialogOpen(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
});

export default GuestsPage; 
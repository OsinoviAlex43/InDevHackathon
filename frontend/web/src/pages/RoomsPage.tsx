import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Typography,
  Grid,
  Paper,
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
  FormHelperText,
  CircularProgress,
  Fab,
  Chip,
  type SelectChangeEvent
} from '@mui/material';
import { Add as AddIcon, FilterList as FilterIcon, Sort as SortIcon } from '@mui/icons-material';

import rootStore from '../stores';
import RoomCard from '../components/rooms/RoomCard';
import type {RoomStatus, RoomType, RoomSortOptions, Room} from '../types/RoomTypes';

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
  { value: 'suit', label: 'Suite' }
];

const SORT_OPTIONS: { field: keyof Room; label: string }[] = [
  { field: 'room_number', label: 'Room Number' },
  { field: 'price_per_night', label: 'Price' },
  { field: 'room_type', label: 'Room Type' },
  { field: 'status', label: 'Status' }
];

const RoomsPage: React.FC = observer(() => {
  const { roomStore } = rootStore;
  const { filteredRooms, isLoading } = roomStore;
  
  // Filter dialog state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [createRoomDialogOpen, setCreateRoomDialogOpen] = useState(false);
  
  // Filter form state
  const [statusFilter, setStatusFilter] = useState<RoomStatus[]>([]);
  const [typeFilter, setTypeFilter] = useState<RoomType[]>([]);
  const [priceMinFilter, setPriceMinFilter] = useState<string>('');
  const [priceMaxFilter, setPriceMaxFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Sort form state
  const [sortField, setSortField] = useState<keyof Room>('room_number');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // New room form state
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    room_type: 'standart' as RoomType,
    status: 'free' as RoomStatus,
    price_per_night: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Handle filter dialog open/close
  const handleOpenFilterDialog = () => {
    setFilterDialogOpen(true);
  };
  
  const handleCloseFilterDialog = () => {
    setFilterDialogOpen(false);
  };
  
  // Handle sort dialog open/close
  const handleOpenSortDialog = () => {
    setSortDialogOpen(true);
  };
  
  const handleCloseSortDialog = () => {
    setSortDialogOpen(false);
  };
  
  // Handle create room dialog open/close
  const handleOpenCreateRoomDialog = () => {
    setCreateRoomDialogOpen(true);
  };
  
  const handleCloseCreateRoomDialog = () => {
    setCreateRoomDialogOpen(false);
    setNewRoom({
      room_number: '',
      room_type: 'standart',
      status: 'free',
      price_per_night: ''
    });
    setFormErrors({});
  };
  
  // Apply filters
  const handleApplyFilters = () => {
    roomStore.setFilters({
      status: statusFilter.length > 0 ? statusFilter : undefined,
      type: typeFilter.length > 0 ? typeFilter : undefined,
      priceMin: priceMinFilter ? Number(priceMinFilter) : undefined,
      priceMax: priceMaxFilter ? Number(priceMaxFilter) : undefined,
      searchQuery: searchQuery || undefined
    });
    
    handleCloseFilterDialog();
  };
  
  // Apply sorting
  const handleApplySort = () => {
    roomStore.setSortOptions({
      field: sortField,
      direction: sortDirection
    });
    
    handleCloseSortDialog();
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setStatusFilter([]);
    setTypeFilter([]);
    setPriceMinFilter('');
    setPriceMaxFilter('');
    setSearchQuery('');
    
    roomStore.setFilters({});
    
    handleCloseFilterDialog();
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    roomStore.setFilters({
      ...roomStore.filters,
      searchQuery: query || undefined
    });
  };
  
  // Handle new room form change for text fields
  const handleNewRoomTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRoom({
      ...newRoom,
      [name]: value
    });
    
    // Clear error for this field if any
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Handle new room form change for select fields
  const handleNewRoomSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setNewRoom({
      ...newRoom,
      [name]: value
    });
    
    // Clear error for this field if any
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Validate new room form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newRoom.room_number.trim()) {
      errors.room_number = 'Room number is required';
    }
    
    if (!newRoom.price_per_night) {
      errors.price_per_night = 'Price is required';
    } else if (isNaN(Number(newRoom.price_per_night)) || Number(newRoom.price_per_night) <= 0) {
      errors.price_per_night = 'Price must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle create room
  const handleCreateRoom = () => {
    if (!validateForm()) return;
    
    roomStore.addRoom({
      room_number: newRoom.room_number,
      room_type: newRoom.room_type,
      status: newRoom.status,
      price_per_night: Number(newRoom.price_per_night)
    });
    
    handleCloseCreateRoomDialog();
  };
  
  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      statusFilter.length > 0 ||
      typeFilter.length > 0 ||
      !!priceMinFilter ||
      !!priceMaxFilter ||
      !!searchQuery
    );
  };
  
  // Get number of active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter.length > 0) count++;
    if (typeFilter.length > 0) count++;
    if (priceMinFilter || priceMaxFilter) count++;
    if (searchQuery) count++;
    return count;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Rooms
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateRoomDialog}
        >
          Add Room
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search Rooms"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by room number or type..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <span role="img" aria-label="search">🔍</span>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleOpenFilterDialog}
              color={hasActiveFilters() ? 'primary' : 'inherit'}
              endIcon={getActiveFilterCount() > 0 && <Chip size="small" label={getActiveFilterCount()} />}
            >
              Filters
            </Button>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={handleOpenSortDialog}
              color="inherit"
            >
              Sort: {SORT_OPTIONS.find(option => option.field === sortField)?.label} ({sortDirection === 'asc' ? 'A-Z' : 'Z-A'})
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : filteredRooms.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No rooms found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your filters or adding a new room
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateRoomDialog}
            sx={{ mt: 2 }}
          >
            Add Room
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredRooms.map(room => (
            <Grid item key={room.id.toString()} xs={12} sm={6} md={4} lg={3}>
              <RoomCard
                room={room}
                isFavorite={roomStore.favoriteRooms.some(r => r.id === room.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={handleCloseFilterDialog} maxWidth="md" fullWidth sx={{ '& .MuiDialog-paper': { width: '750px', maxWidth: '90%' } }}>
        <DialogTitle>Filter Rooms</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label" sx={{ background: 'white', px: 1 }}>Room Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  multiple
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as RoomStatus[])}
                  input={<OutlinedInput label="Room Status" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={ROOM_STATUSES.find(s => s.value === value)?.label} />
                      ))}
                    </Box>
                  )}
                  sx={{ minWidth: '250px' }}
                >
                  {ROOM_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Checkbox checked={statusFilter.indexOf(status.value) > -1} />
                      <ListItemText primary={status.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="type-filter-label" sx={{ background: 'white', px: 1 }}>Room Type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  multiple
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as RoomType[])}
                  input={<OutlinedInput label="Room Type" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={ROOM_TYPES.find(t => t.value === value)?.label} />
                      ))}
                    </Box>
                  )}
                  sx={{ minWidth: '250px' }}
                >
                  {ROOM_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Checkbox checked={typeFilter.indexOf(type.value) > -1} />
                      <ListItemText primary={type.label} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom>
                Min Price
              </Typography>
              <TextField
                fullWidth
                type="number"
                variant="outlined"
                value={priceMinFilter}
                onChange={(e) => setPriceMinFilter(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ minWidth: '200px' }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <Typography variant="subtitle2" gutterBottom>
                Max Price
              </Typography>
              <TextField
                fullWidth
                type="number"
                variant="outlined"
                value={priceMaxFilter}
                onChange={(e) => setPriceMaxFilter(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ minWidth: '200px' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilters} color="inherit">
            Reset
          </Button>
          <Button onClick={handleCloseFilterDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleApplyFilters} variant="contained" color="primary">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Sort Dialog */}
      <Dialog open={sortDialogOpen} onClose={handleCloseSortDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Sort Rooms</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="sort-field-label" sx={{ background: 'white', px: 1 }}>Sort By</InputLabel>
                <Select
                  labelId="sort-field-label"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as keyof Room)}
                  label="Sort By"
                  sx={{ minWidth: '250px' }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={String(option.field)} value={option.field}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="sort-direction-label" sx={{ background: 'white', px: 1 }}>Direction</InputLabel>
                <Select
                  labelId="sort-direction-label"
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as 'asc' | 'desc')}
                  label="Direction"
                  sx={{ minWidth: '250px' }}
                >
                  <MenuItem value="asc">Ascending (A-Z, Low to High)</MenuItem>
                  <MenuItem value="desc">Descending (Z-A, High to Low)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSortDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleApplySort} variant="contained" color="primary">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Create Room Dialog */}
      <Dialog open={createRoomDialogOpen} onClose={handleCloseCreateRoomDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Room</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Room Number"
                name="room_number"
                variant="outlined"
                value={newRoom.room_number}
                onChange={handleNewRoomTextChange}
                error={!!formErrors.room_number}
                helperText={formErrors.room_number}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="room-type-label" sx={{ background: 'white', px: 1 }}>Room Type</InputLabel>
                <Select
                  labelId="room-type-label"
                  name="room_type"
                  value={newRoom.room_type}
                  onChange={handleNewRoomSelectChange}
                  label="Room Type"
                  sx={{ minWidth: '250px' }}
                >
                  {ROOM_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="room-status-label" sx={{ background: 'white', px: 1 }}>Room Status</InputLabel>
                <Select
                  labelId="room-status-label"
                  name="status"
                  value={newRoom.status}
                  onChange={handleNewRoomSelectChange}
                  label="Room Status"
                  sx={{ minWidth: '250px' }}
                >
                  {ROOM_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Price per Night"
                name="price_per_night"
                type="number"
                variant="outlined"
                value={newRoom.price_per_night}
                onChange={handleNewRoomTextChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                error={!!formErrors.price_per_night}
                helperText={formErrors.price_per_night}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateRoomDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateRoom} 
            variant="contained" 
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* FAB for quick room add */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleOpenCreateRoomDialog}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
});

export default RoomsPage; 
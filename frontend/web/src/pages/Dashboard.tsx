import React from 'react';
import { observer } from 'mobx-react-lite';
import { Grid, Paper, Typography, Box, LinearProgress, Card, CardContent, Divider } from '@mui/material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

import rootStore from '../stores';
import RoomCard from '../components/rooms/RoomCard';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard: React.FC = observer(() => {
  const { roomStore, guestStore } = rootStore;
  
  // Get room occupancy stats
  const { roomsOccupancyStats, favoriteRooms, roomTypeDistribution } = roomStore;
  
  // Chart data for room status distribution
  const statusChartData = {
    labels: ['Occupied', 'Free', 'Service', 'Cleaning', 'Booked'],
    datasets: [
      {
        label: 'Rooms by Status',
        data: [
          roomsOccupancyStats.occupied,
          roomsOccupancyStats.free,
          roomsOccupancyStats.service,
          roomsOccupancyStats.cleaning,
          roomsOccupancyStats.booked
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(54, 162, 235, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Chart data for room type distribution
  const typeChartData = {
    labels: ['Standard', 'Deluxe', 'Suite'],
    datasets: [
      {
        label: 'Rooms by Type',
        data: [
          roomTypeDistribution.standart,
          roomTypeDistribution.deluxe,
          roomTypeDistribution.suit
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(153, 102, 255, 0.2)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box className="glass" sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Stats Cards Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Room Statistics */}
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }} className="glass">
            <Typography variant="h6" gutterBottom>
              Room Occupancy
            </Typography>
            <Typography variant="h3" color="primary">
              {roomsOccupancyStats.occupancyRate.toFixed(1)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={roomsOccupancyStats.occupancyRate} 
              sx={{ my: 1, height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" color="text.secondary">
              {roomsOccupancyStats.occupied} of {roomsOccupancyStats.total} rooms occupied
            </Typography>
          </Paper>
        </Grid>
        
        {/* Guest Statistics */}
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }} className="glass">
            <Typography variant="h6" gutterBottom>
              Current Guests
            </Typography>
            <Typography variant="h3" color="primary">
              {guestStore.currentGuests}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Today's Arrivals: {guestStore.todayArrivals}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today's Departures: {guestStore.todayDepartures}
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Temperature Statistics */}
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }} className="glass">
            <Typography variant="h6" gutterBottom>
              Average Room Temperature
            </Typography>
            <Typography variant="h3" color="primary">
              {roomStore.averageRoomTemperature}°C
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Based on all room sensors
              </Typography>
            </Box>
          </Paper>
        </Grid>
        
        {/* Upcoming Bookings */}
        <Grid item xs={12} md={3}>
          <Paper elevation={3} sx={{ p: 2, height: '100%' }} className="glass">
            <Typography variant="h6" gutterBottom>
              Upcoming Guests
            </Typography>
            <Typography variant="h3" color="primary">
              {guestStore.upcomingGuests}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Guests with future check-in dates
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }} className="glass">
            <Typography variant="h6" gutterBottom>
              Room Status Distribution
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie data={statusChartData} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2 }} className="glass">
            <Typography variant="h6" gutterBottom>
              Room Types
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie data={typeChartData} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Favorite Rooms Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Favorite Rooms
        </Typography>
        
        {favoriteRooms.length === 0 ? (
          <Card sx={{ p: 2, bgcolor: 'background.default' }} className="glass">
            <CardContent>
              <Typography variant="body1" align="center">
                No favorite rooms yet. Add rooms from the Rooms page.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {favoriteRooms.map((room) => (
              <Grid item key={room.id.toString()} xs={12} sm={6} md={4} lg={3}>
                <RoomCard room={room} isFavorite={true} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
});

export default Dashboard; 
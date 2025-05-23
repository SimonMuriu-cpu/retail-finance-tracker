import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/transactions/summary`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setSummary(response.data.summary);
      setCategoryData(response.data.categorySummary);
      setLoading(false);
    } catch (err) {
      setError('Error fetching dashboard data');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const incomeData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Income',
        data: [1200, 1900, 1500, 2100, 1800, 2400],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const expenseData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Expenses',
        data: [800, 1200, 900, 1500, 1100, 1300],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }
    ]
  };

  const categoryChartData = {
    labels: ['Sales', 'Utilities', 'Rent', 'Inventory', 'Marketing', 'Other'],
    datasets: [
      {
        data: [3000, 1200, 2400, 1800, 900, 600],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 206, 86)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 159, 64)'
        ]
      }
    ]
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {user?.businessName}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Income
              </Typography>
              <Typography variant="h4" component="div">
                ${summary?.find(s => s._id === 'income')?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4" component="div">
                ${summary?.find(s => s._id === 'expense')?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Net Profit/Loss
              </Typography>
              <Typography
                variant="h4"
                component="div"
                color={
                  (summary?.find(s => s._id === 'income')?.total || 0) -
                    (summary?.find(s => s._id === 'expense')?.total || 0) >= 0
                    ? 'success.main'
                    : 'error.main'
                }
              >
                $
                {(summary?.find(s => s._id === 'income')?.total || 0) -
                  (summary?.find(s => s._id === 'expense')?.total || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Income vs Expenses
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={{
                  labels: incomeData.labels,
                  datasets: [
                    {
                      label: 'Income',
                      data: incomeData.datasets[0].data,
                      borderColor: 'rgb(75, 192, 192)',
                      tension: 0.1
                    },
                    {
                      label: 'Expenses',
                      data: expenseData.datasets[0].data,
                      borderColor: 'rgb(255, 99, 132)',
                      tension: 0.1
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Expenses by Category
            </Typography>
            <Box sx={{ height: 300 }}>
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Transactions
            </Typography>
            {/* Add transaction list component here */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 
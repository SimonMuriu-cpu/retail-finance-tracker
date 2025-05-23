import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Paper,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDropzone } from 'react-dropzone';
import { Add as AddIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const validationSchema = yup.object({
  type: yup.string().required('Type is required'),
  amount: yup
    .number()
    .required('Amount is required')
    .min(0, 'Amount must be positive'),
  description: yup.string().required('Description is required'),
  category: yup.string().required('Category is required'),
  date: yup.date().required('Date is required')
});

const categories = [
  'sales',
  'utilities',
  'rent',
  'inventory',
  'marketing',
  'payroll',
  'maintenance',
  'other'
];

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ocrData, setOcrData] = useState(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: handleFileDrop
  });

  const formik = useFormik({
    initialValues: {
      type: 'expense',
      amount: '',
      description: '',
      category: '',
      date: new Date()
    },
    validationSchema: validationSchema,
    onSubmit: handleSubmit
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/transactions`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setTransactions(response.data.transactions);
      setLoading(false);
    } catch (err) {
      setError('Error fetching transactions');
      setLoading(false);
    }
  }

  async function handleFileDrop(acceptedFiles) {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/transactions/upload-receipt`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setOcrData(response.data.ocrData);
      formik.setValues({
        ...formik.values,
        amount: response.data.ocrData.total || '',
        description: response.data.ocrData.vendor || '',
        date: response.data.ocrData.date || new Date()
      });
    } catch (err) {
      setError('Error processing receipt');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(values) {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/transactions`,
        values,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setOpenDialog(false);
      formik.resetForm();
      fetchTransactions();
    } catch (err) {
      setError('Error creating transaction');
    }
  }

  const columns = [
    { field: 'date', headerName: 'Date', width: 130, valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
    { field: 'type', headerName: 'Type', width: 100 },
    { field: 'amount', headerName: 'Amount', width: 130, valueFormatter: (params) => `$${params.value}` },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'category', headerName: 'Category', width: 130 },
    {
      field: 'receipt',
      headerName: 'Receipt',
      width: 100,
      renderCell: (params) => (
        params.value ? (
          <IconButton
            size="small"
            onClick={() => window.open(params.value.url, '_blank')}
          >
            <UploadIcon />
          </IconButton>
        ) : null
      )
    }
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Transactions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Transaction
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={transactions}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          checkboxSelection
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Transaction</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              mb: 2,
              cursor: 'pointer'
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <CircularProgress />
            ) : (
              <Typography>
                Drag and drop a receipt here, or click to select
              </Typography>
            )}
          </Box>

          <form onSubmit={formik.handleSubmit}>
            <TextField
              select
              fullWidth
              margin="normal"
              name="type"
              label="Type"
              value={formik.values.type}
              onChange={formik.handleChange}
              error={formik.touched.type && Boolean(formik.errors.type)}
              helperText={formik.touched.type && formik.errors.type}
            >
              <MenuItem value="income">Income</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </TextField>

            <TextField
              fullWidth
              margin="normal"
              name="amount"
              label="Amount"
              type="number"
              value={formik.values.amount}
              onChange={formik.handleChange}
              error={formik.touched.amount && Boolean(formik.errors.amount)}
              helperText={formik.touched.amount && formik.errors.amount}
            />

            <TextField
              fullWidth
              margin="normal"
              name="description"
              label="Description"
              value={formik.values.description}
              onChange={formik.handleChange}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
            />

            <TextField
              select
              fullWidth
              margin="normal"
              name="category"
              label="Category"
              value={formik.values.category}
              onChange={formik.handleChange}
              error={formik.touched.category && Boolean(formik.errors.category)}
              helperText={formik.touched.category && formik.errors.category}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </MenuItem>
              ))}
            </TextField>

            <DatePicker
              label="Date"
              value={formik.values.date}
              onChange={(newValue) => {
                formik.setFieldValue('date', newValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  margin="normal"
                  error={formik.touched.date && Boolean(formik.errors.date)}
                  helperText={formik.touched.date && formik.errors.date}
                />
              )}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={formik.isSubmitting}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Transactions; 
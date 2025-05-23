import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';

const profileValidationSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  businessName: yup.string().required('Business name is required')
});

const passwordValidationSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'Password should be of minimum 6 characters length')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required')
});

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const profileFormik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      businessName: user?.businessName || ''
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setProfileError('');
      setProfileSuccess('');
      try {
        await updateProfile(values);
        setProfileSuccess('Profile updated successfully');
      } catch (err) {
        setProfileError(err.response?.data?.message || 'Error updating profile');
      } finally {
        setLoading(false);
      }
    }
  });

  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setPasswordError('');
      setPasswordSuccess('');
      try {
        await changePassword(values.currentPassword, values.newPassword);
        setPasswordSuccess('Password changed successfully');
        passwordFormik.resetForm();
      } catch (err) {
        setPasswordError(err.response?.data?.message || 'Error changing password');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <form onSubmit={profileFormik.handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                name="name"
                label="Name"
                value={profileFormik.values.name}
                onChange={profileFormik.handleChange}
                error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                helperText={profileFormik.touched.name && profileFormik.errors.name}
              />

              <TextField
                fullWidth
                margin="normal"
                name="email"
                label="Email"
                value={profileFormik.values.email}
                onChange={profileFormik.handleChange}
                error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                helperText={profileFormik.touched.email && profileFormik.errors.email}
              />

              <TextField
                fullWidth
                margin="normal"
                name="businessName"
                label="Business Name"
                value={profileFormik.values.businessName}
                onChange={profileFormik.handleChange}
                error={profileFormik.touched.businessName && Boolean(profileFormik.errors.businessName)}
                helperText={profileFormik.touched.businessName && profileFormik.errors.businessName}
              />

              {profileError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {profileError}
                </Alert>
              )}

              {profileSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {profileSuccess}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Update Profile'}
              </Button>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <form onSubmit={passwordFormik.handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                name="currentPassword"
                label="Current Password"
                type="password"
                value={passwordFormik.values.currentPassword}
                onChange={passwordFormik.handleChange}
                error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
              />

              <TextField
                fullWidth
                margin="normal"
                name="newPassword"
                label="New Password"
                type="password"
                value={passwordFormik.values.newPassword}
                onChange={passwordFormik.handleChange}
                error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
              />

              <TextField
                fullWidth
                margin="normal"
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                value={passwordFormik.values.confirmPassword}
                onChange={passwordFormik.handleChange}
                error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
              />

              {passwordError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {passwordError}
                </Alert>
              )}

              {passwordSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {passwordSuccess}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                sx={{ mt: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Change Password'}
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile; 
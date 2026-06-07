import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useThemedStyles } from '../hooks/useThemedStyles';
import api from '../services/api';
import { toast } from 'sonner';

function ResetPasswordPage() {
  const styles = useThemedStyles(getStyles);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const token = searchParams.get('token');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword
      });

      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Invalid Reset Link</h2>
          <p style={styles.text}>
            This password reset link is invalid or missing required information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Your Password</h2>
        <p style={styles.text}>
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <span style={styles.error}>{errors.newPassword}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={styles.input}
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <span style={styles.error}>{errors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  card: {
    backgroundColor: theme.cardBackground,
    padding: '2rem',
    borderRadius: theme.radius,
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    textAlign: 'center',
    color: theme.text,
  },
  text: {
    color: theme.textSecondary,
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  form: {
    marginBottom: '1rem',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: theme.text,
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: theme.radiusSm,
    border: `1px solid ${theme.inputBorder}`,
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    fontSize: '1rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    background: theme.gradient,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  error: {
    display: 'block',
    marginTop: '0.25rem',
    fontSize: '0.75rem',
    color: theme.danger,
  },
});

export default ResetPasswordPage;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useThemedStyles } from '../hooks/useThemedStyles';
import api from '../services/api';
import { toast } from 'sonner';

function ForgotPasswordPage() {
  const styles = useThemedStyles(getStyles);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/request-password-reset', { email });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to send reset email:', error);
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}><Mail size={48} /></div>
          <h2 style={styles.title}>Check Your Email</h2>
          <p style={styles.text}>
            If an account exists with the email <strong>{email}</strong>,
            we've sent password reset instructions.
          </p>
          <p style={styles.text}>
            Please check your inbox and follow the link to reset your password.
          </p>
          <Link to="/login" style={styles.link}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Forgot Password?</h2>
        <p style={styles.text}>
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div style={styles.footer}>
          Remember your password? {' '}
          <Link to="/login" style={styles.link}>
            Back to Login
          </Link>
        </div>
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
    backgroundColor: theme.backgroundSecondary,
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: theme.shadow,
    width: '100%',
    maxWidth: '400px',
  },
  successIcon: {
    fontSize: '3rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    textAlign: 'center',
    color: theme.text,
  },
  text: {
    color: theme.textSecondary,
    marginBottom: '1.5rem',
    textAlign: 'center',
    lineHeight: '1.6',
  },
  form: {
    marginBottom: '1rem',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '4px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.background,
    color: theme.text,
    fontSize: '1rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  footer: {
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: '0.875rem',
  },
  link: {
    color: theme.primary,
    textDecoration: 'none',
    fontWeight: '500',
  },
});

export default ForgotPasswordPage;

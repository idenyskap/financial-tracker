import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import api from '../../services/api';
import { toast } from 'sonner';

function ChangeEmailModal({ currentEmail, onClose, onSuccess }) {
  const styles = useThemedStyles(getStyles);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!newEmail) {
      newErrors.newEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      newErrors.newEmail = 'Invalid email format';
    } else if (newEmail === currentEmail) {
      newErrors.newEmail = 'New email must be different from current email';
    }

    if (!password) {
      newErrors.password = 'Password is required to confirm';
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
      await api.post('/users/request-email-change', {
        newEmail,
        password
      });

      toast.success('Confirmation email sent to your new email address');
      onSuccess();
      onClose();
    } catch (error) {
      if (error.response?.status === 400) {
        setErrors({ password: 'Incorrect password' });
      } else if (error.response?.data?.error?.includes('already in use')) {
        setErrors({ newEmail: 'This email is already in use' });
      } else {
        toast.error('Failed to request email change');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose} />
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Change Email Address</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Current Email</label>
            <input
              type="email"
              value={currentEmail}
              disabled
              style={{ ...styles.input, ...styles.disabledInput }}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>New Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (errors.newEmail) {
                  setErrors(prev => ({ ...prev, newEmail: '' }));
                }
              }}
              style={styles.input}
              placeholder="Enter new email address"
            />
            {errors.newEmail && (
              <span style={styles.error}>{errors.newEmail}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm with Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: '' }));
                }
              }}
              style={styles.input}
              placeholder="Enter your password"
            />
            {errors.password && (
              <span style={styles.error}>{errors.password}</span>
            )}
          </div>

          <div style={styles.info}>
            We'll send a confirmation link to your new email address.
            Your email won't be changed until you confirm it.
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Confirmation'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

const getStyles = (theme) => ({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: '8px',
    width: '90%',
    maxWidth: '450px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    zIndex: 1001,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: `1px solid ${theme.border}`,
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: theme.text,
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: theme.textSecondary,
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  form: {
    padding: '1.5rem',
  },
  formGroup: {
    marginBottom: '1.25rem',
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
    borderRadius: '4px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.background,
    color: theme.text,
    fontSize: '1rem',
    transition: 'border-color 0.2s',
  },
  disabledInput: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    display: 'block',
    marginTop: '0.25rem',
    fontSize: '0.75rem',
    color: theme.danger,
  },
  info: {
    backgroundColor: theme.backgroundTertiary || '#f0f0f0',
    padding: '1rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    color: theme.textSecondary,
    marginBottom: '1.5rem',
    lineHeight: '1.5',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: 'transparent',
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  submitButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
});

export default ChangeEmailModal;

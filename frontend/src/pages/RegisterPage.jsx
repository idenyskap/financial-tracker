import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useLanguage } from '../hooks/useLanguage';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import AuthHeader from '../components/auth/AuthHeader';

const RegisterPage = () => {
  const navigate = useNavigate();
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const passwordRequirements = [
    {
      id: 'length',
      label: t('register.passwordMinLength') || 'At least 6 characters',
      test: (pwd) => pwd.length >= 6
    },
    {
      id: 'lowercase',
      label: t('register.passwordLowercase') || 'One lowercase letter',
      test: (pwd) => /[a-z]/.test(pwd)
    },
    {
      id: 'uppercase',
      label: t('register.passwordUppercase') || 'One uppercase letter',
      test: (pwd) => /[A-Z]/.test(pwd)
    },
    {
      id: 'number',
      label: t('register.passwordNumber') || 'One number',
      test: (pwd) => /\d/.test(pwd)
    }
  ];

  const validateName = (name) => {
    if (!name) return t('register.nameRequired') || 'Name is required';
    if (name.length < 2) return t('register.nameMinLength') || 'Name must be at least 2 characters';
    if (name.length > 50) return t('register.nameMaxLength') || 'Name cannot exceed 50 characters';
    if (!/^[a-zA-Z\s]+$/.test(name)) return t('register.nameLettersOnly') || 'Name can only contain letters and spaces';
    return null;
  };

  const validateEmail = (email) => {
    if (!email) return t('register.emailRequired') || 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('register.emailInvalid') || 'Please enter a valid email';
    return null;
  };

  const validatePassword = (password) => {
    const failedRequirements = passwordRequirements.filter(req => !req.test(password));
    if (failedRequirements.length > 0) {
      return t('register.passwordRequirements') || 'Password does not meet all requirements';
    }
    return null;
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return t('register.confirmPasswordRequired') || 'Please confirm your password';
    if (confirmPassword !== password) return t('register.passwordsDoNotMatch') || 'Passwords do not match';
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = null;

    switch (name) {
      case 'name':
        error = validateName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(value, formData.password);
        break;
    }

    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);

    const newErrors = {
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError
    };

    setErrors(newErrors);

    if (nameError || emailError || passwordError || confirmPasswordError) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      // Success - show success state
      setRegistrationSuccess(true);
      toast.success(t('register.registrationSuccess') || 'Registration successful!');

    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
        if (err.response.data.message.toLowerCase().includes('email')) {
          setErrors(prev => ({ ...prev, email: err.response.data.message }));
        }
      } else {
        toast.error(t('register.networkError') || 'Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Success screen after registration
  if (registrationSuccess) {
    return (
      <div style={styles.container}>
        <AuthHeader currentPage="register" />
        <div style={styles.card}>
          <div style={styles.successContainer}>
            <div style={styles.successIconWrapper}>
              <CheckCircleIcon style={styles.successIcon} />
            </div>
            <h2 style={styles.successTitle}>
              {t('register.registrationComplete') || 'Registration Successful!'}
            </h2>
            <p style={styles.successMessage}>
              {t('register.accountCreated') || 'Your account has been created successfully.'}
            </p>
            <p style={styles.successSubtext}>
              {t('register.canNowLogin') || 'You can now sign in with your email and password.'}
            </p>

            <div style={styles.successActions}>
              <button
                onClick={() => navigate('/login')}
                style={styles.primaryButton}
              >
                {t('register.goToLogin') || 'Go to Login'}
              </button>
              <Link to="/" style={styles.secondaryButton}>
                {t('register.backToHome') || 'Back to Home'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <AuthHeader currentPage="register" />
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>{t('register.createAccount') || 'Create your account'}</h2>
          <p style={styles.subtitle}>
            {t('register.alreadyHaveAccount') || 'Already have an account?'}{' '}
            <Link to="/login" style={styles.link}>
              {t('register.signIn') || 'Sign in'}
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Name field */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('register.name') || 'Full Name'}</label>
            <input
              type="text"
              name="name"
              placeholder={t('register.namePlaceholder') || 'Enter your full name'}
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {})
              }}
              required
            />
            {errors.name && <span style={styles.errorText}>{errors.name}</span>}
          </div>

          {/* Email field */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('register.email') || 'Email Address'}</label>
            <input
              type="email"
              name="email"
              placeholder={t('register.emailPlaceholder') || 'Enter your email'}
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.email ? styles.inputError : {})
              }}
              required
            />
            {errors.email && <span style={styles.errorText}>{errors.email}</span>}
          </div>

          {/* Password field */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('register.password') || 'Password'}</label>
            <input
              type="password"
              name="password"
              placeholder={t('register.passwordPlaceholder') || 'Create a password'}
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.password ? styles.inputError : {})
              }}
              required
            />

            {/* Password requirements checklist */}
            {formData.password && (
              <div style={styles.requirementsList}>
                {passwordRequirements.map(req => (
                  <div
                    key={req.id}
                    style={{
                      ...styles.requirementItem,
                      color: req.test(formData.password) ? styles.successColor : styles.errorColor
                    }}
                  >
                    {req.test(formData.password) ? (
                      <CheckCircleIcon style={styles.requirementIcon} />
                    ) : (
                      <XCircleIcon style={styles.requirementIcon} />
                    )}
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>{t('register.confirmPassword') || 'Confirm Password'}</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder={t('register.confirmPasswordPlaceholder') || 'Confirm your password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              style={{
                ...styles.input,
                ...(errors.confirmPassword ? styles.inputError : {})
              }}
              required
            />
            {errors.confirmPassword && <span style={styles.errorText}>{errors.confirmPassword}</span>}
            {formData.confirmPassword && !errors.confirmPassword && formData.confirmPassword === formData.password && (
              <span style={styles.successText}>
                <CheckCircleIcon style={{ width: 16, height: 16, marginRight: 4 }} />
                {t('register.passwordsMatch') || 'Passwords match'}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? (t('register.creatingAccount') || 'Creating account...') : (t('register.createAccountButton') || 'Create Account')}
          </button>
        </form>
      </div>
    </div>
  );
};

const getStyles = (theme, { isMobile } = {}) => ({
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    padding: isMobile ? '16px' : '20px',
    paddingTop: isMobile ? '60px' : '80px',
    position: 'relative',
  },
  card: {
    backgroundColor: theme.backgroundSecondary,
    padding: isMobile ? '24px' : '40px',
    borderRadius: '12px',
    boxShadow: theme.shadow,
    width: '100%',
    maxWidth: '450px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: '8px',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: theme.text,
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.background,
    color: theme.text,
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '4px',
  },
  successText: {
    color: '#22c55e',
    fontSize: '12px',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  requirementsList: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  requirementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
  },
  requirementIcon: {
    width: '16px',
    height: '16px',
  },
  successColor: '#22c55e',
  errorColor: '#9ca3af',
  link: {
    color: theme.primary,
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginTop: '8px',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
  },
  backLink: {
    color: theme.textSecondary,
    textDecoration: 'none',
    fontSize: '14px',
  },
  // Success screen styles
  successContainer: {
    textAlign: 'center',
    padding: '20px 0',
  },
  successIconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: `${theme.primary}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
  },
  successIcon: {
    width: '40px',
    height: '40px',
    color: theme.primary,
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: '12px',
  },
  successMessage: {
    color: theme.textSecondary,
    fontSize: '14px',
    marginBottom: '4px',
  },
  emailHighlight: {
    color: theme.text,
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
  },
  successSubtext: {
    color: theme.textSecondary,
    fontSize: '14px',
    lineHeight: '1.5',
    marginBottom: '32px',
  },
  successActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  primaryButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
  },
  secondaryButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'none',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  resendText: {
    color: theme.textSecondary,
    fontSize: '13px',
  },
  resendLink: {
    color: theme.primary,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'underline',
  },
});

export default RegisterPage;

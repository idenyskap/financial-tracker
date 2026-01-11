import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useThemedStyles } from '../hooks/useThemedStyles';
import TwoFactorInput from '../components/auth/TwoFactorInput';
import AuthHeader from '../components/auth/AuthHeader';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const styles = useThemedStyles(getStyles);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempCredentials, setTempCredentials] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handle2FASubmit = async (code) => {
    setLoading(true);
    try {
      const result = await login({
        ...tempCredentials,
        twoFactorCode: code
      });

      if (result.success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Invalid 2FA code');
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData);

      if (result.requires2FA) {
        setRequires2FA(true);
        setTempCredentials(formData);
      } else if (result.success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      } else {
        setError(result.error || 'Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  if (requires2FA) {
    return (
      <div style={styles.container}>
        <AuthHeader currentPage="login" />
        <div style={styles.card}>
          <TwoFactorInput
            onSubmit={handle2FASubmit}
            isLoading={loading}
            error={null}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <AuthHeader currentPage="login" />
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Sign in to your account</h2>
          <p style={styles.subtitle}>
            Or{' '}
            <Link to="/register" style={styles.link}>
              create a new account
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form} autoComplete="on">
          <div style={styles.inputGroup}>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={styles.input}
              autoComplete="email"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={styles.passwordInput}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div style={styles.forgotLink}>
            <Link to="/forgot-password" style={styles.link}>
              Forgot your password?
            </Link>
          </div>

          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
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
    maxWidth: '400px',
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
    gap: '16px',
  },
  inputGroup: {
    marginBottom: '4px',
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
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    width: '100%',
    padding: '12px',
    paddingRight: '45px',
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.background,
    color: theme.text,
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.textSecondary,
  },
  forgotLink: {
    textAlign: 'right',
    marginBottom: '8px',
  },
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
  errorMessage: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid #fecaca',
  },
});

export default LoginPage;

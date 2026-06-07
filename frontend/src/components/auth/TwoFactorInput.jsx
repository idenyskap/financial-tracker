import React, { useState, useRef, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const TwoFactorInput = ({ onSubmit, isLoading, error }) => {
  const styles = useThemedStyles(getStyles);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(digit => digit) && index === 5) {
      onSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const digits = pastedData.split('').filter(char => /\d/.test(char));

    const newCode = [...code];
    digits.forEach((digit, i) => {
      if (i < 6) newCode[i] = digit;
    });
    setCode(newCode);

    if (newCode.every(digit => digit)) {
      onSubmit(newCode.join(''));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Shield style={styles.icon} />
        <h2 style={styles.title}>Two-Factor Authentication</h2>
        <p style={styles.description}>
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.inputContainer}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            style={{
              ...styles.input,
              opacity: isLoading ? 0.5 : 1
            }}
            maxLength="1"
            disabled={isLoading}
          />
        ))}
      </div>

      <div style={styles.buttonContainer}>
        <button
          onClick={() => onSubmit(code.join(''))}
          disabled={isLoading || !code.every(digit => digit)}
          style={{
            ...styles.button,
            opacity: (isLoading || !code.every(digit => digit)) ? 0.5 : 1
          }}
        >
          {isLoading ? 'Verifying...' : 'Verify'}
        </button>
      </div>

      <p style={styles.helpText}>
        Lost your device? Use a recovery code instead
      </p>
    </div>
  );
};

const getStyles = (theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  icon: {
    width: '3rem',
    height: '3rem',
    color: theme.primary,
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: theme.text,
    margin: 0,
  },
  description: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
    margin: 0,
  },
  error: {
    backgroundColor: theme.dangerSoft,
    color: theme.danger,
    padding: '0.75rem',
    borderRadius: theme.radiusSm,
    fontSize: '0.875rem',
    border: `1px solid ${theme.errorBorder}`,
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    flexWrap: 'nowrap',
  },
  input: {
    width: '3rem',
    height: '3rem',
    textAlign: 'center',
    fontSize: '1.125rem',
    fontWeight: '600',
    border: `2px solid ${theme.inputBorder}`,
    borderRadius: theme.radiusSm,
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  buttonContainer: {
    textAlign: 'center',
  },
  button: {
    padding: '0.75rem 1.5rem',
    background: theme.gradient,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  helpText: {
    fontSize: '0.75rem',
    textAlign: 'center',
    color: theme.textSecondary,
    margin: 0,
  },
});

export default TwoFactorInput;

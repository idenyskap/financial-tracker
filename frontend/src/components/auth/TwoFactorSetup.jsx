import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from 'sonner';
import { Shield, Copy, CheckCircle } from 'lucide-react';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const TwoFactorSetup = ({ onClose, onSuccess }) => {
  const styles = useThemedStyles(getStyles);
  const [step, setStep] = useState(1);
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copiedCodes, setCopiedCodes] = useState(false);

  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/2fa/setup');
      return response.data;
    },
    onSuccess: (data) => {
      setSetupData(data);
      setStep(2);
    },
    onError: () => {
      toast.error('Failed to initialize 2FA setup');
    }
  });

  const enableMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/auth/2fa/enable', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Two-factor authentication enabled successfully!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to enable 2FA');
    }
  });

  const handleSetup = () => {
    setupMutation.mutate();
  };

  const handleVerification = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    enableMutation.mutate({
      secret: setupData.secret,
      verificationCode,
      recoveryCodes: setupData.recoveryCodes
    });
  };

  const copyRecoveryCodes = () => {
    const codesText = Array.from(setupData.recoveryCodes).join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);
    toast.success('Recovery codes copied to clipboard');
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.headerRow}>
          <Shield style={styles.headerIcon} />
          <h2 style={styles.title}>Enable Two-Factor Authentication</h2>
        </div>

        {step === 1 && (
          <div style={styles.stack}>
            <p style={styles.bodyText}>
              Two-factor authentication adds an extra layer of security to your account.
              You'll need to enter a code from your authenticator app in addition to your password.
            </p>

            <div style={styles.infoBox}>
              <h3 style={styles.infoTitle}>You'll need:</h3>
              <ul style={styles.infoList}>
                <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>A secure place to store recovery codes</li>
              </ul>
            </div>

            <div style={styles.buttonRow}>
              <button
                onClick={onClose}
                style={styles.secondaryButton}
              >
                Cancel
              </button>
              <button
                onClick={handleSetup}
                disabled={setupMutation.isPending}
                style={{ ...styles.primaryButton, ...(setupMutation.isPending ? styles.disabled : {}) }}
              >
                {setupMutation.isPending ? 'Setting up...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && setupData && (
          <div style={styles.stack}>
            <div style={styles.center}>
              <p style={styles.bodyTextCenter}>
                Scan this QR code with your authenticator app
              </p>
              <div style={styles.qrBox}>
                <img src={setupData.qrCode} alt="2FA QR Code" style={styles.qrImage} />
              </div>
              <p style={styles.hint}>
                Can't scan? Enter this code manually: <br />
                <code style={styles.code}>
                  {setupData.secret}
                </code>
              </p>
            </div>

            <div>
              <label style={styles.inputLabel}>
                Enter verification code from your app
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={styles.codeInput}
                maxLength="6"
              />
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={verificationCode.length !== 6}
              style={{ ...styles.primaryButtonFull, ...(verificationCode.length !== 6 ? styles.disabled : {}) }}
            >
              Next: Save Recovery Codes
            </button>
          </div>
        )}

        {step === 3 && setupData && (
          <div style={styles.stack}>
            <div style={styles.warningBox}>
              <p style={styles.warningTitle}>
                Important: Save these recovery codes
              </p>
              <p style={styles.warningText}>
                Use these codes to access your account if you lose your authenticator device.
                Each code can only be used once.
              </p>
            </div>

            <div style={styles.codesBox}>
              <div style={styles.codesGrid}>
                {Array.from(setupData.recoveryCodes).map((code, index) => (
                  <div key={index} style={styles.codeCell}>
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={copyRecoveryCodes}
              style={styles.copyButton}
            >
              {copiedCodes ? (
                <>
                  <CheckCircle style={styles.copyIconSuccess} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy style={styles.copyIcon} />
                  Copy Recovery Codes
                </>
              )}
            </button>

            <div style={styles.buttonRow}>
              <button
                onClick={() => setStep(2)}
                style={styles.secondaryButton}
              >
                Back
              </button>
              <button
                onClick={handleVerification}
                disabled={enableMutation.isPending}
                style={{ ...styles.successButton, ...(enableMutation.isPending ? styles.disabled : {}) }}
              >
                {enableMutation.isPending ? 'Enabling...' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getStyles = (theme) => ({
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: theme.overlay,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modal: {
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: theme.radius,
    boxShadow: theme.shadowLarge,
    padding: '1.5rem',
    maxWidth: '28rem',
    width: '100%',
    margin: '0 1rem',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  headerIcon: {
    width: '1.5rem',
    height: '1.5rem',
    color: theme.primary,
    marginRight: '0.5rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: theme.text,
    margin: 0,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  bodyText: {
    color: theme.textSecondary,
    margin: 0,
    lineHeight: '1.5',
  },
  bodyTextCenter: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
    marginBottom: '1rem',
  },
  infoBox: {
    backgroundColor: theme.primarySoft,
    padding: '1rem',
    borderRadius: theme.radiusSm,
  },
  infoTitle: {
    fontWeight: '500',
    color: theme.text,
    marginTop: 0,
    marginBottom: '0.5rem',
  },
  infoList: {
    listStyle: 'disc',
    listStylePosition: 'inside',
    fontSize: '0.875rem',
    color: theme.textSecondary,
    margin: 0,
    paddingLeft: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  buttonRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  secondaryButton: {
    flex: 1,
    padding: '0.5rem 1rem',
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  primaryButton: {
    flex: 1,
    padding: '0.5rem 1rem',
    background: theme.gradient,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  primaryButtonFull: {
    width: '100%',
    padding: '0.5rem 1rem',
    background: theme.gradient,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  successButton: {
    flex: 1,
    padding: '0.5rem 1rem',
    backgroundColor: theme.success,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  center: {
    textAlign: 'center',
  },
  qrBox: {
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: theme.radiusSm,
    display: 'inline-block',
  },
  qrImage: {
    width: '12rem',
    height: '12rem',
  },
  hint: {
    fontSize: '0.75rem',
    color: theme.textTertiary,
    marginTop: '0.5rem',
  },
  code: {
    fontSize: '0.75rem',
    backgroundColor: theme.backgroundTertiary,
    color: theme.text,
    padding: '0.25rem 0.5rem',
    borderRadius: theme.radiusSm,
    fontFamily: theme.fontMono,
  },
  inputLabel: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: theme.text,
    marginBottom: '0.5rem',
  },
  codeInput: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: theme.radiusSm,
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    textAlign: 'center',
    fontSize: '1.125rem',
    outline: 'none',
  },
  warningBox: {
    backgroundColor: theme.warningSoft,
    padding: '1rem',
    borderRadius: theme.radiusSm,
  },
  warningTitle: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: theme.warningText,
    marginTop: 0,
    marginBottom: '0.25rem',
  },
  warningText: {
    fontSize: '0.75rem',
    color: theme.warningText,
    margin: 0,
    lineHeight: '1.4',
  },
  codesBox: {
    backgroundColor: theme.backgroundSecondary,
    padding: '1rem',
    borderRadius: theme.radiusSm,
  },
  codesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
    fontFamily: theme.fontMono,
    fontSize: '0.875rem',
  },
  codeCell: {
    textAlign: 'center',
    color: theme.text,
  },
  copyButton: {
    width: '100%',
    padding: '0.5rem 1rem',
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.95rem',
  },
  copyIcon: {
    width: '1rem',
    height: '1rem',
    marginRight: '0.5rem',
  },
  copyIconSuccess: {
    width: '1rem',
    height: '1rem',
    marginRight: '0.5rem',
    color: theme.success,
  },
});

export default TwoFactorSetup;

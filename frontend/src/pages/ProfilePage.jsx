import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Mail, Shield, KeyRound, Globe } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useLanguage } from '../hooks/useLanguage';

import TwoFactorSetup from '../components/auth/TwoFactorSetup';
import CurrencySettings from '../components/settings/CurrencySettings';
import NotificationSettings from '../components/profile/NotificationSettings';
import ChangeEmailModal from '../components/profile/ChangeEmailModal';
import PasswordChangeModal from '../components/profile/PasswordChangeModal';
import LanguageSelector from '../components/language/LanguageSelector';

const ProfilePage = () => {
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [password, setPassword] = useState('');

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/users/profile');
      return response.data;
    }
  });

  const { data: twoFactorStatus } = useQuery({
    queryKey: ['2fa-status'],
    queryFn: async () => {
      try {
        const response = await api.get('/auth/2fa/status');
        return response.data;
      } catch (error) {
        console.error('Failed to fetch 2FA status:', error);
        // Return default status if endpoint fails
        return { enabled: false, recoveryCodesRemaining: 0 };
      }
    }
  });

  const updateProfile = useMutation({
    mutationFn: async (newName) => {
      const response = await api.put('/users/profile', { name: newName });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Profile updated');
      queryClient.setQueryData(['profile'], data);
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const disable2FAMutation = useMutation({
    mutationFn: async (password) => {
      const response = await api.post('/auth/2fa/disable', { password });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Two-factor authentication disabled');
      queryClient.invalidateQueries(['2fa-status']);
      setShowDisable2FA(false);
      setPassword('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to disable 2FA');
    }
  });

  const tabs = [
    { id: 'profile', label: t('profile.tabProfile'), icon: <User size={16} /> },
    { id: 'security', label: t('profile.tabSecurity'), icon: <Lock size={16} /> },
    { id: 'notifications', label: t('profile.tabNotifications'), icon: <Mail size={16} /> },
    { id: 'currency', label: t('profile.tabCurrency'), icon: <Globe size={16} /> },
  ];

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner}></div>
        <p>{t('profile.loadingProfile')}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{t('profile.title')}</h1>
          <p style={styles.subtitle}>{t('profile.profileSubtitle')}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabsNav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab.id ? styles.tabButtonActive : styles.tabButtonInactive)
              }}
            >
              <span style={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'profile' && (
        <div style={styles.contentCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}><User size={20} /></span>
              {t('profile.profileInformation')}
            </h3>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('profile.fullName')}</label>
              <input
                type="text"
                value={profile?.name || ''}
                onChange={(e) => queryClient.setQueryData(['profile'], (old) => ({ ...old, name: e.target.value }))}
                style={styles.input}
                placeholder={t('profile.fullNamePlaceholder')}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('profile.emailAddress')}</label>
              <input
                type="email"
                value={profile?.email || ''}
                readOnly
                style={{...styles.input, ...styles.inputReadonly}}
                placeholder={t('profile.emailPlaceholder')}
              />
              {!profile?.emailVerified && (
                <div style={styles.warningText}>{t('profile.emailNotVerified')}</div>
              )}
            </div>
            <div style={styles.buttonGroup}>
              <button
                onClick={() => updateProfile.mutate(profile.name)}
                style={styles.primaryButton}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? t('profile.updatingProfile') : t('profile.updateProfile')}
              </button>
              <button
                onClick={() => setShowEmailModal(true)}
                style={styles.secondaryButton}
              >
                {t('profile.changeEmail')}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div style={styles.contentCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}><Mail size={20} /></span>
              {t('profile.notificationSettings')}
            </h3>
          </div>
          <div style={styles.cardContent}>
            <NotificationSettings />
          </div>
        </div>
      )}

      {activeTab === 'currency' && (
        <>
          <div style={styles.contentCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}><Globe size={20} /></span>
                {t('profile.currencySettings')}
              </h3>
            </div>
            <div style={styles.cardContent}>
              <CurrencySettings />
            </div>
          </div>

          <div style={styles.contentCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}>🌐</span>
                {t('profile.languageSettings')}
              </h3>
            </div>
            <div style={styles.cardContent}>
              <LanguageSelector />
            </div>
          </div>
        </>
      )}

      {activeTab === 'security' && (
        <div style={styles.securitySection}>
          <div style={styles.contentCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitleSection}>
                <h3 style={styles.cardTitle}>
                  <span style={styles.cardIcon}><Shield size={20} /></span>
                  {t('profile.twoFactorAuth')}
                </h3>
                <p style={styles.cardSubtitle}>
                  {t('profile.twoFactorSubtext')}
                </p>
              </div>
              <div style={styles.statusSection}>
                {twoFactorStatus?.enabled ? (
                  <div>
                    <span style={styles.statusBadgeEnabled}>
                      {t('profile.twoFactorEnabled')}
                    </span>
                    <p style={styles.recoveryText}>
                      {t('profile.recoveryCodesRemaining', { count: twoFactorStatus.recoveryCodesRemaining })}
                    </p>
                  </div>
                ) : (
                  <span style={styles.statusBadgeDisabled}>
                    {t('profile.twoFactorDisabledStatus')}
                  </span>
                )}
              </div>
            </div>
            <div style={styles.cardContent}>
              {twoFactorStatus?.enabled ? (
                <button
                  onClick={() => setShowDisable2FA(true)}
                  style={styles.dangerButton}
                >
                  {t('profile.disable2FA')}
                </button>
              ) : (
                <button
                  onClick={() => setShowTwoFactorSetup(true)}
                  style={styles.primaryButton}
                >
                  {t('profile.enable2FA')}
                </button>
              )}
            </div>
          </div>

          <div style={styles.contentCard}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>
                <span style={styles.cardIcon}><KeyRound size={20} /></span>
                {t('profile.passwordManagement')}
              </h3>
              <p style={styles.cardSubtitle}>
                {t('profile.passwordSubtext')}
              </p>
            </div>
            <div style={styles.cardContent}>
              <button
                onClick={() => setShowPasswordModal(true)}
                style={styles.secondaryButton}
              >
                {t('profile.changePassword')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <PasswordChangeModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false);
            toast.success(t('profile.passwordChangedSuccess'));
          }}
        />
      )}

      {showEmailModal && (
        <ChangeEmailModal
          currentEmail={profile?.email || ''}
          onClose={() => setShowEmailModal(false)}
          onSuccess={() => {
            setShowEmailModal(false);
            toast.info(t('profile.emailChangeInfo'));
            refetch();
          }}
        />
      )}

      {showTwoFactorSetup && (
        <TwoFactorSetup
          onClose={() => setShowTwoFactorSetup(false)}
          onSuccess={() => {
            setShowTwoFactorSetup(false);
            queryClient.invalidateQueries(['2fa-status']);
          }}
        />
      )}

      {showDisable2FA && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>{t('profile.disable2FATitle')}</h3>
            <p style={styles.modalDescription}>
              {t('profile.disable2FADescription')}
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('profile.passwordPlaceholder2')}
              style={styles.modalInput}
            />
            <div style={styles.modalActions}>
              <button
                onClick={() => {
                  setShowDisable2FA(false);
                  setPassword('');
                }}
                style={styles.modalCancelButton}
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={() => disable2FAMutation.mutate(password)}
                disabled={!password || disable2FAMutation.isPending}
                style={{
                  ...styles.modalConfirmButton,
                  opacity: (!password || disable2FAMutation.isPending) ? 0.5 : 1
                }}
              >
                {disable2FAMutation.isPending ? t('profile.disabling2FA') : t('profile.disable2FAButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme) => ({
  container: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: theme.background,
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: theme.text,
    marginBottom: '0.5rem',
    margin: 0,
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: '1rem',
    margin: 0,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    color: theme.text,
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: `4px solid ${theme.borderLight}`,
    borderTop: `4px solid ${theme.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  tabsContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    marginBottom: '2rem',
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  tabsNav: {
    display: 'flex',
    borderBottom: `1px solid ${theme.border}`,
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 1.5rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    color: theme.primary,
    borderBottomColor: theme.primary,
    backgroundColor: theme.backgroundSecondary,
  },
  tabButtonInactive: {
    color: theme.textSecondary,
  },
  tabIcon: {
    fontSize: '1rem',
  },
  contentCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    marginBottom: '2rem',
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  cardHeader: {
    padding: '1.5rem',
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.backgroundSecondary,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: theme.text,
    margin: '0 0 0.5rem 0',
  },
  cardSubtitle: {
    color: theme.textSecondary,
    fontSize: '0.875rem',
    margin: 0,
  },
  cardIcon: {
    fontSize: '1.5rem',
  },
  cardContent: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.text,
  },
  input: {
    padding: '0.75rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
  },
  inputReadonly: {
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
  },
  warningText: {
    fontSize: '0.875rem',
    color: theme.warning,
    marginTop: '0.25rem',
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${theme.border}`,
  },
  primaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: `0 2px 4px rgba(52, 152, 219, 0.2)`,
  },
  secondaryButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  dangerButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#fef2f2',
    color: theme.danger,
    border: '1px solid #fecaca',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  securitySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  statusSection: {
    textAlign: 'right',
  },
  statusBadgeEnabled: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: '#dcfce7',
    color: '#166534',
    marginBottom: '0.25rem',
  },
  statusBadgeDisabled: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
  },
  recoveryText: {
    fontSize: '0.75rem',
    color: theme.textSecondary,
    margin: 0,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modalContent: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    padding: '1.5rem',
    maxWidth: '28rem',
    width: '100%',
    margin: '1rem',
    boxShadow: theme.shadowLarge,
    border: `1px solid ${theme.cardBorder}`,
  },
  modalTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: theme.text,
    marginBottom: '1rem',
    margin: '0 0 1rem 0',
  },
  modalDescription: {
    color: theme.textSecondary,
    fontSize: '0.875rem',
    marginBottom: '1rem',
    lineHeight: '1.5',
  },
  modalInput: {
    width: '100%',
    padding: '0.75rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    fontSize: '1rem',
    marginBottom: '1rem',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  modalCancelButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  modalConfirmButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    backgroundColor: theme.danger,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
});

export default ProfilePage;

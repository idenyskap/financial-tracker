import React, { useState, useEffect, useCallback } from 'react';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../services/api';
import { toast } from 'sonner';
import './NotificationSettings.css';

function NotificationSettings() {
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await api.get('/notifications/settings');
      setSettings(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          const initResponse = await api.post('/notifications/settings/init');
          setSettings(initResponse.data);
        } catch (initError) {
          console.error('Failed to initialize notification settings:', initError);
          toast.error(t('profile.failedToInitNotificationSettings'));
        }
      } else {
        toast.error(t('profile.failedToLoadNotificationSettings'));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = (field) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleTimeChange = (e) => {
    setSettings(prev => ({
      ...prev,
      dailyReminderTime: e.target.value
    }));
  };

  const handleDaysChange = (e) => {
    const value = parseInt(e.target.value);
    if (value >= 0 && value <= 7) {
      setSettings(prev => ({
        ...prev,
        paymentReminderDays: value
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/notifications/settings', settings);
      toast.success(t('profile.notificationSettingsSaved'));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast.error(t('profile.failedToSaveNotificationSettings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>{t('profile.loadingNotificationSettings')}</div>;
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{t('profile.emailNotificationsTitle')}</h2>

      <div style={styles.settingsContainer}>
        {/* Master toggle */}
        <div style={styles.settingGroup}>
          <label className="notification-toggle">
            <input
              type="checkbox"
              checked={settings?.emailEnabled || false}
              onChange={() => handleToggle('emailEnabled')}
            />
            <span className="toggle-slider"></span>
            <div style={styles.toggleContent}>
              <span style={styles.toggleLabel}>{t('profile.emailNotifications')}</span>
              <span style={styles.toggleDescription}>
                {t('profile.masterSwitch')}
              </span>
            </div>
          </label>
        </div>

        <div style={styles.divider}></div>

        {/* Individual notification settings */}
        <div style={{ opacity: settings?.emailEnabled ? 1 : 0.5 }}>
          {/* Analytics Reports */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t('profile.analyticsReports')}</h3>

            <div style={styles.settingGroup}>
              <label className="notification-toggle">
                <input
                  type="checkbox"
                  checked={settings?.weeklyReport || false}
                  onChange={() => handleToggle('weeklyReport')}
                  disabled={!settings?.emailEnabled}
                />
                <span className="toggle-slider"></span>
                <div style={styles.toggleContent}>
                  <span style={styles.toggleLabel}>{t('profile.weeklyReports')}</span>
                  <span style={styles.toggleDescription}>
                    {t('profile.weeklyReportsDesc')}
                  </span>
                </div>
              </label>
            </div>

            <div style={styles.settingGroup}>
              <label className="notification-toggle">
                <input
                  type="checkbox"
                  checked={settings?.monthlyReport || false}
                  onChange={() => handleToggle('monthlyReport')}
                  disabled={!settings?.emailEnabled}
                />
                <span className="toggle-slider"></span>
                <div style={styles.toggleContent}>
                  <span style={styles.toggleLabel}>{t('profile.monthlyReports')}</span>
                  <span style={styles.toggleDescription}>
                    {t('profile.monthlyReportsDesc')}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Reminders */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t('profile.reminders')}</h3>

            <div style={styles.settingGroup}>
              <label className="notification-toggle">
                <input
                  type="checkbox"
                  checked={settings?.dailyReminder || false}
                  onChange={() => handleToggle('dailyReminder')}
                  disabled={!settings?.emailEnabled}
                />
                <span className="toggle-slider"></span>
                <div style={styles.toggleContent}>
                  <span style={styles.toggleLabel}>{t('profile.dailyExpenseReminder')}</span>
                  <span style={styles.toggleDescription}>
                    {t('profile.dailyExpenseReminderDesc')}
                  </span>
                </div>
              </label>

              {settings?.dailyReminder && settings?.emailEnabled && (
                <div style={styles.subSetting}>
                  <label style={styles.subLabel}>{t('profile.reminderTime')}</label>
                  <input
                    type="time"
                    value={settings?.dailyReminderTime || '21:00'}
                    onChange={handleTimeChange}
                    style={styles.timeInput}
                  />
                </div>
              )}
            </div>

            <div style={styles.settingGroup}>
              <label className="notification-toggle">
                <input
                  type="checkbox"
                  checked={settings?.paymentReminders || false}
                  onChange={() => handleToggle('paymentReminders')}
                  disabled={!settings?.emailEnabled}
                />
                <span className="toggle-slider"></span>
                <div style={styles.toggleContent}>
                  <span style={styles.toggleLabel}>{t('profile.paymentReminders')}</span>
                  <span style={styles.toggleDescription}>
                    {t('profile.paymentRemindersDesc')}
                  </span>
                </div>
              </label>

              {settings?.paymentReminders && settings?.emailEnabled && (
                <div style={styles.subSetting}>
                  <label style={styles.subLabel}>{t('profile.daysInAdvance')}</label>
                  <input
                    type="number"
                    min="0"
                    max="7"
                    value={settings?.paymentReminderDays || 1}
                    onChange={handleDaysChange}
                    style={styles.numberInput}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? t('profile.saving') : t('profile.saveSettings')}
        </button>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  card: {
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: theme.radius,
    padding: '2rem',
    boxShadow: theme.shadow,
  },
  cardTitle: {
    fontSize: '1.5rem',
    marginBottom: '1.5rem',
    color: theme.text,
  },
  settingsContainer: {
    maxWidth: '600px',
  },
  section: {
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: theme.text,
  },
  settingGroup: {
    marginBottom: '1.5rem',
  },
  toggleContent: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: '1rem',
  },
  toggleLabel: {
    fontSize: '1rem',
    fontWeight: '500',
    color: theme.text,
    marginBottom: '0.25rem',
  },
  toggleDescription: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
    lineHeight: '1.4',
  },
  subSetting: {
    marginTop: '1rem',
    marginLeft: '66px',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  subLabel: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
  },
  timeInput: {
    padding: '0.5rem',
    borderRadius: theme.radiusSm,
    border: `1px solid ${theme.inputBorder}`,
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
  },
  numberInput: {
    width: '60px',
    padding: '0.5rem',
    borderRadius: theme.radiusSm,
    border: `1px solid ${theme.inputBorder}`,
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
  },
  divider: {
    height: '1px',
    backgroundColor: theme.border,
    margin: '2rem 0',
  },
  actions: {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: `1px solid ${theme.border}`,
  },
  saveButton: {
    padding: '0.75rem 2rem',
    background: theme.gradient,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    color: theme.textSecondary,
  },
});

export default NotificationSettings;

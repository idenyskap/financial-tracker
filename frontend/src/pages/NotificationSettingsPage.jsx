import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../services/api';
import '../styles/NotificationSettings.css';

function NotificationSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/notifications/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (field, value) => {
    const updatedSettings = { ...settings, [field]: value };
    setSettings(updatedSettings);

    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(() => saveSettings(updatedSettings), 1000);
  };

  const saveSettings = async (updatedSettings) => {
    setSaving(true);
    try {
      await api.put('/notifications/settings', updatedSettings);
      toast.success('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
      fetchSettings(); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="notification-settings-page">
      <h1>Email Notification Settings</h1>

      <div className="master-toggle">
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={settings.emailEnabled}
            onChange={(e) => updateSetting('emailEnabled', e.target.checked)}
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">Enable all email notifications</span>
        </label>
      </div>

      {settings.emailEnabled && (
        <>
          <section className="settings-section">
            <h2>Reports & Analytics</h2>
            <p className="section-description">
              Stay informed with regular summaries of your financial activity
            </p>

            <div className="setting-item">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.weeklyReport}
                  onChange={(e) => updateSetting('weeklyReport', e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Weekly spending report</span>
              </label>
              <p className="setting-description">
                Receive a summary every Monday with your weekly spending patterns
              </p>
            </div>

            <div className="setting-item">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.monthlyReport}
                  onChange={(e) => updateSetting('monthlyReport', e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Monthly financial report</span>
              </label>
              <p className="setting-description">
                Comprehensive monthly analysis with trends and insights
              </p>
            </div>
          </section>

          <section className="settings-section">
            <h2>Payment Reminders</h2>
            <p className="section-description">
              Never miss a scheduled payment or subscription
            </p>

            <div className="setting-item">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.paymentReminders}
                  onChange={(e) => updateSetting('paymentReminders', e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Upcoming payment alerts</span>
              </label>

              {settings.paymentReminders && (
                <div className="sub-setting">
                  <label>Remind me </label>
                  <select
                    value={settings.paymentReminderDays}
                    onChange={(e) => updateSetting('paymentReminderDays', parseInt(e.target.value))}
                  >
                    <option value="0">On the day</option>
                    <option value="1">1 day before</option>
                    <option value="2">2 days before</option>
                    <option value="3">3 days before</option>
                    <option value="7">1 week before</option>
                  </select>
                  <label> payment is due</label>
                </div>
              )}
            </div>
          </section>

          <section className="settings-section">
            <h2>📝 Daily Reminder</h2>
            <p className="section-description">
              Get a gentle reminder to log your daily expenses
            </p>

            <div className="setting-item">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.dailyReminder}
                  onChange={(e) => updateSetting('dailyReminder', e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Daily expense reminder</span>
              </label>

              {settings.dailyReminder && (
                <div className="sub-setting">
                  <label>Send reminder at </label>
                  <input
                    type="time"
                    value={settings.dailyReminderTime || "21:00"}
                    onChange={(e) => updateSetting('dailyReminderTime', e.target.value)}
                  />
                </div>
              )}
              <p className="setting-description">
                We'll remind you to log any expenses you made during the day
              </p>
            </div>
          </section>
        </>
      )}

      {saving && <div className="saving-indicator">Saving...</div>}
    </div>
  );
}

export default NotificationSettingsPage;

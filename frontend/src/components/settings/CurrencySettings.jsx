import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from 'sonner';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { getTheme } from '../../styles/theme';
import ExchangeRateInfo from '../currency/ExchangeRateInfo';

const CurrencySettings = () => {
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();
  const { theme } = useTheme();
  const themeColors = getTheme(theme);
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({
    defaultCurrency: 'USD',
    displaySecondary: false,
    secondaryCurrency: 'EUR'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['currencyPreferences'],
    queryFn: async () => {
      const response = await api.get('/currency/preferences');
      return response.data;
    }
  });

  // Update preferences when data is loaded
  React.useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/currency/preferences', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('profile.currencyPrefsUpdated'));
      queryClient.invalidateQueries(['currencyPreferences']);
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['transactions']);
    },
    onError: () => {
      toast.error(t('profile.failedToUpdateCurrencyPrefs'));
    }
  });

  const handleSave = () => {
    updateMutation.mutate(preferences);
  };

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>{t('profile.loadingCurrencySettings')}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}></span>
            {t('profile.primaryCurrencyTitle')}
          </h3>
          <p style={styles.sectionDescription}>
            {t('profile.primaryCurrencyDesc')}
          </p>
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>{t('profile.defaultCurrency')}</label>
          <select
            value={preferences.defaultCurrency}
            onChange={(e) => setPreferences(prev => ({ ...prev, defaultCurrency: e.target.value }))}
            style={styles.currencySelect}
          >
            <option value="USD">🇺🇸 USD - US Dollar</option>
            <option value="EUR">🇪🇺 EUR - Euro</option>
            <option value="GBP">🇬🇧 GBP - British Pound</option>
            <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
            <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
            <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
            <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
            <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
            <option value="SEK">🇸🇪 SEK - Swedish Krona</option>
            <option value="NZD">🇳🇿 NZD - New Zealand Dollar</option>
            <option value="UAH">🇺🇦 UAH - Ukrainian Hryvnia</option>
          </select>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>
            <span style={styles.sectionIcon}></span>
            {t('profile.secondaryCurrencyTitle')}
          </h3>
          <p style={styles.sectionDescription}>
            {t('profile.secondaryCurrencyDesc')}
          </p>
        </div>
        
        <div style={styles.toggleSection}>
          <div style={styles.toggleContent}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleLabel}>{t('profile.enableSecondaryCurrency')}</span>
              <span style={styles.toggleDescription}>
                {t('profile.enableSecondaryCurrencyDesc')}
              </span>
            </div>
            <label style={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={preferences.displaySecondary}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  displaySecondary: e.target.checked
                }))}
                style={styles.toggleInput}
              />
              <span style={{
                ...styles.toggleSlider,
                backgroundColor: preferences.displaySecondary ? themeColors.primary : themeColors.borderLight
              }}>
                <span style={{
                  ...styles.toggleKnob,
                  transform: preferences.displaySecondary ? 'translateX(20px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>
        </div>

        {preferences.displaySecondary && (
          <div style={styles.formGroup}>
            <label style={styles.label}>{t('profile.secondaryCurrency')}</label>
            <select
              value={preferences.secondaryCurrency}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                secondaryCurrency: e.target.value
              }))}
              style={styles.currencySelect}
            >
              <option value="USD">🇺🇸 USD - US Dollar</option>
              <option value="EUR">🇪🇺 EUR - Euro</option>
              <option value="GBP">🇬🇧 GBP - British Pound</option>
              <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
              <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
              <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
              <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
              <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
              <option value="SEK">🇸🇪 SEK - Swedish Krona</option>
              <option value="NZD">🇳🇿 NZD - New Zealand Dollar</option>
              <option value="UAH">🇺🇦 UAH - Ukrainian Hryvnia</option>
            </select>
          </div>
        )}

        {/* Show exchange rate info when a non-USD currency is selected */}
        {preferences.defaultCurrency !== 'USD' && <ExchangeRateInfo />}
      </div>

      <div style={styles.saveSection}>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          style={{
            ...styles.saveButton,
            opacity: updateMutation.isPending ? 0.6 : 1,
            cursor: updateMutation.isPending ? 'not-allowed' : 'pointer'
          }}
        >
          <span style={styles.saveButtonIcon}>💾</span>
          {updateMutation.isPending ? t('profile.savingChanges') : t('profile.saveCurrencySettings')}
        </button>
      </div>
    </div>
  );
};

const getStyles = (theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    textAlign: 'center',
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
  loadingText: {
    color: theme.text,
    fontSize: '0.875rem',
    margin: 0,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    padding: '1.5rem',
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    boxShadow: theme.shadow,
  },
  sectionHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: theme.text,
    margin: 0,
  },
  sectionIcon: {
    fontSize: '1.25rem',
  },
  sectionDescription: {
    color: theme.textSecondary,
    fontSize: '0.875rem',
    lineHeight: '1.5',
    margin: 0,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.text,
  },
  currencySelect: {
    padding: '0.875rem 1rem',
    border: `2px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '500',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '1rem',
    paddingRight: '2.5rem',
  },
  toggleSection: {
    padding: '1rem',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
  },
  toggleContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  toggleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  toggleLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.text,
  },
  toggleDescription: {
    fontSize: '0.75rem',
    color: theme.textSecondary,
  },
  toggleSwitch: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
    cursor: 'pointer',
  },
  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  toggleSlider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transition: 'all 0.3s ease',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    padding: '2px',
  },
  toggleKnob: {
    height: '20px',
    width: '20px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transition: 'transform 0.3s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  saveSection: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '1rem',
  },
  saveButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.875rem 2rem',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: `0 3px 8px rgba(52, 152, 219, 0.3)`,
  },
  saveButtonIcon: {
    fontSize: '1rem',
  },
});

export default CurrencySettings;

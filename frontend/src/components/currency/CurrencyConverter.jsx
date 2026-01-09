import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from 'sonner';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useLanguage } from '../../hooks/useLanguage';

const CurrencyConverter = () => {
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [result, setResult] = useState(null);
  const [conversionHistory, setConversionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const conversionMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/currency/convert', data);
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);

      const historyItem = {
        id: Date.now(),
        ...data,
        timestamp: new Date()
      };
      setConversionHistory(prev => [historyItem, ...prev.slice(0, 4)]);
    },
    onError: (error) => {
      console.error('Conversion failed:', error);
      toast.error(error.response?.data?.message || 'Currency conversion failed');
    }
  });

  const { data: exchangeRates } = useQuery({
    queryKey: ['exchangeRates', fromCurrency],
    queryFn: async () => {
      try {
        const response = await api.get(`/currency/rates/${fromCurrency}`);
        return response.data;
      } catch (error) {
        if (error.response?.status === 404 || error.response?.status === 400) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!fromCurrency,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 1
  });

  useEffect(() => {
    if (amount && fromCurrency && toCurrency && parseFloat(amount) > 0) {
      const timeoutId = setTimeout(() => {
        conversionMutation.mutate({
          amount: parseFloat(amount),
          fromCurrency,
          toCurrency
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, fromCurrency, toCurrency]);

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const quickAmounts = [1, 10, 100, 1000, 5000];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{t('converter.title')}</h1>
          <p style={styles.subtitle}>{t('converter.subtitle')}</p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} style={styles.historyButton}>
          <span style={styles.buttonIcon}></span>
          {showHistory ? t('converter.hideHistory') : t('converter.showHistory')}
        </button>
      </div>

      {/* Converter Card */}
      <div style={styles.converterCard}>
        <div style={styles.converterContent}>
          {/* Amount Section */}
          <div style={styles.amountSection}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('converter.amount')}</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.amountInput}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <div style={styles.quickAmounts}>
              <span style={styles.quickAmountsLabel}>{t('converter.quickAmounts')}</span>
              <div style={styles.quickAmountsGrid}>
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    onClick={() => handleQuickAmount(value)}
                    style={styles.quickAmountButton}
                  >
                    {value.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Currency Selection */}
          <div style={styles.currencySection}>
            <div style={styles.currencySelectors}>
              <div style={styles.currencyGroup}>
                <label style={styles.label}>{t('converter.from')}</label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
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

              <div style={styles.swapButtonContainer}>
                <button
                  onClick={handleSwapCurrencies}
                  style={styles.swapButton}
                  title="Swap currencies"
                >
                  <span style={styles.swapIcon}>⇄</span>
                </button>
              </div>

              <div style={styles.currencyGroup}>
                <label style={styles.label}>{t('converter.to')}</label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
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
          </div>

          {/* Conversion Result */}
          {result && (
            <div style={styles.resultSection}>
              <div style={styles.resultContent}>
                <div style={styles.resultIcon}></div>
                <div style={styles.resultAmount}>
                  {result.convertedAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} {toCurrency}
                </div>
                <div style={styles.resultDetails}>
                  <div style={styles.resultEquation}>
                    {parseFloat(amount).toLocaleString()} {fromCurrency} = {result.convertedAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} {toCurrency}
                  </div>
                  <div style={styles.resultRate}>
                    {t('converter.exchangeRateLabel')} 1 {fromCurrency} = {result.exchangeRate.toFixed(6)} {toCurrency}
                  </div>
                  <div style={styles.resultTimestamp}>
                    {t('converter.lastUpdatedLabel')} {new Date(result.conversionDate).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {conversionMutation.isPending && (
            <div style={styles.loading}>
              <div style={styles.loadingSpinner}></div>
              <p style={styles.loadingText}>{t('converter.convertingCurrencies')}</p>
            </div>
          )}

          {/* Error State */}
          {conversionMutation.isError && (
            <div style={styles.errorState}>
              <span style={styles.errorIcon}></span>
              <span style={styles.errorText}>
                {conversionMutation.error?.response?.data?.message || t('converter.conversionFailed')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Conversion History */}
      {showHistory && conversionHistory.length > 0 && (
        <div style={styles.historySection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}></span>
              {t('converter.recentConversions')}
            </h3>
          </div>
          <div style={styles.historyList}>
            {conversionHistory.map((item) => (
              <div key={item.id} style={styles.historyItem}>
                <div style={styles.historyConversion}>
                  <span style={styles.historyAmount}>
                    {item.amount.toLocaleString()} {item.fromCurrency}
                  </span>
                  <span style={styles.historyArrow}>→</span>
                  <span style={styles.historyAmount}>
                    {item.convertedAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} {item.toCurrency}
                  </span>
                </div>
                <span style={styles.historyTime}>
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exchange Rates Overview */}
      {exchangeRates && Array.isArray(exchangeRates) && exchangeRates.length > 0 && (
        <div style={styles.ratesSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}></span>
              {t('converter.currentExchangeRates')} ({fromCurrency} {t('converter.base')})
            </h3>
          </div>
          <div style={styles.ratesGrid}>
            {exchangeRates.slice(0, 8).map((rate) => (
              <div key={rate.id} style={styles.rateCard}>
                <div style={styles.rateCurrency}>{rate.toCurrency}</div>
                <div style={styles.rateValue}>
                  {rate.rate.toFixed(4)}
                </div>
              </div>
            ))}
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
  historyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  buttonIcon: {
    fontSize: '1rem',
  },
  converterCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    marginBottom: '2rem',
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  converterContent: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  amountSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.text,
    marginBottom: '0.75rem',
  },
  amountInput: {
    padding: '1rem',
    border: `2px solid ${theme.inputBorder}`,
    borderRadius: '12px',
    fontSize: '1.5rem',
    fontWeight: '600',
    textAlign: 'center',
    transition: 'border-color 0.2s ease',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
  },
  quickAmounts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  quickAmountsLabel: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
    fontWeight: '500',
  },
  quickAmountsGrid: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  quickAmountButton: {
    padding: '0.5rem 1rem',
    backgroundColor: theme.backgroundSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: theme.textSecondary,
    transition: 'all 0.2s ease',
  },
  currencySection: {
    padding: '1.5rem',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: '12px',
    border: `1px solid ${theme.border}`,
  },
  currencySelectors: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  currencyGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
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
  swapButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingTop: '3rem',
  },
  swapButton: {
    padding: '0.75rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
  },
  swapIcon: {
    fontSize: '1.25rem',
  },
  resultSection: {
    padding: '2rem',
    background: 'linear-gradient(135deg, #ddd6fe 0%, #e0e7ff 100%)',
    border: '1px solid #c4b5fd',
    borderRadius: '12px',
    textAlign: 'center',
  },
  resultContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  resultIcon: {
    fontSize: '2rem',
  },
  resultAmount: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#5b21b6',
    lineHeight: '1.2',
  },
  resultDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  resultEquation: {
    fontSize: '1rem',
    color: '#6b46c1',
    fontWeight: '600',
  },
  resultRate: {
    fontSize: '0.875rem',
    color: '#7c3aed',
    fontWeight: '500',
  },
  resultTimestamp: {
    fontSize: '0.75rem',
    color: '#8b5cf6',
    opacity: 0.8,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
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
    color: '#64748b',
    fontSize: '0.875rem',
  },
  errorState: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
  },
  errorIcon: {
    fontSize: '1.25rem',
  },
  errorText: {
    color: theme.danger,
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  historySection: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    marginBottom: '2rem',
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  ratesSection: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  sectionHeader: {
    padding: '1.5rem 1.5rem 1rem',
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.backgroundSecondary,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: theme.text,
    margin: 0,
  },
  sectionIcon: {
    fontSize: '1.5rem',
  },
  historyList: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
  },
  historyConversion: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  historyAmount: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.text,
  },
  historyArrow: {
    color: theme.textSecondary,
    fontSize: '1rem',
  },
  historyTime: {
    fontSize: '0.75rem',
    color: theme.textSecondary,
  },
  ratesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    padding: '1.5rem',
  },
  rateCard: {
    padding: '1rem',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
    textAlign: 'center',
  },
  rateCurrency: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.text,
    marginBottom: '0.25rem',
  },
  rateValue: {
    fontSize: '1rem',
    fontWeight: '700',
    color: theme.primary,
  },
});

export default CurrencyConverter;

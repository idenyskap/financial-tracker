import { useQuery } from '@tanstack/react-query';
import { useCurrency } from '../../hooks/useCurrency';
import { useLanguage } from '../../hooks/useLanguage';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import api from '../../services/api';

function ExchangeRateInfo() {
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();
  const { defaultCurrency } = useCurrency();

  const { data: ratesData, isLoading } = useQuery({
    queryKey: ['exchangeRates', defaultCurrency],
    queryFn: async () => {
      if (defaultCurrency === 'USD') return [];
      const response = await api.get(`/currency/rates/USD`);
      return response.data;
    },
    enabled: !!defaultCurrency && defaultCurrency !== 'USD',
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading || !ratesData || ratesData.length === 0) {
    return null;
  }

  const currentRate = ratesData.find(rate => rate.toCurrency === defaultCurrency);

  if (!currentRate) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceInfo = (source) => {
    if (source === 'ExchangeRate-API') {
      return {
        name: 'ExchangeRate-API.com',
        description: 'Free real-time exchange rates',
        url: 'https://exchangerate-api.com'
      };
    }
    if (source === 'MANUAL') {
      return {
        name: 'Manual Entry',
        description: 'Manually set by administrator',
        url: null
      };
    }
    return {
      name: source,
      description: 'External exchange rate provider',
      url: null
    };
  };

  const sourceInfo = getSourceInfo(currentRate.source);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.icon}></span>
        <h4 style={styles.title}>{t('profile.currentExchangeRate')}</h4>
      </div>

      <div style={styles.rateInfo}>
        <div style={styles.rate}>
          <span style={styles.rateText}>
            1 USD = {currentRate.rate} {defaultCurrency}
          </span>
        </div>

        <div style={styles.metadata}>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>{t('profile.updated')}</span>
            <span style={styles.metaValue}>{formatDate(currentRate.validFrom)}</span>
          </div>

          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>{t('profile.source')}</span>
            <span style={styles.metaValue}>
              {sourceInfo.url ? (
                <a
                  href={sourceInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                >
                  {sourceInfo.name}
                </a>
              ) : (
                sourceInfo.name
              )}
            </span>
          </div>
        </div>

        <div style={styles.note}>
          <span style={styles.noteIcon}></span>
          <span style={styles.noteText}>
            {t('profile.rateNote')}
          </span>
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  icon: {
    fontSize: '1.2rem',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    color: theme.text,
  },
  rateInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  rate: {
    padding: '0.75rem',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: '6px',
    textAlign: 'center',
  },
  rateText: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: theme.text,
  },
  metadata: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  metaItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: '0.875rem',
    color: theme.text,
    fontWeight: '500',
  },
  link: {
    color: theme.primary,
    textDecoration: 'none',
  },
  note: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
    padding: '0.75rem',
    backgroundColor: theme.warningBackground || theme.backgroundSecondary,
    borderRadius: '6px',
    marginTop: '0.5rem',
  },
  noteIcon: {
    fontSize: '1rem',
    flexShrink: 0,
    marginTop: '0.1rem',
  },
  noteText: {
    fontSize: '0.75rem',
    color: theme.textSecondary,
    lineHeight: '1.4',
  },
});

export default ExchangeRateInfo;

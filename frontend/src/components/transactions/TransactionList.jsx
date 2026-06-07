import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const TransactionList = ({ transactions }) => {
  const styles = useThemedStyles(getStyles);
  const { data: currencyPrefs } = useQuery({
    queryKey: ['currencyPreferences'],
    queryFn: async () => {
      const response = await api.get('/currency/preferences');
      return response.data;
    }
  });

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  return (
    <div style={styles.list}>
      {transactions.map((transaction) => (
        <div key={transaction.id} style={styles.row}>
          <div style={styles.info}>
            <p style={styles.title}>{transaction.description}</p>
            <p style={styles.meta}>
              {transaction.categoryName} · {new Date(transaction.date).toLocaleDateString()}
            </p>
          </div>
          <div style={styles.right}>
            <p style={{
              ...styles.amount,
              color: transaction.type === 'INCOME' ? styles.__success : styles.__danger,
            }}>
              {transaction.type === 'INCOME' ? '+' : '-'}
              {formatAmount(transaction.amount, transaction.currency || currencyPrefs?.defaultCurrency)}
            </p>
            {currencyPrefs?.displaySecondary && transaction.convertedAmount && (
              <p style={styles.secondary}>
                ≈ {formatAmount(transaction.convertedAmount, currencyPrefs.secondaryCurrency)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const getStyles = (theme) => ({
  __success: theme.success,
  __danger: theme.danger,
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    padding: '0.9rem 1.1rem',
    borderRadius: theme.radius,
    boxShadow: theme.shadow,
  },
  info: {
    minWidth: 0,
  },
  title: {
    margin: '0 0 0.2rem 0',
    fontWeight: 600,
    color: theme.text,
    fontSize: '0.92rem',
  },
  meta: {
    margin: 0,
    fontSize: '0.8rem',
    color: theme.textTertiary,
  },
  right: {
    textAlign: 'right',
    flexShrink: 0,
  },
  amount: {
    margin: 0,
    fontWeight: 700,
    fontSize: '0.95rem',
    fontVariantNumeric: 'tabular-nums',
  },
  secondary: {
    margin: '0.1rem 0 0 0',
    fontSize: '0.78rem',
    color: theme.textTertiary,
  },
});

export default TransactionList;

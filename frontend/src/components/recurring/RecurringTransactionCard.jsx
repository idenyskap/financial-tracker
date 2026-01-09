import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useCurrency } from '../../hooks/useCurrency';
import { useLanguage } from '../../hooks/useLanguage';

function RecurringTransactionCard({ transaction, onEdit, onDelete, onExecute }) {
  const styles = useThemedStyles(getStyles);
  const { formatCurrency, formatDualCurrency } = useCurrency();
  const { t } = useLanguage();

  const getFrequencyLabel = (frequency) => {
    const labels = {
      DAILY: t('recurring.frequencyDaily'),
      WEEKLY: t('recurring.frequencyWeekly'),
      BIWEEKLY: t('recurring.frequencyBiweekly'),
      MONTHLY: t('recurring.frequencyMonthly'),
      QUARTERLY: t('recurring.frequencyQuarterly'),
      YEARLY: t('recurring.frequencyYearly'),
    };
    return labels[frequency] || frequency;
  };

  const getDayLabel = () => {
    if (transaction.frequency === 'MONTHLY' && transaction.dayOfMonth) {
      return `${t('recurring.onDay')} ${transaction.dayOfMonth}`;
    }
    if (transaction.frequency === 'WEEKLY' && transaction.dayOfWeek) {
      const days = [t('recurring.dayMon'), t('recurring.dayTue'), t('recurring.dayWed'), t('recurring.dayThu'), t('recurring.dayFri'), t('recurring.daySat'), t('recurring.daySun')];
      return `on ${days[transaction.dayOfWeek - 1]}`;
    }
    return '';
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.headerTop}>
          <div style={styles.titleSection}>
            <h3 style={styles.name}>{transaction.name}</h3>
            <div style={styles.badges}>
              <span style={{
                ...styles.typeBadge,
                backgroundColor: transaction.type === 'INCOME' ? '#10b981' : '#ef4444',
              }}>
                {transaction.type === 'INCOME' ? t('recurring.incomeLabel') : t('recurring.expenseLabel')}
              </span>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: transaction.active ? '#10b981' : '#64748b',
              }}>
                {transaction.active ? t('recurring.activeLabel') : t('recurring.pausedLabel')}
              </span>
            </div>
          </div>
          
          <div style={styles.quickAction}>
            <button
              onClick={() => onExecute(transaction.id)}
              style={styles.executeButton}
              title="Execute now"
            >
              {t('recurring.runNow')}
            </button>
          </div>
        </div>
      </div>

      <div style={styles.cardContent}>
        <div style={styles.amountSection}>
          <div style={styles.amountDisplay}>
            <span style={{
              ...styles.amount,
              color: transaction.type === 'INCOME' ? '#10b981' : '#ef4444',
            }}>
              {transaction.type === 'INCOME' ? '+' : '-'}
              {formatDualCurrency(transaction.amount)}
            </span>
            <div style={styles.frequencyInfo}>
              <span style={styles.frequency}>
                {getFrequencyLabel(transaction.frequency)} {getDayLabel()}
              </span>
            </div>
          </div>
        </div>

        <div style={styles.detailsSection}>
          <div style={styles.categorySection}>
            <div style={styles.categoryTag}>
              <div style={{
                ...styles.categoryIndicator,
                backgroundColor: transaction.categoryColor,
              }} />
              <span style={styles.categoryName}>{transaction.categoryName}</span>
            </div>
          </div>
          
          {transaction.description && (
            <div style={styles.descriptionSection}>
              <p style={styles.description}>{transaction.description}</p>
            </div>
          )}
        </div>

        <div style={styles.datesSection}>
          <div style={styles.dateItem}>
            <span style={styles.dateLabel}>{t('recurring.nextExecutionLabel')}</span>
            <span style={styles.dateValue}>
              {new Date(transaction.nextExecutionDate).toLocaleDateString()}
            </span>
          </div>
          {transaction.lastExecutionDate && (
            <div style={styles.dateItem}>
              <span style={styles.dateLabel}>{t('recurring.lastExecutedLabel')}</span>
              <span style={styles.dateValue}>
                {new Date(transaction.lastExecutionDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <div style={styles.cardFooter}>
        <div style={styles.actions}>
          <button
            onClick={() => onEdit(transaction)}
            style={styles.editButton}
            title="Edit transaction"
          >
            ✏️ {t('common.edit')}
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            style={styles.deleteButton}
            title="Delete transaction"
          >
            🗑️ {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  card: {
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    boxShadow: theme.shadow,
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    padding: '1.5rem',
    backgroundColor: theme.backgroundSecondary,
    borderBottom: `1px solid ${theme.border}`,
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
  },
  name: {
    margin: '0 0 0.75rem 0',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: theme.text,
    lineHeight: '1.2',
  },
  badges: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  typeBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '6px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  quickAction: {
    marginLeft: '1rem',
  },
  executeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)',
  },
  cardContent: {
    padding: '1.5rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  amountSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amountDisplay: {
    flex: 1,
  },
  amount: {
    fontSize: '2rem',
    fontWeight: '700',
    lineHeight: '1.2',
    marginBottom: '0.25rem',
    display: 'block',
  },
  frequencyInfo: {
    marginTop: '0.5rem',
  },
  frequency: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
    fontWeight: '500',
  },
  detailsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  categorySection: {
    display: 'flex',
    alignItems: 'center',
  },
  categoryTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: theme.backgroundSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    fontSize: '0.875rem',
  },
  categoryIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    flexShrink: 0,
  },
  categoryName: {
    fontWeight: '600',
    color: theme.text,
  },
  descriptionSection: {
    marginTop: '0.5rem',
  },
  description: {
    margin: 0,
    color: theme.textSecondary,
    fontSize: '0.875rem',
    lineHeight: '1.5',
    fontStyle: 'italic',
  },
  datesSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: '8px',
    border: `1px solid ${theme.border}`,
  },
  dateItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  dateLabel: {
    fontSize: '0.75rem',
    color: theme.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  dateValue: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.text,
  },
  cardFooter: {
    borderTop: `1px solid ${theme.borderLight}`,
    backgroundColor: theme.backgroundSecondary,
    padding: '1rem 1.5rem',
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
});

export default RecurringTransactionCard;
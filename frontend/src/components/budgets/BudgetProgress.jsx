import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useCurrency } from '../../hooks/useCurrency';
import { useLanguage } from '../../hooks/useLanguage';

function BudgetProgress({ budget }) {
  const styles = useThemedStyles(getStyles);
  const { formatCurrency, formatDualCurrency } = useCurrency();
  const { t } = useLanguage();
  const percentage = Math.min(budget.percentUsed || 0, 100);
  const isOverBudget = budget.overBudget;
  const isWarning = percentage >= budget.notifyThreshold;

  const getProgressColor = () => {
    if (isOverBudget) return '#e74c3c';
    if (isWarning) return '#f39c12';
    if (percentage > 50) return '#f1c40f';
    return '#27ae60';
  };


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.name}>{budget.name}</h3>
          <p style={styles.category}>
            {budget.categoryName || t('budgets.allCategories')} • {t(`budgets.${budget.period.toLowerCase()}`)}
          </p>
        </div>
        <div style={styles.amount}>
          <span style={{ color: getProgressColor(), fontWeight: 'bold' }}>
            {formatDualCurrency(budget.spent)}
          </span>
          <span style={styles.separator}> / </span>
          <span style={styles.limit}>{formatDualCurrency(budget.amount)}</span>
        </div>
      </div>

      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: getProgressColor(),
            }}
          />
          {isOverBudget && (
            <div
              style={{
                ...styles.overBudgetFill,
                width: `${Math.min(percentage - 100, 100)}%`,
              }}
            />
          )}
        </div>
        <span style={styles.percentageText}>{percentage.toFixed(0)}%</span>
      </div>

      <div style={styles.footer}>
        <span style={styles.remaining}>
          {budget.remaining >= 0 ? `${t('budgets.remaining')}: ` : `${t('budgets.overBudget')}: `}
          <strong style={{ color: budget.remaining >= 0 ? '#27ae60' : '#e74c3c' }}>
            {formatDualCurrency(Math.abs(budget.remaining))}
          </strong>
        </span>
        {isWarning && !isOverBudget && (
          <span style={styles.warning}>{t('budgets.approachingLimit')}</span>
        )}
        {isOverBudget && (
          <span style={styles.exceeded}>{t('budgets.budgetExceeded')}</span>
        )}
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    backgroundColor: theme.cardBackground,
    padding: '1.5rem',
    borderRadius: '8px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  name: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.125rem',
    color: theme.text,
  },
  category: {
    margin: 0,
    fontSize: '0.875rem',
    color: theme.textSecondary,
  },
  amount: {
    textAlign: 'right',
    fontSize: '1.125rem',
  },
  separator: {
    color: theme.textTertiary,
  },
  limit: {
    color: theme.text,
    fontWeight: '500',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },
  progressBar: {
    flex: 1,
    height: '12px',
    backgroundColor: theme.borderLight,
    borderRadius: '6px',
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  overBudgetFill: {
    position: 'absolute',
    left: '100%',
    height: '100%',
    backgroundColor: '#c0392b',
  },
  percentageText: {
    fontSize: '0.875rem',
    fontWeight: '500',
    minWidth: '40px',
    color: theme.text,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem',
  },
  remaining: {
    color: theme.textSecondary,
  },
  warning: {
    color: '#f39c12',
    fontWeight: '500',
  },
  exceeded: {
    color: '#e74c3c',
    fontWeight: '500',
  },
});

export default BudgetProgress;

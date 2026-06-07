import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useCurrency } from '../hooks/useCurrency';
import { useLanguage } from '../hooks/useLanguage';
import { useThemedStyles } from '../hooks/useThemedStyles';

function BudgetCard({ budget, onEdit, onDelete }) {
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();
  const styles = useThemedStyles(getStyles);
  const percentage = budget.spent && budget.amount
    ? (budget.spent / budget.amount) * 100
    : 0;

  const getProgressColor = () => {
    if (percentage >= 100) return styles.__danger;
    if (percentage >= budget.notifyThreshold) return styles.__warning;
    return styles.__success;
  };

  const isOverBudget = percentage > 100;
  const isNearLimit = percentage >= budget.notifyThreshold;

  return (
    <div style={{
      ...styles.card,
      ...(isOverBudget ? styles.cardDanger : {}),
    }}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <h3 style={styles.name}>{budget.name}</h3>
          {budget.categoryName && (
            <span style={styles.category}>{budget.categoryName}</span>
          )}
        </div>

        <div style={styles.actions}>
          <button onClick={() => onEdit(budget)} style={styles.actionButton}>
            {t('common.edit')}
          </button>
          <button onClick={() => onDelete(budget.id)} style={{ ...styles.actionButton, ...styles.deleteButton }}>
            {t('common.delete')}
          </button>
        </div>
      </div>

      {(isOverBudget || isNearLimit) && (
        <div style={{
          ...styles.alert,
          backgroundColor: isOverBudget ? styles.__dangerSoft : styles.__warningSoft,
          color: isOverBudget ? styles.__danger : styles.__warningText,
        }}>
          <ExclamationTriangleIcon style={styles.alertIcon} />
          {isOverBudget
            ? t('budgets.budgetExceeded')
            : `${percentage.toFixed(0)}% ${t('budgets.budgetUsed')}`}
        </div>
      )}

      <div style={styles.amounts}>
        <div>
          <span style={styles.spent}>{formatCurrency(budget.spent)}</span>
          <span style={styles.of}> {t('budgets.of')} </span>
          <span style={styles.limit}>{formatCurrency(budget.amount)}</span>
        </div>
        <span style={styles.remaining}>
          {formatCurrency(budget.amount - budget.spent)} {t('budgets.remaining')}
        </span>
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
        </div>
        <span style={styles.percentage}>{percentage.toFixed(0)}%</span>
      </div>

      <div style={styles.period}>
        <span style={styles.periodLabel}>{t('budgets.period')}:</span>
        <span style={styles.periodValue}>{t(`budgets.${budget.period.toLowerCase()}`)}</span>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  __danger: theme.danger,
  __success: theme.success,
  __warning: theme.warning,
  __dangerSoft: theme.dangerSoft,
  __warningSoft: theme.warningSoft,
  __warningText: theme.warningText,
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: theme.radiusLg,
    padding: '1.5rem',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    position: 'relative',
  },
  cardDanger: {
    borderColor: theme.danger,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  titleSection: {
    flex: 1,
  },
  name: {
    margin: '0 0 0.25rem 0',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: theme.text,
  },
  category: {
    fontSize: '0.8rem',
    color: theme.textSecondary,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  actionButton: {
    padding: '0.4rem 0.75rem',
    backgroundColor: theme.primarySoft,
    color: theme.primary,
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  deleteButton: {
    backgroundColor: theme.dangerSoft,
    color: theme.danger,
  },
  alert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.7rem 0.85rem',
    borderRadius: theme.radiusSm,
    marginBottom: '1rem',
    fontSize: '0.82rem',
    fontWeight: 500,
  },
  alertIcon: {
    width: '18px',
    height: '18px',
    flexShrink: 0,
  },
  amounts: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '0.75rem',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  spent: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: theme.text,
    letterSpacing: '-0.02em',
  },
  of: {
    color: theme.textSecondary,
    fontSize: '0.8rem',
  },
  limit: {
    fontSize: '0.95rem',
    color: theme.textSecondary,
  },
  remaining: {
    fontSize: '0.8rem',
    color: theme.success,
    fontWeight: 600,
  },
  progressContainer: {
    marginBottom: '1rem',
  },
  progressBar: {
    height: '8px',
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.radiusFull,
    overflow: 'hidden',
    marginBottom: '0.35rem',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radiusFull,
    transition: 'width 0.4s ease',
  },
  percentage: {
    fontSize: '0.72rem',
    color: theme.textSecondary,
    fontWeight: 600,
  },
  period: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.82rem',
    paddingTop: '0.75rem',
    borderTop: `1px solid ${theme.borderLight}`,
  },
  periodLabel: {
    color: theme.textSecondary,
  },
  periodValue: {
    fontWeight: 600,
    color: theme.text,
  },
});

export default BudgetCard;

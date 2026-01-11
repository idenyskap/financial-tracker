import { useState } from 'react';
import { Pencil, Trash2, Pause, Play } from 'lucide-react';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useCurrency } from '../../hooks/useCurrency';
import { useLanguage } from '../../hooks/useLanguage';

function GoalCard({ goal, onEdit, onDelete, onContribute, onStatusChange }) {
  const styles = useThemedStyles(getStyles);
  const { formatCurrency, formatDualCurrency } = useCurrency();
  const { t } = useLanguage();
  const [showContribution, setShowContribution] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionType, setContributionType] = useState('ADD');


  const getProgressColor = () => {
    if (goal.isCompleted) return '#27ae60';
    if (goal.isOverdue) return '#e74c3c';
    if (goal.progressPercentage >= 75) return '#f39c12';
    return '#3498db';
  };

  const getStatusIcon = () => {
    switch (goal.status) {
      case 'COMPLETED':
        return '✓';
      case 'PAUSED':
        return '❚❚';
      case 'CANCELLED':
        return '✗';
      default:
        return goal.isOverdue ? '!' : null;
    }
  };

  const handleContribute = () => {
    if (!contributionAmount) return;

    onContribute({
      goalId: goal.id,
      amount: parseFloat(contributionAmount),
      type: contributionType,
      note: '',
    });

    setContributionAmount('');
    setShowContribution(false);
  };

  const progressPercentage = Math.min(goal.progressPercentage || 0, 100);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <div style={styles.titleRow}>
            <h3 style={styles.name}>{goal.name}</h3>
            {getStatusIcon() && (
              <span style={{
                ...styles.statusIcon,
                color: goal.status === 'COMPLETED' ? '#27ae60' :
                  goal.status === 'CANCELLED' || goal.isOverdue ? '#e74c3c' :
                    '#f39c12'
              }}>
                {getStatusIcon()}
              </span>
            )}
          </div>
          <div style={styles.badges}>
            <span style={{
              ...styles.priorityBadge,
              backgroundColor: goal.priority === 'CRITICAL' ? '#e74c3c' :
                goal.priority === 'HIGH' ? '#f39c12' :
                  goal.priority === 'MEDIUM' ? '#3498db' : '#95a5a6'
            }}>
              {goal.priority === 'HIGH' ? t('goals.highPriorityOption') :
               goal.priority === 'MEDIUM' ? t('goals.mediumPriorityOption') :
               goal.priority === 'LOW' ? t('goals.lowPriorityOption') :
               goal.priority === 'CRITICAL' ? t('goals.criticalPriorityOption') : goal.priority}
            </span>
            {goal.categoryName && (
              <span style={styles.categoryBadge}>
                <div style={{
                  ...styles.categoryDot,
                  backgroundColor: goal.categoryColor || '#666',
                }} />
                <span style={styles.categoryName}>{goal.categoryName}</span>
              </span>
            )}
          </div>
        </div>

        <div style={styles.quickActions}>
          {goal.status === 'ACTIVE' && (
            <button
              onClick={() => setShowContribution(!showContribution)}
              style={styles.primaryAction}
              title="Add/Withdraw funds"
            >
              {t('goals.addFunds')}
            </button>
          )}
          {goal.status === 'PAUSED' && (
            <button
              onClick={() => onStatusChange(goal.id, 'resume')}
              style={styles.primaryAction}
              title="Resume goal"
            >
              <Play size={14} /> {t('goals.resume')}
            </button>
          )}
        </div>
      </div>

      {goal.description && (
        <p style={styles.description}>{goal.description}</p>
      )}

      <div style={styles.progressSection}>
        <div style={styles.amounts}>
          <span style={styles.currentAmount}>{formatDualCurrency(goal.currentAmount)}</span>
          <span style={styles.targetAmount}>{t('goals.of')} {formatDualCurrency(goal.targetAmount)}</span>
        </div>

        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progressPercentage}%`,
              backgroundColor: getProgressColor(),
            }}
          />
        </div>

        <div style={styles.progressStats}>
          <span>{progressPercentage.toFixed(1)}% {t('goals.complete')}</span>
          <span>{formatDualCurrency(goal.remainingAmount)} {t('goals.toGo')}</span>
        </div>
      </div>

      {showContribution && (
        <div style={styles.contributionForm}>
          <div style={styles.contributionInputRow}>
            <input
              type="number"
              step="0.01"
              placeholder={t('goals.amount')}
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              style={styles.contributionInput}
            />
            <select
              value={contributionType}
              onChange={(e) => setContributionType(e.target.value)}
              style={styles.contributionSelect}
            >
              <option value="ADD">{t('goals.addFundsOption')}</option>
              <option value="WITHDRAW">{t('goals.withdraw')}</option>
            </select>
          </div>
          <button onClick={handleContribute} style={styles.contributionButton}>
            {t('goals.confirm')}
          </button>
        </div>
      )}

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>{t('goals.targetDate')}</span>
          <span style={styles.detailValue}>
            {new Date(goal.targetDate).toLocaleDateString()}
          </span>
        </div>

        {goal.daysRemaining !== undefined && goal.status === 'ACTIVE' && (
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>{t('goals.daysRemaining')}</span>
            <span style={{
              ...styles.detailValue,
              color: goal.daysRemaining < 30 ? '#e74c3c' : styles.detailValue.color,
            }}>
              {goal.daysRemaining > 0 ? goal.daysRemaining : t('goals.overdue')}
            </span>
          </div>
        )}
      </div>

      {goal.status === 'ACTIVE' && goal.remainingAmount > 0 && goal.daysRemaining > 0 && (
        <div style={styles.savingsRequired}>
          <h4 style={styles.savingsTitle}>{t('goals.toReachYourGoalSave')}</h4>
          <div style={styles.savingsGrid}>
            <div style={styles.savingsItem}>
              <span style={styles.savingsAmount}>
                {formatDualCurrency(goal.requiredDailySaving)}
              </span>
              <span style={styles.savingsPeriod}>{t('goals.perDay')}</span>
            </div>
            <div style={styles.savingsItem}>
              <span style={styles.savingsAmount}>
                {formatDualCurrency(goal.requiredWeeklySaving)}
              </span>
              <span style={styles.savingsPeriod}>{t('goals.perWeek')}</span>
            </div>
            <div style={styles.savingsItem}>
              <span style={styles.savingsAmount}>
                {formatDualCurrency(goal.requiredMonthlySaving)}
              </span>
              <span style={styles.savingsPeriod}>{t('goals.perMonth')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Section */}
      <div style={styles.actionSection}>
        <div style={styles.actionButtons}>
          {goal.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => onStatusChange(goal.id, 'pause')}
                style={styles.secondaryButton}
                title="Pause goal"
              >
                <Pause size={14} /> {t('goals.pause')}
              </button>
              <button
                onClick={() => onEdit(goal)}
                style={styles.secondaryButton}
                title="Edit goal"
              >
                <Pencil size={14} /> {t('common.edit')}
              </button>
              <button
                onClick={() => onDelete(goal.id)}
                style={styles.dangerButton}
                title="Delete goal"
              >
                <Trash2 size={14} /> {t('common.delete')}
              </button>
            </>
          )}
          {goal.status === 'PAUSED' && (
            <>
              <button
                onClick={() => onEdit(goal)}
                style={styles.secondaryButton}
                title="Edit goal"
              >
                <Pencil size={14} /> {t('common.edit')}
              </button>
              <button
                onClick={() => onDelete(goal.id)}
                style={styles.dangerButton}
                title="Delete goal"
              >
                <Trash2 size={14} /> {t('common.delete')}
              </button>
            </>
          )}
          {goal.status === 'COMPLETED' && (
            <button
              onClick={() => onDelete(goal.id)}
              style={styles.dangerButton}
              title="Delete goal"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    padding: '0',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '1.5rem 1.5rem 1rem',
    marginBottom: '0',
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  name: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: theme.text,
  },
  statusIcon: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  badges: {
    display: 'flex',
    gap: '0.5rem',
  },
  priorityBadge: {
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    lineHeight: '1',
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '24px',
  },
  categoryBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.75rem',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: '4px',
    fontSize: '0.75rem',
  },
  categoryDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  categoryName: {
    fontWeight: '600',
    color: theme.text,
  },
  quickActions: {
    display: 'flex',
  },
  primaryAction: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.625rem 1.125rem',
    backgroundColor: theme.warning,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: `0 2px 4px rgba(245, 158, 11, 0.2)`,
    whiteSpace: 'nowrap',
    minHeight: '36px',
  },
  actionSection: {
    borderTop: `1px solid ${theme.borderLight}`,
    backgroundColor: theme.backgroundSecondary,
    padding: '1rem 1.5rem',
    marginTop: 'auto',
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    padding: '0.625rem 1rem',
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    minWidth: '90px',
    flex: '1',
    maxWidth: '120px',
    whiteSpace: 'nowrap',
  },
  dangerButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.375rem',
    padding: '0.625rem 1rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    minWidth: '90px',
    flex: '1',
    maxWidth: '120px',
    whiteSpace: 'nowrap',
  },
  description: {
    margin: '0 0 1rem 0',
    padding: '0 1.5rem',
    color: theme.textSecondary,
    fontSize: '0.875rem',
    lineHeight: '1.5',
  },
  progressSection: {
    padding: '0 1.5rem',
    marginBottom: '1.5rem',
  },
  amounts: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  currentAmount: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: theme.text,
  },
  targetAmount: {
    fontSize: '1rem',
    color: theme.textSecondary,
    fontWeight: '600',
  },
  progressBar: {
    height: '12px',
    backgroundColor: theme.borderLight,
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '0.5rem',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  progressStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: theme.textSecondary,
  },
  contributionForm: {
    margin: '0 1.5rem 1.5rem',
    padding: '1rem',
    backgroundColor: theme.warningBackground,
    border: `1px solid ${theme.warning}`,
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  contributionInputRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  contributionInput: {
    flex: '1 1 120px',
    minWidth: '100px',
    padding: '0.625rem 0.75rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '6px',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    fontSize: '0.9rem',
  },
  contributionSelect: {
    flex: '0 1 auto',
    minWidth: '120px',
    padding: '0.625rem 0.75rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '6px',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  contributionButton: {
    width: '100%',
    padding: '0.75rem 1rem',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    transition: 'opacity 0.2s ease',
  },
  details: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1.5rem',
    padding: '1.5rem',
    marginBottom: '0',
    borderTop: `1px solid ${theme.borderLight}`,
    backgroundColor: theme.backgroundSecondary,
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: theme.textTertiary,
  },
  detailValue: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.text,
  },
  savingsRequired: {
    margin: '0 1.5rem 1.5rem',
    backgroundColor: theme.warningBackground,
    border: `1px solid ${theme.warning}`,
    padding: '1rem',
    borderRadius: '8px',
  },
  savingsTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '0.875rem',
    color: theme.warningText,
    fontWeight: '600',
  },
  savingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '1rem',
  },
  savingsItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    minWidth: 0,
  },
  savingsAmount: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: theme.warningText,
    wordBreak: 'break-word',
    lineHeight: '1.2',
  },
  savingsPeriod: {
    fontSize: '0.75rem',
    color: theme.textTertiary,
    marginTop: '0.25rem',
    whiteSpace: 'nowrap',
  },
});

export default GoalCard;

import { useQuery } from '@tanstack/react-query';
import { goalService } from '../../services/goalService';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../hooks/useCurrency';
import { useLanguage } from '../../hooks/useLanguage';
import { useThemedStyles } from '../../hooks/useThemedStyles';

function GoalsWidget() {
  const { formatDualCurrency } = useCurrency();
  const { t } = useLanguage();
  const styles = useThemedStyles(getStyles);
  const { data: goalsData } = useQuery({
    queryKey: ['goals', true],
    queryFn: () => goalService.getAll(true),
  });

  const goals = goalsData?.data || [];
  const topGoals = goals.slice(0, 3);

  if (goals.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>{t('dashboard.noActiveGoals')}</p>
        <Link to="/goals" style={styles.link}>{t('dashboard.createFirstGoal')}</Link>
      </div>
    );
  }

  return (
    <div style={styles.widget}>
      <div style={styles.goalsList}>
        {topGoals.map(goal => {
          const progressPercentage = Math.min(goal.progressPercentage || 0, 100);
          const fillColor = goal.isOverdue
            ? styles.__danger
            : progressPercentage >= 75
              ? styles.__success
              : styles.__primary;

          return (
            <div key={goal.id} style={styles.goalItem}>
              <div style={styles.goalHeader}>
                <h4 style={styles.goalName}>{goal.name}</h4>
                {goal.daysRemaining < 30 && goal.daysRemaining > 0 && (
                  <div style={styles.urgentBadge}>{goal.daysRemaining}d</div>
                )}
              </div>

              <div style={styles.goalProgress}>
                <div style={styles.progressInfo}>
                  <span style={styles.currentAmount}>{formatDualCurrency(goal.currentAmount)}</span>
                  <span style={styles.targetAmount}>
                    {t('goals.of')} {formatDualCurrency(goal.targetAmount)}
                  </span>
                </div>

                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${progressPercentage}%`,
                      backgroundColor: fillColor,
                    }}
                  />
                </div>

                <div style={styles.progressStats}>
                  <span>{progressPercentage.toFixed(0)}%</span>
                  {goal.requiredMonthlySaving > 0 && (
                    <span style={styles.monthlySaving}>
                      {formatDualCurrency(goal.requiredMonthlySaving)}/mo
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.quickStats}>
        <div style={styles.stat}>
          <span style={styles.statValue}>{goals.length}</span>
          <span style={styles.statLabel}>{t('goals.activeGoals')}</span>
        </div>
        <div style={styles.stat}>
          <span style={styles.statValue}>
            {formatDualCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0))}
          </span>
          <span style={styles.statLabel}>{t('goals.totalSaved')}</span>
        </div>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  __primary: theme.primary,
  __success: theme.success,
  __danger: theme.danger,
  widget: {},
  empty: {
    textAlign: 'center',
    padding: '2rem 1rem',
    color: theme.textSecondary,
  },
  emptyText: {
    margin: '0 0 0.5rem 0',
  },
  link: {
    color: theme.primary,
    textDecoration: 'none',
    fontWeight: 600,
  },
  goalsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  goalItem: {
    padding: '1rem',
    backgroundColor: theme.backgroundSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius,
  },
  goalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  goalName: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: 600,
    color: theme.text,
  },
  urgentBadge: {
    padding: '0.2rem 0.5rem',
    backgroundColor: theme.dangerSoft,
    color: theme.danger,
    borderRadius: theme.radiusFull,
    fontSize: '0.72rem',
    fontWeight: 600,
  },
  goalProgress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
  },
  currentAmount: {
    fontWeight: 600,
    color: theme.text,
  },
  targetAmount: {
    color: theme.textSecondary,
    fontWeight: 500,
  },
  progressBar: {
    height: '8px',
    backgroundColor: theme.backgroundTertiary,
    borderRadius: theme.radiusFull,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radiusFull,
    transition: 'width 0.4s ease',
  },
  progressStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: theme.textSecondary,
  },
  monthlySaving: {
    color: theme.primary,
    fontWeight: 600,
  },
  quickStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${theme.border}`,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: theme.text,
  },
  statLabel: {
    fontSize: '0.75rem',
    color: theme.textSecondary,
    fontWeight: 500,
  },
});

export default GoalsWidget;

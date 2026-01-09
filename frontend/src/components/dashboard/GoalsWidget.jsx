import { useQuery } from '@tanstack/react-query';
import { goalService } from '../../services/goalService';
import { Link } from 'react-router-dom';
import { useCurrency } from '../../hooks/useCurrency';
import { useLanguage } from '../../hooks/useLanguage';

function GoalsWidget() {
  const { formatCurrency, formatDualCurrency } = useCurrency();
  const { t } = useLanguage();
  const { data: goalsData } = useQuery({
    queryKey: ['goals', true],
    queryFn: () => goalService.getAll(true),
  });

  const goals = goalsData?.data || [];
  const topGoals = goals.slice(0, 3);


  if (goals.length === 0) {
    return (
      <div style={styles.widget}>
        <h3 style={styles.title}>
          {t('dashboard.financialGoals')}
        </h3>
        <div style={styles.empty}>
          <p>{t('dashboard.noActiveGoals')}</p>
          <Link to="/goals" style={styles.link}>{t('dashboard.createFirstGoal')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.widget}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          {t('dashboard.financialGoals')}
        </h3>
        <Link to="/goals" style={styles.viewAll}>{t('dashboard.viewAll')}</Link>
      </div>

      <div style={styles.goalsList}>
        {topGoals.map(goal => {
          const progressPercentage = Math.min(goal.progressPercentage || 0, 100);

          return (
            <div key={goal.id} style={styles.goalItem}>
              <div style={styles.goalHeader}>
                <h4 style={styles.goalName}>{goal.name}</h4>
                {goal.daysRemaining < 30 && goal.daysRemaining > 0 && (
                  <div style={styles.urgentBadge}>
                    {goal.daysRemaining}d
                  </div>
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
                      backgroundColor: goal.isOverdue ? '#e74c3c' :
                        progressPercentage >= 75 ? '#f39c12' : '#3498db'
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

const styles = {
  widget: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#2c3e50',
  },
  viewAll: {
    color: '#3498db',
    textDecoration: 'none',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#666',
  },
  link: {
    color: '#3498db',
    textDecoration: 'none',
    fontWeight: '500',
  },
  goalsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  goalItem: {
    padding: '1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
  },
  goalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  goalName: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    color: '#2c3e50',
  },
  urgentBadge: {
    padding: '0.25rem 0.5rem',
    backgroundColor: '#fee',
    color: '#e74c3c',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  goalProgress: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
  },
  currentAmount: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  targetAmount: {
    color: '#666',
    fontWeight: '500',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  progressStats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#666',
  },
  monthlySaving: {
    color: '#3498db',
    fontWeight: '600',
  },
  quickStats: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e0e0e0',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#666',
    fontWeight: '500',
  },
};

export default GoalsWidget;

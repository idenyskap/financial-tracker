import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { analyticsService } from '../services/analyticsService';
import StatsCard from '../components/dashboard/StatsCard';
import ExpenseIncomeChart from '../components/charts/ExpenseIncomeChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import CategoryMonthlyChart from '../components/charts/CategoryMonthlyChart';
import GoalsWidget from '../components/dashboard/GoalsWidget';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useCurrency } from '../hooks/useCurrency';
import { useLanguage } from '../hooks/useLanguage';

function DashboardPage() {
  const styles = useThemedStyles(getStyles);
  const { formatCurrency, formatDualCurrency } = useCurrency();
  const { t } = useLanguage();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardService.getDashboard(),
  });

  const { data: categoryMonthlyStats, isLoading: isCategoryStatsLoading } = useQuery({
    queryKey: ['categoryMonthlyStats'],
    queryFn: () => analyticsService.getCategoryMonthlyStats(5),
  });

  if (isLoading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingSpinner}></div>
        <p>{t('dashboard.loadingMessage')}</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={styles.error}>
        <span style={styles.errorIcon}></span>
        <p>{t('dashboard.errorMessage')}</p>
      </div>
    );
  }

  const dashboard = data?.data;


  const formatPercent = (value) => {
    const formatted = Math.abs(value || 0).toFixed(1);
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{t('dashboard.title')}</h1>
          <p style={styles.subtitle}>{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={styles.statInfo}>
                <span style={styles.statIcon}></span>
                <span style={styles.statTitle}>{t('dashboard.currentBalance')}</span>
              </div>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{formatDualCurrency(dashboard?.currentBalance)}</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={styles.statInfo}>
                <span style={styles.statIcon}></span>
                <span style={styles.statTitle}>{t('dashboard.monthlyIncome')}</span>
              </div>
            </div>
            <div style={styles.statContent}>
              <span style={{...styles.statValue, color: '#10b981'}}>{formatDualCurrency(dashboard?.monthlyIncome)}</span>
              <span style={styles.statChange}>
                {formatPercent(dashboard?.incomeChangePercent)} {t('dashboard.fromLastMonth')}
              </span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={styles.statInfo}>
                <span style={styles.statIcon}></span>
                <span style={styles.statTitle}>{t('dashboard.monthlyExpenses')}</span>
              </div>
            </div>
            <div style={styles.statContent}>
              <span style={{...styles.statValue, color: '#ef4444'}}>{formatDualCurrency(dashboard?.monthlyExpense)}</span>
              <span style={styles.statChange}>
                {formatPercent(dashboard?.expenseChangePercent)} {t('dashboard.fromLastMonth')}
              </span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statHeader}>
              <div style={styles.statInfo}>
                <span style={styles.statIcon}></span>
                <span style={styles.statTitle}>{t('dashboard.monthlyBalance')}</span>
              </div>
            </div>
            <div style={styles.statContent}>
              <span style={{
                ...styles.statValue, 
                color: dashboard?.monthlyBalance >= 0 ? '#10b981' : '#ef4444'
              }}>
                {formatDualCurrency(dashboard?.monthlyBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div style={styles.contentCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <span style={styles.cardIcon}></span>
            {t('dashboard.recentTransactions')}
          </h3>
        </div>
        <div style={styles.cardContent}>
          {dashboard?.recentTransactions?.length > 0 ? (
            <div style={styles.transactionsList}>
              {dashboard.recentTransactions.map((transaction) => (
                <div key={transaction.id} style={styles.transactionItem}>
                  <div style={styles.transactionLeft}>
                    <div
                      style={{
                        ...styles.categoryIndicator,
                        backgroundColor: transaction.categoryColor,
                      }}
                    />
                    <div style={styles.transactionDetails}>
                      <p style={styles.transactionCategory}>{transaction.categoryName}</p>
                      <p style={styles.transactionDescription}>
                        {transaction.description || t('dashboard.noDescription')}
                      </p>
                      <p style={styles.transactionDate}>
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={styles.transactionRight}>
                    <div style={styles.transactionAmount}>
                      <span style={{
                        ...styles.amountText,
                        color: transaction.type === 'INCOME' ? '#10b981' : '#ef4444'
                      }}>
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatDualCurrency(transaction.amount)}
                      </span>
                      <span style={styles.transactionType}>
                        {transaction.type === 'INCOME' ? '' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}></div>
              <p style={styles.emptyText}>{t('dashboard.noRecentTransactions')}</p>
              <p style={styles.emptySubtext}>{t('dashboard.recentTransactionsSubtext')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Expense Categories */}
      <div style={styles.contentCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <span style={styles.cardIcon}></span>
            {t('dashboard.topExpenseCategories')}
          </h3>
        </div>
        <div style={styles.cardContent}>
          {dashboard?.topExpenseCategories?.length > 0 ? (
            <div style={styles.categoriesList}>
              {dashboard.topExpenseCategories.map((category) => (
                <div key={category.categoryId} style={styles.categoryItem}>
                  <div style={styles.categoryInfo}>
                    <div
                      style={{
                        ...styles.categoryIndicator,
                        backgroundColor: category.categoryColor,
                      }}
                    />
                    <span style={styles.categoryName}>{category.categoryName}</span>
                  </div>
                  <div style={styles.categoryStats}>
                    <span style={styles.categoryAmount}>
                      {formatDualCurrency(category.totalAmount)}
                    </span>
                    <span style={styles.categoryPercent}>
                      {category.percentage?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}></div>
              <p style={styles.emptyText}>{t('dashboard.noExpenseCategories')}</p>
              <p style={styles.emptySubtext}>{t('dashboard.expenseCategoriesSubtext')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Charts */}
      <div style={styles.contentCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <span style={styles.cardIcon}></span>
            {t('dashboard.financialAnalytics')}
          </h3>
        </div>
        <div style={styles.cardContent}>
          <ExpenseIncomeChart dailyStats={dashboard?.dailyStats || []} />
        </div>
      </div>

      {dashboard?.topExpenseCategories?.length > 0 && (
        <div style={styles.contentCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}></span>
              {t('dashboard.expenseDistribution')}
            </h3>
          </div>
          <div style={styles.cardContent}>
            <CategoryPieChart
              categories={dashboard.topExpenseCategories}
              title={t('dashboard.expenseDistribution')}
            />
          </div>
        </div>
      )}

      {/* Category Monthly Statistics Chart */}
      {!isCategoryStatsLoading && categoryMonthlyStats?.data?.length > 0 && (
        <div style={styles.contentCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}></span>
              {t('analytics.categoryMonthlyTrends')}
            </h3>
          </div>
          <div style={styles.cardContent}>
            <CategoryMonthlyChart categoryStats={categoryMonthlyStats.data} />
          </div>
        </div>
      )}

      {/* Goals Widget */}
      <div style={styles.contentCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <span style={styles.cardIcon}></span>
            {t('dashboard.financialGoals')}
          </h3>
        </div>
        <div style={styles.cardContent}>
          <GoalsWidget />
        </div>
      </div>
    </div>
  );

}

const getStyles = (theme, { isMobile } = {}) => ({
  container: {
    padding: isMobile ? '1rem' : '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: theme.background,
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'stretch' : 'flex-start',
    marginBottom: isMobile ? '1rem' : '2rem',
    padding: isMobile ? '1rem' : '1.5rem',
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: isMobile ? '1.5rem' : '2rem',
    fontWeight: '700',
    color: theme.text,
    marginBottom: '0.5rem',
    margin: 0,
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: isMobile ? '0.875rem' : '1rem',
    margin: 0,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    color: theme.text,
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
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    color: theme.danger,
  },
  errorIcon: {
    fontSize: '2rem',
    marginBottom: '1rem',
  },
  statsSection: {
    marginBottom: isMobile ? '1rem' : '2rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: isMobile ? '1rem' : '1.5rem',
  },
  statCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    padding: isMobile ? '1rem' : '1.5rem',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    transition: 'all 0.2s ease',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  statInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  statIcon: {
    fontSize: '1.5rem',
  },
  statTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  statValue: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: theme.text,
    lineHeight: '1.2',
  },
  statChange: {
    fontSize: '0.75rem',
    color: theme.textSecondary,
    fontWeight: '500',
  },
  contentCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    marginBottom: '2rem',
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  cardHeader: {
    padding: '1.5rem 1.5rem 1rem',
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.backgroundSecondary,
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: theme.text,
    margin: 0,
  },
  cardIcon: {
    fontSize: '1.5rem',
  },
  cardContent: {
    padding: '1.5rem',
  },
  transactionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: `1px solid ${theme.borderLight}`,
  },
  transactionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
  },
  categoryIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    flexShrink: 0,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategory: {
    fontWeight: '600',
    color: theme.text,
    margin: '0 0 0.25rem 0',
    fontSize: '1rem',
  },
  transactionDescription: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
    margin: '0 0 0.25rem 0',
  },
  transactionDate: {
    fontSize: '0.75rem',
    color: theme.textTertiary,
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  transactionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  transactionAmount: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  amountText: {
    fontSize: '1.125rem',
    fontWeight: '700',
  },
  transactionType: {
    fontSize: '1.25rem',
  },
  categoriesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: `1px solid ${theme.borderLight}`,
  },
  categoryInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
  },
  categoryName: {
    fontWeight: '600',
    color: theme.text,
    fontSize: '1rem',
  },
  categoryStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'right',
  },
  categoryAmount: {
    fontWeight: '600',
    color: theme.text,
    fontSize: '1rem',
  },
  categoryPercent: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: theme.text,
    marginBottom: '0.5rem',
  },
  emptySubtext: {
    color: theme.textSecondary,
    fontSize: '0.875rem',
  },
});

export default DashboardPage;

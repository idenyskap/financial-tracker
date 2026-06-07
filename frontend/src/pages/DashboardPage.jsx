import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { analyticsService } from '../services/analyticsService';
import ExpenseIncomeChart from '../components/charts/ExpenseIncomeChart';
import CategoryPieChart from '../components/charts/CategoryPieChart';
import CategoryMonthlyChart from '../components/charts/CategoryMonthlyChart';
import GoalsWidget from '../components/dashboard/GoalsWidget';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useCurrency } from '../hooks/useCurrency';
import { useLanguage } from '../hooks/useLanguage';
import {
  WalletIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
  ClockIcon,
  ChartPieIcon,
  ChartBarIcon,
  TrophyIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

function DashboardPage() {
  const styles = useThemedStyles(getStyles);
  const { formatDualCurrency } = useCurrency();
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
        <p>{t('dashboard.errorMessage')}</p>
      </div>
    );
  }

  const dashboard = data?.data;

  const formatPercent = (value) => {
    const formatted = Math.abs(value || 0).toFixed(1);
    return value >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const monthlyBalancePositive = (dashboard?.monthlyBalance ?? 0) >= 0;
  const maxCategoryAmount = Math.max(
    1,
    ...(dashboard?.topExpenseCategories?.map((c) => c.totalAmount) || [0])
  );

  const stats = [
    {
      label: t('dashboard.currentBalance'),
      value: formatDualCurrency(dashboard?.currentBalance),
      icon: WalletIcon,
      accent: styles.__primary,
      change: null,
    },
    {
      label: t('dashboard.monthlyIncome'),
      value: formatDualCurrency(dashboard?.monthlyIncome),
      icon: ArrowTrendingUpIcon,
      accent: styles.__success,
      change: { value: dashboard?.incomeChangePercent, positive: (dashboard?.incomeChangePercent ?? 0) >= 0 },
    },
    {
      label: t('dashboard.monthlyExpenses'),
      value: formatDualCurrency(dashboard?.monthlyExpense),
      icon: ArrowTrendingDownIcon,
      accent: styles.__danger,
      change: { value: dashboard?.expenseChangePercent, positive: (dashboard?.expenseChangePercent ?? 0) <= 0 },
    },
    {
      label: t('dashboard.monthlyBalance'),
      value: formatDualCurrency(dashboard?.monthlyBalance),
      icon: ScaleIcon,
      accent: monthlyBalancePositive ? styles.__success : styles.__danger,
      change: null,
    },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>{t('dashboard.title')}</h1>
        <p style={styles.subtitle}>{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} style={styles.statCard}>
              <div style={styles.statTop}>
                <span style={styles.statTitle}>{stat.label}</span>
                <span style={{ ...styles.statIconChip, backgroundColor: `${stat.accent}1f`, color: stat.accent }}>
                  <Icon style={styles.statIconSvg} />
                </span>
              </div>
              <span style={{ ...styles.statValue, color: stat.accent }}>{stat.value}</span>
              {stat.change && (
                <span
                  style={{
                    ...styles.statChange,
                    color: stat.change.positive ? styles.__success : styles.__danger,
                    backgroundColor: stat.change.positive ? styles.__successSoft : styles.__dangerSoft,
                  }}
                >
                  {formatPercent(stat.change.value)} · {t('dashboard.fromLastMonth')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Two-column: recent transactions + top categories */}
      <div style={styles.twoCol}>
        {/* Recent Transactions */}
        <div style={styles.contentCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <ClockIcon style={styles.cardIcon} />
              {t('dashboard.recentTransactions')}
            </h3>
          </div>
          <div style={styles.cardContent}>
            {dashboard?.recentTransactions?.length > 0 ? (
              <div style={styles.list}>
                {dashboard.recentTransactions.map((transaction) => (
                  <div key={transaction.id} style={styles.row}>
                    <div style={styles.rowLeft}>
                      <div
                        style={{
                          ...styles.dot,
                          backgroundColor: transaction.categoryColor || styles.__primary,
                        }}
                      />
                      <div>
                        <p style={styles.rowTitle}>{transaction.categoryName}</p>
                        <p style={styles.rowMeta}>
                          {transaction.description || t('dashboard.noDescription')}
                          {'  ·  '}
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        ...styles.amount,
                        color: transaction.type === 'INCOME' ? styles.__success : styles.__danger,
                      }}
                    >
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {formatDualCurrency(transaction.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
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
              <Squares2X2Icon style={styles.cardIcon} />
              {t('dashboard.topExpenseCategories')}
            </h3>
          </div>
          <div style={styles.cardContent}>
            {dashboard?.topExpenseCategories?.length > 0 ? (
              <div style={styles.list}>
                {dashboard.topExpenseCategories.map((category) => (
                  <div key={category.categoryId} style={styles.catItem}>
                    <div style={styles.catTop}>
                      <span style={styles.catName}>
                        <span
                          style={{ ...styles.dot, backgroundColor: category.categoryColor || styles.__primary }}
                        />
                        {category.categoryName}
                      </span>
                      <span style={styles.catAmount}>{formatDualCurrency(category.totalAmount)}</span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${Math.max(4, (category.totalAmount / maxCategoryAmount) * 100)}%`,
                          backgroundColor: category.categoryColor || styles.__primary,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <p style={styles.emptyText}>{t('dashboard.noExpenseCategories')}</p>
                <p style={styles.emptySubtext}>{t('dashboard.expenseCategoriesSubtext')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div style={styles.contentCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <ChartBarIcon style={styles.cardIcon} />
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
              <ChartPieIcon style={styles.cardIcon} />
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
              <ChartBarIcon style={styles.cardIcon} />
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
            <TrophyIcon style={styles.cardIcon} />
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
  __primary: theme.primary,
  __success: theme.success,
  __danger: theme.danger,
  __successSoft: theme.successSoft,
  __dangerSoft: theme.dangerSoft,
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '1rem' : '1.5rem',
  },
  header: {
    marginBottom: '0.25rem',
  },
  title: {
    fontSize: isMobile ? '1.5rem' : '1.875rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: theme.text,
    margin: '0 0 0.35rem 0',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: '0.95rem',
    margin: 0,
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
    color: theme.textSecondary,
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${theme.borderLight}`,
    borderTopColor: theme.primary,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginBottom: '1rem',
  },
  error: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    backgroundColor: theme.cardBackground,
    borderRadius: theme.radiusLg,
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    color: theme.danger,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: isMobile ? '0.75rem' : '1.25rem',
  },
  statCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: theme.radiusLg,
    padding: isMobile ? '1rem' : '1.4rem',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  statTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  statTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statIconChip: {
    width: '36px',
    height: '36px',
    borderRadius: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statIconSvg: {
    width: '19px',
    height: '19px',
  },
  statValue: {
    fontSize: isMobile ? '1.4rem' : '1.75rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
  },
  statChange: {
    alignSelf: 'flex-start',
    fontSize: '0.72rem',
    fontWeight: 600,
    padding: '0.2rem 0.5rem',
    borderRadius: theme.radiusFull,
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '1rem' : '1.5rem',
  },
  contentCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: theme.radiusLg,
    boxShadow: theme.shadow,
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  cardHeader: {
    padding: '1.1rem 1.4rem',
    borderBottom: `1px solid ${theme.border}`,
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontSize: '1rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: theme.text,
    margin: 0,
  },
  cardIcon: {
    width: '18px',
    height: '18px',
    color: theme.primary,
  },
  cardContent: {
    padding: '0.75rem 1.4rem 1.1rem',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 0',
    borderBottom: `1px solid ${theme.borderLight}`,
  },
  rowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
    flex: 1,
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-block',
  },
  rowTitle: {
    fontWeight: 600,
    color: theme.text,
    margin: '0 0 0.15rem 0',
    fontSize: '0.9rem',
  },
  rowMeta: {
    fontSize: '0.8rem',
    color: theme.textTertiary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  amount: {
    fontSize: '0.95rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  catItem: {
    padding: '0.7rem 0',
    borderBottom: `1px solid ${theme.borderLight}`,
  },
  catTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  catName: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    color: theme.text,
    fontSize: '0.9rem',
  },
  catAmount: {
    fontWeight: 600,
    color: theme.textSecondary,
    fontSize: '0.85rem',
    fontVariantNumeric: 'tabular-nums',
  },
  progressTrack: {
    height: '7px',
    borderRadius: theme.radiusFull,
    backgroundColor: theme.backgroundTertiary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radiusFull,
    transition: 'width 0.4s ease',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1rem',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: theme.text,
    margin: '0 0 0.35rem 0',
  },
  emptySubtext: {
    color: theme.textSecondary,
    fontSize: '0.85rem',
    margin: 0,
  },
});

export default DashboardPage;

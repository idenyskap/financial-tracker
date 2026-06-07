import { BookmarkIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useLanguage } from '../../hooks/useLanguage';
import { useCurrency } from '../../hooks/useCurrency';

function SavedSearchItem({ search, onExecute, onDelete }) {
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const getFilterSummary = () => {
    const filters = [];
    const criteria = search.searchCriteria;

    if (criteria.searchText) filters.push(`"${criteria.searchText}"`);
    if (criteria.type) {
      const typeLabel = criteria.type === 'INCOME' ? t('transactions.income') : t('transactions.expense');
      filters.push(typeLabel);
    }
    if (criteria.quickDateFilter) {
      const dateFilterMap = {
        'TODAY': t('search.today'),
        'LAST_7_DAYS': t('search.last7Days'),
        'LAST_30_DAYS': t('search.last30Days'),
        'THIS_MONTH': t('search.thisMonth'),
        'LAST_MONTH': t('search.lastMonth'),
        'THIS_YEAR': t('search.thisYear')
      };
      filters.push(dateFilterMap[criteria.quickDateFilter] || criteria.quickDateFilter);
    }
    if (criteria.minAmount || criteria.maxAmount) {
      const minAmount = formatCurrency(criteria.minAmount || 0);
      const maxAmount = criteria.maxAmount ? formatCurrency(criteria.maxAmount) : '∞';
      filters.push(`${minAmount} - ${maxAmount}`);
    }

    return filters.join(' • ') || t('search.allTypes');
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <BookmarkIcon style={styles.bookmarkIcon} />
        <div style={styles.info}>
          <h4 style={styles.name}>{search.name}</h4>
          <p style={styles.filters}>{getFilterSummary()}</p>
        </div>
      </div>
      <div style={styles.actions}>
        <button
          onClick={() => onExecute(search)}
          style={styles.executeButton}
          title={t('common.search')}
        >
          <MagnifyingGlassIcon style={styles.actionIcon} />
        </button>
        <button
          onClick={() => onDelete(search.id)}
          style={styles.deleteButton}
          title={t('common.delete')}
        >
          <TrashIcon style={styles.actionIcon} />
        </button>
      </div>
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    backgroundColor: theme.cardBackground,
    padding: '1rem',
    borderRadius: theme.radius,
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'transform 0.2s',
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
    },
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: 1,
  },
  bookmarkIcon: {
    width: '24px',
    height: '24px',
    color: theme.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    margin: '0 0 0.25rem 0',
    fontSize: '1rem',
    fontWeight: '500',
    color: theme.text,
  },
  filters: {
    margin: 0,
    fontSize: '0.875rem',
    color: theme.textSecondary,
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
  },
  executeButton: {
    padding: '0.5rem',
    background: theme.gradient,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: '0.5rem',
    backgroundColor: theme.dangerSoft,
    color: theme.danger,
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: '16px',
    height: '16px',
  },
});

export default SavedSearchItem;

import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { savedSearchService } from '../../services/savedSearchService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useLanguage } from '../../hooks/useLanguage';

function TransactionSearch({ onSearch, categories }) {
  const styles = useThemedStyles(getStyles);
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filters, setFilters] = useState({
    searchText: '',
    type: '',
    categoryId: '',
    quickDateFilter: 'LAST_30_DAYS',
    minAmount: '',
    maxAmount: '',
  });

  const quickFilters = [
    { value: 'TODAY', label: t('search.today') },
    { value: 'LAST_7_DAYS', label: t('search.last7Days') },
    { value: 'LAST_30_DAYS', label: t('search.last30Days') },
    { value: 'THIS_MONTH', label: t('search.thisMonth') },
    { value: 'LAST_MONTH', label: t('search.lastMonth') },
    { value: 'THIS_YEAR', label: t('search.thisYear') },
  ];

  const saveMutation = useMutation({
    mutationFn: savedSearchService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-searches']);
      toast.success(t('search.savedSuccess'));
      setSaveModalOpen(false);
      setSearchName('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('search.saveError'));
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      searchText: '',
      type: '',
      categoryId: '',
      quickDateFilter: 'LAST_30_DAYS',
      minAmount: '',
      maxAmount: '',
    });
    onSearch({});
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast.error(t('search.enterName'));
      return;
    }

    saveMutation.mutate({
      name: searchName,
      searchCriteria: filters,
    });
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <div style={styles.searchBar}>
          <input
            type="text"
            name="searchText"
            placeholder={t('search.placeholder')}
            value={filters.searchText}
            onChange={handleChange}
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>
            <MagnifyingGlassIcon style={styles.icon} />
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            style={styles.filterButton}
          >
            <FunnelIcon style={styles.icon} />
            {t('search.filters')}
          </button>
          <button
            type="button"
            onClick={() => setSaveModalOpen(true)}
            style={styles.saveButton}
            title={t('search.saveTooltip')}
          >
            <BookmarkIcon style={styles.icon} />
          </button>
        </div>

        {showFilters && (
          <div style={styles.filtersPanel}>
            <div style={styles.filterRow}>
              <select
                name="quickDateFilter"
                value={filters.quickDateFilter}
                onChange={handleChange}
                style={styles.select}
              >
                {quickFilters.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>

              <select
                name="type"
                value={filters.type}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">{t('search.allTypes')}</option>
                <option value="INCOME">{t('transactions.income')}</option>
                <option value="EXPENSE">{t('transactions.expense')}</option>
              </select>

              <select
                name="categoryId"
                value={filters.categoryId}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="">{t('search.allCategories')}</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.filterRow}>
              <input
                type="number"
                name="minAmount"
                placeholder={t('search.minAmount')}
                value={filters.minAmount}
                onChange={handleChange}
                style={styles.input}
              />
              <input
                type="number"
                name="maxAmount"
                placeholder={t('search.maxAmount')}
                value={filters.maxAmount}
                onChange={handleChange}
                style={styles.input}
              />
              <button
                type="button"
                onClick={handleReset}
                style={styles.resetButton}
              >
                {t('search.reset')}
              </button>
            </div>
          </div>
        )}
      </form>

      {saveModalOpen && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>{t('search.saveSearch')}</h3>
            <input
              type="text"
              placeholder={t('search.namePlaceholder')}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={styles.modalInput}
            />
            <div style={styles.modalButtons}>
              <button onClick={handleSaveSearch} style={styles.modalSaveButton}>
                {t('search.save')}
              </button>
              <button onClick={() => setSaveModalOpen(false)} style={styles.modalCancelButton}>
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    marginBottom: '2rem',
  },
  searchForm: {
    backgroundColor: theme.cardBackground,
    padding: '1rem',
    borderRadius: '8px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
  },
  searchBar: {
    display: 'flex',
    gap: '0.5rem',
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '4px',
    fontSize: '1rem',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
  },
  searchButton: {
    padding: '0.75rem 1rem',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  filterButton: {
    padding: '0.75rem 1rem',
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    width: '20px',
    height: '20px',
  },
  filtersPanel: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${theme.borderLight}`,
  },
  filterRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  select: {
    flex: 1,
    padding: '0.5rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '4px',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
  },
  input: {
    flex: 1,
    padding: '0.5rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '4px',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
  },
  resetButton: {
    padding: '0.5rem 1rem',
    backgroundColor: theme.danger,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '0.75rem',
    backgroundColor: theme.info,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.cardBackground,
    padding: '2rem',
    borderRadius: '8px',
    width: '400px',
    border: `1px solid ${theme.cardBorder}`,
    color: theme.text,
  },
  modalInput: {
    width: '100%',
    padding: '0.75rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '4px',
    marginTop: '1rem',
    marginBottom: '1rem',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
  },
  modalButtons: {
    display: 'flex',
    gap: '0.5rem',
  },
  modalSaveButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: theme.success,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  modalCancelButton: {
    flex: 1,
    padding: '0.75rem',
    backgroundColor: theme.secondary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
});

export default TransactionSearch;

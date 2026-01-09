import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../services/transactionService';
import { categoryService } from '../services/categoryService';
import { savedSearchService } from '../services/savedSearchService';
import TransactionSearch from '../components/transactions/TransactionSearch';
import SavedSearchItem from '../components/savedSearches/SavedSearchItem';
import { toast } from 'sonner';
import ImportCSV from '../components/transactions/ImportCSV';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useCurrency } from '../hooks/useCurrency';
import { useLanguage } from '../hooks/useLanguage';

function TransactionsPage() {
  const styles = useThemedStyles(getStyles);
  const { formatCurrency, formatDualCurrency } = useCurrency();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState('pages'); // 'pages' or 'infinite'
  const [accumulatedTransactions, setAccumulatedTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const loadMoreRef = useRef(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    type: 'EXPENSE',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', searchParams, currentPage],
    queryFn: () => transactionService.search({ ...searchParams, page: currentPage }),
  });

  // Reset to first page when search params change
  useEffect(() => {
    setCurrentPage(0);
    setViewMode('pages');
    setAccumulatedTransactions([]);
    setSelectedIds(new Set());
  }, [searchParams]);

  const { data: savedSearchesData } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => savedSearchService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: transactionService.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboard']);

      if (response.data.budgetWarning) {
        const warning = response.data.budgetWarning;
        if (warning.level === 'EXCEEDED') {
          toast.error(warning.message);
        } else if (warning.level === 'ALERT') {
          toast.warning(warning.message);
        } else {
          toast.info(warning.message);
        }
      } else {
        toast.success('Transaction created successfully');
      }

      setShowForm(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error creating transaction');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => transactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success(t('transactions.transactionUpdated'));
      setShowForm(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating transaction');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: transactionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success(t('transactions.transactionDeleted'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting transaction');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: transactionService.deleteBulk,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success(t('transactions.transactionsDeleted', { count: response.data.deleted }));
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting transactions');
    },
  });

  const deleteSavedSearchMutation = useMutation({
    mutationFn: savedSearchService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-searches']);
      toast.success('Saved search deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting saved search');
    },
  });

  const categories = categoriesData?.data || [];
  const pageData = transactionsData?.data;
  const pageTransactions = pageData?.content || [];
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;
  const isFirstPage = pageData?.first ?? true;
  const isLastPage = pageData?.last ?? true;
  const savedSearches = savedSearchesData?.data || [];

  // Use accumulated transactions in infinite mode, page transactions in pages mode
  const transactions = viewMode === 'infinite' ? accumulatedTransactions : pageTransactions;

  // Accumulate transactions in infinite mode
  useEffect(() => {
    if (viewMode === 'infinite' && transactionsData?.data?.content) {
      if (currentPage === 0) {
        setAccumulatedTransactions(transactionsData.data.content);
      } else {
        setAccumulatedTransactions(prev => {
          const newIds = new Set(transactionsData.data.content.map(t => t.id));
          const existing = prev.filter(t => !newIds.has(t.id));
          return [...existing, ...transactionsData.data.content];
        });
      }
    }
  }, [transactionsData, viewMode, currentPage]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (viewMode !== 'infinite' || isLastPage || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !isLastPage) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [viewMode, isLastPage, isLoading]);

  // Scroll detection for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled down more than one viewport height
      const scrollThreshold = window.innerHeight;
      setShowScrollTop(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredCategories = categories.filter(cat => {
    if (!cat.type) return true;
    return cat.type === form.type;
  });

  const handleSearch = (params) => {
    setSearchParams(params);
  };

  const handleExecuteSavedSearch = (search) => {
    setSearchParams(search.searchCriteria);
  };

  const handleDeleteSavedSearch = (id) => {
    if (window.confirm('Delete this saved search?')) {
      deleteSavedSearchMutation.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setForm({
      amount: transaction.amount,
      type: transaction.type,
      categoryId: transaction.categoryId,
      date: transaction.date,
      description: transaction.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t('transactions.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectTransaction = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(tx => tx.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(t('transactions.bulkDeleteConfirm', { count: selectedIds.size }))) {
      bulkDeleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'type') {
      setForm(prev => ({
        ...prev,
        [name]: value,
        categoryId: '',
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const resetForm = () => {
    setForm({
      amount: '',
      type: 'EXPENSE',
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
    setEditingTransaction(null);
  };

  const handleExportCSV = async () => {
    try {
      const response = await transactionService.exportCSV(searchParams);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported to CSV');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(0);

      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages - 2, currentPage + 1);

      // Adjust if at the beginning
      if (currentPage < 3) {
        end = Math.min(3, totalPages - 2);
      }
      // Adjust if at the end
      if (currentPage > totalPages - 4) {
        start = Math.max(1, totalPages - 4);
      }

      if (start > 1) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages - 1);
      }
    }

    return pages;
  };

  const switchToInfiniteMode = () => {
    // Initialize accumulated with current page data
    setAccumulatedTransactions(pageTransactions);
    setViewMode('infinite');
    // Reset to page 0 if not already, then we'll load sequentially
    if (currentPage !== 0) {
      setCurrentPage(0);
    }
  };

  const switchToPagesMode = () => {
    setViewMode('pages');
    setAccumulatedTransactions([]);
    setCurrentPage(0);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{t('transactions.title')}</h1>
          <p style={styles.subtitle}>{t('transactions.subtitle')}</p>
        </div>
        <div style={styles.headerButtons}>
          <ImportCSV onImportComplete={() => queryClient.invalidateQueries(['transactions'])} />
          <button onClick={handleExportCSV} style={styles.exportButton}>
            <span style={styles.buttonIcon}>📥</span>
            {t('transactions.exportCSV')}
          </button>
          <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
            <span style={styles.addButtonIcon}>+</span>
            {t('transactions.addTransaction')}
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div style={styles.searchSection}>
        <TransactionSearch onSearch={handleSearch} categories={categories} />
      </div>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div style={styles.savedSearchesSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}>🔖</span>
              {t('transactions.savedSearches')}
            </h3>
          </div>
          <div style={styles.savedSearchesGrid}>
            {savedSearches.map(search => (
              <SavedSearchItem
                key={search.id}
                search={search}
                onExecute={handleExecuteSavedSearch}
                onDelete={handleDeleteSavedSearch}
              />
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>
              {editingTransaction ? t('transactions.editTransaction') : t('transactions.addNewTransaction')}
            </h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} style={styles.closeButton}>×</button>
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('transactions.amount')}</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder={t('transactions.enterAmount')}
                  value={form.amount}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('transactions.transactionType')}</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="EXPENSE">{t('transactions.expense')}</option>
                  <option value="INCOME">{t('transactions.income')}</option>
                </select>
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('transactions.category')}</label>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  required
                  style={styles.select}
                >
                  <option value="">{t('transactions.selectCategoryPlaceholder')}</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('transactions.date')}</label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('transactions.description')} {t('transactions.optional')}</label>
              <input
                name="description"
                type="text"
                placeholder={t('transactions.descriptionPlaceholder')}
                value={form.description}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
            
            <div style={styles.formActions}>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={styles.cancelButton}>
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                style={styles.submitButton}
              >
                {(createMutation.isPending || updateMutation.isPending)
                  ? t('common.loading')
                  : (editingTransaction ? t('transactions.updateTransaction') : t('transactions.addTransaction'))}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      {isLoading ? (
        <div style={styles.loading}>
          <div style={styles.loadingSpinner}></div>
          <p>{t('common.loading')}</p>
        </div>
      ) : (
        <div style={styles.transactionsSection}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionHeaderLeft}>
              {transactions.length > 0 && (
                <input
                  type="checkbox"
                  checked={selectedIds.size === transactions.length && transactions.length > 0}
                  onChange={handleSelectAll}
                  style={styles.selectAllCheckbox}
                  title={t('transactions.selectAll')}
                />
              )}
              <h3 style={styles.sectionTitle}>
                <span style={styles.sectionIcon}></span>
                {t('dashboard.recentTransactions')}
                <span style={styles.badge}>{transactions.length}</span>
              </h3>
              {selectedIds.size > 0 && (
                <span style={styles.selectedCount}>
                  {t('transactions.selected', { count: selectedIds.size })}
                </span>
              )}
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                style={styles.bulkDeleteBtn}
              >
                🗑️ {bulkDeleteMutation.isPending
                  ? t('common.loading')
                  : t('transactions.deleteSelected', { count: selectedIds.size })}
              </button>
            )}
          </div>
          
          {transactions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}></div>
              <p style={styles.emptyText}>{t('transactions.noTransactionsFound')}</p>
              <p style={styles.emptySubtext}>{t('transactions.noTransactionsSubtext')}</p>
            </div>
          ) : (
            <div style={styles.transactionsList}>
              {transactions.map(tx => (
                <div key={tx.id} style={{
                  ...styles.transactionItem,
                  ...(selectedIds.has(tx.id) ? styles.transactionItemSelected : {})
                }}>
                  <div style={styles.transactionLeft}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tx.id)}
                      onChange={() => handleSelectTransaction(tx.id)}
                      style={styles.checkbox}
                    />
                    <div
                      style={{
                        ...styles.categoryIndicator,
                        backgroundColor: tx.categoryColor,
                      }}
                    />
                    <div style={styles.transactionDetails}>
                      <p style={styles.transactionCategory}>{tx.categoryName}</p>
                      <p style={styles.transactionDescription}>{tx.description || t('transactions.noDescription')}</p>
                      <p style={styles.transactionDate}>{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={styles.transactionRight}>
                    <div style={styles.transactionAmount}>
                      <span style={{
                        ...styles.amountText,
                        color: tx.type === 'INCOME' ? '#10b981' : '#ef4444'
                      }}>
                        {tx.type === 'INCOME' ? '+' : '-'}
                        {formatDualCurrency(tx.amount)}
                      </span>
                      <span style={styles.transactionType}>
                        {tx.type === 'INCOME' ? '' : ''}
                      </span>
                    </div>
                    <div style={styles.transactionActions}>
                      <button
                        onClick={() => handleEdit(tx)}
                        style={styles.editBtn}
                        title={t('common.edit')}
                      >
                        ✏️ {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        style={styles.deleteBtn}
                        title={t('common.delete')}
                      >
                        🗑️ {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination - Pages Mode */}
          {viewMode === 'pages' && totalPages > 1 && (
            <div style={styles.pagination}>
              {/* Show More button - above pagination */}
              <button
                onClick={switchToInfiniteMode}
                style={styles.showMoreToggle}
              >
                ↓ {t('pagination.showMore')}
              </button>

              {/* Pagination controls */}
              <div style={styles.paginationBottom}>
                <div style={styles.paginationInfo}>
                  {t('pagination.showing')} {currentPage * 20 + 1}-{Math.min((currentPage + 1) * 20, totalElements)} {t('pagination.of')} {totalElements}
                </div>

                <div style={styles.paginationControls}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={isFirstPage}
                    style={{
                      ...styles.pageButton,
                      ...(isFirstPage ? styles.pageButtonDisabled : {}),
                    }}
                  >
                    ← {t('pagination.previous')}
                  </button>

                  <div style={styles.pageNumbers}>
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} style={styles.ellipsis}>...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          style={{
                            ...styles.pageNumber,
                            ...(page === currentPage ? styles.pageNumberActive : {}),
                          }}
                        >
                          {page + 1}
                        </button>
                      )
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={isLastPage}
                    style={{
                      ...styles.pageButton,
                      ...(isLastPage ? styles.pageButtonDisabled : {}),
                    }}
                  >
                    {t('pagination.next')} →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Infinite Scroll Mode */}
          {viewMode === 'infinite' && (
            <div style={styles.infiniteScrollFooter}>
              <div style={styles.paginationInfo}>
                {t('pagination.showing')} {transactions.length} {t('pagination.of')} {totalElements}
              </div>

              {!isLastPage && (
                <div ref={loadMoreRef} style={styles.loadMoreTrigger}>
                  {isLoading ? (
                    <div style={styles.loadingMore}>
                      <div style={styles.loadingSpinnerSmall}></div>
                      {t('pagination.loadingMore')}
                    </div>
                  ) : (
                    <span style={styles.scrollHint}>{t('pagination.scrollForMore')}</span>
                  )}
                </div>
              )}

              {isLastPage && transactions.length > 0 && (
                <div style={styles.allLoaded}>
                  {t('pagination.allLoaded')}
                </div>
              )}

              <button
                onClick={switchToPagesMode}
                style={styles.backToPagesBtn}
              >
                ⊞ {t('pagination.backToPages')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fixed Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={styles.fixedScrollTopBtn}
          title={t('pagination.scrollToTop')}
        >
          <span style={styles.scrollTopArrow}>↑</span>
        </button>
      )}
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
    gap: isMobile ? '1rem' : '0',
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
  headerButtons: {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: '0.75rem',
    width: isMobile ? '100%' : 'auto',
  },
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
  },
  buttonIcon: {
    fontSize: '1rem',
  },
  addButtonIcon: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  searchSection: {
    marginBottom: '2rem',
  },
  savedSearchesSection: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    marginBottom: '2rem',
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 1.5rem 1rem',
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.backgroundSecondary,
  },
  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  selectAllCheckbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#059669',
  },
  selectedCount: {
    fontSize: '0.875rem',
    color: '#059669',
    fontWeight: '600',
    padding: '0.25rem 0.75rem',
    backgroundColor: '#ecfdf5',
    borderRadius: '12px',
  },
  bulkDeleteBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.25rem',
    fontWeight: '600',
    color: theme.text,
    margin: 0,
  },
  sectionIcon: {
    fontSize: '1.5rem',
  },
  badge: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginLeft: '0.5rem',
  },
  savedSearchesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
    padding: '1.5rem',
  },
  formCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadowLarge,
    marginBottom: '2rem',
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.backgroundSecondary,
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: theme.text,
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
    transition: 'color 0.2s ease',
  },
  form: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: isMobile ? '1rem' : '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: theme.text,
  },
  input: {
    padding: '0.75rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
  },
  select: {
    padding: '0.75rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    fontSize: '1rem',
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    cursor: 'pointer',
  },
  formActions: {
    display: 'flex',
    gap: '0.75rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0',
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  submitButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #059669',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  transactionsSection: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
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
  transactionsList: {
    padding: '0',
  },
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: `1px solid ${theme.borderLight}`,
    transition: 'background-color 0.2s ease',
  },
  transactionItemSelected: {
    backgroundColor: '#ecfdf5',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#059669',
    flexShrink: 0,
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
    fontWeight: '700',
    color: theme.text,
    margin: '0 0 0.25rem 0',
    fontSize: '1rem',
  },
  transactionDescription: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
    margin: '0 0 0.25rem 0',
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: '0.75rem',
    color: theme.textTertiary,
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '500',
  },
  transactionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
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
  transactionActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  // Pagination styles
  pagination: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    borderTop: `1px solid ${theme.borderLight}`,
    backgroundColor: theme.backgroundSecondary,
  },
  paginationInfo: {
    fontSize: '0.875rem',
    color: theme.textSecondary,
    fontWeight: '500',
  },
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  pageButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.5rem 1rem',
    backgroundColor: theme.cardBackground,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: theme.backgroundSecondary,
  },
  pageNumbers: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  pageNumber: {
    minWidth: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.cardBackground,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  pageNumberActive: {
    backgroundColor: '#059669',
    color: 'white',
    borderColor: '#059669',
  },
  ellipsis: {
    padding: '0 0.5rem',
    color: theme.textSecondary,
  },
  // Show More / Infinite Scroll styles
  showMoreToggle: {
    padding: '0.875rem 2.5rem',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    border: `2px solid #059669`,
    borderRadius: '50px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  paginationBottom: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
  },
  fixedScrollTopBtn: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)',
    transition: 'all 0.3s ease',
    zIndex: 1000,
    outline: 'none',
  },
  scrollTopArrow: {
    fontSize: '1.5rem',
    fontWeight: '700',
    lineHeight: 1,
    color: 'white',
  },
  infiniteScrollFooter: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    borderTop: `1px solid ${theme.borderLight}`,
    backgroundColor: theme.backgroundSecondary,
  },
  loadMoreTrigger: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem',
    width: '100%',
  },
  loadingMore: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: theme.textSecondary,
    fontSize: '0.875rem',
  },
  loadingSpinnerSmall: {
    width: '20px',
    height: '20px',
    border: '2px solid #e2e8f0',
    borderTop: '2px solid #059669',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  scrollHint: {
    color: theme.textSecondary,
    fontSize: '0.875rem',
    fontStyle: 'italic',
  },
  allLoaded: {
    color: '#059669',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    backgroundColor: '#ecfdf5',
    borderRadius: '6px',
  },
  backToPagesBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
});

export default TransactionsPage;

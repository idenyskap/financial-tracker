import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recurringTransactionService } from '../services/recurringTransactionService';
import { categoryService } from '../services/categoryService';
import RecurringTransactionCard from '../components/recurring/RecurringTransactionCard';
import { toast } from 'sonner';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useLanguage } from '../hooks/useLanguage';

function RecurringTransactionsPage() {
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    type: 'EXPENSE',
    categoryId: '',
    description: '',
    frequency: 'MONTHLY',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    dayOfMonth: '',
    dayOfWeek: '',
    active: true,
  });

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: () => recurringTransactionService.getAll(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: recurringTransactionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['recurring-transactions']);
      toast.success('Recurring transaction created successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error creating recurring transaction');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => recurringTransactionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['recurring-transactions']);
      toast.success('Recurring transaction updated successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating recurring transaction');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: recurringTransactionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['recurring-transactions']);
      toast.success('Recurring transaction deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting recurring transaction');
    },
  });

  const executeMutation = useMutation({
    mutationFn: recurringTransactionService.executeNow,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Transaction executed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error executing transaction');
    },
  });

  const transactions = transactionsData?.data || [];
  const categories = categoriesData?.data || [];

  const filteredCategories = categories.filter(cat => {
    if (!cat.type) return true;
    return cat.type === form.type;
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      ...form,
      amount: parseFloat(form.amount),
      dayOfMonth: form.dayOfMonth ? parseInt(form.dayOfMonth) : null,
      dayOfWeek: form.dayOfWeek ? parseInt(form.dayOfWeek) : null,
    };

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setForm({
      name: transaction.name,
      amount: transaction.amount,
      type: transaction.type,
      categoryId: transaction.categoryId,
      description: transaction.description || '',
      frequency: transaction.frequency,
      startDate: transaction.startDate,
      endDate: transaction.endDate || '',
      dayOfMonth: transaction.dayOfMonth || '',
      dayOfWeek: transaction.dayOfWeek || '',
      active: transaction.active,
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t('recurring.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleExecute = (id) => {
    if (window.confirm(t('recurring.confirmExecute'))) {
      executeMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      amount: '',
      type: 'EXPENSE',
      categoryId: '',
      description: '',
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      dayOfMonth: '',
      dayOfWeek: '',
      active: true,
    });
    setEditingTransaction(null);
    setShowForm(false);
  };

  const setFormPreset = (type) => {
    switch(type) {
      case 'rent':
        setForm({
          ...form,
          name: 'Monthly Rent',
          type: 'EXPENSE',
          frequency: 'MONTHLY',
          dayOfMonth: '1',
        });
        break;
      case 'salary':
        setForm({
          ...form,
          name: 'Monthly Salary',
          type: 'INCOME',
          frequency: 'MONTHLY',
          dayOfMonth: '25',
        });
        break;
      case 'weekly':
        setForm({
          ...form,
          name: 'Weekly Groceries',
          type: 'EXPENSE',
          frequency: 'WEEKLY',
          dayOfWeek: '6',
        });
        break;
      case 'subscription':
        setForm({
          ...form,
          name: 'Streaming Subscription',
          type: 'EXPENSE',
          frequency: 'MONTHLY',
          dayOfMonth: '15',
        });
        break;
    }
  };

  const getNextExecutionPreview = () => {
    if (!form.startDate || !form.frequency) return null;

    const startDate = new Date(form.startDate);
    let previewText = `${t('recurring.firstTransaction')} ${startDate.toLocaleDateString()}`;

    if (form.frequency === 'MONTHLY' && form.dayOfMonth) {
      previewText = `${t('recurring.firstTransaction')} Day ${form.dayOfMonth} of ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    } else if (form.frequency === 'WEEKLY' && form.dayOfWeek) {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      previewText = `${t('recurring.firstTransaction')} Next ${days[form.dayOfWeek - 1]} after ${startDate.toLocaleDateString()}`;
    }

    return previewText;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{t('recurring.title')}</h1>
          <p style={styles.subtitle}>{t('recurring.automateSubtitle')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.addButton}>
          <span style={styles.addButtonIcon}>+</span>
          {t('recurring.addRecurring')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>
              {editingTransaction ? t('recurring.editTransactionTitle') : t('recurring.createNewTransaction')}
            </h3>
            <button onClick={resetForm} style={styles.closeButton}>×</button>
          </div>

          {!editingTransaction && (
            <div style={styles.templatesSection}>
              <div style={styles.templatesHeader}>
                <h4 style={styles.templatesTitle}>{t('recurring.quickTemplates')}</h4>
                <p style={styles.templatesSubtitle}>{t('recurring.quickTemplatesSubtext')}</p>
              </div>
              <div style={styles.templateGrid}>
                <button type="button" onClick={() => setFormPreset('rent')} style={styles.templateButton}>
                  <span style={styles.templateIcon}></span>
                  <div style={styles.templateContent}>
                    <span style={styles.templateName}>{t('recurring.monthlyRent')}</span>
                    <span style={styles.templateDesc}>{t('recurring.firstOfMonth')}</span>
                  </div>
                </button>
                <button type="button" onClick={() => setFormPreset('salary')} style={styles.templateButton}>
                  <span style={styles.templateIcon}></span>
                  <div style={styles.templateContent}>
                    <span style={styles.templateName}>{t('recurring.monthlySalary')}</span>
                    <span style={styles.templateDesc}>{t('recurring.twentyFifthOfMonth')}</span>
                  </div>
                </button>
                <button type="button" onClick={() => setFormPreset('weekly')} style={styles.templateButton}>
                  <span style={styles.templateIcon}></span>
                  <div style={styles.templateContent}>
                    <span style={styles.templateName}>{t('recurring.weeklyShopping')}</span>
                    <span style={styles.templateDesc}>{t('recurring.everySaturday')}</span>
                  </div>
                </button>
                <button type="button" onClick={() => setFormPreset('subscription')} style={styles.templateButton}>
                  <span style={styles.templateIcon}></span>
                  <div style={styles.templateContent}>
                    <span style={styles.templateName}>{t('recurring.subscription')}</span>
                    <span style={styles.templateDesc}>{t('recurring.fifteenthOfMonth')}</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('recurring.transactionName')}</label>
                <input
                  type="text"
                  placeholder={t('recurring.transactionNamePlaceholder')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{t('recurring.amount')}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={t('recurring.amountPlaceholder')}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('recurring.transactionType')}</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value, categoryId: '' })}
                  style={styles.select}
                >
                  <option value="EXPENSE">{t('recurring.expenseOption')}</option>
                  <option value="INCOME">{t('recurring.incomeOption')}</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{t('recurring.category')}</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                  style={styles.select}
                >
                  <option value="">{t('recurring.selectCategory')}</option>
                  {filteredCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('recurring.frequency')}</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value, dayOfMonth: '', dayOfWeek: '' })}
                  style={styles.select}
                >
                  <option value="DAILY">{t('recurring.everyDay')}</option>
                  <option value="WEEKLY">{t('recurring.everyWeek')}</option>
                  <option value="BIWEEKLY">{t('recurring.everyTwoWeeks')}</option>
                  <option value="MONTHLY">{t('recurring.everyMonth')}</option>
                  <option value="QUARTERLY">{t('recurring.everyThreeMonths')}</option>
                  <option value="YEARLY">{t('recurring.everyYear')}</option>
                </select>
              </div>

              {form.frequency === 'MONTHLY' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>{t('recurring.dayOfMonth')}</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder={t('recurring.dayOfMonthPlaceholder')}
                    value={form.dayOfMonth}
                    onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
                    style={styles.input}
                  />
                </div>
              )}

              {form.frequency === 'WEEKLY' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>{t('recurring.dayOfWeek')}</label>
                  <select
                    value={form.dayOfWeek}
                    onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                    style={styles.select}
                  >
                    <option value="">{t('recurring.selectDayOfWeek')}</option>
                    <option value="1">{t('recurring.everyMonday')}</option>
                    <option value="2">{t('recurring.everyTuesday')}</option>
                    <option value="3">{t('recurring.everyWednesday')}</option>
                    <option value="4">{t('recurring.everyThursday')}</option>
                    <option value="5">{t('recurring.everyFriday')}</option>
                    <option value="6">{t('recurring.everySaturdayOption')}</option>
                    <option value="7">{t('recurring.everySunday')}</option>
                  </select>
                </div>
              )}
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('recurring.startDate')}</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{t('recurring.endDateOptional')}</label>
                <input
                  type="date"
                  placeholder="Leave empty for ongoing"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  style={styles.input}
                />
              </div>
            </div>

            {getNextExecutionPreview() && (
              <div style={styles.previewSection}>
                <div style={styles.previewIcon}></div>
                <div style={styles.previewContent}>
                  <p style={styles.previewTitle}>{t('recurring.schedulePreview')}</p>
                  <p style={styles.previewText}>{getNextExecutionPreview()}</p>
                </div>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>{t('recurring.descriptionOptional')}</label>
              <textarea
                placeholder={t('recurring.descriptionPlaceholder')}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={styles.textarea}
                rows="3"
              />
            </div>

            <div style={styles.formActions}>
              <div style={styles.checkboxSection}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <span>{t('recurring.activeCheckbox')}</span>
                </label>
              </div>

              <div style={styles.buttonActions}>
                <button type="button" onClick={resetForm} style={styles.cancelButton}>
                  {t('recurring.cancel')}
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingTransaction ? t('recurring.updateTransaction') : t('recurring.createTransaction')}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      {isLoading ? (
        <div style={styles.loading}>
          <div style={styles.loadingSpinner}></div>
          <p>{t('recurring.loading')}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}></div>
          <p style={styles.emptyText}>{t('recurring.noTransactions')}</p>
          <p style={styles.emptySubtext}>{t('recurring.noTransactionsSubtext')}</p>
          <p style={styles.emptyDescription}>{t('recurring.noTransactionsDescription')}</p>
        </div>
      ) : (
        <div style={styles.transactionsSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>
              <span style={styles.sectionIcon}></span>
              {t('recurring.title')}
              <span style={styles.badge}>{transactions.length}</span>
            </h3>
          </div>
          
          <div style={styles.grid}>
            {transactions.map(transaction => (
              <RecurringTransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onExecute={handleExecute}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: theme.background,
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: theme.text,
    marginBottom: '0.5rem',
    margin: 0,
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: '1rem',
    margin: 0,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)',
  },
  addButtonIcon: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
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
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  formTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1e293b',
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
  templatesSection: {
    padding: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#fefce8',
  },
  templatesHeader: {
    marginBottom: '1rem',
  },
  templatesTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#92400e',
    margin: '0 0 0.25rem 0',
  },
  templatesSubtitle: {
    fontSize: '0.875rem',
    color: '#a16207',
    margin: 0,
  },
  templateGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0.75rem',
  },
  templateButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: 'white',
    border: '1px solid #fed7aa',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  templateIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  templateContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  templateName: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1e293b',
  },
  templateDesc: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  form: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    backgroundColor: 'white',
  },
  select: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    resize: 'vertical',
    backgroundColor: 'white',
    fontFamily: 'inherit',
  },
  previewSection: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  previewIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#92400e',
    margin: '0 0 0.25rem 0',
  },
  previewText: {
    fontSize: '0.875rem',
    color: '#a16207',
    margin: 0,
  },
  formActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0',
  },
  checkboxSection: {
    display: 'flex',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#374151',
    cursor: 'pointer',
  },
  checkbox: {
    width: '1rem',
    height: '1rem',
  },
  buttonActions: {
    display: 'flex',
    gap: '0.75rem',
  },
  cancelButton: {
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
    padding: '0.75rem 1.5rem',
    backgroundColor: '#7c3aed',
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
    borderTop: '4px solid #7c3aed',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
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
    color: '#374151',
    marginBottom: '0.5rem',
  },
  emptySubtext: {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginBottom: '0.5rem',
  },
  emptyDescription: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    fontStyle: 'italic',
  },
  transactionsSection: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  sectionHeader: {
    padding: '1.5rem 1.5rem 1rem',
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.backgroundSecondary,
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
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    marginLeft: '0.5rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
    padding: '1.5rem',
  },
});

export default RecurringTransactionsPage;

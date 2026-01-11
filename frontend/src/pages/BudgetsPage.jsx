import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { budgetService } from '../services/budgetService';
import { categoryService } from '../services/categoryService';
import BudgetProgress from '../components/budgets/BudgetProgress';
import { toast } from 'sonner';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useLanguage } from '../hooks/useLanguage';

function BudgetsPage() {
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    period: 'MONTHLY',
    categoryId: '',
    notifyThreshold: 80,
  });

  const { data: budgetsData, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetService.getAll(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: budgetService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      toast.success('Budget created successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error creating budget');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => budgetService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      toast.success('Budget updated successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating budget');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: budgetService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      toast.success('Budget deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting budget');
    },
  });

  const budgets = budgetsData?.data || [];
  const categories = categoriesData?.data || [];
  const expenseCategories = categories.filter(cat => cat.type === 'EXPENSE');

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      ...form,
      amount: parseFloat(form.amount),
      categoryId: form.categoryId || null,
    };

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setForm({
      name: budget.name,
      amount: budget.amount,
      period: budget.period,
      categoryId: budget.categoryId || '',
      notifyThreshold: budget.notifyThreshold,
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t('budgets.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      amount: '',
      period: 'MONTHLY',
      categoryId: '',
      notifyThreshold: 80,
    });
    setEditingBudget(null);
    setShowForm(false);
  };

  const periods = [
    { value: 'WEEKLY', label: t('budgets.weekly') },
    { value: 'MONTHLY', label: t('budgets.monthly') },
    { value: 'QUARTERLY', label: t('budgets.quarterly') },
    { value: 'YEARLY', label: t('budgets.yearly') },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{t('budgets.title')}</h1>
          <p style={styles.subtitle}>{t('budgets.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          <span style={styles.addButtonIcon}>+</span>
          {t('budgets.addBudget')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>
              {editingBudget ? t('budgets.editBudget') : t('budgets.createNewBudget')}
            </h3>
            <button onClick={resetForm} style={styles.closeButton}>×</button>
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('budgets.budgetName')}</label>
                <input
                  type="text"
                  placeholder={t('budgets.namePlaceholder')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{t('budgets.budgetAmount')}</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={t('budgets.amountPlaceholder')}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>{t('budgets.period')}</label>
                <select
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  style={styles.select}
                >
                  {periods.map(period => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>{t('budgets.categoryOptional')}</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  style={styles.select}
                >
                  <option value="">{t('budgets.allCategories')}</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                {t('budgets.alertThreshold')}: {form.notifyThreshold}%
              </label>
              <div style={styles.sliderContainer}>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={form.notifyThreshold}
                  onChange={(e) => setForm({ ...form, notifyThreshold: parseInt(e.target.value) })}
                  style={styles.slider}
                />
                <div style={styles.sliderLabels}>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={resetForm} style={styles.cancelButton}>
                {t('common.cancel')}
              </button>
              <button type="submit" style={styles.submitButton}>
                {editingBudget ? t('budgets.updateBudget') : t('budgets.createBudget')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div style={styles.loading}>
          <div style={styles.loadingSpinner}></div>
          <p>{t('budgets.loading')}</p>
        </div>
      ) : budgets.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}></div>
          <p style={styles.emptyText}>{t('budgets.noBudgets')}</p>
          <p style={styles.emptySubtext}>{t('budgets.noBudgetsSubtext')}</p>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.budgetsGrid}>
            {budgets.map(budget => (
              <div key={budget.id} style={styles.budgetCard}>
                <BudgetProgress budget={budget} />
                <div style={styles.cardFooter}>
                  <div style={styles.budgetActions}>
                    <button
                      onClick={() => handleEdit(budget)}
                      style={styles.editBtn}
                      title={t('budgets.editTooltip')}
                    >
                      <Pencil size={14} /> {t('budgets.editLabel')}
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      style={styles.deleteBtn}
                      title={t('budgets.deleteTooltip')}
                    >
                      <Trash2 size={14} /> {t('budgets.deleteLabel')}
                    </button>
                  </div>
                </div>
              </div>
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
    backgroundColor: theme.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: `0 2px 4px ${theme.primaryShadow}`,
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
    color: theme.textSecondary,
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
  sliderContainer: {
    position: 'relative',
  },
  slider: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: theme.borderLight,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    color: theme.textSecondary,
  },
  formActions: {
    display: 'flex',
    gap: '0.75rem',
    paddingTop: '1rem',
    borderTop: `1px solid ${theme.border}`,
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  submitButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    backgroundColor: theme.primary,
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
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    textAlign: 'center',
    border: `1px solid ${theme.cardBorder}`,
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
  content: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  budgetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
    padding: '1.5rem',
  },
  budgetCard: {
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  cardFooter: {
    borderTop: `1px solid ${theme.borderLight}`,
    padding: '1rem',
    backgroundColor: theme.backgroundSecondary,
  },
  budgetActions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
  editBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: theme.backgroundSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: theme.textSecondary,
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#dc2626',
    transition: 'all 0.2s ease',
  },
});

export default BudgetsPage;

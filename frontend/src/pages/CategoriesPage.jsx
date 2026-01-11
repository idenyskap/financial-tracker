import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { toast } from 'sonner';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useLanguage } from '../hooks/useLanguage';

function CategoriesPage() {
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({
    name: '',
    color: '#3498db',
    type: 'EXPENSE',
  });

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Category created successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error creating category');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Category updated successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error updating category');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error deleting category');
    },
  });

  const categories = categoriesData?.data || [];

  const incomeCategories = categories.filter(cat => cat.type === 'INCOME');
  const expenseCategories = categories.filter(cat => cat.type === 'EXPENSE');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      color: category.color,
      type: category.type || 'EXPENSE',
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      color: '#3498db',
      type: 'EXPENSE',
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  const colors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#16a085',
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{t('categories.title')}</h1>
          <p style={styles.subtitle}>{t('categories.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.addButton}
        >
          <span style={styles.addButtonIcon}>+</span>
          {t('categories.addCategory')}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>
              {editingCategory ? t('categories.editCategory') : t('categories.createNewCategory')}
            </h3>
            <button onClick={resetForm} style={styles.closeButton}>×</button>
          </div>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>{t('categories.categoryName')}</label>
              <input
                type="text"
                placeholder={t('categories.namePlaceholder')}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t('categories.type')}</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={styles.select}
              >
                <option value="EXPENSE">{t('categories.expenseCategory')}</option>
                <option value="INCOME">{t('categories.incomeCategory')}</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>{t('categories.categoryColor')}</label>
              <div style={styles.colorSection}>
                <div style={styles.colorGrid}>
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      style={{
                        ...styles.colorButton,
                        backgroundColor: color,
                        transform: form.color === color ? 'scale(1.1)' : 'scale(1)',
                        boxShadow: form.color === color 
                          ? '0 0 0 3px rgba(59, 130, 246, 0.4)' 
                          : '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                      title={color}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  style={styles.colorPicker}
                />
              </div>
            </div>

            <div style={styles.formActions}>
              <button type="button" onClick={resetForm} style={styles.cancelButton}>
                {t('common.cancel')}
              </button>
              <button type="submit" style={styles.submitButton}>
                {editingCategory ? t('categories.updateCategory') : t('categories.createCategory')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div style={styles.loading}>
          <div style={styles.loadingSpinner}></div>
          <p>Loading categories...</p>
        </div>
      ) : (
        <div style={styles.content}>
          {/* Income Categories */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionIcon}></span>
                {t('categories.incomeCategories')}
                {incomeCategories.length > 0 && (
                  <span style={styles.badge}>{incomeCategories.length}</span>
                )}
              </h2>
            </div>
            
            {incomeCategories.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}></div>
                <p style={styles.emptyText}>{t('categories.noIncomeCategories')}</p>
                <p style={styles.emptySubtext}>{t('categories.incomeCategoriesSubtext')}</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {incomeCategories.map(category => (
                  <div key={category.id} style={styles.card}>
                    <div
                      style={{
                        ...styles.colorStripe,
                        backgroundColor: category.color,
                      }}
                    />
                    <div style={styles.cardContent}>
                      <div style={styles.cardMain}>
                        <h4 style={styles.cardTitle}>{category.name}</h4>
                        <div style={styles.cardActions}>
                          <button
                            onClick={() => handleEdit(category)}
                            style={styles.editBtn}
                            title={t('categories.editTooltip')}
                          >
                            <Pencil size={14} /> {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            style={styles.deleteBtn}
                            title={t('categories.deleteTooltip')}
                          >
                            <Trash2 size={14} /> {t('common.delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Categories */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>
                <span style={styles.sectionIcon}></span>
                {t('categories.expenseCategories')}
                {expenseCategories.length > 0 && (
                  <span style={styles.badge}>{expenseCategories.length}</span>
                )}
              </h2>
            </div>
            
            {expenseCategories.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}></div>
                <p style={styles.emptyText}>{t('categories.noExpenseCategories')}</p>
                <p style={styles.emptySubtext}>{t('categories.expenseCategoriesSubtext')}</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {expenseCategories.map(category => (
                  <div key={category.id} style={styles.card}>
                    <div
                      style={{
                        ...styles.colorStripe,
                        backgroundColor: category.color,
                      }}
                    />
                    <div style={styles.cardContent}>
                      <div style={styles.cardMain}>
                        <h4 style={styles.cardTitle}>{category.name}</h4>
                        <div style={styles.cardActions}>
                          <button
                            onClick={() => handleEdit(category)}
                            style={styles.editBtn}
                            title={t('categories.editTooltip')}
                          >
                            <Pencil size={14} /> {t('common.edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            style={styles.deleteBtn}
                            title={t('categories.deleteTooltip')}
                          >
                            <Trash2 size={14} /> {t('common.delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
    backgroundColor: theme.success,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: `0 2px 4px rgba(39, 174, 96, 0.2)`,
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
  colorSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(32px, 1fr))',
    gap: '0.5rem',
    maxWidth: '400px',
  },
  colorButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  colorPicker: {
    height: '40px',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: theme.inputBackground,
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  section: {
    backgroundColor: theme.cardBackground,
    borderRadius: '12px',
    boxShadow: theme.shadow,
    overflow: 'hidden',
    border: `1px solid ${theme.cardBorder}`,
  },
  sectionHeader: {
    padding: '1.5rem',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    padding: '1.5rem',
  },
  card: {
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
  },
  colorStripe: {
    width: '6px',
    flexShrink: 0,
  },
  cardContent: {
    padding: '1rem',
    flex: 1,
  },
  cardMain: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: theme.text,
    margin: 0,
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  editBtn: {
    padding: '0.5rem 0.75rem',
    backgroundColor: theme.backgroundSecondary,
    border: `1px solid ${theme.border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    color: theme.textSecondary,
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
  },
  deleteBtn: {
    padding: '0.5rem 0.75rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#dc2626',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.25rem',
  },
});

export default CategoriesPage;

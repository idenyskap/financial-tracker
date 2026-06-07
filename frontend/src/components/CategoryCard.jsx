import { useLanguage } from '../hooks/useLanguage';
import { useThemedStyles } from '../hooks/useThemedStyles';

function CategoryCard({ category, onEdit, onDelete }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(getStyles);

  const typeColors = {
    INCOME: styles.__success,
    EXPENSE: styles.__danger,
    BOTH: styles.__primary,
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.nameSection}>
          <div style={{ ...styles.colorDot, backgroundColor: category.color }} />
          <h3 style={styles.name}>{category.name}</h3>
        </div>
        <div style={styles.actions}>
          <button onClick={() => onEdit(category)} style={styles.editButton}>
            {t('common.edit')}
          </button>
          <button onClick={() => onDelete(category.id)} style={styles.deleteButton}>
            {t('common.delete')}
          </button>
        </div>
      </div>

      {category.type && (
        <span style={{
          ...styles.typeBadge,
          backgroundColor: `${typeColors[category.type] || styles.__textSecondary}1f`,
          color: typeColors[category.type] || styles.__textSecondary,
        }}>
          {category.type}
        </span>
      )}
    </div>
  );
}

const getStyles = (theme) => ({
  __success: theme.success,
  __danger: theme.danger,
  __primary: theme.primary,
  __textSecondary: theme.textSecondary,
  card: {
    backgroundColor: theme.cardBackground,
    padding: '1.25rem',
    borderRadius: theme.radiusLg,
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.75rem',
  },
  nameSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
  },
  colorDot: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  name: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 600,
    color: theme.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    flexShrink: 0,
  },
  editButton: {
    padding: '0.4rem 0.8rem',
    backgroundColor: theme.primarySoft,
    color: theme.primary,
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  deleteButton: {
    padding: '0.4rem 0.8rem',
    backgroundColor: theme.dangerSoft,
    color: theme.danger,
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  typeBadge: {
    display: 'inline-block',
    padding: '0.25rem 0.7rem',
    borderRadius: theme.radiusFull,
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.03em',
    marginTop: '0.85rem',
  },
});

export default CategoryCard;

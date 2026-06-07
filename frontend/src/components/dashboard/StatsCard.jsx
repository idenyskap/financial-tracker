import { useThemedStyles } from '../../hooks/useThemedStyles';

function StatsCard({ title, value, subtitle, color, icon }) {
  const styles = useThemedStyles(getStyles);
  const accent = color || styles.__accent;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        {icon && (
          <div style={{ ...styles.icon, backgroundColor: `${accent}1a`, color: accent }}>
            {icon}
          </div>
        )}
      </div>
      <p style={{ ...styles.value, color: accent }}>{value}</p>
      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}

const getStyles = (theme) => ({
  __accent: theme.primary,
  card: {
    backgroundColor: theme.cardBackground,
    padding: '1.5rem',
    borderRadius: theme.radiusLg,
    boxShadow: theme.shadow,
    border: `1px solid ${theme.cardBorder}`,
    flex: 1,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  title: {
    fontSize: '0.8125rem',
    color: theme.textSecondary,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    margin: 0,
  },
  value: {
    fontSize: '1.875rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: '0.25rem 0',
  },
  subtitle: {
    fontSize: '0.8125rem',
    color: theme.textTertiary,
    margin: 0,
  },
  icon: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StatsCard;

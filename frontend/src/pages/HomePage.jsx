import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useLanguage } from '../hooks/useLanguage';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelector from '../components/language/LanguageSelector';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TrophyIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const styles = useThemedStyles(getStyles);
  const { t } = useLanguage();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const features = [
    {
      icon: ChartBarIcon,
      titleKey: 'featureAnalytics',
      descKey: 'featureAnalyticsDesc',
      color: '#3498db',
    },
    {
      icon: CurrencyDollarIcon,
      titleKey: 'featureBudget',
      descKey: 'featureBudgetDesc',
      color: '#27ae60',
    },
    {
      icon: ClockIcon,
      titleKey: 'featureRecurring',
      descKey: 'featureRecurringDesc',
      color: '#f39c12',
    },
    {
      icon: TrophyIcon,
      titleKey: 'featureGoals',
      descKey: 'featureGoalsDesc',
      color: '#e74c3c',
    },
    {
      icon: ShieldCheckIcon,
      titleKey: 'featureSecurity',
      descKey: 'featureSecurityDesc',
      color: '#9b59b6',
    },
    {
      icon: SparklesIcon,
      titleKey: 'featureCategories',
      descKey: 'featureCategoriesDesc',
      color: '#1abc9c',
    },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>
            <CurrencyDollarIcon style={styles.logoIcon} />
            <h1 style={styles.logoText}>FinanceTracker</h1>
          </div>

          <nav style={styles.nav}>
            <LanguageSelector compact />
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" style={styles.navLink}>{t('home.dashboard')}</Link>
                <Link to="/profile" style={styles.navLinkPrimary}>{t('home.myAccount')}</Link>
              </>
            ) : (
              <>
                <Link to="/login" style={styles.navLink}>{t('home.login')}</Link>
                <Link to="/register" style={styles.navLinkPrimary}>{t('home.signUp')}</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h2 style={styles.heroTitle}>
            {t('home.heroTitle')}
          </h2>
          <p style={styles.heroSubtitle}>
            {t('home.heroSubtitle')}
          </p>
          <div style={styles.heroButtons}>
            <button onClick={handleGetStarted} style={styles.ctaButton}>
              {isAuthenticated ? t('home.goToDashboard') : t('home.getStartedFree')}
            </button>
            <Link to="/login" style={styles.secondaryButton}>
              {t('home.learnMore')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.features}>
        <div style={styles.featuresContent}>
          <h3 style={styles.sectionTitle}>{t('home.featuresTitle')}</h3>
          <p style={styles.sectionSubtitle}>
            {t('home.featuresSubtitle')}
          </p>

          <div style={styles.featuresGrid}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} style={styles.featureCard}>
                  <div style={{
                    ...styles.featureIcon,
                    backgroundColor: `${feature.color}20`,
                    color: feature.color,
                  }}>
                    <Icon style={styles.icon} />
                  </div>
                  <h4 style={styles.featureTitle}>{t(`home.${feature.titleKey}`)}</h4>
                  <p style={styles.featureDescription}>{t(`home.${feature.descKey}`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.cta}>
        <div style={styles.ctaContent}>
          <h3 style={styles.ctaTitle}>{t('home.ctaTitle')}</h3>
          <p style={styles.ctaSubtitle}>
            {t('home.ctaSubtitle')}
          </p>
          <button onClick={handleGetStarted} style={styles.ctaButtonLarge}>
            {isAuthenticated ? t('home.openDashboard') : t('home.createFreeAccount')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © 2025 FinanceTracker. {t('home.footer')}
        </p>
      </footer>
    </div>
  );
}

const getStyles = (theme) => ({
  container: {
    minHeight: '100vh',
    backgroundColor: theme.background,
    color: theme.text,
  },
  header: {
    borderBottom: `1px solid ${theme.border}`,
    backgroundColor: theme.backgroundSecondary,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    width: '32px',
    height: '32px',
    color: theme.primary,
  },
  logoText: {
    margin: 0,
    fontSize: '1.5rem',
    color: theme.primary,
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  navLink: {
    padding: '0.5rem 1rem',
    color: theme.text,
    textDecoration: 'none',
    borderRadius: theme.radiusSm,
    transition: 'background-color 0.2s',
  },
  navLinkPrimary: {
    padding: '0.5rem 1rem',
    background: theme.gradient,
    color: '#ffffff',
    textDecoration: 'none',
    borderRadius: theme.radiusSm,
    transition: 'opacity 0.2s',
  },
  hero: {
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: '3rem',
    marginBottom: '1rem',
    color: theme.text,
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: theme.textSecondary,
    marginBottom: '2rem',
  },
  heroButtons: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginBottom: '3rem',
  },
  ctaButton: {
    padding: '1rem 2rem',
    fontSize: '1.125rem',
    background: theme.gradient,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  secondaryButton: {
    padding: '1rem 2rem',
    fontSize: '1.125rem',
    backgroundColor: 'transparent',
    color: theme.primary,
    border: `2px solid ${theme.primary}`,
    borderRadius: theme.radiusSm,
    textDecoration: 'none',
    transition: 'background-color 0.2s',
  },
  features: {
    padding: '4rem 2rem',
    backgroundColor: theme.backgroundSecondary,
  },
  featuresContent: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '2.5rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  sectionSubtitle: {
    fontSize: '1.125rem',
    textAlign: 'center',
    color: theme.textSecondary,
    marginBottom: '3rem',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
  },
  featureCard: {
    backgroundColor: theme.cardBackground,
    padding: '2rem',
    borderRadius: theme.radius,
    boxShadow: theme.shadow,
    textAlign: 'center',
    border: `1px solid ${theme.cardBorder}`,
  },
  featureIcon: {
    width: '60px',
    height: '60px',
    borderRadius: theme.radius,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
  },
  icon: {
    width: '30px',
    height: '30px',
  },
  featureTitle: {
    fontSize: '1.25rem',
    marginBottom: '0.5rem',
  },
  featureDescription: {
    color: theme.textSecondary,
    lineHeight: '1.6',
  },
  cta: {
    padding: '4rem 2rem',
    backgroundColor: theme.backgroundTertiary,
  },
  ctaContent: {
    maxWidth: '600px',
    margin: '0 auto',
    textAlign: 'center',
  },
  ctaTitle: {
    fontSize: '2rem',
    marginBottom: '1rem',
  },
  ctaSubtitle: {
    fontSize: '1.125rem',
    color: theme.textSecondary,
    marginBottom: '2rem',
  },
  ctaButtonLarge: {
    padding: '1.25rem 3rem',
    fontSize: '1.25rem',
    background: theme.gradient,
    color: '#ffffff',
    border: 'none',
    borderRadius: theme.radiusSm,
    cursor: 'pointer',
  },
  footer: {
    padding: '2rem',
    textAlign: 'center',
    borderTop: `1px solid ${theme.border}`,
  },
  footerText: {
    color: theme.textSecondary,
  },
});

export default HomePage;

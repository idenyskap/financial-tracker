import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useLanguage } from '../../hooks/useLanguage';
import { useIsMobile } from '../../hooks/useMediaQuery';
import ThemeToggle from '../ThemeToggle';
import LanguageSelector from '../language/LanguageSelector';
import {
  HomeIcon,
  BanknotesIcon,
  TagIcon,
  WalletIcon,
  TrophyIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const styles = useThemedStyles(getStyles);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', icon: HomeIcon, label: t('navigation.dashboard') },
    { to: '/transactions', icon: BanknotesIcon, label: t('navigation.transactions') },
    { to: '/categories', icon: TagIcon, label: t('navigation.categories') },
    { to: '/budgets', icon: WalletIcon, label: t('navigation.budgets') },
    { to: '/goals', icon: TrophyIcon, label: t('navigation.goals') },
    { to: '/recurring', icon: ArrowPathIcon, label: t('navigation.recurring') },
    { to: '/currency-converter', icon: CurrencyDollarIcon, label: t('navigation.converter') },
    { to: '/profile', icon: UserCircleIcon, label: t('navigation.profile') },
  ];

  const handleNavClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const userInitial = (user?.email || '?').charAt(0).toUpperCase();

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={styles.navContent}>
          <Link to="/dashboard" style={styles.logo}>
            <span style={styles.logoMark}>FT</span>
            {!isMobile && <span style={styles.logoText}>Financial Tracker</span>}
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div style={styles.navCenter}>
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      ...styles.link,
                      ...(active ? styles.activeLink : {})
                    }}
                  >
                    <link.icon style={styles.navIcon} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          <div style={styles.navRight}>
            <LanguageSelector compact={true} />
            <ThemeToggle />
            {!isMobile && (
              <button onClick={handleLogout} style={styles.logoutBtn} title={user?.email}>
                <span style={styles.avatar}>{userInitial}</span>
                <ArrowRightOnRectangleIcon style={styles.logoutIcon} />
              </button>
            )}
            {/* Hamburger Menu Button */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={styles.hamburgerBtn}
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon style={styles.hamburgerIcon} />
                ) : (
                  <Bars3Icon style={styles.hamburgerIcon} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobile && mobileMenuOpen && (
          <div style={styles.mobileMenu}>
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={handleNavClick}
                  style={{
                    ...styles.mobileLink,
                    ...(active ? styles.activeMobileLink : {})
                  }}
                >
                  <link.icon style={styles.mobileNavIcon} />
                  {link.label}
                </Link>
              );
            })}
            <button onClick={handleLogout} style={styles.mobileLogoutBtn}>
              <ArrowRightOnRectangleIcon style={styles.mobileNavIcon} />
              {t('navigation.logout')}
            </button>
          </div>
        )}
      </nav>

      <main style={styles.main} className="fade-in">
        {children}
      </main>
    </div>
  );
}

const getStyles = (theme, { isMobile } = {}) => ({
  container: {
    minHeight: '100vh',
    backgroundColor: theme.background,
    color: theme.text,
  },
  nav: {
    backgroundColor: theme.cardBackground + 'e6',
    backdropFilter: 'saturate(180%) blur(12px)',
    WebkitBackdropFilter: 'saturate(180%) blur(12px)',
    padding: isMobile ? '0.6rem 0' : '0.7rem 0',
    borderBottom: `1px solid ${theme.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navContent: {
    maxWidth: '1440px',
    margin: '0 auto',
    padding: isMobile ? '0 1rem' : '0 1.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    color: theme.text,
    fontSize: '1.0625rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoMark: {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    background: theme.gradient,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
  },
  logoText: {
    whiteSpace: 'nowrap',
  },
  navCenter: {
    display: 'flex',
    gap: '0.15rem',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: '0.25rem',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: theme.radiusFull,
    margin: '0 1rem',
  },
  link: {
    color: theme.textSecondary,
    textDecoration: 'none',
    padding: '0.5rem 0.8rem',
    borderRadius: theme.radiusFull,
    transition: 'all 0.18s ease',
    fontSize: '0.85rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  navIcon: {
    width: '17px',
    height: '17px',
  },
  activeLink: {
    backgroundColor: theme.cardBackground,
    color: theme.primary,
    boxShadow: theme.shadow,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: isMobile ? '0.5rem' : '0.6rem',
    flexShrink: 0,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: theme.backgroundSecondary,
    color: theme.textSecondary,
    border: `1px solid ${theme.border}`,
    padding: '0.3rem 0.55rem 0.3rem 0.3rem',
    borderRadius: theme.radiusFull,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: theme.gradient,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
  },
  logoutIcon: {
    width: '18px',
    height: '18px',
  },
  hamburgerBtn: {
    backgroundColor: theme.backgroundSecondary,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    padding: '0.5rem',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerIcon: {
    width: '22px',
    height: '22px',
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.75rem 1rem 1rem',
    gap: '0.35rem',
    marginTop: '0.6rem',
    borderTop: `1px solid ${theme.border}`,
  },
  mobileLink: {
    color: theme.textSecondary,
    textDecoration: 'none',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    fontSize: '0.95rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.18s ease',
  },
  activeMobileLink: {
    backgroundColor: theme.primarySoft,
    color: theme.primary,
  },
  mobileNavIcon: {
    width: '20px',
    height: '20px',
  },
  mobileLogoutBtn: {
    backgroundColor: theme.dangerSoft,
    color: theme.danger,
    border: 'none',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.4rem',
  },
  main: {
    width: '100%',
    maxWidth: '1440px',
    margin: '0 auto',
    padding: isMobile ? '1.25rem 1rem' : '2rem 1.75rem',
  },
});

export default Layout;

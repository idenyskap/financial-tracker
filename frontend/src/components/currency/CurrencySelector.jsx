import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { ChevronDown, Search } from 'lucide-react';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const CurrencySelector = ({ value, onChange, label = "Currency" }) => {
  const styles = useThemedStyles(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const { data: currencies = [], isLoading, error } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const response = await api.get('/currency/available');
      return response.data;
    }
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const currencyList = Array.isArray(currencies) ? currencies : [];

  const filteredCurrencies = currencyList.filter(currency =>
    currency.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCurrency = currencyList.find(c => c.code === value);

  return (
    <div style={styles.wrapper} ref={dropdownRef}>
      <label style={styles.label}>
        {label}
      </label>

      <button
        type="button"
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        style={{ ...styles.trigger, ...(isLoading ? styles.triggerDisabled : {}) }}
      >
        <div style={styles.triggerInner}>
          {isLoading ? (
            <span style={styles.muted}>Loading currencies...</span>
          ) : error ? (
            <span style={styles.errorText}>Failed to load currencies</span>
          ) : selectedCurrency ? (
            <>
              <span style={styles.symbolLg}>{selectedCurrency.symbol}</span>
              <span style={styles.codeText}>{selectedCurrency.code}</span>
              <span style={styles.nameText}>
                {selectedCurrency.name}
              </span>
            </>
          ) : (
            <span style={styles.muted}>Select currency</span>
          )}
        </div>
        {isLoading ? (
          <div style={styles.spinner}></div>
        ) : (
          <ChevronDown style={{ ...styles.chevron, transform: isOpen ? 'rotate(180deg)' : 'none' }} />
        )}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.searchWrap}>
            <div style={styles.searchInner}>
              <Search style={styles.searchIcon} />
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search currencies..."
                style={styles.searchInput}
              />
            </div>
          </div>

          <div style={styles.optionList}>
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => {
                    onChange(currency.code);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  style={styles.option}
                >
                  <span style={styles.optionSymbol}>{currency.symbol}</span>
                  <span style={styles.optionCode}>{currency.code}</span>
                  <span style={styles.optionName}>
                    {currency.name}
                  </span>
                </button>
              ))
            ) : (
              <div style={styles.empty}>
                {searchTerm ? 'No currencies found' : 'No currencies available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const getStyles = (theme) => ({
  wrapper: {
    position: 'relative',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: '0.25rem',
  },
  trigger: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: theme.radiusSm,
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  triggerDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  triggerInner: {
    display: 'flex',
    alignItems: 'center',
  },
  muted: {
    color: theme.textTertiary,
  },
  errorText: {
    color: theme.danger,
  },
  symbolLg: {
    fontSize: '1.125rem',
    marginRight: '0.5rem',
  },
  codeText: {
    fontWeight: '500',
    color: theme.inputText,
  },
  nameText: {
    color: theme.textSecondary,
    marginLeft: '0.5rem',
    fontSize: '0.875rem',
  },
  spinner: {
    width: '1rem',
    height: '1rem',
    borderRadius: theme.radiusFull,
    borderBottom: `2px solid ${theme.primary}`,
    animation: 'spin 1s linear infinite',
  },
  chevron: {
    width: '1rem',
    height: '1rem',
    color: theme.textSecondary,
    transition: 'transform 0.2s',
  },
  dropdown: {
    position: 'absolute',
    zIndex: 50,
    width: '100%',
    marginTop: '0.25rem',
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: theme.radius,
    boxShadow: theme.shadowLarge,
  },
  searchWrap: {
    padding: '0.5rem',
    borderBottom: `1px solid ${theme.border}`,
  },
  searchInner: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '1rem',
    height: '1rem',
    color: theme.textTertiary,
  },
  searchInput: {
    width: '100%',
    paddingLeft: '2.25rem',
    paddingRight: '0.75rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    fontSize: '0.875rem',
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: theme.radiusSm,
    backgroundColor: theme.inputBackground,
    color: theme.inputText,
    outline: 'none',
  },
  optionList: {
    maxHeight: '16rem',
    overflowY: 'auto',
  },
  option: {
    width: '100%',
    padding: '0.5rem 0.75rem',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: theme.text,
  },
  optionSymbol: {
    fontSize: '1.125rem',
    marginRight: '0.75rem',
    width: '1.5rem',
  },
  optionCode: {
    fontWeight: '500',
    marginRight: '0.5rem',
    color: theme.text,
  },
  optionName: {
    color: theme.textSecondary,
    fontSize: '0.875rem',
  },
  empty: {
    padding: '1rem 0.75rem',
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: '0.875rem',
  },
});

export default CurrencySelector;

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { CurrencyContext } from './contexts';

export const CurrencyProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    defaultCurrency: 'USD',
    displaySecondary: false,
    secondaryCurrency: 'EUR'
  });
  const [exchangeRates, setExchangeRates] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['currencyPreferences'],
    queryFn: async () => {
      const response = await api.get('/currency/preferences');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch exchange rates when preferences change
  // Need rates when: default currency is not USD OR secondary currency display is enabled
  const needsRates = preferences.defaultCurrency !== 'USD' || preferences.displaySecondary;

  const { data: ratesData } = useQuery({
    queryKey: ['exchangeRates'],
    queryFn: async () => {
      const response = await api.get('/currency/rates/USD');
      return response.data;
    },
    enabled: needsRates,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  useEffect(() => {
    if (data) {
      setPreferences(data);
    }
  }, [data]);

  useEffect(() => {
    if (ratesData) {
      const rates = {};
      ratesData.forEach(rate => {
        rates[rate.toCurrency] = rate.rate;
      });
      setExchangeRates(rates);
    }
  }, [ratesData]);

  const convertAmount = (amount, fromCurrency = 'USD', toCurrency = null) => {
    const targetCurrency = toCurrency || preferences.defaultCurrency;
    
    // No conversion needed if currencies are the same
    if (fromCurrency === targetCurrency) {
      return amount;
    }

    // Convert from USD to target currency
    if (fromCurrency === 'USD' && exchangeRates[targetCurrency]) {
      return amount * exchangeRates[targetCurrency];
    }

    // Convert from other currency to USD first, then to target
    if (fromCurrency !== 'USD' && exchangeRates[fromCurrency]) {
      const usdAmount = amount / exchangeRates[fromCurrency];
      if (targetCurrency === 'USD') {
        return usdAmount;
      }
      if (exchangeRates[targetCurrency]) {
        return usdAmount * exchangeRates[targetCurrency];
      }
    }

    // If no conversion rate available, return original amount
    return amount;
  };

  const formatCurrency = (amount, options = {}) => {
    const {
      fromCurrency = 'USD', // Assume existing data is in USD
      toCurrency = null,
      skipConversion = false
    } = options;

    const targetCurrency = toCurrency || preferences.defaultCurrency;
    const finalAmount = skipConversion ? amount : convertAmount(amount, fromCurrency, targetCurrency);

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: targetCurrency,
    }).format(finalAmount || 0);
  };

  const formatDualCurrency = (amount, fromCurrency = 'USD') => {
    const primary = formatCurrency(amount, { fromCurrency, toCurrency: preferences.defaultCurrency });
    if (preferences.displaySecondary && preferences.secondaryCurrency !== preferences.defaultCurrency) {
      const secondary = formatCurrency(amount, { fromCurrency, toCurrency: preferences.secondaryCurrency });
      return `${primary} (${secondary})`;
    }
    return primary;
  };

  const value = {
    preferences,
    formatCurrency,
    formatDualCurrency,
    convertAmount,
    exchangeRates,
    isLoading,
    defaultCurrency: preferences.defaultCurrency,
    displaySecondary: preferences.displaySecondary,
    secondaryCurrency: preferences.secondaryCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};
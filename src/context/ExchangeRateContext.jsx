import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as storage from '../storage.js';
import { fetchRatesToRub, convertAmount, getCachedRatesDate } from '../utils/exchangeRates.js';

const ExchangeRateContext = createContext(null);

export function ExchangeRateProvider({ children }) {
  const [displayCurrency, setDisplayCurrencyState] = useState(() => storage.getDisplayCurrencyPreference());
  const [rates, setRates] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [ratesDate, setRatesDate] = useState(() => getCachedRatesDate());

  const loadRates = useCallback((opts) => {
    setStatus('loading');
    fetchRatesToRub(opts)
      .then((r) => {
        setRates(r);
        setRatesDate(getCachedRatesDate());
        setStatus('ready');
      })
      .catch(() => {
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    if (displayCurrency === 'grouped') return;
    loadRates();
  }, [displayCurrency, loadRates]);

  const setDisplayCurrency = useCallback((value) => {
    storage.setDisplayCurrencyPreference(value);
    setDisplayCurrencyState(value);
  }, []);

  const refreshRates = useCallback(() => loadRates({ force: true }), [loadRates]);

  const convert = useCallback(
    (amount, fromCode) => {
      if (displayCurrency === 'grouped' || !rates) return null;
      return convertAmount(amount, fromCode, displayCurrency, rates);
    },
    [displayCurrency, rates],
  );

  const value = useMemo(
    () => ({ displayCurrency, setDisplayCurrency, convert, status, ratesDate, refreshRates }),
    [displayCurrency, setDisplayCurrency, convert, status, ratesDate, refreshRates],
  );

  return <ExchangeRateContext.Provider value={value}>{children}</ExchangeRateContext.Provider>;
}

export function useExchangeRate() {
  const ctx = useContext(ExchangeRateContext);
  if (!ctx) throw new Error('useExchangeRate должен использоваться внутри ExchangeRateProvider');
  return ctx;
}

import { useEffect, useRef, useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useExchangeRate } from '../context/ExchangeRateContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { todayISO } from '../utils/dates.js';
import { CURRENCIES } from '../utils/money.js';
import { LANGUAGES } from '../i18n/index.js';
import { getChangelog } from '../data/changelog.js';
import * as storage from '../storage.js';
import { hashPin } from '../utils/pin.js';
import { isBiometricAvailable, registerBiometric } from '../utils/webauthn.js';
import PinPad from '../components/PinPad.jsx';

const THEME_OPTIONS = [
  { value: 'system', key: 'settings.theme.system' },
  { value: 'light', key: 'settings.theme.light' },
  { value: 'dark', key: 'settings.theme.dark' },
];

const BACKUP_OPTIONS = [
  { value: 0, key: 'settings.backup.off' },
  { value: 7, key: 'settings.backup.every7' },
  { value: 14, key: 'settings.backup.every14' },
  { value: 30, key: 'settings.backup.every30' },
];

export default function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const { exportData, importData, importCsv } = useAppData();
  const { displayCurrency, setDisplayCurrency, status, ratesDate, refreshRates } = useExchangeRate();
  const { t, language, setLanguage } = useLanguage();
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  const [backupDays, setBackupDays] = useState(() => storage.getBackupReminderDays());
  const [lastExportAt, setLastExportAt] = useState(() => storage.getLastExportAt());

  const [customCategories, setCustomCategories] = useState(() => storage.getCustomCategories());
  const [newCategoryName, setNewCategoryName] = useState('');

  const [lockEnabled, setLockEnabled] = useState(() => storage.isAppLockEnabled());
  const [hasPin, setHasPin] = useState(() => Boolean(storage.getPinHash()));
  const [biometricOn, setBiometricOn] = useState(() => storage.isBiometricEnabled());
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [pinStep, setPinStep] = useState(null); // null | 'enter' | 'confirm'
  const [pinFirstEntry, setPinFirstEntry] = useState(null);
  const [pinError, setPinError] = useState(null);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
  }, []);

  function handleExport() {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `подписки-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const now = new Date().toISOString();
    storage.setLastExportAt(now);
    setLastExportAt(now);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (isCsv) {
          const created = importCsv(String(reader.result));
          setMessage({ type: 'success', text: t('settings.data.importSuccessCsv', { count: created.length }) });
        } else {
          importData(String(reader.result));
          setMessage({ type: 'success', text: t('settings.data.importSuccessJson') });
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.message || t('settings.data.importError') });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleAddCategory(e) {
    e.preventDefault();
    const created = storage.addCustomCategory(newCategoryName);
    if (created) {
      setCustomCategories(storage.getCustomCategories());
      setNewCategoryName('');
    }
  }

  function handleDeleteCategory(id) {
    storage.deleteCustomCategory(id);
    setCustomCategories(storage.getCustomCategories());
  }

  function handleBackupDaysChange(value) {
    const days = Number(value);
    storage.setBackupReminderDays(days);
    setBackupDays(days);
  }

  function handleLockToggle(checked) {
    if (checked) {
      if (hasPin) {
        storage.setAppLockEnabled(true);
        setLockEnabled(true);
      } else {
        startPinSetup();
      }
    } else {
      storage.setAppLockEnabled(false);
      setLockEnabled(false);
    }
  }

  function startPinSetup() {
    setPinFirstEntry(null);
    setPinError(null);
    setPinStep('enter');
  }

  function cancelPinSetup() {
    setPinStep(null);
    setPinFirstEntry(null);
    setPinError(null);
  }

  async function handlePinEntry(pin) {
    if (pinStep === 'enter') {
      setPinFirstEntry(pin);
      setPinStep('confirm');
      return;
    }
    if (pinStep === 'confirm') {
      if (pin !== pinFirstEntry) {
        setPinError(t('lock.mismatch'));
        setPinFirstEntry(null);
        setPinStep('enter');
        return;
      }
      const hash = await hashPin(pin);
      storage.setPinHash(hash);
      storage.setAppLockEnabled(true);
      setHasPin(true);
      setLockEnabled(true);
      setPinStep(null);
      setPinFirstEntry(null);
      setPinError(null);
    }
  }

  async function handleBiometricToggle(checked) {
    if (!checked) {
      storage.setBiometricEnabled(false);
      setBiometricOn(false);
      return;
    }
    try {
      const credentialId = await registerBiometric();
      storage.setBiometricCredentialId(credentialId);
      storage.setBiometricEnabled(true);
      setBiometricOn(true);
    } catch {
      // Пользователь отменил системный запрос или биометрия недоступна — оставляем выключенной
    }
  }

  return (
    <div className="screen settings-screen">
      <section className="settings-section">
        <h2>{t('settings.theme')}</h2>
        <div className="theme-options">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`theme-option${theme === opt.value ? ' theme-option--active' : ''}`}
              onClick={() => setTheme(opt.value)}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>{t('settings.language')}</h2>
        <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
        <p className="settings-hint">{t('settings.language.hint')}</p>
      </section>

      <section className="settings-section">
        <h2>{t('settings.currency.title')}</h2>
        <p className="settings-hint">{t('settings.currency.hint')}</p>
        <select className="input" value={displayCurrency} onChange={(e) => setDisplayCurrency(e.target.value)}>
          <option value="grouped">{t('settings.currency.grouped')}</option>
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {t('settings.currency.all')} {c.symbol} {c.code}
            </option>
          ))}
        </select>
        {displayCurrency !== 'grouped' && (
          <p className="settings-hint">
            {status === 'loading' && t('settings.currency.loading')}
            {status === 'ready' && ratesDate && `${t('settings.currency.ratesOn')} ${ratesDate.slice(0, 10)}. `}
            {status === 'error' && `${t('settings.currency.error')} `}
            {status !== 'loading' && (
              <button className="settings-inline-link" onClick={refreshRates}>
                {t('settings.currency.refresh')}
              </button>
            )}
          </p>
        )}
      </section>

      <section className="settings-section">
        <h2>{t('settings.categories.title')}</h2>
        <p className="settings-hint">{t('settings.categories.hint')}</p>
        {customCategories.length > 0 && (
          <ul className="custom-category-list">
            {customCategories.map((c) => (
              <li key={c.id} className="custom-category-list__item">
                <span>{c.name}</span>
                <button
                  type="button"
                  className="custom-category-list__remove"
                  onClick={() => handleDeleteCategory(c.id)}
                  aria-label={t('settings.categories.remove')}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="settings-add-category" onSubmit={handleAddCategory}>
          <input
            className="input"
            type="text"
            placeholder={t('settings.categories.placeholder')}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button className="btn btn--secondary" type="submit" disabled={!newCategoryName.trim()}>
            {t('settings.categories.add')}
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h2>{t('settings.backup.title')}</h2>
        <p className="settings-hint">{t('settings.backup.hint')}</p>
        <select className="input" value={backupDays} onChange={(e) => handleBackupDaysChange(e.target.value)}>
          {BACKUP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.key)}
            </option>
          ))}
        </select>
        <p className="settings-hint">
          {t('settings.backup.lastExport')}{' '}
          {lastExportAt ? new Date(lastExportAt).toLocaleDateString() : t('settings.backup.never')}
        </p>
      </section>

      <section className="settings-section">
        <h2>{t('settings.security.title')}</h2>
        <p className="settings-hint">{t('settings.security.hint')}</p>
        <label className="toggle-row">
          <span>{t('settings.security.enable')}</span>
          <input type="checkbox" checked={lockEnabled} onChange={(e) => handleLockToggle(e.target.checked)} />
        </label>

        {pinStep && (
          <div className="pin-setup">
            <p className="settings-hint">{pinStep === 'enter' ? t('lock.setupTitle') : t('lock.confirmTitle')}</p>
            <PinPad key={pinStep} onComplete={handlePinEntry} error={pinError} />
            <button className="btn btn--secondary btn--block" onClick={cancelPinSetup}>
              {t('common.cancel')}
            </button>
          </div>
        )}

        {hasPin && !pinStep && (
          <button className="btn btn--secondary btn--block" onClick={startPinSetup}>
            {t('settings.security.changePin')}
          </button>
        )}

        {lockEnabled && hasPin && biometricAvailable && (
          <label className="toggle-row">
            <span>{t('settings.security.biometric')}</span>
            <input
              type="checkbox"
              checked={biometricOn}
              onChange={(e) => handleBiometricToggle(e.target.checked)}
            />
          </label>
        )}
      </section>

      <section className="settings-section">
        <h2>{t('settings.data')}</h2>
        <p className="settings-hint">{t('settings.data.hint')}</p>
        <button className="btn btn--secondary btn--block" onClick={handleExport}>
          {t('settings.data.export')}
        </button>
        <button className="btn btn--secondary btn--block" onClick={handleImportClick}>
          {t('settings.data.import')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json,.csv,text/csv"
          className="visually-hidden"
          onChange={handleFileChange}
        />
        {message && <p className={`settings-message settings-message--${message.type}`}>{message.text}</p>}
      </section>

      <section className="settings-section">
        <button className="btn btn--secondary btn--block" onClick={() => setShowWhatsNew((v) => !v)}>
          {t('settings.whatsNew')}
        </button>
        {showWhatsNew && (
          <div className="whats-new">
            {getChangelog(language).map((entry) => (
              <div key={entry.date} className="whats-new__entry">
                <p className="whats-new__date">{entry.date}</p>
                <ul className="whats-new__list">
                  {entry.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="settings-section">
        <button className="btn btn--secondary btn--block" onClick={() => setShowAbout((v) => !v)}>
          {t('settings.about')}
        </button>
        {showAbout && <p className="settings-hint">{t('settings.about.text')}</p>}
      </section>
    </div>
  );
}

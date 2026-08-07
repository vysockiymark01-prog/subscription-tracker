import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import * as storage from '../storage.js';
import { verifyPin } from '../utils/pin.js';
import { verifyBiometric } from '../utils/webauthn.js';
import PinPad from '../components/PinPad.jsx';

export default function LockScreen({ onUnlock }) {
  const { t } = useLanguage();
  const [error, setError] = useState(null);
  const biometricEnabled = storage.isBiometricEnabled();
  const credentialId = storage.getBiometricCredentialId();

  useEffect(() => {
    if (biometricEnabled && credentialId) {
      tryBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function tryBiometric() {
    try {
      const ok = await verifyBiometric(credentialId);
      if (ok) onUnlock();
    } catch {
      // Пользователь мог отменить системный запрос — просто остаёмся на PIN
    }
  }

  async function handlePin(pin) {
    const hash = storage.getPinHash();
    const ok = await verifyPin(pin, hash);
    if (ok) {
      setError(null);
      onUnlock();
    } else {
      setError(t('lock.wrong'));
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-screen__title">{t('lock.enterPin')}</div>
      <PinPad onComplete={handlePin} error={error} />
      {biometricEnabled && credentialId && (
        <button className="btn btn--secondary" onClick={tryBiometric}>
          {t('lock.useBiometric')}
        </button>
      )}
    </div>
  );
}

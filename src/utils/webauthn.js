// Локальная разблокировка биометрией через WebAuthn platform authenticator
// (отпечаток пальца / лицо на устройстве). Важная оговорка: без собственного
// сервера мы не можем криптографически проверить подпись — просто просим
// браузер запросить биометрию и считаем успешный ответ разблокировкой.
// Это удобство, а не защита банковского уровня; PIN-код остаётся резервным входом.

function toBase64Url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function isBiometricAvailable() {
  if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometric() {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Трекер подписок' },
      user: { id: userId, name: 'user', displayName: 'Пользователь приложения' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
      timeout: 60000,
    },
  });
  if (!credential) throw new Error('Не удалось создать биометрический ключ');
  return toBase64Url(credential.rawId);
}

export async function verifyBiometric(credentialId) {
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ id: fromBase64Url(credentialId), type: 'public-key' }],
      userVerification: 'required',
      timeout: 60000,
    },
  });
  return Boolean(assertion);
}

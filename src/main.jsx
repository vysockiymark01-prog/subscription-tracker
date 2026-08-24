import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { installPullToRefreshGuard } from './utils/preventPullToRefresh.js'
import { registerSW } from 'virtual:pwa-register'

installPullToRefreshGuard()

// Без ручной регистрации браузер мог по умолчанию не проверять новую версию
// сутками, из-за чего задеплоенные исправления не доходили до пользователя.
// Здесь — проверка сразу при открытии, каждые 15 минут, пока приложение
// открыто, и при каждом возврате в приложение (сворачивали/разворачивали).
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      registration.update()
      setInterval(() => registration.update(), 15 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update()
      })
    },
  })
  // registerType: 'autoUpdate' сам активирует новую версию и перезагрузит
  // страницу, когда она будет готова — updateSW() ничего дополнительно не
  // требует, но держим ссылку на случай будущих доработок (например, кнопки
  // «Доступно обновление» вместо тихой перезагрузки).
  void updateSW
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

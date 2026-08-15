// Отключает системный жест «потянуть вниз, чтобы обновить» (стрелка-загрузка
// поверх страницы), не трогая обычный скролл. В отличие от CSS-свойства
// overscroll-behavior (которое в TWA на Android иногда ломает скролл одним
// пальцем целиком), здесь мы блокируем только сам жест: когда пользователь
// тянет вниз, а ближайший прокручиваемый контейнер уже находится в самом
// верху (scrollTop === 0) — событие подавляется, обычный скролл при этом
// не затрагивается вообще.

let startY = 0;

function findScrollParent(node) {
  let el = node;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.nodeType === 1) {
      const style = window.getComputedStyle(el);
      const canScrollY = style.overflowY === 'auto' || style.overflowY === 'scroll';
      if (canScrollY && el.scrollHeight > el.clientHeight) return el;
    }
    el = el.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

function handleTouchStart(e) {
  if (e.touches.length !== 1) return;
  startY = e.touches[0].clientY;
}

function handleTouchMove(e) {
  if (e.touches.length !== 1) return;
  const currentY = e.touches[0].clientY;
  const pullingDown = currentY - startY > 0;
  if (!pullingDown) return;

  const scrollParent = findScrollParent(e.target);
  if (scrollParent.scrollTop <= 0) {
    e.preventDefault();
  }
}

export function installPullToRefreshGuard() {
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
}

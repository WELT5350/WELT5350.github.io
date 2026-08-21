// 夜间星标：只在暗色模式下亮起、可点击，通过隐藏锚点走客户端路由进入梦境之门。
let cleanupNightStar: (() => void) | undefined;

function initialiseNightStar() {
  cleanupNightStar?.();

  const star = document.querySelector<HTMLButtonElement>('[data-night-star]');
  const doorLink = document.getElementById('dream-door-link');
  if (!star || !doorLink) return;

  const enterDream = () => {
    if (document.documentElement.classList.contains('dark')) {
      doorLink.click();
    }
  };

  star.addEventListener('click', enterDream);
  cleanupNightStar = () => {
    star.removeEventListener('click', enterDream);
  };
}

document.addEventListener('astro:page-load', initialiseNightStar);

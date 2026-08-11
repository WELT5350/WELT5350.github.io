let cleanupReadingLayer: (() => void) | undefined;

function initializeReadingLayer() {
  cleanupReadingLayer?.();

  const article = document.querySelector<HTMLElement>('[data-article-content]');
  const panel = document.getElementById('reading-panel');
  const toggle = document.querySelector<HTMLButtonElement>('[data-reading-toggle]');
  const closeButton = document.querySelector<HTMLButtonElement>('[data-reading-close]');
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-reading-link]'));
  const meters = Array.from(document.querySelectorAll<HTMLElement>('[data-reading-meter]'));
  const progressBars = Array.from(document.querySelectorAll<HTMLElement>('[data-reading-progress]'));

  if (!article || links.length === 0) return;

  const headingElements = links
    .map((link) => document.getElementById(link.dataset.headingSlug || ''))
    .filter((heading): heading is HTMLElement => Boolean(heading));

  function setPanel(open: boolean) {
    if (!panel || !toggle) return;
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '关闭文章目录' : '打开文章目录');
  }

  function updateProgress() {
    const articleStart = article.getBoundingClientRect().top + window.scrollY;
    const readableHeight = Math.max(1, article.offsetHeight - window.innerHeight * 0.45);
    const progress = Math.min(100, Math.max(0, ((window.scrollY - articleStart) / readableHeight) * 100));

    progressBars.forEach((bar) => {
      bar.style.transform = `scaleX(${progress / 100})`;
    });
    meters.forEach((meter) => meter.setAttribute('aria-valuenow', String(Math.round(progress))));
  }

  function setActiveHeading(slug: string) {
    links.forEach((link) => {
      const active = link.dataset.headingSlug === slug;
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
      link.classList.toggle('bg-blue-50/70', active);
      link.classList.toggle('text-blue-700', active);
      link.classList.toggle('dark:bg-blue-950/40', active);
      link.classList.toggle('dark:text-blue-300', active);
    });
  }

  function updateActiveHeading() {
    const marker = window.innerHeight * 0.3;
    const active = headingElements.reduce<HTMLElement | undefined>((current, heading) => (
      heading.getBoundingClientRect().top <= marker ? heading : current
    ), headingElements[0]);
    if (active) setActiveHeading(active.id);
  }

  function updateReadingState() {
    updateProgress();
    updateActiveHeading();
  }

  let animationFrame: number | undefined;
  const onScroll = () => {
    if (animationFrame !== undefined) return;
    animationFrame = window.requestAnimationFrame(() => {
      animationFrame = undefined;
      updateReadingState();
    });
  };
  const onToggle = () => setPanel(panel?.classList.contains('hidden') ?? false);
  const onClose = () => setPanel(false);
  const onLinkClick = (event: Event) => {
    const link = event.currentTarget as HTMLAnchorElement;
    setActiveHeading(link.dataset.headingSlug || '');
    onClose();
  };
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setPanel(false);
  };

  updateReadingState();
  window.addEventListener('scroll', onScroll, { passive: true });
  toggle?.addEventListener('click', onToggle);
  closeButton?.addEventListener('click', onClose);
  document.addEventListener('keydown', onEscape);
  links.forEach((link) => link.addEventListener('click', onLinkClick));

  cleanupReadingLayer = () => {
    if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
    window.removeEventListener('scroll', onScroll);
    toggle?.removeEventListener('click', onToggle);
    closeButton?.removeEventListener('click', onClose);
    document.removeEventListener('keydown', onEscape);
    links.forEach((link) => link.removeEventListener('click', onLinkClick));
  };
}

document.addEventListener('astro:page-load', initializeReadingLayer);

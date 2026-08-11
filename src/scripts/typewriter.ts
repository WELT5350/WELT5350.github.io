let cleanupTypewriter: (() => void) | undefined;

function initialiseTypewriter() {
  cleanupTypewriter?.();

  const heading = document.getElementById('typewriter-heading');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!heading || reduceMotion) return;

  const text = heading.textContent?.trim() || '';
  heading.setAttribute('aria-label', text);
  heading.textContent = '';

  const cursor = document.createElement('span');
  cursor.textContent = '\u2502';
  cursor.style.cssText = 'font-weight:300;margin-left:2px;animation:typewriter-blink 0.8s step-end infinite;';
  cursor.classList.add('typewriter-cursor');
  heading.appendChild(cursor);

  let index = 0;
  let timeout: number | undefined;
  const type = () => {
    if (index >= text.length) return;
    heading.insertBefore(document.createTextNode(text[index]), cursor);
    index += 1;
    const delay = text[index - 1] === '，' ? 120 : 45 + Math.random() * 25;
    timeout = window.setTimeout(type, delay);
  };

  timeout = window.setTimeout(type, 80);
  cleanupTypewriter = () => {
    if (timeout !== undefined) window.clearTimeout(timeout);
  };
}

document.addEventListener('astro:page-load', initialiseTypewriter);

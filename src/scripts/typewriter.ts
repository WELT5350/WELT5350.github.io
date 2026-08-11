const h1 = document.getElementById('typewriter-heading');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (h1 && h1.dataset.twDone !== 'true' && !reduceMotion) {
  h1.dataset.twDone = 'true';

  const text = h1.textContent?.trim() || '';
  h1.setAttribute('aria-label', text);
  h1.textContent = '';
  const cursor = document.createElement('span');
  cursor.textContent = '\u2502';
  cursor.style.cssText = 'font-weight:300;margin-left:2px;animation:typewriter-blink 0.8s step-end infinite;';
  cursor.classList.add('typewriter-cursor');
  h1.appendChild(cursor);

  let i = 0;
  function type() {
    if (i < text.length) {
      h1!.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
      const delay = text[i - 1] === '！' ? 120 : 45 + Math.random() * 25;
      setTimeout(type, delay);
    }
  }
  setTimeout(type, 80);
}

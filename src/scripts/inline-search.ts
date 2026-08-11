interface SearchEntry {
  title: string;
  description: string;
  tags: string[];
  date: string;
  href: string;
}

let cleanupInlineSearch: (() => void) | undefined;

function initialiseInlineSearch() {
  cleanupInlineSearch?.();

  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-site-search]'));
  const mobilePanel = document.getElementById('mobile-search-panel');
  const mobileToggle = document.querySelector<HTMLButtonElement>('[data-mobile-search-toggle]');
  if (roots.length === 0) return;

  const cleanups: Array<() => void> = [];
  let mobileIsOpen = false;

  const setMobileOpen = (open: boolean, shouldFocus = false) => {
    if (!mobilePanel || !mobileToggle) return;
    mobileIsOpen = open;
    mobilePanel.dataset.state = open ? 'open' : 'closed';
    mobileToggle.setAttribute('aria-expanded', String(open));
    if (open && shouldFocus) {
      window.requestAnimationFrame(() => roots.find((root) => root.classList.contains('site-search-mobile'))
        ?.querySelector<HTMLInputElement>('[data-search-input]')?.focus());
    }
  };

  roots.forEach((root) => {
    const input = root.querySelector<HTMLInputElement>('[data-search-input]');
    const results = root.querySelector<HTMLElement>('[data-search-results]');
    if (!input || !results) return;

    const index = JSON.parse(root.dataset.searchIndex || '[]') as SearchEntry[];
    let selectedIndex = -1;
    let blurTimer: number | undefined;

    const normalise = (value: string) => value.trim().toLocaleLowerCase();
    const formatDate = (date: string) => new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(date));
    const getMatches = (query: string) => {
      const normalizedQuery = normalise(query);
      if (!normalizedQuery) return [];
      return index
        .map((entry) => {
          const titleMatch = normalise(entry.title).includes(normalizedQuery);
          const tagMatch = entry.tags.some((tag) => normalise(tag).includes(normalizedQuery));
          const descriptionMatch = normalise(entry.description).includes(normalizedQuery);
          return { entry, score: titleMatch ? 3 : tagMatch ? 2 : descriptionMatch ? 1 : 0 };
        })
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date))
        .slice(0, 8)
        .map((match) => match.entry);
    };

    const closeResults = () => {
      root.dataset.open = 'false';
      root.dataset.expanded = String(input.value.trim().length > 0);
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      selectedIndex = -1;
    };

    const openResults = () => {
      if (blurTimer !== undefined) window.clearTimeout(blurTimer);
      root.dataset.open = 'true';
      input.setAttribute('aria-expanded', 'true');
    };

    const render = () => {
      const matches = getMatches(input.value);
      selectedIndex = matches.length > 0 ? Math.min(selectedIndex, matches.length - 1) : -1;
      results.replaceChildren();

      const message = document.createElement('p');
      message.className = 'site-search-hint';
      if (!input.value.trim()) {
        message.textContent = '输入关键词，寻找一篇文章。';
        results.appendChild(message);
        input.removeAttribute('aria-activedescendant');
        return;
      }
      if (matches.length === 0) {
        message.textContent = '没有找到相关文章，试试更短的关键词。';
        results.appendChild(message);
        input.removeAttribute('aria-activedescendant');
        return;
      }

      const list = document.createElement('ul');
      list.className = 'site-search-list';
      matches.forEach((entry, index) => {
        const item = document.createElement('li');
        item.className = 'site-search-item';
        item.style.animationDelay = `${Math.min(index, 5) * 26}ms`;
        const link = document.createElement('a');
        const active = index === selectedIndex;
        link.id = `${input.id}-option-${index}`;
        link.href = entry.href;
        link.setAttribute('role', 'option');
        link.setAttribute('aria-selected', String(active));
        link.className = `site-search-result ${active ? 'is-active' : ''}`;

        const meta = document.createElement('div');
        meta.className = 'site-search-meta';
        const date = document.createElement('time');
        date.dateTime = entry.date;
        date.textContent = formatDate(entry.date);
        meta.appendChild(date);
        entry.tags.slice(0, 2).forEach((tag) => {
          const tagLabel = document.createElement('span');
          tagLabel.textContent = tag;
          meta.appendChild(tagLabel);
        });

        const title = document.createElement('p');
        title.className = 'site-search-title';
        title.textContent = entry.title;
        const description = document.createElement('p');
        description.className = 'site-search-description';
        description.textContent = entry.description;
        link.append(meta, title, description);
        item.appendChild(link);
        list.appendChild(item);
      });
      results.appendChild(list);
      if (selectedIndex >= 0) input.setAttribute('aria-activedescendant', `${input.id}-option-${selectedIndex}`);
    };

    const moveSelection = (direction: 1 | -1) => {
      const matches = getMatches(input.value);
      if (matches.length === 0) return;
      selectedIndex = selectedIndex < 0
        ? (direction === 1 ? 0 : matches.length - 1)
        : (selectedIndex + direction + matches.length) % matches.length;
      render();
      results.querySelector<HTMLElement>(`#${input.id}-option-${selectedIndex}`)?.scrollIntoView({ block: 'nearest' });
    };

    const onFocus = () => { openResults(); render(); };
    const onInput = () => {
      selectedIndex = -1;
      root.dataset.expanded = String(input.value.trim().length > 0);
      openResults();
      render();
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        input.value = '';
        root.dataset.expanded = 'false';
        closeResults();
        input.blur();
        if (root.classList.contains('site-search-mobile')) setMobileOpen(false);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveSelection(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveSelection(-1);
      } else if (event.key === 'Enter' && selectedIndex >= 0) {
        event.preventDefault();
        results.querySelector<HTMLAnchorElement>(`#${input.id}-option-${selectedIndex}`)?.click();
      }
    };
    const onFocusOut = () => {
      blurTimer = window.setTimeout(() => {
        if (!root.contains(document.activeElement)) closeResults();
      }, 120);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!root.classList.contains('site-search-desktop') || document.activeElement === input) return;
      event.preventDefault();
      input.focus();
    };

    input.addEventListener('focus', onFocus);
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeydown);
    root.addEventListener('focusout', onFocusOut);
    root.querySelector<HTMLElement>('.site-search-field')?.addEventListener('pointerdown', onPointerDown);
    cleanups.push(() => {
      if (blurTimer !== undefined) window.clearTimeout(blurTimer);
      input.removeEventListener('focus', onFocus);
      input.removeEventListener('input', onInput);
      input.removeEventListener('keydown', onKeydown);
      root.removeEventListener('focusout', onFocusOut);
      root.querySelector<HTMLElement>('.site-search-field')?.removeEventListener('pointerdown', onPointerDown);
    });
  });

  const onShortcut = (event: KeyboardEvent) => {
    if (!((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k')) return;
    event.preventDefault();
    const desktopInput = roots.find((root) => root.classList.contains('site-search-desktop') && root.getClientRects().length > 0)
      ?.querySelector<HTMLInputElement>('[data-search-input]');
    if (desktopInput) {
      desktopInput.focus();
      return;
    }
    setMobileOpen(true, true);
  };
  document.addEventListener('keydown', onShortcut);
  cleanups.push(() => document.removeEventListener('keydown', onShortcut));

  if (mobileToggle) {
    const onMobileToggle = () => setMobileOpen(!mobileIsOpen, !mobileIsOpen);
    mobileToggle.addEventListener('click', onMobileToggle);
    cleanups.push(() => mobileToggle.removeEventListener('click', onMobileToggle));
  }

  cleanupInlineSearch = () => cleanups.forEach((cleanup) => cleanup());
}

document.addEventListener('astro:page-load', initialiseInlineSearch);

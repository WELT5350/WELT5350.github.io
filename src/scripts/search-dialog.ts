interface SearchEntry {
  title: string;
  description: string;
  tags: string[];
  date: string;
  href: string;
}

let cleanupSearchDialog: (() => void) | undefined;

function initializeSearchDialog() {
  cleanupSearchDialog?.();

  const dialog = document.querySelector<HTMLElement>('[data-search-dialog]');
  const triggers = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-search-trigger]'));
  const input = dialog?.querySelector<HTMLInputElement>('[data-search-input]');
  const results = dialog?.querySelector<HTMLElement>('[data-search-results]');
  const closeButton = dialog?.querySelector<HTMLButtonElement>('[data-search-close]');
  const backdrop = dialog?.querySelector<HTMLElement>('[data-search-backdrop]');

  if (!dialog || !input || !results || !closeButton || !backdrop) return;

  const searchDialog = dialog;
  const searchInput = input;
  const searchResults = results;
  const searchCloseButton = closeButton;
  const searchBackdrop = backdrop;

  const index = JSON.parse(searchDialog.dataset.searchIndex || '[]') as SearchEntry[];
  let selectedIndex = -1;
  let lastTrigger: HTMLButtonElement | undefined;
  let isOpen = false;

  const normalise = (value: string) => value.trim().toLocaleLowerCase();
  const formatDate = (date: string) => new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(date));

  function setExpanded(expanded: boolean) {
    triggers.forEach((trigger) => trigger.setAttribute('aria-expanded', String(expanded)));
  }

  function getMatches(query: string) {
    const normalizedQuery = normalise(query);
    if (!normalizedQuery) return [];

    return index
      .map((entry) => {
        const titleMatch = normalise(entry.title).includes(normalizedQuery);
        const tagMatch = entry.tags.some((tag) => normalise(tag).includes(normalizedQuery));
        const descriptionMatch = normalise(entry.description).includes(normalizedQuery);
        const score = titleMatch ? 3 : tagMatch ? 2 : descriptionMatch ? 1 : 0;
        return { entry, score };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score || b.entry.date.localeCompare(a.entry.date))
      .slice(0, 8)
      .map((match) => match.entry);
  }

  function render() {
    const matches = getMatches(searchInput.value);
    selectedIndex = matches.length > 0 ? Math.min(selectedIndex, matches.length - 1) : -1;
    searchResults.replaceChildren();

    if (!searchInput.value.trim()) {
      const hint = document.createElement('p');
      hint.className = 'px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400';
      hint.textContent = '输入关键词，搜索文章标题、摘要或标签。';
      searchResults.appendChild(hint);
      searchInput.removeAttribute('aria-activedescendant');
      return;
    }

    if (matches.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400';
      empty.textContent = '没有找到相关文章，试试更短的关键词。';
      searchResults.appendChild(empty);
      searchInput.removeAttribute('aria-activedescendant');
      return;
    }

    const list = document.createElement('ul');
    list.className = 'space-y-1';
    matches.forEach((entry, index) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      const active = index === selectedIndex;
      link.id = `site-search-option-${index}`;
      link.href = entry.href;
      link.setAttribute('role', 'option');
      link.setAttribute('aria-selected', String(active));
      link.className = `block rounded-xl px-3 py-3 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${active ? 'bg-blue-50/80 dark:bg-blue-950/40' : 'hover:bg-blue-50/60 dark:hover:bg-blue-950/30'}`;
      link.addEventListener('click', () => close(false));

      const meta = document.createElement('div');
      meta.className = 'mb-1 flex items-center gap-2 text-[11px]';
      const date = document.createElement('time');
      date.className = 'font-medium text-blue-600 dark:text-blue-300';
      date.dateTime = entry.date;
      date.textContent = formatDate(entry.date);
      meta.appendChild(date);
      entry.tags.slice(0, 2).forEach((tag) => {
        const tagLabel = document.createElement('span');
        tagLabel.className = 'rounded-full bg-blue-100/70 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        tagLabel.textContent = tag;
        meta.appendChild(tagLabel);
      });

      const title = document.createElement('p');
      title.className = 'text-sm font-semibold text-gray-900 dark:text-gray-100';
      title.textContent = entry.title;
      const description = document.createElement('p');
      description.className = 'mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400';
      description.textContent = entry.description;
      link.append(meta, title, description);
      item.appendChild(link);
      list.appendChild(item);
    });
    searchResults.appendChild(list);
    if (selectedIndex >= 0) searchInput.setAttribute('aria-activedescendant', `site-search-option-${selectedIndex}`);
  }

  function open(trigger?: HTMLButtonElement) {
    if (isOpen) return;
    isOpen = true;
    lastTrigger = trigger || triggers.find((item) => item.getClientRects().length > 0);
    searchDialog.hidden = false;
    document.body.classList.add('overflow-hidden');
    setExpanded(true);
    selectedIndex = -1;
    render();
    window.requestAnimationFrame(() => searchInput.focus());
  }

  function close(restoreFocus = true) {
    if (!isOpen) return;
    isOpen = false;
    searchDialog.hidden = true;
    document.body.classList.remove('overflow-hidden');
    setExpanded(false);
    searchInput.value = '';
    selectedIndex = -1;
    if (restoreFocus) lastTrigger?.focus();
  }

  function moveSelection(direction: 1 | -1) {
    const matches = getMatches(searchInput.value);
    if (matches.length === 0) return;
    selectedIndex = selectedIndex < 0
      ? (direction === 1 ? 0 : matches.length - 1)
      : (selectedIndex + direction + matches.length) % matches.length;
    render();
    const activeOption = searchResults.querySelector<HTMLElement>(`#site-search-option-${selectedIndex}`);
    activeOption?.scrollIntoView({ block: 'nearest' });
  }

  function onKeydown(event: KeyboardEvent) {
    const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k';
    if (isShortcut) {
      event.preventDefault();
      open();
      return;
    }
    if (!isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === 'Enter' && selectedIndex >= 0) {
      event.preventDefault();
      searchResults.querySelector<HTMLAnchorElement>(`#site-search-option-${selectedIndex}`)?.click();
    } else if (event.key === 'Tab') {
      const focusable = Array.from(searchDialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }

  const onInput = () => {
    selectedIndex = -1;
    render();
  };
  const onBackdropClick = (event: MouseEvent) => {
    if (event.target === searchBackdrop) close();
  };
  const onCloseButtonClick = () => close();
  const triggerHandlers = triggers.map((trigger) => ({
    trigger,
    handler: () => open(trigger),
  }));

  triggerHandlers.forEach(({ trigger, handler }) => trigger.addEventListener('click', handler));
  searchInput.addEventListener('input', onInput);
  searchCloseButton.addEventListener('click', onCloseButtonClick);
  searchBackdrop.addEventListener('click', onBackdropClick);
  document.addEventListener('keydown', onKeydown);

  cleanupSearchDialog = () => {
    close(false);
    triggerHandlers.forEach(({ trigger, handler }) => trigger.removeEventListener('click', handler));
    searchInput.removeEventListener('input', onInput);
    searchCloseButton.removeEventListener('click', onCloseButtonClick);
    searchBackdrop.removeEventListener('click', onBackdropClick);
    document.removeEventListener('keydown', onKeydown);
  };
}

document.addEventListener('astro:page-load', initializeSearchDialog);

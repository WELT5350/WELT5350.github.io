type AppearanceSettings = {
  hue: number;
  blur: number;
  backgroundOpacity: number;
  cardOpacity: number;
};

type AppearanceApi = {
  defaults: AppearanceSettings;
  read: () => AppearanceSettings;
  apply: (settings: Partial<AppearanceSettings>) => AppearanceSettings;
  save: (settings: AppearanceSettings) => void;
  reset: () => AppearanceSettings;
};

export {};

declare global {
  interface Window {
    __weltAppearance?: AppearanceApi;
    __weltAppearancePanelCleanup?: () => void;
    __weltAppearancePanelLifecycleBound?: boolean;
  }
}

function closePanels() {
  document.querySelectorAll<HTMLElement>('[data-appearance-panel]').forEach((panel) => { panel.hidden = true; });
  document.querySelectorAll<HTMLElement>('[data-appearance-toggle]').forEach((toggle) => { toggle.setAttribute('aria-expanded', 'false'); });
}

function updateControls(settings: AppearanceSettings, defaults: AppearanceSettings) {
  document.querySelectorAll<HTMLInputElement>('[data-appearance-input]').forEach((input) => {
    const key = input.dataset.appearanceInput as keyof AppearanceSettings;
    input.value = String(settings[key]);
    const progress = ((settings[key] - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
    input.style.setProperty('--appearance-range-progress', `${Math.min(100, Math.max(0, progress))}%`);
  });

  document.querySelectorAll<HTMLOutputElement>('[data-appearance-output]').forEach((output) => {
    const key = output.dataset.appearanceOutput as keyof AppearanceSettings;
    const value = settings[key];
    if (value === defaults[key]) output.textContent = '推荐';
    else if (key === 'hue') output.textContent = `${value}°`;
    else if (key === 'blur') output.textContent = `${value} px`;
    else output.textContent = `${value}%`;
  });
}

function initialiseAppearancePanel() {
  window.__weltAppearancePanelCleanup?.();
  const appearance = window.__weltAppearance;
  if (!appearance) return;

  const controller = new AbortController();
  const { signal } = controller;
  let settings = appearance.read();
  updateControls(settings, appearance.defaults);

  document.querySelectorAll<HTMLElement>('[data-appearance-toggle]').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const panel = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
      const willOpen = panel?.hidden !== false;
      closePanels();
      if (panel && willOpen) {
        panel.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
      }
    }, { signal });
  });

  document.querySelectorAll<HTMLInputElement>('[data-appearance-input]').forEach((input) => {
    input.addEventListener('input', () => {
      const key = input.dataset.appearanceInput as keyof AppearanceSettings;
      settings = appearance.apply({ ...settings, [key]: Number(input.value) });
      appearance.save(settings);
      updateControls(settings, appearance.defaults);
    }, { signal });
  });

  document.querySelectorAll<HTMLElement>('[data-appearance-reset]').forEach((button) => {
    button.addEventListener('click', () => {
      settings = appearance.reset();
      updateControls(settings, appearance.defaults);
    }, { signal });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openToggle = document.querySelector<HTMLElement>('[data-appearance-toggle][aria-expanded="true"]');
    if (!openToggle) return;
    closePanels();
    openToggle.focus();
  }, { signal });

  document.addEventListener('pointerdown', (event) => {
    if (!(event.target instanceof Element) || event.target.closest('.appearance-control')) return;
    closePanels();
  }, { signal });

  window.__weltAppearancePanelCleanup = () => controller.abort();
}

if (!window.__weltAppearancePanelLifecycleBound) {
  window.__weltAppearancePanelLifecycleBound = true;
  document.addEventListener('astro:page-load', initialiseAppearancePanel);
}

initialiseAppearancePanel();

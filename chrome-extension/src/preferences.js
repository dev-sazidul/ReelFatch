const DEFAULTS = { confirmBeforeOpen: false };

export async function loadPreferences() {
  if (!globalThis.chrome?.storage?.local) return { ...DEFAULTS };
  const stored = await chrome.storage.local.get(DEFAULTS);
  return { confirmBeforeOpen: stored.confirmBeforeOpen === true };
}

export async function savePreferences(preferences) {
  if (!globalThis.chrome?.storage?.local) return;
  await chrome.storage.local.set({ confirmBeforeOpen: preferences.confirmBeforeOpen === true });
}

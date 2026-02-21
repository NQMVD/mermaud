(function initRendererUtils(root) {
  'use strict';

  const RENDERERS = {
    MERMAID: 'mermaid',
    BEAUTIFUL: 'beautiful',
  };
  const DEFAULT_BEAUTIFUL_THEME = 'zinc-dark';
  const AUTO_ZINC_THEME_KEY = '__auto_zinc';
  const CUSTOM_THEME_KEY = '__app';

  function normalizeRenderer(renderer, fallback = RENDERERS.MERMAID) {
    const value = String(renderer || '').trim().toLowerCase();
    if (value === RENDERERS.BEAUTIFUL) return RENDERERS.BEAUTIFUL;
    if (value === RENDERERS.MERMAID) return RENDERERS.MERMAID;
    return fallback;
  }

  function firstNonEmpty(values, fallback) {
    for (const value of values) {
      const trimmed = String(value || '').trim();
      if (trimmed) return trimmed;
    }
    return fallback;
  }

  function normalizeBeautifulThemeKey(
    themeKey,
    availableThemeKeys = [],
    fallback = DEFAULT_BEAUTIFUL_THEME
  ) {
    const key = String(themeKey || '').trim();
    if (key === AUTO_ZINC_THEME_KEY) return AUTO_ZINC_THEME_KEY;
    if (key === CUSTOM_THEME_KEY) return CUSTOM_THEME_KEY;
    if (availableThemeKeys.includes(key)) return key;
    if (availableThemeKeys.includes(fallback)) return fallback;
    return availableThemeKeys[0] || fallback;
  }

  function toThemeLabel(themeKey) {
    return String(themeKey || '')
      .split('-')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }

  function resolveAutoZincThemeKey(themeKeys = [], preferLight = false) {
    const normalized = themeKeys.map((key) => ({
      key,
      normalized: String(key || '').trim().toLowerCase(),
    }));
    const zincThemes = normalized.filter((entry) =>
      entry.normalized.includes('zinc')
    );
    if (!zincThemes.length) return '';

    const exactCandidates = preferLight
      ? ['zinc-light', 'zinc_light', 'zinclight', 'light-zinc', 'light_zinc']
      : ['zinc-dark', 'zinc_dark', 'zincdark', 'dark-zinc', 'dark_zinc'];

    const exact = zincThemes.find((entry) =>
      exactCandidates.includes(entry.normalized)
    );
    if (exact) return exact.key;

    const toneKeywords = preferLight
      ? ['light', 'day', 'sun']
      : ['dark', 'night', 'moon'];
    const toneMatch = zincThemes.find((entry) =>
      toneKeywords.some((keyword) => entry.normalized.includes(keyword))
    );
    if (toneMatch) return toneMatch.key;

    const base = zincThemes.find((entry) => entry.normalized === 'zinc');
    if (base) return base.key;

    return zincThemes[0].key;
  }

  function buildBeautifulTheme({
    bg = '',
    fg = '',
    line = '',
    accent = '',
    muted = '',
    surface = '',
    border = '',
  } = {}) {
    return {
      bg: firstNonEmpty([bg], '#161616'),
      fg: firstNonEmpty([fg], '#f0f0f0'),
      line: firstNonEmpty([line], '#666666'),
      accent: firstNonEmpty([accent], '#d97757'),
      muted: firstNonEmpty([muted], '#999999'),
      surface: firstNonEmpty([surface], '#1a1a1a'),
      border: firstNonEmpty([border], '#2a2a2a'),
    };
  }

  const api = {
    RENDERERS,
    DEFAULT_BEAUTIFUL_THEME,
    AUTO_ZINC_THEME_KEY,
    CUSTOM_THEME_KEY,
    normalizeRenderer,
    normalizeBeautifulThemeKey,
    resolveAutoZincThemeKey,
    toThemeLabel,
    buildBeautifulTheme,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.RendererUtils = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));

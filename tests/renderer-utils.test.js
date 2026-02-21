const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RENDERERS,
  DEFAULT_BEAUTIFUL_THEME,
  AUTO_ZINC_THEME_KEY,
  CUSTOM_THEME_KEY,
  normalizeRenderer,
  normalizeBeautifulThemeKey,
  resolveAutoZincThemeKey,
  toThemeLabel,
  buildBeautifulTheme,
} = require('../renderer-utils');

test('normalizeRenderer accepts known renderer values', () => {
  assert.equal(normalizeRenderer('mermaid'), RENDERERS.MERMAID);
  assert.equal(normalizeRenderer('BEAUTIFUL'), RENDERERS.BEAUTIFUL);
});

test('normalizeRenderer falls back for unknown values', () => {
  assert.equal(normalizeRenderer('unknown'), RENDERERS.MERMAID);
  assert.equal(normalizeRenderer('', RENDERERS.BEAUTIFUL), RENDERERS.BEAUTIFUL);
});

test('normalizeBeautifulThemeKey keeps custom key and valid theme keys', () => {
  const available = ['zinc-dark', 'zinc-light', 'dracula'];

  assert.equal(
    normalizeBeautifulThemeKey(AUTO_ZINC_THEME_KEY, available),
    AUTO_ZINC_THEME_KEY
  );
  assert.equal(
    normalizeBeautifulThemeKey(CUSTOM_THEME_KEY, available),
    CUSTOM_THEME_KEY
  );
  assert.equal(
    normalizeBeautifulThemeKey('dracula', available),
    'dracula'
  );
});

test('normalizeBeautifulThemeKey falls back to zinc-dark when possible', () => {
  const available = ['zinc-dark', 'catppuccin-frappe'];
  assert.equal(
    normalizeBeautifulThemeKey('missing', available),
    DEFAULT_BEAUTIFUL_THEME
  );
});

test('normalizeBeautifulThemeKey falls back to first available when default is absent', () => {
  const available = ['catppuccin-frappe', 'dracula'];
  assert.equal(
    normalizeBeautifulThemeKey('missing', available),
    'catppuccin-frappe'
  );
});

test('toThemeLabel formats theme keys for UI labels', () => {
  assert.equal(toThemeLabel('zinc-dark'), 'Zinc Dark');
  assert.equal(toThemeLabel('catppuccin-mocha'), 'Catppuccin Mocha');
});

test('resolveAutoZincThemeKey finds dark and light variants', () => {
  const themes = ['zinc-dark', 'zinc-light', 'dracula'];
  assert.equal(resolveAutoZincThemeKey(themes, false), 'zinc-dark');
  assert.equal(resolveAutoZincThemeKey(themes, true), 'zinc-light');
});

test('resolveAutoZincThemeKey supports alternative zinc naming', () => {
  const themes = ['zincDark', 'zincLight'];
  assert.equal(resolveAutoZincThemeKey(themes, false), 'zincDark');
  assert.equal(resolveAutoZincThemeKey(themes, true), 'zincLight');
});

test('resolveAutoZincThemeKey falls back to generic zinc theme', () => {
  const themes = ['zinc', 'catppuccin-frappe'];
  assert.equal(resolveAutoZincThemeKey(themes, false), 'zinc');
  assert.equal(resolveAutoZincThemeKey(themes, true), 'zinc');
});

test('buildBeautifulTheme uses provided values', () => {
  const theme = buildBeautifulTheme({
    bg: '#111111',
    fg: '#eeeeee',
    line: '#777777',
    accent: '#ff9900',
    muted: '#9a9a9a',
    surface: '#1a1a1a',
    border: '#333333',
  });

  assert.deepEqual(theme, {
    bg: '#111111',
    fg: '#eeeeee',
    line: '#777777',
    accent: '#ff9900',
    muted: '#9a9a9a',
    surface: '#1a1a1a',
    border: '#333333',
  });
});

test('buildBeautifulTheme applies fallback values when inputs are empty', () => {
  const theme = buildBeautifulTheme({});

  assert.deepEqual(theme, {
    bg: '#161616',
    fg: '#f0f0f0',
    line: '#666666',
    accent: '#d97757',
    muted: '#999999',
    surface: '#1a1a1a',
    border: '#2a2a2a',
  });
});

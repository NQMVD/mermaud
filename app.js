/**
 * Mermaid Playground
 * A single-page Mermaid diagram editor with live preview
 */

// ==========================================
// Configuration
// ==========================================

const CONFIG = {
  STORAGE_KEY: 'mermaid-playground-code',
  RENDERER_STORAGE_KEY: 'mermaid-playground-renderer',
  BEAUTIFUL_THEME_STORAGE_KEY: 'mermaid-playground-beautiful-theme',
  DEBOUNCE_MS: 200,
  TOAST_DURATION: 5000,
  MIN_ZOOM: 0.05,
  MAX_ZOOM: 10,
  ZOOM_STEP: 0.1,
  WHEEL_ZOOM_SPEED: 0.001,  // Much finer control for trackpad/mouse wheel
  DEFAULT_CODE: `flowchart TD
    A[🎨 Start Here] --> B{Choose Your Path}
    B -->|Design| C[Create Mockups]
    B -->|Develop| D[Write Code]
    B -->|Document| E[Draft Specs]
    C --> F[Review & Iterate]
    D --> F
    E --> F
    F --> G[🚀 Ship It!]`,
  LEGACY_DEFAULT_CODE: `flowchart TD
    A[🎨 Start Here] --> B{Choose Your Path}
    B -->|Design| C[Create Mockups]
    B -->|Develop| D[Write Code]
    B -->|Document| E[Draft Specs]
    C --> F[Review & Iterate]
    D --> F
    E --> F
    F --> G[🚀 Ship It!]
    
    style A fill:#1a1a1a,stroke:#d97757,color:#f0f0f0
    style G fill:#1a1a1a,stroke:#22c55e,color:#f0f0f0
    style B fill:#1a1a1a,stroke:#d97757,color:#f0f0f0`,
};

// ==========================================
// State
// ==========================================

let editor = null;
let currentCode = '';
let renderTimeout = null;
let isResizing = false;
let editorCollapsed = false;
let currentRenderer = 'mermaid';
let currentBeautifulTheme = '__auto_zinc';
let latestAscii = '';

// Pan/Zoom state
let zoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;

// Trackpad detection
let isTrackpad = false;
let lastWheelTime = 0;
let wheelEventCount = 0;
let pinchStartDistance = 0;
let isPinching = false;

// ==========================================
// DOM Elements
// ==========================================

const elements = {
  editorPanel: document.getElementById('editor-panel'),
  editorContainer: document.getElementById('editor-container'),
  previewPanel: document.getElementById('preview-panel'),
  previewContainer: document.getElementById('preview-container'),
  diagramWrapper: document.getElementById('diagram-wrapper'),
  mermaidOutput: document.getElementById('mermaid-output'),
  resizeHandle: document.getElementById('resize-handle'),
  toggleEditor: document.getElementById('toggle-editor'),
  expandEditor: document.getElementById('expand-editor'),
  themeToggle: document.getElementById('theme-toggle'),
  rendererToggle: document.getElementById('renderer-toggle'),
  beautifulThemeSelect: document.getElementById('beautiful-theme-select'),
  toastContainer: document.getElementById('toast-container'),
  pdfModal: document.getElementById('pdf-modal'),
  pdfCancel: document.getElementById('pdf-cancel'),
  asciiModal: document.getElementById('ascii-modal'),
  asciiCancel: document.getElementById('ascii-cancel'),
  asciiRefresh: document.getElementById('ascii-refresh'),
  asciiCopy: document.getElementById('ascii-copy'),
  asciiDownload: document.getElementById('ascii-download'),
  asciiPreview: document.getElementById('ascii-preview'),
  asciiModeUnicode: document.getElementById('ascii-mode-unicode'),
  asciiModeAscii: document.getElementById('ascii-mode-ascii'),
  exportPng: document.getElementById('export-png'),
  exportSvg: document.getElementById('export-svg'),
  exportPdf: document.getElementById('export-pdf'),
  exportCode: document.getElementById('export-code'),
  exportAscii: document.getElementById('export-ascii'),
  zoomIn: document.getElementById('zoom-in'),
  zoomOut: document.getElementById('zoom-out'),
  zoomReset: document.getElementById('zoom-reset'),
  zoomLevel: document.getElementById('zoom-level'),
};

// ==========================================
// Initialization
// ==========================================

async function init() {
  initTheme();
  initRenderer();
  initBeautifulTheme();
  initMermaid();
  await initMonaco();
  initEventListeners();
  loadSavedCode();
}

function initTheme() {
  // Check for saved preference or system preference
  const savedTheme = localStorage.getItem('mermaid-playground-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'light' || (!savedTheme && !prefersDark)) {
    document.body.classList.add('light-mode');
  }
}

const rendererUtils = window.RendererUtils || {
  RENDERERS: {
    MERMAID: 'mermaid',
    BEAUTIFUL: 'beautiful',
  },
  DEFAULT_BEAUTIFUL_THEME: 'zinc-dark',
  AUTO_ZINC_THEME_KEY: '__auto_zinc',
  CUSTOM_THEME_KEY: '__app',
  normalizeRenderer: (renderer, fallback = 'mermaid') => {
    const value = String(renderer || '').trim().toLowerCase();
    if (value === 'beautiful') return 'beautiful';
    if (value === 'mermaid') return 'mermaid';
    return fallback;
  },
  normalizeBeautifulThemeKey: (
    themeKey,
    availableThemeKeys = [],
    fallback = 'zinc-dark'
  ) => {
    const key = String(themeKey || '').trim();
    if (key === '__auto_zinc') return '__auto_zinc';
    if (key === '__app') return '__app';
    if (availableThemeKeys.includes(key)) return key;
    if (availableThemeKeys.includes(fallback)) return fallback;
    return availableThemeKeys[0] || fallback;
  },
  resolveAutoZincThemeKey: (themeKeys = [], preferLight = false) => {
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
  },
  toThemeLabel: (themeKey) =>
    String(themeKey || '')
      .split('-')
      .filter(Boolean)
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' '),
  buildBeautifulTheme: ({
    bg = '',
    fg = '',
    line = '',
    accent = '',
    muted = '',
    surface = '',
    border = '',
  } = {}) => ({
    bg: String(bg || '').trim() || '#161616',
    fg: String(fg || '').trim() || '#f0f0f0',
    line: String(line || '').trim() || '#666666',
    accent: String(accent || '').trim() || '#d97757',
    muted: String(muted || '').trim() || '#999999',
    surface: String(surface || '').trim() || '#1a1a1a',
    border: String(border || '').trim() || '#2a2a2a',
  }),
};

function getBeautifulMermaidApi() {
  return window.beautifulMermaid;
}

function getAvailableBeautifulThemes() {
  const api = getBeautifulMermaidApi();
  if (!api || !api.THEMES || typeof api.THEMES !== 'object') {
    return [];
  }
  return Object.keys(api.THEMES);
}

function initRenderer() {
  const savedRenderer = localStorage.getItem(CONFIG.RENDERER_STORAGE_KEY);
  currentRenderer = rendererUtils.normalizeRenderer(
    savedRenderer,
    rendererUtils.RENDERERS.MERMAID
  );
  updateRendererToggleUi();
  setRenderSurfaceMode(currentRenderer);
}

function initBeautifulTheme() {
  populateBeautifulThemeSelect();
  const savedTheme = localStorage.getItem(CONFIG.BEAUTIFUL_THEME_STORAGE_KEY);
  const themeKeys = [
    rendererUtils.AUTO_ZINC_THEME_KEY,
    rendererUtils.CUSTOM_THEME_KEY,
    ...getAvailableBeautifulThemes(),
  ];
  currentBeautifulTheme = rendererUtils.normalizeBeautifulThemeKey(
    savedTheme,
    themeKeys,
    rendererUtils.AUTO_ZINC_THEME_KEY
  );
  if (elements.beautifulThemeSelect) {
    elements.beautifulThemeSelect.value = currentBeautifulTheme;
  }
  updateBeautifulThemeControlUi();
}

function populateBeautifulThemeSelect() {
  if (!elements.beautifulThemeSelect) return;

  const themeKeys = getAvailableBeautifulThemes();
  const options = [
    {
      value: rendererUtils.AUTO_ZINC_THEME_KEY,
      label: 'Auto Zinc',
    },
    {
      value: rendererUtils.CUSTOM_THEME_KEY,
      label: 'App Adaptive',
    },
    ...themeKeys.map((key) => ({
      value: key,
      label: rendererUtils.toThemeLabel(key),
    })),
  ];

  elements.beautifulThemeSelect.innerHTML = options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join('');
}

function setBeautifulTheme(nextTheme, persist = true) {
  const themeKeys = [
    rendererUtils.AUTO_ZINC_THEME_KEY,
    rendererUtils.CUSTOM_THEME_KEY,
    ...getAvailableBeautifulThemes(),
  ];
  const normalized = rendererUtils.normalizeBeautifulThemeKey(
    nextTheme,
    themeKeys,
    rendererUtils.AUTO_ZINC_THEME_KEY
  );
  if (normalized === currentBeautifulTheme) return;
  currentBeautifulTheme = normalized;
  if (elements.beautifulThemeSelect) {
    elements.beautifulThemeSelect.value = currentBeautifulTheme;
  }
  if (persist) {
    localStorage.setItem(
      CONFIG.BEAUTIFUL_THEME_STORAGE_KEY,
      currentBeautifulTheme
    );
  }
  if (currentRenderer === rendererUtils.RENDERERS.BEAUTIFUL) {
    renderDiagram();
  }
}

function setRenderer(nextRenderer, persist = true) {
  const normalized = rendererUtils.normalizeRenderer(
    nextRenderer,
    rendererUtils.RENDERERS.MERMAID
  );
  if (normalized === currentRenderer) return;

  if (
    normalized === rendererUtils.RENDERERS.BEAUTIFUL &&
    !isBeautifulMermaidAvailable()
  ) {
    showToast(
      'error',
      'Beautiful Mermaid Missing',
      'Could not load beautiful-mermaid from CDN.'
    );
    return;
  }

  currentRenderer = normalized;
  if (persist) {
    localStorage.setItem(CONFIG.RENDERER_STORAGE_KEY, currentRenderer);
  }
  updateRendererToggleUi();
  updateBeautifulThemeControlUi();
  setRenderSurfaceMode(currentRenderer);
  renderDiagram();
}

function updateRendererToggleUi() {
  if (!elements.rendererToggle) return;
  elements.rendererToggle
    .querySelectorAll('[data-renderer]')
    .forEach((button) => {
      const isActive = button.dataset.renderer === currentRenderer;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function setRenderSurfaceMode(renderer) {
  if (!elements.mermaidOutput) return;
  elements.mermaidOutput.classList.remove('mode-mermaid', 'mode-beautiful');
  const normalized = rendererUtils.normalizeRenderer(
    renderer,
    rendererUtils.RENDERERS.MERMAID
  );
  const className = normalized === rendererUtils.RENDERERS.BEAUTIFUL
    ? 'mode-beautiful'
    : 'mode-mermaid';
  elements.mermaidOutput.classList.add(className);
}

function updateBeautifulThemeControlUi() {
  const control = elements.beautifulThemeSelect?.closest('.beautiful-theme-control');
  if (!control || !elements.beautifulThemeSelect) return;

  const isActive = currentRenderer === rendererUtils.RENDERERS.BEAUTIFUL;
  control.classList.toggle('disabled', !isActive);
  elements.beautifulThemeSelect.disabled = !isActive;
}

function isBeautifulMermaidAvailable() {
  const api = getBeautifulMermaidApi();
  return Boolean(
    api &&
      typeof api.renderMermaid === 'function' &&
      typeof api.renderMermaidAscii === 'function'
  );
}

function initMermaid() {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      useMaxWidth: false,
      fontSize: 16,
      padding: 15,
    },
    sequence: { useMaxWidth: false, fontSize: 16, boxMargin: 10 },
    gantt: { useMaxWidth: false, fontSize: 16 },
    journey: { useMaxWidth: false, fontSize: 16 },
    timeline: { useMaxWidth: false, fontSize: 16 },
    class: { useMaxWidth: false, fontSize: 16 },
    state: { useMaxWidth: false, fontSize: 16 },
    er: { useMaxWidth: false, fontSize: 16 },
    pie: { useMaxWidth: false, fontSize: 16 },
    themeVariables: {
      darkMode: true,
      background: '#161616',
      primaryColor: '#d97757',
      primaryTextColor: '#f0f0f0',
      primaryBorderColor: '#d97757',
      lineColor: '#666666',
      secondaryColor: '#1a1a1a',
      tertiaryColor: '#222222',
    },
  });
}

async function initMonaco() {
  return new Promise((resolve) => {
    require.config({
      paths: {
        vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs',
      },
    });

    require(['vs/editor/editor.main'], () => {
      // Register Mermaid language
      monaco.languages.register({ id: 'mermaid' });

      // Mermaid syntax highlighting
      monaco.languages.setMonarchTokensProvider('mermaid', {
        keywords: [
          'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
          'erDiagram', 'journey', 'gantt', 'pie', 'gitGraph', 'mindmap', 'timeline',
          'TD', 'TB', 'BT', 'RL', 'LR',
          'subgraph', 'end', 'direction',
          'participant', 'actor', 'activate', 'deactivate', 'note', 'loop', 'alt', 'else', 'opt', 'par', 'critical', 'break',
          'class', 'style', 'classDef', 'click', 'callback', 'link',
          'section', 'title', 'dateFormat', 'axisFormat', 'excludes', 'includes',
        ],
        operators: ['-->', '---', '-.->', '-.-', '==>', '===', '--', '->', '<--', '<-->', '-->|', '|', ':::', '%%'],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,

        tokenizer: {
          root: [
            [/%%.*$/, 'comment'],
            [/[a-zA-Z_][\w]*/, {
              cases: {
                '@keywords': 'keyword',
                '@default': 'identifier'
              }
            }],
            [/"[^"]*"/, 'string'],
            [/'[^']*'/, 'string'],
            [/\[.*?\]/, 'string.bracket'],
            [/\(.*?\)/, 'string.paren'],
            [/\{.*?\}/, 'string.brace'],
            [/-->|---|-\.->|-\.-|==>|===|--|->|<--|<-->/, 'operator'],
            [/\|[^|]*\|/, 'annotation'],
            [/:::/, 'delimiter'],
            [/#[0-9a-fA-F]{3,8}/, 'number.hex'],
            [/\d+/, 'number'],
          ],
        },
      });

      // Mermaid theme
      monaco.editor.defineTheme('mermaid-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: 'd97757', fontStyle: 'bold' },
          { token: 'identifier', foreground: 'f0f0f0' },
          { token: 'string', foreground: '22c55e' },
          { token: 'string.bracket', foreground: '60a5fa' },
          { token: 'string.paren', foreground: 'f472b6' },
          { token: 'string.brace', foreground: 'fbbf24' },
          { token: 'comment', foreground: '666666', fontStyle: 'italic' },
          { token: 'operator', foreground: '999999' },
          { token: 'annotation', foreground: 'a78bfa' },
          { token: 'number', foreground: 'd97757' },
          { token: 'number.hex', foreground: 'd97757' },
        ],
        colors: {
          'editor.background': '#111111',
          'editor.foreground': '#f0f0f0',
          'editor.lineHighlightBackground': '#1a1a1a',
          'editor.selectionBackground': '#d9775740',
          'editorCursor.foreground': '#d97757',
          'editorLineNumber.foreground': '#444444',
          'editorLineNumber.activeForeground': '#888888',
          'editor.selectionHighlightBackground': '#d9775720',
        },
      });

      monaco.editor.defineTheme('mermaid-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: 'b8956a', fontStyle: 'bold' },
          { token: 'identifier', foreground: '1a1a1a' },
          { token: 'string', foreground: '16a34a' },
          { token: 'string.bracket', foreground: '2563eb' },
          { token: 'string.paren', foreground: 'db2777' },
          { token: 'string.brace', foreground: 'd97706' },
          { token: 'comment', foreground: '8c8c8c', fontStyle: 'italic' },
          { token: 'operator', foreground: '6b5a42' },
          { token: 'annotation', foreground: '7c3aed' },
          { token: 'number', foreground: 'ea580c' },
          { token: 'number.hex', foreground: 'ea580c' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#1a1a1a',
          'editor.lineHighlightBackground': '#f0f0f0',
          'editor.selectionBackground': '#b8956a40',
          'editorCursor.foreground': '#b8956a',
          'editorLineNumber.foreground': '#8c8c8c',
          'editorLineNumber.activeForeground': '#5c5c5c',
          'editor.selectionHighlightBackground': '#b8956a20',
        },
      });

      // Mermaid autocompletion
      monaco.languages.registerCompletionItemProvider('mermaid', {
        provideCompletionItems: (model, position) => {
          const suggestions = [
            // Diagram types
            { label: 'flowchart', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'flowchart ${1|TD,TB,BT,LR,RL|}\n    ${2:A}[${3:Start}] --> ${4:B}[${5:End}]', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'sequenceDiagram', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'sequenceDiagram\n    participant ${1:A}\n    participant ${2:B}\n    ${1:A}->>+${2:B}: ${3:Request}\n    ${2:B}-->>-${1:A}: ${4:Response}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'classDiagram', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'classDiagram\n    class ${1:ClassName} {\n        +${2:attribute}\n        +${3:method}()\n    }', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'stateDiagram-v2', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'stateDiagram-v2\n    [*] --> ${1:State1}\n    ${1:State1} --> ${2:State2}\n    ${2:State2} --> [*]', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'erDiagram', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'erDiagram\n    ${1:ENTITY1} ||--o{ ${2:ENTITY2} : ${3:has}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'gantt', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'gantt\n    title ${1:Project Timeline}\n    dateFormat YYYY-MM-DD\n    section ${2:Phase 1}\n        ${3:Task 1} :${4:a1}, ${5:2024-01-01}, ${6:30d}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'pie', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'pie title ${1:Distribution}\n    "${2:Category A}" : ${3:40}\n    "${4:Category B}" : ${5:30}\n    "${6:Category C}" : ${7:30}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'mindmap', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'mindmap\n  root((${1:Central Topic}))\n    ${2:Branch 1}\n      ${3:Leaf 1}\n    ${4:Branch 2}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'gitGraph', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'gitGraph\n    commit\n    branch ${1:develop}\n    checkout ${1:develop}\n    commit\n    checkout main\n    merge ${1:develop}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            // Flowchart elements
            { label: 'subgraph', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'subgraph ${1:Title}\n    ${2:content}\nend', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'style', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'style ${1:nodeId} fill:#${2:2d2d2d},stroke:#${3:d4a574},color:#${4:e8e8e8}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'classDef', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'classDef ${1:className} fill:#${2:2d2d2d},stroke:#${3:d4a574},color:#${4:e8e8e8}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          ];
          return { suggestions };
        },
      });

      // Create editor instance
      const isLightMode = document.body.classList.contains('light-mode');
      editor = monaco.editor.create(elements.editorContainer, {
        value: '',
        language: 'mermaid',
        theme: isLightMode ? 'mermaid-light' : 'mermaid-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        lineNumbers: 'on',
        lineNumbersMinChars: 3,
        glyphMargin: false,
        folding: false,
        renderLineHighlight: 'line',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 4,
        insertSpaces: true,
        padding: { top: 16, bottom: 16 },
        scrollbar: {
          vertical: 'hidden',
          horizontal: 'hidden',
          useShadows: false,
        },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
      });

      // Listen for content changes
      editor.onDidChangeModelContent(() => {
        currentCode = editor.getValue();
        debouncedRender();
        saveCode();
      });

      resolve();
    });
  });
}

// ==========================================
// Event Listeners
// ==========================================

function initEventListeners() {
  // Toggle editor
  elements.toggleEditor.addEventListener('click', toggleEditorPanel);
  elements.expandEditor.addEventListener('click', toggleEditorPanel);

  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Renderer toggle
  elements.rendererToggle.querySelectorAll('[data-renderer]').forEach((button) => {
    button.addEventListener('click', () => setRenderer(button.dataset.renderer));
  });
  elements.beautifulThemeSelect.addEventListener('change', () => {
    setBeautifulTheme(elements.beautifulThemeSelect.value);
  });

  // Resize handle
  elements.resizeHandle.addEventListener('mousedown', startResize);
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);

  // Export buttons
  elements.exportPng.addEventListener('click', exportPng);
  elements.exportSvg.addEventListener('click', exportSvg);
  elements.exportPdf.addEventListener('click', showPdfModal);
  elements.exportCode.addEventListener('click', exportCode);
  elements.exportAscii.addEventListener('click', showAsciiModal);

  // PDF modal
  elements.pdfCancel.addEventListener('click', hidePdfModal);
  elements.pdfModal.querySelector('.modal-backdrop').addEventListener('click', hidePdfModal);
  elements.pdfModal.querySelectorAll('.btn-modal-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      exportPdf(btn.dataset.size);
      hidePdfModal();
    });
  });

  // ASCII modal
  elements.asciiCancel.addEventListener('click', hideAsciiModal);
  elements.asciiModal.querySelector('.modal-backdrop').addEventListener('click', hideAsciiModal);
  elements.asciiRefresh.addEventListener('click', refreshAsciiPreview);
  elements.asciiCopy.addEventListener('click', copyAsciiPreview);
  elements.asciiDownload.addEventListener('click', downloadAsciiPreview);
  [elements.asciiModeUnicode, elements.asciiModeAscii].forEach((input) => {
    input.addEventListener('change', refreshAsciiPreview);
  });

  // Zoom controls
  elements.zoomIn.addEventListener('click', () => setZoom(zoom + CONFIG.ZOOM_STEP));
  elements.zoomOut.addEventListener('click', () => setZoom(zoom - CONFIG.ZOOM_STEP));
  elements.zoomReset.addEventListener('click', resetView);

  // Pan/zoom on diagram
  elements.diagramWrapper.addEventListener('mousedown', startPan);
  document.addEventListener('mousemove', handlePan);
  document.addEventListener('mouseup', stopPan);
  elements.diagramWrapper.addEventListener('wheel', handleWheel, { passive: false });

  // Trackpad pinch gesture support
  elements.diagramWrapper.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);
  document.addEventListener('pointercancel', handlePointerUp);

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);

  // System theme change
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('mermaid-playground-theme')) {
      document.body.classList.toggle('light-mode', !e.matches);
      updateEditorTheme();
      renderDiagram();
    }
  });
}

function handleKeyboardShortcuts(e) {
  // Ctrl+\ or Cmd+\ to toggle editor
  if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
    e.preventDefault();
    toggleEditorPanel();
  }
  // Ctrl+Shift+L to toggle theme
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
    e.preventDefault();
    toggleTheme();
  }
  // Escape to close modals
  if (e.key === 'Escape') {
    if (elements.pdfModal.classList.contains('active')) {
      hidePdfModal();
    }
    if (elements.asciiModal.classList.contains('active')) {
      hideAsciiModal();
    }
  }
  // Zoom shortcuts
  if (e.key === '+' || e.key === '=') {
    setZoom(zoom + CONFIG.ZOOM_STEP);
  }
  if (e.key === '-') {
    setZoom(zoom - CONFIG.ZOOM_STEP);
  }
  if (e.key === '0') {
    resetView();
  }
}

// ==========================================
// Panel Controls
// ==========================================

function toggleEditorPanel() {
  editorCollapsed = !editorCollapsed;
  elements.editorPanel.classList.toggle('collapsed', editorCollapsed);

  // Center diagram when editor is toggled
  setTimeout(() => centerDiagram(), 300);
}

function startResize(e) {
  isResizing = true;
  elements.resizeHandle.classList.add('dragging');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function handleResize(e) {
  if (!isResizing) return;

  const containerRect = elements.editorPanel.parentElement.getBoundingClientRect();
  const margin = 16; // Margin from left
  const newWidth = e.clientX - containerRect.left - margin;

  const minWidth = 320;
  const maxWidth = Math.floor(containerRect.width * 0.5) - margin;

  const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
  elements.editorPanel.style.width = `${clampedWidth}px`;
}

function stopResize() {
  if (!isResizing) return;
  isResizing = false;
  elements.resizeHandle.classList.remove('dragging');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

// ==========================================
// Pan & Zoom
// ==========================================

function startPan(e) {
  if (e.target.closest('.zoom-controls')) return;
  isPanning = true;
  panStartX = e.clientX - panX;
  panStartY = e.clientY - panY;
  elements.diagramWrapper.classList.add('grabbing');
}

function handlePan(e) {
  if (!isPanning) return;
  panX = e.clientX - panStartX;
  panY = e.clientY - panStartY;
  updateTransform();
}

function stopPan() {
  isPanning = false;
  elements.diagramWrapper.classList.remove('grabbing');
}

// Pointer tracking for trackpad pinch gestures
let activePointers = new Map();

function handlePointerDown(e) {
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  isTrackpad = true; // Trackpad/pen/trackpad input detected
}

function handlePointerMove(e) {
  if (activePointers.size < 2) return;

  const ptr = activePointers.get(e.pointerId);
  if (!ptr) return;

  const prevX = ptr.x;
  const prevY = ptr.y;
  ptr.x = e.clientX;
  ptr.y = e.clientY;

  // Two-finger gesture - calculate distance change for pinch zoom
  const pointers = Array.from(activePointers.values());
  const currentDistance = Math.hypot(
    pointers[1].x - pointers[0].x,
    pointers[1].y - pointers[0].y
  );

  const rect = elements.previewContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Initialize pinch distance if not set
  if (pinchStartDistance === 0) {
    pinchStartDistance = currentDistance;
    return;
  }

  // Calculate zoom from distance change
  const scale = currentDistance / pinchStartDistance;
  if (scale !== 1) {
    const newZoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, zoom * scale));
    const zoomChange = newZoom / zoom;
    zoom = newZoom;
    elements.zoomLevel.textContent = `${Math.round(zoom * 100)}%`;

    // Zoom towards the center of the two fingers
    const centerX = (pointers[0].x + pointers[1].x) / 2 - rect.left;
    const centerY = (pointers[0].y + pointers[1].y) / 2 - rect.top;
    panX = centerX - (centerX - panX) * scale;
    panY = centerY - (centerY - panY) * scale;
    updateTransform();

    pinchStartDistance = currentDistance;
  }
}

function handlePointerUp(e) {
  activePointers.delete(e.pointerId);
  if (activePointers.size < 2) {
    pinchStartDistance = 0;
  }
}

function handleWheel(e) {
  e.preventDefault();

  const rect = elements.previewContainer.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Detect trackpad based on event characteristics
  // Trackpads send more frequent, smaller delta events
  const now = Date.now();
  const timeSinceLastWheel = now - lastWheelTime;
  lastWheelTime = now;

  // Trackpad detection: rapid succession of small delta events
  if (timeSinceLastWheel < 50 && Math.abs(e.deltaY) < 20) {
    wheelEventCount++;
    if (wheelEventCount > 3) {
      isTrackpad = true;
    }
  } else {
    wheelEventCount = 0;
  }

  // Check for pinch gesture (Ctrl + wheel on trackpad = pinch zoom)
  if (e.ctrlKey && (e.deltaMode === 1 || e.deltaMode === 0)) {
    // Trackpad pinch zoom: deltaY indicates zoom direction
    const pinchFactor = 1 - (e.deltaY * 0.01);
    const newZoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, zoom * pinchFactor));
    const zoomChange = newZoom / zoom;
    zoom = newZoom;
    elements.zoomLevel.textContent = `${Math.round(zoom * 100)}%`;

    // Zoom towards mouse position
    panX = mouseX - (mouseX - panX) * zoomChange;
    panY = mouseY - (mouseY - panY) * zoomChange;
    updateTransform();
    return;
  }

  if (isTrackpad) {
    // Trackpad: 2-finger scroll = pan
    // On Mac trackpads, shift+scroll is horizontal, no modifier is vertical
    panX -= e.deltaX * 1.5;
    panY -= e.deltaY * 1.5;
    updateTransform();
  } else {
    // Mouse wheel: scroll = zoom
    // Use scroll delta for smooth, proportional zoom
    const delta = -e.deltaY * CONFIG.WHEEL_ZOOM_SPEED;
    const newZoom = zoom * (1 + delta);

    const prevZoom = zoom;
    setZoom(newZoom, false);

    // Adjust pan to zoom towards mouse position
    const zoomChange = zoom / prevZoom;
    panX = mouseX - (mouseX - panX) * zoomChange;
    panY = mouseY - (mouseY - panY) * zoomChange;
    updateTransform();
  }
}

function setZoom(newZoom, updatePan = true) {
  zoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, newZoom));
  elements.zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
  if (updatePan) {
    updateTransform();
  }
}

function updateTransform() {
  elements.mermaidOutput.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
}

function resetView() {
  fitToView();
}

function fitToView() {
  const containerRect = elements.previewContainer.getBoundingClientRect();
  
  // Temporarily reset transform to get natural size
  const prevTransform = elements.mermaidOutput.style.transform;
  elements.mermaidOutput.style.transform = 'none';
  const outputRect = elements.mermaidOutput.getBoundingClientRect();
  elements.mermaidOutput.style.transform = prevTransform;

  if (outputRect.width === 0 || outputRect.height === 0) return;

  const padding = 80;
  const availableWidth = containerRect.width - padding;
  const availableHeight = containerRect.height - padding;

  const scaleX = availableWidth / outputRect.width;
  const scaleY = availableHeight / outputRect.height;
  
  // Fit to screen, but don't exceed 1.0 zoom for small diagrams
  // Unless the user wants it BIGGER, maybe I should allow it to grow?
  // The user said "make the diagrams render at a bigger scale"
  // Let's allow it to grow up to 1.5x if it's small, to make it more readable
  const targetZoom = Math.min(scaleX, scaleY);
  zoom = Math.min(Math.max(CONFIG.MIN_ZOOM, targetZoom), 1.5);
  
  centerDiagram();
}

function centerDiagram() {
  const containerRect = elements.previewContainer.getBoundingClientRect();
  const outputRect = elements.mermaidOutput.getBoundingClientRect();

  // Calculate center position
  panX = (containerRect.width - outputRect.width / zoom) / 2;
  panY = (containerRect.height - outputRect.height / zoom) / 2;

  elements.zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
  updateTransform();
}

// ==========================================
// Theme
// ==========================================

function toggleTheme() {
  const isCurrentlyLight = document.body.classList.contains('light-mode');
  document.body.classList.toggle('light-mode');
  localStorage.setItem('mermaid-playground-theme', isCurrentlyLight ? 'dark' : 'light');
  updateEditorTheme();
  renderDiagram();
}

function updateEditorTheme() {
  if (!editor) return;
  const isLightMode = document.body.classList.contains('light-mode');
  monaco.editor.setTheme(isLightMode ? 'mermaid-light' : 'mermaid-dark');
}

// ==========================================
// Mermaid Rendering
// ==========================================

function getCssVariable(name, fallback = '') {
  const value = getComputedStyle(document.body).getPropertyValue(name).trim();
  return value || fallback;
}

function getBeautifulThemeOptions() {
  const api = getBeautifulMermaidApi();
  const themes = api?.THEMES || {};

  if (currentBeautifulTheme === rendererUtils.CUSTOM_THEME_KEY) {
    return rendererUtils.buildBeautifulTheme({
      bg: getCssVariable('--bg-card', '#161616'),
      fg: getCssVariable('--text-primary', '#f0f0f0'),
      line: getCssVariable('--text-muted', '#666666'),
      accent: getCssVariable('--accent', '#d97757'),
      muted: getCssVariable('--text-tertiary', '#999999'),
      surface: getCssVariable('--bg-elevated', '#1a1a1a'),
      border: getCssVariable('--border-color', '#2a2a2a'),
    });
  }

  let selectedThemeKey = currentBeautifulTheme;
  if (selectedThemeKey === rendererUtils.AUTO_ZINC_THEME_KEY) {
    selectedThemeKey = rendererUtils.resolveAutoZincThemeKey(
      Object.keys(themes),
      document.body.classList.contains('light-mode')
    );
  }

  if (themes[selectedThemeKey] && typeof themes[selectedThemeKey] === 'object') {
    return themes[selectedThemeKey];
  }
  if (
    themes[rendererUtils.DEFAULT_BEAUTIFUL_THEME] &&
    typeof themes[rendererUtils.DEFAULT_BEAUTIFUL_THEME] === 'object'
  ) {
    return themes[rendererUtils.DEFAULT_BEAUTIFUL_THEME];
  }
  const firstTheme = Object.values(themes)[0];
  if (firstTheme && typeof firstTheme === 'object') {
    return firstTheme;
  }
  return rendererUtils.buildBeautifulTheme();
}

function configureNativeMermaidTheme() {
  const isLightMode = document.body.classList.contains('light-mode');
  mermaid.initialize({
    startOnLoad: false,
    theme: isLightMode ? 'default' : 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
    flowchart: { useMaxWidth: false, fontSize: 16, padding: 15 },
    sequence: { useMaxWidth: false, fontSize: 16, boxMargin: 10 },
    gantt: { useMaxWidth: false, fontSize: 16 },
    journey: { useMaxWidth: false, fontSize: 16 },
    timeline: { useMaxWidth: false, fontSize: 16 },
    class: { useMaxWidth: false, fontSize: 16 },
    state: { useMaxWidth: false, fontSize: 16 },
    er: { useMaxWidth: false, fontSize: 16 },
    pie: { useMaxWidth: false, fontSize: 16 },
    themeVariables: isLightMode ? {
      darkMode: false,
      background: '#ffffff',
      primaryColor: '#c45e3e',
      primaryTextColor: '#111111',
      primaryBorderColor: '#c45e3e',
      lineColor: '#888888',
      secondaryColor: '#f5f5f5',
      tertiaryColor: '#eeeeee',
    } : {
      darkMode: true,
      background: '#161616',
      primaryColor: '#d97757',
      primaryTextColor: '#f0f0f0',
      primaryBorderColor: '#d97757',
      lineColor: '#666666',
      secondaryColor: '#1a1a1a',
      tertiaryColor: '#222222',
    },
  });
}

async function renderWithNativeMermaid() {
  setRenderSurfaceMode(rendererUtils.RENDERERS.MERMAID);
  configureNativeMermaidTheme();
  const { svg } = await mermaid.render('mermaid-diagram', currentCode);
  elements.mermaidOutput.innerHTML = svg;
}

function getEdgeStrokeColor(svgElement) {
  const edgeElement = svgElement.querySelector(
    'path[marker-end], path[marker-start], path[marker-mid], line[marker-end], polyline[marker-end], .edgePath .path, .edgePath path, path.flowchart-link'
  );
  if (!edgeElement) return '';

  const computedStroke = window.getComputedStyle(edgeElement).stroke;
  if (
    computedStroke &&
    computedStroke !== 'none' &&
    computedStroke !== 'transparent' &&
    computedStroke !== 'rgba(0, 0, 0, 0)'
  ) {
    return computedStroke;
  }

  const attributeStroke = edgeElement.getAttribute('stroke');
  if (attributeStroke && attributeStroke !== 'none') {
    return attributeStroke;
  }

  return '';
}

function parseMarkerId(value) {
  if (!value) return '';
  const match = String(value).match(/url\((['"]?)#([^)'"]+)\1\)/);
  return match ? match[2] : '';
}

function syncBeautifulArrowheads(svgElement) {
  const markerShapeSelector =
    'path, polygon, polyline, line, circle, ellipse, rect';
  const markerColorById = new Map();
  const edgeElements = svgElement.querySelectorAll(
    'path[marker-end], path[marker-start], path[marker-mid], line[marker-end], line[marker-start], line[marker-mid], polyline[marker-end], polyline[marker-start], polyline[marker-mid]'
  );

  edgeElements.forEach((edgeElement) => {
    const computedStroke = window.getComputedStyle(edgeElement).stroke;
    const strokeColor =
      computedStroke &&
      computedStroke !== 'none' &&
      computedStroke !== 'transparent' &&
      computedStroke !== 'rgba(0, 0, 0, 0)'
        ? computedStroke
        : edgeElement.getAttribute('stroke');

    if (!strokeColor || strokeColor === 'none') return;

    ['marker-start', 'marker-mid', 'marker-end'].forEach((attributeName) => {
      const markerId = parseMarkerId(edgeElement.getAttribute(attributeName));
      if (markerId && !markerColorById.has(markerId)) {
        markerColorById.set(markerId, strokeColor);
      }
    });
  });

  if (!markerColorById.size) {
    const fallbackStroke = getEdgeStrokeColor(svgElement);
    if (!fallbackStroke) return;
    svgElement.querySelectorAll('marker').forEach((marker) => {
      marker.style.setProperty('color', fallbackStroke, 'important');
      marker.setAttribute('color', fallbackStroke);
      marker.querySelectorAll(markerShapeSelector).forEach((shape) => {
        shape.style.setProperty('fill', fallbackStroke, 'important');
        shape.style.setProperty('stroke', fallbackStroke, 'important');
        shape.setAttribute('fill', fallbackStroke);
        shape.setAttribute('stroke', fallbackStroke);
      });
    });
    return;
  }

  markerColorById.forEach((strokeColor, markerId) => {
    const marker = Array.from(svgElement.querySelectorAll('marker')).find(
      (candidate) => candidate.id === markerId
    );
    if (!marker) return;
    marker.style.setProperty('color', strokeColor, 'important');
    marker.setAttribute('color', strokeColor);
    marker.querySelectorAll(markerShapeSelector).forEach((shape) => {
      shape.style.setProperty('fill', strokeColor, 'important');
      shape.style.setProperty('stroke', strokeColor, 'important');
      shape.setAttribute('fill', strokeColor);
      shape.setAttribute('stroke', strokeColor);
    });
  });
}

async function renderWithBeautifulMermaid() {
  setRenderSurfaceMode(rendererUtils.RENDERERS.BEAUTIFUL);
  if (!isBeautifulMermaidAvailable()) {
    throw new Error('beautiful-mermaid library is not available.');
  }
  const svg = await window.beautifulMermaid.renderMermaid(
    currentCode,
    getBeautifulThemeOptions()
  );
  elements.mermaidOutput.innerHTML = svg;
  const renderedSvg = elements.mermaidOutput.querySelector('svg');
  if (renderedSvg) {
    syncBeautifulArrowheads(renderedSvg);
  }
}

function debouncedRender() {
  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }
  renderTimeout = setTimeout(renderDiagram, CONFIG.DEBOUNCE_MS);
}

async function renderDiagram() {
  if (!currentCode.trim()) {
    elements.mermaidOutput.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">Enter Mermaid code to see your diagram</p>';
    return;
  }

  try {
    if (currentRenderer === rendererUtils.RENDERERS.BEAUTIFUL) {
      await renderWithBeautifulMermaid();
    } else {
      await renderWithNativeMermaid();
    }

    // Center the diagram after rendering
    // If it's the first render or a reset, fit to view
    setTimeout(() => {
      if (panX === 0 && panY === 0) {
        fitToView();
      } else {
        centerDiagram();
      }
    }, 50);
  } catch (error) {
    const rendererLabel = currentRenderer === rendererUtils.RENDERERS.BEAUTIFUL
      ? 'Beautiful Mermaid'
      : 'Mermaid';
    showToast('error', `${rendererLabel} Error`, error.message || 'Invalid Mermaid syntax');
  }
}

// ==========================================
// Storage
// ==========================================

function loadSavedCode() {
  const savedCode = localStorage.getItem(CONFIG.STORAGE_KEY);
  const legacyStyleLines = [
    'style A fill:#1a1a1a,stroke:#d97757,color:#f0f0f0',
    'style G fill:#1a1a1a,stroke:#22c55e,color:#f0f0f0',
    'style B fill:#1a1a1a,stroke:#d97757,color:#f0f0f0',
  ];
  let code = savedCode || CONFIG.DEFAULT_CODE;
  if (savedCode === CONFIG.LEGACY_DEFAULT_CODE) {
    code = CONFIG.DEFAULT_CODE;
    localStorage.setItem(CONFIG.STORAGE_KEY, code);
  } else if (
    savedCode &&
    legacyStyleLines.every((line) => savedCode.includes(line))
  ) {
    const sanitized = savedCode
      .split('\n')
      .filter((line) => !legacyStyleLines.includes(line.trim()))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd();

    code = sanitized || CONFIG.DEFAULT_CODE;
    localStorage.setItem(CONFIG.STORAGE_KEY, code);
  }
  currentCode = code;

  if (editor) {
    editor.setValue(code);
  }

  renderDiagram();
}

function saveCode() {
  localStorage.setItem(CONFIG.STORAGE_KEY, currentCode);
}

// ==========================================
// Toast Notifications
// ==========================================

function showToast(type, title, message) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  elements.toastContainer.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => removeToast(toast));

  setTimeout(() => removeToast(toast), CONFIG.TOAST_DURATION);
}

function removeToast(toast) {
  if (!toast.parentElement) return;
  toast.classList.add('toast-out');
  setTimeout(() => toast.remove(), 250);
}

// ==========================================
// Export Functions
// ==========================================

const exportUtils = window.ExportUtils || {
  resolveExportBackgroundColor: ({
    cssVariableBackgroundColor = '',
    containerBackgroundColor = '',
    bodyBackgroundColor = '',
    fallbackColor = '#161616',
  } = {}) => {
    const candidates = [
      cssVariableBackgroundColor,
      containerBackgroundColor,
      bodyBackgroundColor,
      fallbackColor,
    ];
    for (const candidate of candidates) {
      const value = String(candidate || '').trim();
      if (value) return value;
    }
    return '#161616';
  },
  buildStandaloneSvgMarkup: (svgMarkup, embeddedCss = '') => {
    const trimmedCss = String(embeddedCss || '').trim();
    let markup = String(svgMarkup || '');
    if (!/<svg\b[^>]*\bxmlns=/.test(markup)) {
      markup = markup.replace(
        /<svg\b/,
        '<svg xmlns="http://www.w3.org/2000/svg"'
      );
    }
    if (!trimmedCss) return markup;

    const openingTagEnd = markup.indexOf('>');
    if (openingTagEnd === -1) return markup;
    const safeCss = trimmedCss.replace(/<\/style/gi, '<\\/style');
    return `${markup.slice(0, openingTagEnd + 1)}<style>${safeCss}</style>${markup.slice(openingTagEnd + 1)}`;
  },
};

function getDiagramSvg() {
  return elements.mermaidOutput.querySelector('svg');
}

function getExportBackgroundColor() {
  const bodyStyles = getComputedStyle(document.body);
  const outputStyles = getComputedStyle(elements.mermaidOutput);

  return exportUtils.resolveExportBackgroundColor({
    cssVariableBackgroundColor: bodyStyles.getPropertyValue('--bg-card'),
    containerBackgroundColor: outputStyles.backgroundColor,
    bodyBackgroundColor: bodyStyles.backgroundColor,
  });
}

function buildExportSvgMarkup(svg) {
  const svgMarkup = new XMLSerializer().serializeToString(svg);
  return exportUtils.buildStandaloneSvgMarkup(
    svgMarkup,
    'text { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; }'
  );
}

function parseNumericDimension(value) {
  if (value === undefined || value === null) return 0;
  const match = String(value).match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

function getSvgDimensions(svg, image) {
  const viewBox = svg.getAttribute('viewBox');
  if (viewBox) {
    const values = viewBox
      .trim()
      .split(/[\s,]+/)
      .map((value) => Number(value));
    if (
      values.length === 4 &&
      Number.isFinite(values[2]) &&
      Number.isFinite(values[3]) &&
      values[2] > 0 &&
      values[3] > 0
    ) {
      return { width: values[2], height: values[3] };
    }
  }

  const attributeWidth = parseNumericDimension(svg.getAttribute('width'));
  const attributeHeight = parseNumericDimension(svg.getAttribute('height'));
  if (attributeWidth > 0 && attributeHeight > 0) {
    return { width: attributeWidth, height: attributeHeight };
  }

  const rect = svg.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    return { width: rect.width, height: rect.height };
  }

  if (image.naturalWidth > 0 && image.naturalHeight > 0) {
    return { width: image.naturalWidth, height: image.naturalHeight };
  }

  return { width: 1200, height: 800 };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to render SVG for export'));
    image.src = url;
  });
}

async function renderDiagramCanvas(scale = 2, padding = 20) {
  const svg = getDiagramSvg();
  if (!svg) {
    throw new Error('No diagram to export');
  }

  const svgData = buildExportSvgMarkup(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const { width, height } = getSvgDimensions(svg, image);
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.round((width + padding * 2) * scale));
    canvas.height = Math.max(1, Math.round((height + padding * 2) * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not create drawing context for export');
    }
    context.fillStyle = getExportBackgroundColor();
    context.fillRect(0, 0, canvas.width, canvas.height);

    const imageWidth = width * scale;
    const imageHeight = height * scale;
    context.drawImage(
      image,
      Math.round(padding * scale),
      Math.round(padding * scale),
      Math.round(imageWidth),
      Math.round(imageHeight)
    );

    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

async function exportPng() {
  const svg = getDiagramSvg();
  if (!svg) {
    showToast('error', 'Export Failed', 'No diagram to export');
    return;
  }

  try {
    const canvas = await renderDiagramCanvas(2, 20);

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) throw new Error('Failed to encode PNG');
    downloadBlob(blob, 'mermaid-diagram.png');

    showToast('success', 'Export Complete', 'PNG downloaded at 2x resolution');
  } catch (error) {
    showToast('error', 'Export Failed', error.message);
  }
}

function exportSvg() {
  const svg = getDiagramSvg();
  if (!svg) {
    showToast('error', 'Export Failed', 'No diagram to export');
    return;
  }

  try {
    const svgData = buildExportSvgMarkup(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, 'mermaid-diagram.svg');

    showToast('success', 'Export Complete', 'SVG downloaded successfully');
  } catch (error) {
    showToast('error', 'Export Failed', error.message);
  }
}

function showPdfModal() {
  elements.pdfModal.classList.add('active');
}

function hidePdfModal() {
  elements.pdfModal.classList.remove('active');
}

async function exportPdf(pageSize = 'a4') {
  const svg = getDiagramSvg();
  if (!svg) {
    showToast('error', 'Export Failed', 'No diagram to export');
    return;
  }

  try {
    const { jsPDF } = window.jspdf;

    // Page dimensions
    const sizes = {
      a4: [210, 297],
      letter: [215.9, 279.4],
      a3: [297, 420],
    };

    const [width, height] = sizes[pageSize];
    const pdf = new jsPDF({
      orientation: width > height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: pageSize,
    });

    const canvas = await renderDiagramCanvas(2, 20);

    const imgData = canvas.toDataURL('image/png');

    // Calculate dimensions to fit page with margins
    const margin = 10;
    const maxWidth = width - (margin * 2);
    const maxHeight = height - (margin * 2);

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(maxWidth / (imgWidth / 4), maxHeight / (imgHeight / 4));

    const finalWidth = (imgWidth / 4) * ratio;
    const finalHeight = (imgHeight / 4) * ratio;

    const x = (width - finalWidth) / 2;
    const y = (height - finalHeight) / 2;

    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    pdf.save('mermaid-diagram.pdf');

    showToast('success', 'Export Complete', `PDF saved as ${pageSize.toUpperCase()}`);
  } catch (error) {
    showToast('error', 'Export Failed', error.message);
  }
}

function showAsciiModal() {
  if (!currentCode.trim()) {
    showToast('error', 'Export Failed', 'No code to convert to ASCII');
    return;
  }
  elements.asciiModal.classList.add('active');
  refreshAsciiPreview();
}

function hideAsciiModal() {
  elements.asciiModal.classList.remove('active');
}

async function renderAsciiPreview() {
  if (!isBeautifulMermaidAvailable()) {
    throw new Error('beautiful-mermaid library is not available.');
  }
  const useAscii = elements.asciiModeAscii.checked;
  const output = await Promise.resolve(
    window.beautifulMermaid.renderMermaidAscii(currentCode, { useAscii })
  );
  return String(output || '');
}

async function refreshAsciiPreview() {
  if (!elements.asciiModal.classList.contains('active')) return;
  elements.asciiPreview.textContent = 'Rendering ASCII preview...';

  try {
    latestAscii = await renderAsciiPreview();
    if (!latestAscii) {
      elements.asciiPreview.textContent = '[empty ASCII output]';
      return;
    }
    elements.asciiPreview.textContent = latestAscii;
  } catch (error) {
    latestAscii = '';
    elements.asciiPreview.textContent = `Failed to render ASCII preview:\n${error.message}`;
    showToast('error', 'ASCII Render Failed', error.message);
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

async function copyAsciiPreview() {
  if (!latestAscii) {
    await refreshAsciiPreview();
  }
  if (!latestAscii) {
    showToast('error', 'Copy Failed', 'No ASCII output available to copy');
    return;
  }

  try {
    await copyTextToClipboard(latestAscii);
    showToast('success', 'Copied', 'ASCII output copied to clipboard');
  } catch (error) {
    showToast('error', 'Copy Failed', error.message);
  }
}

async function downloadAsciiPreview() {
  if (!latestAscii) {
    await refreshAsciiPreview();
  }
  if (!latestAscii) {
    showToast('error', 'Export Failed', 'No ASCII output available to export');
    return;
  }

  try {
    const blob = new Blob([latestAscii], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'mermaid-diagram-ascii.txt');
    showToast('success', 'Export Complete', 'ASCII output exported');
  } catch (error) {
    showToast('error', 'Export Failed', error.message);
  }
}

function exportCode() {
  if (!currentCode.trim()) {
    showToast('error', 'Export Failed', 'No code to export');
    return;
  }

  try {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'diagram.mmd');

    showToast('success', 'Export Complete', 'Mermaid code saved as .mmd file');
  } catch (error) {
    showToast('error', 'Export Failed', error.message);
  }
}

// ==========================================
// Start Application
// ==========================================

document.addEventListener('DOMContentLoaded', init);

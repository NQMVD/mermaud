/**
 * Mermaid Playground
 * A single-page Mermaid diagram editor with live preview
 */

// ==========================================
// Configuration
// ==========================================

const CONFIG = {
  STORAGE_KEY: 'mermaid-playground-code',
  DEBOUNCE_MS: 200,
  TOAST_DURATION: 5000,
  DEFAULT_CODE: `flowchart TD
    A[🎨 Start Here] --> B{Choose Your Path}
    B -->|Design| C[Create Mockups]
    B -->|Develop| D[Write Code]
    B -->|Document| E[Draft Specs]
    C --> F[Review & Iterate]
    D --> F
    E --> F
    F --> G[🚀 Ship It!]
    
    style A fill:#2d2d2d,stroke:#d4a574,color:#e8e8e8
    style G fill:#2d2d2d,stroke:#4ade80,color:#e8e8e8
    style B fill:#2d2d2d,stroke:#d4a574,color:#e8e8e8`,
};

// ==========================================
// State
// ==========================================

let editor = null;
let currentCode = '';
let renderTimeout = null;
let isResizing = false;
let editorCollapsed = false;

// ==========================================
// DOM Elements
// ==========================================

const elements = {
  editorPanel: document.getElementById('editor-panel'),
  editorContainer: document.getElementById('editor-container'),
  previewPanel: document.getElementById('preview-panel'),
  mermaidOutput: document.getElementById('mermaid-output'),
  resizeHandle: document.getElementById('resize-handle'),
  toggleEditor: document.getElementById('toggle-editor'),
  themeToggle: document.getElementById('theme-toggle'),
  toastContainer: document.getElementById('toast-container'),
  pdfModal: document.getElementById('pdf-modal'),
  pdfCancel: document.getElementById('pdf-cancel'),
  exportPng: document.getElementById('export-png'),
  exportSvg: document.getElementById('export-svg'),
  exportPdf: document.getElementById('export-pdf'),
  exportCode: document.getElementById('export-code'),
};

// ==========================================
// Initialization
// ==========================================

async function init() {
  initTheme();
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

function initMermaid() {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif',
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
    },
    themeVariables: {
      darkMode: true,
      background: '#2d2d2d',
      primaryColor: '#d4a574',
      primaryTextColor: '#e8e8e8',
      primaryBorderColor: '#d4a574',
      lineColor: '#8b7355',
      secondaryColor: '#3d3d3d',
      tertiaryColor: '#404040',
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
        operators: ['-->', '---', '-.->',  '-.-', '==>', '===', '--', '->','<--', '<-->', '-->|', '|', ':::', '%%'],
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
          { token: 'keyword', foreground: 'd4a574', fontStyle: 'bold' },
          { token: 'identifier', foreground: 'e8e8e8' },
          { token: 'string', foreground: '4ade80' },
          { token: 'string.bracket', foreground: '60a5fa' },
          { token: 'string.paren', foreground: 'f472b6' },
          { token: 'string.brace', foreground: 'fbbf24' },
          { token: 'comment', foreground: '6b6b6b', fontStyle: 'italic' },
          { token: 'operator', foreground: '8b7355' },
          { token: 'annotation', foreground: 'a78bfa' },
          { token: 'number', foreground: 'fb923c' },
          { token: 'number.hex', foreground: 'fb923c' },
        ],
        colors: {
          'editor.background': '#1a1a1a',
          'editor.foreground': '#e8e8e8',
          'editor.lineHighlightBackground': '#2d2d2d',
          'editor.selectionBackground': '#d4a57440',
          'editorCursor.foreground': '#d4a574',
          'editorLineNumber.foreground': '#6b6b6b',
          'editorLineNumber.activeForeground': '#a0a0a0',
          'editor.selectionHighlightBackground': '#d4a57420',
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
        renderLineHighlight: 'line',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 4,
        insertSpaces: true,
        padding: { top: 16, bottom: 16 },
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
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

  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Resize handle
  elements.resizeHandle.addEventListener('mousedown', startResize);
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);

  // Export buttons
  elements.exportPng.addEventListener('click', exportPng);
  elements.exportSvg.addEventListener('click', exportSvg);
  elements.exportPdf.addEventListener('click', showPdfModal);
  elements.exportCode.addEventListener('click', exportCode);

  // PDF modal
  elements.pdfCancel.addEventListener('click', hidePdfModal);
  elements.pdfModal.querySelector('.modal-backdrop').addEventListener('click', hidePdfModal);
  elements.pdfModal.querySelectorAll('.btn-modal-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      exportPdf(btn.dataset.size);
      hidePdfModal();
    });
  });

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
  // Escape to close modal
  if (e.key === 'Escape' && elements.pdfModal.classList.contains('active')) {
    hidePdfModal();
  }
}

// ==========================================
// Panel Controls
// ==========================================

function toggleEditorPanel() {
  editorCollapsed = !editorCollapsed;
  elements.editorPanel.classList.toggle('collapsed', editorCollapsed);
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
  const newWidth = e.clientX - containerRect.left;
  const minWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--min-panel-width'));
  const maxWidth = containerRect.width - minWidth - 8; // 8px for resize handle
  
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
    // Update Mermaid theme based on current mode
    const isLightMode = document.body.classList.contains('light-mode');
    mermaid.initialize({
      startOnLoad: false,
      theme: isLightMode ? 'default' : 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      themeVariables: isLightMode ? {
        darkMode: false,
        background: '#ffffff',
        primaryColor: '#b8956a',
        primaryTextColor: '#1a1a1a',
        primaryBorderColor: '#b8956a',
        lineColor: '#6b5a42',
        secondaryColor: '#f0f0f0',
        tertiaryColor: '#e8e8e8',
      } : {
        darkMode: true,
        background: '#2d2d2d',
        primaryColor: '#d4a574',
        primaryTextColor: '#e8e8e8',
        primaryBorderColor: '#d4a574',
        lineColor: '#8b7355',
        secondaryColor: '#3d3d3d',
        tertiaryColor: '#404040',
      },
    });

    const { svg } = await mermaid.render('mermaid-diagram', currentCode);
    elements.mermaidOutput.innerHTML = svg;
  } catch (error) {
    showToast('error', 'Syntax Error', error.message || 'Invalid Mermaid syntax');
  }
}

// ==========================================
// Storage
// ==========================================

function loadSavedCode() {
  const savedCode = localStorage.getItem(CONFIG.STORAGE_KEY);
  const code = savedCode || CONFIG.DEFAULT_CODE;
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

async function exportPng() {
  const svg = elements.mermaidOutput.querySelector('svg');
  if (!svg) {
    showToast('error', 'Export Failed', 'No diagram to export');
    return;
  }

  try {
    // Create a canvas with 2x scale for retina
    const canvas = await html2canvas(elements.mermaidOutput, {
      scale: 2,
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-tertiary').trim(),
      logging: false,
    });

    // Download
    const link = document.createElement('a');
    link.download = 'mermaid-diagram.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('success', 'Export Complete', 'PNG downloaded at 2x resolution');
  } catch (error) {
    showToast('error', 'Export Failed', error.message);
  }
}

function exportSvg() {
  const svg = elements.mermaidOutput.querySelector('svg');
  if (!svg) {
    showToast('error', 'Export Failed', 'No diagram to export');
    return;
  }

  try {
    // Clone and clean up SVG
    const svgClone = svg.cloneNode(true);
    svgClone.removeAttribute('id');
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    // Add embedded styles for standalone SVG
    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleElement.textContent = `
      text { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; }
    `;
    svgClone.insertBefore(styleElement, svgClone.firstChild);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    
    const link = document.createElement('a');
    link.download = 'mermaid-diagram.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);

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
  const svg = elements.mermaidOutput.querySelector('svg');
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

    // Convert SVG to image
    const canvas = await html2canvas(elements.mermaidOutput, {
      scale: 2,
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-tertiary').trim(),
      logging: false,
    });

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

function exportCode() {
  if (!currentCode.trim()) {
    showToast('error', 'Export Failed', 'No code to export');
    return;
  }

  try {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.download = 'diagram.mmd';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);

    showToast('success', 'Export Complete', 'Mermaid code saved as .mmd file');
  } catch (error) {
    showToast('error', 'Export Failed', error.message);
  }
}

// ==========================================
// Start Application
// ==========================================

document.addEventListener('DOMContentLoaded', init);

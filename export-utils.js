(function initExportUtils(root) {
  'use strict';

  function firstNonEmpty(values, fallback) {
    for (const value of values) {
      const trimmed = String(value || '').trim();
      if (trimmed) return trimmed;
    }
    return fallback;
  }

  function resolveExportBackgroundColor({
    cssVariableBackgroundColor = '',
    containerBackgroundColor = '',
    bodyBackgroundColor = '',
    fallbackColor = '#161616',
  } = {}) {
    return firstNonEmpty(
      [
        cssVariableBackgroundColor,
        containerBackgroundColor,
        bodyBackgroundColor,
      ],
      fallbackColor
    );
  }

  function ensureSvgNamespace(svgMarkup) {
    const markup = String(svgMarkup || '');
    if (!/<svg\b/i.test(markup)) return markup;
    if (/<svg\b[^>]*\bxmlns=/i.test(markup)) return markup;
    return markup.replace(
      /<svg\b/i,
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }

  function injectSvgStyle(svgMarkup, embeddedCss = '') {
    const css = String(embeddedCss || '').trim();
    if (!css) return svgMarkup;

    const markup = String(svgMarkup || '');
    const openingTagEnd = markup.indexOf('>');
    if (openingTagEnd === -1) return markup;

    const safeCss = css.replace(/<\/style/gi, '<\\/style');
    return `${markup.slice(0, openingTagEnd + 1)}<style>${safeCss}</style>${markup.slice(openingTagEnd + 1)}`;
  }

  function buildStandaloneSvgMarkup(svgMarkup, embeddedCss = '') {
    return injectSvgStyle(ensureSvgNamespace(svgMarkup), embeddedCss);
  }

  const api = {
    resolveExportBackgroundColor,
    ensureSvgNamespace,
    injectSvgStyle,
    buildStandaloneSvgMarkup,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.ExportUtils = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));

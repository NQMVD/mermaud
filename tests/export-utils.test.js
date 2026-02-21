const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveExportBackgroundColor,
  ensureSvgNamespace,
  injectSvgStyle,
  buildStandaloneSvgMarkup,
} = require('../export-utils');

test('resolveExportBackgroundColor prioritizes CSS variable values', () => {
  const color = resolveExportBackgroundColor({
    cssVariableBackgroundColor: '  #112233  ',
    containerBackgroundColor: 'rgb(10, 20, 30)',
    bodyBackgroundColor: '#ffffff',
  });

  assert.equal(color, '#112233');
});

test('resolveExportBackgroundColor falls back when preferred color is empty', () => {
  const color = resolveExportBackgroundColor({
    cssVariableBackgroundColor: '   ',
    containerBackgroundColor: 'rgb(22, 22, 22)',
    bodyBackgroundColor: '#ffffff',
  });

  assert.equal(color, 'rgb(22, 22, 22)');
});

test('resolveExportBackgroundColor returns hard fallback when all values are empty', () => {
  const color = resolveExportBackgroundColor({
    cssVariableBackgroundColor: '',
    containerBackgroundColor: '',
    bodyBackgroundColor: '',
  });

  assert.equal(color, '#161616');
});

test('ensureSvgNamespace adds xmlns only when missing', () => {
  const withoutNs = '<svg id="mermaid-diagram" viewBox="0 0 10 10"></svg>';
  const withNs = ensureSvgNamespace(withoutNs);
  const alreadyNs = ensureSvgNamespace(withNs);

  assert.match(withNs, /<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.equal(
    (alreadyNs.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/g) || []).length,
    1
  );
});

test('buildStandaloneSvgMarkup preserves id and injects style tag', () => {
  const input = '<svg id="mermaid-diagram" viewBox="0 0 10 10"><g/></svg>';
  const output = buildStandaloneSvgMarkup(
    input,
    'text { font-family: Inter, sans-serif; }'
  );

  assert.match(output, /id="mermaid-diagram"/);
  assert.match(output, /<style>text \{ font-family: Inter, sans-serif; \}<\/style>/);
  assert.match(output, /<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});

test('injectSvgStyle leaves markup unchanged when style is empty', () => {
  const input = '<svg id="a"></svg>';
  const output = injectSvgStyle(input, ' ');

  assert.equal(output, input);
});

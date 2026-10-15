import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeBody, sanitizeText, htmlToText, excerptFrom } from '../../src/lib/sanitize.ts';

describe('sanitizeBody', () => {
  test('removes scripts, event handlers, styles and javascript: URLs', () => {
    const dirty =
      '<p onclick="x()" style="color:red">hi<script>alert(1)</script></p><a href="javascript:alert(1)">bad</a><img src="x" onerror="alert(1)"><svg onload="x"></svg>';
    const clean = sanitizeBody(dirty);
    assert.ok(!/script|onclick|onerror|onload|javascript:|style=|<svg/i.test(clean), clean);
    assert.match(clean, /<p>hi<\/p>/);
  });
  test('keeps structure used by articles', () => {
    const clean = sanitizeBody('<h1>T</h1><p>a <b>b</b> <i>c</i></p><ul><li>x</li></ul><table><tr><td colspan="2">c</td></tr></table><blockquote>q</blockquote>');
    assert.match(clean, /<h2>T<\/h2>/);
    assert.match(clean, /<strong>b<\/strong> <em>c<\/em>/);
    assert.match(clean, /<td colspan="2">c<\/td>/);
    assert.match(clean, /<blockquote>q<\/blockquote>/);
  });
  test('drops empty paragraphs and nbsp noise', () => {
    const nbsp = String.fromCharCode(0xa0);
    assert.equal(sanitizeBody(`<p>${nbsp}</p><p>   </p><p>text${nbsp}${nbsp}more</p>`), '<p>text more</p>');
  });
  test('external links open safely, internal links do not get target', () => {
    const clean = sanitizeBody('<a href="https://example.org" target="_self">x</a><a href="/ar/news/1" target="_blank">y</a>');
    assert.match(clean, /<a href="https:\/\/example.org" target="_blank" rel="noopener noreferrer">x<\/a>/);
    assert.match(clean, /<a href="\/ar\/news\/1">y<\/a>/);
  });
  test('images are lazy and only http(s)', () => {
    const clean = sanitizeBody('<img src="https://files.hadramout.center/a.jpg" alt="x"><img src="data:text/html;base64,AAA"><img src="javascript:1">');
    assert.match(clean, /<img src="https:\/\/files.hadramout.center\/a.jpg" alt="x" loading="lazy" decoding="async" \/>/);
    assert.equal((clean.match(/<img/g) ?? []).length, 1);
  });
  test('YouTube iframes become privacy-friendly; other iframes are removed', () => {
    const yt = sanitizeBody('<iframe src="https://www.youtube.com/embed/abc123?feature=oembed" width="500"></iframe>');
    assert.match(yt, /src="https:\/\/www\.youtube-nocookie\.com\/embed\/abc123"/);
    assert.match(yt, /loading="lazy"/);
    assert.equal(sanitizeBody('<iframe src="https://evil.example/x"></iframe>'), '');
  });
});

describe('text helpers', () => {
  test('sanitizeText strips every tag', () => {
    assert.equal(sanitizeText('<b>a</b> &amp; <script>x</script>c'), 'a & c');
  });
  test('htmlToText separates blocks', () => {
    assert.equal(htmlToText('<p>one</p><p>two<br>three</p>'), 'one two three');
  });
  test('excerptFrom cuts on word boundary with ellipsis', () => {
    const long = `<p>${'كلمة '.repeat(100)}</p>`;
    const ex = excerptFrom(long, 50);
    assert.ok(ex.endsWith('…'));
    assert.ok(ex.length <= 52);
    assert.equal(excerptFrom('<p>قصير</p>', 50), 'قصير');
  });
});

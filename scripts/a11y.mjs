import { JSDOM } from 'jsdom';
import axe from 'axe-core';
const base = process.env.BASE ?? 'http://127.0.0.1:3100';
const pages = ['/ar', '/en', '/ar/news', '/ar/news/300', '/ar/articles/909', '/ar/books', '/ar/books/30', '/ar/search?q=حضرموت', '/ar/authors', '/ar/timeline', '/ar/contact', '/ar/about'];
let bad = 0;
for (const p of pages) {
  const html = await (await fetch(base + encodeURI(p))).text();
  const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.eval(axe.source);
  const res = await dom.window.axe.run(dom.window.document, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  console.log(p, res.violations.length ? res.violations.map((v) => `${v.id}(${v.nodes.length})`).join(', ') : 'ok');
  bad += res.violations.length;
}
process.exit(bad ? 1 : 0);

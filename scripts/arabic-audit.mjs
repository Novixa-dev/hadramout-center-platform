// Lists visible text on /ar pages that contains Latin letters (candidates for untranslated UI strings).
import { JSDOM } from 'jsdom';
const base = process.env.BASE ?? 'http://localhost:3000';
const pages = ['/ar', '/ar/news', '/ar/articles', '/ar/articles/909', '/ar/books', '/ar/books/30', '/ar/magazines', '/ar/events', '/ar/forum', '/ar/videos', '/ar/search?q=حضرموت', '/ar/authors', '/ar/timeline', '/ar/contact', '/ar/about', '/ar/saved', '/ar/privacy', '/ar/terms', '/ar/accessibility', '/ar/nope'];
const seen = new Map();
for (const p of pages) {
  const html = await (await fetch(base + encodeURI(p))).text();
  const doc = new JSDOM(html).window.document;
  doc.querySelectorAll('script,style,noscript,svg').forEach((e) => e.remove());
  const walker = doc.createTreeWalker(doc.body, 4);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.replace(/\s+/g, ' ').trim();
    if (/[A-Za-z]{3,}/.test(t) && !seen.has(t)) seen.set(t, p);
  }
  for (const el of doc.querySelectorAll('[aria-label],[placeholder],[title],img[alt]')) {
    for (const a of ['aria-label', 'placeholder', 'title', 'alt']) {
      const v = el.getAttribute(a);
      if (v && /[A-Za-z]{3,}/.test(v) && !seen.has(`@${a}: ${v}`)) seen.set(`@${a}: ${v}`, p);
    }
  }
}
for (const [t, p] of seen) console.log(p.padEnd(22), t.slice(0, 110));
console.log(`\n${seen.size} Latin fragments`);

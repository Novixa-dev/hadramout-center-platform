#!/usr/bin/env node
/**
 * Editorial quality report: what is missing or inconsistent in the published content, plus what readers looked for.
 * Read-only: opens the databases in read-only mode and prints Markdown.
 *
 *   npm run quality                      # uses DATA_DIR (default ./data) or DATABASE_URL
 *   npm run quality -- --out docs/reports/QUALITY_REPORT.md
 *
 * Nothing here is invented: every line is a count or a list of records straight from the database.
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const dataDir = resolve(process.env.DATA_DIR || './data');
const payloadPath = process.env.DATABASE_URL?.startsWith('file:') ? process.env.DATABASE_URL.slice(5) : join(dataDir, 'payload.db');
const extrasPath = join(dataDir, 'extras.db');
if (!existsSync(payloadPath)) {
  console.error(`database not found: ${payloadPath} (set DATA_DIR or DATABASE_URL)`);
  process.exit(2);
}
const payload = new DatabaseSync(payloadPath, { readOnly: true });
const extras = existsSync(extrasPath) ? new DatabaseSync(extrasPath, { readOnly: true }) : null;

const skipped = [];
const run = (db, label, sql, ...params) => {
  try {
    return db.prepare(sql).all(...params);
  } catch (e) {
    skipped.push(`${label}: ${e.message}`);
    return [];
  }
};
const lines = [];
const h = (t) => lines.push('', `## ${t}`, '');
const SAMPLE = 8;

/** One check: total count + a few example links. `rows` are {id, title}. */
function check(title, route, rows, note = '') {
  lines.push(`- **${title}:** ${rows.length}${note ? ` — ${note}` : ''}`);
  for (const r of rows.slice(0, SAMPLE)) lines.push(`  - [${r.id}](/ar/${route}/${r.id})${r.title ? ` ${String(r.title).replace(/\s+/g, ' ').slice(0, 80)}` : ''}`);
  if (rows.length > SAMPLE) lines.push(`  - … and ${rows.length - SAMPLE} more`);
}

const title = (table, alias = 'a') => `(SELECT l.title FROM ${table}_locales l WHERE l._parent_id = ${alias}.id AND l._locale = 'ar' LIMIT 1)`;

lines.push('# Editorial quality report', '', `Generated from \`${payloadPath}\` (read-only). Published content only.`);

h('Articles');
const A = (where, extra = '') => run(payload, `articles ${where}`, `SELECT a.id, ${title('articles')} AS title FROM articles a ${extra} WHERE a.status = 'published' AND ${where}`);
check('Without an author', 'articles', run(payload, 'articles no author', `SELECT a.id, ${title('articles')} AS title FROM articles a WHERE a.status='published' AND NOT EXISTS (SELECT 1 FROM articles_rels r WHERE r.parent_id=a.id AND r.path='authors')`));
check('Without a category/topic', 'articles', A('a.category_id IS NULL'));
check('Date is estimated or unknown', 'articles', A("(a.date_precision IS NULL OR a.date_precision IN ('estimated','none') OR a.published_at IS NULL)"), 'these dates should not be cited as publication dates');
check('Empty excerpt', 'articles', run(payload, 'articles empty excerpt', `SELECT a.id, ${title('articles')} AS title FROM articles a JOIN articles_locales l ON l._parent_id=a.id AND l._locale='ar' WHERE a.status='published' AND (l.excerpt IS NULL OR trim(l.excerpt)='')`));
check('Empty body', 'articles', run(payload, 'articles empty body', `SELECT a.id, l.title FROM articles a JOIN articles_locales l ON l._parent_id=a.id AND l._locale='ar' WHERE a.status='published' AND (l.body IS NULL OR length(trim(l.body)) < 200)`), 'shorter than 200 characters');
const dup = run(payload, 'articles duplicate titles', `SELECT l.title AS title, group_concat(l._parent_id) AS ids FROM articles_locales l JOIN articles a ON a.id=l._parent_id WHERE l._locale='ar' AND a.status='published' AND trim(l.title)<>'' GROUP BY l.title HAVING count(*)>1 ORDER BY count(*) DESC`);
lines.push(`- **Duplicate titles:** ${dup.length} titles used more than once`);
for (const d of dup.slice(0, SAMPLE)) lines.push(`  - ${String(d.title).slice(0, 70)} → ids ${d.ids}`);

h('Books and issues');
check('Books without a cover', 'books', run(payload, 'books no cover', `SELECT a.id, ${title('books')} AS title FROM books a WHERE a.status='published' AND a.cover_id IS NULL AND (a.cover_url IS NULL OR a.cover_url='')`));
check('Books without a PDF link', 'books', run(payload, 'books no pdf', `SELECT a.id, ${title('books')} AS title FROM books a WHERE a.status='published' AND (a.pdf IS NULL OR a.pdf='')`), 'not necessarily a defect: some books are not public');
check('Books without ISBN', 'books', run(payload, 'books no isbn', `SELECT a.id, ${title('books')} AS title FROM books a WHERE a.status='published' AND (a.isbn IS NULL OR a.isbn='')`), 'the catalogue export leaves the column empty; no value is guessed');
check('Books without page count', 'books', run(payload, 'books no pages', `SELECT a.id, ${title('books')} AS title FROM books a WHERE a.status='published' AND (a.pages IS NULL OR a.pages=0)`));
check('Books without an author', 'books', run(payload, 'books no author', `SELECT a.id, ${title('books')} AS title FROM books a WHERE a.status='published' AND NOT EXISTS (SELECT 1 FROM books_rels r WHERE r.parent_id=a.id AND r.path='authors')`));
check('Issues without a PDF link', 'magazines', run(payload, 'issues no pdf', `SELECT a.id, ${title('magazines')} AS title FROM magazines a WHERE a.status='published' AND (a.pdf IS NULL OR a.pdf='')`));
check('Issues without a cover', 'magazines', run(payload, 'issues no cover', `SELECT a.id, ${title('magazines')} AS title FROM magazines a WHERE a.status='published' AND a.cover_id IS NULL AND (a.cover_url IS NULL OR a.cover_url='')`));

h('News and events');
check('News without a cover image', 'news', run(payload, 'news no cover', `SELECT a.id, ${title('news')} AS title FROM news a WHERE a.status='published' AND a.cover_id IS NULL AND (a.cover_url IS NULL OR a.cover_url='')`));
check('Events without a structured date', 'events', run(payload, 'events no date', `SELECT a.id, ${title('events')} AS title FROM events a WHERE a.status='published' AND a.event_date IS NULL`), 'such pages are described as CreativeWork in search markup, not Event');

h('Images inside article text');
let imgs = 0;
let noAlt = 0;
const docsNoAlt = new Set();
for (const t of ['articles', 'news']) {
  for (const row of run(payload, `${t} bodies`, `SELECT _parent_id AS id, body FROM ${t}_locales WHERE _locale='ar' AND body LIKE '%<img%'`)) {
    for (const m of String(row.body).matchAll(/<img\b[^>]*>/gi)) {
      imgs++;
      const alt = m[0].match(/\balt\s*=\s*"([^"]*)"/i);
      if (!alt || alt[1].trim() === '') {
        noAlt++;
        docsNoAlt.add(`${t}/${row.id}`);
      }
    }
  }
}
lines.push(`- **Images in article and news bodies:** ${imgs}; **without alt text:** ${noAlt} in ${docsNoAlt.size} documents (alt text is editorial writing; this is the work list)`);

h('Waiting for a human');
lines.push(`- **Reader reviews pending moderation:** ${run(payload, 'reviews', "SELECT count(*) c FROM reviews WHERE status='pending'")[0]?.c ?? 'n/a'}`);
lines.push(`- **Contact / book-request messages not yet handled:** ${run(payload, 'messages', "SELECT count(*) c FROM messages WHERE status='new'")[0]?.c ?? 'n/a'}`);
lines.push(`- **Timeline entries not yet scientifically reviewed:** ${run(payload, 'timeline', "SELECT count(*) c FROM timeline WHERE review_status IS NULL OR review_status <> 'reviewed'")[0]?.c ?? 'n/a'}`);

h('What readers look for (last 60 days)');
if (!extras) {
  lines.push('_extras.db not found — no analytics available._');
} else {
  const zero = run(extras, 'zero results', "SELECT q, sum(count) n FROM search_queries WHERE results=0 AND day >= date('now','-60 days') GROUP BY q ORDER BY n DESC LIMIT 20");
  lines.push('**Searches that found nothing** (candidates for new content or synonyms):', '');
  lines.push(...(zero.length ? zero.map((r) => `- ${r.q} — ${r.n}`) : ['- none recorded']));
  const top = run(extras, 'top queries', "SELECT q, sum(count) n FROM search_queries WHERE results>0 AND day >= date('now','-60 days') GROUP BY q ORDER BY n DESC LIMIT 15");
  lines.push('', '**Most frequent successful searches:**', '');
  lines.push(...(top.length ? top.map((r) => `- ${r.q} — ${r.n}`) : ['- none recorded']));
  const nf = run(extras, 'not found', "SELECT path, sum(count) n FROM not_found_log WHERE day >= date('now','-60 days') GROUP BY path ORDER BY n DESC LIMIT 15");
  lines.push('', '**Most requested missing pages** (broken links worth redirecting):', '');
  lines.push(...(nf.length ? nf.map((r) => `- \`${r.path}\` — ${r.n}`) : ['- none recorded']));
}

if (skipped.length) lines.push('', '## Skipped checks', '', ...skipped.map((s) => `- ${s}`));
const text = `${lines.join('\n')}\n`;
if (out) {
  writeFileSync(out, text);
  console.error(`written ${out}`);
} else {
  console.log(text);
}

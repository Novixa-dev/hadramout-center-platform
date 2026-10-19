# Migration Pre-Launch Verification Checklist

| | |
|---|---|
| **Purpose** | A runnable, ordered list of checks that prove the migrated content, URLs, media and text are complete and safe before the legacy host is retired or the domain is switched. |
| **Scope** | Counts, redirects, media and PDFs, Arabic text integrity, dates and attribution, backup and restore of migrated data, domain cutover, post-launch watch. Read-only against the legacy site and production. |
| **Status** | Steps 1 to 6 were executed on 2026-10-18 on samples (results recorded per step). Steps 7 to 9 are `BACKLOG`. Step status words: `VERIFIED` (run, passed or result recorded), `BLOCKED` (needs a decision or access), `BACKLOG` (not run). |
| **Last updated** | 2026-10-18 |
| **Sources / evidence** | [CONTENT_MIGRATION_PLAN.md](CONTENT_MIGRATION_PLAN.md), [URL_REDIRECT_MAP.md](URL_REDIRECT_MAP.md), [../audit/LEGACY_SITE_INVENTORY.md](../audit/LEGACY_SITE_INVENTORY.md); scripts below were run on Windows (Git Bash, Node v24.15.0) on 2026-10-18. |

## 0. Rules and set-up

* Read-only: GET/HEAD only against `https://hadramout.center`, `https://files.hadramout.center` and production. Wait at least 300 ms between requests. No form submissions, no load testing. Stop on `429`/`403`.
* Never open the live database for writing. Always work on a copy.
* Never paste `.env` values anywhere; refer to variable names only.
* Run all commands from the repository root unless noted. Use a scratch directory outside the repository for outputs.

```bash
export PROD=https://hadramout-center.novixa.dev       # change to https://hadramout.center after cutover
export LEGACY=https://hadramout.center
export LEGACY_FILES=https://files.hadramout.center
export TMP=/path/to/scratch                            # outside the repo
mkdir -p "$TMP" && cp data/payload.db "$TMP/payload.db"   # on the server: use backup.sh output instead
```

Expected facts used below (from [CONTENT_MIGRATION_PLAN.md](CONTENT_MIGRATION_PLAN.md) section 6, 2026-10-18): legacy 1,461 items; migrated 1,454; 7 known empty ids.

## 1. Inventory and counts

| Step | Command | Expected | Status |
|---|---|---|---|
| 1.1 Snapshot metadata | `node -e "const z=require('zlib'),fs=require('fs');const s=JSON.parse(z.gunzipSync(fs.readFileSync('content/legacy-snapshot.json.gz')));console.log(JSON.stringify(s.meta))"` | `discovered` 391/912/52/40/53/11/2 and `imported` 387/909/52/40/53/11/2, `generatedAt` 2026-10-14 | VERIFIED |
| 1.2 Legacy id list (about 87 requests, about a minute) | save the script below as `$TMP/crawl.mjs`, then `cd $TMP && node crawl.mjs` | last line `requests 87 {"books":52,"magazines":40,"videos":2,"forum":11,"events":53,"news":391,"articles":912}`; file `legacy_ids.json` | VERIFIED (2026-10-18: 1,461) |
| 1.3 Database counts | `node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync(process.argv[1],{readOnly:true});for(const t of ['news','articles','books','magazines','events','forum_events','videos'])console.log(t,d.prepare('select count(*) c from '+t).get().c)" "$TMP/payload.db"` | 387, 909, 52, 40, 53, 11, 2 (total 1,454) | VERIFIED |
| 1.4 Set difference legacy vs DB | `cd $TMP && node diff.mjs` (script below) | exactly the 7 ids `1472 1538 1640 10300 2544 3350 4262` missing; nothing extra; 0 duplicate `legacy_id`; the script also lists the 7 unique `*_legacy_id_idx` indexes | VERIFIED |
| 1.5 Production counts and ids | `curl -s $PROD/sitemap.xml -o $TMP/psm.xml` then `for s in news articles books magazines events forum videos; do echo $s $(grep -o "<loc>[^<]*/ar/$s/[0-9]*</loc>" $TMP/psm.xml \| wc -l); done` | 387 909 52 40 53 11 2; ids equal the DB `id` set | VERIFIED |

`crawl.mjs`:

```js
import { writeFileSync } from 'node:fs';
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const out = {}; let reqs = 0;
for (const sec of ['books','magazines','videos','forum','events','news','articles']) {
  const seen = new Set();
  for (let p=1;p<=60;p++) {
    const r = await fetch(`https://hadramout.center/${sec}?page=${p}`, {headers:{'user-agent':'Mozilla/5.0 (audit; read-only)'}}); reqs++;
    const html = await r.text();
    const re = new RegExp('href="/' + sec + '/([0-9]+)"', 'g');
    const ids = [...html.matchAll(re)].map(m=>Number(m[1]));
    const before = seen.size; ids.forEach(i=>seen.add(i));
    console.log(sec,p,r.status,ids.length,seen.size);
    await sleep(320);
    if (!ids.length || seen.size===before) break;
  }
  out[sec] = [...seen];
}
writeFileSync('legacy_ids.json', JSON.stringify(out));
console.log('requests',reqs, JSON.stringify(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.length]))));
```

`diff.mjs`:

```js
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
const db = new DatabaseSync('payload.db', { readOnly: true });
const L = JSON.parse(readFileSync('legacy_ids.json','utf8'));
const map = {news:'news',articles:'articles',books:'books',magazines:'magazines',events:'events',forum:'forum_events',videos:'videos'};
let tl=0,td=0;
for (const [sec,tab] of Object.entries(map)) {
  const dbIds = new Set(db.prepare(`select legacy_id from ${tab}`).all().map(r=>Number(r.legacy_id)));
  const missing = L[sec].filter(i=>!dbIds.has(i));
  const extra = [...dbIds].filter(i=>!L[sec].includes(i));
  const st = db.prepare(`select status,source,edited,count(*) c from ${tab} group by 1,2,3`).all().map(r=>`${r.status}/${r.source}/ed${r.edited}:${r.c}`).join(' ');
  const dup = db.prepare(`select legacy_id,count(*) c from ${tab} group by 1 having c>1`).all().length;
  console.log(sec,'legacy',L[sec].length,'db',dbIds.size,'missingInDb',JSON.stringify(missing),'extraInDb',JSON.stringify(extra),'dupLegacyIds',dup,st);
  tl+=L[sec].length; td+=dbIds.size;
}
console.log(tl,td);
// unique index on legacy_id?
console.log(db.prepare("select name,sql from sqlite_master where type='index' and (sql like '%legacy_id%')").all());
```

## 2. Spot checks of content parity (live legacy page vs database)

| Step | Command | Expected | Status |
|---|---|---|---|
| 2.1 Title, date, body-length parity for a sample | `node $TMP/parity.mjs $TMP/payload.db news:226 news:10337 articles:1953 articles:9597 books:246 books:9990 magazines:76 magazines:10304 events:1391 events:8458 forum:5891 forum:7821 videos:9934 videos:10158` (script below, run from repo root) | every line says `title same` and `body text N N same` (dates equal when the legacy page has a date) | VERIFIED (18 of 18 on 2026-10-18) |
| 2.2 Empty-source pages | `curl -s $LEGACY/news/1472 \| wc -c` (and the other 6 ids) | about 22,863 bytes, no `<h1>`: still an empty shell. If a page has become real, migrate it. | VERIFIED |

`parity.mjs`:

```js
// Run from the repository root: node $TMP/parity.mjs $TMP/payload.db news:10337 articles:9597 books:9990
// Fetches each live legacy page, parses it with the project parser and compares title, date and body text length with the DB copy.
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const src = (p) => pathToFileURL(resolve('src', p)).href;
const { parseDetail } = await import(src('importer/legacy.ts'));
const { htmlToText } = await import(src('lib/sanitize.ts'));
const db = new DatabaseSync(process.argv[2], { readOnly: true });
const type = { news: 'news', articles: 'article', books: 'book', magazines: 'magazine', events: 'event', forum: 'forum', videos: 'video' };
const table = { news: 'news', articles: 'articles', books: 'books', magazines: 'magazines', events: 'events', forum: 'forum_events', videos: 'videos' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const arg of process.argv.slice(3)) {
  const [sec, idStr] = arg.split(':'); const id = Number(idStr);
  const html = await (await fetch(`https://hadramout.center/${sec}/${id}`, { headers: { 'user-agent': 'migration-parity' } })).text();
  const { post } = parseDetail(type[sec], id, html);
  const row = db.prepare(`SELECT * FROM ${table[sec]} WHERE legacy_id = ?`).get(id);
  const loc = db.prepare(`SELECT title, body FROM ${table[sec]}_locales WHERE _parent_id = ? AND _locale = 'ar'`).get(row.id);
  const live = post ? htmlToText(post.body).length : -1, mine = htmlToText(loc.body ?? '').length;
  console.log(arg.padEnd(16), 'title', post?.title === loc.title ? 'same' : 'DIFF', '| date', post?.publishedAt ?? '-', '/', String(row.published_at ?? '-').slice(0, 10), '| body text', live, mine, live === mine ? 'same' : 'DIFF');
  await sleep(330);
}
```

## 3. Redirects

| Step | Command | Expected | Status |
|---|---|---|---|
| 3.1 One item | `curl -sI $PROD/news/10337 \| grep -iE '^(HTTP\|location)'` | `301` and `location: .../ar/news/387` | VERIFIED |
| 3.2 Full sweep, all 1,461 ids (about 8 minutes) | save as `$TMP/sweep.mjs`; `node $TMP/sweep.mjs $PROD $TMP/legacy_ids.json $TMP/payload.db` | `{ checked: 1461, bad: 0 }`; exit code 0 | BACKLOG (only a 37-item sample and 4 items of this script were run) |
| 3.3 Chain length | the sweep follows no redirect; for a chain check use `curl -sIL -o /dev/null -w '%{num_redirects} %{url_effective}\n' $PROD/news/10337` | `1 https://.../ar/news/387` | VERIFIED |
| 3.4 Unmigrated ids | `for p in news/1472 news/1538 news/1640 news/10300 articles/2544 articles/3350 articles/4262; do curl -s -o /dev/null -w "$p %{http_code} %{redirect_url}\n" $PROD/$p; sleep 0.3; done` | today `302` to the listing; after T-RED-02 the chosen status (410 or stub) | VERIFIED (302) |
| 3.5 Edge cases | `for p in /news/10337/ '/news/10337?utm_source=x' /News/10337 /news/abc /news/5000 /news /about /contact /magazine; do curl -s -o /dev/null -w "$p %{http_code} %{redirect_url}\n" "$PROD$p"; sleep 0.3; done` | matches [URL_REDIRECT_MAP.md](URL_REDIRECT_MAP.md) section 5.3 | VERIFIED |
| 3.6 Language | `curl -sI -H 'Cookie: hc_lang=en' $PROD/news/10337 \| grep -i location` | `/en/news/387` | VERIFIED |
| 3.7 Target page quality | `curl -s $PROD/ar/news/387 \| grep -oE '<link rel="canonical"[^>]*>\|<meta name="robots"[^>]*>'` | canonical equals the URL, robots `index, follow` | VERIFIED |

`sweep.mjs`:

```js
// node sweep.mjs <base-url> <legacy_ids.json> <db-copy.db>
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
const [base, file, dbFile] = process.argv.slice(2);
const ids = JSON.parse(readFileSync(file, 'utf8'));
const db = new DatabaseSync(dbFile, { readOnly: true });
const table = { news: 'news', articles: 'articles', books: 'books', magazines: 'magazines', events: 'events', forum: 'forum_events', videos: 'videos' };
const known = new Set([1472, 1538, 1640, 10300, 2544, 3350, 4262]); // documented empty legacy pages
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0, bad = 0;
for (const [sec, list] of Object.entries(ids)) {
  for (const id of list) {
    const r = await fetch(`${base}/${sec}/${id}`, { redirect: 'manual', headers: { 'user-agent': 'migration-sweep' } });
    const loc = r.headers.get('location') ?? '';
    const row = db.prepare(`SELECT id FROM ${table[sec]} WHERE legacy_id = ?`).get(id);
    const ok = known.has(id)
      ? !row && r.status === 302
      : row && r.status === 301 && loc.endsWith(`/ar/${sec}/${row.id}`);
    n++;
    if (!ok) { bad++; console.log('FAIL', sec, id, r.status, loc, row?.id ?? '-'); }
    await sleep(300);
  }
}
console.log({ checked: n, bad });
process.exitCode = bad ? 1 : 0;
```

## 4. Media and PDFs

| Step | Command | Expected | Status |
|---|---|---|---|
| 4.1 Every referenced file can be served by the local route | save as `$TMP/media-refs.mjs`; from the repo root `node $TMP/media-refs.mjs $TMP/payload.db` | `{ distinctRefs: 4535, pdfs: 63, rejected: 0 }`. Today `rejected: 7` (2 images with U+FFFD, 5 PDFs with bidi controls). | VERIFIED (7 rejected, MIG-001/002) |
| 4.2 Image sample, legacy vs production | for a path P (percent-encoded): `curl -sI $LEGACY_FILES/media/P` and `curl -s -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' $PROD/legacy-media/P` (with `LEGACY_FILES=https://files.hadramout.center`) | same status 200, same content type, same byte length. 29 sampled on 2026-10-18: 27 identical, 1 production 404 (U+FFFD name), 1 legacy HEAD transient failure. | VERIFIED |
| 4.3 PDF sample | same as 4.2 with `-m 120` for large files; include `2023/10/العدد-9.pdf` (51 MB), a bidi-named PDF, and `2026/10/مجلة-حضرموت-العدد-41.pdf` | 200 `application/pdf`, byte length equal. Today 6 of 10 sampled return 404 on `/legacy-media`; the pages link to the legacy host instead. | VERIFIED (fails, MIG-001) |
| 4.4 PDF links point at our origin | `curl -s $PROD/ar/magazines/40 \| grep -o 'href="[^"]*\.pdf"'` | `/legacy-media/...` after T-MIG-01. Today `https://files.hadramout.center/...` | VERIFIED (fails) |
| 4.5 Cache completeness on the server | `docker compose exec app sh -c 'find /data/legacy-media -type f \| wc -l'` and compare with 4,535 (4,472 images + 63 PDFs) | at least 4,535 files, or every missing file is explained | BLOCKED (needs server access; NOT VERIFIED) |
| 4.6 Legacy host independence | block `files.hadramout.center` in `/etc/hosts` on a test machine, open 10 migrated pages and 5 magazine PDFs | all images and PDFs still load | BACKLOG (cannot pass until T-MIG-01 and T-MIG-03) |
| 4.7 Headers | `curl -sI $PROD/legacy-media/2024/01/5-83.jpg` | `200`, `image/jpeg`, `cache-control: public, max-age=31536000, immutable`, `x-content-type-options: nosniff` | VERIFIED |

`media-refs.mjs`:

```js
// Run from the repository root:  node $TMP/media-refs.mjs $TMP/payload.db
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const { resolveLegacyPath } = await import(pathToFileURL(resolve('src/lib/legacy-media.ts')).href);
const db = new DatabaseSync(process.argv[2], { readOnly: true });
const tables = ['news', 'articles', 'books', 'magazines', 'events', 'forum_events', 'videos', 'pages'];
const re = /https?:\/\/files\.hadramout\.center\/media\/[^"'\s<>)]+/gi;
const refs = new Set();
const add = (t) => { for (const m of String(t ?? '').matchAll(re)) refs.add(m[0].replace(/[?#].*$/, '')); };
for (const t of tables) {
  for (const col of ['cover_url', 'pdf']) {
    try { for (const r of db.prepare(`SELECT ${col} AS v FROM ${t} WHERE ${col} IS NOT NULL`).all()) add(r.v); } catch {}
  }
  try { for (const r of db.prepare(`SELECT body AS v FROM ${t}_locales`).all()) add(r.v); } catch {}
}
const rejected = [...refs].filter((u) => {
  try { return !resolveLegacyPath(u.replace(/^.*\/media\//, '').split('/')); } catch { return true; }
});
const pdfs = [...refs].filter((u) => /\.pdf$/i.test(u)).length;
console.log({ distinctRefs: refs.size, pdfs, rejected: rejected.length });
for (const u of rejected) console.log('  rejected:', decodeURIComponent(u));
```

## 5. Arabic text integrity (database copy)

Run `node $TMP/integ-sql.mjs $TMP/payload.db` (script below). Result on the DB copy dated 2026-10-16 (migrations `20261015_*` NOT applied in that copy and in production):

| Check | Expected after launch | DB copy 2026-10-18 | Status |
|---|---|---|---|
| 5.1 U+FFFD | 0 or only inside file names that resolve | 1 (news 331, image name) | VERIFIED (fails until MIG-002) |
| 5.2 Mojibake `Ã Ø§ Ù` | 0 | 0 | VERIFIED |
| 5.3 Titles with `*` | 0 | 14 | VERIFIED (migration `20261015_223000` would fix 12 cleanly) |
| 5.4 Doubled preposition `عن بعنوان` | 0 | 2 | VERIFIED |
| 5.5 Empty bodies | 2 (events 6726 and 8456 are empty on legacy too) | 2 | VERIFIED |
| 5.6 Titles with `()` or `[]` | 0 | 0 now; **2 after** migration `20261015_223000` (articles 254, 540) | BACKLOG (re-run after the migration on a scratch copy) |
| 5.7 Bidi controls in titles | informational | 4 | VERIFIED |
| 5.8 Double-encoded entities | 0 | 0 | VERIFIED |
| 5.9 Bodies linking to the legacy host | 0 after T-MIG-10 | 801 | VERIFIED |

Also run these ad-hoc checks (all on the copy):

```sql
-- truncation heuristic: very short bodies per type (compare the few hits with the legacy page by hand)
SELECT 'news' t, count(*) FROM news_locales WHERE _locale='ar' AND length(body) < 80
UNION ALL SELECT 'articles', count(*) FROM articles_locales WHERE _locale='ar' AND length(body) < 80;
-- migration state of the copy (which data migrations ran)
SELECT name, batch FROM payload_migrations ORDER BY id;
-- every document is still a legacy import
SELECT source, edited, status, count(*) FROM news GROUP BY 1,2,3;
```

To test the editorial migration safely, copy the DB again to `$TMP/sim.db` and run the three `UPDATE` statements of `src/migrations/20261015_223000_editorial_fixes.ts` against that copy only, then re-run 5.3, 5.4 and 5.6 (expected: 0, 0, 0 once T-MIG-05 is done).

`integ-sql.mjs`:

```js
// node integ-sql.mjs <db-copy.db>   -> prints one number per check
import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync(process.argv[2], { readOnly: true });
const T = ['news', 'articles', 'books', 'magazines', 'events', 'forum_events', 'videos'];
const sum = (where, cols = ['title', 'excerpt', 'body']) =>
  T.reduce((n, t) => n + db.prepare(`SELECT count(*) c FROM ${t}_locales WHERE _locale='ar' AND (${cols.map((c) => where.replaceAll('{c}', c)).join(' OR ')})`).get().c, 0);
const checks = {
  '5.1 U+FFFD in any field (expect 0 after fix; DB copy 1)': sum("{c} LIKE '%' || char(65533) || '%'"),
  '5.2 mojibake Ã/Ø/Ù (expect 0)': sum("{c} LIKE '%Ã%' OR {c} LIKE '%Ø§%' OR {c} LIKE '%Ù%'"),
  '5.3 titles with * (DB copy 14; expect 0 after fix)': sum("{c} LIKE '%*%'", ['title']),
  '5.4 titles with doubled preposition (DB copy 2; expect 0)': sum("{c} LIKE '%عن بعنوان%'", ['title']),
  '5.5 empty body (DB copy 2; both empty on legacy)': sum("{c} IS NULL OR trim({c}) = ''", ['body']),
  '5.6 titles with empty () or [] (expect 0)': sum("{c} LIKE '%()%' OR {c} LIKE '%[]%'", ['title']),
  '5.7 bidi controls U+200E/F, U+2066-2069 in titles (DB copy 4)': sum("{c} GLOB '*[' || char(8206) || char(8207) || char(8294) || '-' || char(8297) || ']*'", ['title']),
  '5.8 stored double-encoded entities (expect 0)': sum("{c} LIKE '%&amp;amp;%' OR {c} LIKE '%&amp;quot;%' OR {c} LIKE '%&amp;#%'", ['title', 'excerpt', 'body']),
  '5.9 bodies linking to the legacy host (DB copy 801)': sum("{c} LIKE '%//hadramout.center/%'", ['body']),
};
for (const [k, v] of Object.entries(checks)) console.log(String(v).padStart(5), ' ', k);
```

## 6. Dates and attribution

| Step | Command / query | Expected | Status |
|---|---|---|---|
| 6.1 Precision distribution | `SELECT date_precision, count(*) FROM articles GROUP BY 1;` (repeat per table) | articles 894 month + 15 estimated; news 387 day; books 48 year + 4 estimated; magazines 40 month; events 53 day; forum 5 day + 6 estimated; videos 2 estimated | VERIFIED (snapshot counts via `content/legacy-snapshot.json.gz`; the DB-side query was not run) |
| 6.2 Estimated dates are never shown | search the rendered HTML of an estimated item (forum 1, video 1) for a date string | no date shown; JSON-LD has no `datePublished` | BACKLOG |
| 6.3 Authors present | `SELECT count(*) FROM articles WHERE id NOT IN (SELECT parent_id FROM articles_rels WHERE authors_id IS NOT NULL);` | 0 | VERIFIED |
| 6.4 Books without an author are empty at source | `SELECT legacy_id FROM books WHERE id NOT IN (SELECT parent_id FROM books_rels WHERE authors_id IS NOT NULL);` then run step 2.1 style parity on 3 of them | 7 rows; legacy pages also lack an author (4 of 4 checked: 415, 9120, 9122, 9124) | VERIFIED |
| 6.5 Articles without category are empty at source | `SELECT count(*) FROM articles WHERE category_id IS NULL;` (142) and check 3 on the legacy site | legacy page has no category (4 of 4 checked) | VERIFIED |
| 6.6 Date provenance | n/a: `date_source` is not stored (MIG-013) | decision needed | BLOCKED |

## 7. Backup, restore and rollback of migrated data

| Step | Command | Expected | Status |
|---|---|---|---|
| 7.1 Backup contains everything | on the server `./scripts/backup.sh drill` then `tar tzf <archive> \| awk -F/ '{print $1}' \| sort -u` | lists `_bk`, `media`, `i18n` **and `legacy-media`** (the last one is missing today, MIG-003) | VERIFIED (fails) |
| 7.2 Restore drill | on a scratch VPS or Docker host: `./scripts/restore.sh <archive>` | site starts; `/ar/news/387` 200; 29 sampled images load with `files.hadramout.center` blocked | BACKLOG |
| 7.3 Rebuild-from-snapshot drill | fresh volume: `payload migrate`, `db:seed`, `import:images` (as `deploy.sh` first install) then step 5 | titles with `*` = 0, doubled preposition = 0, 8 curated topics present (today they are not, MIG-004) | BACKLOG |
| 7.4 Snapshot integrity | `git ls-files -s content/legacy-snapshot.json.gz` and re-read with step 1.1 | present, 1,454 posts | VERIFIED |
| 7.5 Off-server copy | copy the newest archive and `legacy-media` to storage outside the VPS | exists, restorable | BACKLOG (TRACKER item 6) |

## 8. Domain cutover (blocked on the domain decision)

| Step | Check | Expected | Status |
|---|---|---|---|
| 8.1 `SITE_URL` | server `.env` has `SITE_URL=https://hadramout.center` (name only; never print values) | canonical, sitemap and redirect `Location` use the final host | BLOCKED |
| 8.2 nginx | `deploy/nginx/hadramout-center.conf` has `server_name` for `hadramout.center` and `www.hadramout.center` plus a certificate | `curl -sI https://www.hadramout.center` returns 301 to the apex | BLOCKED |
| 8.3 Item redirect on the final host | `curl -sI https://hadramout.center/news/10337` | `301` to `https://hadramout.center/ar/news/387` | BLOCKED |
| 8.4 Files host decision | decide who keeps `files.hadramout.center` alive and until when (D2) | written decision; all images/PDFs mirrored first | BLOCKED |
| 8.5 Re-run steps 3.2, 4.1 and 5 against the final host | | all expected values met | BLOCKED |
| 8.6 Search engines | submit `https://hadramout.center/sitemap.xml`; use the change-of-address tool only if the host name changes | accepted | BLOCKED |

## 9. Post-launch watch (first 30 days)

| Step | Check | Expected | Status |
|---|---|---|---|
| 9.1 Redirect health | repeat step 3.2 weekly | `bad: 0` | BACKLOG |
| 9.2 404 log | review the top 404 paths in Cloudflare or the app log | no legacy-pattern URL (`/{section}/{digits}`) appears | BACKLOG |
| 9.3 Search console | coverage and "page with redirect" reports | migrated URLs move to the new URLs; no spike of soft 404 | BACKLOG |
| 9.4 Do not retire the legacy host before | steps 3.2, 4.6, 7.1, 7.2 all pass | | BACKLOG |

## 10. Sign-off

| Gate | Owner | Status |
|---|---|---|
| Counts reconcile (step 1) | Novixa | VERIFIED |
| Redirect sweep passes (3.2) | Novixa | BACKLOG |
| Media independent of the legacy host (4.1, 4.4, 4.6) | Novixa | BACKLOG |
| Text integrity (5) | Novixa + Center editors | BACKLOG |
| Backup/restore drill (7.1, 7.2) | Novixa | BACKLOG |
| Cutover prerequisites (8) | Novixa + Center | BLOCKED |

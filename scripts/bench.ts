/** Times the main list/detail queries against the configured database:  npm run payload -- run scripts/bench.ts */
import { getPayload } from 'payload';
import config from '../src/payload.config.ts';
import { listDocs, countByType, yearsFor, getDoc } from '../src/lib/data.ts';

const payload = await getPayload({ config });
const time = async (label: string, fn: () => Promise<unknown>) => {
  const runs: number[] = [];
  for (let i = 0; i < 4; i++) {
    const t = performance.now();
    await fn();
    runs.push(Math.round(performance.now() - t));
  }
  console.log(label.padEnd(28), runs.join(' ms, '), 'ms');
};
await time('articles page 1', () => listDocs({ type: 'article', lang: 'ar', limit: 12 }));
await time('articles year filter', () => listDocs({ type: 'article', lang: 'ar', limit: 12, year: 2023 }));
await time('news page 1', () => listDocs({ type: 'news', lang: 'ar', limit: 12 }));
await time('countByType', () => countByType());
await time('yearsFor(article)', () => yearsFor('article'));
await time('getDoc article 909', () => getDoc('article', 909, 'ar'));
await time('payload.count articles', () => payload.count({ collection: 'articles' }));
process.exit(0);

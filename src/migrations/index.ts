import * as migration_20261014_215254_initial from './20261014_215254_initial';
import * as migration_20261014_220000_locales_indexes from './20261014_220000_locales_indexes';
import * as migration_20261015_222148_taxonomy_reviews_timeline from './20261015_222148_taxonomy_reviews_timeline';
import * as migration_20261015_222500_curate_topics from './20261015_222500_curate_topics';
import * as migration_20261015_223000_editorial_fixes from './20261015_223000_editorial_fixes';

export const migrations = [
  {
    up: migration_20261014_215254_initial.up,
    down: migration_20261014_215254_initial.down,
    name: '20261014_215254_initial',
  },
  {
    up: migration_20261014_220000_locales_indexes.up,
    down: migration_20261014_220000_locales_indexes.down,
    name: '20261014_220000_locales_indexes',
  },
  {
    up: migration_20261015_222148_taxonomy_reviews_timeline.up,
    down: migration_20261015_222148_taxonomy_reviews_timeline.down,
    name: '20261015_222148_taxonomy_reviews_timeline',
  },
  {
    up: migration_20261015_222500_curate_topics.up,
    down: migration_20261015_222500_curate_topics.down,
    name: '20261015_222500_curate_topics',
  },
  {
    up: migration_20261015_223000_editorial_fixes.up,
    down: migration_20261015_223000_editorial_fixes.down,
    name: '20261015_223000_editorial_fixes',
  },
];

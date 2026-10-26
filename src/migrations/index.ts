import * as migration_20261014_215254_initial from './20261014_215254_initial';
import * as migration_20261014_220000_locales_indexes from './20261014_220000_locales_indexes';
import * as migration_20261015_222148_taxonomy_reviews_timeline from './20261015_222148_taxonomy_reviews_timeline';
import * as migration_20261015_222500_curate_topics from './20261015_222500_curate_topics';
import * as migration_20261015_223000_editorial_fixes from './20261015_223000_editorial_fixes';
import * as migration_20261015_224000_accessibility_statement from './20261015_224000_accessibility_statement';
import * as migration_20261020_164115_locales_parent_id_indexes from './20261020_164115_locales_parent_id_indexes';
import * as migration_20261027_120000_tidy_titles from './20261027_120000_tidy_titles';

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
  {
    up: migration_20261015_224000_accessibility_statement.up,
    down: migration_20261015_224000_accessibility_statement.down,
    name: '20261015_224000_accessibility_statement',
  },
  {
    up: migration_20261020_164115_locales_parent_id_indexes.up,
    down: migration_20261020_164115_locales_parent_id_indexes.down,
    name: '20261020_164115_locales_parent_id_indexes'
  },
  {
    up: migration_20261027_120000_tidy_titles.up,
    down: migration_20261027_120000_tidy_titles.down,
    name: '20261027_120000_tidy_titles',
  },
];

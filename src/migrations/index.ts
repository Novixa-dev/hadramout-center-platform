import * as migration_20261014_215254_initial from './20261014_215254_initial';
import * as migration_20261014_220000_locales_indexes from './20261014_220000_locales_indexes';
import * as migration_20261015_222148_taxonomy_reviews_timeline from './20261015_222148_taxonomy_reviews_timeline';
import * as migration_20261015_222500_curate_topics from './20261015_222500_curate_topics';
import * as migration_20261015_223000_editorial_fixes from './20261015_223000_editorial_fixes';
import * as migration_20261015_224000_accessibility_statement from './20261015_224000_accessibility_statement';
import * as migration_20261020_164115_locales_parent_id_indexes from './20261020_164115_locales_parent_id_indexes';
import * as migration_20261026_234603_article_lead_image from './20261026_234603_article_lead_image';
import * as migration_20261027_120000_tidy_titles from './20261027_120000_tidy_titles';
import * as migration_20261031_011621_add_page_blocks from './20261031_011621_add_page_blocks';
import * as migration_20261031_014604_add_event_tracks_and_papers from './20261031_014604_add_event_tracks_and_papers';
import * as migration_20261031_020508_add_audio_and_announcements from './20261031_020508_add_audio_and_announcements';
import * as migration_20261031_024246_add_partners_and_testimonials from './20261031_024246_add_partners_and_testimonials';
import * as migration_20261031_025843_add_author_honorific from './20261031_025843_add_author_honorific';

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
    name: '20261020_164115_locales_parent_id_indexes',
  },
  {
    up: migration_20261026_234603_article_lead_image.up,
    down: migration_20261026_234603_article_lead_image.down,
    name: '20261026_234603_article_lead_image',
  },
  {
    up: migration_20261027_120000_tidy_titles.up,
    down: migration_20261027_120000_tidy_titles.down,
    name: '20261027_120000_tidy_titles',
  },
  {
    up: migration_20261031_011621_add_page_blocks.up,
    down: migration_20261031_011621_add_page_blocks.down,
    name: '20261031_011621_add_page_blocks',
  },
  {
    up: migration_20261031_014604_add_event_tracks_and_papers.up,
    down: migration_20261031_014604_add_event_tracks_and_papers.down,
    name: '20261031_014604_add_event_tracks_and_papers',
  },
  {
    up: migration_20261031_020508_add_audio_and_announcements.up,
    down: migration_20261031_020508_add_audio_and_announcements.down,
    name: '20261031_020508_add_audio_and_announcements',
  },
  {
    up: migration_20261031_024246_add_partners_and_testimonials.up,
    down: migration_20261031_024246_add_partners_and_testimonials.down,
    name: '20261031_024246_add_partners_and_testimonials',
  },
  {
    up: migration_20261031_025843_add_author_honorific.up,
    down: migration_20261031_025843_add_author_honorific.down,
    name: '20261031_025843_add_author_honorific'
  },
];

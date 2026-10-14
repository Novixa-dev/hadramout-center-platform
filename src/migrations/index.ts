import * as migration_20261014_215254_initial from './20261014_215254_initial';
import * as migration_20261014_220000_locales_indexes from './20261014_220000_locales_indexes';

export const migrations = [
  {
    up: migration_20261014_215254_initial.up,
    down: migration_20261014_215254_initial.down,
    name: '20261014_215254_initial'
  },
  {
    up: migration_20261014_220000_locales_indexes.up,
    down: migration_20261014_220000_locales_indexes.down,
    name: '20261014_220000_locales_indexes'
  },
];

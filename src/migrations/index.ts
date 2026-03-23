import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260323_205226 from './20260323_205226';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260323_205226.up,
    down: migration_20260323_205226.down,
    name: '20260323_205226'
  },
];

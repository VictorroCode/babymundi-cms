import * as migration_20260413_161321 from './20260413_161321';
import * as migration_20260413_161600 from './20260413_161600';
import * as migration_20260421_153812 from './20260421_153812';
import * as migration_20260429_194617 from './20260429_194617';

export const migrations = [
  {
    up: migration_20260413_161321.up,
    down: migration_20260413_161321.down,
    name: '20260413_161321',
  },
  {
    up: migration_20260413_161600.up,
    down: migration_20260413_161600.down,
    name: '20260413_161600',
  },
  {
    up: migration_20260421_153812.up,
    down: migration_20260421_153812.down,
    name: '20260421_153812',
  },
  {
    up: migration_20260429_194617.up,
    down: migration_20260429_194617.down,
    name: '20260429_194617'
  },
];
